import { CameraAccountCharacter } from './boss-tracker-types';

export interface CameraAccount {
  groupId: number;
  authorGroup: string; // Group / Author (e.g. 'Qox' for initial, or custom user-defined)
  groupName: string;
  login: string;
  password: string;
  camCodes: string[];
  characters?: CameraAccountCharacter[];
  colorHex?: string;
  description?: string;
}

export interface AccountOccupancy {
  groupId: number;
  activeCamCode: string;
  occupiedBy: {
    nickname: string;
    className: string;
    level: number;
    clanName: string;
    isMe?: boolean;
  };
  occupiedAt: number;
}

export const CUSTOM_ACCOUNTS_STORAGE_KEY = 'p2k_custom_camera_accounts_v1';

// Complete list of camera accounts reconstructed directly from the user's spreadsheet screenshots.
// Initial default accounts belong to group 'Qox' as requested by the user.
export const CAMERA_ACCOUNTS: CameraAccount[] = [
  {
    groupId: 6,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #6',
    login: 'YXZhuikota',
    password: '8665233909Zx',
    camCodes: ['cam38', 'cam39', 'cam40', 'cam41', 'cam42', 'cam43', 'cam44'],
    colorHex: '#14532d',
    description: '20+ РБ: Ferkel, Kaysha, Madness Beast, Bifrons, Malex, Greyclaw, Sharuk',
    characters: [
      { id: 'q_6_1', characterName: 'cam38', bossId: 'ferkel_20', bossName: 'Zombie Lord Ferkel', camCode: 'cam38' },
      { id: 'q_6_2', characterName: 'cam39', bossId: 'kaysha_20', bossName: 'Kaysha Gerald of Icarus', camCode: 'cam39' },
      { id: 'q_6_3', characterName: 'cam40', bossId: 'madness_beast_20', bossName: 'Madness Beast', camCode: 'cam40' },
      { id: 'q_6_4', characterName: 'cam41', bossId: 'bifrons_21', bossName: 'Serpent Demon Bifrons', camCode: 'cam41' },
      { id: 'q_6_5', characterName: 'cam42', bossId: 'malex_21', bossName: 'Malex Herald of Dagoniel', camCode: 'cam42' },
      { id: 'q_6_6', characterName: 'cam43', bossId: 'greyclaw_kutus_23', bossName: 'Greyclaw Kutus', camCode: 'cam43' },
      { id: 'q_6_7', characterName: 'cam44', bossId: 'sharuk_23', bossName: 'Tracker Leader Sharuk', camCode: 'cam44' },
    ],
  },
  {
    groupId: 1,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #1',
    login: 'HXVcamera1',
    password: 'user63b6zz',
    camCodes: ['camera104', 'camera101', 'camera105', 'camera102', 'camera103', 'camera107', 'camera106'],
    colorHex: '#831843',
    description: '21-30 РБ: Sukar Wererat, Jaba, Tirak, Crowl, Ikuntai, Soul Scavenger, Mina',
    characters: [
      { id: 'q_1_1', characterName: 'camera104', bossId: 'sukar_wererat_21', bossName: 'Sukar Wererat Chief', camCode: 'camera104' },
      { id: 'q_1_2', characterName: 'camera101', bossId: 'jaba_25', bossName: 'Princess Molrang (Жаба)', camCode: 'camera101' },
      { id: 'q_1_3', characterName: 'camera105', bossId: 'tirak_28', bossName: 'Tirak', camCode: 'camera105' },
      { id: 'q_1_4', characterName: 'camera102', bossId: 'crowl_25', bossName: 'Zombie Lord Crowl', camCode: 'camera102' },
      { id: 'q_1_5', characterName: 'camera103', bossId: 'ikuntai_25', bossName: 'Ikuntai', camCode: 'camera103' },
      { id: 'q_1_6', characterName: 'camera107', bossId: 'soul_scavenger_25', bossName: 'Soul Scavenger', camCode: 'camera107' },
      { id: 'q_1_7', characterName: 'camera106', bossId: 'mina_30', bossName: 'Agent of Beres Meana (Мина)', camCode: 'camera106' },
    ],
  },
  {
    groupId: 10,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #10',
    login: 'KNUhuikota',
    password: '8665233909Zx',
    camCodes: ['cam67', 'cam68', 'cam73', 'cam70', 'cam71', 'cam72', 'cam69'],
    colorHex: '#7f1d1d',
    description: '23-33 РБ: Kuroboros, Renoa, Turek, Wasteland Basilisk, Akata, Gharmash',
    characters: [
      { id: 'q_10_1', characterName: 'cam67', bossId: 'priest_kuroboros_23', bossName: 'Priest Kuroboros', camCode: 'cam67' },
      { id: 'q_10_2', characterName: 'cam68', bossId: 'patriarch_kuroboros_26', bossName: 'Patriarch Kuroboros', camCode: 'cam68' },
      { id: 'q_10_3', characterName: 'cam73', bossId: 'elf_renoa_29', bossName: 'Elf Renoa', camCode: 'cam73' },
      { id: 'q_10_4', characterName: 'cam70', bossId: 'turek_captain_30', bossName: 'Turek Mercenary Captain', camCode: 'cam70' },
      { id: 'q_10_5', characterName: 'cam71', bossId: 'wasteland_basilisk_30', bossName: 'Giant Wasteland Basilisk', camCode: 'cam71' },
      { id: 'q_10_6', characterName: 'cam72', bossId: 'boss_akata_30', bossName: 'Boss Akata', camCode: 'cam72' },
      { id: 'q_10_7', characterName: 'cam69', bossId: 'gharmash_33', bossName: 'Vuku Grand Seer Gharmash', camCode: 'cam69' },
    ],
  },
  {
    groupId: 2,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #2',
    login: 'BDQhuikota',
    password: '8665233909Zx',
    camCodes: ['cam11', 'cam13', 'cam15', 'cam12', 'cam14', 'cam17', 'cam16'],
    colorHex: '#701a75',
    description: '25-34 РБ: Osa Dion, Freki, Talos, Apepi, Queen Guards, Skyla, Zyrnna',
    characters: [
      { id: 'q_2_1', characterName: 'cam11', bossId: 'osa_dion_25', bossName: 'Tiger Hornet (Оса Дион)', camCode: 'cam11' },
      { id: 'q_2_2', characterName: 'cam13', bossId: 'freki_25', bossName: 'Freki', camCode: 'cam13' },
      { id: 'q_2_3', characterName: 'cam15', bossId: 'mammon_talos_25', bossName: 'Mammon Collector Talos', camCode: 'cam15' },
      { id: 'q_2_4', characterName: 'cam12', bossId: 'apepi_30', bossName: 'Apepi', camCode: 'cam12' },
      { id: 'q_2_5', characterName: 'cam14', bossId: 'queen_guards_32', bossName: "Captain of Queen's Royal Guards", camCode: 'cam14' },
      { id: 'q_2_6', characterName: 'cam17', bossId: 'skyla_32', bossName: 'Skyla', camCode: 'cam17' },
      { id: 'q_2_7', characterName: 'cam16', bossId: 'zyrnna_34', bossName: 'Stakato Queen Zyrnna', camCode: 'cam16' },
    ],
  },
  {
    groupId: 3,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #3',
    login: 'WJRhuikota',
    password: '8665233909Zx',
    camCodes: ['cam24', 'cam21', 'cam18', 'cam23', 'cam22', 'camer18', 'cam20'],
    colorHex: '#15803d',
    description: '30-35 РБ: Cat Eye Bandit, Kylon, Breka Pastu, Cronos Mumu, EG Tunnel, Beleth Eye, Acheron',
    characters: [
      { id: 'q_3_1', characterName: 'cam24', bossId: 'cats_eye_bandit_30', bossName: "Cat's Eye Bandit", camCode: 'cam24' },
      { id: 'q_3_2', characterName: 'cam21', bossId: 'kylon_33', bossName: 'Corsair Captain Kylon', camCode: 'cam21' },
      { id: 'q_3_3', characterName: 'cam18', bossId: 'breka_pastu_34', bossName: 'Breka Warlock Pastu', camCode: 'cam18' },
      { id: 'q_3_4', characterName: 'cam23', bossId: 'cronos_mumu_34', bossName: "Cronos's Servitor Mumu", camCode: 'cam23' },
      { id: 'q_3_5', characterName: 'cam22', bossId: 'eg_tunnel_34', bossName: 'ЕГ тунель', camCode: 'cam22' },
      { id: 'q_3_6', characterName: 'camer18', bossId: 'beleths_eye_35', bossName: "Beleth's Eye", camCode: 'camer18' },
      { id: 'q_3_7', characterName: 'cam20', bossId: 'acheron_35', bossName: 'Soul Collector Acheron', camCode: 'cam20' },
    ],
  },
  {
    groupId: 4,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #4',
    login: 'NKUhuikota',
    password: '8665233909zX',
    camCodes: ['cam27', 'cam30', 'cam29', 'cam31', 'cam26', 'cam28', 'cam25'],
    colorHex: '#0e7490',
    description: '35-36 РБ: Hellena, Sirocco, Shadar, Trakia, Remmel, Tempest, Sebek',
    characters: [
      { id: 'q_4_1', characterName: 'cam27', bossId: 'hellena_35', bossName: 'Tasaba Patriarch Hellena', camCode: 'cam27' },
      { id: 'q_4_2', characterName: 'cam30', bossId: 'sirocco_35', bossName: 'Gargoyle Lord Sirocco', camCode: 'cam30' },
      { id: 'q_4_3', characterName: 'cam29', bossId: 'shadar_35', bossName: 'Flame Lord Shadar', camCode: 'cam29' },
      { id: 'q_4_4', characterName: 'cam31', bossId: 'trakia_35', bossName: 'Redeye Trakia', camCode: 'cam31' },
      { id: 'q_4_5', characterName: 'cam26', bossId: 'remmel_35', bossName: 'Remmel', camCode: 'cam26' },
      { id: 'q_4_6', characterName: 'cam28', bossId: 'tempest_36', bossName: 'Evil Spirit Tempest', camCode: 'cam28' },
      { id: 'q_4_7', characterName: 'cam25', bossId: 'sebek_36', bossName: 'Sebek', camCode: 'cam25' },
    ],
  },
  {
    groupId: 5,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #5',
    login: 'FJJhuikota',
    password: '8665233909Zx',
    camCodes: ['cam35', 'cam33', 'cam34', 'cam32', 'cam36', 'cam37', 'cam45'],
    colorHex: '#3f6212',
    description: '38-42 РБ: Nakondas, Rayito, Hellion, Nellis, Cat Gang, Lian, Teruk',
    characters: [
      { id: 'q_5_1', characterName: 'cam35', bossId: 'nakondas_38', bossName: 'Nakondas', camCode: 'cam35' },
      { id: 'q_5_2', characterName: 'cam33', bossId: 'rayito_40', bossName: "Rayito's Henchman", camCode: 'cam33' },
      { id: 'q_5_3', characterName: 'cam34', bossId: 'hellion_40', bossName: 'Lizardmen Leader Hellion', camCode: 'cam34' },
      { id: 'q_5_4', characterName: 'cam32', bossId: 'nellis_41', bossName: "Nellis' Vengeful Spirit", camCode: 'cam32' },
      { id: 'q_5_5', characterName: 'cam36', bossId: 'cat_gang_41', bossName: 'Leader of Cat Gang', camCode: 'cam36' },
      { id: 'q_5_6', characterName: 'cam37', bossId: 'lian_41', bossName: 'Water Spirit Lian', camCode: 'cam37' },
      { id: 'q_5_7', characterName: 'cam45', bossId: 'teruk_42', bossName: 'Wizard of Storm Teruk', camCode: 'cam45' },
    ],
  },
  {
    groupId: 7,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #7',
    login: 'XAJhuikota',
    password: '8665233909Zx',
    camCodes: ['cam47', 'cam48', 'cam49', 'cam46', 'cam50', 'cam52', 'cam51'],
    colorHex: '#1e40af',
    description: '42-43 РБ: Icarus Sample, Talkin, Gwindorr, Крыса 43, Selu, Ateka, Sika',
    characters: [
      { id: 'q_7_1', characterName: 'cam47', bossId: 'icarus_sample_42', bossName: 'Icarus Sample 1', camCode: 'cam47' },
      { id: 'q_7_2', characterName: 'cam48', bossId: 'talkin_42', bossName: 'Leto Chief Talkin', camCode: 'cam48' },
      { id: 'q_7_3', characterName: 'cam49', bossId: 'gwindorr_42', bossName: 'Gwindorr', camCode: 'cam49' },
      { id: 'q_7_4', characterName: 'cam46', bossId: 'rat_43', bossName: 'Road Scavenger Leader (Крыса 43)', camCode: 'cam46' },
      { id: 'q_7_5', characterName: 'cam50', bossId: 'selu_43', bossName: 'Shaman King Selu', camCode: 'cam50' },
      { id: 'q_7_6', characterName: 'cam52', bossId: 'ateka_43', bossName: 'Water Couatle Ateka', camCode: 'cam52' },
      { id: 'q_7_7', characterName: 'cam51', bossId: 'sika_43', bossName: "Fafurion's Page Sika", camCode: 'cam51' },
    ],
  },
  {
    groupId: 8,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #8',
    login: 'SAOhuikota',
    password: '8665233909Zx',
    camCodes: ['cam54', 'cam55', 'cam53', 'cam56', 'cam57', 'cam58', 'cam59'],
    colorHex: '#854d0e',
    description: '44-45 РБ: Cletu, Panathen, Дерево 45, Timak Ranger, Kraven, Голем 45, Бочка',
    characters: [
      { id: 'q_8_1', characterName: 'cam54', bossId: 'cletu_44', bossName: 'Retreat Spider Cletu', camCode: 'cam54' },
      { id: 'q_8_2', characterName: 'cam55', bossId: 'panathen_44', bossName: 'Earth Protector Panathen', camCode: 'cam55' },
      { id: 'q_8_3', characterName: 'cam53', bossId: 'tree_45', bossName: 'Rotting Tree Repiro (Дерево 45)', camCode: 'cam53' },
      { id: 'q_8_4', characterName: 'cam56', bossId: 'timak_ranger_45', bossName: 'Timak Orc Chief Ranger', camCode: 'cam56' },
      { id: 'q_8_5', characterName: 'cam57', bossId: 'kraven_45', bossName: 'Dread Avenger Kraven', camCode: 'cam57' },
      { id: 'q_8_6', characterName: 'cam58', bossId: 'golem_45', bossName: 'Flamestone Golem (Голем 45)', camCode: 'cam58' },
      { id: 'q_8_7', characterName: 'cam59', bossId: 'barrel_44', bossName: 'Crazy Mechanic Golem (Бочка 44)', camCode: 'cam59' },
    ],
  },
  {
    groupId: 9,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #9',
    login: 'HDZhuikota',
    password: '8665233909Zx',
    camCodes: ['cam60', 'cam61', 'cam63', 'cam62', 'cam64', 'cam65', 'cam66'],
    colorHex: '#581c87',
    description: '46-49 РБ: Shacram, Kelbar, Blue Sky, Karuta, Cyrion, Istary, Gosmos, Handmaiden',
    characters: [
      { id: 'q_9_1', characterName: 'cam60', bossId: 'shacram_46', bossName: 'Shacram', camCode: 'cam60' },
      { id: 'q_9_2', characterName: 'cam61', bossId: 'kelbar_46', bossName: 'Thief Kelbar', camCode: 'cam61' },
      { id: 'q_9_3', characterName: 'cam63', bossId: 'blue_sky_46', bossName: 'Beacon of Blue Sky', camCode: 'cam63' },
      { id: 'q_9_4', characterName: 'cam62', bossId: 'karuta_47', bossName: 'Tiger King Karuta', camCode: 'cam62' },
      { id: 'q_9_5', characterName: 'cam60', bossId: 'cyrion_47', bossName: 'Evil Spirit Cyrion', camCode: 'cam60' },
      { id: 'q_9_6', characterName: 'cam64', bossId: 'istary_47', bossName: "Fafurion's Henchman Istary", camCode: 'cam64' },
      { id: 'q_9_7', characterName: 'cam65', bossId: 'gosmos_47', bossName: 'Timak Orc Gosmos', camCode: 'cam65' },
      { id: 'q_9_8', characterName: 'cam66', bossId: 'handmaiden_49', bossName: "Orfen's Handmaiden", camCode: 'cam66' },
    ],
  },
  {
    groupId: 11,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #11',
    login: 'WGIcamera11',
    password: '8665233909Zx123',
    camCodes: ['cam77', 'cam75', 'cam76', 'cam78', 'cam79', 'cam80', 'cam81'],
    colorHex: '#4c1d95',
    description: '46-52 РБ: Iron Totem, Suscepter, Royal Guard, King Tarlk, Atis, Mirror, Gato',
    characters: [
      { id: 'q_11_1', characterName: 'cam77', bossId: 'iron_totem_46', bossName: 'Iron Giant Totem', camCode: 'cam77' },
      { id: 'q_11_2', characterName: 'cam75', bossId: 'suscepter_47', bossName: 'Archon Suscepter', camCode: 'cam75' },
      { id: 'q_11_3', characterName: 'cam76', bossId: 'guard_48', bossName: 'Necrosentinel Royal Guard', camCode: 'cam76' },
      { id: 'q_11_4', characterName: 'cam78', bossId: 'tarlk_48', bossName: 'King Tarlk', camCode: 'cam78' },
      { id: 'q_11_5', characterName: 'cam79', bossId: 'atis_49', bossName: 'Ketra Commander Atis', camCode: 'cam79' },
      { id: 'q_11_6', characterName: 'cam80', bossId: 'mirror_49', bossName: 'Mirror of Oblivion', camCode: 'cam80' },
      { id: 'q_11_7', characterName: 'cam81', bossId: 'gato_52', bossName: 'Carnage Lord Gato', camCode: 'cam81' },
    ],
  },
  {
    groupId: 12,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #12',
    login: 'XFQcamera12',
    password: '8665233909Zx123',
    camCodes: ['cam82', 'cam83', 'cam84', 'cam85', 'cam86', 'cam87', 'cam88'],
    colorHex: '#334155',
    description: '52-54 РБ: Tillion, Berun, Clara, Deadman Ereve, Shaka, Atraiban, Kenishee',
    characters: [
      { id: 'q_12_1', characterName: 'cam82', bossId: 'tillion_52', bossName: "Zaken's Chief Mate Tillion", camCode: 'cam82' },
      { id: 'q_12_2', characterName: 'cam83', bossId: 'berun_52', bossName: 'Messenger of Fairy Queen Berun', camCode: 'cam83' },
      { id: 'q_12_3', characterName: 'cam84', bossId: 'clara_52', bossName: 'Cursed Clara', camCode: 'cam84' },
      { id: 'q_12_4', characterName: 'cam85', bossId: 'ereve_53', bossName: 'Deadman Ereve', camCode: 'cam85' },
      { id: 'q_12_5', characterName: 'cam86', bossId: 'shaka_53', bossName: 'Captain of Red Flag Shaka', camCode: 'cam86' },
      { id: 'q_12_6', characterName: 'cam87', bossId: 'atraiban_54', bossName: 'Atraiban', camCode: 'cam87' },
      { id: 'q_12_7', characterName: 'cam88', bossId: 'kenishee_54', bossName: 'Magus Kenishee', camCode: 'cam88' },
    ],
  },
  {
    groupId: 13,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #13',
    login: 'JYScamera13',
    password: '8665233909Zx123',
    camCodes: ['cam89', 'cam90', 'cam91', 'cam92', 'cam93', 'cam94', 'cam95'],
    colorHex: '#166534',
    description: '54-56 РБ: Paniel, Thieles, Ruell, Isirr, Sephia, Black Lily, Tamash',
    characters: [
      { id: 'q_13_1', characterName: 'cam89', bossId: 'paniel_54', bossName: 'Paniel the Unicorn', camCode: 'cam89' },
      { id: 'q_13_2', characterName: 'cam90', bossId: 'thieles_55', bossName: 'Furious Thieles', camCode: 'cam90' },
      { id: 'q_13_3', characterName: 'cam91', bossId: 'ruell_55', bossName: 'Enchanted Forest Watcher Ruell', camCode: 'cam91' },
      { id: 'q_13_4', characterName: 'cam92', bossId: 'isirr_55', bossName: 'Sorcerer Isirr', camCode: 'cam92' },
      { id: 'q_13_5', characterName: 'cam93', bossId: 'sephia_55', bossName: "Beleth's Seer, Sephia", camCode: 'cam93' },
      { id: 'q_13_6', characterName: 'cam94', bossId: 'black_lily_56', bossName: 'Black Lily', camCode: 'cam94' },
      { id: 'q_13_7', characterName: 'cam95', bossId: 'tamash_56', bossName: 'Harit Hero Tamash', camCode: 'cam95' },
    ],
  },
  {
    groupId: 14,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #14',
    login: 'SEMcamera14',
    password: '8665233909Zx123',
    camCodes: ['cam96', 'cam97', 'cam98', 'cam100', 'cam101', 'cam102', 'cam103'],
    colorHex: '#9a3412',
    description: '55-57 РБ: Niniel, Tamash 55, Leo, Pingolpin, Ragoth, Garangky, Barda',
    characters: [
      { id: 'q_14_1', characterName: 'cam96', bossId: 'niniel_56', bossName: "Eva's Spirit Niniel", camCode: 'cam96' },
      { id: 'q_14_2', characterName: 'cam97', bossId: 'tamash_55', bossName: 'Harit Hero Tamash 55', camCode: 'cam97' },
      { id: 'q_14_3', characterName: 'cam98', bossId: 'leo_56', bossName: 'Refugee Applicant Leo', camCode: 'cam98' },
      { id: 'q_14_4', characterName: 'cam100', bossId: 'pingolpin_55', bossName: "Fafurion's Envoy Pingolpin", camCode: 'cam100' },
      { id: 'q_14_5', characterName: 'cam101', bossId: 'timak_ragoth_57', bossName: 'Timak Seer Ragoth', camCode: 'cam101' },
      { id: 'q_14_6', characterName: 'cam102', bossId: 'garangky_56', bossName: 'Harit Guardian Garangky', camCode: 'cam102' },
      { id: 'q_14_7', characterName: 'cam103', bossId: 'barda_55', bossName: 'Bandit Leader Barda', camCode: 'cam103' },
    ],
  },
  {
    groupId: 15,
    authorGroup: 'Qox',
    groupName: 'Аккаунт #15',
    login: 'UAEcamera15',
    password: '8665233909Zx123',
    camCodes: ['cam104', 'cam105', 'cam106', 'cam107', 'cam108'],
    colorHex: '#0369a1',
    description: '56-60 РБ: Carnamakos, Soulless Boar, Lord Ishka, Underwater Guardian, Butcher',
    characters: [
      { id: 'q_15_1', characterName: 'cam104', bossId: 'carnamakos_56', bossName: 'Carnamakos', camCode: 'cam104' },
      { id: 'q_15_2', characterName: 'cam105', bossId: 'soulless_boar_59', bossName: 'Soulless Wild Boar', camCode: 'cam105' },
      { id: 'q_15_3', characterName: 'cam106', bossId: 'lord_ishka_60', bossName: 'Lord Ishka', camCode: 'cam106' },
      { id: 'q_15_4', characterName: 'cam107', bossId: 'underwater_guardian_60', bossName: 'The 3rd Underwater Guardian', camCode: 'cam107' },
      { id: 'q_15_5', characterName: 'cam108', bossId: 'butcher_60', bossName: 'Butcher', camCode: 'cam108' },
    ],
  },
];

