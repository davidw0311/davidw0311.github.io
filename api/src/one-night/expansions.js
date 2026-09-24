"use strict";

// Independently implemented from the linked publisher rules. Alien's variable
// pool is deliberately disclosed: it is not the unpublished official app script.
const roles = require("./expansion-roles.json");
const roleMap = Object.fromEntries(roles.map((role) => [role.id, role]));
const ALIENS = ["alien", "syntheticAlien", "groob", "zerb", "bodySnatcher"];
const VILLAINS = ["temptress", "drPeeker", "rapscallion", "henchman"];
const WOLVES = ["werewolf", "alphaWolf", "mysticWolf", "dreamWolf"];
const ORDERS = Object.fromEntries(roles.filter((r) => r.order !== null).map((r) => [r.id, r.order]));
const BONUS_ARTIFACTS = {
  bowOfHunter: { roleId: "hunter", team: "village" },
  cloakOfPrince: { roleId: "prince", team: "village" },
  swordOfBodyguard: { roleId: "bodyguard", team: "village" },
  mistOfVampire: { roleId: "vampire", team: "vampire" },
  alienArtifact: { roleId: "alien", team: "alien" },
  daggerOfTraitor: { traitor: true },
};
const ADAPTATION = {
  en: "Alien uses a disclosed variable-rule selection for each role. The publisher’s full app-only random questions and space-time ripples are not reproduced. Villains count as another hostile faction in mixed epic games. If both a wolf and a vampire vote for Cursed, wolf conversion takes priority.",
  zh: "外星扩展采用逐局公布的技能变体；未复刻官方应用未公开的全部随机问题及时空涟漪。混合史诗局将反派视为另一敌对阵营。若狼人和吸血鬼同时投被诅咒者，优先转为狼人。",
};
const pair = (en, zh) => ({ en, zh });
const seats = (ctx) => ctx.seats || ctx.room.seats;
const actorRole = (seat) => seat.nightRoleId || seat.originalRoleId;
const idsFor = (ctx, accepted) => seats(ctx).filter((s) => accepted.includes(actorRole(s))).map((s) => s.id);
const neighbors = (ctx, id) => {
  const list = seats(ctx);
  const index = list.findIndex((s) => s.id === id);
  if (index < 0 || list.length < 2) return [];
  return [...new Set([list[(index + list.length - 1) % list.length].id, list[(index + 1) % list.length].id])];
};
const seatNumber = (ctx, id) => seats(ctx).find((s) => s.id === id)?.number || seats(ctx).findIndex((s) => s.id === id) + 1;
const listNumbers = (ctx, ids) => ids.length ? ids.map((id) => `#${seatNumber(ctx, id)}`).join(", ") : "—";
const state = (ctx) => ctx.room.expansion || (ctx.room.expansion = {});
const pick = (ctx, values) => values[ctx.randomInt ? ctx.randomInt(0, values.length) : 0];
const fail = (ctx, message) => ctx.fail("INVALID_ACTION", message);
const actualRole = (card) => card?.transformedRoleId || card?.copiedRoleId || card?.roleId;
function catalogue(ctx) { return { ...Object.fromEntries((ctx.roles || []).map((r) => [r.id, r])), ...roleMap }; }
function cardTeam(ctx, card) {
  if (card?.teamOverride) return card.teamOverride;
  const role = actualRole(card);
  if (ALIENS.includes(role)) return role === "syntheticAlien" ? "synthetic" : "alien";
  if (VILLAINS.includes(role)) return "villain";
  if (WOLVES.includes(role) || ["minion", "squire"].includes(role)) return "wolf";
  if (["vampire", "master", "count", "renfield"].includes(role)) return "vampire";
  if (["tanner", "apprenticeTanner"].includes(role)) return "tanner";
  return catalogue(ctx)[role]?.team || "village";
}
function notify(ctx, id, en, zh) {
  const seat = seats(ctx).find((s) => s.id === id);
  if (!seat) return;
  seat.knowledge ||= [];
  seat.knowledge.push({ id: `exp:${ctx.step || ctx.room.phase?.id}:${seat.knowledge.length}`, text: pair(en, zh) });
}
function descriptor(ctx, en, zh, ids = [], min = 0, max = min, canSkip = false, options) {
  const out = { id: `${ctx.room.phase?.id || ctx.step}:${ctx.seat.id}:${ctx.role}:${ctx.data?.stage || 0}:${ctx.data?.seen?.length || 0}`, roleId: ctx.role, prompt: pair(en, zh), targets: ctx.targets(ids), min, max, canSkip };
  if (options) out.options = options.map(([id, a, b]) => ({ id, label: pair(a, b) }));
  return out;
}
function validate(ctx, command, ids, min, max = min) {
  const chosen = Array.isArray(command.targets) ? command.targets : [];
  if (new Set(chosen).size !== chosen.length || chosen.length < min || chosen.length > max || chosen.some((id) => !ids.includes(id))) fail(ctx, "Choose the required number of eligible targets.");
  return chosen;
}
function ordinaryTargets(ctx, includeSelf = false) { return ctx.players(includeSelf).filter((id) => !(ctx.room.shields || []).includes(id)); }
function peekTargets(ctx) { return [...ordinaryTargets(ctx, false), ...ctx.centers()]; }
function identity(ctx, accepted, titleEn, titleZh) {
  const found = idsFor(ctx, accepted).filter((id) => id !== ctx.seat.id);
  ctx.learn(`${titleEn}: ${listNumbers(ctx, found)}.`, `${titleZh}：${listNumbers(ctx, found)}。`);
  return found;
}
function finish(ctx) { ctx.complete(); return true; }

