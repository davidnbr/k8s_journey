// ─── Cluster State (drives the live diagram) ────────────────────────────────

export type PodStatus = 'Pending' | 'Running' | 'Failed' | 'Terminated'

export interface PodState {
  id: string
  name: string
  namespace: string
  node: 'node-1' | 'node-2'
  status: PodStatus
  labels: Record<string, string>
  image: string
  restarts: number
}

export interface ServiceState {
  id: string
  name: string
  namespace: string
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer'
  selector: Record<string, string>
  port: number
  clusterIP: string
}

export interface DeploymentState {
  id: string
  name: string
  namespace: string
  replicas: number
  availableReplicas: number
  image: string
}

export interface ClusterState {
  pods: PodState[]
  services: ServiceState[]
  deployments: DeploymentState[]
  namespaces: string[]
  events: string[]
  highlightedComponent?: 'apiserver' | 'etcd' | 'scheduler' | 'controller' | 'kubelet' | 'proxy'
}

// ─── Lab Content ─────────────────────────────────────────────────────────────

export interface LabStep {
  id: string
  title: string
  instruction: string
  command?: string
  output?: string[]
  explanation: string
  clusterState: ClusterState
  tip?: string
  yamlContent?: string
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string
  question: string
  options: string[]      // always multiple-choice
  answer: number          // index into options[]
  explanation: string
}

// ─── Review & Exercise Metadata ─────────────────────────────────────────────

export type ReviewStatus = 'verified' | 'needs-update' | 'blocked'

export interface SourceRef {
  title: string
  url: string
  checkedAt: string       // YYYY-MM
  scope: 'concepts' | 'commands' | 'tutorial' | 'tooling' | 'release'
}

export interface ExerciseTask {
  id: string
  title: string
  kind: 'guided' | 'challenge' | 'debug' | 'spaced-review'
  goal: string
  commands: string[]
  verify: string[]
  expectedOutcome: string
  cleanup: string[]
}

export interface TopicCoverage {
  concepts: string[]
  commands: string[]
  architecture: string[]
  techniques: string[]
  procedures: string[]
  toolsAndPlugins: string[]
  cases: string[]
  scenarios: string[]
}

export interface ModuleReview {
  moduleId: string
  phaseSlug: string
  moduleSlug: string
  verifiedAt: string
  verifiedAgainst: string[]
  reviewStatus: ReviewStatus
  reviewNotes: string[]
  sourceRefs: SourceRef[]
  coverage: TopicCoverage
  minikubePrerequisites: string[]
  supplementalCommands: string[]
}

// ─── Course Structure ─────────────────────────────────────────────────────────

export interface Module {
  id: string
  slug: string
  title: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  learningObjectives?: string[] // what the learner should be able to do after the module
  keyConcepts?: string[]        // core concepts to retrieve during review
  practicePrompts?: string[]    // short exercises that force prediction, recall, or transfer
  masteryChecks?: string[]      // observable criteria for moving on
  coverage?: TopicCoverage
  exercises?: ExerciseTask[]
  theory: string          // markdown-like text shown before the lab
  labSteps: LabStep[]
  quiz: QuizQuestion[]
}

export interface Phase {
  id: string
  slug: string
  title: string
  shortTitle: string
  description: string
  weeks: string
  hours: string
  color: string           // tailwind border/text colour token
  bgColor: string
  modules: Module[]
}
