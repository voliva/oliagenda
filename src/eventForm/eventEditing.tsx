import { bind, SUSPENSE } from "@react-rxjs/core";
import { mergeWithKey } from "@react-rxjs/utils";
import { of, Subject } from "rxjs";
import {
  exhaustMap,
  filter,
  scan,
  startWith,
  switchMap,
  take,
} from "rxjs/operators";
import { upsertEvent } from "../calendar";
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

formSubmits
  .pipe(
    switchMap(() =>
      eventBeingEdited$.pipe(
        take(1),
        filter(
          <T extends any>(v: T | typeof SUSPENSE): v is T => v !== SUSPENSE
        )
      )
    ),
    exhaustMap((event) =>
      invokeGapiService((service) => service.upsertEvent(event))
    )
  )
  .subscribe((event) => {
    upsertEvent(event);
    cancelEdit();
  });