function prepare(ctx) {
  const st = state(ctx);
  const settings = ctx.room.settings || {};
  st.version = 1;
  st.originalCardIds = Object.fromEntries(seats(ctx).map((seat) => [seat.id, ctx.room.cards[seat.id]?.id]));
  st.adaptation = ADAPTATION;
  st.alienVariant = ["recognize", "center", "convert"].includes(settings.alienVariant) ? settings.alienVariant : pick(ctx, ["recognize", "center", "convert"]);
  st.psychicVariant = pick(ctx, ["onePlayer", "twoCenters", "twoPlayers"]);
  st.rascalVariant = pick(ctx, ["swapOthers", "swapSelf", "rotateLeft", "rotateRight", "higher"]);
  st.exposerCount = ctx.randomInt ? ctx.randomInt(1, 4) : 1;
  st.morticianCount = ctx.randomInt ? ctx.randomInt(0, 3) : 2;
  st.blobOffsets = pick(ctx, [[-1], [1], [-1, 1]]);
  st.familyRadius = seats(ctx).length >= 10 ? 3 : seats(ctx).length >= 7 ? 2 : 1;
  st.empathQuestion = pick(ctx, ["viewed", "moved", "evil"]);
  st.empathAnswers = {};
  st.playerAliens = [];
  st.nostradamusTeam = "village";
  st.oracleTeam = "village";
  st.nostradamusTeams = {};
  st.oracleTeams = {};
  const teams = new Set(["village"]);
  Object.values(ctx.room.cards || {}).forEach((card) => { const team = cardTeam(ctx, card); if (["wolf", "vampire", "alien", "villain"].includes(team)) teams.add(team); });
  st.possibleTeams = [...teams];
  st.oracleTeam = pick(ctx, st.possibleTeams);
  st.nostradamusTeam = pick(ctx, st.possibleTeams);
  const included = new Set(ctx.room.roleDeck || []);
  st.publicRules = [];
  if ([...included].some((id) => roleMap[id]?.expansion === "alien" || ["empath"].includes(id))) st.publicRules.push(pair("Alien uses the variants listed here. The official app’s unpublished questions and space-time ripples are not included.", "外星扩展使用此处公布的技能变体；不包含官方应用未公开的全部问题与时空涟漪。"));
  if ([...included].some((id) => ALIENS.includes(id))) st.publicRules.push(pair(({
    recognize: "Aliens recognize one another; there is no extra Alien action this round.",
    center: "After recognizing one another, each Alien may inspect a center card.",
    convert: "After recognizing one another, the first Alien clockwise may convert one non-Alien player. That player stays Alien even if their card moves.",
  })[st.alienVariant], ({
    recognize: "外星人本局只进行互认，没有额外行动。",
    center: "外星人互认后，每人可以查看一张中央牌。",
    convert: "外星人互认后，顺时针第一位外星人可将一位非外星人转化。之后换牌也不会取消转化。",
  })[st.alienVariant]));
  if (included.has("oracle")) st.publicRules.push(pair("Oracle answers which available team to join. This is Nightfall’s team-choice question variant.", "神谕者回答要加入哪个可用阵营；这是天黑请闭眼的阵营选择问题变体。"));
  if (included.has("psychic")) st.publicRules.push(pair(({ onePlayer: "Psychic may inspect one other player’s card.", twoPlayers: "Psychic may inspect two other players’ cards.", twoCenters: "Psychic may inspect two center cards." })[st.psychicVariant], ({ onePlayer: "灵媒可查看一名其他玩家的牌。", twoPlayers: "灵媒可查看两名其他玩家的牌。", twoCenters: "灵媒可查看两张中央牌。" })[st.psychicVariant]));
  if (included.has("rascal")) st.publicRules.push(pair(({ swapOthers: "Rascal may exchange two other players’ cards.", swapSelf: "Rascal may exchange their own card with another player.", rotateLeft: "Rascal may rotate other movable player cards one place left.", rotateRight: "Rascal may rotate other movable player cards one place right.", higher: "Rascal may exchange two players with higher seat numbers than their own; too few legal targets means no exchange." })[st.rascalVariant], ({ swapOthers: "淘气鬼可交换另外两位玩家的牌。", swapSelf: "淘气鬼可将自己的牌与另一位玩家交换。", rotateLeft: "淘气鬼可将其他可移动玩家牌向左轮换一位。", rotateRight: "淘气鬼可将其他可移动玩家牌向右轮换一位。", higher: "淘气鬼只能交换两位比自己座位号更大的玩家；合法目标不足时不交换。" })[st.rascalVariant]));
  if (included.has("exposer")) st.publicRules.push(pair(`Exposer may reveal exactly ${st.exposerCount} center cards, or none.`, `揭露者可公开恰好${st.exposerCount}张中央牌，或全部不翻。`));
  if (included.has("mortician")) st.publicRules.push(pair(`Mortician may inspect up to ${st.morticianCount} neighboring cards.`, `殡葬师可查看最多${st.morticianCount}位邻居的身份牌。`));
  if (included.has("blob")) st.publicRules.push(pair(`Blob must keep itself and its ${st.blobOffsets.length === 2 ? "two immediate neighbors" : st.blobOffsets[0] < 0 ? "left neighbor" : "right neighbor"} alive.`, `黏液怪须保全自己与${st.blobOffsets.length === 2 ? "左右两位邻居" : st.blobOffsets[0] < 0 ? "左邻居" : "右邻居"}。`));
  if (included.has("familyMan")) st.publicRules.push(pair(`Family Man must keep itself and ${st.familyRadius} neighbor(s) on each side alive.`, `顾家者须保全自己及左右各${st.familyRadius}位邻居。`));
  if (included.has("empath")) st.publicRules.push(pair(({ viewed: "Empath asks everyone whether they viewed another card tonight.", moved: "Empath asks everyone whether they moved any card tonight.", evil: "Empath asks everyone whether they started as a werewolf, vampire, alien or villain." })[st.empathQuestion], ({ viewed: "共情者询问大家今晚是否查看过另一张身份牌。", moved: "共情者询问大家今晚是否移动过身份牌。", evil: "共情者询问大家最初是否为狼人、吸血鬼、外星人或反派。" })[st.empathQuestion]));
  if (included.has("cursed") && [...included].some((id) => WOLVES.includes(id)) && [...included].some((id) => ["vampire", "master", "count"].includes(id))) st.publicRules.push(pair("If both a Werewolf and a Vampire vote for Cursed, wolf conversion takes priority.", "如果狼人和吸血鬼同时投被诅咒者，优先转化为狼人。"));
  if ([...included].some((id) => VILLAINS.includes(id)) && [...included].some((id) => [...ALIENS, ...WOLVES, "vampire", "master", "count"].includes(id))) st.publicRules.push(pair("In mixed epic games, Villains count as an additional hostile faction.", "混合史诗局中，反派视为另一个敌对阵营。"));
  if ((ctx.room.roleDeck || []).includes("nostradamus")) st.publicRules.push(pair(`Nostradamus default team: ${st.nostradamusTeam}. An active Nostradamus may change this by viewing cards.`, `诺斯特拉达姆士默认阵营：${teamZh(st.nostradamusTeam)}。实际行动者可通过看牌改变阵营。`));
  const deck = ctx.room.roleDeck || [];
  if (deck.includes("temptress") && !ctx.room.cards["reserve:villain"]) ctx.room.cards["reserve:villain"] = { id: "reserve:villain", roleId: "henchman" };
}

