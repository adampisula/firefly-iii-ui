import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { APPEARANCE_BOOTSTRAP_SCRIPT } from "@/lib/appearance";
import { PrivacyProvider } from "@/components/shell/privacy-context";
import "../styles/tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Firefly",
  description: "A secure frontend for Firefly III.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="ff-appearance"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body>
        <PrivacyProvider>{children}</PrivacyProvider>
      </body>
    </html>
  );
}
