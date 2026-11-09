import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Up17 AutoPublisher",
    short_name: "Up17",
    description: "Local-first creator studio preview. No connected publishing or analytics.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5f3fa",
    theme_color: "#6246c7",
    orientation: "any",
    categories: ["productivity", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