function getActors(ctx, role) {
  if (role === "alien") return idsFor(ctx, ALIENS);
  if (role === "villains") return idsFor(ctx, VILLAINS);
  // Every player answers privately; neither the presence nor seat of Empath leaks.
  if (role === "empath") return seats(ctx).map((s) => s.id);
  return null;
}

function buildAction(ctx) {
  const { role, data } = ctx;
  const st = state(ctx);
  const others = ordinaryTargets(ctx, false);
  const center = ctx.centers();
  switch (role) {
    case "oracle":
      return descriptor(ctx, "Digital Oracle variant: choose the team you will need to help win. This changes your team, not your identity.", "数字版神谕变体：选择你要帮助获胜的阵营。只改变阵营，不改变身份。", [], 0, 0, false, st.possibleTeams.map((team) => [team, team, ({ village: "村民", wolf: "狼人", vampire: "吸血鬼", alien: "外星人", villain: "反派" })[team]]));
    case "mirrorMan": return descriptor(ctx, "Copy one center role. You will act later as that role.", "复制一张中央身份牌，稍后按该身份行动。", center, 1);
    case "alien": {
      const aliens = idsFor(ctx, ALIENS);
      if (st.alienVariant === "center") return descriptor(ctx, "Recognize the original aliens, then you may view one center card.", "辨认最初的外星人，然后可以查看一张中央牌。", center, 1, 1, true);
      if (st.alienVariant === "convert" && aliens[0] === ctx.seat.id && others.some((id) => !aliens.includes(id))) return descriptor(ctx, "Recognize the aliens. You may turn one non-alien player into an Alien, regardless of later card exchanges.", "辨认外星人。你可以将一位非外星人玩家转为外星人，之后换牌不会改变这项转化。", others.filter((id) => !aliens.includes(id)), 1, 1, true);
      return descriptor(ctx, "Recognize your fellow original aliens and confirm.", "辨认最初的其他外星人，然后确认。" );
    }
    case "syntheticAlien": return descriptor(ctx, "Recognize the original aliens. You want to die, unlike the other aliens.", "辨认最初的外星人。与其他外星人不同，你希望自己死亡。" );
    case "cow": case "evilometer": return descriptor(ctx, "Receive whether at least one neighboring player is on the opposing team, then confirm.", "获知相邻玩家中是否至少有一位敌方成员，然后确认。" );
    case "groob": case "zerb": case "leader": return descriptor(ctx, "Receive the identities relevant to your role, then confirm.", "查看与你身份相关的信息，然后确认。" );
    case "bodySnatcher": {
      const immediateCopy = ctx.seat.copyMode === "doppel" && ctx.step === "doppelganger";
      const targets = (ctx.room.shields || []).includes(ctx.seat.id) ? [] : others.filter((id) => immediateCopy ? id !== ctx.seat.copySourceId : !idsFor(ctx, ALIENS).includes(id) && !st.playerAliens.includes(id));
      return descriptor(ctx, targets.length ? immediateCopy ? "Exchange with another player except the Body Snatcher you copied. Both physical cards become Alien cards." : "Exchange with a non-alien and view the stolen card. Both physical cards become Alien cards." : "There is no legal exchange. Confirm without changing cards.", targets.length ? immediateCopy ? "与复制对象以外的其他玩家交换。两张实体牌都成为外星牌。" : "与非外星人交换并查看其牌，两张实体牌都成为外星牌。" : "没有合法交换目标，请确认，不改变任何牌。", targets, targets.length ? 1 : 0);
    }
    case "psychic": {
      const n = st.psychicVariant === "onePlayer" ? 1 : 2;
      const ids = st.psychicVariant === "twoCenters" ? center : others;
      return descriptor(ctx, `View ${n} ${st.psychicVariant === "twoCenters" ? "center cards" : "other players’ cards"}.`, `查看${n}张${st.psychicVariant === "twoCenters" ? "中央牌" : "其他玩家的身份牌"}。`, ids, n, n, true);
    }
    case "rascal": {
      let ids = others, n = 2;
      if (st.rascalVariant === "swapSelf") n = 1;
      if (st.rascalVariant === "higher") ids = ids.filter((id) => seatNumber(ctx, id) > ctx.seat.number);
      if (["rotateLeft", "rotateRight"].includes(st.rascalVariant)) return descriptor(ctx, `You may move all other unshielded player cards one seat ${st.rascalVariant === "rotateLeft" ? "left" : "right"}. Your own card stays.`, `可将除你以外未受护盾保护的玩家身份牌全部向${st.rascalVariant === "rotateLeft" ? "左" : "右"}移动一位。你的牌不动。`, [], 0, 0, true);
      if (ids.length < n) return descriptor(ctx, "This round permits only higher-numbered targets, but there are too few. Confirm to take no action.", "本局只允许选择更大座位号，但合法目标不足。确认不执行行动。" );
      return descriptor(ctx, st.rascalVariant === "swapSelf" ? "You may exchange your own card with another player without viewing it." : "You may exchange two eligible players’ cards without viewing them.", st.rascalVariant === "swapSelf" ? "可将自己的牌与另一位玩家交换，不能查看。" : "可交换两位合法目标的身份牌，不能查看。", ids, n, n, true);
    }
    case "exposer": return descriptor(ctx, `Reveal exactly ${st.exposerCount} center cards to everyone, or skip.`, `向所有人公开恰好${st.exposerCount}张中央牌，或全部跳过。`, center, st.exposerCount, st.exposerCount, true);
    case "blob": case "familyMan": return descriptor(ctx, "Review the neighbors you must protect. The group follows the final holder of your card.", "确认你需要保护的邻居。保护范围以最终持有此牌的玩家为中心。" );
    case "mortician": return descriptor(ctx, `You may inspect up to ${st.morticianCount} adjacent card(s). A final neighbor must die for you to win.`, `可查看最多${st.morticianCount}位邻居的身份。最终持牌者的一位邻居死亡即可获胜。`, neighbors(ctx, ctx.seat.id).filter((id) => others.includes(id)), 0, st.morticianCount, true);
    case "auraSeer": return descriptor(ctx, "Learn who actually viewed or moved cards earlier tonight.", "获知今夜此前真正查看过或移动过牌的玩家。" );
    case "apprenticeTanner": case "intern": return descriptor(ctx, "Recognize the player you need to help get caught.", "辨认你要帮助其死亡或被捕的玩家。" );
    case "beholder": case "squire": {
      const targets = idsFor(ctx, role === "beholder" ? ["seer", "apprenticeSeer"] : WOLVES).filter((id) => others.includes(id));
      return descriptor(ctx, "Identify the original roles; optionally inspect any of their current cards.", "辨认最初的相关身份；可查看他们任意当前身份牌。", targets, 0, targets.length, true);
    }
    case "thing": case "annoyingLad": return descriptor(ctx, "Send an anonymous tap to one adjacent player.", "向一位相邻玩家发送匿名触碰提示。", neighbors(ctx, ctx.seat.id), 1, 1, role === "thing");
    case "nostradamus": {
      const viewed = data.seen || [];
      return descriptor(ctx, viewed.length ? `You viewed ${viewed.length} card(s). Finish with the last card’s team, or inspect another (${3 - viewed.length} remaining).` : "You may inspect up to three cards, one at a time. The last card sets your team; you also need to survive.", viewed.length ? `已查看${viewed.length}张牌。可结束并加入最后一张牌的阵营，或继续查看（剩余${3 - viewed.length}次）。` : "可依次查看最多三张牌；最后一张决定你的阵营，你也必须存活。", viewed.length < 3 ? peekTargets(ctx).filter((id) => !viewed.includes(id)) : [], 0, viewed.length < 3 ? 1 : 0, true, viewed.length < 3 ? [["inspect", "Inspect selected card", "查看选中的牌"], ["finish", "Finish with this team", "以此阵营结束"]] : [["finish", "Finish with this team", "以此阵营结束"]]);
    }
    case "empath": {
      const q = { viewed: pair("Have you viewed another card tonight?", "你今晚查看过另一张身份牌吗？"), moved: pair("Have you moved any card tonight?", "你今晚移动过身份牌吗？"), evil: pair("Did you start as a werewolf, vampire, alien or villain?", "你最初是狼人、吸血鬼、外星人或反派吗？") }[st.empathQuestion];
      if (idsFor(ctx, ["empath"]).includes(ctx.seat.id)) return descriptor(ctx, "Other players answer the Empath question privately. Their responses will appear in your notes.", "其他玩家正在秘密回答共情问题，回答将出现在你的笔记中。" );
      return descriptor(ctx, `${q.en} Answer truthfully; only the Empath sees your response.`, `${q.zh} 请如实回答，只有共情者能看到。`, [], 0, 0, false, [["yes", "Yes", "是"], ["no", "No", "否"]]);
    }
    case "villains": return buildAction({ ...ctx, role: actorRole(ctx.seat) });
    case "temptress": return descriptor(ctx, "Meet the villains. You may exchange the extra villain reserve card with a non-villain player.", "与反派互认。可将额外反派备用牌与一位非反派玩家交换。", others.filter((id) => !idsFor(ctx, VILLAINS).includes(id)), 1, 1, true);
    case "drPeeker": return descriptor(ctx, "Meet the villains; you may inspect one other player’s card.", "与反派互认；可查看另一位玩家的身份牌。", others, 1, 1, true);
    case "rapscallion": return descriptor(ctx, "Meet the villains; you may inspect one center card.", "与反派互认；可查看一张中央牌。", center, 1, 1, true);
    case "henchman": return descriptor(ctx, "Recognize the other original villains, then confirm.", "辨认其他最初的反派，然后确认。" );
    case "detector":
      if (!data.mode) return descriptor(ctx, "Choose one other player’s card or two center cards.", "选择查看另一名玩家的牌，或两张中央牌。", [], 0, 0, true, [["player", "One player", "一名玩家"], ["center", "Two center cards", "两张中央牌"]]);
      return descriptor(ctx, "Select the card(s) to inspect.", "选择要查看的身份牌。", data.mode === "player" ? others : center, data.mode === "player" ? 1 : 2);
    case "roleRetriever": return descriptor(ctx, "Exchange your card with another player, then view your new card.", "与另一位玩家交换身份，然后查看新牌。", others, 1, 1, true);
    case "voodooLou": return data.center ? descriptor(ctx, "Exchange the center card you viewed with any unshielded player, including yourself.", "将刚查看的中央牌与任一未受护盾保护的玩家交换，包括自己。", ordinaryTargets(ctx, true), 1) : descriptor(ctx, "You may inspect one center card; if you do, you must exchange it with a player.", "可查看一张中央牌；查看后必须与一位玩家交换。", center, 1, 1, true);
    case "switcheroo": return descriptor(ctx, "Exchange two other unshielded players’ cards without looking.", "交换另外两位未受护盾保护的玩家身份，不能查看。", others, 2, 2, true);
    case "selfAwarenessGirl": return descriptor(ctx, "Look at your own card to see if it changed.", "查看自己的身份牌，确认是否改变。" );
    case "flipper": return descriptor(ctx, "Inspect another player’s card. A hero card stays face up for everyone, but Innocent Bystander does not.", "查看另一位玩家的身份。英雄牌将向所有人公开，但无辜路人除外。", others, 1, 1, true);
    default: return null;
  }
}

