import type { IpaCard, SchoolLesson } from '../db/db.ts'
import { lightOf } from '../study/scheduler.ts'
import { soundById, type Sound } from './sounds.ts'

// Trilha no camping: the IPA sounds split into five stages around the campsite.
// Each stage ends with a boss, and the forest ranger (Guarda-florestal) tests them all.

export interface Stage {
  id: string
  icon: string
  name: string
  /** One line, in Portuguese, about what the stage teaches. */
  about: string
  soundIds: string[]
}

export const STAGES: Stage[] = [
  {
    id: 'pescaria', icon: '🎣', name: 'Pescaria',
    about: 'Os 5 sons que mais confundem quem fala português: o "ə" fraco, os dois "i", o "æ" e o "θ".',
    soundIds: ['schwa', 'i-short', 'i-long', 'ae', 'th-voiceless'],
  },
  {
    id: 'escalada', icon: '🧗', name: 'Escalada',
    about: 'As outras vogais: curtas, longas e as que têm "r".',
    soundIds: ['e', 'uh', 'a-long', 'o-short', 'o-long', 'u-short', 'u-long', 'er', 'schwa-r'],
  },
  {
    id: 'trilha', icon: '🌲', name: 'Trilha na mata',
    about: 'Os ditongos: duas vogais que deslizam uma na outra, como em "day" e "go".',
    soundIds: ['ei', 'ai', 'oi', 'au', 'ou', 'ear', 'air'],
  },
  {
    id: 'canoagem', icon: '🛶', name: 'Canoagem',
    about: 'Consoantes traiçoeiras: o "ð", o "h", o "r" e o "l" do inglês, o "ŋ" e mais.',
    soundIds: ['th-voiced', 'h', 'r', 'flap-t', 'l', 'ng', 'm-final', 'w', 'y'],
  },
  {
    id: 'fogueira', icon: '🔥', name: 'Fogueira',
    about: 'As consoantes que restam, quase todas parecidas com as do português.',
    soundIds: ['t-d', 'ch', 'j', 'sh', 'zh', 'v', 'p-k', 's', 'z'],
  },
]

export const RANGER = { id: 'guarda', icon: '🧑‍🌾', name: 'Guarda-florestal', badge: '👂 Ouvido afiado' }

/** Share of a stage's sounds that must be yellow or green before its boss opens. */
export const BOSS_READY = 0.8
/** Share of right answers needed to beat a boss. */
export const BOSS_PASS = 0.8
export const RANGER_QUESTIONS = 20

export const lessonId = (bossId: string) => `ipa:${bossId}`

export const stageSounds = (stage: Stage): Sound[] =>
  stage.soundIds.map((id) => soundById(id)).filter((s): s is Sound => !!s)

/** Sounds of the stage that are already yellow or green. */
export function stageProgress(stage: Stage, cards: IpaCard[]): { ready: number; total: number } {
  const byId = new Map(cards.map((c) => [c.id, c]))
  const ready = stage.soundIds.filter((id) => {
    const card = byId.get(id)
    return card && lightOf(card.fsrs) !== 'discovering'
  }).length
  return { ready, total: stage.soundIds.length }
}

export function bossReady(stage: Stage, cards: IpaCard[]): boolean {
  const { ready, total } = stageProgress(stage, cards)
  return ready >= Math.ceil(total * BOSS_READY)
}

export const passed = (bossId: string, lessons: SchoolLesson[]) => !!lessons.find((l) => l.id === lessonId(bossId))?.passedAt

/** A stage is open when every stage before it has had its boss beaten. */
export function openStages(lessons: SchoolLesson[]): Stage[] {
  const open: Stage[] = []
  for (const stage of STAGES) {
    open.push(stage)
    if (!passed(stage.id, lessons)) break
  }
  return open
}

export const rangerOpen = (lessons: SchoolLesson[]) => STAGES.every((s) => passed(s.id, lessons))

/** Sound ids the learner can train now, in teaching order. */
export const openSoundIds = (lessons: SchoolLesson[]) => openStages(lessons).flatMap((s) => s.soundIds)

/** Every sound is in exactly one stage. */
export const allStageSoundIds = () => STAGES.flatMap((s) => s.soundIds)
