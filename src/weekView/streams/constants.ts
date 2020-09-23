export const HOUR_LEGEND_WIDTH = "5em";
export const TODAY = new Date();
export const START_HOUR = 8;
export const END_HOUR = 20;
export const HOUR_RANGE = END_HOUR - START_HOUR;
export const HOURS = new Array(HOUR_RANGE)
  .fill(0)
  .map((_, i) => START_HOUR + i);
