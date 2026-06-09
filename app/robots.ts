import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/paidle", "/sets"],
        disallow: ["/wishlist", "/collection", "/card/", "/evo/", "/api/"],
      },
    ],
    sitemap: "https://paifu.vercel.app/sitemap.xml",
  }
}
