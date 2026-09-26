"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Modal as SharedModal, RoomToolbar, InvitePanel } from "@/app/nightfall/ui/RoomChrome";
import { ArrowLeft, ArrowRight, ArrowClockwise, BookOpen, Check, CheckCircle, Circle, Crown, Eye, GearSix, HandPalm, Heart, Hourglass, Info, LockKey, MaskHappy, Moon, MusicNotes, Pause, Play, Plus, Shield, SpeakerHigh, Sun, Translate, Trash, Users, WarningCircle, WifiSlash, X } from "@phosphor-icons/react";
import catalogueData from "@/public/assets/werewolf/roles.json";
import audioManifest from "@/public/assets/werewolf/audio/manifest.json";
import { useWerewolfRoom, type Action, type Catalogue, type Command, type GameView, type Language, type Localized, type Role, type Settings } from "@/lib/werewolfClient";
import { WerewolfAudio } from "@/lib/werewolfAudio";
import { CircleSeats, ProfilePicker, WolfHead } from "./PlayerFeatures";
import { AudioVolumeControls, useAudioLevels } from "@/app/nightfall/ui/AudioVolumeControls";
import { RoleCard } from "@/app/nightfall/ui/RoleCard";
import { RoleIcon } from "./RoleIcon";
import { VictorySummary } from "@/app/nightfall/VictorySummary";
import { classicVictory } from "@/lib/nightfallVictory";
import { RoleLineup } from "@/app/nightfall/RoleLineup";
import { BotControls, BotLabel, BotNotice } from "./BotControls";
import { RoleGuidance } from "./RoleGuidance";
import { StageBanner, ElectionPanel, VoteReview, SpeakingTimer, stageText } from "./RoomStage";
import { normalizeRoomCode } from "@/lib/werewolfEntry";
import musicTracks from "@/public/assets/werewolf/audio/music.json";
import styles from "./werewolf.module.css";

const catalogue = catalogueData as Catalogue;
const roleMap = Object.fromEntries(catalogue.roles.map((role) => [role.id, role]));
const stepLabels: Record<string, Localized> = {
  ready: { en: "Read your card & ready up", zh: "查看身份并准备" },
  cupid: { en: "Cupid, wake up", zh: "丘比特请睁眼" }, wildChild: { en: "Wild Child, wake up", zh: "野孩子请睁眼" }, wolfHound: { en: "Wolf Hound, wake up", zh: "狼狗请睁眼" }, thief: { en: "Thief, wake up", zh: "盗贼请睁眼" },
  afterVote: { en: "The village has decided", zh: "村庄已做出决定" },
  lobby: { en: "Gather your village", zh: "召集你的村庄" }, opening: { en: "The first secrets", zh: "首夜身份行动" }, wolves: { en: "Werewolves, wake up", zh: "狼人请睁眼" }, seer: { en: "Seer, wake up", zh: "预言家请睁眼" }, witch: { en: "Witch, wake up", zh: "女巫请睁眼" }, guard: { en: "Guard, wake up", zh: "守卫请睁眼" }, discussion: { en: "The village has the floor", zh: "天亮了，请发言" }, exile: { en: "Who do you suspect?", zh: "请投票放逐" }, sheriff: { en: "Elect your sheriff", zh: "警长竞选" }, shoot: { en: "One last shot", zh: "请发动开枪技能" }, finished: { en: "The truth comes out", zh: "真相揭晓" }, dawn: { en: "Day breaks", zh: "天亮了" }, night: { en: "Night falls", zh: "天黑请闭眼" }, day: { en: "The village has the floor", zh: "天亮了，请发言" }, voting: { en: "Cast your vote", zh: "请投票" }, reaction: { en: "A final decision", zh: "最后的选择" }, gravekeeper: { en: "Gravekeeper, wake up", zh: "守墓人请睁眼" }, dreamweaver: { en: "Dreamweaver, wake up", zh: "摄梦人请睁眼" }, magician: { en: "Magician, wake up", zh: "魔术师请睁眼" }, raven: { en: "Raven, wake up", zh: "乌鸦请睁眼" }, demonHunter: { en: "Demon Hunter, wake up", zh: "猎魔人请睁眼" }, wolfBeauty: { en: "Wolf Beauty, wake up", zh: "狼美人请睁眼" }, gargoyle: { en: "Gargoyle, wake up", zh: "石像鬼请睁眼" }, pureWhite: { en: "Pure White Seer, wake up", zh: "纯白之女请睁眼" }, wolfWitch: { en: "Wolf Witch, wake up", zh: "狼巫请睁眼" }, piper: { en: "Piper, wake up", zh: "吹笛者请睁眼" }, badge: { en: "Pass the sheriff badge", zh: "移交警徽" }, vote: { en: "Cast your vote", zh: "请投票" }, firstNight: { en: "The first night", zh: "第一个夜晚" }, resolve: { en: "The night is ending", zh: "结算夜间行动" }, hunter: { en: "Hunter, take your shot", zh: "猎人请开枪" }, sheriffVote: { en: "Elect your sheriff", zh: "警长竞选" }, exileVote: { en: "Who do you suspect?", zh: "请投票放逐" }, nightResult: { en: "Day breaks", zh: "天亮了" }, gameOver: { en: "The truth comes out", zh: "真相揭晓" }, bloodMoon: { en: "A blood moon rises", zh: "血月降临" }, copied: { en: "Copied abilities", zh: "复制技能行动" }, mechanicalWolf: { en: "Mechanical Wolf, wake up", zh: "机械狼请睁眼" }, lovers: { en: "Lovers, meet each other", zh: "情侣请相认" }, charm: { en: "A secret enchantment", zh: "秘密魅惑" }, end: { en: "The truth comes out", zh: "真相揭晓" },
};
const choiceLabels: Record<string, Localized> = { save: { en: "Use antidote", zh: "使用解药" }, antidote: { en: "Use antidote", zh: "使用解药" }, poison: { en: "Use poison", zh: "使用毒药" }, inspect: { en: "Inspect", zh: "查验" }, skip: { en: "Do nothing", zh: "不使用技能" }, village: { en: "Village", zh: "好人阵营" }, wolf: { en: "Werewolves", zh: "狼人阵营" }, none: { en: "No ability", zh: "不使用技能" }, protect: { en: "Protect", zh: "守护" }, attack: { en: "Attack", zh: "击杀" }, seer: { en: "Become Seer", zh: "成为预言家" }, guard: { en: "Become Guard", zh: "成为守卫" } };
const witchSelfSaveLabels: Record<string, Localized> = {
  never: { en: "Never", zh: "不能自救" },
  firstNight: { en: "First night only", zh: "仅首夜可自救" },
  always: { en: "Any night", zh: "任何夜晚均可自救" },
};
function witchSelfSaveRule(value: Settings["witchSelfSave"]) { return value === "firstNight" ? "firstNight" : value === true ? "always" : "never"; }
const errorChinese: Record<string, string> = {
  BOT_IDLE: "当前没有机器人需要行动。请完成真人行动，或使用房主控制推进。", INVALID_BOT_MODE: "请选择自动或手动模式。", BOT_HOST: "机器人不能成为房主。", INVALID_BOT_COUNT: "请选择有效的机器人数量，房间最多24个座位。",
  INVALID_TIMER: "请选择5至900秒。",
  VOTES_PENDING: "所有有投票权的玩家必须投票或弃票。", DECLARATIONS_PENDING: "请等待所有玩家选择是否上警。", ELECTION_AUTOMATIC: "首夜后自动开始竞选，由房主开启发言和投票，投票等待所有有投票权的玩家提交。",
  "room-disbanded": "房主已解散房间。", NOT_READY: "所有玩家查看身份并准备后才能开始首夜。", VOTE_REQUIRED: "请先完成今天的放逐投票。", VOTE_COMPLETE: "今天的放逐投票已经完成。", INVALID_PHOTO: "请选择头像图标或小尺寸JPEG图片。",
  NIGHT_FLOW_CONTROLLED: "夜间由语音与玩家行动自动推进，无需房主操作。", ACTION_ALREADY_SUBMITTED: "行动已提交，请等待其他玩家完成。", PAUSE_REQUIRED: "请先暂停夜间流程，再使用紧急跳过。",
  NOT_SEATED: "此会话已失去座位，请重新申请加入。", SESSION_REPLACED: "此座位已在其他设备恢复，请重新申请加入。", ROOM_NOT_FOUND: "未找到房间，请检查房间码。", ROOM_EXPIRED: "房间已过期，请创建新房间。", INVALID_TOKEN: "会话无效，请重新加入。", EXPIRED_PHASE: "当前阶段计时已结束，正在更新进度，请稍后重试。", STALE_PHASE: "游戏已进入新阶段，请按最新提示操作。", WRONG_PHASE: "当前阶段不能进行此操作。", PAUSED: "牌局已暂停，请等待房主继续。", HOST_ONLY: "此操作仅限房主。", HOST_SEAT: "请先移交房主，再替换此座位。", EMPTY_SEATS: "请为所有预留座位安排玩家后再开始。", INVALID_DECK: "角色配置无效。请确保人数相符、包含狼人和平民阵营，并遵循唯一角色限制。", INVALID_SETTINGS: "请检查计时范围及规则设置。", INVALID_TARGET: "请选择符合条件的目标。", INVALID_ACTION: "请选择可用的技能或跳过行动。", INVALID_NAME: "请输入1–24字的有效名字。", NO_ABILITY: "你在当前阶段没有这项技能。", NO_VOTE: "你当前没有投票权。", PLAYER_COUNT: "游戏需要6–24名玩家。", ROOM_FULL: "房间最多支持24个座位。", REPLACEMENT_REQUIRED: "游戏进行中请选择原有座位进行接替。", REQUEST_EXPIRED: "此加入申请已处理或失效。", RATE_LIMIT: "操作频繁，请稍后重试。", ROOM_BUSY: "多人正在操作，请稍后重试。", SILENCED: "今日被禁言，仍可投票及发动技能。", CHAT_CLOSED: "此阶段无法在当前频道发言。", INVALID_MESSAGE: "消息须包含1–500个字符。", GAME_RUNNING: "请在本局结束后重置游戏。", RECOVERY_SEATED: "此会话已有座位，请使用新的会话恢复房主。", DISABLED: "房间未启用此功能。", connection: "无法连接游戏服务，请检查网络后重试。", "temporarily-unavailable": "房间暂时无法连接，游戏已保存，请稍后重试。", "too-many-requests": "操作频繁，请稍后重试。", "room-not-found": "房间不存在、已结束或已过期，请创建或加入新房间。", "room-expired": "房间已过期，请创建新房间。", "room-finished": "本局已结束，请创建新房间。", "room-busy": "多人正在操作，请稍后重试。", "invalid-recovery-key": "房主恢复密钥无效，请检查后重试。", "invalid-room-code": "请输入4个字母的房间码，旧版8位邀请码仍可使用。"
};
function text(value: Localized | string | undefined | null, lang: Language): string { return typeof value === "string" ? value : value?.[lang] || ""; }
function roleIcon(role?: Role, size = 24) { return <RoleIcon role={role} size={size} />; }
// Only the game-content class and dismissal policy are specific to this adapter.
function Modal(props: { title: string; children: ReactNode; onClose: () => void; dismissOutside?: boolean }) {
  return <SharedModal dismissOutside={false} {...props} className={styles.modal}/>;
}

