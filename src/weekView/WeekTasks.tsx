import css from "@emotion/css";
import React from "react";
import { usePrintFontRatio } from "../lib";
import { onEventClick } from "./actions";
import { useWeeklyEvents } from "./streams/weekViewEvents";

export const WeekTasks = () => {
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
    </div>
  );
};
