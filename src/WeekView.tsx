import React, { FC } from "react";
import css from "@emotion/css";
import {
  startOfWeek,
  addDays,
  format,
  isSameDay,
  set,
  differenceInSeconds,
} from "date-fns";
import { interval } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { bind } from "@react-rxjs/core";
import { event$, useEvents, useEventsByDay } from "./services";

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

      <DayTasks />
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
      const isToday = isSameDay(now, date);
      if (!isToday) {
        return null;
      }
      const startTime = set(now, {
        hours: START_HOUR,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });
      const endTime = set(now, {
        hours: END_HOUR,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });
      const totalSeconds = differenceInSeconds(endTime, startTime);
      const currentSeconds = differenceInSeconds(now, startTime);
      const result = currentSeconds / totalSeconds;
      if (result > 1 || result < 0) {
        return null;
      }
      return result;
    })
  )
);

// const [useDayEvents] = bind((day: Date) => event$.pipe(
//   map(list => list.filter())
// ))
const DayStack: FC<{ className?: string; day: Date }> = ({
  className,
  day,
}) => {
  const currentTimePos = useCurrentTimePos(day);
  const events = useEventsByDay(day);
  console.log(day.toISOString(), events);

  const currentTimeBar = currentTimePos ? (
    <div
      css={css`
        position: absolute;
        border: 1px solid red;
        top: ${currentTimePos * 100}%;
        left: 0;
        width: 100%;
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

const DayTasks = () => (
  <div
    css={css`
      flex: 0 0 auto;
      max-height: 25%;
      display: flex;
    `}
  >
    <LegendPadding />
    {DAYS.map((_, d) => (
      <div
        key={d}
        css={css`
          border: thin solid black;
          border-top: none;
          flex: 1 1 auto;
          overflow: auto;

          &:not(:last-child) {
            border-right: none;
          }
        `}
      >
        Daily
      </div>
    ))}
  </div>
);

const WeekTasks = () => (
  <div
    css={css`
      flex: 0 0 auto;
      overflow: auto;
      max-height: 25%;
    `}
  >
    Week
  </div>
);

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
