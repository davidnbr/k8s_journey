import phase0 from './phase0'
import phase1 from './phase1'
import phase2 from './phase2'
import phase3 from './phase3'
import phase4 from './phase4'
import phase5 from './phase5'
import phase6 from './phase6'
import phase7 from './phase7'
import phase8 from './phase8'
import type { Phase } from '@/lib/types'

export const phases: Phase[] = [phase0, phase1, phase2, phase3, phase4, phase5, phase6, phase7, phase8]

export function getPhase(slug: string): Phase | undefined {
  return phases.find((p) => p.slug === slug)
}

export function getModule(phaseSlug: string, moduleSlug: string) {
  const phase = getPhase(phaseSlug)
  if (!phase) return undefined
  return phase.modules.find((m) => m.slug === moduleSlug)
}

export function getNextModule(phaseSlug: string, moduleSlug: string) {
  const phase = getPhase(phaseSlug)
  if (!phase) return null
  const idx = phase.modules.findIndex((m) => m.slug === moduleSlug)
  if (idx < phase.modules.length - 1) {
    return { phase, module: phase.modules[idx + 1] }
  }
  // Try next phase
  const phaseIdx = phases.findIndex((p) => p.slug === phaseSlug)
  if (phaseIdx < phases.length - 1) {
    const nextPhase = phases[phaseIdx + 1]
    return { phase: nextPhase, module: nextPhase.modules[0] }
  }
  return null
}

export function getPrevModule(phaseSlug: string, moduleSlug: string) {
  const phase = getPhase(phaseSlug)
  if (!phase) return null
  const idx = phase.modules.findIndex((m) => m.slug === moduleSlug)
  if (idx > 0) {
    return { phase, module: phase.modules[idx - 1] }
  }
  const phaseIdx = phases.findIndex((p) => p.slug === phaseSlug)
  if (phaseIdx > 0) {
    const prevPhase = phases[phaseIdx - 1]
    return { phase: prevPhase, module: prevPhase.modules[prevPhase.modules.length - 1] }
  }
  return null
}
