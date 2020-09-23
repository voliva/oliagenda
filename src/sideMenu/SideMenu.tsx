import styled from "@emotion/styled";
import React from "react";
import { toggleCalendar, useCalendarList } from "../calendar";
import {
  onTransitionEnd,
  toggleSideMenu,
  TRANSITION_DURATION,
  useMenuState,
  useMenuTransition,
} from "./sideMenuState";

export const SideMenu = () => {
  const transitionState = useMenuState();
  const shouldRender = transitionState !== "closed";
  const shown = transitionState === "open";

  useMenuTransition();

  return shouldRender ? (
    <SideMenuPanel shown={shown} onTransitionEnd={onTransitionEnd}>
      Side menu <button onClick={toggleSideMenu}>Close</button>
      <hr />
      <CalendarSelector />
    </SideMenuPanel>
  ) : null;
};

const CalendarSelector = () => {
  const calendarList = useCalendarList();

  return (
    <ul>
      {calendarList.map(({ id, name, isActive }) => (
        <li key={id}>
          <label>
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => toggleCalendar(id)}
            />
            {name}
          </label>
        </li>
      ))}
    </ul>
  );
};

const SideMenuPanel = styled.div<{ shown: boolean }>`
  position: fixed;
  left: 0;
  top: 0;
  height: 100%;
  background: white;
  transform: ${({ shown }) => (shown ? "translateX(0)" : "translateX(-100%)")};
  transition: ${TRANSITION_DURATION}ms transform;
`;
