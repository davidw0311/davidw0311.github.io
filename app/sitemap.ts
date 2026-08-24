import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://davidw0311.github.io";
  return [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/projects/blackjack-trainer/`, changeFrequency: "monthly", priority: 0.8 },
    ...projects.map((project) => ({
      url: `${baseUrl}/projects/${project.slug}/`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
