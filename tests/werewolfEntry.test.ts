import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRoomCode} from '../lib/werewolfEntry.ts';
test('join accepts pasted codes, whitespace, invitations and legacy codes',()=>{
 for(const [input,expected] of [['moon','MOON'],[' W O L F\n','WOLF'],['https://davidw0311.github.io/werewolf/?room=hunt','HUNT'],['Room code: DUSK','DUSK'],['房间码：MOON','MOON'],['abcdef12','ABCDEF12']]) assert.equal(normalizeRoomCode(input),expected);
});
