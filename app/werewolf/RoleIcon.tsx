import {
  Bird, CloudMoon, Crosshair, Crown, Dog, Eye, EyeSlash, Feather, Fire,
  Flask, FlowerTulip, Gear, HandGrabbing, Heart, House, MagicWand,
  MaskHappy, Moon, MoonStars, Mountains, MusicNotes, Plant, Scales,
  SpeakerSlash, Shield, Shovel, Smiley, Sparkle, StarFour, Sword, Tree, type Icon,
} from "@phosphor-icons/react";
import type { Role } from "@/lib/werewolfClient";
import styles from "./werewolf.module.css";

const roleGlyphs: Partial<Record<string, Icon>> = {
  villager: House,
  seer: Eye,
  witch: Flask,
  hunter: Crosshair,
  guard: Shield,
  idiot: Smiley,
  cupid: Heart,
  knight: Sword,
  dreamweaver: CloudMoon,
  magician: MagicWand,
  gravekeeper: Shovel,
  silencer: SpeakerSlash,
  raven: Bird,
  demonHunter: Fire,
  pureWhite: Sparkle,
  wildChild: Plant,
  wolfHound: Dog,
  thief: HandGrabbing,
  piper: MusicNotes,
  angel: Feather,
  elder: Tree,
  scapegoat: Scales,
  jester: MaskHappy,
};

// Special wolves keep their wolf silhouette, with an individual ability emblem.
const wolfEmblems: Partial<Record<string, Icon>> = {
  wolfKing: Crown,
  whiteWolfKing: StarFour,
  wolfBeauty: FlowerTulip,
  hiddenWolf: EyeSlash,
  gargoyle: Mountains,
  mechanicalWolf: Gear,
  bloodMoonApostle: MoonStars,
  wolfWitch: Flask,
};

export function RoleIcon({ role, size = 24 }: { role?: Role; size?: number }) {
  const Glyph = roleGlyphs[role?.id || ""] || Moon;
  const Emblem = wolfEmblems[role?.id || ""];
  const wolf = role?.id === "werewolf" || !!Emblem;
  return <span className={styles.characterIcon} style={{ width: size, height: size }} role="img" aria-label={role ? `${role.name.en} / ${role.name.zh}` : "Unknown role / 未知身份"}>
    <span aria-hidden="true" className={styles.characterIconArt}>
      {wolf ? <span className={styles.wolfHead} style={{ width: Emblem ? "82%" : "100%", height: Emblem ? "82%" : "100%" }} /> : <Glyph size={size} weight="duotone" />}
      {Emblem && <span className={styles.wolfEmblem}><Emblem size={Math.max(11, Math.round(size * .5))} weight="bold" /></span>}
    </span>
  </span>;
}
