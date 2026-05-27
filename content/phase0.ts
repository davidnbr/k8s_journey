import type { Phase, ClusterState } from '@/lib/types'

const emptyCluster: ClusterState = {
  pods: [], services: [], deployments: [], namespaces: ['default'], events: [],
}

const phase0: Phase = {
  id: 'phase-0',
  slug: 'phase-0',
  title: 'Mental Model Foundation',
  shortTitle: 'Foundation',
  description: 'Build the right mental model before touching a cluster. Understand WHY Kubernetes exists and HOW it is structured.',
  weeks: 'Week 1',
  hours: '~8 hours',
  color: 'text-violet-400',
  bgColor: 'bg-violet-500/10 border-violet-500/30',
  modules: [
    {
      id: 'p0-m1',
      slug: 'why-kubernetes',
      title: 'Why Kubernetes Exists',
      description: 'The problem Kubernetes solves and why it matters.',
      duration: '45 min',
      difficulty: 'beginner',
      theory: `> 🧠 **Brain Warm-Up**: Imagine you run a web app inside a single Docker container on a bare virtual machine. If the container crashes in the middle of the night, what happens? How would you automatically detect it and restart it? Think about this operational headache before reading below.

## The Problem

Before Kubernetes, running containers at scale meant manually managing dozens or hundreds of servers. If a container crashed, you had to notice it via alerts and restart it manually. Scaling meant SSHing into servers, running docker run commands, and updating load balancer configs. Rolling updates meant downtime.

**Kubernetes is a container orchestration platform** that automates these operational tasks:

- **Self-healing** — crashed containers are restarted automatically; failed nodes are evacuated
- **Scaling** — scale from 1 to 1000 replicas with a single command or automatically based on CPU
- **Rolling updates** — deploy new code versions sequentially with zero downtime
- **Service discovery** — containers find and communicate with each other automatically
- **Resource management** — pack workloads efficiently across physical nodes to save hosting costs

### Container Infrastructure Evolution

\`\`\`
Traditional Deploy        Containerized (Docker)       Orchestrated (Kubernetes)
┌───────────────┐        ┌─────────────────────┐       ┌───────────────────────┐
│   Web App     │        │ ┌───────┐ ┌───────┐ │       │ ┌───────┐ ┌─────────┐ │
│───────────────│        │ │ App 1 │ │ App 2 │ │       │ │ Pod 1 │ │ Service │ │
│   Host OS     │        │ ├───────┴─┼───────┤ │       │ ├───────┴─┴─────────┤ │
│───────────────│        │ │    Docker Engine    │ │       │ │   Worker Node     │ │
│ Hypervisor/VM │        │ ├───────────────────┤ │       │ ├───────────────────┤ │
│───────────────│        │ │      Host OS      │ │       │ │   Control Plane   │ │
│   Hardware    │        │ └───────────────────┘ │       │ └───────────────────┘ │
└───────────────┘        └─────────────────────┘       └───────────────────────┘
   Manual scaling,         Port conflicts, no             Automated scheduling,
   long boot times         built-in self-healing          self-healing, routing
\`\`\`

## The Mental Model

Think of Kubernetes like a **shipping company**:
- The **Control Plane** is the company headquarters — it makes all decisions and schedules work.
- **Worker Nodes** are the cargo ships — they have physical capacity (CPU/RAM) and run the containers.
- **Pods** are the shipping containers — the basic atomic unit of transport in the cluster.
- **kubectl** is your satellite radio — the CLI tool you use to send declarative instructions to HQ.`,
      labSteps: [
        {
          id: 'p0-m1-s1',
          title: 'Connect to the cluster',
          instruction: 'Run cluster-info to see that a Kubernetes control plane is reachable.',
          command: 'kubectl cluster-info',
          output: [
            'Kubernetes control plane is running at https://127.0.0.1:6443',
            'CoreDNS is running at https://127.0.0.1:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy',
            '',
            'To further debug and diagnose cluster problems, use \'kubectl cluster-info dump\'.',
          ],
          explanation: 'The control plane endpoint is the kube-apiserver — every kubectl command goes through it. CoreDNS provides in-cluster DNS for Service discovery.',
          clusterState: {
            ...emptyCluster,
            highlightedComponent: 'apiserver',
          },
          tip: 'kubectl always talks to kube-apiserver first. Everything else flows from there.',
        },
        {
          id: 'p0-m1-s2',
          title: 'See the worker nodes',
          instruction: 'List all nodes in the cluster to see the "ships" that run your workloads.',
          command: 'kubectl get nodes',
          output: [
            'NAME           STATUS   ROLES           AGE   VERSION',
            'controlplane   Ready    control-plane   5d    v1.35.2',
            'node-1         Ready    <none>          5d    v1.35.2',
            'node-2         Ready    <none>          5d    v1.35.2',
          ],
          explanation: 'A cluster has one (or more) control plane nodes and multiple worker nodes. The STATUS "Ready" means kubelet is healthy and the node can accept Pods.',
          clusterState: {
            ...emptyCluster,
            highlightedComponent: 'kubelet',
          },
        },
        {
          id: 'p0-m1-s3',
          title: 'Explore the system namespace',
          instruction: 'See what Kubernetes runs to manage itself (the "company HQ staff").',
          command: 'kubectl get pods -n kube-system',
          output: [
            'NAME                                   READY   STATUS    RESTARTS   AGE',
            'coredns-6f6b679f8f-4vj8t               1/1     Running   0          5d',
            'coredns-6f6b679f8f-9mzpq               1/1     Running   0          5d',
            'etcd-controlplane                      1/1     Running   0          5d',
            'kube-apiserver-controlplane            1/1     Running   0          5d',
            'kube-controller-manager-controlplane   1/1     Running   0          5d',
            'kube-proxy-2xvkp                       1/1     Running   0          5d',
            'kube-proxy-9fqrm                       1/1     Running   0          5d',
            'kube-scheduler-controlplane            1/1     Running   0          5d',
          ],
          explanation: 'The kube-system namespace contains Kubernetes\' own components running as Pods! etcd, kube-apiserver, kube-scheduler, and kube-controller-manager all run here on the control plane node.',
          clusterState: {
            pods: [
              { id: 'etcd', name: 'etcd-controlplane', namespace: 'kube-system', node: 'node-1', status: 'Running', labels: {}, image: 'etcd', restarts: 0 },
              { id: 'api', name: 'kube-apiserver', namespace: 'kube-system', node: 'node-1', status: 'Running', labels: {}, image: 'kube-apiserver', restarts: 0 },
              { id: 'dns', name: 'coredns', namespace: 'kube-system', node: 'node-2', status: 'Running', labels: {}, image: 'coredns', restarts: 0 },
            ],
            services: [], deployments: [], namespaces: ['default', 'kube-system'], events: [],
          },
        },
      ],
      quiz: [
        {
          id: 'p0-m1-q1',
          question: 'What component do ALL kubectl commands communicate with first?',
          options: ['etcd', 'kube-apiserver', 'kube-scheduler', 'kubelet'],
          answer: 1,
          explanation: 'kube-apiserver is the single entry point for all cluster communication. Every kubectl command, every controller, and every node agent talks to the API server.',
        },
        {
          id: 'p0-m1-q2',
          question: 'What does "STATUS: Ready" mean on a node?',
          options: [
            'The node has no pods running on it',
            'The node\'s kubelet is healthy and it can accept new Pods',
            'The node is the control plane',
            'The node has enough memory for 100 pods',
          ],
          answer: 1,
          explanation: '"Ready" means the kubelet is reporting healthy status to the control plane and the node can be scheduled with new Pods.',
        },
        {
          id: 'p0-m1-q3',
          question: 'Which namespace contains Kubernetes\' own system components?',
          options: ['default', 'system', 'kube-system', 'kubernetes'],
          answer: 2,
          explanation: 'kube-system is a reserved namespace where all Kubernetes infrastructure components run (apiserver, etcd, scheduler, controller-manager, coredns, kube-proxy).',
        },
        {
          id: 'p0-m1-q4',
          question: 'What is the role of etcd in a Kubernetes cluster?',
          options: [
            'It routes network traffic between Pods',
            'It schedules Pods onto nodes',
            'It stores all cluster state as a key-value database',
            'It manages container lifecycles on nodes',
          ],
          answer: 2,
          explanation: 'etcd is a distributed key-value store that holds ALL cluster state — every resource, every configuration, every status. If etcd is lost without a backup, the cluster state is unrecoverable.',
        },
      ],
    },
    {
      id: 'p0-m2',
      slug: 'architecture',
      title: 'Cluster Architecture',
      description: 'Deep-dive into control plane and node components.',
      duration: '60 min',
      difficulty: 'beginner',
      theory: `> 🧠 **Brain Warm-Up**: When you run a command like \`kubectl apply\`, does the command communicate directly with the worker nodes or does it talk to something else? How do the worker nodes learn about your request? Think about this flow of communication.

## The Two Planes

A Kubernetes cluster is split into two logical areas: the Control Plane (the brain) and the Worker Nodes (the brawn).

**Control Plane** — makes global decisions (scheduling, handling events). Never runs your actual workloads.
- **kube-apiserver** — the front door; exposes the Kubernetes API and validates incoming requests.
- **etcd** — the cluster's database; stores all state as a key-value database.
- **kube-scheduler** — watches for new Pods and decides which node each Pod runs on based on resource needs.
- **kube-controller-manager** — runs loops to maintain desired state (e.g., node controller, replica controller).

**Worker Nodes** — host the actual containers that run your apps. Each node has:
- **kubelet** — the node foreman; ensures containers are running in a Pod according to instructions.
- **kube-proxy** — manages network routing rules for Services (directs traffic to Pods).
- **container runtime** — the software engine (typically containerd) that pulls images and runs the containers.

### Kubernetes Cluster Architecture Topology

\`\`\`
┌────────────────────────────────────────────────────────┐
│                    CONTROL PLANE                       │
│  ┌───────────────┐              ┌───────────────────┐  │
│  │  kube-apiserver ◄────────────►       etcd        │  │
│  └──────┬──────▲─┘              └───────────────────┘  │
│         │      │                                       │
│  ┌──────▼──────┴───────┐        ┌───────────────────┐  │
│  │ kube-controller-mgr │        │  kube-scheduler   │  │
│  └─────────────────────┘        └───────────────────┘  │
└─────────┬──────▲───────────────────────────────────────┘
            │      │  (Secure HTTPS communication via API Server port 6443)
┌─────────▼──────┴───────────────────────────────────────┐
│                      WORKER NODE                       │
│  ┌─────────────────────┐        ┌───────────────────┐  │
│  │       kubelet       │        │    kube-proxy     │  │
│  └──────────┬──────────┘        └─────────┬─────────┘  │
│             ▼                             ▼            │
│      containerd (CRI)               iptables (Routing) │
│    ┌───────────────────┐                               │
│    │  Pod 1   │ Pod 2  │                               │
│    └───────────────────┘                               │
└────────────────────────────────────────────────────────┘
\`\`\`

## The Reconciliation Loop

Kubernetes works on a declarative model: you declare your **desired state** (e.g., "run 3 replicas of web-app") and Kubernetes continuously compares it to **actual state** (e.g., "only 2 replicas are running"). If a discrepancy exists, controllers take action to reconcile it.

\`\`\`
You apply YAML (desired: 3 pods)
        ↓
API Server stores it in etcd
        ↓
Controller Manager sees: actual=0, desired=3
        ↓
Creates 3 Pods, Scheduler assigns them to nodes
        ↓
kubelet on each node starts the containers
        ↓
Status updated back to etcd via API Server
\`\`\``,
      labSteps: [
        {
          id: 'p0-m2-s1',
          title: 'Inspect the control plane',
          instruction: 'Describe the control plane node to see all its components.',
          command: 'kubectl describe node controlplane | grep -A20 "Conditions:"',
          output: [
            'Conditions:',
            '  Type             Status  LastHeartbeatTime   Reason',
            '  ----             ------  -----------------   ------',
            '  MemoryPressure   False   ...                 KubeletHasSufficientMemory',
            '  DiskPressure     False   ...                 KubeletHasNoDiskPressure',
            '  PIDPressure      False   ...                 KubeletHasSufficientPID',
            '  Ready            True    ...                 KubeletReady',
          ],
          explanation: 'The kubelet on each node reports Conditions to the control plane. "Ready: True" means the node is healthy. "MemoryPressure: True" would trigger pod evictions.',
          clusterState: { ...emptyCluster, highlightedComponent: 'kubelet' },
        },
        {
          id: 'p0-m2-s2',
          title: 'Watch the scheduler in action',
          instruction: 'Create a Pod and see which node the scheduler chooses.',
          command: 'kubectl run test-pod --image=nginx:1.27 --restart=Never',
          output: ['pod/test-pod created'],
          explanation: 'The scheduler reads the Pod\'s resource requests and node constraints, then picks the best node. This happens in milliseconds.',
          clusterState: {
            pods: [{ id: 'test', name: 'test-pod', namespace: 'default', node: 'node-2', status: 'Pending', labels: { run: 'test-pod' }, image: 'nginx:1.27', restarts: 0 }],
            services: [], deployments: [], namespaces: ['default'], events: ['Scheduled test-pod → node-2'],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p0-m2-s3',
          title: 'See the scheduling decision',
          instruction: 'Check which node the Pod was placed on.',
          command: 'kubectl get pod test-pod -o wide',
          output: [
            'NAME       READY   STATUS    RESTARTS   AGE   IP           NODE     NOMINATED NODE   READINESS GATES',
            'test-pod   1/1     Running   0          8s    10.244.2.5   node-2   <none>           <none>',
          ],
          explanation: 'The NODE column shows where the scheduler placed the Pod. The IP is assigned by the CNI plugin from the Pod network CIDR.',
          clusterState: {
            pods: [{ id: 'test', name: 'test-pod', namespace: 'default', node: 'node-2', status: 'Running', labels: { run: 'test-pod' }, image: 'nginx:1.27', restarts: 0 }],
            services: [], deployments: [], namespaces: ['default'], events: [],
          },
        },
        {
          id: 'p0-m2-s4',
          title: 'Clean up',
          instruction: 'Delete the test Pod to restore the empty cluster state.',
          command: 'kubectl delete pod test-pod',
          output: ['pod "test-pod" deleted'],
          explanation: 'When you delete a Pod, the API server removes it from etcd, and kubelet stops and removes the container. No replacement is created for bare Pods.',
          clusterState: { ...emptyCluster },
        },
      ],
      quiz: [
        {
          id: 'p0-m2-q1',
          question: 'What is the role of kube-scheduler?',
          options: [
            'Runs containers on worker nodes',
            'Decides which node each new Pod should run on',
            'Stores cluster state in etcd',
            'Routes network traffic between services',
          ],
          answer: 1,
          explanation: 'kube-scheduler watches for newly created Pods with no assigned node, then selects the best node based on resource availability, affinity rules, taints, and other constraints.',
        },
        {
          id: 'p0-m2-q2',
          question: 'The "reconciliation loop" means:',
          options: [
            'Kubernetes restarts the cluster every hour',
            'Kubernetes continuously compares desired state to actual state and closes any gap',
            'Controllers schedule Pods in a round-robin pattern',
            'etcd backs up data on a schedule',
          ],
          answer: 1,
          explanation: 'Controllers watch for desired state (in etcd) vs actual state (in the cluster) and take action to make them match. This is the core Kubernetes design pattern.',
        },
        {
          id: 'p0-m2-q3',
          question: 'If you delete a bare Pod (not in a Deployment), what happens?',
          options: [
            'Kubernetes automatically restarts it on another node',
            'The Pod is gone permanently — no replacement is created',
            'The Pod enters "Terminating" state forever',
            'kubelet reschedules it on the same node',
          ],
          answer: 1,
          explanation: 'Bare Pods have no controller watching over them. When deleted, they are gone. This is why you should always use Deployments for workloads you want to keep running.',
        },
        {
          id: 'p0-m2-q4',
          question: 'Which component on each worker node actually starts and stops containers?',
          options: ['kube-proxy', 'kube-scheduler', 'kubelet', 'kube-apiserver'],
          answer: 2,
          explanation: 'kubelet is the node agent. It watches the API server for Pods assigned to its node, then instructs the container runtime (containerd) to start or stop containers.',
        },
      ],
    },
    {
      id: 'p0-m3',
      slug: 'kubectl-kubeconfig',
      title: 'kubectl & kubeconfig',
      description: 'Master the CLI and configuration file that connect you to any Kubernetes cluster.',
      duration: '45 min',
      difficulty: 'beginner',
      theory: `> 🧠 **Brain Warm-Up**: If you manage 5 clusters (dev, staging, prod-us, prod-eu, local-minikube), how does a single kubectl binary know which cluster to talk to? Where are credentials stored, and how do you switch between them without breaking a live deployment?

## kubeconfig: Your Cluster Address Book

\`kubectl\` is a stateless binary — it reads a **kubeconfig** file on every invocation to know where to connect and how to authenticate. By default this file lives at \`~/.kube/config\`.

A kubeconfig file has three sections and one pointer:

\`\`\`yaml
apiVersion: v1
kind: Config
clusters:             # 1. Cluster endpoints (API server URL + CA cert)
  - name: prod-cluster
    cluster:
      server: https://api.prod.example.com:6443
      certificate-authority-data: <base64-CA>
users:                # 2. Credentials (client cert, token, or auth provider)
  - name: prod-admin
    user:
      client-certificate-data: <base64-cert>
      client-key-data: <base64-key>
contexts:             # 3. Named bindings: cluster + user + namespace
  - name: prod-context
    context:
      cluster: prod-cluster
      user: prod-admin
      namespace: production
current-context: prod-context   # ← active context
\`\`\`

## Contexts: Named Cluster Sessions

A **context** is a named triplet: cluster + user + namespace. Switching context changes which cluster kubectl targets next — it is safe and instant.

\`\`\`
kubeconfig
├── clusters: [dev-cluster, prod-cluster, local]
├── users:    [dev-admin, prod-admin, minikube]
├── contexts:
│   ├── dev   → dev-cluster  + dev-admin  + namespace: default
│   ├── prod  → prod-cluster + prod-admin + namespace: production
│   └── local → local        + minikube   + namespace: default
└── current-context: dev   ← kubectl uses this
\`\`\`

## Output Formats

| Flag | Use case |
|---|---|
| \`-o wide\` | Extra columns (Node IP, etc.) |
| \`-o yaml\` | Full resource as YAML |
| \`-o json\` | Full resource as JSON |
| \`-o jsonpath='{.metadata.name}'\` | Extract a specific field |
| \`-o name\` | Just resource names (scripting) |

## Merging Multiple kubeconfigs

When you receive credentials for a new cluster (from AWS EKS, GKE, kubeadm, etc.) you get a separate kubeconfig. Merge it safely:

\`\`\`bash
KUBECONFIG=~/.kube/config:~/new-cluster.yaml \\
  kubectl config view --merge --flatten > ~/.kube/merged.yaml
mv ~/.kube/merged.yaml ~/.kube/config
\`\`\`

Alternatively, use the \`KUBECONFIG\` env var to temporarily target a specific file:

\`\`\`bash
KUBECONFIG=~/project.yaml kubectl get pods
\`\`\`

## Productivity Tips

\`\`\`bash
alias k=kubectl
alias kgp='kubectl get pods'
alias kns='kubectl config set-context --current --namespace'

# Install kubectx/kubens for one-word context/namespace switching
brew install kubectx
kubectx prod      # switch context
kubens production # switch namespace
\`\`\``,
      labSteps: [
        {
          id: 'p0-m3-s1',
          title: 'Inspect the kubeconfig',
          instruction: 'Display the full kubeconfig to see clusters, users, and contexts.',
          command: 'kubectl config view',
          output: [
            'apiVersion: v1',
            'clusters:',
            '- cluster:',
            '    certificate-authority-data: DATA+OMITTED',
            '    server: https://127.0.0.1:6443',
            '  name: local',
            'contexts:',
            '- context:',
            '    cluster: local',
            '    user: kubernetes-admin',
            '    namespace: default',
            '  name: local',
            'current-context: local',
            'kind: Config',
            'users:',
            '- name: kubernetes-admin',
            '  user:',
            '    client-certificate-data: DATA+OMITTED',
            '    client-key-data: DATA+OMITTED',
          ],
          explanation: 'kubectl config view masks certificate data as DATA+OMITTED. The current-context field determines which cluster kubectl targets. The server URL is the kube-apiserver endpoint — the single entry point for all commands.',
          clusterState: { ...emptyCluster, highlightedComponent: 'apiserver' },
          tip: 'Use --raw to see actual base64-encoded certificate values (handle with care).',
        },
        {
          id: 'p0-m3-s2',
          title: 'List all contexts',
          instruction: 'See all contexts and which one is currently active.',
          command: 'kubectl config get-contexts',
          output: [
            'CURRENT   NAME           CLUSTER        AUTHINFO          NAMESPACE',
            '*         local          local          kubernetes-admin   default',
            '          prod           prod-cluster   prod-admin         production',
            '          staging        staging-k8s    staging-admin      staging',
          ],
          explanation: 'The asterisk (*) marks the active context. Each context is a named cluster+user+namespace triplet. Switching contexts is safe — it only changes where future commands point, nothing else.',
          clusterState: { ...emptyCluster },
          tip: '"kubectl config current-context" prints just the active context name — useful in shell prompts and scripts.',
        },
        {
          id: 'p0-m3-s3',
          title: 'Switch context',
          instruction: 'Switch the active context to point kubectl at a different cluster.',
          command: 'kubectl config use-context staging',
          output: ['Switched to context "staging".'],
          explanation: 'Switching context writes the new current-context value into ~/.kube/config. All subsequent kubectl commands target the staging cluster. Switch back any time with "kubectl config use-context local".',
          clusterState: { ...emptyCluster },
        },
        {
          id: 'p0-m3-s4',
          title: 'Set the default namespace for the current context',
          instruction: 'Stop typing -n on every command by persisting a namespace to the current context.',
          command: 'kubectl config set-context --current --namespace=staging',
          output: ['Context "local" modified.'],
          explanation: 'This writes the namespace into the active context entry in kubeconfig. All subsequent commands in this context default to the staging namespace without -n. Context changes are local to your machine and don\'t affect the cluster.',
          clusterState: { ...emptyCluster, namespaces: ['default', 'kube-system', 'staging'] },
          tip: 'Reset to default: "kubectl config set-context --current --namespace=default"',
        },
        {
          id: 'p0-m3-s5',
          title: 'Extract a field with jsonpath',
          instruction: 'Use jsonpath to extract just the API server URL from the kubeconfig.',
          command: "kubectl config view -o jsonpath='{.clusters[0].cluster.server}'",
          output: ['https://127.0.0.1:6443'],
          explanation: 'jsonpath is a query language for JSON/YAML structures. The -o jsonpath flag lets you extract any field from kubectl output — essential for scripting, CI pipelines, and automating cluster operations.',
          clusterState: { ...emptyCluster },
          tip: 'Combine with other commands: kubectl get pod nginx -o jsonpath=\'{.status.podIP}\' prints just the Pod IP.',
        },
      ],
      quiz: [
        {
          id: 'p0-m3-q1',
          question: 'What are the three top-level sections in a kubeconfig file?',
          options: [
            'pods, services, deployments',
            'clusters, users, contexts',
            'apiserver, etcd, kubelet',
            'namespaces, roles, bindings',
          ],
          answer: 1,
          explanation: 'A kubeconfig has three sections: clusters (API server URLs + CA certs), users (authentication credentials — client certs, tokens, or auth providers), and contexts (named combinations of cluster + user + optional namespace). The current-context field points to the active one.',
        },
        {
          id: 'p0-m3-q2',
          question: 'What is a kubeconfig "context"?',
          options: [
            'A running Kubernetes namespace',
            'A named combination of cluster + user + namespace',
            'An authentication token for the API server',
            'A kubectl command alias',
          ],
          answer: 1,
          explanation: 'A context is a named binding of: cluster (which API server to talk to) + user (which credentials to use) + optional namespace (default namespace for commands). Switching context instantly changes where kubectl points — it is safe and local to your machine.',
        },
        {
          id: 'p0-m3-q3',
          question: 'How do you make all kubectl commands in the current context default to namespace "production" without typing -n?',
          options: [
            'kubectl set-namespace production',
            'export KUBECTL_NAMESPACE=production',
            'kubectl config set-context --current --namespace=production',
            'kubectl namespace use production',
          ],
          answer: 2,
          explanation: '"kubectl config set-context --current --namespace=production" modifies the namespace field of the active context in kubeconfig. After this, all commands in that context use production as the default namespace.',
        },
        {
          id: 'p0-m3-q4',
          question: 'You receive a new kubeconfig file for a production cluster. How do you add it to your existing ~/.kube/config without losing existing contexts?',
          options: [
            'Replace ~/.kube/config entirely with the new file',
            'Use KUBECONFIG=~/.kube/config:new-cluster.yaml kubectl config view --merge --flatten to merge them',
            'Run kubectl import-config new-cluster.yaml',
            'Copy the file to ~/.kube/contexts/',
          ],
          answer: 1,
          explanation: 'The KUBECONFIG env var accepts colon-separated paths. Using --merge and --flatten with kubectl config view merges all contexts and outputs the combined result. This is the safe way to add new cluster configs without losing existing ones.',
        },
      ],
    },
  ],
}

export default phase0
