import { bind, shareLatest } from "@react-rxjs/core";
import { createListener, mergeWithKey } from "@react-rxjs/utils";
import { keyBy } from "lodash";
import {
  combineLatest,
  concat,
  EMPTY,
  interval,
  merge,
  Observable,
  of,
} from "rxjs";
import { addDebugTag } from "rxjs-traces";
import {
  filter,
  map,
  pairwise,
  scan,
  share,
  startWith,
  switchMap,
  switchMapTo,
  take,
  takeUntil,
} from "rxjs/operators";
import { isSignedIn$ } from "./auth/auth";
import { endOfWeek, startOfWeek } from "./lib";
import { CalendarEvent, eventEquals, invokeGapiService } from "./services";

export const [calendarToggles, toggleCalendar] = createListener<string>();
export const [useCalendarList, calendarList$] = bind(
  invokeGapiService((service) => service.listCalendars()).pipe(
    map((list) =>
      list.items.map(({ id, summary }) => ({
        id,
        name: summary,
        isActive: true,
      }))
    ),
    switchMap((list) =>
      calendarToggles.pipe(
        scan((acc, id) => {
          const target = acc.find((c) => c.id === id);
          if (target) {
            target.isActive = !target.isActive;
          }
          return [...acc];
        }, list),
        startWith(list)
      )
    )
  )
);

export const [eventUpserts, upsertEvent] = createListener<CalendarEvent>();
export const [eventRemoves, removeEvent] = createListener<CalendarEvent>();
export const [
  dateChanges,
  changeDateRange,
] = createListener((start: Date, end: Date) => ({ start, end }));

export const activeDate$ = dateChanges.pipe(
  startWith({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  }),
  addDebugTag("activeDate$"),
  shareLatest()
);
activeDate$.subscribe();

const [, eventsFromCalendar$] = bind(
  (calendarId: string, activeDate: { start: Date; end: Date }) =>
    merge(
      of(0),
      interval(60 * 1000),
      eventUpserts.pipe(filter((event) => event.calendarId === calendarId)),
      eventRemoves.pipe(filter((event) => event.calendarId === calendarId))
    ).pipe(
      switchMapTo(
        invokeGapiService((service) =>
          service.listEvents({
            calendarId,
            timeMin: activeDate.start.toISOString(),
            timeMax: activeDate.end.toISOString(),
            showDeleted: false,
            orderBy: "startTime",
            singleEvents: true,
          })
        )
      )
    )
);

const loadedEvent$ = combineLatest([
  calendarList$.pipe(map((list) => list.filter(({ isActive }) => isActive))),
  activeDate$,
]).pipe(
  switchMap(([list, activeDate]) =>
    combineLatest(
      list.length === 0
        ? [of([])]
        : list.map((calendar) => eventsFromCalendar$(calendar.id, activeDate))
    ).pipe(
      map((calendarEvents) =>
        calendarEvents.reduce((acc, events) => [...acc, ...events])
      )
    )
  )
);

export const event$ = loadedEvent$.pipe(
  switchMap((loadedEvents) =>
    mergeWithKey({
      eventUpserts,
      eventDeletes: eventRemoves,
    }).pipe(
      scan((events, change) => {
        switch (change.type) {
          case "eventDeletes":
            return events.filter((evt) => evt.id !== change.payload.id);
          case "eventUpserts":
            const idx = events.findIndex((evt) => evt.id === change.payload.id);
            if (idx >= 0) {
              const ret = [...events];
              ret[idx] = change.payload;
              return ret;
            }
            return [...events, change.payload];
        }
      }, loadedEvents),
      startWith(loadedEvents)
    )
  ),
  addDebugTag("event$"),
  shareLatest()
);

export type EventChange =
  | {
      action: "new" | "removed";
      event: CalendarEvent;
    }
  | {
      action: "updated";
      event: CalendarEvent;
      previousEvent: CalendarEvent;
    };
export const eventChanges$ = event$.pipe(
  startWith([] as CalendarEvent[]),
  pairwise(),
  switchMap(([previous, newValue]) => {
    const keyedPrevious = keyBy(previous, "id");
    const keyedNew = keyBy(newValue, "id");

    const newEvents: CalendarEvent[] = [];
    const updatedEvents: [CalendarEvent, CalendarEvent][] = [];
    const removedEvents: CalendarEvent[] = [];

    newValue.forEach((event) => {
      if (!(event.id in keyedPrevious)) {
        newEvents.push(event);
      } else if (!eventEquals(event, keyedPrevious[event.id])) {
        updatedEvents.push([event, keyedPrevious[event.id]]);
      }
    });
    previous.forEach((event) => {
      if (!(event.id in keyedNew)) {
        removedEvents.push(event);
      }
    });

    return concat<EventChange>(
      newEvents.map((event) => ({ action: "new", event })),
      updatedEvents.map(([event, previousEvent]) => ({
        action: "updated",
        event,
        previousEvent,
      })),
      removedEvents.map((event) => ({ action: "removed", event }))
    );
  }),
  addDebugTag("eventChanges$"),
  share()
);

isSignedIn$
  .pipe(switchMap((isSignedIn) => (isSignedIn ? EMPTY : eventChanges$)))
  .subscribe();

export const coldEventChange$ = merge(
  eventChanges$,
  event$.pipe(
    take(1),
    takeUntil(eventChanges$),
    switchMap((events) =>
      events.map<EventChange>((event) => ({
        action: "new" as const,
        event,
      }))
    )
  )
).pipe(addDebugTag("coldEventChange$"), share()); // Again w/o share() tree looks like hell -.-"

export const accumulateEvents = () => (event$: Observable<EventChange>) =>
  event$.pipe(
    scan((events, { action, event }) => {
      switch (action) {
        case "new":
        case "updated":
          return {
            ...events,
            [event.id]: event,
          };
        case "removed":
          const { [event.id]: _, ...result } = events;
          return result;
      }
    }, {} as Record<string, CalendarEvent>),
    map((result) => Object.values(result))
  );