export function normalizeCamCode(raw?: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/^камера(?=\d)/i, 'camera')
    .replace(/^кам(?=\d)/i, 'cam');
}

export function loadAllAccounts(customAccounts: CameraAccount[] = []): CameraAccount[] {
  return [...CAMERA_ACCOUNTS, ...customAccounts];
}

export function findAccountByCamCode(rawCamCode?: string, allAccounts: CameraAccount[] = CAMERA_ACCOUNTS): CameraAccount | undefined {
  if (!rawCamCode) return undefined;
  const clean = normalizeCamCode(rawCamCode);
  return allAccounts.find((acc) =>
    acc.camCodes.some((c) => normalizeCamCode(c) === clean) ||
    (acc.characters && acc.characters.some((ch) => normalizeCamCode(ch.camCode) === clean))
  );
}

export function findAccountsForBoss(
  bossId: string,
  bossCamCode?: string,
  allAccounts: CameraAccount[] = CAMERA_ACCOUNTS
): { account: CameraAccount; characterName: string }[] {
  const results: { account: CameraAccount; characterName: string }[] = [];
  const cleanCam = normalizeCamCode(bossCamCode);

  allAccounts.forEach((acc) => {
    // 1. Check if account has an explicit character for this boss
    if (acc.characters && acc.characters.length > 0) {
      const char = acc.characters.find(
        (c) => c.bossId === bossId || (cleanCam && normalizeCamCode(c.camCode) === cleanCam)
      );
      if (char) {
        results.push({ account: acc, characterName: char.characterName });
        return;
      }
    }

    // 2. Otherwise check if account camCodes include boss's camCode
    if (cleanCam && acc.camCodes.some((c) => normalizeCamCode(c) === cleanCam)) {
      results.push({ account: acc, characterName: bossCamCode || 'камера' });
    }
  });

  return results;
}

