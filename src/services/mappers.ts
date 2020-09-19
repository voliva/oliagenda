import { parseISO } from "date-fns";
import { CalendarEvent } from "./model";

export const mapEventFromGoogle = (
  event: gapi.client.calendar.Event
): CalendarEvent => {
  return {
    id: event.id,
    title: event.summary,
    range: {
      start: getDateFromEvent(event.start),
      end: getDateFromEvent(event.end),
    },
    description: event.description,
  };
};

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
