import type { ExerciseTask, Module, ModuleReview, Phase } from '@/lib/types'

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

export interface ModuleCoverage {
  concepts: boolean
  commands: boolean
  architecture: boolean
  techniques: boolean
  procedures: boolean
  toolsAndPlugins: boolean
  casesAndScenarios: boolean
  localExercises: boolean
}

export interface CommandFamily {
  name: string
  purpose: string
  commands: string[]
}

const COMMAND_FAMILIES: Array<{
  name: string
  purpose: string
  match: RegExp
}> = [
  {
    name: 'Inspect cluster state',
    purpose: 'Read live state before changing it.',
    match: /\bkubectl\s+(get|describe|top|events|api-versions|cluster-info|config\s+(view|get-contexts|current-context))/,
  },
  {
    name: 'Declarative apply',
    purpose: 'Create or update resources from manifests.',
    match: /\bkubectl\s+(apply|diff|kustomize)\b/,
  },
  {
    name: 'Imperative creation',
    purpose: 'Create fast practice objects and exam-style resources.',
    match: /\bkubectl\s+(run|create|expose|autoscale)\b/,
  },
  {
    name: 'Workload operations',
    purpose: 'Change running workloads safely.',
    match: /\bkubectl\s+(scale|set|rollout|patch|label|cordon|drain|uncordon)\b/,
  },
  {
    name: 'Debugging and verification',
    purpose: 'Prove behavior from logs, exec, auth checks, and forwarded ports.',
    match: /\bkubectl\s+(logs|exec|auth|port-forward|debug)\b/,
  },
  {
    name: 'Cleanup',
    purpose: 'Remove temporary resources and observe reconciliation.',
    match: /\bkubectl\s+delete\b/,
  },
  {
    name: 'Helm package operations',
    purpose: 'Install, inspect, upgrade, roll back, or list Helm releases.',
    match: /\bhelm\s+/,
  },
  {
    name: 'External cluster/admin tooling',
    purpose: 'Practice tools used outside kubectl for operations or platform extensions.',
    match: /\b(argocd|istioctl|etcdctl|systemctl)\s+/,
  },
]

export function getRunnableCommands(mod: Module): string[] {
  return mod.labSteps
    .map((step) => step.command)
    .filter((command): command is string => Boolean(command?.trim()))
}

export function getCommandFamilies(mod: Module): CommandFamily[] {
  const commands = getRunnableCommands(mod)

  return COMMAND_FAMILIES.map((family) => ({
    name: family.name,
    purpose: family.purpose,
    commands: commands.filter((command) => family.match.test(command)),
  })).filter((family) => family.commands.length > 0)
}

export function getExternalTools(mod: Module): string[] {
  const tools = new Set<string>()
  for (const command of getRunnableCommands(mod)) {
    const firstToken = command.trim().split(/\s+/)[0]
    if (firstToken && firstToken !== 'kubectl') tools.add(firstToken)
    if (command.includes(' helm ')) tools.add('helm')
    if (command.includes(' argocd ')) tools.add('argocd')
    if (command.includes(' istioctl ')) tools.add('istioctl')
    if (command.includes(' etcdctl ')) tools.add('etcdctl')
    if (command.includes(' systemctl ')) tools.add('systemctl')
  }
  return Array.from(tools).sort()
}

export function getModuleCoverage(mod: Module): ModuleCoverage {
  const runnableCommands = getRunnableCommands(mod)
  const theory = mod.theory.toLowerCase()
  const commandText = runnableCommands.join('\n')
  const hasDiagram = mod.theory.includes('```') || mod.labSteps.some((step) => step.clusterState.highlightedComponent)
  const hasProcedure = mod.labSteps.length >= 3
  const hasScenario =
    theory.includes('brain warm-up') ||
    theory.includes('when to use') ||
    theory.includes('problem') ||
    mod.labSteps.some((step) => /verify|simulate|inspect|troubleshoot|test|break|rollback|restore|audit/i.test(step.title))
  const hasTechnique =
    theory.includes('best practice') ||
    theory.includes('pattern') ||
    theory.includes('strategy') ||
    theory.includes('checklist') ||
    mod.labSteps.some((step) => /rollback|scale|patch|diff|drain|cordon|canary|self-healing|graceful|verify/i.test(step.title))

  return {
    concepts: theory.includes('##') || theory.includes('concept'),
    commands: runnableCommands.length > 0,
    architecture: hasDiagram,
    techniques: hasTechnique,
    procedures: hasProcedure,
    toolsAndPlugins: commandText.includes('kubectl') || getExternalTools(mod).length > 0,
    casesAndScenarios: hasScenario,
    localExercises: runnableCommands.length > 0 && mod.labSteps.some((step) => Boolean(step.instruction)),
  }
}

