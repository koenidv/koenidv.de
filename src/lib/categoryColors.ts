import type { CollectionEntry } from "astro:content";

type Tag = CollectionEntry<"articles">["data"]["tags"][number];

export const categoryColors: Record<Tag, string> = {
  "talk": "bg-purple-100 text-purple-800 border-purple-200",
  "cities": "bg-green-100 text-green-800 border-green-200",
  "reverse-eng": "bg-amber-100 text-amber-800 border-amber-200",
  "android": "bg-teal-100 text-teal-800 border-teal-200",
  "hardware": "bg-red-100 text-red-800 border-red-200",
  "web": "bg-blue-100 text-blue-800 border-blue-200",
  "automation": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "workspace": "bg-orange-100 text-orange-800 border-orange-200",
};
