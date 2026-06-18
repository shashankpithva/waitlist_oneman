import type { Metadata } from "next";
import { Playfair_Display, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-playfair",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-manrope",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Oneman",
  description:
    "Oneman gives solo founders the power of a full team. One person. One AI. Infinite leverage.",
  icons: {
    icon: "/onemanlogo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${manrope.variable} ${spaceMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
