import { bind } from "@react-rxjs/core";
import { collect, split } from "@react-rxjs/utils";
import { endOfWeek, parseISO, startOfDay, startOfWeek } from "date-fns";
import { keyBy } from "lodash";
import { concat, merge, of } from "rxjs";
import {
  exhaustMap,
  map,
  pairwise,
  reduce,
  scan,
  startWith,
  switchMap,
} from "rxjs/operators";
import { invokeGapiService } from "./gapi";

export const [useCalendarList, calendarList$] = bind(
  invokeGapiService((service) => service.listCalendars()).pipe(
    map((list) => list.items)
  )
);

export const [useEventsFromCalendar, eventsFromCalendar$] = bind(
  (calendarId: string) =>
    invokeGapiService((service) =>
      service.listEvents({
        calendarId,
        timeMin: startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
        timeMax: endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
        showDeleted: false,
        orderBy: "startTime",
        singleEvents: true,
      })
    )
);

export const [useEvents, event$] = bind(
  calendarList$.pipe(
    switchMap((list) =>
      merge(...list.map((calendar) => eventsFromCalendar$(calendar.id))).pipe(
        reduce(
          (acc, events) => [...acc, ...events.items],
          [] as gapi.client.calendar.Event[]
        )
      )
    )
  )
);

const eventChanges$ = event$.pipe(
  startWith([] as gapi.client.calendar.Event[]),
  pairwise(),
  switchMap(([previous, newValue]) => {
    const keyedPrevious = keyBy(previous, "id");
    const keyedNew = keyBy(newValue, "id");

    const newEvents: gapi.client.calendar.Event[] = [];
    const removedEvents: gapi.client.calendar.Event[] = [];

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
      event: gapi.client.calendar.Event;
    }>(
      newEvents.map((event) => ({ action: "new", event })),
      removedEvents.map((event) => ({ action: "removed", event }))
    );
  })
);

const getDayKey = (date: Date) => startOfDay(date).toISOString();
const eventsByDay$ = eventChanges$.pipe(
  split(
    ({ event }) => {
      const date = getDateFromEvent(event.start);
      if (!date) {
        return null;
      }
      return getDayKey(date);
    },
    (group$) =>
      group$.pipe(
        scan((events, { action, event }) => {
          switch (action) {
            case "new":
              return {
                ...events,
                [event.id]: event,
              };
            case "removed":
              const { [event.id]: _, ...result } = events;
              return result;
          }
        }, {} as Record<string, gapi.client.calendar.Event>),
        map((result) => Object.values(result))
      )
  ),
  collect()
);

export const [useEventsByDay] = bind((date: Date) =>
  eventsByDay$.pipe(
    exhaustMap((eventsByDay) => eventsByDay.get(getDayKey(date)) || of([]))
  )
);

const getDateFromEvent = (eventDate: gapi.client.calendar.Event["start"]) => {
  if (eventDate.dateTime) {
    return parseISO(eventDate.dateTime);
  }
  if (eventDate.date) {
    return parseISO(eventDate.date);
  }
  return null;
};
