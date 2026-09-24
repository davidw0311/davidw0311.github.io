// Static Brian recordings. Credentials exist only in this process, never in generated assets.
// Run with Node 24 and authenticated Azure CLI; afinfo (macOS) or ffprobe is required.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
const voice = 'en-US-BrianMultilingualNeural';
const region = process.env.AZURE_SPEECH_REGION || 'southeastasia';
const directory = 'public/assets/werewolf/audio';
const cues = {
  ...JSON.parse(await readFile('public/assets/werewolf/announcement-text.json', 'utf8')),
  'nobody-silenced': ['Nobody is silenced today.', '今日无人被禁言。'],
  silencer: ['Silencing Elder, open your eyes. Choose a player to silence tomorrow, or skip. Everyone else, keep your eyes closed.', '禁言长老请睁眼。请选择明天禁言的玩家，或选择空过。其他玩家请保持闭眼。'],
  'silenced-today': ['The following seats are silenced today. They may still vote and use abilities.', '以下玩家今日禁言，仍可投票及发动技能。'],
  night: ['Night falls. Everyone, close your eyes. Follow the instructions on your device, and keep your identity secret.', '天黑请闭眼。请根据设备上的提示行动，保守自己的身份秘密。'],
  dawn: ['Day breaks. Everyone, open your eyes. Read the overnight result on your device.', '天亮了，请睁眼。请查看设备上的昨夜结果。'],
  discussion: ['The village may now discuss. Listen carefully, and wait for the host to open the vote.', '现在开始白天讨论。请认真听取发言，等待房主开启投票。'],
  'sheriff-voting': ['Sheriff voting is open. Choose the player you wish to lead the village, or abstain.', '现在开始警长投票。请选择你希望当选警长的玩家，或选择弃票。'],
  voting: ['Voting is open. Choose the player you wish to exile, or abstain. Submit your choice on your device.', '现在开始放逐投票。请选择你要放逐的玩家，或选择弃票，并在设备上提交。'],
  'vote-result': ['Voting is complete. Read the result on your device, and follow any ability prompts.', '投票结束。请查看设备上的投票结果，并按提示发动技能。'],
  'game-over': ['The game is over. Identities may now be revealed. Review the result together.', '游戏结束。现在可以公开身份。请一起查看结果，回顾这场对局。'],
  paused: ['The game is paused. Please wait while the host restores the room.', '游戏已暂停。请等待房主恢复房间。'],
  reaction: ['An ability must be resolved. The affected player should follow the private prompt on their device. Everyone else, please wait.', '现在需要结算一项技能。相关玩家请根据设备上的私密提示行动，其他玩家请稍候。'],
  'role-sleep': ['Your turn is complete. Close your eyes, and remain silent.', '行动结束。请闭眼，并保持安静。'],
  opening: ['Roles with a first-night ability, act now. Follow your private instructions. Everyone else, keep your eyes closed.', '拥有首夜技能的角色，请根据设备上的私密提示行动。其他玩家请保持闭眼。'],
  cupid: ['Cupid, open your eyes. Follow the private instructions on your device to choose two lovers. Everyone else, keep your eyes closed.', '丘比特请睁眼。请根据设备上的私密提示，选择两名情侣。其他玩家请保持闭眼。'],
  wildChild: ['Wild Child, open your eyes. Follow the private instructions on your device to choose your idol. Everyone else, keep your eyes closed.', '野孩子请睁眼。请根据设备上的私密提示，选择你的榜样。其他玩家请保持闭眼。'],
  wolfHound: ['Wolf Hound, open your eyes. Follow the private instructions on your device to choose the village or the wolves. Everyone else, keep your eyes closed.', '狼狗请睁眼。请根据设备上的私密提示，选择好人或狼人阵营。其他玩家请保持闭眼。'],
  thief: ['Thief, open your eyes. Follow the private instructions on your device to choose one of the two offered roles. Everyone else, keep your eyes closed.', '盗贼请睁眼。请根据设备上的私密提示，从提供的两个身份中选择一个。其他玩家请保持闭眼。'],
  mechanicalWolf: ['Mechanical Wolf, open your eyes. Follow the private instructions on your device to choose a player whose role you will copy. Everyone else, keep your eyes closed.', '机械狼请睁眼。请根据设备上的私密提示，选择一名玩家，学习其身份。其他玩家请保持闭眼。'],
  wolves: ['Werewolves, open your eyes. Choose your target on your device. Everyone else, keep your eyes closed.', '狼人请睁眼。请在设备上选择今晚的目标。其他玩家请保持闭眼。'],
  guard: ['Guard, open your eyes. Choose the player you wish to protect.', '守卫请睁眼。请选择今晚要守护的玩家。'],
  magician: ['Magician, open your eyes. Follow your private prompt to exchange two players, or pass.', '魔术师请睁眼。请按私密提示交换两名玩家，或选择跳过。'],
  dreamweaver: ['Dreamweaver, open your eyes. Choose the player who will enter your dream.', '摄梦人请睁眼。请选择今晚的梦游者。'],
  seer: ['Seer, open your eyes. Choose a player to investigate, and read your result privately.', '预言家请睁眼。请选择要查验的玩家，并私下查看结果。'],
  pureWhite: ['Pure White, open your eyes. Choose a player to investigate.', '纯白之女请睁眼。请选择要查验的玩家。'],
  wolfWitch: ['Wolf Witch, open your eyes. Follow the private ability prompt on your device.', '狼巫请睁眼。请根据设备上的私密技能提示行动。'],
  gargoyle: ['Gargoyle, open your eyes. Choose a player to investigate.', '石像鬼请睁眼。请选择要查验的玩家。'],
  witch: ['Witch, open your eyes. Read your private information, then choose whether to use a potion.', '女巫请睁眼。请查看私密信息，然后决定是否使用药水。'],
  wolfBeauty: ['Wolf Beauty, open your eyes. Choose a player to charm.', '狼美人请睁眼。请选择要魅惑的玩家。'],
  raven: ['Raven, open your eyes. Choose a player to mark.', '乌鸦请睁眼。请选择要诅咒的玩家。'],
  gravekeeper: ['Gravekeeper, open your eyes. Read the private information on your device.', '守墓人请睁眼。请查看设备上的私密信息。'],
  demonHunter: ['Demon Hunter, open your eyes. Follow the private prompt to hunt, or pass.', '猎魔人请睁眼。请根据私密提示选择狩猎，或跳过。'],
  piper: ['Piper, open your eyes. Choose the players you wish to enchant.', '吹笛者请睁眼。请选择要迷惑的玩家。'],
  bloodMoonApostle: ['Blood Moon Apostle, open your eyes. Follow the private ability prompt on your device.', '血月使徒请睁眼。请根据设备上的私密技能提示行动。'],
};
Object.assign(cues, {
  'day-deaths': ['The following seats have been eliminated.', '以下玩家已出局：'],
  'night-deaths': ['Last night, the following seats were eliminated.', '昨夜出局的玩家是：'],
  'peaceful-night': ['Nobody died last night. It was a peaceful night.', '昨夜是平安夜，无人出局。'],
  'sheriff-elected': ['The village has elected its sheriff.', '本届警长是：'],
  'sheriff-none': ['No sheriff was elected. There is no badge this game.', '本局没有选出警长，不设警徽。'],
  'sheriff-nomination': ['Keep last night’s results secret. Everyone, choose whether to run for sheriff on your device.', '暂不公布昨夜结果。所有玩家请在设备上选择是否上警。'],
  'sheriff-discussion': ['Sheriff candidates speak in seat order. Tap finished when your speech is over. You may withdraw, but candidates who withdraw cannot vote.', '警长候选人按座位顺序发言。发言结束后请点击完成。可以退水，但退水玩家不能投票。'],
});
for (let number = 1; number <= 24; number++) cues[`seat-${number}`] = [`Seat ${number}.`, `${number}号。`];
const selected = process.argv.find(arg => arg.startsWith('--cue='))?.slice(6);
if (selected && !(selected in cues)) throw new Error('Unknown cue.');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const durationOf = file => process.platform === 'darwin' ? Number(execFileSync('afinfo', [file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).match(/estimated duration: ([\d.]+)/)?.[1]) : Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim());
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
await mkdir(directory, { recursive: true });
let key = process.env.AZURE_SPEECH_KEY;
if (!key) {
  try { key = JSON.parse(execFileSync('az', ['cognitiveservices', 'account', 'keys', 'list', '--name', 'SpeechLab', '--resource-group', 'SpeechLab', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })).key1; }
  catch { throw new Error('Azure Speech credentials unavailable. Authenticate Azure CLI or provide AZURE_SPEECH_KEY.'); }
}
if (!key) throw new Error('Azure Speech key is missing.');
const voiceResponse = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`, { headers: { 'Ocp-Apim-Subscription-Key': key }, signal: AbortSignal.timeout(30000) });
if (!voiceResponse.ok) throw new Error(`Voice lookup failed (HTTP ${voiceResponse.status}).`);
const chosenVoice = (await voiceResponse.json()).find(item => item.ShortName === voice);
if (!chosenVoice || !chosenVoice.SecondaryLocaleList?.some(locale => locale.toLowerCase() === 'zh-cn')) throw new Error('Brian multilingual with Chinese support unavailable in this region.');
let manifest = { voice, provider: 'Microsoft Azure AI Speech', music: { src: '/assets/werewolf/audio/night-ambience.wav', title: 'Moonlit clearing', creator: 'Original procedural composition for Werewolf' }, clips: {} };
try { manifest = { ...manifest, ...JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8')), voice }; } catch { /* First generation. */ }
let lastRequest = 0;
for (const [cue, translations] of Object.entries(cues)) {
  if (selected && selected !== cue) continue;
  for (const [i, language] of ['en', 'zh'].entries()) {
    const locale = language === 'en' ? 'en-US' : 'zh-CN';
    const text = translations[i];
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}"><voice name="${voice}"><lang xml:lang="${locale}"><prosody rate="-8%">${escape(text)}</prosody></lang></voice></speak>`;
    const textHash = createHash('sha256').update(ssml).digest('hex');
    const src = `/assets/werewolf/audio/${language}/${cue}.mp3`;
    const file = path.join('public', src);
    await mkdir(path.dirname(file), { recursive: true });
    const previous = manifest.clips[`${language}:${cue}`];
    let duration = 0;
    if (previous?.textHash === textHash) {
      try { if ((await stat(file)).size > 1000) duration = durationOf(file); } catch { /* Regenerate incomplete clip. */ }
    }
    if (!(duration > 0)) {
      await delay(Math.max(0, 3400 - (Date.now() - lastRequest)));
      let response;
      for (let attempt = 0; attempt < 4; attempt++) {
        lastRequest = Date.now();
        response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3' }, body: ssml, signal: AbortSignal.timeout(60000) });
        if (response.ok || ![429, 503].includes(response.status)) break;
        await response.arrayBuffer();
        await delay(5000 * (attempt + 1));
      }
      if (!response?.ok) throw new Error(`Speech generation failed (HTTP ${response?.status}). Completed clips are cached.`);
      const temporary = `${file}.partial`;
      await writeFile(temporary, Buffer.from(await response.arrayBuffer()));
      duration = durationOf(temporary);
      if (!(duration > 0 && duration < 45)) throw new Error('Unexpected audio duration.');
      await rename(temporary, file);
    }
    manifest.clips[`${language}:${cue}`] = { src, text, duration, textHash };
    await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`${language}/${cue}: ${duration.toFixed(2)}s`);
  }
}
console.log(`Moderator audio ready: ${Object.keys(manifest.clips).length} recordings, ${voice}.`);
