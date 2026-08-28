import type { Metadata, Viewport } from "next";
import { Sidebar, BottomNav, MobileHeader } from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeStyleProvider } from "@/components/ThemeStyleProvider";
import { ThemeSettingsModal } from "@/components/ThemeSettingsModal";
import { PWAInstaller } from "@/components/PWAInstaller";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stitch & Moral - Manajemen Sewa Jas",
  description: "Sistem Manajemen Sewa Jas, Inventori, dan Keuangan Stitch & Moral",
  applicationName: "Stitch & Moral",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stitch & Moral",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-precomposed.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
      <body className="antialiased bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
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
