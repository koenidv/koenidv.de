import { getCollection } from "astro:content";

/**
 * Articles that are safe to expose publicly, newest first.
 *
 * Drafts stay visible while developing so they can be previewed, but must never
 * be built into the production site — the blog index, the article routes and the
 * RSS feed all share this helper so they cannot drift apart.
 */
export async function getPublishedArticles() {
  const articles = await getCollection(
    "articles",
    ({ data }) => data.draft !== true || import.meta.env.DEV
  );
  return articles.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
