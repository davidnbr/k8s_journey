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
  hours: '~5 hours',
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
      theory: `## The Problem

Before Kubernetes, running containers at scale meant manually managing dozens or hundreds of servers. If a container crashed, you had to notice and restart it manually. Scaling meant SSHing into servers and running commands. Updates meant downtime.

**Kubernetes is a container orchestration platform** that automates these operational tasks:

- **Self-healing** — crashed containers restart automatically
- **Scaling** — scale from 1 to 1000 replicas with one command
- **Rolling updates** — deploy new versions with zero downtime
- **Service discovery** — containers find each other automatically
- **Resource management** — pack workloads efficiently across machines

## The Mental Model

Think of Kubernetes like a **shipping company**:
- The **Control Plane** is the company headquarters — it makes all decisions
- **Worker Nodes** are the cargo ships — they actually carry the containers
- **Pods** are the shipping containers — the unit of work
- **kubectl** is your radio — how you give instructions to HQ`,
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
      theory: `## The Two Planes

A Kubernetes cluster is split into two logical sections:

**Control Plane** — makes all decisions. Never runs your workloads.
- **kube-apiserver** — the front door; all communication goes here
- **etcd** — the cluster's database; stores all state
- **kube-scheduler** — decides which node each Pod runs on
- **kube-controller-manager** — runs reconciliation loops to maintain desired state

**Worker Nodes** — run your actual workloads. Each node has:
- **kubelet** — the node agent; ensures containers run as instructed
- **kube-proxy** — manages iptables/nftables/IPVS rules for Service routing *(optional — omitted when using eBPF-based CNIs like Cilium)*
- **container runtime** — actually runs containers (containerd)

## The Reconciliation Loop

Kubernetes works by constantly comparing **desired state** (what you asked for) to **actual state** (what exists). The controller-manager runs loops to close any gap.

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
  ],
}

export default phase0