function perform(ctx, roleOrCommand, maybeCommand) {
  const command = maybeCommand || roleOrCommand;
  const { role, data } = ctx;
  const st = state(ctx);
  if (!ORDERS[role] && ORDERS[role] !== 0 && !["villains"].includes(role)) return false;
  if (role === "villains") return perform({ ...ctx, role: actorRole(ctx.seat) }, command);
  const action = buildAction(ctx);
  if (!action) return false;
  initialize(ctx);
  // Identification is available even when an optional card action is declined.
  if (["alien", "syntheticAlien", "groob", "zerb", "bodySnatcher"].includes(role) && !data.identified && !(role === "bodySnatcher" && ctx.seat.copyMode === "doppel" && ctx.step === "doppelganger")) {
    identity(ctx, ALIENS, "Original aliens", "最初的外星人"); data.identified = true;
  }
  if (VILLAINS.includes(role) && !data.identified) { identity(ctx, VILLAINS, "Original villains", "最初的反派"); data.identified = true; }
  if (command.skip) {
    if (!action.canSkip) fail(ctx, "This action is mandatory.");
    if (role === "nostradamus") publishNostradamus(ctx);
    if (["beholder", "squire"].includes(role)) identity(ctx, role === "beholder" ? ["seer", "apprenticeSeer"] : WOLVES, "Original roles", "最初身份玩家");
    return finish(ctx);
  }
  const selected = validate(ctx, command, action.targets.map((t) => t.id), action.min, action.max);
  const one = selected[0];
  switch (role) {
    case "oracle": {
      if (!st.possibleTeams.includes(command.choice)) fail(ctx, "Choose an available team.");
      st.oracleTeams[st.originalCardIds[ctx.seat.id]] = command.choice;
      st.oracleTeam = command.choice;
      ctx.learn(`Oracle: your goal is to help the ${command.choice} team win.`, `神谕者：你的目标是帮助${teamZh(command.choice)}阵营获胜。`);
      return finish(ctx);
    }
    case "mirrorMan": {
      const card = ctx.inspectCard(one);
      const copied = actualRole(card);
      ctx.room.cards[ctx.seat.id].copiedRoleId = copied;
      ctx.seat.nightRoleId = copied;
      ctx.learn(`You copied ${copied}. Take its later night action and final team.`, `你复制了${roleMap[copied]?.name.zh || copied}，稍后执行该身份的夜间行动并加入其阵营。`);
      return finish(ctx);
    }
    case "alien":
      if (one && st.alienVariant === "center") ctx.inspectCard(one);
      if (one && st.alienVariant === "convert") {
        if (idsFor(ctx, ALIENS)[0] !== ctx.seat.id) fail(ctx, "Only the designated alien may convert a player.");
        st.playerAliens = [...new Set([...st.playerAliens, one])];
        const group = idsFor(ctx, ALIENS);
        group.forEach((id) => notify(ctx, id, `Player #${seatNumber(ctx, one)} was converted to an Alien.`, `${seatNumber(ctx, one)}号玩家已被转为外星人。`));
      }
      return finish(ctx);
    case "syntheticAlien": case "henchman": return finish(ctx);
    case "cow": case "evilometer": {
      const group = idsFor(ctx, role === "cow" ? ALIENS : VILLAINS);
      const yes = neighbors(ctx, ctx.seat.id).some((id) => group.includes(id));
      ctx.learn(yes ? "At least one original opponent is sitting next to you." : "Neither neighbor is an original opponent.", yes ? "至少一位相邻玩家最初是敌方成员。" : "两位邻居最初都不是敌方成员。");
      return finish(ctx);
    }
    case "groob": case "zerb":
      identity(ctx, [role === "groob" ? "zerb" : "groob"], "Your rival", "你的对手"); return finish(ctx);
    case "leader":
      identity(ctx, ALIENS, "Original aliens", "最初的外星人");
      ctx.learn(idsFor(ctx, ["groob"]).length && idsFor(ctx, ["zerb"]).length ? "Groob and Zerb are both present: protect both." : "Groob and Zerb are not both present: help the village.", idsFor(ctx, ["groob"]).length && idsFor(ctx, ["zerb"]).length ? "古鲁布与泽尔布都在场：保全双方。" : "古鲁布与泽尔布未同时在场：帮助村民。"); return finish(ctx);
    case "bodySnatcher": {
      if (!one) return finish(ctx);
      const own = ctx.room.cards[ctx.seat.id], stolen = ctx.room.cards[one];
      own.teamOverride = "alien"; own.alien = true;
      stolen.teamOverride = "alien"; stolen.alien = true;
      ctx.swapCards(ctx.seat.id, one); ctx.inspectCard(ctx.seat.id); return finish(ctx);
    }
    case "psychic": case "mortician": selected.forEach((id) => ctx.inspectCard(id)); return finish(ctx);
    case "rascal": {
      if (["rotateLeft", "rotateRight"].includes(st.rascalVariant)) {
        const ids = ordinaryTargets(ctx, false);
        if (ids.length > 1) {
          // A sequence of real swaps preserves physical card objects and audit logs.
          const sequence = st.rascalVariant === "rotateLeft" ? ids : [...ids].reverse();
          for (let index = 0; index < sequence.length - 1; index += 1) ctx.swapCards(sequence[index], sequence[index + 1]);
        }
      } else if (st.rascalVariant === "swapSelf" && one) ctx.swapCards(ctx.seat.id, one);
      else if (selected.length === 2) ctx.swapCards(selected[0], selected[1]);
      return finish(ctx);
    }
    case "exposer":
      ctx.room.revealed ||= [];
      selected.forEach((id) => { ctx.inspectCard(id); if (!ctx.room.revealed.includes(id)) ctx.room.revealed.push(id); }); return finish(ctx);
    case "blob": case "familyMan": {
      const offsets = role === "blob" ? st.blobOffsets : Array.from({ length: st.familyRadius }, (_, i) => [-(i + 1), i + 1]).flat();
      ctx.learn(`Your final card holder must survive along with neighbors at offsets ${offsets.join(", ")} (negative = left).`, `最终持牌者及相对座位${offsets.join("、")}的邻居必须存活（负数为左侧）。`);
      return finish(ctx);
    }
    case "auraSeer": {
      const ids = data.auraIds || [...new Set((ctx.room.actionLog || []).filter((a) => ["view", "move"].includes(a.type)).map((a) => a.seatId))];
      ctx.learn(`Players who viewed or moved cards: ${listNumbers(ctx, ids)}.`, `此前查看过或移动过牌的玩家：${listNumbers(ctx, ids)}。`); return finish(ctx);
    }
    case "apprenticeTanner": case "intern": identity(ctx, role === "intern" ? ["madScientist"] : ["tanner"], "Original ally", "最初的同伴"); return finish(ctx);
    case "beholder": case "squire": identity(ctx, role === "beholder" ? ["seer", "apprenticeSeer"] : WOLVES, "Original roles", "最初身份玩家"); selected.forEach((id) => ctx.inspectCard(id)); return finish(ctx);
    case "thing": case "annoyingLad": notify(ctx, one, "A neighboring player sent you a secret tap.", "一位相邻玩家秘密触碰了你。"); return finish(ctx);
    case "nostradamus":
      if (command.choice === "inspect" && !one) fail(ctx, "Select one card to inspect.");
      if (command.choice === "finish" && one) fail(ctx, "Finish without selecting another card.");
      if (one) {
        const card = ctx.inspectCard(one);
        data.seen ||= []; data.seen.push(one);
        const team = cardTeam(ctx, card);
        data.team = ["village", "wolf", "vampire", "alien", "villain", "tanner", "mad", "synthetic", "blob", "mortician", "family"].includes(team) ? team : "village";
        data.stage = (data.stage || 0) + 1;
      }
      if (command.choice === "finish" || !one || data.seen?.length === 3) { publishNostradamus(ctx); return finish(ctx); }
      return true;
    case "empath": {
      if (idsFor(ctx, ["empath"]).includes(ctx.seat.id)) return finish(ctx);
      if (!["yes", "no"].includes(command.choice)) fail(ctx, "Choose yes or no.");
      st.empathAnswers[ctx.seat.id] = command.choice;
      idsFor(ctx, ["empath"]).forEach((id) => notify(ctx, id, `Empath response from #${ctx.seat.number}: ${command.choice}.`, `${ctx.seat.number}号玩家的共情回答：${command.choice === "yes" ? "是" : "否"}。`));
      return finish(ctx);
    }
    case "temptress": ctx.swapCards("reserve:villain", one); return finish(ctx);
    case "drPeeker": case "rapscallion": ctx.inspectCard(one); return finish(ctx);
    case "detector":
      if (!data.mode) { if (!["player", "center"].includes(command.choice)) fail(ctx, "Choose player or center."); data.mode = command.choice; data.stage = 1; return true; }
      selected.forEach((id) => ctx.inspectCard(id)); return finish(ctx);
    case "roleRetriever": ctx.swapCards(ctx.seat.id, one); ctx.inspectCard(ctx.seat.id); return finish(ctx);
    case "voodooLou":
      if (!data.center) { ctx.inspectCard(one); data.center = one; data.stage = 1; return true; }
      ctx.swapCards(data.center, one); return finish(ctx);
    case "switcheroo": ctx.swapCards(selected[0], selected[1]); return finish(ctx);
    case "selfAwarenessGirl": if (!(ctx.room.shields || []).includes(ctx.seat.id)) ctx.inspectCard(ctx.seat.id); return finish(ctx);
    case "flipper": {
      const card = ctx.inspectCard(one);
      const r = actualRole(card);
      if (cardTeam(ctx, card) === "village" && r !== "innocentBystander") { ctx.room.revealed ||= []; if (!ctx.room.revealed.includes(one)) ctx.room.revealed.push(one); }
      return finish(ctx);
    }
    default: return false;
  }
}
function teamZh(team) { return ({ village: "村民", wolf: "狼人", vampire: "吸血鬼", alien: "外星人", villain: "反派", tanner: "皮匠", mad: "疯狂科学家", synthetic: "合成外星人", blob: "黏液怪", family: "家庭", mortician: "殡葬师" })[team] || team; }
function publishNostradamus(ctx) {
  const st = state(ctx), team = ctx.data.team || st.nostradamusTeam;
  const originalCard = Object.values(ctx.room.cards).find((card) => card.id === (ctx.seat.originalCardId || st.originalCardIds?.[ctx.seat.id])) || ctx.room.cards[ctx.seat.id];
  st.nostradamusTeams[originalCard.id] = team;
  st.nostradamusTeam = team;
  st.publicRules ||= [];
  st.publicRules.push(pair(`Nostradamus now follows the ${team} team.`, `诺斯特拉达姆士现帮助${teamZh(team)}阵营。`));
  seats(ctx).forEach((seat) => notify(ctx, seat.id, `Nostradamus follows the ${team} team and must survive.`, `诺斯特拉达姆士帮助${teamZh(team)}阵营，且必须存活。`));
}

