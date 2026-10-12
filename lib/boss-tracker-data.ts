import { TrackerBoss, BossPhase } from './boss-tracker-types';

export function getBossCooldownRange(level: number): {
  minCooldownHours: number;
  maxCooldownHours: number;
  baseHours: number;
  label: string;
} {
  // 20 to 38 included: 6h +- 2h (4 to 8 hours)
  if (level <= 38) {
    return { minCooldownHours: 4, maxCooldownHours: 8, baseHours: 6, label: '6±2 ч (4–8 ч)' };
  }
  // 40 to 44 included: 7h +- 2h (5 to 9 hours)
  if (level <= 44) {
    return { minCooldownHours: 5, maxCooldownHours: 9, baseHours: 7, label: '7±2 ч (5–9 ч)' };
  }
  // 45 to 51 (до 52 не включительно): 8h +- 2h (6 to 10 hours)
  if (level < 52) {
    return { minCooldownHours: 6, maxCooldownHours: 10, baseHours: 8, label: '8±2 ч (6–10 ч)' };
  }
  // 52 and higher: 10h +- 2h (8 to 12 hours)
  return { minCooldownHours: 8, maxCooldownHours: 12, baseHours: 10, label: '10±2 ч (8–12 ч)' };
}

export function calculateRespawnTimestamps(
  todStr: string,
  minHours: number,
  maxHours: number,
  baseDate?: Date
): {
  windowStart: string;
  windowEnd: string;
  windowStartTimestamp: number;
  windowEndTimestamp: number;
  timeOfDeathTimestamp: number;
  phase: BossPhase;
  secondsUntilWindow: number;
  secondsRemainingInWindow: number;
} {
  const now = Date.now();
  const dateObj = baseDate ? new Date(baseDate) : new Date();

  const parts = todStr.split(':').map((p) => parseInt(p, 10));
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;

  // Build death time on today or yesterday
  const deathDate = new Date(dateObj);
  deathDate.setHours(hours, minutes, seconds, 0);

  // If death time in the future, it happened yesterday
  if (deathDate.getTime() > now) {
    deathDate.setDate(deathDate.getDate() - 1);
  }

  const deathMs = deathDate.getTime();
  const windowStartMs = deathMs + minHours * 3600 * 1000;
  const windowEndMs = deathMs + maxHours * 3600 * 1000;

  const pad = (n: number) => String(n).padStart(2, '0');
  const dStart = new Date(windowStartMs);
  const dEnd = new Date(windowEndMs);

  const windowStart = `${pad(dStart.getHours())}:${pad(dStart.getMinutes())}`;
  const windowEnd = `${pad(dEnd.getHours())}:${pad(dEnd.getMinutes())}`;

  let phase: BossPhase = 'NO_DATA';
  let secondsUntilWindow = 0;
  let secondsRemainingInWindow = 0;

  if (now < windowStartMs) {
    phase = 'WAITING_WINDOW';
    secondsUntilWindow = Math.max(0, Math.floor((windowStartMs - now) / 1000));
    secondsRemainingInWindow = Math.max(0, Math.floor((windowEndMs - now) / 1000));
  } else if (now >= windowStartMs && now <= windowEndMs) {
    phase = 'WINDOW_OPEN';
    secondsUntilWindow = 0;
    secondsRemainingInWindow = Math.max(0, Math.floor((windowEndMs - now) / 1000));
  } else {
    phase = 'WINDOW_EXPIRED';
    secondsUntilWindow = 0;
    secondsRemainingInWindow = 0;
  }

  return {
    windowStart,
    windowEnd,
    windowStartTimestamp: windowStartMs,
    windowEndTimestamp: windowEndMs,
    timeOfDeathTimestamp: deathMs,
    phase,
    secondsUntilWindow,
    secondsRemainingInWindow,
  };
}

