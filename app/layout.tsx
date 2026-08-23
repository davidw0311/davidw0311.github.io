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
    images: [{ url: "/assets/img/profile_photo/profile2.jpg", width: 1200, height: 1200, alt: "David Yuchen Wang" }],
    type: "website",
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
