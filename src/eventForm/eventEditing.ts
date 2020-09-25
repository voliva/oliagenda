import { bind, SUSPENSE } from "@react-rxjs/core";
import { createListener, mergeWithKey } from "@react-rxjs/utils";
import { merge, of } from "rxjs";
import {
  catchError,
  exhaustMap,
  filter,
  map,
  mapTo,
  mergeMap,
  scan,
  share,
  startWith,
  switchMap,
  take,
} from "rxjs/operators";
import { removeEvent, upsertEvent } from "../calendar";
import { isNotSupsense } from "../lib";
import { CalendarEvent, invokeGapiService } from "../services";
import { CalendarFormEvent, cancelEdit, eventToEdit$ } from "./eventEdited";

export const [titleChanges, changeTitle] = createListener<string>();
export const [descriptionChanges, changeDescription] = createListener<string>();
export const [calendarChanges, changeCalendar] = createListener<string>();

export const [datetimeChanges, changeDatetime] = createListener(
  (key: "start" | "end", value: Date) => ({
    key,
    value,
  })
);

export const [formSubmits, submitForm] = createListener();

const createEventUpdatingStream = (initialEvent: CalendarFormEvent) =>
  mergeWithKey({
    titleChanges,
    descriptionChanges,
    datetimeChanges,
    calendarChanges,
  }).pipe(
    scan((event, change) => {
      switch (change.type) {
        case "titleChanges":
          return {
            ...event,
            title: change.payload,
          };
        case "descriptionChanges":
          return {
            ...event,
            description: change.payload,
          };
        case "calendarChanges":
          return {
            ...event,
            calendarId: change.payload,
          };
        case "datetimeChanges":
          return {
            ...event,
            range: {
              ...event.range,
              [change.payload.key]: change.payload.value,
            },
          };
      }
    }, initialEvent),
    startWith(initialEvent)
  );

export const [useEventBeingEdited, eventBeingEdited$] = bind(
  eventToEdit$.pipe(
    switchMap((initialEvent) =>
      initialEvent === null
        ? of(SUSPENSE)
        : createEventUpdatingStream(initialEvent)
    )
  )
);

const formSubmissionResults = formSubmits.pipe(
  switchMap(() => eventBeingEdited$.pipe(take(1), filter(isNotSupsense))),
  exhaustMap((event) =>
    invokeGapiService((service) => service.upsertEvent(event)).pipe(
      map((result) => ({
        type: "success" as const,
        result,
      })),
      catchError((error) => {
        console.error(error);
        return of({
          type: "error" as const,
          error: error.result.error.message as string,
        });
      })
    )
  ),
  share()
);

export const [useSubmitResultError] = bind(
  merge(
    of(null),
    formSubmits.pipe(mapTo(null)),
    formSubmissionResults.pipe(
      filter(({ type }) => type === "error"),
      map((value) => (value as any).error)
    )
  )
);

formSubmissionResults.subscribe((event) => {
  if (event.type === "success") {
    upsertEvent(event.result);
    cancelEdit();
  }
});

export const [eventDeletions, deleteEvent] = createListener<CalendarEvent>();
eventDeletions
  .pipe(
    mergeMap((event) =>
      invokeGapiService((service) => service.deleteEvent(event)).pipe(
        mapTo(event)
      )
    )
  )
  .subscribe((event) => {
    removeEvent(event);
    cancelEdit();
  });
