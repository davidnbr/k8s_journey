import type { Phase, ClusterState } from '@/lib/types'

const emptyCluster: ClusterState = {
  pods: [],
  services: [],
  deployments: [],
  namespaces: ['default'],
  events: [],
}

const phase4: Phase = {
  id: 'phase-4',
  slug: 'phase-4',
  title: 'Security, Scheduling & Reliability',
  shortTitle: 'Security & Scale',
  description:
    'Secure your cluster with RBAC, autoscale workloads with HPA, control scheduling with taints and affinity, and protect availability with PodDisruptionBudgets.',
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
      description:
        'Secure your cluster with Roles, ClusterRoles, and ServiceAccounts — granting only the permissions each workload actually needs.',
      duration: '75 min',
      difficulty: 'intermediate',
      theory: `> 🧠 **Brain Warm-Up**: If Kubernetes has no built-in database for human users, how does the API server actually authenticate and authorize a \`kubectl\` command run by a cluster administrator? How are permissions bound to a ServiceAccount under the hood? Think about this security handshake before reading.

## Kubernetes Has No Built-In User Accounts

Unlike database systems or operating systems, Kubernetes has **no built-in user database**. There is no \`kubectl create user\` command, and human user objects do not exist in etcd. Human identity is decoupled and comes from:
- **x509 client certificates**: The API server authenticates requests by validating a client certificate signed by the cluster root Certificate Authority (CA). The Certificate's Common Name (CN) is parsed as the username, and the Organization (O) fields are mapped to groups (e.g., \`system:masters\`).
- **OIDC tokens**: The API server authenticates JWTs from an external identity provider (like Dex, Okta, Keycloak, Google, or Azure AD) configured via api-server flags (\`--oidc-issuer-url\`, etc.).
- **Static token files / Webhooks**: The API server delegates authentication to an external HTTPS webhook or reads from a local CSV token file.

Kubernetes does, however, have a first-class, etcd-persisted object for workload identity: the **ServiceAccount**.

## ServiceAccount

A **ServiceAccount** is a namespaced identity for **Pods** (not humans). Every namespace has a \`default\` ServiceAccount that all Pods use unless you specify otherwise.

\`\`\`yaml
spec:
  serviceAccountName: app-reader
\`\`\`

Starting in Kubernetes 1.24+, tokens are no longer statically stored as Secret objects in etcd. Instead, they are dynamic, short-lived (audience-bound and time-bound) JWTs generated on-demand by the **TokenRequest** API. The \`kubelet\` automatically projects this token into the Pod container at \`/var/run/secrets/kubernetes.io/serviceaccount/token\` using a projected volume mounted on a \`tmpfs\` (RAM disk) to prevent local disk exposure.

### Visualizing RBAC Authorization Flow

                  HTTP/gRPC Request (kubectl or Pod)
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                    KUBERNETES API SERVER                    │
 │                                                             │
 │  [Phase 1: Authentication (Authn)]                          │
 │  - X.509 client certificates (signed by Cluster CA)         │
 │  - OIDC / Webhook tokens (e.g., Dex, Okta, Azure AD)        │
 │  - ServiceAccount JWT (TokenRequest API projected volume)   │
 │                              │                              │
 │                              ▼ (Identity Resolved)          │
 │                                                             │
 │  [Phase 2: Authorization (Authz)]                           │
 │  - RBAC Engine: Evaluates Rules & Bindings                  │
 │  - Subjects (User / Group / ServiceAccount)                 │
 │  - API Group & Resource mapping (e.g., apiGroups: [""])     │
 │  - Verbs validation (get, list, watch, create, update...)   │
 │                              │                              │
 │                              ▼ (Access Granted)             │
 │                                                             │
 │  [Phase 3: Admission Control]                               │
 │  - Mutating & Validating Webhooks                           │
 │                              │                              │
 └──────────────────────────────┼──────────────────────────────┘
                                ▼
                         [etcd Storage]
                     (Raft consensus commit)

## Roles and ClusterRoles

Permissions are strictly additive (whitelist-only); there are no deny rules.

| Object | Scope | Use case |
|---|---|---|
| **Role** | Namespace-scoped | Grant access to resources inside a single namespace |
| **ClusterRole** | Cluster-scoped | Access across all namespaces, or cluster-scoped resources (Nodes, PVs, namespaces) |

A Role defines **what** is allowed — resources, API groups, and verbs:

\`\`\`yaml
rules:
- apiGroups: [""] # "" indicates the core API group
  resources: ["pods", "pods/status", "pods/log"] # resources and subresources
  verbs: ["get", "list", "watch"]
\`\`\`

Available verbs: \`get\` (fetch specific resource), \`list\` (list resources), \`watch\` (stream real-time changes), \`create\` (POST new), \`update\` (PUT replace), \`patch\` (PATCH modify), \`delete\` (DELETE single), \`deletecollection\` (DELETE bulk).

API request paths map to resources:
- Core group: \`/api/v1/namespaces/default/pods\`
- Named group: \`/apis/apps/v1/namespaces/default/deployments\`

## RoleBindings and ClusterRoleBindings

A **RoleBinding** attaches a Role (or ClusterRole) to a **subject** — a User, Group, or ServiceAccount — within one namespace.
A **ClusterRoleBinding** attaches a ClusterRole to a subject cluster-wide.

\`\`\`
Role ──────────────────────── RoleBinding ──── Subject (ServiceAccount / User)
ClusterRole ──── ClusterRoleBinding ──── Subject (cluster-wide)
ClusterRole ──── RoleBinding ──── Subject (restricted to RoleBinding's namespace)
\`\`\`

> [!NOTE]
> Binding a ClusterRole using a RoleBinding is a common best practice. It allows you to reuse standard, cluster-wide defined ClusterRoles (like the built-in \`view\` or \`edit\`) while restricting the subject's access strictly to the namespace of the RoleBinding.

## Principle of Least Privilege & SubjectAccessReview

Grant only the minimum permissions required. Common security risks include:
- Using \`ClusterRoleBinding\` when a namespaced \`RoleBinding\` is sufficient.
- Granting \`*\` wildcard verbs on \`*\` wildcard resources.
- Granting update permissions on security-sensitive resources like \`secrets\` or \`pods/exec\`.

Under the hood, authorization checks are evaluated by the API server using a **SubjectAccessReview** API call. You can run this check locally using:
\`\`\`bash
kubectl auth can-i list pods --as=system:serviceaccount:default:app-reader
\`\`\`\``,
      labSteps: [
        {
          id: 'p4-m1-s1',
          title: 'Inspect the default ServiceAccount',
          instruction:
            'List ServiceAccounts in the default namespace and describe the default SA to see its auto-mounted token.',
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
          explanation:
            'Every namespace automatically gets a "default" ServiceAccount. Any Pod that does not specify serviceAccountName uses this SA. In Kubernetes 1.24+, tokens are no longer auto-created as Secret objects — instead, the token is projected into the Pod at runtime via the TokenRequest API.',
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
          instruction:
            'Create a new ServiceAccount named app-reader that your Pod will use instead of the default.',
          command: 'kubectl create serviceaccount app-reader -n default',
          output: ['serviceaccount/app-reader created'],
          explanation:
            'Creating a dedicated ServiceAccount per application is a best practice. It lets you grant exactly the permissions that app needs — and no more. The default ServiceAccount should have minimal (ideally zero) permissions so that misconfigured Pods cannot accidentally access the API.',
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
          instruction:
            'Create a Role that grants read-only access to Pods in the default namespace.',
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
          explanation:
            'The Role is namespaced — it only applies within "default". The apiGroups: [""] refers to the core API group (pods, services, configmaps, secrets, etc.). The verbs "get", "list", "watch" correspond to kubectl get, kubectl get --watch, and direct API reads. No create, update, or delete verbs are granted.',
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
          explanation:
            'The RoleBinding connects the subject (app-reader ServiceAccount) to the role (pod-reader). The roleRef is immutable after creation — to change what role is bound, you must delete and recreate the RoleBinding. The subjects array can include multiple Users, Groups, or ServiceAccounts.',
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
          explanation:
            'kubectl auth can-i performs a SubjectAccessReview against the API server — it checks what a given subject is allowed to do without actually running the action. The --as flag impersonates the subject. The format for ServiceAccounts is system:serviceaccount:<namespace>:<name>.',
          clusterState: {
            pods: [
              {
                id: 'reader-pod-abc12',
                name: 'reader-pod-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'reader' },
                image: 'busybox:1.36',
                restarts: 0,
              },
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
          instruction:
            'Confirm that the app-reader ServiceAccount cannot delete Pods — least privilege in action.',
          command: 'kubectl auth can-i delete pods --as=system:serviceaccount:default:app-reader',
          output: ['no'],
          explanation:
            'The pod-reader Role only grants get, list, and watch. Delete was not included, so this SubjectAccessReview returns "no". This is the principle of least privilege: the ServiceAccount can do its job (reading pod status) but cannot disrupt the cluster by deleting pods.',
          clusterState: {
            pods: [
              {
                id: 'reader-pod-abc12',
                name: 'reader-pod-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'reader' },
                image: 'busybox:1.36',
                restarts: 0,
              },
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
          explanation:
            'A Role is scoped to a single namespace — permissions it grants only apply within that namespace. A ClusterRole is cluster-wide and can grant access across all namespaces or to cluster-scoped resources like Nodes and PersistentVolumes. A ClusterRole can actually be bound with a RoleBinding to restrict its scope to a specific namespace.',
        },
        {
          id: 'p4-m1-q2',
          question:
            'A Pod needs to call the Kubernetes API to list ConfigMaps. What Kubernetes resource gives it that identity?',
          options: [
            'A User account configured in /etc/kubernetes/users.conf',
            'A ServiceAccount — a namespaced identity that Pods use to authenticate to the API',
            'A ClusterRole — the Pod must have cluster-wide permissions to call the API',
            'An OIDC token injected via a Secret',
          ],
          answer: 1,
          explanation:
            'ServiceAccounts are the identity mechanism for Pods. Kubernetes has no built-in user accounts for workloads. The Pod authenticates using a projected ServiceAccount token, which is automatically mounted at /var/run/secrets/kubernetes.io/serviceaccount/token.',
        },
        {
          id: 'p4-m1-q3',
          question:
            'You want to grant a ServiceAccount read access to Secrets in ONLY the "staging" namespace. Which combination is correct?',
          options: [
            'ClusterRole + ClusterRoleBinding',
            'Role in staging namespace + RoleBinding in staging namespace',
            'ClusterRole + RoleBinding in staging namespace',
            'Either B or C — both correctly limit access to the staging namespace',
          ],
          answer: 3,
          explanation:
            'Both options B and C work. A Role scoped to "staging" + a RoleBinding in "staging" is the cleanest approach. Alternatively, you can use a ClusterRole (reusable across namespaces) bound by a RoleBinding in "staging" — the RoleBinding\'s namespace determines the scope. A ClusterRoleBinding would grant access cluster-wide, which is too broad.',
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
          explanation:
            'kubectl auth can-i performs a SubjectAccessReview against the API server. It checks whether the current user (or an impersonated subject via --as) is allowed to perform a specific action on a specific resource. It returns "yes" or "no" and is the primary tool for verifying RBAC permissions.',
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
          explanation:
            'kubectl get pods (without a name) uses the "list" verb. kubectl get pods <name> uses the "get" verb. To safely allow both, always grant both "get" and "list" together. "watch" is needed for kubectl get pods --watch. There is no "read" or "view" verb in Kubernetes RBAC.',
        },
      ],
      coverage: {
        concepts: [
          'RBAC: Role, ClusterRole, RoleBinding, ClusterRoleBinding',
          'ServiceAccount as pod identity',
          'subjects: User, Group, ServiceAccount',
          'verbs: get/list/watch/create/update/patch/delete',
          'least privilege principle',
          'kubectl auth can-i for permission checks',
        ],
        commands: [
          'kubectl create serviceaccount',
          'kubectl create role',
          'kubectl create clusterrole',
          'kubectl create rolebinding',
          'kubectl create clusterrolebinding',
          'kubectl auth can-i',
          'kubectl auth can-i --as=system:serviceaccount:ns:sa',
          'kubectl get rolebindings -A',
        ],
        architecture: [
          'Role is namespace-scoped, ClusterRole is cluster-scoped',
          'RoleBinding grants Role or ClusterRole within namespace',
          'ClusterRoleBinding grants ClusterRole cluster-wide',
          'ServiceAccount token auto-mounted at /var/run/secrets/kubernetes.io/serviceaccount',
        ],
        techniques: [
          'least-privilege SA per workload',
          'impersonation with --as for testing permissions',
          'audit RBAC with kubectl auth can-i --list',
          'bind ClusterRole with RoleBinding for namespace-scoped access',
        ],
        procedures: [
          'create ServiceAccount',
          'create Role with specific verbs',
          'bind Role to ServiceAccount',
          'verify permissions with auth can-i',
          'check what SA can do with --list',
        ],
        toolsAndPlugins: ['kubectl', 'minikube'],
        cases: [
          'pod using default SA has too many permissions',
          'ServiceAccount missing binding → 403 Forbidden on API call',
          'ClusterRoleBinding grants unintended cluster-wide access',
        ],
        scenarios: [
          'create read-only SA for a monitoring pod',
          'debug 403 errors from pod making API calls',
        ],
      },
      exercises: [
        {
          id: 'p4-m1-e1',
          title: 'Create a least-privilege ServiceAccount',
          kind: 'guided',
          goal: 'Create a ServiceAccount with read-only pod access in one namespace.',
          commands: [
            'kubectl create serviceaccount pod-reader -n default',
            'kubectl create role pod-reader-role --verb=get,list,watch --resource=pods -n default',
            'kubectl create rolebinding pod-reader-binding --role=pod-reader-role --serviceaccount=default:pod-reader -n default',
            'kubectl auth can-i list pods --as=system:serviceaccount:default:pod-reader',
            'kubectl auth can-i delete pods --as=system:serviceaccount:default:pod-reader',
            'kubectl auth can-i list deployments --as=system:serviceaccount:default:pod-reader',
          ],
          verify: [
            'auth can-i list pods returns yes',
            'auth can-i delete pods returns no',
            'auth can-i list deployments returns no',
          ],
          expectedOutcome: 'Read-only pod SA created; least privilege confirmed with auth can-i.',
          cleanup: [
            'kubectl delete rolebinding pod-reader-binding',
            'kubectl delete role pod-reader-role',
            'kubectl delete serviceaccount pod-reader',
          ],
        },
        {
          id: 'p4-m1-e2',
          title: 'Test SA permissions with impersonation',
          kind: 'challenge',
          goal: 'Use --as to impersonate a ServiceAccount and verify all its permissions.',
          commands: [
            'kubectl create serviceaccount auditor -n default',
            'kubectl create clusterrole read-only-auditor --verb=get,list --resource=pods,services,deployments,configmaps',
            'kubectl create clusterrolebinding auditor-binding --clusterrole=read-only-auditor --serviceaccount=default:auditor',
            'kubectl auth can-i --list --as=system:serviceaccount:default:auditor -n default',
            'kubectl auth can-i create pods --as=system:serviceaccount:default:auditor',
            'kubectl auth can-i get secrets --as=system:serviceaccount:default:auditor',
          ],
          verify: [
            '--list shows get/list for pods/services/deployments/configmaps',
            'create pods returns no',
            'get secrets returns no',
          ],
          expectedOutcome: 'SA permissions fully audited with --as impersonation and --list.',
          cleanup: [
            'kubectl delete clusterrolebinding auditor-binding',
            'kubectl delete clusterrole read-only-auditor',
            'kubectl delete serviceaccount auditor',
          ],
        },
        {
          id: 'p4-m1-e3',
          title: 'Debug 403 Forbidden from pod API call',
          kind: 'debug',
          goal: 'Reproduce and diagnose a 403 error from a pod making Kubernetes API calls.',
          commands: [
            'kubectl create serviceaccount no-perms -n default',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: api-caller
spec:
  serviceAccountName: no-perms
  containers:
  - name: caller
    image: bitnami/kubectl:latest
    command: ["sh", "-c", "kubectl get pods; sleep 3600"]
EOF`,
            'kubectl logs api-caller',
            'kubectl auth can-i list pods --as=system:serviceaccount:default:no-perms',
          ],
          verify: ['kubectl logs shows 403 Forbidden error', 'auth can-i returns no'],
          expectedOutcome: '403 traced to missing RoleBinding for the pod ServiceAccount.',
          cleanup: [
            'kubectl delete pod api-caller --ignore-not-found',
            'kubectl delete serviceaccount no-perms',
          ],
        },
        {
          id: 'p4-m1-e4',
          title: '7-day spaced review — RBAC structure recall',
          kind: 'spaced-review',
          goal: 'Recall the 4 RBAC objects and their relationships from memory.',
          commands: [
            'kubectl explain role.rules',
            'kubectl explain rolebinding.subjects',
            'kubectl explain clusterrolebinding.roleRef',
            'kubectl get clusterroles | grep system:node',
          ],
          verify: [
            'explain returns verbs, resources fields',
            'Can state: Role→namespace, ClusterRole→cluster, RoleBinding→namespace grant, ClusterRoleBinding→cluster grant',
          ],
          expectedOutcome: 'RBAC objects and relationships recalled without notes.',
          cleanup: [],
        },
      ],
    },

    // ─── Module 2: Jobs & CronJobs ───────────────────────────────────────────
    {
      id: 'p4-m2',
      slug: 'jobs',
      title: 'Jobs & CronJobs',
      description:
        'Run batch tasks to completion with Jobs and schedule recurring work with CronJobs.',
      duration: '45 min',
      difficulty: 'beginner',
      theory: `> 🧠 **Brain Warm-Up**: If a CronJob is scheduled to run every hour, but the previous Job execution hangs indefinitely, what happens to the next execution? How does Kubernetes track the status of finished Jobs to avoid overloading nodes? Think about concurrency constraints before reading.

## Why Not Deployments for Batch Work?

Deployments are designed to run forever — they maintain a desired state of continuously running Pods. If a container in a Deployment exits with code 0, the \`kubelet\` interprets this as a termination and the Deployment controller immediately restarts it to maintain replica count. This is wrong for a database migration or batch computation: you want the Pod to run once, complete its task, and stop.

**Jobs** and **CronJobs** are designed specifically for finite, run-to-completion workloads.

## Job Architecture & Restart Policies

A **Job** ensures a specified number of Pods complete successfully (exit code 0).

Unlike Deployments, Jobs support two restart policies in their Pod templates:
1. **\`Never\`**: If the container fails (exits non-zero), the pod is not restarted. Instead, the Job controller spawns a completely new Pod on the cluster. This keeps the failed Pod and its logs intact for troubleshooting, but consumes IP/sandbox resources.
2. **\`OnFailure\`**: If the container fails, the local \`kubelet\` restarts the container inside the *same* Pod sandbox. This avoids scheduling overhead but does not create a clean new Pod.

The Job controller manages the retry logic up to \`backoffLimit\` times (default: 6). If the limit is reached, the Job is marked as failed.

### Visualizing Job Controller Loop

  [ CronJob Controller ] (Ticks on cron schedule)
            │
            ▼ (Creates Job object)
     [ Job Object ] (Specifies completions, parallelism, backoffLimit)
            │
            ▼ (Job Controller observes Job in etcd)
     [ Job Controller ] ◄────────────────────────────────────────┐
            │                                                    │
            ├─► (Spawns N Pods up to parallelism limit)           │
            │                                                    │
            ▼                                                    │ (Updates status)
      ┌───────────┐         ┌───────────┐         ┌───────────┐  │
      │  Pod 1    │         │  Pod 2    │         │  Pod N    │  │
      │ (Running) │         │(Completed)│         │ (Failed)  │──┘
      └─────┬─────┘         └─────┬─────┘         └─────┬─────┘
            │                     │                     │
            ▼                     ▼                     ▼
      Runs to exit         Clean exit 0         RestartPolicy: Never/OnFailure
      status               (Success)            Evicts/recreates up to backoffLimit

### Key Job Fields

| Field | Description |
|---|---|
| \`completions\` | Total number of successful Pod completions required to mark the Job complete. |
| \`parallelism\` | Maximum number of Pods that are allowed to run concurrently at any given moment. |
| \`backoffLimit\` | Maximum number of retries before marking the Job as failed (default: 6). |
| \`activeDeadlineSeconds\` | Real-time execution limit for the Job. If exceeded, the Job is terminated. |
| \`ttlSecondsAfterFinished\` | Time-to-live. Once finished, the Job and its Pods are garbage collected. |

\`\`\`yaml
spec:
  completions: 3
  parallelism: 2
  backoffLimit: 3
  ttlSecondsAfterFinished: 120
\`\`\`

## CronJobs and Concurrency Policies

A **CronJob** manages Jobs on a schedule using standard Unix cron syntax:

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
          instruction:
            'Apply a Job that runs a busybox container, prints a message, and exits successfully.',
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
          explanation:
            'Note restartPolicy: Never — Jobs must use Never or OnFailure (never Deployment\'s default "Always"). With Never, if the container exits with a non-zero code, Kubernetes creates a new Pod rather than restarting the same one. backoffLimit: 3 means Kubernetes will try up to 3 additional times before marking the Job Failed.',
          clusterState: {
            pods: [
              {
                id: 'batch-job-xk9f2',
                name: 'batch-job-xk9f2',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { 'job-name': 'batch-job' },
                image: 'busybox:1.36',
                restarts: 0,
              },
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
          explanation:
            'COMPLETIONS 1/1 means the required number of successful Pod completions has been reached. The Pod status is "Completed" (not Running or Terminated with error). Kubernetes keeps completed Job Pods around so you can inspect logs — until ttlSecondsAfterFinished expires or you delete the Job manually.',
          clusterState: {
            pods: [
              {
                id: 'batch-job-xk9f2',
                name: 'batch-job-xk9f2',
                namespace: 'default',
                node: 'node-1',
                status: 'Terminated',
                labels: { 'job-name': 'batch-job' },
                image: 'busybox:1.36',
                restarts: 0,
              },
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
          explanation:
            'Logs persist on the completed Pod until the Pod is deleted. This is why ttlSecondsAfterFinished is useful — without it, finished Job Pods accumulate. With ttlSecondsAfterFinished: 300, the Job and its Pods are automatically cleaned up 5 minutes after completion.',
          clusterState: {
            pods: [
              {
                id: 'batch-job-xk9f2',
                name: 'batch-job-xk9f2',
                namespace: 'default',
                node: 'node-1',
                status: 'Terminated',
                labels: { 'job-name': 'batch-job' },
                image: 'busybox:1.36',
                restarts: 0,
              },
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
          explanation:
            'The CronJob wraps a jobTemplate — it creates a new Job object at each scheduled tick. successfulJobsHistoryLimit: 3 keeps the last 3 successful Jobs for inspection. concurrencyPolicy: Forbid ensures that if a previous run is still executing when the next tick fires, the new run is skipped rather than running concurrently.',
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
          instruction:
            'Wait one minute and check that the CronJob has automatically created a Job.',
          command: 'kubectl get cronjobs && kubectl get jobs',
          output: [
            'NAME    SCHEDULE      SUSPEND   ACTIVE   LAST SCHEDULE   AGE',
            'hello   */1 * * * *   False     0        28s             90s',
            '',
            'NAME               COMPLETIONS   DURATION   AGE',
            'hello-28765440     1/1           3s         28s',
          ],
          explanation:
            'The CronJob controller created a Job named hello-<unix-timestamp-minute> automatically. LAST SCHEDULE shows when the most recent Job was triggered. ACTIVE: 0 means no Jobs are currently running (the last one finished). With successfulJobsHistoryLimit: 3, only the 3 most recent successful Jobs are retained.',
          clusterState: {
            pods: [
              {
                id: 'hello-28765440-pqr7x',
                name: 'hello-28765440-pqr7x',
                namespace: 'default',
                node: 'node-2',
                status: 'Terminated',
                labels: { 'job-name': 'hello-28765440' },
                image: 'busybox:1.36',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'CronJob hello triggered Job hello-28765440',
              'Job hello-28765440: COMPLETIONS 1/1',
            ],
            highlightedComponent: 'controller',
          },
          tip: 'kubectl create job --from=cronjob/hello manual-run manually triggers a CronJob immediately — useful for testing without waiting for the schedule.',
        },
      ],
      quiz: [
        {
          id: 'p4-m2-q1',
          question: "A Job's Pod exits with code 1. What does Kubernetes do?",
          options: [
            'The Job is immediately marked as Failed and no retry occurs',
            'Kubernetes retries by creating a new Pod, up to backoffLimit times',
            'Kubernetes restarts the same Pod in place, like a Deployment would',
            'The Job is suspended and waits for manual intervention',
          ],
          answer: 1,
          explanation:
            'With restartPolicy: Never, a failed Pod is not restarted in place. Instead, the Job controller creates a new Pod for the retry. This repeats until the Pod succeeds (exit 0) or the retry count reaches backoffLimit. With restartPolicy: OnFailure, the same Pod is restarted in place.',
        },
        {
          id: 'p4-m2-q2',
          question:
            'What CronJob concurrencyPolicy prevents a new Job from starting if the previous one is still running?',
          options: ['Replace', 'Forbid', 'Allow', 'Block'],
          answer: 1,
          explanation:
            'concurrencyPolicy: Forbid skips the new Job creation if the previous Job is still running. This is useful for jobs that must not run concurrently — such as a database migration or a report that reads and writes the same dataset. "Replace" would cancel the running Job and start a new one. "Allow" (the default) permits concurrent runs.',
        },
        {
          id: 'p4-m2-q3',
          question:
            'You have a database migration that must run exactly once on deploy. Which workload type?',
          options: [
            'Deployment with replicas: 1',
            'DaemonSet so it runs on every node',
            'Job with completions: 1',
            'StatefulSet so the Pod gets a stable identity',
          ],
          answer: 2,
          explanation:
            'ttlSecondsAfterFinished enables the TTL controller to automatically clean up finished Jobs (both Completed and Failed). 300 seconds after the Job reaches a terminal state, the Job object and its Pods are deleted. Without this, finished Jobs accumulate and waste etcd storage. activeDeadlineSeconds is the field that limits maximum runtime.',
        },
      ],
      coverage: {
        concepts: [
          'Job: run pod to completion',
          'completions and parallelism',
          'backoffLimit for retry count',
          'activeDeadlineSeconds for timeout',
          'ttlSecondsAfterFinished for cleanup',
          'CronJob schedule syntax',
          'concurrencyPolicy: Allow/Forbid/Replace',
          'successfulJobsHistoryLimit / failedJobsHistoryLimit',
        ],
        commands: [
          'kubectl create job',
          'kubectl get jobs',
          'kubectl describe job',
          'kubectl logs job/<name>',
          'kubectl create cronjob',
          'kubectl get cronjobs',
          'kubectl create job --from=cronjob/<name> (manual trigger)',
        ],
        architecture: [
          'Job controller creates pods until completions reached',
          'CronJob controller creates Job objects on schedule',
          'failed pod retried up to backoffLimit',
          'TTL controller cleans up finished jobs after ttlSecondsAfterFinished',
        ],
        techniques: [
          'parallel job execution with parallelism field',
          'manual cronjob trigger with kubectl create job --from',
          'suspend a CronJob',
          'inspect job completion status',
        ],
        procedures: [
          'create a one-shot Job',
          'create a CronJob with schedule',
          'manually trigger a CronJob',
          'inspect Job logs',
          'clean up finished Jobs',
        ],
        toolsAndPlugins: ['kubectl', 'minikube'],
        cases: [
          'Job stuck — pod failing and backoffLimit not reached yet',
          'CronJob missed schedule due to concurrencyPolicy: Forbid',
          'Job pods accumulating — ttlSecondsAfterFinished not set',
        ],
        scenarios: [
          'run a database migration as a one-shot Job',
          'schedule nightly report as CronJob with Forbid concurrency',
        ],
      },
      exercises: [
        {
          id: 'p4-m2-e1',
          title: 'Create and inspect a one-shot Job',
          kind: 'guided',
          goal: 'Run a batch job to completion and inspect its status and logs.',
          commands: [
            'kubectl create job hello --image=busybox:1.36 -- sh -c "echo hello from job; date"',
            'kubectl get jobs',
            'kubectl describe job hello',
            'kubectl get pods -l job-name=hello',
            'kubectl logs -l job-name=hello',
          ],
          verify: [
            'Job shows COMPLETIONS 1/1',
            'Pod shows Completed status',
            'logs show hello from job output',
          ],
          expectedOutcome: 'Job ran to completion; logs confirmed.',
          cleanup: ['kubectl delete job hello'],
        },
        {
          id: 'p4-m2-e2',
          title: 'Create a CronJob and manually trigger it',
          kind: 'challenge',
          goal: 'Create a CronJob and run it immediately without waiting for the schedule.',
          commands: [
            'kubectl create cronjob reporter --image=busybox:1.36 --schedule="0 * * * *" -- sh -c "echo report at $(date)"',
            'kubectl get cronjobs',
            'kubectl create job reporter-now --from=cronjob/reporter',
            'kubectl get jobs',
            'kubectl logs -l job-name=reporter-now',
          ],
          verify: [
            'CronJob created with schedule 0 * * * *',
            'Manual job reporter-now completes',
            'logs show report output',
          ],
          expectedOutcome: 'CronJob created; manual trigger works without waiting for schedule.',
          cleanup: ['kubectl delete cronjob reporter', 'kubectl delete job reporter-now'],
        },
        {
          id: 'p4-m2-e3',
          title: 'Diagnose a failed Job stuck in retry loop',
          kind: 'debug',
          goal: 'Observe a Job failing and retrying up to backoffLimit, then diagnose the failure.',
          commands: [
            'kubectl create job failing-job --image=busybox:1.36 -- sh -c "exit 1"',
            'kubectl get pods -l job-name=failing-job -w',
            'kubectl describe job failing-job',
            'kubectl logs -l job-name=failing-job --tail=5',
          ],
          verify: [
            'Job shows BackoffLimitExceeded condition after retries',
            'Pods show Completed with non-zero exit code',
            'describe shows Failed status and retry count',
          ],
          expectedOutcome:
            'Job retry loop diagnosed; BackoffLimitExceeded identified as terminal failure.',
          cleanup: ['kubectl delete job failing-job'],
        },
        {
          id: 'p4-m2-e4',
          title: '3-day spaced review — Job/CronJob commands',
          kind: 'spaced-review',
          goal: 'Recall Job and CronJob creation and inspection commands from memory.',
          commands: [
            'kubectl explain job.spec.backoffLimit',
            'kubectl explain job.spec.ttlSecondsAfterFinished',
            'kubectl explain cronjob.spec.concurrencyPolicy',
          ],
          verify: [
            'explain returns field descriptions',
            'Can state: completions, parallelism, backoffLimit, ttlSecondsAfterFinished purposes',
          ],
          expectedOutcome: 'Job/CronJob fields recalled without notes.',
          cleanup: [],
        },
      ],
    },

    // ─── Module 3: HPA ───────────────────────────────────────────────────────
    {
      id: 'p4-m3',
      slug: 'hpa',
      title: 'Horizontal Pod Autoscaler (HPA)',
      description:
        'Automatically scale replica counts based on CPU, memory, or custom metrics — without manual intervention.',
      duration: '60 min',
      difficulty: 'intermediate',
      theory: `> 🧠 **Brain Warm-Up**: If one of your Pods is in a crash loop and throwing 500 errors (consuming zero CPU), how does the HPA avoid average calculation distortions to prevent shrinking the cluster under load? How is CPU usage actually gathered by metrics-server? Think about metric collection mechanics before reading.

## The Problem with Manual Scaling

In dynamic cloud-native environments, manual scaling via \`kubectl scale deployment --replicas=N\` is insufficient. Real-world traffic spikes (e.g., flash sales, batch reports, media coverage) require real-time, automated reaction.

The **Horizontal Pod Autoscaler (HPA)** implements a closed-loop feedback controller to scale Pods horizontally based on resource metrics or custom metrics.

## HPA Control Loop Architecture

The HPA controller runs inside the \`kube-controller-manager\` as a periodic loop (configured by the \`--horizontal-pod-autoscaler-sync-period\` flag, defaulting to **15 seconds**).

### Autoscaling Metrics Pipeline

  ┌──────────────────────────────────────────────────────────────────┐
  │                           WORKER NODES                           │
  │  ┌─────────────────────────┐        ┌─────────────────────────┐  │
  │  │        Node 1           │        │        Node 2           │  │
  │  │  [Pod A]      [Pod B]   │        │  [Pod C]      [Pod D]   │  │
  │  │   (cgroups v2 stats)    │        │   (cgroups v2 stats)    │  │
  │  │          │              │        │          │              │  │
  │  │          ▼              │        │          ▼              │  │
  │  │   [ Kubelet / cAdvisor ]│        │   [ Kubelet / cAdvisor ]│  │
  │  └──────────┬──────────────┘        └──────────┬──────────────┘  │
  └─────────────┼──────────────────────────────────┼─────────────────┘
                │ (/stats/summary API)             │ (/stats/summary API)
                ▼                                  ▼
         ┌────────────────────────────────────────────────┐
         │                 METRICS SERVER                 │
         │ (Exposes metrics.k8s.io via API Aggregator)    │
         └───────────────────────┬────────────────────────┘
                                 │ gRPC / HTTPS Poll
                                 ▼
         ┌────────────────────────────────────────────────┐
         │            HPA CONTROLLER LOOP                 │
         │       (Calculates: desiredReplicas)            │
         └───────────────────────┬────────────────────────┘
                                 │ Scale Subresource Write (spec.replicas)
                                 ▼
         ┌────────────────────────────────────────────────┐
         │             DEPLOYMENT CONTROLLER              │
         │       (Creates/Terminates Pod replicas)        │
         └────────────────────────────────────────────────┘

1. **Metric Sourcing**: The local \`kubelet\` daemon queries resource stats from the host OS's \`cgroups\` (v1 or v2) using its internal \`cAdvisor\` library. These stats are exposed on the \`/stats/summary\` endpoint.
2. **Metrics Collection**: The **metrics-server** scrapes these endpoints across all nodes, aggregates the data, and exposes it via the API Aggregator under the \`metrics.k8s.io\` API group.
3. **Evaluation**: The HPA controller queries the API server for these metrics and computes the desired replica count.

## The Scaling Algorithm

The replica calculation uses the following formula:

\`\`\`
desiredReplicas = ceil(currentReplicas × (currentMetricValue / targetMetricValue))
\`\`\`

To prevent rapid oscillation (flapping) and scale-down instability:
- **Tolerance**: If the ratio of current to target metric is within a tolerance threshold (default: 0.1 or 10%), the controller skips scaling.
- **Unready/Missing Pods**: If a Pod is unready (e.g., starting up) or has missing metrics, the HPA controller excludes it or makes conservative estimates to prevent prematurely shrinking or growing the workload.

## Requirements and Best Practices

- **Mandatory Resource Requests**: You must define resource requests (\`spec.containers[].resources.requests\`) for HPA. The utilization target is calculated as a percentage of the requested CPU/memory, not the node's total physical capacity.
- **Cool-Down / Stabilization Window**: Scale-up is typically fast to handle traffic spikes. Scale-down uses a **stabilization window** (default is 5 minutes / 300s) to wait for temporary traffic drops to pass before evicting pods.

## Advanced Custom and External Metrics (HPA v2)

The \`autoscaling/v2\` API version adds support for complex scaling conditions:
- **Multiple Metrics**: Evaluate CPU, memory, and custom metrics simultaneously (the HPA uses the largest calculated replica count).
- **Custom Metrics**: Scale based on application metrics (e.g., HTTP requests/sec from Prometheus via the \`custom.metrics.k8s.io\` API).
- **External Metrics**: Scale based on external queue sizes (e.g., AWS SQS queue depth, GCP Pub/Sub backlog via \`external.metrics.k8s.io\`).
- **Scale Behavior Policies**: Explicitly tune the scale-up and scale-down rates via \`spec.behavior\`.`,
      labSteps: [
        {
          id: 'p4-m3-s1',
          title: 'Deploy a CPU-intensive app',
          instruction:
            'Create a Deployment using the HPA example image and expose it as a ClusterIP Service, then set a CPU resource request.',
          command:
            'kubectl create deployment php-apache --image=registry.k8s.io/hpa-example && kubectl expose deployment php-apache --port=80 --target-port=80 && kubectl set resources deployment php-apache --requests=cpu=200m',
          output: [
            'deployment.apps/php-apache created',
            'service/php-apache exposed',
            'deployment.apps/php-apache resource requirements updated',
          ],
          explanation:
            "The hpa-example image runs a PHP app that does CPU-intensive math in a loop — perfect for generating artificial load. Setting requests.cpu=200m is mandatory: HPA calculates utilization as a percentage of this request value, not of the node's total CPU. Without a request, HPA cannot compute a meaningful percentage.",
          clusterState: {
            pods: [
              {
                id: 'php-apache-abc12',
                name: 'php-apache-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'php-apache' },
                image: 'registry.k8s.io/hpa-example',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'php-apache-svc',
                name: 'php-apache',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'php-apache' },
                port: 80,
                clusterIP: '10.96.100.1',
              },
            ],
            deployments: [
              {
                id: 'php-apache-deploy',
                name: 'php-apache',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'registry.k8s.io/hpa-example',
              },
            ],
            namespaces: ['default'],
            events: [
              'Deployment php-apache created (1 replica)',
              'Service php-apache exposed on port 80',
              'CPU request set to 200m',
            ],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p4-m3-s2',
          title: 'Create the HPA',
          instruction:
            'Create an HPA that scales php-apache between 1 and 10 replicas targeting 50% CPU utilization.',
          command: 'kubectl autoscale deployment php-apache --cpu-percent=50 --min=1 --max=10',
          output: ['horizontalpodautoscaler.autoscaling/php-apache autoscaled'],
          explanation:
            'kubectl autoscale is a shortcut for creating an HPA object. It creates an HPA targeting 50% of the CPU request (200m × 50% = 100m). If average CPU usage across all Pods exceeds 100m, HPA will scale up. If it drops well below 100m, HPA will scale down after the stabilization window.',
          clusterState: {
            pods: [
              {
                id: 'php-apache-abc12',
                name: 'php-apache-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'php-apache' },
                image: 'registry.k8s.io/hpa-example',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'php-apache-svc',
                name: 'php-apache',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'php-apache' },
                port: 80,
                clusterIP: '10.96.100.1',
              },
            ],
            deployments: [
              {
                id: 'php-apache-deploy',
                name: 'php-apache',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'registry.k8s.io/hpa-example',
              },
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
          explanation:
            'TARGETS shows "1%/50%" — current CPU utilization is 1% of the 200m request (about 2m of actual CPU), well below the 50% target. REPLICAS is 1 — no scaling has occurred. The HPA is healthy and monitoring.',
          clusterState: {
            pods: [
              {
                id: 'php-apache-abc12',
                name: 'php-apache-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'php-apache' },
                image: 'registry.k8s.io/hpa-example',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'php-apache-svc',
                name: 'php-apache',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'php-apache' },
                port: 80,
                clusterIP: '10.96.100.1',
              },
            ],
            deployments: [
              {
                id: 'php-apache-deploy',
                name: 'php-apache',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'registry.k8s.io/hpa-example',
              },
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
          command:
            'kubectl run -i --tty load-generator --rm --image=busybox:1.36 -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://php-apache; done"',
          output: [
            '(load generator running...)',
            '',
            'NAME         REFERENCE               TARGETS    MINPODS   MAXPODS   REPLICAS   AGE',
            'php-apache   Deployment/php-apache   248%/50%   1         10        1          2m',
            'php-apache   Deployment/php-apache   248%/50%   1         10        5          2m',
            'php-apache   Deployment/php-apache   71%/50%    1         10        7          3m',
          ],
          explanation:
            'The load generator hammers the php-apache endpoint every 10ms. CPU spikes to 248% of target. The HPA control loop fires and scales the Deployment to 5, then 7 replicas. As new Pods join, the load is distributed and CPU per Pod drops. Scale-up is fast — the first scale event happens within 30 seconds of the metric exceeding the target.',
          clusterState: {
            pods: [
              {
                id: 'php-apache-abc12',
                name: 'php-apache-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'php-apache' },
                image: 'registry.k8s.io/hpa-example',
                restarts: 0,
              },
              {
                id: 'php-apache-def34',
                name: 'php-apache-def34',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'php-apache' },
                image: 'registry.k8s.io/hpa-example',
                restarts: 0,
              },
              {
                id: 'php-apache-ghi56',
                name: 'php-apache-ghi56',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'php-apache' },
                image: 'registry.k8s.io/hpa-example',
                restarts: 0,
              },
              {
                id: 'load-generator',
                name: 'load-generator',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: {},
                image: 'busybox:1.36',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'php-apache-svc',
                name: 'php-apache',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'php-apache' },
                port: 80,
                clusterIP: '10.96.100.1',
              },
            ],
            deployments: [
              {
                id: 'php-apache-deploy',
                name: 'php-apache',
                namespace: 'default',
                replicas: 7,
                availableReplicas: 7,
                image: 'registry.k8s.io/hpa-example',
              },
            ],
            namespaces: ['default'],
            events: [
              'CPU spike: 248% of target',
              'HPA scaled php-apache: 1 → 5 → 7 replicas',
              'CPU stabilizing at 71%/50%',
            ],
            highlightedComponent: 'controller',
          },
          tip: 'Run kubectl get hpa -w in a second terminal to watch the replica count and CPU metrics update in real time as the load generator runs.',
        },
        {
          id: 'p4-m3-s5',
          title: 'Watch scale-down after load stops',
          instruction:
            'Stop the load generator (Ctrl-C) and observe the HPA scale back down — slowly.',
          command: 'kubectl get hpa -w',
          output: [
            'NAME         REFERENCE               TARGETS   MINPODS   MAXPODS   REPLICAS   AGE',
            'php-apache   Deployment/php-apache   1%/50%    1         10        7          8m',
            'php-apache   Deployment/php-apache   1%/50%    1         10        7          10m',
            'php-apache   Deployment/php-apache   1%/50%    1         10        1          13m',
          ],
          explanation:
            'CPU drops immediately when load stops, but replicas stay at 7 for 5 minutes before scaling down to 1. This is the scale-down stabilization window (default 300s). It prevents flapping: a brief traffic lull should not cause a scale-down that would leave the app under-provisioned when traffic returns. The window can be tuned in the HPA spec under behavior.scaleDown.stabilizationWindowSeconds.',
          clusterState: {
            pods: [
              {
                id: 'php-apache-abc12',
                name: 'php-apache-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'php-apache' },
                image: 'registry.k8s.io/hpa-example',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'php-apache-svc',
                name: 'php-apache',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'php-apache' },
                port: 80,
                clusterIP: '10.96.100.1',
              },
            ],
            deployments: [
              {
                id: 'php-apache-deploy',
                name: 'php-apache',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'registry.k8s.io/hpa-example',
              },
            ],
            namespaces: ['default'],
            events: [
              'Load stopped: CPU dropped to 1%',
              'Scale-down stabilization window: 5 min',
              'HPA scaled php-apache: 7 → 1 replica',
            ],
            highlightedComponent: 'controller',
          },
        },
      ],
      quiz: [
        {
          id: 'p4-m3-q1',
          question:
            'HPA targets 50% CPU utilization. A Pod has requests.cpu: 200m. At what actual CPU usage does HPA trigger scale-up?',
          options: [
            '50m — 50% of 200m / 2',
            '100m — 50% of 200m',
            '200m — 100% of the request must be reached before HPA acts',
            '50% of the node total CPU, not the request',
          ],
          answer: 1,
          explanation:
            'HPA CPU utilization is always relative to the resource request. With requests.cpu: 200m and a 50% target, the threshold is 200m × 50% = 100m of actual CPU usage per Pod. When the average across all Pods exceeds 100m, HPA calculates the new desired replica count and scales up.',
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
          explanation:
            'HPA CPU utilization is computed as currentCPUUsage / requestedCPU. Without a CPU request, the denominator is zero and HPA cannot calculate a meaningful percentage. The HPA will show <unknown> in the TARGETS column. Setting requests is a prerequisite, not just a best practice, for CPU-based autoscaling.',
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
          explanation:
            'The default 5-minute stabilization window for scale-down prevents oscillation. Without it, a deployment could scale up → traffic briefly drops → scale down → traffic returns → scale up again in a rapid loop (flapping), causing constant churn and potential availability gaps during scale events.',
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
          explanation:
            "metrics-server collects CPU and memory usage from each node's kubelet and exposes them via the Kubernetes Metrics API (metrics.k8s.io). HPA queries this API every 15 seconds. metrics-server is not installed by default in all distributions — run kubectl top pods to verify it is working.",
        },
      ],
      coverage: {
        concepts: [
          'HPA: automatic replica scaling based on metrics',
          'targetCPUUtilizationPercentage',
          'minReplicas and maxReplicas bounds',
          'scale-up stabilization window (fast)',
          'scale-down stabilization window (5 min default)',
          'metrics-server as data source',
          'custom and external metrics via Metrics API',
        ],
        commands: [
          'minikube addons enable metrics-server',
          'kubectl autoscale deployment',
          'kubectl get hpa',
          'kubectl describe hpa',
          'kubectl top pods',
          'kubectl top nodes',
          'kubectl run load generator (wrk/curl loop)',
        ],
        architecture: [
          'HPA controller polls Metrics API every 15s',
          'metrics-server aggregates kubelet cAdvisor stats',
          'HPA algorithm: desiredReplicas = ceil(currentReplicas × currentMetric/targetMetric)',
          'stabilization window prevents flapping',
        ],
        techniques: [
          'set CPU requests for HPA to work (required)',
          'use kubectl autoscale for quick HPA setup',
          'generate load to trigger scale-up',
          'watch HPA scale event with kubectl get hpa -w',
        ],
        procedures: [
          'enable metrics-server addon',
          'create HPA for a deployment',
          'verify HPA target metrics',
          'generate load and observe scale-up',
          'remove load and observe scale-down',
        ],
        toolsAndPlugins: ['kubectl', 'minikube', 'metrics-server'],
        cases: [
          'HPA shows unknown/missing metrics — metrics-server not running',
          'HPA not scaling — CPU requests not set on deployment',
          'HPA flapping — stabilization window too short',
        ],
        scenarios: [
          'auto-scale web deployment from 2 to 10 replicas under load',
          'debug HPA stuck at minimum replicas despite high CPU',
        ],
      },
      exercises: [
        {
          id: 'p4-m3-e1',
          title: 'Create HPA and observe scaling',
          kind: 'guided',
          goal: 'Set up HPA on a deployment and verify it reacts to CPU load.',
          commands: [
            'minikube addons enable metrics-server',
            'kubectl create deployment php-apache --image=registry.k8s.io/hpa-example',
            'kubectl set resources deployment php-apache --requests=cpu=200m',
            'kubectl expose deployment php-apache --port=80',
            'kubectl autoscale deployment php-apache --cpu-percent=50 --min=1 --max=10',
            'kubectl get hpa php-apache -w',
            'kubectl run load-gen --image=busybox:1.36 --restart=Never -- sh -c "while true; do wget -q -O- http://php-apache; done"',
          ],
          verify: [
            'HPA shows TARGETS with actual CPU% after metrics-server warms up',
            'Replica count increases above 1 under load',
          ],
          expectedOutcome: 'HPA scales deployment up under CPU load.',
          cleanup: [
            'kubectl delete pod load-gen --ignore-not-found',
            'kubectl delete hpa php-apache',
            'kubectl delete service php-apache',
            'kubectl delete deployment php-apache',
          ],
        },
        {
          id: 'p4-m3-e2',
          title: 'Scale from memory and verify HPA spec',
          kind: 'challenge',
          goal: 'Write kubectl autoscale and HPA inspection commands from memory.',
          commands: [
            'kubectl create deployment sr-hpa --image=nginx:1.27',
            'kubectl set resources deployment sr-hpa --requests=cpu=100m',
            'kubectl autoscale deployment sr-hpa --cpu-percent=60 --min=2 --max=8',
            'kubectl get hpa sr-hpa',
            'kubectl describe hpa sr-hpa',
          ],
          verify: [
            'HPA shows minReplicas=2, maxReplicas=8',
            'describe shows CPU target 60%',
            'Current replicas at minimum (2) with no load',
          ],
          expectedOutcome: 'HPA created and spec verified from memory.',
          cleanup: ['kubectl delete hpa sr-hpa', 'kubectl delete deployment sr-hpa'],
        },
        {
          id: 'p4-m3-e3',
          title: 'Diagnose HPA showing unknown metrics',
          kind: 'debug',
          goal: 'Identify why HPA shows unknown for current metrics.',
          commands: [
            'kubectl create deployment no-metrics --image=nginx:1.27',
            'kubectl autoscale deployment no-metrics --cpu-percent=50 --min=1 --max=5',
            'kubectl get hpa no-metrics',
            'kubectl describe hpa no-metrics',
            'kubectl top pods -l app=no-metrics',
          ],
          verify: [
            'HPA shows <unknown>/50% if metrics-server disabled or CPU requests missing',
            'describe shows unable to fetch metrics or missing resource in Events',
          ],
          expectedOutcome:
            'Unknown metrics traced to missing CPU requests or metrics-server not ready.',
          cleanup: ['kubectl delete hpa no-metrics', 'kubectl delete deployment no-metrics'],
        },
        {
          id: 'p4-m3-e4',
          title: '7-day spaced review — HPA algorithm and commands',
          kind: 'spaced-review',
          goal: 'Recall HPA algorithm, prerequisites, and commands from memory.',
          commands: [
            'kubectl explain horizontalpodautoscaler.spec',
            'kubectl get hpa -A',
            'kubectl top nodes',
          ],
          verify: [
            'explain shows minReplicas, maxReplicas, targetCPUUtilizationPercentage',
            'Can state: CPU requests required, metrics-server required, 15s poll interval',
          ],
          expectedOutcome: 'HPA concepts and commands recalled without notes.',
          cleanup: [],
        },
      ],
    },

    // ─── Module 4: Taints, Tolerations & Node Affinity ───────────────────────
    {
      id: 'p4-m4',
      slug: 'scheduling',
      title: 'Taints, Tolerations & Node Affinity',
      description:
        'Control where Pods land with node labels, taints, tolerations, and affinity rules.',
      duration: '75 min',
      difficulty: 'advanced',
      theory: `> 🧠 **Brain Warm-Up**: If a node gets tainted with \`NoExecute\` due to a sudden hardware fault, what determines how quickly running Pods are evicted? Can a Pod delay its own eviction using tolerations? Think about how the scheduler or node controller implements this time window.

## The Kubernetes Scheduling Pipeline

The \`kube-scheduler\` runs as a control plane loop, matching newly created, unscheduled Pods (\`spec.nodeName\` is blank) to the most appropriate node in the cluster. It achieves this in three consecutive phases:

1. **Filtering (Predicates)**: Filters out nodes that do not satisfy the Pod's hardware requirements or constraints.
2. **Scoring (Priorities)**: Ranks the remaining nodes by scoring them (from 0 to 100) using priority functions (e.g., node affinity weight, image locality, balanced resource usage).
3. **Binding**: The scheduler selects the highest-scoring node and writes a binding object to the API server, which sets the Pod's \`spec.nodeName\`. The node's local \`kubelet\` then detects this assignment and spins up the container via the CRI gRPC API.

### The Scheduling Pipeline

                     Incoming Pod Spec (Constraints)
                                │
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │                 SCHEDULER FILTERING PHASE                 │
  │  - Node Taints vs Pod Tolerations                         │
  │  - NodeSelectors & Node Affinity (requiredDuring...)     │
  │  - Resource limits/requests vs Node Allocatable capacity  │
  │  - Pod Topology Spread & Co-location constraints         │
  └─────────────────────────────┬─────────────────────────────┘
                                │
                   Filtered Nodes (Survivors)
                                │
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │                  SCHEDULER SCORING PHASE                  │
  │  - Node Affinity Weighting (preferredDuring...)           │
  │  - Image Locality (prefer nodes with image already cached) │
  │  - Inter-pod Affinity / Anti-affinity scoring              │
  │  - Balanced Resource Allocation (CPU/Memory spread)       │
  └─────────────────────────────┬─────────────────────────────┘
                                │
                     Highest-Scored Node Chosen
                                │
                                ▼
                           Bind Request
                    (Writes spec.nodeName via API)

## Node Taints and Pod Tolerations

**Taints** are applied to **nodes** to allow them to repel a set of Pods. **Tolerations** are applied to **Pods** to allow (but not force) them to schedule on nodes with matching taints.

Format: \`kubectl taint nodes <node-name> key=value:effect\`

| Effect | Behaviour |
|---|---|
| \`NoSchedule\` | (Hard) The scheduler will not place new Pods without a matching toleration on this node. Existing running Pods remain unaffected. |
| \`PreferNoSchedule\` | (Soft) The scheduler tries to avoid placing Pods without a matching toleration on this node, but will do so if no other capacity exists. |
| \`NoExecute\` | (Evictive) Pods without a matching toleration are immediately evicted if already running on the node, and new Pods are blocked. |

### Eviction Delay via tolerationSeconds

If a Pod tolerates a \`NoExecute\` taint (e.g., taints applied by the Node Lifecycle Controller like \`node.kubernetes.io/unreachable\` during network partitions), it can specify a \`tolerationSeconds\` limit:

\`\`\`yaml
tolerations:
- key: "node.kubernetes.io/unreachable"
  operator: "Exists"
  effect: "NoExecute"
  tolerationSeconds: 300
\`\`\`

This tells Kubernetes: "If this node becomes unreachable, let my Pod stay running on it for 5 minutes before evicting it."

## Expressive Node Selection

### nodeSelector
The simplest constraint. Requires an exact match of key-value labels on the node:
\`\`\`yaml
spec:
  nodeSelector:
    disktype: ssd
\`\`\`

### Node Affinity
The advanced successor to nodeSelector. Supports logical operators (\`In\`, \`NotIn\`, \`Exists\`, \`DoesNotExist\`, \`Gt\`, \`Lt\`) and contains two categories:
- **Hard**: \`requiredDuringSchedulingIgnoredDuringExecution\` (Must match)
- **Soft**: \`preferredDuringSchedulingIgnoredDuringExecution\` (Weighted priority from 1 to 100, scheduler scores these nodes higher)

The *IgnoredDuringExecution* suffix means that if node labels change after scheduling, the Pod remains running (does not get evicted).

## Inter-Pod Affinity & Anti-Affinity

These rules constraint scheduling based on **labels of Pods already running** on nodes in specific topology domains.
- **Topology Domains**: Defined by \`topologyKey\` (e.g., \`kubernetes.io/hostname\` for nodes, or \`topology.kubernetes.io/zone\` for cloud availability zones).
- **Anti-Affinity**: Crucial for high-availability. Prevents co-locating replicas on the same hardware or zone.

> [!WARNING]
> Inter-pod affinity and anti-affinity require significant CPU overhead in large clusters because the scheduler must evaluate label selectors across all nodes. Use them carefully to avoid scheduling bottlenecks.`,
      labSteps: [
        {
          id: 'p4-m4-s1',
          title: 'Inspect node labels',
          instruction: 'List nodes with their labels to understand the available label keys.',
          command: 'kubectl get nodes --show-labels',
          output: [
            'NAME     STATUS   ROLES           AGE   VERSION   LABELS',
            'node-1   Ready    control-plane   10d   v1.30.0   kubernetes.io/arch=amd64,kubernetes.io/os=linux,kubernetes.io/hostname=node-1,...',
            'node-2   Ready    <none>          10d   v1.30.0   kubernetes.io/arch=amd64,kubernetes.io/os=linux,kubernetes.io/hostname=node-2,...',
          ],
          explanation:
            'Every node gets a set of built-in labels automatically: kubernetes.io/hostname, kubernetes.io/os, kubernetes.io/arch, and topology labels for zone/region on cloud providers. These labels are the building blocks for nodeSelector and Node Affinity rules.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'node-1: kubernetes.io/hostname=node-1, os=linux, arch=amd64',
              'node-2: kubernetes.io/hostname=node-2, os=linux, arch=amd64',
            ],
            highlightedComponent: 'scheduler',
          },
          tip: 'Cloud providers add zone and region labels automatically (topology.kubernetes.io/zone, topology.kubernetes.io/region). Use these as topologyKey for rack-aware and zone-aware spreading.',
        },
        {
          id: 'p4-m4-s2',
          title: 'Schedule a Pod to a specific node with nodeSelector',
          instruction:
            'Label node-1 as an SSD node, then create a Pod with nodeSelector to force placement there.',
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
          output: ['node/node-1 labeled', 'pod/ssd-pod created'],
          explanation:
            'nodeSelector is the simplest scheduling constraint. The Pod will only be scheduled on nodes that have the label disk=ssd. If no node has this label, the Pod stays Pending. kubectl get pod ssd-pod -o wide will confirm it landed on node-1.',
          clusterState: {
            pods: [
              {
                id: 'ssd-pod-xyz',
                name: 'ssd-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: {},
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'node-1 labeled: disk=ssd',
              'Pod ssd-pod: nodeSelector disk=ssd → scheduled on node-1',
            ],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p4-m4-s3',
          title: 'Taint a node and observe Pending Pod',
          instruction:
            'Taint node-2 with a NoSchedule taint, then deploy a Pod without a toleration — it will stay Pending.',
          command:
            'kubectl taint nodes node-2 dedicated=gpu:NoSchedule && kubectl apply -f no-toleration-pod.yaml',
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
          explanation:
            'node-2 now has the taint dedicated=gpu:NoSchedule. The Pod has no toleration for this taint. node-1 already has the ssd-pod on it and may have capacity, but if the scheduler tries node-2, it is rejected. If no untainted node has capacity, the Pod stays Pending. kubectl describe pod no-gpu-pod will show "1 node(s) had untolerated taint" in the Events.',
          clusterState: {
            pods: [
              {
                id: 'ssd-pod-xyz',
                name: 'ssd-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: {},
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'no-gpu-pod',
                name: 'no-gpu-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Pending',
                labels: {},
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'node-2 tainted: dedicated=gpu:NoSchedule',
              'Pod no-gpu-pod: no toleration for dedicated=gpu:NoSchedule → Pending',
            ],
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
          explanation:
            'The toleration tells the scheduler "this Pod can tolerate the taint dedicated=gpu:NoSchedule". The Pod is now allowed on node-2. Note: a toleration does NOT force the Pod onto a tainted node — it just permits it. To force placement on node-2, you would combine the toleration with a nodeSelector or nodeAffinity targeting node-2.',
          clusterState: {
            pods: [
              {
                id: 'ssd-pod-xyz',
                name: 'ssd-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: {},
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'gpu-pod',
                name: 'gpu-pod',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: {},
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'gpu-pod toleration matches dedicated=gpu:NoSchedule',
              'gpu-pod scheduled on node-2 (tainted)',
            ],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p4-m4-s5',
          title: 'Remove the taint',
          instruction: 'Remove the GPU taint from node-2 using the trailing dash syntax.',
          command: 'kubectl taint nodes node-2 dedicated:NoSchedule-',
          output: ['node/node-2 untainted'],
          explanation:
            'The trailing `-` removes the taint. You only need to specify the key and effect — the value is not required for taint removal. After this, node-2 is schedulable by all Pods again — no toleration required. Existing Pods on node-2 (like gpu-pod) are not affected because NoSchedule only prevents new scheduling; it does not evict existing Pods (that would be NoExecute).',
          clusterState: {
            pods: [
              {
                id: 'ssd-pod-xyz',
                name: 'ssd-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: {},
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'gpu-pod',
                name: 'gpu-pod',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: {},
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'Taint dedicated=gpu:NoSchedule removed from node-2',
              'node-2 schedulable for all Pods again',
            ],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p4-m4-s6',
          title: 'Spread replicas with Pod anti-affinity',
          instruction:
            'Deploy a 2-replica app with required pod anti-affinity to guarantee each replica lands on a different node.',
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
          explanation:
            'requiredDuringSchedulingIgnoredDuringExecution means this is a hard rule — the Pod will not schedule if no node satisfies it. topologyKey: kubernetes.io/hostname means "no two Pods with app=web can share the same hostname (node)". If you have 2 nodes, replica 1 goes to node-1 and replica 2 goes to node-2. If node-1 fails, only one replica is lost — not both.',
          clusterState: {
            pods: [
              {
                id: 'web-abc12',
                name: 'web-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-def34',
                name: 'web-def34',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 2,
                availableReplicas: 2,
                image: 'nginx:1.27',
              },
            ],
            namespaces: ['default'],
            events: [
              'Pod web-abc12 → node-1',
              'Pod web-def34 → node-2 (anti-affinity: different hostname required)',
            ],
            highlightedComponent: 'scheduler',
          },
          tip: 'If you scale to 3 replicas but only have 2 nodes, the 3rd Pod will stay Pending — required anti-affinity cannot be satisfied. Use preferredDuringSchedulingIgnoredDuringExecution for a soft spread that still allows scheduling when nodes run out.',
        },
      ],
      quiz: [
        {
          id: 'p4-m4-q1',
          question:
            'A node has taint env=prod:NoSchedule. A Pod has no tolerations. Where does it get scheduled?',
          options: [
            'On the tainted node — NoSchedule only affects Pods with conflicting tolerations',
            'On any node that does NOT have the env=prod:NoSchedule taint',
            'The Pod is immediately evicted from the cluster',
            'The Pod is scheduled on the control plane node instead',
          ],
          answer: 1,
          explanation:
            'NoSchedule prevents new Pods without a matching toleration from being scheduled on that node. The Pod will be placed on any other available node that does not carry the taint (or that the Pod tolerates). If all nodes carry the taint, the Pod stays Pending.',
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
          explanation:
            'NoSchedule only affects new Pod scheduling — Pods already running on the node are unaffected. NoExecute is more aggressive: it also evicts existing Pods that do not have a matching toleration. NoExecute is used for situations like node maintenance or detected hardware problems where you want existing workloads to vacate the node.',
        },
        {
          id: 'p4-m4-q3',
          question:
            'You want 3 replicas of your app to ALWAYS run on different nodes. Which feature ensures this?',
          options: [
            'nodeSelector with three different node names',
            'Pod Anti-Affinity with requiredDuringSchedulingIgnoredDuringExecution and topologyKey: kubernetes.io/hostname',
            'Pod Anti-Affinity with preferredDuringSchedulingIgnoredDuringExecution',
            'Three separate Deployments each with replicas: 1 and a different nodeSelector',
          ],
          answer: 1,
          explanation:
            'Required Pod Anti-Affinity with topologyKey: kubernetes.io/hostname enforces that no two Pods with the matching label can land on the same node. If the constraint cannot be satisfied (not enough nodes), Pods stay Pending rather than co-locating. "preferred" would only try to spread, not guarantee it.',
        },
        {
          id: 'p4-m4-q4',
          question:
            'nodeSelector vs Node Affinity — when would you choose Node Affinity over nodeSelector?',
          options: [
            'Node Affinity is always better — nodeSelector is deprecated',
            'When you need operators other than equality (In, NotIn, Exists, Gt, Lt) or when you want soft/preferred placement rules',
            'When you need to schedule on more than one node simultaneously',
            'Node Affinity is for Pods; nodeSelector is for Deployments',
          ],
          answer: 1,
          explanation:
            'nodeSelector only supports exact label equality. Node Affinity supports richer expressions (In, NotIn, Exists, DoesNotExist, Gt, Lt) and adds the concept of preferred (soft) rules. nodeSelector is not deprecated — it is still valid for simple use cases. Node Affinity is the choice when you need expressive matching or soft preferences.',
        },
        {
          id: 'p4-m4-q5',
          question: 'How do you REMOVE a taint from a node?',
          options: [
            'kubectl delete taint nodes node-2 dedicated=gpu:NoSchedule',
            'kubectl taint nodes node-2 dedicated:NoSchedule-  (trailing dash)',
            'kubectl label nodes node-2 dedicated-',
            'kubectl patch node node-2 -p \'{"spec":{"taints":[]}}\'',
          ],
          answer: 1,
          explanation:
            'Appending a "-" to the taint specification in kubectl taint removes it. The minimal syntax is kubectl taint nodes <node-name> <key>:<effect>- — the value is not required for taint removal. The trailing dash is the removal signal. kubectl label uses the same trailing-dash pattern for removing labels, but taints are a separate spec field managed via kubectl taint.',
        },
      ],
      coverage: {
        concepts: [
          'nodeSelector for label-based node targeting',
          'Node Affinity: requiredDuringScheduling (hard) vs preferredDuringScheduling (soft)',
          'taints: NoSchedule/PreferNoSchedule/NoExecute effects',
          'tolerations to override taint effects',
          'Pod Anti-Affinity for spreading replicas',
          'topologySpreadConstraints',
        ],
        commands: [
          'kubectl taint nodes',
          'kubectl taint nodes <node> <key>:<effect>- (remove)',
          'kubectl label nodes',
          'kubectl get nodes --show-labels',
          'kubectl describe node (Taints section)',
          'kubectl get pods -o wide (verify node placement)',
        ],
        architecture: [
          'scheduler filters nodes via predicates (hard rules)',
          'scheduler scores nodes via priorities (soft rules)',
          'NoExecute evicts existing pods unless toleration with tolerationSeconds',
          'Pod Affinity/Anti-Affinity run after filter phase',
        ],
        techniques: [
          'taint a node to dedicate it to GPU workloads',
          'toleration to run on control-plane nodes',
          'requiredDuringScheduling for hard placement',
          'preferredDuringScheduling for soft preferences',
          'Pod anti-affinity to spread replicas across zones',
        ],
        procedures: [
          'add taint to node',
          'create pod with matching toleration',
          'add nodeSelector to pod/deployment',
          'verify pod lands on correct node',
          'remove taint with trailing dash',
        ],
        toolsAndPlugins: ['kubectl', 'minikube'],
        cases: [
          'pod Pending — no node satisfies node affinity required rule',
          'pod evicted — NoExecute taint added to node after pod was running',
          'all replicas on same node — missing anti-affinity',
        ],
        scenarios: [
          'dedicate node to GPU workloads with taint + toleration',
          'spread deployment replicas across nodes with pod anti-affinity',
        ],
      },
      exercises: [
        {
          id: 'p4-m4-e1',
          title: 'Taint a node and schedule with toleration',
          kind: 'guided',
          goal: 'Add a NoSchedule taint to minikube node and deploy a pod with and without toleration.',
          commands: [
            'kubectl taint nodes minikube dedicated=gpu:NoSchedule',
            'kubectl run no-toleration --image=nginx:1.27',
            'kubectl get pod no-toleration',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: with-toleration
spec:
  tolerations:
  - key: dedicated
    value: gpu
    effect: NoSchedule
  containers:
  - name: nginx
    image: nginx:1.27
EOF`,
            'kubectl get pods no-toleration with-toleration',
          ],
          verify: [
            'no-toleration pod stays Pending',
            'with-toleration pod reaches Running',
            'describe no-toleration shows Tolerations not satisfied in events',
          ],
          expectedOutcome: 'Taint blocks non-tolerating pod; toleration allows scheduling.',
          cleanup: [
            'kubectl taint nodes minikube dedicated:NoSchedule-',
            'kubectl delete pod no-toleration with-toleration --ignore-not-found',
          ],
        },
        {
          id: 'p4-m4-e2',
          title: 'Spread replicas with Pod anti-affinity',
          kind: 'challenge',
          goal: 'Configure a Deployment so no two replicas land on the same node.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spread-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: spread-web
  template:
    metadata:
      labels:
        app: spread-web
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: spread-web
              topologyKey: kubernetes.io/hostname
      containers:
      - name: nginx
        image: nginx:1.27
EOF`,
            'kubectl get pods -l app=spread-web -o wide',
          ],
          verify: [
            'Pods scheduled across available nodes (on minikube single-node they land on the same node — that is expected)',
            'describe shows anti-affinity config in pod spec',
          ],
          expectedOutcome:
            'Pod anti-affinity configured; behavior understood for multi-node clusters.',
          cleanup: ['kubectl delete deployment spread-web'],
        },
        {
          id: 'p4-m4-e3',
          title: 'Diagnose Pending pod due to failed node affinity',
          kind: 'debug',
          goal: 'Create a pod with a hard node affinity rule that no node satisfies.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: affinity-pending
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: gpu-type
            operator: In
            values: [a100, h100]
  containers:
  - name: app
    image: nginx:1.27
EOF`,
            'kubectl get pod affinity-pending',
            'kubectl describe pod affinity-pending',
          ],
          verify: ['Pod stays Pending', 'Events show 0/1 nodes match node affinity'],
          expectedOutcome: 'Unsatisfiable node affinity diagnosed from describe events.',
          cleanup: ['kubectl delete pod affinity-pending --ignore-not-found'],
        },
        {
          id: 'p4-m4-e4',
          title: '7-day spaced review — taint and affinity commands',
          kind: 'spaced-review',
          goal: 'Recall taint/toleration and node affinity syntax from memory.',
          commands: [
            'kubectl taint nodes minikube test-taint=value:NoSchedule',
            'kubectl describe node minikube | grep -A3 Taints',
            'kubectl taint nodes minikube test-taint:NoSchedule-',
            'kubectl describe node minikube | grep -A3 Taints',
          ],
          verify: ['Taint visible after add', 'Taints section shows <none> after removal'],
          expectedOutcome: 'Taint add/remove commands recalled from memory.',
          cleanup: [],
        },
      ],
    },

    // ─── Module 5: PodDisruptionBudgets & Cluster Maintenance ────────────────
    {
      id: 'p4-m5',
      slug: 'pdb',
      title: 'PodDisruptionBudgets & Cluster Maintenance',
      description:
        'Protect application availability during node drains and cluster upgrades with PodDisruptionBudgets.',
      duration: '60 min',
      difficulty: 'advanced',
      theory: `> 🧠 **Brain Warm-Up**: What is the difference between a direct Pod deletion (\`kubectl delete pod\`) and a Pod eviction request (\`/eviction\` API)? Why does a PodDisruptionBudget ignore the former but block the latter? Think about the API endpoints involved.

## Voluntary vs Involuntary Disruptions

Workload availability is subject to two classes of disruptions:

| Disruption Type | Examples | Can a PDB protect it? |
|---|---|---|
| **Voluntary** | Admin executing \`kubectl drain\`, cluster upgrade automation, HPA scale-down, descheduling | **Yes** |
| **Involuntary** | Physical hardware failure, hypervisor crash, kernel panic, out-of-memory (OOM) kill | **No** |

PodDisruptionBudgets (PDBs) are validation policies that *only* protect against voluntary disruptions. They have no control over network partitions or failed hardware.

## PodDisruptionBudget (PDB) Mechanics

A PDB defines a minimum availability threshold that the API server enforces during voluntary disruptions. When a controller or administrator attempts to drain a node, it does not delete Pods directly. Instead, it sends an HTTP POST request to the Pod's **\`eviction\` subresource endpoint** (e.g., \`/api/v1/namespaces/default/pods/my-pod/eviction\`).

The API server intercepts this eviction call, checks all active PDBs, and:
- **Allows** the eviction if the number of running, Ready pods (those satisfying \`minReadySeconds\`) remains above the PDB threshold.
- **Rejects** the eviction (returning an HTTP **429 Too Many Requests** error) if it would violate the budget. The drain utility then sleeps and retries the request.

### Eviction Lifecycle & PDB Enforcement during Node Drain

   [ Admin / Script ] ──────────────► [ kubectl drain node-1 ]
                                              │
                                              ▼ (Sends Cordon Request)
                                      [ node.spec.unschedulable = true ]
                                              │
                                              ▼ (Loops over non-DaemonSet Pods)
                                      [ POST /eviction API ]
                                              │
                                              ▼
                                 ┌────────────────────────┐
                                 │       API SERVER       │
                                 │  - Evaluates PDBs      │
                                 └──────────┬─────────────┘
                                            │
                             ┌──────────────┴──────────────┐
                 Allowed? Yes│                             │No (Violates Budget)
                             ▼                             ▼
                  [ Deletes Pod Object ]         [ Returns 429 Conflict ]
                             │                             │
                             ▼                             ▼
                        [ Kubelet ]                 [ kubectl drain ]
              (Sends SIGTERM, waits grace period,    (Sleeps 5s, retries
               runs container preStop lifecycle)      eviction request)

### Configuring PDB Specs

You specify either \`minAvailable\` or \`maxUnavailable\` (never both):
- \`minAvailable\`: An absolute number (e.g., \`2\`) or percentage (e.g., \`80%\`) of Pods that must remain healthy.
- \`maxUnavailable\`: An absolute number or percentage of Pods that can be concurrently terminated.

\`\`\`yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  minAvailable: 2 # At least 2 pods must remain Ready
  selector:
    matchLabels:
      app: web
\`\`\`

## Node Maintenance Lifecycle (Cordon & Drain)

Upgrading and maintaining nodes follows a strict three-phase lifecycle:

1. **Cordon**: Marks the node as unschedulable (\`node.spec.unschedulable = true\`). Running Pods are unaffected, but no new Pods can be scheduled on this node.
2. **Drain**: Evicts all non-DaemonSet Pods from the node using the eviction API.
   - **DaemonSets**: Drained pods are ignored by default since they run per-node utilities and are managed by the DaemonSet controller. You must pass \`--ignore-daemonsets\` to let the drain proceed.
   - **Local Data**: Pods using \`emptyDir\` volumes require the \`--delete-emptydir-data\` flag since their local storage will be discarded.
3. **Uncordon**: After physical maintenance or OS upgrades, uncordon the node to make it schedulable again.

## Graceful Termination Internals

Once an eviction is approved, the API server deletes the Pod object. The node's \`kubelet\` detects the deletion event and coordinates graceful termination:
1. **PreStop Hook**: The kubelet executes any configured \`preStop\` lifecycle hook inside the container. This is synchronous.
2. **SIGTERM**: The container runtime sends the \`SIGTERM\` signal (PID 1) to the container process, giving it time to close network sockets, complete requests, or persist buffers.
3. **Grace Period**: The kubelet waits for the \`terminationGracePeriodSeconds\` (default: 30s).
4. **SIGKILL**: If the process is still running after the grace period, the runtime issues \`SIGKILL\` to forcibly terminate it.`,
      labSteps: [
        {
          id: 'p4-m5-s1',
          title: 'Deploy an app and create a PDB',
          instruction:
            'Deploy a 3-replica app and create a PodDisruptionBudget requiring at least 2 Pods to remain available.',
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
          output: ['deployment.apps/web created', 'poddisruptionbudget.policy/web-pdb created'],
          explanation:
            'With 3 replicas and minAvailable: 2, only 1 Pod can be disrupted at any given time (3 - 2 = 1 allowed disruption). This means kubectl drain can only evict one Pod at a time — it must wait for a replacement to start and become Ready before proceeding to the next.',
          clusterState: {
            pods: [
              {
                id: 'web-abc12',
                name: 'web-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-def34',
                name: 'web-def34',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-ghi56',
                name: 'web-ghi56',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 3,
                availableReplicas: 3,
                image: 'nginx:1.27',
              },
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
          explanation:
            'ALLOWED DISRUPTIONS: 1 means exactly one Pod can be evicted right now (3 running - 2 required = 1 allowed). This number updates dynamically as Pods are evicted and replaced. If a Pod crashes and only 2 are running, ALLOWED DISRUPTIONS drops to 0 — drain would be blocked until the replacement starts.',
          clusterState: {
            pods: [
              {
                id: 'web-abc12',
                name: 'web-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-def34',
                name: 'web-def34',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-ghi56',
                name: 'web-ghi56',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 3,
                availableReplicas: 3,
                image: 'nginx:1.27',
              },
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
          instruction:
            'Mark node-1 as unschedulable — new Pods will not land there, but existing Pods keep running.',
          command: 'kubectl cordon node-1',
          output: ['node/node-1 cordoned'],
          explanation:
            'Cordoning sets node.spec.unschedulable=true. The scheduler will not place new Pods on node-1. Existing Pods (web-abc12, web-ghi56) continue running and serving traffic normally. This is the first step before maintenance — it prevents new work from landing on the node you are about to drain.',
          clusterState: {
            pods: [
              {
                id: 'web-abc12',
                name: 'web-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-def34',
                name: 'web-def34',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-ghi56',
                name: 'web-ghi56',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 3,
                availableReplicas: 3,
                image: 'nginx:1.27',
              },
            ],
            namespaces: ['default'],
            events: [
              'node-1 cordoned: SchedulingDisabled',
              'Existing Pods on node-1 continue running',
            ],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p4-m5-s4',
          title: 'Drain the node',
          instruction:
            'Drain node-1 — the PDB ensures at least 2 Pods remain available throughout the eviction.',
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
          explanation:
            "The drain tried to evict both Pods simultaneously, but the PDB blocked the second eviction until the first Pod's replacement was Running and Ready on node-2. The drain retried every 5 seconds until the constraint was satisfied. This is exactly the behavior you want: zero downtime maintenance.",
          clusterState: {
            pods: [
              {
                id: 'web-def34',
                name: 'web-def34',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-jkl78',
                name: 'web-jkl78',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-mno90',
                name: 'web-mno90',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 3,
                availableReplicas: 3,
                image: 'nginx:1.27',
              },
            ],
            namespaces: ['default'],
            events: [
              'node-1 drained: Pods evicted respecting PDB minAvailable=2',
              'All 3 replicas rescheduled on node-2',
            ],
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
          explanation:
            "Uncordoning removes the Unschedulable taint. node-1 rejoins the scheduling pool. The Deployment's Pods do not automatically move back to node-1 — they continue running on node-2. New Pods created by future scaling events or Pod restarts may land on either node. In a real cluster upgrade, you repeat this workflow for each node: cordon → drain → upgrade kubelet/containerd → uncordon → move to next node.",
          clusterState: {
            pods: [
              {
                id: 'web-def34',
                name: 'web-def34',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-jkl78',
                name: 'web-jkl78',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-mno90',
                name: 'web-mno90',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 3,
                availableReplicas: 3,
                image: 'nginx:1.27',
              },
            ],
            namespaces: ['default'],
            events: [
              'node-1 uncordoned: SchedulingEnabled',
              'node-1 back in rotation — maintenance complete',
            ],
            highlightedComponent: 'scheduler',
          },
        },
      ],
      quiz: [
        {
          id: 'p4-m5-q1',
          question:
            'You have a PDB with minAvailable: 3 but only 3 replicas. What happens when you drain a node?',
          options: [
            'Drain proceeds normally — PDBs are advisory, not enforced during drain',
            'Drain is blocked indefinitely — evicting any Pod would drop availability below 3',
            'Kubernetes automatically scales up to 4 replicas to satisfy the PDB before draining',
            'The PDB is temporarily suspended during drain operations',
          ],
          answer: 1,
          explanation:
            'With minAvailable: 3 and exactly 3 running Pods, ALLOWED DISRUPTIONS is 0. kubectl drain will block because any eviction would violate the budget. The fix is to scale up to at least 4 replicas first (making ALLOWED DISRUPTIONS = 1), then drain. PDBs are fully enforced during eviction.',
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
          explanation:
            'cordon only sets the Unschedulable flag — existing Pods keep running and serving traffic. drain first cordons the node, then sends eviction requests for all non-DaemonSet Pods (respecting PDBs and grace periods). Use cordon alone when you want to prevent new scheduling without disrupting existing workloads.',
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
          explanation:
            'PDBs only protect against voluntary disruptions — actions initiated by the cluster (drain, eviction API, autoscaler). They cannot prevent involuntary disruptions like node hardware failures, OOM kills, or kernel panics. For protection against involuntary disruptions, you need multiple replicas spread across failure domains.',
        },
        {
          id: 'p4-m5-q4',
          question:
            'During a rolling cluster upgrade, what is the correct order of operations per node?',
          options: [
            'uncordon → upgrade → drain',
            'drain → upgrade → cordon → uncordon',
            'cordon → drain → upgrade → uncordon',
            'upgrade → cordon → drain → uncordon',
          ],
          answer: 2,
          explanation:
            'The correct sequence is: (1) cordon — stop new Pods from scheduling on the node; (2) drain — evict existing Pods to other nodes (respecting PDBs); (3) upgrade — update kubelet, containerd, OS, etc.; (4) uncordon — return the node to the scheduling pool. Starting with the upgrade while Pods are still running is risky — the kubelet version change can cause issues.',
        },
      ],
      coverage: {
        concepts: [
          'PodDisruptionBudget: minAvailable or maxUnavailable',
          'voluntary vs involuntary disruptions',
          'eviction API vs direct pod delete',
          'kubectl drain respects PDBs',
          'cordon: mark node unschedulable',
          'uncordon: return node to pool',
          'node maintenance workflow',
        ],
        commands: [
          'kubectl create poddisruptionbudget',
          'kubectl get pdb',
          'kubectl describe pdb',
          'kubectl cordon node',
          'kubectl drain node --ignore-daemonsets --delete-emptydir-data',
          'kubectl uncordon node',
          'kubectl get nodes (SchedulingDisabled status)',
        ],
        architecture: [
          'PDB blocks eviction API if budget would be violated',
          'kubectl drain uses eviction API — PDB is enforced',
          'kubectl delete pod bypasses PDB — direct delete not via eviction',
          'kubelet node condition drives cordon/uncordon state',
        ],
        techniques: [
          'set minAvailable=1 to ensure at least one replica during drain',
          'use maxUnavailable=1 for percentage-based budget',
          'drain with --ignore-daemonsets to skip DaemonSet pods',
          'use --delete-emptydir-data for pods with emptyDir volumes',
        ],
        procedures: [
          'create PDB for a deployment',
          'cordon a node',
          'drain node with PDB in effect',
          'uncordon after maintenance',
          'verify pod rescheduled on other node',
        ],
        toolsAndPlugins: ['kubectl', 'minikube'],
        cases: [
          'drain blocked — PDB minAvailable=1 and only 1 replica running',
          'drain hangs — pod with emptyDir data needs --delete-emptydir-data',
          'node stays SchedulingDisabled after drain — forgot to uncordon',
        ],
        scenarios: [
          'safely drain a node for OS upgrade without application downtime',
          'set PDB before rolling deployment to prevent eviction of all replicas',
        ],
      },
      exercises: [
        {
          id: 'p4-m5-e1',
          title: 'Create PDB and perform a node drain',
          kind: 'guided',
          goal: 'Create a deployment with PDB, then cordon and drain the node.',
          commands: [
            'kubectl create deployment web-pdb --image=nginx:1.27 --replicas=3',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web-pdb
EOF`,
            'kubectl get pdb web-pdb',
            'kubectl cordon minikube',
            'kubectl get nodes',
            'kubectl drain minikube --ignore-daemonsets --delete-emptydir-data',
            'kubectl get pods -l app=web-pdb -o wide',
            'kubectl uncordon minikube',
          ],
          verify: [
            'Node shows SchedulingDisabled after cordon',
            'PDB shows minAvailable=2',
            'After drain: pods rescheduled (or eviction blocked on single-node minikube)',
            'Node schedulable again after uncordon',
          ],
          expectedOutcome: 'Full cordon → drain → uncordon lifecycle executed with PDB.',
          cleanup: [
            'kubectl delete pdb web-pdb',
            'kubectl delete deployment web-pdb',
            'kubectl uncordon minikube',
          ],
        },
        {
          id: 'p4-m5-e2',
          title: 'Observe PDB blocking a drain',
          kind: 'challenge',
          goal: 'Create a PDB that prevents drain from evicting the last replica.',
          commands: [
            'kubectl create deployment singleton --image=nginx:1.27 --replicas=1',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: singleton-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: singleton
EOF`,
            'kubectl drain minikube --ignore-daemonsets --delete-emptydir-data --timeout=20s',
            'kubectl get pdb singleton-pdb',
          ],
          verify: [
            'drain fails or times out with "Cannot evict pod as it would violate the pod\'s disruption budget"',
            'PDB shows ALLOWED DISRUPTIONS: 0',
          ],
          expectedOutcome: 'PDB blocks drain when minAvailable would be violated.',
          cleanup: [
            'kubectl delete pdb singleton-pdb',
            'kubectl delete deployment singleton',
            'kubectl uncordon minikube',
          ],
        },
        {
          id: 'p4-m5-e3',
          title: 'Diagnose node stuck in SchedulingDisabled',
          kind: 'debug',
          goal: 'Identify a node that was cordoned and never uncordoned, and recover it.',
          commands: [
            'kubectl cordon minikube',
            'kubectl get nodes',
            'kubectl run test-pod --image=nginx:1.27',
            'kubectl get pod test-pod',
            'kubectl uncordon minikube',
            'kubectl get nodes',
          ],
          verify: [
            'Node shows STATUS SchedulingDisabled after cordon',
            'test-pod stays Pending while node is cordoned',
            'Node returns to Ready after uncordon',
            'test-pod schedules after uncordon',
          ],
          expectedOutcome: 'Cordoned node identified and recovered with uncordon.',
          cleanup: ['kubectl delete pod test-pod --ignore-not-found'],
        },
        {
          id: 'p4-m5-e4',
          title: '7-day spaced review — maintenance workflow',
          kind: 'spaced-review',
          goal: 'Recall the full node maintenance sequence and PDB purpose from memory.',
          commands: [
            'kubectl explain poddisruptionbudget.spec',
            'kubectl get pdb -A',
            'kubectl get nodes',
          ],
          verify: [
            'explain shows minAvailable and maxUnavailable fields',
            'Can state the sequence: cordon → drain → maintain → uncordon',
          ],
          expectedOutcome: 'Maintenance workflow and PDB fields recalled without notes.',
          cleanup: [],
        },
      ],
    },
    {
      id: 'p4-m6',
      slug: 'security-context',
      title: 'SecurityContext — Pod & Container Hardening',
      description:
        'Run containers as non-root, drop Linux capabilities, enforce read-only filesystems, and prevent privilege escalation.',
      duration: '60 min',
      difficulty: 'intermediate' as const,
      masteryChecks: [
        'Set runAsUser and runAsNonRoot on a pod',
        'Verify the UID inside a running container with kubectl exec',
        'Drop ALL capabilities and add only what is needed',
        'Enable readOnlyRootFilesystem and mount a writable emptyDir for temp files',
        'Explain the difference between pod-level and container-level securityContext',
        'Explain allowPrivilegeEscalation: false',
      ],
      theory: `> 🧠 **Brain Warm-Up**: By default, containers run as root (UID 0). If an attacker breaks out of the container, they have root on the host. What fields would you set in a securityContext to minimize this risk?

## Pod vs Container securityContext

\`\`\`yaml
spec:
  securityContext:          # ← pod-level: applies to all containers
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000
  containers:
  - name: app
    securityContext:        # ← container-level: overrides pod-level
      allowPrivilegeEscalation: false
      capabilities:
        drop: ["ALL"]
\`\`\`

**Pod-level** applies to all containers and init containers.
**Container-level** overrides pod-level for that specific container.

## Key Fields

| Field | Level | Effect |
|-------|-------|--------|
| \`runAsUser\` | pod/container | Sets UID for process |
| \`runAsGroup\` | pod/container | Sets GID for process |
| \`runAsNonRoot\` | pod/container | Rejects UID 0 |
| \`fsGroup\` | pod | Volume files owned by this GID |
| \`readOnlyRootFilesystem\` | container | Prevents writes to container FS |
| \`allowPrivilegeEscalation\` | container | Prevents sudo/setUID |
| \`capabilities.drop\` | container | Remove Linux capabilities |
| \`capabilities.add\` | container | Add specific capabilities |
| \`privileged\` | container | Full host access (avoid!) |

## Linux Capabilities

Instead of root vs non-root, Linux capabilities give fine-grained privileges:

- \`NET_BIND_SERVICE\` — bind ports < 1024
- \`SYS_ADMIN\` — various admin operations (powerful, avoid)
- \`CHOWN\` — change file ownership

Best practice: \`drop: ["ALL"]\` then \`add: ["NET_BIND_SERVICE"]\` if needed.

## The Hardened Baseline

\`\`\`yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop: ["ALL"]
\`\`\`

This is the minimum you should apply to every production container.`,
      labSteps: [
        {
          id: 'p4-m6-s1',
          title: 'Run a pod as non-root',
          instruction: 'Create a pod that runs as UID 1000.',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: nonroot-pod
spec:
  securityContext:
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000
  containers:
  - name: app
    image: busybox:1.36
    command: ["sleep", "3600"]
    securityContext:
      allowPrivilegeEscalation: false`,
          output: [],
          explanation:
            'runAsUser: 1000 sets the process UID. fsGroup: 2000 sets the group ownership of mounted volumes. allowPrivilegeEscalation: false prevents sudo and setUID binaries.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p4-m6-s2',
          title: 'Verify the running UID',
          instruction: 'Confirm the container runs as UID 1000, not root.',
          command: 'kubectl exec nonroot-pod -- id',
          output: ['uid=1000 gid=3000 groups=3000,2000'],
          explanation:
            'uid=1000 confirms the pod spec was applied. gid=3000 from runAsGroup. 2000 is the fsGroup — used for volume ownership.',
          clusterState: {
            pods: [
              {
                id: 'nr',
                name: 'nonroot-pod',
                namespace: 'default',
                node: 'node-1' as const,
                status: 'Running' as const,
                labels: {},
                image: 'busybox:1.36',
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
          id: 'p4-m6-s3',
          title: 'Add read-only filesystem',
          instruction: 'Mount readOnlyRootFilesystem and provide a writable emptyDir for /tmp.',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: readonly-pod
spec:
  securityContext:
    runAsUser: 1000
    runAsNonRoot: true
  containers:
  - name: app
    image: busybox:1.36
    command: ["sleep", "3600"]
    securityContext:
      readOnlyRootFilesystem: true
      allowPrivilegeEscalation: false
      capabilities:
        drop: ["ALL"]
    volumeMounts:
    - name: tmp-dir
      mountPath: /tmp
  volumes:
  - name: tmp-dir
    emptyDir: {}`,
          output: [],
          explanation:
            'readOnlyRootFilesystem: true blocks writes to the container image filesystem. Mount an emptyDir at /tmp for apps that need to write temp files.',
          clusterState: {
            pods: [
              {
                id: 'ro',
                name: 'readonly-pod',
                namespace: 'default',
                node: 'node-1' as const,
                status: 'Running' as const,
                labels: {},
                image: 'busybox:1.36',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['readonly-pod scheduled → node-1'],
          },
        },
        {
          id: 'p4-m6-s4',
          title: 'Test read-only enforcement',
          instruction: 'Try to write to the root filesystem — expect failure.',
          command: 'kubectl exec readonly-pod -- sh -c "echo test > /etc/hack"',
          output: ['sh: /etc/hack: Read-only file system'],
          explanation:
            'readOnlyRootFilesystem: true prevents writes to the container image layer. Any writes must go to explicit volume mounts (emptyDir, PVC, etc.).',
          clusterState: {
            pods: [
              {
                id: 'ro',
                name: 'readonly-pod',
                namespace: 'default',
                node: 'node-1' as const,
                status: 'Running' as const,
                labels: {},
                image: 'busybox:1.36',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
          tip: '/tmp is writable because we mounted an emptyDir there. Try: kubectl exec readonly-pod -- sh -c "echo test > /tmp/ok" — this works.',
        },
        {
          id: 'p4-m6-s5',
          title: 'Drop all capabilities',
          instruction: 'Verify a hardened container cannot do privileged operations.',
          command: 'kubectl exec readonly-pod -- sh -c "ping -c 1 8.8.8.8"',
          output: [
            'PING 8.8.8.8 (8.8.8.8): 56 data bytes',
            'ping: permission denied (are you root?)',
          ],
          explanation:
            'ping requires NET_RAW capability. With capabilities.drop: ["ALL"], this is denied. The container cannot use raw sockets, even for ICMP. This is expected and correct.',
          clusterState: {
            pods: [
              {
                id: 'ro',
                name: 'readonly-pod',
                namespace: 'default',
                node: 'node-1' as const,
                status: 'Running' as const,
                labels: {},
                image: 'busybox:1.36',
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
          id: 'p4-m6-s6',
          title: 'Clean up',
          instruction: 'Delete test pods.',
          command: 'kubectl delete pod nonroot-pod readonly-pod',
          output: ['pod "nonroot-pod" deleted', 'pod "readonly-pod" deleted'],
          explanation:
            'Always clean up lab pods. In real workloads, add these security fields to all Deployment pod templates as standard practice.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
      ],
      quiz: [
        {
          id: 'p4-m6-q1',
          question: 'runAsNonRoot: true is set. The container image has USER root. What happens?',
          options: [
            'The container runs as root — image USER overrides runAsNonRoot',
            'Kubernetes remaps root to UID 1000 automatically',
            'The pod fails to start with "container has runAsNonRoot and image will run as root"',
            'The container starts but is immediately killed',
          ],
          answer: 2,
          explanation:
            'runAsNonRoot: true causes the kubelet to reject the container at startup if the effective UID is 0. You must set runAsUser to a non-zero UID or ensure the image USER is non-root.',
        },
        {
          id: 'p4-m6-q2',
          question: 'What is the effect of allowPrivilegeEscalation: false?',
          options: [
            'Prevents the container from running as root',
            'Prevents processes inside the container from gaining more privileges than their parent (blocks sudo, setUID)',
            'Drops all Linux capabilities',
            'Makes the filesystem read-only',
          ],
          answer: 1,
          explanation:
            'allowPrivilegeEscalation: false sets the no_new_privs Linux flag. This prevents setUID binaries (like sudo, passwd) from gaining elevated privileges. The container still runs with its initial UID/capabilities.',
        },
        {
          id: 'p4-m6-q3',
          question:
            'fsGroup: 2000 is set. A PVC is mounted at /data. What is the group ownership of /data?',
          options: [
            'root (GID 0) — fsGroup only affects emptyDir',
            'GID 2000 — all files in the mounted volume are owned by group 2000',
            'The GID of the storage class',
            'fsGroup has no effect on volume ownership',
          ],
          answer: 1,
          explanation:
            'fsGroup sets the group ownership of all mounted volumes. Kubernetes runs a chgrp on the volume when the pod starts. This allows the container process (running as runAsGroup) to write to the volume.',
        },
        {
          id: 'p4-m6-q4',
          question:
            'A container needs to bind to port 80 but must not run as root. Which capability must you add?',
          options: ['SYS_ADMIN', 'NET_BIND_SERVICE', 'SYS_PTRACE', 'SETUID'],
          answer: 1,
          explanation:
            'Binding to ports below 1024 requires NET_BIND_SERVICE capability. Add it with capabilities.add: ["NET_BIND_SERVICE"] while still dropping ALL other capabilities.',
        },
        {
          id: 'p4-m6-q5',
          question:
            'Pod-level securityContext sets runAsUser: 1000. A specific container sets runAsUser: 2000. What UID does that container use?',
          options: [
            '1000 — pod-level always wins',
            '2000 — container-level overrides pod-level',
            'Both run simultaneously',
            'The pod fails — conflicting settings',
          ],
          answer: 1,
          explanation:
            'Container-level securityContext overrides pod-level for fields where both are set. Other pod-level fields (not overridden at container level) still apply.',
        },
        {
          id: 'p4-m6-q6',
          question:
            'readOnlyRootFilesystem: true is set. The app needs to write logs. What is the correct solution?',
          options: [
            'Set readOnlyRootFilesystem: false for just the log directory',
            'Use a sidecar container to handle logging',
            'Mount an emptyDir (or PVC) at the log directory path',
            'Add WRITE capability to the container',
          ],
          answer: 2,
          explanation:
            'readOnlyRootFilesystem makes the image layer read-only. To allow writes to specific paths, mount a writable volume (emptyDir for ephemeral, PVC for persistent) at those paths. The volume mount overrides the read-only root.',
        },
      ],
      exercises: [
        {
          id: 'p4-m6-e1',
          title: 'Harden a deployment',
          kind: 'challenge' as const,
          goal: 'Apply the hardened baseline securityContext to a real deployment and verify it works',
          commands: [
            'kubectl create deployment hardened --image=nginx:1.27',
            'kubectl patch deployment hardened -p \'{"spec":{"template":{"spec":{"securityContext":{"runAsUser":101,"runAsNonRoot":true},"containers":[{"name":"nginx","securityContext":{"allowPrivilegeEscalation":false,"readOnlyRootFilesystem":false,"capabilities":{"drop":["ALL"]}}}]}}}}\'',
            'kubectl get pods',
            'kubectl exec deploy/hardened -- id',
          ],
          verify: ['kubectl exec shows uid=101', 'Pod is Running not CrashLoopBackOff'],
          expectedOutcome: 'nginx running as non-root with dropped capabilities',
          cleanup: ['kubectl delete deployment hardened'],
        },
      ],
    },

    {
      id: 'p4-m7',
      slug: 'node-management',
      title: 'Node Management — Cordon, Drain & Maintenance',
      description:
        'Safely remove nodes from rotation for maintenance without disrupting running workloads.',
      duration: '60 min',
      difficulty: 'intermediate' as const,
      masteryChecks: [
        'Cordon a node to prevent new pod scheduling',
        'Drain a node to evict all pods before maintenance',
        'Uncordon a node to resume scheduling after maintenance',
        'Explain the difference between cordon and drain',
        'Add a taint and create a pod with a matching toleration',
        'Check node conditions with kubectl describe node',
      ],
      theory: `> 🧠 **Brain Warm-Up**: You need to reboot a node for a kernel upgrade. 5 pods are running on it. How do you ensure the pods are safely rescheduled before you reboot, without any downtime?

## The Maintenance Workflow

\`\`\`
1. kubectl cordon <node>   → mark Unschedulable (no NEW pods)
2. kubectl drain <node>    → evict all pods + cordon
3. [perform maintenance]
4. kubectl uncordon <node> → re-enable scheduling
\`\`\`

## Cordon vs Drain

| Command | Effect |
|---------|--------|
| \`cordon\` | Marks node Unschedulable. Existing pods keep running |
| \`drain\` | Evicts all pods AND marks node Unschedulable |
| \`uncordon\` | Marks node Schedulable again |

## kubectl drain Flags

\`\`\`bash
kubectl drain node-1 \\
  --ignore-daemonsets \\   # DaemonSet pods cannot be moved — skip them
  --delete-emptydir-data  # Allow draining pods with emptyDir volumes
\`\`\`

Without \`--ignore-daemonsets\`, drain fails if DaemonSet pods are present.

## Taints and Tolerations

Taints repel pods from nodes. Tolerations allow pods to be scheduled on tainted nodes.

\`\`\`
Node taint: key=value:effect
  - NoSchedule: new pods without toleration not scheduled
  - PreferNoSchedule: soft preference against scheduling
  - NoExecute: existing pods without toleration are evicted

Pod toleration:
  key: "key"
  operator: "Equal"
  value: "value"
  effect: "NoSchedule"
\`\`\`

## Node Conditions

kubectl describe node shows:
- \`Ready\` — node is healthy
- \`MemoryPressure\` — node is low on memory
- \`DiskPressure\` — node is low on disk
- \`PIDPressure\` — too many processes
- \`NetworkUnavailable\` — CNI not configured`,
      labSteps: [
        {
          id: 'p4-m7-s1',
          title: 'Check node status',
          instruction: 'List nodes and see their conditions.',
          command: 'kubectl get nodes',
          output: [
            'NAME       STATUS   ROLES           AGE   VERSION',
            'minikube   Ready    control-plane   60m   v1.30.0',
          ],
          explanation:
            'STATUS Ready means the node is healthy and schedulable. Other statuses: NotReady (kubelet problem), SchedulingDisabled (cordoned).',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p4-m7-s2',
          title: 'Cordon the node',
          instruction: 'Mark the node unschedulable — new pods will not be placed here.',
          command: 'kubectl cordon minikube',
          output: ['node/minikube cordoned'],
          explanation:
            'Cordon adds the node.kubernetes.io/unschedulable taint. Existing pods keep running. Only new pod creation is blocked.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['minikube cordoned'],
          },
          tip: 'After cordoning, kubectl get nodes shows STATUS=Ready,SchedulingDisabled.',
        },
        {
          id: 'p4-m7-s3',
          title: 'Verify SchedulingDisabled',
          instruction: 'Confirm the node is cordoned.',
          command: 'kubectl get nodes',
          output: [
            'NAME       STATUS                     ROLES           AGE   VERSION',
            'minikube   Ready,SchedulingDisabled   control-plane   60m   v1.30.0',
          ],
          explanation:
            'SchedulingDisabled shows the cordon is active. The node is still healthy (Ready) but the scheduler will not assign new pods to it.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p4-m7-s4',
          title: 'Drain the node',
          instruction: 'Evict all pods from the node before maintenance.',
          command: 'kubectl drain minikube --ignore-daemonsets --delete-emptydir-data',
          output: [
            'node/minikube already cordoned',
            'WARNING: ignoring DaemonSet-managed Pods: kube-system/kube-proxy-abc12',
            'evicting pod default/nginx-abc12',
            'evicting pod default/web-def34',
            'pod/nginx-abc12 evicted',
            'pod/web-def34 evicted',
            'node/minikube drained',
          ],
          explanation:
            '--ignore-daemonsets skips kube-proxy and other DaemonSet pods (they cannot be rescheduled elsewhere). Evicted pods are rescheduled on other available nodes immediately.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['nginx-abc12 evicted', 'web-def34 evicted'],
          },
        },
        {
          id: 'p4-m7-s5',
          title: 'Uncordon after maintenance',
          instruction: 'Re-enable scheduling on the node.',
          command: 'kubectl uncordon minikube',
          output: ['node/minikube uncordoned'],
          explanation:
            'Uncordon removes the unschedulable taint. The scheduler can now place new pods on this node again. Evicted pods that have been rescheduled elsewhere will stay where they are — they do not automatically move back.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['minikube uncordoned'],
          },
        },
        {
          id: 'p4-m7-s6',
          title: 'Add a taint and test toleration',
          instruction:
            'Taint the node with NoSchedule — only pods with a matching toleration can be scheduled.',
          command: 'kubectl taint nodes minikube env=prod:NoSchedule',
          output: ['node/minikube tainted'],
          explanation:
            'Now only pods with a toleration for env=prod:NoSchedule can be scheduled on minikube. All other pods will be Pending if this is the only node.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['minikube tainted env=prod:NoSchedule'],
          },
          tip: 'Remove the taint: kubectl taint nodes minikube env=prod:NoSchedule-  (note the trailing -)',
        },
      ],
      quiz: [
        {
          id: 'p4-m7-q1',
          question: 'What is the difference between kubectl cordon and kubectl drain?',
          options: [
            'cordon reboots the node; drain just marks it unschedulable',
            'cordon marks the node unschedulable (existing pods stay); drain evicts all pods AND marks it unschedulable',
            'They do the same thing — drain is an alias for cordon',
            'cordon evicts pods; drain does not',
          ],
          answer: 1,
          explanation:
            'Cordon only prevents new pods from being scheduled — existing pods keep running. Drain goes further: it evicts all non-DaemonSet pods (which triggers rescheduling) and also cordons the node.',
        },
        {
          id: 'p4-m7-q2',
          question:
            'kubectl drain fails with "cannot delete Pods not managed by a controller". What does this mean?',
          options: [
            'There are DaemonSet pods — use --ignore-daemonsets',
            'There is a bare Pod (not owned by a ReplicaSet/Deployment) — add --force to delete it',
            'The node has a taint that blocks drain',
            'kubectl drain only works on worker nodes',
          ],
          answer: 1,
          explanation:
            'drain protects unmanaged pods by default. If you delete a bare pod, it cannot be rescheduled (no controller to recreate it). --force overrides this and deletes the pod anyway. Use with caution.',
        },
        {
          id: 'p4-m7-q3',
          question:
            'After draining a node and completing maintenance, pods do not automatically move back to the uncordoned node. Why?',
          options: [
            'The pods are still in Evicted state and need manual restart',
            'The scheduler assigns pods at creation time; it does not rebalance running pods',
            'Pods remain on their current node due to pod affinity rules',
            'You must run kubectl reschedule to trigger rebalancing',
          ],
          answer: 1,
          explanation:
            'The Kubernetes scheduler only places pods when they are first created (or rescheduled after eviction). Running pods are not rebalanced. After uncordoning, new pods and newly rescheduled pods can use the node.',
        },
        {
          id: 'p4-m7-q4',
          question:
            'A taint NoExecute is added to a node. What happens to existing pods without a matching toleration?',
          options: [
            'They continue running — NoExecute only prevents new scheduling',
            'They are evicted immediately (or after tolerationSeconds if set)',
            'They are moved to another node automatically',
            'They enter Pending state on the same node',
          ],
          answer: 1,
          explanation:
            'NoExecute evicts existing pods that do not tolerate the taint. NoSchedule only prevents NEW pods from being scheduled (existing pods are unaffected). NoExecute is more disruptive.',
        },
        {
          id: 'p4-m7-q5',
          question:
            'You add a taint to a node and now one of your DaemonSet pods is evicted. Why did this happen?',
          options: [
            'DaemonSets are always tolerant of all taints',
            'The DaemonSet pod did not have a toleration for the new taint and the effect was NoExecute',
            'Draining a node always evicts DaemonSet pods',
            'DaemonSet pods cannot tolerate NoExecute taints',
          ],
          answer: 1,
          explanation:
            'DaemonSets automatically add tolerations for NoSchedule/NoExecute to built-in taints (like node.kubernetes.io/unschedulable). But custom taints you add manually require explicit tolerations in the DaemonSet spec.',
        },
        {
          id: 'p4-m7-q6',
          question: 'How do you remove a taint from a node?',
          options: [
            'kubectl untaint nodes <node> <key>',
            'kubectl taint nodes <node> <key>:<effect>- (with trailing dash)',
            'kubectl patch node <node> --remove-taint',
            'kubectl drain <node> --remove-taints',
          ],
          answer: 1,
          explanation:
            'The trailing dash removes the taint. Example: kubectl taint nodes node-1 env=prod:NoSchedule-. Without the dash, it would try to add or update the taint.',
        },
      ],
      exercises: [
        {
          id: 'p4-m7-e1',
          title: 'Safe node maintenance simulation',
          kind: 'guided' as const,
          goal: 'Simulate draining a node for maintenance and restoring it',
          commands: [
            'kubectl create deployment web --image=nginx:1.27 --replicas=3',
            'kubectl get pods -o wide',
            'kubectl cordon minikube',
            'kubectl drain minikube --ignore-daemonsets --delete-emptydir-data',
            'kubectl get pods -o wide',
            'kubectl uncordon minikube',
          ],
          verify: [
            'After drain: kubectl get nodes shows SchedulingDisabled',
            'After drain: kubectl get pods shows pods on remaining nodes',
            'After uncordon: kubectl get nodes shows Ready',
          ],
          expectedOutcome: 'Node safely drained and restored with zero pod downtime',
          cleanup: [
            'kubectl delete deployment web',
            'kubectl taint nodes minikube env=prod:NoSchedule- 2>/dev/null || true',
          ],
        },
      ],
    },
  ],
}

export default phase4
