import React, { Suspense } from "react";
import { signIn, signOut, useIsSignedIn } from "./services";

const Auth = () => {
  const isSignedIn = useIsSignedIn();

  return isSignedIn ? (
    <div>
      Signed In :)
      <button type="button" onClick={signOut}>
        Sign Out
      </button>
    </div>
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
      <Auth />
    </Suspense>
  );
}

export default App;
