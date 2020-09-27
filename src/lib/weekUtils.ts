import { startOfWeek as SOW, endOfWeek as EOW } from "date-fns";

export const startOfWeek = (date: Date | number) =>
  SOW(date, { weekStartsOn: 1 });

export const endOfWeek = (date: Date | number) =>
  EOW(date, { weekStartsOn: 1 });