export function findAccountByGroupId(groupId: number, allAccounts: CameraAccount[] = CAMERA_ACCOUNTS): CameraAccount | undefined {
  return allAccounts.find((acc) => acc.groupId === groupId);
}

export function findAccountInAuthorGroupForBoss(
  boss: { id: string; name?: string; camCode?: string; selectedCharacterName?: string },
  authorGroup: string,
  allAccounts: CameraAccount[] = CAMERA_ACCOUNTS
): { account: CameraAccount; camCode: string; characterName: string } | undefined {
  const normGroup = (authorGroup || 'Qox').trim().toLowerCase();
  const groupAccounts = allAccounts.filter(
    (a) => (a.authorGroup || 'Qox').trim().toLowerCase() === normGroup
  );
  if (groupAccounts.length === 0) return undefined;

  const cleanCam = normalizeCamCode(boss.camCode);

  // 1. First priority: account character explicitly mapped to this boss ID
  for (const acc of groupAccounts) {
    if (acc.characters && acc.characters.length > 0) {
      const match = acc.characters.find((c) => c.bossId === boss.id);
      if (match) {
        return {
          account: acc,
          camCode: match.camCode || boss.camCode || 'cam',
          characterName: match.characterName,
        };
      }
    }
  }

  // 2. Second priority: account character mapped to boss by name or camCode
  for (const acc of groupAccounts) {
    if (acc.characters && acc.characters.length > 0) {
      const match = acc.characters.find(
        (c) =>
          (boss.name && c.bossName && c.bossName.toLowerCase() === boss.name.toLowerCase()) ||
          (cleanCam && c.camCode && normalizeCamCode(c.camCode) === cleanCam)
      );
      if (match) {
        return {
          account: acc,
          camCode: match.camCode || boss.camCode || 'cam',
          characterName: match.characterName,
        };
      }
    }
  }

  // 3. Third priority: account has camCode in its camCodes list
  if (cleanCam) {
    for (const acc of groupAccounts) {
      if (acc.camCodes && acc.camCodes.some((c) => normalizeCamCode(c) === cleanCam)) {
        return {
          account: acc,
          camCode: boss.camCode || 'cam',
          characterName: `${acc.authorGroup || authorGroup}_${boss.name ? boss.name.split(' ')[0] : boss.camCode || 'cam'}`,
        };
      }
    }
  }

  // Strictly return undefined if no character or camera exists for this boss in this group
  return undefined;
}

export function getAccountForBossInGroup(
  boss: { id: string; camCode?: string; selectedCharacterName?: string },
  account: CameraAccount
): { camCode: string; charName: string } {
  // 1. Check if account characters map to this boss
  if (account.characters && account.characters.length > 0) {
    const match = account.characters.find((c) => c.bossId === boss.id);
    if (match) {
      return {
        camCode: match.camCode || boss.camCode || 'cam',
        charName: match.characterName,
      };
    }
  }
  // 2. Check if account camCodes include boss.camCode
  const normBossCam = normalizeCamCode(boss.camCode);
  if (normBossCam && account.camCodes.some((c) => normalizeCamCode(c) === normBossCam)) {
    return {
      camCode: boss.camCode || 'cam',
      charName: boss.selectedCharacterName || boss.camCode || 'камера',
    };
  }
  // 3. Fallback: use first camCode on account if present
  if (account.camCodes && account.camCodes.length > 0) {
    return {
      camCode: account.camCodes[0],
      charName: account.characters?.[0]?.characterName || account.camCodes[0],
    };
  }
  return {
    camCode: boss.camCode || 'cam',
    charName: boss.selectedCharacterName || 'камера',
  };
}
