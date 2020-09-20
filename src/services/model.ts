import { isEqual } from "date-fns";

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  range: {
    start: Date;
    end: Date;
  };
  description: string;
}

export const eventEquals = (eventA: CalendarEvent, eventB: CalendarEvent) => {
  const deepEqual = (a: any, b: any): boolean => {
    // Just checks for the shape above :point_up:
    if (typeof a === "object") {
      if (a instanceof Date) {
        return isEqual(a, b);
      }
      return Object.keys(a).every((key) => deepEqual(a[key], b[key]));
    }
    return a === b;
  };
  return deepEqual(eventA, eventB);
};
