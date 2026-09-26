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
// Calls describe the physical wake group, not only an internal role id.
Object.assign(texts, {
 'role-werewolf': ['Werewolves, including Alpha and Mystic Wolves, open your eyes. Dream Wolf, keep your eyes closed; you do not need to use your phone. Awake wolves, follow your screen.', '狼人、狼王和秘术狼，请睁眼。梦狼请保持闭眼，无需操作手机。睁眼的狼人，请根据屏幕提示行动。'],
 'role-vampire': ['Vampire, Master and Count, open your eyes. Follow your screens to choose a mark together.', '吸血鬼、吸血鬼领主和伯爵，请一起睁眼。请根据屏幕提示共同选择标记对象。'],
 'role-alien': ['Aliens, including Synthetic Alien, Groob, Zerb and Body Snatcher, open your eyes. Follow your screens.', '外星人、合成外星人、古鲁布、泽尔布和夺身者，请一起睁眼。请根据屏幕提示行动。'],
 'role-markReview': ['Everyone, open your eyes and privately read your mark on your phone. If you have Fear, stay asleep for the rest of the night. Confirm after reading, then wait for the closing announcement.', '请所有玩家睁眼，私下查看手机上的印记。有恐惧标记的玩家，此后整夜请保持闭眼。读完后请确认，并等待闭眼播报。'],
 'role-empath': ['Empath, open your eyes and read the answers on your screen. Everyone else, keep your eyes closed. The app has recorded the truthful answers; you do not need to respond.', '共情者，请睁眼并查看屏幕上的回答。其他玩家请保持闭眼。应用已根据记录提供真实回答，无需操作。'],
 'role-doppelganger': ['Doppelgänger, open your eyes. Copy a role and finish any immediate action on your screen. Later, follow your copied role unless your screen directs you to a separate copied-role call.', '化身幽灵，请睁眼。复制身份，并完成屏幕提示的即时行动。之后跟随复制身份行动；若屏幕提示另有复制身份专属环节，请等待该环节。'],
});
const late = new Set(['insomniac','revealer','curator','count','renfield','priest','assassin','apprenticeAssassin','marksman','pickpocket','gremlin','auraSeer','squire','beholder','apprenticeTanner','groob','zerb','oracle','leader','psychic','rascal','exposer','blob','mortician','empath','nostradamus']);
for (const file of ['core-roles','expansion-roles']) for (const role of JSON.parse(await readFile(`api/src/one-night/${file}.json`,'utf8'))) if(late.has(role.id)) texts[`copied-${role.id}`] = [
 `Only the Doppelgänger who copied ${role.name.en}, open your eyes. The original ${role.name.en} stays asleep. Follow your screen.`,
 `仅复制了${role.name.zh}的化身幽灵，请睁眼。原本的${role.name.zh}请保持闭眼。请根据屏幕提示行动。`,
];
await writeFile(path,JSON.stringify(texts,null,2)+'\n');
