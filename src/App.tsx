import React, { FC, Suspense } from "react";
import { signIn, useIsSignedIn } from "./services";
import { WeekView } from "./WeekView";
import css from "@emotion/css";

const AuthGateway: FC = ({ children }) => {
  const isSignedIn = useIsSignedIn();

  return isSignedIn ? (
    <>{children}</>
  ) : (
    <div>
      Please sign in:
      <button type="button" onClick={signIn}>
        Sign In with Google
      </button>
    </div>
  );
};

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
