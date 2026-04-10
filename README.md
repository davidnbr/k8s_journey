# K8s Journey

An interactive Kubernetes course — zero to advanced — built with Next.js. Each lesson combines theory, a scripted terminal walkthrough, a live cluster diagram, and an active-recall quiz.

**~170 hours of content · 6 phases · no account needed**

## Course Structure

| Phase | Title | Duration |
|-------|-------|----------|
| 0 | Mental Model Foundation | ~5h |
| 1 | Core Primitives | ~20h |
| 2 | Configuration & Reliability | ~9h |
| 3 | Storage, Ingress & Advanced Workloads | ~10h |
| 4 | Security, Scheduling & Reliability | ~10h |
| 5 | Helm, CRDs & Observability | ~11h |

<details>
<summary>Phase details</summary>

**Phase 0 — Mental Model Foundation**
Why Kubernetes Exists · Cluster Architecture

**Phase 1 — Core Primitives**
Pods · Deployments · Services

**Phase 2 — Configuration & Reliability**
Namespaces · Labels & Selectors · ConfigMaps · Secrets · Health Probes · Resource Requests & Limits

**Phase 3 — Storage, Ingress & Advanced Workloads**
Volumes & PersistentVolumes · StatefulSets · DaemonSets · Ingress · NetworkPolicies

**Phase 4 — Security, Scheduling & Reliability**
RBAC · Jobs & CronJobs · Horizontal Pod Autoscaler · Taints, Tolerations & Node Affinity · PodDisruptionBudgets

**Phase 5 — Advanced Kubernetes**
Helm · Kustomize · Custom Resource Definitions · Observability (metrics-server, Prometheus, Grafana) · Production Readiness

</details>

## How Each Lesson Works

1. **Read Theory** — concept explanation with ASCII architecture diagram
2. **Run the Lab** — step-by-step scripted terminal walkthrough with real `kubectl` output
3. **Watch the Diagram** — live cluster diagram animates as you progress through steps
4. **Quiz** — active recall questions with explanations

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for styling
- **devenv** (Nix) for reproducible dev environment

## Getting Started

### With devenv (recommended)

```bash
devenv shell       # or: direnv allow (if you have direnv)
npm install
npm run dev
```

### Without devenv

Requires Node 22+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Layout

```
content/          # Course content (phase0.ts – phase5.ts)
  phase0.ts       # Each file exports a Phase with modules, lab steps, and quizzes
  ...
app/
  page.tsx        # Landing page
  learn/          # /learn route — phase/module browser
    [phase]/[module]/page.tsx
components/
  ClusterDiagram.tsx    # Animated live cluster diagram
  ScriptedTerminal.tsx  # Step-through terminal walkthrough
  QuizCard.tsx          # Active recall quiz
  Sidebar.tsx           # Navigation
lib/
  types.ts        # Core types: Phase, Module, LabStep, QuizQuestion, ClusterState
  progress.ts     # Progress tracking
```

## Adding Content

Each phase file (`content/phaseN.ts`) exports a `Phase` object. To add a module, append to the `modules` array following the `Module` type in `lib/types.ts`:

```ts
{
  id: 'pN-mX',
  slug: 'my-topic',
  title: 'My Topic',
  description: '...',
  duration: '30 min',
  difficulty: 'intermediate',
  theory: `## Markdown theory content`,
  labSteps: [ /* LabStep[] */ ],
  quiz: [ /* QuizQuestion[] */ ],
}
```

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```
