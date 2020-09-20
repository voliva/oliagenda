import css from "@emotion/css";
import { format } from "date-fns";
import React, { FC } from "react";
import { DailyTasks } from "./DailyTasks";
import { DayEvents } from "./DayEvents";
import { GridBackground } from "./GridBackground";
import { LegendPadding } from "./LegendPadding";
import { DAYS } from "./streams/constants";
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
