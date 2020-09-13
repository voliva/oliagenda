import css from "@emotion/css";
import { bind } from "@react-rxjs/core";
import {
  addDays,
  differenceInSeconds,
  format,
  set,
  startOfWeek,
} from "date-fns";
import React, { FC, useState } from "react";
import { interval, of } from "rxjs";
import { concatIfEmpty, startWithTimeout } from "rxjs-etc/operators";
import { map, skipWhile, startWith, takeWhile } from "rxjs/operators";
import { useDailyEvents, useEventsByDay, useWeeklyEvents } from "./services";
import { useResize } from "./useResize";

export const WeekView: FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
      `}
      className={className}
    >
      <Headers />

      <Events />

      <DailyTasks />
      <WeekTasks />
    </div>
  );
};

const HOUR_LEGEND_WIDTH = "5em";
const TODAY = new Date();
const START_DATE = startOfWeek(TODAY, { weekStartsOn: 1 });
const DAYS = new Array(7).fill(0).map((_, i) => addDays(START_DATE, i));
const START_HOUR = 8;
const END_HOUR = 20;
const hours = new Array(END_HOUR - START_HOUR)
  .fill(0)
  .map((_, i) => START_HOUR + i);
const currentTime$ = interval(30 * 1000).pipe(
  startWith(0),
  map(() => new Date())
);

const Headers = () => {
  return (
    <div
      css={css`
        flex: 0 0 auto;
        display: flex;
      `}
    >
      <LegendPadding />
      {DAYS.map((day, i) => (
        <div
          key={i}
          css={css`
            border: thin solid black;
            border-bottom: none;
            flex: 1 1 0;
            text-align: center;

            &:not(:last-child) {
              border-right: none;
            }
          `}
        >
          {format(day, "EEEEEE. dd MMM")}
        </div>
      ))}
    </div>
  );
};

const Events = () => {
  return (
    <div
      css={css`
        flex: 1 1 auto;
        position: relative;
      `}
    >
      <GridBackground />

      <div
        css={css`
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          display: flex;
        `}
      >
        <LegendPadding
          css={css`
            border-color: black;
          `}
        />
        {DAYS.map((day, i) => (
          <DayStack
            key={i}
            day={day}
            css={css`
              flex: 1 1 0;

              &:not(:last-child) {
                border-right: none;
              }
            `}
          />
        ))}
      </div>
    </div>
  );
};

const [useCurrentTimePos] = bind((date: Date) =>
  currentTime$.pipe(
    map((now) => {
      const startTime = set(date, {
        hours: START_HOUR,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });
      const endTime = set(date, {
        hours: END_HOUR,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });
      const totalSeconds = differenceInSeconds(endTime, startTime);
      const currentSeconds = differenceInSeconds(now, startTime);
      const result = currentSeconds / totalSeconds;
      return result;
    }),
    // Only keep stream alive for those that will show a bar in the future
    takeWhile((v) => v <= 1),
    skipWhile((v) => v < 0),
    startWithTimeout(null, 0),
    concatIfEmpty(of(null))
    /** Alternatively, just map to null if <0 or >1, but on every tick it would
     * emit a new `null`, solvable with `distinctUntilChanged` but nvm :)
     */
  )
);

const DayStack: FC<{ className?: string; day: Date }> = ({
  className,
  day,
}) => {
  const currentTimePos = useCurrentTimePos(day);
  const events = useEventsByDay(day);
  if (events.length) {
    console.log(day.toISOString(), events);
  }

  const currentTimeBar = currentTimePos ? (
    <div
      css={css`
        position: absolute;
        border: 1px solid red;
        top: ${currentTimePos * 100}%;
        left: 0;
        width: 100%;

        @media print {
          display: none;
        }
      `}
    />
  ) : null;

  return (
    <div
      css={css`
        border: thin solid black;
        overflow: hidden;
        position: relative;
      `}
      className={className}
    >
      {currentTimeBar}
    </div>
  );
};

const GridBackground = () => {
  return (
    <div
      css={css`
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      `}
    >
      {hours.map((hour) => (
        <div
          key={hour}
          css={css`
            flex: 1 1 0;
            border-bottom: thin solid lightgray;
            padding: 0.1rem;
          `}
        >
          {hour > 9 ? `${hour}:00` : `0${hour}:00`}
        </div>
      ))}
    </div>
  );
};

const DailyTasks = () => {
  return (
    <div
      css={css`
        flex: 0 0 auto;
        max-height: 25%;
        display: flex;
      `}
    >
      <LegendPadding />
      {DAYS.map((day, d) => (
        <DayTasks
          key={d}
          day={day}
          css={css`
            flex: 1 1 0;
          `}
        />
      ))}
    </div>
  );
};

const DayTasks: FC<{ day: Date; className?: string }> = ({
  day,
  className,
}) => {
  const events = useDailyEvents(day);
  const [ref, printSize] = usePrintFontRatio();

  return (
    <div
      ref={ref}
      css={css`
        border: thin solid black;
        border-top: none;
        overflow: auto;

        &:not(:last-child) {
          border-right: none;
        }

        ${printSize};
      `}
      className={className}
    >
      <div>Daily Tasks</div>
      {events.map((event) => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  );
};

const WeekTasks = () => {
  const weeklyEvents = useWeeklyEvents();
  const [ref, printSize] = usePrintFontRatio();

  return (
    <div
      ref={ref}
      css={css`
        flex: 0 0 auto;
        overflow: auto;
        max-height: 25%;

        ${printSize};
      `}
    >
      <div>Weekly tasks</div>
      {weeklyEvents.map((event) => (
        <div key={event.id}>{event.title}</div>
      ))}
    </div>
  );
};

const LegendPadding: FC<{ className?: string }> = ({ className }) => (
  <div
    css={css`
      flex: 0 0 ${HOUR_LEGEND_WIDTH};
      border: thin solid transparent;
      border-right: none;
    `}
    className={className}
  />
);

const usePrintFontRatio = () => {
  const [printSize, setPrintSize] = useState("1em");
  const ref = useResize((rect, element) => {
    const fontRatio = Math.min(1, rect.height / element.scrollHeight);
    setPrintSize(fontRatio + "em");
  });
  const css = `
    @media print {
      font-size: ${printSize};
      overflow: visible;
    }
  `;
  return [ref, css] as const;
};
