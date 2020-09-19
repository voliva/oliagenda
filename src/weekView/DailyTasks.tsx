import css from "@emotion/css";
import React, { FC } from "react";
import { usePrintFontRatio } from "../lib";
import { DAYS } from "./streams/constants";
import { LegendPadding } from "./LegendPadding";
import { useDailyEvents } from "./streams/weekViewEvents";

export const DailyTasks = () => {
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
