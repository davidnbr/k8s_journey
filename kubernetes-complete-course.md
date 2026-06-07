# The Complete Kubernetes Course: Zero to Advanced (2026 Edition)

> **Brain-Optimized Learning Path** · Validated sources · Interactive labs · Visual-first
> Current Kubernetes version: **v1.35 (Timbernetes)** · Last verified: March 22, 2026

---

## How This Course Is Designed (Read This First)

This course is built on four proven neuroscience principles:

| Principle                | What it means                             | How it's used here                                      |
| ------------------------ | ----------------------------------------- | ------------------------------------------------------- |
| **Active Recall**        | Force retrieval before looking at answers | Every module has `🧠 Brain Check` before explanations   |
| **Spaced Repetition**    | Review at 1→3→7→14→30 day intervals       | Each phase has a `🗓️ Review Schedule`                   |
| **Dual Coding**          | Pair visual diagrams with verbal text     | Every concept has an ASCII diagram + explanation        |
| **Desirable Difficulty** | Struggle = stronger memory                | Labs come before full explanations; challenges push you |

**The learning loop for every module:**

```
1. PREVIEW    → Glance at the diagram (30 sec)
2. PREDICT    → Answer "Brain Warm-Up" before reading
3. LEARN      → Read concept + study diagram
4. PRACTICE   → Do the interactive lab
5. RECALL     → Close the doc, answer the recall questions
6. CHALLENGE  → Harder exercise without guidance
7. REVIEW     → Return at day 1, 3, 7, 14
```

