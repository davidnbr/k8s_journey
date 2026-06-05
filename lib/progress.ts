'use client'

const PREFIX = 'k8s-progress:'

// Spaced review intervals in days (Ebbinghaus-informed)
export const REVIEW_INTERVALS = [1, 3, 7, 21] as const
export type ReviewIntervalIndex = 0 | 1 | 2 | 3

export type ModuleStatus = 'not_started' | 'in_progress' | 'completed'

export interface ReviewState {
  completedAt: number        // unix ms when module was first completed
  reviewsDone: number[]      // unix ms timestamps of each completed review interval
}

export interface DueReview {
  phaseSlug: string
  moduleSlug: string
  moduleTitle: string
  phaseTitle: string
  intervalIndex: ReviewIntervalIndex
  daysInterval: number
  dueAt: number              // unix ms
  overdueDays: number        // 0 = due today, >0 = overdue
}

function statusKey(phaseSlug: string, moduleSlug: string) {
  return `${PREFIX}${phaseSlug}:${moduleSlug}`
}

function reviewKey(phaseSlug: string, moduleSlug: string) {
  return `${PREFIX}${phaseSlug}:${moduleSlug}:reviews`
}

// ─── Module status ────────────────────────────────────────────────────────────

export function getModuleStatus(phaseSlug: string, moduleSlug: string): ModuleStatus {
  if (typeof window === 'undefined') return 'not_started'
  return (localStorage.getItem(statusKey(phaseSlug, moduleSlug)) as ModuleStatus) ?? 'not_started'
}

export function setModuleStatus(phaseSlug: string, moduleSlug: string, status: ModuleStatus) {
  if (typeof window === 'undefined') return
  localStorage.setItem(statusKey(phaseSlug, moduleSlug), status)
  window.dispatchEvent(new Event('k8s-progress-change'))
}

export function markStepReached(phaseSlug: string, moduleSlug: string) {
  if (getModuleStatus(phaseSlug, moduleSlug) === 'not_started') {
    setModuleStatus(phaseSlug, moduleSlug, 'in_progress')
  }
}

export function markModuleCompleted(phaseSlug: string, moduleSlug: string) {
  setModuleStatus(phaseSlug, moduleSlug, 'completed')
  // Record completion timestamp if not already set
  const existing = getReviewState(phaseSlug, moduleSlug)
  if (!existing) {
    saveReviewState(phaseSlug, moduleSlug, { completedAt: Date.now(), reviewsDone: [] })
  }
}

// ─── Spaced review state ──────────────────────────────────────────────────────

function getReviewState(phaseSlug: string, moduleSlug: string): ReviewState | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(reviewKey(phaseSlug, moduleSlug))
  if (!raw) return null
  try { return JSON.parse(raw) as ReviewState } catch { return null }
}

function saveReviewState(phaseSlug: string, moduleSlug: string, state: ReviewState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(reviewKey(phaseSlug, moduleSlug), JSON.stringify(state))
  window.dispatchEvent(new Event('k8s-progress-change'))
}

export function markReviewDone(phaseSlug: string, moduleSlug: string, intervalIndex: ReviewIntervalIndex) {
  const state = getReviewState(phaseSlug, moduleSlug)
  if (!state) return
  const updated: ReviewState = {
    ...state,
    reviewsDone: [...state.reviewsDone.slice(0, intervalIndex), Date.now(), ...state.reviewsDone.slice(intervalIndex + 1)],
  }
  saveReviewState(phaseSlug, moduleSlug, updated)
}

// Returns the next review interval index that is due, or null if all done
export function getNextReviewDue(phaseSlug: string, moduleSlug: string): {
  intervalIndex: ReviewIntervalIndex
  dueAt: number
  overdueDays: number
} | null {
  const state = getReviewState(phaseSlug, moduleSlug)
  if (!state) return null

  const now = Date.now()
  const MS_PER_DAY = 86_400_000

  for (let i = 0; i < REVIEW_INTERVALS.length; i++) {
    if (state.reviewsDone[i]) continue  // already done
    const dueAt = state.completedAt + REVIEW_INTERVALS[i] * MS_PER_DAY
    const overdueDays = Math.max(0, Math.floor((now - dueAt) / MS_PER_DAY))
    return { intervalIndex: i as ReviewIntervalIndex, dueAt, overdueDays }
  }
  return null  // all reviews completed
}

export function getReviewProgress(phaseSlug: string, moduleSlug: string): {
  done: number
  total: number
} {
  const state = getReviewState(phaseSlug, moduleSlug)
  if (!state) return { done: 0, total: REVIEW_INTERVALS.length }
  const done = state.reviewsDone.filter(Boolean).length
  return { done, total: REVIEW_INTERVALS.length }
}

// ─── Course-wide aggregates ───────────────────────────────────────────────────

export function getDueReviews(
  phases: { slug: string; title: string; modules: { slug: string; title: string }[] }[]
): DueReview[] {
  if (typeof window === 'undefined') return []
  const now = Date.now()
  const due: DueReview[] = []

  for (const phase of phases) {
    for (const mod of phase.modules) {
      const next = getNextReviewDue(phase.slug, mod.slug)
      if (!next) continue
      if (next.dueAt <= now) {
        due.push({
          phaseSlug: phase.slug,
          moduleSlug: mod.slug,
          moduleTitle: mod.title,
          phaseTitle: phase.title,
          intervalIndex: next.intervalIndex,
          daysInterval: REVIEW_INTERVALS[next.intervalIndex],
          dueAt: next.dueAt,
          overdueDays: next.overdueDays,
        })
      }
    }
  }

  return due.sort((a, b) => a.dueAt - b.dueAt)
}

export function getUpcomingReviews(
  phases: { slug: string; title: string; modules: { slug: string; title: string }[] }[],
  withinDays = 3
): DueReview[] {
  if (typeof window === 'undefined') return []
  const now = Date.now()
  const MS_PER_DAY = 86_400_000
  const cutoff = now + withinDays * MS_PER_DAY
  const upcoming: DueReview[] = []

  for (const phase of phases) {
    for (const mod of phase.modules) {
      const next = getNextReviewDue(phase.slug, mod.slug)
      if (!next) continue
      if (next.dueAt > now && next.dueAt <= cutoff) {
        upcoming.push({
          phaseSlug: phase.slug,
          moduleSlug: mod.slug,
          moduleTitle: mod.title,
          phaseTitle: phase.title,
          intervalIndex: next.intervalIndex,
          daysInterval: REVIEW_INTERVALS[next.intervalIndex],
          dueAt: next.dueAt,
          overdueDays: 0,
        })
      }
    }
  }

  return upcoming.sort((a, b) => a.dueAt - b.dueAt)
}

export function getPhaseProgress(phaseSlug: string, moduleSlugs: string[]): number {
  if (moduleSlugs.length === 0) return 0
  const completed = moduleSlugs.filter((s) => getModuleStatus(phaseSlug, s) === 'completed').length
  return Math.round((completed / moduleSlugs.length) * 100)
}

export function getTotalProgress(phases: { slug: string; modules: { slug: string }[] }[]): number {
  let total = 0
  let completed = 0
  for (const phase of phases) {
    for (const mod of phase.modules) {
      total++
      if (getModuleStatus(phase.slug, mod.slug) === 'completed') completed++
    }
  }
  return total === 0 ? 0 : Math.round((completed / total) * 100)
}
