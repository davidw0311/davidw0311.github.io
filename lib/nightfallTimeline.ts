import classicCatalogue from "../public/assets/werewolf/roles.json" with { type: "json" };
import oneNightCore from "../public/assets/one-night/core-roles.json" with { type: "json" };
import oneNightExpansions from "../public/assets/one-night/expansion-roles.json" with { type: "json" };

type Localized = { en: string; zh: string };
export type NightTimelineStep = {
  id: string;
  roleId?: string;
  name: Localized;
  description: Localized;
  firstNightOnly?: boolean;
};
type CatalogueRole = { id: string; name: Localized; description: Localized; order?: number | null; expansion?: string; nightStep?: string };
const text = (en: string, zh: string): Localized => ({ en, zh });
const classicRoles = new Map<string, CatalogueRole>(classicCatalogue.roles.map(role => [role.id, role]));
const oneNightRoles = new Map<string, CatalogueRole>([...oneNightCore, ...oneNightExpansions].map(role => [role.id, role]));

// These public calling rules mirror the engines; regression tests compare actual
// dealt-room schedules. Actor eligibility and secret copy choices never enter here.
const classicOpening = ["cupid", "wildChild", "wolfHound", "thief", "mechanicalWolf"];
const classicOrder = ["magician", "wolves", "guard", "dreamweaver", "seer", "pureWhite", "wolfWitch", "gargoyle", "witch", "wolfBeauty", "silencer", "raven", "gravekeeper", "demonHunter", "piper"];
const mechanicalCalls = ["seer", "guard", "witch", "raven", "gravekeeper", "demonHunter"];
const wolves = new Set(["werewolf", "alphaWolf", "mysticWolf", "dreamWolf"]);
const vampires = new Set(["vampire", "master", "count"]);
const aliens = new Set(["alien", "syntheticAlien", "groob", "zerb", "bodySnatcher"]);
const copiedLate = new Set(["insomniac", "revealer", "curator", "count", "renfield", "priest", "assassin", "apprenticeAssassin", "marksman", "pickpocket", "gremlin", "auraSeer", "squire", "beholder", "apprenticeTanner", "groob", "zerb", "oracle", "leader", "psychic", "rascal", "exposer", "blob", "mortician", "empath", "nostradamus"]);

const classicDescriptions: Record<string, Localized> = {
  cupid: text("Choose two lovers. First-night setup choices resolve before the regular night abilities.", "选择两名情侣。首夜设置会在常规夜间技能开始前统一生效。"),
  wildChild: text("Choose an idol. The Wild Child becomes a wolf if that idol later dies.", "选择一位榜样；榜样日后死亡时，野孩子转为狼人。"),
  wolfHound: text("Permanently choose village or wolf. Choosing wolf allows participation in the pack attack.", "永久选择好人或狼人阵营；选择狼人后可参与狼刀。"),
  thief: text("Choose Seer or Guard as the permanent role, using this app’s reserve-role variant.", "按本应用的备用身份变体，选择预言家或守卫作为永久身份。"),
  mechanicalWolf: text("Copy another player’s starting role while remaining a wolf. Its supported ability acts in the later matching call.", "学习另一人的初始身份，阵营仍为狼人；支持的技能在后续对应环节发动。"),
  magician: text("Optionally exchange two players’ incoming pack attacks and regular targeted night abilities for this night.", "可交换两名玩家本夜承受的狼刀与常规夜间指向技能。"),
  wolves: text("Every eligible wolf chooses a target or no kill. Continue after all submit and a target has a strict majority, or everyone chooses no kill.", "每名可行动狼人选择刀人或空刀。全员提交且目标获严格多数，或全员空刀后继续。"),
  guard: text("Protect one living player or protect nobody. The same seat cannot be protected on consecutive nights.", "守护一名存活玩家或空守，不能连续两夜守护同一座位。"),
  dreamweaver: text("Choose a dream target or skip. Repeating last night’s target is lethal; otherwise dream protection applies.", "选择摄梦对象或空过。连续两夜选同一对象会使其死亡，否则提供梦游保护。"),
  seer: text("Inspect another living player’s good or wolf alignment. The result is private.", "查验另一名存活玩家是好人或狼人，结果仅本人可见。"),
  pureWhite: text("Inspect an exact role. From the second night, inspecting a wolf can also kill it.", "查验具体身份；第二夜起，查验狼人还可能使其死亡。"),
  wolfWitch: text("Inspect a non-wolf’s exact role. From the second night, inspecting Pure White can kill her.", "查验非狼玩家的具体身份；第二夜起，验到纯白之女可能使其死亡。"),
  gargoyle: text("Inspect an exact role, without repeating a previously selected seat. The Gargoyle remains separate from the ordinary pack until it inherits the attack.", "查验具体身份，每个座位全局只能验一次。石像鬼在继承狼刀前不与普通狼队互认。"),
  witch: text("Use at most one remaining potion: save the pack victim, poison a player, or skip. Room settings determine self-save and simultaneous Guard protection.", "最多使用一瓶剩余药剂：救狼刀目标、毒人或空过。自救及同守同救按本房设置执行。"),
  wolfBeauty: text("Charm another player without repeating last night’s target. A later exile or death shot can take the charmed player with the Wolf Beauty.", "魅惑另一名玩家，不能连续选择同一目标；之后被放逐或开枪带走时，魅惑对象可能跟随出局。"),
  silencer: text("Silence one living player for the coming day, or skip. Do not repeat last night’s selected seat.", "选择一名存活玩家次日禁言，或空过；不能连续两夜选择同一座位。"),
  raven: text("Choose a player to receive the Raven’s extra votes in the coming exile ballot, or skip.", "选择一名玩家，在接下来的放逐投票中追加乌鸦票数，或空过。"),
  gravekeeper: text("Learn the previous day’s exiled player’s alignment, or that nobody was exiled. This call still occurs on the first night.", "得知上一个白天被放逐者的阵营，或获知无人被放逐；首夜仍保留此环节。"),
  demonHunter: text("Hunt from the second night: a wolf target dies; a non-wolf target kills the hunter instead. The first-night call has no hunt.", "第二夜起可狩猎：目标是狼则狼死，否则猎魔人死。首夜保留呼叫，但不能狩猎。"),
  piper: text("Charm up to two other players. Charmed players privately learn who else is charmed.", "魅惑最多两名其他玩家，被魅惑者私下获知其他被魅惑者。"),
};

