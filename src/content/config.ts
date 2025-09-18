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
    draft: z.boolean().optional(),
  }),
});

const articles = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    date: z.string().or(z.date()).transform((val) => new Date(val)),
    draft: z.boolean().optional(),
    tags: z.enum(["talk", "cities", "reverse-eng", "android", "hardware", "web"]).array(),
  })
});

export const collections = { projects, articles }