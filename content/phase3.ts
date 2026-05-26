import type { Phase, ClusterState } from '@/lib/types'

const emptyCluster: ClusterState = {
  pods: [], services: [], deployments: [], namespaces: ['default'], events: [],
}

const phase3: Phase = {
  id: 'phase-3',
  slug: 'phase-3',
  title: 'Storage, Ingress & Advanced Workloads',
  shortTitle: 'Storage & Ingress',
  description: 'Persist data with Volumes and PersistentVolumes, expose apps externally with Ingress, and run stateful and node-level workloads.',
  weeks: 'Week 5–6',
  hours: '~10 hours',
  color: 'text-orange-400',
  bgColor: 'bg-orange-500/10 border-orange-500/30',
  modules: [
    // ─── Module 1: Volumes & PersistentVolumes ───────────────────────────────
    {
      id: 'p3-m1',
      slug: 'volumes',
      title: 'Volumes & PersistentVolumes',
      description: 'Understand ephemeral vs persistent storage and provision durable disks with PVCs and StorageClasses.',
      duration: '75 min',
      difficulty: 'intermediate',
      theory: `> 🧠 **Brain Warm-Up**: If a Pod request for a PVC fails with a "Pending" status because there are no matching PersistentVolumes, how does the Kubernetes control plane determine which volume storage class and provisioner to invoke, and what happens at the Node-level OS filesystem when the volume is eventually attached?

## Ephemeral vs Persistent Storage: The Filesystem Boundary

A container's root filesystem is **ephemeral**, managed via an overlay filesystem (e.g., overlay2) where writes are recorded in a temporary container-specific write layer. When the container process exits and is re-created, this write layer is discarded. To preserve state, Kubernetes uses decoupled storage primitives.

### Basic Volume Types

#### emptyDir
An ephemeral scratch directory provisioned directly on the host node's storage media (typically backed by the node's primary disk under \`/var/lib/kubelet/pods/<pod-uid>/volumes/kubernetes.io~empty-dir/\` or memory if \`medium: Memory\` is specified to create a \`tmpfs\` RAM disk).
* **Scope**: Tied directly to the Pod's lifecycle. It survives container crashes and restarts, but is destroyed when the Pod is terminated or rescheduled.
* **Use Case**: Shared memory/disk workspace for multi-container pods (e.g., a sidecar pattern where an app writes logs and a Fluent Bit container reads them).

\`\`\`yaml
volumes:
  - name: scratch
    emptyDir: {}
containers:
  - volumeMounts:
    - name: scratch
      mountPath: /scratch
\`\`\`

#### hostPath
Mounts a specific directory or file from the host node's filesystem directly into the container's mount namespace.
* **Scope**: Node-specific. It is not portable; if the Pod is rescheduled to another node, it has no access to the previous node's data.
* **Security Risks**: Bypasses container namespace boundaries. If a container runs as root or has write permissions, a compromised Pod can read/write raw system configurations, docker socket files, or SSH keys on the host. It should be disabled via PodSecurityStandards/Admission controllers in production.

## Persistent Storage: PV, PVC, StorageClass

For production storage you need three objects working together:

| Object | Scope | Analogy |
|---|---|---|
| **PersistentVolume (PV)** | Cluster-wide | The physical disk |
| **PersistentVolumeClaim (PVC)** | Namespace | A request for a disk |
| **StorageClass** | Cluster-wide | The disk catalogue / provisioner |

### Access Modes

| Mode | Short | Meaning |
|---|---|---|
| \`ReadWriteOnce\` | RWO | mounted read-write by a single node |
| \`ReadOnlyMany\` | ROX | mounted read-only by many nodes simultaneously |
| \`ReadWriteMany\` | RWX | mounted read-write by many nodes simultaneously |
| \`ReadWriteOncePod\` | RWOP | mounted read-write by a single Pod only — stricter than RWO (stable since Kubernetes v1.29) |

Most cloud block storage (AWS EBS, GCE PD) only supports RWO. NFS or cloud file systems support RWX.

### Reclaim Policies

| Policy | Behaviour when PVC is deleted |
|---|---|
| \`Retain\` | data is kept after the PVC is deleted — manual cleanup required |
| \`Delete\` | the underlying storage volume is deleted automatically when the PVC is deleted (cloud provider dependent) |

### The Binding Lifecycle

1. You create a **PVC** specifying storageClass, accessMode, and size.
2. The **StorageClass** provisioner creates a matching **PV** (dynamic provisioning).
3. The PVC moves to **Bound** state — the PV is exclusively reserved for this PVC.
4. You reference the PVC in a Pod spec via \`persistentVolumeClaim.claimName\`.
5. kubelet mounts the volume on the node before starting the container.

---

### PV/PVC Binding & CSI Architecture

\`\`\`
  +-----------------------+              +------------------------+
  |    PersistentVolume   |              | PersistentVolumeClaim  |
  |  (Cluster-wide Disk)  | <=========>  | (Namespace-scoped Req) |
  +-----------+-----------+   (Binding)  +-----------+------------+
              ^                                      ^
   Dynamic    |                                      | Referenced
   Provision  |                                      | by Pod
              |                                      v
  +-----------+-----------+              +-----------+------------+
  |     StorageClass      |              |          Pod           |
  |  (Provisioner Config) |              |  (cgroups & Namespaces)|
  +-----------+-----------+              +-----------+------------+
              |                                      |
              | CSI gRPC API                         | Kubelet Node
              v                                      v Sync
  +-----------+-----------+              +-----------+------------+
  |  CSI Controller Plugin|              |   Kubelet Volume Mgr   |
  |  - CreateVolume       |              |   - NodeStageVolume    |
  |  - ControllerPublish  |              |   - NodePublishVolume  |
  +-----------------------+              +-----------+------------+
                                                     |
                                                     v
                                         +-----------+------------+
                                         | Linux Host Node        |
                                         | - /dev/sdX (Block Dev) |
                                         | - /var/lib/kubelet/... |
                                         +------------------------+
\`\`\`

---

## Under the Hood: The CSI Specification & Mount Lifecycle

When a Pod requesting persistent storage is scheduled, the control plane and node agent orchestrate volume provisioning and mounting via the **Container Storage Interface (CSI)** gRPC API:

### 1. PV-PVC Matching and Binding
The \`pv-controller\` loop in the \`kube-controller-manager\` matches a newly created PVC to a PV. It compares:
* **StorageClassName**: Must match exactly (or default).
* **AccessModes**: PV must support all modes requested in PVC.
* **Capacity**: PV capacity must be greater than or equal to PVC request.
* **Selectors**: PV labels must match the PVC's \`matchLabels\` or \`matchExpressions\`.

If no matching PV is found, and the StorageClass has a dynamic provisioner, the controller calls the CSI plugin's **\`CreateVolume\`** gRPC endpoint to provision the block storage in the cloud/infra.

### 2. Controller Attachment (Attach)
Once bound, the external-attacher controller calls the CSI controller's **\`ControllerPublishVolume\`** gRPC endpoint. This instructs the cloud/storage provider to attach the raw block device (e.g., \`/dev/xvdf\`) to the Linux host node where the Pod has been scheduled.

### 3. Node Staging (Format & Mount)
Inside the target node, the Kubelet's **Volume Manager** takes over. It executes the CSI node plugin's **\`NodeStageVolume\`** gRPC call, which:
* Checks if the device has a filesystem (e.g., ext4, xfs). If not, it formats the block device.
* Mounts the formatted device to a global staging directory on the node:
  \`/var/lib/kubelet/plugins/kubernetes.io/csi/<driver-name>/<volume-id>/globalmount\`

### 4. Node Publishing (Bind Mount)
Finally, Kubelet executes **\`NodePublishVolume\`**. This performs a Linux **bind mount** from the global staging directory to the Pod's specific mount directory:
  \`/var/lib/kubelet/pods/<pod-uid>/volumes/kubernetes.io~csi/<volume-name>/mount\`

Kubelet then configures the container runtime (CRI gRPC API) to launch the container, passing this path as a mount point. The container runtime uses Linux mount namespaces (\`CLONE_NEWNS\`) and cgroups to expose this directory as a directory inside the container's isolated filesystem structure.`,
      labSteps: [
        {
          id: 'p3-m1-s1',
          title: 'Create a Pod with an emptyDir volume',
          instruction: 'Generate a Pod spec dry-run, add an emptyDir volume and a volumeMount, then apply it.',
          command: 'kubectl apply -f scratch-pod.yaml',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: scratch
spec:
  containers:
  - name: nginx
    image: nginx:1.27
    volumeMounts:
    - name: scratch-vol
      mountPath: /scratch
  volumes:
  - name: scratch-vol
    emptyDir: {}`,
          output: ['pod/scratch created'],
          explanation: 'The emptyDir volume is created when the Pod starts and mounted at /scratch inside the container. Both the volume and its data live and die with the Pod — if the container crashes and restarts, the data survives. If the Pod is deleted, the data is gone.',
          clusterState: {
            pods: [
              { id: 'scratch-xyz', name: 'scratch', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Pod scratch scheduled → node-1', 'emptyDir volume scratch-vol mounted at /scratch'],
            highlightedComponent: 'kubelet',
          },
          tip: 'Use kubectl run scratch --image=nginx:1.27 --dry-run=client -o yaml > scratch-pod.yaml to generate the base spec, then add the volumes and volumeMounts sections.',
        },
        {
          id: 'p3-m1-s2',
          title: 'Write and read a file inside the emptyDir',
          instruction: 'Exec into the pod, write a file to /scratch, and read it back.',
          command: 'kubectl exec scratch -- sh -c "echo hello > /scratch/test.txt && cat /scratch/test.txt"',
          output: ['hello'],
          explanation: 'The file is written to the emptyDir volume, not to the container\'s root filesystem. This distinction matters: the container layer is discarded on restart, but the emptyDir survives a container restart within the same Pod.',
          clusterState: {
            pods: [
              { id: 'scratch-xyz', name: 'scratch', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['exec: echo hello > /scratch/test.txt', 'exec: cat /scratch/test.txt → hello'],
          },
        },
        {
          id: 'p3-m1-s3',
          title: 'Prove emptyDir is ephemeral with the Pod',
          instruction: 'Delete the Pod, recreate it, and try to read the file — it will be gone.',
          command: 'kubectl delete pod scratch && kubectl apply -f scratch-pod.yaml && kubectl exec scratch -- cat /scratch/test.txt',
          output: [
            'pod "scratch" deleted',
            'pod/scratch created',
            'cat: /scratch/test.txt: No such file or directory',
          ],
          explanation: 'emptyDir is tied to the Pod, not the container. When the Pod was deleted, its emptyDir was destroyed. The new Pod got a fresh, empty directory. This is why emptyDir is only suitable for temporary scratch space, not for data you need to keep.',
          clusterState: {
            pods: [
              { id: 'scratch-abc2', name: 'scratch', namespace: 'default', node: 'node-2', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Pod scratch deleted', 'Pod scratch recreated → node-2', 'emptyDir is empty — data lost'],
          },
          tip: 'Notice the Pod may land on a different node this time. Even if it landed on the same node, the emptyDir data would still be gone because it was tied to the previous Pod\'s lifecycle.',
        },
        {
          id: 'p3-m1-s4',
          title: 'Create a PersistentVolumeClaim',
          instruction: 'Create a PVC requesting 1Gi of ReadWriteOnce storage from the standard StorageClass.',
          command: 'kubectl apply -f data-pvc.yaml',
          yamlContent: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-vol
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: standard`,
          output: [
            'persistentvolumeclaim/data-vol created',
            '',
            'NAME       STATUS   VOLUME       CAPACITY   ACCESS MODES   STORAGECLASS   AGE',
            'data-vol   Bound    pv-abc123    1Gi        RWO            standard       3s',
          ],
          explanation: 'The PVC was immediately Bound because the StorageClass "standard" supports dynamic provisioning — it automatically created a PV (pv-abc123) to satisfy the request. The PVC is now exclusively reserved for your use in the default namespace.',
          clusterState: {
            pods: [],
            services: [
              { id: 'pv-abc123', name: 'pv-abc123 (PV)', namespace: 'default', type: 'ClusterIP', selector: {}, port: 0, clusterIP: '—' },
            ],
            deployments: [],
            namespaces: ['default'],
            events: ['PVC data-vol: Bound to pv-abc123', 'StorageClass standard dynamically provisioned pv-abc123'],
            highlightedComponent: 'controller',
          },
          tip: 'If a PVC stays in Pending, it means no PV matched the requested storageClass, accessMode, and size. Check kubectl describe pvc data-vol for the exact reason.',
        },
        {
          id: 'p3-m1-s5',
          title: 'Mount the PVC in a Pod',
          instruction: 'Create a Pod that references the PVC by name — data will now persist across Pod restarts.',
          command: 'kubectl apply -f pvc-pod.yaml',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: data-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.27
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: data-vol`,
          output: ['pod/data-pod created'],
          explanation: 'The key difference from emptyDir: the volume source is persistentVolumeClaim.claimName. Kubernetes looks up the PVC, finds the bound PV (pv-abc123), and tells kubelet to mount that real disk. If you delete this Pod and create another Pod referencing the same PVC, the data will still be there.',
          clusterState: {
            pods: [
              { id: 'data-pod-xyz', name: 'data-pod', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [
              { id: 'pv-abc123', name: 'pv-abc123 (PV)', namespace: 'default', type: 'ClusterIP', selector: {}, port: 0, clusterIP: '—' },
            ],
            deployments: [],
            namespaces: ['default'],
            events: ['PVC data-vol: Bound to pv-abc123', 'Pod data-pod mounting PVC data-vol at /data'],
            highlightedComponent: 'kubelet',
          },
        },
        {
          id: 'p3-m1-s6',
          title: 'Inspect the dynamically provisioned PV',
          instruction: 'List PersistentVolumes to see the disk that was automatically created.',
          command: 'kubectl get pv',
          output: [
            'NAME        CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM              STORAGECLASS   AGE',
            'pv-abc123   1Gi        RWO            Delete           Bound    default/data-vol   standard       5m',
          ],
          explanation: 'The PV shows RECLAIM POLICY: Delete — when you delete the PVC data-vol, Kubernetes will automatically delete this PV and the underlying storage. If you needed to keep the data even after deleting the PVC (e.g., for audit), you would patch the PV\'s reclaimPolicy to Retain before deleting the PVC.',
          clusterState: {
            pods: [
              { id: 'data-pod-xyz', name: 'data-pod', namespace: 'default', node: 'node-1', status: 'Running', labels: {}, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [
              { id: 'pv-abc123', name: 'pv-abc123 (PV)', namespace: 'default', type: 'ClusterIP', selector: {}, port: 0, clusterIP: '—' },
            ],
            deployments: [],
            namespaces: ['default'],
            events: ['PV pv-abc123: reclaimPolicy=Delete, status=Bound'],
          },
          tip: 'To protect data from accidental deletion: kubectl patch pv pv-abc123 -p \'{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}\'',
        },
      ],
      quiz: [
        {
          id: 'p3-m1-q1',
          question: 'You have two containers in the same Pod that need to share files. Which volume type is best?',
          options: [
            'hostPath — mounts the node filesystem so both containers see the same files',
            'emptyDir — created when the Pod starts and shared between all containers in the Pod',
            'PersistentVolumeClaim — the only type that works with multiple containers',
            'configMap — designed for sharing configuration files between containers',
          ],
          answer: 1,
          explanation: 'emptyDir is exactly the right tool for sharing files between containers in the same Pod. It is created when the Pod starts and is accessible to every container in that Pod. Both containers mount the same emptyDir volume at their respective mountPaths.',
        },
        {
          id: 'p3-m1-q2',
          question: 'A PVC is in "Pending" state. What is the most likely cause?',
          options: [
            'The PVC YAML has a syntax error',
            'No PV or StorageClass can satisfy the requested storageClass, accessMode, and size',
            'The namespace does not have permission to use PVCs',
            'PVCs always start in Pending before moving to Bound after 60 seconds',
          ],
          answer: 1,
          explanation: 'A PVC stays Pending when no suitable PV exists and the StorageClass cannot dynamically provision one — usually because the storageClassName does not exist, the accessMode is not supported, or the cluster has no provisioner configured. Use kubectl describe pvc <name> to see the exact event.',
        },
        {
          id: 'p3-m1-q3',
          question: 'What access mode allows a volume to be mounted ReadWrite by multiple nodes simultaneously?',
          options: [
            'ReadWriteOnce (RWO)',
            'ReadOnlyMany (ROX)',
            'ReadWriteMany (RWX)',
            'ReadWriteAll (RWA)',
          ],
          answer: 2,
          explanation: 'ReadWriteMany (RWX) allows the volume to be mounted as read-write by many nodes at the same time. Most block storage drivers (AWS EBS, GCE PD) only support ReadWriteOnce. NFS and cloud file systems like Azure Files or AWS EFS support RWX.',
        },
        {
          id: 'p3-m1-q4',
          question: 'What happens to data on a PV with reclaimPolicy: Retain when the PVC is deleted?',
          options: [
            'The PV and its data are immediately deleted',
            'The PV is released and its data is preserved — the PV must be manually reclaimed',
            'The PV is automatically rebound to the next PVC that requests the same size',
            'The data is archived to object storage before the PV is deleted',
          ],
          answer: 1,
          explanation: 'With reclaimPolicy: Retain, deleting the PVC moves the PV to Released state but does NOT delete the PV or the underlying data. An administrator must manually inspect the data, clean it up if needed, and then delete the PV object before it can be reused.',
        },
      ],
    },

    // ─── Module 2: StatefulSets ──────────────────────────────────────────────
    {
      id: 'p3-m2',
      slug: 'statefulsets',
      title: 'StatefulSets',
      description: 'Run databases and clustered apps that need stable identities, ordered startup, and per-Pod persistent storage.',
      duration: '75 min',
      difficulty: 'intermediate',
      theory: `> 🧠 **Brain Warm-Up**: When a StatefulSet Pod (e.g., \`mysql-1\`) crashes or its host node becomes unreachable, how does Kubernetes guarantee that a replacement Pod doesn't start on another node and access the same raw block storage volume concurrently, potentially causing data corruption?

## Why Not Deployments for Stateful Apps?

Deployments are designed for **stateless** workloads. Every Pod in a Deployment is interchangeable — they get random names (\`web-7d4f9b-xk2p\`) and random IPs. If a Pod dies, a replacement with a completely different name and IP is created.

Databases are different. A MySQL replica needs to know exactly which other replica is the primary. A Kafka broker needs a stable identity so other brokers can find it by name. **Random Pod names and IPs break clustering protocols.**

## StatefulSet Guarantees

A StatefulSet provides four guarantees Deployments cannot:

### 1. Stable Pod Names
Pods are numbered from zero: \`mysql-0\`, \`mysql-1\`, \`mysql-2\`. These names survive restarts — if \`mysql-1\` dies, its replacement is also called \`mysql-1\`.

### 2. Stable Network Identity via Headless Service
A **Headless Service** (\`clusterIP: None\`) does not get a virtual IP. Instead, DNS returns the actual Pod IPs directly. Combined with a StatefulSet, each Pod gets its own stable DNS entry:

\`\`\`
mysql-0.mysql.default.svc.cluster.local
mysql-1.mysql.default.svc.cluster.local
mysql-2.mysql.default.svc.cluster.local
\`\`\`

These DNS names are stable — other services can always reach a specific replica.

### 3. Ordered Startup and Shutdown
Pods start in order: 0 → 1 → 2. Each Pod must be Running and Ready before the next one starts. Shutdown happens in reverse: 2 → 1 → 0. This lets databases elect a primary before replicas start.

### 4. Per-Pod PVCs via volumeClaimTemplates
Instead of sharing one PVC, \`volumeClaimTemplates\` creates a **separate PVC per Pod**:
- \`data-web-0\` → mounted by \`web-0\`
- \`data-web-1\` → mounted by \`web-1\`
- \`data-web-2\` → mounted by \`web-2\`

If \`web-1\` is deleted and recreated, it rebinds to \`data-web-1\` — its own dedicated data.

## When to Use StatefulSets

**Use StatefulSets for**: MySQL, PostgreSQL, Cassandra, Redis Cluster, Kafka, ZooKeeper, Elasticsearch.

**Use Deployments for**: stateless apps — web servers, APIs, workers. StatefulSets add complexity you do not need for stateless workloads.

---

### StatefulSet Cluster Architecture & DNS Resolution

\`\`\`
        +-------------------------------------------------+
        |              Headless Service                   |
        |              (clusterIP: None)                  |
        +-----------------------+-------------------------+
                                |
          +---------------------+---------------------+
          | (DNS Lookup: web.default.svc.cluster.local) |
          v                                           v
  +------------------+                       +------------------+
  |  Pod: web-0      |                       |  Pod: web-1      |
  |  IP: 10.244.1.5  |                       |  IP: 10.244.2.9  |
  +--------+---------+                       +--------+---------+
           |                                          |
  Matches  | (Deterministic                           | (Deterministic
  Ordinal  |  Binding)                       Matches  |  Binding)
           v                                 Ordinal  v
  +--------+---------+                       +--------+---------+
  | PVC: data-web-0  |                       | PVC: data-web-1  |
  | (Bound to PV-0)  |                       | (Bound to PV-1)  |
  +------------------+                       +------------------+
\`\`\`

---

## Under the Hood: StatefulSet Controller & Safety Guarantees

### 1. The Controller Sync Loop
The StatefulSet controller operates using a deterministic state sync loop. It uses the Ordinal Index to map Pods to PVCs. The stable hostname format is:
\`<pod-name>.<headless-service-name>.<namespace>.svc.cluster.local\`
CoreDNS dynamically manages these hostnames via Endpoint/EndpointSlice controllers, enabling direct member-to-member clustering communication.

### 2. The "At-Most-One-Pod" Safety Guarantee & Partitions
If a node hosting a StatefulSet Pod (e.g., \`web-1\`) loses connection to the API server, it enters \`Unknown\` state.
* Unlike a Deployment, the StatefulSet controller will **never** automatically force-delete or reschedule the Pod onto a new node.
* Since the underlying physical volume (e.g., cloud block storage like AWS EBS) is mapped to \`ReadWriteOnce\`, attaching the volume to a replacement Pod on another node while the partitioned node might still be running and writing to it could cause severe data corruption.
* The controller waits for the node to return or for manual administrative intervention via \`kubectl delete pod web-1 --force --grace-period=0\`.`,
      labSteps: [
        {
          id: 'p3-m2-s1',
          title: 'Create the Headless Service',
          instruction: 'A StatefulSet requires a Headless Service (clusterIP: None) to provide stable DNS entries for each Pod.',
          command: 'kubectl apply -f web-headless-svc.yaml',
          yamlContent: `apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  clusterIP: None
  selector:
    app: web
  ports:
  - port: 80
    name: http`,
          output: ['service/web created'],
          explanation: 'A Headless Service does not get a virtual cluster IP — clusterIP: None tells Kubernetes to skip IP allocation. When a client does a DNS lookup for "web.default.svc.cluster.local", DNS returns all Pod IPs directly. The StatefulSet controller uses this service to build the stable per-Pod DNS names.',
          clusterState: {
            pods: [],
            services: [
              { id: 'web-headless', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: 'None' },
            ],
            deployments: [],
            namespaces: ['default'],
            events: ['Service web created (Headless, clusterIP: None)'],
          },
          tip: 'Run kubectl get svc web — the CLUSTER-IP column shows <none>. That confirms it is a Headless Service.',
        },
        {
          id: 'p3-m2-s2',
          title: 'Create the StatefulSet',
          instruction: 'Apply a StatefulSet with 3 replicas and a volumeClaimTemplate that gives each Pod its own 1Gi PVC.',
          command: 'kubectl apply -f web-statefulset.yaml',
          yamlContent: `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
spec:
  serviceName: web
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
        volumeMounts:
        - name: data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 1Gi`,
          output: ['statefulset.apps/web created'],
          explanation: 'The serviceName field links the StatefulSet to the Headless Service, enabling stable DNS. The volumeClaimTemplates section is like a PVC template — Kubernetes creates data-web-0, data-web-1, and data-web-2 automatically. Pods are created one at a time in order: web-0 must be Running before web-1 starts.',
          clusterState: {
            pods: [
              { id: 'web-0', name: 'web-0', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [
              { id: 'web-headless', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: 'None' },
            ],
            deployments: [],
            namespaces: ['default'],
            events: ['StatefulSet web created', 'Pod web-0 starting (ordered startup)'],
            highlightedComponent: 'controller',
          },
          tip: 'The key field is serviceName — it must match the name of the Headless Service. Without it, stable DNS names will not be created.',
        },
        {
          id: 'p3-m2-s3',
          title: 'Watch ordered Pod startup',
          instruction: 'List pods — they should be named web-0, web-1, web-2 and started in that exact order.',
          command: 'kubectl get pods',
          output: [
            'NAME    READY   STATUS    RESTARTS   AGE',
            'web-0   1/1     Running   0          90s',
            'web-1   1/1     Running   0          60s',
            'web-2   1/1     Running   0          30s',
          ],
          explanation: 'Each Pod has a stable, predictable name: web-0, web-1, web-2. This is fundamentally different from a Deployment where you would see names like web-7d4f9b-xk2p. The age difference shows ordered startup — web-0 was Running before web-1 was created.',
          clusterState: {
            pods: [
              { id: 'web-0', name: 'web-0', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-1', name: 'web-1', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-2', name: 'web-2', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [
              { id: 'web-headless', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: 'None' },
            ],
            deployments: [],
            namespaces: ['default'],
            events: ['web-0 Running', 'web-1 Running', 'web-2 Running'],
          },
        },
        {
          id: 'p3-m2-s4',
          title: 'Verify per-Pod PVCs',
          instruction: 'List PersistentVolumeClaims — each Pod should have its own dedicated PVC.',
          command: 'kubectl get pvc',
          output: [
            'NAME         STATUS   VOLUME       CAPACITY   ACCESS MODES   STORAGECLASS   AGE',
            'data-web-0   Bound    pv-aa1111    1Gi        RWO            standard       90s',
            'data-web-1   Bound    pv-bb2222    1Gi        RWO            standard       60s',
            'data-web-2   Bound    pv-cc3333    1Gi        RWO            standard       30s',
          ],
          explanation: 'Three separate PVCs — data-web-0, data-web-1, data-web-2 — each bound to its own PV. This is the power of volumeClaimTemplates: each Pod replica gets isolated storage. web-0\'s data is never visible to web-1 or web-2.',
          clusterState: {
            pods: [
              { id: 'web-0', name: 'web-0', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-1', name: 'web-1', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-2', name: 'web-2', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [
              { id: 'web-headless', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: 'None' },
            ],
            deployments: [],
            namespaces: ['default'],
            events: ['PVC data-web-0: Bound to pv-aa1111', 'PVC data-web-1: Bound to pv-bb2222', 'PVC data-web-2: Bound to pv-cc3333'],
          },
        },
        {
          id: 'p3-m2-s5',
          title: 'Delete a Pod — it returns with the same name',
          instruction: 'Delete web-1 and watch it come back with the exact same name and reconnect to its PVC.',
          command: 'kubectl delete pod web-1 && kubectl get pods -w',
          output: [
            'pod "web-1" deleted',
            'NAME    READY   STATUS              RESTARTS   AGE',
            'web-0   1/1     Running             0          5m',
            'web-1   0/1     Terminating         0          4m',
            'web-2   1/1     Running             0          3m',
            'web-1   0/1     Pending             0          0s',
            'web-1   0/1     ContainerCreating   0          1s',
            'web-1   1/1     Running             0          4s',
          ],
          explanation: 'The replacement Pod is named web-1 — not web-1-abcde or any random suffix. It automatically rebinds to the PVC data-web-1, recovering all its data. The stable DNS name web-1.web.default.svc.cluster.local also resolves to the new Pod immediately. Other pods that relied on this DNS name are unaffected.',
          clusterState: {
            pods: [
              { id: 'web-0', name: 'web-0', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-1', name: 'web-1', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'web-2', name: 'web-2', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [
              { id: 'web-headless', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: 'None' },
            ],
            deployments: [],
            namespaces: ['default'],
            events: ['web-1 deleted', 'web-1 recreated → rebound to data-web-1', 'DNS web-1.web.default.svc.cluster.local still resolves'],
            highlightedComponent: 'controller',
          },
          tip: 'Stable DNS name format: <pod-name>.<service-name>.<namespace>.svc.cluster.local. For web-1: web-1.web.default.svc.cluster.local.',
        },
      ],
      quiz: [
        {
          id: 'p3-m2-q1',
          question: 'You delete mysql-2 in a StatefulSet. What name does the replacement Pod get?',
          options: [
            'mysql-3 — the next available number',
            'mysql-2 — StatefulSets always recreate with the same name',
            'mysql-2-abcde — StatefulSets append a random suffix like Deployments',
            'The StatefulSet does not recreate it — you must recreate manually',
          ],
          answer: 1,
          explanation: 'StatefulSets always recreate a deleted Pod with the same ordinal name. mysql-2 is recreated as mysql-2, not mysql-3 or mysql-2-abcde. This stable identity is the core guarantee of a StatefulSet.',
        },
        {
          id: 'p3-m2-q2',
          question: 'What is the purpose of a Headless Service with a StatefulSet?',
          options: [
            'To load balance traffic across all Pods evenly',
            'To expose the StatefulSet to external traffic via a NodePort',
            'To give each Pod a stable DNS entry so other apps can reach a specific replica by name',
            'To prevent Pods from receiving any traffic during startup',
          ],
          answer: 2,
          explanation: 'A Headless Service (clusterIP: None) causes DNS to return individual Pod IPs instead of a single virtual IP. Combined with a StatefulSet, each Pod gets a stable DNS name like mysql-0.mysql.default.svc.cluster.local. This allows apps to address a specific replica directly — essential for database clustering.',
        },
        {
          id: 'p3-m2-q3',
          question: 'In a StatefulSet with 3 replicas, what is the startup order?',
          options: [
            'All three Pods start simultaneously',
            '2 → 1 → 0 (highest ordinal first)',
            '0 → 1 → 2 (lowest ordinal first, each waits for the previous to be Ready)',
            'Random order determined by the scheduler',
          ],
          answer: 2,
          explanation: 'StatefulSets start Pods in ascending ordinal order: 0 → 1 → 2. Each Pod must be in Running and Ready state before the next one is created. Shutdown happens in reverse (2 → 1 → 0). This ordered lifecycle lets databases elect a primary before replicas start.',
        },
        {
          id: 'p3-m2-q4',
          question: 'How is volumeClaimTemplates different from a regular volumes entry in a StatefulSet?',
          options: [
            'There is no functional difference — both can be used interchangeably',
            'volumeClaimTemplates creates a separate PVC for each Pod replica; a regular volumes entry shares one PVC across all Pods',
            'volumeClaimTemplates only works with hostPath volumes',
            'A regular volumes entry supports more StorageClasses than volumeClaimTemplates',
          ],
          answer: 1,
          explanation: 'volumeClaimTemplates acts as a PVC factory: it creates data-pod-0, data-pod-1, data-pod-2 — one unique PVC per Pod. A regular volumes.persistentVolumeClaim entry references one existing PVC that all Pods would share (which breaks isolation for databases).',
        },
      ],
    },

    // ─── Module 3: DaemonSets ────────────────────────────────────────────────
    {
      id: 'p3-m3',
      slug: 'daemonsets',
      title: 'DaemonSets',
      description: 'Run exactly one Pod on every node for cluster-wide infrastructure like log collectors and monitoring agents.',
      duration: '45 min',
      difficulty: 'intermediate',
      theory: `> 🧠 **Brain Warm-Up**: How does a DaemonSet bypass a node's \`NoSchedule\` taints to run system-critical pods (like network plugins or log agents) on master or cordoned nodes, and why does the default scheduler handle DaemonSet pods differently than normal application pods?

## What Is a DaemonSet?

A **DaemonSet** ensures that exactly **one copy** of a Pod runs on every node in the cluster (or a subset of nodes, if you use a nodeSelector or tolerations). It is the answer to the question: *"How do I run something on every machine in my cluster?"*

## Automatic Scheduling

When you add a new node to the cluster, the DaemonSet controller automatically schedules the Pod on it — no manual action needed. When a node is removed or drained, the DaemonSet Pod on that node is garbage collected.

## DaemonSet vs Deployment

| | DaemonSet | Deployment |
|---|---|---|
| Scheduling | 1 Pod per node | N replicas, anywhere |
| Scaling | Automatic (matches node count) | Manual or HPA |
| Use case | Node-level infrastructure | Application workloads |

## Real-World Use Cases

- **Log collectors**: Fluentd, Filebeat — collect logs from every node's /var/log
- **Monitoring agents**: Prometheus node-exporter — scrape hardware metrics from each node
- **Network plugins**: Calico, Cilium — must run on every node to manage the overlay network
- **Storage daemons**: Ceph, GlusterFS agents
- **Security agents**: Falco, intrusion detection

## Update Strategies

| Strategy | Behaviour |
|---|---|
| \`RollingUpdate\` (default) | Updates one node at a time; the old Pod is deleted before the new one starts |
| \`OnDelete\` | New Pod version is only applied when you manually delete the old Pod — gives full control over timing |

\`RollingUpdate\` is safe for most workloads. Use \`OnDelete\` when you need to coordinate the rollout with node maintenance windows.

---

### DaemonSet Controller and Scheduling Engine

\`\`\`
  +-------------------------------------------------------------+
  |                     DaemonSet Controller                    |
  +------------------------------+------------------------------+
                                 | Watches Nodes & Pods
                                 v
        +-----------------------------------------------+
        | Injects NodeAffinity & Critical Tolerations    |
        +------------------------+----------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  |                        kube-scheduler                       |
  | (Bypasses cordons/taints using injected tolerations)         |
  +----+-------------------------+-------------------------+----+
       |                         |                         |
       v Node A                  v Node B                  v Master Node (Tainted)
  +----+------------+       +----+------------+       +----+------------+
  |  log-collector  |       |  log-collector  |       |  log-collector  |
  |  Pod (Ready)    |       |  Pod (Ready)    |       |  Pod (Ready)    |
  +-----------------+       +-----------------+       +-----------------+
\`\`\`

---

## Under the Hood: DaemonSet Scheduling & Node Taints

### 1. Modern Scheduler Integration
Historically, the DaemonSet controller set the Pod's \`spec.nodeName\` directly. In modern versions (since v1.12), the controller delegates scheduling to the default \`kube-scheduler\`. The controller automatically appends a \`NodeAffinity\` corresponding to the target node's labels, ensuring the scheduler processes the Pod correctly.

### 2. Bypassing Master and Cordoned Node Taints
To make sure system-level daemons run everywhere, the DaemonSet controller automatically injects critical tolerations to bypass taints:
* \`node.kubernetes.io/unschedulable\` (allows running on cordoned/drained nodes)
* \`node.kubernetes.io/not-ready\` / \`node.kubernetes.io/unreachable\` (allows scheduling during transient network/host outages)
* \`node.kubernetes.io/memory-pressure\` / \`node.kubernetes.io/disk-pressure\` / \`node.kubernetes.io/pid-pressure\` (allows scheduling during resource crunch)

### 3. Resource Allocation and Quality of Service (QoS)
System daemons should always be defined with **Guaranteed QoS** (requests = limits) and given system PriorityClasses (\`system-node-critical\` or \`system-cluster-critical\`). Kubelet adjusts their \`oom_score_adj\` value (typically to \`-997\`), preventing them from being killed by the OOM Killer or evicted during node-level resource starvation.`,
      labSteps: [
        {
          id: 'p3-m3-s1',
          title: 'Create a DaemonSet for log collection',
          instruction: 'Apply a DaemonSet using the Fluent Bit image — one Pod will be scheduled on every node.',
          command: 'kubectl apply -f log-collector-ds.yaml',
          yamlContent: `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-collector
spec:
  selector:
    matchLabels:
      app: log-collector
  template:
    metadata:
      labels:
        app: log-collector
    spec:
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit:3.3
        resources:
          limits:
            memory: 128Mi
            cpu: 100m`,
          output: ['daemonset.apps/log-collector created'],
          explanation: 'The DaemonSet spec looks similar to a Deployment but has no replicas field. The scheduler decides how many Pods to run based on the node count. For a 3-node cluster (node-1, node-2, controlplane), 3 Pods will be created.',
          clusterState: {
            pods: [
              { id: 'log-node1', name: 'log-collector-node1', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'log-collector' }, image: 'fluent/fluent-bit:3.3', restarts: 0 },
              { id: 'log-node2', name: 'log-collector-node2', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'log-collector' }, image: 'fluent/fluent-bit:3.3', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['DaemonSet log-collector created', 'Pod scheduled on node-1', 'Pod scheduled on node-2'],
            highlightedComponent: 'controller',
          },
          tip: 'DaemonSet Pods are also scheduled on the control plane node by default if no taint is present. In managed Kubernetes (EKS, GKE, AKS) the control plane is hidden and only worker nodes receive DaemonSet Pods.',
        },
        {
          id: 'p3-m3-s2',
          title: 'Verify one Pod per node',
          instruction: 'Use -o wide to see which node each DaemonSet Pod is running on.',
          command: 'kubectl get pods -o wide',
          output: [
            'NAME                        READY   STATUS    RESTARTS   NODE           AGE',
            'log-collector-4hxkp         1/1     Running   0          node-1         30s',
            'log-collector-9mwqr         1/1     Running   0          node-2         30s',
            'log-collector-vt7nz         1/1     Running   0          controlplane   30s',
          ],
          explanation: 'One Pod per node — exactly what a DaemonSet guarantees. Each Pod has a random suffix (4hxkp, 9mwqr, vt7nz) appended to the DaemonSet name, unlike StatefulSets which use ordinal numbers. The NODE column confirms the 1:1 mapping.',
          clusterState: {
            pods: [
              { id: 'log-4hxkp', name: 'log-collector-4hxkp', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'log-collector' }, image: 'fluent/fluent-bit:3.3', restarts: 0 },
              { id: 'log-9mwqr', name: 'log-collector-9mwqr', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'log-collector' }, image: 'fluent/fluent-bit:3.3', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['1 Pod per node confirmed'],
          },
        },
        {
          id: 'p3-m3-s3',
          title: 'Inspect DaemonSet status',
          instruction: 'Check the DaemonSet summary to confirm all desired Pods are running.',
          command: 'kubectl get daemonset',
          output: [
            'NAME            DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE',
            'log-collector   3         3         3       3            3           <none>          2m',
          ],
          explanation: 'DESIRED=3 because the cluster has 3 nodes. CURRENT and READY both equal 3, confirming all Pods are healthy. NODE SELECTOR is <none> meaning no nodeSelector is set — the DaemonSet targets every node. If you add a nodeSelector, only matching nodes show up in DESIRED.',
          clusterState: {
            pods: [
              { id: 'log-4hxkp', name: 'log-collector-4hxkp', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'log-collector' }, image: 'fluent/fluent-bit:3.3', restarts: 0 },
              { id: 'log-9mwqr', name: 'log-collector-9mwqr', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'log-collector' }, image: 'fluent/fluent-bit:3.3', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['DESIRED=3 CURRENT=3 READY=3'],
          },
        },
        {
          id: 'p3-m3-s4',
          title: 'Describe the DaemonSet',
          instruction: 'Use describe to inspect the update strategy and confirm no nodeSelector is set.',
          command: 'kubectl describe daemonset log-collector',
          output: [
            'Name:           log-collector',
            'Selector:       app=log-collector',
            'Node-Selector:  <none>',
            'Labels:         <none>',
            'Desired Number of Nodes Scheduled: 3',
            'Current Number of Nodes Scheduled: 3',
            'Number of Nodes Scheduled with Up-to-date Pods: 3',
            'Number of Nodes Scheduled with Available Pods: 3',
            'Update Strategy: RollingUpdate',
            '  Rolling Update Max Unavailable: 1',
          ],
          explanation: 'Update Strategy: RollingUpdate with maxUnavailable: 1 means during an update, at most 1 node\'s Pod is unavailable at any time. Node-Selector: <none> means all nodes are targeted. To restrict to specific nodes, add a nodeSelector: with a label that matches only the desired nodes.',
          clusterState: {
            pods: [
              { id: 'log-4hxkp', name: 'log-collector-4hxkp', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'log-collector' }, image: 'fluent/fluent-bit:3.3', restarts: 0 },
              { id: 'log-9mwqr', name: 'log-collector-9mwqr', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'log-collector' }, image: 'fluent/fluent-bit:3.3', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Update strategy: RollingUpdate (maxUnavailable: 1)'],
          },
          tip: 'To target only specific nodes, add spec.template.spec.nodeSelector: {disk: ssd} and label the nodes: kubectl label node node-1 disk=ssd',
        },
      ],
      quiz: [
        {
          id: 'p3-m3-q1',
          question: 'You add a new node to the cluster. What does the DaemonSet controller do automatically?',
          options: [
            'Nothing — you must manually scale the DaemonSet',
            'It schedules one DaemonSet Pod on the new node automatically',
            'It asks you to confirm before scheduling on the new node',
            'It scales down an existing Pod on another node to rebalance',
          ],
          answer: 1,
          explanation: 'The DaemonSet controller watches for new nodes and automatically schedules the DaemonSet Pod on them. No manual action is needed. This is a key operational advantage: your monitoring agent or log collector is running on every node the moment it joins the cluster.',
        },
        {
          id: 'p3-m3-q2',
          question: 'A DaemonSet is different from a Deployment because it...',
          options: [
            'Can only run a single replica at a time',
            'Schedules exactly one Pod on every node instead of N replicas wherever capacity allows',
            'Does not support rolling updates',
            'Is only available in the kube-system namespace',
          ],
          answer: 1,
          explanation: 'A Deployment schedules N replicas wherever the scheduler finds capacity. A DaemonSet schedules exactly 1 Pod per node — the replica count automatically matches the node count. They serve fundamentally different purposes: application scaling vs node-level infrastructure.',
        },
        {
          id: 'p3-m3-q3',
          question: 'Which DaemonSet update strategy gives you the most control over when nodes are updated?',
          options: [
            'RollingUpdate — it lets you set exact per-node timing',
            'OnDelete — the new Pod version is only applied when you manually delete the old Pod',
            'Recreate — all Pods are deleted and recreated simultaneously',
            'BlueGreen — old and new versions run side-by-side until you switch',
          ],
          answer: 1,
          explanation: 'OnDelete gives you complete control: the DaemonSet only runs the new Pod template when you manually delete the old Pod on that specific node. This is useful when you want to coordinate the update with a node maintenance window or other operational procedure.',
        },
        {
          id: 'p3-m3-q4',
          question: 'Name two real-world use cases where DaemonSets are the correct workload type.',
          options: [
            'A web API and a background job processor',
            'A log collector (Fluentd/Filebeat) and a node metrics exporter (Prometheus node-exporter)',
            'A database primary and its read replicas',
            'A frontend application and a CDN cache',
          ],
          answer: 1,
          explanation: 'Log collectors (Fluentd, Filebeat) and node metrics exporters (Prometheus node-exporter) are the canonical DaemonSet use cases — they need to run on every node to collect data from that node\'s filesystem and hardware. Network plugins (Calico, Cilium) are another classic example.',
        },
      ],
    },

    // ─── Module 4: Ingress ───────────────────────────────────────────────────
    {
      id: 'p3-m4',
      slug: 'ingress',
      title: 'Ingress',
      description: 'Route external HTTP/HTTPS traffic to multiple services with a single entry point and path-based rules.',
      duration: '75 min',
      difficulty: 'intermediate',
      theory: `> 🧠 **Brain Warm-Up**: When a client sends an HTTP request to \`myapp.local/api\` via Ingress, does the Ingress Controller forward the packet to the Service's ClusterIP, or does it bypass the Kubernetes service mesh routing? How does this impact load-balancing algorithms and connection keep-alives?

## The Problem with NodePort and LoadBalancer

**NodePort**: exposes a high-numbered port (30000–32767) on every node. Not suitable for production — users should not type \`myapp.com:31234\`.

**LoadBalancer**: creates one cloud load balancer per Service. If you have 10 microservices, you pay for 10 load balancers. That is expensive and hard to manage.

## Ingress: N Services, One Entry Point

**Ingress** is a Kubernetes resource that defines HTTP/HTTPS routing rules. It acts like a virtual host configuration for a reverse proxy:

\`\`\`
Internet → LoadBalancer → IngressController → (routing rules) → Service A
                                                               → Service B
                                                               → Service C
\`\`\`

One cloud load balancer handles all traffic. The IngressController applies your rules.

## Two Components

| Component | What it is |
|---|---|
| **Ingress resource** | A Kubernetes object containing routing rules (host, path → Service) |
| **IngressController** | A running reverse proxy (nginx, Traefik, HAProxy, AWS ALB) that reads those rules and routes real traffic |

**Important**: creating an Ingress resource without an IngressController does nothing. The IngressController must be installed separately.

## Path Types

| Type | Path \`/api\` matches |
|---|---|
| \`Exact\` | Only \`/api\` (not \`/api/users\`) |
| \`Prefix\` | \`/api\`, \`/api/users\`, \`/api/v2/items\` |

## TLS Termination

Reference a \`kubernetes.io/tls\` Secret to enable HTTPS at the Ingress:

\`\`\`yaml
spec:
  tls:
  - hosts:
    - myapp.local
    secretName: myapp-tls
\`\`\`

Create the Secret with: \`kubectl create secret tls myapp-tls --cert=tls.crt --key=tls.key\`

The IngressController handles the TLS handshake. Backend Services receive plain HTTP — they do not need to know about TLS.

## Annotations

Controller-specific behaviour (rate limiting, rewrites, auth) is configured via annotations:

\`\`\`yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/limit-rps: "10"
\`\`\`

These are read by the IngressController — not by Kubernetes itself.

---

### L7 Routing & TLS Termination Flow

\`\`\`
         [ Client HTTPS Request ]
             (Host: myapp.local)
                     |
                     v
  +------------------+-------------------+
  | Cloud Load Balancer (TCP Pass-Through)|
  +------------------+-------------------+
                     | (TLS Encrypted, Port 443)
                     v
  +------------------+-------------------+
  |      Ingress-Nginx Controller        |
  |  - TLS Handshake (SNI Match via SNI) |
  |  - Decrypts and injects headers      |
  |  - Fetches Pod IPs from EndpointSlice| (Bypasses Service IP!)
  +-------+---------------------+--------+
          |                     |
          v (Plain HTTP / L7)   v (Plain HTTP / L7)
  +-------+------------+   +----+---------------+
  |  Pod: Web-0        |   |  Pod: Web-1        |
  |  (10.244.1.5:80)   |   |  (10.244.2.9:80)   |
  +--------------------+   +--------------------+
\`\`\`

---

## Under the Hood: L7 Ingress Routing Internals

### 1. ClusterIP Bypass & Direct Endpoint Routing
Rather than proxying requests to the virtual IP (ClusterIP) of the backend Service, most Ingress Controllers bypass kube-proxy entirely. The Ingress Controller queries the API server for \`Endpoints\` or \`EndpointSlices\` associated with the target Service. It maintains a direct list of backend Pod IPs and forwards connections straight to them. This enables:
* Advanced L7 load-balancing algorithms (e.g., cookie-based session affinity, least-connections, hashing).
* Optimal TCP connection pooling and keep-alive management, avoiding the extra packet translation overhead of NAT routing.

### 2. SNI Match & TLS Handshake
For HTTPS ingress, client handshakes terminate directly at the Ingress Controller. Using **Server Name Indication (SNI)**, the controller extracts the requested hostname from the \`ClientHello\` handshake packet. It loads the corresponding \`kubernetes.io/tls\` certificate, decrypts the request, injects standard proxy headers (\`X-Forwarded-For\`, \`X-Forwarded-Proto\`, and \`X-Real-IP\`), and streams the decrypted payload to the backend Pod endpoint.

### 3. Dynamic Reloading
Modern ingress controllers (like Ingress-Nginx) avoid restarting the web server process during endpoint updates. They use a Go sidecar or embedded Lua engines (OpenResty) to dynamically refresh backend Pod IPs in shared memory tables without dropping active TCP connections.`,
      labSteps: [
        {
          id: 'p3-m4-s1',
          title: 'Install the nginx IngressController',
          instruction: 'Apply the official nginx IngressController manifest for a kind cluster.',
          command: 'kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.0/deploy/static/provider/kind/deploy.yaml',
          output: [
            'namespace/ingress-nginx created',
            'serviceaccount/ingress-nginx created',
            'configmap/ingress-nginx-controller created',
            'deployment.apps/ingress-nginx-controller created',
            'service/ingress-nginx-controller created',
          ],
          explanation: 'The IngressController is a Deployment (not a CRD or built-in controller) that runs in the ingress-nginx namespace. It watches for Ingress resources cluster-wide and configures an nginx process to route traffic accordingly. Without this, Ingress resources are just inert config objects.',
          clusterState: {
            pods: [
              { id: 'ingress-ctrl', name: 'ingress-nginx-controller-7d4bc', namespace: 'default', node: 'node-1', status: 'Running', labels: { 'app.kubernetes.io/name': 'ingress-nginx' }, image: 'registry.k8s.io/ingress-nginx/controller:v1.12.0', restarts: 0 },
            ],
            services: [
              { id: 'ingress-svc', name: 'ingress-nginx-controller', namespace: 'default', type: 'NodePort', selector: { 'app.kubernetes.io/name': 'ingress-nginx' }, port: 80, clusterIP: '10.96.1.100' },
            ],
            deployments: [],
            namespaces: ['default', 'ingress-nginx'],
            events: ['IngressController deployed in ingress-nginx namespace'],
            highlightedComponent: 'controller',
          },
          tip: 'Wait for the controller Pod to be Running before creating Ingress resources: kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=90s',
        },
        {
          id: 'p3-m4-s2',
          title: 'Deploy two backend services',
          instruction: 'Create two Deployments and expose them as ClusterIP services — the Ingress will route to both.',
          command: 'kubectl create deployment web --image=nginx:1.27 && kubectl expose deployment web --port=80 && kubectl create deployment api --image=hashicorp/http-echo:latest --port=5678 && kubectl expose deployment api --port=80 --target-port=5678',
          output: [
            'deployment.apps/web created',
            'service/web created',
            'deployment.apps/api created',
            'service/api created',
          ],
          explanation: 'Both services are ClusterIP — they are not directly accessible from outside the cluster. The Ingress will be the single external entry point that routes /api to the api service and / to the web service. This is the N:1 pattern that makes Ingress cost-effective.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'api-def34', name: 'api-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'api' }, image: 'hashicorp/http-echo:latest', restarts: 0 },
            ],
            services: [
              { id: 'web-svc', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: '10.96.10.10' },
              { id: 'api-svc', name: 'api', namespace: 'default', type: 'ClusterIP', selector: { app: 'api' }, port: 80, clusterIP: '10.96.10.11' },
            ],
            deployments: [
              { id: 'web-deploy', name: 'web', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'nginx:1.27' },
              { id: 'api-deploy', name: 'api', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'hashicorp/http-echo:latest' },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: ['Deployment web created', 'Service web exposed on port 80', 'Deployment api created', 'Service api exposed on port 80'],
          },
        },
        {
          id: 'p3-m4-s3',
          title: 'Create the Ingress routing rules',
          instruction: 'Apply an Ingress that routes / to the web service and /api to the api service, both for host myapp.local.',
          command: 'kubectl apply -f myapp-ingress.yaml',
          yamlContent: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: myapp.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api
            port:
              number: 80`,
          output: ['ingress.networking.k8s.io/myapp created'],
          explanation: 'The Ingress resource is just configuration — the IngressController reads it and reconfigures nginx. ingressClassName: nginx tells Kubernetes which controller should own this Ingress. The rewrite-target annotation strips the /api prefix before forwarding to the api service.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'api-def34', name: 'api-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'api' }, image: 'hashicorp/http-echo:latest', restarts: 0 },
            ],
            services: [
              { id: 'web-svc', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: '10.96.10.10' },
              { id: 'api-svc', name: 'api', namespace: 'default', type: 'ClusterIP', selector: { app: 'api' }, port: 80, clusterIP: '10.96.10.11' },
              { id: 'ingress-ctrl-svc', name: 'ingress-nginx-controller', namespace: 'default', type: 'ClusterIP', selector: { 'app.kubernetes.io/name': 'ingress-nginx' }, port: 80, clusterIP: '10.96.1.100' },
            ],
            deployments: [
              { id: 'web-deploy', name: 'web', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'nginx:1.27' },
              { id: 'api-deploy', name: 'api', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'hashicorp/http-echo:latest' },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: ['Ingress rule: / → web:80', 'Ingress rule: /api → api:80'],
          },
        },
        {
          id: 'p3-m4-s4',
          title: 'Verify the Ingress ADDRESS is populated',
          instruction: 'List Ingress resources — the ADDRESS column should show the IngressController\'s IP once it is ready.',
          command: 'kubectl get ingress',
          output: [
            'NAME    CLASS   HOSTS         ADDRESS        PORTS   AGE',
            'myapp   nginx   myapp.local   192.168.49.2   80      45s',
          ],
          explanation: 'The ADDRESS column shows the IP of the IngressController\'s LoadBalancer or NodePort service. If ADDRESS is empty, the IngressController is not yet ready or no external IP has been assigned. In a kind cluster, the address is the Docker container IP of the control plane node.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'api-def34', name: 'api-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'api' }, image: 'hashicorp/http-echo:latest', restarts: 0 },
            ],
            services: [
              { id: 'web-svc', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: '10.96.10.10' },
              { id: 'api-svc', name: 'api', namespace: 'default', type: 'ClusterIP', selector: { app: 'api' }, port: 80, clusterIP: '10.96.10.11' },
              { id: 'ingress-ctrl-svc', name: 'ingress-nginx-controller', namespace: 'default', type: 'ClusterIP', selector: { 'app.kubernetes.io/name': 'ingress-nginx' }, port: 80, clusterIP: '10.96.1.100' },
            ],
            deployments: [
              { id: 'web-deploy', name: 'web', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'nginx:1.27' },
              { id: 'api-deploy', name: 'api', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'hashicorp/http-echo:latest' },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: ['Ingress myapp: ADDRESS=192.168.49.2', 'Ingress rule: / → web:80', 'Ingress rule: /api → api:80'],
          },
          tip: 'Test the routing locally by adding "192.168.49.2 myapp.local" to /etc/hosts, then: curl http://myapp.local and curl http://myapp.local/api',
        },
        {
          id: 'p3-m4-s5',
          title: 'Inspect the routing rules',
          instruction: 'Use describe to see the full routing table the IngressController is applying.',
          command: 'kubectl describe ingress myapp',
          output: [
            'Name:             myapp',
            'Namespace:        default',
            'Address:          192.168.49.2',
            'Ingress Class:    nginx',
            'Rules:',
            '  Host         Path    Backends',
            '  ----         ----    --------',
            '  myapp.local',
            '               /       web:80 (10.244.0.12:80)',
            '               /api    api:80 (10.244.1.8:5678)',
            'Annotations:  nginx.ingress.kubernetes.io/rewrite-target: /',
          ],
          explanation: 'The Rules table confirms the routing: requests to myapp.local/ go to the web Service (which resolves to Pod IP 10.244.0.12), and requests to myapp.local/api go to the api Service. The annotation rewrite-target: / is also shown here.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'api-def34', name: 'api-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'api' }, image: 'hashicorp/http-echo:latest', restarts: 0 },
            ],
            services: [
              { id: 'web-svc', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: '10.96.10.10' },
              { id: 'api-svc', name: 'api', namespace: 'default', type: 'ClusterIP', selector: { app: 'api' }, port: 80, clusterIP: '10.96.10.11' },
              { id: 'ingress-ctrl-svc', name: 'ingress-nginx-controller', namespace: 'default', type: 'ClusterIP', selector: { 'app.kubernetes.io/name': 'ingress-nginx' }, port: 80, clusterIP: '10.96.1.100' },
            ],
            deployments: [
              { id: 'web-deploy', name: 'web', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'nginx:1.27' },
              { id: 'api-deploy', name: 'api', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'hashicorp/http-echo:latest' },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: ['Ingress rule: / → web:80', 'Ingress rule: /api → api:80'],
          },
        },
        {
          id: 'p3-m4-s6',
          title: 'Add TLS to the Ingress',
          instruction: 'Create a TLS Secret and update the Ingress spec to terminate HTTPS at the IngressController.',
          command: 'kubectl create secret tls myapp-tls --cert=tls.crt --key=tls.key',
          yamlContent: `# First create the TLS secret:
# kubectl create secret tls myapp-tls --cert=tls.crt --key=tls.key

# Then add spec.tls to the Ingress:
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - myapp.local
    secretName: myapp-tls
  rules:
  - host: myapp.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web
            port:
              number: 80`,
          output: ['secret/myapp-tls created'],
          explanation: 'The spec.tls section references the Secret containing the certificate and private key. The IngressController reads the Secret, configures an HTTPS listener, and terminates TLS before forwarding plain HTTP to the backend Services. Backend Services never see TLS — they always receive plain HTTP. This is called TLS termination.',
          clusterState: {
            pods: [
              { id: 'web-abc12', name: 'web-abc12', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'web' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'api-def34', name: 'api-def34', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'api' }, image: 'hashicorp/http-echo:latest', restarts: 0 },
            ],
            services: [
              { id: 'web-svc', name: 'web', namespace: 'default', type: 'ClusterIP', selector: { app: 'web' }, port: 80, clusterIP: '10.96.10.10' },
              { id: 'api-svc', name: 'api', namespace: 'default', type: 'ClusterIP', selector: { app: 'api' }, port: 80, clusterIP: '10.96.10.11' },
              { id: 'ingress-ctrl-svc', name: 'ingress-nginx-controller', namespace: 'default', type: 'ClusterIP', selector: { 'app.kubernetes.io/name': 'ingress-nginx' }, port: 80, clusterIP: '10.96.1.100' },
            ],
            deployments: [
              { id: 'web-deploy', name: 'web', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'nginx:1.27' },
              { id: 'api-deploy', name: 'api', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'hashicorp/http-echo:latest' },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: ['Secret myapp-tls created', 'Ingress myapp: TLS enabled for myapp.local', 'Ingress rule: / → web:80', 'Ingress rule: /api → api:80'],
          },
          tip: 'For production, use cert-manager (cert-manager.io) to automatically provision and renew Let\'s Encrypt certificates instead of managing certs manually.',
        },
      ],
      quiz: [
        {
          id: 'p3-m4-q1',
          question: 'You create an Ingress resource but traffic is not being routed. What is the most likely missing component?',
          options: [
            'A NetworkPolicy is blocking traffic to the Ingress',
            'An IngressController — the Ingress resource is just config and does nothing without a running controller',
            'The Services must be type LoadBalancer for Ingress to work',
            'The Ingress needs a ClusterRoleBinding to read Service endpoints',
          ],
          answer: 1,
          explanation: 'An Ingress resource without an IngressController is inert configuration. The IngressController (nginx, Traefik, etc.) is a separately installed component that watches Ingress resources and actually routes traffic. Creating the Ingress resource alone changes nothing until a controller is running and watching for it.',
        },
        {
          id: 'p3-m4-q2',
          question: 'What is the advantage of Ingress over creating a LoadBalancer Service for each app?',
          options: [
            'Ingress is faster because it bypasses kube-proxy',
            'Ingress uses one cloud load balancer for all Services instead of one per Service, which is more cost-effective',
            'Ingress supports UDP traffic while LoadBalancer Services only support TCP',
            'Ingress automatically scales backends while LoadBalancer Services do not',
          ],
          answer: 1,
          explanation: 'Each LoadBalancer Service creates a new cloud load balancer, which costs money and adds operational overhead. Ingress funnels all external traffic through a single IngressController (one load balancer), then routes to many backend Services based on host and path rules. This is the N:1 pattern.',
        },
        {
          id: 'p3-m4-q3',
          question: 'Path type Prefix with path /api — which of these URLs does it match?',
          options: [
            '/api and /api/users only',
            '/api, /api/users, and /api-v2',
            '/api and /api/users but NOT /api-v2',
            'Only exactly /api',
          ],
          answer: 2,
          explanation: 'Prefix matching splits the URL on "/" boundaries. /api (Prefix) matches /api and /api/users (because /api is a path prefix of /api/users) but does NOT match /api-v2 (because "api-v2" is a different path segment from "api"). Use Exact if you want to match only /api with nothing after it.',
        },
        {
          id: 'p3-m4-q4',
          question: 'Where do you configure controller-specific behaviors like URL rewriting or rate limiting?',
          options: [
            'In the Ingress spec.rules section',
            'In a separate IngressConfig CRD',
            'In annotations on the Ingress resource',
            'In a ConfigMap in the kube-system namespace',
          ],
          answer: 2,
          explanation: 'Controller-specific behaviour (rewrite-target, rate limiting, auth, timeouts) is configured via annotations on the Ingress resource. The annotations are prefixed with the controller name, e.g., nginx.ingress.kubernetes.io/rewrite-target. Kubernetes itself ignores annotations — only the IngressController reads them.',
        },
        {
          id: 'p3-m4-q5',
          question: 'How does TLS termination work with Ingress?',
          options: [
            'The backend Services handle TLS — the Ingress just passes through encrypted traffic',
            'The IngressController handles the TLS handshake and forwards plain HTTP to backend Services',
            'TLS is not supported by Ingress — use a LoadBalancer Service for HTTPS',
            'Both the IngressController and each backend Service must have matching TLS certificates',
          ],
          answer: 1,
          explanation: 'TLS termination at the Ingress means the IngressController handles the HTTPS connection from the client, decrypts it, and forwards plain HTTP to the backend Services. Backend Services do not need TLS certificates or HTTPS configuration. This simplifies backend development and centralises certificate management.',
        },
      ],
    },

    // ─── Module 5: NetworkPolicies ───────────────────────────────────────────
    {
      id: 'p3-m5',
      slug: 'network-policies',
      title: 'NetworkPolicies',
      description: 'Implement namespace-level firewall rules to control which Pods can communicate with each other.',
      duration: '60 min',
      difficulty: 'advanced',
      theory: `> 🧠 **Brain Warm-Up**: When you apply a NetworkPolicy blocking all ingress traffic, why does the Pod still receive packets, and at what layers of the Linux kernel or networking stack (e.g., eBPF, iptables chains, IPVS tables) is the traffic actually rejected or dropped?

## Default Network Behaviour

By default, Kubernetes uses a **flat network**: every Pod can reach every other Pod in any namespace, on any port. There are no firewalls between them. This is convenient for getting started but dangerous for production — a compromised Pod can freely reach your database.

## NetworkPolicy: Kubernetes Firewalls

A **NetworkPolicy** is a namespace-scoped resource that defines firewall rules for Pod traffic. It works at the IP/port level, not the HTTP level.

**Critical prerequisite**: NetworkPolicies are enforced by the **CNI plugin**, not by Kubernetes itself. You must use a CNI that supports NetworkPolicies:
- ✅ Calico, Cilium, Weave Net, Antrea
- ❌ kindnet (the default kind CNI) — policies are accepted but NOT enforced

## Policy Types

| Type | Controls |
|---|---|
| \`Ingress\` | Traffic entering a Pod |
| \`Egress\` | Traffic leaving a Pod |

A NetworkPolicy applies to Pods matched by \`podSelector\`. If no \`podSelector\` is specified (\`{}\`), the policy applies to ALL pods in the namespace.

## The Default-Deny Pattern

The most secure posture is **allowlist-based**:

**Step 1**: Apply a default-deny policy (empty ingress/egress rules):
\`\`\`yaml
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
  # no ingress or egress rules = deny all
\`\`\`

**Step 2**: Add explicit allow policies for each required traffic flow.

This is the same pattern as a security group in AWS or a firewall in traditional networking — deny everything, then allow specific flows.

## Selector Types

| Selector | Matches |
|---|---|
| \`podSelector\` | Pods with specific labels in the same namespace |
| \`namespaceSelector\` | All pods in namespaces with specific labels |
| \`ipBlock\` | Specific CIDR ranges (for external traffic) |

You can combine \`podSelector\` and \`namespaceSelector\` to mean "Pods with label X in namespace Y".

## Key Gotcha: namespaceSelector and Labels

\`namespaceSelector\` matches on **namespace labels**, not namespace names. The target namespace must have the label you are selecting on:

\`\`\`bash
kubectl label namespace monitoring env=monitoring
\`\`\`

Then \`namespaceSelector: {matchLabels: {env: monitoring}}\` will work.

---

### NetworkPolicy Kernel-Level Filtering Flow

\`\`\`
    [ Incoming Packet ] (Source: Attacker Pod IP)
            |
            v
  +------------------+-------------------+
  |  Linux Host Network Namespace       |
  +------------------+-------------------+
            |
            v (Enters veth interface for Target Pod)
  +------------------+-------------------+
  |  CNI Enforcement Hook (Kernel Space)|
  |                                     |
  |  - Option A: eBPF Socket Filter     |  ==> Match found? No => [ DROP Packet ]
  |  - Option B: iptables & ipset checks|
  +------------------+-------------------+
                     | (Permitted by Allowlist)
                     v
  +------------------+-------------------+
  |  Target Pod Network Namespace       |
  |  - Container Processes (Port 80)    |
  +-------------------------------------+
\`\`\`

---

## Under the Hood: NetworkPolicy Enforcement & CNI Engines

### 1. The Role of the CNI Daemon
Because NetworkPolicies are not enforced by the Kubernetes control plane directly, the CNI daemon (e.g., \`calico-node\` or \`cilium-agent\`) must watch the API server for policies and Pod changes. When a rule is added, the local CNI daemon translates it into low-level host OS kernel configuration.

### 2. iptables and ipset Chains (Calico standard mode)
In an iptables-based CNI, the agent configures custom chains (such as \`KUBE-NWPLCY-*\`). It aggregates the matched IPs of labeled pods into **\`ipsets\`**—in-kernel hash tables that allow the iptables engine to match packets in O(1) time rather than linearly scanning hundreds of IP addresses.

### 3. eBPF Filtering (Cilium mode)
In eBPF-based networks, the CNI compiles NetworkPolicies directly into eBPF bytecode. It loads this program into the Linux kernel and binds it to the virtual ethernet interface (\`veth\` pair) or traffic control (\`tc\`) subsystems. Packets are evaluated and dropped at the socket layer, avoiding IP routing pipeline processing entirely for blocked connections, minimizing CPU utilization.

### 4. Connection Tracking (\`conntrack\`)
NetworkPolicies operate statefully. The policy engine hooks into the Linux kernel's connection tracking module (\`conntrack\`). Once a TCP handshake packet matches an allowed Egress or Ingress rule, the reverse response packets are automatically allowed back through the firewall, even if no explicit rule permits the return path.`,
      labSteps: [
        {
          id: 'p3-m5-s1',
          title: 'Deploy two pods and verify open communication',
          instruction: 'Create frontend and backend pods and confirm they can reach each other — the default flat network.',
          command: 'kubectl run frontend --image=nginx:1.27 --labels=app=frontend && kubectl run backend --image=nginx:1.27 --labels=app=backend && kubectl exec frontend -- wget -qO- http://backend',
          output: [
            'pod/frontend created',
            'pod/backend created',
            '<!DOCTYPE html>',
            '<html>',
            '<head><title>Welcome to nginx!</title></head>',
            '...',
          ],
          explanation: 'By default, any Pod can reach any other Pod. The wget succeeded because there are no NetworkPolicies in this namespace — all traffic is allowed. This is convenient in development but a security risk in production.',
          clusterState: {
            pods: [
              { id: 'frontend-xyz', name: 'frontend', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'frontend' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'backend-abc', name: 'backend', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'backend' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['frontend → backend: allowed (no NetworkPolicy)'],
          },
          tip: 'You need a CNI that enforces NetworkPolicies (Calico or Cilium) for the next steps to actually block traffic. In a kind cluster with kindnet, the policies will be accepted but not enforced.',
        },
        {
          id: 'p3-m5-s2',
          title: 'Apply a default-deny policy',
          instruction: 'Apply a NetworkPolicy that denies ALL ingress traffic to every Pod in the default namespace.',
          command: 'kubectl apply -f default-deny.yaml',
          yamlContent: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: default
spec:
  podSelector: {}
  policyTypes:
  - Ingress`,
          output: ['networkpolicy.networking.k8s.io/default-deny-ingress created'],
          explanation: 'podSelector: {} (empty) selects ALL pods in the namespace. policyTypes: [Ingress] with no ingress rules means: deny all ingress traffic to every Pod. This is the starting point for a secure namespace — now you add explicit allow rules for only the traffic you need.',
          clusterState: {
            pods: [
              { id: 'frontend-xyz', name: 'frontend', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'frontend' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'backend-abc', name: 'backend', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'backend' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['NetworkPolicy default-deny-ingress applied', 'All ingress traffic BLOCKED for all pods in default'],
            highlightedComponent: 'kubelet',
          },
        },
        {
          id: 'p3-m5-s3',
          title: 'Confirm traffic is blocked',
          instruction: 'Try to reach backend from frontend — the connection should time out.',
          command: 'kubectl exec frontend -- wget -qO- http://backend --timeout=5',
          output: [
            'wget: download timed out',
          ],
          explanation: 'The default-deny policy is working. frontend can no longer reach backend because all ingress to backend is denied. The connection times out (not refused) because the CNI plugin silently drops the packets rather than sending a TCP RST.',
          clusterState: {
            pods: [
              { id: 'frontend-xyz', name: 'frontend', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'frontend' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'backend-abc', name: 'backend', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'backend' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['frontend → backend: BLOCKED by default-deny-ingress'],
          },
        },
        {
          id: 'p3-m5-s4',
          title: 'Allow frontend to reach backend',
          instruction: 'Apply a NetworkPolicy that allows only frontend pods to send ingress traffic to backend pods.',
          command: 'kubectl apply -f allow-frontend-to-backend.yaml',
          yamlContent: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend`,
          output: ['networkpolicy.networking.k8s.io/allow-frontend-to-backend created'],
          explanation: 'This policy selects Pods with app=backend and allows ingress from Pods with app=frontend. The default-deny policy still applies to all other pods — only this specific frontend→backend flow is now permitted. All other pods in the namespace are still blocked from reaching backend.',
          clusterState: {
            pods: [
              { id: 'frontend-xyz', name: 'frontend', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'frontend' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'backend-abc', name: 'backend', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'backend' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['NetworkPolicy allow-frontend-to-backend applied', 'frontend → backend: ALLOWED', 'all others → backend: BLOCKED'],
          },
        },
        {
          id: 'p3-m5-s5',
          title: 'Verify allow and block simultaneously',
          instruction: 'Confirm frontend can reach backend, and that a third "attacker" pod still cannot.',
          command: 'kubectl exec frontend -- wget -qO- http://backend && kubectl run attacker --image=nginx:1.27 --labels=app=attacker --restart=Never && kubectl exec attacker -- wget -qO- http://backend --timeout=5',
          output: [
            '<!DOCTYPE html>',
            '<html><head><title>Welcome to nginx!</title></head>',
            '...',
            'pod/attacker created',
            'wget: download timed out',
          ],
          explanation: 'frontend succeeds because it matches the allow policy (app=frontend). attacker times out because it has app=attacker — it does not match the allow rule, so the default-deny policy blocks it. This is the allowlist model in action: only explicitly permitted traffic is allowed.',
          clusterState: {
            pods: [
              { id: 'frontend-xyz', name: 'frontend', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'frontend' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'backend-abc', name: 'backend', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'backend' }, image: 'nginx:1.27', restarts: 0 },
              { id: 'attacker-zzz', name: 'attacker', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'attacker' }, image: 'nginx:1.27', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['frontend → backend: ALLOWED', 'attacker → backend: BLOCKED (default-deny)'],
          },
          tip: 'Use kubectl describe networkpolicy to see exactly which pods and namespaces are selected by each policy. This is invaluable for debugging unexpected connectivity.',
        },
      ],
      quiz: [
        {
          id: 'p3-m5-q1',
          question: 'By default, can pods in namespace A reach pods in namespace B?',
          options: [
            'No — namespaces are isolated by default',
            'Yes — Kubernetes uses a flat network where all pods can reach all other pods by default',
            'Only if both namespaces have the same labels',
            'Only if the pods have identical SecurityContext settings',
          ],
          answer: 1,
          explanation: 'Kubernetes uses a flat network model by default: every Pod can reach every other Pod regardless of namespace. NetworkPolicies must be explicitly applied to restrict this. This is why applying a default-deny policy is a security best practice in production namespaces.',
        },
        {
          id: 'p3-m5-q2',
          question: 'You apply a NetworkPolicy with podSelector: {} and no ingress rules. What is the effect?',
          options: [
            'No effect — an empty policy is ignored',
            'All pods in the namespace have all ingress traffic denied',
            'All pods in the cluster have all ingress traffic denied',
            'Only pods without labels have ingress traffic denied',
          ],
          answer: 1,
          explanation: 'podSelector: {} selects ALL pods in the namespace (the empty selector is a wildcard). Including Ingress in policyTypes with no ingress rules means: apply an ingress firewall to all pods, allowing nothing. This is the default-deny pattern — the foundation of secure namespace isolation.',
        },
        {
          id: 'p3-m5-q3',
          question: 'A NetworkPolicy uses namespaceSelector. What must be true about the target namespace for this to work?',
          options: [
            'The namespace name must exactly match the selector value',
            'The namespace must have a label that matches the namespaceSelector',
            'The namespace must be in the same region as the source namespace',
            'The namespace must have a NetworkPolicy of its own',
          ],
          answer: 1,
          explanation: 'namespaceSelector matches on namespace labels, not names. The target namespace must have the label you are selecting. For example, if your policy uses namespaceSelector: {matchLabels: {env: monitoring}}, you must first run: kubectl label namespace monitoring env=monitoring.',
        },
        {
          id: 'p3-m5-q4',
          question: 'Your cluster uses kindnet as the CNI. You apply NetworkPolicies. Are they enforced?',
          options: [
            'Yes — all CNI plugins enforce NetworkPolicies',
            'No — kindnet does not support NetworkPolicy enforcement; you need Calico, Cilium, or another compatible CNI',
            'Only Egress policies are enforced; Ingress policies require a different CNI',
            'Yes, but only within the same namespace',
          ],
          answer: 1,
          explanation: 'kindnet (the default CNI for kind clusters) does not enforce NetworkPolicies. The resources are accepted by the Kubernetes API but have no effect on actual traffic. To enforce NetworkPolicies in a kind cluster, you must install Calico or Cilium as the CNI plugin instead of kindnet.',
        },
      ],
    },
  ],
}

export default phase3
