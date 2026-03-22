import type { Phase, ClusterState } from '@/lib/types'

const emptyCluster: ClusterState = {
  pods: [], services: [], deployments: [], namespaces: ['default'], events: [],
}

const phase4: Phase = {
  id: 'phase-4',
  slug: 'phase-4',
  title: 'Security, Scheduling & Reliability',
  shortTitle: 'Security & Scale',
  description: 'Secure your cluster with RBAC, autoscale workloads with HPA, control scheduling with taints and affinity, and protect availability with PodDisruptionBudgets.',
  weeks: 'Week 7–8',
  hours: '~10 hours',
  color: 'text-purple-400',
  bgColor: 'bg-purple-500/10 border-purple-500/30',
  modules: [
    // ─── Module 1: RBAC ──────────────────────────────────────────────────────
    {
      id: 'p4-m1',
      slug: 'rbac',
      title: 'RBAC (Role-Based Access Control)',
      description: 'Secure your cluster with Roles, ClusterRoles, and ServiceAccounts — granting only the permissions each workload actually needs.',
      duration: '75 min',
      difficulty: 'intermediate',
      theory: `## Kubernetes Has No Built-In User Accounts

Unlike most systems, Kubernetes has **no built-in user database**. There is no \`kubectl create user\` command. Human identity comes from:
- **x509 client certificates** signed by the cluster CA
- **OIDC tokens** from an external provider (Google, Azure AD, etc.)
- **Static token files** (rarely used, not recommended)

Kubernetes does, however, have a first-class object for workload identity: the **ServiceAccount**.

## ServiceAccount

A **ServiceAccount** is a namespaced identity for **Pods** (not humans). Every namespace has a \`default\` ServiceAccount that all Pods use unless you specify otherwise.

\`\`\`yaml
spec:
  serviceAccountName: app-reader
\`\`\`

A ServiceAccount token is automatically mounted into the Pod at \`/var/run/secrets/kubernetes.io/serviceaccount/token\`. The Pod can use this token to authenticate to the Kubernetes API.

## Roles and ClusterRoles

| Object | Scope | Use case |
|---|---|---|
| **Role** | Single namespace | Grant access to resources in one namespace |
| **ClusterRole** | Entire cluster | Access across all namespaces, or cluster-scoped resources (Nodes, PVs) |

A Role defines **what** is allowed — resources and verbs:

\`\`\`yaml
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
\`\`\`

Available verbs: \`get\`, \`list\`, \`watch\`, \`create\`, \`update\`, \`patch\`, \`delete\`, \`deletecollection\`.

## RoleBindings and ClusterRoleBindings

A **RoleBinding** attaches a Role (or ClusterRole) to a **subject** — a User, Group, or ServiceAccount — within one namespace.

A **ClusterRoleBinding** attaches a ClusterRole to a subject cluster-wide.

\`\`\`
Role ──────────────────────── RoleBinding ──── Subject (ServiceAccount / User)
ClusterRole ──── ClusterRoleBinding ──── Subject (cluster-wide)
ClusterRole ──── RoleBinding ──── Subject (namespace-scoped, common pattern)
\`\`\`

## Principle of Least Privilege

Grant only what is needed. Common mistakes:
- Using \`ClusterRoleBinding\` when \`RoleBinding\` would suffice
- Granting \`*\` verbs on \`*\` resources (wildcard = full admin)
- Sharing one ServiceAccount across many unrelated Pods

Use \`kubectl auth can-i\` to verify what a subject can and cannot do:
\`\`\`
kubectl auth can-i list pods --as=system:serviceaccount:default:app-reader
\`\`\``,
      labSteps: [
        {
          id: 'p4-m1-s1',
          title: 'Inspect the default ServiceAccount',
          instruction: 'List ServiceAccounts in the default namespace and describe the default SA to see its auto-mounted token.',
          command: 'kubectl get serviceaccounts && kubectl describe sa default',
          output: [
            'NAME      SECRETS   AGE',
            'default   0         10d',
            '',
            'Name:                default',
            'Namespace:           default',
            'Labels:              <none>',
            'Annotations:         <none>',
            'Image pull secrets:  <none>',
            'Mountable secrets:   <none>',
            'Tokens:              <none>',
            'Events:              <none>',
          ],
          explanation: 'Every namespace automatically gets a "default" ServiceAccount. Any Pod that does not specify serviceAccountName uses this SA. In Kubernetes 1.24+, tokens are no longer auto-created as Secret objects — instead, the token is projected into the Pod at runtime via the TokenRequest API.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Inspecting default ServiceAccount in namespace: default'],
            highlightedComponent: 'apiserver',
          },
          tip: 'Run kubectl get serviceaccounts --all-namespaces to see that every namespace — including kube-system — has its own default ServiceAccount.',
        },
        {
          id: 'p4-m1-s2',
          title: 'Create a dedicated ServiceAccount',
          instruction: 'Create a new ServiceAccount named app-reader that your Pod will use instead of the default.',
          command: 'kubectl create serviceaccount app-reader -n default',
          output: ['serviceaccount/app-reader created'],
          explanation: 'Creating a dedicated ServiceAccount per application is a best practice. It lets you grant exactly the permissions that app needs — and no more. The default ServiceAccount should have minimal (ideally zero) permissions so that misconfigured Pods cannot accidentally access the API.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['ServiceAccount app-reader created in namespace: default'],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p4-m1-s3',
          title: 'Create a Role',
          instruction: 'Create a Role that grants read-only access to Pods in the default namespace.',
          command: 'kubectl apply -f pod-reader-role.yaml',
          yamlContent: `apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]`,
          output: ['role.rbac.authorization.k8s.io/pod-reader created'],
          explanation: 'The Role is namespaced — it only applies within "default". The apiGroups: [""] refers to the core API group (pods, services, configmaps, secrets, etc.). The verbs "get", "list", "watch" correspond to kubectl get, kubectl get --watch, and direct API reads. No create, update, or delete verbs are granted.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Role pod-reader created: allows get/list/watch on pods in default'],
            highlightedComponent: 'apiserver',
          },
          tip: 'Use kubectl get roles to list namespaced roles. Use kubectl get clusterroles to list cluster-wide roles (there are many built-in ones).',
        },
        {
          id: 'p4-m1-s4',
          title: 'Create a RoleBinding',
          instruction: 'Bind the pod-reader Role to the app-reader ServiceAccount.',
          command: 'kubectl apply -f pod-reader-binding.yaml',
          yamlContent: `apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: pod-reader-binding
  namespace: default
subjects:
- kind: ServiceAccount
  name: app-reader
  namespace: default
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io`,
          output: ['rolebinding.rbac.authorization.k8s.io/pod-reader-binding created'],
          explanation: 'The RoleBinding connects the subject (app-reader ServiceAccount) to the role (pod-reader). The roleRef is immutable after creation — to change what role is bound, you must delete and recreate the RoleBinding. The subjects array can include multiple Users, Groups, or ServiceAccounts.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'RoleBinding pod-reader-binding created',
              'app-reader SA → pod-reader Role (get/list/watch pods)',
            ],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p4-m1-s5',
          title: 'Verify allowed permission',
          instruction: 'Run a Pod as the app-reader ServiceAccount and verify it can list Pods.',
          command: 'kubectl auth can-i list pods --as=system:serviceaccount:default:app-reader',
          output: ['yes'],
          explanation: 'kubectl auth can-i performs a SubjectAccessReview against the API server — it checks what a given subject is allowed to do without actually running the action. The --as flag impersonates the subject. The format for ServiceAccounts is system:serviceaccount:<namespace>:<name>.',
          clusterState: {
            pods: [
              { id: 'reader-pod-abc12', name: 'reader-pod-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'reader' }, image: 'busybox:1.36', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'SubjectAccessReview: can app-reader list pods? → yes',
              'Pod reader-pod-abc12 running as ServiceAccount app-reader',
            ],
            highlightedComponent: 'apiserver',
          },
          tip: 'You can also run kubectl auth can-i --list --as=system:serviceaccount:default:app-reader to see all permissions granted to this SA.',
        },
        {
          id: 'p4-m1-s6',
          title: 'Verify denied permission',
          instruction: 'Confirm that the app-reader ServiceAccount cannot delete Pods — least privilege in action.',
          command: 'kubectl auth can-i delete pods --as=system:serviceaccount:default:app-reader',
          output: ['no'],
          explanation: 'The pod-reader Role only grants get, list, and watch. Delete was not included, so this SubjectAccessReview returns "no". This is the principle of least privilege: the ServiceAccount can do its job (reading pod status) but cannot disrupt the cluster by deleting pods.',
          clusterState: {
            pods: [
              { id: 'reader-pod-abc12', name: 'reader-pod-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'reader' }, image: 'busybox:1.36', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'SubjectAccessReview: can app-reader delete pods? → no',
              'Least-privilege confirmed: delete verb not granted',
            ],
            highlightedComponent: 'apiserver',
          },
        },
      ],
      quiz: [
        {
          id: 'p4-m1-q1',
          question: 'What is the difference between a Role and a ClusterRole?',
          options: [
            'A Role grants more permissions than a ClusterRole',
            'A Role is namespaced and applies within one namespace; a ClusterRole is cluster-wide and can also apply to cluster-scoped resources',
            'A ClusterRole can only be used with ClusterRoleBindings, never with RoleBindings',
            'A Role can grant access to Nodes and PersistentVolumes; a ClusterRole cannot',
          ],
          answer: 1,
          explanation: 'A Role is scoped to a single namespace — permissions it grants only apply within that namespace. A ClusterRole is cluster-wide and can grant access across all namespaces or to cluster-scoped resources like Nodes and PersistentVolumes. A ClusterRole can actually be bound with a RoleBinding to restrict its scope to a specific namespace.',
        },
        {
          id: 'p4-m1-q2',
          question: 'A Pod needs to call the Kubernetes API to list ConfigMaps. What Kubernetes resource gives it that identity?',
          options: [
            'A User account configured in /etc/kubernetes/users.conf',
            'A ServiceAccount — a namespaced identity that Pods use to authenticate to the API',
            'A ClusterRole — the Pod must have cluster-wide permissions to call the API',
            'An OIDC token injected via a Secret',
          ],
          answer: 1,
          explanation: 'ServiceAccounts are the identity mechanism for Pods. Kubernetes has no built-in user accounts for workloads. The Pod authenticates using a projected ServiceAccount token, which is automatically mounted at /var/run/secrets/kubernetes.io/serviceaccount/token.',
        },
        {
          id: 'p4-m1-q3',
          question: 'You want to grant a ServiceAccount read access to Secrets in ONLY the "staging" namespace. Which combination is correct?',
          options: [
            'ClusterRole + ClusterRoleBinding',
            'Role in staging namespace + RoleBinding in staging namespace',
            'ClusterRole + RoleBinding in staging namespace',
            'Either B or C — both correctly limit access to the staging namespace',
          ],
          answer: 3,
          explanation: 'Both options B and C work. A Role scoped to "staging" + a RoleBinding in "staging" is the cleanest approach. Alternatively, you can use a ClusterRole (reusable across namespaces) bound by a RoleBinding in "staging" — the RoleBinding\'s namespace determines the scope. A ClusterRoleBinding would grant access cluster-wide, which is too broad.',
        },
        {
          id: 'p4-m1-q4',
          question: 'kubectl auth can-i is used for what?',
          options: [
            'Listing all ServiceAccounts in the cluster',
            'Performing a SubjectAccessReview to check if a subject is allowed to perform an action',
            'Creating a temporary impersonation token for debugging',
            'Auditing which users have accessed the cluster in the last 24 hours',
          ],
          answer: 1,
          explanation: 'kubectl auth can-i performs a SubjectAccessReview against the API server. It checks whether the current user (or an impersonated subject via --as) is allowed to perform a specific action on a specific resource. It returns "yes" or "no" and is the primary tool for verifying RBAC permissions.',
        },
        {
          id: 'p4-m1-q5',
          question: 'What verb is needed to run kubectl get pods?',
          options: [
            'read',
            'get',
            'get and list — kubectl get uses both depending on whether you name a specific pod',
            'view',
          ],
          answer: 2,
          explanation: 'kubectl get pods (without a name) uses the "list" verb. kubectl get pods <name> uses the "get" verb. To safely allow both, always grant both "get" and "list" together. "watch" is needed for kubectl get pods --watch. There is no "read" or "view" verb in Kubernetes RBAC.',
        },
      ],
    },

    // ─── Module 2: Jobs & CronJobs ───────────────────────────────────────────
    {
      id: 'p4-m2',
      slug: 'jobs',
      title: 'Jobs & CronJobs',
      description: 'Run batch tasks to completion with Jobs and schedule recurring work with CronJobs.',
      duration: '45 min',
      difficulty: 'beginner',
      theory: `## Why Not Deployments for Batch Work?

Deployments are designed to run forever — they restart Pods that exit. That is perfect for a web server, but wrong for a database migration: you want the Pod to run once, finish, and stop.

**Jobs** and **CronJobs** fill this gap.

## Job

A **Job** ensures a specified number of Pods complete successfully (exit code 0). If a Pod fails, the Job controller retries up to \`backoffLimit\` times.

Key fields:

| Field | Description |
|---|---|
| \`completions\` | How many Pods must succeed in total (default: 1) |
| \`parallelism\` | How many Pods can run simultaneously (default: 1) |
| \`backoffLimit\` | Max retries before marking the Job as Failed (default: 6) |
| \`ttlSecondsAfterFinished\` | Auto-delete the Job (and its Pods) after N seconds |

\`\`\`yaml
spec:
  completions: 1
  parallelism: 1
  backoffLimit: 3
  ttlSecondsAfterFinished: 300
\`\`\`

## CronJob

A **CronJob** creates Jobs on a schedule using standard Unix cron syntax:

\`\`\`
┌─── minute (0-59)
│ ┌─── hour (0-23)
│ │ ┌─── day of month (1-31)
│ │ │ ┌─── month (1-12)
│ │ │ │ ┌─── day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * *
\`\`\`

\`"*/1 * * * *"\` = every minute. \`"0 2 * * *"\` = daily at 02:00.

### concurrencyPolicy

| Value | Behaviour |
|---|---|
| \`Allow\` | New Job starts even if previous is still running (default) |
| \`Forbid\` | Skip new Job if previous is still running |
| \`Replace\` | Cancel running Job and start a new one |

### Use Cases

- Database migrations on deploy
- Nightly report generation
- Periodic data processing or backups
- Sending scheduled notifications`,
      labSteps: [
        {
          id: 'p4-m2-s1',
          title: 'Create a Job',
          instruction: 'Apply a Job that runs a busybox container, prints a message, and exits successfully.',
          command: 'kubectl apply -f batch-job.yaml',
          yamlContent: `apiVersion: batch/v1
kind: Job
metadata:
  name: batch-job
spec:
  backoffLimit: 3
  ttlSecondsAfterFinished: 300
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: worker
        image: busybox:1.36
        command: ["sh", "-c", "echo 'Job complete!' && sleep 2"]`,
          output: ['job.batch/batch-job created'],
          explanation: 'Note restartPolicy: Never — Jobs must use Never or OnFailure (never Deployment\'s default "Always"). With Never, if the container exits with a non-zero code, Kubernetes creates a new Pod rather than restarting the same one. backoffLimit: 3 means Kubernetes will try up to 3 additional times before marking the Job Failed.',
          clusterState: {
            pods: [
              { id: 'batch-job-xk9f2', name: 'batch-job-xk9f2', namespace: 'default', node: 'node-1', status: 'Running', labels: { 'job-name': 'batch-job' }, image: 'busybox:1.36', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Job batch-job created', 'Pod batch-job-xk9f2 scheduled → node-1'],
            highlightedComponent: 'controller',
          },
        },
        {
          id: 'p4-m2-s2',
          title: 'Verify Job completion',
          instruction: 'Check the Job status and confirm the Pod completed successfully.',
          command: 'kubectl get jobs && kubectl get pods',
          output: [
            'NAME        COMPLETIONS   DURATION   AGE',
            'batch-job   1/1           4s         12s',
            '',
            'NAME               READY   STATUS      RESTARTS   AGE',
            'batch-job-xk9f2    0/1     Completed   0          12s',
          ],
          explanation: 'COMPLETIONS 1/1 means the required number of successful Pod completions has been reached. The Pod status is "Completed" (not Running or Terminated with error). Kubernetes keeps completed Job Pods around so you can inspect logs — until ttlSecondsAfterFinished expires or you delete the Job manually.',
          clusterState: {
            pods: [
              { id: 'batch-job-xk9f2', name: 'batch-job-xk9f2', namespace: 'default', node: 'node-1', status: 'Terminated', labels: { 'job-name': 'batch-job' }, image: 'busybox:1.36', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Job batch-job: COMPLETIONS 1/1', 'Pod batch-job-xk9f2 → Completed (exit 0)'],
            highlightedComponent: 'controller',
          },
        },
        {
          id: 'p4-m2-s3',
          title: 'Read Job logs',
          instruction: 'Fetch the logs from the completed Job Pod.',
          command: 'kubectl logs batch-job-xk9f2',
          output: ['Job complete!'],
          explanation: 'Logs persist on the completed Pod until the Pod is deleted. This is why ttlSecondsAfterFinished is useful — without it, finished Job Pods accumulate. With ttlSecondsAfterFinished: 300, the Job and its Pods are automatically cleaned up 5 minutes after completion.',
          clusterState: {
            pods: [
              { id: 'batch-job-xk9f2', name: 'batch-job-xk9f2', namespace: 'default', node: 'node-1', status: 'Terminated', labels: { 'job-name': 'batch-job' }, image: 'busybox:1.36', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['kubectl logs batch-job-xk9f2 → "Job complete!"'],
            highlightedComponent: 'kubelet',
          },
          tip: 'If a Job fails all retries, its Pods will be in Error state. kubectl logs <pod> is the first place to look for the failure reason.',
        },
        {
          id: 'p4-m2-s4',
          title: 'Create a CronJob',
          instruction: 'Create a CronJob that runs the same task every minute.',
          command: 'kubectl apply -f hello-cronjob.yaml',
          yamlContent: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: hello
spec:
  schedule: "*/1 * * * *"
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: Never
          containers:
          - name: worker
            image: busybox:1.36
            command: ["sh", "-c", "echo 'Job complete!' && sleep 2"]`,
          output: ['cronjob.batch/hello created'],
          explanation: 'The CronJob wraps a jobTemplate — it creates a new Job object at each scheduled tick. successfulJobsHistoryLimit: 3 keeps the last 3 successful Jobs for inspection. concurrencyPolicy: Forbid ensures that if a previous run is still executing when the next tick fires, the new run is skipped rather than running concurrently.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['CronJob hello created, schedule: */1 * * * *'],
            highlightedComponent: 'controller',
          },
        },
        {
          id: 'p4-m2-s5',
          title: 'Observe auto-created Jobs',
          instruction: 'Wait one minute and check that the CronJob has automatically created a Job.',
          command: 'kubectl get cronjobs && kubectl get jobs',
          output: [
            'NAME    SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE',
            'hello   */1 * * * *   False     0        28s             90s',
            '',
            'NAME               COMPLETIONS   DURATION   AGE',
            'hello-28765440     1/1           3s         28s',
          ],
          explanation: 'The CronJob controller created a Job named hello-<unix-timestamp-minute> automatically. LAST SCHEDULE shows when the most recent Job was triggered. ACTIVE: 0 means no Jobs are currently running (the last one finished). With successfulJobsHistoryLimit: 3, only the 3 most recent successful Jobs are retained.',
          clusterState: {
            pods: [
              { id: 'hello-28765440-pqr7x', name: 'hello-28765440-pqr7x', namespace: 'default', node: 'node-2', status: 'Terminated', labels: { 'job-name': 'hello-28765440' }, image: 'busybox:1.36', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['CronJob hello triggered Job hello-28765440', 'Job hello-28765440: COMPLETIONS 1/1'],
            highlightedComponent: 'controller',
          },
          tip: 'kubectl create job --from=cronjob/hello manual-run manually triggers a CronJob immediately — useful for testing without waiting for the schedule.',
        },
      ],
      quiz: [
        {
          id: 'p4-m2-q1',
          question: 'A Job\'s Pod exits with code 1. What does Kubernetes do?',
          options: [
            'The Job is immediately marked as Failed and no retry occurs',
            'Kubernetes retries by creating a new Pod, up to backoffLimit times',
            'Kubernetes restarts the same Pod in place, like a Deployment would',
            'The Job is suspended and waits for manual intervention',
          ],
          answer: 1,
          explanation: 'With restartPolicy: Never, a failed Pod is not restarted in place. Instead, the Job controller creates a new Pod for the retry. This repeats until the Pod succeeds (exit 0) or the retry count reaches backoffLimit. With restartPolicy: OnFailure, the same Pod is restarted in place.',
        },
        {
          id: 'p4-m2-q2',
          question: 'What CronJob concurrencyPolicy prevents a new Job from starting if the previous one is still running?',
          options: [
            'Replace',
            'Forbid',
            'Allow',
            'Block',
          ],
          answer: 1,
          explanation: 'concurrencyPolicy: Forbid skips the new Job creation if the previous Job is still running. This is useful for jobs that must not run concurrently — such as a database migration or a report that reads and writes the same dataset. "Replace" would cancel the running Job and start a new one. "Allow" (the default) permits concurrent runs.',
        },
        {
          id: 'p4-m2-q3',
          question: 'You have a database migration that must run exactly once on deploy. Which workload type?',
          options: [
            'Deployment with replicas: 1',
            'DaemonSet so it runs on every node',
            'Job with completions: 1',
            'StatefulSet so the Pod gets a stable identity',
          ],
          answer: 2,
          explanation: 'A Job with completions: 1 is exactly right — it runs until one Pod exits successfully, then stops. A Deployment would keep restarting the migration indefinitely. A DaemonSet runs on every node. A StatefulSet is for long-running stateful services, not one-off tasks.',
        },
        {
          id: 'p4-m2-q4',
          question: 'What does ttlSecondsAfterFinished: 300 do to a completed Job?',
          options: [
            'Pauses the Job for 300 seconds before marking it as complete',
            'Automatically deletes the Job and its Pods 300 seconds after the Job finishes',
            'Keeps the Job alive for 300 seconds in case it needs to retry',
            'Sets the maximum runtime — the Job is killed if it takes longer than 300 seconds',
          ],
          answer: 1,
          explanation: 'ttlSecondsAfterFinished enables the TTL controller to automatically clean up finished Jobs (both Completed and Failed). 300 seconds after the Job reaches a terminal state, the Job object and its Pods are deleted. Without this, finished Jobs accumulate and waste etcd storage. activeDeadlineSeconds is the field that limits maximum runtime.',
        },
      ],
    },

    // ─── Module 3: HPA ───────────────────────────────────────────────────────
    {
      id: 'p4-m3',
      slug: 'hpa',
      title: 'Horizontal Pod Autoscaler (HPA)',
      description: 'Automatically scale replica counts based on CPU, memory, or custom metrics — without manual intervention.',
      duration: '60 min',
      difficulty: 'intermediate',
      theory: `## The Problem with Manual Scaling

\`kubectl scale deployment web --replicas=10\` works — but it requires a human watching metrics 24/7. Traffic spikes at 3 AM or during a flash sale would require manual intervention every time.

The **Horizontal Pod Autoscaler** automates this.

## How HPA Works

HPA runs a control loop every **15 seconds**:

1. Query **metrics-server** for current resource usage of all Pods in the target
2. Calculate the desired replica count: \`desiredReplicas = ceil(currentReplicas × (currentMetric / targetMetric))\`
3. If desired ≠ current, update the Deployment's \`spec.replicas\`

\`\`\`
metrics-server ──── HPA controller ──── Deployment spec.replicas
      ↑                                         ↓
  kubelets ◄──────────────────────────── Pods scale up/down
\`\`\`

## Requirements

- **metrics-server must be installed** — it aggregates CPU and memory usage from kubelets every 60 seconds
- **Resource requests must be set** on Pods — HPA CPU target is a percentage of \`requests.cpu\`, not the node's total CPU

## Key Fields

\`\`\`yaml
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: php-apache
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
\`\`\`

## Scale-Up vs Scale-Down Behaviour

| Direction | Speed | Reason |
|---|---|---|
| Scale-up | Fast (immediate) | Better to over-provision than miss SLA |
| Scale-down | Slow (5 min stabilization window) | Avoid flapping — a brief traffic dip should not trigger scale-down |

The stabilization window prevents oscillation: "scale up → traffic drops → scale down → traffic spikes → scale up again" loops.

## HPA v2

HPA v2 supports **multiple metrics** and **custom/external metrics**:
- Prometheus metrics (requests per second, queue depth)
- External metrics (SQS queue depth, Pub/Sub backlog)
- Per-Pod custom metrics (transactions/second)`,
      labSteps: [
        {
          id: 'p4-m3-s1',
          title: 'Deploy a CPU-intensive app',
          instruction: 'Create a Deployment using the HPA example image and expose it as a ClusterIP Service, then set a CPU resource request.',
          command: 'kubectl create deployment php-apache --image=registry.k8s.io/hpa-example && kubectl expose deployment php-apache --port=80 --target-port=80 && kubectl set resources deployment php-apache --requests=cpu=200m',
          output: [
            'deployment.apps/php-apache created',
            'service/php-apache exposed',
            'deployment.apps/php-apache resource requirements updated',
          ],
          explanation: 'The hpa-example image runs a PHP app that does CPU-intensive math in a loop — perfect for generating artificial load. Setting requests.cpu=200m is mandatory: HPA calculates utilization as a percentage of this request value, not of the node\'s total CPU. Without a request, HPA cannot compute a meaningful percentage.',
          clusterState: {
            pods: [
              { id: 'php-apache-abc12', name: 'php-apache-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'php-apache' }, image: 'registry.k8s.io/hpa-example', restarts: 0 },
            ],
            services: [
              { id: 'php-apache-svc', name: 'php-apache', namespace: 'default', type: 'ClusterIP', selector: { app: 'php-apache' }, port: 80, clusterIP: '10.96.100.1' },
            ],
            deployments: [
              { id: 'php-apache-deploy', name: 'php-apache', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'registry.k8s.io/hpa-example' },
            ],
            namespaces: ['default'],
            events: ['Deployment php-apache created (1 replica)', 'Service php-apache exposed on port 80', 'CPU request set to 200m'],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p4-m3-s2',
          title: 'Create the HPA',
          instruction: 'Create an HPA that scales php-apache between 1 and 10 replicas targeting 50% CPU utilization.',
          command: 'kubectl autoscale deployment php-apache --cpu-percent=50 --min=1 --max=10',
          output: ['horizontalpodautoscaler.autoscaling/php-apache autoscaled'],
          explanation: 'kubectl autoscale is a shortcut for creating an HPA object. It creates an HPA targeting 50% of the CPU request (200m × 50% = 100m). If average CPU usage across all Pods exceeds 100m, HPA will scale up. If it drops well below 100m, HPA will scale down after the stabilization window.',
          clusterState: {
            pods: [
              { id: 'php-apache-abc12', name: 'php-apache-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'php-apache' }, image: 'registry.k8s.io/hpa-example', restarts: 0 },
            ],
            services: [
              { id: 'php-apache-svc', name: 'php-apache', namespace: 'default', type: 'ClusterIP', selector: { app: 'php-apache' }, port: 80, clusterIP: '10.96.100.1' },
            ],
            deployments: [
              { id: 'php-apache-deploy', name: 'php-apache', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'registry.k8s.io/hpa-example' },
            ],
            namespaces: ['default'],
            events: ['HPA php-apache created: min=1 max=10 targetCPU=50%'],
            highlightedComponent: 'controller',
          },
          tip: 'kubectl get hpa shows current CPU%, MINPODS, MAXPODS, and REPLICAS. If TARGETS shows <unknown>/50%, metrics-server is not installed or not yet scraped.',
        },
        {
          id: 'p4-m3-s3',
          title: 'Inspect the HPA',
          instruction: 'Check the current HPA state before generating load.',
          command: 'kubectl get hpa',
          output: [
            'NAME         REFERENCE               TARGETS   MINPODS   MAXPODS   REPLICAS   AGE',
            'php-apache   Deployment/php-apache   1%/50%    1         10        1          30s',
          ],
          explanation: 'TARGETS shows "1%/50%" — current CPU utilization is 1% of the 200m request (about 2m of actual CPU), well below the 50% target. REPLICAS is 1 — no scaling has occurred. The HPA is healthy and monitoring.',
          clusterState: {
            pods: [
              { id: 'php-apache-abc12', name: 'php-apache-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'php-apache' }, image: 'registry.k8s.io/hpa-example', restarts: 0 },
            ],
            services: [
              { id: 'php-apache-svc', name: 'php-apache', namespace: 'default', type: 'ClusterIP', selector: { app: 'php-apache' }, port: 80, clusterIP: '10.96.100.1' },
            ],
            deployments: [
              { id: 'php-apache-deploy', name: 'php-apache', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'registry.k8s.io/hpa-example' },
            ],
            namespaces: ['default'],
            events: ['HPA php-apache: TARGETS=1%/50%, REPLICAS=1'],
            highlightedComponent: 'controller',
          },
        },
        {
          id: 'p4-m3-s4',
          title: 'Generate load and watch scale-up',
          instruction: 'Run a load generator Pod and watch the HPA scale up the Deployment.',
          command: 'kubectl run -i --tty load-generator --rm --image=busybox:1.36 -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://php-apache; done"',
          output: [
            '(load generator running...)',
            '',
            'NAME         REFERENCE               TARGETS    MINPODS   MAXPODS   REPLICAS   AGE',
            'php-apache   Deployment/php-apache   248%/50%   1         10        1          2m',
            'php-apache   Deployment/php-apache   248%/50%   1         10        5          2m',
            'php-apache   Deployment/php-apache   71%/50%    1         10        7          3m',
          ],
          explanation: 'The load generator hammers the php-apache endpoint every 10ms. CPU spikes to 248% of target. The HPA control loop fires and scales the Deployment to 5, then 7 replicas. As new Pods join, the load is distributed and CPU per Pod drops. Scale-up is fast — the first scale event happens within 30 seconds of the metric exceeding the target.',
          clusterState: {
            pods: [
              { id: 'php-apache-abc12', name: 'php-apache-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'php-apache' }, image: 'registry.k8s.io/hpa-example', restarts: 0 },
              { id: 'php-apache-def34', name: 'php-apache-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'php-apache' }, image: 'registry.k8s.io/hpa-example', restarts: 0 },
              { id: 'php-apache-ghi56', name: 'php-apache-ghi56', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'php-apache' }, image: 'registry.k8s.io/hpa-example', restarts: 0 },
              { id: 'load-generator', name: 'load-generator', namespace: 'default', node: 'node-2', status: 'Running', labels: {}, image: 'busybox:1.36', restarts: 0 },
            ],
            services: [
              { id: 'php-apache-svc', name: 'php-apache', namespace: 'default', type: 'ClusterIP', selector: { app: 'php-apache' }, port: 80, clusterIP: '10.96.100.1' },
            ],
            deployments: [
              { id: 'php-apache-deploy', name: 'php-apache', namespace: 'default', replicas: 7, availableReplicas: 7, image: 'registry.k8s.io/hpa-example' },
            ],
            namespaces: ['default'],
            events: ['CPU spike: 248% of target', 'HPA scaled php-apache: 1 → 5 → 7 replicas', 'CPU stabilizing at 71%/50%'],
            highlightedComponent: 'controller',
          },
          tip: 'Run kubectl get hpa -w in a second terminal to watch the replica count and CPU metrics update in real time as the load generator runs.',
        },
        {
          id: 'p4-m3-s5',
          title: 'Watch scale-down after load stops',
          instruction: 'Stop the load generator (Ctrl-C) and observe the HPA scale back down — slowly.',
          command: 'kubectl get hpa -w',
          output: [
            'NAME         REFERENCE               TARGETS   MINPODS   MAXPODS   REPLICAS   AGE',
            'php-apache   Deployment/php-apache   1%/50%    1         10        7          8m',
            'php-apache   Deployment/php-apache   1%/50%    1         10        7          10m',
            'php-apache   Deployment/php-apache   1%/50%    1         10        1          13m',
          ],
          explanation: 'CPU drops immediately when load stops, but replicas stay at 7 for 5 minutes before scaling down to 1. This is the scale-down stabilization window (default 300s). It prevents flapping: a brief traffic lull should not cause a scale-down that would leave the app under-provisioned when traffic returns. The window can be tuned in the HPA spec under behavior.scaleDown.stabilizationWindowSeconds.',
          clusterState: {
            pods: [
              { id: 'php-apache-abc12', name: 'php-apache-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'php-apache' }, image: 'registry.k8s.io/hpa-example', restarts: 0 },
            ],
            services: [
              { id: 'php-apache-svc', name: 'php-apache', namespace: 'default', type: 'ClusterIP', selector: { app: 'php-apache' }, port: 80, clusterIP: '10.96.100.1' },
            ],
            deployments: [
              { id: 'php-apache-deploy', name: 'php-apache', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'registry.k8s.io/hpa-example' },
            ],
            namespaces: ['default'],
            events: ['Load stopped: CPU dropped to 1%', 'Scale-down stabilization window: 5 min', 'HPA scaled php-apache: 7 → 1 replica'],
            highlightedComponent: 'controller',
          },
        },
      ],
      quiz: [
        {
          id: 'p4-m3-q1',
          question: 'HPA targets 50% CPU utilization. A Pod has requests.cpu: 200m. At what actual CPU usage does HPA trigger scale-up?',
          options: [
            '50m — 50% of 200m / 2',
            '100m — 50% of 200m',
            '200m — 100% of the request must be reached before HPA acts',
            '50% of the node total CPU, not the request',
          ],
          answer: 1,
          explanation: 'HPA CPU utilization is always relative to the resource request. With requests.cpu: 200m and a 50% target, the threshold is 200m × 50% = 100m of actual CPU usage per Pod. When the average across all Pods exceeds 100m, HPA calculates the new desired replica count and scales up.',
        },
        {
          id: 'p4-m3-q2',
          question: 'Why does HPA require resource requests to be set on pods?',
          options: [
            'Requests are used to reserve CPU on the node, which HPA needs to measure against',
            'HPA calculates utilization as a percentage of the request — without a request there is no baseline to compare against',
            'Kubernetes refuses to create an HPA object if requests are not set',
            'Resource requests trigger metrics-server to start collecting data for that Pod',
          ],
          answer: 1,
          explanation: 'HPA CPU utilization is computed as currentCPUUsage / requestedCPU. Without a CPU request, the denominator is zero and HPA cannot calculate a meaningful percentage. The HPA will show <unknown> in the TARGETS column. Setting requests is a prerequisite, not just a best practice, for CPU-based autoscaling.',
        },
        {
          id: 'p4-m3-q3',
          question: 'Why does HPA scale down slowly by default?',
          options: [
            'To give the Pods time to finish processing in-flight requests before being terminated',
            'To prevent flapping — a brief traffic dip should not trigger a scale-down that leaves the app under-provisioned when traffic returns',
            'Because the Kubernetes scheduler needs extra time to find nodes with enough capacity',
            'Scale-down is actually as fast as scale-up — both happen within 30 seconds',
          ],
          answer: 1,
          explanation: 'The default 5-minute stabilization window for scale-down prevents oscillation. Without it, a deployment could scale up → traffic briefly drops → scale down → traffic returns → scale up again in a rapid loop (flapping), causing constant churn and potential availability gaps during scale events.',
        },
        {
          id: 'p4-m3-q4',
          question: 'What component must be installed for HPA to work?',
          options: [
            'Prometheus — HPA reads metrics from Prometheus by default',
            'metrics-server — it aggregates resource usage from kubelets and exposes the Metrics API',
            'kube-state-metrics — it exports Kubernetes object state as Prometheus metrics',
            'The Horizontal Controller — it is not installed by default and must be enabled separately',
          ],
          answer: 1,
          explanation: 'metrics-server collects CPU and memory usage from each node\'s kubelet and exposes them via the Kubernetes Metrics API (metrics.k8s.io). HPA queries this API every 15 seconds. metrics-server is not installed by default in all distributions — run kubectl top pods to verify it is working.',
        },
      ],
    },

    // ─── Module 4: Taints, Tolerations & Node Affinity ───────────────────────
    {
      id: 'p4-m4',
      slug: 'scheduling',
      title: 'Taints, Tolerations & Node Affinity',
      description: 'Control where Pods land with node labels, taints, tolerations, and affinity rules.',
      duration: '75 min',
      difficulty: 'advanced',
      theory: `## The Default Scheduler

The Kubernetes scheduler places Pods onto nodes based on resource availability and a set of predicates (hard requirements) and priorities (soft preferences). By default it tries to spread Pods across nodes and bin-pack efficiently.

But you often need more control:
- GPU workloads must land on GPU nodes
- Spot/preemptible instances should only run fault-tolerant workloads
- Replicas should spread across failure domains for HA

## Taints and Tolerations

**Taints** are applied to **nodes** and repel Pods that do not tolerate them.

\`\`\`bash
kubectl taint nodes node-2 dedicated=gpu:NoSchedule
\`\`\`

Format: \`key=value:effect\`

| Effect | Behaviour |
|---|---|
| \`NoSchedule\` | New Pods without a matching toleration will not be scheduled on this node. Existing Pods are not evicted. |
| \`PreferNoSchedule\` | Soft version — scheduler tries to avoid the node but will use it if no alternatives exist. |
| \`NoExecute\` | New Pods are not scheduled AND existing Pods without a matching toleration are evicted. |

**Tolerations** are applied to **Pods** and allow scheduling onto tainted nodes:

\`\`\`yaml
tolerations:
- key: dedicated
  operator: Equal
  value: gpu
  effect: NoSchedule
\`\`\`

To **remove** a taint, append a \`-\` to the taint key:
\`\`\`bash
kubectl taint nodes node-2 dedicated=gpu:NoSchedule-
\`\`\`

## nodeSelector

The simplest form of node selection — match a node label exactly:

\`\`\`yaml
spec:
  nodeSelector:
    disk: ssd
\`\`\`

The Pod will only schedule on nodes with the label \`disk=ssd\`.

## Node Affinity

Node Affinity is the more powerful successor to nodeSelector. It supports:
- **Required** (\`requiredDuringSchedulingIgnoredDuringExecution\`): hard rule — Pod will not schedule if no node matches
- **Preferred** (\`preferredDuringSchedulingIgnoredDuringExecution\`): soft rule — scheduler prefers matching nodes but will use others

Use Node Affinity when you need \`In\`, \`NotIn\`, \`Exists\`, \`DoesNotExist\`, \`Gt\`, \`Lt\` operators — nodeSelector only supports exact equality.

## Pod Anti-Affinity

**Pod Anti-Affinity** schedules Pods away from other Pods with matching labels — critical for HA:

\`\`\`yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchLabels:
          app: web
      topologyKey: kubernetes.io/hostname
\`\`\`

\`topologyKey: kubernetes.io/hostname\` means "no two Pods with app=web on the same node". If node-1 fails, replicas on node-2 and node-3 survive.`,
      labSteps: [
        {
          id: 'p4-m4-s1',
          title: 'Inspect node labels',
          instruction: 'List nodes with their labels to understand the available label keys.',
          command: 'kubectl get nodes --show-labels',
          output: [
            'NAME     STATUS   ROLES           AGE   VERSION   LABELS',
            'node-1   Ready    control-plane   10d   v1.35.0   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/hostname=node-1,...',
            'node-2   Ready    <none>          10d   v1.35.0   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/hostname=node-2,...',
          ],
          explanation: 'Every node gets a set of built-in labels automatically: kubernetes.io/hostname, kubernetes.io/os, kubernetes.io/arch, and topology labels for zone/region on cloud providers. These labels are the building blocks for nodeSelector and Node Affinity rules.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['node-1: kubernetes.io/hostname=node-1, os=linux, arch=amd64', 'node-2: kubernetes.io/hostname=node-2, os=linux, arch=amd64'],
            highlightedComponent: 'scheduler',
          },
          tip: 'Cloud providers add zone and region labels automatically (topology.kubernetes.io/zone, topology.kubernetes.io/region). Use these as topologyKey for rack-aware and zone-aware spreading.',
        },
        {
          id: 'p4-m4-s2',
          title: 'Schedule a Pod to a specific node with nodeSelector',
          instruction: 'Label node-1 as an SSD node, then create a Pod with nodeSelector to force placement there.',
          command: 'kubectl label node node-1 disk=ssd && kubectl apply -f ssd-pod.yaml',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: ssd-pod
spec:
  nodeSelector:
    disk: ssd
  containers:
  - name: nginx
    image: nginx:1.27`,
          output: [
            'node/node-1 labeled',
            'pod/ssd-pod created',
          ],
          explanation: 'nodeSelector is the simplest scheduling constraint. The Pod will only be scheduled on nodes that have the label disk=ssd. If no node has this label, the Pod stays Pending. kubectl get pod ssd-pod -o wide will confirm it landed on node-1.',
          clusterState: {
            pods: [
              { id: 'ssd-pod-xyz', name: 'ssd-pod', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['node-1 labeled: disk=ssd', 'Pod ssd-pod: nodeSelector disk=ssd → scheduled on node-1'],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p4-m4-s3',
          title: 'Taint a node and observe Pending Pod',
          instruction: 'Taint node-2 with a NoSchedule taint, then deploy a Pod without a toleration — it will stay Pending.',
          command: 'kubectl taint nodes node-2 dedicated=gpu:NoSchedule && kubectl apply -f no-toleration-pod.yaml',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: no-gpu-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.27`,
          output: [
            'node/node-2 tainted',
            'pod/no-gpu-pod created',
            '',
            'NAME          READY   STATUS    RESTARTS   AGE',
            'no-gpu-pod    0/1     Pending   0          15s',
          ],
          explanation: 'node-2 now has the taint dedicated=gpu:NoSchedule. The Pod has no toleration for this taint. node-1 already has the ssd-pod on it and may have capacity, but if the scheduler tries node-2, it is rejected. If no untainted node has capacity, the Pod stays Pending. kubectl describe pod no-gpu-pod will show "1 node(s) had untolerated taint" in the Events.',
          clusterState: {
            pods: [
              { id: 'ssd-pod-xyz', name: 'ssd-pod', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
              { id: 'no-gpu-pod', name: 'no-gpu-pod', namespace: 'default', node: 'node-1', status: 'Pending', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['node-2 tainted: dedicated=gpu:NoSchedule', 'Pod no-gpu-pod: no toleration for dedicated=gpu:NoSchedule → Pending'],
            highlightedComponent: 'scheduler',
          },
          tip: 'kubectl describe pod no-gpu-pod → look at the Events section for "0/2 nodes are available: 1 node(s) had untolerated taint {dedicated: gpu}".',
        },
        {
          id: 'p4-m4-s4',
          title: 'Add a toleration to schedule on the tainted node',
          instruction: 'Update the Pod spec to include a toleration matching the GPU taint.',
          command: 'kubectl delete pod no-gpu-pod && kubectl apply -f gpu-pod.yaml',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  tolerations:
  - key: dedicated
    operator: Equal
    value: gpu
    effect: NoSchedule
  containers:
  - name: nginx
    image: nginx:1.27`,
          output: [
            'pod "no-gpu-pod" deleted',
            'pod/gpu-pod created',
            '',
            'NAME       READY   STATUS    RESTARTS   AGE   NODE',
            'gpu-pod    1/1     Running   0          5s    node-2',
          ],
          explanation: 'The toleration tells the scheduler "this Pod can tolerate the taint dedicated=gpu:NoSchedule". The Pod is now allowed on node-2. Note: a toleration does NOT force the Pod onto a tainted node — it just permits it. To force placement on node-2, you would combine the toleration with a nodeSelector or nodeAffinity targeting node-2.',
          clusterState: {
            pods: [
              { id: 'ssd-pod-xyz', name: 'ssd-pod', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
              { id: 'gpu-pod', name: 'gpu-pod', namespace: 'default', node: 'node-2', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['gpu-pod toleration matches dedicated=gpu:NoSchedule', 'gpu-pod scheduled on node-2 (tainted)'],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p4-m4-s5',
          title: 'Remove the taint',
          instruction: 'Remove the GPU taint from node-2 using the trailing dash syntax.',
          command: 'kubectl taint nodes node-2 dedicated=gpu:NoSchedule-',
          output: ['node/node-2 untainted'],
          explanation: 'Appending "-" to the taint specification removes it. After this, node-2 is schedulable by all Pods again — no toleration required. Existing Pods on node-2 (like gpu-pod) are not affected because NoSchedule only prevents new scheduling; it does not evict existing Pods (that would be NoExecute).',
          clusterState: {
            pods: [
              { id: 'ssd-pod-xyz', name: 'ssd-pod', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
              { id: 'gpu-pod', name: 'gpu-pod', namespace: 'default', node: 'node-2', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Taint dedicated=gpu:NoSchedule removed from node-2', 'node-2 schedulable for all Pods again'],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p4-m4-s6',
          title: 'Spread replicas with Pod anti-affinity',
          instruction: 'Deploy a 2-replica app with required pod anti-affinity to guarantee each replica lands on a different node.',
          command: 'kubectl apply -f web-anti-affinity.yaml',
          yamlContent: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: web
            topologyKey: kubernetes.io/hostname
      containers:
      - name: nginx
        image: nginx:1.27`,
          output: ['deployment.apps/web created'],
          explanation: 'requiredDuringSchedulingIgnoredDuringExecution means this is a hard rule — the Pod will not schedule if no node satisfies it. topologyKey: kubernetes.io/hostname means "no two Pods with app=web can share the same hostname (node)". If you have 2 nodes, replica 1 goes to node-1 and replica 2 goes to node-2. If node-1 fails, only one replica is lost — not both.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-def34', name: 'web-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'web-deploy', name: 'web', namespace: 'default', replicas: 2, availableReplicas: 2, image: 'nginx:1.27' },
            ],
            namespaces: ['default'],
            events: ['Pod web-abc12 → node-1', 'Pod web-def34 → node-2 (anti-affinity: different hostname required)'],
            highlightedComponent: 'scheduler',
          },
          tip: 'If you scale to 3 replicas but only have 2 nodes, the 3rd Pod will stay Pending — required anti-affinity cannot be satisfied. Use preferredDuringSchedulingIgnoredDuringExecution for a soft spread that still allows scheduling when nodes run out.',
        },
      ],
      quiz: [
        {
          id: 'p4-m4-q1',
          question: 'A node has taint env=prod:NoSchedule. A Pod has no tolerations. Where does it get scheduled?',
          options: [
            'On the tainted node — NoSchedule only affects Pods with conflicting tolerations',
            'On any node that does NOT have the env=prod:NoSchedule taint',
            'The Pod is immediately evicted from the cluster',
            'The Pod is scheduled on the control plane node instead',
          ],
          answer: 1,
          explanation: 'NoSchedule prevents new Pods without a matching toleration from being scheduled on that node. The Pod will be placed on any other available node that does not carry the taint (or that the Pod tolerates). If all nodes carry the taint, the Pod stays Pending.',
        },
        {
          id: 'p4-m4-q2',
          question: 'What is the difference between NoSchedule and NoExecute taint effects?',
          options: [
            'NoSchedule is for system Pods only; NoExecute is for user Pods',
            'NoSchedule prevents new Pods from scheduling but does not evict existing Pods; NoExecute also evicts existing Pods that lack a matching toleration',
            'NoExecute is a softer version of NoSchedule — it prefers not to schedule but does not block',
            'They are identical — the difference is only cosmetic',
          ],
          answer: 1,
          explanation: 'NoSchedule only affects new Pod scheduling — Pods already running on the node are unaffected. NoExecute is more aggressive: it also evicts existing Pods that do not have a matching toleration. NoExecute is used for situations like node maintenance or detected hardware problems where you want existing workloads to vacate the node.',
        },
        {
          id: 'p4-m4-q3',
          question: 'You want 3 replicas of your app to ALWAYS run on different nodes. Which feature ensures this?',
          options: [
            'nodeSelector with three different node names',
            'Pod Anti-Affinity with requiredDuringSchedulingIgnoredDuringExecution and topologyKey: kubernetes.io/hostname',
            'Pod Anti-Affinity with preferredDuringSchedulingIgnoredDuringExecution',
            'Three separate Deployments each with replicas: 1 and a different nodeSelector',
          ],
          answer: 1,
          explanation: 'Required Pod Anti-Affinity with topologyKey: kubernetes.io/hostname enforces that no two Pods with the matching label can land on the same node. If the constraint cannot be satisfied (not enough nodes), Pods stay Pending rather than co-locating. "preferred" would only try to spread, not guarantee it.',
        },
        {
          id: 'p4-m4-q4',
          question: 'nodeSelector vs Node Affinity — when would you choose Node Affinity over nodeSelector?',
          options: [
            'Node Affinity is always better — nodeSelector is deprecated',
            'When you need operators other than equality (In, NotIn, Exists, Gt, Lt) or when you want soft/preferred placement rules',
            'When you need to schedule on more than one node simultaneously',
            'Node Affinity is for Pods; nodeSelector is for Deployments',
          ],
          answer: 1,
          explanation: 'nodeSelector only supports exact label equality. Node Affinity supports richer expressions (In, NotIn, Exists, DoesNotExist, Gt, Lt) and adds the concept of preferred (soft) rules. nodeSelector is not deprecated — it is still valid for simple use cases. Node Affinity is the choice when you need expressive matching or soft preferences.',
        },
        {
          id: 'p4-m4-q5',
          question: 'How do you REMOVE a taint from a node?',
          options: [
            'kubectl delete taint nodes node-2 dedicated=gpu:NoSchedule',
            'kubectl taint nodes node-2 dedicated=gpu:NoSchedule-  (trailing dash)',
            'kubectl label nodes node-2 dedicated-',
            'kubectl patch node node-2 -p \'{"spec":{"taints":[]}}\'',
          ],
          answer: 1,
          explanation: 'Appending a "-" to the taint specification in kubectl taint removes it. The full syntax is kubectl taint nodes <node-name> <key>=<value>:<effect>-. The trailing dash is the removal signal. kubectl label uses the same trailing-dash pattern for removing labels, but taints are a separate spec field managed via kubectl taint.',
        },
      ],
    },

    // ─── Module 5: PodDisruptionBudgets & Cluster Maintenance ────────────────
    {
      id: 'p4-m5',
      slug: 'pdb',
      title: 'PodDisruptionBudgets & Cluster Maintenance',
      description: 'Protect application availability during node drains and cluster upgrades with PodDisruptionBudgets.',
      duration: '60 min',
      difficulty: 'advanced',
      theory: `## Types of Disruptions

Not all Pod disruptions are equal:

| Type | Examples | Can PDB prevent it? |
|---|---|---|
| **Voluntary** | Node drain, cluster upgrade, autoscaler scale-down, admin deletes pod | Yes |
| **Involuntary** | Hardware failure, kernel panic, OOM kill, network partition | No |

PodDisruptionBudgets only protect against **voluntary** disruptions.

## PodDisruptionBudget (PDB)

A PDB sets a **minimum availability guarantee** during voluntary disruptions:

\`\`\`yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web
\`\`\`

| Field | Description |
|---|---|
| \`minAvailable: 2\` | At least 2 Pods must remain available during disruption |
| \`minAvailable: "80%"\` | At least 80% of Pods must remain available |
| \`maxUnavailable: 1\` | At most 1 Pod can be unavailable at a time |

Only one of \`minAvailable\` or \`maxUnavailable\` can be set.

## Node Maintenance Workflow

\`\`\`
kubectl cordon node-1       # Mark unschedulable (no new pods)
        ↓
kubectl drain node-1        # Evict existing pods (respects PDBs)
        ↓
  [perform maintenance]     # Upgrade kernel, replace hardware, etc.
        ↓
kubectl uncordon node-1     # Re-enable scheduling
\`\`\`

### kubectl cordon
Marks the node as \`Unschedulable\`. New Pods will not be scheduled there, but **existing Pods keep running**. The node remains in the cluster and can serve traffic.

### kubectl drain
- First cordons the node
- Then sends eviction requests for all Pods (respecting PDBs and termination grace periods)
- Flags: \`--ignore-daemonsets\` (DaemonSet Pods are re-created immediately), \`--delete-emptydir-data\` (allows draining Pods with emptyDir volumes)

**If a PDB would be violated, drain blocks until the constraint is satisfied.**

### kubectl uncordon
Removes the \`Unschedulable\` mark. The node rejoins the pool and new Pods can be scheduled on it.

## Critical Rule

A PDB cannot protect more Pods than exist. If you have \`minAvailable: 3\` but only 3 replicas, zero disruptions are allowed — draining any node is blocked. Always ensure \`replicas > minAvailable\`.`,
      labSteps: [
        {
          id: 'p4-m5-s1',
          title: 'Deploy an app and create a PDB',
          instruction: 'Deploy a 3-replica app and create a PodDisruptionBudget requiring at least 2 Pods to remain available.',
          command: 'kubectl apply -f web-deploy.yaml && kubectl apply -f web-pdb.yaml',
          yamlContent: `apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
  namespace: default
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web`,
          output: [
            'deployment.apps/web created',
            'poddisruptionbudget.policy/web-pdb created',
          ],
          explanation: 'With 3 replicas and minAvailable: 2, only 1 Pod can be disrupted at any given time (3 - 2 = 1 allowed disruption). This means kubectl drain can only evict one Pod at a time — it must wait for a replacement to start and become Ready before proceeding to the next.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-def34', name: 'web-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-ghi56', name: 'web-ghi56', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'web-deploy', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.27' },
            ],
            namespaces: ['default'],
            events: ['Deployment web: 3/3 replicas running', 'PDB web-pdb created: minAvailable=2'],
            highlightedComponent: 'controller',
          },
        },
        {
          id: 'p4-m5-s2',
          title: 'Inspect the PDB',
          instruction: 'Check the PDB status to see how many disruptions are currently allowed.',
          command: 'kubectl get pdb',
          output: [
            'NAME      MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS   AGE',
            'web-pdb   2               N/A               1                     30s',
          ],
          explanation: 'ALLOWED DISRUPTIONS: 1 means exactly one Pod can be evicted right now (3 running - 2 required = 1 allowed). This number updates dynamically as Pods are evicted and replaced. If a Pod crashes and only 2 are running, ALLOWED DISRUPTIONS drops to 0 — drain would be blocked until the replacement starts.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-def34', name: 'web-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-ghi56', name: 'web-ghi56', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'web-deploy', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.27' },
            ],
            namespaces: ['default'],
            events: ['PDB web-pdb: ALLOWED DISRUPTIONS=1 (3 running - 2 required)'],
            highlightedComponent: 'controller',
          },
          tip: 'kubectl describe pdb web-pdb shows additional details including the current disruption count and whether a drain is blocked.',
        },
        {
          id: 'p4-m5-s3',
          title: 'Cordon a node',
          instruction: 'Mark node-1 as unschedulable — new Pods will not land there, but existing Pods keep running.',
          command: 'kubectl cordon node-1',
          output: ['node/node-1 cordoned'],
          explanation: 'Cordoning sets node.spec.unschedulable=true. The scheduler will not place new Pods on node-1. Existing Pods (web-abc12, web-ghi56) continue running and serving traffic normally. This is the first step before maintenance — it prevents new work from landing on the node you are about to drain.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-def34', name: 'web-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-ghi56', name: 'web-ghi56', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'web-deploy', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.27' },
            ],
            namespaces: ['default'],
            events: ['node-1 cordoned: SchedulingDisabled', 'Existing Pods on node-1 continue running'],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p4-m5-s4',
          title: 'Drain the node',
          instruction: 'Drain node-1 — the PDB ensures at least 2 Pods remain available throughout the eviction.',
          command: 'kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data',
          output: [
            'node/node-1 already cordoned',
            'Warning: ignoring DaemonSet-managed Pods: kube-system/kube-proxy-abc12',
            'evicting pod default/web-abc12',
            'evicting pod default/web-ghi56',
            'error when evicting pods/"web-ghi56" (will retry after 5s): Cannot evict pod as it would violate the pod\'s disruption budget.',
            'evicting pod default/web-ghi56',
            'pod/web-abc12 evicted',
            'pod/web-ghi56 evicted',
            'node/node-1 drained',
          ],
          explanation: 'The drain tried to evict both Pods simultaneously, but the PDB blocked the second eviction until the first Pod\'s replacement was Running and Ready on node-2. The drain retried every 5 seconds until the constraint was satisfied. This is exactly the behavior you want: zero downtime maintenance.',
          clusterState: {
            pods: [
              { id: 'web-def34', name: 'web-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-jkl78', name: 'web-jkl78', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-mno90', name: 'web-mno90', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'web-deploy', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.27' },
            ],
            namespaces: ['default'],
            events: ['node-1 drained: Pods evicted respecting PDB minAvailable=2', 'All 3 replicas rescheduled on node-2'],
            highlightedComponent: 'kubelet',
          },
          tip: 'If drain gets stuck with "Cannot evict pod as it would violate the pod\'s disruption budget", check kubectl get pdb — ALLOWED DISRUPTIONS=0 means all disruption budget is used up. Wait for Pods to become Ready on other nodes.',
        },
        {
          id: 'p4-m5-s5',
          title: 'Uncordon the node',
          instruction: 'Return node-1 to service after maintenance is complete.',
          command: 'kubectl uncordon node-1',
          output: ['node/node-1 uncordoned'],
          explanation: 'Uncordoning removes the Unschedulable taint. node-1 rejoins the scheduling pool. The Deployment\'s Pods do not automatically move back to node-1 — they continue running on node-2. New Pods created by future scaling events or Pod restarts may land on either node. In a real cluster upgrade, you repeat this workflow for each node: cordon → drain → upgrade kubelet/containerd → uncordon → move to next node.',
          clusterState: {
            pods: [
              { id: 'web-def34', name: 'web-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-jkl78', name: 'web-jkl78', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-mno90', name: 'web-mno90', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'web-deploy', name: 'web', namespace: 'default', replicas: 3, availableReplicas: 3, image: 'nginx:1.27' },
            ],
            namespaces: ['default'],
            events: ['node-1 uncordoned: SchedulingEnabled', 'node-1 back in rotation — maintenance complete'],
            highlightedComponent: 'scheduler',
          },
        },
      ],
      quiz: [
        {
          id: 'p4-m5-q1',
          question: 'You have a PDB with minAvailable: 3 but only 3 replicas. What happens when you drain a node?',
          options: [
            'Drain proceeds normally — PDBs are advisory, not enforced during drain',
            'Drain is blocked indefinitely — evicting any Pod would drop availability below 3',
            'Kubernetes automatically scales up to 4 replicas to satisfy the PDB before draining',
            'The PDB is temporarily suspended during drain operations',
          ],
          answer: 1,
          explanation: 'With minAvailable: 3 and exactly 3 running Pods, ALLOWED DISRUPTIONS is 0. kubectl drain will block because any eviction would violate the budget. The fix is to scale up to at least 4 replicas first (making ALLOWED DISRUPTIONS = 1), then drain. PDBs are fully enforced during eviction.',
        },
        {
          id: 'p4-m5-q2',
          question: 'What is the difference between kubectl cordon and kubectl drain?',
          options: [
            'cordon deletes Pods immediately; drain marks the node unschedulable first',
            'cordon marks the node unschedulable but leaves existing Pods running; drain cordons AND evicts existing Pods',
            'They are identical — both evict all Pods and mark the node unschedulable',
            'cordon is for worker nodes; drain is for control plane nodes',
          ],
          answer: 1,
          explanation: 'cordon only sets the Unschedulable flag — existing Pods keep running and serving traffic. drain first cordons the node, then sends eviction requests for all non-DaemonSet Pods (respecting PDBs and grace periods). Use cordon alone when you want to prevent new scheduling without disrupting existing workloads.',
        },
        {
          id: 'p4-m5-q3',
          question: 'A PDB protects against which type of disruption?',
          options: [
            'Both voluntary and involuntary disruptions',
            'Only voluntary disruptions such as node drains, cluster upgrades, and autoscaler scale-downs',
            'Only involuntary disruptions such as hardware failures and kernel panics',
            'Only disruptions caused by the Kubernetes controller manager',
          ],
          answer: 1,
          explanation: 'PDBs only protect against voluntary disruptions — actions initiated by the cluster (drain, eviction API, autoscaler). They cannot prevent involuntary disruptions like node hardware failures, OOM kills, or kernel panics. For protection against involuntary disruptions, you need multiple replicas spread across failure domains.',
        },
        {
          id: 'p4-m5-q4',
          question: 'During a rolling cluster upgrade, what is the correct order of operations per node?',
          options: [
            'uncordon → upgrade → drain',
            'drain → upgrade → cordon → uncordon',
            'cordon → drain → upgrade → uncordon',
            'upgrade → cordon → drain → uncordon',
          ],
          answer: 2,
          explanation: 'The correct sequence is: (1) cordon — stop new Pods from scheduling on the node; (2) drain — evict existing Pods to other nodes (respecting PDBs); (3) upgrade — update kubelet, containerd, OS, etc.; (4) uncordon — return the node to the scheduling pool. Starting with the upgrade while Pods are still running is risky — the kubelet version change can cause issues.',
        },
      ],
    },
  ],
}

export default phase4
