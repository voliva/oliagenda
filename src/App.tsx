import React, { lazy, Suspense } from "react";
import css from "@emotion/css";
import { AuthGateway } from "./auth";

const WeekViewPromise = import("./weekView");
const WeekView = lazy(() => WeekViewPromise);

function App() {
  return (
    <Suspense fallback={<>Loading...</>}>
      <AuthGateway>
        <WeekView
          css={css`
            height: 100%;
          `}
        />
      </AuthGateway>
    </Suspense>
  );
}

export default App;
