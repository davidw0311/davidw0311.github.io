import type { Action, GameView, Localized } from "./werewolfClient";

export type WerewolfGuidance = { rules: Localized[]; tips: Localized[]; turn: Localized[] };
type RoleGuide = { rules: Localized[]; tips: Localized[]; action?: Localized };
const line = (en: string, zh: string): Localized => ({ en, zh });

const guides: Record<string, RoleGuide> = {
  villager: {
    rules: [line("You have no night ability. Help the village through discussion and voting.", "你没有夜间技能，通过发言和投票帮助好人阵营。")],
    tips: [line("Note claims and voting changes. Explain one concrete reason for your vote.", "记下身份声明和票型变化，投票时说明一个具体理由。")],
  },
  werewolf: {
    rules: [line("Every eligible wolf must submit. A target needs more than half the pack’s votes; unanimous no-kill also completes the turn.", "所有有行动权的狼人都要提交。目标须获得超过半数支持；全员选择不刀也能完成回合。")],
    tips: [line("Compare the private pack votes and agree on a target. You can revise while the pack turn is open.", "查看狼队的私密投票并统一目标，狼队回合结束前可以改票。")],
  },
  seer: {
    rules: [line("Inspect another living player for good or wolf alignment. Hidden Wolf appears good.", "每夜查验另一名存活玩家，结果为好人或狼人；隐狼会显示为好人。")],
    tips: [line("Check a claim that matters to tomorrow’s vote. A good result can also include an independent role.", "优先查验会影响明天投票的身份声明；好人结果也可能来自第三方身份。")],
    action: line("Your private result is good or wolf. Hidden Wolf and independent roles can appear good.", "你的私密结果为好人或狼人；隐狼和第三方也可能显示为好人。"),
  },
  witch: {
    rules: [line("You have one antidote and one poison for the entire game. Use at most one potion per night.", "整局只有一瓶解药和一瓶毒药，每夜最多使用一瓶，不能同夜救人又毒人。")],
    tips: [line("Check your remaining potions and the room’s self-save rule before choosing. You may save both potions for later by skipping.", "先查看剩余药剂和本房自救规则，再做决定；选择跳过可把药留到之后。")],
  },
  hunter: {
    rules: [line("A wolf kill or exile can grant one shot. Poison, dream deaths and linked deaths do not grant it.", "被狼刀或放逐后可获得一次开枪机会；中毒、摄梦或连带死亡不会获得开枪机会。")],
    tips: [line("Wait for the shooting prompt after the death announcement. You can choose not to fire.", "等待死亡播报结束后出现开枪提示，也可以选择不开枪。")],
  },
  guard: {
    rules: [line("Protect one living player, including yourself, from the pack attack. You cannot select the same seat on consecutive nights; skipping resets this restriction.", "保护一名存活玩家免受狼刀，可守自己；不能连续两夜选择同一座位，空守一夜可重置限制。")],
    tips: [line("Guard protection does not stop poison. Plan around the room’s Guard–antidote interaction.", "守护不能挡毒，请留意本房的同守同救规则。")],
    action: line("You cannot repeat last night’s selected seat. Guard blocks the pack attack, not poison; skipping resets the repeat restriction.", "不能连守昨夜所选座位；守护挡狼刀、不挡毒，空守一夜可重置连守限制。"),
  },
  idiot: {
    rules: [line("Your first exile reveals your role and leaves you alive, but permanently removes your vote and any Sheriff badge. You cannot be exiled again.", "首次被放逐会翻牌存活，但永久失去投票权和警徽，此后不能再次被放逐。")],
    tips: [line("You can still help through discussion after revealing. Other causes of death can still eliminate you.", "翻牌后仍可通过发言帮助队友，但其他死因仍会让你出局。")],
  },
  cupid: {
    rules: [line("On night one, link two living players; you may include yourself. If either dies, the other dies too.", "首夜连接两名存活玩家为情侣，可包含自己；一方死亡，另一方也会死亡。"), line("Lovers with different current teams must become the final two survivors to win together.", "当前阵营不同的情侣须成为最后两名幸存者，才能共同获胜。")],
    tips: [line("Consider the shared survival risk before pairing two players. Your choice is made only on the first night.", "选择前想清楚两人共生共死的风险，这个选择仅在首夜进行。")],
    action: line("Choose two different players to link, or skip pairing.", "选择两名不同玩家结为情侣，或跳过连接。"),
  },
  knight: {
    rules: [line("Once per game, duel another player during discussion before voting. A wolf dies; against anyone else, you die.", "整局可在投票前的讨论阶段决斗一次：对方是狼则对方死，否则你死。"), line("A duel defeats Wolf Beauty without triggering her charm. The daytime vote still happens afterward.", "决斗击杀狼美人不会触发魅惑带人；决斗后仍须进行白天投票。")],
    tips: [line("Save the duel for a strong reason to suspect a wolf; an incorrect challenge costs your life.", "有充分理由怀疑对方是狼时再决斗，判断错误会让自己出局。")],
  },
  dreamweaver: {
    rules: [line("Dream of another player to protect them from wolf attacks, poison, hunts and lethal inspections. Repeating a target on consecutive nights kills them instead.", "摄梦另一名玩家可免疫狼刀、毒、狩猎和致命查验；连续两夜摄梦同一人则会杀死对方。"), line("If you die that night, your dream target also dies.", "若你当夜死亡，摄梦目标也会死亡。")],
    tips: [line("Check last night’s target before confirming: repeating it is lethal, not another protection.", "确认前先看昨夜目标，连续摄梦会致死，不会再次保护。")],
    action: line("Choose another player to dream of, or skip. Remember the repeat-target death rule.", "选择另一名玩家摄梦，或跳过；留意连续摄梦致死规则。"),
  },
  magician: {
    rules: [line("Swap two living players for targeted night effects, including the pack attack. First-night setup choices are not swapped.", "交换两名存活玩家承受的指向性夜间效果，包括狼刀；首夜身份设置类选择不受交换影响。"), line("Each pair can be used only once, in either order.", "每一组两人整局只能交换一次，调换选择顺序也不能重复。")],
    tips: [line("Keep track of used pairs. An inspection refers to the selected seat but checks the swapped target.", "记好用过的组合；查验提示仍显示所选座位，但实际查验的是交换后的目标。")],
    action: line("Choose two different players whose pair you have not used, or skip.", "选择一组尚未用过的两名不同玩家，或跳过。"),
  },
  gravekeeper: {
    rules: [line("Learn the alignment of the previous day’s exiled player. If nobody was exiled, you receive that information instead.", "获知上个白天被放逐玩家的阵营；若无人被放逐，会得到无人出局的提示。")],
    tips: [line("Use yesterday’s result to reassess who supported or opposed that exile.", "结合昨天的放逐结果，重新审视谁支持或反对过那次投票。")],
    action: line("This check reports the previous day’s exile alignment, or that nobody was exiled. No target is needed.", "本次查验会告知上个白天的放逐者阵营，或无人被放逐；无须选目标。"),
  },
  silencer: {
    rules: [line("Silence one living player for the next day, including yourself. You cannot repeat last night’s target; skipping resets the restriction.", "禁言一名存活玩家，可选自己；不能连续选择同一人，空过一夜可重置限制。"), line("Silence blocks discussion and final words, but not Sheriff speeches, voting or abilities. It persists if you die that night.", "禁言影响讨论和遗言，不影响警长竞选发言、投票或技能；你当夜死亡也不会取消禁言。")],
    tips: [line("Consider whose discussion you would lose. Silencing a player does not remove their vote.", "考虑禁言后会失去哪位玩家的发言信息；禁言不会剥夺投票权。")],
    action: line("You cannot repeat last night’s target. Silence affects tomorrow’s discussion and final words, but preserves voting and abilities.", "不能连选昨夜目标；禁言影响明天的讨论和遗言，不影响投票和技能。"),
  },
  raven: {
    rules: [line("Mark another living player for one extra exile vote. You cannot repeat last night’s target; skipping resets the restriction.", "给另一名存活玩家标记，令其白天放逐票多算一票；不能连续标记同一人，空过一夜可重置限制。")],
    tips: [line("Your mark can break a tie. In a runoff it only counts if that player is still a candidate.", "标记可能打破平票；复投时只有目标仍在候选名单中，这一票才会计入。")],
    action: line("Your target receives one extra exile vote tomorrow. You cannot repeat last night’s target.", "目标明天会多算一票放逐票；不能连选昨夜目标。"),
  },
  demonHunter: {
    rules: [line("From night two, hunt another player: a wolf dies unless dream-protected; against a non-wolf, you die. Witch poison cannot kill you.", "从第二夜起可狩猎另一名玩家：狼人若无梦境保护则死亡，目标非狼则你死亡；你免疫女巫毒药。")],
    tips: [line("Hunting is optional. Wait for stronger evidence if a wrong guess would cost the village.", "狩猎可以跳过；若误判代价太大，可等待更充分的证据。")],
    action: line("A non-wolf target makes you die. Dream protection can block a wolf’s death; you may skip hunting.", "目标非狼会让你死亡；梦境保护可挡住对狼人的击杀，也可以跳过狩猎。"),
  },
  wolfKing: {
    rules: [line("Join the pack attack. On death you may shoot once, except after poison, failed hunt, lover, charm or dream-link deaths.", "参与狼队袭击，死亡后通常可开枪一次；中毒、狩猎失败、情侣、魅惑或梦境连带死亡除外。")],
    tips: [line("Coordinate the pack vote and wait for your private shooting prompt after death.", "统一狼队票型，死亡后等待仅自己可见的开枪提示。")],
  },
  whiteWolfKing: {
    rules: [line("Join the pack attack. During discussion before voting, self-destruct and optionally take another living player with you.", "参与狼队袭击；可在投票前讨论阶段自爆，并选择带走另一名存活玩家。")],
    tips: [line("Self-destruction costs your own life. Choose the accompanying target before confirming.", "自爆会让自己出局，如需带人，请先选好目标再确认。")],
  },
  wolfBeauty: {
    rules: [line("Join the pack and charm another living player each night. You cannot repeat last night’s target.", "参与狼队袭击，每夜魅惑另一名存活玩家，不能连续选择同一人。"), line("If exiled or shot, your current charm target dies without a death ability. A duel or poison does not trigger the charm.", "被放逐或开枪带走时，当前魅惑目标会连带死亡且不触发死亡技能；决斗或中毒不触发魅惑。")],
    tips: [line("Charm expires at the next night. You cannot self-destruct.", "魅惑在下一夜开始时失效；你不能自爆。")],
    action: line("You cannot repeat last night’s charm target. Only your exile or shooting death triggers the charm link.", "不能连续魅惑同一人；只有你被放逐或开枪带走才触发魅惑连带。"),
  },
  hiddenWolf: {
    rules: [line("You see the pack but remain hidden from it. Seer reads you as good. Inherit the pack attack when ordinary attacking wolves are gone.", "你能看到狼队，但狼队看不到你；预言家验你为好人。普通可刀狼人全部出局后，你继承狼刀。")],
    tips: [line("You cannot self-destruct. Wait for an actual pack action prompt before trying to attack.", "你不能自爆，只有出现狼队行动提示时才能出刀。")],
  },
  gargoyle: {
    rules: [line("Inspect another player’s exact role without joining the ordinary pack. Never inspect the same selected seat twice.", "独立查验另一名玩家的具体身份，不加入普通狼队；同一所选座位整局不能重复查验。"), line("Inherit the pack attack when ordinary attacking wolves are gone. You cannot self-destruct.", "普通可刀狼人全部出局后继承狼刀；你不能自爆。")],
    tips: [line("Use each check on a new player whose claimed role you want to verify.", "每次查验一名尚未查过、且身份声明值得核实的玩家。")],
    action: line("You learn an exact role. Each selected seat can be checked only once in the whole game.", "你能获知具体身份，每个所选座位整局只能查验一次。"),
  },
  mechanicalWolf: {
    rules: [line("On night one, copy another player’s starting role. Supported copies are Seer, Guard, Witch, Raven, Gravekeeper, Demon Hunter and Hunter; other roles give a Seer ability.", "首夜复制另一名玩家的初始身份。支持预言家、守卫、女巫、乌鸦、守墓人、猎魔人和猎人；其他身份会获得预言家技能。"), line("You remain a wolf, join the pack attack, and use the copied ability in its own turn.", "你仍属狼人阵营，既参与狼队袭击，也在对应回合使用复制技能。")],
    tips: [line("Choose the ability you want for the rest of the game. Copying does not change the other player.", "选择你希望整局使用的技能；复制不会改变被复制玩家。")],
    action: line("Choose another player whose starting ability you want to copy, or skip copying.", "选择另一名玩家复制其初始技能，或跳过复制。"),
  },
  bloodMoonApostle: {
    rules: [line("Self-destruct during discussion to suppress village powers for the next night. This seal only affects that night, not daytime abilities.", "讨论阶段自爆可封印下一夜的好人技能；这个封印仅影响该夜，不封印白天技能。"), line("If exiled as the last wolf, remain alive for one final night, then die at dawn. You can still complete the wolf objective that night.", "作为最后一狼被放逐时，会再存活一夜并在次日天亮出局；那一夜仍可达成狼人胜利条件。")],
    tips: [line("The daytime vote still happens after a self-destruction. Plan the next night’s attack with your pack.", "自爆后仍须完成白天投票，请和狼队规划下一夜的袭击。")],
  },
  pureWhite: {
    rules: [line("Inspect another player’s exact role each night. From night two, inspecting a wolf also kills that target unless dream-protected.", "每夜查验另一名玩家的具体身份；第二夜起，验到狼人还会将其击杀，梦境保护可挡住击杀。")],
    tips: [line("Night one gathers information; later checks can also remove wolves.", "首夜侧重收集信息，之后的查验还可以消灭狼人。")],
    action: line("Choose another player for an exact-role check, or skip.", "选择另一名玩家查验具体身份，或跳过。"),
  },
  wolfWitch: {
    rules: [line("Join the pack and inspect a non-wolf’s exact role. From night two, checking Pure White kills her unless dream-protected. You have no poison potion.", "参与狼队袭击，并查验非狼玩家的具体身份；第二夜起验到纯白之女会击杀她，梦境保护可挡住。你没有毒药。")],
    tips: [line("Your inspection and pack attack are separate decisions. Wolf teammates cannot be inspection targets.", "查验和狼队袭击是两个独立选择，查验不能选择狼队友。")],
    action: line("Choose an available non-wolf for an exact-role check, or skip.", "选择一名可选的非狼玩家查验具体身份，或跳过。"),
  },
  wildChild: {
    rules: [line("Start in the village and choose another player as your idol on night one. If that player dies, become a wolf and join the pack.", "初始属于好人阵营，首夜选择另一名玩家为榜样；榜样死亡后变为狼人并加入狼队。")],
    tips: [line("Your objective changes when your idol dies. Check your current team before planning your next move.", "榜样死亡后，你的胜利目标会改变；行动前请确认自己当前的阵营。")],
    action: line("Choose another player as your idol, or skip choosing an idol.", "选择另一名玩家作为榜样，或跳过选择。"),
  },
  wolfHound: {
    rules: [line("On night one, permanently choose village or wolf. Choosing wolf lets you join the pack attack; village has no night ability afterward.", "首夜永久选择好人或狼人阵营；选择狼人可加入狼队袭击，选择好人后不再有夜间技能。")],
    tips: [line("Choose your team deliberately. If the host skips your unsubmitted choice, you stay village.", "谨慎选择阵营；若房主跳过你尚未提交的选择，你会保留好人阵营。")],
    action: line("Choose village or wolf and confirm. This team choice is permanent.", "选择好人或狼人阵营并确认，这个选择不能更改。"),
  },
  thief: {
    rules: [line("On night one, permanently become Seer or Guard. These are the two reserve roles in this room.", "首夜永久变为预言家或守卫，这是本房提供的两个备用身份。")],
    tips: [line("Choose information as Seer or protection as Guard. A host skip defaults an unsubmitted choice to Guard.", "预言家提供信息，守卫提供保护；若房主跳过尚未提交的选择，会默认变为守卫。")],
    action: line("Choose Seer or Guard and confirm your new role.", "选择预言家或守卫，确认自己的新身份。"),
  },
  piper: {
    rules: [line("Charm up to two other living, uncharmed players each night. Win by surviving until every other survivor is charmed, after deaths and shots resolve.", "每夜魅惑最多两名尚未被魅惑的其他存活玩家；死亡和开枪结算后，若你存活且其余幸存者全被魅惑，你获胜。")],
    tips: [line("Charmed players know each other. Balance spreading charm with keeping yourself alive.", "被魅惑者互相知晓，请在扩大魅惑范围和自身生存之间做选择。")],
    action: line("Choose one or two eligible players to charm, or skip.", "选择一至两名可选玩家魅惑，或跳过。"),
  },
  angel: {
    rules: [line("Win alone if exiled in the first completed exile round. Otherwise become village when that round ends, including a no-exile tie. Night death does not win.", "在首次完成的放逐轮次中被放逐即可单独获胜；否则该轮结束后转为好人，包括平票无人出局。夜间死亡不算获胜。")],
    tips: [line("Your special objective has only one exile-round window. Check your current team afterward.", "你的特殊目标只有首次放逐轮次这一次机会，之后请留意当前阵营。")],
  },
  elder: {
    rules: [line("Survive the first unprotected pack attack. If killed by exile, Witch poison or a death shot, village night actions, Knight duels and Hunter shots are disabled for the rest of the game.", "可承受首次未被防住的狼刀；若被放逐、女巫毒杀或死亡开枪带走，好人夜间行动、骑士决斗及猎人开枪永久停用。")],
    tips: [line("Help the village avoid an accidental exile or shot at you. Your extra life only covers a pack attack.", "帮助好人避免误放逐或误枪你；额外生命只针对狼刀。")],
  },
  scapegoat: {
    rules: [line("This room uses the villager version: no tie sacrifice. The first exile tie triggers a runoff; a second tie kills nobody and starts night.", "本房按普通村民玩法，不启用平票牺牲。首次放逐平票会复投，再次平票无人死亡并进入夜晚。")],
    tips: [line("Focus on discussion and votes. You do not need to sacrifice yourself when the ballot ties.", "专注发言和投票，平票时不需要牺牲自己。")],
  },
  jester: {
    rules: [line("Win alone when exiled by the vote. Other causes of death do not satisfy your objective.", "被投票放逐即可单独获胜；其他死因不会达成你的胜利目标。")],
    tips: [line("Keep the difference between exile and other deaths in mind when planning your play.", "制定策略时，注意区分放逐和其他死亡方式。")],
  },
};

