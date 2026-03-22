'use client'

const PREFIX = 'k8s-progress:'

export type ModuleStatus = 'not_started' | 'in_progress' | 'completed'

function key(phaseSlug: string, moduleSlug: string) {
  return `${PREFIX}${phaseSlug}:${moduleSlug}`
}

export function getModuleStatus(phaseSlug: string, moduleSlug: string): ModuleStatus {
  if (typeof window === 'undefined') return 'not_started'
  return (localStorage.getItem(key(phaseSlug, moduleSlug)) as ModuleStatus) ?? 'not_started'
}

export function setModuleStatus(phaseSlug: string, moduleSlug: string, status: ModuleStatus) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key(phaseSlug, moduleSlug), status)
  window.dispatchEvent(new Event('k8s-progress-change'))
}

export function markStepReached(phaseSlug: string, moduleSlug: string) {
  const current = getModuleStatus(phaseSlug, moduleSlug)
  if (current === 'not_started') {
    setModuleStatus(phaseSlug, moduleSlug, 'in_progress')
  }
}

export function markModuleCompleted(phaseSlug: string, moduleSlug: string) {
  setModuleStatus(phaseSlug, moduleSlug, 'completed')
}

export function getPhaseProgress(phaseSlug: string, moduleSlugs: string[]): number {
  if (moduleSlugs.length === 0) return 0
  const completed = moduleSlugs.filter(
    (s) => getModuleStatus(phaseSlug, s) === 'completed'
  ).length
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
