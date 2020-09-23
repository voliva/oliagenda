import { bind } from "@react-rxjs/core";
import {
  addDays,
  differenceInCalendarDays,
  differenceInSeconds,
  set,
  startOfWeek,
} from "date-fns";
import { interval } from "rxjs";
import { startWithTimeout } from "rxjs-etc/operators";
import {
  defaultIfEmpty,
  distinctUntilChanged,
  map,
  skipWhile,
  startWith,
  takeWhile,
} from "rxjs/operators";
import { activeDate$ } from "../../calendar";
import { END_HOUR, START_HOUR } from "./constants";

const currentTime$ = interval(30 * 1000).pipe(
  startWith(0),
  map(() => new Date())
);

export const [useCurrentTimePos] = bind((date: Date) =>
  currentTime$.pipe(
    map((now) => {
      const dayDiff = differenceInCalendarDays(now, date);
      if (dayDiff < 0) {
        return -1;
      } else if (dayDiff > 0) {
        return 2;
      }
      return getTimePosition(now);
    }),
    // Only keep stream alive for those that will show a bar in the future
    takeWhile((v) => v <= 1),
    skipWhile((v) => v < 0),
    startWithTimeout(null, 0),
    defaultIfEmpty(null as number | null)
    /** Alternatively, just map to null if <0 or >1, but on every tick it would
     * emit a new `null`, solvable with `distinctUntilChanged` but nvm :)
     */
  )
);

export const getTimePosition = (time: Date) => {
  const startTime = set(time, {
    hours: START_HOUR,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const endTime = set(time, {
    hours: END_HOUR,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const totalSeconds = differenceInSeconds(endTime, startTime);
  const currentSeconds = differenceInSeconds(time, startTime);
  const result = currentSeconds / totalSeconds;
  return result;
};

export const [useActiveDays, activeDays$] = bind(
  activeDate$.pipe(
    map(({ start }) => startOfWeek(start)),
    distinctUntilChanged(),
    map((start) => new Array(7).fill(0).map((_, i) => addDays(start, i)))
  )
);
