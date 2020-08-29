import { from } from "rxjs";
import { gapiService } from "./gapi";
import { switchMap } from "rxjs/operators";
import { bind } from "@react-rxjs/core";

export const [useIsSignedIn] = bind(
  from(gapiService).pipe(switchMap((service) => service.isSignedIn$))
);

export const signOut = async () => (await gapiService).signOut();
export const signIn = async () => (await gapiService).signIn();
