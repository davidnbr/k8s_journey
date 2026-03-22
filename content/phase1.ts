import type { Phase, ClusterState } from '@/lib/types'

const emptyCluster: ClusterState = {
  pods: [], services: [], deployments: [], namespaces: ['default'], events: [],
}

const phase1: Phase = {
  id: 'phase-1',
  slug: 'phase-1',
  title: 'Core Primitives',
  shortTitle: 'Primitives',
  description: 'Master the essential building blocks: Pods, Deployments, and Services. These three resources are the foundation of everything in Kubernetes.',
  weeks: 'Weeks 1–3',
  hours: '~20 hours',
  color: 'text-blue-400',
  bgColor: 'bg-blue-500/10 border-blue-500/30',
  modules: [
    {
      id: 'p1-m1',
      slug: 'pods',
      title: 'Pods — The Atomic Unit',
      description: 'The smallest deployable unit in Kubernetes.',
      duration: '60 min',
      difficulty: 'beginner',
      theory: `## What is a Pod?

A **Pod** is the smallest deployable unit in Kubernetes. It wraps one or more containers that share the same network namespace and storage.

Key facts:
- Every Pod gets **one IP address** — all containers inside share it
- Containers in the same Pod communicate via **localhost**
- Pods are **ephemeral** — when they die, their filesystem is gone
- In practice, you almost never create bare Pods — use Deployments instead

## Pod vs Container

| | Docker Container | Kubernetes Pod |
|---|---|---|
| Network | Its own IP | Shared with all co-located containers |
| Lifecycle | Individual | All containers start/stop together |
| Management | Manual | Orchestrated by Kubernetes |

## Pod Lifecycle

\`\`\`
Pending → Running → Succeeded
                ↓
             Failed → (restart policy)
\`\`\`

- **Pending** — scheduled but waiting for image pull or resources
- **Running** — at least one container is running
- **Succeeded** — all containers exited with code 0
- **Failed** — at least one container exited non-zero`,
      labSteps: [
        {
          id: 'p1-m1-s1',
          title: 'Write a Pod manifest',
          instruction: 'Create a file called pod.yaml with this content. Every Kubernetes resource has apiVersion, kind, metadata, and spec.',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.27
    ports:
    - containerPort: 80`,
          output: [],
          explanation: 'apiVersion tells the API which schema to use. kind is the resource type. metadata.name is unique within the namespace. spec.containers defines what to run.',
          clusterState: { ...emptyCluster },
          tip: 'Labels (app: nginx) are key-value tags. They\'re how Services find Pods later.',
        },
        {
          id: 'p1-m1-s2',
          title: 'Create the Pod',
          instruction: 'Apply the manifest to create the Pod in the cluster.',
          command: 'kubectl apply -f pod.yaml',
          output: ['pod/nginx created'],
          explanation: 'kubectl sends the manifest to kube-apiserver, which validates it, stores it in etcd, and the scheduler assigns it to node-1.',
          clusterState: {
            pods: [{ id: 'nginx', name: 'nginx', namespace: 'default', node: 'node-1', status: 'Pending', labels: { app: 'nginx' }, image: 'nginx:1.27', restarts: 0 }],
            services: [], deployments: [], namespaces: ['default'], events: ['nginx scheduled → node-1', 'Pulling image nginx:1.27'],
          },
        },
        {
          id: 'p1-m1-s3',
          title: 'Watch it become Running',
          instruction: 'Check pod status. It starts Pending (image pulling) then becomes Running.',
          command: 'kubectl get pods',
          output: [
            'NAME    READY   STATUS    RESTARTS   AGE',
            'nginx   1/1     Running   0          12s',
          ],
          explanation: 'READY 1/1 means 1 out of 1 containers is ready. The Pod is healthy and running nginx.',
          clusterState: {
            pods: [{ id: 'nginx', name: 'nginx', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'nginx' }, image: 'nginx:1.27', restarts: 0 }],
            services: [], deployments: [], namespaces: ['default'], events: [],
          },
        },
        {
          id: 'p1-m1-s4',
          title: 'Inspect the Pod',
          instruction: 'Use describe to see full details including Events — the most useful debugging command.',
          command: 'kubectl describe pod nginx',
          output: [
            'Name:             nginx',
            'Namespace:        default',
            'Node:             node-1/10.0.0.11',
            'Start Time:       Sun, 22 Mar 2026 ...',
            'Labels:           app=nginx',
            'Status:           Running',
            'IP:               10.244.1.5',
            '...',
            'Events:',
            '  Normal  Scheduled  12s  kube-scheduler  Successfully assigned default/nginx to node-1',
            '  Normal  Pulling    11s  kubelet         Pulling image "nginx:1.27"',
            '  Normal  Pulled     8s   kubelet         Successfully pulled image',
            '  Normal  Created    8s   kubelet         Created container nginx',
            '  Normal  Started    8s   kubelet         Started container nginx',
          ],
          explanation: 'The Events section at the bottom is gold for debugging. It shows every action taken on the Pod in chronological order.',
          clusterState: {
            pods: [{ id: 'nginx', name: 'nginx', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'nginx' }, image: 'nginx:1.27', restarts: 0 }],
            services: [], deployments: [], namespaces: ['default'], events: [],
          },
        },
        {
          id: 'p1-m1-s5',
          title: 'View logs',
          instruction: 'See the nginx access logs from inside the container.',
          command: 'kubectl logs nginx',
          output: [
            '/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration',
            '/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/',
            '/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh',
            '2026/03/22 12:00:01 [notice] 1#1: nginx/1.27.0',
            '2026/03/22 12:00:01 [notice] 1#1: start worker process 28',
          ],
          explanation: 'kubectl logs streams stdout/stderr from the container. Add -f to follow live. Use --previous to see logs from a crashed container.',
          clusterState: {
            pods: [{ id: 'nginx', name: 'nginx', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'nginx' }, image: 'nginx:1.27', restarts: 0 }],
            services: [], deployments: [], namespaces: ['default'], events: [],
          },
        },
        {
          id: 'p1-m1-s6',
          title: 'Execute inside the Pod',
          instruction: 'Open a shell inside the running container to inspect it.',
          command: 'kubectl exec -it nginx -- nginx -v',
          output: ['nginx version: nginx/1.27.0'],
          explanation: 'kubectl exec runs a command inside a container. -it gives an interactive TTY. This is essential for debugging — you can inspect files, run curl, check env vars.',
          clusterState: {
            pods: [{ id: 'nginx', name: 'nginx', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'nginx' }, image: 'nginx:1.27', restarts: 0 }],
            services: [], deployments: [], namespaces: ['default'], events: [],
          },
        },
        {
          id: 'p1-m1-s7',
          title: 'Delete the Pod',
          instruction: 'Delete the Pod and observe it disappear from the cluster.',
          command: 'kubectl delete pod nginx',
          output: ['pod "nginx" deleted'],
          explanation: 'The Pod is gone permanently. No restart, no replacement. This is why bare Pods are only for experiments — in production, always use Deployments.',
          clusterState: { ...emptyCluster },
        },
      ],
      quiz: [
        {
          id: 'p1-m1-q1',
          question: 'A Pod has two containers. Container A wants to talk to Container B. What address should it use?',
          options: ['The Pod\'s cluster IP', 'localhost', 'Container B\'s image name', 'The node\'s IP address'],
          answer: 1,
          explanation: 'All containers in the same Pod share a network namespace, which means they share the same IP and can reach each other via localhost on different ports.',
        },
        {
          id: 'p1-m1-q2',
          question: 'A Pod crashes and restarts. What happens to files written to the container filesystem?',
          options: [
            'Files are preserved across restarts',
            'Files are lost — the container filesystem is ephemeral',
            'Files are moved to etcd for safekeeping',
            'Files are copied to the node\'s /tmp directory',
          ],
          answer: 1,
          explanation: 'Container filesystems are ephemeral. When a container restarts, it starts fresh from the image. To persist data, you need to mount a Volume.',
        },
        {
          id: 'p1-m1-q3',
          question: 'Which kubectl command shows Events for a Pod, which is most useful for debugging?',
          options: ['kubectl logs', 'kubectl get pod -o yaml', 'kubectl describe pod', 'kubectl top pod'],
          answer: 2,
          explanation: 'kubectl describe pod shows a human-readable summary including the Events section, which lists chronological actions taken on the Pod — scheduler decisions, image pulls, container starts, probe failures.',
        },
        {
          id: 'p1-m1-q4',
          question: 'You delete a bare Pod (not managed by a Deployment). What happens next?',
          options: [
            'Kubernetes reschedules it on a different node',
            'The Pod enters Terminated state for 24 hours',
            'The Pod is permanently gone — no controller replaces it',
            'The Pod is moved to the kube-system namespace',
          ],
          answer: 2,
          explanation: 'Bare Pods have no controller watching over them. Delete = gone. Use Deployments when you need self-healing behavior.',
        },
        {
          id: 'p1-m1-q5',
          question: 'What does READY "2/3" mean in kubectl get pods output?',
          options: [
            '2 out of 3 replica pods are running',
            '2 out of 3 containers in the Pod are ready',
            '2 out of 3 health checks passed',
            'The Pod has been ready for 2 out of 3 minutes',
          ],
          answer: 1,
          explanation: 'READY shows "readyContainers/totalContainers". "2/3" means 3 containers exist in the Pod but only 2 are passing their readiness probe.',
        },
      ],
    },
    {
      id: 'p1-m2',
      slug: 'deployments',
      title: 'Deployments — Managing Pod Lifecycle',
      description: 'The right way to run applications: automatic restarts, rolling updates, and rollbacks.',
      duration: '75 min',
      difficulty: 'beginner',
      theory: `## Why Not Bare Pods?

Bare Pods have three critical weaknesses:
1. **No self-healing** — crash = gone forever
2. **No scaling** — you'd create each Pod manually
3. **No rolling updates** — you'd have downtime on every deploy

A **Deployment** solves all three.

## The Deployment Stack

\`\`\`
DEPLOYMENT        ← you talk to this
    └── REPLICASET   ← manages replica count
            └── POD
            └── POD
            └── POD
\`\`\`

The Deployment manages ReplicaSets. A new ReplicaSet is created on each update, enabling rollbacks.

## Rolling Update Strategy

\`\`\`
BEFORE: [v1] [v1] [v1]

maxSurge=1, maxUnavailable=0 (zero-downtime):
Step 1: [v1][v1][v1][v2]   ← surge
Step 2: [v1][v1][v2]       ← old removed
Step 3: [v1][v1][v2][v2]   ← surge
Step 4: [v1][v2][v2]       ← old removed
Step 5: [v2][v2][v2]       ← done ✓
\`\`\``,
      labSteps: [
        {
          id: 'p1-m2-s1',
          title: 'Create a Deployment',
          instruction: 'Create a Deployment with 3 replicas of nginx.',
          command: 'kubectl create deployment web --image=nginx:1.26 --replicas=3',
          output: ['deployment.apps/web created'],
          explanation: 'The Deployment controller creates a ReplicaSet, which creates 3 Pods. The scheduler assigns them across available nodes.',
          clusterState: {
            pods: [
              { id: 'web-1', name: 'web-xxx-aaa', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
              { id: 'web-2', name: 'web-xxx-bbb', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
              { id: 'web-3', name: 'web-xxx-ccc', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
            ],
            services: [],
            deployments: [{ id: 'web', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.26' }],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p1-m2-s2',
          title: 'Test self-healing',
          instruction: 'Delete one Pod and watch the Deployment immediately replace it.',
          command: 'kubectl delete pod web-xxx-aaa && kubectl get pods --watch',
          output: [
            'pod "web-xxx-aaa" deleted',
            'NAME          READY   STATUS              RESTARTS   AGE',
            'web-xxx-bbb   1/1     Running             0          2m',
            'web-xxx-ccc   1/1     Running             0          2m',
            'web-xxx-ddd   0/1     ContainerCreating   0          1s',
            'web-xxx-ddd   1/1     Running             0          3s',
          ],
          explanation: 'The ReplicaSet controller immediately notices actual (2) < desired (3) and creates a replacement Pod. Self-healing is automatic.',
          clusterState: {
            pods: [
              { id: 'web-2', name: 'web-xxx-bbb', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
              { id: 'web-3', name: 'web-xxx-ccc', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
              { id: 'web-4', name: 'web-xxx-ddd', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
            ],
            services: [],
            deployments: [{ id: 'web', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.26' }],
            namespaces: ['default'],
            events: ['ReplicaSet replaced terminated pod'],
          },
        },
        {
          id: 'p1-m2-s3',
          title: 'Rolling update',
          instruction: 'Update the image to nginx:1.27. Watch the rolling update with zero downtime.',
          command: 'kubectl set image deployment/web nginx=nginx:1.27',
          output: ['deployment.apps/web image updated'],
          explanation: 'Kubernetes creates a new ReplicaSet for v2 (nginx:1.27) and gradually shifts pods from the old RS to the new one, keeping 3 pods running at all times.',
          clusterState: {
            pods: [
              { id: 'web-2', name: 'web-xxx-bbb', namespace: 'default', node: 'node-2', status: 'Terminated', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
              { id: 'web-3', name: 'web-xxx-ccc', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
              { id: 'web-5', name: 'web-yyy-eee', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-6', name: 'web-yyy-fff', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [{ id: 'web', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.27' }],
            namespaces: ['default'],
            events: ['Rolling update in progress'],
          },
        },
        {
          id: 'p1-m2-s4',
          title: 'Check rollout history',
          instruction: 'See the history of changes to this Deployment.',
          command: 'kubectl rollout history deployment/web',
          output: [
            'deployment.apps/web',
            'REVISION  CHANGE-CAUSE',
            '1         <none>',
            '2         <none>',
          ],
          explanation: 'Each update creates a new revision. You can rollback to any previous revision. Add --record to capture the change cause (e.g. kubectl set image ... --record).',
          clusterState: {
            pods: [
              { id: 'web-5', name: 'web-yyy-eee', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-6', name: 'web-yyy-fff', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-7', name: 'web-yyy-ggg', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [{ id: 'web', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.27' }],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p1-m2-s5',
          title: 'Rollback',
          instruction: 'Rollback to revision 1 (nginx:1.26).',
          command: 'kubectl rollout undo deployment/web',
          output: ['deployment.apps/web rolled back'],
          explanation: 'Rollback creates a new revision using the old ReplicaSet. The old ReplicaSet is still stored — Kubernetes never deleted it, just scaled it to 0.',
          clusterState: {
            pods: [
              { id: 'web-8', name: 'web-xxx-hhh', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
              { id: 'web-9', name: 'web-xxx-iii', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
              { id: 'web-10', name: 'web-xxx-jjj', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
            ],
            services: [],
            deployments: [{ id: 'web', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.26' }],
            namespaces: ['default'],
            events: ['Rolled back to revision 1'],
          },
        },
        {
          id: 'p1-m2-s6',
          title: 'Scale the Deployment',
          instruction: 'Scale to 5 replicas with one command.',
          command: 'kubectl scale deployment/web --replicas=5',
          output: ['deployment.apps/web scaled'],
          explanation: 'Scaling updates the ReplicaSet\'s desired count. Two new Pods are created and scheduled immediately across available nodes.',
          clusterState: {
            pods: [
              { id: 'web-8', name: 'web-xxx-hhh', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
              { id: 'web-9', name: 'web-xxx-iii', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
              { id: 'web-10', name: 'web-xxx-jjj', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
              { id: 'web-11', name: 'web-xxx-kkk', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
              { id: 'web-12', name: 'web-xxx-lll', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.26', restarts: 0 },
            ],
            services: [],
            deployments: [{ id: 'web', name: 'web', namespace: 'default', replicas: 5, availableReplicas: 5, image: 'nginx:1.26' }],
            namespaces: ['default'],
            events: [],
          },
        },
      ],
      quiz: [
        {
          id: 'p1-m2-q1',
          question: 'What sits between a Deployment and its Pods?',
          options: ['A Service', 'A ReplicaSet', 'A DaemonSet', 'A StatefulSet'],
          answer: 1,
          explanation: 'The hierarchy is Deployment → ReplicaSet → Pods. Each update creates a new ReplicaSet. Old ReplicaSets are kept at 0 replicas to enable rollbacks.',
        },
        {
          id: 'p1-m2-q2',
          question: 'You delete one Pod from a 3-replica Deployment. How many Pods will exist 10 seconds later?',
          options: ['2 — it stays at 2', '3 — the ReplicaSet replaces the deleted Pod', '4 — Kubernetes adds an extra for safety', '0 — deletion cascades to all Pods'],
          answer: 1,
          explanation: 'The ReplicaSet controller immediately reconciles: actual(2) < desired(3) → creates 1 new Pod. It will always maintain the desired replica count.',
        },
        {
          id: 'p1-m2-q3',
          question: 'During a rolling update with maxUnavailable=0, what does Kubernetes guarantee?',
          options: [
            'The update completes in under 60 seconds',
            'No pods from the old version are terminated until a new one is healthy',
            'All pods update simultaneously',
            'At most one new pod is created during the update',
          ],
          answer: 1,
          explanation: 'maxUnavailable=0 means zero downtime: the old pod is only removed after the new pod passes its readiness probe. Traffic is never interrupted.',
        },
        {
          id: 'p1-m2-q4',
          question: 'What does "kubectl rollout undo deployment/web" do?',
          options: [
            'Deletes the Deployment and all its Pods',
            'Rolls back to the previous ReplicaSet (previous version)',
            'Pauses the current rollout',
            'Scales the Deployment to 0',
          ],
          answer: 1,
          explanation: 'Kubernetes keeps the previous ReplicaSet around (scaled to 0). "rollout undo" scales the old RS back up and scales the current RS down — an instant rollback.',
        },
      ],
    },
    {
      id: 'p1-m3',
      slug: 'services',
      title: 'Services — Stable Networking',
      description: 'Give your Pods a stable address and load balance traffic between them.',
      duration: '60 min',
      difficulty: 'beginner',
      theory: `## The Problem with Pod IPs

Pod IPs are **ephemeral**. Every time a Pod restarts or is rescheduled, it gets a new IP. If you hardcode a Pod IP, your app breaks after the first restart.

**A Service provides:**
- A stable ClusterIP that never changes
- A DNS name: \`<service>.<namespace>.svc.cluster.local\`
- Load balancing across all matching Pods (via label selector)

## Service Types

| Type | Reachable from | Use case |
|---|---|---|
| ClusterIP | Inside cluster only | Microservice-to-microservice |
| NodePort | Outside via NodeIP:Port | Dev/testing |
| LoadBalancer | Internet via cloud LB | Production |

## How Services Find Pods

Services use **label selectors** to find their target Pods:

\`\`\`
Service selector: { app: web }
              ↓  matches
Pod labels:   { app: web, version: v2 }  ✓
Pod labels:   { app: api }               ✗ (not selected)
\`\`\``,
      labSteps: [
        {
          id: 'p1-m3-s1',
          title: 'Deploy the app',
          instruction: 'Create a 3-replica Deployment we will expose through a Service.',
          command: 'kubectl create deployment web --image=nginx:1.27 --replicas=3',
          output: ['deployment.apps/web created'],
          explanation: 'We need Pods running before creating a Service to select them.',
          clusterState: {
            pods: [
              { id: 'web-1', name: 'web-aaa', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-2', name: 'web-bbb', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-3', name: 'web-ccc', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [{ id: 'web', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.27' }],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p1-m3-s2',
          title: 'Expose as a ClusterIP Service',
          instruction: 'Create a ClusterIP Service that selects all Pods with label app=web.',
          command: 'kubectl expose deployment web --port=80 --target-port=80',
          output: ['service/web exposed'],
          explanation: 'kubectl expose creates a ClusterIP Service using the Deployment\'s selector. Port 80 on the Service routes to port 80 on the Pods.',
          clusterState: {
            pods: [
              { id: 'web-1', name: 'web-aaa', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-2', name: 'web-bbb', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-3', name: 'web-ccc', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [{ id: 'web-svc', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: '10.96.45.100' }],
            deployments: [{ id: 'web', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.27' }],
            namespaces: ['default'],
            events: ['Service web created: 10.96.45.100:80'],
          },
        },
        {
          id: 'p1-m3-s3',
          title: 'Inspect the Service',
          instruction: 'See the ClusterIP and which Pod endpoints back the Service.',
          command: 'kubectl get svc web && kubectl get endpoints web',
          output: [
            'NAME   TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE',
            'web    ClusterIP   10.96.45.100   <none>        80/TCP    30s',
            '',
            'NAME   ENDPOINTS                                      AGE',
            'web    10.244.1.3:80,10.244.1.7:80,10.244.2.4:80   30s',
          ],
          explanation: 'The Service has a stable ClusterIP (10.96.45.100). The endpoints show the actual Pod IPs backing the Service. kube-proxy keeps these endpoints in sync.',
          clusterState: {
            pods: [
              { id: 'web-1', name: 'web-aaa', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-2', name: 'web-bbb', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-3', name: 'web-ccc', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [{ id: 'web-svc', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: '10.96.45.100' }],
            deployments: [{ id: 'web', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.27' }],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p1-m3-s4',
          title: 'Test DNS resolution',
          instruction: 'From inside the cluster, reach the Service by its DNS name.',
          command: 'kubectl run test --image=busybox --rm -it -- wget -qO- http://web',
          output: [
            '<!DOCTYPE html>',
            '<html>',
            '<head><title>Welcome to nginx!</title></head>',
            '...',
            'pod "test" deleted',
          ],
          explanation: 'CoreDNS resolves "web" to 10.96.45.100. kube-proxy load-balances the request to one of the 3 Pod IPs. The Service name works as a hostname inside the cluster.',
          clusterState: {
            pods: [
              { id: 'web-1', name: 'web-aaa', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-2', name: 'web-bbb', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-3', name: 'web-ccc', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'test', name: 'test', namespace: 'default', node: 'node-2', status: 'Running', labels: { run: 'test' }, image: 'busybox', restarts: 0 },
            ],
            services: [{ id: 'web-svc', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: '10.96.45.100' }],
            deployments: [{ id: 'web', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.27' }],
            namespaces: ['default'],
            events: ['DNS: web → 10.96.45.100', 'LB → web-bbb (10.244.2.4)'],
          },
          tip: 'Full DNS: web.default.svc.cluster.local — works from any namespace.',
        },
      ],
      quiz: [
        {
          id: 'p1-m3-q1',
          question: 'Why can\'t you hardcode a Pod\'s IP address in your application config?',
          options: [
            'Pod IPs are in a private range that\'s not routable',
            'Pod IPs change every time a Pod is restarted or rescheduled',
            'Only Services are allowed to have IP addresses',
            'Pod IPs expire after 24 hours',
          ],
          answer: 1,
          explanation: 'Pod IPs are ephemeral — assigned when the Pod starts, released when it dies. A Deployment always replaces Pods with fresh ones at potentially different IPs. Services provide a stable address.',
        },
        {
          id: 'p1-m3-q2',
          question: 'How does a Service know which Pods to send traffic to?',
          options: [
            'It sends traffic to all Pods in the namespace',
            'It uses label selectors to find matching Pods',
            'The Pod registers itself with the Service on startup',
            'It uses Pod names defined in the Service spec',
          ],
          answer: 1,
          explanation: 'A Service\'s selector (e.g., app=web) continuously matches Pods with those labels. The endpoint controller keeps the endpoints list in sync. New Pods are auto-added, deleted Pods are auto-removed.',
        },
        {
          id: 'p1-m3-q3',
          question: 'A Pod in namespace "frontend" wants to reach a Service called "db" in namespace "backend". What DNS name should it use?',
          options: ['db', 'db.backend', 'db.backend.svc.cluster.local', 'backend/db'],
          answer: 2,
          explanation: 'The full DNS format is <service>.<namespace>.svc.cluster.local. Short name "db" only works within the same namespace. "db.backend" also works as a short cross-namespace form.',
        },
        {
          id: 'p1-m3-q4',
          question: 'When should you use a NodePort Service instead of ClusterIP?',
          options: [
            'For internal microservice-to-microservice communication',
            'When you need to expose a service on the internet in production',
            'For development/testing when you need to access the service from outside the cluster without a cloud load balancer',
            'When you need the service to be accessible only from within a single node',
          ],
          answer: 2,
          explanation: 'NodePort is useful when you don\'t have a cloud provider (no LoadBalancer) but need external access. It opens a port (30000-32767) on every node. For production external traffic, use LoadBalancer or Ingress.',
        },
      ],
    },
  ],
}

export default phase1
