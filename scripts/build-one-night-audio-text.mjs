import {readFile, writeFile} from 'node:fs/promises';
const path='public/assets/one-night/audio/text.json';
const texts=JSON.parse(await readFile(path,'utf8'));
for(const key of Object.keys(texts)) if(key.startsWith('role-') && !['role-markReview','role-lovers'].includes(key)) delete texts[key];
for(const file of ['core-roles','expansion-roles']) {
 const roles=JSON.parse(await readFile(`api/src/one-night/${file}.json`,'utf8'));
 for(const role of roles) {
  if(role.order===null) continue;
  texts[`role-${role.id}`]=[
   `${role.name.en}, open your eyes. Follow the instructions on your screen.`,
   `${role.name.zh}，请睁眼。请根据屏幕提示完成行动。`,
  ];
 }
}
await writeFile(path,JSON.stringify(texts,null,2)+'\n');
