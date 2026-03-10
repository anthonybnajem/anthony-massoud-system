"use client";

import { createContext, useContext } from "react";

/**
 * When the dashboard forces dir="ltr" for Arabic, switch rows should not reverse,
 * so the switch stays on the right (end of row). This context is set by the dashboard layout.
 */
type LayoutDirectionContextValue = "ltr" | null;

const LayoutDirectionContext = createContext<LayoutDirectionContextValue>(null);

export function LayoutDirectionProvider({
  value,
  children,
}: {
  value: LayoutDirectionContextValue;
  children: React.ReactNode;
}) {
  return (
    <LayoutDirectionContext.Provider value={value}>
      {children}
    </LayoutDirectionContext.Provider>
  );
}

export function useLayoutDirection(): LayoutDirectionContextValue {
  return useContext(LayoutDirectionContext);
}
