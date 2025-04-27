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
        {/* Mobile viewport meta tags with aggressive settings */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, minimal-ui" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        
        {/* Special script to handle mobile fullscreen with multiple techniques */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Force fullscreen in landscape orientation with multiple approaches
            function handleFullscreen() {
              if (window.orientation === 90 || window.orientation === -90 || 
                 (screen.orientation && screen.orientation.type && screen.orientation.type.includes('landscape'))) {
                console.log("Detected landscape mode, applying fullscreen");
                
                // Set HTML/body to fixed
                document.documentElement.style.height = '100%';
                document.documentElement.style.width = '100%';
                document.documentElement.style.position = 'fixed';
                document.documentElement.style.overflow = 'hidden';
                document.body.style.height = '100%';
                document.body.style.width = '100%';
                document.body.style.position = 'fixed';
                document.body.style.overflow = 'hidden';
                
                // Apply classes
                document.body.classList.add('ios-fullscreen');
                
                // Multiple scroll attempts to hide browser UI
                for (let i = 0; i < 5; i++) {
                  setTimeout(() => {
                    window.scrollTo(0, 1);
                  }, i * 100); // Try multiple times with increasing delay
                }
                
                // Try locking orientation if available
                try {
                  if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('landscape')
                      .then(() => console.log('Landscape lock successful'))
                      .catch(e => console.warn('Could not lock orientation:', e));
                  }
                } catch (e) {
                  console.warn('Error with orientation API:', e);
                }
                
                // Try to request fullscreen
                try {
                  const elem = document.documentElement;
                  const requestMethod = elem.requestFullscreen || 
                    elem.webkitRequestFullscreen || 
                    elem.mozRequestFullScreen || 
                    elem.msRequestFullscreen;
                    
                  if (requestMethod) {
                    requestMethod.call(elem);
                    console.log('Fullscreen requested');
                  }
                } catch (e) {
                  console.warn('Could not request fullscreen:', e);
                }
              }
            }
            
            // Run on load and orientation change
            window.addEventListener('orientationchange', handleFullscreen);
            window.addEventListener('resize', handleFullscreen);
            document.addEventListener('touchstart', handleFullscreen);
            
            // Initial call with small delay
            if (typeof window !== 'undefined') {
              setTimeout(handleFullscreen, 100);
              setTimeout(handleFullscreen, 500);
              setTimeout(handleFullscreen, 1000);
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
