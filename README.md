# K8s Journey

An interactive Kubernetes course — zero to advanced — built with Next.js. Each lesson combines theory, prediction prompts, a scripted terminal walkthrough, a live cluster diagram, troubleshooting practice, active-recall quizzes, and spaced review.

**~120 hours of content · 7 phases · no account needed**

## Learning Design

The course route is the learning method. Topics are ordered to reduce unnecessary cognitive load while gradually increasing real Kubernetes complexity:

1. **Mental model first** — understand clusters, control plane behavior, kubectl, and kubeconfig before managing workloads.
2. **Core primitives next** — learn Pods, Deployments, Services, and lifecycle behavior before adding reliability constraints.
3. **Reliability and configuration** — add Namespaces, labels, ConfigMaps, Secrets, probes, and resource controls.
4. **Traffic and state** — add storage, StatefulSets, DaemonSets, Ingress, and NetworkPolicies.
5. **Operations and safety** — add RBAC, Jobs, autoscaling, scheduling, and disruption budgets.
6. **Production delivery** — add Helm, Kustomize, CRDs, observability, GitOps, service mesh, and readiness checks.
7. **Timed performance** — practice KCNA, CKA, and CKAD-style drills.

Every module follows the same evidence-backed loop:

1. **Preview** — load the mental model and identify the objects involved.
2. **Predict** — before each command, guess what API object, field, event, or status should change.
3. **Run the worked example** — use the scripted lab and cluster diagram together.
4. **Explain** — describe why the state changed in your own words.
5. **Troubleshoot** — intentionally break one small thing and identify the failing object or field.
6. **Recall** — answer quiz questions before revealing explanations.
7. **Transfer** — repeat a similar task with a changed name, namespace, image, selector, or constraint.
8. **Space review** — revisit the module after 1 day, 3 days, 7 days, and 21 days.

The learning methods are intentionally conservative:

- **Practice testing / retrieval practice**: supported by Roediger & Karpicke and the Dunlosky et al. review.
- **Distributed practice**: supported as one of the highest-utility techniques in Dunlosky et al.
- **Worked examples before independent solving**: supported by cognitive load theory research for novice learners.
- **Dual coding / multimedia learning**: supported when visuals and words explain the same system and avoid decorative load.
- **Interleaving / transfer practice**: used after the learner has enough basics to compare related problem types.

If a claim is not known or verified, do not present it as fact. Kubernetes version-specific statements should be checked against the official Kubernetes release and documentation pages before being shown as current.

## Course Structure

| Phase | Title | Duration |
|-------|-------|----------|
| 0 | Mental Model Foundation | ~8h |
| 1 | Core Primitives | ~24h |
| 2 | Configuration & Reliability | ~9h |
| 3 | Storage, Ingress & Advanced Workloads | ~10h |
| 4 | Security, Scheduling & Reliability | ~10h |
| 5 | Advanced Kubernetes: Helm, CRDs & Observability | ~19h |
| 6 | Certification Prep (KCNA, CKA, CKAD) | ~40h |

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
Helm · Kustomize · Custom Resource Definitions · Observability (metrics-server, Prometheus, Grafana) · Production Readiness · GitOps · Service Mesh

**Phase 6 — Certification Prep**
KCNA · CKA · CKAD

</details>

## How Each Lesson Works

1. **Learning Contract** — objectives, retrieval targets, practice prompts, and mastery checks
2. **Read Theory** — concept explanation with architecture diagrams
3. **Predict** — state what should happen before each command
4. **Run the Lab** — step-by-step scripted terminal walkthrough with real `kubectl` output
5. **Watch the Diagram** — live cluster diagram animates as you progress through steps
6. **Troubleshoot** — break a small part and inspect the failed state
7. **Quiz** — active recall questions with explanations
8. **Review Later** — repeat recall and variant exercises on a spaced schedule

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
content/          # Course content (phase0.ts – phase6.ts)
  phase0.ts       # Each file exports a Phase with modules, lab steps, and quizzes
  learningDesign.ts # Evidence-based learning loop, defaults, and phase roles
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
  learningObjectives: ['...'],
  keyConcepts: ['...'],
  practicePrompts: ['...'],
  masteryChecks: ['...'],
  theory: `## Markdown theory content`,
  labSteps: [ /* LabStep[] */ ],
  quiz: [ /* QuizQuestion[] */ ],
}
```

The learning metadata is optional. If it is missing, the app generates conservative defaults from the module title and lab steps so existing topics remain available.

## Evidence References

- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). *Improving Students' Learning With Effective Learning Techniques*.
- Roediger, H. L., & Karpicke, J. D. (2006). *Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention*.
- Mayer, R. E. (2008). *Applying the Science of Learning: Evidence-Based Principles for the Design of Multimedia Instruction*.
- Sweller, J., van Merrienboer, J. J. G., & Paas, F. (1998). Cognitive load theory and instructional design research.
- Renkl, A., Atkinson, R. K., & Maier, U. H. (2000s). Worked-example fading and cognitive load research.
- Kubernetes official documentation: https://kubernetes.io/docs/
- Kubernetes official releases: https://kubernetes.io/releases/

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```