export default function WerewolfApp() {
  const room = useWerewolfRoom();
  const [lang, setLang] = useState<Language>("en");
  const [entry, setEntry] = useState<"create" | "join" | "recover">("join");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [skipPhaseId, setSkipPhaseId] = useState<string | null>(null);
  const [restartPhaseId, setRestartPhaseId] = useState<string | null>(null);
  const [modal, setModal] = useState<"lineup" | "library" | "settings" | "people" | "recovery" | "rules" | "leave" | "invite" | "hardSkip" | "restart" | "profile" | "history" | "disband" | "credits" | "votes" | "card" | null>(null);
  const [seenKey, setSeenKey] = useState<string | null>(null);
  const [dismissedInspection, setDismissedInspection] = useState("");
  const rungTimers = useRef(new Set<string>());
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);
  const [tab, setTab] = useState<"events" | "chat">("events");
  const { levels, changeLevels } = useAudioLevels();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [musicTrack, setMusicTrack] = useState(musicTracks[0].id);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundReady, setSoundReady] = useState(false);

  const [completedNarration, setCompletedNarration] = useState<string | null>(null);
  const [audioError, setAudioError] = useState("");
  const audioRef = useRef<WerewolfAudio | null>(null);
  const [now, setNow] = useState(0);
  const view = room.view;
  const victory = view ? classicVictory(view) : null;
  useEffect(() => { if (view?.status === "finished") { const frame = requestAnimationFrame(() => setModal(null)); return () => cancelAnimationFrame(frame); } }, [view?.status]);
  const identityKey = `${view?.code}:${view?.gameId}:${view?.status}:${view?.me?.seatId}:${view?.me?.roleId}`;
  const revealed = revealedKey === identityKey;
  const setRevealed = (show: boolean) => { setRevealedKey(show ? identityKey : null); if (show) setSeenKey(identityKey); };
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
    try {
      if (localStorage.getItem("nightfall.language") === "zh") setLang("zh");
      const preferences = JSON.parse(localStorage.getItem("nightfall.audio") || "null");
      if (typeof preferences?.voice === "boolean") setAudioEnabled(preferences.voice);
      if (typeof preferences?.music === "boolean") setMusicEnabled(preferences.music);
      if (musicTracks.some(track => track.id === preferences?.track)) setMusicTrack(preferences.track);
    } catch { /* no-op */ }
    const queryCode = new URLSearchParams(window.location.search).get("room");
    if (queryCode) { setCode(queryCode.toUpperCase()); setEntry("join"); }
    setNow(Date.now());
    });
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => { cancelAnimationFrame(frame); clearInterval(interval); };
  }, []);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.configure({...levels, voice: audioEnabled, music: musicEnabled, track: musicTrack, language: lang, active: !!view?.me });
    if (view?.phase) audio.updatePhase(view.phase);
  }, [audioEnabled, musicEnabled, musicTrack, lang, view?.me, view?.phase, room.connectivity, levels]);
  useEffect(() => () => { audioRef.current?.dispose(); audioRef.current = null; }, []);
  const moderatorAudio = () => {
    if (!audioRef.current) audioRef.current = new WerewolfAudio((status, message) => {
      setAudioError(status === "error" || status === "locked" ? message || "unavailable" : "");
      if (status === "locked" || status === "error") setSoundReady(false);
      else if (status === "ready" || status === "playing") setSoundReady(true);
    }, setCompletedNarration);
    return audioRef.current;
  };
  const changeAudio = (voice: boolean, music: boolean) => {
    setAudioEnabled(voice); setMusicEnabled(music); setAudioError("");
    try { localStorage.setItem("nightfall.audio", JSON.stringify({ voice, music, track: musicTrack })); } catch { /* no-op */ }
    const audio = moderatorAudio();
    audio.configure({...levels, voice, music, track: musicTrack, language: lang, active: !!view?.me });
    if (view?.phase) audio.updatePhase(view.phase);
    // Unlock directly in the opt-in gesture, before any network request.
    if (voice || music) void audio.unlock().catch(() => setAudioError("unavailable"));
  };
  const testSound = () => {
    const audio = moderatorAudio();
    audio.configure({...levels, voice: audioEnabled, music: musicEnabled, track: musicTrack, language: lang, active: !!view?.me });
    if (view?.phase) audio.updatePhase(view.phase);
    void audio.testSound();
  };
  useEffect(() => {
    const timer = view?.speakingTimer;
    if (!timer?.endsAt || view?.phase.paused || !soundReady) return;
    const lateness = now + (view?.clockOffset || 0) - timer.endsAt;
    if (lateness < 0 || lateness > 10000 || rungTimers.current.has(timer.id)) return;
    if (audioRef.current?.ringTimer()) rungTimers.current.add(timer.id);
  }, [now, soundReady, view?.speakingTimer, view?.phase.paused, view?.clockOffset]);
  const narrationPhaseId = view?.phase.id;
  const narrationStage = view?.phase.kind === "announcement" ? "announcement" : view?.phase.nightStage;
  const narrationPaused = view?.phase.paused;
  // A muted host still leaves time for Brian on another player's device.
  const clips = audioManifest.clips as Record<string, { duration: number }>;
  const silentNarrationMs = Math.ceil(Math.max(...["en", "zh"].map((language) =>
    (view?.phase.publicCues || view?.phase.nightCues || []).reduce((total, cue) => total + (clips[`${language}:${cue}`]?.duration || 12), 0))) * 1000) + 2500;
  const narratorHost = view?.isHost;
  const acknowledgeNarration = room.acknowledgeNightNarration;
  useEffect(() => {
    if (!narratorHost || !narrationPhaseId || narrationPaused || room.connectivity !== "online" || (narrationStage !== "opening" && narrationStage !== "closing" && narrationStage !== "announcement")) return;
    if (audioEnabled && completedNarration !== narrationPhaseId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const acknowledge = async () => {
      const okay = await acknowledgeNarration(narrationPhaseId);
      if (!okay && !stopped) timer = setTimeout(() => void acknowledge(), 2500);
    };
    timer = setTimeout(() => void acknowledge(), audioEnabled ? 0 : silentNarrationMs);
    return () => { stopped = true; clearTimeout(timer); };
  }, [narratorHost, narrationPhaseId, narrationStage, narrationPaused, room.connectivity, audioEnabled, completedNarration, acknowledgeNarration, silentNarrationMs]);
  const toggleLanguage = () => { const next = lang === "en" ? "zh" : "en"; setLang(next); try { localStorage.setItem("nightfall.language", next); } catch { /* no-op */ } };
  const send = (command: Command) => room.command({ expectedPhaseId: view?.phase.id, ...command });
  const enterRoom = (event: FormEvent) => { event.preventDefault(); void room.enter(entry, name, code, recovery); };
  const beginNight = async (type: "startGame" | "startNight" | "resume") => {
    if (!soundReady && (audioEnabled || musicEnabled)) {
      const audio = moderatorAudio();
      // Start the audio context in this gesture without replaying the old phase.
      audio.configure({...levels, voice: audioEnabled, music: musicEnabled, track: musicTrack, language: lang, active: false });
      void audio.unlock();
    }
    await send({ type });
  };
  const showInvite = () => {
    if (!view) return;
    setInviteUrl(`${window.location.origin}/werewolf/?room=${view.code}`);
    setModal("invite");
  };
  const copyCode = async () => {
    if (!view) return;
    try { await navigator.clipboard.writeText(view.code); setCopied(true); } catch { showInvite(); }
  };
  const share = async () => {
    if (!view) return;
    setCopyFailed(false);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/werewolf/?room=${view.code}`);
      setCopied(true); setTimeout(() => setCopied(false), 2200);
    } catch { setCopyFailed(true); showInvite(); }
  };
  const disabled = !!room.busy || room.connectivity !== "online" || room.sessionExpired;
  const connected = view?.seats.filter((seat) => seat.occupied).length || 0;
  const remaining = view?.phase.deadline ? Math.max(0, Math.ceil((view.phase.deadline - now - (view.clockOffset || 0)) / 1000)) : null;
  const title = view ? stageText(view, lang) : "";
  const role = view?.me?.roleId ? roleMap[view.me.roleId] : undefined;
  return <main className={styles.app} lang={lang === "zh" ? "zh-CN" : "en"}>
    <header className={styles.header}>
      <Link href="/" className={styles.backLink} aria-label={t("Back to website", "返回网站")}><ArrowLeft size={18} /></Link>
      <a href="/werewolf/" className={styles.wordmark}><Moon size={25} weight="duotone" /><span>NIGHTFALL<small>狼人杀 · WEREWOLF</small></span></a>
      <nav className={styles.headerActions} aria-label={t("Game navigation", "游戏导航")}>
        <button aria-label={t("How to play", "游戏规则")} className={styles.navButton} onClick={() => setModal("rules")}><BookOpen size={17} /><span>{t("How to play", "游戏规则")}</span></button>
        <button aria-label={t("Role library", "角色图鉴")} className={styles.navButton} onClick={() => setModal("library")}><MaskHappy size={18} /><span>{t("Role library", "角色图鉴")}</span></button>
        <button className={styles.languageButton} onClick={toggleLanguage}><Translate size={17} />{lang === "en" ? "中文" : "English"}</button>
      </nav>
    </header>
    {view && <StageBanner view={view} lang={lang} onCard={() => { setRevealed(true); setModal("card"); }} onProfile={() => setModal("profile")} />}
    {room.error && <div className={styles.error} role="alert"><WarningCircle size={20} /><span>{t("The action could not be completed.", "操作未能完成。")}{" "}{(lang === "en" ? room.error.message : errorChinese[room.error.code] || "请检查房间、身份或当前阶段后重试。")}</span><button onClick={room.clearError} aria-label={t("Dismiss", "关闭")}><X size={18} /></button></div>}
    {room.sessionExpired && <div className={styles.connectionBanner} role="alert"><WarningCircle size={20} /><span>{t("This session no longer owns a seat. Join again; host approval is needed if the game has started.", "此会话已不再拥有座位，请重新加入。如果游戏已经开始，则需房主批准。")}</span><button onClick={() => { setCode(room.session?.code || ""); setName(room.session?.name || ""); setEntry("join"); room.disconnect(true); }}>{t("Rejoin room", "重新加入房间")}</button></div>}
    {room.session && !room.sessionExpired && room.connectivity !== "online" && <div className={styles.connectionBanner} role="status"><WifiSlash size={19} /><span>{t("Reconnecting to your table. Your identity and progress are saved; controls will return when connected.", "正在重新连接。身份和进度已保存，连接恢复后可继续操作。")}</span><button onClick={room.retry}>{t("Retry now", "立即重试")}</button></div>}
    {!view && !room.session && <div className={styles.entryLayout}>
      <section className={styles.introduction}>
        <span className={styles.eyebrow}><span className={styles.redLine} />{t("A game of trust. And betrayal.", "信任与谎言之间。")}</span>
        <h1>{t("Everyone has", "每个人，")}<br />{t("a secret.", "都有秘密。")}</h1>
        <p className={styles.introCopy}>{t("Bring your friends to the table. The village falls asleep. The wolves wake up. Who will you believe?", "邀好友入座。天黑请闭眼，狼人请睁眼。今夜，你会相信谁？")}</p>
        <div className={styles.roleFan} aria-hidden="true"><div><Shield size={37} weight="duotone" /><span>{t("THE GUARD", "守卫")}</span></div><div><WolfHead size={56} /><span>{t("THE WEREWOLF", "狼人")}</span></div><div><Eye size={37} weight="duotone" /><span>{t("THE SEER", "预言家")}</span></div></div>
        <div className={styles.entryFacts}><span><Users size={17} />{t("6–24 players", "6–24 名玩家")}</span><span><Translate size={17} />English / 中文</span><span><Moon size={17} />{t(`${catalogue.roles.length} playable roles`, `${catalogue.roles.length} 种可玩角色`)}</span></div>
      </section>
      <section className={styles.entryPanel} aria-label={t("Enter a game", "进入游戏")}>
        <div className={styles.entryTabs}><button className={entry !== "create" ? styles.activeTab : ""} onClick={() => setEntry("join")}>{t("Join a room", "加入房间")}</button><button className={entry === "create" ? styles.activeTab : ""} onClick={() => setEntry("create")}>{t("Create a room", "创建房间")}</button></div>
        <div className={styles.entryFormHeading}><h2>{entry === "create" ? t("Your table awaits.", "好戏，等你开场。") : entry === "recover" ? t("Take back your table.", "找回你的房间。") : t("Take your seat.", "请入座。")}</h2><p>{entry === "create" ? t("You’re the host. Invite friends, choose your roles, and set the night in motion.", "成为房主，邀请好友，配置角色，开启这个夜晚。") : entry === "recover" ? t("Use the private recovery key saved when you created this room.", "输入创建房间时保存的私人恢复密钥。") : t("Enter your name to join the lobby instantly. After the game starts, the host approves new devices and seat replacements.", "输入名字即可直接加入大厅。游戏开始后，新设备加入或接替原座位须由房主批准。")}</p></div>
        <form onSubmit={enterRoom} className={styles.entryForm}>
          <label>{t("Your name", "你的名字")}<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={24} autoComplete="nickname" placeholder={t("What should we call you?", "怎么称呼你？")} /></label>
          {entry !== "create" && <label>{t("Room code", "房间码")}<input value={code} onChange={(event) => setCode(normalizeRoomCode(event.target.value))} onPaste={(event) => { event.preventDefault(); setCode(normalizeRoomCode(event.clipboardData.getData("text"))); }} autoComplete="off" autoCorrect="off" spellCheck={false} required maxLength={8} minLength={4} pattern="([A-Za-z]{4}|[A-Fa-f0-9]{8})" autoCapitalize="characters" placeholder="MOON" className={styles.codeInput} /></label>}
          {entry === "recover" && <label>{t("Host recovery key", "房主恢复密钥")}<input value={recovery} onChange={(event) => setRecovery(event.target.value)} required autoComplete="off" type="password" /></label>}
          <button className={styles.primaryButton} disabled={!!room.busy || !room.restored} type="submit">{room.busy ? t("Connecting…", "连接中…") : entry === "create" ? t("Create room", "创建房间") : entry === "recover" ? t("Recover host access", "恢复房主权限") : t("Join room", "加入房间")}<ArrowRight size={19} /></button>
        </form>
        <p className={styles.privateNote}><LockKey size={15} />{t("Private rooms. Secret identities. No account needed.", "私人房间 · 秘密身份 · 无需注册")}</p>
        <button className={styles.textButton} onClick={() => setEntry(entry === "recover" ? "join" : "recover")}>{entry === "recover" ? t("Back to joining", "返回加入房间") : t("Recover a room you hosted", "恢复我创建的房间")}</button>
      </section>
    </div>}
    {!view && room.session && <div className={styles.loading}><Moon size={44} /><h1>{t("Finding your table…", "正在返回房间…")}</h1><p>{t("Restoring your private seat and the latest game state.", "正在恢复你的身份与最新游戏进度。")}</p><button className={styles.secondaryButton} onClick={() => room.disconnect()}>{t("Return to room selection", "返回房间选择")}</button></div>}
    {view && <div className={styles.roomLayout}>
      <RoomToolbar code={view.code} lang={lang} connected={room.connectivity === "online"} copied={copied} onCode={copyCode} onInvite={showInvite} onLeave={() => setModal("leave")} onSettings={view.isHost ? () => setModal("settings") : undefined}/>
      {victory && <VictorySummary key={`${view.code}:${view.gameId}:result`} result={victory} lang={lang} mySeatId={view.me?.seatId} players={view.seats.map((seat,index) => ({ ...seat, number:index+1, role:seat.roleId ? text(roleMap[seat.roleId]?.name,lang) : undefined }))} reason={typeof view.winner === "object" ? text(view.winner?.reason,lang) : undefined} onReplay={() => {setAudioEnabled(true);const audio=moderatorAudio();audio.configure({...levels,voice:true,music:musicEnabled,track:musicTrack,language:lang,active:true});audio.updatePhase(view.phase);void audio.unlock();audio.replay();}}/>}
      <BotNotice view={view} lang={lang}/>
      <div className={styles.gameColumns}>
        <section className={styles.tablePanel}>
          <div className={`${styles.phaseHeading} ${view.status === "playing" ? styles.redundantHeading : ""}`}><div className={styles.phaseIcon}>{view.phase.kind === "night" || view.status === "lobby" ? <Moon size={26} weight="duotone" /> : view.phase.kind === "voting" ? <HandPalm size={25} /> : <Sun size={27} />}</div><div><span className={styles.eyebrow}>{view.status === "lobby" ? t("THE LOBBY", "等候大厅") : view.status === "finished" ? t("GAME OVER", "游戏结束") : view.phase.kind === "ready" ? t("READ YOUR CARD", "查看身份") : `${view.phase.kind === "night" ? t("NIGHT", "夜晚") : t("DAY", "白天")} ${view.phase.kind === "night" ? view.phase.number || 1 : view.day || 1}`}</span><h1>{title}</h1></div>{remaining !== null && view.status === "playing" && <div className={styles.timer}><Hourglass size={16} /><span>{view.phase.paused ? t("Paused", "已暂停") : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}</span></div>}</div>
          {view.phase.paused && <div className={styles.notice}><Pause size={18} />{t("The table is paused. The host can resume when everyone is ready.", "牌局已暂停，所有人准备好后房主可继续游戏。")}</div>}
          {view.phase.nightStage && !view.phase.paused && <div className={styles.nightProgress} role="status"><SpeakerHigh size={18} /><span>{view.phase.nightStage === "opening" ? t("Listen to the narrator. Your action appears after the announcement.", "请听语音提示，播报结束后将显示你的行动。") : view.phase.nightStage === "closing" ? t("Keep your eyes closed. The next role will be called automatically.", "请保持闭眼，稍后将自动呼叫下一个角色。") : t("Submit your action or skip. Actions wait until submitted or the host skips this step.", "请提交行动或跳过。行动将等待提交，或由房主强制跳过当前阶段。")}</span></div>}
          {!view.me && <div className={styles.pendingNotice}><Hourglass size={20} /><div><strong>{view.status === "lobby" ? t("Waiting for a free seat", "等待空余座位") : t("Your seat is waiting for approval", "正在等待房主安排座位")}</strong><p>{view.status === "lobby" ? t("This lobby is full. You’ll join automatically when a seat becomes available.", "大厅已满。出现空余座位后，你将自动加入。") : t("Your host can restore an existing seat, including its original role and history.", "房主可安排你接替已有座位，保留其原有身份与历史。")}</p></div></div>}

          <SpeakingTimer view={view} lang={lang} disabled={disabled || view.phase.paused} soundReady={soundReady} onEnable={() => { const audio = moderatorAudio(); audio.configure({...levels,voice: audioEnabled, music: musicEnabled, track: musicTrack, language: lang, active: true}); if(view.phase) audio.updatePhase(view.phase); void audio.unlock(); }} send={async command => {
            if (command.type === "setSpeechTimer" && !soundReady) {
              const audio = moderatorAudio(); audio.configure({...levels,voice: audioEnabled, music: musicEnabled, track: musicTrack, language: lang, active: true}); void audio.unlock();
            }
            return send(command);
          }} />
          {view.me?.inspection && `${view.gameId}:${view.me.inspection.night}:${view.me.inspection.targetId}` !== dismissedInspection && <section className={styles.inspectionResult} role="status"><strong>{t("Your Seer result · only you can see this", "你的查验结果 · 仅自己可见")}</strong><p>{view.seats.findIndex(seat => seat.id === view.me?.inspection?.targetId) + 1} · {view.seats.find(seat => seat.id === view.me?.inspection?.targetId)?.name}: <b>{view.me.inspection.alignment === "wolf" ? t("WOLF", "狼人") : t("GOOD", "好人")}</b></p><button className={styles.secondaryButton} onClick={() => setDismissedInspection(`${view.gameId}:${view.me?.inspection?.night}:${view.me?.inspection?.targetId}`)}>{t("Hide result", "隐藏结果")}</button></section>}
          {role && view.phase.kind === "ready" && <div className={styles.cardToolbar}>{view.phase.kind === "ready" && !view.me?.ready && <button className={styles.primaryButton} onClick={() => {setRevealed(true);setModal("card");}}><LockKey size={18}/>{t("Read card & ready up", "查看身份并准备")}</button>}{view.phase.kind === "ready" && <strong className={view.me?.ready ? styles.readyStatus : styles.notReadyStatus} role="status">{view.me?.ready ? t("✓ You are ready", "✓ 你已准备") : t("Not ready · read your card and tap Ready", "尚未准备 · 查看身份后点击准备")}</strong>}</div>}
          {view.me && view.status === "playing" && view.phase.kind !== "ready" && <><ElectionPanel view={view} lang={lang} disabled={disabled || view.phase.paused} send={send} />
          <ActionPanel key={view.phase.id} view={view} lang={lang} disabled={disabled || view.phase.paused} send={send} /></>}
          <div className={styles.tableTools}><button className={styles.secondaryButton} onClick={() => setModal("lineup")}><BookOpen size={17} />{t("Current roles", "本局角色")}</button>{role && <button className={styles.secondaryButton} onClick={() => setModal("history")}>{t("My actions", "我的行动")}</button>}<button className={styles.secondaryButton} onClick={() => setModal("votes")}>{t("Last votes", "上轮投票")}</button></div>
          <CircleSeats view={view} lang={lang} now={now} onProfile={() => setModal("profile")} />

          <div className={styles.tableFooter}><span><Users size={17} />{connected} {t("at the table", "人已入座")}{view.status !== "lobby" && ` · ${view.seats.filter((seat) => seat.alive).length} ${t("alive", "人存活")}`}</span></div>
          {view.phase.kind === "voting" && <p className={styles.voteProgress}><HandPalm size={16} />{t(`${view.voteCount || 0} votes submitted. Choices stay hidden until voting closes.`, `已提交 ${view.voteCount || 0} 票，投票结束前不公开选择。`)}</p>}


        </section>
        <aside className={styles.sidebar}>
          {view.isHost && <section className={styles.hostPanel}><div className={styles.sectionHeading}><h2><Crown size={17} />{t("Host controls", "房主控制")}</h2><button className={styles.iconButton} onClick={() => setModal("settings")} aria-label={t("Settings", "设置")}><GearSix size={18} /></button></div>
            {!!view.requests?.length && <button className={styles.requestAlert} onClick={() => setModal("people")}><Users size={18} />{view.requests.length} {t("waiting to join", "人等待加入")}<ArrowRight size={16} /></button>}
            {view.status === "lobby" ? <><button className={styles.primaryButton} disabled={disabled || view.seats.length < 6 || (view.roleDeck.length > 0 && view.roleDeck.length !== view.seats.length) || view.seats.some((seat) => !seat.occupied)} onClick={() => beginNight("startGame")}><Play size={18} weight="fill" />{t("Deal cards", "发放身份牌")}</button><p className={styles.hint}>{view.roleDeck.length === 0 ? t("A balanced deck is chosen automatically, or choose your own in settings.", "将自动选择平衡配置，也可在设置中自定义。") : view.roleDeck.length !== view.seats.length ? t(`${view.roleDeck.length} role cards · ${view.seats.length} players. Match the deck to your table in settings.`, `${view.roleDeck.length} 张身份牌 · ${view.seats.length} 名玩家，请在设置中匹配人数。`) : t("At least 6 players. Everyone receives their role privately.", "至少6人，每位玩家将单独收到身份。")}</p></> : view.phase.kind === "ready" ? <button className={styles.primaryButton} disabled={disabled || view.phase.paused || view.seats.some(seat => !seat.ready || !seat.occupied)} onClick={() => beginNight("startNight")}>{t("Begin first night", "开始第一个夜晚")}</button> : view.status === "finished" ? <button className={styles.primaryButton} disabled={disabled} onClick={() => { setRestartPhaseId(view.phase.id); setModal("restart"); }}><ArrowClockwise size={18} />{t("Restart round", "重新开始本局")}</button> : <><div className={styles.hostButtons}>{view.phase.kind === "day" && <>{view.phase.step === "discussion" && <button className={styles.primaryButton} disabled={disabled || view.phase.paused} onClick={() => void send({ type: "startVoting" })}><HandPalm size={17} />{t("Start voting", "开始投票")}</button>}{view.phase.step === "afterVote" && <button className={styles.secondaryButton} disabled={disabled || view.phase.paused} onClick={() => beginNight("startNight")}><Moon size={17} />{t("Next night", "进入夜晚")}</button>}</>}{view.phase.kind === "voting" && view.phase.step !== "sheriff" && <button className={styles.primaryButton} disabled={disabled || view.phase.paused || !!view.pendingVoterIds?.length} onClick={() => void send({ type: "resolveVoting" })}><CheckCircle size={17} />{t("Close & count votes", "结束并统计投票")}</button>}{(view.phase.kind === "night" && !view.phase.nightStage || view.phase.kind === "reaction") && <button className={styles.primaryButton} disabled={disabled || view.phase.paused} onClick={() => void send({ type: "nextPhase" })}>{t("Next step", "进入下一阶段")}<ArrowRight size={18} /></button>}<button className={styles.secondaryButton} disabled={disabled} onClick={() => view.phase.paused ? beginNight("resume") : void send({ type: "pause" })}>{view.phase.paused ? <Play size={16} /> : <Pause size={16} />}{view.phase.paused ? t("Resume", "继续游戏") : t("Pause table", "暂停牌局")}</button></div><p className={styles.hint}>{view.phase.nightStage ? t("Nights continue when actions finish. If needed, skip the current step without seeing pending players or their identities.", "行动完成后夜间自动继续。如有需要，可强制跳过当前阶段，无需查看待行动玩家或其身份。") : t("Voting waits for every eligible player to vote or abstain.", "投票等待所有有投票权的玩家投票或弃票。")}</p></>}
            {view.status === "playing" && view.phase.kind !== "ready" && view.phase.kind !== "voting" && !(view.phase.kind === "sheriff" && view.phase.step === "nomination") && <button className={styles.textButton} disabled={disabled} onClick={() => { setSkipPhaseId(view.phase.id); setModal("hardSkip"); }}>{t("Skip current step…", "强制跳过当前阶段…")}</button>}
            {view.status === "playing" && <button className={styles.textButton} disabled={disabled} onClick={() => { setRestartPhaseId(view.phase.id); setModal("restart"); }}><ArrowClockwise size={18}/>{t("Restart round", "重新开始本局")}</button>}
            <BotControls view={view} lang={lang} disabled={disabled} send={send}/>
            <details className={styles.hostMore}><summary>{t("More host options", "更多房主选项")}</summary><button className={styles.textButton} onClick={() => setModal("disband")}>{t("Disband room…", "解散房间…")}</button>
            <button className={styles.textButton} onClick={() => setModal("recovery")}>{t("Save host recovery key", "保存房主恢复密钥")}</button></details>
            <button className={styles.manageButton} onClick={() => setModal("people")}><Users size={18} />{t("Manage players & rejoining", "玩家与重连管理")}<ArrowRight size={15} /></button>
          </section>}
          <details className={styles.soundDetails}><summary>{t("Sound & narrator", "声音与主持")}</summary><section className={styles.audioPanel}><div className={styles.sectionHeading}><h2><SpeakerHigh size={17} />{t("Sound on this device", "本机声音")}</h2></div>
            {(audioEnabled || musicEnabled) && !soundReady && <button className={styles.primaryButton} disabled={!view.me} onClick={() => changeAudio(audioEnabled, musicEnabled)}><SpeakerHigh size={18} />{t("Enable sound on this device", "开启本机声音")}</button>}
            <label className={styles.toggleRow}><span><SpeakerHigh size={17} /><span>{t("Voice moderator", "语音法官")}<small>{t("Brian + Kokoro · English or Chinese · this device", "Brian + Kokoro · 英文或中文 · 本机播放")}</small></span></span><input type="checkbox" checked={audioEnabled} disabled={!view.me} onChange={(event) => changeAudio(event.target.checked, musicEnabled)} /></label>
            <label className={styles.toggleRow}><span><MusicNotes size={17} />{t("Ambient music", "氛围音乐")}</span><input type="checkbox" checked={musicEnabled} disabled={!view.me} onChange={(event) => changeAudio(audioEnabled, event.target.checked)} /></label>
            <AudioVolumeControls levels={levels} onChange={changeLevels} lang={lang} disabled={!view.me}/>
            <label className={styles.musicSelect}>{t("Music selection", "选择音乐")}<select value={musicTrack} onChange={event => { const track = event.target.value; setMusicTrack(track); try { localStorage.setItem("nightfall.audio", JSON.stringify({voice: audioEnabled, music: musicEnabled, track})); } catch { /* no-op */ } }}>{musicTracks.map(track => <option key={track.id} value={track.id}>{lang === "zh" ? track.zh : track.title}</option>)}</select></label><button className={styles.textButton} onClick={() => setModal("credits")}>{t("Music & artwork credits", "音乐与图标来源")}</button>
            <button className={styles.textButton} disabled={!view.me} onClick={testSound}>{t("Test sound", "测试声音")}</button>
            {audioEnabled && <button className={styles.textButton} disabled={!view.me} onClick={() => moderatorAudio().replay()}>{t("Replay announcement", "重播本阶段提示")}</button>}
            {audioError && <p className={styles.warningText} role="status">{audioError === "unavailable" ? t("Sound did not start. Tap Enable sound, check media volume, and try Test sound.", "声音未能开启。请点击开启声音，检查媒体音量，再点击测试声音。") : audioError}</p>}
            <p className={styles.hint}>{t("Tap to allow audio on a phone. Keep the room open and check media volume. Any player can enable sound; use one speaker for an in-person table. Voice never announces secret results.", "手机需点击后才能播放声音。请保持房间页面打开，并检查媒体音量。任何玩家均可开启；线下游戏建议仅开一台扬声器。语音不会播报私人查验结果。")}</p>
          </section></details>
        </aside>
      </div>
      <details className={styles.activityDisclosure}><summary>{t("Game record & table chat", "游戏记录与聊天")}<span>{view.events.length}</span></summary><section className={styles.activityPanel}><div className={styles.activityHeading}><div className={styles.activityTabs}><button className={tab === "events" ? styles.activeTab : ""} onClick={() => setTab("events")}>{t("Game record", "游戏记录")}</button><button className={tab === "chat" ? styles.activeTab : ""} onClick={() => setTab("chat")}>{t("Table chat", "牌局聊天")}</button></div><span className={styles.hint}>{t("Private actions stay private", "秘密行动仅自己可见")}</span></div>{tab === "events" ? <div className={styles.eventList}>{view.events.length ? view.events.slice().reverse().slice(0, 50).map((event) => <div key={event.id} className={styles.event}><Circle size={7} weight="fill" /><p>{text(event.text, lang)}</p><time>{new Date(event.at).toLocaleTimeString(lang === "zh" ? "zh-CN" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</time></div>) : <p className={styles.emptyLog}>{t("A quiet village. For now.", "村庄此刻，依然宁静。")}</p>}</div> : <ChatPanel view={view} lang={lang} disabled={disabled} send={send} />}</section></details>
      {view.status === "finished" && !!view.replay?.length && <Replay view={view} lang={lang} />}
    </div>}
    <footer className={styles.footer}><span>NIGHTFALL <span>·</span> {t("A table full of secrets.", "一桌人，各怀秘密。")}</span><button onClick={() => setModal("rules")}>{t("House rules", "本应用规则")}</button></footer>
    {modal === "profile" && view?.me && <Modal title={t("Your profile photo", "你的头像")} onClose={() => setModal(null)}><ProfilePicker lang={lang} disabled={disabled} onSave={photo => send({type:"setProfile",photo})} onDone={() => setModal(null)} /></Modal>}
    {modal === "disband" && view?.isHost && <Modal title={t("Disband this room?", "解散此房间？")} onClose={() => setModal(null)}><p>{t("This ends the room for everyone. Players will return to the join screen, and this invitation will no longer work.", "所有玩家将退出此房间并返回加入页面，此邀请码将失效。")}</p><div className={styles.modalActions}><button className={styles.secondaryButton} onClick={() => setModal(null)}>{t("Cancel", "取消")}</button><button className={styles.dangerButton} disabled={disabled} onClick={async () => { if (await send({type:"disbandRoom"})) setModal(null); }}>{t("Disband & remove everyone", "解散并移出所有玩家")}</button></div></Modal>}
    {modal === "history" && view?.me && <Modal title={t("My actions & results", "我的行动与结果")} onClose={() => setModal(null)}><p>{t("Only you can see this record. It follows your seat when you reconnect.", "仅你可以查看此记录，重连后仍随座位保留。")}</p><div className={styles.historyList}>{view.me.history?.slice().reverse().map(entry => <article key={`${entry.night}:${entry.step}`}><strong>{t(`Night ${entry.night}`, `第 ${entry.night} 夜`)} · {text(roleMap[entry.step]?.name || stepLabels[entry.step], lang)}</strong><p>{entry.action.skip ? t("Skipped", "跳过") : `${text(choiceLabels[entry.action.ability || entry.action.choice || ""], lang) || t("Selected", "选择")} ${(entry.action.targetIds || (entry.action.targetId ? [entry.action.targetId] : [])).map(id => view.seats.find(seat => seat.id === id)?.name || id).join(" · ")}`}</p></article>)}{view.me.privateLog.slice().reverse().map((entry,index) => <article key={entry.id || index}>{entry.night && <strong>{t(`Night ${entry.night} · result`, `第 ${entry.night} 夜 · 结果`)}</strong>}<p>{text(entry.text,lang)}</p></article>)}{!view.me.history?.length && !view.me.privateLog.length && <p>{t("Your actions and private results will appear here.", "你的行动及私人查验结果将在此显示。")}</p>}</div></Modal>}
    {modal === "credits" && <Modal title={t("Music & artwork", "音乐与图标")} onClose={() => setModal(null)}><p>{t("Music by Kevin MacLeod (incompetech.com), licensed under Creative Commons Attribution 4.0. Files are compressed for playback.", "音乐由 Kevin MacLeod（incompetech.com）创作，依照 CC BY 4.0 许可使用，文件已压缩以便播放。")}</p><p>{t("Existing narration: Microsoft Brian. New announcements: local Kokoro, Michael (English) and zm_010 (Mandarin), Apache 2.0 models.", "原有语音：Microsoft Brian。新增播报：本地 Kokoro，Michael（英语）与 zm_010（普通话），模型采用 Apache 2.0 许可。")} <a href="/assets/werewolf/audio/new-announcements.html" target="_blank" rel="noreferrer">{t("Listen to new announcements", "试听所有新增播报")}</a></p><ul>{musicTracks.map(track => <li key={track.id}><a href={track.source} target="_blank" rel="noreferrer">{track.title}</a></li>)}</ul><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a><p><a href="https://game-icons.net/1x1/lorc/wolf-head.html" target="_blank" rel="noreferrer">Wolf head by Lorc</a> · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a></p></Modal>}
    {modal === "restart" && view?.isHost && <Modal title={t("Restart this round?", "重新开始本局？")} onClose={() => setModal(null)}><p>{t("Everyone returns to setup in the same room. Players, seats, profiles, bots, the deck and settings stay. Cards, deaths, abilities, sheriff progress, clues, chat and votes are cleared. Deal fresh cards when ready; everyone must read their new card and ready up again.", "所有人返回同一房间的配置页面，保留玩家、座位、头像、机器人、牌组和设置。清除身份、死亡、技能、警长进度、线索、聊天与投票。确认配置后重新发牌，每人需重新查看身份并准备。")}</p>{view.phase.id !== restartPhaseId && <p role="status">{t("The stage changed. Close this dialog and reopen Restart round.", "阶段已变化，请关闭此窗口并重新点击重新开始。")}</p>}<div className={styles.modalActions}><button className={styles.secondaryButton} onClick={() => setModal(null)}>{t("Keep playing", "继续当前牌局")}</button><button className={styles.dangerButton} disabled={disabled || view.phase.id !== restartPhaseId} onClick={async () => { if (await send({type:"restartRound",expectedPhaseId:restartPhaseId})) { setRevealed(false); setModal(null); } }}>{t("Restart and return to setup", "重新开始并返回配置")}</button></div></Modal>}
    {modal === "hardSkip" && view?.isHost && <Modal title={t("Skip the current step?", "强制跳过当前阶段？")} onClose={() => setModal(null)}><p>{t("End this step and continue the game. Submitted choices are retained; unresolved actions are skipped. This control does not reveal who is waiting or their identities.", "结束当前阶段并继续游戏。已提交的选择予以保留，未完成的行动视为跳过。此操作不会显示待行动玩家或其身份。")}</p>{view.phase.id !== skipPhaseId && <p role="status">{t("The step changed. Close this dialog and reopen it to skip the new step.", "阶段已变化。请关闭此窗口，再次打开以跳过新阶段。")}</p>}<div className={styles.modalActions}><button className={styles.secondaryButton} onClick={() => setModal(null)}>{t("Cancel", "取消")}</button><button className={styles.dangerButton} disabled={disabled || view.phase.id !== skipPhaseId} onClick={async () => { if (await send({ type: "hardSkip", expectedPhaseId: skipPhaseId })) setModal(null); }}>{t("Skip & continue", "跳过并继续")}</button></div></Modal>}
    {modal === "invite" && view && inviteUrl && <Modal title={t("Invite to your table", "邀请好友入座")} onClose={() => setModal(null)}>
      <InvitePanel code={view.code} url={inviteUrl} lang={lang} lobby={view.status === "lobby"} copied={copied} copyFailed={copyFailed} onCopy={share}/>
    </Modal>}
    {modal === "lineup" && view && <Modal dismissOutside title={t("Current roles", "本局角色")} onClose={() => setModal(null)}><RoleLineup deck={view.roleDeck} roles={catalogue.roles} lang={lang} renderIcon={id => roleIcon(roleMap[id], 28)} variant="werewolf" /></Modal>}
    {modal === "library" && <RoleLibrary lang={lang} view={view} onClose={() => setModal(null)} />}
    {modal === "settings" && view?.isHost && <RoomSettings view={view} lang={lang} disabled={disabled} send={send} onClose={() => setModal(null)} />}
    {modal === "people" && view && <PeopleManager view={view} lang={lang} disabled={disabled} send={send} onClose={() => setModal(null)} />}
    {modal === "rules" && <Modal title={t("Before night falls", "天黑之前")} onClose={() => setModal(null)}><div className={styles.rules}>{view && <div className={styles.currentRules}><h3>{t("This table’s rules", "本房间规则")}</h3><p>{t("Werewolf victory:", "狼人获胜：")} {view.settings.winCondition === "edge" ? t("Eliminate all villagers OR all village special roles", "屠边：消灭所有平民或所有神职") : view.settings.winCondition === "all" ? t("Eliminate all village players", "屠城：消灭全部好人") : t("Equal or outnumber all opposition", "达到人数优势")}</p><p>{t("Sheriff:", "警长：")} {view.settings.sheriff ? t("enabled", "启用") : t("disabled", "关闭")} · {t("Witch self-save:", "女巫自救：")} {text(witchSelfSaveLabels[witchSelfSaveRule(view.settings.witchSelfSave)], lang)}</p><p>{t("Guard + antidote:", "同守同救：")} {view.settings.guardAntidote === "save" ? t("target survives", "目标存活") : t("target dies", "目标死亡")} · {t("Automatic skipping:", "自动跳过：")} {view.settings.autoAdvance ? t("on", "开启") : t("off", "关闭")}</p><p>{t("Sheriff votes count as 1.5. A first tie triggers a runoff between tied players. A second tie eliminates nobody and starts the night. Final words are managed by the host before advancing.", "警长投票计1.5票。首轮平票仅对平票玩家再次投票；第二次平票无人出局，直接入夜。房主可在推进前安排遗言。")}</p></div>}<p>{t("Werewolf is a game of hidden roles, conversation, and deception. Play around the same table or use your preferred voice call alongside the room chat.", "狼人杀是一场关于隐藏身份、讨论和推理的游戏。可以围桌面对面游玩，也可以配合语音通话和房间聊天远程游玩。")}</p><ol><li><strong>{t("Take a secret identity.", "领取秘密身份。")}</strong> {t("The host chooses a deck and deals the cards. Only you see your role.", "房主配置角色并发牌，只有你能看到自己的身份。")}</li><li><strong>{t("Act during the night.", "夜间行动。")}</strong> {t("Listen for your role, then submit your action or skip. Music plays while players act; the turn closes when actions finish or the host explicitly skips it. Actions never expire. Dead roles still receive the same call and a random 7–15 second wait.", "听到角色后，提交行动或选择跳过。行动期间播放音乐；行动完成后，法官自动结束回合；房主也可强制跳过。行动不会超时。已出局角色仍有相同播报，并随机等待7–15秒。")}</li><li><strong>{t("Talk during the day.", "白天讨论。")}</strong> {t("Share information, make accusations, or bluff. The host can set a speaker or start the sheriff election.", "分享线索、质疑或伪装。房主可安排发言者，或发起警长竞选。")}</li><li><strong>{t("Vote together.", "进行投票。")}</strong> {t("Choose who to exile. The app resolves abilities, deaths, and the winning faction.", "选择放逐对象，由应用结算技能、死亡与获胜阵营。")}</li></ol><h3>{t("Temporary game rooms", "临时游戏房间")}</h3><p>{t("Rooms expire after 24 hours without a player action. Finished games are deleted after a brief result-delivery window unless the host restarts the round before it expires.", "房间在24小时无玩家操作后过期。游戏结束后，服务器短暂保留结果供玩家接收；房主可在到期前重新开始本局，否则房间会被删除。")}</p><h3>{t("A connection is not an identity", "断线不等于离场")}</h3><p>{t("Before the game starts, anyone with the invitation can join and leave freely. Refreshing or losing connection keeps your seat. Once play starts, join on a new device with your name and ask the host to replace your previous seat. Your role, actions, and history follow the seat. Never share your host recovery key.", "游戏开始前，持有邀请的玩家可自由加入和离开。刷新或断线会保留座位。开始游戏后，更换设备时请用原名字加入，由房主批准接替原座位。身份、技能和历史记录跟随座位保留。请勿分享房主恢复密钥。")}</p><h3>{t("Advanced roles, explicit rules", "进阶角色，明确规则")}</h3><p>{catalogue.ruleset[lang]} {t("This library implements 32 roles, including specified variants of Mechanical Wolf, Thief, and Scapegoat. Roles and variants from other editions can be added later; there is no universal complete roster.", "当前实现32种角色，包括明确说明的机械狼、盗贼及替罪羊变体。未来可继续扩展其他版本角色；狼人杀并不存在统一的全部角色列表。")}</p><p>{t("The host controls daytime pace and seating but cannot see other players’ secret identities. Nights advance when actions finish; the host can skip any night or daytime step. Offline players never trigger an automatic skip or pause. A disconnected player keeps their identity; host approval is required to transfer it to a new device.", "房主可控制白天进度和座位，但无法查看其他玩家的秘密身份。夜间在行动完成后自动推进；房主可强制跳过夜间或白天阶段。玩家离线不会触发自动跳过或暂停。断线保留身份，换设备接替需经房主批准。")}</p></div></Modal>}
    {modal === "card" && view && <Modal dismissOutside title={t("Your identity", "你的身份")} onClose={() => {setRevealed(false);setModal(null);}}>
            {role ? <><RoleCard name={role.name[lang]} subtitle={role.name[lang === "en" ? "zh" : "en"]} icon={roleIcon(role,64)} lang={lang} revealed={revealed} onToggle={() => setRevealed(!revealed)}/>{revealed && <><p className={styles.roleDescription}>{role.description[lang]}</p><RoleGuidance view={view} lang={lang} context="card" roleId={role.id}/>{!!view.me?.allies.length && <p className={styles.allies}><Heart size={15} />{t("Known allies:", "已知同伴：")} {view.me.allies.map((id) => view.seats.find((seat) => seat.id === id)?.name).filter(Boolean).join(" · ")}</p>}</>}</> : <div className={styles.hiddenIdentity}><Moon size={33} weight="thin" /><p>{t("Your story begins when the host deals the roles.", "房主发牌后，你的故事即将开始。")}</p></div>}
            {view.phase.kind === "ready" && view.me && <div className={styles.readyPanel}><button className={styles.primaryButton} disabled={disabled || (seenKey !== identityKey && !view.me.ready)} onClick={async () => { const ready = !view.me?.ready; if (await send({ type: "ready", ready }) && ready) { setRevealed(false); setModal(null); } }}>{view.me.ready ? t("Ready · undo", "已准备 · 取消准备") : t("I have read my card · ready", "已查看身份 · 准备")}</button><span>{view.seats.filter(seat => seat.ready).length} / {view.seats.length} {t("ready", "人已准备")}</span></div>}
    </Modal>}
    {modal === "votes" && view && <Modal title={t("Last round’s votes", "上轮投票记录")} onClose={() => setModal(null)}><VoteReview view={view} lang={lang} /></Modal>}
    {modal === "recovery" && <Modal title={t("Keep your table recoverable", "随时找回你的房间")} onClose={() => setModal(null)}><p>{t("Save this private key somewhere safe. If your device loses its saved session, choose Recover a room on the start screen. Anyone with this key can take over the host seat.", "请妥善保存此私人密钥。如果设备丢失会话，可在首页选择恢复房间。持有此密钥的人可以接管房主座位。")}</p><div className={styles.recoveryBox}><label>{t("Host recovery key", "房主恢复密钥")}<input readOnly value={room.session?.recoveryKey || ""} onFocus={(event) => event.target.select()} /></label></div><p>{t("Room code:", "房间码：")} <strong>{view?.code}</strong></p></Modal>}
    {modal === "leave" && <Modal title={t("Leave the table?", "离开牌局？")} onClose={() => setModal(null)}><p>{view?.status === "lobby" ? t("Your seat will be released. You can join again at any time before the game starts without host approval.", "离开后座位将释放。游戏开始前可随时重新加入，无需房主批准。") : t("Your seat and role stay in the game. Joining this room again on this device restores your saved seat. The host can also assign a replacement.", "座位和身份仍保留在游戏中。在此设备重新加入房间可恢复原座位，房主也可以安排其他人接替。")}</p>{view?.isHost && view.status === "lobby" && <p className={styles.warningText}>{t("Hosting passes to another player. If the lobby becomes empty, the next player to join becomes host. Your old recovery key will no longer work.", "房主权限将移交给另一位玩家。若大厅无人，则下一位加入的玩家成为房主。原恢复密钥将失效。")}</p>}{view?.status === "lobby" && room.connectivity !== "online" && <p role="status">{t("Reconnect to release your seat. Closing the page while offline keeps it reserved for you.", "请恢复连接后离开，以释放座位。离线时关闭页面会保留你的座位。")}</p>}{view?.isHost && view.status !== "lobby" && <p className={styles.warningText}>{t("Your host key stays saved on this device. Keep a copy below if you will switch devices.", "房主密钥会保存在此设备上。如果需要更换设备，请另行保存下方密钥。")}</p>}{view?.isHost && view.status !== "lobby" && room.session?.recoveryKey && <div className={styles.recoveryBox}><label>{t("Private host recovery key", "房主私人恢复密钥")}<input readOnly value={room.session.recoveryKey} /></label></div>}<div className={styles.modalActions}><button className={styles.secondaryButton} onClick={() => setModal(null)}>{t("Stay", "留下")}</button><button className={styles.dangerButton} disabled={!!room.busy || view?.status === "lobby" && room.connectivity !== "online"} onClick={async () => { if (view?.status === "finished" || room.connectivity !== "online" || await send({ type: "leave" })) { room.disconnect(); setModal(null); } }}>{t("Leave room", "离开房间")}</button></div></Modal>}
  </main>;
}

function ActionPanel({ view, lang, disabled: controlsDisabled, send }: { view: GameView; lang: Language; disabled: boolean; send: (command: Command) => Promise<boolean> }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const action = view.me?.action;
  const disabled = controlsDisabled || !!(view.phase.nightStage && action?.alreadySubmitted && action.step !== "wolves");
  const [targets, setTargets] = useState<string[]>([]);
  const [choice, setChoice] = useState("");
  const [special, setSpecial] = useState("");
  const voting = action?.kind === "vote";
  const daySpecial = !view.phase.paused && (view.me?.canDuel || view.me?.canExplode || view.me?.canPassBadge);
  const isDouble = action?.input === "double";
  const available = action?.targets || (voting || daySpecial && special && special !== "destroyBadge" && (special !== "wolfExplode" || view.me?.roleId === "whiteWolfKing") ? view.seats.filter((seat) => seat.alive && seat.id !== view.me?.seatId).map((seat) => seat.id) : []);
  const select = (id: string) => setTargets((current) => current.includes(id) ? current.filter((target) => target !== id) : isDouble ? [...current.slice(-1), id] : [id]);
  const optionValue = (option: NonNullable<Action["options"]>[number]) => typeof option === "string" ? option : option.value || option.id || "";
  const submit = async (skip = false) => {
    if (voting) await send({ type: "vote", targetId: skip ? null : targets[0] });
    else if (action?.kind === "shoot") await send({ type: "shoot", targetId: skip ? null : targets[0] });
    else if (action?.kind === "passBadge" || action?.kind === "badge") await send({ type: "passBadge", targetId: skip ? null : targets[0] });
    else await send({ type: "nightAction", ability: skip ? "skip" : choice || action?.ability, targetId: skip ? undefined : targets[0], targetIds: skip ? [] : targets, choice: skip ? "skip" : choice || undefined });
  };
  const needsTarget = (action?.input === "single" || action?.input === "double" || voting) && choice !== "save" && choice !== "skip";
  const showTargets = needsTarget && (!action?.options?.length || !!choice);
  const invalid = targets.some(id => !available.includes(id)) || needsTarget && targets.length < (action?.minTargets || 1) || !!action?.options?.length && !choice;
  if (!action && !daySpecial && (view.phase.kind === "sheriff" || view.phase.kind === "announcement" || view.phase.kind === "voting" && view.phase.step === "sheriff")) return null;
  if (!action && !voting && !daySpecial) return <div className={styles.waitingAction}><Moon size={19} /><p>{!view.me?.alive ? t("You have been eliminated. Follow the game and keep its secrets.", "你已出局，请继续观战并保守秘密。") : view.phase.kind === "night" ? t("Keep your eyes closed. Your private prompt appears when it’s your turn.", "请闭眼等待，轮到你时将显示私人行动提示。") : t("Listen closely. The next decision could change everything.", "认真倾听，下一个决定可能改变一切。")}</p></div>;
  return <div className={styles.actionPanel}><div className={styles.sectionHeading}><h2>{voting ? <HandPalm size={20} /> : <Eye size={20} />}{voting ? t("Your vote", "你的投票") : action ? t("Your private action", "你的秘密行动") : t("Daytime ability", "白天技能")}</h2>{action?.alreadySubmitted && <span className={styles.submitted}><CheckCircle size={16} />{view.phase.nightStage && action.step !== "wolves" ? t("Submitted · waiting", "已提交 · 等待中") : t("Submitted · can update", "已提交 · 可修改")}</span>}</div>
    {view.me && (action || daySpecial) && <RoleGuidance view={view} lang={lang} context="turn"/>}
    {!!view.me?.packVotes?.length && <div className={styles.packVotes}><strong>{t("Pack choices · only wolves can see these", "狼队选择 · 仅狼队可见")}</strong>{view.me.packVotes.map(vote => <p key={vote.seatId}>{view.seats.find(seat => seat.id === vote.seatId)?.name} → {vote.submitted ? vote.targetId ? view.seats.find(seat => seat.id === vote.targetId)?.name : t("Kill nobody", "空刀") : t("Choosing", "选择中")}</p>)}</div>}
    {view.phase.kind === "voting" && view.voteRound === 2 && <p className={styles.notice}>{t("Runoff: only the tied players may receive votes. Another tie ends the day without an exile.", "第二轮：仅可投票给平票玩家。再次平票则无人出局，直接入夜。")}</p>}
    {action?.step === "witch" && <p className={styles.privateLog}>{action.victimId ? t(`The pack targeted ${view.seats.find((seat) => seat.id === action.victimId)?.name}.`, `狼刀目标是 ${view.seats.find((seat) => seat.id === action.victimId)?.name}。`) : t("No victim is visible to you tonight.", "今夜你看不到狼刀目标。")}</p>}
    {action && <p className={styles.actionHelp}>{action.options?.length && !choice ? t("Choose an option below to continue.", "先选择下方的行动选项。") : action.input === "double" ? action.minTargets === 1 ? t("Choose one or two players, then confirm.", "选择一至两名玩家后确认。") : t("Choose two players, then confirm.", "选择两名玩家后确认。") : choice === "save" || choice === "skip" || action.input === "choice" ? t("Confirm your choice below.", "请在下方确认你的选择。") : action.input === "none" ? t("Review your private information, then confirm to finish your turn.", "查看私人信息后，请确认以完成回合。") : t("Select your target. Your choice stays private until the rules reveal it.", "请选择目标。在规则允许公开之前，你的选择将保持私密。")}</p>}
    {action?.options?.length ? <div className={styles.choiceRow}>{action.options.map((option) => { const value = optionValue(option); return <button key={value} className={`${styles.secondaryButton} ${choice === value ? styles.selectedChoice : ""}`} aria-pressed={choice === value} onClick={() => setChoice(value)} disabled={disabled}>{typeof option === "object" && (option.name || option.label) ? text(option.name || option.label, lang) : text(choiceLabels[value], lang) || text(roleMap[value]?.name, lang) || value}</button>; })}</div> : null}
    {((action && showTargets) || voting || special) && <div className={styles.targetGrid}>{view.seats.filter((seat) => available.includes(seat.id)).map((seat) => <button key={seat.id} disabled={disabled} className={`${styles.targetButton} ${targets.includes(seat.id) ? styles.selectedTarget : ""}`} aria-pressed={targets.includes(seat.id)} onClick={() => select(seat.id)} title={seat.name} aria-label={t(`Seat ${view.seats.indexOf(seat) + 1}: ${seat.name}`, `${view.seats.indexOf(seat) + 1}号：${seat.name}`)}><span className={styles.targetNumber}>{view.seats.indexOf(seat) + 1}</span><span className={styles.targetName}>{seat.name}</span>{targets.includes(seat.id) && <Check size={15} />}</button>)}</div>}
    {(action || voting) && <div className={styles.actionButtons}><button className={styles.primaryButton} disabled={disabled || !!invalid} onClick={() => void submit()}><Check size={17} />{voting ? t("Submit vote", "提交投票") : t("Confirm action", "确认行动")}</button>{(action?.canSkip || voting) && <button className={styles.secondaryButton} disabled={disabled} onClick={() => void submit(true)}>{voting ? t("Abstain", "弃票") : action?.step === "wolves" ? t("Kill nobody", "空刀") : action?.step === "guard" ? t("Protect nobody", "空守") : t("Skip ability", "跳过技能")}</button>}</div>}
    {!action && !voting && daySpecial && <><p className={styles.hint}>{t("These abilities reveal your action publicly and cannot be undone.", "此技能将公开发动，无法撤销。")}</p><div className={styles.choiceRow}>{view.me?.canDuel && <button className={styles.secondaryButton} onClick={() => setSpecial("knightDuel")}>{t("Challenge a player", "选择决斗目标")}</button>}{view.me?.canExplode && <button className={styles.secondaryButton} onClick={() => setSpecial("wolfExplode")}>{t("Self-destruct", "发动自爆")}</button>}{view.me?.canPassBadge && <><button className={styles.secondaryButton} onClick={() => setSpecial("passBadge")}>{t("Pass the sheriff badge", "移交警徽")}</button><button className={styles.secondaryButton} onClick={() => setSpecial("destroyBadge")}>{t("Destroy the badge", "撕毁警徽")}</button></>}</div>{special && <button className={styles.dangerButton} disabled={disabled || ((special === "knightDuel" || special === "passBadge" || view.me?.roleId === "whiteWolfKing") && !targets.length)} onClick={() => void send({ type: special === "destroyBadge" ? "passBadge" : special, targetId: special === "destroyBadge" ? null : targets[0] })}>{special === "destroyBadge" ? t("Confirm: destroy badge", "确认撕毁警徽") : t("Confirm public ability", "确认公开发动技能")}</button>}</>}
  </div>;
}

function RoleLibrary({ lang, view, onClose }: { lang: Language; view: GameView | null; onClose: () => void }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  return <Modal title={t("The role library", "角色图鉴")} onClose={onClose}><p className={styles.hint}>{catalogue.ruleset[lang]}</p><input className={styles.searchInput} placeholder={t("Find a role…", "搜索角色…")} value={search} onChange={(event) => setSearch(event.target.value)} aria-label={t("Search roles", "搜索角色")} /><div className={styles.filterTabs}>{[["all", t("All roles", "全部角色")], ["village", t("Village", "好人")], ["wolf", t("Werewolves", "狼人")], ["independent", t("Independent", "第三方")], ...(view ? [["deck", t("This deck", "本局配置")]] : [])].map(([id, label]) => <button key={id} className={filter === id ? styles.activeTab : ""} onClick={() => setFilter(id)}>{label}</button>)}</div><div className={styles.roleList}>{catalogue.roles.filter((role) => (filter === "all" || role.team === filter || filter === "deck" && view?.roleDeck.includes(role.id)) && `${role.name.en} ${role.name.zh}`.toLowerCase().includes(search.toLowerCase())).map((role) => <article key={role.id} className={styles.roleRow}><div className={`${styles.roleGlyph} ${role.team === "wolf" ? styles.wolfGlyph : ""}`}>{roleIcon(role, 25)}</div><div><h3>{role.name[lang]} <span>{role.name[lang === "en" ? "zh" : "en"]}</span>{view?.roleDeck.includes(role.id) && <small> ×{view.roleDeck.filter((id) => id === role.id).length}</small>}</h3><p>{role.description[lang]}</p></div></article>)}</div></Modal>;
}

function RoomSettings({ view, lang, disabled, send, onClose }: { view: GameView; lang: Language; disabled: boolean; send: (command: Command) => Promise<boolean>; onClose: () => void }) {
  const [settings, setSettings] = useState<Settings>(view.settings);
  const [deck, setDeck] = useState(view.roleDeck.length ? view.roleDeck : catalogue.presets.find((preset) => preset.id === String(view.seats.length))?.roles || catalogue.presets.find((preset) => preset.id === "12")!.roles);
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const [presetId, setPresetId] = useState(() => catalogue.presets.find(preset => [...preset.roles].sort().join(",") === [...deck].sort().join(","))?.id || "custom");
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const preset = catalogue.presets.find(item => item.id === presetId);
  const customized = !!preset && [...preset.roles].sort().join(",") !== [...deck].sort().join(",");
  const primaryIds = new Set([...(preset?.roles || []), ...deck]);
  const primaryRoles = catalogue.roles.filter(role => primaryIds.has(role.id));
  const otherRoles = catalogue.roles.filter(role => !primaryIds.has(role.id));
  const infoId = useId();
  const update = (key: string, value: unknown) => setSettings((current) => ({ ...current, [key]: value }));
  const changeCount = (id: string, amount: number) => setDeck((current) => amount > 0 ? current.length < 24 ? [...current, id] : current : current.filter((role, index) => role !== id || index !== current.indexOf(id)));
  function renderRoleRow(role: Role) {
    const count = deck.filter(id => id === role.id).length;
    const expanded = expandedRole === role.id;
    const descriptionId = `${infoId}-${role.id}`;
    return <div key={role.id} className={styles.deckRole}>
      <div className={styles.deckRow}>
        <span>{roleIcon(role, 19)}<span>{role.name[lang]}</span><button type="button" className={styles.roleInfoButton} aria-label={`${t("About", "查看技能：")} ${role.name[lang]}`} aria-expanded={expanded} aria-controls={descriptionId} onClick={() => setExpandedRole(expanded ? null : role.id)}><Info size={19} /></button></span>
        <div><button type="button" aria-label={`${t("Remove", "减少")} ${role.name[lang]}`} disabled={!count || disabled} onClick={() => changeCount(role.id, -1)}>−</button><span>{count}</span><button type="button" aria-label={`${t("Add", "增加")} ${role.name[lang]}`} disabled={disabled || deck.length >= 24 || count >= 1 && role.id !== "villager" && role.id !== "werewolf"} onClick={() => changeCount(role.id, 1)}>+</button></div>
      </div>
      <p id={descriptionId} className={styles.roleExplanation} hidden={!expanded}>{role.description[lang]}</p>
    </div>;
  }
  return <Modal title={t("Set the table", "配置牌局")} onClose={onClose}><form onSubmit={async (event) => { event.preventDefault(); if (await send({ type: "updateSettings", settings: view.status === "lobby" ? settings : { autoAdvance: false, nightSeconds: settings.nightSeconds, daySeconds: settings.daySeconds, voteSeconds: settings.voteSeconds }, ...(view.status === "lobby" ? { roleDeck: deck } : {}) })) onClose(); }} className={styles.settingsForm}>
    <div className={styles.settingsSaveBar}><div><strong>{view.status === "lobby" ? `${deck.length} / ${view.seats.length}` : t("Room settings", "房间设置")}</strong><small>{view.status === "lobby" ? t("role cards / players", "身份牌 / 玩家") : t("Current game", "当前牌局")}</small></div><button type="submit" className={styles.primaryButton} disabled={disabled}>{t("Save settings", "保存设置")}</button></div>
    {view.status === "lobby" && <>
      <label>{t("Game mode", "游戏板型")}<select value={presetId} onChange={(event) => {
        const selected = catalogue.presets.find(item => item.id === event.target.value);
        setPresetId(event.target.value); setExpandedRole(null);
        if (selected) setDeck([...selected.roles]);
      }}><option value="custom">{t("Custom deck", "自定义配置")}</option>{catalogue.presets.map(item => <option key={item.id} value={item.id}>{item.name[lang]}</option>)}</select></label>
      <p className={styles.presetDescription}>{preset ? preset.description[lang] : t("Build your own mix. Selected roles appear first; expand Other roles to add more.", "自由搭配身份牌。已选角色优先显示，可展开其他角色继续添加。")}</p>
      {customized && <p className={styles.hint}>{t("You’ve customized this preset’s role counts.", "你已调整此预设的角色数量。")}</p>}
      <div className={styles.deckHeading}><h3>{t("Roles in this setup", "本局角色")}</h3><span>{deck.length} / {view.seats.length} {t("players", "位玩家")}</span></div>
      <p className={styles.hint}>{t("One card per player. Tap ⓘ to read a role’s ability.", "每位玩家一张身份牌，点击 ⓘ 查看角色技能。")}</p>
      <div className={styles.deckPicker}>{primaryRoles.map(renderRoleRow)}</div>
      {!!otherRoles.length && <details className={styles.otherRoles}><summary>{t("Other roles", "其他角色")} · {otherRoles.length}</summary><div className={styles.deckPicker}>{otherRoles.map(renderRoleRow)}</div></details>}
    </>}
    <details className={styles.advancedRules}><summary>{t("House rules & moderation", "本局规则与主持")}</summary><div>
    <h3>{t("Pace & moderation", "节奏与主持")}</h3><p className={styles.hint}>{t("Actions never expire. Nights proceed after players submit; the host can skip the current step at night or during the day without seeing pending players or identities. Disconnections never automatically pause or skip a step.", "行动不会超时。玩家提交后夜间自动继续；房主可强制跳过夜间或白天当前阶段，无需查看待行动玩家或身份。断线不会自动暂停或跳过阶段。")}</p>
    <h3>{t("House rules", "本局规则")}</h3><details><summary>{t("Rules for these boards", "本板型采用的规则")}</summary><p className={styles.hint}>{catalogue.ruleset[lang]}</p></details><label>{t("Werewolf victory", "狼人获胜条件")}<select value={settings.winCondition} onChange={(event) => update("winCondition", event.target.value)} disabled={view.status !== "lobby"}><option value="edge">{t("Eliminate all villagers OR all special village roles", "屠边：消灭所有平民或所有神职")}</option><option value="all">{t("Eliminate the whole village", "屠城：消灭所有好人")}</option><option value="parity">{t("Equal or outnumber all opposition", "达到人数优势")}</option></select></label><label className={styles.toggleRow}><span>{t("Sheriff election enabled", "启用警长竞选")}</span><input type="checkbox" checked={settings.sheriff} onChange={(event) => update("sheriff", event.target.checked)} disabled={view.status !== "lobby"} /></label><label>{t("Witch self-save", "女巫自救")}<select value={witchSelfSaveRule(settings.witchSelfSave)} onChange={(event) => update("witchSelfSave", event.target.value === "firstNight" ? "firstNight" : event.target.value === "always")} disabled={view.status !== "lobby"}>{Object.entries(witchSelfSaveLabels).map(([value, label]) => <option key={value} value={value}>{text(label, lang)}</option>)}</select></label><p className={styles.hint}>{t("Self-saving uses the same single antidote. First night only refers to the game’s first night; saving other players is still allowed later.", "自救同样消耗唯一一瓶解药。「仅首夜」指本局游戏的第一个夜晚；之后仍可用解药救其他玩家。")}</p><label>{t("Guard + antidote on the same target", "同守同救")}<select value={settings.guardAntidote} onChange={(event) => update("guardAntidote", event.target.value)} disabled={view.status !== "lobby"}><option value="save">{t("Target survives", "目标存活")}</option><option value="kill">{t("Target dies", "目标死亡")}</option></select></label></div></details><div className={styles.modalActions}><button type="button" className={styles.secondaryButton} onClick={onClose}>{t("Cancel", "取消")}</button><button type="submit" className={styles.primaryButton} disabled={disabled}>{t("Save settings", "保存设置")}</button></div>
  </form></Modal>;
}

function PeopleManager({ view, lang, disabled, send, onClose }: { view: GameView; lang: Language; disabled: boolean; send: (command: Command) => Promise<boolean>; onClose: () => void }) {
  const [name, setName] = useState("");
  const [replacement, setReplacement] = useState<Record<string, string>>({});
  const [confirmSeat, setConfirmSeat] = useState("");
  const [dragTarget, setDragTarget] = useState<number | null>(null);
  const canArrange = view.isHost && !disabled && view.status === "lobby" && view.phase.kind === "lobby";

  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  return <Modal title={t("Around the table", "座位与玩家")} onClose={onClose}><p className={styles.hint}>{t("Invite with room code", "邀请房间码")} <strong>{view.code}</strong> · {t("Rejoining players keep their role when you replace their existing seat.", "将重连玩家接替至原座位，可保留其身份与进度。")}</p>
    {view.isHost && !!view.requests?.length && <section className={styles.joinRequests}><h3>{t("Waiting for your approval", "等待你的批准")}</h3>{view.requests.map((request) => <div key={request.id} className={styles.joinRequest}><strong>{request.name}</strong><label>{t("Seat assignment", "安排座位")}<select value={replacement[request.id] || ""} onChange={(event) => setReplacement((current) => ({ ...current, [request.id]: event.target.value }))}><option value="">{view.status === "lobby" ? t("Add as a new player", "作为新玩家加入") : t("Select a seat to replace", "选择要接替的座位")}</option>{view.seats.filter((seat) => !seat.isHost).map((seat) => <option key={seat.id} value={seat.id}>{view.seats.indexOf(seat) + 1}. {seat.name} · {seat.isBot ? t("test bot", "测试机器人") : seat.connected ? t("online", "在线") : t("offline", "离线")}</option>)}</select></label>{replacement[request.id] && view.seats.some(seat => seat.id === replacement[request.id] && seat.connected && !seat.isBot) && <p className={styles.warningText}>{t("This player is online. Approving replaces their access immediately.", "此玩家仍在线，批准后将立即替换其访问权限。")}</p>}<div className={styles.actionButtons}><button className={styles.primaryButton} disabled={disabled || view.status !== "lobby" && !replacement[request.id]} onClick={() => void send({ type: "approveJoin", requestId: request.id, replaceSeatId: replacement[request.id] || undefined })}><Check size={15} />{t("Approve", "批准")}</button><button className={styles.secondaryButton} disabled={disabled} onClick={() => void send({ type: "rejectJoin", requestId: request.id })}>{t("Decline", "拒绝")}</button></div></div>)}</section>}
    <div className={styles.peopleList}>{view.seats.map((seat, index) => <div key={seat.id} data-seat-index={index} className={`${styles.personRow} ${dragTarget === index ? styles.dragTarget : ""}`}>
      {view.isHost && <button className={styles.dragHandle} disabled={!canArrange} aria-label={t(`Drag seat ${index+1} to reorder`, `拖动${index+1}号调整座位`)} onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);setDragTarget(index);}} onPointerMove={event=>{if(!event.currentTarget.hasPointerCapture(event.pointerId)) return; const row=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>("[data-seat-index]"); if(row) setDragTarget(Number(row.dataset.seatIndex));}} onPointerUp={event=>{if(!event.currentTarget.hasPointerCapture(event.pointerId)) return;event.currentTarget.releasePointerCapture(event.pointerId);if(dragTarget!==null && dragTarget!==index) void send({type:"moveSeat",seatId:seat.id,number:dragTarget+1});setDragTarget(null);}} onPointerCancel={()=>setDragTarget(null)}>⠿</button>}
      <span className={styles.personNumber}>{view.isHost ? <select className={styles.seatNumberSelect} aria-label={`${t("Seat number for", "座位编号：")} ${seat.name}`} disabled={!canArrange} value={index + 1} onChange={event => void send({type: "moveSeat", seatId: seat.id, number: Number(event.target.value)})}>{view.seats.map((_, number) => <option key={number} value={number + 1}>{number + 1}</option>)}</select> : index + 1}</span><div className={styles.personName}><strong>{seat.name}{seat.isBot && <BotLabel lang={lang}/>} {seat.isHost && <Crown size={14} />}</strong><small>{seat.isBot ? t("Test bot · controlled by the room", "测试机器人 · 由房间执行行动") : seat.connected && seat.occupied ? t("Connected", "在线") : t("Seat retained · waiting to reconnect", "座位保留 · 等待重连")}</small></div>{view.isHost && !seat.isHost && <div className={styles.personActions}>{view.phase.kind === "day" && seat.alive && <button className={styles.iconButton} disabled={disabled || view.phase.paused || seat.silenced} title={t("Give the floor", "安排发言")} onClick={() => void send({ type: "setSpeaker", seatId: seat.id })}><SpeakerHigh size={18} /></button>}{!seat.isBot && <button className={styles.iconButton} disabled={disabled || !seat.occupied} title={t("Transfer hosting", "移交房主")} onClick={() => setConfirmSeat(`host:${seat.id}`)}><Crown size={18} /></button>}<button className={styles.iconButton} disabled={disabled} title={seat.isBot ? t("Remove bot", "移除机器人") : t("Remove player", "移除玩家")} onClick={() => setConfirmSeat(`remove:${seat.id}`)}><Trash size={18} /></button></div>}{confirmSeat.endsWith(`:${seat.id}`) && <div className={styles.inlineConfirm}><p>{confirmSeat.startsWith("host:") ? t(`Transfer host controls to ${seat.name}? Your host access will end.`, `将房主移交给 ${seat.name}？你将失去房主权限。`) : view.status === "lobby" ? t(`Remove ${seat.name} from this room?`, `将 ${seat.name} 移出房间？`) : seat.isBot ? t(`Stop ${seat.name}? Its role stays alive, but it will stop acting until a human takes over the seat.`, `停用 ${seat.name}？其身份仍存活，但将停止自动行动，直到真人接替此座位。`) : t(`Remove ${seat.name}'s access? Their role stays alive and can be reassigned.`, `移除 ${seat.name} 的访问权限？其角色仍然存活，可安排他人接替。`)}</p><button className={styles.dangerButton} disabled={disabled} onClick={async () => { if (await send({ type: confirmSeat.startsWith("host:") ? "transferHost" : "removeSeat", seatId: seat.id })) setConfirmSeat(""); }}>{t("Confirm", "确认")}</button><button className={styles.textButton} onClick={() => setConfirmSeat("")}>{t("Cancel", "取消")}</button></div>}</div>)}</div>
    {view.isHost && view.status === "lobby" && <form className={styles.addPlayerForm} onSubmit={async (event) => { event.preventDefault(); if (await send({ type: "addSeat", name: name.trim() })) setName(""); }}><label>{t("Reserve a named seat", "预留具名座位")}<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={24} placeholder={t("Player name", "玩家名字")} /></label><button className={styles.secondaryButton} disabled={disabled || !name.trim()}><Plus size={17} />{t("Add seat", "添加座位")}</button><p className={styles.hint}>{t("Before the game starts, a player joining with this exact name takes the reserved seat automatically. Other players join new seats.", "游戏开始前，玩家使用完全相同的名字加入即可自动入座；其他名字的玩家会加入新座位。")}</p></form>}
  </Modal>;
}

function ChatPanel({ view, lang, disabled, send }: { view: GameView; lang: Language; disabled: boolean; send: (command: Command) => Promise<boolean> }) {
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("public");
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const allowed = !view.me ? [] : !view.me.alive && view.status === "playing" ? ["dead"] : view.phase.kind === "night" ? view.me.team === "wolf" && view.me.roleId !== "hiddenWolf" && view.me.roleId !== "gargoyle" ? ["wolves"] : [] : view.seats.find(seat => seat.id === view.me?.seatId)?.silenced && view.status === "playing" ? [] : ["public"];
  const activeChannel = allowed.includes(channel) ? channel : allowed[0] || "public";
  return <>{view.seats.find(seat => seat.id === view.me?.seatId)?.silenced && <p>{t("You are silenced today. You can still vote and use abilities.", "你今日被禁言，仍可投票及发动技能。")}</p>}<div className={styles.chatChannels}>{allowed.map((item) => <button key={item} className={activeChannel === item ? styles.activeTab : ""} onClick={() => setChannel(item)}>{item === "wolves" ? t("Wolf pack", "狼队频道") : item === "dead" ? t("Eliminated players", "出局玩家频道") : t("The village", "公共频道")}</button>)}</div><div className={styles.chatMessages}>{view.messages?.filter((item) => item.channel === activeChannel).slice(-60).map((item) => <div key={item.id}><strong>{item.name || view.seats.find((seat) => seat.id === item.seatId)?.name}</strong><p>{item.text}</p></div>)}{!view.messages?.some((item) => item.channel === activeChannel) && <p className={styles.emptyLog}>{t("No messages yet. Choose your words carefully.", "暂无消息。每一句话，都可能是线索。")}</p>}</div><form className={styles.chatForm} onSubmit={async (event) => { event.preventDefault(); if (await send({ type: "chat", text: message.trim(), channel: activeChannel })) setMessage(""); }}><input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} required disabled={!allowed.length} aria-label={t("Chat message", "聊天消息")} placeholder={!allowed.length ? t("Please stay quiet during the night", "夜间请保持安静") : t("Say something to the table…", "说出你的想法…")} /><button className={styles.primaryButton} disabled={disabled || !allowed.length || !message.trim()}><ArrowRight size={20} /><span>{t("Send", "发送")}</span></button></form></>;
}

