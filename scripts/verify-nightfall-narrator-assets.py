"""Validate every generated recording and the existing narration time budgets."""
import json
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'public/assets/nightfall/narrators'
catalogue=json.loads((FOLDER/'catalogue.json').read_text())
manifest=json.loads((FOLDER/'manifest.json').read_text())
fill=json.loads((FOLDER/'kokoro-manifest.json').read_text())
expected={f'{voice["id"]}:{line}' for voice in catalogue['narrators'] for line in catalogue['lines']}
assert set(manifest['clips'])==expected,'Incomplete six-voice library'
assert set(fill['clips'])==set(catalogue['lines'])-set(catalogue['kokoro']),'Incomplete Kokoro fill'
for key,clip in {**manifest['clips'],**fill['clips']}.items():
    a,sr=sf.read(ROOT/'public'/clip['src'].lstrip('/'),dtype='float32')
    assert np.isfinite(a).all() and float(np.max(np.abs(a)))>.005,key
    assert abs(len(a)/sr-clip['duration'])<.02,key
    assert float(np.max(np.abs(a)))<1.05,f'Clipping: {key}'
    assert len(a)/sr>.25,key
maximum=0
for voice in catalogue['narrators']:
    duration=lambda game,cue:manifest['clips'][f'{voice["id"]}:{catalogue["games"][game][cue]}']['duration']
    for game in ['werewolf','one-night']:
        for cue in catalogue['games'][game]:
            value=duration(game,cue);maximum=max(maximum,value)
            assert value<27,f'Clip exceeds safe single-call budget: {voice["id"]}:{game}:{cue}'
        closing='role-sleep' if game=='werewolf' else 'close'
        assert duration(game,closing)<10,f'Closing narration exceeds budget: {voice["id"]}'
    # Conservative bound: any One Night role may follow the initial night cue.
    for cue in catalogue['games']['one-night']:
        if cue.startswith(('role-','copied-')):
            assert duration('one-night','night')+duration('one-night',cue)<28,f'Opening exceeds 30s fallback budget: {voice["id"]}:{cue}'
print(json.dumps({'newVoiceClips':len(expected),'kokoroFill':len(fill['clips']),'maxClipSeconds':maximum,'allAudioDecoded':True,'narrationBudgetsSafe':True}))
