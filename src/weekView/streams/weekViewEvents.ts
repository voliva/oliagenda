import { bind, shareLatest } from "@react-rxjs/core";
import { collect, split } from "@react-rxjs/utils";
import { addDays, isSameDay, startOfDay } from "date-fns";
import { EMPTY, of } from "rxjs";
import { startWithTimeout } from "rxjs-etc/dist/esm/operators";
import { addDebugTag } from "rxjs-traces";
import { concatMap, exhaustMap, mergeMap } from "rxjs/operators";
import { accumulateEvents, coldEventChange$ } from "../../calendar";
import { CalendarEvent } from "../../services";
import { categorizeEvent } from "./util";

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
