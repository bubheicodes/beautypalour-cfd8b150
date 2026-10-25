import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import { MotionProvider } from "@/components/motion";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TradePilot EA — Automated trading for MetaTrader 5",
  description:
    "Subscribe to TradePilot and get your own copy of the EA, licensed to your MT5 accounts. Pay with USDT.",
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#040a17" };

// Applies the saved theme before first paint, so light-theme visitors never see a dark flash.
const THEME_SCRIPT = `try{if(localStorage.getItem("tp_theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
