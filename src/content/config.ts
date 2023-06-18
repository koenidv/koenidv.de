import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string(),
    link: z.string(),
    tags: z.array(z.string()),
    date: z.string().or(z.date()).transform((val) => new Date(val)),
  }),
});