const copiedNames: Record<string, Localized> = {
  seer: line("Seer", "预言家"), guard: line("Guard", "守卫"), witch: line("Witch", "女巫"),
  raven: line("Raven", "乌鸦"), gravekeeper: line("Gravekeeper", "守墓人"),
  demonHunter: line("Demon Hunter", "猎魔人"), hunter: line("Hunter", "猎人"),
};

function protectionRule(view: GameView): Localized {
  return view.settings.guardAntidote === "kill"
    ? line("Room rule: Guard + antidote on the pack target cancel their protection; the wolf attack goes through.", "本房规则：同守同救会抵消这两种保护，狼刀仍然生效。")
    : line("Room rule: Guard + antidote together still block the pack attack.", "本房规则：同守同救仍可挡住狼刀。");
}

function witchRules(view: GameView): Localized[] {
  const selfSave = view.settings.witchSelfSave === "firstNight"
    ? line("Room rule: you may use the antidote on yourself only on night one.", "本房规则：只有首夜可以使用解药自救，第二夜起不能自救。")
    : view.settings.witchSelfSave === true
      ? line("Room rule: you may use the antidote on yourself on any night, while it remains unused.", "本房规则：只要解药尚未使用，每一夜都允许自救。")
      : line("Room rule: you may never use the antidote on yourself, including night one.", "本房规则：不能使用解药自救，首夜也不例外。");
  return [selfSave, protectionRule(view), line("The attacked player is shown only while you still hold the antidote.", "只有解药尚未使用时，才会显示狼队袭击目标。")];
}

