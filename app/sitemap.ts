import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://paifu.vercel.app/paidle",
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://paifu.vercel.app/sets",
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ]
}
