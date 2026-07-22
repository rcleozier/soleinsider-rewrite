import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

// Fraunces carries the editorial display voice; Inter handles UI and body copy.
const displayFont = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const bodyFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://soleinsider.com"),
  title: {
    default: "SoleInsider | Sneaker Release Dates, News, and Market Data",
    template: "%s | SoleInsider",
  },
  description:
    "SoleInsider tracks sneaker release dates, Air Jordan drops, Nike launches, Yeezy news, resale market notes, and authentication guides.",
  keywords: [
    "sneaker release dates",
    "Air Jordan release dates",
    "Nike sneakers",
    "Yeezy release dates",
    "sneaker news",
    "SoleInsider",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${displayFont.variable} ${bodyFont.variable}`}
    >
      <body>
        <SessionProviderWrapper>
          <SiteHeader />
          {children}
          <SiteFooter />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
