import {
  addDays,
  differenceInDays,
  getDay,
  isEqual,
  isSameDay,
  startOfDay,
} from "date-fns";
import { CalendarEvent } from "../../services";

export function categorizeEvent(event: CalendarEvent) {
  const inDifferentDays = !isSameDay(event.range.start, event.range.end);
  const isDateBased =
    isEqual(event.range.start, startOfDay(event.range.start)) &&
    isEqual(event.range.end, startOfDay(event.range.end));

  if (isDateBased || inDifferentDays) {
    const diff = differenceInDays(event.range.end, event.range.start);
    if (getDay(event.range.start) === 1 && diff === 7) {
      return "week" as const;
    } else if (diff <= 1) {
      return "day" as const;
    }
    return "multi" as const;
  }
  return "time" as const;
}
