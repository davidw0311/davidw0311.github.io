import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://davidw0311.github.io";
  return [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/projects/blackjack-trainer/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/projects/language-lab/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/projects/piano-note-lab/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/projects/piano-note-lab/practice/`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/projects/piano-note-lab/lessons/`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/projects/piano-note-lab/lessons/1/`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/projects/piano-note-lab/lessons/2/`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/projects/piano-note-lab/lessons/3/`, changeFrequency: "monthly", priority: 0.7 },
    ...projects.map((project) => ({
      url: `${baseUrl}/projects/${project.slug}/`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