// Complete list of Lineage 2 raid bosses from Level 20 to 56
export const RAW_BOSS_DATA: Array<{
  id: string;
  name: string;
  level: number;
  camCode?: string;
  initialTod?: string;
  minCooldownHours: number;
  maxCooldownHours: number;
  link?: string;
  notes?: string;
}> = [
  // ================= 20+ РБ (респ 4 - 8 часов) =================
  { id: 'ferkel_20', name: 'Zombie Lord Ferkel', level: 20, camCode: 'cam38', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'kaysha_20', name: 'Kaysha Gerald of Icarus', level: 20, camCode: 'cam39', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'madness_beast_20', name: 'Madness Beast', level: 20, camCode: 'cam40', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'bifrons_21', name: 'Serpent Demon Bifrons', level: 21, camCode: 'cam41', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'malex_21', name: 'Malex Herald of Dagoniel', level: 21, camCode: 'cam42', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'sukar_wererat_21', name: 'Sukar Wererat Chief', level: 21, camCode: 'camera104', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'greyclaw_kutus_23', name: 'Greyclaw Kutus', level: 23, camCode: 'cam43', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'sharuk_23', name: 'Tracker Leader Sharuk', level: 23, camCode: 'cam44', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'priest_kuroboros_23', name: 'Priest Kuroboros', level: 23, camCode: 'cam67', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'jaba_25', name: 'Princess Molrang (Жаба)', level: 25, camCode: 'camera101', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'crowl_25', name: 'Zombie Lord Crowl', level: 25, camCode: 'camera102', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'ikuntai_25', name: 'Ikuntai', level: 25, camCode: 'camera103', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'soul_scavenger_25', name: 'Soul Scavenger', level: 25, camCode: 'camera107', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'osa_dion_25', name: 'Tiger Hornet (Оса Дион)', level: 25, camCode: 'cam11', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'freki_25', name: 'Freki', level: 25, camCode: 'cam13', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'mammon_talos_25', name: 'Mammon Collector Talos', level: 25, camCode: 'cam15', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'patriarch_kuroboros_26', name: 'Patriarch Kuroboros', level: 26, camCode: 'cam68', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'tirak_28', name: 'Tirak', level: 28, camCode: 'camera105', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'elf_renoa_29', name: 'Elf Renoa', level: 29, camCode: 'cam73', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'turek_captain_30', name: 'Turek Mercenary Captain', level: 30, camCode: 'cam70', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'wasteland_basilisk_30', name: 'Giant Wasteland Basilisk', level: 30, camCode: 'cam71', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'boss_akata_30', name: 'Boss Akata', level: 30, camCode: 'cam72', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'mina_30', name: 'Agent of Beres Meana (Мина)', level: 30, camCode: 'camera106', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'apepi_30', name: 'Apepi', level: 30, camCode: 'cam12', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'cats_eye_bandit_30', name: "Cat's Eye Bandit", level: 30, camCode: 'cam24', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'queen_guards_32', name: "Captain of Queen's Royal Guards", level: 32, camCode: 'cam14', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'skyla_32', name: 'Skyla', level: 32, camCode: 'cam17', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'gharmash_33', name: 'Vuku Grand Seer Gharmash', level: 33, camCode: 'cam69', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'kylon_33', name: 'Corsair Captain Kylon', level: 33, camCode: 'cam21', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'zyrnna_34', name: 'Stakato Queen Zyrnna', level: 34, camCode: 'cam16', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'breka_pastu_34', name: 'Breka Warlock Pastu', level: 34, camCode: 'cam18', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'cronos_mumu_34', name: "Cronos's Servitor Mumu", level: 34, camCode: 'cam23', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'eg_tunnel_34', name: 'ЕГ тунель', level: 34, camCode: 'cam22', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'beleths_eye_35', name: "Beleth's Eye", level: 35, camCode: 'camer18', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'acheron_35', name: 'Soul Collector Acheron', level: 35, camCode: 'cam20', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'hellena_35', name: 'Tasaba Patriarch Hellena', level: 35, camCode: 'cam27', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'sirocco_35', name: 'Gargoyle Lord Sirocco', level: 35, camCode: 'cam30', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'shadar_35', name: 'Flame Lord Shadar', level: 35, camCode: 'cam29', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'trakia_35', name: 'Redeye Trakia', level: 35, camCode: 'cam31', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'remmel_35', name: 'Remmel', level: 35, camCode: 'cam26', initialTod: '15:45:55', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'tempest_36', name: 'Evil Spirit Tempest', level: 36, camCode: 'cam28', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'sebek_36', name: 'Sebek', level: 36, camCode: 'cam25', minCooldownHours: 4, maxCooldownHours: 8 },
  { id: 'nakondas_38', name: 'Nakondas', level: 38, camCode: 'cam35', minCooldownHours: 4, maxCooldownHours: 8 },

  // ================= 40+ РБ (респ 5 - 9 часов) =================
  { id: 'rayito_40', name: "Rayito's Henchman", level: 40, camCode: 'cam33', initialTod: '20:06:09', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'hellion_40', name: 'Lizardmen Leader Hellion', level: 40, camCode: 'cam34', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'nellis_41', name: "Nellis' Vengeful Spirit", level: 41, camCode: 'cam32', initialTod: '20:08:31', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'cat_gang_41', name: 'Leader of Cat Gang', level: 41, camCode: 'cam36', initialTod: '23:15:10', minCooldownHours: 5, maxCooldownHours: 9, notes: 'premo 23.20' },
  { id: 'lian_41', name: 'Water Spirit Lian', level: 41, camCode: 'cam37', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'teruk_42', name: 'Wizard of Storm Teruk', level: 42, camCode: 'cam45', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'icarus_sample_42', name: 'Icarus Sample 1', level: 42, camCode: 'cam47', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'talkin_42', name: 'Leto Chief Talkin', level: 42, camCode: 'cam48', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'gwindorr_42', name: 'Gwindorr', level: 42, camCode: 'cam49', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'rat_43', name: 'Road Scavenger Leader (Крыса 43)', level: 43, camCode: 'cam46', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'selu_43', name: 'Shaman King Selu', level: 43, camCode: 'cam50', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'ateka_43', name: 'Water Couatle Ateka', level: 43, camCode: 'cam52', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'sika_43', name: "Fafurion's Page Sika", level: 43, camCode: 'cam51', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'cletu_44', name: 'Retreat Spider Cletu', level: 44, camCode: 'cam54', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'panathen_44', name: 'Earth Protector Panathen', level: 44, camCode: 'cam55', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'barrel_44', name: 'Crazy Mechanic Golem (Бочка 44)', level: 44, camCode: 'cam59', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'tree_45', name: 'Rotting Tree Repiro (Дерево 45)', level: 45, camCode: 'cam53', minCooldownHours: 6, maxCooldownHours: 10 },
  { id: 'timak_ranger_45', name: 'Timak Orc Chief Ranger', level: 45, camCode: 'cam56', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'kraven_45', name: 'Dread Avenger Kraven', level: 45, camCode: 'cam57', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'golem_45', name: 'Flamestone Golem (Голем 45)', level: 45, camCode: 'cam58', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'shacram_46', name: 'Shacram', level: 46, camCode: 'cam60', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'kelbar_46', name: 'Thief Kelbar', level: 46, camCode: 'cam61', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'blue_sky_46', name: 'Beacon of Blue Sky', level: 46, camCode: 'cam63', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'iron_totem_46', name: 'Iron Giant Totem', level: 46, camCode: 'cam77', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'karuta_47', name: 'Tiger King Karuta', level: 47, camCode: 'cam62', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'cyrion_47', name: 'Evil Spirit Cyrion', level: 47, camCode: 'cam60', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'istary_47', name: "Fafurion's Henchman Istary", level: 47, camCode: 'cam64', initialTod: '12:10:00', minCooldownHours: 6, maxCooldownHours: 10 },
  { id: 'gosmos_47', name: 'Timak Orc Gosmos', level: 47, camCode: 'cam65', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'suscepter_47', name: 'Archon Suscepter', level: 47, camCode: 'cam75', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'guard_48', name: 'Necrosentinel Royal Guard', level: 48, camCode: 'cam76', minCooldownHours: 5, maxCooldownHours: 9 },
  { id: 'tarlk_48', name: 'King Tarlk', level: 48, camCode: 'cam78', initialTod: '11:24:12', minCooldownHours: 6, maxCooldownHours: 10 },
  { id: 'atis_49', name: 'Ketra Commander Atis', level: 49, camCode: 'cam79', initialTod: '11:41:00', minCooldownHours: 6, maxCooldownHours: 10 },
  { id: 'handmaiden_49', name: "Orfen's Handmaiden", level: 49, camCode: 'cam66', initialTod: '11:55:00', minCooldownHours: 6, maxCooldownHours: 10 },
  { id: 'mirror_49', name: 'Mirror of Oblivion', level: 49, camCode: 'cam80', minCooldownHours: 5, maxCooldownHours: 9 },

  // ================= 52+ РБ (респ 8 - 12 часов) =================
  { id: 'gato_52', name: 'Carnage Lord Gato', level: 52, camCode: 'cam81', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'tillion_52', name: "Zaken's Chief Mate Tillion", level: 52, camCode: 'cam82', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'berun_52', name: 'Messenger of Fairy Queen Berun', level: 52, camCode: 'cam83', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'clara_52', name: 'Cursed Clara', level: 52, camCode: 'cam84', initialTod: '22:00:00', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'ereve_53', name: 'Deadman Ereve', level: 53, camCode: 'cam85', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'shaka_53', name: 'Captain of Red Flag Shaka', level: 53, camCode: 'cam86', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'atraiban_54', name: 'Atraiban', level: 54, camCode: 'cam87', initialTod: '23:50:00', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'kenishee_54', name: 'Magus Kenishee', level: 54, camCode: 'cam88', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'paniel_54', name: 'Paniel the Unicorn', level: 54, camCode: 'cam89', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'thieles_55', name: 'Furious Thieles', level: 55, camCode: 'cam90', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'ruell_55', name: 'Enchanted Forest Watcher Ruell', level: 55, camCode: 'cam91', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'isirr_55', name: 'Sorcerer Isirr', level: 55, camCode: 'cam92', initialTod: '22:40:00', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'sephia_55', name: "Beleth's Seer, Sephia", level: 55, camCode: 'cam93', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'tamash_55', name: 'Harit Hero Tamash 55', level: 55, camCode: 'cam97', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'pingolpin_55', name: "Fafurion's Envoy Pingolpin", level: 55, camCode: 'cam100', initialTod: '11:10:00', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'barda_55', name: 'Bandit Leader Barda', level: 55, camCode: 'cam103', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'black_lily_56', name: 'Black Lily', level: 56, camCode: 'cam94', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'tamash_56', name: 'Harit Hero Tamash', level: 56, camCode: 'cam95', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'niniel_56', name: "Eva's Spirit Niniel", level: 56, camCode: 'cam96', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'leo_56', name: 'Refugee Applicant Leo', level: 56, camCode: 'cam98', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'timak_ragoth_57', name: 'Timak Seer Ragoth', level: 57, camCode: 'cam101', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'garangky_56', name: 'Harit Guardian Garangky', level: 56, camCode: 'cam102', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'carnamakos_56', name: 'Carnamakos', level: 56, camCode: 'cam104', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'soulless_boar_59', name: 'Soulless Wild Boar', level: 59, camCode: 'cam105', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'lord_ishka_60', name: 'Lord Ishka', level: 60, camCode: 'cam106', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'underwater_guardian_60', name: 'The 3rd Underwater Guardian', level: 60, camCode: 'cam107', minCooldownHours: 8, maxCooldownHours: 12 },
  { id: 'butcher_60', name: 'Butcher', level: 60, camCode: 'cam108', minCooldownHours: 8, maxCooldownHours: 12 },
];

export function buildInitialBosses(): TrackerBoss[] {
  return RAW_BOSS_DATA.map((raw) => {
    const range = getBossCooldownRange(raw.level);
    const minCooldownHours = range.minCooldownHours;
    const maxCooldownHours = range.maxCooldownHours;

    return {
      id: raw.id,
      name: raw.name,
      level: raw.level,
      camCode: raw.camCode,
      timeOfDeath: undefined,
      timeOfDeathTimestamp: undefined,
      windowStart: undefined,
      windowEnd: undefined,
      windowStartTimestamp: undefined,
      windowEndTimestamp: undefined,
      minCooldownHours,
      maxCooldownHours,
      phase: 'NO_DATA' as BossPhase,
      secondsUntilWindow: undefined,
      secondsRemainingInWindow: undefined,
      notes: raw.notes,
      link: raw.link,
      assignedSpotter: null,
      spawnAlertUntil: undefined,
      readyCheckUntil: undefined,
      readyCheckBy: undefined,
    };
  });
}

