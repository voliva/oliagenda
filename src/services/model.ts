export interface CalendarEvent {
  id: string;
  title: string;
  range: {
    start: Date;
    end: Date;
  };
  description: string;
}
