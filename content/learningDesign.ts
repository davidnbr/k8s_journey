import type { Module, Phase } from '@/lib/types'

export const learningPrinciples = [
  {
    name: 'Retrieval practice',
    evidence: 'Practice testing improves long-term retention more reliably than rereading.',
    courseUse: 'Answer predictions and quizzes before looking at explanations.',
  },
  {
    name: 'Distributed practice',
    evidence: 'Spacing review over time is more durable than cramming.',
    courseUse: 'Review each module after 1 day, 3 days, 7 days, and 21 days.',
  },
  {
    name: 'Worked examples before fading',
    evidence: 'Beginners learn complex procedures better from guided examples before independent problem solving.',
    courseUse: 'Run the scripted lab first, then repeat a similar task without the script.',
  },
  {
    name: 'Dual coding with low extraneous load',
    evidence: 'Combining words and relevant visuals can improve understanding when visuals explain the same system.',
    courseUse: 'Pair each command with the live cluster diagram instead of treating diagrams as decoration.',
  },
  {
    name: 'Interleaving and transfer',
    evidence: 'Mixing related problem types helps learners choose the right approach instead of memorizing one pattern.',
    courseUse: 'Revisit earlier primitives inside later security, networking, storage, and troubleshooting labs.',
  },
]

export const spacedReviewCadence = [
  'Same day: recreate the key object from memory, then check the manifest.',
  'Next day: answer the quiz again without notes and explain one failure mode.',
  'Day 3: repeat the core kubectl workflow from a blank terminal.',
  'Day 7: solve a related variant exercise without the scripted output.',
  'Day 21: teach the concept in plain language and connect it to production operations.',
]

export function getModuleLearningObjectives(mod: Module): string[] {
  if (mod.learningObjectives?.length) return mod.learningObjectives

  return [
    `Explain what ${mod.title} is responsible for in a Kubernetes cluster.`,
    `Use kubectl to inspect, create, modify, or troubleshoot ${mod.title.toLowerCase()} in a real workflow.`,
    `Predict how the cluster state should change before running each lab command.`,
  ]
}

export function getModuleKeyConcepts(mod: Module): string[] {
  if (mod.keyConcepts?.length) return mod.keyConcepts

  const concepts = new Set<string>([
    mod.title,
    'desired state',
    'actual state',
    'declarative configuration',
    'kubectl inspection',
  ])

  for (const step of mod.labSteps.slice(0, 5)) {
    if (step.command?.includes('describe')) concepts.add('events and status')
    if (step.command?.includes('logs')) concepts.add('logs')
    if (step.command?.includes('apply') || step.command?.includes('create')) concepts.add('manifest lifecycle')
    if (step.command?.includes('delete')) concepts.add('cleanup and reconciliation')
  }

  return Array.from(concepts).slice(0, 7)
}

export function getModulePracticePrompts(mod: Module): string[] {
  if (mod.practicePrompts?.length) return mod.practicePrompts

  return [
    'Before each lab command, write one sentence predicting the API object or status field that should change.',
    `After the guided lab, repeat the main ${mod.title} workflow from memory with a different name or namespace.`,
    'Break one small part intentionally, then use kubectl get, describe, logs, or events to identify the cause.',
  ]
}

export function getModuleMasteryChecks(mod: Module): string[] {
  if (mod.masteryChecks?.length) return mod.masteryChecks

  return [
    'You can explain the concept without reading the theory text.',
    'You can complete the core lab path from a blank terminal with only kubectl help/manifests as references.',
    'You can diagnose one realistic failure mode and name the Kubernetes object responsible.',
  ]
}

export function getPhaseLearningRole(phase: Phase, index: number): string {
  const roles = [
    'Build the mental model before adding object complexity.',
    'Learn the smallest Kubernetes primitives and how reconciliation behaves.',
    'Add configuration, identity, health, and resource constraints to make workloads reliable.',
    'Handle persistence, traffic entry, network isolation, and specialized workload patterns.',
    'Operate safer clusters with authorization, scheduled work, autoscaling, placement, and disruption control.',
    'Move from primitives to production delivery: packaging, customization, APIs, observability, GitOps, and service mesh.',
    'Convert knowledge into timed performance for KCNA, CKA, and CKAD-style tasks.',
  ]

  return roles[index] ?? `Practice ${phase.title} with retrieval, spacing, and transfer exercises.`
}
