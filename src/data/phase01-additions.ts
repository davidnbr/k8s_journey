import type { ClusterState } from '@/lib/types'

const emptyCluster: ClusterState = {
  pods: [],
  services: [],
  deployments: [],
  namespaces: ['default'],
  events: [],
}

// ---------------------------------------------------------------------------
// PHASE 0 ADDITIONS
// ---------------------------------------------------------------------------

export const phase0Additions = [
  {
    id: 'p0-m0',
    slug: 'local-setup',
    title: 'Set Up Your Local Cluster',
    description:
      'Install kubectl and minikube, spin up a local single-node Kubernetes cluster, and verify everything is healthy before touching any other module.',
    duration: 30,
    difficulty: 'beginner' as const,
    learningObjectives: [
      'Install kubectl and verify client version',
      'Install minikube and understand what it runs under the hood',
      'Start a local cluster with defined CPU and memory limits',
      'Confirm the control plane and kubelet are healthy',
      'Inspect cluster nodes and understand their roles',
      'Enable add-ons that are used throughout all other modules',
    ],
    keyConcepts: [
      'kubectl — the CLI client that speaks to the Kubernetes API server',
      'minikube — a local driver that runs a full K8s cluster inside a VM or container',
      'kubeconfig — the file (~/.kube/config) that stores cluster credentials and context',
      'context — a named combination of cluster + user + namespace in kubeconfig',
      'node — a machine (VM or physical) that runs pods',
      'add-ons — optional cluster components packaged for minikube (metrics-server, ingress, dashboard)',
    ],
    practicePrompts: [
      'Run `kubectl config view` and identify the current context, cluster, and user.',
      'Run `kubectl get nodes -o wide` and explain each column.',
      'SSH into the minikube node with `minikube ssh` and run `ps aux | grep kubelet`.',
      'Check what add-ons are currently enabled with `minikube addons list`.',
    ],
    masteryChecks: [
      'I can install kubectl on any Linux/macOS machine from scratch.',
      'I understand that minikube is not for production — it is a local learning tool.',
      'I know where kubeconfig lives and what it contains.',
      'I can start a cluster with explicit resource constraints.',
      'I can verify a cluster is healthy using both kubectl and minikube commands.',
      'I have metrics-server and ingress enabled and know why they are needed later.',
    ],
    theory: `## Brain Warm-Up

Before you write a single YAML file, you need a running cluster.
Kubernetes is a distributed system — even locally, it runs a control plane
(API server, scheduler, etcd, controller manager) and at least one worker node.
minikube packages all of this into a single VM or Docker container on your laptop.

kubectl is just an HTTP client. Every command it runs translates to a REST call
against the Kubernetes API server. The API server's address and credentials are
stored in ~/.kube/config (the "kubeconfig" file).

---

## Architecture of a minikube cluster

\`\`\`
Your Laptop
│
├── kubectl  ──────────► ~/.kube/config  (cluster credentials + context)
│                               │
│                               ▼
│                     minikube VM / container
│                     ┌─────────────────────────────────┐
│                     │  CONTROL PLANE                  │
│                     │  ┌──────────────────────────┐   │
│                     │  │  kube-apiserver          │   │
│                     │  │  kube-scheduler          │   │
│                     │  │  kube-controller-manager │   │
│                     │  │  etcd                    │   │
│                     │  └──────────────────────────┘   │
│                     │                                 │
│                     │  WORKER NODE (same machine)     │
│                     │  ┌──────────────────────────┐   │
│                     │  │  kubelet                 │   │
│                     │  │  kube-proxy              │   │
│                     │  │  container runtime       │   │
│                     │  └──────────────────────────┘   │
│                     └─────────────────────────────────┘
└──────────────────────────────────────────────────────────
\`\`\`

---

## kubectl vs minikube — when to use which

| Task                         | Command to use              |
|------------------------------|-----------------------------|
| Talk to the cluster          | kubectl                     |
| Manage the minikube VM       | minikube                    |
| Start / stop the cluster     | minikube start / stop       |
| SSH into the node            | minikube ssh                |
| Expose a service locally     | minikube service <name>     |
| Enable/list add-ons          | minikube addons             |
| Get cluster IP               | minikube ip                 |

---

## Resource limits matter

minikube will use as much CPU/RAM as you let it.
For the labs in this course, 2 vCPUs and 4 GiB RAM is the recommended minimum.
Use \`--cpus=2 --memory=4096\` every time you start a fresh cluster so behaviour
is reproducible regardless of your hardware.

---

## Add-ons used in later modules

- **metrics-server** — required for \`kubectl top nodes\` and \`kubectl top pods\` (HPA module)
- **ingress** — required for the Ingress module (Phase 3)
- **dashboard** — optional but useful for visual exploration

Enable them now so they are already running when you need them.`,
    labSteps: [
      {
        id: 'p0-m0-s1',
        title: 'Install kubectl',
        instruction:
          'Install the kubectl binary for your platform. On Linux use the official release URL; on macOS use Homebrew. After installing, verify the client version.',
        command: 'kubectl version --client',
        output: [
          'Client Version: v1.30.0',
          'Kustomize Version: v5.0.4-0.20230601165947-6ce0bf390ce3',
        ],
        explanation:
          'kubectl is the CLI that sends commands to the Kubernetes API server. "--client" prints only the local binary version without contacting a cluster, which is useful to confirm installation succeeded before a cluster exists.',
        clusterState: emptyCluster,
        tip: 'On Linux: curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/',
      },
      {
        id: 'p0-m0-s2',
        title: 'Install minikube',
        instruction:
          'Download and install the minikube binary. On Linux use the official release URL; on macOS use Homebrew. Verify the installed version.',
        command: 'minikube version',
        output: [
          'minikube version: v1.33.0',
          'commit: 86fc9d54fca63f295d8737c8eacdbb7987e89c67',
        ],
        explanation:
          'minikube packages a complete Kubernetes cluster into a single VM or Docker container. It is not production-grade but gives you a fully-featured API server, scheduler, and controller manager locally.',
        clusterState: emptyCluster,
        tip: 'On Linux: curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && sudo install minikube-linux-amd64 /usr/local/bin/minikube',
      },
      {
        id: 'p0-m0-s3',
        title: 'Start the minikube cluster',
        instruction:
          'Start minikube with explicit CPU and memory limits. This ensures reproducible behaviour across different machines. The first start will download a base image — this can take a few minutes.',
        command: 'minikube start --cpus=2 --memory=4096',
        output: [
          '* minikube v1.33.0 on Ubuntu 22.04',
          '* Automatically selected the docker driver. Other choices: kvm2, ssh',
          '* Starting "minikube" primary control-plane node in "minikube" cluster',
          '* Pulling base image v0.0.43 ...',
          '* Creating docker container (CPUs=2, Memory=4096MB) ...',
          '* Preparing Kubernetes v1.30.0 on Docker 26.0.1 ...',
          '  - Generating certificates and keys ...',
          '  - Booting up control plane ...',
          '  - Configuring RBAC rules ...',
          '* Configuring bridge CNI (Container Networking Interface) ...',
          '* Verifying Kubernetes components...',
          '  - Using image gcr.io/k8s-minikube/storage-provisioner:v5',
          '* Enabled addons: storage-provisioner, default-storageclass',
          '* Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default',
        ],
        explanation:
          'minikube writes cluster credentials to ~/.kube/config and sets the current context to "minikube". From this point kubectl knows which cluster to talk to.',
        clusterState: {
          pods: [],
          services: [
            {
              id: 'svc-kubernetes',
              name: 'kubernetes',
              namespace: 'default',
              type: 'ClusterIP',
              selector: {},
              port: 443,
              clusterIP: '10.96.0.1',
            },
          ],
          deployments: [],
          namespaces: ['default', 'kube-node-lease', 'kube-public', 'kube-system'],
          events: ['Node minikube became Ready'],
        },
        tip: 'If the docker driver is not available minikube will try VirtualBox or HyperKit. Run `minikube start --driver=docker` to be explicit.',
      },
      {
        id: 'p0-m0-s4',
        title: 'Verify the cluster is reachable',
        instruction:
          'Ask kubectl for the addresses of the control-plane and CoreDNS. This confirms that the API server is listening and kubectl can authenticate.',
        command: 'kubectl cluster-info',
        output: [
          'Kubernetes control plane is running at https://192.168.49.2:8443',
          'CoreDNS is running at https://192.168.49.2:8443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy',
          '',
          'To further debug and diagnose cluster problems, use "kubectl cluster-info dump".',
        ],
        explanation:
          'The control-plane URL is the address of the API server. CoreDNS provides in-cluster DNS resolution for Service discovery. Both being listed means the cluster is healthy.',
        clusterState: {
          pods: [],
          services: [
            {
              id: 'svc-kubernetes',
              name: 'kubernetes',
              namespace: 'default',
              type: 'ClusterIP',
              selector: {},
              port: 443,
              clusterIP: '10.96.0.1',
            },
          ],
          deployments: [],
          namespaces: ['default', 'kube-node-lease', 'kube-public', 'kube-system'],
          events: [],
        },
        tip: 'If this command hangs, the API server is not reachable. Run `minikube status` to diagnose.',
      },
      {
        id: 'p0-m0-s5',
        title: 'Inspect the nodes',
        instruction:
          'List all nodes in the cluster. With minikube there is one node that acts as both control-plane and worker.',
        command: 'kubectl get nodes -o wide',
        output: [
          'NAME       STATUS   ROLES           AGE   VERSION   INTERNAL-IP    EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION      CONTAINER-RUNTIME',
          'minikube   Ready    control-plane   2m    v1.30.0   192.168.49.2   <none>        Ubuntu 22.04.4 LTS   5.15.0-107-generic  docker://26.0.1',
        ],
        explanation:
          'STATUS=Ready means the kubelet on this node is healthy and the node can accept pods. ROLES=control-plane means this node runs the API server and scheduler. In a real cluster you would see separate worker nodes with ROLES=<none>.',
        clusterState: {
          pods: [],
          services: [
            {
              id: 'svc-kubernetes',
              name: 'kubernetes',
              namespace: 'default',
              type: 'ClusterIP',
              selector: {},
              port: 443,
              clusterIP: '10.96.0.1',
            },
          ],
          deployments: [],
          namespaces: ['default', 'kube-node-lease', 'kube-public', 'kube-system'],
          events: [],
        },
        tip: 'The -o wide flag shows extra columns: internal IP, OS image, and container runtime. Useful for diagnosing node-level problems.',
      },
      {
        id: 'p0-m0-s6',
        title: 'Enable useful add-ons',
        instruction:
          'Enable the metrics-server add-on (needed for CPU/memory metrics and the HPA module) and the ingress add-on (needed for the Ingress module).',
        command: 'minikube addons enable metrics-server && minikube addons enable ingress',
        output: [
          '* metrics-server is an addon maintained by Kubernetes. For any concerns contact minikube on GitHub.',
          'You can view the raw url at: https://raw.githubusercontent.com/kubernetes/minikube/master/deploy/addons/metrics-server/metrics-server.yaml',
          '* The "metrics-server" addon is enabled',
          '* ingress is an addon maintained by the Kubernetes community. For any concerns contact minikube on GitHub.',
          '* The "ingress" addon is enabled',
        ],
        explanation:
          'Add-ons are pre-packaged Kubernetes components that minikube can deploy into your cluster. metrics-server scrapes CPU/memory from kubelets and exposes them via the Metrics API. The ingress add-on deploys the NGINX Ingress Controller into the ingress-nginx namespace.',
        clusterState: {
          pods: [
            {
              id: 'pod-metrics-server',
              name: 'metrics-server-7c66d45ddc-9tqkg',
              namespace: 'kube-system',
              node: 'node-1',
              status: 'Running',
              labels: { 'k8s-app': 'metrics-server' },
              image: 'registry.k8s.io/metrics-server/metrics-server:v0.7.1',
              restarts: 0,
            },
          ],
          services: [
            {
              id: 'svc-kubernetes',
              name: 'kubernetes',
              namespace: 'default',
              type: 'ClusterIP',
              selector: {},
              port: 443,
              clusterIP: '10.96.0.1',
            },
            {
              id: 'svc-metrics-server',
              name: 'metrics-server',
              namespace: 'kube-system',
              type: 'ClusterIP',
              selector: { 'k8s-app': 'metrics-server' },
              port: 443,
              clusterIP: '10.96.100.10',
            },
          ],
          deployments: [
            {
              id: 'deploy-metrics-server',
              name: 'metrics-server',
              namespace: 'kube-system',
              replicas: 1,
              availableReplicas: 1,
              image: 'registry.k8s.io/metrics-server/metrics-server:v0.7.1',
            },
          ],
          namespaces: ['default', 'ingress-nginx', 'kube-node-lease', 'kube-public', 'kube-system'],
          events: ['metrics-server Deployment scaled to 1', 'ingress-nginx-controller started'],
        },
        tip: 'Verify add-ons are running: `minikube addons list | grep enabled` and `kubectl get pods -n kube-system | grep metrics`.',
      },
    ],
    quiz: [
      {
        id: 'p0-m0-q1',
        question: 'What file does kubectl read to know which cluster to connect to?',
        options: [
          '/etc/kubernetes/admin.conf',
          '~/.kube/config',
          '/var/lib/kubelet/config.yaml',
          '~/.minikube/config',
        ],
        answer: 1,
        explanation:
          'kubectl reads ~/.kube/config by default. This file contains clusters, users, and contexts. You can override it with the KUBECONFIG environment variable or the --kubeconfig flag.',
      },
      {
        id: 'p0-m0-q2',
        question:
          'You run `kubectl cluster-info` and the command hangs indefinitely. What is the most likely cause?',
        options: [
          'kubectl is not installed correctly',
          'The API server is not reachable from your machine',
          'The cluster has no nodes',
          'You need to run as root',
        ],
        answer: 1,
        explanation:
          'kubectl cluster-info makes an HTTP request to the API server address stored in kubeconfig. If that address is unreachable (minikube is stopped, firewall, wrong IP) the request hangs. Run `minikube status` to diagnose.',
      },
      {
        id: 'p0-m0-q3',
        question: 'In the output of `kubectl get nodes`, what does STATUS=Ready mean?',
        options: [
          'All pods on the node are in Running state',
          'The kubelet is posting healthy heartbeats to the API server',
          'The node has enough free CPU and memory for new pods',
          'The node is a control-plane node',
        ],
        answer: 1,
        explanation:
          'Ready is a node condition. It means the kubelet is healthy and the node is able to accept pods. It does NOT mean existing pods are healthy or that there is free capacity — those are separate concerns.',
      },
      {
        id: 'p0-m0-q4',
        question: 'Which minikube command lets you open an interactive shell inside the minikube node?',
        options: [
          'minikube shell',
          'minikube exec',
          'minikube ssh',
          'kubectl exec -it node/minikube -- bash',
        ],
        answer: 2,
        explanation:
          '`minikube ssh` opens an SSH session into the minikube VM or container. `kubectl exec` works on pods, not nodes. Nodes are not accessible via kubectl exec directly.',
      },
      {
        id: 'p0-m0-q5',
        question: 'Why is `--cpus=2 --memory=4096` recommended when starting minikube?',
        options: [
          'Kubernetes requires exactly those values to boot',
          'It ensures reproducible resource limits independent of host hardware',
          'Lower values will cause kubectl to fail',
          'minikube ignores these flags anyway',
        ],
        answer: 1,
        explanation:
          'Without explicit limits minikube may allocate different amounts of CPU/RAM on different machines, leading to hard-to-reproduce failures. Setting them explicitly makes lab behaviour consistent.',
      },
      {
        id: 'p0-m0-q6',
        question: 'What does the metrics-server add-on provide?',
        options: [
          'Persistent storage for pod logs',
          'Real-time CPU and memory metrics exposed via the Kubernetes Metrics API',
          'A visual dashboard accessible in the browser',
          'Network traffic metrics between services',
        ],
        answer: 1,
        explanation:
          "metrics-server scrapes resource usage (CPU and memory) from each node's kubelet and exposes it through the Metrics API. This powers `kubectl top nodes`, `kubectl top pods`, and the Horizontal Pod Autoscaler.",
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// PHASE 1 ADDITIONS
// ---------------------------------------------------------------------------

export const phase1Additions = [
  // -------------------------------------------------------------------------
  // p1-m5 — ReplicaSets
  // -------------------------------------------------------------------------
  {
    id: 'p1-m5',
    slug: 'replicasets',
    title: 'ReplicaSets — Self-Healing Guarantees',
    description:
      'Understand how ReplicaSets maintain a desired number of pod replicas, how their label selectors work, and why Deployments wrap them instead of you creating them directly.',
    duration: 35,
    difficulty: 'beginner' as const,
    learningObjectives: [
      'Explain the relationship between ReplicaSet and Deployment',
      'Write a ReplicaSet manifest with a matching selector and pod template',
      'Observe self-healing: delete a pod and watch the RS recreate it',
      'Scale a ReplicaSet imperatively and declaratively',
      'Read ReplicaSet status fields: desired, current, ready',
      'Explain why you almost never create a ReplicaSet directly in production',
    ],
    keyConcepts: [
      'ReplicaSet — a controller that watches pods matching a selector and reconciles count to desired',
      'selector — a label query the RS uses to claim ownership of pods',
      'pod template — the blueprint the RS uses to create new pods',
      'self-healing — when a pod is deleted the RS controller immediately creates a replacement',
      'Deployment — a higher-level controller that owns a ReplicaSet and adds rolling-update logic',
      'ownerReferences — a metadata field that records which controller owns a resource',
    ],
    practicePrompts: [
      'Delete all pods in the RS and watch `kubectl get pods -w` as they respawn.',
      'Manually create a pod with the same labels as the RS selector. What happens to it?',
      'Scale the RS to 0 replicas. What happens to the pods?',
      'Inspect the ownerReferences on a pod managed by the RS.',
    ],
    masteryChecks: [
      'I can write a ReplicaSet manifest from scratch with correct selector and template labels.',
      'I understand that the selector and pod template labels must match exactly.',
      'I can explain the reconciliation loop: observe → diff → act.',
      'I know that a Deployment creates and owns a ReplicaSet — not the other way around.',
      'I can scale a ReplicaSet with both `kubectl scale` and by editing the manifest.',
      'I understand why bare ReplicaSets (without Deployments) are rarely used in production.',
    ],
    theory: `## Brain Warm-Up

A ReplicaSet answers one question: "is my desired pod count running right now?"
Every few seconds the RS controller asks the API server: "how many pods matching
my selector exist?" If the count is below desired, it creates pods from the
template. If above, it deletes excess pods.

This is the reconciliation loop — the core pattern behind almost everything
in Kubernetes.

---

## ReplicaSet vs Deployment vs bare Pod

\`\`\`
Bare Pod
  └── You create it manually. If it dies, it stays dead.

ReplicaSet
  └── Controller ensures N copies are always running.
      Self-heals. But no rolling-update support.

Deployment
  └── Owns a ReplicaSet. Adds rolling-update, rollback, pause/resume.
      In practice: always use Deployments, not bare ReplicaSets.
\`\`\`

---

## The selector must match the pod template labels

\`\`\`
spec:
  selector:
    matchLabels:
      app: web          ← RS looks for pods with this label
  template:
    metadata:
      labels:
        app: web        ← pods MUST carry this label or RS will never find them
    spec:
      containers: ...
\`\`\`

If these don't match, Kubernetes will reject the manifest with a validation error.

---

## What the RS controller sees

\`\`\`
API Server

  ReplicaSet: desired=3
  Pods with label app=web: [pod-a, pod-b]   ← only 2 found

  Action: CREATE pod-c from template
\`\`\`

\`\`\`
  ReplicaSet: desired=3
  Pods with label app=web: [pod-a, pod-b, pod-c, pod-d]  ← 4 found

  Action: DELETE one (usually the newest)
\`\`\`

---

## ReplicaSet status fields

| Field                | Meaning                                         |
|----------------------|-------------------------------------------------|
| replicas             | Total pods the RS currently sees (by selector)  |
| readyReplicas        | Pods that have passed readiness checks          |
| availableReplicas    | Pods that are ready AND available               |
| fullyLabeledReplicas | Pods matching all selector labels               |

---

## Why you almost never create a ReplicaSet directly

Deployments own a ReplicaSet. When you do a rolling update, the Deployment
creates a *new* RS with the new image and scales it up while scaling the old RS
down. If you created the RS yourself you lose this orchestration.

\`\`\`
Deployment (owns)
  ├── ReplicaSet v1  replicas=0  (old, kept for rollback)
  └── ReplicaSet v2  replicas=3  (current)
\`\`\`

Run \`kubectl get replicasets\` after a Deployment update to see this in action.`,
    labSteps: [
      {
        id: 'p1-m5-s1',
        title: 'Write and apply a ReplicaSet manifest',
        instruction:
          'Create a file called rs-web.yaml with a ReplicaSet that maintains 3 nginx pods. Apply it to the cluster.',
        command: 'kubectl apply -f rs-web.yaml',
        output: ['replicaset.apps/web-rs created'],
        explanation:
          'kubectl apply sends the manifest to the API server. The RS controller picks it up and immediately starts creating pods to reach the desired count of 3.',
        clusterState: {
          pods: [
            {
              id: 'pod-rs-1',
              name: 'web-rs-abcde',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
            {
              id: 'pod-rs-2',
              name: 'web-rs-fghij',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
            {
              id: 'pod-rs-3',
              name: 'web-rs-klmno',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: ['ReplicaSet web-rs created 3 pods'],
        },
        yamlContent: `apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: web-rs
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
      tier: frontend
  template:
    metadata:
      labels:
        app: web
        tier: frontend
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80`,
        tip: 'Note that selector.matchLabels and template.metadata.labels must share the same keys. The template may have MORE labels than the selector but must include all selector labels.',
      },
      {
        id: 'p1-m5-s2',
        title: 'Inspect ReplicaSet status',
        instruction: 'Check the RS status to confirm all 3 replicas are ready.',
        command: 'kubectl get rs web-rs',
        output: [
          'NAME     DESIRED   CURRENT   READY   AGE',
          'web-rs   3         3         3       45s',
        ],
        explanation:
          'DESIRED=3 is what we declared. CURRENT=3 means the RS has created 3 pods. READY=3 means all 3 have passed their readiness check (nginx passes by default). If READY < CURRENT a pod is still starting up.',
        clusterState: {
          pods: [
            {
              id: 'pod-rs-1',
              name: 'web-rs-abcde',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
            {
              id: 'pod-rs-2',
              name: 'web-rs-fghij',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
            {
              id: 'pod-rs-3',
              name: 'web-rs-klmno',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: [],
        },
        tip: 'Use `kubectl describe rs web-rs` to see events (pod creation, scaling) and the full selector.',
      },
      {
        id: 'p1-m5-s3',
        title: 'Delete a pod — watch self-healing',
        instruction:
          'Delete one of the pods managed by the RS. Open a second terminal and run `kubectl get pods -w` to watch real-time. The RS will create a replacement within seconds.',
        command: 'kubectl delete pod web-rs-abcde',
        output: ['pod "web-rs-abcde" deleted'],
        explanation:
          'The RS controller detects that the pod count dropped to 2 (below desired=3). It immediately creates a new pod from the template. The replacement will have a different random suffix.',
        clusterState: {
          pods: [
            {
              id: 'pod-rs-2',
              name: 'web-rs-fghij',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
            {
              id: 'pod-rs-3',
              name: 'web-rs-klmno',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
            {
              id: 'pod-rs-4',
              name: 'web-rs-pqrst',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: [
            'Pod web-rs-abcde deleted',
            'ReplicaSet web-rs created replacement pod web-rs-pqrst',
          ],
        },
        tip: 'Run `kubectl get pods -w` in a second terminal before deleting — watch the Terminating → new pod appear sequence live.',
      },
      {
        id: 'p1-m5-s4',
        title: 'Scale the ReplicaSet imperatively',
        instruction: 'Use `kubectl scale` to increase the replica count to 5.',
        command: 'kubectl scale rs web-rs --replicas=5',
        output: ['replicaset.apps/web-rs scaled'],
        explanation:
          '`kubectl scale` patches the .spec.replicas field on the RS object. The RS controller immediately creates 2 more pods. Note: this imperative change will be overwritten if you re-apply the original YAML file.',
        clusterState: {
          pods: [
            {
              id: 'pod-rs-2',
              name: 'web-rs-fghij',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
            {
              id: 'pod-rs-3',
              name: 'web-rs-klmno',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
            {
              id: 'pod-rs-4',
              name: 'web-rs-pqrst',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
            {
              id: 'pod-rs-5',
              name: 'web-rs-uvwxy',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
            {
              id: 'pod-rs-6',
              name: 'web-rs-z1234',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: ['ReplicaSet web-rs scaled to 5'],
        },
        tip: 'Prefer editing the YAML and re-applying for production. Imperative `kubectl scale` is fine for quick experiments but does not update your source-of-truth manifest.',
      },
      {
        id: 'p1-m5-s5',
        title: 'Inspect ownerReferences on a pod',
        instruction:
          'Look at the raw metadata of one managed pod to see the ownerReferences field that links it back to the ReplicaSet.',
        command: "kubectl get pod web-rs-fghij -o jsonpath='{.metadata.ownerReferences}'",
        output: [
          '[{"apiVersion":"apps/v1","blockOwnerDeletion":true,"controller":true,"kind":"ReplicaSet","name":"web-rs","uid":"a1b2c3d4-..."}]',
        ],
        explanation:
          'ownerReferences is how Kubernetes implements garbage collection. When the RS is deleted, the garbage collector follows ownerReferences and deletes all pods that list the RS as owner. controller=true means this RS is the managing controller.',
        clusterState: {
          pods: [
            {
              id: 'pod-rs-2',
              name: 'web-rs-fghij',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'web', tier: 'frontend' },
              image: 'nginx:1.25',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: [],
        },
        tip: 'Use `kubectl get pod <name> -o yaml | grep -A5 ownerReferences` for a more readable view.',
      },
      {
        id: 'p1-m5-s6',
        title: 'Clean up',
        instruction:
          'Delete the ReplicaSet. Because of ownerReferences all its pods are garbage-collected automatically.',
        command: 'kubectl delete rs web-rs',
        output: ['replicaset.apps/web-rs deleted'],
        explanation:
          'Deleting the RS triggers cascading deletion of all owned pods. You can verify with `kubectl get pods` immediately after — the pods will be in Terminating state and disappear within seconds.',
        clusterState: emptyCluster,
        tip: 'To delete the RS but keep the pods running (orphan them), use `kubectl delete rs web-rs --cascade=orphan`.',
      },
    ],
    exercises: [
      {
        id: 'p1-m5-e1',
        title: 'Build a Self-Healing RS',
        kind: 'guided' as const,
        goal: 'Create a ReplicaSet with 4 replicas, delete 2 pods simultaneously, and confirm 4 are running again within 30 seconds.',
        commands: [
          'kubectl apply -f rs-web.yaml',
          'kubectl get pods -l app=web',
          'kubectl delete pods -l app=web --field-selector=status.phase=Running --max-pods=2',
          'kubectl get pods -w',
        ],
        verify: ["kubectl get rs web-rs --no-headers | awk '{print $4}' | grep -x 4"],
        expectedOutcome: 'ReplicaSet shows READY=4 within 30 seconds of pod deletion.',
        cleanup: ['kubectl delete rs web-rs'],
      },
      {
        id: 'p1-m5-e2',
        title: 'Selector Mismatch Debug',
        kind: 'debug' as const,
        goal: 'Given a broken ReplicaSet manifest where selector.matchLabels does not match template.metadata.labels, find and fix the error.',
        commands: [
          'kubectl apply -f rs-broken.yaml',
          'kubectl describe rs broken-rs',
        ],
        verify: ["kubectl get rs broken-rs --no-headers | awk '{print $3}' | grep -x 3"],
        expectedOutcome: 'ReplicaSet is accepted and reaches CURRENT=3.',
        cleanup: ['kubectl delete rs broken-rs --ignore-not-found'],
      },
    ],
    quiz: [
      {
        id: 'p1-m5-q1',
        question:
          'A ReplicaSet has spec.replicas=3. You manually delete all 3 pods at the same time. What happens?',
        options: [
          'The RS is also deleted',
          'The RS stays and creates 3 new pods from the template',
          'The RS scales down to 0 permanently',
          'Nothing — the RS only reacts to node failures',
        ],
        answer: 1,
        explanation:
          'The RS controller continuously reconciles the observed pod count against the desired count. When pods disappear for any reason, it creates replacements from the pod template.',
      },
      {
        id: 'p1-m5-q2',
        question:
          'You apply a ReplicaSet manifest where spec.selector.matchLabels has app=web but spec.template.metadata.labels has app=nginx. What happens?',
        options: [
          'The RS is created and creates pods with app=nginx labels',
          'The RS is rejected by the API server with a validation error',
          'The RS is created but never creates any pods',
          'The RS creates pods and immediately deletes them',
        ],
        answer: 1,
        explanation:
          'Kubernetes validates that the selector labels are a subset of the pod template labels at creation time. A mismatch causes the API server to reject the object with a 422 Unprocessable Entity error.',
      },
      {
        id: 'p1-m5-q3',
        question: 'Why do Deployments manage ReplicaSets rather than pods directly?',
        options: [
          'Deployments cannot create pods — only ReplicaSets can',
          'Using two layers allows rolling updates: the Deployment scales a new RS up while scaling the old RS down',
          'It is purely for organisational reasons with no functional impact',
          'ReplicaSets provide better self-healing than Deployments',
        ],
        answer: 1,
        explanation:
          'Rolling updates work by having the Deployment create a new RS (new image) and gradually shift replicas from the old RS to the new one. Both RSes exist simultaneously during the update, which is how zero-downtime deploys work.',
      },
      {
        id: 'p1-m5-q4',
        question: 'What is the effect of `kubectl delete rs web-rs` on the pods it manages?',
        options: [
          'Pods continue running — they become orphaned',
          'Pods are immediately deleted via cascading garbage collection',
          'Pods are moved to a different ReplicaSet automatically',
          'Pods are cordoned and drained first',
        ],
        answer: 1,
        explanation:
          'By default, kubectl delete uses cascade=background, which triggers garbage collection of all resources with ownerReferences pointing to the deleted RS. Pods are deleted within seconds.',
      },
      {
        id: 'p1-m5-q5',
        question:
          'You have a ReplicaSet with replicas=3. You manually create a pod with the exact same labels as the RS selector. What does the RS controller do?',
        options: [
          'Nothing — manually created pods are never managed by a RS',
          'It deletes one of the existing pods to maintain the total at 3',
          'It scales up to 4 to accommodate the new pod',
          'It labels the pod differently to avoid a conflict',
        ],
        answer: 1,
        explanation:
          'The RS claims ownership of ANY pod matching its selector, regardless of how it was created. If the total exceeds desired, the RS deletes one (typically the most recently created) to reconcile back to replicas=3.',
      },
      {
        id: 'p1-m5-q6',
        question:
          'Which kubectl command shows the DESIRED, CURRENT, and READY columns for a ReplicaSet?',
        options: [
          'kubectl describe rs <name>',
          'kubectl get rs <name>',
          'kubectl get pods -l <selector>',
          'kubectl rollout status rs/<name>',
        ],
        answer: 1,
        explanation:
          '`kubectl get rs` shows a compact table with DESIRED, CURRENT, READY, and AGE columns. `kubectl describe` shows much more detail but not in that tabular format.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // p1-m6 — CronJobs
  // -------------------------------------------------------------------------
  {
    id: 'p1-m6',
    slug: 'cronjobs',
    title: 'CronJobs — Scheduled Work',
    description:
      'Schedule periodic tasks with CronJobs. Understand the CronJob → Job → Pod lifecycle, cron syntax, concurrency policies, and history limits.',
    duration: 40,
    difficulty: 'beginner' as const,
    learningObjectives: [
      'Write a CronJob manifest with correct cron schedule syntax',
      'Trace the lifecycle: CronJob creates Jobs; Jobs create Pods',
      'Explain the three concurrencyPolicy values and when to use each',
      'Configure successfulJobsHistoryLimit and failedJobsHistoryLimit',
      'Suspend and resume a CronJob without deleting it',
      'Inspect historical job runs and their pod logs',
    ],
    keyConcepts: [
      'CronJob — a controller that creates Jobs on a cron schedule',
      'Job — a controller that runs pods to completion rather than indefinitely',
      'cron expression — five-field time pattern: minute hour day-of-month month day-of-week',
      'concurrencyPolicy — what to do when a new run is triggered while the previous is still running',
      'successfulJobsHistoryLimit — how many completed Jobs to retain (default 3)',
      'failedJobsHistoryLimit — how many failed Jobs to retain (default 1)',
      'suspend — pause a CronJob without deleting it',
    ],
    practicePrompts: [
      'Change the schedule to `*/1 * * * *` (every minute) and watch jobs appear with `kubectl get jobs -w`.',
      'Reduce successfulJobsHistoryLimit to 1 and confirm old Jobs are automatically cleaned up.',
      'Create a CronJob with concurrencyPolicy=Forbid and an intentionally slow job. Confirm the next run is skipped.',
      'Check the timezone field — how would you schedule a job to run at 09:00 UTC+2?',
    ],
    masteryChecks: [
      'I can write a cron expression for "every day at 02:30" from memory.',
      'I understand the Allow / Forbid / Replace differences and can pick the right one.',
      'I know how to check what a CronJob has created using kubectl get jobs.',
      'I can read pod logs from a completed (not running) Job pod.',
      'I can suspend a CronJob and explain the difference between suspend=true and deleting it.',
      'I understand why retaining too many failed jobs wastes etcd storage.',
    ],
    theory: `## Brain Warm-Up

A CronJob is a wrapper around a Job. It adds a scheduler: "create one of these
Jobs at this schedule." The CronJob itself never runs code — it just mints Job
objects. Each Job then creates one or more Pods that run to completion.

\`\`\`
CronJob (scheduler)
  │
  ├── Job (run #1)  ──► Pod (run to completion, exit 0)
  ├── Job (run #2)  ──► Pod (run to completion, exit 0)
  └── Job (run #3)  ──► Pod (currently running...)
\`\`\`

---

## Cron syntax in Kubernetes

\`\`\`
┌───────────── minute (0–59)
│ ┌───────────── hour (0–23)
│ │ ┌───────────── day of month (1–31)
│ │ │ ┌───────────── month (1–12)
│ │ │ │ ┌───────────── day of week (0–6, 0=Sunday)
│ │ │ │ │
* * * * *
\`\`\`

| Expression    | Meaning                       |
|---------------|-------------------------------|
| \`0 2 * * *\`   | Every day at 02:00            |
| \`*/5 * * * *\` | Every 5 minutes               |
| \`0 9 * * 1\`   | Every Monday at 09:00         |
| \`0 0 1 * *\`   | First day of every month      |
| \`@hourly\`     | Shorthand for 0 * * * *       |
| \`@daily\`      | Shorthand for 0 0 * * *       |

Kubernetes also supports a \`timeZone\` field (since 1.27 stable):
\`timeZone: "Europe/Berlin"\` — defaults to UTC if unset.

---

## concurrencyPolicy

This controls what happens when the scheduler fires while the *previous* Job
is still running.

| Policy    | Behaviour                                                   |
|-----------|-------------------------------------------------------------|
| Allow     | (default) Start new Job even if old one is still running    |
| Forbid    | Skip this run entirely if previous Job has not finished     |
| Replace   | Delete the running Job and start a fresh one                |

\`\`\`
Allow  — risk of two jobs writing to the same DB at the same time
Forbid — risk of missed runs if a job consistently takes too long
Replace — previous run's work is abandoned mid-flight
\`\`\`

---

## History limits

By default Kubernetes retains the last 3 successful Jobs and 1 failed Job.
These objects stay in etcd — never running, just stored for inspection.
Set limits to control storage usage:

\`\`\`yaml
spec:
  successfulJobsHistoryLimit: 3   # default
  failedJobsHistoryLimit: 1       # default
\`\`\`

Setting a limit to 0 cleans up immediately after completion.

---

## CronJob suspend

\`spec.suspend: true\` tells the CronJob controller to stop firing new Jobs
without deleting the CronJob or its history. Useful for maintenance windows.
Any Jobs already in flight continue running.`,
    labSteps: [
      {
        id: 'p1-m6-s1',
        title: 'Create a CronJob',
        instruction: 'Create a CronJob that prints the current date every 2 minutes.',
        command: 'kubectl apply -f cronjob-date.yaml',
        output: ['cronjob.batch/date-printer created'],
        explanation:
          'The CronJob is created but no Job is spawned yet — the first run will happen when the cron schedule fires. With schedule="*/2 * * * *" the first run is within the next 2 minutes.',
        clusterState: {
          pods: [],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: ['CronJob date-printer created'],
        },
        yamlContent: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: date-printer
spec:
  schedule: "*/2 * * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: date
            image: busybox:1.36
            command: ["/bin/sh", "-c", "date; echo 'Job complete'"]`,
        tip: 'Use crontab.guru to visually verify any cron expression before using it in a manifest.',
      },
      {
        id: 'p1-m6-s2',
        title: 'Watch Jobs appear',
        instruction:
          'Wait for the schedule to fire, then list all Jobs in the namespace. You will see the CronJob has created a Job with a generated name.',
        command: 'kubectl get jobs --watch',
        output: [
          'NAME                        COMPLETIONS   DURATION   AGE',
          'date-printer-28644480       0/1                      0s',
          'date-printer-28644480       0/1           3s         3s',
          'date-printer-28644480       1/1           5s         5s',
        ],
        explanation:
          'Job names follow the pattern <cronjob-name>-<unix-minute-timestamp>. COMPLETIONS shows X/Y where Y is spec.completions (default 1). The job reaches 1/1 when its pod exits 0.',
        clusterState: {
          pods: [
            {
              id: 'pod-cj-1',
              name: 'date-printer-28644480-xvz9k',
              namespace: 'default',
              node: 'node-1',
              status: 'Terminated',
              labels: { 'job-name': 'date-printer-28644480' },
              image: 'busybox:1.36',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: ['CronJob date-printer triggered Job date-printer-28644480'],
        },
        tip: 'CronJob controller can be up to 100 seconds late firing if the cluster was under load. This is expected — CronJobs are not hard real-time.',
      },
      {
        id: 'p1-m6-s3',
        title: 'Read the pod logs',
        instruction: 'Find the pod created by the Job and read its logs.',
        command: 'kubectl logs job/date-printer-28644480',
        output: ['Thu Jun  5 10:32:00 UTC 2026', 'Job complete'],
        explanation:
          '`kubectl logs job/<name>` is a shortcut that finds the pod associated with a Job. The pod ran to completion and its logs are still accessible as long as the Job (and pod) exist within the history limit.',
        clusterState: {
          pods: [
            {
              id: 'pod-cj-1',
              name: 'date-printer-28644480-xvz9k',
              namespace: 'default',
              node: 'node-1',
              status: 'Terminated',
              labels: { 'job-name': 'date-printer-28644480' },
              image: 'busybox:1.36',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: [],
        },
        tip: 'If the job has multiple pods use `kubectl logs <pod-name>` directly. Completed pods retain their logs until the pod is garbage-collected.',
      },
      {
        id: 'p1-m6-s4',
        title: 'Inspect the CronJob',
        instruction: 'Describe the CronJob to see schedule, last run time, and active jobs.',
        command: 'kubectl describe cronjob date-printer',
        output: [
          'Name:                          date-printer',
          'Namespace:                     default',
          'Schedule:                      */2 * * * *',
          'Concurrency Policy:            Forbid',
          'Suspend:                       False',
          'Successful Job History Limit:  3',
          'Failed Job History Limit:      1',
          'Last Schedule Time:            Thu, 05 Jun 2026 10:32:00 +0000',
          'Active Jobs:                   <none>',
          'Events:',
          '  Normal  SuccessfulCreate  2m  cronjob-controller  Created job date-printer-28644480',
        ],
        explanation:
          '"Last Schedule Time" shows when the most recent Job was triggered. "Active Jobs" shows in-flight Jobs. With concurrencyPolicy=Forbid, a new run is skipped if Active Jobs is non-empty.',
        clusterState: {
          pods: [],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: [],
        },
        tip: 'The "Starting Deadline Seconds" field controls how late a missed run can start. If unset, missed runs are retried indefinitely once the cluster recovers.',
      },
      {
        id: 'p1-m6-s5',
        title: 'Suspend the CronJob',
        instruction:
          'Patch the CronJob to set suspend=true, preventing any new Jobs from being created.',
        command: "kubectl patch cronjob date-printer -p '{\"spec\":{\"suspend\":true}}'",
        output: ['cronjob.batch/date-printer patched'],
        explanation:
          'Setting suspend=true tells the controller to skip all future scheduled runs. Existing Jobs in flight are not affected. The CronJob and its history remain intact.',
        clusterState: {
          pods: [],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: ['CronJob date-printer suspended'],
        },
        tip: "Resume with `kubectl patch cronjob date-printer -p '{\"spec\":{\"suspend\":false}}'`. You can also edit it: `kubectl edit cronjob date-printer`.",
      },
      {
        id: 'p1-m6-s6',
        title: 'Clean up',
        instruction: 'Delete the CronJob. This also deletes all Jobs and pods it owns.',
        command: 'kubectl delete cronjob date-printer',
        output: ['cronjob.batch/date-printer deleted'],
        explanation:
          'Deleting the CronJob cascades to all its Jobs and their pods via ownerReferences. The history of past runs is lost.',
        clusterState: emptyCluster,
        tip: 'To delete a CronJob but preserve its Jobs for investigation, use `kubectl delete cronjob date-printer --cascade=orphan`.',
      },
    ],
    quiz: [
      {
        id: 'p1-m6-q1',
        question: 'What cron expression means "every day at 03:30 UTC"?',
        options: ['30 3 * * *', '3 30 * * *', '* 3 30 * *', '30 * 3 * *'],
        answer: 0,
        explanation:
          'The five cron fields are: minute hour day-of-month month day-of-week. "Every day at 03:30" means minute=30, hour=3, all other fields wildcarded: "30 3 * * *".',
      },
      {
        id: 'p1-m6-q2',
        question:
          'A CronJob has concurrencyPolicy=Forbid. The 14:00 job is still running when 14:05 fires. What happens?',
        options: [
          'The 14:00 job is killed and replaced by the 14:05 job',
          'A second job is started in parallel',
          'The 14:05 run is skipped entirely',
          'The CronJob is automatically suspended',
        ],
        answer: 2,
        explanation:
          'Forbid skips any run that would overlap with an already-running Job. The missed run is simply not created. No error is raised, but an Event is recorded on the CronJob.',
      },
      {
        id: 'p1-m6-q3',
        question: 'You set successfulJobsHistoryLimit=0 on a CronJob. What is the effect?',
        options: [
          'CronJob stops creating Jobs',
          'Completed Jobs and their pods are deleted immediately after success',
          'Only failed Jobs are retained',
          'CronJob is paused automatically',
        ],
        answer: 1,
        explanation:
          'A limit of 0 means keep zero successful Jobs in history. The controller deletes completed Jobs (and their pods) immediately. Future runs still happen — the limit only controls retention of past runs.',
      },
      {
        id: 'p1-m6-q4',
        question:
          'What is the difference between deleting a CronJob and setting spec.suspend=true?',
        options: [
          'There is no difference — both stop future runs',
          'suspend=true pauses scheduling but preserves the CronJob object and its Job history',
          'suspend=true only affects the next run; the CronJob resumes automatically after',
          'Deleting a CronJob also deletes all Jobs, but suspend=true keeps Jobs running',
        ],
        answer: 1,
        explanation:
          'suspend=true is a reversible pause — no new Jobs are created but the CronJob, its schedule, and its Job history are all preserved. Deleting the CronJob is permanent and cascades to all owned Jobs and pods.',
      },
      {
        id: 'p1-m6-q5',
        question:
          'How does a CronJob know what Job template to use when creating scheduled runs?',
        options: [
          'It references an existing Job by name in spec.jobRef',
          'It embeds the full Job spec inside spec.jobTemplate',
          'It clones the most recently successful Job',
          'It uses a ConfigMap containing the Job definition',
        ],
        answer: 1,
        explanation:
          'The CronJob spec contains a jobTemplate field with the full Job spec embedded. Every time the schedule fires, the controller creates a new Job object from this template and appends a timestamp-based suffix to the name.',
      },
      {
        id: 'p1-m6-q6',
        question:
          'A pod in a CronJob-created Job exits with code 1. The Job has backoffLimit=3. What happens?',
        options: [
          'The CronJob is immediately suspended',
          'The Job retries by creating new pods up to 3 times before marking the Job as Failed',
          'The next CronJob run is skipped',
          'The pod is restarted in place with no new pod created',
        ],
        answer: 1,
        explanation:
          'backoffLimit controls how many times a Job retries a failed pod. The Job creates new pods on each retry with exponential back-off delay. After backoffLimit retries the Job is marked Failed, which counts toward failedJobsHistoryLimit.',
      },
    ],
  },

  // -------------------------------------------------------------------------
  // p1-m7 — Multi-Container Patterns
  // -------------------------------------------------------------------------
  {
    id: 'p1-m7',
    slug: 'multi-container-patterns',
    title: 'Multi-Container Patterns',
    description:
      'Learn the Ambassador, Adapter, and Sidecar patterns for composing multiple containers in a single pod. Understand what they share and when to use each.',
    duration: 45,
    difficulty: 'intermediate' as const,
    learningObjectives: [
      'Explain what all containers in a pod share: network namespace, volumes, lifecycle',
      'Implement the Sidecar pattern with a shared emptyDir volume',
      'Explain the Ambassador pattern and when it decouples service discovery',
      'Explain the Adapter pattern and how it normalises output for monitoring',
      'Distinguish these patterns from Init Containers (prerequisite vs concurrent)',
      'Inspect logs and exec into individual containers within a multi-container pod',
    ],
    keyConcepts: [
      'Sidecar — a helper container that augments the main container (shares filesystem via emptyDir)',
      "Ambassador — a proxy container in the same pod that abstracts an external service endpoint",
      "Adapter — a container that transforms the main container's output into a standard format",
      'emptyDir — an ephemeral volume scoped to the pod lifetime, shared by all containers in the pod',
      'localhost — all containers in a pod share the same network namespace and can reach each other on 127.0.0.1',
      'Init Container — runs to completion BEFORE main containers start (different from sidecar which runs concurrently)',
    ],
    practicePrompts: [
      'Run `kubectl exec -it <pod> -c log-reader -- sh` and verify you can see the nginx logs in /var/log/nginx.',
      'Run `kubectl logs <pod> -c nginx` vs `kubectl logs <pod> -c log-reader` — what is different?',
      'Describe the Ambassador pattern for a multi-region database setup.',
      'What happens to a sidecar container if the main container crashes?',
    ],
    masteryChecks: [
      'I can explain the Sidecar, Ambassador, and Adapter patterns in one sentence each.',
      'I know that all containers in a pod share the same network namespace (same IP, same ports).',
      'I can write a multi-container pod spec with a shared emptyDir volume.',
      'I understand the difference between Init Containers (sequential prerequisite) and Sidecars (concurrent helper).',
      'I can target a specific container with kubectl logs -c and kubectl exec -c.',
      'I can describe a real-world use case for each of the three patterns.',
    ],
    theory: `## Brain Warm-Up

A pod is not just "a container." It is a group of containers that share:
- **Network namespace** — the same IP address and port space (they communicate via localhost)
- **Volumes** — any volume mounted by the pod is available to all containers
- **Lifecycle** — the pod lives until all containers exit; if any container crashes, the pod's restart policy applies

This shared context is what makes multi-container patterns possible.

---

## What all containers share in a pod

\`\`\`
Pod
├── Container A (nginx)          ┐
│   └── localhost:80             │  Same IP address
├── Container B (log-reader)     │  Same emptyDir volume at /shared
│   └── reads /shared/access.log │  Same lifecycle
└── Volume: emptyDir → /shared   ┘
\`\`\`

---

## Init Containers vs Sidecar Containers

\`\`\`
Init Containers (spec.initContainers)
  ├── Run SEQUENTIALLY before any main container starts
  ├── Must exit 0 before the next one begins
  └── Use case: wait for DB, clone git repo, populate config

Sidecar Containers (spec.containers, multiple entries)
  ├── Run CONCURRENTLY with the main container
  ├── Share the pod's full lifetime
  └── Use case: logging agent, proxy, metrics exporter
\`\`\`

---

## The Three Patterns

### Sidecar
The helper reads from (or writes to) a volume shared with the main container.
Classic example: main app writes logs to /var/log/app; log agent reads and ships them.

\`\`\`
App container ──writes──► emptyDir ──reads──► Log-agent (ships to Elasticsearch)
\`\`\`

### Ambassador
A proxy container in the same pod that the main app talks to on localhost.
The ambassador handles: service discovery, TLS termination, retry logic.
The main app is unaware it is not talking directly to the real service.

\`\`\`
App container ──localhost:5432──► Ambassador (envoy/pgbouncer)
                                        │
                                   routes to real DB
                                   (different host/region)
\`\`\`

### Adapter
The main container outputs data in a proprietary format.
The adapter container reads it and transforms it to a standard format (e.g., Prometheus metrics).
The monitoring system scrapes the adapter, not the main app.

\`\`\`
App container ──/app/metrics (custom JSON)──► Adapter
                                                  │
                                        /metrics (Prometheus format)
                                                  │
                                          ◄── Prometheus scrapes here
\`\`\`

---

## Comparison table

| Pattern     | Relationship to main | Communication           | Typical Use Case              |
|-------------|----------------------|-------------------------|-------------------------------|
| Sidecar     | Augments             | Shared volume           | Log shipping, file sync       |
| Ambassador  | Proxies for          | localhost TCP           | DB proxy, service discovery   |
| Adapter     | Transforms output of | Shared volume/localhost | Metrics normalisation         |

---

## kubectl tips for multi-container pods

\`\`\`bash
# Logs from a specific container
kubectl logs <pod> -c <container-name>

# Stream logs from a specific container
kubectl logs -f <pod> -c <container-name>

# Exec into a specific container
kubectl exec -it <pod> -c <container-name> -- sh

# Describe shows all container statuses
kubectl describe pod <pod>
\`\`\``,
    labSteps: [
      {
        id: 'p1-m7-s1',
        title: 'Create a Sidecar pod',
        instruction:
          'Apply a pod manifest with two containers: nginx (main) and busybox (sidecar). Both mount an emptyDir volume. nginx writes access logs to /var/log/nginx/access.log; the sidecar tails the file.',
        command: 'kubectl apply -f sidecar-pod.yaml',
        output: ['pod/sidecar-demo created'],
        explanation:
          'The emptyDir volume is created when the pod starts and both containers mount it. nginx automatically writes access logs to /var/log/nginx/access.log. The busybox sidecar tails that file continuously.',
        clusterState: {
          pods: [
            {
              id: 'pod-sidecar-1',
              name: 'sidecar-demo',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'sidecar-demo' },
              image: 'nginx:1.25',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: ['Pod sidecar-demo created'],
        },
        yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: sidecar-demo
  labels:
    app: sidecar-demo
spec:
  volumes:
  - name: shared-logs
    emptyDir: {}
  containers:
  - name: nginx
    image: nginx:1.25
    ports:
    - containerPort: 80
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log/nginx
  - name: log-reader
    image: busybox:1.36
    command: ["/bin/sh", "-c", "tail -f /var/log/nginx/access.log 2>/dev/null || sleep 3600"]
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log/nginx`,
        tip: 'The sidecar falls back to `sleep 3600` if the log file does not exist yet — nginx creates it on first request.',
      },
      {
        id: 'p1-m7-s2',
        title: 'Verify both containers are running',
        instruction: 'Check the pod status. Notice that kubectl shows the container count.',
        command: 'kubectl get pod sidecar-demo',
        output: [
          'NAME           READY   STATUS    RESTARTS   AGE',
          'sidecar-demo   2/2     Running   0          30s',
        ],
        explanation:
          'READY=2/2 means both containers (nginx and log-reader) are running and have passed their readiness checks. If it showed 1/2, one container would still be starting or failing.',
        clusterState: {
          pods: [
            {
              id: 'pod-sidecar-1',
              name: 'sidecar-demo',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'sidecar-demo' },
              image: 'nginx:1.25',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: [],
        },
        tip: 'Use `kubectl describe pod sidecar-demo` to see individual container states, image names, and any recent events.',
      },
      {
        id: 'p1-m7-s3',
        title: 'Generate nginx traffic',
        instruction:
          'Use port-forward to send an HTTP request to nginx, which will generate an access log entry.',
        command:
          'kubectl port-forward pod/sidecar-demo 8080:80 &\ncurl -s http://localhost:8080/ > /dev/null\necho "Request sent"',
        output: [
          'Forwarding from 127.0.0.1:8080 -> 80',
          'Forwarding from [::1]:8080 -> 80',
          'Request sent',
        ],
        explanation:
          'port-forward creates a tunnel from your local port 8080 to port 80 inside the pod. The curl generates an HTTP GET that nginx serves and logs to /var/log/nginx/access.log inside the shared volume.',
        clusterState: {
          pods: [
            {
              id: 'pod-sidecar-1',
              name: 'sidecar-demo',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'sidecar-demo' },
              image: 'nginx:1.25',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: ['HTTP GET / from 127.0.0.1'],
        },
        tip: 'Kill the port-forward with `kill %1` after the test (it runs in the background).',
      },
      {
        id: 'p1-m7-s4',
        title: 'Read logs from each container individually',
        instruction:
          'Use the -c flag to read logs from the nginx container, then from the log-reader sidecar.',
        command:
          'kubectl logs sidecar-demo -c nginx && echo "---sidecar---" && kubectl logs sidecar-demo -c log-reader',
        output: [
          '127.0.0.1 - - [05/Jun/2026:10:35:00 +0000] "GET / HTTP/1.1" 200 615 "-" "curl/8.5.0"',
          '---sidecar---',
          '127.0.0.1 - - [05/Jun/2026:10:35:00 +0000] "GET / HTTP/1.1" 200 615 "-" "curl/8.5.0"',
        ],
        explanation:
          'Both containers show the same access log line. nginx writes it to stdout AND to /var/log/nginx/access.log on the shared volume. The log-reader tails the shared file and emits it on its own stdout. Proof the volume sharing works.',
        clusterState: {
          pods: [
            {
              id: 'pod-sidecar-1',
              name: 'sidecar-demo',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'sidecar-demo' },
              image: 'nginx:1.25',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: [],
        },
        tip: 'Without -c, kubectl logs defaults to the first container in the spec. Always use -c in multi-container pods to be explicit.',
      },
      {
        id: 'p1-m7-s5',
        title: 'Exec into the sidecar container',
        instruction:
          'Open a shell inside the sidecar container and inspect the shared volume directly.',
        command: 'kubectl exec -it sidecar-demo -c log-reader -- ls -la /var/log/nginx/',
        output: [
          'total 12',
          'drwxrwxrwx    2 root     root          4096 Jun  5 10:34 .',
          'drwxr-xr-x    1 root     root          4096 Jun  5 10:34 ..',
          '-rw-r--r--    1 nginx    nginx          415 Jun  5 10:35 access.log',
          '-rw-r--r--    1 nginx    nginx            0 Jun  5 10:34 error.log',
        ],
        explanation:
          'The log-reader container can see access.log written by nginx because both containers mount the same emptyDir volume at /var/log/nginx. The files are created by the nginx process but readable by any process in the pod.',
        clusterState: {
          pods: [
            {
              id: 'pod-sidecar-1',
              name: 'sidecar-demo',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'sidecar-demo' },
              image: 'nginx:1.25',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: [],
        },
        tip: 'Use `kubectl exec -it sidecar-demo -c nginx -- cat /var/log/nginx/access.log` to read the same file from the main container for comparison.',
      },
      {
        id: 'p1-m7-s6',
        title: 'Observe shared network namespace',
        instruction:
          'Exec into the sidecar and confirm it can reach nginx on localhost:80.',
        command:
          'kubectl exec -it sidecar-demo -c log-reader -- wget -qO- http://localhost:80 | head -5',
        output: [
          '<!DOCTYPE html>',
          '<html>',
          '<head>',
          '<title>Welcome to nginx!</title>',
          '<style>',
        ],
        explanation:
          'The log-reader container (busybox) can connect to nginx on localhost:80 even though nginx is in a separate container. All containers in a pod share the same network namespace — same IP, same loopback interface, same port space.',
        clusterState: {
          pods: [
            {
              id: 'pod-sidecar-1',
              name: 'sidecar-demo',
              namespace: 'default',
              node: 'node-1',
              status: 'Running',
              labels: { app: 'sidecar-demo' },
              image: 'nginx:1.25',
              restarts: 0,
            },
          ],
          services: [],
          deployments: [],
          namespaces: ['default'],
          events: [],
        },
        tip: 'This shared network is the foundation of the Ambassador pattern: the main app talks to an ambassador proxy on localhost without needing to know where the real service is.',
      },
      {
        id: 'p1-m7-s7',
        title: 'Clean up',
        instruction: 'Delete the sidecar demo pod.',
        command: 'kubectl delete pod sidecar-demo',
        output: ['pod "sidecar-demo" deleted'],
        explanation:
          'When the pod is deleted, the emptyDir volume and all its contents are permanently destroyed. Both containers stop. The shared data existed only for the lifetime of the pod.',
        clusterState: emptyCluster,
        tip: 'emptyDir is ephemeral by design. For data that must survive pod deletion, use a PersistentVolumeClaim.',
      },
    ],
    exercises: [
      {
        id: 'p1-m7-e1',
        title: 'Build an Adapter Pattern Pod',
        kind: 'challenge' as const,
        goal: 'Create a two-container pod where the main container writes custom JSON metrics to a shared volume every 5 seconds, and an adapter container reads them and prints them in a normalised key=value format.',
        commands: [
          'kubectl apply -f adapter-pod.yaml',
          'kubectl logs <pod> -c adapter -f',
        ],
        verify: [
          "kubectl get pod adapter-demo --no-headers | awk '{print $2}' | grep -x '2/2'",
          'kubectl logs adapter-demo -c adapter | grep "requests_total="',
        ],
        expectedOutcome:
          'Adapter container logs show normalised metrics lines like "requests_total=42 error_rate=0.01".',
        cleanup: ['kubectl delete pod adapter-demo --ignore-not-found'],
      },
      {
        id: 'p1-m7-e2',
        title: 'Debug a Broken Sidecar',
        kind: 'debug' as const,
        goal: 'Given a multi-container pod where the sidecar mounts the volume at the wrong path (/logs instead of /var/log/nginx), the sidecar outputs nothing. Find the bug and fix it.',
        commands: [
          'kubectl apply -f broken-sidecar.yaml',
          'kubectl logs broken-sidecar -c log-reader',
          'kubectl describe pod broken-sidecar',
        ],
        verify: ['kubectl logs fixed-sidecar -c log-reader | grep -c "GET /"'],
        expectedOutcome: 'After fix, log-reader logs show nginx access log entries.',
        cleanup: ['kubectl delete pod broken-sidecar fixed-sidecar --ignore-not-found'],
      },
    ],
    quiz: [
      {
        id: 'p1-m7-q1',
        question:
          'Two containers in the same pod both try to bind to port 8080. What happens?',
        options: [
          'Both succeed — each container has its own network namespace',
          'The second container fails to start because the port is already in use',
          'Kubernetes automatically remaps one of the ports',
          'The pod enters CrashLoopBackOff state',
        ],
        answer: 1,
        explanation:
          'All containers in a pod share the same network namespace (same IP and port space). If two containers bind the same port, the second one will fail just as it would on a single machine. Each container must use a unique port.',
      },
      {
        id: 'p1-m7-q2',
        question:
          'What type of volume is best suited for sharing temporary data between containers in the same pod?',
        options: [
          'PersistentVolumeClaim',
          'ConfigMap volume',
          'emptyDir',
          'hostPath',
        ],
        answer: 2,
        explanation:
          'emptyDir is an ephemeral volume scoped to the pod. It is created when the pod starts, shared by all containers in the pod, and deleted when the pod terminates. It is the canonical solution for inter-container data sharing within a pod.',
      },
      {
        id: 'p1-m7-q3',
        question:
          'What is the key difference between an Init Container and a Sidecar container?',
        options: [
          'Init containers run after main containers; sidecars run before',
          'Init containers must complete before main containers start; sidecars run concurrently with main containers',
          'Sidecars cannot mount volumes; init containers can',
          'Init containers share the network namespace; sidecars do not',
        ],
        answer: 1,
        explanation:
          "Init containers are sequential prerequisites — each one must exit 0 before the next starts, and all must complete before any main container starts. Sidecars are concurrent helpers — they start at the same time as main containers and run for the pod's lifetime.",
      },
      {
        id: 'p1-m7-q4',
        question:
          'An Ambassador container listens on localhost:5432 in the pod. The main app connects to localhost:5432. What is the Ambassador responsible for?',
        options: [
          'Proxying the connection to the real backend service, abstracting its location from the main app',
          'Terminating TLS for incoming connections to the pod',
          'Writing connection logs to a shared emptyDir volume',
          'Scaling the backend database based on connection count',
        ],
        answer: 0,
        explanation:
          'The Ambassador pattern decouples the main app from service discovery and connection details. The main app always connects to localhost:5432 (simple, stable). The ambassador handles the real routing — which DB host, which region, connection pooling, retries.',
      },
      {
        id: 'p1-m7-q5',
        question:
          "You run `kubectl logs my-pod` on a pod with three containers. Which container's logs are shown?",
        options: [
          "All three containers' logs interleaved",
          'The first container listed in spec.containers',
          'The container named "main"',
          'The command fails — you must specify -c',
        ],
        answer: 1,
        explanation:
          'Without -c, kubectl logs returns the logs of the first container in the pod spec. This can be surprising. Always use `kubectl logs my-pod -c <container-name>` in multi-container pods to be explicit.',
      },
      {
        id: 'p1-m7-q6',
        question: 'The Adapter pattern is primarily used to:',
        options: [
          'Proxy external service connections through a local sidecar',
          'Run prerequisite setup tasks before the main container starts',
          "Transform the main container's output format to match a standard expected by external tools",
          'Replicate files from the main container to cloud storage',
        ],
        answer: 2,
        explanation:
          "The Adapter pattern normalises output. The main container may emit metrics, logs, or status in a proprietary format. The adapter container reads that data and re-emits it in a standard format (e.g., Prometheus /metrics endpoint) that external systems know how to consume.",
      },
    ],
  },
]
