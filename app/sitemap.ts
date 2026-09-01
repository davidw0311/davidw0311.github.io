import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://davidw0311.github.io";
  return [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/my-carnivorous-garden/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/projects/blackjack-trainer/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/projects/language-lab/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/projects/piano-party/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/projects/piano-party/practice/`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/projects/piano-party/lessons/`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/projects/piano-party/lessons/1/`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/projects/piano-party/lessons/2/`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/projects/piano-party/lessons/3/`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/projects/trips/`, changeFrequency: "monthly", priority: 0.7 },
    {
      url: `${baseUrl}/projects/trips/new-zealand-2026-11-06-11-15/`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${baseUrl}/publications/accelerator-tuning-poster/`, changeFrequency: "yearly", priority: 0.6 },
    ...projects.map((project) => ({
      url: `${baseUrl}/projects/${project.slug}/`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
