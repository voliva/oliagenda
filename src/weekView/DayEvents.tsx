import css from "@emotion/css";
import {
  addMinutes,
  areIntervalsOverlapping,
  compareAsc,
  max,
  setHours,
} from "date-fns";
import React, { FC, useRef, MouseEvent } from "react";
import { noop } from "rxjs";
import { useResize } from "../lib";
import { CalendarEvent } from "../services";
import { HOUR_RANGE, START_HOUR } from "./constants";
import { getTimePosition, useCurrentTimePos } from "./time";
import { useEventsByDay } from "./weekViewEvents";

interface PrintableEvent extends CalendarEvent {
  level: number;
  positions: {
    start: number;
    end: number;
  };
}
export const DayEvents: FC<{
  className?: string;
  day: Date;
  onEventClick?: (eventId: string) => void;
  onNewEvent?: (startTime: Date, endTime: Date) => void;
}> = ({ className, day, onEventClick = noop, onNewEvent = noop }) => {
  const currentTimePos = useCurrentTimePos(day);
  const events = useEventsByDay(day);
  const containerHeight = useRef(0);
  const ref = useResize((rect) => (containerHeight.current = rect.height));

  let levels: Array<{
    start: Date;
    end: Date;
  }> = [];
  const printableEvents = [...events]
    .sort((e1, e2) => compareAsc(e1.range.start, e2.range.start))
    .map(
      (evt): PrintableEvent => {
        let l = 0;
        while (levels[l] && areIntervalsOverlapping(evt.range, levels[l])) {
          l++;
        }
        if (!levels[l]) {
          levels[l] = {
            ...evt.range,
          };
        } else {
          levels[l].end = max([levels[l].end, evt.range.end]);
        }

        return {
          ...evt,
          level: l,
          positions: {
            start: getTimePosition(evt.range.start),
            end: getTimePosition(evt.range.end),
          },
        };
      }
    );

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

  const handleAreaClick = (evt: MouseEvent) => {
    const y = evt.nativeEvent.offsetY;
    const pct = y / containerHeight.current;
    const minutes = pct * HOUR_RANGE * 60;
    const startOfDay = setHours(day, START_HOUR);
    const start = addMinutes(startOfDay, Math.floor(minutes / 30) * 30);
    const end = addMinutes(startOfDay, Math.floor(minutes / 30) * 30 + 60);
    onNewEvent(start, end);
  };

  const handleEventClick = (id: string, event: MouseEvent) => {
    event.stopPropagation();
    onEventClick(id);
  };

  return (
    <div
      ref={ref}
      css={css`
        border: thin solid black;
        overflow: hidden;
        position: relative;
        cursor: pointer;
      `}
      onClick={handleAreaClick}
      className={className}
    >
      {printableEvents.map((evt) => (
        <EventDisplay
          key={evt.id}
          event={evt}
          onClick={(event) => handleEventClick(evt.id, event)}
        />
      ))}
      {currentTimeBar}
    </div>
  );
};

// Sum(1/n^1.1) n=1..Infinity converges to 10.5844
const HARMONIC_SCALE = 1 / 10.5844;
const MAX_LEVEL = 9;
const factors = new Array(MAX_LEVEL + 1).fill(0);
for (let i = 1; i < factors.length; i++) {
  factors[i] = factors[i - 1] + HARMONIC_SCALE / Math.pow(i, 1.1);
}
const leftPositions = factors.map((f) => f * 100 + "%");
const rightPositions = factors.map((f) => 1 - f * 4 + "rem");

const EventDisplay: FC<{
  event: PrintableEvent;
  onClick?: (event: MouseEvent) => void;
}> = ({ event, ...rest }) => {
  const left = leftPositions[Math.min(event.level, MAX_LEVEL)];
  const right = rightPositions[Math.min(event.level, MAX_LEVEL)];

  return (
    <div
      css={css`
        position: absolute;
        background: #eab;
        top: ${event.positions.start * 100}%;
        bottom: ${(1 - event.positions.end) * 100}%;
        padding: 0.1rem;
        min-height: 1.2rem;
        left: ${left};
        right: ${right};
        overflow: hidden;
        border: thin solid white;
        border-radius: 0.3rem;
        transition: box-shadow 0.15s, transform 0.15s;

        &:hover {
          z-index: 1;
          box-shadow: 1px 1px 5px 0px rgba(0, 0, 0, 0.75);
          transform: translate(-50%, -50%) scale(1.02) translate(50%, 50%)
            translateX(0.1rem);
        }

        @media print {
          background: white;
          color: black;
          border: thin solid black;
          right: 0;
        }
      `}
      {...rest}
    >
      {event.title}
    </div>
  );
};