function optionIds(action: Action): string[] {
  return (action.options || []).map(option => typeof option === "string" ? option : option.id || option.value || "");
}

function witchTurn(view: GameView, action: Action): Localized[] {
  const me = view.me!;
  const options = optionIds(action);
  const remaining = line(
    `Potions: antidote ${me.roleState.antidoteUsed ? "spent" : "remaining"}; poison ${me.roleState.poisonUsed ? "spent" : "remaining"}. Choose at most one potion tonight, or skip.`,
    `药剂：解药${me.roleState.antidoteUsed ? "已用" : "剩余一瓶"}；毒药${me.roleState.poisonUsed ? "已用" : "剩余一瓶"}。本夜最多用一瓶，也可跳过。`,
  );
  const selfAttacked = action.victimId === me.seatId;
  const save = options.includes("save")
    ? selfAttacked
      ? line("You are the pack target and self-save is available tonight. Save uses your only antidote.", "你是狼队目标，本夜可以自救；救人会用掉唯一的解药。")
      : line("Save is available for the displayed pack target. It uses your only antidote.", "可以救显示的狼队目标，这会用掉唯一的解药。")
    : me.roleState.antidoteUsed
      ? line("Your antidote is spent. The pack target is hidden from you.", "解药已使用，狼队目标不再向你显示。")
      : selfAttacked
        ? view.settings.witchSelfSave === "firstNight"
          ? line("You are the pack target. Self-save was allowed only on night one; this rule does not allow saving yourself tonight.", "你是狼队目标。本房仅首夜允许自救，第二夜起不能自救。")
          : line("You are the pack target, but this room’s self-save rule does not allow saving yourself tonight.", "你是狼队目标，但本房自救规则不允许你在本夜自救。")
        : line("Save is unavailable now. Use only the options shown for this turn.", "当前无法使用解药，请按本回合显示的选项行动。");
  return [remaining, save];
}

