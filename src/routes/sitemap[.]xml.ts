import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://1inow.com";
const LEARNING_PATHS = [
  "/learn/voice-capture",
  "/learn/review-queue",
  "/learn/next-action",
  "/learn/risk-tracking",
  "/learn/intelligence-layer",
  "/learn/operating-picture",
  "/learn/obvious-system",
  "/learn/faq",
  "/learn/legal",
  "/learn/security",
  "/learn/projects",
  "/learn/automation-readiness",
  "/learn/device-connections",
];

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/how-it-works", changefreq: "monthly", priority: "0.8" },
          { path: "/device-connections", changefreq: "monthly", priority: "0.8" },
          { path: "/security-trust", changefreq: "monthly", priority: "0.7" },
          { path: "/roadmap", changefreq: "monthly", priority: "0.7" },
          { path: "/principles/strategic-vs-tactical", changefreq: "monthly", priority: "0.7" },
          { path: "/legal/privacy", changefreq: "monthly", priority: "0.5" },
          { path: "/legal/terms", changefreq: "monthly", priority: "0.5" },
          ...LEARNING_PATHS.map((path) => ({
            path,
            changefreq: "monthly" as const,
            priority: "0.6",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
