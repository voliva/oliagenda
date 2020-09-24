import React from "react";
import {
  setEndHour,
  setStartHour,
  useTimeRange,
} from "../weekView/streams/time";

export const TimeRangePicker = () => {
  const [start, end] = useTimeRange();

  return (
    <div>
      <div>
        Starting hour:
        <input
          type="range"
          step="1"
          value={start}
          min="0"
          max={end - 1}
          onChange={(e) => setStartHour(Number(e.target.value))}
        />
        {start}
      </div>
      <div>
        Ending hour:
        <input
          type="range"
          step="1"
          value={end}
          min={start + 1}
          max={24}
          onChange={(e) => setEndHour(Number(e.target.value))}
        />
        {end}
      </div>
    </div>
  );
};
