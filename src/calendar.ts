import { bind } from "@react-rxjs/core";
import { endOfWeek, startOfWeek } from "date-fns";
import { keyBy } from "lodash";
import { combineLatest, concat } from "rxjs";
import { addDebugTag } from "rxjs-traces";
import {
  delay,
  map,
  pairwise,
  repeatWhen,
  share,
  startWith,
  switchMap,
} from "rxjs/operators";
import { CalendarEvent, invokeGapiService } from "./services";

export const [useCalendarList, calendarList$] = bind(
  invokeGapiService((service) => service.listCalendars()).pipe(
    map((list) => list.items)
  )
);

const [, eventsFromCalendar$] = bind((calendarId: string) =>
  invokeGapiService((service) =>
    service.listEvents({
      calendarId,
      timeMin: startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
      timeMax: endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
      showDeleted: false,
      orderBy: "startTime",
      singleEvents: true,
    })
  ).pipe(repeatWhen((notifier) => notifier.pipe(delay(60 * 1000))))
);

export const [, event$] = bind(
  calendarList$.pipe(
    switchMap((list) =>
      combineLatest(
        list.map((calendar) => eventsFromCalendar$(calendar.id))
      ).pipe(
        map((calendarEvents) =>
          calendarEvents.reduce((acc, events) => [...acc, ...events])
        )
      )
    )
  )
);

export const eventChanges$ = event$.pipe(
  startWith([] as CalendarEvent[]),
  pairwise(),
  switchMap(([previous, newValue]) => {
    const keyedPrevious = keyBy(previous, "id");
    const keyedNew = keyBy(newValue, "id");

    const newEvents: CalendarEvent[] = [];
    const removedEvents: CalendarEvent[] = [];

    newValue.forEach((event) => {
      if (!(event.id in keyedPrevious)) {
        newEvents.push(event);
      }
    });
    previous.forEach((event) => {
      if (!(event.id in keyedNew)) {
        removedEvents.push(event);
      }
    });

    return concat<{
      action: "new" | "removed";
      event: CalendarEvent;
    }>(
      newEvents.map((event) => ({ action: "new", event })),
      removedEvents.map((event) => ({ action: "removed", event }))
    );
  }),
  addDebugTag("eventChanges$"),
  share()
);
