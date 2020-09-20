import { Subject } from "rxjs";

const eventClicksSubject = new Subject<string>();
export const eventClick$ = eventClicksSubject.asObservable();
export const onEventClick = (id: string) => eventClicksSubject.next(id);

const timeClicksSubject = new Subject<Date>();
export const timeClick$ = timeClicksSubject.asObservable();
export const onTimeClick = (time: Date) => timeClicksSubject.next(time);
