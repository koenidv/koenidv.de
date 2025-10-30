
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = (
	await getCollection("articles", ({ data }) => data.draft !== true))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return rss({
    title: 'Articles by Florian König',
    description: 'Florian König is a creative software engineer and designer from Berlin.',
    site: context.site,
    items: articles.map((a) => ({
      title: a.data.title,
      pubDate: a.data.pubDate,
      description: a.data.description,
      author: 'Florian König',
      categories: a.data.tags,
      link: `/blog/${a.slug}/`,
    })),
    customData: `<language>en-us</language>`,
    trailingSlash: false,
  });
}