function classicTimeline(deck: string[]): NightTimelineStep[] {
  const configured = new Set(deck.filter(id => classicRoles.has(id)));
  if (!configured.size) return [];
  const calls = new Set(["wolves"]);
  for (const id of configured) {
    const step = classicRoles.get(id)?.nightStep;
    if (step && step !== "opening") calls.add(step);
    if (id === "thief") { calls.add("seer"); calls.add("guard"); }
    if (id === "mechanicalWolf") mechanicalCalls.forEach(call => calls.add(call));
  }
  const output: NightTimelineStep[] = classicOpening.filter(id => configured.has(id)).map(id => ({
    id: `opening:${id}`, roleId: id, name: classicRoles.get(id)!.name,
    description: classicDescriptions[id], firstNightOnly: true,
  }));
  for (const id of classicOrder.filter(id => calls.has(id))) {
    const reserve = !configured.has(id) && id !== "wolves";
    const suffix = reserve ? text(" This public call is reserved for possible transformed or copied abilities; it does not confirm anyone has this role.", " 此公开环节为可能的转职或复制技能预留，并不表示有玩家持有此身份。") : text("", "");
    output.push({ id, roleId: id === "wolves" ? "werewolf" : id,
      name: id === "wolves" ? text("Werewolves", "狼人") : classicRoles.get(id)!.name,
      description: text(classicDescriptions[id].en + suffix.en, classicDescriptions[id].zh + suffix.zh),
    });
  }
  return output;
}

