import styled from "@emotion/styled";
import { bind } from "@react-rxjs/core";
import { format, isAfter } from "date-fns";
import React, { FC, FormEvent } from "react";
import { combineLatest } from "rxjs";
import { filter, map } from "rxjs/operators";
import { useCalendarList } from "../calendar";
import { isDefined, isNotSupsense } from "../lib";
import { eventEquals } from "../services";
import { cancelEdit, eventToEdit$ } from "./eventEdited";
import {
  changeCalendar,
  changeDatetime,
  changeDescription,
  changeTitle,
  eventBeingEdited$,
  submitForm,
  useEventBeingEdited,
  useSubmitResultError,
} from "./eventEditing";

const [useFormValidation] = bind(
  combineLatest([
    eventToEdit$.pipe(filter(isDefined)),
    eventBeingEdited$.pipe(filter(isNotSupsense)),
  ]).pipe(
    map(([initialEvent, eventBeingEdited]): [boolean] | [boolean, string] => {
      if (initialEvent.id && eventEquals(initialEvent, eventBeingEdited)) {
        return [false];
      }
      if (isAfter(eventBeingEdited.range.start, eventBeingEdited.range.end)) {
        return [false, "Start date is before end date"];
      }
      return [true];
    })
  )
);

export const EventForm: FC = () => {
  const event = useEventBeingEdited();
  const [canSave, error] = useFormValidation();
  const serverError = useSubmitResultError();
  const calendarList = useCalendarList();
  const isNewEvent = event.id === undefined;

  const handleSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    submitForm();
  };

  const calendarSelector = isNewEvent ? (
    <select
      value={event.calendarId}
      onChange={(evt) => changeCalendar(evt.target.value)}
    >
      {calendarList.map(({ id, name }) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))}
    </select>
  ) : null;

  return (
    <FormBackdrop>
      <FormModal>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={event.title}
            onChange={(evt) => changeTitle(evt.target.value)}
          />
          <input
            type="text"
            value={event.description}
            onChange={(evt) => changeDescription(evt.target.value)}
          />
          <input
            type="datetime-local"
            value={format(event.range.start, "yyyy-MM-dd'T'HH:mm")}
            onChange={(evt) =>
              changeDatetime("start", new Date(evt.target.value))
            }
          />
          <input
            type="datetime-local"
            value={format(event.range.end, "yyyy-MM-dd'T'HH:mm")}
            onChange={(evt) =>
              changeDatetime("end", new Date(evt.target.value))
            }
          />
          {calendarSelector}
          <p>{error}</p>
          <p>{serverError}</p>
          <input type="submit" value="Save" disabled={!canSave} />
          <input type="button" value="Cancel" onClick={cancelEdit} />
        </form>
      </FormModal>
    </FormBackdrop>
  );
};

const FormBackdrop = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  backdrop-filter: blur(2px);
  background-color: rgba(200, 200, 200, 0.2);
  z-index: 1;
`;

const FormModal = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 40em;
  min-height: 15em;
  max-height: 90%;
  overflow: auto;
  background: white;
  border-radius: 0.2rem;
  padding: 0.5rem;
`;
