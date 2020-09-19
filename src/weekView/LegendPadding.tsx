import css from "@emotion/css";
import React from "react";
import { FC } from "react";
import { HOUR_LEGEND_WIDTH } from "./streams/constants";

export const LegendPadding: FC<{ className?: string }> = ({ className }) => (
  <div
    css={css`
      flex: 0 0 ${HOUR_LEGEND_WIDTH};
      border: thin solid transparent;
      border-right: none;
    `}
    className={className}
  />
);
