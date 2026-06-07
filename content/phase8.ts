import type { Phase, ClusterState } from '@/lib/types'

const phase8: Phase = {
  id: 'phase-8',
  slug: 'phase-8',
  title: 'Troubleshooting Mastery',
  shortTitle: 'Troubleshooting',
  description:
    'Master the systematic debugging workflow that accounts for ~30% of the CKA exam. Diagnose Pod failures, network breakdowns, node problems, and control plane issues with confidence.',
  weeks: 'Weeks 17–18',
  hours: '~20 hours',
  color: 'text-red-400',
  bgColor: 'bg-red-500/10 border-red-500/30',
  modules: [
    // ─── Module 1: Troubleshooting Pods ─────────────────────────────────────────
    {
      id: 'p8-m1',
      slug: 'troubleshooting-pods',
      title: 'Troubleshooting Pods',
      description:
        'Diagnose and fix the five most common Pod failure modes: CrashLoopBackOff, OOMKilled, ImagePullBackOff, Pending, and Init container failures.',
      duration: '90 min',
      difficulty: 'intermediate',
      learningObjectives: [
        'Execute the systematic debug workflow: get → describe → logs → exec → events',
        'Distinguish CrashLoopBackOff (app crash) from OOMKilled (memory limit) from ImagePullBackOff (image error)',
        'Diagnose why a Pod is stuck Pending (no resources, wrong nodeSelector, taints)',
        'Read Init container logs and understand failure propagation',
        'Use kubectl logs --previous to access crashed container logs',
      ],
      keyConcepts: [
        'CrashLoopBackOff: exponential backoff (10s → 20s → 40s → 80s → 160s → 300s cap)',
        'OOMKilled: exit code 137, kernel OOM killer terminates the container',
        'ImagePullBackOff: ErrImagePull on first failure, then ImagePullBackOff on retries',
        'Pending: scheduler cannot place the pod — no matching nodes or insufficient resources',
        'Init containers: run sequentially before app containers; failure blocks the whole Pod',
      ],
      practicePrompts: [
        'A pod shows CrashLoopBackOff. What is the FIRST command you run? What are you looking for?',
        'The pod shows OOMKilled. How do you confirm it was OOM and not a crash? What exit code do you expect?',
        'A pod has been Pending for 10 minutes. List three different reasons this can happen and the command that reveals each.',
        'You need logs from a container that crashed 30 seconds ago and has already restarted. What flag do you need?',
      ],
      masteryChecks: [
        'Can reproduce and fix CrashLoopBackOff caused by bad entrypoint command in under 3 minutes',
        'Can identify OOMKilled from exit code 137 in kubectl describe output',
        'Can explain why kubectl logs shows nothing for a CrashLoopBackOff pod and which flag to add',
        'Can diagnose a Pending pod blocked by resource constraints using kubectl describe and kubectl get events',
        'Can read Init container status and logs when init container fails',
        'Can write a corrected Pod manifest and reapply within the exam time pressure',
      ],
      theory: `> 🧠 **Brain Warm-Up**: A pod shows \`CrashLoopBackOff\` with 15 restarts. \`kubectl logs\` returns nothing. Why? What is the relationship between the backoff timer and when you can see logs? What flag gives you the previous container's logs?

## The Troubleshooting Decision Tree

Always follow this workflow. Do not skip steps.

\`\`\`
kubectl get pods
       │
       ├── CrashLoopBackOff ──► kubectl logs <pod> --previous
       │                         kubectl describe pod <pod> (check Exit Code, Last State)
       │
       ├── OOMKilled ──────────► kubectl describe pod <pod> (look for Exit Code: 137)
       │                         Increase resources.limits.memory
       │
       ├── ImagePullBackOff ───► kubectl describe pod <pod> (Events: Failed to pull image)
       │                         Check image name/tag spelling
       │                         Check imagePullSecrets for private registries
       │
       ├── Pending ────────────► kubectl describe pod <pod> (Events: FailedScheduling)
       │                         kubectl get nodes (are nodes Ready?)
       │                         kubectl describe node <node> (check Allocatable vs Requests)
       │                         Check nodeSelector, tolerations, affinity rules
       │
       ├── Init:0/1 ───────────► kubectl logs <pod> -c <init-container-name>
       │                         kubectl describe pod <pod> (Init Containers section)
       │
       └── Running but unhealthy► kubectl exec -it <pod> -- /bin/sh
                                   kubectl logs <pod> -f
                                   kubectl describe pod <pod> (check probe failures)
\`\`\`

## CrashLoopBackOff

The most common failure. Kubernetes restarts a crashing container with exponential backoff:

\`\`\`
Restart 1:   wait 10s
Restart 2:   wait 20s
Restart 3:   wait 40s
Restart 4:   wait 80s
Restart 5:   wait 160s
Restart 6+:  wait 300s (5 min cap)
\`\`\`

This means after several restarts, the container is only UP for a few seconds every 5 minutes. Running \`kubectl logs\` during the backoff window shows an empty or stale log. Use \`--previous\` to see the terminated container's logs:

\`\`\`bash
kubectl logs <pod> --previous
kubectl logs <pod> -c <container> --previous   # multi-container pods
\`\`\`

The \`kubectl describe\` output tells you the exit code:

\`\`\`
Last State:  Terminated
  Reason:    Error
  Exit Code: 1           ← application crashed
  Exit Code: 137          ← OOMKilled (128 + SIGKILL signal 9)
  Exit Code: 126          ← permission denied (can't execute command)
  Exit Code: 127          ← command not found (bad entrypoint)
\`\`\`

## OOMKilled

When a container exceeds its \`resources.limits.memory\`, the Linux kernel OOM killer sends SIGKILL (signal 9). Exit code = 128 + 9 = **137**.

\`\`\`
Last State:  Terminated
  Reason:    OOMKilled
  Exit Code: 137
  Started:   Mon, 05 Jun 2026 10:01:00 +0000
  Finished:  Mon, 05 Jun 2026 10:01:03 +0000
\`\`\`

Fix: increase \`resources.limits.memory\` or profile the application for a memory leak.

## ImagePullBackOff

Kubernetes tries to pull the image, fails (\`ErrImagePull\`), then retries with backoff (\`ImagePullBackOff\`). Common causes:

1. **Wrong image name or tag** — typo in the image field
2. **Private registry** — no \`imagePullSecrets\` configured
3. **Rate limiting** — Docker Hub pull limit (unauthenticated: 100 pulls/6h)

\`\`\`
Events:
  Warning  Failed     3s    kubelet  Failed to pull image "nginx:does-not-exist":
           rpc error: code = NotFound desc = failed to pull and unpack image
           "docker.io/library/nginx:does-not-exist": not found
  Warning  Failed     3s    kubelet  Error: ErrImagePull
  Warning  BackOff    2s    kubelet  Back-off pulling image "nginx:does-not-exist"
\`\`\`

## Pending — Scheduler Cannot Place the Pod

The scheduler evaluates every node and rejects them all. The Events section explains why:

\`\`\`
Events:
  Warning  FailedScheduling  5s  default-scheduler
    0/2 nodes are available:
    1 Insufficient cpu.
    1 node(s) had untolerated taint {node-role.kubernetes.io/control-plane: ""}.
\`\`\`

Decode "0/2 nodes are available: 1 Insufficient cpu, 1 node(s) had taint":
- Node 1: not enough CPU
- Node 2: has a control-plane taint and the Pod has no toleration

Other common Pending causes:
- \`nodeSelector\` with a label that no node has
- PersistentVolumeClaim in Pending state (no matching PV)
- Resource quota exhausted in the namespace

## Init Container Failures

Init containers run **sequentially** before app containers start. If one fails, the Pod status shows \`Init:0/2\` (0 of 2 init containers completed).

\`\`\`bash
# Check init container logs — must specify -c with the init container name
kubectl logs <pod> -c init-db-check

# describe shows each init container's state separately
kubectl describe pod <pod>
# Look for:
# Init Containers:
#   init-db-check:
#     State:    Terminated
#     Reason:   Error
#     Exit Code: 1
\`\`\``,
      labSteps: [
        {
          id: 'p8-m1-s1',
          title: 'Reproduce CrashLoopBackOff — bad command',
          instruction:
            'Deploy a pod with an invalid entrypoint command. This is the most common source of CrashLoopBackOff in exam scenarios.',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: crash-pod
  namespace: default
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ["/bin/sh", "-c", "this-command-does-not-exist"]`,
          output: ['pod/crash-pod created'],
          explanation:
            'The command "this-command-does-not-exist" will immediately exit with code 127 (command not found). Kubernetes will restart it with exponential backoff.',
          clusterState: {
            pods: [
              {
                id: 'crash-pod',
                name: 'crash-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Pending',
                labels: {},
                image: 'busybox:1.36',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['crash-pod scheduled → node-1'],
          },
          tip: 'Save this YAML as crash-pod.yaml. In the CKA exam, always use kubectl apply -f so you can quickly edit and reapply.',
        },
        {
          id: 'p8-m1-s2',
          title: 'Observe CrashLoopBackOff status',
          instruction:
            'Watch the pod restart. After a few cycles it enters CrashLoopBackOff. Note the RESTARTS counter climbing.',
          command: 'kubectl get pod crash-pod',
          output: [
            'NAME        READY   STATUS             RESTARTS   AGE',
            'crash-pod   0/1     CrashLoopBackOff   4          90s',
          ],
          explanation:
            'READY 0/1 — the container is not passing readiness. STATUS CrashLoopBackOff — Kubernetes is backing off before the next restart. RESTARTS 4 means it has crashed 4 times.',
          clusterState: {
            pods: [
              {
                id: 'crash-pod',
                name: 'crash-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Failed',
                labels: {},
                image: 'busybox:1.36',
                restarts: 4,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'crash-pod: Back-off restarting failed container',
              'crash-pod: container app exited with code 127',
            ],
          },
        },
        {
          id: 'p8-m1-s3',
          title: 'Read the previous container logs',
          instruction:
            "kubectl logs crash-pod returns nothing because the container is in backoff. Use --previous to see the last terminated container's output.",
          command: 'kubectl logs crash-pod --previous',
          output: ['/bin/sh: this-command-does-not-exist: not found'],
          explanation:
            'The --previous flag reads logs from the last terminated container instance. Without it, you get empty output during the backoff window. This is critical exam knowledge.',
          clusterState: {
            pods: [
              {
                id: 'crash-pod',
                name: 'crash-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Failed',
                labels: {},
                image: 'busybox:1.36',
                restarts: 4,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
          tip: 'In a multi-container pod: kubectl logs <pod> -c <container> --previous',
        },
        {
          id: 'p8-m1-s4',
          title: 'Confirm exit code with kubectl describe',
          instruction:
            'Describe the pod to see the exit code and last state. Exit code 127 = command not found.',
          command: 'kubectl describe pod crash-pod',
          output: [
            'Name:             crash-pod',
            'Status:           Running',
            '...',
            'Containers:',
            '  app:',
            '    State:          Waiting',
            '      Reason:       CrashLoopBackOff',
            '    Last State:     Terminated',
            '      Reason:       Error',
            '      Exit Code:    127',
            '      Started:      Thu, 05 Jun 2026 10:01:40 +0000',
            '      Finished:     Thu, 05 Jun 2026 10:01:40 +0000',
            '    Ready:          False',
            '    Restart Count:  4',
            '...',
            'Events:',
            '  Warning  BackOff  10s  kubelet  Back-off restarting failed container app in pod crash-pod_default',
          ],
          explanation:
            "Last State → Exit Code: 127 = command not found. If you saw Exit Code: 1, it's an application error. Exit Code: 137 = OOMKilled. Exit Code: 126 = permission denied.",
          clusterState: {
            pods: [
              {
                id: 'crash-pod',
                name: 'crash-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Failed',
                labels: {},
                image: 'busybox:1.36',
                restarts: 4,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p8-m1-s5',
          title: 'Fix the CrashLoopBackOff',
          instruction:
            'Edit the pod to use a valid command. Delete and recreate (pods are immutable for most fields).',
          command:
            'kubectl delete pod crash-pod && kubectl run crash-pod --image=busybox:1.36 --command -- /bin/sh -c "echo hello && sleep 3600"',
          output: ['pod "crash-pod" deleted', 'pod/crash-pod created'],
          explanation:
            'The new command prints "hello" then sleeps, staying alive. The pod will now show Running with 0 restarts.',
          clusterState: {
            pods: [
              {
                id: 'crash-pod',
                name: 'crash-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: {},
                image: 'busybox:1.36',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['crash-pod: Started container app'],
          },
        },
        {
          id: 'p8-m1-s6',
          title: 'Reproduce OOMKilled',
          instruction:
            'Deploy a pod that allocates more memory than its limit. It will be killed by the kernel OOM killer.',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: oom-pod
  namespace: default
spec:
  containers:
  - name: memory-hog
    image: polinux/stress
    command: ["stress"]
    args: ["--vm", "1", "--vm-bytes", "150M", "--vm-hang", "1"]
    resources:
      limits:
        memory: "64Mi"
      requests:
        memory: "32Mi"`,
          output: ['pod/oom-pod created'],
          explanation:
            'The stress tool tries to allocate 150Mi, but the memory limit is 64Mi. The Linux OOM killer will send SIGKILL (exit code 137).',
          clusterState: {
            pods: [
              {
                id: 'oom-pod',
                name: 'oom-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Pending',
                labels: {},
                image: 'polinux/stress',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p8-m1-s7',
          title: 'Confirm OOMKilled via describe',
          instruction:
            'After the pod runs briefly and dies, describe it to see the OOMKilled reason and exit code 137.',
          command: 'kubectl describe pod oom-pod',
          output: [
            'Containers:',
            '  memory-hog:',
            '    State:          Waiting',
            '      Reason:       CrashLoopBackOff',
            '    Last State:     Terminated',
            '      Reason:       OOMKilled',
            '      Exit Code:    137',
            '      Started:      Thu, 05 Jun 2026 10:05:00 +0000',
            '      Finished:     Thu, 05 Jun 2026 10:05:01 +0000',
            '    Ready:          False',
            '    Restart Count:  2',
          ],
          explanation:
            "Reason: OOMKilled is the definitive signal. Exit Code 137 = 128 + 9 (SIGKILL). The fix is to increase resources.limits.memory or reduce the application's memory usage.",
          clusterState: {
            pods: [
              {
                id: 'oom-pod',
                name: 'oom-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Failed',
                labels: {},
                image: 'polinux/stress',
                restarts: 2,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'oom-pod: OOMKilling memory-hog container',
              'oom-pod: Back-off restarting failed container',
            ],
          },
        },
        {
          id: 'p8-m1-s8',
          title: 'Diagnose ImagePullBackOff',
          instruction:
            'Create a pod with a non-existent image tag. Read the Events to understand the exact pull error.',
          command: 'kubectl run bad-image --image=nginx:this-tag-does-not-exist-99999',
          output: [
            'NAME        READY   STATUS             RESTARTS   AGE',
            'bad-image   0/1     ImagePullBackOff   0          45s',
          ],
          explanation:
            'No restarts because the container never started — the image could not be pulled. kubectl describe pod bad-image shows the exact error in Events.',
          clusterState: {
            pods: [
              {
                id: 'bad-image',
                name: 'bad-image',
                namespace: 'default',
                node: 'node-1',
                status: 'Pending',
                labels: {},
                image: 'nginx:this-tag-does-not-exist-99999',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'bad-image: Failed to pull image "nginx:this-tag-does-not-exist-99999": not found',
              'bad-image: Error: ErrImagePull',
              'bad-image: Back-off pulling image "nginx:this-tag-does-not-exist-99999"',
            ],
          },
          tip: 'On the CKA exam, always check the Events in kubectl describe — they spell out the exact failure reason.',
        },
      ],
      quiz: [
        {
          id: 'p8-m1-q1',
          question:
            'A pod shows CrashLoopBackOff with 6 restarts. kubectl logs pod-name returns empty output. Why?',
          options: [
            'The container has no log driver configured',
            'The pod is in backoff window — the container is not currently running, so there are no live logs',
            'CrashLoopBackOff pods always produce empty logs',
            'You need to use kubectl logs --all-containers to see output',
          ],
          answer: 1,
          explanation:
            "After 6 restarts the backoff timer reaches ~5 minutes. During the wait window, the container is Waiting — not running — so there are no live logs. Use --previous to read the last terminated container's logs.",
        },
        {
          id: 'p8-m1-q2',
          question:
            'kubectl describe pod shows: Last State Terminated, Reason: OOMKilled, Exit Code: 137. What does exit code 137 represent?',
          options: [
            'The application exited with its own error code 137',
            '128 + signal 9 (SIGKILL) — the Linux kernel OOM killer forcibly terminated the process',
            'A Kubernetes reserved exit code meaning "resource limit exceeded"',
            '137 seconds of runtime before the container was stopped',
          ],
          answer: 1,
          explanation:
            'Exit code 137 = 128 + 9. In Linux, when a process is killed by a signal, the exit code is 128 + signal_number. SIGKILL is signal 9, so 128 + 9 = 137. The OOM killer sends SIGKILL.',
        },
        {
          id: 'p8-m1-q3',
          question:
            'A pod is stuck in Pending with this event: "0/3 nodes are available: 3 Insufficient memory." What is the correct fix?',
          options: [
            'kubectl cordon all nodes and uncordon them to reset scheduling',
            'Delete and recreate the pod — it will get scheduled eventually',
            'Reduce resources.requests.memory in the pod spec, or free up resources by removing other workloads',
            'Add a nodeSelector to target the node with most free memory',
          ],
          answer: 2,
          explanation:
            'The scheduler cannot place the pod because no node has enough allocatable memory to satisfy the request. Fix the root cause: reduce the memory request, or free up cluster resources. Deleting and recreating the pod will not change anything.',
        },
        {
          id: 'p8-m1-q4',
          question:
            'A multi-container pod named "web" has containers "nginx" and "sidecar". The sidecar is crashing. Which command gets the previous sidecar logs?',
          options: [
            'kubectl logs web --previous',
            'kubectl logs web -c sidecar --previous',
            'kubectl logs web/sidecar --all',
            'kubectl describe pod web --container=sidecar',
          ],
          answer: 1,
          explanation:
            'For multi-container pods, you must specify the container name with -c. The --previous flag reads the last terminated instance of that container. Without -c, kubectl logs defaults to the first container.',
        },
        {
          id: 'p8-m1-q5',
          question: 'A pod shows status "Init:0/2". What does this mean?',
          options: [
            'The main containers have 0 out of 2 replicas running',
            '0 out of 2 init containers have completed successfully',
            'The pod has 0 restarts out of a maximum of 2 allowed',
            '0 out of 2 readiness probes have passed',
          ],
          answer: 1,
          explanation:
            '"Init:0/2" means 0 of 2 init containers have completed. Init containers run sequentially before app containers. If the first init container fails, it blocks the rest and the pod never starts.',
        },
        {
          id: 'p8-m1-q6',
          question: 'Exit code 127 in a CrashLoopBackOff pod most likely indicates what?',
          options: [
            'The container was OOMKilled by the kernel',
            'The application exited cleanly with an error',
            'The command or entrypoint specified does not exist in the container image',
            'The container was terminated by a liveness probe failure',
          ],
          answer: 2,
          explanation:
            'Exit code 127 is the shell\'s "command not found" exit code. It means the binary or script specified in command/args does not exist in the container image. Check your entrypoint spelling and that the binary is installed in the image.',
        },
      ],
      exercises: [
        {
          id: 'p8-m1-e1',
          title: 'Debug: Fix a broken deployment with CrashLoopBackOff',
          kind: 'debug',
          goal: 'A deployment has been given a broken command. Find the failure, identify the root cause from logs, and patch the deployment to fix it.',
          commands: [
            'kubectl create deployment broken-app --image=busybox:1.36 --replicas=2 -- /bin/sh -c "nonexistent-binary --start"',
            'kubectl get pods -l app=broken-app',
            'kubectl logs -l app=broken-app --previous',
            'kubectl describe pod -l app=broken-app | grep -A5 "Last State"',
            'kubectl set image deployment/broken-app busybox=busybox:1.36',
            'kubectl patch deployment broken-app --type=json -p \'[{"op":"replace","path":"/spec/template/spec/containers/0/command","value":["/bin/sh","-c","echo ok && sleep 3600"]}]\'',
            'kubectl rollout status deployment/broken-app',
          ],
          verify: [
            'kubectl get pods -l app=broken-app shows 2/2 Running',
            'kubectl logs -l app=broken-app shows "ok"',
            'kubectl describe pod shows no CrashLoopBackOff events',
          ],
          expectedOutcome:
            'CrashLoopBackOff root-caused via --previous logs and exit code, deployment patched to healthy state.',
          cleanup: ['kubectl delete deployment broken-app --ignore-not-found'],
        },
        {
          id: 'p8-m1-e2',
          title: 'Debug: Identify and fix an OOMKilled pod',
          kind: 'debug',
          goal: 'Deploy a memory-hungry pod with a tight limit, confirm OOMKilled via describe, then raise the limit to fix it.',
          commands: [
            'kubectl apply -f - <<\'EOF\'\napiVersion: v1\nkind: Pod\nmetadata:\n  name: oom-debug\nspec:\n  containers:\n  - name: eater\n    image: polinux/stress\n    command: ["stress"]\n    args: ["--vm","1","--vm-bytes","200M","--vm-hang","1"]\n    resources:\n      limits:\n        memory: "50Mi"\n      requests:\n        memory: "25Mi"\nEOF',
            'kubectl get pod oom-debug -w',
            'kubectl describe pod oom-debug | grep -A3 "Last State"',
            'kubectl delete pod oom-debug --ignore-not-found',
            'kubectl run oom-fixed --image=polinux/stress --limits=memory=256Mi --requests=memory=128Mi -- stress --vm 1 --vm-bytes 100M --vm-hang 3600',
            'kubectl get pod oom-fixed',
          ],
          verify: [
            'kubectl describe pod oom-debug shows Reason: OOMKilled and Exit Code: 137',
            'kubectl get pod oom-fixed shows Running status',
          ],
          expectedOutcome:
            'OOMKilled confirmed via exit code 137, fixed by increasing memory limits.',
          cleanup: ['kubectl delete pod oom-debug oom-fixed --ignore-not-found'],
        },
        {
          id: 'p8-m1-e3',
          title: 'Debug: Unblock a Pending pod',
          kind: 'debug',
          goal: 'Create a pod that stays Pending due to an impossible nodeSelector, diagnose via events, and fix the selector.',
          commands: [
            'kubectl run pending-pod --image=nginx:1.27 --overrides=\'{"spec":{"nodeSelector":{"disktype":"ssd-nvme-nonexistent"}}}\'',
            'kubectl get pod pending-pod',
            'kubectl describe pod pending-pod | grep -A10 "Events:"',
            'kubectl get nodes --show-labels | grep disktype || echo "No nodes have disktype label"',
            'kubectl delete pod pending-pod --ignore-not-found',
            'kubectl run fixed-pod --image=nginx:1.27',
            'kubectl get pod fixed-pod',
          ],
          verify: [
            'kubectl describe pod pending-pod Events shows "FailedScheduling" with "node(s) didn\'t match Pod\'s node affinity/selector"',
            'kubectl get pod fixed-pod shows Running',
          ],
          expectedOutcome:
            'Pending pod diagnosed via FailedScheduling event, nodeSelector removed to unblock scheduling.',
          cleanup: ['kubectl delete pod pending-pod fixed-pod --ignore-not-found'],
        },
      ],
    },

    // ─── Module 2: Troubleshooting Networking ───────────────────────────────────
    {
      id: 'p8-m2',
      slug: 'troubleshooting-networking',
      title: 'Troubleshooting Networking',
      description:
        'Fix "connection refused", DNS lookup failures, and NetworkPolicy blocks using kubectl exec, port-forward, and endpoint inspection.',
      duration: '90 min',
      difficulty: 'advanced',
      learningObjectives: [
        'Verify Service → Endpoint → Pod connectivity end-to-end',
        'Diagnose wrong selector causing empty Endpoints list',
        'Debug DNS failures using nslookup and dig from inside pods',
        'Identify cross-namespace DNS format and CoreDNS failures',
        'Use kubectl port-forward to isolate Service vs Pod issues',
        'Detect NetworkPolicy as the cause of blocked traffic',
      ],
      keyConcepts: [
        'Service Endpoints: the list of Pod IPs a Service routes to — empty = wrong selector or no ready pods',
        'DNS format: <service>.<namespace>.svc.cluster.local — cross-namespace requires full FQDN',
        'CoreDNS: runs as a Deployment in kube-system; if it crashes, all DNS in cluster breaks',
        'NetworkPolicy: default-allow cluster; once any NetworkPolicy selects a pod, all non-matching traffic is denied',
        'kubectl port-forward bypasses Service and kube-proxy — useful to test if the Pod itself responds',
      ],
      practicePrompts: [
        'A Service returns "connection refused". What are the three possible root causes and how do you test each?',
        'nslookup my-db returns NXDOMAIN from within a pod in namespace "frontend". The service "my-db" is in namespace "backend". What is the correct DNS name?',
        'kubectl get endpoints my-svc shows "<none>". What does this mean and what do you check next?',
        'You added a NetworkPolicy. Now pods that were talking fine can no longer communicate. How do you verify NetworkPolicy is the cause?',
      ],
      masteryChecks: [
        'Can trace a broken Service using get → get endpoints → describe → exec curl in under 5 minutes',
        'Can identify wrong selector by comparing Service spec.selector with Pod labels',
        'Can use nslookup from inside a debug pod to test both short-name and FQDN DNS resolution',
        'Can identify CoreDNS pod failures and understand the cascading DNS breakage',
        'Can use kubectl port-forward to isolate a pod-level networking issue from a service issue',
        'Can check if a NetworkPolicy is blocking traffic by reading its podSelector and ingress/egress rules',
      ],
      theory: `> 🧠 **Brain Warm-Up**: A Service has three pods behind it. You curl the Service ClusterIP and get "connection refused". But if you curl one Pod IP directly, it works. Without running any commands, list the three possible root causes. Which one is most likely?

## Network Debugging Decision Tree

\`\`\`
curl <service-ip>:<port> fails (connection refused / timeout)
       │
       ├── Step 1: Check endpoints
       │   kubectl get endpoints <service-name>
       │   │
       │   ├── ENDPOINTS: <none> ──────────────────► Selector mismatch
       │   │                                          Compare: kubectl get svc -o yaml | grep selector
       │   │                                          vs:       kubectl get pods --show-labels
       │   │                                          Fix:      align selector with pod labels
       │   │
       │   └── ENDPOINTS: 10.244.x.x:8080 ─────────► Endpoints exist, problem is elsewhere
       │
       ├── Step 2: Test Pod directly (bypass Service)
       │   kubectl port-forward pod/<pod-name> 8080:8080
       │   curl localhost:8080
       │   │
       │   ├── WORKS ─────────────────────────────► Service port mapping is wrong
       │   │                                         Check: svc.spec.ports.targetPort vs container port
       │   │
       │   └── FAILS ─────────────────────────────► Pod is not serving on expected port
       │                                             kubectl exec -it <pod> -- ss -tlnp
       │                                             kubectl logs <pod>
       │
       └── Step 3: Check NetworkPolicy
           kubectl get networkpolicy -n <namespace>
           kubectl describe networkpolicy <name>
           Is the pod selected? Does ingress/egress allow this traffic?
\`\`\`

## DNS Debugging Decision Tree

\`\`\`
DNS lookup fails inside a pod
       │
       ├── Step 1: Is CoreDNS running?
       │   kubectl get pods -n kube-system -l k8s-app=kube-dns
       │   kubectl logs -n kube-system -l k8s-app=kube-dns
       │
       ├── Step 2: Test DNS from inside a pod
       │   kubectl exec -it <pod> -- nslookup kubernetes
       │   kubectl exec -it <pod> -- nslookup <service-name>
       │   kubectl exec -it <pod> -- nslookup <service>.<namespace>.svc.cluster.local
       │
       ├── Step 3: Cross-namespace DNS
       │   Short name:  my-db          (only works within same namespace)
       │   Full FQDN:   my-db.backend.svc.cluster.local  (works from any namespace)
       │
       └── Step 4: Check /etc/resolv.conf in the pod
           kubectl exec -it <pod> -- cat /etc/resolv.conf
           # Should show: nameserver 10.96.0.10 (kube-dns ClusterIP)
\`\`\`

## Service Selectors and Endpoints

A Service finds its Pods via \`spec.selector\`. If the selector does not match any Pod labels, \`kubectl get endpoints\` shows \`<none>\`:

\`\`\`bash
# Check the service selector
kubectl get svc my-svc -o jsonpath='{.spec.selector}'
# Output: {"app":"backend"}

# Check actual pod labels
kubectl get pods --show-labels
# NAME          READY   STATUS    LABELS
# backend-pod   1/1     Running   app=backend-v2,tier=app   ← label mismatch!

# Fix: update either the service selector or the pod labels
kubectl patch svc my-svc --type=merge -p '{"spec":{"selector":{"app":"backend-v2"}}}'
\`\`\`

## NetworkPolicy — Default-Deny Trap

Kubernetes defaults to **allow all**. The moment you apply a NetworkPolicy that selects a pod, all traffic not explicitly allowed is **denied**:

\`\`\`yaml
# This policy selects all pods in 'default' namespace
# and allows NO ingress traffic — effectively default-deny
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: default
spec:
  podSelector: {}    # selects ALL pods in namespace
  policyTypes:
  - Ingress
  # No ingress rules = deny all ingress
\`\`\`

To debug: \`kubectl describe networkpolicy\` and trace whether the traffic source/destination matches any rule.

## Useful Debugging Commands

\`\`\`bash
# Check Service and Endpoints together
kubectl get svc,endpoints my-svc

# Curl a service from inside a debug pod
kubectl run debug --image=curlimages/curl:8.7.1 --rm -it --restart=Never -- curl http://my-svc:80

# DNS lookup
kubectl run debug --image=busybox:1.36 --rm -it --restart=Never -- nslookup my-svc
kubectl run debug --image=busybox:1.36 --rm -it --restart=Never -- nslookup my-svc.default.svc.cluster.local

# Check what port the app is actually listening on
kubectl exec -it <pod> -- ss -tlnp
kubectl exec -it <pod> -- netstat -tlnp  # if available

# Port-forward to bypass Service routing
kubectl port-forward pod/<pod-name> 8080:80
\`\`\``,
      labSteps: [
        {
          id: 'p8-m2-s1',
          title: 'Create a broken service with wrong selector',
          instruction:
            'Deploy a pod with label app=backend, then create a service whose selector targets app=api (a different label). This is the most common networking mistake.',
          yamlContent: `# Pod with label app=backend
apiVersion: v1
kind: Pod
metadata:
  name: backend-pod
  namespace: default
  labels:
    app: backend
spec:
  containers:
  - name: server
    image: nginx:1.27
    ports:
    - containerPort: 80
---
# Service targeting app=api (WRONG — pod has app=backend)
apiVersion: v1
kind: Service
metadata:
  name: my-svc
  namespace: default
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 80`,
          output: ['pod/backend-pod created', 'service/my-svc created'],
          explanation:
            'The Service selector is app=api but the Pod has app=backend. The Service will have no Endpoints. Any curl to this Service will fail with connection refused.',
          clusterState: {
            pods: [
              {
                id: 'backend-pod',
                name: 'backend-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'my-svc',
                name: 'my-svc',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'api' },
                port: 80,
                clusterIP: '10.96.100.1',
              },
            ],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p8-m2-s2',
          title: 'Diagnose empty endpoints',
          instruction:
            'Check the endpoints. An empty endpoints list is the definitive sign of a selector mismatch.',
          command: 'kubectl get endpoints my-svc',
          output: ['NAME     ENDPOINTS   AGE', 'my-svc   <none>      30s'],
          explanation:
            '"<none>" means no Pods are selected by this Service\'s selector. The connection will always fail — kube-proxy has nowhere to route traffic. This is the first check for any "connection refused" error.',
          clusterState: {
            pods: [
              {
                id: 'backend-pod',
                name: 'backend-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'my-svc',
                name: 'my-svc',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'api' },
                port: 80,
                clusterIP: '10.96.100.1',
              },
            ],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
          tip: 'kubectl get svc,endpoints my-svc shows both in one command. Fast on the exam.',
        },
        {
          id: 'p8-m2-s3',
          title: 'Compare selector vs pod labels',
          instruction:
            'Compare the service selector with the actual pod labels to find the mismatch.',
          command:
            'kubectl get svc my-svc -o jsonpath=\'{.spec.selector}\' && echo "" && kubectl get pod backend-pod --show-labels',
          output: [
            '{"app":"api"}',
            'NAME          READY   STATUS    RESTARTS   LABELS',
            'backend-pod   1/1     Running   0          app=backend',
          ],
          explanation:
            "Service selector: app=api. Pod label: app=backend. These do not match — that's the bug. Fix: change the selector to app=backend to match the actual pod.",
          clusterState: {
            pods: [
              {
                id: 'backend-pod',
                name: 'backend-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'my-svc',
                name: 'my-svc',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'api' },
                port: 80,
                clusterIP: '10.96.100.1',
              },
            ],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p8-m2-s4',
          title: 'Fix the selector',
          instruction: 'Patch the service selector to match the pod label.',
          command:
            'kubectl patch svc my-svc --type=merge -p \'{"spec":{"selector":{"app":"backend"}}}\'',
          output: ['service/my-svc patched'],
          explanation:
            'The selector is now app=backend, which matches the pod label. The Service will immediately populate its Endpoints list.',
          clusterState: {
            pods: [
              {
                id: 'backend-pod',
                name: 'backend-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'my-svc',
                name: 'my-svc',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'backend' },
                port: 80,
                clusterIP: '10.96.100.1',
              },
            ],
            deployments: [],
            namespaces: ['default'],
            events: ['my-svc: Endpoints updated — 10.244.1.5:80'],
          },
        },
        {
          id: 'p8-m2-s5',
          title: 'Verify endpoints populated',
          instruction: 'Confirm the fix: endpoints now show the backend-pod IP.',
          command: 'kubectl get endpoints my-svc',
          output: ['NAME     ENDPOINTS        AGE', 'my-svc   10.244.1.5:80   2m'],
          explanation:
            'The endpoint is now populated with the pod IP and port. Traffic to my-svc:80 will route to backend-pod:80. The connection refused error is fixed.',
          clusterState: {
            pods: [
              {
                id: 'backend-pod',
                name: 'backend-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'my-svc',
                name: 'my-svc',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'backend' },
                port: 80,
                clusterIP: '10.96.100.1',
              },
            ],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p8-m2-s6',
          title: 'Test DNS resolution across namespaces',
          instruction:
            'Create a service in namespace "db" and try to reach it from the "default" namespace using both short name and FQDN.',
          command:
            'kubectl create namespace db && kubectl run db-server --image=nginx:1.27 --namespace=db --labels=app=db && kubectl expose pod db-server --port=80 --namespace=db --name=db-svc',
          output: ['namespace/db created', 'pod/db-server created', 'service/db-svc exposed'],
          explanation:
            'Creates a service "db-svc" in namespace "db". From the default namespace, the short name "db-svc" will fail DNS — you need the full FQDN.',
          clusterState: {
            pods: [
              {
                id: 'backend-pod',
                name: 'backend-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'db-server',
                name: 'db-server',
                namespace: 'db',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'db' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'db-svc',
                name: 'db-svc',
                namespace: 'db',
                type: 'ClusterIP',
                selector: { app: 'db' },
                port: 80,
                clusterIP: '10.96.200.1',
              },
            ],
            deployments: [],
            namespaces: ['default', 'db'],
            events: [],
          },
        },
        {
          id: 'p8-m2-s7',
          title: 'Test short name DNS (fails) vs FQDN (works)',
          instruction:
            'Run a debug pod in default namespace. Test both short name and FQDN DNS resolution to understand cross-namespace DNS.',
          command:
            'kubectl run dns-test --image=busybox:1.36 --rm -it --restart=Never -- /bin/sh -c "nslookup db-svc; echo ---; nslookup db-svc.db.svc.cluster.local"',
          output: [
            'Server:    10.96.0.10',
            'Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local',
            '',
            "nslookup: can't resolve 'db-svc'",
            '---',
            'Server:    10.96.0.10',
            'Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local',
            '',
            'Name:      db-svc.db.svc.cluster.local',
            'Address 1: 10.96.200.1 db-svc.db.svc.cluster.local',
          ],
          explanation:
            'Short name "db-svc" fails because DNS search domains only include the current namespace. The FQDN "db-svc.db.svc.cluster.local" works from any namespace. Always use FQDN for cross-namespace communication.',
          clusterState: {
            pods: [
              {
                id: 'backend-pod',
                name: 'backend-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'db-server',
                name: 'db-server',
                namespace: 'db',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'db' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'db-svc',
                name: 'db-svc',
                namespace: 'db',
                type: 'ClusterIP',
                selector: { app: 'db' },
                port: 80,
                clusterIP: '10.96.200.1',
              },
            ],
            deployments: [],
            namespaces: ['default', 'db'],
            events: [],
          },
          tip: 'DNS FQDN format: <service>.<namespace>.svc.cluster.local — memorize this for the CKA exam.',
        },
        {
          id: 'p8-m2-s8',
          title: 'Use port-forward to isolate pod vs service issues',
          instruction:
            'If you are not sure whether the problem is in the Service or the Pod, use port-forward to bypass the Service entirely and test the Pod directly.',
          command:
            'kubectl port-forward pod/backend-pod 8080:80 &\nsleep 1\ncurl -s http://localhost:8080 | head -5\nkill %1',
          output: [
            'Forwarding from 127.0.0.1:8080 -> 80',
            'Forwarding from [::1]:8080 -> 80',
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
          ],
          explanation:
            "port-forward creates a direct tunnel to the Pod, bypassing kube-proxy and the Service. If this works but the Service doesn't, the issue is in the Service (selector, port mapping). If this also fails, the Pod itself is the problem.",
          clusterState: {
            pods: [
              {
                id: 'backend-pod',
                name: 'backend-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'my-svc',
                name: 'my-svc',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'backend' },
                port: 80,
                clusterIP: '10.96.100.1',
              },
            ],
            deployments: [],
            namespaces: ['default', 'db'],
            events: [],
          },
        },
      ],
      quiz: [
        {
          id: 'p8-m2-q1',
          question: 'kubectl get endpoints my-svc shows "<none>". What is the most likely cause?',
          options: [
            'The pods behind the service are in a CrashLoopBackOff state',
            'The service selector does not match the labels on any running pod',
            'The service type is ClusterIP and can only be accessed from within the cluster',
            'CoreDNS is not running so the service cannot be resolved',
          ],
          answer: 1,
          explanation:
            "\"<none>\" endpoints means the Service selector matches zero pods. The pods may be running fine — but their labels don't match. Compare kubectl get svc -o jsonpath='{.spec.selector}' against kubectl get pods --show-labels.",
        },
        {
          id: 'p8-m2-q2',
          question:
            'A pod in namespace "frontend" tries to reach service "db" in namespace "backend" using the DNS name "db". It gets NXDOMAIN. What is the correct DNS name?',
          options: ['backend/db', 'db.backend', 'db.backend.svc.cluster.local', 'db.backend.svc'],
          answer: 2,
          explanation:
            'The full FQDN format is <service>.<namespace>.svc.cluster.local. Short names only resolve within the same namespace because the DNS search domain is set to <current-namespace>.svc.cluster.local.',
        },
        {
          id: 'p8-m2-q3',
          question:
            'You want to test if a Pod responds on port 8080, bypassing all Service and kube-proxy routing. Which command achieves this?',
          options: [
            'kubectl exec -it <pod> -- curl localhost:8080',
            'kubectl port-forward pod/<pod-name> 8080:8080',
            'kubectl expose pod <pod-name> --port=8080 --type=NodePort',
            "kubectl get pod <pod-name> -o jsonpath='{.status.podIP}'",
          ],
          answer: 1,
          explanation:
            "kubectl port-forward creates a direct tunnel from your local machine to the Pod, bypassing kube-proxy and any Services. If this works but the Service doesn't, the issue is in the Service configuration.",
        },
        {
          id: 'p8-m2-q4',
          question:
            'All pods in a namespace suddenly lose DNS resolution at the same time. What is the first thing to check?',
          options: [
            'kubectl get networkpolicy — a new policy may be blocking DNS port 53',
            'kubectl get pods -n kube-system -l k8s-app=kube-dns — CoreDNS may be down',
            'kubectl get svc — all services may have been deleted',
            'kubectl get nodes — the DNS node may have gone NotReady',
          ],
          answer: 1,
          explanation:
            'Cluster-wide simultaneous DNS failure strongly indicates CoreDNS is down. Check: kubectl get pods -n kube-system -l k8s-app=kube-dns. If CoreDNS pods are not Running, all cluster DNS breaks immediately.',
        },
        {
          id: 'p8-m2-q5',
          question:
            'After applying a NetworkPolicy with podSelector: {} and policyTypes: [Ingress] (no ingress rules), what happens to the selected pods?',
          options: [
            'All ingress traffic is allowed — an empty rules list means no restrictions',
            'All ingress traffic to matching pods is denied — no ingress rules means deny all ingress',
            'Only external traffic is denied — pod-to-pod traffic within the cluster is still allowed',
            'The NetworkPolicy has no effect — you need explicit deny rules',
          ],
          answer: 1,
          explanation:
            'This is the default-deny pattern. When a NetworkPolicy selects pods (even with podSelector: {} = all pods), and lists policyTypes without providing any rules, ALL traffic of that type is denied. No ingress rules = deny all ingress.',
        },
        {
          id: 'p8-m2-q6',
          question:
            'A Service has targetPort: 8080 but the container is actually listening on port 3000. The service port is 80. What symptom will you see?',
          options: [
            'ImagePullBackOff — Kubernetes cannot start the container',
            'Endpoints will be empty because no pods match the targetPort',
            'Endpoints are populated but connections are refused — traffic is forwarded to the wrong port',
            'The service will automatically detect the correct port',
          ],
          answer: 2,
          explanation:
            'Endpoints are determined by the selector, not the port. Pods will appear in the Endpoints list. But kube-proxy forwards traffic to port 8080, which nobody is listening on, so you get "connection refused". Fix: set targetPort to 3000.',
        },
      ],
      exercises: [
        {
          id: 'p8-m2-e1',
          title: 'Debug: Fix a service with wrong selector and targetPort',
          kind: 'debug',
          goal: "A deployment is running but the service can't reach it. Find both bugs: wrong selector AND wrong targetPort.",
          commands: [
            'kubectl create deployment api-server --image=nginx:1.27 --port=80',
            'kubectl expose deployment api-server --port=80 --target-port=8080 --name=api-broken-svc',
            'kubectl get endpoints api-broken-svc',
            'kubectl get svc api-broken-svc -o yaml | grep -A5 "selector:"',
            'kubectl get pods -l app=api-server --show-labels',
            'kubectl patch svc api-broken-svc --type=merge -p \'{"spec":{"selector":{"app":"api-server"},"ports":[{"port":80,"targetPort":80}]}}\'',
            'kubectl get endpoints api-broken-svc',
            'kubectl run test --image=curlimages/curl:8.7.1 --rm -it --restart=Never -- curl http://api-broken-svc:80',
          ],
          verify: [
            'kubectl get endpoints api-broken-svc shows a populated IP:80',
            'curl returns nginx welcome HTML',
          ],
          expectedOutcome: 'Service selector and targetPort fixed, curl succeeds.',
          cleanup: [
            'kubectl delete deployment api-server --ignore-not-found',
            'kubectl delete svc api-broken-svc --ignore-not-found',
          ],
        },
        {
          id: 'p8-m2-e2',
          title: 'Debug: Diagnose cross-namespace DNS failure',
          kind: 'debug',
          goal: "A pod can't resolve a service in another namespace using the short name. Fix the DNS name to use FQDN.",
          commands: [
            'kubectl create namespace payments',
            'kubectl run payment-api --image=nginx:1.27 --namespace=payments',
            'kubectl expose pod payment-api --port=80 --namespace=payments --name=payment-svc',
            'kubectl run client --image=busybox:1.36 --rm -it --restart=Never -- nslookup payment-svc',
            'kubectl run client --image=busybox:1.36 --rm -it --restart=Never -- nslookup payment-svc.payments.svc.cluster.local',
          ],
          verify: [
            "First nslookup shows \"can't resolve 'payment-svc'\"",
            'Second nslookup resolves successfully with the ClusterIP',
          ],
          expectedOutcome:
            'Cross-namespace DNS behavior understood: short name fails, FQDN succeeds.',
          cleanup: ['kubectl delete namespace payments --ignore-not-found'],
        },
        {
          id: 'p8-m2-e3',
          title: 'Debug: Identify NetworkPolicy blocking traffic',
          kind: 'debug',
          goal: 'Apply a default-deny NetworkPolicy, observe traffic breaking, then add an allow rule to restore it.',
          commands: [
            'kubectl run server --image=nginx:1.27 --labels=app=server',
            'kubectl expose pod server --port=80 --name=server-svc',
            'kubectl run client --image=curlimages/curl:8.7.1 --rm -it --restart=Never -- curl http://server-svc:80 -s -o /dev/null -w "%{http_code}"',
            "kubectl apply -f - <<'EOF'\napiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: deny-all\n  namespace: default\nspec:\n  podSelector:\n    matchLabels:\n      app: server\n  policyTypes:\n  - Ingress\nEOF",
            'kubectl run client --image=curlimages/curl:8.7.1 --rm -it --restart=Never -- curl http://server-svc:80 --connect-timeout 5',
            'kubectl describe networkpolicy deny-all',
            'kubectl get networkpolicy',
            'kubectl delete networkpolicy deny-all',
            'kubectl run client --image=curlimages/curl:8.7.1 --rm -it --restart=Never -- curl http://server-svc:80 -s -o /dev/null -w "%{http_code}"',
          ],
          verify: [
            'First curl returns 200 (before NetworkPolicy)',
            'Second curl times out or fails (after deny-all NetworkPolicy)',
            'Third curl returns 200 again (after NetworkPolicy deleted)',
          ],
          expectedOutcome:
            'NetworkPolicy as traffic blocker identified and removed to restore connectivity.',
          cleanup: [
            'kubectl delete pod server --ignore-not-found',
            'kubectl delete svc server-svc --ignore-not-found',
            'kubectl delete networkpolicy deny-all --ignore-not-found',
          ],
        },
      ],
    },

    // ─── Module 3: Troubleshooting Nodes ────────────────────────────────────────
    {
      id: 'p8-m3',
      slug: 'troubleshooting-nodes',
      title: 'Troubleshooting Nodes',
      description:
        'Diagnose NotReady nodes by reading kubelet logs, inspecting node conditions, and safely cordoning and draining problem nodes.',
      duration: '75 min',
      difficulty: 'advanced',
      learningObjectives: [
        'Read node conditions and map them to root causes',
        'Use journalctl -u kubelet to diagnose kubelet failures',
        'Understand the difference between MemoryPressure, DiskPressure, PIDPressure, and NetworkUnavailable',
        'Cordon a node to stop new scheduling and drain it safely',
        'Know what happens to pods on a NotReady node (eviction timeline)',
      ],
      keyConcepts: [
        'Node conditions: Ready, MemoryPressure, DiskPressure, PIDPressure, NetworkUnavailable',
        'NotReady cause #1: kubelet stopped — check systemd service status',
        'NotReady cause #2: resource pressure — disk/memory usage at threshold',
        'Cordon: marks node Unschedulable, does NOT evict existing pods',
        'Drain: cordons + evicts pods (respects PodDisruptionBudgets)',
        'Pod eviction from NotReady node: tolerationSeconds (default 300s) before eviction',
      ],
      practicePrompts: [
        'A node shows NotReady. What is your first command? What two things can cause this?',
        'kubectl describe node shows MemoryPressure=True. What does this mean for new pods? What does it mean for existing pods?',
        'What is the difference between kubectl cordon and kubectl drain? When would you use each?',
        'You need to do maintenance on a node. Walk through the exact sequence of commands.',
      ],
      masteryChecks: [
        'Can identify the cause of NotReady from kubectl describe node output in under 2 minutes',
        'Can read journalctl -u kubelet output and spot certificate errors, config errors, or API server connectivity issues',
        'Can cordon a node and verify no new pods schedule on it',
        'Can drain a node with --ignore-daemonsets --delete-emptydir-data and verify pods moved',
        'Can uncordon a node and verify it becomes schedulable again',
        'Can interpret node conditions: MemoryPressure, DiskPressure, PIDPressure, NetworkUnavailable',
      ],
      theory: `> 🧠 **Brain Warm-Up**: A node goes NotReady. You have 10 pods on it. Without any intervention, what happens to those pods? How long before Kubernetes tries to reschedule them? What is the mechanism — and what do node taints have to do with it?

## Node Conditions — The Diagnostic Map

\`\`\`bash
kubectl describe node <node-name>
# Look for the Conditions section:
\`\`\`

\`\`\`
Conditions:
  Type              Status  Reason                 Message
  ────────────────  ──────  ─────────────────────  ──────────────────────────────────
  MemoryPressure    False   KubeletHasSufficientMemory  kubelet has sufficient memory
  DiskPressure      False   KubeletHasNoDiskPressure    kubelet has no disk pressure
  PIDPressure       False   KubeletHasSufficientPID     kubelet has sufficient PID
  Ready             True    KubeletReady            kubelet is posting ready status
\`\`\`

A healthy node shows: MemoryPressure=False, DiskPressure=False, PIDPressure=False, Ready=True.

**NotReady root causes:**

| Condition | Status=True | Root Cause | Fix |
|---|---|---|---|
| MemoryPressure | True | Node RAM >~85% full | Evict pods, add memory |
| DiskPressure | True | Node disk >~85% full | Clean images (crictl rmi), remove old logs |
| PIDPressure | True | Too many processes (>PID max) | Kill runaway processes |
| NetworkUnavailable | True | CNI plugin failed | Restart CNI, check node network config |
| Ready | False | kubelet stopped | systemctl restart kubelet |

## Kubelet Diagnostics

When a node is NotReady, the kubelet is either dead or reporting failure. Always check:

\`\`\`bash
# On the node itself (via SSH or kubectl exec if accessible)
systemctl status kubelet
journalctl -u kubelet -n 50 --no-pager
journalctl -u kubelet --since "10 minutes ago" --no-pager
\`\`\`

Common kubelet log errors:

\`\`\`
# Certificate expired
E0605 10:00:00 kubelet.go:2448] Error getting node: Unauthorized
# → Rotate kubelet certificates

# Can't connect to API server
E0605 10:00:00 kubelet.go:2448] Unable to register node with API server
# → Check network connectivity to control plane, check kube-apiserver health

# Config error
Failed to load kubelet config file /var/lib/kubelet/config.yaml
# → Check kubelet config syntax

# CNI plugin failure
NetworkPlugin cni failed to set up pod network
# → Check CNI pod in kube-system is running
\`\`\`

## Node Maintenance — Cordon and Drain

\`\`\`
kubectl cordon <node>      # Marks node Unschedulable
                           # ✓ Existing pods keep running
                           # ✗ New pods will not schedule here

kubectl drain <node>       # Cordons + evicts all evictable pods
  --ignore-daemonsets      # Required: DaemonSet pods can't be moved
  --delete-emptydir-data   # Required if any pod uses emptyDir volumes
  --grace-period=30        # Seconds to wait for graceful termination
  --timeout=120s           # Abort if drain takes too long

kubectl uncordon <node>    # Marks node Schedulable again
\`\`\`

**What drain does NOT evict:**
- DaemonSet-managed pods (use --ignore-daemonsets to skip them)
- Pods with a PodDisruptionBudget that would be violated (drain will block and wait)
- Mirror pods (static pods managed by kubelet directly)

## Pod Eviction After NotReady

When a node goes NotReady, Kubernetes taints it with \`node.kubernetes.io/not-ready:NoExecute\`. Pods have a default \`tolerationSeconds: 300\` for this taint — they tolerate the taint for 5 minutes before being evicted and rescheduled elsewhere.`,
      labSteps: [
        {
          id: 'p8-m3-s1',
          title: 'Inspect node conditions',
          instruction: 'Check the status of all nodes in the cluster. Look for NotReady status.',
          command: 'kubectl get nodes',
          output: [
            'NAME        STATUS     ROLES           AGE   VERSION',
            'node-1      Ready      <none>          10d   v1.30.0',
            'node-2      NotReady   <none>          10d   v1.30.0',
          ],
          explanation:
            'node-2 is NotReady. This means the kubelet on node-2 has stopped reporting to the API server, or it is reporting a critical condition. All pods on node-2 will be evicted after 300 seconds.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['node-2: Node node-2 status is now: NodeNotReady'],
          },
        },
        {
          id: 'p8-m3-s2',
          title: 'Read node conditions with describe',
          instruction:
            'Use kubectl describe node to see the exact conditions and events on the NotReady node.',
          command: 'kubectl describe node node-2',
          output: [
            'Name:               node-2',
            'Roles:              <none>',
            'Labels:             kubernetes.io/hostname=node-2',
            '...',
            'Conditions:',
            '  Type              Status  LastHeartbeatTime    Reason                  Message',
            '  ----              ------  -----------------    ------                  -------',
            '  MemoryPressure    False   Thu, 05 Jun 2026...  KubeletHasSufficientMem...',
            '  DiskPressure      False   Thu, 05 Jun 2026...  KubeletHasNoDiskPressure...',
            '  PIDPressure       False   Thu, 05 Jun 2026...  KubeletHasSufficientPID...',
            '  Ready             False   Thu, 05 Jun 2026...  KubeletNotReady          kubelet stopped posting node status.',
            '...',
            'Events:',
            '  Normal   NodeNotReady  2m    node-lifecycle-controller  Node node-2 status is now: NodeNotReady',
          ],
          explanation:
            'Ready=False with Reason "KubeletNotReady: kubelet stopped posting node status" — the kubelet process is dead or unreachable. This is the most common exam scenario. SSH to the node and restart kubelet.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['node-2: Ready=False — kubelet stopped posting node status'],
          },
          tip: "The LastHeartbeatTime tells you when the kubelet last checked in. If it's minutes ago, the kubelet died around that time.",
        },
        {
          id: 'p8-m3-s3',
          title: 'Check kubelet status on the node',
          instruction: 'SSH to the problematic node and check the kubelet systemd service status.',
          command: 'ssh node-2 "systemctl status kubelet"',
          output: [
            '● kubelet.service - kubelet: The Kubernetes Node Agent',
            '     Loaded: loaded (/lib/systemd/system/kubelet.service)',
            '     Active: failed (Result: exit-code) since Thu 2026-06-05 09:55:00 UTC',
            '    Process: 12345 ExecStart=/usr/bin/kubelet ... (code=exited, status=1/FAILURE)',
            '',
            'Jun 05 09:55:00 node-2 kubelet[12345]: F0605 09:55:00.000000 12345 server.go:274]',
            '  failed to load Kubelet config file /var/lib/kubelet/config.yaml:',
            '  failed to load kubelet config: ...',
          ],
          explanation:
            'kubelet service is "failed" — it crashed on startup due to a bad config file. The log shows exactly which file and what error. Fix the config and restart.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['node-2: kubelet.service entered failed state'],
          },
          tip: 'journalctl -u kubelet -n 100 --no-pager gives you the last 100 log lines. This is your primary kubelet diagnostic tool on the CKA exam.',
        },
        {
          id: 'p8-m3-s4',
          title: 'Read kubelet logs for root cause',
          instruction: 'Get detailed kubelet logs to find the exact configuration error.',
          command: 'ssh node-2 "journalctl -u kubelet -n 50 --no-pager"',
          output: [
            'Jun 05 09:55:00 node-2 kubelet[12345]: E0605 09:55:00 server.go:205]',
            '  "Failed to load kubelet config file" err="failed to load config file',
            "  /var/lib/kubelet/config.yaml: couldn't get kubelet configuration",
            '  from file: open /var/lib/kubelet/config.yaml: no such file or directory"',
          ],
          explanation:
            'The kubelet config file is missing. On kubeadm clusters, /var/lib/kubelet/config.yaml must exist. It may have been accidentally deleted, or this is a new node that was never properly configured.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p8-m3-s5',
          title: 'Restart kubelet after fix',
          instruction:
            'After fixing the root cause (restoring config, fixing certificate, etc.), restart the kubelet service.',
          command:
            'ssh node-2 "systemctl daemon-reload && systemctl restart kubelet && systemctl status kubelet"',
          output: [
            '● kubelet.service - kubelet: The Kubernetes Node Agent',
            '     Active: active (running) since Thu 2026-06-05 10:05:00 UTC; 3s ago',
            'Jun 05 10:05:00 node-2 kubelet: I0605 10:05:00 server.go:425]',
            '  "Kubelet version" kubeletVersion="v1.30.0"',
          ],
          explanation:
            'kubelet is now active (running). Within 30-60 seconds, the node will report its status to the API server and transition back to Ready.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['node-2: kubelet restarted', 'node-2: Node node-2 status is now: NodeReady'],
          },
        },
        {
          id: 'p8-m3-s6',
          title: 'Verify node recovery',
          instruction: 'Back on the control plane, confirm node-2 is Ready again.',
          command: 'kubectl get nodes',
          output: [
            'NAME        STATUS   ROLES           AGE   VERSION',
            'node-1      Ready    <none>          10d   v1.30.0',
            'node-2      Ready    <none>          10d   v1.30.0',
          ],
          explanation:
            'Both nodes are Ready. Kubernetes will now schedule new pods on node-2 again. Pods that were evicted during the downtime have already been rescheduled on node-1.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['node-2: Node node-2 status is now: NodeReady'],
          },
        },
        {
          id: 'p8-m3-s7',
          title: 'Cordon a node for maintenance',
          instruction:
            'Before doing maintenance, cordon the node to prevent new pod scheduling. Then drain it to safely evict existing pods.',
          command:
            'kubectl cordon node-1 && kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data',
          output: [
            'node/node-1 cordoned',
            'node/node-1 already cordoned',
            'WARNING: ignoring DaemonSet-managed Pods: kube-system/kube-proxy-xxxxx',
            'evicting pod default/backend-pod',
            'pod/backend-pod evicted',
            'node/node-1 drained',
          ],
          explanation:
            'Cordon marks the node Unschedulable. Drain evicts all pods except DaemonSet pods (which cannot move). The --ignore-daemonsets flag is required or drain refuses to proceed.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['node-1: marked unschedulable', 'node-1: evicting pod default/backend-pod'],
          },
          tip: 'Always use both flags: --ignore-daemonsets --delete-emptydir-data. Forgetting either is a common exam mistake that causes drain to fail.',
        },
        {
          id: 'p8-m3-s8',
          title: 'Uncordon the node after maintenance',
          instruction:
            'After maintenance is complete, uncordon the node to allow scheduling again.',
          command: 'kubectl uncordon node-1',
          output: ['node/node-1 uncordoned'],
          explanation:
            'The node is Schedulable again. New pods will start being assigned to it. Existing pods that were evicted remain on node-2 — Kubernetes does not rebalance automatically.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['node-1: marked schedulable'],
          },
        },
      ],
      quiz: [
        {
          id: 'p8-m3-q1',
          question:
            'A node shows NotReady. kubectl describe node shows Ready=False with message "kubelet stopped posting node status." What is the most likely cause and first action?',
          options: [
            'A NetworkPolicy is blocking the kubelet — delete all NetworkPolicies',
            'The kubelet process on the node has stopped — SSH to the node and run: systemctl restart kubelet',
            'The node ran out of disk space — delete old container images with crictl rmi',
            'The etcd cluster lost quorum — restore etcd from backup',
          ],
          answer: 1,
          explanation:
            '"kubelet stopped posting node status" means the kubelet heartbeat to the API server stopped. The kubelet is either dead or crashed. SSH to the node, run systemctl status kubelet and journalctl -u kubelet to diagnose, then restart the service.',
        },
        {
          id: 'p8-m3-q2',
          question: 'Which command reads the last 50 lines of kubelet logs on a Linux node?',
          options: [
            'kubectl logs node/<node-name> --tail=50',
            'journalctl -u kubelet -n 50 --no-pager',
            'kubectl describe node <node-name> | tail -50',
            'cat /var/log/kubelet.log | tail -50',
          ],
          answer: 1,
          explanation:
            'kubelet is a systemd service. Its logs are managed by journald. journalctl -u kubelet is the correct tool. -n 50 shows last 50 lines, --no-pager prevents paging in non-interactive sessions.',
        },
        {
          id: 'p8-m3-q3',
          question: 'What is the difference between kubectl cordon and kubectl drain?',
          options: [
            'cordon evicts pods, drain just marks the node unschedulable',
            'cordon marks the node Unschedulable (existing pods remain), drain cordons AND evicts all evictable pods',
            'They are synonyms — both do the same thing',
            'cordon is for worker nodes, drain is for control plane nodes',
          ],
          answer: 1,
          explanation:
            'cordon = mark node Unschedulable (no new pods, existing pods untouched). drain = cordon first, then evict all pods that can be evicted. Use cordon when you need to stop scheduling temporarily. Use drain before rebooting a node.',
        },
        {
          id: 'p8-m3-q4',
          question:
            'kubectl drain node-1 fails with: "cannot delete Pods not managed by ReplicationController, ReplicaSet, Job, DaemonSet or StatefulSet." What flag do you add?',
          options: [
            '--force (deletes pods even without a controller)',
            '--ignore-daemonsets',
            '--delete-emptydir-data',
            '--grace-period=0',
          ],
          answer: 0,
          explanation:
            'Bare pods (not managed by any controller) block drain because there is no controller to recreate them elsewhere. --force tells drain to delete them anyway. Use with caution — the pod will be permanently deleted. In the CKA exam, this flag is often needed alongside --ignore-daemonsets.',
        },
        {
          id: 'p8-m3-q5',
          question:
            'A node shows DiskPressure=True. What immediate effect does this have on pod scheduling?',
          options: [
            'Kubernetes taints the node with node.kubernetes.io/disk-pressure:NoSchedule, preventing new pod scheduling',
            'All pods on the node are immediately evicted',
            'Only stateful pods with persistent volumes are evicted',
            'The node is marked NotReady and no longer accepts any traffic',
          ],
          answer: 0,
          explanation:
            'When disk pressure is detected, the node controller automatically taints the node with disk-pressure:NoSchedule. No new pods will schedule there. Existing pods continue running unless eviction thresholds are crossed (hard eviction). The node stays Ready but is Tainted.',
        },
        {
          id: 'p8-m3-q6',
          question:
            'After a node goes NotReady, how long does a pod with default tolerations have before it is evicted and rescheduled?',
          options: [
            'Immediately — pods on NotReady nodes are evicted right away',
            '60 seconds — the default pod termination grace period',
            '300 seconds (5 minutes) — the default tolerationSeconds for the not-ready taint',
            '600 seconds — the node eviction timeout',
          ],
          answer: 2,
          explanation:
            'When a node goes NotReady, Kubernetes taints it with node.kubernetes.io/not-ready:NoExecute. By default, pods tolerate this taint for 300 seconds (tolerationSeconds: 300). After 5 minutes without the node recovering, pods are evicted and rescheduled.',
        },
      ],
      exercises: [
        {
          id: 'p8-m3-e1',
          title: 'Debug: Read node conditions and diagnose the failure',
          kind: 'debug',
          goal: 'Inspect node conditions systematically and identify which condition indicates the problem.',
          commands: [
            'kubectl get nodes',
            'kubectl describe node node-1 | grep -A15 "Conditions:"',
            'kubectl describe node node-1 | grep -A20 "Events:"',
            'kubectl get events --field-selector involvedObject.kind=Node',
            'kubectl get pods -o wide | grep node-1',
          ],
          verify: [
            'kubectl get nodes output reviewed',
            'Conditions section shows status of MemoryPressure, DiskPressure, PIDPressure, Ready',
            'Events section shows NodeReady or NodeNotReady transitions',
          ],
          expectedOutcome: 'Node conditions interpreted and failure type identified.',
          cleanup: [],
        },
        {
          id: 'p8-m3-e2',
          title: 'Debug: Safely drain and uncordon a node',
          kind: 'debug',
          goal: 'Practice the full maintenance workflow: deploy workloads, cordon, drain, confirm pods moved, uncordon.',
          commands: [
            'kubectl create deployment workload --image=nginx:1.27 --replicas=3',
            'kubectl get pods -o wide',
            'kubectl cordon node-2',
            'kubectl get nodes',
            'kubectl drain node-2 --ignore-daemonsets --delete-emptydir-data',
            'kubectl get pods -o wide',
            'kubectl uncordon node-2',
            'kubectl get nodes',
          ],
          verify: [
            'After cordon: kubectl get nodes shows node-2 as SchedulingDisabled',
            'After drain: all workload pods running on node-1',
            'After uncordon: node-2 shows Ready without SchedulingDisabled',
          ],
          expectedOutcome: 'Full cordon/drain/uncordon workflow completed without data loss.',
          cleanup: ['kubectl delete deployment workload --ignore-not-found'],
        },
        {
          id: 'p8-m3-e3',
          title: 'Debug: Node taint impact on scheduling',
          kind: 'debug',
          goal: 'Add a taint to a node, observe pods not scheduling, then add a toleration to allow scheduling.',
          commands: [
            'kubectl taint node node-2 maintenance=true:NoSchedule',
            'kubectl run tainted-test --image=nginx:1.27',
            'kubectl get pod tainted-test -o wide',
            'kubectl describe pod tainted-test | grep -A5 "Events:"',
            'kubectl delete pod tainted-test --ignore-not-found',
            'kubectl run tolerated-test --image=nginx:1.27 --overrides=\'{"spec":{"tolerations":[{"key":"maintenance","operator":"Equal","value":"true","effect":"NoSchedule"}]}}\'',
            'kubectl get pod tolerated-test -o wide',
            'kubectl taint node node-2 maintenance=true:NoSchedule-',
          ],
          verify: [
            'tainted-test shows Pending with "1 node(s) had untolerated taint" in events',
            'tolerated-test schedules on node-2',
            'kubectl get nodes shows node-2 schedulable after taint removal',
          ],
          expectedOutcome: 'Taint and toleration interaction understood and demonstrated.',
          cleanup: [
            'kubectl delete pod tainted-test tolerated-test --ignore-not-found',
            'kubectl taint node node-2 maintenance- --ignore-not-found || true',
          ],
        },
      ],
    },

    // ─── Module 4: Troubleshooting the Cluster (Control Plane) ──────────────────
    {
      id: 'p8-m4',
      slug: 'troubleshooting-cluster',
      title: 'Troubleshooting the Control Plane',
      description:
        'Diagnose kube-apiserver, kube-scheduler, kube-controller-manager, and etcd failures. Fix broken static pod manifests and verify control plane health.',
      duration: '90 min',
      difficulty: 'advanced',
      learningObjectives: [
        'Locate and read static pod manifests in /etc/kubernetes/manifests/',
        'Diagnose kube-apiserver failure: certificate error, wrong etcd endpoint, bad flag',
        'Check control plane component health via kubectl get componentstatuses and pod inspection',
        'Verify etcd health using etcdctl',
        "Understand why kubectl can't connect to server and the diagnostic sequence",
        'Fix a broken static pod manifest and verify control plane recovery',
      ],
      keyConcepts: [
        'Static pods: manifests in /etc/kubernetes/manifests/ — kubelet watches this directory',
        'Control plane components run as static pods on the control plane node',
        'kube-apiserver failure = kubectl stops working entirely',
        'etcdctl: requires --endpoints, --cacert, --cert, --key flags to authenticate',
        'kubeconfig: ~/.kube/config — wrong server address causes "unable to connect to server"',
      ],
      practicePrompts: [
        'kubectl get nodes returns "The connection to the server was refused." What are three possible causes?',
        'You accidentally edit /etc/kubernetes/manifests/kube-apiserver.yaml with a typo. What happens next? How do you fix it?',
        'How do you check if etcd is healthy from the control plane node?',
        'kube-scheduler is not running. New pods stay Pending. Which static pod manifest do you check? Where is it?',
      ],
      masteryChecks: [
        'Can locate all four control plane static pod manifests and understand what each component does',
        'Can diagnose kube-apiserver failure by checking: (1) pod status, (2) kubelet journal, (3) manifest file for typos',
        'Can run etcdctl endpoint health with correct TLS flags',
        'Can fix a broken static pod manifest and wait for kubelet to detect the change and restart the pod',
        "Can check kubectl can't connect and identify whether the issue is API server or kubeconfig",
        'Can interpret kubectl get componentstatuses (or kubectl get cs) output',
      ],
      theory: `> 🧠 **Brain Warm-Up**: The kube-apiserver static pod manifest in /etc/kubernetes/manifests/kube-apiserver.yaml has a typo in the \`--etcd-servers\` flag. Walk through exactly what happens next — which component notices the error, what the error looks like, and what the observable symptoms are before you even run a single kubectl command.

## Control Plane Architecture

\`\`\`
┌─────────────────────────── Control Plane Node ─────────────────────────────┐
│                                                                             │
│  /etc/kubernetes/manifests/            Static Pod Manifests                 │
│  ├── kube-apiserver.yaml    ─────────► API Server (port 6443)               │
│  ├── kube-scheduler.yaml    ─────────► Scheduler                            │
│  ├── kube-controller-manager.yaml ──► Controller Manager                   │
│  └── etcd.yaml              ─────────► etcd (port 2379)                     │
│                                                                             │
│  kubelet watches /etc/kubernetes/manifests/ and ensures these pods run.     │
│  They appear in: kubectl get pods -n kube-system                            │
│                                                                             │
│  Certificates:    /etc/kubernetes/pki/                                      │
│  kubeconfig:      /etc/kubernetes/admin.conf → ~/.kube/config               │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## Diagnostic Sequence When kubectl Fails

\`\`\`
kubectl get nodes returns: "The connection to the server 127.0.0.1:6443 was refused"
       │
       ├── Step 1: Is kube-apiserver running?
       │   kubectl get pods -n kube-system | grep apiserver
       │   crictl ps | grep apiserver            (on the control plane node)
       │
       ├── Step 2: Check the static pod manifest
       │   cat /etc/kubernetes/manifests/kube-apiserver.yaml
       │   Look for: typos in flags, wrong file paths, wrong etcd endpoint
       │
       ├── Step 3: Check kubelet logs for manifest errors
       │   journalctl -u kubelet -n 100 | grep -i "error\|fail\|apiserver"
       │
       ├── Step 4: Check kubeconfig
       │   cat ~/.kube/config | grep server
       │   Should be: https://127.0.0.1:6443 (or the control plane IP)
       │
       └── Step 5: Check etcd health
           ETCDCTL_API=3 etcdctl endpoint health \\
             --endpoints=https://127.0.0.1:2379 \\
             --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
             --cert=/etc/kubernetes/pki/etcd/server.crt \\
             --key=/etc/kubernetes/pki/etcd/server.key
\`\`\`

## Static Pod Manifests — How They Work

The kubelet has a \`--pod-manifest-path\` (or \`staticPodPath\` in config.yaml) pointing to \`/etc/kubernetes/manifests/\`. The kubelet watches this directory:

- **Add a file** → kubelet creates the pod within seconds
- **Edit a file** → kubelet detects the change and recreates the pod
- **Delete a file** → kubelet terminates the pod

This is why control plane components survive API server restarts — they are managed directly by kubelet, not by the API server.

**Important**: Changes take effect when kubelet detects the file change. You do NOT need to restart kubelet for manifest changes.

## Common Control Plane Failures

\`\`\`bash
# kube-apiserver won't start after manifest edit
journalctl -u kubelet | grep kube-apiserver
# Error: open /etc/kubernetes/pki/apiserver.crt: no such file or directory
# → Wrong certificate path in manifest

# kube-apiserver: flag error
# flag provided but not defined: --etcd-serverss (typo)
# → Edit manifest, fix the typo, kubelet recreates the pod

# kube-scheduler: can't connect to API server
# Failed to get delegated authentication kubeconfig
# → kube-apiserver may be down, fix API server first

# etcd: member list fails
# context deadline exceeded
# → etcd data dir corrupted or network issue
\`\`\`

## Checking Control Plane Health

\`\`\`bash
# Quick overview of control plane pods
kubectl get pods -n kube-system

# Component status (may show unhealthy for deprecated endpoints)
kubectl get componentstatuses

# Check individual component pod logs
kubectl logs -n kube-system kube-scheduler-<node-name>
kubectl logs -n kube-system kube-controller-manager-<node-name>

# etcd health check (from control plane node)
ETCDCTL_API=3 etcdctl endpoint health \\
  --endpoints=https://127.0.0.1:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key

# etcd member list
ETCDCTL_API=3 etcdctl member list \\
  --endpoints=https://127.0.0.1:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key
\`\`\``,
      labSteps: [
        {
          id: 'p8-m4-s1',
          title: 'Explore control plane static pod manifests',
          instruction:
            'List the static pod manifests on the control plane node. These four files define the entire control plane.',
          command: 'ls -la /etc/kubernetes/manifests/',
          output: [
            'total 32',
            '-rw------- 1 root root 3936 Jun  5 09:00 etcd.yaml',
            '-rw------- 1 root root 4228 Jun  5 09:00 kube-apiserver.yaml',
            '-rw------- 1 root root 3384 Jun  5 09:00 kube-controller-manager.yaml',
            '-rw------- 1 root root 1463 Jun  5 09:00 kube-scheduler.yaml',
          ],
          explanation:
            'These four YAML files define the control plane. kubelet watches this directory. Edit any file and kubelet will recreate the corresponding pod within seconds. This is the first place to look during control plane incidents.',
          clusterState: {
            pods: [
              {
                id: 'kube-apiserver-cp',
                name: 'kube-apiserver-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Running',
                labels: { component: 'kube-apiserver' },
                image: 'registry.k8s.io/kube-apiserver:v1.30.0',
                restarts: 0,
              },
              {
                id: 'kube-scheduler-cp',
                name: 'kube-scheduler-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Running',
                labels: { component: 'kube-scheduler' },
                image: 'registry.k8s.io/kube-scheduler:v1.30.0',
                restarts: 0,
              },
              {
                id: 'kube-cm-cp',
                name: 'kube-controller-manager-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Running',
                labels: { component: 'kube-controller-manager' },
                image: 'registry.k8s.io/kube-controller-manager:v1.30.0',
                restarts: 0,
              },
              {
                id: 'etcd-cp',
                name: 'etcd-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Running',
                labels: { component: 'etcd' },
                image: 'registry.k8s.io/etcd:3.5.12-0',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system'],
            events: [],
            highlightedComponent: 'apiserver',
          },
          tip: 'On the CKA exam, control plane nodes in kubeadm clusters always have manifests in /etc/kubernetes/manifests/. You will often need to fix a typo or wrong path in one of these files.',
        },
        {
          id: 'p8-m4-s2',
          title: 'Inspect kube-apiserver manifest',
          instruction:
            'Read the kube-apiserver static pod manifest. Understand the key flags: --etcd-servers, --tls-cert-file, --service-cluster-ip-range.',
          command:
            'grep -E "etcd-servers|tls-cert|advertise-address|port" /etc/kubernetes/manifests/kube-apiserver.yaml',
          output: [
            '    - --advertise-address=10.0.0.10',
            '    - --etcd-servers=https://127.0.0.1:2379',
            '    - --tls-cert-file=/etc/kubernetes/pki/apiserver.crt',
            '    - --tls-private-key-file=/etc/kubernetes/pki/apiserver.key',
            '    - --secure-port=6443',
          ],
          explanation:
            'Key flags to know: --etcd-servers (must match the etcd listening address), --tls-cert-file (certificate path — if wrong, apiserver fails to start), --advertise-address (control plane node IP). A typo in any of these is a common exam scenario.',
          clusterState: {
            pods: [
              {
                id: 'kube-apiserver-cp',
                name: 'kube-apiserver-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Running',
                labels: { component: 'kube-apiserver' },
                image: 'registry.k8s.io/kube-apiserver:v1.30.0',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system'],
            events: [],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p8-m4-s3',
          title: 'Simulate a broken kube-apiserver manifest',
          instruction:
            'Introduce a typo in the --etcd-servers flag (a common exam scenario). This will cause kube-apiserver to crash.',
          command:
            "cp /etc/kubernetes/manifests/kube-apiserver.yaml /tmp/kube-apiserver.yaml.bak\nsed -i 's/--etcd-servers=https:\\/\\/127.0.0.1:2379/--etcd-serverss=https:\\/\\/127.0.0.1:2379/' /etc/kubernetes/manifests/kube-apiserver.yaml",
          output: ['(no output — file edited in place)'],
          explanation:
            '--etcd-servers was changed to --etcd-serverss (double s). This is an unknown flag. kube-apiserver will fail to start. kubelet will try to restart it repeatedly.',
          clusterState: {
            pods: [
              {
                id: 'kube-apiserver-cp',
                name: 'kube-apiserver-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Failed',
                labels: { component: 'kube-apiserver' },
                image: 'registry.k8s.io/kube-apiserver:v1.30.0',
                restarts: 3,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system'],
            events: ['kube-apiserver-controlplane: Failed to start: unknown flag: --etcd-serverss'],
            highlightedComponent: 'apiserver',
          },
          tip: 'In the CKA exam, the control plane will usually have a pre-broken manifest that you must find and fix. Start with the component that is NotRunning.',
        },
        {
          id: 'p8-m4-s4',
          title: 'Observe kubectl failure when API server is down',
          instruction:
            'After the apiserver crashes, all kubectl commands fail. This is the symptom you need to recognize.',
          command: 'kubectl get nodes',
          output: [
            'The connection to the server 127.0.0.1:6443 was refused - did you specify the right host or port?',
          ],
          explanation:
            '"Connection refused" on port 6443 = kube-apiserver is not running or not listening. kubectl talks exclusively to the API server — if it\'s down, no kubectl commands work. On the control plane node, use crictl or journalctl to diagnose without kubectl.',
          clusterState: {
            pods: [
              {
                id: 'kube-apiserver-cp',
                name: 'kube-apiserver-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Failed',
                labels: { component: 'kube-apiserver' },
                image: 'registry.k8s.io/kube-apiserver:v1.30.0',
                restarts: 5,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system'],
            events: ['kube-apiserver: cannot listen on TCP: flag unknown: --etcd-serverss'],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p8-m4-s5',
          title: 'Diagnose via crictl and journalctl (no kubectl)',
          instruction:
            'When kubectl is unavailable, use crictl (container runtime) and journalctl (kubelet logs) to diagnose the issue.',
          command:
            'crictl ps -a | grep apiserver\njournalctl -u kubelet -n 30 --no-pager | grep -i "apiserver\\|error"',
          output: [
            'CONTAINER   IMAGE                CREATED   STATE    NAME              ATTEMPT',
            'abc123def   kube-apiserver:...   5s ago    Exited   kube-apiserver    6',
            '',
            'Jun 05 10:15:00 cp kubelet[999]: E0605 kube-apiserver[12345]:',
            '  unknown flag: --etcd-serverss',
          ],
          explanation:
            'crictl ps -a shows all containers including exited ones (like kubectl get pods but without the API server). journalctl -u kubelet shows why the container keeps failing. The error "unknown flag: --etcd-serverss" points directly to the manifest typo.',
          clusterState: {
            pods: [
              {
                id: 'kube-apiserver-cp',
                name: 'kube-apiserver-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Failed',
                labels: { component: 'kube-apiserver' },
                image: 'registry.k8s.io/kube-apiserver:v1.30.0',
                restarts: 6,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system'],
            events: [],
            highlightedComponent: 'apiserver',
          },
          tip: 'crictl is your fallback when kubectl is unavailable. On kubeadm clusters: crictl ps, crictl logs <container-id>, crictl inspect <container-id>.',
        },
        {
          id: 'p8-m4-s6',
          title: 'Fix the broken manifest',
          instruction:
            'Correct the typo in the kube-apiserver manifest. kubelet will detect the change and recreate the pod automatically.',
          command:
            "sed -i 's/--etcd-serverss=/--etcd-servers=/' /etc/kubernetes/manifests/kube-apiserver.yaml",
          output: ['(no output — file edited in place)'],
          explanation:
            'The typo is fixed. kubelet watches /etc/kubernetes/manifests/ via inotify. Within seconds it will detect the change and terminate the failing container, then start a new one with the corrected manifest.',
          clusterState: {
            pods: [
              {
                id: 'kube-apiserver-cp',
                name: 'kube-apiserver-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Pending',
                labels: { component: 'kube-apiserver' },
                image: 'registry.k8s.io/kube-apiserver:v1.30.0',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system'],
            events: ['kube-apiserver-controlplane: kubelet recreating pod after manifest change'],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p8-m4-s7',
          title: 'Wait for kube-apiserver recovery',
          instruction:
            'Watch the kube-apiserver pod recover. It takes 30-60 seconds for the pod to start and begin accepting requests.',
          command: 'watch -n2 "kubectl get pods -n kube-system | grep apiserver"',
          output: [
            'NAME                              READY   STATUS    RESTARTS   AGE',
            'kube-apiserver-controlplane       0/1     Pending   0          5s',
            '...',
            'kube-apiserver-controlplane       1/1     Running   0          45s',
          ],
          explanation:
            'The pod transitions from Pending → ContainerCreating → Running. Once Running, kubectl works again cluster-wide.',
          clusterState: {
            pods: [
              {
                id: 'kube-apiserver-cp',
                name: 'kube-apiserver-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Running',
                labels: { component: 'kube-apiserver' },
                image: 'registry.k8s.io/kube-apiserver:v1.30.0',
                restarts: 0,
              },
              {
                id: 'kube-scheduler-cp',
                name: 'kube-scheduler-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Running',
                labels: { component: 'kube-scheduler' },
                image: 'registry.k8s.io/kube-scheduler:v1.30.0',
                restarts: 0,
              },
              {
                id: 'kube-cm-cp',
                name: 'kube-controller-manager-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Running',
                labels: { component: 'kube-controller-manager' },
                image: 'registry.k8s.io/kube-controller-manager:v1.30.0',
                restarts: 0,
              },
              {
                id: 'etcd-cp',
                name: 'etcd-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Running',
                labels: { component: 'etcd' },
                image: 'registry.k8s.io/etcd:3.5.12-0',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system'],
            events: ['kube-apiserver-controlplane: Started container kube-apiserver'],
            highlightedComponent: 'apiserver',
          },
          tip: 'After fixing a control plane manifest, always wait and verify with kubectl get pods -n kube-system before declaring the fix complete.',
        },
        {
          id: 'p8-m4-s8',
          title: 'Check etcd health',
          instruction:
            'Verify etcd is healthy using etcdctl. This requires TLS credentials from /etc/kubernetes/pki/etcd/.',
          command:
            'ETCDCTL_API=3 etcdctl endpoint health \\\n  --endpoints=https://127.0.0.1:2379 \\\n  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\\n  --cert=/etc/kubernetes/pki/etcd/server.crt \\\n  --key=/etc/kubernetes/pki/etcd/server.key',
          output: [
            'https://127.0.0.1:2379 is healthy: successfully committed proposal: took = 2.345ms',
          ],
          explanation:
            '"is healthy" confirms etcd is running, accepting proposals, and committing them to the Raft log. You must provide all three TLS flags — etcd requires mTLS. These cert paths are always in /etc/kubernetes/pki/etcd/ on kubeadm clusters.',
          clusterState: {
            pods: [
              {
                id: 'etcd-cp',
                name: 'etcd-controlplane',
                namespace: 'kube-system',
                node: 'node-1',
                status: 'Running',
                labels: { component: 'etcd' },
                image: 'registry.k8s.io/etcd:3.5.12-0',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system'],
            events: [],
            highlightedComponent: 'etcd',
          },
          tip: 'Memorize the etcdctl health check command for the CKA exam. Set ETCDCTL_API=3 first — without it, etcdctl defaults to v2 API which behaves differently.',
        },
      ],
      quiz: [
        {
          id: 'p8-m4-q1',
          question:
            'kubectl get nodes returns "The connection to the server 127.0.0.1:6443 was refused." What is the first thing to check?',
          options: [
            'Check if the cluster nodes are online with ping',
            'Verify the kube-apiserver static pod manifest has no typos and the apiserver container is running',
            'Delete and recreate the kubeconfig file at ~/.kube/config',
            'Restart the etcd service: systemctl restart etcd',
          ],
          answer: 1,
          explanation:
            'Port 6443 is where kube-apiserver listens. "Connection refused" = kube-apiserver is not running or not listening on that port. Check: crictl ps | grep apiserver, then journalctl -u kubelet | grep apiserver, then inspect /etc/kubernetes/manifests/kube-apiserver.yaml.',
        },
        {
          id: 'p8-m4-q2',
          question:
            'You fix a typo in /etc/kubernetes/manifests/kube-apiserver.yaml. What action do you need to take next?',
          options: [
            'Run: kubectl apply -f /etc/kubernetes/manifests/kube-apiserver.yaml',
            'Run: systemctl restart kubelet to trigger the manifest reload',
            'Nothing — kubelet watches the manifests directory and recreates the pod automatically',
            'Run: kubectl delete pod kube-apiserver -n kube-system to trigger recreation',
          ],
          answer: 2,
          explanation:
            'kubelet uses inotify to watch /etc/kubernetes/manifests/. Any change to a file triggers automatic pod deletion and recreation with the new manifest. You do NOT need to restart kubelet or use kubectl (which may not be available if apiserver was down).',
        },
        {
          id: 'p8-m4-q3',
          question:
            'New pods are being created but they stay Pending forever without any FailedScheduling events. kube-apiserver is running. What component is likely failing?',
          options: [
            'etcd — pods cannot be written to the datastore',
            'kube-scheduler — pods are accepted by apiserver but never assigned to a node',
            'kube-proxy — the scheduler cannot reach the nodes',
            'CoreDNS — pods cannot resolve hostnames',
          ],
          answer: 1,
          explanation:
            'kube-scheduler watches for unscheduled pods (spec.nodeName is empty) and assigns them to nodes. If the scheduler is down, pods are accepted by the API server and stored in etcd, but never get a nodeName assigned — they stay Pending forever with no scheduling events.',
        },
        {
          id: 'p8-m4-q4',
          question: 'Which command checks etcd health on a kubeadm cluster?',
          options: [
            'kubectl get componentstatuses etcd',
            'ETCDCTL_API=3 etcdctl endpoint health --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key',
            'etcdctl cluster-health',
            'kubectl exec -n kube-system etcd-controlplane -- etcdctl endpoint health',
          ],
          answer: 1,
          explanation:
            'etcdctl requires: ETCDCTL_API=3 (v3 API), --endpoints pointing to the etcd URL, and all three TLS flags. The cert paths on kubeadm clusters are always in /etc/kubernetes/pki/etcd/. Option 3 is v2 API syntax. Option 4 is missing the TLS flags.',
        },
        {
          id: 'p8-m4-q5',
          question:
            'kube-controller-manager is not running. Which immediate operational impact does this have?',
          options: [
            'kubectl commands stop working immediately',
            'Existing pods keep running but new Deployments, ReplicaSets, and other controllers stop creating/replacing pods',
            'All pods are immediately evicted from all nodes',
            'DNS resolution stops working cluster-wide',
          ],
          answer: 1,
          explanation:
            "The controller manager runs all built-in controllers (Deployment, ReplicaSet, Job, etc.). Without it, controllers don't run reconciliation loops. Existing pods continue running (kubelet manages them), but if a pod dies or a Deployment is scaled, no new pods are created. The cluster becomes partially functional.",
        },
        {
          id: 'p8-m4-q6',
          question:
            'When kubectl is unavailable because the API server is down, which tool can you use to inspect containers on the control plane node?',
          options: [
            'docker ps — Docker is always available on Kubernetes nodes',
            'kubectl --local — a local mode that works without the API server',
            'crictl ps — the CRI CLI that works directly with the container runtime',
            'podman ps — Podman is the default runtime in Kubernetes 1.30',
          ],
          answer: 2,
          explanation:
            'crictl is the CRI (Container Runtime Interface) CLI. It communicates directly with containerd or CRI-O without needing the API server. It supports: crictl ps (list containers), crictl logs <id> (get logs), crictl inspect <id> (inspect container). It is available on all kubeadm cluster nodes.',
        },
      ],
      exercises: [
        {
          id: 'p8-m4-e1',
          title: 'Debug: Find and fix a broken static pod manifest',
          kind: 'debug',
          goal: 'A kube-scheduler manifest has been corrupted with a wrong image tag causing it to be in a crash loop. Find, diagnose, and fix it.',
          commands: [
            'kubectl get pods -n kube-system | grep scheduler',
            'kubectl describe pod kube-scheduler-controlplane -n kube-system | grep -A5 "Events:"',
            'kubectl logs -n kube-system kube-scheduler-controlplane --previous',
            'cat /etc/kubernetes/manifests/kube-scheduler.yaml | grep image',
            'grep -n "image:" /etc/kubernetes/manifests/kube-scheduler.yaml',
            '# Fix the image tag back to the correct version',
            '# sed -i "s/kube-scheduler:v1.30.99/kube-scheduler:v1.30.0/" /etc/kubernetes/manifests/kube-scheduler.yaml',
            'kubectl get pods -n kube-system | grep scheduler',
          ],
          verify: [
            'kubectl describe pod kube-scheduler-controlplane shows ImagePullBackOff or CrashLoopBackOff before fix',
            'After fix: kubectl get pods -n kube-system shows kube-scheduler-controlplane Running 1/1',
            'kubectl get pods shows new pods get scheduled (not stuck Pending)',
          ],
          expectedOutcome:
            'Broken scheduler manifest identified, image tag corrected, scheduler recovered.',
          cleanup: [],
        },
        {
          id: 'p8-m4-e2',
          title: 'Debug: Verify full control plane health',
          kind: 'debug',
          goal: 'Run a systematic control plane health check: all 4 components, etcd, and functional verification.',
          commands: [
            'kubectl get pods -n kube-system -o wide',
            'kubectl get componentstatuses 2>/dev/null || echo "cs deprecated, check pods directly"',
            'kubectl logs -n kube-system -l component=kube-scheduler --tail=5',
            'kubectl logs -n kube-system -l component=kube-controller-manager --tail=5',
            'ETCDCTL_API=3 etcdctl endpoint health --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key',
            'ETCDCTL_API=3 etcdctl member list --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key',
            'kubectl run smoke-test --image=nginx:1.27 --rm --restart=Never -it -- nginx -v',
          ],
          verify: [
            'All 4 control plane pods show Running 1/1',
            'etcdctl endpoint health shows "is healthy"',
            'smoke-test pod schedules, runs, and exits successfully',
          ],
          expectedOutcome:
            'Full control plane health verified across API server, scheduler, controller manager, and etcd.',
          cleanup: ['kubectl delete pod smoke-test --ignore-not-found'],
        },
        {
          id: 'p8-m4-e3',
          title: 'Debug: Diagnose and fix a kube-apiserver etcd connectivity failure',
          kind: 'debug',
          goal: 'The kube-apiserver manifest points to a wrong etcd endpoint. Diagnose the failure and restore connectivity.',
          commands: [
            'grep "etcd-servers" /etc/kubernetes/manifests/kube-apiserver.yaml',
            'ETCDCTL_API=3 etcdctl endpoint health --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key',
            'crictl ps -a | grep apiserver',
            'journalctl -u kubelet -n 50 --no-pager | grep -E "apiserver|etcd|error"',
            '# Fix the etcd-servers value: should be https://127.0.0.1:2379',
            '# vi /etc/kubernetes/manifests/kube-apiserver.yaml',
            'sleep 30 && kubectl get nodes',
          ],
          verify: [
            'Before fix: kubectl get nodes returns "connection refused"',
            'etcdctl endpoint health confirms etcd itself is healthy',
            'journalctl shows apiserver failing to connect to etcd',
            'After fix: kubectl get nodes shows cluster nodes Ready',
          ],
          expectedOutcome:
            'kube-apiserver etcd connectivity failure diagnosed via etcdctl and kubelet logs, manifest corrected.',
          cleanup: [],
        },
      ],
    },
  ],
}

export default phase8
