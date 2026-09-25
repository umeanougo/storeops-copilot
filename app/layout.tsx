import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const siteUrl = new URL("https://storeops-copilot.vercel.app");
const description =
  "An independent, read-only Shopify operations prototype that unifies multi-merchant fulfilment work with explainable priorities and record-grounded answers.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "StoreOps Copilot — Explainable Shopify operations",
    template: "%s · StoreOps Copilot",
  },
  description,
  applicationName: "StoreOps Copilot",
  authors: [{ name: "Ugo Umeano" }],
  creator: "Ugo Umeano",
  category: "technology",
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "/",
    siteName: "StoreOps Copilot",
    title: "StoreOps Copilot — Explainable Shopify operations",
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "StoreOps Copilot multi-merchant fulfilment workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StoreOps Copilot — Explainable Shopify operations",
    description,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${sans.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
