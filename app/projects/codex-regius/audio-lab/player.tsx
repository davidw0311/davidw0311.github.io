"use client";
import {useEffect,useRef,useState} from "react";
import {Play,Pause,Stop,Check,Copy} from "@phosphor-icons/react";
import {AuditionPlayer,type AuditionStatus} from "@/lib/regiusAuditionPlayer";
import {narrationAudioSession,type AudioSessionLike} from "@/lib/regiusAudioSession";
import styles from "./auditions.module.css";

type Choice={id:string;name:string;description:string;src:string;duration:number;url?:string};
type Selection={voice:string;music:string;volume:number;notes:string};
const storage="regius-audition-choices-v1";
export function AudioAuditions({paragraph,voices,music}:{paragraph:string;voices:Choice[];music:Choice[]}) {
 const [selection,setSelection]=useState<Selection>({voice:voices[0].id,music:music[0].id,volume:.12,notes:""});
 const [status,setStatus]=useState<AuditionStatus>("idle");
 const [kind,setKind]=useState("Opening paragraph");
 const [now,setNow]=useState("Choose a voice or soundtrack to begin.");
 const [ready,setReady]=useState(false),[saved,setSaved]=useState(false),[copied,setCopied]=useState("");
 const voiceElement=useRef<HTMLAudioElement>(null),musicElement=useRef<HTMLAudioElement>(null);
 const player=useRef<AuditionPlayer|null>(null),context=useRef<AudioContext|null>(null),gain=useRef<GainNode|null>(null),volume=useRef(.12);
 useEffect(()=>{
  const voice=voiceElement.current!,track=musicElement.current!;
  const session=narrationAudioSession(()=>(navigator as Navigator&{audioSession?:AudioSessionLike}).audioSession);
  player.current=new AuditionPlayer(voice,track,async hasMusic=>{
   session.acquire();
   if(hasMusic){
    if(!context.current){context.current=new AudioContext();gain.current=context.current.createGain();context.current.createMediaElementSource(track).connect(gain.current);gain.current.connect(context.current.destination);}
    gain.current!.gain.value=volume.current;
    await context.current.resume();
   }
  },next=>{setStatus(next);if(["idle","finished","error"].includes(next))session.release();});
  const frame=requestAnimationFrame(()=>{
   try{
    const value=JSON.parse(localStorage.getItem(storage)??"null");
    if(value){const restored={voice:voices.some(v=>v.id===value.voice)?value.voice:voices[0].id,music:music.some(m=>m.id===value.music)?value.music:music[0].id,volume:typeof value.volume==="number"&&Number.isFinite(value.volume)?Math.max(0,Math.min(.4,value.volume)):.12,notes:typeof value.notes==="string"?value.notes.slice(0,2000):""};setSelection(restored);volume.current=restored.volume;setSaved(true);}
   }catch{/* Optional local preferences. */}
   setReady(true);
  });
  const leave=()=>player.current?.stop();window.addEventListener("pagehide",leave);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener("pagehide",leave);player.current?.dispose();player.current=null;session.release();if(context.current)void context.current.close();context.current=null;gain.current=null;};
 },[voices,music]);
 const selectedVoice=voices.find(v=>v.id===selection.voice)!;
 const selectedMusic=music.find(m=>m.id===selection.music)!;
 const summary=`Völuspá audio choice\nVoice ${String(voices.indexOf(selectedVoice)+1).padStart(2,"0")}: ${selectedVoice.name}\nMusic ${String(music.indexOf(selectedMusic)+1).padStart(2,"0")}: ${selectedMusic.name}\nMusic volume: ${Math.round(selection.volume*100)}%${selection.notes?`\nNotes: ${selection.notes}`:""}`;
 function choose(update:Partial<Selection>){
  const next={...selection,...update};setSelection(next);volume.current=next.volume;
  if(gain.current&&context.current)gain.current.gain.setTargetAtTime(next.volume,context.current.currentTime,.05);
  try{localStorage.setItem(storage,JSON.stringify(next));setSaved(true);}catch{setSaved(false);}
 }
 function preview(voice?:Choice,track?:Choice){setKind(voice?"Opening paragraph":"Music excerpt");setNow([voice?.name,track?.name].filter(Boolean).join(" + "));player.current?.start(voice?.src,track?.src);}
 const active=["loading","playing","paused"].includes(status);
 return <>
  <audio ref={voiceElement} preload="none"/><audio ref={musicElement} preload="none"/>
  <section className={styles.transport} aria-label="Audition player">
   <div className={styles.transportTitle}><strong>{active?now:status==="finished"?"Sample complete":status==="error"?"Audio could not play":"Your pairing"}</strong><span role="status">{status==="error"?"Try the sample again. Check your phone’s audio output if it is silent.":active?`${status==="paused"?"Paused":status==="loading"?"Loading":"Playing"} · ${kind}`:`${selectedVoice.name} + ${selectedMusic.name}`}</span></div>
   <div className={styles.controls}><button className={styles.primary} disabled={!ready} onClick={()=>preview(selectedVoice,selectedMusic)}><Play size={17}/>Play pairing</button>{active&&<><button onClick={()=>status==="paused"?player.current?.resume():player.current?.pause()}>{status==="paused"?<Play size={17}/>:<Pause size={17}/>} {status==="paused"?"Resume":"Pause"}</button><button aria-label="Stop preview" onClick={()=>player.current?.stop()}><Stop size={17}/></button></>}</div>
   <label className={styles.volume}>Music level <input type="range" min="0" max=".4" step=".01" aria-label="Music level" value={selection.volume} onChange={e=>choose({volume:Number(e.target.value)})}/><span>{Math.round(selection.volume*100)}%</span></label>
  </section>
  <details className={styles.passage}><summary>The passage you’ll hear</summary><p>{paragraph}</p></details>
  <p className={styles.guide}>Preview each option on its own, then select a voice and music to hear them together. Choices are saved on this device; the published story stays unchanged.</p>
  <nav className={styles.jumpLinks} aria-label="Audition sections"><a href="#voices-heading">Voices</a><a href="#music-heading">Music</a><a href="#selection-heading">Your selection</a></nav>
  <div className={styles.columns}>
   <section aria-labelledby="voices-heading"><h2 id="voices-heading">Find the voice</h2><p className={styles.sectionIntro}>The same words, ten different tellers. All voices are AI generated at their natural pitch and pace.</p>
    <div className={styles.options} role="radiogroup" aria-label="Reading voice">{voices.map((voice,i)=><div className={styles.option} key={voice.id} data-selected={selection.voice===voice.id}>
     <label><input type="radio" name="voice" value={voice.id} checked={selection.voice===voice.id} onChange={()=>choose({voice:voice.id})}/><span className={styles.number}>{String(i+1).padStart(2,"0")}</span><span><strong>{voice.name}</strong><small>{voice.description}</small></span>{selection.voice===voice.id&&<Check className={styles.check} size={17} aria-hidden="true"/>}</label>
     <button disabled={!ready} onClick={()=>preview(voice)} aria-label={`Preview voice ${i+1}: ${voice.name}`}><Play size={15}/>Listen <span>{Math.round(voice.duration)}s</span></button>
    </div>)}</div>
   </section>
   <section aria-labelledby="music-heading"><h2 id="music-heading">Set the atmosphere</h2><p className={styles.sectionIntro}>Ten 60-second excerpts, balanced to the same quiet level. Turn up Music level to inspect the details.</p>
    <div className={styles.options} role="radiogroup" aria-label="Background music">{music.map((track,i)=><div className={styles.option} key={track.id} data-selected={selection.music===track.id}>
     <label><input type="radio" name="music" value={track.id} checked={selection.music===track.id} onChange={()=>choose({music:track.id})}/><span className={styles.number}>{String(i+1).padStart(2,"0")}</span><span><strong>{track.name}</strong><small>{track.description}</small></span>{selection.music===track.id&&<Check className={styles.check} size={17} aria-hidden="true"/>}</label>
     <div className={styles.optionFooter}><button disabled={!ready} onClick={()=>preview(undefined,track)} aria-label={`Preview music ${i+1}: ${track.name}`}><Play size={15}/>Listen <span>60s</span></button><a href={track.url} target="_blank" rel="noreferrer">Track & credit ↗</a></div>
    </div>)}</div>
   </section>
  </div>
  <section className={styles.selection} aria-labelledby="selection-heading"><h2 id="selection-heading">Your selection</h2><p>{saved?"Saved on this device. Copy your choice and send it to me when you’re ready.":"Copy your choice and send it to me when you’re ready."}</p><label>Listening notes<textarea value={selection.notes} maxLength={2000} placeholder="What you like, or anything you’d change…" onChange={e=>choose({notes:e.target.value})}/></label><pre>{summary}</pre><button onClick={async()=>{try{await navigator.clipboard.writeText(summary);setCopied(summary);}catch{setCopied("unavailable");}}}><Copy size={17}/>{copied===summary?"Copied":"Copy selection"}</button>{copied==="unavailable"&&<p role="status">Copy isn’t available in this browser. Select and copy the text above.</p>}</section>
  <footer className={styles.credits}><p>All music by <a href="https://creatorchords.com" target="_blank" rel="noreferrer">Alexander Nakarada</a>, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Track links above identify each original. Excerpts start at 0:10 and are trimmed, faded, converted to mono, and level-matched for this draft.</p><p>This is a listening preview, not a change to the story. Only the opening paragraph is recorded here.</p></footer>
 </>;
}
