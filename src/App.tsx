import React, { lazy, Suspense } from "react";
import css from "@emotion/css";
import { AuthGateway } from "./auth";
import { useIsEditingEvent } from "./eventForm/eventEdited";

const WeekViewPromise = import("./weekView");
const WeekView = lazy(() => WeekViewPromise);
const EventForm = lazy(() => import("./eventForm"));

function App() {
  const isEditingEvent = useIsEditingEvent();

  return (
    <Suspense fallback={<>Loading...</>}>
      <AuthGateway>
        <WeekView
          css={css`
            height: 100%;
          `}
        />
        <Suspense fallback={null}>{isEditingEvent && <EventForm />}</Suspense>
      </AuthGateway>
    </Suspense>
  );
}

export default App;