function turnGuidance(view: GameView, role: string, effectiveRole: string): Localized[] {
  const me = view.me;
  if (!me || me.roleId !== role) return [];
  if (view.status === "finished") return [line("The game is over. Review the revealed roles and replay together.", "游戏已结束，可以一起查看公开身份和复盘。")];
  if (view.status === "disbanded") return [line("This room has closed.", "房间已关闭。")];
  if (view.phase.paused) return [line("The game is paused. Wait for the host to resume before acting.", "游戏已暂停，请等房主继续后再行动。")];
  if (view.phase.kind === "ready") return [me.ready
    ? line("You are ready. Keep your card private and wait for the host to begin.", "你已准备，请保密身份卡并等待房主开始。")
    : line("Read your role and room rules privately, then tap Ready.", "私下阅读身份和本房规则，然后点击准备。")];
  const action = me.action;
  if (action?.kind === "shoot") return [line("Your shot is available now. Choose another living player, or explicitly choose not to shoot.", "现在可以开枪，选择另一名存活玩家，或明确选择不开枪。")];
  if (me.canPassBadge) return [line("Choose a living player to receive the Sheriff badge, or destroy it. The game waits for this decision.", "选择一名存活玩家接警徽，或撕毁警徽；游戏会等待这个决定。")];
  if (!me.alive) return [line("You are eliminated. Follow any last-words instructions and wait; you have no action now.", "你已出局，请遵守遗言安排并等待；当前没有可执行的行动。")];
  if (view.phase.kind === "announcement") return [line("Listen to the announcement. Any available follow-up action appears afterward.", "请听完播报，若有后续行动，会在播报后显示。")];
  if (view.phase.kind === "voting") {
    if (!action) return [line("You are not eligible to vote in this ballot. Wait for the eligible voters.", "本轮你没有投票资格，请等待有投票权的玩家。")];
    if (action.alreadySubmitted) return [line("Your ballot is recorded. You may revise it while this ballot remains open.", "你的投票已记录，本轮投票结束前仍可修改。")];
    return [view.phase.step === "sheriff"
      ? line("Vote for an available Sheriff candidate or abstain. Candidates tied in the runoff cannot vote; other eligible players can.", "投给可选的警长候选人，或弃票。复投时平票候选人不能投票，其他有投票权的玩家可以。")
      : line("Vote for an available player or abstain. Everyone eligible must submit, including abstentions.", "投给一名可选玩家，或弃票。所有有投票权的玩家都须提交，弃票也要确认。")];
  }
  if (view.phase.kind === "sheriff") return [view.phase.step === "nomination"
    ? view.election?.declaredIds.includes(me.seatId)
      ? line("Your candidacy decision is recorded. Wait for everyone to declare.", "你的上警决定已记录，请等全员作出决定。")
      : line("Choose whether to run for Sheriff. The first night’s deaths are announced after the election.", "选择是否上警，首夜死亡结果会在竞选结束后公布。")
    : view.speakerSeatId === me.seatId
      ? line("It is your Sheriff speech. Explain your case, then mark your speech finished.", "轮到你竞选发言，请说明理由，结束后确认发言完成。")
      : line("Listen to the current Sheriff candidate and wait for your speaking or voting prompt.", "听取当前候选人发言，等待自己的发言或投票提示。")];
  if (view.phase.kind === "night") {
    if (view.phase.nightStage === "opening") return [line("Wait for the role announcement to finish. Your controls appear when your action opens.", "等待身份播报结束，轮到你行动时会显示操作。")];
    if (view.phase.nightStage === "closing") return [line("This role’s turn is closing. Wait for the next announcement.", "该身份回合正在结束，请等待下一段播报。")];
    if (!action) {
      if (effectiveRole === "witch" && me.roleState.antidoteUsed && me.roleState.poisonUsed) return [line("Both potions are spent. You have no Witch action; wait for the next phase.", "两瓶药都已使用，没有女巫行动，请等待下一阶段。")];
      if (effectiveRole === "demonHunter" && view.phase.number === 1) return [line("Your hunt begins on night two. Wait through the first night.", "猎魔从第二夜开始，首夜请等待。")];
      // Public views deliberately do not reveal why a power is unavailable.
      return [line("You have no action available in this step. Wait for your next prompt.", "这个阶段没有可执行的行动，请等待下一次提示。")];
    }
    if (action.alreadySubmitted) return [action.step === "wolves"
      ? line("Your pack choice is recorded. You may revise until every wolf submits and more than half agree on a target, or everyone chooses no kill.", "你的狼队选择已记录；全员提交且目标获过半支持，或全员选择不刀后结束，此前可修改。")
      : line("Your action is submitted and cannot be changed. Wait for this turn to finish.", "行动已提交，不能再更改，请等待本回合结束。")];
    if (action.step === "wolves") return [guides.werewolf.rules[0], guides.werewolf.tips[0]];
    if (action.step === "witch") return witchTurn(view, action);
    if (action.step === "guard") return [guides.guard.action!, protectionRule(view)];
    if (action.step === "pureWhite") return [view.phase.number >= 2
      ? line("From night two, a wolf inspection is lethal unless dream-protected. You still receive the exact role.", "第二夜起，验到狼人会将其击杀，梦境保护可挡住；你仍会得到具体身份。")
      : line("Night one checks the exact role only; lethal wolf checks start on night two.", "首夜只查验具体身份，从第二夜起验狼才会致命。")];
    if (action.step === "wolfWitch") return [view.phase.number >= 2
      ? line("Checking Pure White is lethal from night two unless dream-protected. You can inspect only non-wolves and have no poison potion.", "第二夜起验到纯白之女会致命，梦境保护可挡住；只能验非狼玩家，你没有毒药。")
      : line("Night one checks a non-wolf’s exact role only. You have no poison potion.", "首夜只查验非狼玩家的具体身份，你没有毒药。")];
    const actionRole = action.step === "opening" ? role : action.step;
    return guides[actionRole]?.action ? [guides[actionRole].action!] : [line("Follow the available choices and confirm your action.", "按可用选项作出选择并确认。")];
  }
  if (view.phase.kind === "day") {
    if (view.phase.step === "afterVote") return [line("Today’s vote is complete. Wait for the host to begin the next night.", "今天的投票已完成，请等待房主开始下一夜。")];
    const turn: Localized[] = [];
    if (view.seats.find(seat => seat.id === me.seatId)?.silenced) turn.push(line("You are silenced for discussion and final words today. You may still vote and use available abilities.", "你今天不能讨论或说遗言，但仍可投票和使用可用技能。"));
    else turn.push(line("Listen to the discussion and prepare a reason for your vote.", "听取讨论，并准备说明自己的投票理由。"));
    if (me.canDuel) turn.push(line("Your one duel is available before voting. Use it only when you are ready to risk being wrong.", "投票前可使用唯一一次决斗，请在愿意承担误判风险时再使用。"));
    else if (me.canExplode) turn.push(line("Self-destruct is available before voting and will eliminate you. Confirm only if that is your intended move.", "投票前可以自爆，自爆会让你出局，确认前请想清楚。"));
    return turn;
  }
  return [];
}

