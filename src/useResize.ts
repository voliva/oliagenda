import { head, isNil, noop, throttle } from "lodash";
import { useCallback, useEffect, useRef } from "react";
import ResizeObserver from "resize-observer-polyfill";

export type ResizeRect = Omit<DOMRectReadOnly, "toJSON">;
export function useResize<T extends Element>(
  onResize: (rect: ResizeRect, element: T) => void,
  throttleWait?: number
) {
  const ref = useRef<T | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const throttledOnResize = useRef<typeof onResize>(noop);

  useEffect(() => {
    throttledOnResize.current = isNil(throttleWait)
      ? onResize
      : throttle(onResize, throttleWait);
  }, [onResize, throttleWait]);

  useEffect(() => {
    // Create ResizeObserver
    const ResizeObserverConstructor: typeof ResizeObserver =
      (window as any).ResizeObserver || ResizeObserver;
    observer.current = new ResizeObserverConstructor((entries) => {
      const entry = head(entries);

      if (!entry) {
        return;
      }

      const { contentRect } = entry;
      throttledOnResize.current(
        {
          bottom: contentRect.bottom,
          height: contentRect.height,
          left: contentRect.left,
          right: contentRect.right,
          top: contentRect.top,
          width: contentRect.width,
          x: contentRect.x,
          y: contentRect.y,
        },
        ref.current!
      );
    });

    if (ref.current) {
      observer.current.observe(ref.current);
    }

    return () => observer.current!.disconnect();
  }, []);

  const refCb = useCallback((element: T | null) => {
    if (ref.current === element) {
      return;
    }

    if (observer.current) {
      if (ref.current) {
        observer.current.unobserve(ref.current);
      }
      if (element) {
        observer.current.observe(element);
      }
    }
    ref.current = element;
  }, []);

  return refCb;
}
