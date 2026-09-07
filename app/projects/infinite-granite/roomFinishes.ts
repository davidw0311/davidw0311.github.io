export const FLOOR_FINISHES = [
 {id:'oak',name:'White oak',color:'#d4c7b0',format:'plank'},
 {id:'walnut',name:'Walnut',color:'#746158',format:'plank'},
 {id:'maple',name:'Natural maple',color:'#e3cba4',format:'plank'},
 {id:'vinyl',name:'Wood-look vinyl',color:'#b3a594',format:'plank'},
 {id:'tile',name:'Porcelain tile',color:'#ccceca',format:'tile'},
 {id:'marble',name:'Marble tile',color:'#e8e6e0',format:'tile'},
 {id:'slate',name:'Slate tile',color:'#586063',format:'tile'},
 {id:'checker',name:'Checkerboard tile',color:'#e6e2d8',format:'tile'},
] as const;
export const WALL_FINISHES=[{id:'paint',name:'Painted drywall'},{id:'tile',name:'Subway tile'},{id:'panel',name:'Vertical paneling'},{id:'plaster',name:'Limewash plaster'}] as const;
export type FloorFinish=typeof FLOOR_FINISHES[number]['id'];
export type WallFinish=typeof WALL_FINISHES[number]['id'];
