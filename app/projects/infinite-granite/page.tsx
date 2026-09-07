import type { Metadata } from 'next';
import InfiniteGranite from './InfiniteGranite';

export const metadata: Metadata = {
  title: 'InfiniteGranite — Kitchen & bathroom design studio',
  description: 'An interactive 3D kitchen and bathroom studio. Compare TCE Stone and Vicostone surfaces, customize cupboards and vanities, and arrange fixtures on phone or desktop.',
  alternates: { canonical: '/projects/infinite-granite/' },
  openGraph: { title: 'InfiniteGranite', description: 'Compare surfaces in your kitchen or bathroom. An interactive 3D design studio.', url: '/projects/infinite-granite/', images: [] },
};
export default function InfiniteGranitePage() { return <InfiniteGranite />; }
