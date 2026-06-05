import type { Phase, ClusterState } from '@/lib/types'

const emptyCluster: ClusterState = {
  pods: [], services: [], deployments: [], namespaces: ['default'], events: [],
}

const phase2: Phase = {
  id: 'phase-2',
  slug: 'phase-2',
  title: 'Configuration & Reliability',
  shortTitle: 'Config & Health',
  description: 'Configure your apps correctly with ConfigMaps and Secrets, then make them production-reliable with health probes and resource management.',
  weeks: 'Week 3–4',
  hours: '~9 hours',
  color: 'text-cyan-400',
  bgColor: 'bg-cyan-500/10 border-cyan-500/30',
  modules: [
    // ─── Module 1: Namespaces ────────────────────────────────────────────────
    {
      id: 'p2-m1',
      slug: 'namespaces',
      title: 'Namespaces',
      description: 'Isolate workloads into virtual clusters for teams, environments, and access control.',
      duration: '45 min',
      difficulty: 'beginner',
      theory: `> 🧠 **Brain Warm-Up**: If two teams in a Kubernetes cluster create a Deployment with the same name (e.g. \`api\`), how does the cluster prevent name collisions, and does this separation also block network communication between them by default?

## What Are Namespaces?

A **namespace** is a logical partition inside a physical Kubernetes cluster. It provides a scope for names of resources. Resource names must be unique within a namespace, but can be duplicated across different namespaces.

Under the hood, namespaces do **not** represent physical isolation. They partition API resources logically by prefixing key paths in **etcd** (e.g., \`/registry/pods/production/api-pod\` vs \`/registry/pods/staging/api-pod\`).

### Namespaces vs Linux Namespaces
It is crucial to distinguish **Kubernetes Namespaces** from **Linux Kernel Namespaces** (such as \`net\`, \`mnt\`, \`pid\`, \`ipc\`, and \`uts\`):
- **Linux Namespaces** are a kernel feature that isolates system resources (processes, mount points, network interfaces) for containers on a single host.
- **Kubernetes Namespaces** are a control plane construct in the API server designed for multi-tenancy, access control, and quota management.

### Visualizing Namespaces

\`\`\`text
+---------------------------------------------------------------------------------+
|                                 PHYSICAL CLUSTER                                |
|                                                                                 |
|  +---------------------------+  +---------------------------+  +-------------+  |
|  |   Namespace: production   |  |     Namespace: staging    |  | Cluster-    |  |
|  |                           |  |                           |  | Scoped      |  |
|  |  +---------------------+  |  |  +---------------------+  |  | Resources   |  |
|  |  |   Deployment: api   |  |  |  |   Deployment: api   |  |  |             |  |
|  |  +---------------------+  |  |  +---------------------+  |  |  +-------+  |  |
|  |                           |  |                           |  |  | Nodes |  |  |
|  |  +---------------------+  |  |  +---------------------+  |  |  +-------+  |  |
|  |  |  NetworkPolicy (X)  |  |  |  |  NetworkPolicy (X)  |  |  |             |  |
|  |  +---------------------+  |  |  +---------------------+  |  |  +-------+  |  |
|  |                           |  |                           |  |  | PVs   |  |  |
|  +---------------------------+  +---------------------------+  +-------+  |  |
|               |                               |                                 |
|               +---(Allowed by default unless)-+                                 |
|                   (blocked by NetworkPolicy)                                    |
+---------------------------------------------------------------------------------+
\`\`\`

## Default Namespaces

Kubernetes creates four default namespaces on bootstrap:

| Namespace | Purpose |
|---|---|
| \`default\` | The default target for API requests when no namespace is specified. |
| \`kube-system\` | Reserved for infrastructure components managed by the control plane (e.g., \`kube-apiserver\`, \`etcd\`, \`kube-scheduler\`, \`coredns\`, \`kube-proxy\`). |
| \`kube-public\` | Created automatically and readable by all users (including unauthenticated ones). Used for cluster bootstrap discovery info. |
| \`kube-node-lease\` | Houses \`Lease\` objects associated with each node. Kubelet sends heartbeats by updating these leases, reducing API load compared to updating the full Node status. |

## Logical vs Physical Boundary

By default, **namespaces are NOT secure network boundaries**.
- **DNS Resolution**: CoreDNS resolves services using the Fully Qualified Domain Name (FQDN) format: \`<service-name>.<namespace-name>.svc.cluster.local\`. A Pod in the \`staging\` namespace can resolve and route traffic to a Service in the \`production\` namespace simply by using its FQDN.
- **Network Isolation**: To enforce physical network isolation between namespaces, you must define **NetworkPolicies** targeting the namespaces via \`namespaceSelector\`. This instructs the Container Network Interface (CNI) plugin (e.g., Calico, Cilium) to configure packet filtering (e.g., using \`iptables\` rules or eBPF programs) to drop unauthorized cross-namespace traffic.

## Resource Allocation and RBAC

Namespaces are the primary boundary for resource quotas and access control:
1. **ResourceQuota**: Scopes total compute allocation. When a \`ResourceQuota\` is applied, the admission controller rejects Pod creation requests that do not specify CPU/Memory requests or limits, or that exceed the namespace quota ceiling.
2. **Role-Based Access Control (RBAC)**: \`Role\` and \`RoleBinding\` resources are namespaced, granting privileges restricted to that namespace. Cluster-wide privileges require \`ClusterRole\` and \`ClusterRoleBinding\` objects.

## Setting a Default Namespace

Instead of typing \`-n staging\` on every command, switch your active namespace once:

\`\`\`bash
kubectl config set-context --current --namespace=staging
\`\`\`

All subsequent \`kubectl\` commands will target \`staging\` until you switch again. Switch back with:

\`\`\`bash
kubectl config set-context --current --namespace=default
\`\`\``,
      labSteps: [
        {
          id: 'p2-m1-s1',
          title: 'List all namespaces',
          instruction: 'Run kubectl get namespaces to see the four default namespaces every cluster starts with.',
          command: 'kubectl get namespaces',
          output: [
            'NAME              STATUS   AGE',
            'default           Active   5d',
            'kube-node-lease   Active   5d',
            'kube-public       Active   5d',
            'kube-system       Active   5d',
          ],
          explanation: 'Every fresh cluster has these four namespaces. "Active" means the namespace is in use. kube-system holds all the control plane components you saw in Phase 0.',
          clusterState: {
            ...emptyCluster,
            namespaces: ['default', 'kube-system', 'kube-public', 'kube-node-lease'],
            highlightedComponent: 'apiserver',
          },
          tip: 'You can also use the short form: kubectl get ns',
        },
        {
          id: 'p2-m1-s2',
          title: 'Create a staging namespace',
          instruction: 'Create a new namespace called "staging" to represent a staging environment.',
          command: 'kubectl create namespace staging',
          output: ['namespace/staging created'],
          explanation: 'Namespaces are cheap — creating one is instant and uses virtually no resources. The namespace object itself just registers the name with the cluster.',
          clusterState: {
            ...emptyCluster,
            namespaces: ['default', 'kube-system', 'kube-public', 'kube-node-lease', 'staging'],
            events: ['Namespace staging created'],
            highlightedComponent: 'etcd',
          },
        },
        {
          id: 'p2-m1-s3',
          title: 'Run a pod in the staging namespace',
          instruction: 'Use -n to target the staging namespace when creating the pod.',
          command: 'kubectl run nginx --image=nginx:1.27 -n staging',
          output: ['pod/nginx created'],
          explanation: 'The -n flag tells kubectl which namespace to target. Without it, the pod would land in "default". Notice that kubectl get pods (without -n) won\'t show this pod.',
          clusterState: {
            pods: [
              { id: 'nginx-stg', name: 'nginx', namespace: 'staging', node: 'node-1', status: 'Running', labels: { run: 'nginx' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system', 'kube-public', 'kube-node-lease', 'staging'],
            events: ['Pod nginx scheduled → node-1'],
            highlightedComponent: 'scheduler',
          },
          tip: 'Try "kubectl get pods" without -n after this step — the pod won\'t appear. Run "kubectl get pods -n staging" to see it.',
        },
        {
          id: 'p2-m1-s4',
          title: 'List pods across all namespaces',
          instruction: 'The -A flag (short for --all-namespaces) shows every pod in every namespace.',
          command: 'kubectl get pods -A',
          output: [
            'NAMESPACE     NAME                                   READY   STATUS    RESTARTS   AGE',
            'kube-system   coredns-6f6b679f8f-4vj8t               1/1     Running   0          5d',
            'kube-system   etcd-controlplane                      1/1     Running   0          5d',
            'kube-system   kube-apiserver-controlplane            1/1     Running   0          5d',
            'kube-system   kube-scheduler-controlplane            1/1     Running   0          5d',
            'staging       nginx                                  1/1     Running   0          30s',
          ],
          explanation: 'The NAMESPACE column makes it clear where each pod lives. This is the quickest way to get a full picture of what is running across your entire cluster.',
          clusterState: {
            pods: [
              { id: 'nginx-stg', name: 'nginx', namespace: 'staging', node: 'node-1', status: 'Running', labels: { run: 'nginx' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'coredns', name: 'coredns-6f6b679f8f-4vj8t', namespace: 'kube-system', node: 'node-2', status: 'Running', labels: {}, image: 'coredns', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system', 'kube-public', 'kube-node-lease', 'staging'],
            events: [],
          },
        },
        {
          id: 'p2-m1-s5',
          title: 'Delete the staging namespace',
          instruction: 'Delete the namespace. This will also delete every resource inside it — namespaces cascade.',
          command: 'kubectl delete namespace staging',
          output: ['namespace "staging" deleted'],
          explanation: 'Deleting a namespace triggers cascading deletion: Kubernetes deletes every Pod, ConfigMap, Secret, Service, and other namespaced resource inside it. This is immediate and irreversible — always double-check before deleting a namespace in production.',
          clusterState: {
            ...emptyCluster,
            namespaces: ['default', 'kube-system', 'kube-public', 'kube-node-lease'],
            events: ['Namespace staging deleted (cascading)'],
          },
          tip: 'If a namespace is stuck in "Terminating", it usually means a finalizer on a resource inside it is blocking deletion.',
        },
      ],
      quiz: [
        {
          id: 'p2-m1-q1',
          question: 'What happens to all resources when you delete a namespace?',
          options: [
            'Resources are moved to the "default" namespace',
            'All resources inside the namespace are also deleted (cascading deletion)',
            'Resources enter "Terminating" state but are not deleted',
            'Only Pods are deleted; ConfigMaps and Secrets survive',
          ],
          answer: 1,
          explanation: 'Deleting a namespace triggers cascading deletion of ALL resources inside it — Pods, Services, ConfigMaps, Secrets, Deployments, and more. This is why you should be careful when deleting namespaces in production.',
        },
        {
          id: 'p2-m1-q2',
          question: 'Which namespace should your production apps NOT run in by default?',
          options: ['kube-system', 'kube-public', 'default', 'kube-node-lease'],
          answer: 2,
          explanation: '"default" is fine for experimentation, but production apps should be in dedicated namespaces (e.g., "production" or an app-specific name). This enables RBAC, ResourceQuotas, and cleaner separation from other workloads.',
        },
        {
          id: 'p2-m1-q3',
          question: 'How do you set a default namespace so you don\'t need -n on every command?',
          options: [
            'kubectl set default-namespace staging',
            'kubectl config set-context --current --namespace=staging',
            'export KUBECONFIG_NAMESPACE=staging',
            'kubectl namespace use staging',
          ],
          answer: 1,
          explanation: '"kubectl config set-context --current --namespace=staging" modifies your kubeconfig to set the active namespace for the current context. All subsequent commands target that namespace until you change it again.',
        },
        {
          id: 'p2-m1-q4',
          question: 'Which namespace contains Kubernetes infrastructure components like etcd and kube-apiserver?',
          options: ['default', 'kube-public', 'kube-node-lease', 'kube-system'],
          answer: 3,
          explanation: 'kube-system is reserved for Kubernetes infrastructure: kube-apiserver, etcd, kube-scheduler, kube-controller-manager, coredns, and kube-proxy all run here.',
        },
      ],
      coverage: {
        concepts: ['namespace as virtual cluster boundary', 'resource isolation per namespace', 'built-in namespaces: default, kube-system, kube-public, kube-node-lease', 'cross-namespace DNS', 'ResourceQuota per namespace', 'LimitRange per namespace'],
        commands: ['kubectl get namespaces', 'kubectl create namespace', 'kubectl delete namespace', 'kubectl get pods -n', 'kubectl get all -n', 'kubectl config set-context --current --namespace', 'kubectl api-resources --namespaced=true'],
        architecture: ['namespace as API group scope', 'cluster-scoped vs namespace-scoped resources', 'how kube-system separation protects control plane from user workloads'],
        techniques: ['scoping commands with -n flag', 'setting default namespace in kubeconfig context', 'listing all resources across all namespaces with -A'],
        procedures: ['create a namespace', 'deploy workload into specific namespace', 'switch default namespace', 'list all pods across all namespaces'],
        toolsAndPlugins: ['kubectl', 'minikube', 'kubens (optional)'],
        cases: ['deploying to wrong namespace due to missing -n flag', 'quota exceeded blocking pod creation', 'cross-namespace service DNS required'],
        scenarios: ['isolate dev and staging workloads on same cluster', 'debug why a pod cannot see another pod by short DNS name'],
      },
      exercises: [
        {
          id: 'p2-m1-e1',
          title: 'Official tutorial: Namespaces Walkthrough — dev/prod isolation',
          kind: 'guided',
          goal: 'Follow the official Kubernetes Namespaces Walkthrough: create dev and production namespaces, deploy into each, and verify isolation.',
          commands: [
            'kubectl get namespaces',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Namespace
metadata:
  name: development
  labels:
    name: development
---
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    name: production
EOF`,
            'kubectl get namespaces --show-labels',
            'kubectl config set-context dev --namespace=development --cluster=$(kubectl config view -o jsonpath="{.clusters[0].name}") --user=$(kubectl config view -o jsonpath="{.users[0].name}")',
            'kubectl config use-context dev',
            'kubectl config current-context',
            'kubectl create deployment snowflake --image=registry.k8s.io/serve_hostname --replicas=2',
            'kubectl get deployment',
            'kubectl get pods -l app=snowflake',
            'kubectl config set-context prod --namespace=production --cluster=$(kubectl config view -o jsonpath="{.clusters[0].name}") --user=$(kubectl config view -o jsonpath="{.users[0].name}")',
            'kubectl config use-context prod',
            'kubectl get deployment',
            'kubectl get pods',
            'kubectl create deployment cattle --image=registry.k8s.io/serve_hostname --replicas=5',
            'kubectl get deployment',
            'kubectl config use-context minikube',
          ],
          verify: ['kubectl get namespaces --show-labels shows development and production with name labels', 'In dev context: snowflake deployment shows READY 2/2', 'In prod context: kubectl get deployment returns No resources found (isolation confirmed)', 'In prod context: cattle deployment shows READY 5/5'],
          expectedOutcome: 'Namespace isolation demonstrated: dev resources invisible in prod context.',
          cleanup: ['kubectl config delete-context dev', 'kubectl config delete-context prod', 'kubectl delete namespace development', 'kubectl delete namespace production'],
          sourceRefs: [
            { title: 'Kubernetes: Namespaces Walkthrough', url: 'https://kubernetes.io/docs/tutorials/cluster-management/namespaces-walkthrough/', checkedAt: '2026-06', scope: 'tutorial' },
          ],
        },
        {
          id: 'p2-m1-e2',
          title: 'Set default namespace and test cross-namespace DNS',
          kind: 'challenge',
          goal: 'Switch default namespace in context and resolve a service across namespace boundary.',
          commands: [
            'kubectl create namespace app-ns',
            'kubectl create deployment backend --image=nginx:1.27 -n app-ns',
            'kubectl expose deployment backend --port=80 -n app-ns',
            'kubectl config set-context --current --namespace=app-ns',
            'kubectl get pods',
            'kubectl run curl-pod --image=curlimages/curl:8.7.1 --restart=Never -n default -- sleep 3600',
            'kubectl exec curl-pod -n default -- curl -s http://backend.app-ns.svc.cluster.local',
            'kubectl config set-context --current --namespace=default',
          ],
          verify: ['Context switch makes app-ns the default', 'Cross-namespace DNS curl returns nginx page'],
          expectedOutcome: 'Default namespace switched; cross-namespace DNS confirmed.',
          cleanup: ['kubectl delete pod curl-pod -n default --ignore-not-found', 'kubectl delete namespace app-ns'],
        },
        {
          id: 'p2-m1-e3',
          title: 'Debug missing pod due to wrong namespace',
          kind: 'debug',
          goal: 'Reproduce and diagnose the classic "pod not found" error caused by namespace mismatch.',
          commands: [
            'kubectl create namespace hidden-ns',
            'kubectl run hidden-pod --image=nginx:1.27 -n hidden-ns',
            'kubectl get pods',
            'kubectl get pods -n hidden-ns',
            'kubectl get pods -A | grep hidden-pod',
          ],
          verify: ['kubectl get pods (without -n) returns No resources found in default namespace', 'kubectl get pods -n hidden-ns returns the pod', '-A flag finds it'],
          expectedOutcome: 'Understand how namespace scoping hides resources and how -A and -n fix it.',
          cleanup: ['kubectl delete namespace hidden-ns'],
        },
        {
          id: 'p2-m1-e4',
          title: '1-day spaced review — namespace commands',
          kind: 'spaced-review',
          goal: 'Recall namespace management commands from memory.',
          commands: [
            'kubectl get namespaces',
            'kubectl create namespace spaced-ns',
            'kubectl get pods -n spaced-ns',
            'kubectl get all -A | head -20',
            'kubectl delete namespace spaced-ns',
          ],
          verify: ['All commands run without error', 'Namespace created and deleted cleanly'],
          expectedOutcome: 'Namespace commands recalled and executed without notes.',
          cleanup: ['kubectl delete namespace spaced-ns --ignore-not-found'],
        },
      ],
    },

    // ─── Module 2: Labels & Selectors ───────────────────────────────────────
    {
      id: 'p2-m2',
      slug: 'labels-selectors',
      title: 'Labels & Selectors',
      description: 'Tag resources with key-value metadata and use selectors to wire Services, Deployments, and queries together.',
      duration: '45 min',
      difficulty: 'beginner',
      theory: `> 🧠 **Brain Warm-Up**: How does a Kubernetes Service dynamically find which Pods to route traffic to, and what low-level mechanism is updated on the worker nodes when a Pod's labels change?

## What Are Labels?

**Labels** are key-value pairs attached to metadata fields in Kubernetes API objects. They are key to the design of Kubernetes, enabling loose coupling between resources. Instead of hardcoding relationships (e.g., pointing a Service to a specific Pod name), objects query other objects dynamically using labels.

\`\`\`yaml
metadata:
  labels:
    app: web
    tier: frontend
    env: production
    version: v2
\`\`\`

Label keys have two optional parts: a prefix (up to 253 characters, domain-style) and a name (up to 63 characters). The Kubernetes community uses recommended keys prefixed with \`app.kubernetes.io/\` (e.g., \`app.kubernetes.io/name\`, \`app.kubernetes.io/part-of\`).

### Visualizing Service Selectors

\`\`\`text
  +---------------------+
  |   Service Object    |
  | selector: app=web   |
  +---------------------+
             |
             v (EndpointSlice Controller watches label changes via Informer)
  +---------------------+
  | EndpointSlice (EP)  | <--- Contains IPs: [10.244.1.5, 10.244.2.12]
  +---------------------+
             |
   +---------+---------+ (kube-proxy syncs to nodes)
   |                   |
   v                   v
+------------------+ +------------------+
|      Node 1      | |      Node 2      |
| iptables / IPVS  | | iptables / IPVS  |
| rules updated    | | rules updated    |
+------------------+ +------------------+
   | (routes traffic)  | (routes traffic)
   v                   v
+------------------+ +------------------+
| Pod: app=web     | | Pod: app=web     |
| IP: 10.244.1.5   | | IP: 10.244.2.12  |
+------------------+ +------------------+
\`\`\`

## The Reconcile Loop & Selectors

Under the hood, labels and selectors power the **Reconcile Loop** — the core control mechanism of Kubernetes.

1. **Informer Caches**: Controllers (like the ReplicaSet controller or the EndpointSlice controller) run in the \`kube-controller-manager\`. They register a **Watch** on the kube-apiserver for specific resource types.
2. **Label Matching**: When a new Pod is created or labeled, the EndpointSlice controller filters Pods using the label selector defined in a Service.
3. **Endpoint Propagation**: The controller generates or updates an \`EndpointSlice\` object listing the IPs of all matching Pods.
4. **Data Plane Updates**: \`kube-proxy\` running on every node watches the API server for changes to Services and EndpointSlices. Upon notification, it updates the node's packet-routing configuration:
   - **iptables mode**: Updates chaining rules to randomly distribute connections across target Pod IPs using the \`statistic\` module.
   - **IPVS mode**: Inserts entries into an in-kernel IPVS hash table, supporting faster routing and advanced load-balancing algorithms (e.g., least connections).

## Labels vs Annotations

While both store key-value metadata, they have distinct roles:

| Feature | Labels | Annotations |
|---|---|---|
| **Queryable/Selector-friendly** | Yes (via label selectors in API queries and manifests) | No (cannot be used to filter resources in API requests) |
| **Character Limits** | Max 63 characters for keys/values, strict alphanumeric format | No strict length limits (can store large strings like JSON) |
| **Primary Use Cases** | Dynamic grouping, Service targeting, scheduling constraints (NodeSelector) | CI/CD metadata (git hash, build ID), tool config (Ingress controllers, annotations for cert-manager) |

### Orphaned Pods
If you modify a Pod's labels such that they no longer match a Deployment's replica selector, the Deployment's controller immediately detects that the actual state (N - 1 matching pods) does not match the desired state (N). It spins up a new Pod to restore the replica count. The original Pod remains running as an **orphan**, disconnected from both the Deployment's control loop and the Service's traffic routing.

## Querying With kubectl

\`\`\`bash
# Equality-based
kubectl get pods -l app=web
kubectl get pods -l app=web,tier=frontend

# Set-based (comma = AND)
kubectl get pods -l 'tier in (frontend,backend)'
kubectl get pods -l 'env notin (staging)'
\`\`\``,
      labSteps: [
        {
          id: 'p2-m2-s1',
          title: 'Deploy pods with different labels',
          instruction: 'Create three pods with distinct label combinations to simulate a multi-tier app.',
          command: 'kubectl run web --image=nginx:1.27 -l app=web,tier=frontend && kubectl run api --image=nginx:1.27 -l app=api,tier=backend && kubectl run cache --image=redis:7 -l app=cache,tier=cache',
          output: [
            'pod/web created',
            'pod/api created',
            'pod/cache created',
          ],
          explanation: 'Each pod gets metadata labels at creation time with the -l flag. These labels are stored in etcd alongside the pod spec and are immediately queryable.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web', tier: 'frontend' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'api-def34', name: 'api', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'api', tier: 'backend' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'cache-ghi56', name: 'cache', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'cache', tier: 'cache' }, image: 'redis:7', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Pod web created', 'Pod api created', 'Pod cache created'],
          },
        },
        {
          id: 'p2-m2-s2',
          title: 'Show all labels',
          instruction: 'Use --show-labels to display the full label set for every pod.',
          command: 'kubectl get pods --show-labels',
          output: [
            'NAME    READY   STATUS    RESTARTS   AGE   LABELS',
            'api     1/1     Running   0          20s   app=api,tier=backend',
            'cache   1/1     Running   0          20s   app=cache,tier=cache',
            'web     1/1     Running   0          20s   app=web,tier=frontend',
          ],
          explanation: 'The LABELS column shows every key=value pair on the resource. This is the quickest way to audit what labels are present before writing a selector.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web', tier: 'frontend' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'api-def34', name: 'api', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'api', tier: 'backend' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'cache-ghi56', name: 'cache', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'cache', tier: 'cache' }, image: 'redis:7', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
          tip: 'Use -L app,tier to show specific label keys as columns instead of a combined LABELS column.',
        },
        {
          id: 'p2-m2-s3',
          title: 'Filter pods by label',
          instruction: 'Use -l to query only the pod with app=web.',
          command: 'kubectl get pods -l app=web',
          output: [
            'NAME   READY   STATUS    RESTARTS   AGE',
            'web    1/1     Running   0          45s',
          ],
          explanation: 'The -l flag applies a selector filter. Only pods matching app=web are returned. This is exactly what a Service does internally when deciding which pods to route traffic to.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web', tier: 'frontend' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p2-m2-s4',
          title: 'Add a label to a running pod',
          instruction: 'Use kubectl label to add an env label to the web pod without restarting it.',
          command: 'kubectl label pod web env=production',
          output: ['pod/web labeled'],
          explanation: 'Labels can be added, changed (--overwrite), or removed (key-) on running resources without any restart. The change is stored in etcd and is immediately visible to selectors.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web', tier: 'frontend', env: 'production' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'api-def34', name: 'api', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'api', tier: 'backend' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'cache-ghi56', name: 'cache', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'cache', tier: 'cache' }, image: 'redis:7', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Pod web labeled env=production'],
          },
          tip: 'To remove a label: kubectl label pod web env- (note the trailing dash).',
        },
        {
          id: 'p2-m2-s5',
          title: 'Set-based selector',
          instruction: 'Use a set-based selector to match pods whose tier is either frontend or backend.',
          command: "kubectl get pods -l 'tier in (frontend,backend)'",
          output: [
            'NAME   READY   STATUS    RESTARTS   AGE',
            'api    1/1     Running   0          2m',
            'web    1/1     Running   0          2m',
          ],
          explanation: 'Set-based selectors (in, notin, exists) are more expressive than equality selectors. They are used in Deployment and Job selectors where you need to match multiple values for a single key.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web', tier: 'frontend', env: 'production' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'api-def34', name: 'api', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'api', tier: 'backend' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
      ],
      quiz: [
        {
          id: 'p2-m2-q1',
          question: 'A Service has selector "app: web". A Pod has label "app: website". Does the Service route traffic to this Pod?',
          options: [
            'Yes — "website" contains "web" so it matches',
            'No — label selectors require an exact string match',
            'Yes — Services match on partial label values',
            'It depends on the Service type (ClusterIP vs NodePort)',
          ],
          answer: 1,
          explanation: 'Label selectors require exact equality. "app: website" does NOT match selector "app: web". The values must be identical character-for-character.',
        },
        {
          id: 'p2-m2-q2',
          question: 'What is the difference between labels and annotations?',
          options: [
            'Labels are for system use only; annotations are for users',
            'Labels can be used in selectors to find resources; annotations are non-identifying metadata that cannot be used in selectors',
            'Annotations support more characters; labels are limited to alphanumeric',
            'There is no functional difference — they are interchangeable',
          ],
          answer: 1,
          explanation: 'Labels are identifying metadata designed for selection and grouping. Annotations store non-identifying metadata (build info, owner contacts, tool-specific config) that cannot be used in selectors.',
        },
        {
          id: 'p2-m2-q3',
          question: 'Which kubectl flag shows label values in the output?',
          options: ['-v', '--labels', '--show-labels', '-l'],
          answer: 2,
          explanation: '"kubectl get pods --show-labels" adds a LABELS column to the output showing all key=value pairs for each resource. The -l flag is used to FILTER by labels, not display them.',
        },
        {
          id: 'p2-m2-q4',
          question: 'What happens if a Pod\'s labels no longer match a Deployment\'s selector?',
          options: [
            'The Pod is automatically deleted',
            'The Pod is adopted by a different Deployment',
            'The Pod becomes an orphan — the Deployment no longer manages it, and the ReplicaSet creates a replacement Pod',
            'The Deployment updates its selector to include the new labels',
          ],
          answer: 2,
          explanation: 'If you remove or change a label so a Pod no longer matches its Deployment\'s selector, the ReplicaSet controller sees it as "missing" and creates a new Pod. The original Pod becomes an unmanaged orphan still consuming resources.',
        },
      ],
      coverage: {
        concepts: ['labels as key-value metadata', 'label selectors: equality-based and set-based', 'annotations vs labels', 'how Services use selectors to find pods', 'how Deployments own ReplicaSets via matchLabels'],
        commands: ['kubectl label pod', 'kubectl label pod --overwrite', 'kubectl label pod key-', 'kubectl get pods -l', 'kubectl get pods --show-labels', 'kubectl get pods -l "key in (v1,v2)"'],
        architecture: ['Service selector → Endpoints controller → pod IP list', 'Deployment matchLabels ties controller to pod template', 'label selector immutability on Services and Deployments'],
        techniques: ['filtering resources with -l selector', 'labeling nodes for scheduling affinity', 'canary routing via label selectors', 'debugging orphaned pods via label mismatch'],
        procedures: ['add label to running pod', 'remove label from pod', 'filter pods by label', 'update service selector to match new label'],
        toolsAndPlugins: ['kubectl'],
        cases: ['pod orphaned after label removed — controller creates replacement', 'service misroutes traffic due to stale selector', 'cannot update selector on existing Deployment — immutable field error'],
        scenarios: ['identify all pods in a release with label filtering', 'quarantine a misbehaving pod by removing its service selector label'],
      },
      exercises: [
        {
          id: 'p2-m2-e1',
          title: 'Label pods and filter with selectors',
          kind: 'guided',
          goal: 'Apply labels to pods and filter resources using equality and set-based selectors.',
          commands: [
            'kubectl run app-v1 --image=nginx:1.26 --labels=app=web,version=v1',
            'kubectl run app-v2 --image=nginx:1.27 --labels=app=web,version=v2',
            'kubectl get pods --show-labels',
            'kubectl get pods -l app=web',
            'kubectl get pods -l version=v1',
            'kubectl get pods -l "version in (v1,v2)"',
            'kubectl get pods -l version!=v1',
          ],
          verify: ['Both pods visible with show-labels', '-l app=web returns both pods', '-l version=v1 returns only app-v1'],
          expectedOutcome: 'Labels applied and selector filtering works as expected.',
          cleanup: ['kubectl delete pod app-v1 app-v2 --ignore-not-found'],
        },
        {
          id: 'p2-m2-e2',
          title: 'Quarantine a pod by removing its service label',
          kind: 'challenge',
          goal: 'Remove a pod from service rotation by stripping its selector label, observe the replacement pod created.',
          commands: [
            'kubectl create deployment web --image=nginx:1.27 --replicas=2',
            'kubectl expose deployment web --type=ClusterIP --port=80',
            'kubectl get pods -l app=web --show-labels',
            'POD=$(kubectl get pods -l app=web -o jsonpath=\'{.items[0].metadata.name}\')',
            'kubectl label pod $POD app-',
            'kubectl get pods --show-labels',
            'kubectl get endpoints web',
          ],
          verify: ['Stripped pod no longer in endpoints', 'Deployment creates a replacement pod', 'Endpoints show only pods with app=web label'],
          expectedOutcome: 'Pod quarantined from service traffic; replacement pod auto-created by ReplicaSet.',
          cleanup: ['kubectl delete deployment web', 'kubectl delete service web', 'kubectl delete pod $POD --ignore-not-found'],
        },
        {
          id: 'p2-m2-e3',
          title: 'Debug service with wrong label selector',
          kind: 'debug',
          goal: 'Diagnose why a service has no endpoints because selector does not match pod labels.',
          commands: [
            'kubectl run backend --image=nginx:1.27 --labels=app=backend,tier=api',
            'kubectl expose pod backend --type=ClusterIP --port=80 --selector=app=wrong-label',
            'kubectl get endpoints backend',
            'kubectl describe service backend',
            'kubectl get pods --show-labels',
          ],
          verify: ['Endpoints shows <none> because selector mismatch', 'describe service shows Selector: app=wrong-label', 'pod has app=backend label not matching'],
          expectedOutcome: 'Selector mismatch identified as root cause of empty endpoints.',
          cleanup: ['kubectl delete pod backend --ignore-not-found', 'kubectl delete service backend --ignore-not-found'],
        },
        {
          id: 'p2-m2-e4',
          title: '3-day spaced review — label commands',
          kind: 'spaced-review',
          goal: 'Recall label management and selector filtering commands from memory.',
          commands: [
            'kubectl run sr-pod --image=nginx:1.27 --labels=app=review,env=test',
            'kubectl get pods --show-labels',
            'kubectl get pods -l app=review',
            'kubectl label pod sr-pod env=prod --overwrite',
            'kubectl label pod sr-pod env-',
            'kubectl delete pod sr-pod',
          ],
          verify: ['Labels applied and overwritten correctly', 'Label removal confirmed with show-labels'],
          expectedOutcome: 'Label commands recalled and executed from memory.',
          cleanup: ['kubectl delete pod sr-pod --ignore-not-found'],
        },
      ],
    },

    // ─── Module 3: ConfigMaps ────────────────────────────────────────────────
    {
      id: 'p2-m3',
      slug: 'configmaps',
      title: 'ConfigMaps',
      description: 'Externalise non-sensitive configuration from container images using ConfigMaps.',
      duration: '60 min',
      difficulty: 'beginner',
      theory: `> 🧠 **Brain Warm-Up**: If a ConfigMap is updated, how does the update propagate to containers using the ConfigMap as environment variables versus those mounting it as a volume, and why?

## ConfigMaps and Twelve-Factor Portability

The **12-Factor App** methodology states that config should be strictly separated from code. In Kubernetes, this separation is achieved using **ConfigMaps**. ConfigMaps decouple environment-specific parameters from the immutable container image, allowing the same container image to run across dev, staging, and production environments.

## What ConfigMaps Store

- Environment variable values (\`LOG_LEVEL=debug\`)
- Full configuration files (\`nginx.conf\`, \`application.properties\`)
- Command-line arguments

ConfigMaps are for **non-sensitive** data. Never put passwords or tokens in a ConfigMap — use a Secret instead.

### Visualizing ConfigMap Projection

\`\`\`text
                  +-------------------------+
                  |  ConfigMap in etcd      |
                  |  (Key-Value Data Store)  |
                  +-------------------------+
                               |
                               | (API Server)
                               v
                       +---------------+
                       |   Kubelet     |
                       +---------------+
                               |
         +---------------------+---------------------+
         | (Static Injection)                        | (Dynamic Sync Loop)
         v                                           v
+-----------------------------+             +-----------------------------+
|    Environment Variables    |             |        Volume Mount         |
|                             |             |                             |
| - Injected at startup       |             | - Kubelet writes to tmpfs   |
| - Read-only thereafter      |             | - Atomic symlink flip       |
| - Requires Pod restart      |             | - Live update (~1 min sync) |
+-----------------------------+             +-----------------------------+
\`\`\`

## Consumption Mechanisms & Internal Details

When you reference a ConfigMap in a Pod spec, the injection behaves differently depending on the projection mechanism:

### 1. Environment Variables (\`valueFrom.configMapKeyRef\` / \`envFrom\`)
- **Mechanism**: The container runtime (e.g. containerd) reads the ConfigMap values from the API server during container creation and sets them inside the container's process environment block (\`env\`).
- **Low-Level Detail**: The process reads env vars once during initialization.
- **Update Behavior**: **Static**. If the ConfigMap is modified, the environment variables inside the container **do not change**. The Pod must be restarted (e.g., via a rolling deployment trigger like \`kubectl rollout restart\`) to pick up updates.

### 2. Volume Mounts
- **Mechanism**: The \`kubelet\` creates a local directory on the host under \`/var/lib/kubelet/pods/<pod-uid>/volumes/kubernetes.io~configmap/\` backed by **tmpfs** (in-memory RAM filesystem). It requests the ConfigMap from the API server and writes the keys as files.
- **Low-Level Detail**: To prevent race conditions where a process reads a half-written config file during an update, kubelet uses **atomic symlink swapping**:
  1. It writes the new files to a unique timestamped directory (\`..data_timestamp\`).
  2. It updates a symbolic link (\`..data\`) to point to the new directory.
  3. The individual keys are symlinked to files inside \`..data\`.
- **Update Behavior**: **Dynamic**. Kubelet's periodic sync loop (defaulting to every 60 seconds, controlled by \`syncFrequency\` and \`configMapAndSecretChangeDetectionStrategy\`) will detect the update, fetch the new payload, and update the symlinks.
- **Exception**: If you mount a ConfigMap using \`subPath\`, the file is bind-mounted directly. The kernel does not update static bind-mounts when the parent directory's symlinks change. Therefore, **subPath mounted ConfigMaps do not receive hot updates**.

## Three Ways to Consume a ConfigMap

### 1. Single env var
\`\`\`yaml
env:
  - name: LOG_LEVEL
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: LOG_LEVEL
\`\`\`

### 2. All keys as env vars (envFrom)
\`\`\`yaml
envFrom:
  - configMapRef:
      name: app-config
\`\`\`

### 3. Volume mount (for config files)
\`\`\`yaml
volumes:
  - name: config-vol
    configMap:
      name: nginx-conf
containers:
  - volumeMounts:
    - name: config-vol
      mountPath: /etc/nginx
\`\`\`

## Update Behaviour

| Consumption method | Hot-reload when ConfigMap changes? |
|---|---|
| env var / envFrom | No — pod must be restarted |
| Volume mount | Yes — kubelet syncs within ~1 minute |

This difference is critical for production: if you need live config reloads, mount as a volume and design your app to watch the file.`,
      labSteps: [
        {
          id: 'p2-m3-s1',
          title: 'Create a ConfigMap from literals',
          instruction: 'Create a ConfigMap with two key-value pairs using --from-literal.',
          command: 'kubectl create configmap app-config --from-literal=APP_ENV=production --from-literal=LOG_LEVEL=info',
          output: ['configmap/app-config created'],
          explanation: 'Each --from-literal flag becomes one key-value entry in the ConfigMap. You can add as many as needed. The ConfigMap is stored in etcd and immediately available to any pod in the same namespace.',
          clusterState: {
            ...emptyCluster,
            events: ['ConfigMap app-config created'],
            highlightedComponent: 'etcd',
          },
        },
        {
          id: 'p2-m3-s2',
          title: 'Inspect the ConfigMap',
          instruction: 'Use kubectl describe to see the data stored in the ConfigMap.',
          command: 'kubectl describe configmap app-config',
          output: [
            'Name:         app-config',
            'Namespace:    default',
            'Labels:       <none>',
            'Annotations:  <none>',
            '',
            'Data',
            '====',
            'APP_ENV:',
            '----',
            'production',
            'LOG_LEVEL:',
            '----',
            'info',
            '',
            'BinaryData',
            '====',
            '',
            'Events:  <none>',
          ],
          explanation: 'The Data section shows all key-value pairs in plain text. Notice there is no encryption — ConfigMaps are not for secrets. BinaryData is for binary blobs (rare).',
          clusterState: {
            ...emptyCluster,
            events: [],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p2-m3-s3',
          title: 'Mount a ConfigMap key as an env var',
          instruction: 'Apply a pod spec that reads APP_ENV from the ConfigMap as an environment variable.',
          command: 'kubectl apply -f -',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: config-demo
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ["sleep", "3600"]
    env:
    - name: APP_ENV
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: APP_ENV`,
          output: ['pod/config-demo created'],
          explanation: 'The configMapKeyRef pulls a single key from the named ConfigMap and exposes it as an environment variable inside the container. The container sees APP_ENV exactly as if it were set in the Dockerfile.',
          clusterState: {
            pods: [
              { id: 'config-demo', name: 'config-demo', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'busybox:1.36', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Pod config-demo created'],
            highlightedComponent: 'kubelet',
          },
        },
        {
          id: 'p2-m3-s4',
          title: 'Verify the env var inside the pod',
          instruction: 'Exec into the pod and echo the APP_ENV variable to confirm it was injected.',
          command: 'kubectl exec config-demo -- env | grep APP_ENV',
          output: ['APP_ENV=production'],
          explanation: 'The value "production" came from the ConfigMap, not from the container image. To change it, update the ConfigMap and restart the pod — the new pod will pick up the updated value.',
          clusterState: {
            pods: [
              { id: 'config-demo', name: 'config-demo', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'busybox:1.36', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p2-m3-s5',
          title: 'Create a ConfigMap from a file',
          instruction: 'Create a ConfigMap from a file to store a full nginx configuration.',
          command: 'kubectl create configmap nginx-conf --from-file=nginx.conf',
          output: ['configmap/nginx-conf created'],
          explanation: 'When created from a file, the ConfigMap key is the filename (nginx.conf) and the value is the file contents. This is ideal for full config files like nginx.conf, prometheus.yml, or application.properties.',
          clusterState: {
            ...emptyCluster,
            events: ['ConfigMap nginx-conf created'],
          },
          tip: 'Sample nginx.conf content to use: "events {} http { server { listen 80; location / { return 200 \'hello\'; } } }"',
        },
        {
          id: 'p2-m3-s6',
          title: 'Mount a ConfigMap as a volume',
          instruction: 'Apply a pod spec that mounts the nginx-conf ConfigMap as a file at /etc/nginx/nginx.conf.',
          command: 'kubectl apply -f -',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: nginx-custom
spec:
  containers:
  - name: nginx
    image: nginx:1.27
    volumeMounts:
    - name: config-vol
      mountPath: /etc/nginx/nginx.conf
      subPath: nginx.conf
  volumes:
  - name: config-vol
    configMap:
      name: nginx-conf`,
          output: ['pod/nginx-custom created'],
          explanation: 'The volume mount pattern projects each ConfigMap key as a file inside the container. Using subPath mounts only the specific key (nginx.conf) rather than the entire ConfigMap directory. Volume-mounted ConfigMaps update live within ~1 minute when the ConfigMap changes — no pod restart needed.',
          clusterState: {
            pods: [
              { id: 'config-demo', name: 'config-demo', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'busybox:1.36', restarts: 0 },
              { id: 'nginx-custom', name: 'nginx-custom', namespace: 'default', node: 'node-2', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Pod nginx-custom created'],
            highlightedComponent: 'kubelet',
          },
        },
      ],
      quiz: [
        {
          id: 'p2-m3-q1',
          question: 'You update a ConfigMap that is mounted as a volume in a running pod. What happens?',
          options: [
            'Nothing — the pod must be restarted to see the change',
            'The file inside the container is automatically updated within approximately one minute',
            'The pod is automatically restarted with the new config',
            'The update is rejected until the pod is restarted',
          ],
          answer: 1,
          explanation: 'Volume-mounted ConfigMaps are synced by kubelet approximately every minute (controlled by --sync-frequency). The file on disk updates without a pod restart. However, env var / envFrom ConfigMaps require a pod restart to see changes.',
        },
        {
          id: 'p2-m3-q2',
          question: 'What is the correct API field to inject ALL keys from a ConfigMap as environment variables?',
          options: ['configMapRef', 'configMapKeyRef', 'envFrom with configMapRef', 'envAll'],
          answer: 2,
          explanation: '"envFrom" with a "configMapRef" entry bulk-injects all keys from the ConfigMap as environment variables. "configMapKeyRef" (inside "env") is for injecting a single key.',
        },
        {
          id: 'p2-m3-q3',
          question: 'ConfigMaps should NOT be used for which type of data?',
          options: [
            'Application log levels',
            'Feature flag values',
            'Database passwords and API tokens',
            'nginx configuration files',
          ],
          answer: 2,
          explanation: 'ConfigMaps store data in plaintext in etcd. Sensitive data like passwords, tokens, and TLS keys should be stored in Secrets (which can be encrypted at rest with EncryptionConfiguration).',
        },
        {
          id: 'p2-m3-q4',
          question: 'A ConfigMap key is "database.url". When mounted as a volume, what is the filename inside the container?',
          options: ['database_url', 'database-url', 'database.url', 'DATABASE_URL'],
          answer: 2,
          explanation: 'ConfigMap keys become filenames exactly as-is when volume-mounted. The key "database.url" becomes a file named "database.url". Dots and hyphens are valid in filenames and are preserved.',
        },
      ],
      coverage: {
        concepts: ['ConfigMap as key-value store for non-sensitive config', 'envFrom vs env valueFrom', 'volume-mounted ConfigMap as files', 'hot-reload of volume-mounted ConfigMap (eventual consistency)', 'env vars from ConfigMap are NOT hot-reloaded'],
        commands: ['kubectl create configmap --from-literal', 'kubectl create configmap --from-file', 'kubectl get configmap', 'kubectl describe configmap', 'kubectl get configmap -o yaml'],
        architecture: ['ConfigMap stored in etcd as plaintext', 'kubelet syncs volume-mounted ConfigMap on watch event', 'env var injection happens at pod start — no runtime update'],
        techniques: ['inject config as environment variables', 'mount config as files in volume', 'use envFrom to inject all keys as env vars', 'reference specific keys with valueFrom.configMapKeyRef'],
        procedures: ['create ConfigMap from literals', 'create ConfigMap from file', 'mount ConfigMap as volume', 'inject ConfigMap keys as env vars', 'verify mounted config inside container'],
        toolsAndPlugins: ['kubectl', 'minikube'],
        cases: ['stale env var after ConfigMap update — pod restart required', 'volume-mounted file eventually updates without restart', 'missing ConfigMap key causes pod to fail with CreateContainerConfigError'],
        scenarios: ['inject nginx.conf via ConfigMap volume mount', 'inject feature flags as env vars and update without image rebuild'],
      },
      exercises: [
        {
          id: 'p2-m3-e1',
          title: 'Official tutorial: configure Redis using a ConfigMap',
          kind: 'guided',
          goal: 'Follow the official "Configuring Redis Using a ConfigMap" tutorial: apply empty config, check defaults, update ConfigMap with maxmemory, restart pod, verify values applied.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: example-redis-config
data:
  redis-config: ""
EOF`,
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: redis
spec:
  containers:
  - name: redis
    image: redis:5.0.4
    command:
      - redis-server
      - "/redis-master/redis.conf"
    env:
    - name: MASTER
      value: "true"
    ports:
    - containerPort: 6379
    resources:
      limits:
        cpu: "0.1"
    volumeMounts:
    - mountPath: /redis-master-data
      name: data
    - mountPath: /redis-master
      name: config
  volumes:
    - name: data
      emptyDir: {}
    - name: config
      configMap:
        name: example-redis-config
        items:
        - key: redis-config
          path: redis.conf
EOF`,
            'kubectl get pod/redis configmap/example-redis-config',
            'kubectl describe configmap/example-redis-config',
            'kubectl exec -it redis -- redis-cli CONFIG GET maxmemory',
            'kubectl exec -it redis -- redis-cli CONFIG GET maxmemory-policy',
            `kubectl apply -f - <<'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: example-redis-config
data:
  redis-config: |
    maxmemory 2mb
    maxmemory-policy allkeys-lru
EOF`,
            'kubectl describe configmap/example-redis-config',
            'kubectl exec -it redis -- redis-cli CONFIG GET maxmemory',
            'kubectl delete pod redis',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: redis
spec:
  containers:
  - name: redis
    image: redis:5.0.4
    command:
      - redis-server
      - "/redis-master/redis.conf"
    ports:
    - containerPort: 6379
    resources:
      limits:
        cpu: "0.1"
    volumeMounts:
    - mountPath: /redis-master-data
      name: data
    - mountPath: /redis-master
      name: config
  volumes:
    - name: data
      emptyDir: {}
    - name: config
      configMap:
        name: example-redis-config
        items:
        - key: redis-config
          path: redis.conf
EOF`,
            'kubectl exec -it redis -- redis-cli CONFIG GET maxmemory',
            'kubectl exec -it redis -- redis-cli CONFIG GET maxmemory-policy',
          ],
          verify: ['Before update: maxmemory returns 0, maxmemory-policy returns noeviction', 'After ConfigMap update but BEFORE pod restart: values still show old defaults (key insight: pod restart required for command-arg configs)', 'After pod delete + recreate: maxmemory returns 2097152, maxmemory-policy returns allkeys-lru'],
          expectedOutcome: 'ConfigMap update applied to Redis after pod restart. Demonstrates that env-var and command-arg configs require pod restart, unlike volume-mounted files.',
          cleanup: ['kubectl delete pod/redis configmap/example-redis-config --ignore-not-found'],
          sourceRefs: [
            { title: 'Kubernetes: Configuring Redis Using a ConfigMap', url: 'https://kubernetes.io/docs/tutorials/configuration/configure-redis-using-configmap/', checkedAt: '2026-06', scope: 'tutorial' },
          ],
        },
        {
          id: 'p2-m3-e2',
          title: 'Mount ConfigMap as a volume file',
          kind: 'challenge',
          goal: 'Mount a ConfigMap key as a file inside a container and verify hot-reload behavior.',
          commands: [
            'kubectl create configmap nginx-config --from-literal=index.html="<h1>Hello ConfigMap</h1>"',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: nginx-cm
spec:
  containers:
  - name: nginx
    image: nginx:1.27
    volumeMounts:
    - name: config-vol
      mountPath: /usr/share/nginx/html
  volumes:
  - name: config-vol
    configMap:
      name: nginx-config
EOF`,
            'kubectl exec nginx-cm -- cat /usr/share/nginx/html/index.html',
            'kubectl patch configmap nginx-config --patch \'{"data":{"index.html":"<h1>Updated</h1>"}}\'',
            'sleep 15 && kubectl exec nginx-cm -- cat /usr/share/nginx/html/index.html',
          ],
          verify: ['Initial file shows Hello ConfigMap', 'After patch and wait, file shows Updated (hot-reload confirmed)'],
          expectedOutcome: 'Volume-mounted ConfigMap hot-reloads without pod restart.',
          cleanup: ['kubectl delete pod nginx-cm --ignore-not-found', 'kubectl delete configmap nginx-config'],
        },
        {
          id: 'p2-m3-e3',
          title: 'Diagnose CreateContainerConfigError from missing ConfigMap',
          kind: 'debug',
          goal: 'Understand what happens when a pod references a ConfigMap that does not exist.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: missing-cm-pod
spec:
  containers:
  - name: app
    image: nginx:1.27
    envFrom:
    - configMapRef:
        name: this-configmap-does-not-exist
EOF`,
            'kubectl get pod missing-cm-pod',
            'kubectl describe pod missing-cm-pod',
          ],
          verify: ['Pod stays in Pending or shows CreateContainerConfigError', 'describe shows ConfigMap not found in Events section'],
          expectedOutcome: 'Missing ConfigMap reference diagnosed via kubectl describe events.',
          cleanup: ['kubectl delete pod missing-cm-pod --ignore-not-found'],
        },
        {
          id: 'p2-m3-e4',
          title: '3-day spaced review — ConfigMap commands',
          kind: 'spaced-review',
          goal: 'Recall ConfigMap creation and injection commands from memory.',
          commands: [
            'kubectl create configmap sr-config --from-literal=KEY=value',
            'kubectl get configmap sr-config -o yaml',
            'kubectl describe configmap sr-config',
            'kubectl delete configmap sr-config',
          ],
          verify: ['ConfigMap created with correct key', 'get -o yaml shows data section with KEY=value'],
          expectedOutcome: 'ConfigMap commands recalled and executed without notes.',
          cleanup: ['kubectl delete configmap sr-config --ignore-not-found'],
        },
      ],
    },

    // ─── Module 4: Secrets ───────────────────────────────────────────────────
    {
      id: 'p2-m4',
      slug: 'secrets',
      title: 'Secrets',
      description: 'Store and consume sensitive data like passwords, tokens, and TLS certificates safely.',
      duration: '60 min',
      difficulty: 'intermediate',
      theory: `> 🧠 **Brain Warm-Up**: What is the default encryption state of Kubernetes Secrets in etcd, and what low-level mechanism ensures they do not get written to the physical storage disk of the worker nodes?

## What Are Secrets?

**Secrets** are designed to store sensitive configuration data such as database passwords, API tokens, private TLS keys, and docker registry credentials.

While they behave similarly to ConfigMaps, their lifecycle, storage, and access paths are engineered to prevent exposure.

### Visualizing Secrets Security Flow

\`\`\`text
                  +--------------------------------+
                  |  kubectl apply -f secret.yaml  | (Base64 Encoded Payload)
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |      kube-apiserver            |
                  |  (Optionally encrypts via KMS) |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |           etcd                 | (Stored in Raft consensus:
                  |                                |  Plaintext OR KMS Encrypted)
                  +--------------------------------+
                                  |
                   (mTLS / API Server watches)
                                  |
                                  v
                  +--------------------------------+
                  |            Kubelet             |
                  +--------------------------------+
                                  |
               (Mounts payload into worker node memory)
                                  v
                  +--------------------------------+
                  |      tmpfs (RAM disk)          | (Never written to worker node
                  |  /var/lib/kubelet/pods/...     |  physical storage disk)
                  +--------------------------------+
\`\`\`

## Base64 vs Encryption at Rest

A common point of confusion is that Secrets are "encrypted" in the manifest. **Base64 is a serialization encoding scheme, not encryption.** It exists to allow binary files (like certificates) to be safely encoded into YAML strings without breaking parser syntax.

\`\`\`bash
# To decode a secret from YAML:
echo "czNjcjN0" | base64 --decode  # outputs: s3cr3t
\`\`\`

To secure Secrets at rest in the backend database (**etcd**, which uses Raft consensus to replicate state), you must configure **EncryptionConfiguration** on the \`kube-apiserver\`.

Without this configuration, keys and values are stored in etcd as plaintext. The API server supports multiple providers for encryption:
1. **Local Providers**: \`aescbc\` (AES-CBC), \`secretbox\` (XSalsa20 and Poly1305).
2. **KMS Provider**: Integrates with external Key Management Services (AWS KMS, GCP KMS, HashiCorp Vault) via a local gRPC plugin. The KMS provider uses **envelope encryption**: a local Key Encryption Key (KEK) encrypts the data, and the KMS encrypts the KEK.

## Host-Level Security: tmpfs & Env Vars

To secure secrets on the physical worker nodes where Pods run, Kubernetes avoids writing them to disk:
1. **tmpfs Mounts**: When a Secret is mounted as a volume, the \`kubelet\` creates a **tmpfs** (RAM disk) volume inside the host memory. The secret files are written directly into RAM. If the node is powered down or rebooted, the secret data vanishes instantly from host memory.
2. **Environment Variables**: While convenient, using \`secretKeyRef\` to inject secrets as environment variables is discouraged for high-security workloads. Environment variables are visible in plaintext to anyone with container process-inspection rights via \`/proc/<pid>/environ\` and are frequently dumped into application log aggregators during crashes.

## Secret Types

| Secret Type | Required Data Keys | Intended Usage |
|---|---|---|
| \`Opaque\` | User-defined | Default type for generic key-value pairs (e.g. database credentials). |
| \`kubernetes.io/tls\` | \`tls.crt\`, \`tls.key\` | Stores a public certificate and matching private key. Used by Ingress controllers to terminate TLS. |
| \`kubernetes.io/dockerconfigjson\` | \`.dockerconfigjson\` | Stores registry authentication credentials (base64 JSON config) used by kubelet to pull images from private registries via \`imagePullSecrets\`. |
| \`kubernetes.io/service-account-token\` | \`token\`, \`ca.crt\` | Contains a JWT token representing the ServiceAccount. Historically auto-created, now primarily generated dynamically via the TokenRequest API for security. |

## Best Practices

1. **Never commit Secret YAML to git** — even base64-encoded values are easily decoded
2. **Use external secret stores in production**: HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager
3. **Enable EncryptionConfiguration** on the API server for encryption at rest
4. **Scope RBAC tightly** — only the service accounts that need a Secret should be able to read it
5. **Prefer volume mounts over env vars** — env vars can be leaked in crash dumps and logs

> Secrets are NOT more secure than ConfigMaps by default. Security comes from etcd encryption + RBAC, not the Secret object type itself.`,
      labSteps: [
        {
          id: 'p2-m4-s1',
          title: 'Create a Secret',
          instruction: 'Create a generic Secret with database credentials using --from-literal.',
          command: 'kubectl create secret generic db-creds --from-literal=username=admin --from-literal=password=s3cr3t',
          output: ['secret/db-creds created'],
          explanation: 'kubectl automatically base64-encodes the values before storing them. The Secret is stored in etcd. Unlike ConfigMaps, kubectl get secret does not print values by default.',
          clusterState: {
            ...emptyCluster,
            events: ['Secret db-creds created'],
            highlightedComponent: 'etcd',
          },
        },
        {
          id: 'p2-m4-s2',
          title: 'See the base64 encoding',
          instruction: 'Get the Secret as YAML to see that values are base64-encoded, not plaintext.',
          command: 'kubectl get secret db-creds -o yaml',
          output: [
            'apiVersion: v1',
            'data:',
            '  password: czNjcjN0',
            '  username: YWRtaW4=',
            'kind: Secret',
            'metadata:',
            '  name: db-creds',
            '  namespace: default',
            'type: Opaque',
          ],
          explanation: '"YWRtaW4=" is just "admin" in base64. "czNjcjN0" is "s3cr3t". This is encoding, not encryption. Anyone with kubectl get secret access can decode these values instantly. This is why etcd encryption and tight RBAC are essential.',
          clusterState: {
            ...emptyCluster,
            events: [],
            highlightedComponent: 'etcd',
          },
          tip: 'Try: echo "YWRtaW4=" | base64 --decode — it prints "admin". That is all base64 is.',
        },
        {
          id: 'p2-m4-s3',
          title: 'Decode a Secret value',
          instruction: 'Use jsonpath and base64 to decode the password directly from the cluster.',
          command: "kubectl get secret db-creds -o jsonpath='{.data.password}' | base64 --decode",
          output: ['s3cr3t'],
          explanation: 'This is how you retrieve a Secret value in scripts and CI pipelines. The jsonpath extracts the raw base64 string; base64 --decode gives you the original plaintext. Any user with "get secret" RBAC permission can do exactly this.',
          clusterState: {
            ...emptyCluster,
            events: [],
          },
        },
        {
          id: 'p2-m4-s4',
          title: 'Inject Secret values as env vars',
          instruction: 'Apply a pod spec that injects username and password from the Secret as environment variables.',
          command: 'kubectl apply -f -',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: db-client
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ["sleep", "3600"]
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: db-creds
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-creds
          key: password`,
          output: ['pod/db-client created'],
          explanation: 'secretKeyRef works exactly like configMapKeyRef but pulls from a Secret. The kubelet decodes the base64 value and injects the plaintext into the container environment. The container sees DB_PASSWORD=s3cr3t.',
          clusterState: {
            pods: [
              { id: 'db-client', name: 'db-client', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'busybox:1.36', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Pod db-client created'],
            highlightedComponent: 'kubelet',
          },
        },
        {
          id: 'p2-m4-s5',
          title: 'imagePullSecret for private registries',
          instruction: 'Review the pattern for authenticating to a private container registry using an imagePullSecret.',
          command: 'kubectl create secret docker-registry regcred --docker-server=registry.example.com --docker-username=user --docker-password=pass',
          yamlContent: `# Reference the secret in your pod spec:
apiVersion: v1
kind: Pod
metadata:
  name: private-app
spec:
  imagePullSecrets:
  - name: regcred
  containers:
  - name: app
    image: registry.example.com/myapp:v1`,
          output: ['secret/regcred created'],
          explanation: 'imagePullSecrets tell the kubelet which credentials to use when pulling an image from a private registry. The Secret type kubernetes.io/dockerconfigjson stores the registry credentials in the Docker config JSON format. Add regcred to a ServiceAccount to apply it automatically to all pods that use that ServiceAccount.',
          clusterState: {
            pods: [
              { id: 'db-client', name: 'db-client', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'busybox:1.36', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Secret regcred created'],
          },
        },
      ],
      quiz: [
        {
          id: 'p2-m4-q1',
          question: 'Base64-encoding in Secrets means the data is encrypted. True or false?',
          options: [
            'True — base64 is a form of encryption',
            'False — base64 is just an encoding; anyone can decode it in seconds',
            'True, but only when EncryptionConfiguration is enabled',
            'False, but the data is hashed so the original value cannot be recovered',
          ],
          answer: 1,
          explanation: 'Base64 is an encoding scheme, not encryption. It exists to safely represent binary data in text formats. Anyone can decode "czNjcjN0" back to "s3cr3t" with a single base64 --decode call. Real encryption requires enabling EncryptionConfiguration on the API server.',
        },
        {
          id: 'p2-m4-q2',
          question: 'What kubectl command decodes a Secret value from the cluster?',
          options: [
            'kubectl decode secret db-creds',
            'kubectl get secret db-creds --decrypt',
            "kubectl get secret db-creds -o jsonpath='{.data.password}' | base64 --decode",
            'kubectl describe secret db-creds --show-values',
          ],
          answer: 2,
          explanation: 'There is no "decode" or "decrypt" flag in kubectl. You must extract the base64 value with -o jsonpath and pipe it to base64 --decode. This is standard practice in scripts and CI pipelines.',
        },
        {
          id: 'p2-m4-q3',
          question: 'A Secret of type kubernetes.io/tls expects which two keys?',
          options: [
            'cert and key',
            'tls.crt and tls.key',
            'certificate and privateKey',
            'public.crt and private.key',
          ],
          answer: 1,
          explanation: 'Secrets of type kubernetes.io/tls must contain exactly two keys: "tls.crt" (the certificate) and "tls.key" (the private key). Ingress controllers and other components look for these exact key names.',
        },
        {
          id: 'p2-m4-q4',
          question: 'What is the production best practice for storing Secrets — why not just commit the YAML?',
          options: [
            'Committing YAML is fine because base64 is secure enough',
            'Never commit Secret YAML; use external secret stores (Vault, AWS Secrets Manager) and tools like External Secrets Operator',
            'Commit only to private repositories — public repos are the risk',
            'Encrypt the YAML file with gpg before committing',
          ],
          answer: 1,
          explanation: 'Secret YAML contains base64-encoded values that are trivially decodable. Committing them exposes credentials in git history permanently. The production pattern is to store secrets in dedicated secret management systems (Vault, AWS/GCP/Azure secret stores) and sync them into Kubernetes using tools like External Secrets Operator.',
        },
      ],
      coverage: {
        concepts: ['Secret as base64-encoded key-value store', 'Secret types: Opaque, kubernetes.io/tls, kubernetes.io/dockerconfigjson', 'base64 encoding is not encryption', 'EncryptionConfiguration for at-rest encryption', 'RBAC restricting Secret access', 'tmpfs volume mount for secrets'],
        commands: ['kubectl create secret generic --from-literal', 'kubectl create secret tls', 'kubectl create secret docker-registry', 'kubectl get secret', 'kubectl describe secret (no values)', 'kubectl get secret -o yaml', 'kubectl get secret -o jsonpath'],
        architecture: ['Secrets stored in etcd — base64 encoded by default', 'kubelet mounts secrets as tmpfs (RAM-backed) volumes', 'RBAC controls who can get/list/watch secrets', 'imagePullSecret for private registry auth'],
        techniques: ['inject secret as env var with secretKeyRef', 'mount secret as volume files', 'use imagePullSecrets for private image registries', 'decode secret value with kubectl + base64'],
        procedures: ['create Opaque secret', 'inject secret key as env var', 'mount secret as read-only volume', 'decode secret value for debugging'],
        toolsAndPlugins: ['kubectl', 'minikube'],
        cases: ['secret value leaked in pod env var list via kubectl describe pod', 'secret too large for etcd key limit', 'imagePullBackOff due to missing imagePullSecret'],
        scenarios: ['inject database password safely without committing to git', 'rotate a secret without pod restart using volume mount'],
      },
      exercises: [
        {
          id: 'p2-m4-e1',
          title: 'Create a secret and inject as env var',
          kind: 'guided',
          goal: 'Create an Opaque secret and inject a key into a pod as an environment variable.',
          commands: [
            'kubectl create secret generic db-secret --from-literal=DB_PASSWORD=s3cr3t --from-literal=DB_USER=admin',
            'kubectl get secret db-secret',
            'kubectl describe secret db-secret',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: secret-pod
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ["sh", "-c", "echo user=$DB_USER; sleep 3600"]
    env:
    - name: DB_USER
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: DB_USER
EOF`,
            'kubectl logs secret-pod',
            'kubectl get secret db-secret -o jsonpath=\'{.data.DB_PASSWORD}\' | base64 -d',
          ],
          verify: ['kubectl logs shows user=admin', 'describe secret does not show values', 'jsonpath decode returns s3cr3t'],
          expectedOutcome: 'Secret injected as env var; describe hides values; manual decode works.',
          cleanup: ['kubectl delete pod secret-pod --ignore-not-found', 'kubectl delete secret db-secret'],
        },
        {
          id: 'p2-m4-e2',
          title: 'Mount secret as volume files',
          kind: 'challenge',
          goal: 'Mount a secret as read-only files inside a container and verify tmpfs backing.',
          commands: [
            'kubectl create secret generic tls-like --from-literal=tls.crt=CERT_DATA --from-literal=tls.key=KEY_DATA',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: secret-vol-pod
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ["sh", "-c", "ls /etc/secrets; cat /etc/secrets/tls.crt; sleep 3600"]
    volumeMounts:
    - name: secret-vol
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secret-vol
    secret:
      secretName: tls-like
EOF`,
            'kubectl logs secret-vol-pod',
            'kubectl exec secret-vol-pod -- df /etc/secrets',
          ],
          verify: ['logs show tls.crt and tls.key listed', 'df shows tmpfs mount for /etc/secrets'],
          expectedOutcome: 'Secret mounted as tmpfs volume; files visible and read-only.',
          cleanup: ['kubectl delete pod secret-vol-pod --ignore-not-found', 'kubectl delete secret tls-like'],
        },
        {
          id: 'p2-m4-e3',
          title: 'Diagnose missing secret causing pod failure',
          kind: 'debug',
          goal: 'Observe and diagnose the pod error when a referenced secret does not exist.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: missing-secret-pod
spec:
  containers:
  - name: app
    image: nginx:1.27
    env:
    - name: TOKEN
      valueFrom:
        secretKeyRef:
          name: this-secret-does-not-exist
          key: token
EOF`,
            'kubectl get pod missing-secret-pod',
            'kubectl describe pod missing-secret-pod',
          ],
          verify: ['Pod stays in Pending or CreateContainerConfigError', 'Events show secret not found'],
          expectedOutcome: 'Missing secret reference diagnosed via describe events.',
          cleanup: ['kubectl delete pod missing-secret-pod --ignore-not-found'],
        },
        {
          id: 'p2-m4-e4',
          title: '7-day spaced review — secret commands',
          kind: 'spaced-review',
          goal: 'Recall secret creation and inspection commands from memory.',
          commands: [
            'kubectl create secret generic sr-secret --from-literal=KEY=value',
            'kubectl get secret sr-secret',
            'kubectl describe secret sr-secret',
            'kubectl get secret sr-secret -o jsonpath=\'{.data.KEY}\' | base64 -d',
            'kubectl delete secret sr-secret',
          ],
          verify: ['describe does not show plaintext value', 'jsonpath + base64 -d returns value'],
          expectedOutcome: 'Secret commands recalled correctly; base64 decode verified.',
          cleanup: ['kubectl delete secret sr-secret --ignore-not-found'],
        },
      ],
    },

    // ─── Module 5: Health Probes ─────────────────────────────────────────────
    {
      id: 'p2-m5',
      slug: 'probes',
      title: 'Health Probes',
      description: 'Tell Kubernetes when your app is alive, ready to serve traffic, and finished starting up.',
      duration: '75 min',
      difficulty: 'intermediate',
      theory: `> 🧠 **Brain Warm-Up**: How does the kubelet physically execute an \`exec\` probe versus an \`httpGet\` probe at the OS level, and how does a failing readiness probe change routing rules on nodes?

## Why Probes Matter

Without health probes, the Kubernetes control plane relies solely on the container process exit code. If a process enters an infinite loop, deadlocks, or runs out of database connections but does not crash, the PID remains alive. To the container runtime, the container is healthy. Probes allow the **kubelet** to query application-level health directly.

### Visualizing Probes Lifecycle & Traffic Routing

\`\`\`text
               +------------------------------------------------+
               |                  Kubelet                       |
               +------------------------------------------------+
                     | (probes container at periodSeconds)
                     |
         +-----------+-----------+
         | (httpGet / tcpSocket) | (exec)
         v                       v
+------------------+   +---------------------------------------+
|  Host network    |   | CRI gRPC API (ExecSync)               |
|  namespace check |   | -> calls container runtime (containerd)|
+------------------+   | -> runs process via runc in container |
         |             +---------------------------------------+
         |                                |
         +---------------++---------------+
                         |
                         v
                Does probe pass?
                 /            \
               NO              YES
               /                \
   +--------------------+     +--------------------------------+
   |  Which probe?      |     | Pod marked Ready / Healthy     |
   |   /            \   |     +--------------------------------+
  Liveness       Readiness
    /                \
Restart container  Remove Pod IP from EndpointSlice
                   -> kube-proxy removes iptables/IPVS rule
\`\`\`

## How Kubelet Executes Probes at the OS Level

Kubelet runs a dedicated Prober Manager that schedules checks per container. The execution depends on the mechanism:
- **\`httpGet\` / \`tcpSocket\` / \`gRPC\`**: The kubelet initiates the request from the host network namespace directly to the container's IP address. For \`httpGet\`, any response code \`>= 200\` and \`< 400\` is a success.
- **\`exec\`**: Kubelet makes a gRPC request to the **Container Runtime Interface (CRI)** API (\`ExecSync\`). The container runtime (e.g., containerd) invokes the OCI runtime (e.g., \`runc\`) to execute the binary within the container’s PID, mount, and network namespaces. The probe succeeds if the process returns exit code \`0\`. This is resource-intensive, as it forks a process inside the container every few seconds.

## Probe Types and Internal Pipelines

### 1. Startup Probe
- **Purpose**: Checks if the application has completed initialization.
- **Workflow**: While the startup probe is running, all other probes (liveness, readiness) are disabled. If the startup probe fails \`failureThreshold\` times, the kubelet kills the container and initiates the restart policy.

### 2. Liveness Probe
- **Purpose**: Detects if the application has entered a non-recoverable deadlocked state.
- **Workflow**: If the probe fails, kubelet communicates with the CRI to terminate the container. The termination process triggers a \`SIGTERM\`, waits for \`terminationGracePeriodSeconds\`, and sends \`SIGKILL\`. A new container is started.

### 3. Readiness Probe
- **Purpose**: Determines if the container is ready to accept client traffic.
- **Workflow**: Unlike liveness, **readiness failure does not trigger a restart**. Instead:
  1. The kubelet updates the Pod's status to \`Ready: False\`.
  2. The EndpointSlice controller in the control plane detects this state change and removes the Pod's IP address from the corresponding \`EndpointSlice\` objects.
  3. \`kube-proxy\` on all nodes watches for \`EndpointSlice\` changes and recalculates the node's \`iptables\` or \`IPVS\` rules, omitting this Pod's IP. Traffic stops routing to the Pod.

## Probe Mechanisms

- **httpGet**: sends an HTTP GET request — suitable for web services
- **tcpSocket**: checks if a TCP port accepts connections — suitable for databases, message queues
- **exec**: runs a command inside the container — most flexible, any exit 0 = success
- **grpc**: checks a gRPC health endpoint (standard \`grpc.health.v1.Health\`) — added in Kubernetes 1.24

## Key Parameters

\`\`\`yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10   # wait before first probe
  periodSeconds: 10          # probe every N seconds
  failureThreshold: 3        # fail N times before action
  successThreshold: 1        # pass N times to be considered healthy
  timeoutSeconds: 1          # how long to wait for a probe response before counting it as a failure
\`\`\`

## Classic Mistake

**Missing readiness probe during a rolling update**: Kubernetes removes old pods before new pods have actually warmed up, causing a brief window of 502 errors. A readiness probe prevents this — new pods only receive traffic after the probe passes.`,
      labSteps: [
        {
          id: 'p2-m5-s1',
          title: 'Deploy without probes',
          instruction: 'Deploy nginx without any probes and observe that it receives traffic the moment it reaches Running status.',
          command: 'kubectl run nginx-no-probe --image=nginx:1.27 && kubectl get endpoints',
          output: [
            'pod/nginx-no-probe created',
            'NAME         ENDPOINTS   AGE',
            'kubernetes   10.96.0.1   5d',
          ],
          explanation: 'Without a readiness probe, a Pod is considered ready as soon as its containers are Running. For nginx this is fine, but for a slow Java app this means traffic arrives before the app has initialised — causing errors.',
          clusterState: {
            pods: [
              { id: 'nginx-no-probe', name: 'nginx-no-probe', namespace: 'default', node: 'node-1', status: 'Running', labels: { run: 'nginx-no-probe' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Pod nginx-no-probe created — no probes configured'],
          },
        },
        {
          id: 'p2-m5-s2',
          title: 'Add a liveness probe',
          instruction: 'Apply a deployment with an httpGet liveness probe on the root path.',
          command: 'kubectl apply -f -',
          yamlContent: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-probes
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx-probes
  template:
    metadata:
      labels:
        app: nginx-probes
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10`,
          output: ['deployment.apps/nginx-probes created'],
          explanation: 'initialDelaySeconds: 5 gives nginx 5 seconds to start before the first probe. periodSeconds: 10 means kubelet checks every 10 seconds. The default failureThreshold is 3, so the container is restarted only after 3 consecutive failures (~30 seconds).',
          clusterState: {
            pods: [
              { id: 'nginx-probes-abc12', name: 'nginx-probes-abc12', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'nginx-probes' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'nginx-probes', name: 'nginx-probes', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'nginx:1.27' },
            ],
            namespaces: ['default'],
            events: ['Deployment nginx-probes created'],
            highlightedComponent: 'kubelet',
          },
        },
        {
          id: 'p2-m5-s3',
          title: 'Inspect probe configuration',
          instruction: 'Describe the pod to see the probe configuration in the output.',
          command: 'kubectl describe pod -l app=nginx-probes | grep -A10 "Liveness:"',
          output: [
            '    Liveness:   http-get http://:80/ delay=5s timeout=1s period=10s #success=1 #failure=3',
          ],
          explanation: 'kubectl describe shows the full probe config in a compact format: delay (initialDelaySeconds), timeout (how long to wait for a response), period (how often), success threshold, and failure threshold.',
          clusterState: {
            pods: [
              { id: 'nginx-probes-abc12', name: 'nginx-probes-abc12', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'nginx-probes' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'nginx-probes', name: 'nginx-probes', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'nginx:1.27' },
            ],
            namespaces: ['default'],
            events: [],
            highlightedComponent: 'kubelet',
          },
        },
        {
          id: 'p2-m5-s4',
          title: 'Simulate a liveness failure',
          instruction: 'Patch the liveness probe to hit a non-existent path, then watch restarts increment.',
          command: "kubectl patch deployment nginx-probes --type='json' -p='[{\"op\":\"replace\",\"path\":\"/spec/template/spec/containers/0/livenessProbe/httpGet/path\",\"value\":\"/nonexistent\"}]'",
          output: ['deployment.apps/nginx-probes patched'],
          explanation: 'After the patch rolls out, the liveness probe will GET /nonexistent. nginx returns 404, which is NOT in the 200–399 success range, so the probe fails. After 3 failures kubelet restarts the container — watch RESTARTS increment with "kubectl get pods -w".',
          clusterState: {
            pods: [
              { id: 'nginx-probes-def34', name: 'nginx-probes-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'nginx-probes' }, image: 'nginx:1.27', restarts: 3 },
            ],
            services: [],
            deployments: [
              { id: 'nginx-probes', name: 'nginx-probes', namespace: 'default', replicas: 1, availableReplicas: 0, image: 'nginx:1.27' },
            ],
            namespaces: ['default'],
            events: ['Liveness probe failed: HTTP probe failed with statuscode: 404', 'Container nginx restarted'],
            highlightedComponent: 'kubelet',
          },
          tip: 'Run "kubectl get pods -w" in a separate terminal to watch the RESTARTS column increase in real time.',
        },
        {
          id: 'p2-m5-s5',
          title: 'Add a readiness probe',
          instruction: 'Fix the liveness probe and add a readiness probe — the probe most production apps need.',
          command: 'kubectl apply -f -',
          yamlContent: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-probes
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginx-probes
  template:
    metadata:
      labels:
        app: nginx-probes
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5`,
          output: ['deployment.apps/nginx-probes configured'],
          explanation: 'The readiness probe fires every 5 seconds. If it fails, the pod is removed from the Service endpoint list — no traffic reaches it. Crucially, the pod is NOT restarted. This is the probe that protects rolling updates: new pods only receive traffic after the readiness probe passes.',
          clusterState: {
            pods: [
              { id: 'nginx-probes-ghi56', name: 'nginx-probes-ghi56', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'nginx-probes' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'nginx-probes', name: 'nginx-probes', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'nginx:1.27' },
            ],
            namespaces: ['default'],
            events: ['Deployment nginx-probes updated with readiness probe'],
            highlightedComponent: 'kubelet',
          },
        },
        {
          id: 'p2-m5-s6',
          title: 'Startup probe for slow apps',
          instruction: 'Review a startup probe configuration designed for a slow-starting Java application.',
          command: 'kubectl apply -f -',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: java-app
spec:
  containers:
  - name: java
    image: openjdk:21-jre
    command: ["java", "-jar", "/app/service.jar"]
    startupProbe:
      httpGet:
        path: /actuator/health
        port: 8080
      failureThreshold: 30
      periodSeconds: 10
    livenessProbe:
      httpGet:
        path: /actuator/health
        port: 8080
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /actuator/health/readiness
        port: 8080
      periodSeconds: 5`,
          output: ['pod/java-app created'],
          explanation: 'failureThreshold: 30 × periodSeconds: 10 = 300 seconds (5 minutes) for the startup probe to succeed before giving up. While the startup probe is active, liveness is disabled — so the JVM can take its time warming up without being killed. Once startup succeeds, liveness takes over with its own threshold.',
          clusterState: {
            pods: [
              { id: 'java-app', name: 'java-app', namespace: 'default', node: 'node-2', status: 'Pending', labels: {}, image: 'openjdk:21-jre', restarts: 0 },
              { id: 'nginx-probes-ghi56', name: 'nginx-probes-ghi56', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'nginx-probes' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'nginx-probes', name: 'nginx-probes', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'nginx:1.27' },
            ],
            namespaces: ['default'],
            events: ['Pod java-app created — startup probe active'],
            highlightedComponent: 'kubelet',
          },
        },
      ],
      quiz: [
        {
          id: 'p2-m5-q1',
          question: 'A pod\'s liveness probe fails 3 times in a row. What does Kubernetes do?',
          options: [
            'Marks the pod as NotReady and removes it from Service endpoints',
            'Restarts the container inside the pod',
            'Deletes the pod and creates a new one',
            'Evicts the pod from the node',
          ],
          answer: 1,
          explanation: 'Liveness probe failure causes kubelet to restart the container (not delete and recreate the pod). The pod stays on the same node; only the container process is killed and restarted. You\'ll see RESTARTS increment in kubectl get pods.',
        },
        {
          id: 'p2-m5-q2',
          question: 'A pod\'s readiness probe fails. What does Kubernetes do?',
          options: [
            'Restarts the container',
            'Deletes the pod',
            'Removes the pod from the Service endpoint list so no new traffic is sent to it',
            'Drains all in-flight requests and then shuts down the container',
          ],
          answer: 2,
          explanation: 'A failing readiness probe removes the pod from the Service\'s endpoint slice — existing connections may complete but no new requests are routed to the pod. The container is NOT restarted. When the probe passes again, the pod is re-added to the endpoints.',
        },
        {
          id: 'p2-m5-q3',
          question: 'Your app takes 3 minutes to start. Which probe prevents liveness from killing it prematurely?',
          options: [
            'Readiness probe with a long initialDelaySeconds',
            'Liveness probe with failureThreshold: 180',
            'Startup probe',
            'A post-start lifecycle hook',
          ],
          answer: 2,
          explanation: 'The startup probe was designed exactly for this scenario. While the startup probe is pending (not yet succeeded), liveness and readiness probes are disabled. Set failureThreshold × periodSeconds to at least your max startup time. Once it succeeds, liveness takes over.',
        },
        {
          id: 'p2-m5-q4',
          question: 'Which probe mechanism would you use to check if a database TCP port is accepting connections?',
          options: ['httpGet', 'exec', 'tcpSocket', 'gRPC'],
          answer: 2,
          explanation: 'tcpSocket probes attempt a TCP connection to the specified port. If the connection is accepted, the probe succeeds. This is ideal for non-HTTP services like databases, message brokers, or any TCP service.',
        },
        {
          id: 'p2-m5-q5',
          question: 'During a rolling update, which probe ensures old pods aren\'t removed until new pods are truly ready?',
          options: [
            'Liveness probe on the old pods',
            'Startup probe on the new pods',
            'Readiness probe on the new pods',
            'Liveness probe on the new pods',
          ],
          answer: 2,
          explanation: 'During a rolling update, Kubernetes waits for new pods to become Ready (readiness probe passing) before removing old pods. Without a readiness probe, new pods are considered ready the moment they reach Running state — potentially before the app has finished initialising.',
        },
      ],
      coverage: {
        concepts: ['liveness probe: restart unhealthy container', 'readiness probe: remove from service endpoints', 'startup probe: disable liveness during slow init', 'probe types: httpGet/tcpSocket/exec/gRPC', 'initialDelaySeconds, periodSeconds, failureThreshold, successThreshold', 'timeoutSeconds'],
        commands: ['kubectl describe pod (Liveness/Readiness in containers section)', 'kubectl get events (probe failure events)', 'kubectl get pod -w (watch Ready column change)'],
        architecture: ['kubelet executes probes directly on the node', 'readiness failure removes pod from Endpoints object', 'liveness failure triggers container restart (not pod delete)', 'startup probe disables liveness until first success'],
        techniques: ['httpGet probe for HTTP APIs', 'tcpSocket probe for non-HTTP services', 'exec probe for custom health check logic', 'tuning failureThreshold for slow-start apps', 'startup probe to protect slow initializers from liveness kills'],
        procedures: ['add liveness probe to a deployment', 'add readiness probe to a deployment', 'observe probe failure events', 'tune probe timing parameters'],
        toolsAndPlugins: ['kubectl', 'minikube'],
        cases: ['missing readiness probe → pod added to endpoints before app is ready (traffic errors on deploy)', 'liveness probe too aggressive → CrashLoopBackOff on slow app', 'startup probe missing → liveness kills slow-starting app before it finishes init'],
        scenarios: ['rolling update with readiness probe ensuring zero downtime', 'diagnose pod repeatedly restarting due to misconfigured liveness probe'],
      },
      exercises: [
        {
          id: 'p2-m5-e1',
          title: 'Add liveness and readiness probes to a deployment',
          kind: 'guided',
          goal: 'Deploy nginx with both probes configured and observe pod readiness gating.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: probed-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: probed-web
  template:
    metadata:
      labels:
        app: probed-web
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 3
          periodSeconds: 5
          failureThreshold: 2
EOF`,
            'kubectl get pods -l app=probed-web -w',
            'kubectl describe pod -l app=probed-web | grep -A10 Liveness',
          ],
          verify: ['Pods reach Running and Ready 1/1 status', 'describe shows Liveness and Readiness probe config'],
          expectedOutcome: 'Both probes configured and pods enter Ready state correctly.',
          cleanup: ['kubectl delete deployment probed-web'],
        },
        {
          id: 'p2-m5-e2',
          title: 'Force a liveness probe failure and observe restart',
          kind: 'challenge',
          goal: 'Trigger a liveness probe failure by deleting the served content and watch the container restart.',
          commands: [
            'kubectl create deployment liveness-test --image=nginx:1.27',
            `kubectl patch deployment liveness-test --patch '{"spec":{"template":{"spec":{"containers":[{"name":"nginx","livenessProbe":{"httpGet":{"path":"/","port":80},"initialDelaySeconds":5,"periodSeconds":5,"failureThreshold":2}}]}}}}'`,
            'kubectl exec -it $(kubectl get pod -l app=liveness-test -o jsonpath=\'{.items[0].metadata.name}\') -- rm /usr/share/nginx/html/index.html',
            'kubectl get pod -l app=liveness-test -w',
            'kubectl describe pod -l app=liveness-test | grep Restart',
          ],
          verify: ['Pod restarts after liveness probe fails (RESTARTS counter increments)', 'Events show Liveness probe failed'],
          expectedOutcome: 'Liveness probe failure triggers container restart as expected.',
          cleanup: ['kubectl delete deployment liveness-test'],
        },
        {
          id: 'p2-m5-e3',
          title: 'Diagnose CrashLoopBackOff from aggressive liveness probe',
          kind: 'debug',
          goal: 'Observe what happens when a liveness probe is too aggressive for a slow-starting app.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: aggressive-probe
spec:
  containers:
  - name: slow-app
    image: busybox:1.36
    command: ["sh", "-c", "sleep 30 && echo ready && sleep 3600"]
    livenessProbe:
      exec:
        command: ["cat", "/tmp/healthy"]
      initialDelaySeconds: 2
      periodSeconds: 3
      failureThreshold: 2
EOF`,
            'kubectl get pod aggressive-probe -w',
            'kubectl describe pod aggressive-probe',
            'kubectl get events --field-selector involvedObject.name=aggressive-probe',
          ],
          verify: ['Pod enters CrashLoopBackOff', 'Events show "Liveness probe failed" before app was ready'],
          expectedOutcome: 'Understand why startup probe or higher initialDelaySeconds is needed for slow apps.',
          cleanup: ['kubectl delete pod aggressive-probe --ignore-not-found'],
        },
        {
          id: 'p2-m5-e4',
          title: '7-day spaced review — probe types and parameters',
          kind: 'spaced-review',
          goal: 'Recall the 3 probe types and 5 key timing parameters from memory.',
          commands: [
            'kubectl explain pod.spec.containers.livenessProbe',
            'kubectl explain pod.spec.containers.readinessProbe',
            'kubectl explain pod.spec.containers.startupProbe',
          ],
          verify: ['explain output shows httpGet, tcpSocket, exec fields', 'initialDelaySeconds, periodSeconds, failureThreshold visible'],
          expectedOutcome: 'Probe types and timing parameters recalled accurately.',
          cleanup: [],
        },
      ],
    },

    // ─── Module 6: Resource Requests & Limits ───────────────────────────────
    {
      id: 'p2-m6',
      slug: 'resources',
      title: 'Resource Requests & Limits',
      description: 'Reserve capacity for your pods and cap their resource consumption to prevent noisy-neighbor problems.',
      duration: '60 min',
      difficulty: 'intermediate',
      theory: `> 🧠 **Brain Warm-Up**: How does the Linux kernel enforce CPU limits differently from memory limits under the hood, and what happens to a container's QoS class and eviction priority when they are set?

## Requests vs Limits: Linux Kernel Implementation

Kubernetes manages container resources using the Linux kernel's **Control Groups (cgroups)** mechanism. When a container runtime spins up a container, it translates resource fields into cgroups configurations on the host. Modern systems run **cgroups v2**, which simplifies directory structures and controller coordination compared to cgroups v1.

### Visualizing CPU Throttling vs Memory OOMKills

\`\`\`text
       +---------------------------------------------+
       |             CONTAINER RUNTIME               |
       |     (Applies limits to cgroups v2)          |
       +---------------------------------------------+
              |                               |
    (CPU: Compressible)             (Memory: Incompressible)
              |                               |
              v                               v
    +-------------------+           +-------------------+
    | cpu.max (cgroup)  |           | memory.max (cg)   |
    | (CFS Bandwidth)   |           |                   |
    +-------------------+           +-------------------+
              |                               |
   Container uses > limit          Container uses > limit
              |                               |
              v                               v
    +-------------------+           +-------------------+
    |  Proactive        |           |  Reactive         |
    |  Throttling       |           |  OOM Killer       |
    |                   |           |  (SIGKILL sent)   |
    +-------------------+           +-------------------+
 (Slows down, continues)             (Process terminated)
\`\`\`

### CPU (Compressible Resource)
- **Requests**: Map to \`cpu.weight\` (in cgroups v2) or \`cpu.shares\` (in cgroups v1). This is a relative weight that determines how much CPU time a container gets **under contention**. If a node's CPU is idle, a container can consume 100% of the CPU regardless of its request. If multiple containers compete, the kernel allocates CPU cycles proportionally based on their weight.
- **Limits**: Map to \`cpu.max\` (cgroups v2) or \`cpu.cfs_quota_us\` and \`cpu.cfs_period_us\` (cgroups v1). This is enforced via the Completely Fair Scheduler (CFS) bandwidth controller. If a limit is set to \`200m\` (0.2 cores) with a default period of 100,000 microseconds (100ms), the container is allocated a quota of 20,000 microseconds of CPU time per period. If it exhausts this quota in the first 20ms, it is **throttled** (suspended) for the remaining 80ms. It is not killed.

### Memory (Incompressible Resource)
- **Requests**: Used primarily by the \`kube-scheduler\` to find a node with sufficient allocatable memory capacity. Kubelet also uses it to calculate QoS class eviction priority. It does not enforce a hard limit on startup.
- **Limits**: Map to \`memory.max\` (cgroups v2) or \`memory.limit_in_bytes\` (cgroups v1). Unlike CPU, memory cannot be throttled. If a container's processes attempt to allocate memory beyond this limit, the kernel triggers the **Out-Of-Memory (OOM) Killer**. The OOM killer selects and terminates the process within the container using \`SIGKILL\`, resulting in an exit code \`137\` and an \`OOMKilled\` status.

## Quality of Service (QoS) Classes and Eviction

Kubernetes groups Pods into three QoS classes based on their resource settings, which determine their eviction priority when the node is under resource pressure:

1. **Guaranteed**: Every container in the Pod has both CPU and memory requests and limits set, and the request value exactly equals the limit value.
2. **Burstable**: The Pod does not meet the Guaranteed criteria, but at least one container has a CPU or memory request or limit set.
3. **BestEffort**: No containers have any requests or limits defined.

### Eviction and OOM Score Adjustment

When a node experiences memory pressure, the **kubelet eviction manager** monitors memory metrics. If the node falls below the hard eviction threshold (e.g., \`memory.available < 100Mi\`), it evicts pods in the following order: \`BestEffort\` -> \`Burstable\` -> \`Guaranteed\`.

At the OS kernel level, when the system runs out of physical memory, the kernel OOM killer uses the process's \`oom_score\` to decide what to kill. The kubelet configures the kernel's \`oom_score_adj\` for each container process based on its QoS class:
- **Guaranteed**: Gets an \`oom_score_adj\` of \`-997\`. This makes these processes highly resistant to being killed by host OOM events.
- **BestEffort**: Gets an \`oom_score_adj\` of \`1000\`. These processes are targeted first.
- **Burstable**: Gets an \`oom_score_adj\` calculated dynamically:
  oom_score_adj = 1000 - (10 * memoryRequest / nodeCapacity)
  This ensures that Burstable pods that request a larger percentage of the node's memory have a lower \`oom_score_adj\` and are safer than those that request less but consume more.

## LimitRange and ResourceQuota

**LimitRange** — sets default requests/limits and min/max bounds for a namespace. Pods without resource declarations get the LimitRange defaults applied automatically.

**ResourceQuota** — caps the total resources (CPU, memory, pod count) that an entire namespace can consume. Used to prevent one team from monopolising cluster resources.

## Common Mistakes

- **No limits** → noisy neighbor problem: one misbehaving pod can consume all node memory and trigger mass evictions
- **No requests** → scheduler is blind; it may over-schedule pods onto a node that appears to have capacity but actually doesn\'t
- **Limits too low** → app is constantly throttled or OOMKilled; always benchmark before setting limits`,
      labSteps: [
        {
          id: 'p2-m6-s1',
          title: 'Deploy without resource settings',
          instruction: 'Create a pod without any resource declarations and observe it has no reservation on the node.',
          command: 'kubectl run no-resources --image=nginx:1.27 && kubectl describe node node-1 | grep -A5 "Allocated resources"',
          output: [
            'pod/no-resources created',
            'Allocated resources:',
            '  (Total limits may be over 100 percent, i.e., overcommitted.)',
            '  Resource           Requests   Limits',
            '  --------           --------   ------',
            '  cpu                250m (12%)  500m (25%)',
            '  memory             256Mi (6%)  512Mi (12%)',
          ],
          explanation: 'The no-resources pod contributes 0 to Requests and Limits. The scheduler has no idea how much CPU or memory this pod will actually use — it might use very little, or it might consume everything on the node. This is the BestEffort QoS class.',
          clusterState: {
            pods: [
              { id: 'no-resources', name: 'no-resources', namespace: 'default', node: 'node-1', status: 'Running', labels: { run: 'no-resources' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Pod no-resources created — BestEffort QoS'],
          },
        },
        {
          id: 'p2-m6-s2',
          title: 'Add resource requests and limits',
          instruction: 'Apply a pod spec with CPU and memory requests and limits.',
          command: 'kubectl apply -f -',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: with-resources
spec:
  containers:
  - name: nginx
    image: nginx:1.27
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 200m
        memory: 256Mi`,
          output: ['pod/with-resources created'],
          explanation: 'This pod requests 100m CPU and 128Mi memory (what the scheduler reserves). Its limits are 200m CPU and 256Mi memory (the maximum it can use). Since requests < limits, this pod gets QoS class Burstable.',
          clusterState: {
            pods: [
              { id: 'no-resources', name: 'no-resources', namespace: 'default', node: 'node-1', status: 'Running', labels: { run: 'no-resources' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'with-resources', name: 'with-resources', namespace: 'default', node: 'node-2', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Pod with-resources created — Burstable QoS'],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p2-m6-s3',
          title: 'Check QoS class',
          instruction: 'Describe the pod to see its assigned QoS class.',
          command: "kubectl describe pod with-resources | grep 'QoS Class'",
          output: ['QoS Class:                   Burstable'],
          explanation: 'Burstable means requests < limits. The pod is guaranteed its requests but can burst up to its limits when the node has spare capacity. Under memory pressure, Burstable pods are evicted after BestEffort but before Guaranteed.',
          clusterState: {
            pods: [
              { id: 'with-resources', name: 'with-resources', namespace: 'default', node: 'node-2', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
            highlightedComponent: 'kubelet',
          },
        },
        {
          id: 'p2-m6-s4',
          title: 'Guaranteed QoS',
          instruction: 'Review the YAML pattern for Guaranteed QoS — requests must equal limits for all containers.',
          command: 'kubectl apply -f -',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: guaranteed-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.27
    resources:
      requests:
        cpu: 200m
        memory: 256Mi
      limits:
        cpu: 200m
        memory: 256Mi`,
          output: ['pod/guaranteed-pod created'],
          explanation: 'When requests == limits for every container, Kubernetes assigns QoS class Guaranteed. This pod is the last to be evicted under memory pressure. The trade-off: you can\'t burst above your request, so over-provisioning wastes cluster resources.',
          clusterState: {
            pods: [
              { id: 'no-resources', name: 'no-resources', namespace: 'default', node: 'node-1', status: 'Running', labels: { run: 'no-resources' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'with-resources', name: 'with-resources', namespace: 'default', node: 'node-2', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
              { id: 'guaranteed-pod', name: 'guaranteed-pod', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Pod guaranteed-pod created — Guaranteed QoS'],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p2-m6-s5',
          title: 'See requests reflected on the node',
          instruction: 'Describe the node again to see how the pods\' requests are reflected in Allocated resources.',
          command: 'kubectl describe node node-1 | grep -A8 "Allocated resources"',
          output: [
            'Allocated resources:',
            '  (Total limits may be over 100 percent, i.e., overcommitted.)',
            '  Resource           Requests    Limits',
            '  --------           --------    ------',
            '  cpu                300m (15%)  400m (20%)',
            '  memory             384Mi (9%)  512Mi (12%)',
          ],
          explanation: 'The guaranteed-pod contributes 200m CPU and 256Mi memory to node-1\'s Requests column. The scheduler uses these numbers to decide whether new pods can fit on this node. A node is "full" for scheduling purposes when its Requests reach its allocatable capacity — even if actual usage is low.',
          clusterState: {
            pods: [
              { id: 'no-resources', name: 'no-resources', namespace: 'default', node: 'node-1', status: 'Running', labels: { run: 'no-resources' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'guaranteed-pod', name: 'guaranteed-pod', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
            highlightedComponent: 'scheduler',
          },
        },
      ],
      quiz: [
        {
          id: 'p2-m6-q1',
          question: 'A container exceeds its memory limit. What happens?',
          options: [
            'The container is throttled (slowed down)',
            'The container is OOMKilled (killed immediately)',
            'The pod is evicted from the node',
            'The memory limit is automatically increased',
          ],
          answer: 1,
          explanation: 'Exceeding the memory limit triggers an Out-Of-Memory kill (OOMKilled). The container is killed immediately by the kernel. You\'ll see "OOMKilled" in kubectl describe pod under Last State. If the pod has a restart policy (the default), kubelet will restart it.',
        },
        {
          id: 'p2-m6-q2',
          question: 'A container exceeds its CPU limit. What happens?',
          options: [
            'The container is OOMKilled',
            'The container is evicted',
            'The container\'s CPU is throttled — it runs slower but is not killed',
            'The pod is rescheduled to a node with more CPU',
          ],
          answer: 2,
          explanation: 'CPU is a compressible resource. Exceeding the CPU limit results in throttling: the kernel\'s CFS scheduler restricts the container\'s CPU time. The container continues running but processes more slowly. Unlike memory, exceeding CPU limits never kills the container.',
        },
        {
          id: 'p2-m6-q3',
          question: 'What QoS class gets evicted FIRST when a node is under memory pressure?',
          options: ['Guaranteed', 'Burstable', 'BestEffort', 'All classes are evicted simultaneously'],
          answer: 2,
          explanation: 'BestEffort pods (no requests or limits) are evicted first because they have made no resource reservation and could be consuming any amount of memory. Burstable pods are evicted next, followed by Guaranteed last.',
        },
        {
          id: 'p2-m6-q4',
          question: 'The scheduler uses ______ to decide which node a Pod can fit on.',
          options: [
            'Limits — the maximum the pod will ever use',
            'Requests — the guaranteed minimum the pod needs',
            'Actual current usage — from metrics-server',
            'The average of requests and limits',
          ],
          answer: 1,
          explanation: 'The scheduler uses Requests, not Limits. It sums up the requests of all pods on each node and compares to the node\'s allocatable capacity. This is why setting requests accurately is critical: too low and pods get scheduled onto already-crowded nodes; too high and pods can\'t be scheduled at all.',
        },
      ],
      coverage: {
        concepts: ['CPU requests and limits (millicores)', 'memory requests and limits (Mi/Gi)', 'QoS classes: Guaranteed/Burstable/BestEffort', 'OOMKilled when memory limit exceeded', 'CPU throttling when limit exceeded (not killed)', 'LimitRange defaults', 'ResourceQuota per namespace'],
        commands: ['kubectl top nodes', 'kubectl top pods', 'kubectl describe node (Allocatable section)', 'kubectl describe pod (Resources section)', 'kubectl get limitrange', 'kubectl get resourcequota'],
        architecture: ['scheduler uses requests for bin-packing decisions', 'kubelet enforces limits via Linux cgroups', 'CPU limit enforced by CFS bandwidth (throttle)', 'memory limit enforced by OOM killer (kill)'],
        techniques: ['setting requests equal to expected usage', 'setting limits at 2-3x requests for burst headroom', 'using kubectl top to measure actual usage', 'VPA (Vertical Pod Autoscaler) for auto-sizing'],
        procedures: ['add resource requests and limits to a container', 'check node allocatable capacity', 'observe OOMKilled event', 'create LimitRange for namespace defaults'],
        toolsAndPlugins: ['kubectl', 'minikube', 'metrics-server (minikube addon)'],
        cases: ['pod OOMKilled repeatedly — memory limit too low', 'pod Pending — requests exceed all node capacity', 'CPU throttling causing latency spikes under load'],
        scenarios: ['right-size a workload using kubectl top data', 'prevent noisy neighbor from starving other pods with limits'],
      },
      exercises: [
        {
          id: 'p2-m6-e1',
          title: 'Set resource requests and limits, check node allocatable',
          kind: 'guided',
          goal: 'Deploy a pod with explicit requests and limits and verify them in describe output.',
          commands: [
            'minikube addons enable metrics-server',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: resource-pod
spec:
  containers:
  - name: app
    image: nginx:1.27
    resources:
      requests:
        cpu: "100m"
        memory: "64Mi"
      limits:
        cpu: "250m"
        memory: "128Mi"
EOF`,
            'kubectl describe pod resource-pod | grep -A8 Requests',
            'kubectl describe node minikube | grep -A10 Allocatable',
            'kubectl top node',
            'kubectl top pod resource-pod',
          ],
          verify: ['describe pod shows requests cpu:100m memory:64Mi and limits cpu:250m memory:128Mi', 'kubectl top pod shows actual usage', 'Node allocatable shows remaining capacity'],
          expectedOutcome: 'Resource requests/limits confirmed in pod spec; actual usage measured.',
          cleanup: ['kubectl delete pod resource-pod --ignore-not-found'],
        },
        {
          id: 'p2-m6-e2',
          title: 'Trigger and diagnose OOMKilled',
          kind: 'challenge',
          goal: 'Set a very low memory limit and verify the container gets OOMKilled when it exceeds it.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: oom-pod
spec:
  containers:
  - name: mem-hog
    image: busybox:1.36
    command: ["sh", "-c", "dd if=/dev/zero bs=1M count=50 | cat > /dev/null"]
    resources:
      limits:
        memory: "10Mi"
EOF`,
            'kubectl get pod oom-pod -w',
            'kubectl describe pod oom-pod',
          ],
          verify: ['Pod shows OOMKilled in Last State or reason field', 'describe shows memory limit of 10Mi in resources'],
          expectedOutcome: 'OOMKilled triggered and diagnosed via kubectl describe.',
          cleanup: ['kubectl delete pod oom-pod --ignore-not-found'],
        },
        {
          id: 'p2-m6-e3',
          title: 'Diagnose Pending pod due to excessive requests',
          kind: 'debug',
          goal: 'Create a pod with requests that exceed node capacity and diagnose the scheduling failure.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: oversized-pod
spec:
  containers:
  - name: app
    image: nginx:1.27
    resources:
      requests:
        cpu: "9999m"
        memory: "99Gi"
EOF`,
            'kubectl get pod oversized-pod',
            'kubectl describe pod oversized-pod',
            'kubectl get events --field-selector involvedObject.name=oversized-pod',
          ],
          verify: ['Pod stays in Pending status', 'Events show Insufficient cpu or Insufficient memory', 'describe shows FailedScheduling in events'],
          expectedOutcome: 'Unschedulable pod diagnosed: requests exceed all available node capacity.',
          cleanup: ['kubectl delete pod oversized-pod --ignore-not-found'],
        },
        {
          id: 'p2-m6-e4',
          title: '7-day spaced review — resource commands',
          kind: 'spaced-review',
          goal: 'Recall QoS classes and resource inspection commands from memory.',
          commands: [
            'kubectl top nodes',
            'kubectl top pods -A',
            'kubectl describe node minikube | grep -A5 Allocatable',
            'kubectl explain pod.spec.containers.resources',
          ],
          verify: ['kubectl top returns usage data (metrics-server must be enabled)', 'explain shows requests and limits fields'],
          expectedOutcome: 'Resource commands recalled; QoS class definitions recalled without notes.',
          cleanup: [],
        },
      ],
    },
  ],
}

export default phase2
