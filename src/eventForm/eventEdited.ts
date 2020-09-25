import { bind, shareLatest } from "@react-rxjs/core";
import { createListener } from "@react-rxjs/utils";
import {
  addDays,
  addMinutes,
  addWeeks,
  differenceInMinutes,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { defer, EMPTY, fromEvent, merge, Observable } from "rxjs";
import {
  filter,
  map,
  mapTo,
  startWith,
  switchMap,
  switchMapTo,
  take,
  withLatestFrom,
} from "rxjs/operators";
import { activeDate$, calendarList$, event$ } from "../calendar";
import { CalendarEvent } from "../services";
import {
  dayClick$,
  eventClick$,
  timeClick$,
  weekClick$,
} from "../weekView/actions";

const newCalendarEvent$ = merge(
  timeClick$.pipe(
    map((date) => {
      const reference = startOfDay(date);
      const minutes = differenceInMinutes(date, reference);
      const start = addMinutes(reference, Math.floor(minutes / 30) * 30);
      const end = addMinutes(start, 60);
      return {
        start,
        end,
      };
    })
  ),
  dayClick$.pipe(
    map((date) => ({
      start: startOfDay(date),
      end: addDays(startOfDay(date), 1),
    }))
  ),
  weekClick$.pipe(
    switchMapTo(activeDate$),
    map(({ start }) => ({
      start: startOfWeek(start),
      end: addWeeks(startOfWeek(start), 1),
    }))
  )
);

export const [editManuallyCanceled, cancelEdit] = createListener();

export type CalendarFormEvent = Omit<CalendarEvent, "id"> & {
  id?: string;
};

export const eventToEdit$ = merge(
  defer(() => editCancelled).pipe(mapTo(null)),
  eventClick$.pipe(
    switchMap((id) =>
      event$.pipe(
        map(
          (events) =>
            events.find((event) => event.id === id) as CalendarFormEvent
        ),
        filter((event) => !!event),
        take(1)
      )
    )
  ),
  newCalendarEvent$.pipe(
    withLatestFrom(calendarList$),
    map(
      ([range, calendars]): CalendarFormEvent => ({
        description: "",
        calendarId: calendars[0].id, // TODO selected calendar or something
        range,
        title: "",
      })
    )
  )
).pipe(startWith(null), shareLatest());

export const [useIsEditingEvent, isEditingEvent$] = bind(
  eventToEdit$.pipe(map((v) => v !== null))
);

const escapePresses = fromEvent(window, "keydown").pipe(
  filter((evt) => (evt as KeyboardEvent).key === "Escape")
);
const editCancelled: Observable<void> = merge(
  editManuallyCanceled,
  isEditingEvent$.pipe(
    switchMap((isEditing) => (isEditing ? escapePresses : EMPTY))
  )
).pipe(mapTo(void 0));