function beforeVote(ctx, result) {
  const st = state(ctx);
  result.protected ||= new Set(); result.redirects ||= {};
  const entries = Object.entries(result.effective);
  // Snapshot votes before transformations so a newly turned Cursed does not
  // start an order-dependent chain of conversions through another Cursed.
  const voterRoles = Object.fromEntries(entries.map(([id, e]) => [id, { ...e }]));
  for (const [id, e] of entries) {
    const card = ctx.room.cards[id];
    const artifact = BONUS_ARTIFACTS[ctx.room.artifacts?.[id]];
    if (artifact?.roleId) { e.roleId = artifact.roleId; e.team = artifact.team; }
    else if (!["claw", "brand", "cudgel"].includes(ctx.room.artifacts?.[id]) && ctx.room.marks?.[id] !== "vampire") {
      if (st.playerAliens?.includes(id)) { e.roleId = "alien"; e.team = "alien"; }
      else if (card?.alien) e.team = "alien";
    }
    if (e.roleId === "oracle" && ctx.room.marks?.[id] !== "vampire" && !card?.alien && !st.playerAliens?.includes(id)) e.team = ["copycat", "mirrorMan"].includes(card?.roleId) ? "village" : st.oracleTeams?.[card?.id] || st.oracleTeam || "village";
    if (e.roleId === "nostradamus" && ctx.room.marks?.[id] !== "vampire" && !card?.alien && !st.playerAliens?.includes(id)) e.team = st.nostradamusTeams?.[card?.id] || st.nostradamusTeam || "village";
    if (e.roleId === "cursed" && e.team === "village") {
      const voters = Object.entries(result.votes).filter(([, target]) => target === id).map(([voter]) => ({ id: voter, ...voterRoles[voter] }));
      if (voters.some((v) => WOLVES.includes(v?.roleId) && v?.team === "wolf")) { e.roleId = "werewolf"; e.team = "wolf"; }
      else if (voters.some((v) => v?.team === "vampire" && (ctx.room.marks?.[v.id] === "vampire" || ["vampire", "master", "count"].includes(v?.roleId)))) { e.roleId = "vampire"; e.team = "vampire"; }
    }
    if (e.roleId === "windyWendy" && e.team === "village" && Object.entries(result.votes).some(([voter, target]) => target === id && VILLAINS.includes(voterRoles[voter]?.roleId) && voterRoles[voter]?.team === "villain")) { e.roleId = "henchman"; e.team = "villain"; }
    if (["prince", "theSponge"].includes(e.roleId)) result.protected.add(id);
    if (["defenderEr", "bodyguard"].includes(e.roleId) && result.votes[id]) result.protected.add(result.votes[id]);
    if (e.roleId === "ricochetRhino" && result.votes[id]) result.redirects[id] = result.votes[id];
  }
}
function neighborhood(ctx, id, offsets) {
  const list = seats(ctx), i = list.findIndex((s) => s.id === id);
  return [...new Set([id, ...offsets.map((off) => list[((i + off) % list.length + list.length) % list.length].id)])];
}
function afterVote(ctx, result) {
  const st = state(ctx), entries = Object.entries(result.effective);
  const expectedTeam = (role) => roleMap[role]?.team || ({ tanner: "tanner", werewolf: "wolf" })[role];
  const byRole = (...r) => entries.filter(([, e]) => r.includes(e.roleId) && e.team === expectedTeam(e.roleId)).map(([id]) => id);
  const dying = (id) => result.dead.has(id);
  const hasDead = (ids) => ids.some(dying);
  const groobs = byRole("groob"), zerbs = byRole("zerb");
  const aliens = entries.filter(([id, e]) => (ALIENS.includes(e.roleId) && ["alien", "synthetic"].includes(e.team)) || ctx.room.cards[id]?.alien && e.team === "alien" || st.playerAliens?.includes(id) && e.team === "alien").map(([id]) => id);
  const leaders = byRole("leader");
  if (groobs.length && zerbs.length) {
    groobs.forEach((id) => { result.winners.delete(id); if (!dying(id) && hasDead(zerbs)) result.winners.add(id); });
    zerbs.forEach((id) => { result.winners.delete(id); if (!dying(id) && hasDead(groobs)) result.winners.add(id); });
    leaders.forEach((id) => { result.winners.delete(id); if (![...groobs, ...zerbs].some(dying)) result.winners.add(id); });
  }
  const unanimousLeader = leaders.find((leader) => aliens.length && aliens.every((id) => result.votes[id] === leader));
  if (unanimousLeader) {
    entries.forEach(([id, e]) => { if (e.team === "village" && !(e.roleId === "leader" && groobs.length && zerbs.length && ![...groobs, ...zerbs].some(dying))) result.winners.delete(id); if (e.team === "alien" && !["groob", "zerb"].includes(e.roleId)) result.winners.add(id); });
  }
  const scientistDies = hasDead(byRole("madScientist"));
  const syntheticDies = hasDead(byRole("syntheticAlien"));
  if (scientistDies) entries.forEach(([id, e]) => { if (["village", "villain"].includes(e.team)) result.winners.delete(id); });
  if (syntheticDies) entries.forEach(([id, e]) => { if (["village", "alien"].includes(e.team) || ALIENS.includes(e.roleId)) result.winners.delete(id); });
  for (const [id, e] of entries) {
    if (e.roleId === "syntheticAlien" && e.team === "synthetic") { result.winners.delete(id); if (dying(id)) result.winners.add(id); }
    if (e.roleId === "madScientist" && e.team === "mad") { result.winners.delete(id); if (dying(id)) result.winners.add(id); }
    if (e.roleId === "apprenticeTanner" && e.team === "tanner" || e.roleId === "intern" && e.team === "mad") {
      const originals = byRole(e.roleId === "intern" ? "madScientist" : "tanner");
      result.winners.delete(id); if (originals.length ? hasDead(originals) : dying(id)) result.winners.add(id);
    }
    if (["blob", "familyMan"].includes(e.roleId) && e.team === expectedTeam(e.roleId)) {
      const offsets = e.roleId === "blob" ? st.blobOffsets || [-1, 1] : Array.from({ length: st.familyRadius || 1 }, (_, i) => [-(i + 1), i + 1]).flat();
      result.winners.delete(id); if (!neighborhood(ctx, id, offsets).some(dying)) result.winners.add(id);
    }
    if (e.roleId === "mortician" && e.team === "mortician") { result.winners.delete(id); if (neighbors(ctx, id).some(dying)) result.winners.add(id); }
    if (e.roleId === "squire" && e.team === "wolf" && !entries.some(([, v]) => WOLVES.includes(v.roleId) && v.team === "wolf")) { result.winners.delete(id); if ([...result.dead].some((deadId) => deadId !== id) && !entries.some(([other, v]) => v.roleId === "tanner" && v.team === "tanner" && dying(other))) result.winners.add(id); }
  }
  // Nostradamus follows team success without counting as that team's creature.
  for (const [id, e] of entries) {
    if (e.roleId !== "nostradamus" || ctx.room.marks?.[id] === "vampire" || ctx.room.cards[id]?.alien || st.playerAliens?.includes(id)) continue;
    const teamWins = entries.some(([other, v]) => other !== id && v.team === e.team && result.winners.has(other));
    result.winners.delete(id);
    if (!dying(id) && teamWins) result.winners.add(id);
  }
  for (const [id, e] of entries) if (ctx.room.artifacts?.[id] === "daggerOfTraitor") {
    result.winners.delete(id);
    if (entries.some(([other, v]) => other !== id && v.team === e.team && dying(other))) result.winners.add(id);
  }
}

