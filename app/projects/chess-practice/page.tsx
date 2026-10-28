import type { Metadata } from 'next';
import ChessPractice from './ChessPractice';
export const metadata: Metadata = {
  title: 'Chess Practice',
  description: 'Unlimited chess puzzles that grow with you. Build your tactical skill, track your puzzle rating, and save your progress across devices.',
  alternates: { canonical: '/projects/chess-practice/' },
  openGraph: { title: 'Chess Practice', description: 'One position. A better player, one puzzle at a time.', url: '/projects/chess-practice/', type: 'website' },
};
export default function Page() { return <ChessPractice />; }
