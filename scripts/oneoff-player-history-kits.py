from pathlib import Path
import json
import re


def read_json(path: str):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def write_json(path: str | Path, value) -> None:
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


# 1) 2026/27 team kit colours from real(2).xlsx.
# The site stores a single representative shirt/body colour for each home/away kit.
teams_path = Path('data/seasons/2026-27/teams.json')
teams = read_json(str(teams_path))
kit_colours = {
    't_sf_2026': {'home': '#e187a1', 'away': '#173663'},
    't_kaohsiung_amateur_2026': {'home': '#e70111', 'away': '#03294f'},
    't_tongque_2026': {'home': '#00091c', 'away': '#ffffff'},
    't_pingtung_wolves_2026': {'home': '#ffffff', 'away': '#c83888'},
    't_kaohsiung_hk_2026': {'home': '#f2d600', 'away': '#111111'},
    't_pingtung_wild_ape_2026': {'home': '#563e92', 'away': '#ffffff'},
    't_chen_2026': {'home': '#2c3a67', 'away': '#e0a7b0'},
    't_tainan_evergreen_2026': {'home': '#c01010', 'away': '#e0c050'},
    't_black_wolf_2026': {'home': '#111111', 'away': '#ffffff'},
    't_southboys_2026': {'home': '#026531', 'away': '#ffffff'},
    't_luzhu_2026': {'home': '#385984', 'away': '#ffffff'},
    't_wanderers_2026': {'home': '#191e54', 'away': '#ffffff'},
    't_chiayi_235_2026': {'home': '#8fa8b8', 'away': '#2b1a76'},
    't_alian_2026': {'home': '#111111', 'away': '#ffffff'},
    't_kaohsiung_black_knights_2026': {'home': '#111111', 'away': '#d9d8d4'},
    't_holy_knights_2026': {'home': '#05142b', 'away': '#efb4c6'},
}
team_ids = {team['id'] for team in teams}
missing_team_ids = set(kit_colours) - team_ids
if missing_team_ids:
    raise SystemExit(f'Missing teams for kit update: {sorted(missing_team_ids)}')
for team in teams:
    if team['id'] in kit_colours:
        team['kits'] = kit_colours[team['id']]
    if team['id'] == 't_wanderers_2026':
        team['name'] = 'WANDERERS'
        team['shortName'] = 'WANDERERS'
write_json(teams_path, teams)

# 2) WANDERERS visible naming in current-season sources.
participants_path = Path('data/seasons/2026-27/participants.json')
participants = read_json(str(participants_path))


def replace_exact(value):
    if isinstance(value, str):
        return 'WANDERERS' if value == 'Wanderers' else value
    if isinstance(value, list):
        return [replace_exact(item) for item in value]
    if isinstance(value, dict):
        return {key: replace_exact(item) for key, item in value.items()}
    return value


participants = replace_exact(participants)
write_json(participants_path, participants)

branding_path = Path('data/seasons/2026-27/teamBranding.json')
branding = read_json(str(branding_path))
if 'Wanderers' in branding:
    if 'WANDERERS' in branding:
        raise SystemExit('teamBranding contains both Wanderers and WANDERERS')
    rebuilt = {}
    for key, value in branding.items():
        rebuilt['WANDERERS' if key == 'Wanderers' else key] = value
    branding = rebuilt
write_json(branding_path, branding)

news_path = Path('data/seasons/2026-27/news.json')
news = read_json(str(news_path))


def replace_visible_name(value):
    if isinstance(value, str):
        return value.replace('Wanderers', 'WANDERERS')
    if isinstance(value, list):
        return [replace_visible_name(item) for item in value]
    if isinstance(value, dict):
        return {key: replace_visible_name(item) for key, item in value.items()}
    return value


news = replace_visible_name(news)
write_json(news_path, news)

registration_validator = Path('scripts/validate-registration-progress.mjs')
validator_text = registration_validator.read_text(encoding='utf-8')
validator_text = validator_text.replace("'Wanderers'", "'WANDERERS'")
registration_validator.write_text(validator_text, encoding='utf-8')

# 3) Verified current-player corrections.
players_path = Path('data/seasons/2026-27/players.json')
players = read_json(str(players_path))
liu_matches = [player for player in players if player.get('id') == 'ka26-01' and player.get('name') == '劉力瑋']
if len(liu_matches) != 1:
    raise SystemExit(f'Expected one 劉力瑋 ka26-01, found {len(liu_matches)}')
