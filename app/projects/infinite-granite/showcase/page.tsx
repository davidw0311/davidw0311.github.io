import type {Metadata} from 'next';
import Showcase from './Showcase';
export const metadata:Metadata={title:'Slab Studio — InfiniteGranite',description:'Compare countertop slabs and cupboard colours in a photorealistic fixed kitchen scene.',alternates:{canonical:'/projects/infinite-granite/showcase/'}};
export default function Page(){return <Showcase/>;}
