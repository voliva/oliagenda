import { bind } from "@react-rxjs/core";
import { gapiService, invokeGapiService } from "../services";

export const [useIsSignedIn, isSignedIn$] = bind(
  invokeGapiService((service) => service.isSignedIn$)
);

export const signOut = async () => (await gapiService).signOut();
export const signIn = async () => (await gapiService).signIn();
