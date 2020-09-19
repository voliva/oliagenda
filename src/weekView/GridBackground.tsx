import css from "@emotion/css";
import React from "react";
import { HOURS } from "./streams/constants";

export const GridBackground = () => {
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
        overflow: hidden;
      `}
    >
      {HOURS.map((hour) => (
        <div
          key={hour}
          css={css`
            flex: 1 1 0;
            border-bottom: thin solid lightgray;
            padding: 0.1rem;
            overflow: hidden;
          `}
        >
          {hour > 9 ? `${hour}:00` : `0${hour}:00`}
        </div>
      ))}
    </div>
  );
};
