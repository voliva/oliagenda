import { format, isEqual, parseISO, startOfDay } from "date-fns";
import { CalendarEvent } from "./model";

export const mapEventFromGoogle = (
  event: gapi.client.calendar.Event
): CalendarEvent => ({
  id: event.id,
  calendarId: event.organizer.email!,
  title: event.summary || "",
  range: {
    start: getDateFromEvent(event.start),
    end: getDateFromEvent(event.end),
  },
  description: event.description || "",
});

export const mapEventToGoogle = (
  event: CalendarEvent | Omit<CalendarEvent, "id">
): gapi.client.calendar.EventInput => ({
  id: "id" in event ? event.id : undefined,
  summary: event.title,
  description: event.description,
  ...getDateForEvent(event.range),
});

const getDateFromEvent = (eventDate: gapi.client.calendar.Event["start"]) => {
  if (eventDate.dateTime) {
    return parseISO(eventDate.dateTime);
  }
  if (eventDate.date) {
    return parseISO(eventDate.date);
  }
  console.error("unparsable date", eventDate);
  throw new Error(`can't parse date`);
};

const getDateForEvent = (
  range: CalendarEvent["range"]
): Pick<gapi.client.calendar.Event, "start" | "end"> => {
  if (
    isEqual(range.start, startOfDay(range.start)) &&
    isEqual(range.end, startOfDay(range.end))
  ) {
    return {
      start: {
        date: format(range.start, "yyyy-MM-dd"),
      },
      end: {
        date: format(range.end, "yyyy-MM-dd"),
      },
    };
  }
  return {
    start: {
      dateTime: range.start.toISOString(),
    },
    end: {
      dateTime: range.end.toISOString(),
    },
  };
};
