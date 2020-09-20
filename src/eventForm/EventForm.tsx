import styled from "@emotion/styled";
import { format } from "date-fns";
import React, { FC, FormEvent } from "react";
import { cancelEdit } from "./eventEdited";
import {
  changeDatetime,
  changeDescription,
  changeTitle,
  submitChanges,
  useEventBeingEdited,
} from "./eventEditing";

export const EventForm: FC = () => {
  const event = useEventBeingEdited();

  const handleSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    submitChanges();
  };

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
          <input type="submit" value="Submit" />
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