/** Card copy uses configured rules; turn copy uses only this player's server-authorized action. */
export function getWerewolfGuidance(view: GameView, roleId?: string): WerewolfGuidance {
  const role = roleId ?? view.me?.roleId ?? "";
  const guide = guides[role];
  if (!guide) return { rules: [], tips: [], turn: [] };
  const ownCard = view.me?.roleId === role;
  const copiedRole = ownCard && role === "mechanicalWolf" && typeof view.me?.roleState.copiedRole === "string" ? view.me.roleState.copiedRole : "";
  const effectiveRole = copiedNames[copiedRole] ? copiedRole : role;
  const rules = [...guide.rules], tips = [...guide.tips];
  if (copiedNames[copiedRole]) {
    const name = copiedNames[copiedRole];
    rules.splice(0, rules.length, line(`Your copied ability: ${name.en}. You remain a wolf and still join the pack attack.`, `你复制的技能是${name.zh}，仍属狼人并参与狼队袭击。`), ...guides[copiedRole].rules);
    tips.splice(0, tips.length, ...guides[copiedRole].tips);
  }
  if (effectiveRole === "witch") rules.push(...witchRules(view).slice(0, copiedRole ? 2 : 3));
  if (effectiveRole === "guard") rules.push(protectionRule(view));
  return { rules, tips, turn: turnGuidance(view, role, effectiveRole) };
}
