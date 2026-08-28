import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stitch & Moral - Sewa Jas PKY",
    short_name: "Stitch & Moral",
    description: "Sistem Manajemen Sewa Jas, Inventori, dan Keuangan Stitch & Moral",
    start_url: "/",
    id: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: "/icons/android/launchericon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/icons/android/launchericon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/icons/android/launchericon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icons/android/launchericon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
