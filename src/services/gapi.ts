import { Observable, from, ObservableInput } from "rxjs";
import { share, distinctUntilChanged, switchMap } from "rxjs/operators";

declare global {
  interface Window {
    gapiInitialized: Promise<void>;
  }
}

interface GapiService {
  isSignedIn$: Observable<boolean>;
  signIn: () => void;
  signOut: () => void;
  listCalendars: () => Promise<gapi.client.calendar.CalendarList>;
  listEvents: (
    params: gapi.client.calendar.EventsListParameters
  ) => Promise<gapi.client.calendar.Events>;
}

export const gapiService = new Promise<GapiService>(async (resolve, reject) => {
  await window.gapiInitialized;
  gapi.load("client", async () => {
    try {
      await gapi.client.init({
        apiKey: process.env.REACT_APP_API_KEY,
        clientId: process.env.REACT_APP_CLIENT_ID,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        ],
        scope: [
          "https://www.googleapis.com/auth/calendar.readonly",
          "https://www.googleapis.com/auth/calendar.events.readonly",
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/calendar.events",
        ].join(" "),
      });

      const auth2 = gapi.auth2.getAuthInstance();
      const isSignedIn$ = new Observable<boolean>((obs) => {
        auth2.isSignedIn.listen(obs.next.bind(obs));
        obs.next(auth2.isSignedIn.get());
      }).pipe(distinctUntilChanged(), share());

      resolve({
        isSignedIn$,
        signIn: () => auth2.signIn(),
        signOut: () => auth2.signOut(),
        listCalendars: () =>
          gapi.client.calendar.calendarList.list().then(({ result }) => result),
        listEvents: (params) =>
          gapi.client.calendar.events.list(params).then(({ result }) => result),
      });
    } catch (ex) {
      reject(ex);
    }
  });
});

export const gapiService$ = from(gapiService);
export const invokeGapiService = <T>(
  fn: (service: GapiService) => ObservableInput<T>
): Observable<T> => from(gapiService).pipe(switchMap(fn));