function augmentSchedule(ctx) {
  return (ctx.room.roleDeck || []).some((r) => ALIENS.includes(r)) ? [{ roleId: "alien", step: "alien", order: 1.1 }] : [];
}
function initialize(ctx) {
  const { role, data } = ctx;
  if (data.expansionInitialized) return;
  data.expansionInitialized = true;
  if (ALIENS.includes(role) && !(role === "bodySnatcher" && ctx.seat.copyMode === "doppel" && ctx.step === "doppelganger")) { identity(ctx, ALIENS, "Original aliens", "最初的外星人"); data.identified = true; }
  if (VILLAINS.includes(role)) { identity(ctx, VILLAINS, "Original villains", "最初的反派"); data.identified = true; }
  if (["beholder", "squire"].includes(role)) identity(ctx, role === "beholder" ? ["seer", "apprenticeSeer"] : WOLVES, "Original roles", "最初身份玩家");
  if (["apprenticeTanner", "intern"].includes(role)) identity(ctx, role === "intern" ? ["madScientist"] : ["tanner"], "Original ally", "最初的同伴");
  if (role === "auraSeer") {
    data.auraIds = [...new Set((ctx.room.actionLog || []).filter((a) => ["view", "move"].includes(a.type)).map((a) => a.seatId))];
    ctx.learn(`Players who viewed or moved cards: ${listNumbers(ctx, data.auraIds)}.`, `此前查看过或移动过牌的玩家：${listNumbers(ctx, data.auraIds)}。`);
  }
  if (["cow", "evilometer"].includes(role)) {
    const yes = neighbors(ctx, ctx.seat.id).some((id) => idsFor(ctx, role === "cow" ? ALIENS : VILLAINS).includes(id));
    ctx.learn(yes ? "At least one original opponent is sitting next to you." : "Neither neighbor is an original opponent.", yes ? "至少一位相邻玩家最初是敌方成员。" : "两位邻居最初都不是敌方成员。");
  }
  if (["groob", "zerb"].includes(role)) identity(ctx, [role === "groob" ? "zerb" : "groob"], "Your rival", "你的对手");
  if (role === "leader") identity(ctx, ALIENS, "Original aliens", "最初的外星人");
}
function effective(ctx, id, current) {
  const st = state(ctx), card = ctx.room.cards[id], artifact = ctx.room.artifacts?.[id];
  const override = BONUS_ARTIFACTS[artifact];
  const value = { ...current };
  if (override?.roleId) return { ...value, roleId: override.roleId, team: override.team };
  if (!["claw", "brand", "cudgel"].includes(artifact) && ctx.room.marks?.[id] !== "vampire") {
    if (st.playerAliens?.includes(id)) { value.roleId = "alien"; value.team = "alien"; }
    else if (card?.alien) value.team = "alien";
  }
  if (value.roleId === "oracle" && ctx.room.marks?.[id] !== "vampire" && !card?.alien && !st.playerAliens?.includes(id) && !card?.alien && !st.playerAliens?.includes(id)) value.team = ["copycat", "mirrorMan"].includes(card?.roleId) ? "village" : st.oracleTeams?.[card?.id] || st.oracleTeam || "village";
  if (value.roleId === "nostradamus" && ctx.room.marks?.[id] !== "vampire" && !card?.alien && !st.playerAliens?.includes(id) && !card?.alien && !st.playerAliens?.includes(id)) value.team = st.nostradamusTeams?.[card?.id] || st.nostradamusTeam || "village";
  return value;
}
function replaceDeaths(ctx, result) {
  // Redirect only the original vote death candidates. A Rhino later killed by a
  // Hunter does not bounce that shot, and multiple Rhinos cannot create loops.
  const original = [...result.dead];
  for (const id of original) if (result.redirects?.[id]) result.dead.delete(id);
  for (const id of original) { const target = result.redirects?.[id]; if (target && !result.protected.has(target)) result.dead.add(target); }
}
module.exports = { roles, orders: ORDERS, ALIENS, VILLAINS, BONUS_ARTIFACTS, ADAPTATION, prepare, initialize, effective, augmentSchedule, actors: getActors, getActors, buildAction, perform, beforeVote, replaceDeaths, afterVote, resolve: afterVote };
