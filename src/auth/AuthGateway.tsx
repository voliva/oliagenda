import React from "react";
import { FC } from "react";
import { signIn, useIsSignedIn } from "./auth";

export const AuthGateway: FC = ({ children }) => {
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
