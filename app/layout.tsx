import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Space Invaders Game",
  description: "A classic Space Invaders game built with Next.js",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Space Invaders"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Mobile viewport meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Special script to handle mobile fullscreen */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Force fullscreen in landscape orientation
            function handleFullscreen() {
              if (window.orientation === 90 || window.orientation === -90 || screen.orientation?.type.includes('landscape')) {
                // Mobile landscape mode
                document.documentElement.style.height = '100%';
                document.body.style.height = '100%';
                document.body.style.position = 'fixed';
                document.body.style.overflow = 'hidden';
                setTimeout(() => { window.scrollTo(0, 1); }, 100);
              }
            }
            
            // Run on load and orientation change
            window.addEventListener('orientationchange', handleFullscreen);
            window.addEventListener('resize', handleFullscreen);
            if (typeof window !== 'undefined') {
              handleFullscreen();
              // Scroll to hide address bar
              setTimeout(() => { window.scrollTo(0, 1); }, 300);
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
      >
        {children}
      </body>
    </html>
  );
}
