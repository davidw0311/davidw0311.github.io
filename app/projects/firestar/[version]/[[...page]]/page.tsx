import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FirestarSite } from '@/components/firestar/Site';
import { href, routes, themes, versions, type PageKey, type Version } from '@/data/firestar/content';

type Params = { version: string; page?: string[] };
function resolve(params: Params) {
  const version = params.version as Version;
  const current = (Object.keys(routes) as PageKey[]).find(key => routes[key].slug === (params.page?.join('/') || ''));
  if (!versions.includes(version) || !current) notFound();
  return { version, current };
}
export function generateStaticParams() {
  return versions.flatMap(version => Object.values(routes).map(route => ({ version, page: route.slug ? [route.slug] : [] })));
}
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { version, current } = resolve(await params);
  const title = `Firestar Granite | ${routes[current].title} | ${themes[version].short}`;
  return { title: { absolute: title }, description: 'Custom quartz, granite, marble, and onyx. Firestar Granite in Nanaimo proudly serves all of Vancouver Island.', alternates: { canonical: href(version, current) }, openGraph: { title, url: href(version, current), siteName: 'Firestar Granite', images: [{ url: '/assets/firestar/photo-005.jpg', width: 800, height: 530, alt: 'Firestar Granite custom kitchen' }] } };
}
export default async function Page({ params }: { params: Promise<Params> }) {
  return <FirestarSite {...resolve(await params)} />;
}
