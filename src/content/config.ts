import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    longDescription: z.string().optional(),
    image: z.string().optional(),
    link: z.string(),
    tags: z.array(z.string()),
    date: z.string().or(z.date()).transform((val) => new Date(val)),
    color: z.string().optional(),
    category: z.enum(["people", "tools", "games", "services"]).optional(),
    live: z.boolean().optional(),
    ctaLinkText: z.string().optional(),
  }),
});

export const collections = { projects }