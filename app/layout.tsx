import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "StoreOps Copilot", template: "%s · StoreOps Copilot" },
  description: "A multi-merchant Shopify fulfilment prototype with an explainable order queue and record-grounded answers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>;
}
