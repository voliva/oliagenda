import { bind, shareLatest } from "@react-rxjs/core";
import { endOfWeek, startOfWeek } from "date-fns";
import { keyBy } from "lodash";
import {
  combineLatest,
  concat,
  EMPTY,
  interval,
  merge,
  Observable,
  of,
  Subject,
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
import { CalendarEvent, eventEquals, invokeGapiService } from "./services";

export const [useCalendarList, calendarList$] = bind(
  invokeGapiService((service) => service.listCalendars()).pipe(
    map((list) => list.items)
  )
);

const eventUpserts = new Subject<CalendarEvent>();
export const upsertEvent = (event: CalendarEvent) => eventUpserts.next(event);

const [, eventsFromCalendar$] = bind((calendarId: string) =>
  merge(
    of(0),
    interval(60 * 1000),
    eventUpserts.pipe(filter((event) => event.calendarId === calendarId))
  ).pipe(
    switchMapTo(
      invokeGapiService((service) =>
        service.listEvents({
          calendarId,
          timeMin: startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
          timeMax: endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
          showDeleted: false,
          orderBy: "startTime",
          singleEvents: true,
        })
      )
    )
  )
);

const loadedEvent$ = calendarList$.pipe(
  switchMap((list) =>
    combineLatest(
      list.map((calendar) => eventsFromCalendar$(calendar.id))
    ).pipe(
      map((calendarEvents) =>
        calendarEvents.reduce((acc, events) => [...acc, ...events])
      )
    )
  )
);

export const event$ = loadedEvent$.pipe(
  switchMap((loadedEvents) =>
    eventUpserts.pipe(
      scan((events, event) => [...events, event], loadedEvents),
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