> **Tools you'll use:** [Killercoda](https://killercoda.com) (free browser terminal) ·
> [iximiuz Labs](https://labs.iximiuz.com) (deep internals) ·
> [KodeKloud](https://kodekloud.com/free-courses) (structured path) ·
> Official Docs: [kubernetes.io](https://kubernetes.io/docs/)

---

## Prerequisites Checklist

Before starting, verify you have these foundations. If not, the links will get you there fast.

- [ ] **Linux basics** — `ls`, `cd`, `cat`, `grep`, `curl`, file permissions
  - Free: [Linux Command Line Basics](https://www.freecodecamp.org/news/linux-command-line-handbook/)
- [ ] **Networking basics** — IP addresses, ports, DNS, HTTP
- [ ] **Container basics** — What is Docker? Build/run an image
  - Free: [freeCodeCamp Docker course (6h)](https://www.freecodecamp.org/news/learn-docker-and-kubernetes-hands-on-course/)
- [ ] **YAML syntax** — Indentation, key-value, lists

> If you're missing Docker knowledge: the [freeCodeCamp 6h video](https://www.freecodecamp.org/news/learn-docker-and-kubernetes-hands-on-course/) covers Docker + Kubernetes intro together.

---

## Course Map

```
PHASE 0 ──► PHASE 1 ──► PHASE 2 ──► PHASE 3 ──► PHASE 4 ──► PHASE 5 ──► PHASE 6
  Week 1     Weeks 1-3   Weeks 3-5   Weeks 5-7   Weeks 7-10  Weeks 10-16  Weeks 17+
  5 hours    20 hours    20 hours    15 hours    25 hours    40 hours     40-100 hours

  Mental     Core        Config &    Networking  Ops &       Advanced     Cert Prep
  Model      Primitives  Storage     Deep Dive   Security    Topics       KCNA/CKA/CKAD
```

---

# PHASE 0: Mental Model Foundation

**Week 1 · ~5 hours · Goal: Build the right mental model before touching a cluster**

---

## Module 0.1: Why Kubernetes Exists

### Brain Warm-Up (Answer before reading)

> You have 100 Docker containers running across 10 servers. A container crashes. How do you:
> a) Know it crashed? b) Restart it automatically? c) Move it to a different server?

The answer: without an **orchestrator**, you can't. You'd need custom scripts, manual monitoring, and manual intervention. That's what Kubernetes solves.

### The Problem Kubernetes Solves

```
WITHOUT KUBERNETES                    WITH KUBERNETES
─────────────────────                 ─────────────────

  Server 1          Server 2            ┌─────────────────────┐
  ┌────────┐        ┌────────┐          │   Kubernetes        │
  │App 1 ✓ │        │App 3 ✗ │◄─crash   │   "I see App 3      │
  │App 2 ✓ │        │App 4 ✓ │          │    crashed.         │
  └────────┘        └────────┘          │    Restarting on    │
       │                 │              │    Server 1..."     │
  Manual SSH        Manual SSH          └─────────────────────┘
  Manual restart    Manual restart             Auto ✓
  Manual scaling    Manual scaling             Auto ✓
  Manual updates    Manual updates             Auto ✓
```

**Kubernetes is a container orchestration platform that:**

- Schedules containers onto servers automatically
- Restarts failed containers
- Scales apps up/down based on load
- Does rolling updates with zero downtime
- Manages networking between containers
- Manages storage for stateful apps

### The Feynman Check

> Explain Kubernetes to a non-technical friend using only the analogy of a shipping company managing containers on cargo ships. What does the "captain" (control plane) do? What do the "ships" (worker nodes) do?

---

## Module 0.2: Kubernetes Architecture — The Big Picture

### Brain Warm-Up

> Before reading: draw your mental model of how a Kubernetes cluster might be organized. What components do you think it needs?

### The Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KUBERNETES CLUSTER                          │
│                                                                     │
│  ┌──────────────────────────── CONTROL PLANE ──────────────────┐   │
│  │                                                              │   │
│  │  ┌────────────┐  ┌─────────┐  ┌──────────────┐  ┌───────┐  │   │
│  │  │kube-       │  │         │  │  Controller  │  │ Sched │  │   │
│  │  │apiserver   │  │  etcd   │  │  Manager     │  │ -uler │  │   │
│  │  │            │  │(database│  │(reconciler)  │  │       │  │   │
│  │  │"The front  │  │of truth)│  │              │  │       │  │   │
│  │  │ door"      │  │         │  │              │  │       │  │   │
│  │  └──────┬─────┘  └─────────┘  └──────────────┘  └───────┘  │   │
│  │         │                                                    │   │
│  └─────────┼──────────────────────────────────────────────────-┘   │
│            │   kubectl talks to apiserver                           │
│  ┌─────────▼──────────────────────────────────────────────────┐    │
│  │                      WORKER NODES                           │    │
│  │                                                             │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │    │
│  │  │    Node 1        │  │    Node 2        │  │   Node 3   │ │    │
│  │  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌────────┐ │ │    │
│  │  │ │   kubelet   │ │  │ │   kubelet   │ │  │ │kubelet │ │ │    │
│  │  │ │ kube-proxy  │ │  │ │ kube-proxy  │ │  │ │k-proxy │ │ │    │
│  │  │ │  container  │ │  │ │  container  │ │  │ │runtime │ │ │    │
│  │  │ │  runtime    │ │  │ │  runtime    │ │  │ └────────┘ │ │    │
│  │  │ ├─────────────┤ │  │ ├─────────────┤ │  ├────────────┤ │    │
│  │  │ │  Pod  Pod   │ │  │ │  Pod  Pod   │ │  │ Pod   Pod  │ │    │
│  │  │ └─────────────┘ │  │ └─────────────┘ │  └────────────┘ │    │
│  │  └─────────────────┘  └─────────────────┘  └────────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Cheat Sheet

| Component            | Where         | Role                                   | Memory Hook       |
| -------------------- | ------------- | -------------------------------------- | ----------------- |
| `kube-apiserver`     | Control plane | All communication goes through here    | "The front door"  |
| `etcd`               | Control plane | Key-value store — the cluster's brain  | "The memory"      |
| `kube-scheduler`     | Control plane | Decides which node runs each Pod       | "The matchmaker"  |
| `controller-manager` | Control plane | Ensures desired state = actual state   | "The reconciler"  |
| `kubelet`            | Every node    | Runs pods, reports status to apiserver | "The foreman"     |
| `kube-proxy`         | Every node    | Manages network rules for Services     | "The traffic cop" |
| `container runtime`  | Every node    | Actually runs containers (containerd)  | "The engine"      |

### Active Recall — No Peeking

1. What is the single component ALL Kubernetes communication goes through?
2. Where does Kubernetes store cluster state? What type of database?
3. Which component decides which node a Pod runs on?
4. What is the difference between `kubelet` and `kube-proxy`?
5. If `etcd` data is lost, what happens to the cluster?

<details>
<summary>Reveal answers</summary>

1. `kube-apiserver`
2. `etcd` — a distributed key-value store
3. `kube-scheduler`
4. `kubelet` manages pod lifecycle on a node; `kube-proxy` manages network rules for Service routing
5. Cluster state is lost — this is why etcd backups are critical in production

</details>

---

## Module 0.3: Setting Up Your Environment

You have three options. **Option A is recommended for beginners** (no setup required).

### Option A: Killercoda (Recommended — Zero Setup)

```
URL: https://killercoda.com/playgrounds/scenario/kubernetes
What you get: Multi-node cluster in browser, real terminal, port exposure
Session: 1 hour (restart anytime, free)
```

### Option B: Minikube (Local)

```bash
# Install on Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start a cluster
minikube start

# Verify
kubectl cluster-info
kubectl get nodes
```

### Option C: Kind (Kubernetes in Docker)

```bash
# Install
go install sigs.k8s.io/kind@v0.26.0
# OR via package manager:
# curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.26.0/kind-linux-amd64

# Create cluster
kind create cluster --name k8s-learning

# Verify
kubectl get nodes
```

### First Commands — Run These Now

```bash
# See cluster info
kubectl cluster-info

# See all nodes
kubectl get nodes

# See all nodes with details
kubectl get nodes -o wide

# See what's running in all namespaces
kubectl get pods --all-namespaces

# Get help for any command
kubectl --help
kubectl get --help
```

---

# PHASE 1: Core Primitives

**Weeks 1-3 · ~20 hours · Goal: Master Pods, Deployments, Services, and kubectl**

---

## Module 1.1: Pods — The Atomic Unit

### Brain Warm-Up

> A Docker container is a running process. A Kubernetes Pod contains containers. Why would you ever put MORE than one container in a Pod? What problem would that solve?

### What is a Pod?

```
DOCKER (what you know)          KUBERNETES (what's new)
──────────────────────          ───────────────────────

┌──────────────┐                ┌──────────────────────────────┐
│  Container   │                │           POD                │
│              │                │                              │
│  my-app:1.0  │   ──────►      │  ┌────────────┐ ┌────────┐  │
│              │                │  │  my-app    │ │sidecar │  │
└──────────────┘                │  │ container  │ │(logs)  │  │
                                │  └────────────┘ └────────┘  │
  One process                   │                              │
  One network namespace         │  Shared: network, storage,   │
                                │  localhost communication      │
                                └──────────────────────────────┘
                                  Smallest deployable unit
```

**Key Pod facts:**

- A Pod has ONE IP address — all containers inside share it
- Containers in the same Pod communicate via `localhost`
- Pods are **ephemeral** — when they die, they're gone (no resurrection)
- You almost never create bare Pods — use Deployments instead

### Your First Pod YAML

```yaml
# File: my-first-pod.yaml
apiVersion: v1 # ← Which API version handles this resource
kind: Pod # ← What type of resource
metadata:
  name: my-first-pod # ← Unique name in the namespace
  labels:
    app: nginx # ← Key-value tags for selecting/grouping
spec:
  containers:
    - name: nginx # ← Container name (must be unique in Pod)
      image: nginx:1.27 # ← Docker image
      ports:
        - containerPort: 80 # ← Informational only, doesn't expose externally
```

```bash
# Create the Pod
kubectl apply -f my-first-pod.yaml

# Watch it come up
kubectl get pod my-first-pod --watch

# Get full details (very useful for debugging)
kubectl describe pod my-first-pod

# See the logs
kubectl logs my-first-pod

# Execute a command inside the container
kubectl exec -it my-first-pod -- bash

# Delete the Pod
kubectl delete pod my-first-pod
# OR
kubectl delete -f my-first-pod.yaml
```

### Pod Lifecycle States

```
Pending ──► Running ──► Succeeded
                 │
                 └──► Failed ──► (restart policy kicks in)
                 │
                 └──► Unknown
```

| Phase       | Meaning                                                       |
| ----------- | ------------------------------------------------------------- |
| `Pending`   | Accepted by cluster; waiting for image pull / node scheduling |
| `Running`   | At least one container is running                             |
| `Succeeded` | All containers exited with code 0                             |
| `Failed`    | At least one container exited non-zero                        |
| `Unknown`   | Can't communicate with node                                   |

### Interactive Lab 1.1

**Platform:** [Killercoda — Kubernetes Pods](https://killercoda.com/kubernetes)

**Tasks to complete:**

1. Create a Pod running `nginx:1.27`
2. Verify it's running with `kubectl get pods`
3. Use `kubectl describe` to find which Node it's on
4. Use `kubectl exec` to check the nginx version inside
5. Delete the Pod and observe it disappear

### Active Recall — Close the doc and answer

1. What IP does a Pod get? How many IPs does a Pod have?
2. If two containers are in the same Pod, how do they talk to each other?
3. What happens to a Pod's data when it crashes and restarts?
4. What's the `kubectl` command to open a shell inside a running Pod?
5. What does `kubectl describe pod <name>` show that `kubectl get pod <name>` doesn't?

<details>
<summary>Reveal answers</summary>

1. One IP per Pod; all containers share that single IP
2. Via `localhost` (they share a network namespace)
3. Data stored in the container filesystem is LOST; persistent data needs Volumes
4. `kubectl exec -it <pod-name> -- bash` (or `sh`)
5. Events, conditions, container states, resource limits, scheduling info — crucial for debugging

</details>

### Spaced Repetition Card

```
┌─────────────────────────────────────────────────────┐
│  REVIEW THIS on: Day 2, Day 5, Day 12, Day 26       │
├─────────────────────────────────────────────────────┤
│  Q: What is a Pod?                                  │
│  Q: How many IPs does a Pod have?                   │
│  Q: Are Pods meant to be long-lived?                │
│  Q: Command to view Pod logs?                       │
│  Q: Command to exec into a Pod?                     │
└─────────────────────────────────────────────────────┘
```

---

## Module 1.2: kubectl — Your Primary Tool

### The Imperative vs Declarative Divide

```
IMPERATIVE (tell it WHAT to do)    DECLARATIVE (tell it DESIRED STATE)
──────────────────────────────     ────────────────────────────────────

kubectl run nginx --image=nginx    kubectl apply -f nginx.yaml

"Create this thing now"            "Here's what I want to exist"
Good for: quick tests              Good for: production, Git, CI/CD
Bad for: production (no audit)     Bad for: one-off exploration
```

### Essential kubectl Commands

```bash
# ── VIEWING RESOURCES ──────────────────────────────────────────
kubectl get pods                        # List pods in current namespace
kubectl get pods -n kube-system         # List pods in kube-system namespace
kubectl get pods --all-namespaces       # All namespaces (alias: -A)
kubectl get pods -o wide                # More columns (IP, Node)
kubectl get pods -o yaml                # Full YAML output
kubectl get pods -o json                # Full JSON output
kubectl get pods --watch                # Live updates (-w)
kubectl get all                         # Pods, services, deployments...

# ── INSPECTING RESOURCES ───────────────────────────────────────
kubectl describe pod <name>             # Human-readable details + Events
kubectl logs <pod-name>                 # Container logs
kubectl logs <pod-name> -f              # Follow logs (streaming)
kubectl logs <pod-name> --previous      # Logs from crashed container

# ── CREATING / UPDATING ────────────────────────────────────────
kubectl apply -f manifest.yaml          # Create or update (declarative)
kubectl apply -f ./directory/           # Apply all YAMLs in directory
kubectl run nginx --image=nginx         # Quick imperative Pod creation

# ── DELETING ───────────────────────────────────────────────────
kubectl delete pod <name>               # Delete a Pod
kubectl delete -f manifest.yaml         # Delete what's in a file
kubectl delete pod --all                # Delete all Pods in namespace

# ── INTERACTING ────────────────────────────────────────────────
kubectl exec -it <pod> -- bash          # Shell into container
kubectl exec <pod> -- ls /etc           # Run one command
kubectl cp <pod>:/path /local/path      # Copy from Pod to local
kubectl port-forward pod/<name> 8080:80 # Forward local port to pod

# ── EDITING ────────────────────────────────────────────────────
kubectl edit deployment my-app          # Opens in $EDITOR
kubectl patch pod my-pod -p '{"spec":...}'  # Patch specific field
```

### The `--dry-run` + `-o yaml` Trick (Essential!)

```bash
# Generate YAML without creating anything — then edit it
kubectl run nginx --image=nginx --dry-run=client -o yaml > pod.yaml
kubectl create deployment my-app --image=nginx --dry-run=client -o yaml > deploy.yaml
kubectl create service clusterip my-svc --tcp=80:80 --dry-run=client -o yaml > svc.yaml
```

> This is the most important kubectl trick for the CKA/CKAD exams.

### Context and Namespaces

```bash
# View your current context (cluster/user/namespace)
kubectl config current-context

# List all contexts
kubectl config get-contexts

# Switch context
kubectl config use-context my-cluster

# Set default namespace for current context
kubectl config set-context --current --namespace=my-namespace

# Quick namespace switch (add to ~/.bashrc)
alias kns='kubectl config set-context --current --namespace'
```

### Useful Aliases

```bash
# Add to ~/.bashrc or ~/.zshrc
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgpa='kubectl get pods --all-namespaces'
alias kd='kubectl describe'
alias kl='kubectl logs'
alias kaf='kubectl apply -f'
alias kdel='kubectl delete'

# Enable autocomplete
source <(kubectl completion bash)  # bash
source <(kubectl completion zsh)   # zsh
```

---

## Module 1.3: Namespaces and Labels

### Namespaces — Logical Isolation

```
┌────────────────────────────────────────────────────────┐
│                    CLUSTER                              │
│                                                         │
│  ┌────────────────┐   ┌────────────────┐               │
│  │  namespace:    │   │  namespace:    │               │
│  │  production    │   │  staging       │               │
│  │                │   │                │               │
│  │  frontend-pod  │   │  frontend-pod  │ ← Same name!  │
│  │  backend-pod   │   │  backend-pod   │   Different   │
│  │  db-pod        │   │  db-pod        │   namespace   │
│  └────────────────┘   └────────────────┘               │
│                                                         │
│  ┌─────────────────────────────────┐                   │
│  │  namespace: kube-system         │                   │
│  │  (system components live here)  │                   │
│  └─────────────────────────────────┘                   │
└────────────────────────────────────────────────────────┘
```

```bash
# List namespaces
kubectl get namespaces

# Create a namespace
kubectl create namespace my-app

# Or declaratively:
# apiVersion: v1
# kind: Namespace
# metadata:
#   name: my-app

# Run in a namespace
kubectl apply -f pod.yaml -n my-app
kubectl get pods -n my-app
```

### Labels — The Kubernetes Selector System

Labels are the most powerful organizational tool in Kubernetes. **Every selector, every Service, every Deployment uses labels to find Pods.**

```yaml
metadata:
  labels:
    app: frontend # Name of the app
    version: v2.1 # Version
    environment: production # Environment
    tier: web # Application tier
    team: platform # Owning team
```

```bash
# Select by label
kubectl get pods -l app=frontend
kubectl get pods -l environment=production,tier=web  # AND logic
kubectl get pods -l 'environment in (production, staging)'

# Add label to existing resource
kubectl label pod my-pod version=v2

# Remove label
kubectl label pod my-pod version-

# Show labels in output
kubectl get pods --show-labels
```

---

## Module 1.4: Deployments — Managing Pod Lifecycle

> Never run bare Pods in production. Use Deployments.

### Why Deployments?

```
BARE POD                           DEPLOYMENT
──────────────                     ─────────────────────────────

  Pod crashes ──► GONE forever       Pod crashes ──► Auto-replaced ✓
  Need 3 copies? ──► Manual          Need 3 copies? ──► spec.replicas: 3 ✓
  Update image? ──► Delete+Create    Update image? ──► Rolling update ✓
  Update fails?  ──► Manual rollback Update fails?  ──► kubectl rollout undo ✓
```

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DEPLOYMENT                            │
│                                                          │
│  spec.replicas: 3    spec.selector:      spec.template:  │
│  (desired count)     matchLabels:        (pod template)  │
│                        app: my-app                       │
│              │                              │            │
│              ▼                              ▼            │
│        ┌─────────────┐              ┌────────────────┐  │
│        │  REPLICASET  │──────owns───►│   Pod Pod Pod  │  │
│        │  (manages    │              │   app:my-app   │  │
│        │   replicas)  │              └────────────────┘  │
│        └─────────────┘                                   │
└─────────────────────────────────────────────────────────┘
  Deployment controls ReplicaSet
  ReplicaSet controls Pods
  You talk to Deployment
```

### Deployment YAML

```yaml
# File: my-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: default
spec:
  replicas: 3 # ← How many Pod copies
  selector:
    matchLabels:
      app: my-app # ← Must match template labels
  strategy:
    type: RollingUpdate # ← Update strategy
    rollingUpdate:
      maxSurge: 1 # ← Max extra pods during update
      maxUnavailable: 0 # ← Zero downtime
  template: # ← Pod template (labels must match selector)
    metadata:
      labels:
        app: my-app
        version: '1.0'
    spec:
      containers:
        - name: my-app
          image: nginx:1.27
          ports:
            - containerPort: 80
          resources: # ← Always set in production
            requests:
              memory: '64Mi'
              cpu: '100m'
            limits:
              memory: '128Mi'
              cpu: '200m'
```

### Rolling Updates and Rollbacks

```bash
# Apply the deployment
kubectl apply -f my-deployment.yaml

# Watch rollout progress
kubectl rollout status deployment/my-app

# Update the image
kubectl set image deployment/my-app my-app=nginx:1.27.1

# OR edit directly
kubectl edit deployment/my-app

# View rollout history
kubectl rollout history deployment/my-app

# View specific revision
kubectl rollout history deployment/my-app --revision=2

# Rollback to previous version
kubectl rollout undo deployment/my-app

# Rollback to specific revision
kubectl rollout undo deployment/my-app --to-revision=1

# Scale
kubectl scale deployment/my-app --replicas=5
```

### Rolling Update Visualization

```
BEFORE UPDATE (3 pods, v1):
  [v1] [v1] [v1]

DURING ROLLING UPDATE (maxSurge=1, maxUnavailable=0):
  Step 1: [v1] [v1] [v1] [v2]   ← v2 added (surge)
  Step 2: [v1] [v1] [v2]         ← one v1 removed
  Step 3: [v1] [v1] [v2] [v2]   ← another v2 added
  Step 4: [v1] [v2] [v2]         ← one v1 removed
  Step 5: [v1] [v2] [v2] [v2]   ← last v2 added
  Step 6: [v2] [v2] [v2]         ← last v1 removed ✓

ZERO DOWNTIME: Traffic always served by healthy pods
```

### Interactive Lab 1.4

**Platform:** [Killercoda — Deployments](https://killercoda.com/kubernetes)

**Tasks:**

1. Create a Deployment with `nginx:1.26` and 3 replicas
2. Verify all 3 Pods are running
3. Update the image to `nginx:1.27` and watch the rollout
4. View the rollout history
5. Delete one Pod manually — watch the Deployment replace it automatically
6. Scale to 5 replicas
7. Rollback to `nginx:1.26`

### Active Recall

1. What manages Pods in a Deployment? (Hint: there's a layer between them)
2. What does `maxUnavailable: 0` in a RollingUpdate mean?
3. How do you rollback a Deployment to 2 versions ago?
4. If you delete a Pod that belongs to a Deployment, what happens?
5. What is the selector in a Deployment used for?

<details>
<summary>Reveal answers</summary>

1. A ReplicaSet (Deployment → ReplicaSet → Pods)
2. Never take a Pod out of service before a replacement is ready (zero downtime)
3. `kubectl rollout history deployment/<name>` to see revisions, then `kubectl rollout undo deployment/<name> --to-revision=<number>`
4. The ReplicaSet immediately creates a replacement to maintain the desired replica count
5. To find which Pods belong to this Deployment (matchLabels must match Pod template labels)

</details>

---

## Module 1.5: Services — Network Access to Pods

### The Problem Services Solve

```
PROBLEM: Pod IPs are ephemeral!

  Pod A (IP: 10.0.0.5)  ──► crashes ──► replaced with Pod A' (IP: 10.0.0.23)

  If Pod B hardcodes 10.0.0.5 ... it's broken now!

SOLUTION: Service = stable virtual IP + DNS name + load balancer

  Pod B ──► Service (10.96.1.100 / "my-service") ──► Pod A (any IP, always found)
```

### Service Types

```
ClusterIP (default)           NodePort                   LoadBalancer
────────────────────          ────────────────────        ────────────────────
Only inside cluster           Exposes on every Node       Cloud LB (AWS/GCP/AZ)

  ┌──────────────┐            ┌──────────────────┐         Internet
  │   CLUSTER    │            │      NODE        │            │
  │              │            │  ┌────────────┐  │            ▼
  │  [Pod]──►    │            │  │   30001    │◄─┼── User  ┌──────┐
  │  [Service]   │            │  │  NodePort  │  │         │  LB  │
  │  [Pod]◄──    │            │  └─────┬──────┘  │         └──┬───┘
  │              │            │        │          │            │
  └──────────────┘            │    [Service]      │        [Service]
  10.96.x.x (virtual)         │    [Pods]         │        [Pods]
                              └──────────────────┘
Use: internal comms           Use: dev/testing            Use: production external
```

### Service YAML

```yaml
# File: my-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector: # ← Finds Pods with these labels
    app: my-app
  ports:
    - name: http
      port: 80 # ← Port the Service listens on
      targetPort: 80 # ← Port on the Pod to forward to
      protocol: TCP
  type: ClusterIP # ← ClusterIP | NodePort | LoadBalancer
```

```yaml
# NodePort Service
spec:
  type: NodePort
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080 # ← Must be 30000-32767 (or auto-assigned)
```

### Service DNS

Kubernetes automatically creates DNS entries for Services:

```
Format: <service-name>.<namespace>.svc.cluster.local

Examples:
  my-app-service.default.svc.cluster.local
  db.production.svc.cluster.local

# From within the same namespace, short form works:
curl http://my-app-service

# From different namespace:
curl http://my-app-service.production
```

### Service Traffic Flow

```
User Request
     │
     ▼
  ┌──────────────────────────────────────────┐
  │  Service: my-app-service (ClusterIP)     │
  │  Virtual IP: 10.96.1.100:80              │
  │  Selector: app=my-app                    │
  └──────────────────┬───────────────────────┘
                     │  kube-proxy routes traffic
         ┌───────────┼───────────┐
         │           │           │  (load balanced)
         ▼           ▼           ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ Pod     │ │ Pod     │ │ Pod     │
    │app:my-  │ │app:my-  │ │app:my-  │
    │app      │ │app      │ │app      │
    └─────────┘ └─────────┘ └─────────┘
```

### Interactive Lab 1.5

**Platform:** [Killercoda](https://killercoda.com/kubernetes)

**Tasks:**

1. Create a Deployment with 3 nginx replicas
2. Create a ClusterIP Service pointing to those Pods
3. Use `kubectl exec` into another Pod and `curl` the Service by DNS name
4. Use `kubectl get endpoints` to see which Pod IPs back the Service
5. Delete one Pod — watch the endpoints auto-update
6. Change to NodePort and access from outside

```bash
# Useful Service commands
kubectl get services                  # List services
kubectl get svc                       # Shorthand
kubectl describe svc my-app-service  # Details + endpoints
kubectl get endpoints my-app-service # See which Pod IPs
```

### Active Recall

1. Why can't you hardcode Pod IP addresses?
2. What mechanism selects which Pods a Service routes to?
3. What's the DNS name format for a Service?
4. What's the NodePort range?
5. When would you use LoadBalancer vs NodePort?

<details>
<summary>Reveal answers</summary>

1. Pod IPs change every time a Pod is restarted/rescheduled
2. Label selectors (`selector:` field matching Pod labels)
3. `<service>.<namespace>.svc.cluster.local`
4. 30000–32767
5. LoadBalancer: production with cloud provider; NodePort: on-prem / development

</details>

---

## Phase 1 Review & Spaced Repetition

### The Connections Map

```
┌──────────────────────────────────────────────────────────────┐
│                    CORE PRIMITIVES MAP                        │
│                                                               │
│  DEPLOYMENT ──manages──► REPLICASET ──manages──► PODS        │
│       │                                            │          │
│   replicas:3                                  labels:         │
│   selector:                                   app: my-app    │
│   matchLabels:                                     │          │
│   app: my-app                                      │          │
│                           SERVICE ──selects──► PODS           │
│                           selector:           (via labels)    │
│                           app: my-app                         │
│                               │                               │
│                        stable IP + DNS                        │
└──────────────────────────────────────────────────────────────┘
```

### Phase 1 Brain Challenge

Build this from scratch without notes:

1. Create a namespace called `learning`
2. Deploy 3 replicas of `httpd:2.4` in that namespace with labels `app=web, env=test`
3. Expose it with a ClusterIP Service on port 80
4. Scale to 5 replicas
5. Update to `httpd:2.4.62`
6. Verify the rolling update
7. Roll back

### Spaced Review Schedule

```
✓ Day 1  (today)   — Complete Phase 1 modules
◻ Day 2            — Active recall cards only
◻ Day 5            — Redo labs without looking at notes
◻ Day 12           — Challenge exercises with new variations
◻ Day 26           — Full Phase 1 quiz + teach-it-back
```

---

# PHASE 2: Configuration & Storage

**Weeks 3-5 · ~20 hours · Goal: Manage app configuration and persistent data**

---

## Module 2.1: ConfigMaps — Externalizing Configuration

### The Twelve-Factor App Principle

> Configuration that varies between deployments (dev/staging/prod) should be stored in environment variables, not in the code.

```yaml
# File: app-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_URL: 'postgres://db:5432/myapp'
  LOG_LEVEL: 'info'
  MAX_CONNECTIONS: '100'
  # Multi-line value (like a config file)
  app.properties: |
    server.port=8080
    cache.size=1000
```

### Using ConfigMaps in Pods

```yaml
spec:
  containers:
    - name: app
      image: my-app:1.0
      # Method 1: Individual env vars
      env:
        - name: DATABASE_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: DATABASE_URL

      # Method 2: All keys as env vars
      envFrom:
        - configMapRef:
            name: app-config

      # Method 3: Mount as files
      volumeMounts:
        - name: config-volume
          mountPath: /etc/config

  volumes:
    - name: config-volume
      configMap:
        name: app-config
```

---

## Module 2.2: Secrets — Sensitive Data

> Secrets store sensitive data. **Warning:** By default, Secrets are only base64-encoded, not encrypted. Use encryption at rest + RBAC in production.

```yaml
# File: app-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  # Values must be base64 encoded: echo -n 'mysecret' | base64
  password: bXlzZWNyZXQ=
  username: YWRtaW4=
```

```bash
# Create from command line (easier, handles encoding automatically)
kubectl create secret generic db-credentials \
  --from-literal=username=admin \
  --from-literal=password=mysecret

# Create from file
kubectl create secret generic tls-certs --from-file=cert.pem --from-file=key.pem

# View (values are base64 encoded)
kubectl get secret db-credentials -o yaml

# Decode
kubectl get secret db-credentials -o jsonpath='{.data.password}' | base64 -d
```

### Using Secrets in Pods

```yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-credentials
        key: password
```

### ConfigMap vs Secret Decision Matrix

| Use Case                         | Resource                                      |
| -------------------------------- | --------------------------------------------- |
| App settings (DB URL, log level) | ConfigMap                                     |
| Passwords, API keys, tokens      | Secret                                        |
| TLS certificates                 | Secret (type: kubernetes.io/tls)              |
| Docker registry credentials      | Secret (type: kubernetes.io/dockerconfigjson) |

---

## Module 2.3: Storage — Volumes, PV, and PVC

### The Storage Problem

```
Container filesystem is EPHEMERAL
  Pod restarts ──► all data GONE

Solution: Volumes that outlive containers
```

### The Abstraction Layers

```
DEVELOPER                      ADMIN                      CLUSTER
──────────                     ──────                     ───────

PersistentVolumeClaim   ───► PersistentVolume  ───►  Actual Storage
(I need 10Gi storage)        (Here's 50Gi on        (AWS EBS / NFS /
(access: ReadWrite)           AWS EBS that's         GCE PD / etc.)
                              available)
```

```yaml
# Step 1: Admin creates a PersistentVolume (or StorageClass auto-creates)
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce # RWO = one node | RWX = many nodes | ROX = many nodes read-only
  persistentVolumeReclaimPolicy: Retain
  hostPath: # ← Local path (dev only; use proper provisioner in prod)
    path: /data/my-pv

---
# Step 2: Developer claims storage
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi

---
# Step 3: Use in Pod
spec:
  containers:
    - name: app
      volumeMounts:
        - mountPath: '/data'
          name: storage
  volumes:
    - name: storage
      persistentVolumeClaim:
        claimName: my-pvc
```

### StorageClasses — Dynamic Provisioning

```yaml
# No manual PV creation needed — storage auto-provisioned
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dynamic-pvc
spec:
  storageClassName: standard # ← References a StorageClass
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

---

## Module 2.4: StatefulSets — Stateful Applications

> Use StatefulSets for databases, queues, and any app that needs stable identity.

```
Deployment Pods:          StatefulSet Pods:
  random names              stable, ordered names
  any order                 ordered start/stop
  no stable storage         each Pod gets its own PVC

  web-7d4f9b-xkr2p          db-0
  web-7d4f9b-p8mn1    vs    db-1
  web-7d4f9b-z3qw8          db-2

  Interchangeable           Each has unique identity
```

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: db
spec:
  serviceName: 'db-headless' # ← Requires a headless service
  replicas: 3
  selector:
    matchLabels:
      app: db
  template:
    metadata:
      labels:
        app: db
    spec:
      containers:
        - name: postgres
          image: postgres:16
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates: # ← Each Pod gets its OWN PVC
    - metadata:
        name: data
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 10Gi
```

---

## Module 2.5: DaemonSets — One Pod Per Node

```
DaemonSet ensures exactly ONE Pod runs on EVERY node
(or selected nodes)

  Node 1    Node 2    Node 3    (new node added)
  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
  │  DS  │  │  DS  │  │  DS  │  │  DS  │◄── auto-scheduled
  │  Pod │  │  Pod │  │  Pod │  │  Pod │
  └──────┘  └──────┘  └──────┘  └──────┘

Use cases:
  - Log collectors (Fluentd, Filebeat)
  - Monitoring agents (node-exporter)
  - Network plugins (CNI)
  - Security agents
```

---

## Module 2.6: Jobs and CronJobs

```yaml
# Job: runs once to completion
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
spec:
  completions: 1
  parallelism: 1
  template:
    spec:
      restartPolicy: OnFailure # ← Must be OnFailure or Never (not Always)
      containers:
        - name: migration
          image: my-app:1.0
          command: ['python', 'migrate.py']

---
# CronJob: runs on a schedule
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup
spec:
  schedule: '0 2 * * *' # ← Cron syntax: every day at 2am
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: my-backup:1.0
```

### Phase 2 Active Recall

1. What's the difference between env and envFrom in a Pod spec?
2. Why are Secrets only "kind of" secure by default?
3. What does ReadWriteOnce mean for a PersistentVolume?
4. Why does a StatefulSet Pod named `db-0` have a stable name but a Deployment Pod doesn't?
5. When would you use a DaemonSet?

<details>
<summary>Reveal answers</summary>

1. `env` picks individual keys; `envFrom` injects all keys from ConfigMap/Secret as env vars
2. Base64 is encoding, not encryption. Secrets must be encrypted at rest (EncryptionConfig) and protected by RBAC
3. Can be mounted read-write by only ONE node at a time
4. StatefulSets use ordinal indices (db-0, db-1) by design; Deployments use random hashes
5. When you need exactly one Pod per node: log shippers, monitoring agents, network plugins

</details>

---

# PHASE 3: Networking Deep Dive

**Weeks 5-7 · ~15 hours · Goal: Master Kubernetes networking end-to-end**

---

## Module 3.1: Ingress — HTTP Routing

### Services vs Ingress

```
WITHOUT INGRESS (multiple NodePorts):          WITH INGRESS:

  User ──► :30080 ──► Service A (frontend)      User ──► :80/:443
  User ──► :30081 ──► Service B (api)              │
  User ──► :30082 ──► Service C (admin)             ▼ (Ingress Controller)
                                                ┌─────────────────────────┐
  Problems: many ports, no TLS, no routing      │  /frontend → Service A  │
                                                │  /api      → Service B  │
                                                │  /admin    → Service C  │
                                                └─────────────────────────┘
                                               Single entry point, path routing, TLS
```

```yaml
# File: ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx # ← Which Ingress Controller to use
  tls:
    - hosts:
        - myapp.example.com
      secretName: tls-secret # ← TLS certificate
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

### Install NGINX Ingress Controller (Minikube)

```bash
# Minikube
minikube addons enable ingress

# Verify
kubectl get pods -n ingress-nginx
```

---

## Module 3.2: Network Policies — Firewall Rules for Pods

By default, **all Pods can talk to all other Pods**. NetworkPolicies are your firewall.

```yaml
# Allow only frontend to talk to backend
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-allow-frontend
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: backend # ← This policy applies to backend pods
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend # ← Only from frontend pods
      ports:
        - protocol: TCP
          port: 8080
```

```
WITHOUT NetworkPolicy:          WITH NetworkPolicy:
  All ──► Backend ✓              Frontend ──► Backend ✓
  DB  ──► Backend ✓              DB      ──► Backend ✗ BLOCKED
  Hacker──► Backend ✓            Hacker  ──► Backend ✗ BLOCKED
```

---

## Module 3.3: Gateway API — The Future of Ingress (v1.33+)

> Gateway API graduated to stable in Kubernetes v1.28+ and is the recommended approach for new projects.

```yaml
# GatewayClass + Gateway + HTTPRoute replaces Ingress
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: my-route
spec:
  parentRefs:
    - name: my-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:
        - name: api-service
          port: 80
```

### Networking Quick Reference

```bash
# DNS debugging
kubectl run dns-test --image=busybox --rm -it -- nslookup my-service

# Network connectivity test
kubectl run net-test --image=nicolaka/netshoot --rm -it -- bash

# View network policies
kubectl get networkpolicies
kubectl describe networkpolicy my-policy
```

---

# PHASE 4: Operations & Security

**Weeks 7-10 · ~25 hours · Goal: Run Kubernetes safely and efficiently in production**

---

## Module 4.1: RBAC — Role-Based Access Control

### RBAC Model

```
┌────────────────────────────────────────────────────────────┐
│                      RBAC FLOW                              │
│                                                             │
│  WHO?              CAN DO WHAT?        ON WHAT?            │
│  Subject           Verb                Resource             │
│  ─────────         ────────────────    ─────────────────   │
│  User              get, list, watch    pods                 │
│  Group             create, update      deployments          │
│  ServiceAccount    delete              secrets              │
│                    patch               configmaps           │
│                                        *                    │
│                                                             │
│  Subject ──binds──► Role ──allows──► Resources             │
│                      │                                      │
│              RoleBinding (namespace)                        │
│              ClusterRoleBinding (cluster-wide)              │
└────────────────────────────────────────────────────────────┘
```

```yaml
# Step 1: Create a Role (namespace-scoped)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: default
rules:
  - apiGroups: [''] # "" = core API group
    resources: ['pods']
    verbs: ['get', 'list', 'watch']

---
# Step 2: Bind it to a user
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
  - kind: User
    name: alice
    apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

```bash
# Check what a user can do
kubectl auth can-i create pods --as alice
kubectl auth can-i create pods --as alice -n production
kubectl auth can-i '*' '*'                 # Am I a superuser?

# List permissions for a service account
kubectl auth can-i --list --as system:serviceaccount:default:my-sa
```

---

## Module 4.2: Resource Management

### Requests vs Limits

```
REQUESTS                           LIMITS
────────────────────               ────────────────────
Guaranteed minimum                 Hard maximum
Used for scheduling                CPU: throttled
                                   Memory: OOMKilled

  Node has 4 CPU / 8Gi RAM
  ┌──────────────────────────────────┐
  │  Pod A: request=1CPU request=2Gi │  ← Scheduler uses requests
  │  Pod B: request=2CPU request=4Gi │  ← to pack onto nodes
  │  Pod C: request=1CPU request=2Gi │
  └──────────────────────────────────┘
    Total: 4CPU / 8Gi = node is "full"
```

```yaml
resources:
  requests:
    memory: '256Mi' # ← Guaranteed, used for scheduling
    cpu: '250m' # ← 250 millicores = 0.25 CPU
  limits:
    memory: '512Mi' # ← OOMKill if exceeded
    cpu: '500m' # ← Throttled if exceeded
```

### QoS Classes (automatic, based on requests/limits)

| QoS Class      | Condition                                     | Eviction Priority |
| -------------- | --------------------------------------------- | ----------------- |
| **Guaranteed** | limits == requests for all containers         | Last evicted      |
| **Burstable**  | At least one container has requests != limits | Medium            |
| **BestEffort** | No requests or limits set                     | First evicted     |

```bash
# Check QoS class
kubectl get pod my-pod -o jsonpath='{.status.qosClass}'
```

---

## Module 4.3: Health Probes

```yaml
spec:
  containers:
    - name: app
      # Liveness: is the app alive? Restart if it fails
      livenessProbe:
        httpGet:
          path: /health
          port: 8080
        initialDelaySeconds: 10 # Wait before first check
        periodSeconds: 10 # Check every 10s
        failureThreshold: 3 # Restart after 3 failures

      # Readiness: is the app ready for traffic? Remove from Service if fails
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
        initialDelaySeconds: 5
        periodSeconds: 5

      # Startup: allow slow-starting containers
      startupProbe:
        httpGet:
          path: /started
          port: 8080
        failureThreshold: 30 # 30 × 10s = 5min to start
        periodSeconds: 10
```

### Probe Decision Tree

```
App is slow to start?    ──YES──► Use startupProbe
       │ NO
       ▼
App can get into         ──YES──► Use livenessProbe
deadlock/bad state?              (restart to fix)
       │ NO
       ▼
App needs warmup         ──YES──► Use readinessProbe
before taking traffic?           (keep alive but no traffic)
```

---

## Module 4.4: Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70 # Scale when CPU > 70%
```

```bash
# Create HPA imperatively
kubectl autoscale deployment my-app --cpu-percent=70 --min=2 --max=10

# View HPA status
kubectl get hpa

# Load test to trigger scaling
kubectl run load --image=busybox --rm -it -- \
  /bin/sh -c "while true; do wget -q -O- http://my-app-service; done"
```

---

## Module 4.5: Helm — Kubernetes Package Manager

```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Add a chart repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Search for charts
helm search repo bitnami/nginx
helm search hub wordpress

# Install a chart
helm install my-nginx bitnami/nginx
helm install my-nginx bitnami/nginx --set replicaCount=3
helm install my-nginx bitnami/nginx -f custom-values.yaml

# List releases
helm list

# Upgrade
helm upgrade my-nginx bitnami/nginx --set replicaCount=5

# Rollback
helm rollback my-nginx 1

# Uninstall
helm uninstall my-nginx

# Template (dry run, see generated YAML)
helm template my-nginx bitnami/nginx
```

### Phase 4 Active Recall

1. What is the difference between Role and ClusterRole?
2. What happens to a Pod if it exceeds its memory limit?
3. What's the difference between liveness and readiness probes?
4. What QoS class does a Pod with no resource limits get?
5. What command checks what actions a user can perform?

<details>
<summary>Reveal answers</summary>

1. Role is namespace-scoped; ClusterRole applies cluster-wide
2. It is OOMKilled (Out of Memory Killed) and restarted according to restart policy
3. Liveness: restarts the container if it fails. Readiness: removes Pod from Service endpoints (no traffic) but doesn't restart
4. BestEffort — first to be evicted under pressure
5. `kubectl auth can-i --list --as <user>`

</details>

---

# PHASE 5: Advanced Topics

**Weeks 10-16 · ~40 hours · Goal: Production-ready Kubernetes**

---

## Module 5.1: Cluster Setup with kubeadm

```bash
# On all nodes: install container runtime (containerd)
apt-get install -y containerd
systemctl enable --now containerd

# Install kubeadm, kubelet, kubectl
apt-get install -y kubeadm kubelet kubectl
apt-mark hold kubeadm kubelet kubectl

# On control plane node only:
kubeadm init \
  --pod-network-cidr=192.168.0.0/16 \
  --control-plane-endpoint=<lb-ip>:6443

# Set up kubectl
mkdir -p $HOME/.kube
cp /etc/kubernetes/admin.conf $HOME/.kube/config

# Install CNI (e.g., Calico)
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.29.0/manifests/calico.yaml

# On worker nodes (use the token from kubeadm init output):
kubeadm join <control-plane-ip>:6443 \
  --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash>

# Verify cluster
kubectl get nodes
```

### etcd Backup (Critical for Production)

```bash
# Install etcdctl
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%F).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Verify backup
ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-$(date +%F).db
```

---

## Module 5.2: Monitoring with Prometheus and Grafana

```bash
# Install Prometheus + Grafana using Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
# Default: admin / prom-operator

# Key Grafana dashboards to know:
# - Kubernetes / Cluster (ID: 7249) — overall cluster health
# - Kubernetes / Nodes (ID: 1860)   — node metrics
# - Kubernetes / Pods (ID: 6781)    — pod details
```

### Key Metrics to Monitor

| Metric                                          | Alert If                 |
| ----------------------------------------------- | ------------------------ |
| `container_memory_working_set_bytes`            | > 90% of limit           |
| `container_cpu_usage_seconds_total`             | Sustained > 90% of limit |
| `kube_pod_container_status_restarts_total`      | > 5 in 1h                |
| `kube_node_status_condition{condition="Ready"}` | == 0                     |
| `etcd_disk_wal_fsync_duration_seconds`          | p99 > 10ms               |

---

## Module 5.3: GitOps with ArgoCD

### GitOps Principle

```
Git Repository           ArgoCD               Kubernetes Cluster
──────────────           ──────               ─────────────────
  YAML manifests  ──►  polls for   ──►  applies desired state
  (desired state)      changes          automatically

  PR merged ──► ArgoCD detects ──► Syncs cluster ──► Done

  Benefits: Git = audit log, PR reviews, easy rollback, no kubectl access needed
```

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get admin password
kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath="{.data.password}" | base64 -d

# Create an application
argocd app create my-app \
  --repo https://github.com/my-org/my-app \
  --path kubernetes/ \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace default \
  --sync-policy automated
```

---

## Module 5.4: Custom Resource Definitions (CRDs) and Operators

### The Operator Pattern

```
BUILT-IN RESOURCES          CUSTOM RESOURCES (via CRD)
──────────────────          ──────────────────────────

Deployment                  PostgreSQLCluster
Service             ──►     RedisReplication
ConfigMap                   KafkaTopic
                            Certificate (cert-manager)

Controller handles          Custom Controller (Operator)
built-in reconciliation     handles YOUR reconciliation
```

```yaml
# Define a custom resource
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: myapps.example.com
spec:
  group: example.com
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                replicas:
                  type: integer
  scope: Namespaced
  names:
    plural: myapps
    singular: myapp
    kind: MyApp
```

---

## Module 5.5: Autoscaling — HPA, VPA, and KEDA

### Autoscaler Comparison

```
HPA (Horizontal)             VPA (Vertical)              KEDA
────────────────             ──────────────              ─────
More/fewer pods              Bigger/smaller pods         Event-driven scaling

  [Pod][Pod] ──► [Pod][Pod]     [Pod: 1CPU] ──► [Pod: 2CPU]     Queue depth,
               [Pod][Pod]                                        HTTP requests,
                                                                 cron schedule,
  CPU/Memory/Custom metrics   CPU/Memory based            custom metrics

  Great for: stateless apps   Great for: stateful,        Great for: serverless,
             web servers      batch, databases             queue processors
```

```bash
# VPA Installation
helm repo add fairwinds-stable https://charts.fairwinds.com/stable
helm install vpa fairwinds-stable/vpa --namespace vpa --create-namespace

# KEDA Installation
helm repo add kedacore https://kedacore.github.io/charts
helm install keda kedacore/keda --namespace keda --create-namespace
```

---

## Module 5.6: Production Best Practices

### The Production Checklist

```
WORKLOADS
□ All Pods have resource requests and limits set
□ Liveness + readiness probes configured
□ replicas >= 2 for all critical workloads
□ Pod Disruption Budgets defined
□ Pod Anti-Affinity to spread across nodes/zones

SECURITY
□ Non-root containers (securityContext.runAsNonRoot: true)
□ Read-only root filesystem where possible
□ No privileged containers
□ RBAC principle of least privilege
□ Secrets encrypted at rest
□ Network Policies defined (deny-all default, allow specifically)
□ Image tags pinned (no :latest)
□ Image scanning in CI/CD pipeline

NETWORKING
□ Ingress with TLS termination
□ Network Policies for pod-to-pod traffic control
□ Resource quotas per namespace

OPERATIONS
□ etcd backups automated and tested
□ Monitoring: Prometheus + Grafana
□ Alerting configured
□ Log aggregation (Fluentd/Loki)
□ Upgrade plan (Kubernetes N-2 support policy)
```

### Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 2 # At least 2 pods always available during disruptions
  # OR: maxUnavailable: 1  # At most 1 pod unavailable
  selector:
    matchLabels:
      app: my-app
```

### Pod Security Context

```yaml
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
  containers:
    - name: app
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ['ALL']
```

### Phase 5 Active Recall

1. What does `kubeadm init` do and what does it output that you need for worker nodes?
2. In GitOps, when you merge a PR with updated YAML, what happens automatically?
3. What is an Operator vs a regular controller?
4. What is a PodDisruptionBudget and when is it applied?
5. Why should you never use `image: myapp:latest` in production?

<details>
<summary>Reveal answers</summary>

1. Initializes the control plane; outputs a `kubeadm join` command with a token and CA hash for worker nodes
2. ArgoCD detects the change, syncs the cluster to match the desired state in Git
3. An Operator = a Custom Resource Definition + a custom controller that automates domain-specific operational knowledge (e.g., automatic failover for a database)
4. Guarantees a minimum number of Pods remain available during voluntary disruptions (node drains, upgrades)
5. `latest` is unpredictable: deployments become non-reproducible, updates happen silently, rollbacks are ambiguous

</details>

---

# PHASE 6: Certification Prep

**Weeks 17+ · 40-100 hours**

---

## The Certification Ladder

```
Entry Level                  Application Dev            Administration
──────────────────           ────────────────           ──────────────────
KCNA                         CKAD                       CKA
$250 · 75% passing           $395 · 66% passing         $445 · 66% passing
Multiple choice              Performance-based          Performance-based
90 min                       2 hours                    2 hours

Cloud Native               App lifecycle, Jobs,         Cluster setup,
fundamentals,              Config, Services,             RBAC, etcd,
CNCF ecosystem             Multi-container,              Networking,
                           Observability                 Troubleshooting
```

> All exams: open-book (kubernetes.io allowed), 1 free retake, remote proctored

---

## KCNA Prep

**Domains:**

- Kubernetes Fundamentals (46%)
- Container Orchestration (22%)
- Cloud Native Architecture (16%)
- Cloud Native Observability (8%)
- Cloud Native Application Delivery (8%)

**Free Resources:**

- [CNCF Curriculum](https://github.com/cncf/curriculum)
- [KodeKloud Free Kubernetes for Beginners](https://kodekloud.com/free-courses)
- [Coursera KCNA prep (free audit)](https://www.coursera.org/learn/pearson-kubernetes-and-cloud-native-associate-kcna-complete-course)

---

## CKA Exam Prep

### High-Yield Topics

| Domain                 | Weight | Focus                                     |
| ---------------------- | ------ | ----------------------------------------- |
| Storage                | 10%    | PV, PVC, StorageClass, access modes       |
| Troubleshooting        | 30%    | Debug pods, nodes, cluster components     |
| Workloads & Scheduling | 15%    | Deployments, DaemonSets, affinity, taints |
| Cluster Architecture   | 25%    | kubeadm, etcd backup/restore, RBAC        |
| Services & Networking  | 20%    | Services, Ingress, NetworkPolicy, CoreDNS |

### Exam Environment Tips

```bash
# ALWAYS set these at the start of the exam
alias k=kubectl
export do="--dry-run=client -o yaml"  # Use: k run nginx --image=nginx $do

# Generate YAMLs fast
k create deployment my-dep --image=nginx $do > dep.yaml

# Switch contexts (you'll get multiple clusters)
kubectl config use-context <context-name>

# Time-saving: use --record is deprecated; use labels instead
# Know kubectl explain deeply
kubectl explain pod.spec.containers.resources

# etcd backup (will be tested!)
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd.db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

### CKA Practice Resources

- [killer.sh](https://killer.sh) — 2 free exam simulations with purchase (most accurate)
- [Killercoda CKA Scenarios](https://killercoda.com/killer-shell-cka)
- [TechiesCamp CKA Guide](https://github.com/techiescamp/cka-certification-guide)
- [DevOpsCube CKA Guide](https://devopscube.com/kubernetes-tutorials-beginners/)

---

## CKAD Exam Prep

### High-Yield Topics

| Domain                    | Weight | Focus                                           |
| ------------------------- | ------ | ----------------------------------------------- |
| Application Design        | 20%    | Multi-container patterns, init containers, CRDs |
| Application Deployment    | 20%    | Deployments, Helm, rolling updates              |
| Application Observability | 15%    | Probes, logging, debugging                      |
| Application Environment   | 25%    | ConfigMaps, Secrets, SA, resource management    |
| Services & Networking     | 20%    | Services, Ingress, NetworkPolicy                |

### Multi-Container Patterns (CKAD Focus)

```
SIDECAR PATTERN           ADAPTER PATTERN           AMBASSADOR PATTERN
────────────────          ───────────────           ──────────────────
App + helper              App + transformer          App + proxy

┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│ App Container│          │ App Container│          │ App Container│
│              │◄──log──  │              │  raw──►  │              │──►proxy──► external
│ Log Shipper  │          │ Adapter      │  ──►norm │ Ambassador   │
└──────────────┘          └──────────────┘          └──────────────┘
Example: Fluentd          Example: format logs      Example: service mesh
         alongside app    for monitoring system     proxy sidecar
```

```yaml
# Init Container example (CKAD must-know)
spec:
  initContainers:
    - name: wait-for-db
      image: busybox
      command: ['sh', '-c', 'until nc -z db-service 5432; do sleep 2; done']
  containers:
    - name: app
      image: my-app:1.0
```

### CKAD Practice Resources

- [CKAD Exercises by dgkanatsios](https://github.com/dgkanatsios/CKAD-exercises)
- [Killercoda CKAD Scenarios](https://killercoda.com/killer-shell-ckad)
- [KodeKloud CKAD Course](https://kodekloud.com/free-courses)

---

# Appendix A: kubectl Quick Reference

```bash
# RESOURCE SHORTNAMES
po    = pods
svc   = services
deploy = deployments
rs    = replicasets
ds    = daemonsets
sts   = statefulsets
cm    = configmaps
ns    = namespaces
pv    = persistentvolumes
pvc   = persistentvolumeclaims
sa    = serviceaccounts
no    = nodes
ing   = ingresses
netpol = networkpolicies
hpa   = horizontalpodautoscalers
crd   = customresourcedefinitions

# JSONPATH EXAMPLES
kubectl get pod my-pod -o jsonpath='{.status.podIP}'
kubectl get nodes -o jsonpath='{.items[*].metadata.name}'
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'

# SORTING
kubectl get pods --sort-by='.metadata.creationTimestamp'
kubectl get pods --sort-by='.status.containerStatuses[0].restartCount'

# FIELD SELECTORS
kubectl get pods --field-selector status.phase=Running
kubectl get pods --field-selector spec.nodeName=worker-1
```

---

# Appendix B: Troubleshooting Playbook

## Pod Not Starting

```
kubectl get pod <name>        # Check phase and STATUS column
kubectl describe pod <name>   # Events section at bottom is KEY

Common STATUS issues:
  Pending          ──► kubectl describe → look at Events for scheduling issues
  ImagePullBackOff ──► wrong image name or registry auth needed
  CrashLoopBackOff ──► kubectl logs <pod> --previous  (app is crashing)
  OOMKilled        ──► increase memory limits
  Error            ──► kubectl logs <pod> for app error
  Terminating      ──► kubectl delete pod <name> --force --grace-period=0
```

## Node Not Ready

```bash
kubectl describe node <node-name>    # Check Conditions section
kubectl get events --field-selector involvedObject.name=<node>

# SSH to node and check:
systemctl status kubelet
journalctl -u kubelet -n 50
df -h                               # Disk pressure?
free -h                             # Memory pressure?
```

## Service Not Routing

```bash
# 1. Check Service selector matches Pod labels
kubectl get svc my-svc -o yaml | grep -A3 selector
kubectl get pods --show-labels | grep expected-label

# 2. Check endpoints
kubectl get endpoints my-svc        # Should show Pod IPs, not <none>

# 3. Test DNS from inside cluster
kubectl run test --image=busybox --rm -it -- nslookup my-svc

# 4. Test connectivity
kubectl run test --image=nicolaka/netshoot --rm -it -- curl http://my-svc
```

## etcd Restore

```bash
# Restore etcd from backup
ETCDCTL_API=3 etcdctl snapshot restore /backup/etcd.db \
  --data-dir /var/lib/etcd-restore \
  --name master \
  --initial-cluster master=https://127.0.0.1:2380 \
  --initial-cluster-token etcd-cluster-1 \
  --initial-advertise-peer-urls https://127.0.0.1:2380

# Update etcd manifest to use new data dir
sudo vim /etc/kubernetes/manifests/etcd.yaml
# Change: --data-dir=/var/lib/etcd → --data-dir=/var/lib/etcd-restore
```

---

# Appendix C: Spaced Repetition Master Schedule

```
Week 1:  Phase 0 + Module 1.1-1.2
Week 2:  Module 1.3-1.5  |  Review Phase 0
Week 3:  Phase 2 (Modules 2.1-2.3)  |  Review Phase 1
Week 4:  Phase 2 (Modules 2.4-2.6)  |  Review Phase 1 again
Week 5:  Phase 3 start  |  Review Phase 2
Week 6:  Phase 3 finish  |  Review Phase 1 + 2 combined
Week 7:  Phase 4 (RBAC, Resources)  |  Review Phase 3
Week 8:  Phase 4 (Probes, HPA, Helm)  |  Review all previous
Week 9:  Phase 5 start (kubeadm, monitoring)  |  Review Phase 4
Week 10: Phase 5 (GitOps, CRDs)  |  Review Phase 3+4
Week 11: Phase 5 (Production practices)  |  Full review pass
Week 12: First mock exam (Killercoda CKA)
Week 13: Identify weak areas, deep-dive
Week 14: Second mock exam (killer.sh)
Week 15: Targeted review of weak areas
Week 16: Final mock exam + rest before cert
```

---

# Appendix D: Visual Mind Maps

## Workload Resources

```
                         ┌──────────────────────┐
                         │    WORKLOAD TYPES     │
                         └──────────┬───────────┘
               ┌─────────┬──────────┼──────────┬─────────┐
               │         │          │           │         │
           Deployment  StatefulSet DaemonSet   Job    CronJob
               │         │          │           │         │
           replicas   ordered      1/node    one-shot  scheduled
           rolling    stable       node-     completion one-shot
           updates    names        logging   batch     jobs
           stateless  databases    agents    migration recurring
```

## Storage Hierarchy

```
StorageClass ──► (dynamic) ──► PersistentVolume ──► PersistentVolumeClaim ──► Pod Volume
                │                    │                      │
          provisioner           capacity              claimed by Pod
          parameters           accessModes            specific size
                               reclaimPolicy
```

## RBAC Hierarchy

```
ClusterRole ──────────────────────────────────────► Cluster-wide access
     │
     └─► ClusterRoleBinding ──► Subject (User/Group/ServiceAccount)

Role ──────────────────────────────────────────────► Namespace-scoped
     │
     └─► RoleBinding ──────────► Subject
```

---

# Appendix E: Validated Learning Resources (March 2026)

## Tier 1 — Official + CNCF Backed

| Resource                       | URL                          | Format          | Cost         |
| ------------------------------ | ---------------------------- | --------------- | ------------ |
| Kubernetes Official Tutorials  | kubernetes.io/docs/tutorials | Interactive     | Free         |
| CNCF Top 28 K8s Resources 2026 | cncf.io/blog/2026/01/19/...  | Guide           | Free         |
| LFS158x (Linux Foundation)     | edx.org - Linux Foundation   | Video + Labs    | Free audit   |
| CNCF Training Hub              | cncf.io/training             | Courses + Certs | Free courses |

## Tier 2 — Interactive Labs (Verified Active March 2026)

| Platform        | URL                                              | Best For                                             |
| --------------- | ------------------------------------------------ | ---------------------------------------------------- |
| Killercoda      | killercoda.com/kubernetes                        | All levels, no setup                                 |
| Killercoda CKA  | killercoda.com/killer-shell-cka                  | CKA prep                                             |
| Killercoda CKAD | killercoda.com/killer-shell-ckad                 | CKAD prep                                            |
| iximiuz Labs    | labs.iximiuz.com/playgrounds?category=kubernetes | Internals deep-dive                                  |
| KodeKloud Free  | kodekloud.com/free-courses                       | Structured beginner path                             |
| killer.sh       | killer.sh                                        | Exam simulations (paid, included with cert purchase) |

## Tier 3 — Deep Learning

| Resource                    | URL                                                      | Format   | Level                 |
| --------------------------- | -------------------------------------------------------- | -------- | --------------------- |
| University of Helsinki MOOC | courses.mooc.fi/org/uh-cs/courses/devops-with-kubernetes | MOOC     | Intermediate-Advanced |
| DevOpsCube Tutorials        | devopscube.com/kubernetes-tutorials-beginners            | Articles | All                   |
| CKAD Exercises              | github.com/dgkanatsios/CKAD-exercises                    | GitHub   | Advanced              |
| TechiesCamp CKA Guide       | github.com/techiescamp/cka-certification-guide           | GitHub   | Advanced              |

---

> **Sources verified March 22, 2026** · Kubernetes v1.35 (Timbernetes) · CNCF Annual Survey 2025
> Build on: [kubernetes.io](https://kubernetes.io) · [cncf.io](https://cncf.io) · [killercoda.com](https://killercoda.com) · [iximiuz.com](https://labs.iximiuz.com)
