import type { Metadata } from 'next';
import InfiniteGranite from './InfiniteGranite';

export const metadata: Metadata = {
  title: 'InfiniteGranite — Kitchen design studio',
  description: 'An interactive 3D kitchen studio. Explore six layouts, compare countertop materials, cupboard colours and sinks, and arrange your own kitchen on phone or desktop.',
  alternates: { canonical: '/projects/infinite-granite/' },
  openGraph: { title: 'InfiniteGranite', description: 'Find the kitchen that feels like you. An interactive 3D kitchen design studio.', url: '/projects/infinite-granite/', images: [] },
};
export default function InfiniteGranitePage() { return <InfiniteGranite />; }
