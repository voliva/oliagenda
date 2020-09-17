import { bind, shareLatest } from "@react-rxjs/core";
import { collect, split } from "@react-rxjs/utils";
import {
  addDays,
  differenceInDays,
  endOfWeek,
  getDay,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { isEqual, keyBy } from "lodash";
import { combineLatest, concat, EMPTY, Observable, of } from "rxjs";
import { startWithTimeout } from "rxjs-etc/dist/esm/operators";
import { addDebugTag } from "rxjs-traces";
import {
  concatMap,
  delay,
  exhaustMap,
  map,
  mergeMap,
  pairwise,
  repeatWhen,
  scan,
  share,
  startWith,
  switchMap,
  tap,
} from "rxjs/operators";
import { invokeGapiService } from "./gapi";
import { CalendarEvent, mapEventFromGoogle } from "./mappers";

export const [useCalendarList, calendarList$] = bind(
  invokeGapiService((service) => service.listCalendars()).pipe(
    map((list) => list.items)
  )
);

const [, eventsFromCalendar$] = bind((calendarId: string) =>
  invokeGapiService((service) =>
    service.listEvents({
      calendarId,
      timeMin: startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
      timeMax: endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
      showDeleted: false,
      orderBy: "startTime",
      singleEvents: true,
    })
  ).pipe(
    repeatWhen((notifier) => notifier.pipe(delay(60 * 1000))),
    map((events) => events.items.map(mapEventFromGoogle))
  )
);

const [, event$] = bind(
  calendarList$.pipe(
    switchMap((list) =>
      combineLatest(
        list.map((calendar) => eventsFromCalendar$(calendar.id))
      ).pipe(
        map((calendarEvents) =>
          calendarEvents.reduce((acc, events) => [...acc, ...events])
        )
      )
    )
  )
);

const eventChanges$ = event$.pipe(
  startWith([] as CalendarEvent[]),
  pairwise(),
  switchMap(([previous, newValue]) => {
    const keyedPrevious = keyBy(previous, "id");
    const keyedNew = keyBy(newValue, "id");

    const newEvents: CalendarEvent[] = [];
    const removedEvents: CalendarEvent[] = [];

    newValue.forEach((event) => {
      if (!(event.id in keyedPrevious)) {
        newEvents.push(event);
      }
    });
    previous.forEach((event) => {
      if (!(event.id in keyedNew)) {
        removedEvents.push(event);
      }
    });

    return concat<{
      action: "new" | "removed";
      event: CalendarEvent;
    }>(
      newEvents.map((event) => ({ action: "new", event })),
      removedEvents.map((event) => ({ action: "removed", event }))
    );
  }),
  addDebugTag("eventChanges$"),
  share()
);

const accumulateEvents = () => (
  event$: Observable<{
    action: "new" | "removed";
    event: CalendarEvent;
  }>
) =>
  event$.pipe(
    scan((events, { action, event }) => {
      switch (action) {
        case "new":
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

// Split into weekly-daily-time
const categorizedEvent$ = eventChanges$.pipe(
  split(({ event }) => categorizeEvent(event))
);

const getDayKey = (date: Date) => startOfDay(date).toISOString();
const timeEventsByDay$ = categorizedEvent$.pipe(
  mergeMap((group$) => (group$.key === "time" ? group$ : EMPTY)),
  split(
    ({ event }) => {
      return getDayKey(event.range.start);
    },
    (group$) => group$.pipe(accumulateEvents())
  ),
  collect(),
  addDebugTag("timeEventsByDay$"),
  shareLatest()
);

export const [useEventsByDay] = bind((date: Date) =>
  timeEventsByDay$.pipe(
    exhaustMap(
      (eventsByDay) =>
        eventsByDay.get(getDayKey(date)) || of([] as CalendarEvent[])
    )
  )
);

const dailyEvents$ = categorizedEvent$.pipe(
  mergeMap((group$) => {
    if (group$.key === "day") {
      return group$;
    }
    if (group$.key === "multi") {
      return group$.pipe(
        // Replicate one per day
        concatMap(({ event, action }) => {
          const result: CalendarEvent[] = [];
          for (
            let date = startOfDay(event.range.start);
            !isSameDay(date, event.range.end);
            date = addDays(date, 1)
          ) {
            result.push({
              ...event,
              range: {
                start: date,
                end: addDays(date, 1),
              },
            });
          }
          return result.map((evt) => ({
            event: evt,
            action,
          }));
        })
      );
    }
    return EMPTY;
  }),
  split(
    ({ event }) => {
      return getDayKey(event.range.start);
    },
    (group$) => group$.pipe(accumulateEvents())
  ),
  collect(),
  addDebugTag("dailyEvents$"),
  shareLatest() // TODO Removing this share latest messes up the rxjs-traces tree
);

export const [useDailyEvents] = bind((date: Date) =>
  dailyEvents$.pipe(
    exhaustMap(
      (dailyEvents) =>
        dailyEvents.get(getDayKey(date)) || of([] as CalendarEvent[])
    )
  )
);

export const [useWeeklyEvents] = bind(
  categorizedEvent$.pipe(
    mergeMap((group$) => (group$.key === "week" ? group$ : EMPTY)),
    accumulateEvents(),
    startWithTimeout([] as CalendarEvent[], 0)
  )
);

function categorizeEvent(event: CalendarEvent) {
  if (isSameDay(event.range.start, event.range.end)) {
    return "time" as const;
  }

  if (isEqual(addDays(event.range.start, 1), event.range.end)) {
    return "day" as const;
  }

  const diff = differenceInDays(event.range.end, event.range.start);
  if (getDay(event.range.start) === 1 && diff === 7) {
    return "week" as const;
  }
  return "multi" as const;
}
