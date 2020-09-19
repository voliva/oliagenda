import { useState } from "react";
import { useResize } from "./useResize";

export const usePrintFontRatio = () => {
  const [printSize, setPrintSize] = useState("1em");
  const ref = useResize((rect, element) => {
    const fontRatio = Math.min(1, rect.height / element.scrollHeight);
    setPrintSize(fontRatio + "em");
  });
  const css = `
    @media print {
      font-size: ${printSize};
      overflow: visible;
    }
  `;
  return [ref, css] as const;
};