liu_matches[0]['birthDate'] = '1990-07-29'

chen_matches = [
    player for player in players
    if player.get('identityId') == 'chen-po-sheng' and player.get('teamId') == 't_wanderers_2026'
]
if len(chen_matches) != 1:
    raise SystemExit(f'Expected one WANDERERS 陳柏陞 record, found {len(chen_matches)}')
if chen_matches[0].get('name') not in {'陳柏陞', '陳柏升'}:
    raise SystemExit(f"Unexpected player name for chen-po-sheng: {chen_matches[0].get('name')}")
chen_matches[0]['name'] = '陳柏升'
write_json(players_path, players)

# 4) Historical participation records that were lost when the 2025/26 final roster snapshot was refreshed.
history_records = [
    {
        'id': 'hist25-huang-jhen-hao', 'identityId': 'huang-jhen-hao',
        'seasonId': '2025-26', 'teamId': 't_crazydog', 'number': 40,
        'name': '黃震浩', 'englishName': 'Huang Jhen-Hao', 'gender': '男',
        'nationality': '台灣', 'age': 40,
    },
    {
        'id': 'hist25-shi-bo-yun', 'identityId': 'shi-bo-yun',
        'seasonId': '2025-26', 'teamId': 't_tongque', 'number': 93,
        'name': '施博允', 'englishName': 'SHI BO YUN', 'gender': '男',
        'nationality': '台灣', 'age': 19,
    },
    {
        'id': 'hist25-xu-yu-kai', 'identityId': 'tainan-evergreen-xu-yu-kai',
        'seasonId': '2025-26', 'teamId': 't_tongque', 'number': 84,
        'name': '徐鈺凱', 'englishName': 'HSU YU KAI', 'gender': '男',
        'nationality': '台灣', 'age': 35,
    },
    {
        'id': 'hist25-lin-ta-hsiung', 'identityId': 'lin-tahsiung',
        'seasonId': '2025-26', 'teamId': 't_pingtung', 'number': 6,
        'name': '林大雄', 'englishName': 'Lin Ta-hsiung', 'gender': '男',
        'nationality': '台灣', 'age': 50,
    },
    {
        'id': 'hist25-teng-chin-cheng', 'identityId': 'teng-chin-cheng',
        'seasonId': '2025-26', 'teamId': 't_pingtung', 'number': 12,
        'name': '鄧進成', 'englishName': 'Teng Chin-cheng', 'gender': '男',
        'nationality': '台灣', 'age': 55,
    },
    {
        'id': 'hist25-chien-gan-zen', 'identityId': 'chien-gan-zen',
        'seasonId': '2025-26', 'teamId': 't_pingtung', 'number': 17,
        'name': '簡罡正', 'englishName': 'CHIEN GAN ZEN', 'gender': '男',
        'nationality': '台灣', 'age': 29,
    },
    {
        'id': 'hist25-shen-jia-hong', 'identityId': 'shen-jia-hong',
        'seasonId': '2025-26', 'teamId': 't_canglong', 'number': 47,
        'name': '沈家弘', 'englishName': 'Shan Chia Hong', 'gender': '男',
        'nationality': '台灣', 'age': 22,
    },
]
write_json('data/playerSeasonHistory.json', history_records)

# 5) Merge historical participation into player history without polluting season rosters.
entity_path = Path('services/entityData.ts')
entity_text = entity_path.read_text(encoding='utf-8')
import_anchor = "import { SEASON_IDS } from '../config/siteManifest.js';\n"
history_import = "import playerSeasonHistoryJson from '../data/playerSeasonHistory.json';\n"
if history_import not in entity_text:
    if import_anchor not in entity_text:
        raise SystemExit('Could not find entityData import anchor')
    entity_text = entity_text.replace(import_anchor, import_anchor + history_import, 1)

season_anchor = "const seasonIds = SEASON_IDS as readonly SeasonId[];\n"
history_type_block = """const seasonIds = SEASON_IDS as readonly SeasonId[];

interface HistoricalPlayerSeasonRecord extends PlayerProfile {
  seasonId: SeasonId;
}

const historicalPlayerSeasonRecords = playerSeasonHistoryJson as HistoricalPlayerSeasonRecord[];
"""
if 'const historicalPlayerSeasonRecords =' not in entity_text:
    if season_anchor not in entity_text:
        raise SystemExit('Could not find entityData seasonIds anchor')
    entity_text = entity_text.replace(season_anchor, history_type_block, 1)

