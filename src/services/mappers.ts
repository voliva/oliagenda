import { Interval } from "date-fns";

export interface CalEvent {
  id: string;
  title: string;
  range: Interval;
  description: string;
}

export const mapEvent = (event: gapi.client.calendar.Event): CalEvent => ({
  id: event.id,
  title: event.,
  range: Interval,
  description: string,
});
