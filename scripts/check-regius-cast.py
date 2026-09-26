"""Offline English transcript QA, cached by audio + expected text; flags need review."""
import difflib
import hashlib
import json
import math
from pathlib import Path
import re
import unicodedata

import mlx_whisper
import soundfile as sf
from scipy.signal import resample_poly

ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'data/regiusDramaSpeechCheck.json'

def words(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    return re.findall(r'[a-z0-9]+',s)

def main():
    cache=json.loads((ROOT/'data/regiusDramaGeneration.json').read_text())
    checked=json.loads(TARGET.read_text()) if TARGET.exists() else {}
    for key,clip in cache['clips'].items():
        fingerprint=hashlib.sha256((clip['audioHash']+clip['text']).encode()).hexdigest()
        if checked.get(key,{}).get('fingerprint')==fingerprint: continue
        audio,sr=sf.read(ROOT/'public'/clip['src'].lstrip('/'),dtype='float32')
        g=math.gcd(sr,16000)
        result=mlx_whisper.transcribe(resample_poly(audio,16000//g,sr//g),path_or_hf_repo=str(Path.home()/'.local/share/qwen3-tts/whisper-small'),language='en',condition_on_previous_text=False,temperature=0.,verbose=None)
        heard=result['text'].strip(); expected=words(clip['text']); actual=words(heard)
        score=round(difflib.SequenceMatcher(None,expected,actual,autojunk=False).ratio(),3)
        checked[key]={'fingerprint':fingerprint,'expected':clip['text'],'heard':heard,'similarity':score}
        temp=TARGET.with_suffix('.partial.json');temp.write_text(json.dumps(checked,ensure_ascii=False,indent=2)+'\n');temp.replace(TARGET)
        print(key,score,heard if score<.9 else '',flush=True)
    print('Transcript QA complete. Review proper names and any flagged differences.',flush=True)

if __name__=='__main__': main()
