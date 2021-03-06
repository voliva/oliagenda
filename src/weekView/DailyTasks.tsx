import css from "@emotion/css";
import React, { FC } from "react";
import { usePrintFontRatio } from "../lib";
import { onDayClick, onEventClick } from "./actions";
import { LegendPadding } from "./LegendPadding";
import { useActiveDays } from "./streams/time";
import { useDailyEvents } from "./streams/weekViewEvents";

export const DailyTasks = () => {
  const days = useActiveDays();

  return (
    <div
      css={css`
        flex: 0 0 auto;
        max-height: 25%;
        display: flex;
      `}
    >
      <LegendPadding />
      {days.map((day, d) => (
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
        min-height: 1em;

        &:not(:last-child) {
          border-right: none;
        }

        ${printSize};
      `}
      className={className}
    >
      {events.map((event) => (
        <div
          key={event.id}
          css={css`
            cursor: pointer;

            &:hover {
              text-decoration: underline;
            }
          `}
          onClick={() => onEventClick(event.id)}
        >
          {event.title}
        </div>
      ))}
      <button type="button" onClick={() => onDayClick(day)}>
        New task
      </button>
    </div>
  );
};
