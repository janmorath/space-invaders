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
  themeColor: "#000000",
  viewportFit: "cover"
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
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Add meta tags specifically for iOS Safari */}
        <meta name="HandheldFriendly" content="true" />
        <meta name="apple-mobile-web-app-title" content="Space Invaders" />
        
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
                document.body.classList.add('ios-fullscreen', 'landscape-orientation');
                
                // Multiple scroll attempts to hide browser UI
                for (let i = 0; i < 10; i++) {
                  setTimeout(() => {
                    window.scrollTo(0, i % 2 === 0 ? 1 : 0);
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
                
                // Very aggressive scrolling trick for iOS
                const maxScrolls = 20;
                for (let i = 0; i < maxScrolls; i++) {
                  setTimeout(() => {
                    const scrollY = i % 2 === 0 ? 1 : 0;
                    window.scrollTo(0, scrollY);
                  }, 500 + (i * 50));
                }
                
                // Create a full-size overlay to intercept touch events
                if (!document.getElementById('fullscreen-overlay')) {
                  const overlay = document.createElement('div');
                  overlay.id = 'fullscreen-overlay';
                  overlay.style.position = 'fixed';
                  overlay.style.top = '0';
                  overlay.style.left = '0';
                  overlay.style.width = '100vw';
                  overlay.style.height = '100vh';
                  overlay.style.backgroundColor = 'black';
                  overlay.style.zIndex = '9998';
                  overlay.style.opacity = '0';
                  overlay.style.pointerEvents = 'none';
                  document.body.appendChild(overlay);
                  
                  setTimeout(() => {
                    overlay.style.opacity = '0';
                    overlay.style.pointerEvents = 'none';
                  }, 300);
                }
              }
            }
            
            // iOS-specific fix for 100vh
            function setIOSHeight() {
              // First, get the viewport height and multiply by 1% to get a value for a vh unit
              let vh = window.innerHeight * 0.01;
              // Then set the value in the --vh custom property to the root of the document
              document.documentElement.style.setProperty('--vh', \`\${vh}px\`);
              
              // For iOS Safari, use a more aggressive approach to get full screen height
              if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                document.documentElement.style.height = '100vh';
                document.documentElement.style.height = '-webkit-fill-available';
                document.body.style.height = '100vh';
                document.body.style.height = '-webkit-fill-available';
              }
            }
            
            // Run on load and orientation change
            window.addEventListener('orientationchange', () => {
              handleFullscreen();
              setIOSHeight();
            });
            window.addEventListener('resize', () => {
              handleFullscreen();
              setIOSHeight();
            });
            document.addEventListener('touchstart', handleFullscreen);
            
            // Initial call with small delay
            if (typeof window !== 'undefined') {
              setIOSHeight();
              setTimeout(handleFullscreen, 100);
              setTimeout(handleFullscreen, 500);
              setTimeout(handleFullscreen, 1000);
              
              // Very aggressive scrolling to hide address bar in iOS
              setTimeout(() => {
                // Create a div that forces the page to be scrollable
                const scrollHelper = document.createElement('div');
                scrollHelper.style.position = 'absolute';
                scrollHelper.style.height = '200%';
                scrollHelper.style.width = '100%';
                scrollHelper.style.pointerEvents = 'none';
                scrollHelper.style.opacity = '0';
                scrollHelper.style.zIndex = '-1000';
                document.body.appendChild(scrollHelper);
                
                // Force scroll
                window.scrollTo(0, 1);
                
                // Remove the helper after use
                setTimeout(() => {
                  document.body.removeChild(scrollHelper);
                }, 1500);
              }, 1200);
              
              // Add a listener to catch and suppress browser UI via touchend
              document.addEventListener('touchend', (e) => {
                if (window.orientation === 90 || window.orientation === -90) {
                  setTimeout(() => {
                    window.scrollTo(0, 1);
                  }, 100);
                }
              });
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
      >
        <div className="minimal-ui-helper"></div>
        {children}
      </body>
    </html>
  );
}
