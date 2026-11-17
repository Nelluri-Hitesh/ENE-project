import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "./sw-register";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ENE — Minimal Look. Maximum Madness.",
  description:
    "A cinematic Telugu comedy gameverse. Five interactive 10-minute games inspired by friendship, filmmaking, and everyday chaos.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ENE" },
  openGraph: {
    title: "ENE — The Comedy Gameverse",
    description: "Friendship ki limit ledhu. Madness ki brake ledhu.",
    images: ["/images/hero.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230B0B0D'/%3E%3Ctext x='32' y='40' font-size='22' font-family='system-ui,sans-serif' font-weight='800' letter-spacing='2' fill='%23FFFFFF' text-anchor='middle'%3EENE%3C/text%3E%3C/svg%3E"
        />
      </head>
      <body className="bg-[#0B0B0D] text-white antialiased selection:bg-[#E9FF57] selection:text-[#0B0B0D]">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
