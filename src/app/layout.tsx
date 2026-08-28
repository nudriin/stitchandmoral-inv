import type { Metadata, Viewport } from "next";
import { Sidebar, BottomNav } from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stitch and Moral - Manajemen Sewa Jas",
  description: "Sistem Manajemen Sewa Jas, Inventori, dan Keuangan",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sewa Jas",
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
      <body className="antialiased bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 pb-24 md:pb-8 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