new_history_function = """export const getPlayerHistory = (entityOrPlayerId: string): PlayerSeasonRecord[] => {
  let identityId = entityOrPlayerId;
  let identityResolved = false;

  for (const seasonId of seasonIds) {
    const exact = getSeasonData(seasonId).players.find(
      (player) => player.id === entityOrPlayerId || player.identityId === entityOrPlayerId,
    );
    if (exact) {
      identityId = getPlayerIdentity(exact);
      identityResolved = true;
      break;
    }
  }

  if (!identityResolved) {
    const historicalExact = historicalPlayerSeasonRecords.find(
      (player) => player.id === entityOrPlayerId || player.identityId === entityOrPlayerId,
    );
    if (historicalExact) identityId = getPlayerIdentity(historicalExact);
  }

  return seasonIds
    .flatMap((seasonId) => {
      const data = getSeasonData(seasonId);
      const actualPlayer = data.players.find(
        (candidate) =>
          getPlayerIdentity(candidate) === identityId ||
          candidate.id === entityOrPlayerId ||
          candidate.identityId === entityOrPlayerId,
      );
      const historicalPlayer = historicalPlayerSeasonRecords.find(
        (candidate) =>
          candidate.seasonId === seasonId &&
          (getPlayerIdentity(candidate) === identityId ||
            candidate.id === entityOrPlayerId ||
            candidate.identityId === entityOrPlayerId),
      );
      const player = actualPlayer ?? historicalPlayer;
      if (!player) return [];
      return [{
        seasonId,
        season: getSeasonConfig(seasonId),
        data,
        player,
        team: data.teamMap[player.teamId],
      }];
    })
    .sort((a, b) => seasonSort(a.seasonId, b.seasonId));
};
"""
history_pattern = re.compile(
    r"export const getPlayerHistory = \(entityOrPlayerId: string\): PlayerSeasonRecord\[\] => \{.*?\n\};\n\n(?=export const getMatchRecord)",
    re.S,
)
entity_text, count = history_pattern.subn(new_history_function + '\n', entity_text, count=1)
if count != 1:
    raise SystemExit(f'Expected to replace one getPlayerHistory function, replaced {count}')
entity_path.write_text(entity_text, encoding='utf-8')

# 6) Validate the separated historical-participation dataset.
identity_validator_path = Path('scripts/validate-player-identities.mjs')
identity_text = identity_validator_path.read_text(encoding='utf-8')
players_block = """const playersBySeason = Object.fromEntries(
  SEASON_IDS.map((seasonId) => [
    seasonId,
    readJson(`data/seasons/${seasonId}/players.json`),
  ]),
);
"""
extended_data_block = players_block + """const teamsBySeason = Object.fromEntries(
  SEASON_IDS.map((seasonId) => [
    seasonId,
    readJson(`data/seasons/${seasonId}/teams.json`),
  ]),
);
const historicalPlayerSeasons = readJson('data/playerSeasonHistory.json');
"""
if "const historicalPlayerSeasons =" not in identity_text:
    if players_block not in identity_text:
        raise SystemExit('Could not find player identity data anchor')
    identity_text = identity_text.replace(players_block, extended_data_block, 1)

