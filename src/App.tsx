import React, { Suspense } from "react";
import { WeekView } from "./weekView/WeekView";
import css from "@emotion/css";
import { AuthGateway } from "./auth";

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
