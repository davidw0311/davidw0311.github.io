import type { Metadata } from 'next';
import ChessRooms from './ChessRooms';
export const metadata: Metadata = { title: 'Chess Rooms', description: 'Play chess with a friend in a private two-player room. Choose your colors, set piece handicaps, and agree to takebacks.', alternates: { canonical: '/projects/chess-practice/rooms/' } };
export default function Page() { return <ChessRooms />; }
