import type { TestContext } from "node:test";
export function fakeAudioContext(t: TestContext, rejectResume = false) {
  const original = Object.getOwnPropertyDescriptor(globalThis,"AudioContext");
  const gains: {value:number; cancelScheduledValues:()=>void; setTargetAtTime:(value:number)=>void}[]=[];
  const sources: unknown[]=[];
  let closed=0, resumes=0;
  class Context {
    currentTime=1; destination={};
    createGain() { const gain={value:1,cancelScheduledValues(){},setTargetAtTime(value:number){this.value=value;}};gains.push(gain);return {gain,connect(){},disconnect(){}}; }
    createDynamicsCompressor(){return {connect(){},disconnect(){},threshold:{value:0},knee:{value:0},ratio:{value:0},attack:{value:0},release:{value:0}};}
    createMediaElementSource(media:unknown){sources.push(media);return {connect(){},disconnect(){}};}
    resume(){resumes++;return rejectResume ? Promise.reject(new Error("Audio context interrupted")) : Promise.resolve();}
    close(){closed++;return Promise.resolve();}
  }
  Object.defineProperty(globalThis,"AudioContext",{configurable:true,value:Context});
  t.after(()=>{if(original)Object.defineProperty(globalThis,"AudioContext",original);else Reflect.deleteProperty(globalThis,"AudioContext");});
  return {gains,sources,closed:()=>closed,resumes:()=>resumes};
}
