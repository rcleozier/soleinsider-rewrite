import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

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
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
