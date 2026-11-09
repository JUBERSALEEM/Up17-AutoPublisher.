import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import "./globals.css";
import "./clay.css";

export const metadata: Metadata = {
  title: { default: "Up17 AutoPublisher — Creator Studio", template: "%s — Up17 AutoPublisher" },
  description:
    "Local demo creator automation studio. No connected accounts, publishing or live analytics.",
  robots: { index: false, follow: false },
  applicationName: "Up17 AutoPublisher",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3fa" },
    { media: "(prefers-color-scheme: dark)", color: "#111522" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="clay-light" suppressHydrationWarning>
      <body>
        <ThemeScript />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
