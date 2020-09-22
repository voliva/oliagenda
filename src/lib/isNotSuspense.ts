import { SUSPENSE } from "@react-rxjs/core";

export const isNotSupsense = <T extends any>(v: T | typeof SUSPENSE): v is T =>
  v !== SUSPENSE;
