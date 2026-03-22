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
      theory: `## What Are Namespaces?

A **namespace** is a virtual cluster inside a Kubernetes cluster. Think of it as a folder — you can have multiple folders on the same disk, each with their own files and their own access permissions.

Every Kubernetes resource lives in exactly one namespace (cluster-scoped resources like Nodes are the exception). Two teams can both have a Deployment named \`api\` as long as they are in different namespaces.

## Default Namespaces

Kubernetes creates four namespaces on every fresh cluster:

| Namespace | Purpose |
|---|---|
| \`default\` | Where resources go if you don't specify \`-n\` |
| \`kube-system\` | Kubernetes infrastructure components (apiserver, etcd, coredns…) |
| \`kube-public\` | Publicly readable by all — rarely used in practice |
| \`kube-node-lease\` | Stores node heartbeat Lease objects — don't touch these |

## Why Use Namespaces?

**1. Team / Environment Isolation**
Separate \`dev\`, \`staging\`, and \`production\` workloads so a developer can't accidentally affect prod.

**2. ResourceQuota scoping**
Attach a \`ResourceQuota\` to a namespace to cap how much CPU/memory a team can consume.

**3. RBAC scope**
Grant a developer full access to the \`dev\` namespace while giving them read-only access to \`production\`.

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
    },

    // ─── Module 2: Labels & Selectors ───────────────────────────────────────
    {
      id: 'p2-m2',
      slug: 'labels-selectors',
      title: 'Labels & Selectors',
      description: 'Tag resources with key-value metadata and use selectors to wire Services, Deployments, and queries together.',
      duration: '45 min',
      difficulty: 'beginner',
      theory: `## What Are Labels?

**Labels** are key-value pairs attached to any Kubernetes resource. They are the primary mechanism for organising and selecting resources.

