import { bind, SUSPENSE } from "@react-rxjs/core";
import { mergeWithKey } from "@react-rxjs/utils";
import { merge, of, Subject } from "rxjs";
import {
  catchError,
  exhaustMap,
  filter,
  map,
  mapTo,
  scan,
  share,
  startWith,
  switchMap,
  take,
} from "rxjs/operators";
import { upsertEvent } from "../calendar";
import { isNotSupsense } from "../lib";
import { invokeGapiService } from "../services";
import { CalendarFormEvent, cancelEdit, eventToEdit$ } from "./eventEdited";

const titleChanges = new Subject<string>();
export const changeTitle = (title: string) => titleChanges.next(title);

const descriptionChanges = new Subject<string>();
export const changeDescription = (description: string) =>
  descriptionChanges.next(description);

const datetimeChanges = new Subject<{ key: "start" | "end"; value: Date }>();
export const changeDatetime = (key: "start" | "end", value: Date) =>
  datetimeChanges.next({
    key,
    value,
  });

const formSubmits = new Subject();
export const submitChanges = () => formSubmits.next();

const createEventUpdatingStream = (initialEvent: CalendarFormEvent) =>
  mergeWithKey({
    titleChanges,
    descriptionChanges,
    datetimeChanges,
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
