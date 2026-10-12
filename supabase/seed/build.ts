import { JUTSUS, SEALS } from './catalog'
import { NINJAS } from './ninjas'

const sql = (value: unknown): string =>
  value === null
    ? 'null'
    : typeof value === 'number'
      ? String(value)
      : `'${String(value).replaceAll("'", "''")}'`
function insert(table: string, columns: string[], rows: unknown[][]) {
  return `insert into naruto_spiritism.${table} (${columns.join(', ')}) values\n${rows.map((row) => `(${row.map(sql).join(', ')})`).join(',\n')}\non conflict do nothing;\n`
}
export function buildSeed() {
  return [
    insert(
      'seals',
      ['id', 'name', 'animal', 'reading', 'image', 'hint', 'sort_order'],
      SEALS.map((seal, i) => [
        seal.id,
        seal.name,
        seal.animal,
        seal.reading,
        seal.image,
        seal.hint,
        i,
      ]),
    ),
    insert(
      'jutsus',
      [
        'id',
        'name',
        'short_name',
        'category',
        'description',
        'attack_power',
        'color',
        'duration',
        'cover',
        'effect',
        'sort_order',
      ],
      JUTSUS.map((j, i) => [
        j.id,
        j.name,
        j.shortName,
        j.category,
        j.description,
        j.attackPower,
        j.color,
        j.duration,
        j.cover,
        j.effect,
        i,
      ]),
    ),
    insert(
      'jutsu_seals',
      ['jutsu_id', 'position', 'seal_id'],
      JUTSUS.flatMap((j) => j.sequence.map((id, i) => [j.id, i, id])),
    ),
    insert(
      'ninjas',
      ['id', 'name', 'image', 'unlock_kind', 'required_count', 'sort_order'],
      NINJAS.map((n, i) => [
        n.id,
        n.name,
        n.image,
        n.unlock.kind,
        n.unlock.kind === 'mastered-count' ? n.unlock.required : null,
        i,
      ]),
    ),
    insert(
      'ninja_unlock_jutsus',
      ['ninja_id', 'position', 'jutsu_id'],
      NINJAS.flatMap((n) =>
        (n.unlock.kind === 'first-cast'
          ? [n.unlock.jutsuId]
          : n.unlock.kind === 'jutsu-set'
            ? n.unlock.jutsuIds
            : []
        ).map((id, i) => [n.id, i, id]),
      ),
    ),
  ].join('\n')
}
