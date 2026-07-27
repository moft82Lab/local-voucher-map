import type { MetadataRoute } from "next";
import { getMerchantUpdatedAt } from "@/lib/merchant-data";
import { getSiteUrl } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [updatedAt, siteUrl] = await Promise.all([
    getMerchantUpdatedAt(),
    Promise.resolve(getSiteUrl()),
  ]);

  return [
    {
      url: siteUrl,
      lastModified: updatedAt,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
