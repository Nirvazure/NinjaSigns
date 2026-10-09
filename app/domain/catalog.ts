import type { JutsuDefinition, JutsuId, SealDefinition, SealId } from './types'

export const SEALS: readonly SealDefinition[] = [
  {
    id: 'rat',
    name: '子',
    animal: '鼠',
    reading: 'NE',
    image: '/images/seals/legend/rat.png',
    hint: '一手食指与中指竖起，另一手握住竖起的两指。',
  },
  {
    id: 'ox',
    name: '丑',
    animal: '牛',
    reading: 'USHI',
    image: '/images/seals/legend/ox.png',
    hint: '两手手指交错，一手平放，另一手食指与小指伸直。',
  },
  {
    id: 'tiger',
    name: '寅',
    animal: '虎',
    reading: 'TORA',
    image: '/images/seals/legend/tiger.png',
    hint: '两手相合，食指竖起相贴，拇指并拢，其余手指交错。',
  },
  {
    id: 'hare',
    name: '卯',
    animal: '兔',
    reading: 'U',
    image: '/images/seals/legend/hare.png',
    hint: '一手食指伸直，另一手小指勾住食指下方，其余手指握拢。',
  },
  {
    id: 'dragon',
    name: '辰',
    animal: '龙',
    reading: 'TATSU',
    image: '/images/seals/legend/dragon.png',
    hint: '两手手指交错下垂，小指伸直相贴，拇指上下相叠。',
  },
  {
    id: 'snake',
    name: '巳',
    animal: '蛇',
    reading: 'MI',
    image: '/images/seals/legend/snake.png',
    hint: '两手手指交错，掌心相合，手指向内收紧。',
  },
  {
    id: 'horse',
    name: '午',
    animal: '马',
    reading: 'UMA',
    image: '/images/seals/legend/horse.png',
    hint: '两手食指指尖相抵，其余手指弯曲交错，形成三角轮廓。',
  },
  {
    id: 'ram',
    name: '未',
    animal: '羊',
    reading: 'HITSUJI',
    image: '/images/seals/legend/ram.png',
    hint: '两手相合，中指和食指向上伸直，其余手指交错收拢。',
  },
  {
    id: 'monkey',
    name: '申',
    animal: '猴',
    reading: 'SARU',
    image: '/images/seals/legend/monkey.png',
    hint: '两手水平相叠，掌心相对，两侧手指向外伸展。',
  },
  {
    id: 'bird',
    name: '酉',
    animal: '鸟',
    reading: 'TORI',
    image: '/images/seals/legend/bird.png',
    hint: '两手中指弯曲相勾，食指和小指相抵，拇指靠拢。',
  },
  {
    id: 'dog',
    name: '戌',
    animal: '犬',
    reading: 'INU',
    image: '/images/seals/legend/dog.png',
    hint: '一手握拳，另一手掌平放在拳头上方。',
  },
  {
    id: 'boar',
    name: '亥',
    animal: '猪',
    reading: 'I',
    image: '/images/seals/legend/boar.png',
    hint: '两手手指弯曲向下，指节相靠，拇指向前并拢。',
  },
]

export const JUTSUS: readonly JutsuDefinition[] = [
  {
    id: 'summoning',
    name: '通灵之术',
    shortName: '通灵之术',
    category: '时空间忍术',
    description: '缔结契约，唤醒并肩作战的伙伴。',
    sequence: ['boar', 'dog', 'bird', 'monkey', 'ram'],
    color: '#367d65',
    duration: 5200,
    cover: '/images/jutsu/summoning.png',
  },
  {
    id: 'fireball',
    name: '火遁 · 豪火球之术',
    shortName: '豪火球之术',
    category: '火遁',
    description: '将查克拉凝聚成炽热的火焰。',
    sequence: ['snake', 'ram', 'monkey', 'boar', 'horse', 'tiger'],
    color: '#bc493b',
    duration: 3400,
    cover: '/images/jutsu/fireball.png',
  },
  {
    id: 'chidori',
    name: '雷遁 · 千鸟',
    shortName: '千鸟',
    category: '雷遁',
    description: '千鸟鸣动，雷光汇聚于掌心。',
    sequence: ['ox', 'hare', 'monkey'],
    color: '#337e9c',
    duration: 3800,
    cover: '/images/jutsu/chidori.png',
  },
]

export function getSeal(id: SealId): SealDefinition {
  return SEALS.find((seal) => seal.id === id)!
}
export function getJutsu(id: JutsuId): JutsuDefinition {
  return JUTSUS.find((jutsu) => jutsu.id === id)!
}