function oneNightTimeline(deck: string[]): NightTimelineStep[] {
  const configured = new Set(deck.filter(id => oneNightRoles.has(id)));
  const turns: { id: string; roleId: string; order: number }[] = [];
  for (const id of configured) {
    const role = oneNightRoles.get(id)!;
    if (role.order != null && !["master", "dreamWolf", "syntheticAlien"].includes(id)) turns.push({ id, roleId: id, order: role.order });
  }
  const addGroup = (group: Set<string>, roleId: string, order: number) => {
    if ([...configured].some(id => group.has(id)) && !turns.some(turn => turn.id === roleId)) turns.push({ id: roleId, roleId, order });
  };
  addGroup(wolves, "werewolf", 2);
  addGroup(vampires, "vampire", -6);
  if ([...configured].some(id => oneNightRoles.get(id)?.expansion === "vampire")) {
    turns.push({ id: "markReview", roleId: "markReview", order: -.3 });
    if (configured.has("cupid")) turns.push({ id: "lovers", roleId: "lovers", order: -.2 });
  }
  if (configured.has("doppelganger") || configured.has("mirrorMan")) {
    for (const id of configured) if (copiedLate.has(id)) turns.push({ id: `doppel:${id}`, roleId: id, order: (oneNightRoles.get(id)!.order || 0) + .01 });
  }
  addGroup(aliens, "alien", 1.1);
  return turns.sort((a, b) => a.order - b.order).map(turn => {
    if (turn.id === "markReview") return { id: turn.id, name: text("Everyone: review your mark", "全员查看标记"), description: text("Everyone privately checks the mark they hold after the dusk abilities. It may differ from their original role.", "黄昏技能结束后，每位玩家私下查看自己当前的标记；标记可能与初始身份不同。") };
    if (turn.id === "lovers") return { id: turn.id, name: text("Lovers recognize each other", "恋人互认"), description: text("Eligible holders of Love marks privately recognize one another. This call does not reveal whether anyone holds a Love mark.", "符合行动条件的爱情标记持有者私下互认；此公开呼叫并不表示一定存在恋人。") };
    const role = oneNightRoles.get(turn.roleId)!;
    if (turn.id.startsWith("doppel:")) return { id: turn.id, roleId: role.id,
      name: text(`Copied ${role.name.en} · reserved follow-up`, `复制${role.name.zh} · 预留后续环节`),
      description: text("A Doppelgänger who copied this ability acts here if eligible. The call is scheduled from the starting deck and does not disclose anyone’s copied identity.", "复制该技能的化身幽灵在符合条件时于此行动。此环节由初始牌组预先确定，不公开任何人的复制身份。"),
    };
    const description = role.id === "doppelganger" ? text("Copy another player’s starting card. Some copied actions happen immediately; recognition and reserved later abilities occur at their scheduled calls.", "复制另一位玩家的起始牌。部分技能立即执行，互认及需后续执行的技能在对应环节进行。")
      : role.id === "werewolf" ? text("Awake wolves recognize the pack; Dream Wolf stays asleep. A lone wolf may inspect a center card if the room permits it. There is no night kill.", "醒来的狼人确认狼队友，梦狼不醒。若房间允许，独狼可查看一张中央牌。夜里不刀人。")
      : role.id === "vampire" ? text("Vampire, Master and Count recognize one another and choose a non-vampire to receive the Vampire mark.", "吸血鬼、吸血鬼领主及伯爵互认，共同选择一名非吸血鬼玩家给予吸血鬼标记。")
      : role.description;
    return { id: turn.id, roleId: role.id, name: role.name, description };
  });
}

/** A public reference from the configured starting deck, never a live actor list. */
export function getNightTimeline({ variant, deck }: { variant: "werewolf" | "one-night"; deck: string[] }): NightTimelineStep[] {
  const isClassic = variant === "werewolf";
  return [
    { id: "night:start", name: text("Night falls · close your eyes", "天黑请闭眼"), description: isClassic
      ? text("After everyone reads their card and readies up, the host starts the first night. Each call opens, waits for actions, then closes. Calls remain even when the role has died; absent actors receive a private random pause.", "所有人查看身份并准备后，房主开始首夜。各环节依次睁眼、行动、闭眼。角色出局后仍保留呼叫，无可行动者时随机等待，不公开身份存亡。")
      : text("After everyone reads their starting card and readies up, the host starts the night. Follow your starting or copied role’s calls even if your physical card moves. Calls do not reveal which cards were dealt to the center.", "所有人查看初始身份并准备后，房主开始夜晚。即使实体牌被移动，仍按初始或复制身份行动。公开呼叫不会透露哪些牌位于中央。") },
    ...(isClassic ? classicTimeline(deck) : oneNightTimeline(deck)),
    { id: "night:end", name: isClassic ? text("Dawn · resolve the night", "天亮 · 结算夜晚") : text("Dawn · discuss, then vote", "天亮 · 讨论后投票"), description: isClassic
      ? text("If enabled, the first Sheriff election happens before night results are announced. Then announce deaths and silence, resolve required death abilities or badge choices, and begin daytime discussion and exile voting.", "若启用警长，首夜结束后先进行警长竞选，再公布夜间结果。随后宣布死亡及禁言，处理所需的死亡技能或警徽选择，进入白天讨论和放逐投票。")
      : text("Everyone discusses the night without peeking at their current card. The host starts voting; everyone must vote for another player. Resolve the result using the final cards, marks and artifacts.", "全员讨论夜间变化，但不可偷看当前身份。房主开启投票后，每人必须投给另一名玩家；按最终身份、标记与神器结算。") },
  ];
}
