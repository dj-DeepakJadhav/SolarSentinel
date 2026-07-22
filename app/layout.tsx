import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solar Sentinel — Global Solar-System Atlas",
  description: "A cinematic, source-linked journey from the Solar System to live Sun-to-Earth space-weather context.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