function Replay({ view, lang }: { view: GameView; lang: Language }) {
  const t = (en: string, zh: string) => lang === "en" ? en : zh;
  const seatName = (id: string) => view.seats.find((seat) => seat.id === id)?.name || id;
  return <section className={styles.replayPanel}><h2><Eye size={18} />{t("Behind the secrets", "秘密揭晓")}</h2><p className={styles.hint}>{t("The complete action record is revealed only after the game ends.", "完整行动记录仅在游戏结束后公开。")}</p>{view.replay?.map((round, index) => <details key={index} className={styles.replayRound}><summary>{round.type === "night" ? t(`Night ${round.night}`, `第 ${round.night} 夜`) : `${t(`Day ${round.day}`, `第 ${round.day} 天`)} · ${round.kind === "sheriff" ? t("Sheriff election", "警长竞选") : t("Exile vote", "放逐投票")}`}</summary>{round.type === "night" ? <><div className={styles.replayRows}>{Object.entries(round.actions).flatMap(([step, actions]) => Object.entries(actions).map(([id, action]) => <div key={`${step}:${id}`}><span>{text(roleMap[step]?.name || stepLabels[step], lang) || step}</span><strong>{seatName(id)}</strong><p>{action.skip ? t("Skipped", "跳过") : `${action.ability ? text(choiceLabels[action.ability], lang) || action.ability : action.choice ? text(choiceLabels[action.choice], lang) || action.choice : t("Selected", "选择")} ${action.targetIds?.length ? action.targetIds.map(seatName).join(" · ") : action.targetId ? seatName(action.targetId) : ""}`}</p></div>))}</div><p className={styles.hint}>{t("Eliminated:", "出局：")} {round.eliminatedSeatIds?.length ? round.eliminatedSeatIds.map(seatName).join(" · ") : t("No one", "无人")}</p></> : <div className={styles.replayRows}>{Object.entries(round.votes).map(([id, target]) => <div key={id}><strong>{seatName(id)}</strong><ArrowRight size={13} /><p>{target ? seatName(target) : t("Abstained", "弃票")}</p></div>)}</div>}</details>)}</section>;
}
