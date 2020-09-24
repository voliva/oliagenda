import css from "@emotion/css";
import React from "react";
import { FC } from "react";

export const LegendPadding: FC<{ className?: string }> = ({
  className,
  children,
}) => (
  <div
    css={css`
      flex: 0 0 5em;
      border: thin solid transparent;
      border-right: none;
    `}
    className={className}
  >
    {children}
  </div>
);
