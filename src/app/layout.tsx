import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ThemeScript } from "@/components/theme-script";
import { AppProviders } from "@/providers/app-providers";
import { defaultMetadata } from "@/lib/seo/site";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F9FAFB" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${inter.className} min-h-full flex flex-col bg-background text-foreground`}
        suppressHydrationWarning
      >
        <AppProviders>
          {children}
          <ThemeToggle />
        </AppProviders>
      </body>
    </html>
  );
}
