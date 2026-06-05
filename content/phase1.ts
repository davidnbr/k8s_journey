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
  hours: '~24 hours',
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
      theory: `> 🧠 **Brain Warm-Up**: If a Pod contains multiple containers (e.g. an API server and a logging agent), how do they communicate with each other? Can they listen on the same port? Think about their network boundaries before reading.

## What is a Pod?

A **Pod** is the smallest deployable unit in Kubernetes. It wraps one or more containers that share the same network namespace, IP address, and storage volumes.

Key facts:
- Every Pod gets **one IP address** — all containers inside share it.
- Containers in the same Pod communicate via **localhost** on different ports. They cannot bind to the same port.
- Pods are **ephemeral** — when they die, their filesystem is gone.
- In practice, you almost never create bare Pods — you use Deployments instead.

## Pod vs Container

| Feature | Docker Container | Kubernetes Pod |
|---|---|---|
| Network | Its own IP | Shared with all co-located containers |
| Lifecycle | Individual | All containers start/stop together |
| Management | Manual | Orchestrated by Kubernetes |

### Pod Architecture (Shared Network & Storage)

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                       POD                               │
│  IP Address: 10.244.1.5 (Shared Network Namespace)      │
│                                                         │
│  ┌───────────────────────┐   ┌───────────────────────┐  │
│  │  Primary Container    │   │   Sidecar Container   │  │
│  │  (e.g., Node.js API)  │   │  (e.g., Logging Agent)│  │
│  │  Port: 8080           │   │  Port: 9000           │  │
│  └──────────┬────────────┘   └───────────┬───────────┘  │
│             │ (Communicate via localhost)│              │
│             └─────────────►◄─────────────┘              │
│             │                            │              │
│  ┌──────────▼────────────┐   ┌───────────▼───────────┐  │
│  │      Volume Mount     │   │      Volume Mount     │  │
│  └──────────┬────────────┘   └───────────┬───────────┘  │
│             │                            │              │
│             └─────────────►◄─────────────┘              │
│                           │                             │
│                  ┌────────▼────────┐                    │
│                  │  emptyDir Vol   │                    │
│                  └─────────────────┘                    │
└─────────────────────────────────────────────────────────┘
\`\`\`

## Pod Lifecycle

\`\`\`
Pending → Running → Succeeded
                ↓
             Failed → (restart policy)
\`\`\`

- **Pending** — scheduled but waiting for image pull or resources.
- **Running** — at least one container is running.
- **Succeeded** — all containers exited with code 0.
- **Failed** — at least one container exited non-zero.`,
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
      coverage: {
        concepts: ['Pod as smallest deployable unit', 'single IP per Pod', 'shared network namespace between containers', 'shared volumes between containers', 'Pod lifecycle phases', 'restartPolicy', 'multi-container Pod patterns'],
        commands: ['kubectl run', 'kubectl get pods', 'kubectl get pods -o wide', 'kubectl describe pod', 'kubectl logs', 'kubectl exec -it', 'kubectl delete pod', 'kubectl apply -f', 'kubectl get pod -o yaml'],
        architecture: ['Pod as wrapper around containers', 'pause/infra container for shared network namespace', 'Pod IP assignment via CNI', 'kubelet lifecycle management'],
        techniques: ['imperative pod creation with kubectl run', 'declarative pod spec with YAML', 'multi-container sidecar pattern', 'pod debugging with exec and logs'],
        procedures: ['create a pod imperatively', 'create a pod from YAML', 'inspect pod status and events', 'view pod logs', 'exec into a running pod container', 'delete a pod'],
        toolsAndPlugins: ['kubectl', 'minikube'],
        cases: ['CrashLoopBackOff — container exits immediately', 'Pending — insufficient node resources', 'ImagePullBackOff — wrong image name or tag', 'OOMKilled — container exceeded memory limit'],
        scenarios: ['debug a crashing container without restarting the pod', 'inspect a running pod container filesystem'],
      },
      exercises: [
        {
          id: 'p1-m1-e1',
          title: 'Official tutorial: view pods and nodes (Explore an App)',
          kind: 'guided',
          goal: 'Follow the official Kubernetes Basics "Viewing Pods and Nodes" tutorial: deploy, get pods, describe, logs, exec.',
          commands: [
            'kubectl create deployment kubernetes-bootcamp --image=registry.k8s.io/minikube/kubernetes-bootcamp:v1',
            'kubectl get pods',
            'kubectl describe pods',
            'export POD_NAME=$(kubectl get pods -o go-template --template \'{{range .items}}{{.metadata.name}}{{"\n"}}{{end}}\' | grep bootcamp | head -1)',
            'echo "Pod name: $POD_NAME"',
            'kubectl logs $POD_NAME',
            'kubectl exec $POD_NAME -- env',
            'kubectl exec -ti $POD_NAME -- bash -c "cat server.js | head -5 && exit"',
          ],
          verify: ['kubectl get pods shows kubernetes-bootcamp pod Running', 'kubectl logs shows "Kubernetes Bootcamp App Started" or HTTP server output', 'exec -- env shows KUBERNETES_SERVICE_HOST env var'],
          expectedOutcome: 'Pod inspected via get, describe, logs, and exec following official tutorial steps.',
          cleanup: ['kubectl delete deployment kubernetes-bootcamp --ignore-not-found'],
          sourceRefs: [
            { title: 'Kubernetes Basics: Viewing Pods and Nodes', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/explore/explore-intro/', checkedAt: '2026-06', scope: 'tutorial' },
          ],
        },
        {
          id: 'p1-m1-e2',
          title: 'Create a Pod from a YAML manifest',
          kind: 'challenge',
          goal: 'Write a Pod manifest from memory with custom labels and apply it.',
          commands: [
            'kubectl run nginx-yaml --image=nginx:1.27 --port=80 --labels=app=web,env=review --dry-run=client -o yaml > /tmp/nginx-pod.yaml',
            'kubectl apply -f /tmp/nginx-pod.yaml',
            'kubectl get pod nginx-yaml --show-labels',
            'kubectl get pod nginx-yaml -o yaml | grep -A5 labels',
          ],
          verify: ['Pod shows Running status', 'Labels app=web and env=review visible in output'],
          expectedOutcome: 'Pod manifest written, applied, and labels confirmed.',
          cleanup: ['kubectl delete pod nginx-yaml --ignore-not-found', 'rm -f /tmp/nginx-pod.yaml'],
        },
        {
          id: 'p1-m1-e3',
          title: 'Diagnose ImagePullBackOff',
          kind: 'debug',
          goal: 'Understand what happens when a pod uses a non-existent image and how to diagnose it.',
          commands: [
            'kubectl run bad-pod --image=nginx:this-tag-does-not-exist-9999',
            'kubectl get pods bad-pod',
            'kubectl describe pod bad-pod',
            'kubectl get events --field-selector involvedObject.name=bad-pod',
          ],
          verify: ['kubectl get pods shows ErrImagePull or ImagePullBackOff', 'kubectl describe pod shows Failed to pull image in Events section'],
          expectedOutcome: 'ImagePullBackOff diagnosed via describe and events.',
          cleanup: ['kubectl delete pod bad-pod --ignore-not-found'],
        },
        {
          id: 'p1-m1-e4',
          title: '1-day spaced review — pod inspection commands',
          kind: 'spaced-review',
          goal: 'Recall pod inspection commands from memory and run them against a live pod.',
          commands: [
            'kubectl run review-pod --image=nginx:1.27',
            'kubectl get pods -o wide',
            'kubectl describe pod review-pod',
            'kubectl logs review-pod',
            'kubectl delete pod review-pod',
          ],
          verify: ['All commands run without error', 'describe output shows IP, Node, Containers, and Events sections'],
          expectedOutcome: 'Pod lifecycle commands recalled and executed without consulting notes.',
          cleanup: ['kubectl delete pod review-pod --ignore-not-found'],
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
      theory: `> 🧠 **Brain Warm-Up**: If a node crashes and runs 10 bare Pods, they die. If the node runs 10 Pods managed by a Deployment, how does Kubernetes know to recreate them? What is the controller stack doing? Think about it.

## Why Not Bare Pods?

Bare Pods have three critical weaknesses:
1. **No self-healing** — if a node crashes or a pod is deleted, it is gone forever.
2. **No scaling** — scaling would require creating each Pod manifest manually.
3. **No rolling updates** — updating an image on bare pods requires deleting them first, causing downtime.

A **Deployment** solves all three.

## The Deployment Stack

A Deployment does not create Pods directly. It manages **ReplicaSets**, which in turn manage the Pods. This hierarchy enables zero-downtime updates and instant rollbacks.

\`\`\`
DEPLOYMENT        ← you talk to this (manages versions)
    └── REPLICASET   ← manages replica counts (v2-7f8d)
            └── POD (v2)
            └── POD (v2)
            └── POD (v2)
\`\`\`

The Deployment manages ReplicaSets. A new ReplicaSet is created on each update, enabling rollbacks to previous states.

## Rolling Update Strategy

Kubernetes uses a RollingUpdate strategy to upgrade application versions. By default, it spawns new pods (maxSurge) and terminates old pods (maxUnavailable) sequentially.

\`\`\`
BEFORE: [v1] [v1] [v1]

maxSurge=1, maxUnavailable=0 (zero-downtime):
Step 1: [v1][v1][v1][v2]   ← surge v2 created
Step 2: [v1][v1][v2]       ← old v1 removed after v2 ready
Step 3: [v1][v1][v2][v2]   ← surge another v2
Step 4: [v1][v2][v2]       ← old v1 removed
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
          command: 'kubectl set image deployment/web web=nginx:1.27',
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
      coverage: {
        concepts: ['Deployment controller', 'ReplicaSet', 'Pod template', 'desired vs actual replicas', 'rolling update strategy', 'maxSurge and maxUnavailable', 'revision history limit'],
        commands: ['kubectl create deployment', 'kubectl get deployments', 'kubectl describe deployment', 'kubectl scale deployment', 'kubectl set image deployment', 'kubectl rollout status', 'kubectl rollout history', 'kubectl rollout undo', 'kubectl get replicasets'],
        architecture: ['Deployment → ReplicaSet → Pod ownership chain', 'controller reconciliation loop', 'revision tracking via ReplicaSet annotations', 'how rolling update replaces pods gradually'],
        techniques: ['rolling update with zero downtime', 'rollback with rollout undo', 'scaling replicas up and down', 'pausing and resuming rollouts'],
        procedures: ['create a deployment', 'scale replicas', 'update container image', 'check rollout status', 'view rollout history', 'rollback to previous revision'],
        toolsAndPlugins: ['kubectl', 'minikube'],
        cases: ['rollout stuck due to bad image — pods in ImagePullBackOff', 'scale to 0 to fully disable workload', 'rollback after bad deploy breaks the app'],
        scenarios: ['zero-downtime image update with health checks', 'recover from a broken deployment in production'],
      },
      exercises: [
        {
          id: 'p1-m2-e1',
          title: 'Official tutorial: deploy an app and scale it',
          kind: 'guided',
          goal: 'Follow the official Kubernetes Basics deploy + scale tutorials: create deployment, inspect ReplicaSet, scale to 4 replicas.',
          commands: [
            'kubectl create deployment kubernetes-bootcamp --image=registry.k8s.io/minikube/kubernetes-bootcamp:v1',
            'kubectl get deployments',
            'kubectl get rs',
            'kubectl get pods -o wide',
            'kubectl describe deployments/kubernetes-bootcamp',
            'kubectl scale deployments/kubernetes-bootcamp --replicas=4',
            'kubectl get deployments',
            'kubectl get pods -o wide',
            'kubectl describe deployments/kubernetes-bootcamp',
          ],
          verify: ['After create: READY shows 1/1', 'kubectl get rs shows a ReplicaSet owned by the deployment', 'After scale: READY shows 4/4, 4 pods with different IPs listed in -o wide'],
          expectedOutcome: 'Deployment created, ReplicaSet visible, scaled to 4 replicas.',
          cleanup: ['kubectl delete deployment kubernetes-bootcamp'],
          sourceRefs: [
            { title: 'Kubernetes Basics: Deploy an App', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/deploy-app/deploy-intro/', checkedAt: '2026-06', scope: 'tutorial' },
            { title: 'Kubernetes Basics: Running Multiple Instances', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/scale/scale-intro/', checkedAt: '2026-06', scope: 'tutorial' },
          ],
        },
        {
          id: 'p1-m2-e2',
          title: 'Official tutorial: rolling update and rollback',
          kind: 'challenge',
          goal: 'Follow the official Kubernetes Basics rolling update tutorial: update image to v2, verify rollout, then rollback.',
          commands: [
            'kubectl create deployment kubernetes-bootcamp --image=registry.k8s.io/minikube/kubernetes-bootcamp:v1',
            'kubectl get pods',
            'kubectl describe pods | grep Image',
            'kubectl set image deployments/kubernetes-bootcamp kubernetes-bootcamp=docker.io/jocatalin/kubernetes-bootcamp:v2',
            'kubectl rollout status deployments/kubernetes-bootcamp',
            'kubectl describe pods | grep Image',
            'kubectl rollout undo deployments/kubernetes-bootcamp',
            'kubectl rollout status deployments/kubernetes-bootcamp',
            'kubectl describe pods | grep Image',
          ],
          verify: ['After set image: rollout status shows "successfully rolled out"', 'describe pods Image field changes from v1 to v2', 'After rollout undo: Image field returns to v1'],
          expectedOutcome: 'Rolling update applied and rolled back following official tutorial steps.',
          cleanup: ['kubectl delete deployment kubernetes-bootcamp'],
          sourceRefs: [
            { title: 'Kubernetes Basics: Performing a Rolling Update', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/', checkedAt: '2026-06', scope: 'tutorial' },
          ],
        },
        {
          id: 'p1-m2-e3',
          title: 'Diagnose a stuck rollout',
          kind: 'debug',
          goal: 'Identify why a rollout is stuck and use describe to find the root cause.',
          commands: [
            'kubectl create deployment stuck --image=nginx:1.27 --replicas=3',
            'kubectl set image deployment/stuck nginx=gcr.io/fake-project/fake-image:v1',
            'kubectl rollout status deployment/stuck',
            'kubectl describe deployment stuck',
            'kubectl get pods -l app=stuck',
            'kubectl describe pod -l app=stuck | grep -A10 Events',
          ],
          verify: ['rollout status shows waiting / not progressing', 'describe deployment shows unavailable replicas', 'pod events show image pull failure'],
          expectedOutcome: 'Stuck rollout root cause identified via describe deployment and pod events.',
          cleanup: ['kubectl delete deployment stuck'],
        },
        {
          id: 'p1-m2-e4',
          title: '3-day spaced review — rollout commands',
          kind: 'spaced-review',
          goal: 'Recall the full set of rollout management commands without looking them up.',
          commands: [
            'kubectl create deployment sr-web --image=nginx:1.27 --replicas=2',
            'kubectl rollout status deployment/sr-web',
            'kubectl rollout history deployment/sr-web',
            'kubectl rollout undo deployment/sr-web',
            'kubectl delete deployment sr-web',
          ],
          verify: ['All commands run without syntax errors', 'rollout history shows at least revision 1'],
          expectedOutcome: 'Deployment rollout commands recalled and executed correctly from memory.',
          cleanup: ['kubectl delete deployment sr-web --ignore-not-found'],
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
      theory: `> 🧠 **Brain Warm-Up**: Pods are constantly dying and getting recreated with new IP addresses. If you have a backend database Pod and a frontend client Pod, how can the frontend reliably connect to the database without updating its connection config on every pod crash? Think about this networking challenge.

## The Problem with Pod IPs

Pod IPs are **ephemeral**. Every time a Pod restarts or is rescheduled, it gets a new IP. If you hardcode a Pod IP, your app breaks after the first restart.

**A Service provides:**
- A stable Virtual IP (ClusterIP) that never changes for the life of the Service.
- A predictable DNS name: \`<service-name>.<namespace-name>.svc.cluster.local\`.
- Load balancing across all matching Pods (via label selectors).

## Service Types

| Type | Reachable from | Use case |
|---|---|---|
| **ClusterIP** | Inside cluster only | Microservice-to-microservice communication |
| **NodePort** | Outside via NodeIP:Port | Dev/testing port exposure |
| **LoadBalancer** | Internet via cloud LB | Production web apps |

## How Services Find Pods

Services use **label selectors** to dynamically discover their target Pods. The control plane monitors pods and updates the Service's Endpoints or EndpointSlices list.

\`\`\`
Service selector: { app: web }
              ↓  matches
Pod labels:   { app: web, version: v2 }  ✓ (Selected)
Pod labels:   { app: api }               ✗ (Not selected)
\`\`\`

### Kubernetes Service Traffic Routing

\`\`\`
Client Request (curl http://web-service:80)
       │
       ▼
┌──────────────────────────────────────────────┐
│             SERVICE (web-service)            │
│  ClusterIP: 10.96.45.100  Port: 80           │
└──────────────────────┬───────────────────────┘
                       │ (Load Balances traffic via Endpoint list)
                       ▼
      ┌────────────────┴────────────────┐
      │ (kube-proxy / CNI Routing)      │
      ▼                                 ▼
┌───────────┐                     ┌───────────┐
│ Pod (web) │                     │ Pod (web) │
│ IP: 10.244.1.3                  │ IP: 10.244.2.4
│ Port: 80    │                   │ Port: 80    │
└───────────┘                     └───────────┘
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
          explanation: 'The FQDN db.backend.svc.cluster.local is the safest and most explicit choice. Note that db.backend also works in practice — it expands to the FQDN via the kubelet-configured search list. However, relying on short forms can break in non-standard DNS configurations. Use the FQDN for production code and automation.',
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
      coverage: {
        concepts: ['Service types: ClusterIP/NodePort/LoadBalancer', 'label selectors and pod targeting', 'Endpoints object', 'ClusterIP virtual IP', 'DNS-based service discovery', 'headless services'],
        commands: ['kubectl expose', 'kubectl get services', 'kubectl describe service', 'kubectl get endpoints', 'minikube service', 'kubectl port-forward svc/', 'kubectl run curl --image=curlimages/curl --restart=Never'],
        architecture: ['kube-proxy iptables/IPVS rules for routing', 'CoreDNS service DNS: <svc>.<ns>.svc.cluster.local', 'Endpoints controller watching pods via selector', 'Service to Pod traffic flow'],
        techniques: ['expose deployment as service', 'port-forward for local dev testing', 'minikube service URL for NodePort access', 'DNS-based service discovery between pods', 'debugging empty Endpoints'],
        procedures: ['create ClusterIP service', 'create NodePort service', 'access service via minikube service', 'verify endpoints are populated', 'curl service from another pod by DNS name'],
        toolsAndPlugins: ['kubectl', 'minikube', 'CoreDNS'],
        cases: ['selector mismatch → Endpoints list is empty', 'pod missing label → not included in endpoints', 'NodePort out of valid range 30000-32767'],
        scenarios: ['debug why a service has no endpoints', 'access an internal ClusterIP service from another pod using DNS'],
      },
      exercises: [
        {
          id: 'p1-m3-e1',
          title: 'Official tutorial: expose an app with a NodePort Service',
          kind: 'guided',
          goal: 'Follow the official Kubernetes Basics "Using a Service to Expose Your App" tutorial: expose deployment, inspect NodePort, label pods, delete service.',
          commands: [
            'kubectl create deployment kubernetes-bootcamp --image=registry.k8s.io/minikube/kubernetes-bootcamp:v1',
            'kubectl get pods',
            'kubectl get services',
            'kubectl expose deployment/kubernetes-bootcamp --type="NodePort" --port 8080',
            'kubectl get services',
            'kubectl describe services/kubernetes-bootcamp',
            'export NODE_PORT=$(kubectl get services/kubernetes-bootcamp -o go-template=\'{{(index .spec.ports 0).nodePort}}\')',
            'echo "NODE_PORT=$NODE_PORT"',
            'kubectl get pods -l app=kubernetes-bootcamp',
            'export POD_NAME=$(kubectl get pods -o go-template --template \'{{range .items}}{{.metadata.name}}{{"\n"}}{{end}}\' | grep bootcamp | head -1)',
            'kubectl label pods "$POD_NAME" version=v1',
            'kubectl describe pods "$POD_NAME" | grep Labels',
            'kubectl get pods -l version=v1',
            'kubectl delete service -l app=kubernetes-bootcamp',
            'kubectl get services',
            'kubectl exec -ti $POD_NAME -- curl http://localhost:8080',
          ],
          verify: ['After expose: kubernetes-bootcamp service appears with NodePort type', 'NODE_PORT is in range 30000-32767', 'After label: describe pod shows version=v1 label', 'After delete service: kubectl get services no longer shows kubernetes-bootcamp', 'exec curl to localhost:8080 still works (app still running inside pod)'],
          expectedOutcome: 'App exposed via NodePort, pod labeled, service deleted while app remains running.',
          cleanup: ['kubectl delete deployment kubernetes-bootcamp --ignore-not-found', 'kubectl delete service kubernetes-bootcamp --ignore-not-found'],
          sourceRefs: [
            { title: 'Kubernetes Basics: Using a Service to Expose Your App', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/expose/expose-intro/', checkedAt: '2026-06', scope: 'tutorial' },
          ],
        },
        {
          id: 'p1-m3-e2',
          title: 'Access ClusterIP service via DNS from another pod',
          kind: 'challenge',
          goal: 'Verify DNS-based service discovery works between pods.',
          commands: [
            'kubectl create deployment backend --image=nginx:1.27',
            'kubectl expose deployment backend --type=ClusterIP --port=80',
            'kubectl run curl-pod --image=curlimages/curl:8.7.1 --restart=Never -- sleep 3600',
            'kubectl exec curl-pod -- curl -s http://backend.default.svc.cluster.local',
            'kubectl exec curl-pod -- curl -s http://backend',
          ],
          verify: ['curl to backend.default.svc.cluster.local returns nginx HTML', 'Short name backend also resolves within default namespace'],
          expectedOutcome: 'DNS service discovery confirmed between pods in the same namespace.',
          cleanup: ['kubectl delete pod curl-pod', 'kubectl delete service backend', 'kubectl delete deployment backend'],
        },
        {
          id: 'p1-m3-e3',
          title: 'Debug a service with empty endpoints',
          kind: 'debug',
          goal: 'Diagnose why a service has no endpoints due to a selector mismatch.',
          commands: [
            'kubectl create deployment target --image=nginx:1.27 --replicas=2',
            'kubectl expose deployment target --type=ClusterIP --port=80',
            'kubectl label pods -l app=target app-',
            'kubectl get endpoints target',
            'kubectl describe service target',
            'kubectl get pods --show-labels',
          ],
          verify: ['kubectl get endpoints shows empty or no IPs after label removal', 'kubectl describe service shows Endpoints: <none>'],
          expectedOutcome: 'Understand that selector mismatch causes empty endpoints and traffic drops.',
          cleanup: ['kubectl delete service target', 'kubectl delete deployment target'],
        },
        {
          id: 'p1-m3-e4',
          title: '3-day spaced review — service commands',
          kind: 'spaced-review',
          goal: 'Recall service creation and inspection commands from memory.',
          commands: [
            'kubectl create deployment sr-svc --image=nginx:1.27',
            'kubectl expose deployment sr-svc --type=NodePort --port=80',
            'kubectl get services sr-svc',
            'kubectl get endpoints sr-svc',
            'kubectl describe service sr-svc',
            'kubectl delete service sr-svc',
            'kubectl delete deployment sr-svc',
          ],
          verify: ['Service created with correct type', 'Endpoints populated with pod IPs'],
          expectedOutcome: 'Service commands recalled and executed correctly from memory.',
          cleanup: ['kubectl delete service sr-svc --ignore-not-found', 'kubectl delete deployment sr-svc --ignore-not-found'],
        },
      ],
    },
    {
      id: 'p1-m4',
      slug: 'init-containers',
      title: 'Init Containers & Lifecycle Hooks',
      description: 'Run setup tasks before your app starts and handle graceful shutdown with preStop hooks.',
      duration: '45 min',
      difficulty: 'beginner',
      theory: `> 🧠 **Brain Warm-Up**: Your application needs a database schema migration to run before the API server accepts traffic. Both are in the same Pod. How do you guarantee the migration completes successfully before the API container starts? Think about startup ordering within a Pod.

## Init Containers

An **init container** runs to completion before any of the main containers start. This gives you sequenced, guaranteed setup:

\`\`\`
Pod starts
  ↓
init-container-1 runs → exits 0
  ↓
init-container-2 runs → exits 0
  ↓
main containers start (in parallel)
\`\`\`

Key properties:
- Run **sequentially** — each must complete before the next starts
- If an init container fails, kubelet restarts it (respecting the Pod's restartPolicy)
- Main containers **cannot start** until all init containers succeed
- Can use a **different image** than the main container (e.g., a kubectl image for setup, vault for secret fetching)

### Common Patterns

\`\`\`
Pattern 1: Wait for a dependency
  initContainers:
  - name: wait-for-db
    image: busybox
    command: ['sh', '-c', 'until nc -z mysql-svc 3306; do sleep 2; done']

Pattern 2: Fetch secrets from Vault
  initContainers:
  - name: vault-init
    image: vault:latest
    command: ['vault', 'agent', 'render', '-config=/vault-agent.hcl']
    # Writes secrets to a shared emptyDir volume

Pattern 3: Run database migrations
  initContainers:
  - name: migrate
    image: myapp:latest
    command: ['./manage.py', 'migrate', '--no-input']
\`\`\`

## Lifecycle Hooks

Kubernetes provides two hooks that run code at specific moments in a container's lifecycle:

### postStart
Fires immediately after a container is created — **concurrently** with the container's main process (ENTRYPOINT). The container does not reach Running state until postStart completes.

**⚠️ Warning**: postStart is NOT guaranteed to run before ENTRYPOINT. For strict ordering, use init containers instead.

### preStop
Fires before SIGTERM is sent. Kubernetes waits for preStop to finish, then sends SIGTERM. Critical for graceful shutdown — drain in-flight requests, deregister from service discovery, flush write buffers.

\`\`\`yaml
lifecycle:
  preStop:
    exec:
      command: ['/bin/sh', '-c', 'nginx -s quit; sleep 5']
\`\`\`

## terminationGracePeriodSeconds

When a Pod is deleted:

\`\`\`
kubectl delete pod nginx
         ↓
preStop hook runs         Pod removed from Service Endpoints
(simultaneously)          (new traffic stops arriving)
         ↓
SIGTERM sent to process
         ↓  (app drains in-flight requests)
[terminationGracePeriodSeconds countdown — default 30s]
         ↓  (if still alive after grace period)
SIGKILL
\`\`\`

For apps that take longer than 30 seconds to drain, set \`terminationGracePeriodSeconds\` to match. Combine with a preStop sleep to give load balancers time to deregister the Pod:

\`\`\`yaml
spec:
  terminationGracePeriodSeconds: 60
  containers:
  - lifecycle:
      preStop:
        exec:
          command: ['sleep', '15']  # Wait for LB health check deregistration
\`\`\``,
      labSteps: [
        {
          id: 'p1-m4-s1',
          title: 'Create a Pod with an init container',
          instruction: 'Apply a Pod spec with an init container that runs before the main nginx container.',
          command: 'kubectl apply -f -',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: app-with-init
spec:
  initContainers:
  - name: wait-for-service
    image: busybox:1.36
    command: ['sh', '-c', 'echo "Waiting for dependency..."; sleep 3; echo "Ready!"']
  containers:
  - name: app
    image: nginx:1.27
    ports:
    - containerPort: 80`,
          output: ['pod/app-with-init created'],
          explanation: 'The init container runs first. Only after it exits with code 0 does nginx start. During the init phase, kubectl get pods shows STATUS: Init:0/1, which means 0 of 1 init containers have completed.',
          clusterState: {
            pods: [
              { id: 'app-init', name: 'app-with-init', namespace: 'default', node: 'node-1', status: 'Pending', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [], deployments: [], namespaces: ['default'],
            events: ['Init container wait-for-service started'],
          },
        },
        {
          id: 'p1-m4-s2',
          title: 'Watch the init lifecycle',
          instruction: 'Watch the Pod progress through init stages to Running.',
          command: 'kubectl get pods -w',
          output: [
            'NAME             READY   STATUS         RESTARTS   AGE',
            'app-with-init    0/1     Init:0/1       0          2s',
            'app-with-init    0/1     PodInitializing 0         5s',
            'app-with-init    1/1     Running        0          7s',
          ],
          explanation: 'Init:0/1 means 0 of 1 init containers completed. PodInitializing is the brief window between init success and main container start. Running means both the init container succeeded and nginx is up.',
          clusterState: {
            pods: [
              { id: 'app-init', name: 'app-with-init', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [], deployments: [], namespaces: ['default'], events: [],
          },
        },
        {
          id: 'p1-m4-s3',
          title: 'Read init container logs',
          instruction: 'Use -c to specify the init container name and view its logs.',
          command: 'kubectl logs app-with-init -c wait-for-service',
          output: ['Waiting for dependency...', 'Ready!'],
          explanation: 'The -c flag selects which container in the Pod to read logs from. Init container logs persist after completion — essential for debugging a stuck Init:0/1 state. Always check init container logs first when a Pod never reaches Running.',
          clusterState: {
            pods: [
              { id: 'app-init', name: 'app-with-init', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [], deployments: [], namespaces: ['default'], events: [],
          },
          tip: 'For the main container logs: kubectl logs app-with-init -c app (or just kubectl logs app-with-init since "app" is the only main container).',
        },
        {
          id: 'p1-m4-s4',
          title: 'Share data between init and main containers',
          instruction: 'Use an emptyDir volume to pass a generated config from init container to the main app.',
          command: 'kubectl apply -f -',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: init-volume-share
spec:
  initContainers:
  - name: setup
    image: busybox:1.36
    command: ['sh', '-c', 'echo "DB_HOST=mysql-service" > /config/app.env']
    volumeMounts:
    - name: config-dir
      mountPath: /config
  containers:
  - name: app
    image: busybox:1.36
    command: ['sh', '-c', 'cat /config/app.env && sleep 3600']
    volumeMounts:
    - name: config-dir
      mountPath: /config
  volumes:
  - name: config-dir
    emptyDir: {}`,
          output: ['pod/init-volume-share created'],
          explanation: 'The init container writes a config file to an emptyDir volume. The main container reads from the same volume. This pattern lets you generate configs, fetch secrets from Vault, or clone git repos before your app starts — without baking secrets into the image.',
          clusterState: {
            pods: [
              { id: 'ivs', name: 'init-volume-share', namespace: 'default', node: 'node-2', status: 'Running', labels: {}, image: 'busybox:1.36', restarts: 0 },
            ],
            services: [], deployments: [], namespaces: ['default'], events: [],
          },
          tip: 'Verify: kubectl exec init-volume-share -c app -- cat /config/app.env',
        },
        {
          id: 'p1-m4-s5',
          title: 'Add a preStop hook for graceful shutdown',
          instruction: 'Apply a Deployment where nginx sends a quit signal before SIGTERM to drain connections.',
          command: 'kubectl apply -f -',
          yamlContent: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: graceful-nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: graceful-nginx
  template:
    metadata:
      labels:
        app: graceful-nginx
    spec:
      terminationGracePeriodSeconds: 30
      containers:
      - name: nginx
        image: nginx:1.27
        ports:
        - containerPort: 80
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "nginx -s quit; sleep 5"]`,
          output: ['deployment.apps/graceful-nginx created'],
          explanation: 'On Pod deletion or rolling update, the preStop hook sends nginx -s quit (graceful drain) then waits 5 seconds. This gives in-flight HTTP requests time to complete before SIGTERM arrives. Without this, active connections are forcefully terminated mid-request.',
          clusterState: {
            pods: [
              { id: 'gn-1', name: 'graceful-nginx-aaa', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'graceful-nginx' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'gn-2', name: 'graceful-nginx-bbb', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'graceful-nginx' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [{ id: 'gn', name: 'graceful-nginx', namespace: 'default', replicas: 2, availableReplicas: 2, image: 'nginx:1.27' }],
            namespaces: ['default'], events: [],
          },
          tip: 'The sleep 5 accounts for the time between Kubernetes removing the Pod from Service endpoints and the load balancer propagating that change. Without this buffer, the LB may still send requests to a shutting-down Pod.',
        },
      ],
      quiz: [
        {
          id: 'p1-m4-q1',
          question: 'In what order do init containers run?',
          options: [
            'All init containers run simultaneously in parallel',
            'Sequentially — each must complete successfully before the next starts',
            'Randomly — determined by the scheduler at runtime',
            'After main containers — they are post-startup tasks',
          ],
          answer: 1,
          explanation: 'Init containers run one at a time, in declaration order. Each must exit with code 0 before the next starts. Only after ALL init containers succeed do the main containers start in parallel. This guarantees strict dependency ordering.',
        },
        {
          id: 'p1-m4-q2',
          question: 'What STATUS does kubectl show while an init container is running?',
          options: [
            'STATUS: Initializing',
            'STATUS: Init:0/1 (completed/total)',
            'STATUS: Pending — same as before scheduling',
            'READY: 0/1',
          ],
          answer: 1,
          explanation: '"Init:0/1" means 0 of 1 init containers completed. Three init containers with 2 done would show "Init:2/3". This distinguishes init-waiting from other Pending states and tells you exactly how many init containers are outstanding.',
        },
        {
          id: 'p1-m4-q3',
          question: 'What is the preStop lifecycle hook used for?',
          options: [
            'Health checks before the main container starts',
            'Graceful cleanup (drain connections, deregister from service discovery) before SIGTERM is sent',
            'Pulling images before the container starts',
            'Running database migrations',
          ],
          answer: 1,
          explanation: 'preStop runs before SIGTERM is sent to the container process. It is used for graceful shutdown: finishing in-flight requests, deregistering from service discovery, flushing write buffers. Without preStop, SIGTERM interrupts active work immediately.',
        },
        {
          id: 'p1-m4-q4',
          question: 'An init container fails (exits non-zero). What happens next?',
          options: [
            'The main container starts and handles the error',
            'The Pod is immediately deleted',
            'Kubernetes restarts the init container according to the Pod restartPolicy',
            'The failed init container is skipped and the next one runs',
          ],
          answer: 2,
          explanation: 'A failed init container is restarted by kubelet according to the Pod\'s restartPolicy (default: Always). The Pod stays in Init:CrashLoopBackOff if it keeps failing. Main containers never start until all init containers succeed — this is the key guarantee.',
        },
      ],
      coverage: {
        concepts: ['init containers', 'sequential init execution guarantee', 'postStart lifecycle hook', 'preStop lifecycle hook', 'terminationGracePeriodSeconds', 'SIGTERM → preStop → SIGKILL flow', 'graceful shutdown'],
        commands: ['kubectl apply -f pod-with-init.yaml', 'kubectl get pod (Init:0/1 status)', 'kubectl describe pod (Init Containers section)', 'kubectl logs pod -c init-container-name', 'kubectl wait --for=condition=Ready pod/'],
        architecture: ['init containers run sequentially before main containers', 'lifecycle hook handlers: exec and httpGet', 'terminationGracePeriodSeconds countdown after SIGTERM', 'preStop hook blocks SIGKILL during grace period'],
        techniques: ['dependency waiting with init containers (nc or wget loop)', 'graceful shutdown with preStop sleep', 'postStart for post-start side effects', 'multi-stage pod initialization'],
        procedures: ['write pod spec with init container', 'view init container logs separately', 'configure preStop hook', 'verify graceful termination timing'],
        toolsAndPlugins: ['kubectl', 'minikube'],
        cases: ['init container loops waiting for dependency — pod stuck in Init:0/1', 'app starts before DB is ready — race condition without init', 'preStop hook too short — connections dropped on shutdown'],
        scenarios: ['database migration before app start using init container', 'graceful connection draining on pod shutdown with preStop sleep'],
      },
      exercises: [
        {
          id: 'p1-m4-e1',
          title: 'Deploy a pod with an init container',
          kind: 'guided',
          goal: 'Observe init container completing before main container starts.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: init-demo
spec:
  initContainers:
  - name: init-delay
    image: busybox:1.36
    command: ["sh", "-c", "echo 'init starting'; sleep 5; echo 'init done'"]
  containers:
  - name: main
    image: nginx:1.27
EOF`,
            'kubectl get pod init-demo -w',
            'kubectl logs init-demo -c init-delay',
            'kubectl logs init-demo',
          ],
          verify: ['Pod shows Init:0/1 then Running status', 'init-delay logs show "init done"', 'nginx main container running after init completes'],
          expectedOutcome: 'Init container ran to completion before main container started.',
          cleanup: ['kubectl delete pod init-demo --ignore-not-found'],
        },
        {
          id: 'p1-m4-e2',
          title: 'Write an init + preStop pod manifest from memory',
          kind: 'challenge',
          goal: 'Write a pod manifest with an init container and a preStop sleep hook without referencing docs.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: lifecycle-pod
spec:
  initContainers:
  - name: setup
    image: busybox:1.36
    command: ["sh", "-c", "echo setup > /work/data.txt"]
    volumeMounts:
    - name: work
      mountPath: /work
  containers:
  - name: app
    image: nginx:1.27
    lifecycle:
      preStop:
        exec:
          command: ["sh", "-c", "sleep 5"]
    volumeMounts:
    - name: work
      mountPath: /work
  volumes:
  - name: work
    emptyDir: {}
EOF`,
            'kubectl describe pod lifecycle-pod',
            'kubectl exec lifecycle-pod -- cat /work/data.txt',
          ],
          verify: ['Pod Running', 'Init Containers section visible in describe', 'cat /work/data.txt returns "setup"'],
          expectedOutcome: 'Init container wrote file, main container reads it — shared volume pattern confirmed.',
          cleanup: ['kubectl delete pod lifecycle-pod --ignore-not-found'],
        },
        {
          id: 'p1-m4-e3',
          title: 'Diagnose Init:CrashLoopBackOff',
          kind: 'debug',
          goal: 'Identify why a pod is stuck in Init:CrashLoopBackOff and fix it.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: broken-init
spec:
  initContainers:
  - name: bad-init
    image: busybox:1.36
    command: ["sh", "-c", "exit 1"]
  containers:
  - name: main
    image: nginx:1.27
EOF`,
            'kubectl get pod broken-init',
            'kubectl describe pod broken-init',
            'kubectl logs broken-init -c bad-init',
          ],
          verify: ['Pod shows Init:CrashLoopBackOff status', 'describe shows init container exit code 1 in Events', 'main container never starts'],
          expectedOutcome: 'Init failure diagnosed via kubectl logs -c and describe events.',
          cleanup: ['kubectl delete pod broken-init --ignore-not-found'],
        },
        {
          id: 'p1-m4-e4',
          title: '7-day spaced review — lifecycle sequence recall',
          kind: 'spaced-review',
          goal: 'Recall the pod startup and shutdown sequence from memory, then verify with a live pod.',
          commands: [
            'kubectl apply -f /tmp/init-demo.yaml || kubectl run sr-pod --image=nginx:1.27',
            'kubectl describe pod sr-pod',
            'kubectl get pod sr-pod -o yaml | grep -A5 lifecycle',
          ],
          verify: ['Can describe the sequence: init containers → postStart → readiness → preStop → SIGTERM → SIGKILL', 'describe pod shows container states correctly'],
          expectedOutcome: 'Pod lifecycle sequence recalled accurately without notes.',
          cleanup: ['kubectl delete pod sr-pod --ignore-not-found'],
        },
      ],
    },
  ],
}

export default phase1
