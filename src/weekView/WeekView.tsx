import css from "@emotion/css";
import { addWeeks, endOfWeek, format, subWeeks } from "date-fns";
import { startOfWeek } from "date-fns/esm";
import React, { FC } from "react";
import { take } from "rxjs/operators";
import { activeDate$, changeDateRange } from "../calendar";
import { DailyTasks } from "./DailyTasks";
import { DayEvents } from "./DayEvents";
import { GridBackground } from "./GridBackground";
import { LegendPadding } from "./LegendPadding";
import { useActiveDays } from "./streams/time";
import { WeekTasks } from "./WeekTasks";

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

const previousWeek = () =>
  activeDate$.pipe(take(1)).subscribe((currentDate) => {
    const start = subWeeks(startOfWeek(currentDate.start), 1);
    const end = endOfWeek(start);
    changeDateRange(start, end);
  });
const nextWeek = () =>
  activeDate$.pipe(take(1)).subscribe((currentDate) => {
    const start = addWeeks(startOfWeek(currentDate.start), 1);
    const end = endOfWeek(start);
    changeDateRange(start, end);
  });

const Headers = () => {
  const days = useActiveDays();

  return (
    <div
      css={css`
        flex: 0 0 auto;
        display: flex;
      `}
    >
      <LegendPadding>
        <span
          role="img"
          aria-label="previous week"
          onClick={previousWeek}
          css={css`
            cursor: pointer;
          `}
        >
          ⬅️
        </span>
        |
        <span
          role="img"
          aria-label="next week"
          onClick={nextWeek}
          css={css`
            cursor: pointer;
          `}
        >
          ➡️
        </span>
      </LegendPadding>
      {days.map((day, i) => (
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
  const days = useActiveDays();

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
        {days.map((day, i) => (
          <DayEvents
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
