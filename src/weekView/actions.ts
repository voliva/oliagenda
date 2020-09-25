import { createListener } from "@react-rxjs/utils";

export const [eventClick$, onEventClick] = createListener<string>();

export const [timeClick$, onTimeClick] = createListener<Date>();

export const [dayClick$, onDayClick] = createListener<Date>();

export const [weekClick$, onWeekClick] = createListener();
