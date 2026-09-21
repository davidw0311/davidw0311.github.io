export type AuditionStatus = "idle" | "loading" | "playing" | "paused" | "finished" | "error";
export type AuditionMedia = {
 src: string; currentTime: number;
 play(): Promise<void>; pause(): void; load(): void; removeAttribute(name: string): void;
 onended: ((event: Event) => void) | null; onerror: ((event: Event) => void) | null;
};
/** One voice and one accompaniment maximum, including during rapid preview changes. */
export class AuditionPlayer {
 private token = 0;
 private attempt = 0;
 private status: AuditionStatus = "idle";
 private selected: AuditionMedia[] = [];
 private voice: AuditionMedia;
 private music: AuditionMedia;
 private prepare: (music: boolean) => Promise<void>;
 private report: (status: AuditionStatus) => void;
 constructor(voice: AuditionMedia, music: AuditionMedia, prepare: (music: boolean) => Promise<void>, report: (status: AuditionStatus) => void) {this.voice=voice;this.music=music;this.prepare=prepare;this.report=report;}
 private update(status: AuditionStatus) { this.status=status; this.report(status); }
 private reset() {
  this.token++; this.attempt++;
  for(const media of [this.voice,this.music]) {media.onended=null;media.onerror=null;media.pause();media.removeAttribute("src");media.load();}
 }
 start(voiceSrc?: string, musicSrc?: string) {
  this.reset(); this.selected=[];
  if(voiceSrc) {this.voice.src=voiceSrc;this.selected.push(this.voice);}
  if(musicSrc) {this.music.src=musicSrc;this.selected.push(this.music);}
  if(!this.selected.length) {this.update("idle");return;}
  const token=this.token;
  const end=()=>{if(token===this.token){this.reset();this.update("finished");}};
  const error=()=>{if(token===this.token){this.reset();this.update("error");}};
  for(const media of this.selected) {media.load();media.onerror=error;}
  (voiceSrc?this.voice:this.music).onended=end;
  this.play();
 }
 private play() {
  const token=this.token, attempt=++this.attempt;
  this.update("loading");
  try {
   // Start both elements in the click gesture, before any await, for mobile playback.
   const ready=this.prepare(this.selected.includes(this.music));
   void Promise.all([ready,...this.selected.map(media=>media.play())]).then(()=>{
    if(token===this.token&&attempt===this.attempt&&this.status==="loading")this.update("playing");
   }).catch(()=>{if(token===this.token&&attempt===this.attempt&&this.status!=="paused"){this.reset();this.update("error");}});
  }catch{this.reset();this.update("error");}
 }
 pause() {if(this.status!=="playing"&&this.status!=="loading")return;this.attempt++;for(const media of this.selected)media.pause();this.update("paused");}
 resume() {if(this.status==="paused")this.play();}
 stop() {this.reset();this.selected=[];this.update("idle");}
 dispose() {this.reset();this.selected=[];}
}
