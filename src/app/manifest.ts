import type { MetadataRoute } from "next";

// Makes the site installable ("Add to Home Screen"): it then opens full-screen
// with its own icon, like an app. No service worker/offline mode on purpose --
// every feature needs the network (Gemini, the database) anyway.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "House of Pets",
    short_name: "House of Pets",
    description: "Personalized care plans for every kind of pet.",
    // Signed-out visitors get redirected to sign-in by the proxy.
    start_url: "/pets",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fef9f1",
    theme_color: "#be4a1b",
    categories: ["lifestyle", "health"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
