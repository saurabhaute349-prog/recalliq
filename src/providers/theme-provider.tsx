"use client";

import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import type { ReactNode } from "react";

type ThemeProviderComponentProps = Pick<
  ThemeProviderProps,
  | "children"
  | "attribute"
  | "defaultTheme"
  | "enableSystem"
  | "disableTransitionOnChange"
  | "storageKey"
  | "enableColorScheme"
>;

const themeProviderProps = {
  attribute: "class",
  defaultTheme: "system",
  enableSystem: true,
  disableTransitionOnChange: true,
  storageKey: "theme",
  enableColorScheme: true,
} as const satisfies Omit<ThemeProviderComponentProps, "children">;

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider {...themeProviderProps}>{children}</NextThemesProvider>
  );
}
