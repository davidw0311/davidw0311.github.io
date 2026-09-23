import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";

const bruno = localFont({
  src: "./fonts/BrunoAceSC-Regular.ttf",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://davidw0311.github.io"),
  title: {
    default: "David Yuchen Wang | AI, Physics and Robotics",
    template: "%s | David Yuchen Wang",
  },
  description: "Portfolio of David Yuchen Wang, an engineer building intelligent systems across AI, robotics, physics, and computational research.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "David Yuchen Wang | AI, Physics and Robotics",
    description: "Projects and research spanning machine learning, robotics, physics, and engineering.",
    url: "https://davidw0311.github.io",
    siteName: "David Yuchen Wang",
    images: [
      {
        url: "/assets/generated/portfolio-og-mountain.jpg",
        width: 1200,
        height: 630,
        alt: "Layered blue mountains from David Yuchen Wang's portfolio",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "David Yuchen Wang | AI, Physics and Robotics",
    description: "Projects and research spanning machine learning, robotics, physics, and engineering.",
    images: [
      {
        url: "/assets/generated/portfolio-og-mountain.jpg",
        alt: "Layered blue mountains from David Yuchen Wang's portfolio",
      },
    ],
  },
  icons: { icon: "/assets/favicon.ico" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={bruno.variable} data-scroll-behavior="smooth">
      <body>
        {children}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-69QDR9QF7J" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-69QDR9QF7J');`}
        </Script>
      </body>
    </html>
  );
}
