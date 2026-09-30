import type { Metadata } from 'next';
import Flyover from './Flyover';
export const metadata: Metadata = { title: 'Kitchen Flyover — InfiniteGranite', description: 'Explore a live 3D kitchen with a smooth camera loop. Compare countertop slabs, cupboard colours, floors, and day or night lighting.', alternates: { canonical: '/projects/infinite-granite/flyover/' } };
export default function Page() { return <Flyover />; }
