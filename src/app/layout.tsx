import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { DateFilterProvider } from "@/context/DateFilterContext";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sentry | Metropolitan Stop & Search Intelligence",
  description: "Explore historical Metropolitan Police stop and search data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSerif.variable}`}>
        <DateFilterProvider>{children}</DateFilterProvider>
      </body>
    </html>
  );
}
