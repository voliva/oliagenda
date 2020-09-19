import {
  addDays,
  differenceInDays,
  getDay,
  isEqual,
  isSameDay,
} from "date-fns";
import { CalendarEvent } from "../../services";

export function categorizeEvent(event: CalendarEvent) {
  if (isSameDay(event.range.start, event.range.end)) {
    return "time" as const;
  }

  if (isEqual(addDays(event.range.start, 1), event.range.end)) {
    return "day" as const;
  }

  const diff = differenceInDays(event.range.end, event.range.start);
  if (getDay(event.range.start) === 1 && diff === 7) {
    return "week" as const;
  }
  return "multi" as const;
}
