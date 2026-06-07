import type { Phase, ClusterState } from '@/lib/types'

const emptyCluster: ClusterState = {
  pods: [], services: [], deployments: [], namespaces: ['default'], events: [],
}

const phase6: Phase = {
  id: 'phase-6',
  slug: 'phase-6',
  title: 'Certification Prep (KCNA, CKA, CKAD)',
  shortTitle: 'P6 · Cert Prep',
  description: 'Prepare for KCNA, CKA, and CKAD certifications with domain-focused practice, speed drills, and exam-level troubleshooting scenarios.',
  weeks: 'Weeks 11+',
  hours: '~40 hours',
  color: 'text-lime-400',
  bgColor: 'bg-lime-500/10 border-lime-500/30',
  modules: [
    // ─── Module 1: KCNA ──────────────────────────────────────────────────────
    {
      id: 'p6-m1',
      slug: 'kcna',
      title: 'KCNA: Kubernetes & Cloud Native Associate',
      description: 'Understand cloud-native architecture, CNCF projects, observability, and container orchestration basics for the entry-level certification.',
      duration: '10 hours',
      difficulty: 'intermediate',
      theory: `> 🧠 **Brain Warm-Up**: How does the CNCF categorize project maturity, and why does Kubernetes use a gRPC-based Container Runtime Interface (CRI) instead of talking directly to Docker daemon? Think about it before reading below.

## What is the KCNA?

The **Kubernetes and Cloud Native Associate (KCNA)** exam is a pre-professional certification designed to test foundational knowledge of Kubernetes and the wider cloud-native ecosystem.

Unlike the practical CKA or CKAD, the KCNA is a **multiple-choice exam** consisting of 60 questions in 90 minutes.

### KCNA Exam Domains

1. **Kubernetes Fundamentals (46%)**
   - Core API primitives (Pods, Deployments, Services, ConfigMaps, Secrets, PVs/PVCs)
   - Cluster architecture (Control Plane, Nodes, etcd, kube-apiserver, kubelet, container runtimes)
2. **Container Orchestration (22%)**
   - Container orchestration basics (scaling, high availability, scheduling)
   - Container runtimes (CRI, containerd, Docker shim history)
3. **Cloud Native Architecture (16%)**
   - CNCF fundamentals (graduation levels, landscape areas)
   - Serverless, cloud-native storage, and networking concepts
4. **Cloud Native Observability (8%)**
   - Logging, metrics, tracing (Prometheus, OpenTelemetry)
5. **Cloud Native Application Delivery (8%)**
   - GitOps concepts, CI/CD, Helm package management

### Visualizing CRI Architecture

The Container Runtime Interface (CRI) abstractly decouples the Kubelet from the underlying container execution engines. Below is the workflow from API invocation down to container initiation:

\`\`\`
+------------------+
|     Kubelet      |
+--------+---------+
         |
         | gRPC API (over UNIX Domain Socket)
         v
+------------------------------------+
| CRI Engine (containerd or CRI-O)  | <--- Manages Pod Sandbox, pulls images,
+--------+---------------------------+      networks setup, mounts volumes
         |
         | OCI Specification (JSON bundle)
         v
+------------------+
| OCI runc / crun  | <--- Lightweight CLI tool that executes container actions
+--------+---------+
         |
         | Linux Kernel system calls (clone, setns, unshare, pivot_root)
         v
+------------------------------------------+
| Linux Kernel (namespaces & cgroups v2)   | <--- Resource containment & isolation
+------------------------------------------+
\`\`\`

### Visualizing CNCF Project Maturity Funnel

Projects advance through the CNCF landscape based on strict adoption, governance, and stability criteria:

\`\`\`
  +--------------------------------------------+
  |              CNCF Sandbox                  |  <-- Experimental, low barrier of entry,
  |  (e.g., Kube-vip, Cluster API, Radius)    |      intellectual property transferred.
  +--------------------+-----------------------+
                       |
                       v
  +--------------------+-----------------------+
  |             CNCF Incubating                |  <-- Production ready, healthy governance,
  | (e.g., Keda, Thanos, Dapr, Cilium, Knative) |      documented production adoption.
  +--------------------+-----------------------+
                       |
                       v
  +--------------------+-----------------------+
  |              CNCF Graduated                |  <-- Industry standards, high security bar,
  |  (e.g., Kubernetes, Prometheus, Helm, OTel) |      mature governance, multiple org maintainers.
  +--------------------------------------------+
\`\`\`

### Deep-Dive: Cloud Native Internals & the CNCF Landscape

#### 1. Container Runtime Interface (CRI) & OCI
Historically, Kubernetes communicated directly with Docker via the hardcoded \`dockershim\` inside the Kubelet. As other runtimes like CoreOS's rkt emerged, the community established the **Container Runtime Interface (CRI)** in Kubernetes v1.5. The CRI is a **gRPC API specification** comprising two primary services:
* **RuntimeService**: Manages the pod sandbox lifecycle (e.g., setting up namespaces, network interfaces) and container execution.
* **ImageService**: Manages pulling, storing, listing, and removing container images.

When the Kubelet schedules a Pod, it issues gRPC calls to the CRI runtime socket (e.g., \`unix:///run/containerd/containerd.sock\`). The CRI runtime (e.g., \`containerd\`, \`CRI-O\`) translates these instructions into filesystem structures conforming to the **Open Container Initiative (OCI)** runtime specification, and invokes an OCI-compliant runtime like \`runc\` or \`crun\` to spin up the actual Linux processes.

#### 2. CNCF Project Maturity Framework
The Cloud Native Computing Foundation (CNCF) organizes projects into three tiers to guide adopters on stability and production-readiness:
* **Sandbox**: A playground for experimental, promising technologies. Requires minimal validation.
* **Incubating**: Demonstrates solid production use cases, clear governance, a growing contributor base, and has undergone a formal security audit.
* **Graduated**: The gold standard. Must meet all incubating criteria, have multiple major organizations committing code, show vast production deployment scale, and pass a rigorous third-party security audit.

#### 3. Cloud Native Observability & OpenTelemetry (OTel)
Telemetry collection has evolved from fragmented agent architectures to a standardized approach via **OpenTelemetry (OTel)**. OTel merges OpenTracing and OpenMetrics. The observability stack features three pillars:
* **Metrics**: Numeric values representing system performance over time (CPU utilization, HTTP error counts). Typically gathered pull-style by **Prometheus**.
* **Logs**: Timestamped lines of text representing structured or unstructured events. Collected via tools like FluentBit or Vector.
* **Traces**: End-to-end latency breakdowns representing a request traversing microservices (spans).

The **OTel Collector** pipeline consists of:
1. **Receivers**: How data gets into the collector (pull or push; e.g., OTLP, Prometheus, Jaeger protocols).
2. **Processors**: How data is mutated, batched, filtered, or scrubbed of PII.
3. **Exporters**: Where data is sent (e.g., Prometheus remote-write, Elasticsearch, Jaeger).

#### 4. GitOps & Cloud Native Application Delivery
**GitOps** is a paradigm where git repositories are the single source of truth for declarative infrastructure. A reconciliation loop compares the desired state in Git with the running state in the cluster.
* **Pull-Based GitOps**: An agent inside the cluster (e.g., ArgoCD or Flux) continuously monitors Git and pulls changes. This is highly secure, as credentials to modify the cluster do not leave the cluster.
* **Push-Based GitOps**: A traditional CI/CD pipeline (e.g., GitHub Actions, GitLab CI) triggers on a git push, executing \`kubectl apply\` using external cluster credentials. This is easier to set up but introduces a wider security perimeter.`,
      labSteps: [
        {
          id: 'p6-m1-s1',
          title: 'Review Kubernetes Architecture Components',
          instruction: 'View all running pods in the kube-system namespace to identify core control plane components.',
          command: 'kubectl get pods -n kube-system',
          output: [
            'NAMESPACE     NAME                               READY   STATUS    RESTARTS   AGE',
            'kube-system   coredns-78fcd69978-abcde           1/1     Running   0          42d',
            'kube-system   etcd-node-1                        1/1     Running   0          42d',
            'kube-system   kube-apiserver-node-1              1/1     Running   0          42d',
            'kube-system   kube-controller-manager-node-1     1/1     Running   0          42d',
            'kube-system   kube-proxy-abcde                   1/1     Running   0          42d',
            'kube-system   kube-scheduler-node-1              1/1     Running   0          42d',
          ],
          explanation: 'In a standard self-hosted cluster (e.g. provisioned by kubeadm), the control plane components run as static pods in the `kube-system` namespace. kube-apiserver coordinates all operations; etcd stores cluster state; kube-scheduler schedules pods; kube-controller-manager runs control loops.',
          clusterState: {
            pods: [
              { id: 'etcd', name: 'etcd-node-1', namespace: 'kube-system', node: 'node-1', status: 'Running', labels: { component: 'etcd' }, image: 'registry.k8s.io/etcd:3.5.10', restarts: 0 },
              { id: 'apiserver', name: 'kube-apiserver-node-1', namespace: 'kube-system', node: 'node-1', status: 'Running', labels: { component: 'kube-apiserver' }, image: 'registry.k8s.io/kube-apiserver:v1.30.0', restarts: 0 },
              { id: 'scheduler', name: 'kube-scheduler-node-1', namespace: 'kube-system', node: 'node-1', status: 'Running', labels: { component: 'kube-scheduler' }, image: 'registry.k8s.io/kube-scheduler:v1.30.0', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system'],
            events: ['Control plane components verified'],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p6-m1-s2',
          title: 'Verify Cluster Node Health and OS/Runtime Info',
          instruction: 'Describe the nodes to inspect their OS version and container runtime engine (CRI).',
          command: 'kubectl get nodes -o wide',
          output: [
            'NAME     STATUS   ROLES    AGE   VERSION   INTERNAL-IP   OS-IMAGE             KERNEL-VERSION      CONTAINER-RUNTIME',
            'node-1   Ready    control  42d   v1.30.0   10.244.0.1    Ubuntu 22.04.3 LTS   5.15.0-101-generic  containerd://1.7.13',
            'node-2   Ready    worker   42d   v1.30.0   10.244.0.2    Ubuntu 22.04.3 LTS   5.15.0-101-generic  containerd://1.7.13',
          ],
          explanation: 'KCNA targets understanding of the Container Runtime Interface (CRI). Modern Kubernetes clusters use `containerd` or `CRI-O` rather than standard Docker directly, because Docker lacks native CRI compliance.',
          clusterState: {
            ...emptyCluster,
            namespaces: ['default'],
            events: ['Nodes fetched. CRI: containerd verified on all worker nodes'],
          },
        },
        {
          id: 'p6-m1-s3',
          title: 'Examine CNCF Landscape and API Groups',
          instruction: 'Retrieve the active API groups inside the cluster API server.',
          command: 'kubectl api-versions',
          output: [
            'admissionregistration.k8s.io/v1',
            'apps/v1',
            'authentication.k8s.io/v1',
            'authorization.k8s.io/v1',
            'autoscaling/v2',
            'batch/v1',
            'certificates.k8s.io/v1',
            'coordination.k8s.io/v1',
            'networking.k8s.io/v1',
            'rbac.authorization.k8s.io/v1',
            'storage.k8s.io/v1',
            'v1',
          ],
          explanation: 'Kubernetes resources are structured into distinct API groups. The core/legacy group is represented by simple `v1`. Apps (like Deployments) reside in `apps/v1`, networking components in `networking.k8s.io/v1`, and RBAC settings in `rbac.authorization.k8s.io/v1`. This modular API allows Kubernetes to expand without mutating its core primitives.',
          clusterState: {
            ...emptyCluster,
            namespaces: ['default'],
            events: ['API groups queried'],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p6-m1-s4',
          title: 'Observe Metrics with metrics-server',
          instruction: 'Retrieve cluster CPU and memory usage statistics for nodes and pods.',
          command: 'kubectl top nodes',
          output: [
            'NAME     CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%',
            'node-1   180m         9%     1524Mi          38%',
            'node-2   350m         17%    2410Mi          60%',
          ],
          explanation: 'For monitoring and autoscaling (e.g. HPA) to work, a metrics provider like the CNCF `metrics-server` must be installed. This server fetches metrics from kubelet Resource Metrics API (via cAdvisor) and exposes them on the API server.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Resource metrics successfully fetched via metrics-server'],
          },
        },
        {
          id: 'p6-m1-s5',
          title: 'Audit CNCF Application Delivery (Helm Release Check)',
          instruction: 'List the application releases deployed via the Helm package manager.',
          command: 'helm list -A',
          output: [
            'NAME            NAMESPACE   REVISION    UPDATED                                 STATUS      CHART               APP VERSION',
            'ingress-nginx   ingress-sys 1           2026-03-22 14:10:02.123456 -0500 EST   deployed    ingress-nginx-4.9.1 1.11.3     ',
            'prometheus      monitoring  2           2026-03-23 09:30:15.654321 -0500 EST   deployed    kube-prometheus-2.5 11.4.0     ',
          ],
          explanation: 'Helm is the graduated package manager for Kubernetes. Helm wraps collections of YAML files into versioned archives called Charts, saving release state inside Secrets in the target namespace.',
          clusterState: {
            pods: [
              { id: 'ingress-nginx', name: 'ingress-nginx-controller-abcde', namespace: 'ingress-sys', node: 'node-1', status: 'Running', labels: { app: 'ingress-nginx' }, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'ingress-sys', 'monitoring'],
            events: ['Helm releases listed. Detected: ingress-nginx, prometheus'],
          },
        },
      ],
      quiz: [
        {
          id: 'p6-m1-q1',
          question: 'Which of the following describes the relationship between CRI and containerd?',
          options: [
            'CRI is the command-line utility used to interact with containerd',
            'CRI is the specification (Container Runtime Interface) defining how Kubernetes communicates with runtimes, and containerd is a compliant implementation',
            'containerd has been deprecated in favor of CRI in Kubernetes 1.35',
            'CRI is cloud-native, whereas containerd is a virtual machine interface',
          ],
          answer: 1,
          explanation: 'CRI is the standardized plugin interface that allows the kubelet to support different container runtimes without recompiling. containerd is a high-level container runtime that implements the CRI interface.',
        },
        {
          id: 'p6-m1-q2',
          question: 'What is the maturity status of Prometheus and Helm in the CNCF?',
          options: [
            'Sandbox (experimental)',
            'Incubating (verified in limited production)',
            'Graduated (fully stable and widely adopted in production)',
            'Prometheus is Graduated; Helm is still Sandbox',
          ],
          answer: 2,
          explanation: 'Both Prometheus and Helm are Graduated CNCF projects, signifying they have achieved mature governance, wide adoption, and strong security practices.',
        },
        {
          id: 'p6-m1-q3',
          question: 'In GitOps workflows, what is the single source of truth for the desired cluster state?',
          options: [
            'The active memory of the control plane API server',
            'A Git repository containing declarative manifests',
            'The backing database etcd',
            'A localized Docker registry',
          ],
          answer: 1,
          explanation: 'In GitOps, the desired state of infrastructure/applications is declared in a Git repository. A reconciliation agent (like ArgoCD or Flux) reads from Git and applies changes to match the cluster actual state.',
        },
        {
          id: 'p6-m1-q4',
          question: 'Which component is responsible for gathering metrics from container runtimes on a node and feeding them to metrics-server?',
          options: [
            'kube-proxy',
            'kube-scheduler',
            'cAdvisor (integrated into kubelet)',
            'Prometheus Agent',
          ],
          answer: 2,
          explanation: 'cAdvisor (Container Advisor) is built directly into the kubelet binary. It analyzes and exposes resource usage and performance data from running containers, which metrics-server then queries.',
        },
        {
          id: 'p6-m1-q5',
          question: 'Which control plane component updates endpoints or routes when a Pod is added to or removed from a Service?',
          options: [
            'kube-scheduler',
            'etcd',
            'kube-controller-manager (via the EndpointSlice Controller)',
            'kubelet',
          ],
          answer: 2,
          explanation: 'The kube-controller-manager runs the controller loops, including the EndpointSlice controller, which monitors changes to Pods and Services and updates the corresponding EndpointSlice resources.',
        },
      ],
      coverage: {
        concepts: ['KCNA: vendor-neutral Kubernetes fundamentals certification', 'container fundamentals: images, namespaces, cgroups', 'Kubernetes architecture: control plane vs worker node components', 'Cloud Native landscape: CNCF projects and categories', 'service mesh, observability, GitOps as ecosystem pillars', 'Kubernetes API: declarative model, resources, objects', 'container orchestration problem: why Kubernetes exists'],
        commands: ['kubectl get nodes', 'kubectl cluster-info', 'kubectl api-resources', 'kubectl explain pod.spec', 'kubectl get componentstatuses'],
        architecture: ['control plane: API server, etcd, scheduler, controller-manager', 'worker node: kubelet, kube-proxy, container runtime', 'etcd as consistent distributed key-value store for all cluster state', 'CNCF ecosystem layers: runtime, orchestration, provisioning, observability'],
        techniques: ['use kubectl explain to explore API without docs', 'memorize control plane component responsibilities for KCNA MCQs', 'map CNCF projects to landscape categories'],
        procedures: ['review KCNA exam domains: Kubernetes Fundamentals (46%), Container Orchestration (22%), Cloud Native Architecture (16%), Cloud Native Observability (8%), Cloud Native Application Delivery (8%)', 'practice with kubectl explain and api-resources for API fluency'],
        toolsAndPlugins: ['kubectl', 'CNCF landscape', 'containerd', 'etcd'],
        cases: ['KCNA multiple choice: identify which component handles scheduling decisions', 'KCNA: identify correct CNCF project category for a given tool'],
        scenarios: ['KCNA exam prep: quick recall of all control plane component roles', 'identify which Kubernetes object type solves a given problem'],
      },
      exercises: [
        {
          id: 'p6-m1-e1',
          title: 'Explore cluster architecture with kubectl',
          kind: 'guided',
          goal: 'Use kubectl to inspect all control plane and node components, mapping each to its KCNA role.',
          commands: [
            'kubectl get nodes -o wide',
            'kubectl cluster-info',
            'kubectl get pods -n kube-system',
            'kubectl describe node $(kubectl get nodes -o jsonpath="{.items[0].metadata.name}") | grep -A5 "Conditions:"',
            'kubectl api-resources | grep -E "NAME|^pods|^deploy|^service|^node"',
          ],
          verify: ['kube-system shows apiserver, etcd, scheduler, controller-manager pods', 'Node conditions show Ready=True', 'api-resources lists core resources'],
          expectedOutcome: 'All control plane components identified and mapped to their roles.',
          cleanup: [],
        },
        {
          id: 'p6-m1-e2',
          title: 'KCNA domain drill — API and object recall',
          kind: 'challenge',
          goal: 'Use kubectl explain to explore object specs from memory, simulating KCNA API knowledge questions.',
          commands: [
            'kubectl explain pod.spec.containers.resources',
            'kubectl explain deployment.spec.strategy',
            'kubectl explain service.spec.type',
            'kubectl explain networkpolicy.spec',
            'kubectl api-resources --namespaced=false | head -20',
          ],
          verify: ['Can use kubectl explain without docs', 'Non-namespaced resources identified (Node, ClusterRole, PV, etc.)'],
          expectedOutcome: 'kubectl explain workflow confirmed for KCNA API fluency.',
          cleanup: [],
        },
        {
          id: 'p6-m1-e3',
          title: 'Debug: which component is unhealthy?',
          kind: 'debug',
          goal: 'Simulate diagnosing a control plane component failure by inspecting system pod logs.',
          commands: [
            'kubectl get pods -n kube-system | grep -E "scheduler|controller|etcd|apiserver"',
            'kubectl logs -n kube-system -l component=kube-scheduler --tail=10 2>/dev/null || echo "no scheduler logs"',
            'kubectl get events -n kube-system --sort-by=.lastTimestamp | tail -10',
          ],
          verify: ['Control plane pods all Running', 'No error events in kube-system'],
          expectedOutcome: 'Control plane health check commands confirmed.',
          cleanup: [],
        },
        {
          id: 'p6-m1-e4',
          title: '7-day spaced review — KCNA domain coverage',
          kind: 'spaced-review',
          goal: 'Recall KCNA exam domains and component roles from memory without reference.',
          commands: [
            'kubectl get pods -n kube-system -o wide',
            'kubectl get nodes',
          ],
          verify: ['Can list 5 KCNA exam domains with approximate weights', 'Can name all 4 control plane components and their roles', 'Can explain difference between kube-proxy and kubelet'],
          expectedOutcome: 'KCNA architecture knowledge solidified.',
          cleanup: [],
        },
      ],
    },
    // ─── Module 2: CKA ───────────────────────────────────────────────────────
    {
      id: 'p6-m2',
      slug: 'cka',
      title: 'CKA: Certified Kubernetes Administrator',
      description: 'Master cluster installation, troubleshooting nodes, etcd maintenance, imperative operations, storage, and complex networking scenarios under time pressure.',
      duration: '15 hours',
      difficulty: 'advanced',
      theory: `> 🧠 **Brain Warm-Up**: What low-level system checks does the Kubelet perform when determining if a node is 'Ready', and why must swap space be disabled under cgroups v1/v2 scheduling? Think about it before reading below.

## The CKA Exam Format

The **Certified Kubernetes Administrator (CKA)** is a highly respected, **100% practical, hands-on exam** containing 15-20 scenarios to solve in 2 hours.

You will be given multiple cluster contexts and terminal access to solve real-world system administration problems.

### CKA Exam Domains

1. **Troubleshooting (30%)**
   - Diagnose node failures (kubelet crash, docker down, systemd faults)
   - Diagnose networking issues (CNI issues, CoreDNS failures)
   - Fix failing applications (logs, describe, crash loops)
2. **Cluster Architecture, Installation & Configuration (25%)**
   - Upgrade control plane and worker nodes with \`kubeadm\`
   - Back up and restore the etcd database
   - Securely manage RBAC (ServiceAccounts, Roles, RoleBindings, ClusterRoles)
3. **Services & Networking (20%)**
   - Config Ingress routes, Services, DNS names, and CNI configurations
   - Set up NetworkPolicies to isolate namespace traffic
4. **Workloads & Scheduling (15%)**
   - Configure Deployments, replica scaling, rolling updates
   - Use NodeSelectors, Affinity rules, Taints and Tolerations
5. **Storage (10%)**
   - Provision PVs, PVCs, StorageClasses, and configure pod volumes

### Visualizing Node Health & Diagnostics Flow

The Kubelet continuously checks underlying subsystems. If any health boundary is breached, the lease update reflects pressure conditions or a flat 'NotReady' status:

\`\`\`
+-----------------------------------------------------------------+
|                       Kubelet Node Agent                        |
+--------+--------------------+------------------+--------+--------+
         |                    |                  |        |
         v                    v                  v        v
  [ CRI Socket Ping ]   [ Eviction Manager ]  [ systemd ] [ Lease API ]
  - Is containerd active? - Memory Pressure    - Active?   - Every 10s
  - OCI runc responsive?  - Disk Pressure      - Configs?  - Keep-alive
  - gRPC ping OK?         - PID Pressure       - Logs OK?  - Heartbeat
\`\`\`

### Visualizing etcd Backup and Restore Mechanics

Because etcd is the single source of truth for cluster state, operations must use authentic client certificates:

\`\`\`
Backup Phase:
[ Admin CLI ] ---> (etcdctl snapshot save --cacert=... --cert=... --key=...) ---> [ Port 2379 ] ---> [ etcd DB ] ---> Writes [ snapshot.db ]

Restore Phase:
1. Stop API server (Move /etc/kubernetes/manifests/* to safety)
2. Run restore command:
   [ etcdctl snapshot restore /srv/data/etcd-snapshot.db --data-dir=/var/lib/etcd-new ]
3. Update etcd static pod manifest to point to the new data-dir
4. Restore API server manifest to resume control plane loop
\`\`\`

### CKA Deep-Dive: Node Troubleshooting, etcd, & Networking Internals

#### 1. Node Ready Diagnostics & Kubelet Eviction Manager
A node's transition to \`NotReady\` is orchestrated by the **Kubelet Eviction Manager**. The Kubelet monitors system resource thresholds against configured eviction parameters (e.g., \`memory.available < 100Mi\`, \`nodefs.available < 10%\`). If a threshold is breached, the Kubelet:
1. Sets Node Conditions (e.g., \`MemoryPressure = True\`, \`DiskPressure = True\`).
2. Rejects incoming Pods and schedules active Pods for eviction according to QoS class priority (BestEffort → Burstable → Guaranteed).
3. Transmits heartbeat leases to the API server in the \`kube-node-lease\` namespace every 10 seconds. If the Kubelet crashes or loses connection to the container runtime, these heartbeat leases time out, causing the **kube-controller-manager**'s Node LifeCycle Controller mark the node as \`NotReady\` or \`Unknown\`.

#### 2. Kubelet Swap Space Restrictions
Historically, the Kubelet required disabling swap space on host nodes (\`swapoff -a\`).
* **Resource Predictability**: The Kubernetes scheduler selects nodes based on available CPU/memory requests. If a node swaps memory to disk, the OS scheduler bypasses the limits. A container could exceed memory request/limits without being terminated, leading to node performance degradation.
* **Cgroups Isolation**: Linux Control Groups (cgroups v1) did not natively separate swap space allocation per-container. Under **cgroups v2**, swap limits can be configured, allowing modern Kubernetes releases (v1.28+) to support swap space with explicit \`failSwapOn: false\` configuration, although disabling swap remains the safest path for CKA exam consistency.

#### 3. etcd Raft Consensus & PKI Maintenance
The etcd datastore uses the **Raft consensus algorithm** to ensure state consistency across control plane members. Raft requires a majority quorum ($Q = \lfloor N/2 \rfloor + 1$) to validate state changes and write transactions.
* **Ports**: etcd listens on port \`2379\` for client requests (from the API server) and port \`2380\` for peer-to-peer raft synchronization.
* **TLS Authentication**: etcd is secured with mutual TLS (mTLS). Admin actions require pointing \`etcdctl\` to the certificate authority (\`ca.crt\`), client certificate (\`server.crt\` or \`peer.crt\`), and client key (\`server.key\`).
* **Restoration Mechanics**: To perform a clean etcd restore, you must halt all write traffic. In a standard \`kubeadm\` cluster, moving static pod manifests out of \`/etc/kubernetes/manifests\` causes the Kubelet to terminate the local \`kube-apiserver\` and \`etcd\` pods. You can then run \`etcdctl snapshot restore\` into a fresh directory, update the etcd manifest path, and restore the control plane.

#### 4. NetworkPolicies: Under-the-Hood Implementation
NetworkPolicies are declarative rules targeting Pod groups. Kubernetes does not enforce NetworkPolicies itself; it delegates enforcement to the installed **CNI (Container Network Interface)** plugin.
* **iptables Engine**: Plugins like Calico convert NetworkPolicy selectors into Linux \`iptables\` chains and rules, utilizing \`ipset\` for matching multiple pod IPs dynamically without scaling latency.
* **eBPF Engine**: Modern CNIs like Cilium compile rules directly into **eBPF (Extended Berkeley Packet Filter)** bytecodes, attaching them directly to the veth interfaces of the containers. This avoids iptables packet routing overhead and yields near-native throughput.

### High-Speed Imperative Commands Cheat Sheet

Time is your primary enemy in the CKA. NEVER write YAML from scratch. Use imperative commands to generate blueprints:

- **Create a Deployment**:
  \`\`\`bash
  kubectl create deployment my-dep --image=nginx:alpine --replicas=3 --dry-run=client -o yaml > dep.yaml
  \`\`\`
- **Expose a Pod/Deployment**:
  \`\`\`bash
  kubectl expose deployment my-dep --port=80 --target-port=80 --type=ClusterIP --name=my-svc --dry-run=client -o yaml > svc.yaml
  \`\`\`
- **Set Up a Quick Role**:
  \`\`\`bash
  kubectl create role my-role --verb=get,list,watch --resource=pods,deployments --dry-run=client -o yaml
  \`\`\`
- **Temporary debug container**:
  \`\`\`bash
  kubectl run debug-pod --image=busybox --restart=Never --rm -it -- sh
  \`\`\`

### CKA Vim Tuning
Add these lines to your \`~/.vimrc\` immediately at the start of the exam to speed up editing YAML files:
\`\`\`vim
set ts=2 sw=2 expandtab
syntax on
set number
\`\`\``,
      labSteps: [
        {
          id: 'p6-m2-s1',
          title: 'Imperative Speed Drill: Workloads & Services',
          instruction: 'Imperatively create a deployment named "web-app" using nginx:alpine with 3 replicas. Expose it via a Service "web-service" on port 80/TCP.',
          command: 'kubectl create deployment web-app --image=nginx:alpine --replicas=3 --dry-run=client -o yaml > d.yaml && kubectl apply -f d.yaml && kubectl expose deployment web-app --port=80 --target-port=80 --name=web-service',
          output: [
            'deployment.apps/web-app created',
            'service/web-service exposed',
          ],
          explanation: 'Running both commands imperatively generates the resource manifests and applies them in seconds. The service selector auto-pairs with the deployment labels (`app=web-app`).',
          clusterState: {
            pods: [
              { id: 'web-1', name: 'web-app-8fcd69978-a1b2c', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web-app' }, image: 'nginx:alpine', restarts: 0 },
              { id: 'web-2', name: 'web-app-8fcd69978-d3e4f', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web-app' }, image: 'nginx:alpine', restarts: 0 },
              { id: 'web-3', name: 'web-app-8fcd69978-g5h6i', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web-app' }, image: 'nginx:alpine', restarts: 0 },
            ],
            services: [
              { id: 'web-service', name: 'web-service', namespace: 'default', type: 'ClusterIP', selector: { app: 'web-app' }, port: 80, clusterIP: '10.96.14.22' },
            ],
            deployments: [
              { id: 'web-app-deploy', name: 'web-app', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:alpine' },
            ],
            namespaces: ['default'],
            events: ['web-app deployment scaled to 3 replicas', 'web-service exposed'],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p6-m2-s2',
          title: 'Troubleshoot a Dead Node (kubelet crash)',
          instruction: 'Diagnose why worker node-2 is in NotReady state. Check its service log and systemd controller.',
          command: 'systemctl status kubelet',
          output: [
            '● kubelet.service - Kubernetes Kubelet Server',
            '   Loaded: loaded (/lib/systemd/system/kubelet.service; enabled; vendor preset: enabled)',
            '   Active: inactive (dead) since Mon 2026-05-25 10:00:00 EST; 5min ago',
            '     Docs: https://github.com/kubernetes/kubernetes',
            ' Process: 12456 ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS (code=exited, status=255/EXCEPTION)',
          ],
          explanation: 'If a node shows `NotReady` status, SSH into the node and inspect systemd logs. Standard cause is the kubelet process crashing or halted. Check output of `journalctl -u kubelet -n 50`. Typical issues include swap enabled on the node, bad path config, or wrong api-server address.',
          clusterState: {
            pods: [
              { id: 'web-2', name: 'web-app-8fcd69978-d3e4f', namespace: 'default', node: 'node-2', status: 'Pending', labels: { app: 'web-app' }, image: 'nginx:alpine', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'Node node-2 transitioned to NotReady',
              'kubelet daemon stopped on node-2',
            ],
            highlightedComponent: 'kubelet',
          },
          tip: 'Always disable swap via `swapoff -a` or check `/var/lib/kubelet/config.yaml` to ensure the API server URL points to the correct IP.',
        },
        {
          id: 'p6-m2-s3',
          title: 'RBAC Authorization under Time Pressure',
          instruction: 'Create a ServiceAccount named "app-developer" in namespace "development". Bind it to a Role that allows creating, listing, and updating Pods and Deployments.',
          command: 'kubectl create sa app-developer -n development && kubectl create role app-role --verb=create,get,list,update --resource=pods,deployments -n development && kubectl create rolebinding app-rb --role=app-role --serviceaccount=development:app-developer -n development',
          output: [
            'serviceaccount/app-developer created',
            'role.rbac.authorization.k8s.io/app-role created',
            'rolebinding.rbac.authorization.k8s.io/app-rb created',
          ],
          explanation: 'RBAC roles authorize operations in Kubernetes. Creating the SA, Role, and RoleBinding in one command line sequence prevents typos and saves significant CKA exam time.',
          clusterState: {
            ...emptyCluster,
            namespaces: ['default', 'development'],
            events: ['RBAC components created inside development namespace'],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p6-m2-s4',
          title: 'Backup & Restore etcd State',
          instruction: 'Take a snapshot backup of etcd state using the etcdctl utility.',
          command: 'ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key snapshot save /srv/data/etcd-snapshot.db',
          output: [
            'Snapshot saved at /srv/data/etcd-snapshot.db',
          ],
          explanation: 'etcd is the single state database. Backing it up requires specifying the correct CA certificate, client certificate, and client private key to authenticate. The files are usually found in `/etc/kubernetes/pki/etcd/` on control plane nodes.',
          clusterState: {
            ...emptyCluster,
            namespaces: ['default'],
            events: ['etcd database state snapshotted successfully to /srv/data/etcd-snapshot.db'],
            highlightedComponent: 'etcd',
          },
        },
        {
          id: 'p6-m2-s5',
          title: 'Secure Namespace Traffic (NetworkPolicy)',
          instruction: 'Implement a NetworkPolicy to allow ingress to database pods only from backend app pods.',
          command: 'kubectl apply -f- -<<EOF\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: allow-db-backend\n  namespace: default\nspec:\n  podSelector:\n    matchLabels:\n      app: database\n  policyTypes:\n  - Ingress\n  ingress:\n  - from:\n    - podSelector:\n        matchLabels:\n          role: backend\n    ports:\n    - protocol: TCP\n      port: 5432\nEOF',
          output: [
            'networkpolicy.networking.k8s.io/allow-db-backend created',
          ],
          explanation: 'By default, all pods in a cluster can talk to all other pods. Applying this policy isolates the `app: database` pod. Any pod lacking the label `role: backend` will be blocked from sending traffic to port 5432.',
          clusterState: {
            pods: [
              { id: 'db-pod', name: 'db-postgres-8fcd69', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'database' }, image: 'postgres:16-alpine', restarts: 0 },
              { id: 'backend-pod', name: 'backend-api-8fcd69', namespace: 'default', node: 'node-2', status: 'Running', labels: { role: 'backend' }, image: 'myrepo/api:v1', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['NetworkPolicy active. App database restricted to ingress from tier: backend'],
            highlightedComponent: 'proxy',
          },
        },
        {
          id: 'p6-m2-s6',
          title: 'Durable Storage (SC, PVC, Pod mount)',
          instruction: 'Create a PersistentVolumeClaim requesting 2Gi of storage using the storage class "fast-storage". Mount it to a pod at "/data".',
          command: 'kubectl apply -f pvc.yaml && kubectl apply -f pod-storage.yaml',
          yamlContent: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: fast-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
  storageClassName: fast-storage
---
apiVersion: v1
kind: Pod
metadata:
  name: data-writer
spec:
  volumes:
    - name: data-vol
      persistentVolumeClaim:
        claimName: fast-pvc
  containers:
    - name: writer
      image: alpine
      command: ["sh", "-c", "echo 'hello' > /data/out.log && sleep 3600"]
      volumeMounts:
        - name: data-vol
          mountPath: /data`,
          output: [
            'persistentvolumeclaim/fast-pvc created',
            'pod/data-writer created',
          ],
          explanation: 'The volume mount associates the volume defined at pod-level with a mount path inside the container. The PVC requests storage from the matching StorageClass, which automatically provisions a PV.',
          clusterState: {
            pods: [
              { id: 'data-writer', name: 'data-writer', namespace: 'default', node: 'node-2', status: 'Running', labels: {}, image: 'alpine', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['fast-pvc bound to PV', 'data-writer pod mounted PVC storage successfully'],
          },
        },
      ],
      quiz: [
        {
          id: 'p6-m2-q1',
          question: 'A worker node displays a NotReady status. Running systemctl status kubelet shows the service failed to start due to active swap space. What is the immediate solution?',
          options: [
            'Upgrade the node kernel',
            'Execute swapoff -a on the host node, and restart the kubelet service',
            'Add fail-on-swap: true to the kube-apiserver manifest',
            'Run kubeadm join again',
          ],
          answer: 1,
          explanation: 'By default, the kubelet fails to start if swap memory is enabled on the host. Executing swapoff -a disables swap immediately, letting kubelet run.',
        },
        {
          id: 'p6-m2-q2',
          question: 'When configuring an etcd restore operation, which directory containing static pod manifests should be temporarily moved to pause the control plane?',
          options: [
            '/var/lib/kubelet',
            '/etc/kubernetes/manifests',
            '/etc/kubernetes/pki',
            '/srv/kubernetes',
          ],
          answer: 1,
          explanation: 'Static pods (apiserver, scheduler, controller-manager) are monitored by the local kubelet from `/etc/kubernetes/manifests`. Moving these files temporarily terminates the control plane so the etcd database snapshot can be cleanly swapped without live API traffic write conflicts.',
        },
        {
          id: 'p6-m2-q3',
          question: 'Which resource is used to authorize operations across ALL namespaces in a cluster?',
          options: [
            'Role',
            'ClusterRole combined with a ClusterRoleBinding',
            'RoleBinding placed in the default namespace',
            'ServiceAccount',
          ],
          answer: 1,
          explanation: 'A ClusterRole defines permissions globally. Binding it with a ClusterRoleBinding applies those permissions to the targeted subject across the entire cluster, rather than restricting them to a single namespace.',
        },
        {
          id: 'p6-m2-q4',
          question: 'A team needs to guarantee that a database pod is scheduled ONLY on nodes that contain high-speed NVMe storage. Nodes have the label storage=nvme. Which mechanism guarantees this scheduling?',
          options: [
            'A Toleration',
            'nodeSelector with storage: nvme',
            'A PodDisruptionBudget',
            'Namespace isolation',
          ],
          answer: 1,
          explanation: 'A nodeSelector is the simplest and most explicit way to bind a pod to nodes that match specific labels. Setting storage: nvme in the podSpec nodeSelector restricts scheduling to matching nodes.',
        },
        {
          id: 'p6-m2-q5',
          question: 'You want to verify what API actions your current user is authorized to perform in the default namespace. What is the fastest command to audit your permissions?',
          options: [
            'kubectl describe rolebinding',
            'kubectl auth can-i --list',
            'kubectl get authorization',
            'kubectl api-resources',
          ],
          answer: 1,
          explanation: '`kubectl auth can-i --list` is the standard administrative tool to run a self-query of allowed API verbs, resource types, and namespaces.',
        },
      ],
      coverage: {
        concepts: ['CKA: hands-on administrator exam, 2 hours, 15-20 tasks', 'cluster installation with kubeadm', 'etcd backup and restore', 'node troubleshooting: kubelet, container runtime, certificates', 'RBAC: ClusterRole, ClusterRoleBinding, impersonation', 'persistent storage: PV/PVC/StorageClass', 'network troubleshooting: CNI, DNS (CoreDNS), Services', 'upgrade cluster one minor version at a time with kubeadm'],
        commands: ['kubeadm init', 'kubeadm join', 'kubeadm upgrade apply', 'ETCDCTL_API=3 etcdctl snapshot save', 'ETCDCTL_API=3 etcdctl snapshot restore', 'kubectl drain <node> --ignore-daemonsets', 'kubectl uncordon <node>', 'kubectl certificate approve', 'openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -dates', 'journalctl -u kubelet -f'],
        architecture: ['kubeadm sets up PKI, static pods, kubelet config, bootstrap tokens', 'etcd stores all cluster state — backup = snapshot of etcd data dir', 'CoreDNS runs as Deployment in kube-system, resolves cluster DNS', 'CNI plugin (Calico/Flannel) installs as DaemonSet, provides pod networking'],
        techniques: ['use kubectl drain before node maintenance', 'always verify etcd backup with etcdctl snapshot status', 'check kubelet status with systemctl/journalctl on node', 'use --as flag to test RBAC permissions as a SA', 'check cert expiry with openssl before troubleshooting auth failures'],
        procedures: ['kubeadm cluster init + worker join', 'etcd backup: set ETCDCTL_API=3, provide --cacert --cert --key --endpoints', 'etcd restore: restore to new dir, update etcd static pod manifest dataDir', 'cluster upgrade: apt update kubeadm, kubeadm upgrade apply, drain node, apt update kubelet kubectl, uncordon'],
        toolsAndPlugins: ['kubectl', 'kubeadm', 'etcdctl', 'openssl', 'systemctl', 'journalctl', 'crictl'],
        cases: ['node NotReady: check kubelet service status and cert expiry', 'pod stuck Pending: check events for PVC, resource, taint issues', 'DNS not resolving: check CoreDNS pods and ConfigMap in kube-system'],
        scenarios: ['CKA exam task: backup etcd to /tmp/etcd-backup.db and verify', 'CKA exam task: create SA with role allowing pod list/get in a namespace'],
      },
      exercises: [
        {
          id: 'p6-m2-e1',
          title: 'Simulate etcd backup and verify',
          kind: 'guided',
          goal: 'Run an etcd snapshot backup and verify integrity, simulating a CKA exam task.',
          commands: [
            'kubectl get pods -n kube-system -l component=etcd',
            `ETCDCTL_API=3 etcdctl snapshot save /tmp/etcd-backup.db \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key \\
  --endpoints=https://127.0.0.1:2379 2>/dev/null || echo "etcd not reachable (run on control plane node)"`,
            'ls -lh /tmp/etcd-backup.db 2>/dev/null || echo "backup file not created"',
            'ETCDCTL_API=3 etcdctl snapshot status /tmp/etcd-backup.db 2>/dev/null || echo "verify manually on control plane"',
          ],
          verify: ['etcd pod found in kube-system', 'snapshot save command documented with correct flags', 'snapshot status shows revision and hash'],
          expectedOutcome: 'etcd backup procedure confirmed and memorized.',
          cleanup: ['rm -f /tmp/etcd-backup.db'],
        },
        {
          id: 'p6-m2-e2',
          title: 'Node maintenance: drain, cordon, uncordon',
          kind: 'challenge',
          goal: 'Drain a node, verify pods evicted, then uncordon and confirm scheduling resumes.',
          commands: [
            'kubectl get nodes',
            'NODE=$(kubectl get nodes --no-headers | grep -v master | head -1 | awk "{print \\$1}")',
            'kubectl cordon $NODE 2>/dev/null || echo "set NODE manually: export NODE=<node-name>"',
            'kubectl get node $NODE',
            'kubectl drain $NODE --ignore-daemonsets --delete-emptydir-data --force 2>/dev/null || echo "drain: check node name"',
            'kubectl get pods -A -o wide | grep $NODE',
            'kubectl uncordon $NODE 2>/dev/null || echo "uncordon: check node name"',
            'kubectl get node $NODE',
          ],
          verify: ['cordon sets node to SchedulingDisabled', 'drain evicts non-daemonset pods', 'uncordon restores Ready,SchedulingEnabled'],
          expectedOutcome: 'Node drain/uncordon maintenance workflow confirmed.',
          cleanup: ['kubectl uncordon $(kubectl get nodes --no-headers | grep SchedulingDisabled | awk "{print \\$1}") 2>/dev/null || true'],
        },
        {
          id: 'p6-m2-e3',
          title: 'Debug NotReady node',
          kind: 'debug',
          goal: 'Identify what would cause a node to show NotReady and the investigation sequence.',
          commands: [
            'kubectl get nodes',
            'kubectl describe node $(kubectl get nodes -o jsonpath="{.items[0].metadata.name}") | grep -A10 Conditions',
            'kubectl get events -A --field-selector reason=NodeNotReady 2>/dev/null || echo "no NodeNotReady events"',
            'kubectl get pods -n kube-system | grep -v Running',
          ],
          verify: ['Node conditions inspected', 'Investigation sequence: describe → events → kubelet logs (systemctl/journalctl on node) → cert expiry (openssl)'],
          expectedOutcome: 'NotReady node debug procedure memorized for CKA exam.',
          cleanup: [],
        },
        {
          id: 'p6-m2-e4',
          title: '7-day spaced review — CKA core procedures',
          kind: 'spaced-review',
          goal: 'Recall etcd backup flags and upgrade procedure steps from memory.',
          commands: [
            'kubectl get nodes',
            'kubectl get pods -n kube-system | grep -v Running',
          ],
          verify: ['Can recite etcdctl snapshot save flags: --cacert --cert --key --endpoints', 'Can describe 4-step cluster upgrade process', 'Can list 3 most common CKA troubleshooting areas'],
          expectedOutcome: 'CKA administrator procedures internalized.',
          cleanup: [],
        },
      ],
    },
    // ─── Module 3: CKAD ──────────────────────────────────────────────────────
    {
      id: 'p6-m3',
      slug: 'ckad',
      title: 'CKAD: Certified Kubernetes Application Developer',
      description: 'Design and build multi-container pods, deploy update strategies (canaries/blue-green), configure config injection, configure probes, and establish job structures.',
      duration: '15 hours',
      difficulty: 'advanced',
      theory: `> 🧠 **Brain Warm-Up**: How do multi-container pod patterns (Sidecar vs. Adapter vs. Ambassador) share namespace resources at the Linux kernel level, and how does the Kubelet ensure Init Containers complete before starting regular app containers? Think about it before reading below.

## The CKAD Exam Focus

The **Certified Kubernetes Application Developer (CKAD)** exam tests your ability to design, build, configure, and troubleshoot cloud-native applications running on Kubernetes.

Similar to the CKA, the CKAD is a **practical, hands-on, terminal-based exam** lasting 2 hours.

### CKAD Exam Domains

1. **Application Design and Build (20%)**
   - Define multi-container pod patterns (sidecar, adapter, ambassador)
   - Utilize Jobs and CronJobs for automated processing
2. **Application Deployment (20%)**
   - Understand deployment strategies (rolling updates, canary, blue-green)
   - Perform helm chart deployments and troubleshooting
3. **Application Environment, Security and Configuration (25%)**
   - Define resource requests and limits
   - Configure ConfigMaps and Secrets to inject configurations
   - Build SecurityContext settings (runAsUser, readOnlyRootFilesystem)
4. **Application Observability and Maintenance (18%)**
   - Implement Liveness, Readiness, and Startup probes
   - Query container logs, monitor CPU/memory usage
5. **Services and Networking (17%)**
   - Setup NetworkPolicies, expose applications using ClusterIP, NodePort, and Ingress routing

### Visualizing Multi-Container Pod Patterns

All containers in a Pod share the same network namespace (IP, ports, loopback) and IPC namespace. Volumes can also be shared to bridge distinct storage contexts:

\`\`\`
+-------------------------------------------------------------------------------+
| Pod Sandbox Namespace Boundaries                                              |
|                                                                               |
|   +--------------------------+                 +--------------------------+   |
|   |     Main Application     |                 |  Helper/Sidecar/Adapter  |   |
|   |   (e.g., Node.js app)    |                 |   (e.g., Log Forwarder)  |   |
|   |   Port: 3000             |                 |   Tails app.log          |   |
|   +------------+-------------+                 +------------+-------------+   |
|                |                                            |                 |
|                | writes logs                                | reads logs      |
|                v                                            v                 |
|   +------------+--------------------------------------------+------------+   |
|   |                      Shared volume (emptyDir)                         |   |
|   +-----------------------------------------------------------------------+   |
|                                                                               |
|   Note: Both containers bind to 'localhost' and communicate over IPC.          |
+-------------------------------------------------------------------------------+
\`\`\`

### Visualizing Pod Init & Execution Lifecycle

Init Containers run sequentially to completion before any application containers begin execution:

\`\`\`
Pod Scheduled
      │
      ▼
[ Init Container 1 ] ──(Succeeds)──> [ Init Container 2 ] ──(Succeeds)──> [ App Containers & Sidecars ]
      │                                    │                                 │
  (Failure)                            (Failure)                             ▼
      │                                    │                      Kubelet runs Probes:
      v                                    v                      1. Startup Probes
 [ Restart Pod ]                      [ Restart Pod ]             2. Liveness Probes
                                                                  3. Readiness Probes
\`\`\`

### CKAD Deep-Dive: Multi-Container Patterns, Resource Allocation, and Probes

#### 1. Linux Namespace Sharing & The Infra (Pause) Container
When the Kubelet schedules a Pod, the CRI runtime first deploys a special helper container called the **Infra Container** (or **Pause Container**).
* **Namespace Isolation**: The Pause container's sole job is to hold the namespaces open (Network, IPC, and optionally PID namespaces).
* **Shared Network**: All subsequently created container processes join the Network namespace of the Pause container via system calls (like \`setns\`). This enables containers inside the same Pod to connect via \`localhost\` (e.g. an application container communicating with a database ambassador proxy on \`localhost:5432\`).
* **Volume Mounts**: Filesystem layers remain isolated unless sharing paths through K8s volumes (such as an \`emptyDir\` mapped to \`/var/log\` in container A, and \`/app/logs\` in container B).

#### 2. Advanced Multi-Container Pod Design Patterns
* **Sidecar Pattern**: Extends the main container without changing its source code. For example, a Cloud SQL proxy sidecar allows the main app to talk to a local port while managing TLS and auth to GCP.
* **Adapter Pattern**: Acts as a translation layer. It transforms heterogeneous outputs from the main application (e.g. custom key-value diagnostic output) into standard formatted endpoints (e.g., Prometheus metrics) so monitoring servers can scrap them uniformly.
* **Ambassador Pattern**: Connects the main application container to remote external services. The application talks to a static local address, while the ambassador container dynamic-routes requests to external test, staging, or sharded database clusters.

#### 3. Resource Scheduling, Limits, & cgroups v2 Mechanisms
Kubernetes enforces resource policies utilizing Linux Control Groups (**cgroups**):
* **CPU Requests**: Translated into \`cpu.shares\` (\`cpu.weight\` in cgroups v2). This acts as a relative priority weight. If CPU cycles are contested, the CPU scheduler allocates shares proportionally.
* **CPU Limits**: Enforced using CFS (Completely Fair Scheduler) Bandwidth Control. The limit is converted into quota (\`cpu.cfs_quota_us\`) over a period (\`cpu.cfs_period_us\`). If a container exceeds its CPU limit, the kernel throttles the container, causing slow response times but **not** termination.
* **Memory Limits**: Mapped to \`memory.max\` in cgroups v2. Because memory is incompressible, if a container requests more physical memory than its limit, the kernel triggers an Out-Of-Memory (OOM) event. The Linux kernel OOM-killer selects the process for immediate termination, and Kubelet records exit code \`137\` (128 + SIGKILL).

#### 4. Kubelet Health Probes & Lifecycle Loop
Probes are run periodically by the Kubelet's probe manager.
* **Startup Probes**: Runs first. Suspends all Liveness and Readiness probes until it succeeds or times out. Ideal for applications with long initialization cycles.
* **Liveness Probes**: Determines if a container needs to be restarted. If it fails, the Kubelet kills the container and invokes the Pod's restartPolicy.
* **Readiness Probes**: Determines if a container can serve network traffic. If a readiness probe fails, the Kubelet stops sending its status as Ready, causing the EndpointSlice controller to extract the Pod's IP from the Endpoints list of matching Services, preventing user requests from reaching the unhealthy pod.

### Vim & Shell Productivity Tips

- **Vim auto-indent**: Set up standard auto-indents to prevent spaces errors:
  \`\`\`vim
  set expandtab ts=2 sw=2
  \`\`\`
- **Delete multiple lines**: Go to first line, type \`dG\` to delete to bottom, or \`d5d\` to delete 5 lines.
- **Explain CLI documentation**: Use \`kubectl explain pods.spec.containers.securityContext\` to check API fields inside the terminal.`,
      labSteps: [
        {
          id: 'p6-m3-s1',
          title: 'Design a Multi-Container Pod (Sidecar Pattern)',
          instruction: 'Create a pod named "app-log-sidecar" where the main container outputs logs to a shared volume, and a sidecar container tails the log file.',
          command: 'kubectl apply -f sidecar-pod.yaml',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: app-log-sidecar
spec:
  volumes:
  - name: shared-logs
    emptyDir: {}
  containers:
  - name: app
    image: alpine
    command: ["sh", "-c", "while true; do echo \"$(date) - App is active\" >> /var/log/app.log; sleep 2; done"]
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
  - name: sidecar
    image: busybox
    command: ["sh", "-c", "tail -f /var/log/app.log"]
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log`,
          output: [
            'pod/app-log-sidecar created',
          ],
          explanation: 'The containers share an `emptyDir` volume. The sidecar container consumes files generated by the primary container, implementing the logging sidecar pattern.',
          clusterState: {
            pods: [
              { id: 'sidecar-pod', name: 'app-log-sidecar', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'alpine / busybox', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Shared emptyDir volume initialized', 'app-log-sidecar containers running'],
          },
        },
        {
          id: 'p6-m3-s2',
          title: 'Add an Init Container for DB Verification',
          instruction: 'Create a pod with an initContainer that waits for the service "db-service" to become active before starting the main container.',
          command: 'kubectl apply -f init-pod.yaml',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: web-app-init
spec:
  initContainers:
  - name: check-db
    image: busybox
    command: ['sh', '-c', 'until nc -z -w 2 db-service 5432; do echo waiting for db; sleep 2; done']
  containers:
  - name: app
    image: nginx:alpine`,
          output: [
            'pod/web-app-init created',
          ],
          explanation: 'Init containers run to completion sequentially before application containers start. If the init container fails, the kubelet restarts the pod until the init container succeeds.',
          clusterState: {
            pods: [
              { id: 'web-app-init', name: 'web-app-init', namespace: 'default', node: 'node-1', status: 'Pending', labels: {}, image: 'busybox', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Pod web-app-init initialized check-db container', 'Waiting for db-service to become available'],
          },
        },
        {
          id: 'p6-m3-s3',
          title: 'Configure Canary Deployments via Service Labels',
          instruction: 'Roll out a canary version of an application and route a fraction of traffic to it by sharing a service label.',
          command: 'kubectl apply -f prod-v1.yaml && kubectl apply -f canary-v2.yaml && kubectl apply -f service-prod.yaml',
          yamlContent: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-prod-v1
spec:
  replicas: 9
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
        version: v1
    spec:
      containers:
      - name: main
        image: nginx:1.24
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-canary-v2
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
        version: v2
    spec:
      containers:
      - name: main
        image: nginx:1.25
---
apiVersion: v1
kind: Service
metadata:
  name: app-svc
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 80`,
          output: [
            'deployment.apps/app-prod-v1 created',
            'deployment.apps/app-canary-v2 created',
            'service/app-svc created',
          ],
          explanation: 'Because both deployments contain the label `app: my-app`, the Service target routes traffic to all 10 replica pods. 9/10 (90%) hits v1, and 1/10 (10%) hits v2, functioning as a basic traffic canary.',
          clusterState: {
            pods: [
              { id: 'v1-1', name: 'app-prod-v1-8fcd69-1', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'my-app', version: 'v1' }, image: 'nginx:1.24', restarts: 0 },
              { id: 'v1-2', name: 'app-prod-v1-8fcd69-2', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'my-app', version: 'v1' }, image: 'nginx:1.24', restarts: 0 },
              { id: 'v1-3', name: 'app-prod-v1-8fcd69-3', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'my-app', version: 'v1' }, image: 'nginx:1.24', restarts: 0 },
              { id: 'v2-1', name: 'app-canary-v2-78dcd-1', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'my-app', version: 'v2' }, image: 'nginx:1.25', restarts: 0 },
            ],
            services: [
              { id: 'app-svc', name: 'app-svc', namespace: 'default', type: 'ClusterIP', selector: { app: 'my-app' }, port: 80, clusterIP: '10.96.18.99' },
            ],
            deployments: [
              { id: 'prod-deploy', name: 'app-prod-v1', namespace: 'default', replicas: 9, availableReplicas: 9, image: 'nginx:1.24' },
              { id: 'canary-deploy', name: 'app-canary-v2', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'nginx:1.25' },
            ],
            namespaces: ['default'],
            events: ['Canary configuration active: 10% traffic directed to v2 version'],
          },
        },
        {
          id: 'p6-m3-s4',
          title: 'ConfigMap Injection via Volumes & Secrets via Env',
          instruction: 'Create a pod that loads configuration settings from a ConfigMap as files, and database passwords from a Secret as environment variables.',
          command: 'kubectl apply -f inject-pod.yaml',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: configure-app
spec:
  volumes:
  - name: config-volume
    configMap:
      name: app-config
  containers:
  - name: main
    image: alpine
    command: ["sh", "-c", "cat /etc/config/app.properties && echo $DB_PASS && sleep 3600"]
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
    env:
    - name: DB_PASS
      valueFrom:
        secretKeyRef:
          name: app-secret
          key: password`,
          output: [
            'pod/configure-app created',
          ],
          explanation: 'ConfigMaps loaded as volume mounts present key-value pairs as individual files inside the target directory. Secrets injected via `secretKeyRef` expose values as secure environment variables.',
          clusterState: {
            pods: [
              { id: 'configure-app', name: 'configure-app', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'alpine', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['ConfigMap mounted to /etc/config', 'Secret injected into env: DB_PASS'],
          },
        },
        {
          id: 'p6-m3-s5',
          title: 'Implement Health Probes and Resource Constraints',
          instruction: 'Define a deployment with memory/CPU limits and both readiness and liveness HTTP health probes.',
          command: 'kubectl apply -f probe-deploy.yaml',
          yamlContent: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: healthy-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: probe-app
  template:
    metadata:
      labels:
        app: probe-app
    spec:
      containers:
      - name: main
        image: myrepo/web-health:v1
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 3
          periodSeconds: 5`,
          output: [
            'deployment.apps/healthy-app created',
          ],
          explanation: 'Probes allow the kubelet to manage container health. Liveness determines when to restart the container; readiness determines when to accept traffic. Resource limits prevent CPU and memory exhaustion.',
          clusterState: {
            pods: [
              { id: 'healthy-1', name: 'healthy-app-78fcd-a1b2', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'probe-app' }, image: 'myrepo/web-health:v1', restarts: 0 },
              { id: 'healthy-2', name: 'healthy-app-78fcd-c3d4', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'probe-app' }, image: 'myrepo/web-health:v1', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'probe-deploy', name: 'healthy-app', namespace: 'default', replicas: 2, availableReplicas: 2, image: 'myrepo/web-health:v1' },
            ],
            namespaces: ['default'],
            events: ['Probes and resources active. 2 replicas reporting ready status'],
          },
        },
        {
          id: 'p6-m3-s6',
          title: 'Automate Tasks using CronJobs',
          instruction: 'Create a CronJob that executes a cleanup script every 10 minutes, retaining only the last 3 successful pod executions.',
          command: 'kubectl apply -f cleanup-cron.yaml',
          yamlContent: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: log-cleaner
spec:
  schedule: "*/10 * * * *"
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: cleaner
            image: alpine
            command: ["sh", "-c", "echo 'starting cleanup' && rm -rf /tmp/logs/* && echo 'done'"]
          restartPolicy: OnFailure`,
          output: [
            'cronjob.batch/log-cleaner created',
          ],
          explanation: 'CronJobs run tasks on a time-based schedule using the crontab format. They schedule Batch Jobs, which create worker pods to execute tasks. History limits ensure old completed pods do not clutter the cluster list.',
          clusterState: {
            ...emptyCluster,
            namespaces: ['default'],
            events: ['CronJob log-cleaner registered', 'Next execution scheduled in 10 minutes'],
          },
        },
      ],
      quiz: [
        {
          id: 'p6-m3-q1',
          question: 'You have configured a sidecar logging container that reads from a shared emptyDir volume. What happens to the shared volume if the primary application container crashes and restarts?',
          options: [
            'The volume is deleted and recreated blank',
            'The volume remains intact and its data is preserved because the Pod lifecycle is still active',
            'The sidecar container also crashes immediately',
            'Kubernetes moves the volume to a hostPath location',
          ],
          answer: 1,
          explanation: 'An emptyDir volume exists as long as the Pod exists on that node. Individual container crashes and restarts do not affect the Pod status or delete its volumes.',
        },
        {
          id: 'p6-m3-q2',
          question: 'Which probe determines whether a Pod is allowed to join the service endpoint pool to receive live client traffic?',
          options: [
            'Liveness probe',
            'Readiness probe',
            'Startup probe',
            'Security probe',
          ],
          answer: 1,
          explanation: 'The readiness probe tracks when a container is fully initialized. If a container fails its readiness probe, the endpoints controller removes it from all matching Service backend pools.',
        },
        {
          id: 'p6-m3-q3',
          question: 'What happens to a container when it exceeds its memory limit (limits.memory) configured in its podSpec?',
          options: [
            'It is throttled and execution runs slower',
            'It is terminated immediately by the kernel with an Out-of-Memory (OOMKilled) exception',
            'Kubernetes increases the limit automatically',
            'The pod enters Pending status',
          ],
          answer: 1,
          explanation: 'Memory is an incompressible resource. If a container exceeds its memory limit, the Linux kernel terminates the container immediately to protect system stability, displaying OOMKilled.',
        },
        {
          id: 'p6-m3-q4',
          question: 'You want to run a one-off database migration job and ensure that it runs exactly 1 time to completion. Which restartPolicy is valid inside a Job manifest?',
          options: [
            'Always',
            'OnFailure or Never',
            'RestartOnInit',
            'UnlessStopped',
          ],
          answer: 1,
          explanation: 'A Job represents transient work that must run to completion rather than running forever. Thus, `Always` is not a valid restartPolicy in a Job. You must use `OnFailure` or `Never`.',
        },
        {
          id: 'p6-m3-q5',
          question: 'Which multi-container pattern is characterized by a secondary container that standardizes or transforms raw logs/metrics before outputting them to external collectors?',
          options: [
            'Sidecar pattern',
            'Adapter pattern',
            'Ambassador pattern',
            'Proxy pattern',
          ],
          answer: 1,
          explanation: 'The Adapter pattern standardizes outputs from heterogeneous application containers (e.g., transforming a custom log format to standard JSON before a collector reads it).',
        },
      ],
      coverage: {
        concepts: ['CKAD: developer-focused exam, 2 hours, 15-20 tasks', 'multi-container pod patterns: sidecar, adapter, ambassador', 'init containers for pre-flight setup', 'blue-green and canary deployment strategies', 'ConfigMap and Secret as env vars and volume mounts', 'liveness, readiness, and startup probes', 'Jobs and CronJobs for batch workloads', 'resource requests/limits and HPA'],
        commands: ['kubectl run', 'kubectl create deployment --dry-run=client -o yaml', 'kubectl set image deployment/<name>', 'kubectl rollout status deployment/<name>', 'kubectl rollout undo deployment/<name>', 'kubectl create configmap --from-literal', 'kubectl create secret generic --from-literal', 'kubectl autoscale deployment', 'kubectl create job', 'kubectl create cronjob'],
        architecture: ['sidecar: helper in same pod shares network + volumes', 'adapter: normalizes app output for external consumers', 'ambassador: proxies external connections (e.g., DB proxy)', 'blue-green: two full deployments, flip Service selector', 'canary: same Deployment + label-based partial traffic split'],
        techniques: ['use --dry-run=client -o yaml to generate manifests fast in exam', 'use kubectl set image for imperative rollouts', 'use kubectl rollout undo for instant rollback', 'pipe kubectl create to file, edit, then apply for complex objects', 'alias k=kubectl and set completion in exam terminal'],
        procedures: ['CKAD exam setup: alias k=kubectl; source <(kubectl completion bash); complete -F __start_kubectl k', 'canary deploy: create v2 deployment with 1 replica alongside v1 3 replicas (25% canary)', 'blue-green: create green deployment, verify, patch service selector to green', 'inject config: create ConfigMap, reference in env.valueFrom.configMapKeyRef'],
        toolsAndPlugins: ['kubectl', 'vim', 'bash completion', 'kubectl explain'],
        cases: ['CKAD task: add sidecar to existing pod that logs to shared emptyDir volume', 'CKAD task: create CronJob that runs every 5 minutes and cleans up temp files', 'CKAD task: expose deployment with ClusterIP service on port 8080'],
        scenarios: ['CKAD exam: 45-second manifest generation with dry-run pipeline', 'CKAD exam: rolling update then rollback in under 2 minutes'],
      },
      exercises: [
        {
          id: 'p6-m3-e1',
          title: 'CKAD speed drill — imperative manifest generation',
          kind: 'guided',
          goal: 'Practice the --dry-run=client -o yaml pipeline to generate manifests fast, as required in the CKAD exam.',
          commands: [
            'kubectl create deployment speed-test --image=nginx:1.27 --replicas=3 --dry-run=client -o yaml',
            'kubectl create configmap app-config --from-literal=ENV=production --from-literal=PORT=8080 --dry-run=client -o yaml',
            'kubectl create secret generic app-secret --from-literal=DB_PASSWORD=s3cr3t --dry-run=client -o yaml',
            'kubectl create job one-off --image=busybox -- /bin/sh -c "echo hello" --dry-run=client -o yaml',
            'kubectl create cronjob heartbeat --image=busybox --schedule="*/5 * * * *" -- /bin/sh -c "date" --dry-run=client -o yaml',
          ],
          verify: ['Each command produces valid YAML without creating resources', 'Job spec shows correct command array', 'CronJob spec shows schedule field'],
          expectedOutcome: 'Imperative generation pipeline memorized for exam speed.',
          cleanup: [],
        },
        {
          id: 'p6-m3-e2',
          title: 'Blue-green deployment switch',
          kind: 'challenge',
          goal: 'Deploy v1 and v2, verify v2 works, then flip the Service selector to complete the blue-green switch.',
          commands: [
            'kubectl create deployment blue --image=nginx:1.25 --replicas=2',
            'kubectl label deployment blue version=v1',
            'kubectl expose deployment blue --port=80 --name=myapp-svc',
            'kubectl create deployment green --image=nginx:1.27 --replicas=2',
            'kubectl label deployment green version=v2',
            'kubectl rollout status deployment green',
            'kubectl patch service myapp-svc -p \'{"spec":{"selector":{"app":"green"}}}\'',
            'kubectl get endpoints myapp-svc',
          ],
          verify: ['Service initially points to blue pods', 'After patch, endpoints change to green pod IPs', 'Blue deployment still running (instant rollback available)'],
          expectedOutcome: 'Blue-green switch with zero-downtime confirmed.',
          cleanup: ['kubectl delete deployment blue green', 'kubectl delete service myapp-svc'],
        },
        {
          id: 'p6-m3-e3',
          title: 'Debug: pod not receiving traffic after deployment',
          kind: 'debug',
          goal: 'Diagnose why a Service has no endpoints despite pods running.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: broken-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: broken-app
  template:
    metadata:
      labels:
        app: broken-app-typo
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
---
apiVersion: v1
kind: Service
metadata:
  name: broken-svc
spec:
  selector:
    app: broken-app
  ports:
  - port: 80
EOF`,
            'kubectl get endpoints broken-svc',
            'kubectl get pods -l app=broken-app',
            'kubectl get pods -l app=broken-app-typo',
            'kubectl describe service broken-svc | grep -A5 Selector',
          ],
          verify: ['Service shows no endpoints (label mismatch identified)', 'Pod label is broken-app-typo but service selects broken-app'],
          expectedOutcome: 'Label mismatch diagnosis technique confirmed.',
          cleanup: ['kubectl delete deployment broken-app', 'kubectl delete service broken-svc'],
        },
        {
          id: 'p6-m3-e4',
          title: '7-day spaced review — CKAD exam techniques',
          kind: 'spaced-review',
          goal: 'Recall CKAD speed techniques and multi-container patterns from memory.',
          commands: [
            'kubectl create deployment recall-test --image=nginx:1.27 --dry-run=client -o yaml | head -20',
          ],
          verify: ['Can recite --dry-run=client -o yaml pipeline from memory', 'Can describe 3 multi-container patterns (sidecar/adapter/ambassador)', 'Can explain difference between blue-green and canary strategies'],
          expectedOutcome: 'CKAD developer techniques and exam approach internalized.',
          cleanup: [],
        },
      ],
    },
  ],
}

export default phase6