\`\`\`yaml
metadata:
  labels:
    app: web
    tier: frontend
    env: production
    version: v2
\`\`\`

Labels are arbitrary — you choose the keys and values. However, the Kubernetes community has settled on a set of recommended keys:

| Key | Example values |
|---|---|
| \`app\` | web, api, worker |
| \`tier\` | frontend, backend, cache |
| \`env\` | dev, staging, production |
| \`version\` | v1, v2, 1.4.2 |

## How Selectors Work

**Selectors** are how Kubernetes objects find each other. When you create a Service:

\`\`\`yaml
spec:
  selector:
    app: web
\`\`\`

The Service routes traffic to **every Pod** that has the label \`app: web\`. Add more Pods with that label and they automatically join the Service — no update needed.

Deployments use selectors the same way: the ReplicaSet controller finds "its" Pods by matching labels.

## Querying With kubectl

\`\`\`bash
# Equality-based
kubectl get pods -l app=web
kubectl get pods -l app=web,tier=frontend

# Set-based (comma = AND)
kubectl get pods -l 'tier in (frontend,backend)'
kubectl get pods -l 'env notin (staging)'
\`\`\`

## Labels vs Annotations

| | Labels | Annotations |
|---|---|---|
| Can be used in selectors? | Yes | No |
| Use for | Identifying and grouping | Non-identifying metadata |
| Examples | \`app: web\`, \`env: prod\` | \`git-commit: abc123\`, \`owner: team-a\` |

**Rule of thumb**: if you need to query or select by it, use a label. If it is just descriptive metadata, use an annotation.`,
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
    },

    // ─── Module 3: ConfigMaps ────────────────────────────────────────────────
    {
      id: 'p2-m3',
      slug: 'configmaps',
      title: 'ConfigMaps',
      description: 'Externalise non-sensitive configuration from container images using ConfigMaps.',
      duration: '60 min',
      difficulty: 'beginner',
      theory: `## The 12-Factor App Principle

The **12-factor app** methodology (12factor.net) states: *store config in the environment, not in the code*. Hardcoding \`APP_ENV=production\` inside a container image means you need a different image for every environment. That breaks portability.

**ConfigMaps** solve this by storing key-value configuration data as a Kubernetes object, separate from your container image.

## What ConfigMaps Store

- Environment variable values (\`LOG_LEVEL=debug\`)
- Full configuration files (\`nginx.conf\`, \`application.properties\`)
- Command-line arguments

ConfigMaps are for **non-sensitive** data. Never put passwords or tokens in a ConfigMap — use a Secret instead.

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
    },

    // ─── Module 4: Secrets ───────────────────────────────────────────────────
    {
      id: 'p2-m4',
      slug: 'secrets',
      title: 'Secrets',
      description: 'Store and consume sensitive data like passwords, tokens, and TLS certificates safely.',
      duration: '60 min',
      difficulty: 'intermediate',
      theory: `## What Are Secrets?

**Secrets** are Kubernetes objects designed to hold sensitive data: passwords, OAuth tokens, SSH keys, and TLS certificates. They work like ConfigMaps but with a few important differences.

## Base64 Encoding vs Encryption

Secrets store values as **base64-encoded** strings. This is **NOT encryption** — it is just an encoding to safely handle binary data in YAML. Anyone with access to etcd or sufficient RBAC permissions can decode a Secret trivially.

\`\`\`bash
echo "s3cr3t" | base64          # encode: czNjcjN0Cg==
echo "czNjcjN0Cg==" | base64 -d # decode: s3cr3t
\`\`\`

For actual encryption at rest, you need **EncryptionConfiguration** on the kube-apiserver — this is NOT enabled by default in most clusters.

## Secret Types

| Type | Use case |
|---|---|
| \`Opaque\` | Generic key-value secrets (passwords, tokens) |
| \`kubernetes.io/tls\` | TLS certificate + private key pair |
| \`kubernetes.io/dockerconfigjson\` | Registry pull credentials |
| \`kubernetes.io/service-account-token\` | Service account JWTs (auto-managed) |

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
    },

    // ─── Module 5: Health Probes ─────────────────────────────────────────────
    {
      id: 'p2-m5',
      slug: 'probes',
      title: 'Health Probes',
      description: 'Tell Kubernetes when your app is alive, ready to serve traffic, and finished starting up.',
      duration: '75 min',
      difficulty: 'intermediate',
      theory: `## Why Probes Matter

Without probes, Kubernetes only knows if a container\'s **process is running** — not whether the application inside is actually healthy or ready to serve requests. Probes bridge this gap.

## The Three Probe Types

### Liveness Probe
**Question: "Is this container still alive?"**

If the liveness probe fails \`failureThreshold\` times in a row, kubelet **restarts** the container. Use this to recover from deadlocks or infinite loops where the process is running but stuck.

### Readiness Probe
**Question: "Is this container ready to receive traffic?"**

If the readiness probe fails, the Pod is **removed from the Service\'s endpoint list** — no traffic is sent to it. The container is NOT restarted. Use this to prevent traffic going to pods that are still warming up, loading caches, or temporarily overloaded.

### Startup Probe
**Question: "Has the app finished starting up?"**

While the startup probe is running (and has not yet succeeded), **liveness and readiness probes are disabled**. Use this for slow-starting apps (JVM, large Python apps) to give them time to initialise without being killed by a liveness probe.

## Probe Mechanisms

| Mechanism | How it works |
|---|---|
| \`httpGet\` | HTTP GET request; success = 200–399 |
| \`tcpSocket\` | TCP connection attempt; success = connection accepted |
| \`exec\` | Runs a command inside the container; success = exit code 0 |

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
    },

    // ─── Module 6: Resource Requests & Limits ───────────────────────────────
    {
      id: 'p2-m6',
      slug: 'resources',
      title: 'Resource Requests & Limits',
      description: 'Reserve capacity for your pods and cap their resource consumption to prevent noisy-neighbor problems.',
      duration: '60 min',
      difficulty: 'intermediate',
      theory: `## Requests vs Limits

Every container can (and should) declare two resource settings:

**Requests** — the minimum resources the container needs.
- Used by the **scheduler** to find a node with enough available capacity
- The pod is **guaranteed** this much; it will never be given less
- \`cpu: 100m\` = 100 millicores (1/10 of a CPU core)
- \`memory: 128Mi\` = 128 mebibytes

**Limits** — the maximum resources the container can use.
- Exceeding CPU limit → container is **throttled** (slowed down, not killed)
- Exceeding memory limit → container is **OOMKilled** (killed immediately)

\`\`\`yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 200m
    memory: 256Mi
\`\`\`

## QoS Classes

Kubernetes assigns a Quality of Service class to each pod based on its resource configuration:

| QoS Class | Condition | Eviction priority |
|---|---|---|
| \`Guaranteed\` | requests == limits for ALL containers | Last to be evicted |
| \`Burstable\` | requests < limits (or only requests set) | Middle |
| \`BestEffort\` | No requests or limits set | First to be evicted |

When a node runs out of memory, Kubernetes evicts BestEffort pods first, then Burstable, and only evicts Guaranteed as a last resort.

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
    },
  ],
}

export default phase2
