import { JUTSU_DATA } from './jutsu-data'
import type {
  JutsuBusinessData,
  JutsuDefinition,
  JutsuId,
  JutsuPresentation,
  SealDefinition,
  SealId,
} from '../../app/domain/types'

export { JUTSU_IDS } from './jutsu-data'

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

const DEFAULT_PRESENTATION: JutsuPresentation = {
  cover: '/images/ui/paper.svg',
  color: '#367d65',
  duration: 0,
  effect: null,
}

const JUTSU_PRESENTATION: Readonly<Record<string, JutsuPresentation | undefined>> = {
  summoning: {
    color: '#367d65',
    duration: 5200,
    cover: '/images/jutsu/summoning.png',
    effect: 'summoning',
  },
  fireball: {
    color: '#bc493b',
    duration: 3400,
    cover: '/images/jutsu/fireball.png',
    effect: 'fireball',
  },
  chidori: {
    color: '#337e9c',
    duration: 3800,
    cover: '/images/jutsu/chidori.png',
    effect: 'chidori',
  },
}

export function withJutsuPresentation<T extends JutsuBusinessData>(data: T): T & JutsuPresentation {
  return { ...data, ...(JUTSU_PRESENTATION[data.id] ?? DEFAULT_PRESENTATION) }
}

export const JUTSUS: readonly JutsuDefinition[] = JUTSU_DATA.map(withJutsuPresentation)

export function getSeal(id: SealId): SealDefinition {
  return SEALS.find((seal) => seal.id === id)!
}
export function getJutsu(id: JutsuId): JutsuDefinition {
  return JUTSUS.find((jutsu) => jutsu.id === id)!
}
