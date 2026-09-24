# One Night engine contract

The separate One Night endpoint and HTTP session/auth contract match the existing Werewolf service; root maintains exact endpoint documentation. Engine exports `createRoom`, `applyCommand`, `publicView`, `tickRoom`, `recoverHost`. Commands are atomic: failures leave state unchanged.

Public view: `code,revision,status,isHost,hostSeatId,settings,roleDeck,seats,requests,myRequest,me,phase,events,result,pendingVoterIds`. Status: lobby / playing / finished / disbanded. Every seat: `id,number,name,photo,ready,connected,occupied,isHost`; `revealedRoleId` only when public power reveals it, final `roleId` only after results. Requests visible to host as `id,name`.

`me={seatId,roleId,originalRoleId,ready,knowledge:[{id,text:{en,zh}}],action}`. `roleId` is the originally dealt role, never an automatically refreshed current card. An originalRole copied into a new role may be reported privately in knowledge. Current-card tracking stays server-only. Private knowledge contains snapshots from the moment inspected; card swaps do not update prior observations.

`phase={id,kind,step,roleId?,nightStage?,cueIds:[],deadline?}`. Kinds: lobby, ready, night, discussion, voting, finished. Night stages: opening, acting, closing. `roleId` is public scheduled role, including absent roles; no pending actor ids/counts are public during night. `nightStage` opening/closing acknowledges narration through host `narrationDone` command or fallback timeout. Active players must explicitly finish; absent roles wait random 7–15 seconds. Host `hardSkip` can advance without seeing identities.

`me.action={id,roleId,prompt:{en,zh},targets:[{id,label:{en,zh}}],min,max,canSkip,options?:[{id,label:{en,zh}}]}`. Generic interface chooses targets and optional choice. Target ids: seat UUIDs or `center:0`, `center:1`, `center:2`, optionally `center:3` for Alpha Wolf. `act` request: `{type:'act',expectedPhaseId:phase.id,actionId:action.id,targets:[...],choice?,skip?}`. `phaseId` alias accepted. Some abilities use multiple actions; refresh descriptor after each. Choice-only actions have no targets. Skip is rejected if mandatory.

Commands:
- `requestJoin {name}` automatically admits in lobby; otherwise pending host approval.
- `approveJoin {requestId,replaceSeatId}` replaces existing occupied/vacant seat during game, preserving seat/card/knowledge/action. New seats allowed in lobby only.
- `rejectJoin {requestId}`, `leave`, `addSeat {name}`, `removeSeat {seatId}`, `reorderSeats {seatIds}` (lobby only), `profile {photo,name?}`.
- `configure {roleDeck:[roleId...],settings:{discussionSeconds,loneWolf}}` lobby only. Exactly player count+3 cards; Alpha's extra wolf is automatically added outside deck.
- `start` deals and enters ready; `ready` marks own card read; `startNight` host requires all ready.
- `act`, `narrationDone {expectedPhaseId}`, `hardSkip {expectedPhaseId}`.
- `startVote` host from discussion; `vote {targetId,expectedPhaseId}` requires another seat, no abstention; `finishVote` host only once all players vote. Ties >=2 votes eliminate all tied players; all single votes eliminate nobody.
- `rematch` host returns players to lobby, clears game secrets; `disbandRoom` (alias `disband`), `transferHost {seatId}`, `heartbeat`.

Role catalogue is concatenation of `core-roles.json` and `expansion-roles.json`. Each is a JSON array. Role shape `{id,expansion,name:{en,zh},description:{en,zh},icon,team,order,maxCount}`. No-wake order null. Expansions: base/daybreak/vampire/alien/bonus/superVillains. Core maxCount werewolf2, villager3, mason2, others1. Role ids use camelCase.

Results: `{deaths:[seatId],winners:[seatId],counts:{seatId:number},votes:{voterId:targetId},players:[{seatId,roleId,team,mark,artifact,won,died}],center:[{id,roleId}],timeline:[publicly revealed action records]}`. Only populated once final voting resolves.
