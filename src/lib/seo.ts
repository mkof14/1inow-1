/** Shared SEO / Open Graph defaults for public routes. */

export const SITE_URL = "https://1inow.com";
export const OG_IMAGE = `${SITE_URL}/icons/icon-512.png`;

export function publicPageMeta(input: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}) {
  const url = `${SITE_URL}${input.path}`;
  return {
    meta: [
      { title: input.title },
      { name: "description", content: input.description },
      { property: "og:title", content: input.title },
      { property: "og:description", content: input.description },
      { property: "og:url", content: url },
      { property: "og:type", content: input.type ?? "website" },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: input.title },
      { name: "twitter:description", content: input.description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
