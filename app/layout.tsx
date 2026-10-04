import type { Metadata } from "next";
import { Manrope, Sora, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "sonner/dist/styles.css";
import { GoogleTagManager } from '@next/third-parties/google';
import { headers } from "next/headers";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://picomart.in"),
  applicationName: "Picomart",
  authors: [{ name: "Picomart" }],
  creator: "Picomart",
  publisher: "Picomart",
  icons: {
    icon: [
      { url: '/favicon-96x96.png?v=20260903', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg?v=20260903', type: 'image/svg+xml' },
    ],
    shortcut: [
      { url: '/favicon.ico?v=20260903', sizes: '48x48', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=20260903', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest?v=20260903',
  title: {
    default: "Picomart | Smart shopping for everyday essentials",
    template: "%s | Picomart",
  },
  description:
    "Shop smart deals, daily essentials, home picks, and trending products with Picomart. Fast, reliable shopping for modern living.",
  keywords: [
    "Picomart",
    "online shopping",
    "ecommerce",
    "daily essentials",
    "home products",
    "deals",
    "discount shopping",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://picomart.in",
    siteName: "Picomart",
    title: "Picomart | Smart shopping for everyday essentials",
    description:
      "Discover trending products, home must-haves, and everyday essentials at Picomart.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Picomart storefront",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Picomart | Smart shopping for everyday essentials",
    description:
      "Discover trending products, home must-haves, and everyday essentials at Picomart.",
    images: [
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} nonce={nonce}/>
        </Providers>
        <Toaster
          richColors
          position="top-right"
          expand={true}
          visibleToasts={5}
          gap={12}
        />
      </body>
    </html>
  );
}