export function getCoverageGaps(mod: Module): string[] {
  const coverage = getModuleCoverage(mod)
  const labels: Record<keyof ModuleCoverage, string> = {
    concepts: 'concept explanation',
    commands: 'runnable commands',
    architecture: 'architecture or state diagram',
    techniques: 'techniques and operational patterns',
    procedures: 'step-by-step procedure',
    toolsAndPlugins: 'tools/plugins used in practice',
    casesAndScenarios: 'cases and scenarios',
    localExercises: 'local exercises',
  }

  return Object.entries(coverage)
    .filter(([, covered]) => !covered)
    .map(([key]) => labels[key as keyof ModuleCoverage])
}

export function getLocalPracticeChecklist(mod: Module): string[] {
  const tools = getExternalTools(mod)
  const checklist = [
    'Use a local or disposable Kubernetes cluster unless the lesson explicitly says it is safe for production.',
    'Run kubectl config current-context before changing resources so you know which cluster receives the command.',
    'Predict the expected object, status, event, or endpoint change before running each command.',
    'After each command, verify with get, describe, logs, events, top, auth can-i, or the tool-specific status command.',
  ]

  if (tools.length > 0) {
    checklist.push(`Install or verify required external tooling before the lab: ${tools.join(', ')}.`)
  }

  checklist.push('After the guided lab, repeat the main task with a different resource name, namespace, label, image, or replica count.')
  return checklist
}

export function getExerciseTasks(mod: Module, review?: ModuleReview): ExerciseTask[] {
  const runnableCommands = getRunnableCommands(mod)
  const primaryCommands = runnableCommands.length > 0 ? runnableCommands : review?.supplementalCommands ?? []
  const verifyCommands = [
    'kubectl config current-context',
    'kubectl get events --sort-by=.lastTimestamp',
    ...primaryCommands.filter((command) => /\bkubectl\s+(get|describe|logs|top|auth|wait)\b/.test(command)).slice(0, 3),
  ]
  const cleanupCommands = [
    `kubectl delete all -l app=${mod.slug} --ignore-not-found`,
    `kubectl delete pod ${mod.slug}-review --ignore-not-found`,
    `kubectl delete namespace ${mod.slug}-review --ignore-not-found`,
  ]

  return [
    {
      id: `${mod.id}-guided`,
      title: 'Guided local run',
      kind: 'guided',
      goal: 'Follow the verified lab path on a disposable minikube cluster while predicting each state change before running it.',
      commands: [
        ...(review?.minikubePrerequisites ?? ['minikube start --kubernetes-version=v1.36.1']),
        ...primaryCommands,
      ],
      verify: verifyCommands,
      expectedOutcome: 'The Kubernetes objects in the lesson exist, reach the expected status, and can be explained from kubectl output.',
      cleanup: cleanupCommands,
    },
    {
      id: `${mod.id}-challenge`,
      title: 'Transfer challenge',
      kind: 'challenge',
      goal: 'Repeat the same concept from memory with a changed name, namespace, label, image, or replica count.',
      commands: [
        `kubectl create namespace ${mod.slug}-review`,
        `kubectl config set-context --current --namespace=${mod.slug}-review`,
        ...(review?.supplementalCommands.slice(0, 4) ?? primaryCommands.slice(0, 4)),
      ],
      verify: [
        `kubectl get all -n ${mod.slug}-review`,
        `kubectl get events -n ${mod.slug}-review --sort-by=.lastTimestamp`,
      ],
      expectedOutcome: 'You can adapt the procedure without copying the exact guided-lab names.',
      cleanup: [
        'kubectl config set-context --current --namespace=default',
        `kubectl delete namespace ${mod.slug}-review --ignore-not-found`,
      ],
    },
    {
      id: `${mod.id}-debug`,
      title: 'Debug drill',
      kind: 'debug',
      goal: 'Introduce or inspect one failure mode and identify the responsible object, field, event, or controller.',
      commands: [
        'kubectl get pods -A',
        'kubectl get events -A --sort-by=.lastTimestamp',
        ...primaryCommands.filter((command) => /\bkubectl\s+(describe|logs|get|auth|top)\b/.test(command)).slice(0, 4),
      ],
      verify: [
        'kubectl describe pod --all-namespaces',
        'kubectl get events -A --sort-by=.lastTimestamp',
      ],
      expectedOutcome: 'You can name what failed, where Kubernetes reported it, and which command proved it.',
      cleanup: cleanupCommands,
    },
    {
      id: `${mod.id}-spaced-review`,
      title: 'Spaced review command set',
      kind: 'spaced-review',
      goal: 'Re-run a short command set after 1, 3, 7, and 21 days to strengthen recall.',
      commands: [
        `kubectl explain ${review?.coverage.concepts[0]?.toLowerCase().split(' ')[0] ?? 'pod'}`,
        ...(review?.supplementalCommands.slice(0, 3) ?? primaryCommands.slice(0, 3)),
      ],
      verify: verifyCommands.slice(0, 3),
      expectedOutcome: 'You can recall the object purpose, inspect it quickly, and connect output to the architecture.',
      cleanup: cleanupCommands,
    },
  ]
}

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