validation_block = """
if (!Array.isArray(historicalPlayerSeasons)) {
  fail('player identities: historical player seasons must be an array');
}

const knownCanonicalIdentities = new Set(canonicalBySeason.values());
const historicalIds = new Set();
const historicalSeasonIdentities = new Set();

for (const record of historicalPlayerSeasons) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    fail('player identities: historical player season entry must be an object');
  }
  if (!validSeasons.has(record.seasonId)) {
    fail(`player identities: historical record ${record.id ?? '(unknown)'} has invalid season ${record.seasonId}`);
  }
  if (typeof record.id !== 'string' || !record.id.trim()) {
    fail('player identities: historical player season entry is missing id');
  }
  if (historicalIds.has(record.id)) {
    fail(`player identities: duplicate historical record id ${record.id}`);
  }
  historicalIds.add(record.id);
  if (typeof record.identityId !== 'string' || !record.identityId.trim()) {
    fail(`player identities: historical record ${record.id} is missing identityId`);
  }
  if (!knownCanonicalIdentities.has(record.identityId)) {
    fail(`player identities: historical record ${record.id} has unknown canonical identity ${record.identityId}`);
  }
  if (typeof record.teamId !== 'string' || !teamsBySeason[record.seasonId].some((team) => team.id === record.teamId)) {
    fail(`player identities: historical record ${record.id} has invalid team ${record.teamId}`);
  }
  if (!Number.isInteger(record.number) || record.number < 1) {
    fail(`player identities: historical record ${record.id} has invalid shirt number ${record.number}`);
  }
  if (typeof record.name !== 'string' || !record.name.trim()) {
    fail(`player identities: historical record ${record.id} is missing name`);
  }
  if (typeof record.gender !== 'string' || !record.gender.trim()) {
    fail(`player identities: historical record ${record.id} is missing gender`);
  }
  if (typeof record.nationality !== 'string' || !record.nationality.trim()) {
    fail(`player identities: historical record ${record.id} is missing nationality`);
  }
  if (!Number.isInteger(record.age) || record.age < 0) {
    fail(`player identities: historical record ${record.id} has invalid age ${record.age}`);
  }

  const seasonIdentityKey = `${record.seasonId}:${record.identityId}`;
  if (historicalSeasonIdentities.has(seasonIdentityKey)) {
    fail(`player identities: duplicate historical season identity ${seasonIdentityKey}`);
  }
  historicalSeasonIdentities.add(seasonIdentityKey);

  const seasonAliases = aliases[record.seasonId] ?? {};
  const hasActualSeasonRecord = playersBySeason[record.seasonId].some((player) =>
    (seasonAliases[player.id] ?? player.identityId ?? player.id) === record.identityId
  );
  if (hasActualSeasonRecord) {
    fail(`player identities: historical record ${record.id} duplicates an actual ${record.seasonId} player record`);
  }
}
"""
if 'const historicalIds = new Set();' not in identity_text:
    console_anchor = "\nconsole.log(`player identities: ${canonicalBySeason.size} season-player records validated`);"
    if console_anchor not in identity_text:
        raise SystemExit('Could not find player identity validator console anchor')
    identity_text = identity_text.replace(console_anchor, validation_block + console_anchor, 1)
identity_validator_path.write_text(identity_text, encoding='utf-8')

# 7) Remove the inferred transfer-history UI from player pages while keeping season career history.
player_page_path = Path('pages/PlayerPage.tsx')
page_text = player_page_path.read_text(encoding='utf-8')
page_text = page_text.replace(
    "import { ArrowRight, CalendarDays, Target, UserRound } from 'lucide-react';",
    "import { CalendarDays, Target, UserRound } from 'lucide-react';",
    1,
)
helper_pattern = re.compile(
    r"\ninterface PlayerTransferRecord \{.*?\nconst PlayerPage: React\.FC = \(\) => \{",
    re.S,
)
page_text, helper_count = helper_pattern.subn('\nconst PlayerPage: React.FC = () => {', page_text, count=1)
if helper_count != 1:
    raise SystemExit(f'Expected to remove one transfer helper block, removed {helper_count}')
transfer_memo = "  const transferRecords = useMemo(() => getPlayerTransfers(history), [history]);\n"
if transfer_memo not in page_text:
    raise SystemExit('Could not find transferRecords memo')
page_text = page_text.replace(transfer_memo, '', 1)
transfer_ui_pattern = re.compile(
    r"\n        \{transferRecords\.length > 0 && \(.*?\n        \)\}\n\n(?=        <section className=\"order-1\">)",
    re.S,
)
page_text, ui_count = transfer_ui_pattern.subn('\n', page_text, count=1)
if ui_count != 1:
    raise SystemExit(f'Expected to remove one transfer UI section, removed {ui_count}')
for forbidden in ['transferRecords', 'getPlayerTransfers', 'PlayerTransferRecord', '>轉會紀錄<', 'ArrowRight']:
    if forbidden in page_text:
        raise SystemExit(f'Transfer UI cleanup incomplete: {forbidden}')
player_page_path.write_text(page_text, encoding='utf-8')
