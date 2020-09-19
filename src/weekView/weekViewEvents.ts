import { bind, shareLatest } from "@react-rxjs/core";
import { collect, split } from "@react-rxjs/utils";
import {
  addDays,
  differenceInDays,
  getDay,
  isSameDay,
  startOfDay,
} from "date-fns";
import { isEqual } from "lodash";
import { EMPTY, Observable, of } from "rxjs";
import { startWithTimeout } from "rxjs-etc/dist/esm/operators";
import { addDebugTag } from "rxjs-traces";
import { concatMap, exhaustMap, map, mergeMap, scan } from "rxjs/operators";
import { coldEventChange$ } from "../calendar";
import { CalendarEvent } from "../services";

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
const categorizedEvent$ = coldEventChange$.pipe(
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
