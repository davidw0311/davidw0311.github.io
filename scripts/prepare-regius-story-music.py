"""Build full-length, licensed tracks for the first story's music selector."""
from pathlib import Path
import json
from hashlib import sha256
from math import gcd
from urllib.request import urlopen
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
keep=['vopna','blood-eagle','gjallar','hymn-to-the-gods','the-northern-path','vetur-frosti']
catalog={t['id']:t for t in json.loads(Path('data/regiusAuditionMusic.json').read_text())}
tracks=[]
for slug in keep:
    track=catalog[slug]
    source=Path('/tmp') / f'regius-{slug}-source.mp3'
    if not source.exists():
        with urlopen(track['source'],timeout=90) as response: source.write_bytes(response.read())
    assert sha256(source.read_bytes()).hexdigest()==track['sourceSha256']
    audio,rate=sf.read(source,dtype='float32',always_2d=True)
    audio=audio.mean(axis=1)
    divisor=gcd(rate,24000)
    audio=resample_poly(audio,24000//divisor,rate//divisor)
    audio*=min(.11/np.sqrt(np.mean(audio*audio)),.7/np.max(np.abs(audio)))
    audio[:24000]*=np.linspace(0,1,24000)
    audio[-48000:]*=np.linspace(1,0,48000)
    src=f'/audio/codex-regius/music/selection-v1/{slug}.mp3'
    output=Path('public'+src);output.parent.mkdir(parents=True,exist_ok=True)
    sf.write(output,audio,24000,format='MP3',subtype='MPEG_LAYER_III')
    tracks.append({'id':slug,'title':track['name'],'url':track['url'],'src':src,'duration':len(audio)/24000})
    print(track['name'],round(len(audio)/24000),flush=True)
Path('data/regiusStoryMusic.json').write_text(json.dumps(tracks,indent=2,ensure_ascii=False)+'\n')
# Narrow the audition menu to the user's retained tracks, preserving their files.
Path('data/regiusAuditionMusic.json').write_text(json.dumps([catalog[slug] for slug in keep],indent=2,ensure_ascii=False)+'\n')
