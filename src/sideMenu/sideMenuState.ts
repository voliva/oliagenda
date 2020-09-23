import { bind } from "@react-rxjs/core";
import { createListener } from "@react-rxjs/utils";
import { useEffect } from "react";
import { concat, Observable, of, race, timer } from "rxjs";
import {
  ignoreElements,
  mapTo,
  scan,
  startWith,
  switchMap,
  take,
} from "rxjs/operators";

export const [menuToggles, toggleSideMenu] = createListener();

export const [transitionEnds, onTransitionEnd] = createListener();
export const [layoutEvents, onReactLayout] = createListener();
export const TRANSITION_DURATION = 300;

export const useMenuTransition = () => useEffect(onReactLayout);

const timeoutTransition$ = race(transitionEnds, timer(TRANSITION_DURATION * 2));

type MenuState = "enter" | "open" | "closing" | "closed";
export const [useMenuState] = bind(
  menuToggles.pipe(
    scan((value) => !value, false),
    switchMap(
      (open): Observable<MenuState> => {
        if (open) {
          return concat(
            of("enter" as const),
            layoutEvents.pipe(take(1), ignoreElements()),
            of("open" as const)
          );
        }

        return timeoutTransition$.pipe(
          take(1),
          mapTo("closed" as const),
          startWith("closing")
        );
      }
    ),
    startWith("closed")
  )
);
