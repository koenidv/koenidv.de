import rss from '@astrojs/rss';
import { getPublishedArticles } from '../lib/articles';

export async function GET(context) {
  const articles = await getPublishedArticles();
  return rss({
    title: 'Articles by Florian König',
    description: 'Florian König is a creative software engineer and designer from Berlin.',
    site: context.site,
    items: articles.map((a) => ({
      title: a.data.title,
      pubDate: a.data.date,
      description: a.data.description,
      author: 'Florian König',
      categories: a.data.tags,
      link: `/blog/${a.slug}/`,
    })),
    customData: [
      `<language>en-us</language>`,
      `<atom:link href="${new URL('feed.xml', context.site)}" rel="self" type="application/rss+xml"/>`,
    ].join(''),
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    trailingSlash: false,
  });
}
