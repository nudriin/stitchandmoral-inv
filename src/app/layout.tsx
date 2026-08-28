import type { Metadata, Viewport } from "next";
import { Sidebar, BottomNav, MobileHeader } from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeStyleProvider } from "@/components/ThemeStyleProvider";
import { ThemeSettingsModal } from "@/components/ThemeSettingsModal";
import { PWAInstaller } from "@/components/PWAInstaller";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stitch and Moral - Manajemen Sewa Jas",
  description: "Sistem Manajemen Sewa Jas, Inventori, dan Keuangan Stitch & Moral",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sewa Jas PKY",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Stitch & Moral" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Stitch & Moral" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (("standalone" in window.navigator) && window.navigator.standalone) {
                var noddy, remotes = false;
                document.addEventListener('click', function(event) {
                  noddy = event.target;
                  while(noddy && noddy.nodeName !== "A" && noddy.nodeName !== "HTML") {
                    noddy = noddy.parentNode;
                  }
                  if(noddy && noddy.nodeName === "A" && "href" in noddy && noddy.href.indexOf("http") !== -1 && (noddy.href.indexOf(document.location.host) !== -1 || remotes)) {
                    event.preventDefault();
                    document.location.href = noddy.href;
                  }
                }, false);
              }
            `,
          }}
        />
      </head>
      <body className="antialiased bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeStyleProvider>
            <div className="flex flex-col md:flex-row min-h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <MobileHeader />
                <main className="flex-1 pb-28 md:pb-8 p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
                  {children}
                </main>
              </div>
            </div>
            <BottomNav />
            <ThemeSettingsModal />
            <PWAInstaller />
          </ThemeStyleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


