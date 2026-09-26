"""Local speech-recognition QA; flags are review candidates, not proof of bad audio.
Requires mlx-whisper, SoundFile, scipy, OpenCC and pypinyin in the local TTS venv.
The report stays outside public assets. It can follow an in-progress generation.
"""
import argparse
from difflib import SequenceMatcher
import json
from math import gcd
from pathlib import Path
import re
import time

import mlx_whisper
import numpy as np
import soundfile as sf
from opencc import OpenCC
from pypinyin import lazy_pinyin
from scipy.signal import resample_poly

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'public/assets/nightfall/narrators'
converter=OpenCC('t2s')
ROLE_VOCABULARY='狼人杀。一夜狼人杀。警长，警徽，机械狼，预言家，女巫，殡葬师，禁言长老，化身幽灵，诺斯特拉达姆士，戈鲁布，泽布，共情者，守墓人，狼巫。'

def number(match):
    n=int(match.group()); digits='零一二三四五六七八九'
    if n<10:return digits[n]
    if n<100:return (digits[n//10] if n>=20 else '')+'十'+(digits[n%10] if n%10 else '')
    return match.group()

def clean(text):
    text=re.sub(r'\d+',number,converter.convert(text))
    return re.sub(r'[^\u4e00-\u9fffA-Za-z0-9]','',text).lower()

def seats(text):
    return re.findall(r'[零一二三四五六七八九十两]+(?=号)',clean(text))

def wrong_seat(expected,heard):
    # ASR may spell 一号 as 以好. Exact whole-phrase phonetic equality
    # preserves the spoken number; a different number still needs review.
    return bool(seats(expected)) and seats(expected)!=seats(heard) and lazy_pinyin(clean(expected))!=lazy_pinyin(clean(heard))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--model',default=str(Path.home()/'.local/share/qwen3-tts/whisper-small'))
    parser.add_argument('--report',required=True)
    parser.add_argument('--watch',action='store_true')
    parser.add_argument('--review-flagged',action='store_true',help='Recheck only flagged clips with a larger local model after the watcher exits.')
    parser.add_argument('--kokoro',action='store_true',help='Check the additional Kokoro recordings instead of the six new voice libraries.')
    args=parser.parse_args(); report_path=Path(args.report)
    assert not (args.watch and args.review_flagged),'Flag review is a single pass'
    report=json.loads(report_path.read_text()) if report_path.exists() else {}
    # Apply stricter number checks to earlier reports without retranscribing.
    for row in report.values():
        row['flags']=[flag for flag in row['flags'] if flag!='seat-number']
        if wrong_seat(row['expected'],row['heard']): row['flags'].append('seat-number')
    if report:
        temp=report_path.with_suffix('.partial.json');temp.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');temp.replace(report_path)
    manifest_path=FOLDER/('kokoro-manifest.json' if args.kokoro else 'manifest.json')
    expected=len(json.loads(manifest_path.read_text())['clips']) if args.kokoro else len(json.loads((FOLDER/'catalogue.json').read_text())['lines'])*6
    while True:
        manifest=json.loads(manifest_path.read_text())
        for clip in manifest['clips'].values(): clip.setdefault('fingerprint',clip.get('textHash'))
        pending=[(key,clip) for key,clip in manifest['clips'].items() if (bool(report.get(key,{}).get('flags')) if args.review_flagged else report.get(key,{}).get('fingerprint')!=clip['fingerprint'] or report.get(key,{}).get('flags') and not report[key].get('vocabularyReview'))]
        for key,clip in pending:
            a,sr=sf.read(ROOT/'public'/clip['src'].lstrip('/'),dtype='float32')
            assert np.isfinite(a).all() and float(np.max(np.abs(a)))>.005,key
            g=gcd(sr,16000); waveform=resample_poly(a,16000//g,sr//g)
            result=mlx_whisper.transcribe(waveform,path_or_hf_repo=args.model,language='zh',condition_on_previous_text=False,temperature=0.0,verbose=None)
            expected_text=clip.get('generationText',clip['text'])
            actual=result['text']; wanted=clean(expected_text); found=clean(actual)
            similarity=SequenceMatcher(None,wanted,found).ratio()
            phonetic=SequenceMatcher(None,lazy_pinyin(wanted),lazy_pinyin(found)).ratio()
            # Rare fictional role names are often misrecognized. A second pass
            # supplies only a fixed game glossary, never the expected sentence.
            if phonetic<.82 and similarity<.82:
                alternate=mlx_whisper.transcribe(waveform,path_or_hf_repo=args.model,language='zh',condition_on_previous_text=False,temperature=0.0,initial_prompt=ROLE_VOCABULARY,verbose=None)['text']
                other=clean(alternate)
                other_score=SequenceMatcher(None,lazy_pinyin(wanted),lazy_pinyin(other)).ratio()
                if other_score>phonetic:
                    actual=alternate;found=other;phonetic=other_score;similarity=SequenceMatcher(None,wanted,found).ratio()
            flags=[]
            if phonetic<.82 and similarity<.82:flags.append('transcript')
            # Opposite wake/sleep words deserve a review even in an otherwise close match.
            if ('睁' in wanted and '闭' in found and '睁' not in found) or ('闭' in wanted and '睁' in found and '闭' not in found):flags.append('wake-sleep')
            if wrong_seat(wanted,found):flags.append('seat-number')
            if clip['duration']<len(wanted)*.065 or clip['duration']>len(wanted)*.65+2:flags.append('duration')
            report[key]={'fingerprint':clip['fingerprint'],'expected':expected_text,'heard':actual,'similarity':round(similarity,3),'phonetic':round(phonetic,3),'flags':flags,'vocabularyReview':True,'reviewModel':Path(args.model).name}
            temp=report_path.with_suffix('.partial.json');temp.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');temp.replace(report_path)
            if flags:print(f'REVIEW {key}: {clip["text"]} -> {actual} ({flags})',flush=True)
            if len(report)%40==0:print(f'Checked {len(report)}/{expected}',flush=True)
        if not args.watch or len(manifest['clips'])==expected and not pending:
            print(f'QA complete: {len(report)} checked; {sum(bool(row["flags"]) for row in report.values())} review candidates',flush=True);return
        time.sleep(3)

if __name__=='__main__':main()
