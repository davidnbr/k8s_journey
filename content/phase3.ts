import type { Phase, ClusterState } from '@/lib/types'

const emptyCluster: ClusterState = {
  pods: [],
  services: [],
  deployments: [],
  namespaces: ['default'],
  events: [],
}

const phase3: Phase = {
  id: 'phase-3',
  slug: 'phase-3',
  title: 'Storage, Ingress & Advanced Workloads',
  shortTitle: 'Storage & Ingress',
  description:
    'Persist data with Volumes and PersistentVolumes, expose apps externally with Ingress, and run stateful and node-level workloads.',
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
      description:
        'Understand ephemeral vs persistent storage and provision durable disks with PVCs and StorageClasses.',
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
          instruction:
            'Generate a Pod spec dry-run, add an emptyDir volume and a volumeMount, then apply it.',
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
          explanation:
            'The emptyDir volume is created when the Pod starts and mounted at /scratch inside the container. Both the volume and its data live and die with the Pod — if the container crashes and restarts, the data survives. If the Pod is deleted, the data is gone.',
          clusterState: {
            pods: [
              {
                id: 'scratch-xyz',
                name: 'scratch',
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
              'Pod scratch scheduled → node-1',
              'emptyDir volume scratch-vol mounted at /scratch',
            ],
            highlightedComponent: 'kubelet',
          },
          tip: 'Use kubectl run scratch --image=nginx:1.27 --dry-run=client -o yaml > scratch-pod.yaml to generate the base spec, then add the volumes and volumeMounts sections.',
        },
        {
          id: 'p3-m1-s2',
          title: 'Write and read a file inside the emptyDir',
          instruction: 'Exec into the pod, write a file to /scratch, and read it back.',
          command:
            'kubectl exec scratch -- sh -c "echo hello > /scratch/test.txt && cat /scratch/test.txt"',
          output: ['hello'],
          explanation:
            "The file is written to the emptyDir volume, not to the container's root filesystem. This distinction matters: the container layer is discarded on restart, but the emptyDir survives a container restart within the same Pod.",
          clusterState: {
            pods: [
              {
                id: 'scratch-xyz',
                name: 'scratch',
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
            events: ['exec: echo hello > /scratch/test.txt', 'exec: cat /scratch/test.txt → hello'],
          },
        },
        {
          id: 'p3-m1-s3',
          title: 'Prove emptyDir is ephemeral with the Pod',
          instruction: 'Delete the Pod, recreate it, and try to read the file — it will be gone.',
          command:
            'kubectl delete pod scratch && kubectl apply -f scratch-pod.yaml && kubectl exec scratch -- cat /scratch/test.txt',
          output: [
            'pod "scratch" deleted',
            'pod/scratch created',
            'cat: /scratch/test.txt: No such file or directory',
          ],
          explanation:
            'emptyDir is tied to the Pod, not the container. When the Pod was deleted, its emptyDir was destroyed. The new Pod got a fresh, empty directory. This is why emptyDir is only suitable for temporary scratch space, not for data you need to keep.',
          clusterState: {
            pods: [
              {
                id: 'scratch-abc2',
                name: 'scratch',
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
              'Pod scratch deleted',
              'Pod scratch recreated → node-2',
              'emptyDir is empty — data lost',
            ],
          },
          tip: "Notice the Pod may land on a different node this time. Even if it landed on the same node, the emptyDir data would still be gone because it was tied to the previous Pod's lifecycle.",
        },
        {
          id: 'p3-m1-s4',
          title: 'Create a PersistentVolumeClaim',
          instruction:
            'Create a PVC requesting 1Gi of ReadWriteOnce storage from the standard StorageClass.',
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
          explanation:
            'The PVC was immediately Bound because the StorageClass "standard" supports dynamic provisioning — it automatically created a PV (pv-abc123) to satisfy the request. The PVC is now exclusively reserved for your use in the default namespace.',
          clusterState: {
            pods: [],
            services: [
              {
                id: 'pv-abc123',
                name: 'pv-abc123 (PV)',
                namespace: 'default',
                type: 'ClusterIP',
                selector: {},
                port: 0,
                clusterIP: '—',
              },
            ],
            deployments: [],
            namespaces: ['default'],
            events: [
              'PVC data-vol: Bound to pv-abc123',
              'StorageClass standard dynamically provisioned pv-abc123',
            ],
            highlightedComponent: 'controller',
          },
          tip: 'If a PVC stays in Pending, it means no PV matched the requested storageClass, accessMode, and size. Check kubectl describe pvc data-vol for the exact reason.',
        },
        {
          id: 'p3-m1-s5',
          title: 'Mount the PVC in a Pod',
          instruction:
            'Create a Pod that references the PVC by name — data will now persist across Pod restarts.',
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
          explanation:
            'The key difference from emptyDir: the volume source is persistentVolumeClaim.claimName. Kubernetes looks up the PVC, finds the bound PV (pv-abc123), and tells kubelet to mount that real disk. If you delete this Pod and create another Pod referencing the same PVC, the data will still be there.',
          clusterState: {
            pods: [
              {
                id: 'data-pod-xyz',
                name: 'data-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: {},
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'pv-abc123',
                name: 'pv-abc123 (PV)',
                namespace: 'default',
                type: 'ClusterIP',
                selector: {},
                port: 0,
                clusterIP: '—',
              },
            ],
            deployments: [],
            namespaces: ['default'],
            events: [
              'PVC data-vol: Bound to pv-abc123',
              'Pod data-pod mounting PVC data-vol at /data',
            ],
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
          explanation:
            "The PV shows RECLAIM POLICY: Delete — when you delete the PVC data-vol, Kubernetes will automatically delete this PV and the underlying storage. If you needed to keep the data even after deleting the PVC (e.g., for audit), you would patch the PV's reclaimPolicy to Retain before deleting the PVC.",
          clusterState: {
            pods: [
              {
                id: 'data-pod-xyz',
                name: 'data-pod',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: {},
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'pv-abc123',
                name: 'pv-abc123 (PV)',
                namespace: 'default',
                type: 'ClusterIP',
                selector: {},
                port: 0,
                clusterIP: '—',
              },
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
          question:
            'You have two containers in the same Pod that need to share files. Which volume type is best?',
          options: [
            'hostPath — mounts the node filesystem so both containers see the same files',
            'emptyDir — created when the Pod starts and shared between all containers in the Pod',
            'PersistentVolumeClaim — the only type that works with multiple containers',
            'configMap — designed for sharing configuration files between containers',
          ],
          answer: 1,
          explanation:
            'emptyDir is exactly the right tool for sharing files between containers in the same Pod. It is created when the Pod starts and is accessible to every container in that Pod. Both containers mount the same emptyDir volume at their respective mountPaths.',
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
          explanation:
            'A PVC stays Pending when no suitable PV exists and the StorageClass cannot dynamically provision one — usually because the storageClassName does not exist, the accessMode is not supported, or the cluster has no provisioner configured. Use kubectl describe pvc <name> to see the exact event.',
        },
        {
          id: 'p3-m1-q3',
          question:
            'What access mode allows a volume to be mounted ReadWrite by multiple nodes simultaneously?',
          options: [
            'ReadWriteOnce (RWO)',
            'ReadOnlyMany (ROX)',
            'ReadWriteMany (RWX)',
            'ReadWriteAll (RWA)',
          ],
          answer: 2,
          explanation:
            'ReadWriteMany (RWX) allows the volume to be mounted as read-write by many nodes at the same time. Most block storage drivers (AWS EBS, GCE PD) only support ReadWriteOnce. NFS and cloud file systems like Azure Files or AWS EFS support RWX.',
        },
        {
          id: 'p3-m1-q4',
          question:
            'What happens to data on a PV with reclaimPolicy: Retain when the PVC is deleted?',
          options: [
            'The PV and its data are immediately deleted',
            'The PV is released and its data is preserved — the PV must be manually reclaimed',
            'The PV is automatically rebound to the next PVC that requests the same size',
            'The data is archived to object storage before the PV is deleted',
          ],
          answer: 1,
          explanation:
            'With reclaimPolicy: Retain, deleting the PVC moves the PV to Released state but does NOT delete the PV or the underlying data. An administrator must manually inspect the data, clean it up if needed, and then delete the PV object before it can be reused.',
        },
      ],
      coverage: {
        concepts: [
          'emptyDir for ephemeral shared storage',
          'PersistentVolume (PV) as cluster resource',
          'PersistentVolumeClaim (PVC) as namespace claim',
          'StorageClass for dynamic provisioning',
          'access modes: ReadWriteOnce/ReadOnlyMany/ReadWriteMany',
          'reclaimPolicy: Retain/Delete',
        ],
        commands: [
          'kubectl get pv',
          'kubectl get pvc',
          'kubectl get storageclass',
          'kubectl describe pv',
          'kubectl describe pvc',
          'kubectl apply -f pvc.yaml',
        ],
        architecture: [
          'PV cluster-scoped, PVC namespace-scoped',
          'StorageClass provisioner creates PV on demand',
          'PVC binding: capacity + accessMode + storageClass matching',
          'kubelet mounts PV onto node before pod starts',
        ],
        techniques: [
          'dynamic provisioning via StorageClass',
          'static PV provisioning',
          'mounting PVC in pod volumeMounts',
          'verifying data persistence across pod delete/recreate',
        ],
        procedures: [
          'create PVC with StorageClass',
          'mount PVC in pod',
          'write data, delete pod, recreate pod, verify data persists',
          'inspect PV reclaimPolicy after PVC delete',
        ],
        toolsAndPlugins: ['kubectl', 'minikube', 'minikube storage-provisioner addon'],
        cases: [
          'PVC stays Pending — no matching StorageClass or capacity',
          'pod Pending — PVC not bound yet',
          'data deleted silently with reclaimPolicy: Delete after PVC removed',
        ],
        scenarios: [
          'persist data across pod restarts on minikube',
          'debug PVC stuck in Pending: wrong StorageClass name',
        ],
      },
      exercises: [
        {
          id: 'p3-m1-e1',
          title: 'Official tutorial: configure a Pod to use a PersistentVolume for storage',
          kind: 'guided',
          goal: 'Follow the official "Configure a Pod to Use a PersistentVolume for Storage" tutorial: create data on node via minikube ssh, create PV with hostPath, create PVC, create Pod that mounts it, verify nginx serves the file.',
          commands: [
            'minikube ssh "sudo mkdir -p /mnt/data && sudo sh -c \'echo Hello from Kubernetes storage > /mnt/data/index.html\'"',
            'minikube ssh "cat /mnt/data/index.html"',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: PersistentVolume
metadata:
  name: task-pv-volume
  labels:
    type: local
spec:
  storageClassName: manual
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/mnt/data"
EOF`,
            'kubectl get pv task-pv-volume',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: task-pv-claim
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 3Gi
EOF`,
            'kubectl get pv task-pv-volume',
            'kubectl get pvc task-pv-claim',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: task-pv-pod
spec:
  volumes:
    - name: task-pv-storage
      persistentVolumeClaim:
        claimName: task-pv-claim
  containers:
    - name: task-pv-container
      image: nginx
      ports:
        - containerPort: 80
          name: "http-server"
      volumeMounts:
        - mountPath: "/usr/share/nginx/html"
          name: task-pv-storage
EOF`,
            'kubectl get pod task-pv-pod',
            'kubectl exec -it task-pv-pod -- /bin/bash -c "curl http://localhost/"',
          ],
          verify: [
            'After PV create: STATUS shows Available',
            'After PVC create: PV STATUS changes to Bound, CLAIM shows default/task-pv-claim',
            'PVC STATUS shows Bound, VOLUME shows task-pv-volume',
            'curl inside pod returns "Hello from Kubernetes storage"',
          ],
          expectedOutcome: 'Full PV → PVC → Pod bind chain confirmed; node data served via nginx.',
          cleanup: [
            'kubectl delete pod task-pv-pod --ignore-not-found',
            'kubectl delete pvc task-pv-claim --ignore-not-found',
            'kubectl delete pv task-pv-volume --ignore-not-found',
          ],
          sourceRefs: [
            {
              title: 'Kubernetes: Configure a Pod to Use a PersistentVolume for Storage',
              url: 'https://kubernetes.io/docs/tutorials/configuration/configure-persistent-volume-storage/',
              checkedAt: '2026-06',
              scope: 'tutorial',
            },
          ],
        },
        {
          id: 'p3-m1-e2',
          title: 'Write PVC and pod manifest from memory',
          kind: 'challenge',
          goal: 'Write a complete PVC and pod manifest without referencing docs.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: challenge-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 50Mi
---
apiVersion: v1
kind: Pod
metadata:
  name: challenge-pod
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ["sh", "-c", "echo hello > /mnt/data.txt && sleep 3600"]
    volumeMounts:
    - name: vol
      mountPath: /mnt
  volumes:
  - name: vol
    persistentVolumeClaim:
      claimName: challenge-pvc
EOF`,
            'kubectl get pvc challenge-pvc',
            'kubectl exec challenge-pod -- cat /mnt/data.txt',
          ],
          verify: ['PVC bound', 'Pod running', 'cat returns hello'],
          expectedOutcome: 'PVC and pod written from memory and working correctly.',
          cleanup: [
            'kubectl delete pod challenge-pod --ignore-not-found',
            'kubectl delete pvc challenge-pvc',
          ],
        },
        {
          id: 'p3-m1-e3',
          title: 'Diagnose PVC stuck in Pending',
          kind: 'debug',
          goal: 'Create a PVC with a nonexistent StorageClass and diagnose why it stays Pending.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: broken-pvc
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: this-storageclass-does-not-exist
  resources:
    requests:
      storage: 100Mi
EOF`,
            'kubectl get pvc broken-pvc',
            'kubectl describe pvc broken-pvc',
            'kubectl get storageclass',
          ],
          verify: [
            'PVC stays in Pending',
            'describe shows no provisioner event or StorageClass not found',
          ],
          expectedOutcome: 'StorageClass mismatch identified as root cause of Pending PVC.',
          cleanup: ['kubectl delete pvc broken-pvc'],
        },
        {
          id: 'p3-m1-e4',
          title: '3-day spaced review — PV/PVC commands',
          kind: 'spaced-review',
          goal: 'Recall storage inspection commands from memory.',
          commands: [
            'kubectl get storageclass',
            'kubectl get pv',
            'kubectl get pvc -A',
            'kubectl explain persistentvolumeclaim.spec.accessModes',
          ],
          verify: ['minikube standard StorageClass visible', 'explain shows access mode options'],
          expectedOutcome: 'PV/PVC commands recalled without notes.',
          cleanup: [],
        },
      ],
    },

    // ─── Module 2: StatefulSets ──────────────────────────────────────────────
    {
      id: 'p3-m2',
      slug: 'statefulsets',
      title: 'StatefulSets',
      description:
        'Run databases and clustered apps that need stable identities, ordered startup, and per-Pod persistent storage.',
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
          instruction:
            'A StatefulSet requires a Headless Service (clusterIP: None) to provide stable DNS entries for each Pod.',
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
          explanation:
            'A Headless Service does not get a virtual cluster IP — clusterIP: None tells Kubernetes to skip IP allocation. When a client does a DNS lookup for "web.default.svc.cluster.local", DNS returns all Pod IPs directly. The StatefulSet controller uses this service to build the stable per-Pod DNS names.',
          clusterState: {
            pods: [],
            services: [
              {
                id: 'web-headless',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: 'None',
              },
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
          instruction:
            'Apply a StatefulSet with 3 replicas and a volumeClaimTemplate that gives each Pod its own 1Gi PVC.',
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
          explanation:
            'The serviceName field links the StatefulSet to the Headless Service, enabling stable DNS. The volumeClaimTemplates section is like a PVC template — Kubernetes creates data-web-0, data-web-1, and data-web-2 automatically. Pods are created one at a time in order: web-0 must be Running before web-1 starts.',
          clusterState: {
            pods: [
              {
                id: 'web-0',
                name: 'web-0',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'web-headless',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: 'None',
              },
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
          instruction:
            'List pods — they should be named web-0, web-1, web-2 and started in that exact order.',
          command: 'kubectl get pods',
          output: [
            'NAME    READY   STATUS    RESTARTS   AGE',
            'web-0   1/1     Running   0          90s',
            'web-1   1/1     Running   0          60s',
            'web-2   1/1     Running   0          30s',
          ],
          explanation:
            'Each Pod has a stable, predictable name: web-0, web-1, web-2. This is fundamentally different from a Deployment where you would see names like web-7d4f9b-xk2p. The age difference shows ordered startup — web-0 was Running before web-1 was created.',
          clusterState: {
            pods: [
              {
                id: 'web-0',
                name: 'web-0',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-1',
                name: 'web-1',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-2',
                name: 'web-2',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'web-headless',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: 'None',
              },
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
          explanation:
            "Three separate PVCs — data-web-0, data-web-1, data-web-2 — each bound to its own PV. This is the power of volumeClaimTemplates: each Pod replica gets isolated storage. web-0's data is never visible to web-1 or web-2.",
          clusterState: {
            pods: [
              {
                id: 'web-0',
                name: 'web-0',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-1',
                name: 'web-1',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-2',
                name: 'web-2',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'web-headless',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: 'None',
              },
            ],
            deployments: [],
            namespaces: ['default'],
            events: [
              'PVC data-web-0: Bound to pv-aa1111',
              'PVC data-web-1: Bound to pv-bb2222',
              'PVC data-web-2: Bound to pv-cc3333',
            ],
          },
        },
        {
          id: 'p3-m2-s5',
          title: 'Delete a Pod — it returns with the same name',
          instruction:
            'Delete web-1 and watch it come back with the exact same name and reconnect to its PVC.',
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
          explanation:
            'The replacement Pod is named web-1 — not web-1-abcde or any random suffix. It automatically rebinds to the PVC data-web-1, recovering all its data. The stable DNS name web-1.web.default.svc.cluster.local also resolves to the new Pod immediately. Other pods that relied on this DNS name are unaffected.',
          clusterState: {
            pods: [
              {
                id: 'web-0',
                name: 'web-0',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-1',
                name: 'web-1',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'web-2',
                name: 'web-2',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'web-headless',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: 'None',
              },
            ],
            deployments: [],
            namespaces: ['default'],
            events: [
              'web-1 deleted',
              'web-1 recreated → rebound to data-web-1',
              'DNS web-1.web.default.svc.cluster.local still resolves',
            ],
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
          explanation:
            'StatefulSets always recreate a deleted Pod with the same ordinal name. mysql-2 is recreated as mysql-2, not mysql-3 or mysql-2-abcde. This stable identity is the core guarantee of a StatefulSet.',
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
          explanation:
            'A Headless Service (clusterIP: None) causes DNS to return individual Pod IPs instead of a single virtual IP. Combined with a StatefulSet, each Pod gets a stable DNS name like mysql-0.mysql.default.svc.cluster.local. This allows apps to address a specific replica directly — essential for database clustering.',
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
          explanation:
            'StatefulSets start Pods in ascending ordinal order: 0 → 1 → 2. Each Pod must be in Running and Ready state before the next one is created. Shutdown happens in reverse (2 → 1 → 0). This ordered lifecycle lets databases elect a primary before replicas start.',
        },
        {
          id: 'p3-m2-q4',
          question:
            'How is volumeClaimTemplates different from a regular volumes entry in a StatefulSet?',
          options: [
            'There is no functional difference — both can be used interchangeably',
            'volumeClaimTemplates creates a separate PVC for each Pod replica; a regular volumes entry shares one PVC across all Pods',
            'volumeClaimTemplates only works with hostPath volumes',
            'A regular volumes entry supports more StorageClasses than volumeClaimTemplates',
          ],
          answer: 1,
          explanation:
            'volumeClaimTemplates acts as a PVC factory: it creates data-pod-0, data-pod-1, data-pod-2 — one unique PVC per Pod. A regular volumes.persistentVolumeClaim entry references one existing PVC that all Pods would share (which breaks isolation for databases).',
        },
      ],
      coverage: {
        concepts: [
          'StatefulSet ordinal pod identity (pod-0, pod-1)',
          'stable network identity via headless service',
          'per-pod storage via volumeClaimTemplates',
          'ordered pod creation: 0→1→2',
          'ordered deletion: 2→1→0',
          'PodManagementPolicy: OrderedReady vs Parallel',
        ],
        commands: [
          'kubectl get statefulsets',
          'kubectl describe statefulset',
          'kubectl scale statefulset',
          'kubectl get pods -l (ordinal names visible)',
          'kubectl get pvc (one per pod)',
          'kubectl delete pod <ss>-0',
        ],
        architecture: [
          'StatefulSet controller: ordinal → pod name → PVC name binding',
          'headless service (clusterIP: None) for per-pod DNS',
          'volumeClaimTemplate creates data-<ss>-<n> PVC per pod',
          'ordered scale-up/down ensures safe primary election',
        ],
        techniques: [
          'headless service for stable pod DNS',
          'volumeClaimTemplates for isolated per-pod storage',
          'ordered startup for database primary election',
          'manual PVC cleanup required after StatefulSet delete',
        ],
        procedures: [
          'create headless service',
          'create StatefulSet with volumeClaimTemplates',
          'verify per-pod DNS names',
          'scale StatefulSet up and down',
          'verify PVC per pod exists',
        ],
        toolsAndPlugins: ['kubectl', 'minikube'],
        cases: [
          'StatefulSet pod stuck Pending — volumeClaimTemplate PVC stuck',
          'pod-0 deleted — replacement gets same name and reattaches same PVC',
          'leftover PVCs after StatefulSet deleted — manual cleanup needed',
        ],
        scenarios: [
          '3-replica database with separate storage per replica',
          'verify stable DNS name pod-0.<headless-svc> survives pod restart',
        ],
      },
      exercises: [
        {
          id: 'p3-m2-e1',
          title: 'Official tutorial: StatefulSet Basics — ordered deploy, DNS, scale',
          kind: 'guided',
          goal: 'Follow the official StatefulSet Basics tutorial: create headless service + StatefulSet, watch ordered startup, verify stable DNS, scale up and down.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  ports:
  - port: 80
    name: web
  clusterIP: None
  selector:
    app: nginx
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
spec:
  serviceName: "nginx"
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: registry.k8s.io/nginx-slim:0.24
        ports:
        - containerPort: 80
          name: web
        volumeMounts:
        - name: www
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
  - metadata:
      name: www
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 1Gi
EOF`,
            'kubectl get pods --watch -l app=nginx',
            'kubectl get service nginx',
            'kubectl get statefulset web',
            'kubectl exec web-0 -- sh -c "hostname"',
            'kubectl exec web-1 -- sh -c "hostname"',
            'kubectl run -i --tty --image busybox:1.28 dns-test --restart=Never --rm -- nslookup web-0.nginx 2>/dev/null || echo "DNS lookup: web-0.nginx.<namespace>.svc.cluster.local"',
            'kubectl scale statefulset web --replicas=5',
            'kubectl get pods --watch -l app=nginx',
            'kubectl patch statefulset web -p \'{"spec":{"replicas":3}}\'',
            'kubectl get pods --watch -l app=nginx',
          ],
          verify: [
            'Pods created in order: web-0 then web-1 (watch confirms sequential)',
            'kubectl get statefulset web shows READY 2/2',
            'exec hostname returns web-0 and web-1 respectively',
            'scale to 5 creates web-2, web-3, web-4 in order',
            'scale down to 3 deletes web-4 then web-3 in reverse order',
          ],
          expectedOutcome:
            'Ordered creation/deletion and stable hostname identity confirmed following official tutorial.',
          cleanup: [
            'kubectl delete statefulset web',
            'kubectl delete service nginx',
            'kubectl delete pvc -l app=nginx --ignore-not-found',
          ],
          sourceRefs: [
            {
              title: 'Kubernetes: StatefulSet Basics',
              url: 'https://kubernetes.io/docs/tutorials/stateful-application/basic-stateful-set/',
              checkedAt: '2026-06',
              scope: 'tutorial',
            },
          ],
        },
        {
          id: 'p3-m2-e2',
          title: 'Verify pod identity survives restart',
          kind: 'challenge',
          goal: 'Delete pod-0 and confirm replacement uses same name, hostname, and PVC.',
          commands: [
            'kubectl delete pod web-ss-0',
            'kubectl get pods -l app=web-ss -w',
            'kubectl exec web-ss-0 -- hostname',
            'kubectl get pvc | grep data-web-ss-0',
          ],
          verify: [
            'Replacement pod gets exact name web-ss-0',
            'hostname still returns web-ss-0',
            'PVC data-web-ss-0 still Bound to same pod',
          ],
          expectedOutcome: 'Stable identity — name, DNS, and storage — survives pod restart.',
          cleanup: [],
        },
        {
          id: 'p3-m2-e3',
          title: 'Debug StatefulSet pod stuck in Pending',
          kind: 'debug',
          goal: 'Identify why a StatefulSet pod stays Pending due to PVC not binding.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: broken-ss
spec:
  serviceName: broken-ss
  replicas: 1
  selector:
    matchLabels:
      app: broken-ss
  template:
    metadata:
      labels:
        app: broken-ss
    spec:
      containers:
      - name: app
        image: nginx:1.27
        volumeMounts:
        - name: data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      storageClassName: nonexistent-sc
      resources:
        requests:
          storage: 10Mi
EOF`,
            'kubectl get pods -l app=broken-ss',
            'kubectl get pvc | grep broken-ss',
            'kubectl describe pvc data-broken-ss-0',
          ],
          verify: [
            'Pod stays Pending',
            'PVC data-broken-ss-0 stays Pending',
            'describe pvc shows StorageClass not found',
          ],
          expectedOutcome: 'Trace StatefulSet Pending to PVC Pending to StorageClass mismatch.',
          cleanup: [
            'kubectl delete statefulset broken-ss --ignore-not-found',
            'kubectl delete pvc data-broken-ss-0 --ignore-not-found',
          ],
        },
        {
          id: 'p3-m2-e4',
          title: '7-day spaced review — StatefulSet identity',
          kind: 'spaced-review',
          goal: 'Recall StatefulSet stable identity guarantees from memory.',
          commands: [
            'kubectl explain statefulset.spec.volumeClaimTemplates',
            'kubectl explain statefulset.spec.serviceName',
            'kubectl explain statefulset.spec.podManagementPolicy',
          ],
          verify: [
            'explain returns field descriptions',
            'Can state: ordinal name, per-pod PVC, headless service purpose',
          ],
          expectedOutcome: 'StatefulSet guarantees recalled accurately without notes.',
          cleanup: [],
        },
      ],
    },

    // ─── Module 3: DaemonSets ────────────────────────────────────────────────
    {
      id: 'p3-m3',
      slug: 'daemonsets',
      title: 'DaemonSets',
      description:
        'Run exactly one Pod on every node for cluster-wide infrastructure like log collectors and monitoring agents.',
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
          instruction:
            'Apply a DaemonSet using the Fluent Bit image — one Pod will be scheduled on every node.',
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
          explanation:
            'The DaemonSet spec looks similar to a Deployment but has no replicas field. The scheduler decides how many Pods to run based on the node count. For a 3-node cluster (node-1, node-2, controlplane), 3 Pods will be created.',
          clusterState: {
            pods: [
              {
                id: 'log-node1',
                name: 'log-collector-node1',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'log-collector' },
                image: 'fluent/fluent-bit:3.3',
                restarts: 0,
              },
              {
                id: 'log-node2',
                name: 'log-collector-node2',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'log-collector' },
                image: 'fluent/fluent-bit:3.3',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'DaemonSet log-collector created',
              'Pod scheduled on node-1',
              'Pod scheduled on node-2',
            ],
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
          explanation:
            "One Pod per node — exactly what a DaemonSet guarantees. Each Pod has a random suffix (4hxkp, 9mwqr, vt7nz) appended to the DaemonSet name, unlike StatefulSets which use ordinal numbers. The NODE column confirms the 1:1 mapping. Note: this sample illustrates a 3-node cluster — on your single-node minikube you'll see exactly one log-collector Pod, scheduled on the `minikube` node.",
          clusterState: {
            pods: [
              {
                id: 'log-4hxkp',
                name: 'log-collector-4hxkp',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'log-collector' },
                image: 'fluent/fluent-bit:3.3',
                restarts: 0,
              },
              {
                id: 'log-9mwqr',
                name: 'log-collector-9mwqr',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'log-collector' },
                image: 'fluent/fluent-bit:3.3',
                restarts: 0,
              },
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
          explanation:
            'DESIRED=3 because the cluster has 3 nodes. CURRENT and READY both equal 3, confirming all Pods are healthy. NODE SELECTOR is <none> meaning no nodeSelector is set — the DaemonSet targets every node. If you add a nodeSelector, only matching nodes show up in DESIRED.',
          clusterState: {
            pods: [
              {
                id: 'log-4hxkp',
                name: 'log-collector-4hxkp',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'log-collector' },
                image: 'fluent/fluent-bit:3.3',
                restarts: 0,
              },
              {
                id: 'log-9mwqr',
                name: 'log-collector-9mwqr',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'log-collector' },
                image: 'fluent/fluent-bit:3.3',
                restarts: 0,
              },
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
          instruction:
            'Use describe to inspect the update strategy and confirm no nodeSelector is set.',
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
          explanation:
            "Update Strategy: RollingUpdate with maxUnavailable: 1 means during an update, at most 1 node's Pod is unavailable at any time. Node-Selector: <none> means all nodes are targeted. To restrict to specific nodes, add a nodeSelector: with a label that matches only the desired nodes.",
          clusterState: {
            pods: [
              {
                id: 'log-4hxkp',
                name: 'log-collector-4hxkp',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'log-collector' },
                image: 'fluent/fluent-bit:3.3',
                restarts: 0,
              },
              {
                id: 'log-9mwqr',
                name: 'log-collector-9mwqr',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'log-collector' },
                image: 'fluent/fluent-bit:3.3',
                restarts: 0,
              },
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
          question:
            'You add a new node to the cluster. What does the DaemonSet controller do automatically?',
          options: [
            'Nothing — you must manually scale the DaemonSet',
            'It schedules one DaemonSet Pod on the new node automatically',
            'It asks you to confirm before scheduling on the new node',
            'It scales down an existing Pod on another node to rebalance',
          ],
          answer: 1,
          explanation:
            'The DaemonSet controller watches for new nodes and automatically schedules the DaemonSet Pod on them. No manual action is needed. This is a key operational advantage: your monitoring agent or log collector is running on every node the moment it joins the cluster.',
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
          explanation:
            'A Deployment schedules N replicas wherever the scheduler finds capacity. A DaemonSet schedules exactly 1 Pod per node — the replica count automatically matches the node count. They serve fundamentally different purposes: application scaling vs node-level infrastructure.',
        },
        {
          id: 'p3-m3-q3',
          question:
            'Which DaemonSet update strategy gives you the most control over when nodes are updated?',
          options: [
            'RollingUpdate — it lets you set exact per-node timing',
            'OnDelete — the new Pod version is only applied when you manually delete the old Pod',
            'Recreate — all Pods are deleted and recreated simultaneously',
            'BlueGreen — old and new versions run side-by-side until you switch',
          ],
          answer: 1,
          explanation:
            'OnDelete gives you complete control: the DaemonSet only runs the new Pod template when you manually delete the old Pod on that specific node. This is useful when you want to coordinate the update with a node maintenance window or other operational procedure.',
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
          explanation:
            "Log collectors (Fluentd, Filebeat) and node metrics exporters (Prometheus node-exporter) are the canonical DaemonSet use cases — they need to run on every node to collect data from that node's filesystem and hardware. Network plugins (Calico, Cilium) are another classic example.",
        },
      ],
      coverage: {
        concepts: [
          'DaemonSet: one pod per eligible node',
          'updateStrategy: RollingUpdate vs OnDelete',
          'tolerations for tainted/master nodes',
          'nodeSelector and nodeAffinity for targeting subsets',
          'DaemonSet vs Deployment for node-local workloads',
        ],
        commands: [
          'kubectl get daemonsets',
          'kubectl describe daemonset',
          'kubectl get pods -o wide (verify one per node)',
          'kubectl rollout status daemonset',
          'kubectl rollout history daemonset',
          'kubectl get ds -A',
        ],
        architecture: [
          'DaemonSet controller watches node list',
          'pod created automatically on new node',
          'pod removed automatically when node removed',
          'system DaemonSets use tolerations to bypass NoSchedule taints',
        ],
        techniques: [
          'nodeSelector to target subset of nodes',
          'toleration to schedule on master/control-plane nodes',
          'OnDelete strategy for controlled per-node rollout',
          'hostPath volume for node-local log access',
        ],
        procedures: [
          'create DaemonSet',
          'verify one pod per node with -o wide',
          'update DaemonSet image',
          'watch rolling update status',
        ],
        toolsAndPlugins: ['kubectl', 'minikube'],
        cases: [
          'DaemonSet pod not on control-plane node — needs toleration',
          'new node added — DaemonSet pod automatically scheduled',
          'OnDelete: new template not applied until you manually delete the old pod',
        ],
        scenarios: [
          'deploy a log agent to all nodes',
          'update log agent version with OnDelete for safe per-node rollout',
        ],
      },
      exercises: [
        {
          id: 'p3-m3-e1',
          title: 'Create a DaemonSet and verify one pod per node',
          kind: 'guided',
          goal: 'Deploy a DaemonSet and confirm it runs exactly one pod per node.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-agent
spec:
  selector:
    matchLabels:
      app: log-agent
  template:
    metadata:
      labels:
        app: log-agent
    spec:
      containers:
      - name: agent
        image: busybox:1.36
        command: ["sh", "-c", "while true; do echo $(hostname) $(date); sleep 10; done"]
EOF`,
            'kubectl get daemonsets log-agent',
            'kubectl get pods -l app=log-agent -o wide',
            'kubectl logs -l app=log-agent',
          ],
          verify: [
            'DESIRED and CURRENT counts match node count',
            'Each pod on a different node (NODE column)',
            'logs show hostname output',
          ],
          expectedOutcome: 'DaemonSet running one pod per node confirmed.',
          cleanup: ['kubectl delete daemonset log-agent'],
        },
        {
          id: 'p3-m3-e2',
          title: 'Update DaemonSet image with RollingUpdate',
          kind: 'challenge',
          goal: 'Update the DaemonSet container image and watch the rolling update complete.',
          commands: [
            `cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-agent-v2
spec:
  updateStrategy:
    type: RollingUpdate
  selector:
    matchLabels:
      app: log-agent-v2
  template:
    metadata:
      labels:
        app: log-agent-v2
    spec:
      containers:
      - name: agent
        image: busybox:1.35
        command: ["sh", "-c", "while true; do echo v1; sleep 10; done"]
EOF`,
            'kubectl set image daemonset/log-agent-v2 agent=busybox:1.36',
            'kubectl rollout status daemonset/log-agent-v2',
            'kubectl rollout history daemonset/log-agent-v2',
          ],
          verify: [
            'rollout status shows successfully rolled out',
            'rollout history shows revision 2',
          ],
          expectedOutcome: 'DaemonSet image updated via rolling update across all nodes.',
          cleanup: ['kubectl delete daemonset log-agent-v2'],
        },
        {
          id: 'p3-m3-e3',
          title: 'Inspect system DaemonSets in kube-system',
          kind: 'debug',
          goal: 'Identify which kube-system DaemonSets exist and what tolerations they use to run on control-plane nodes.',
          commands: [
            'kubectl get daemonsets -n kube-system',
            'kubectl describe daemonset kube-proxy -n kube-system | grep -A10 Tolerations',
            'kubectl get pods -n kube-system -o wide | grep kube-proxy',
          ],
          verify: [
            'kube-proxy DaemonSet visible in kube-system',
            'Tolerations include node-role.kubernetes.io/control-plane or similar',
            'kube-proxy pod running on the minikube node',
          ],
          expectedOutcome:
            'Understand how system DaemonSets use tolerations to run on all nodes including control-plane.',
          cleanup: [],
        },
        {
          id: 'p3-m3-e4',
          title: '3-day spaced review — DaemonSet commands',
          kind: 'spaced-review',
          goal: 'Recall DaemonSet management commands from memory.',
          commands: [
            'kubectl get daemonsets -A',
            'kubectl get pods -A -o wide | grep -i daemon',
            'kubectl explain daemonset.spec.updateStrategy',
          ],
          verify: [
            'System DaemonSets visible in kube-system',
            'updateStrategy types listed in explain output',
          ],
          expectedOutcome: 'DaemonSet commands recalled without notes.',
          cleanup: [],
        },
      ],
    },

    // ─── Module 4: Ingress ───────────────────────────────────────────────────
    {
      id: 'p3-m4',
      slug: 'ingress',
      title: 'Ingress',
      description:
        'Route external HTTP/HTTPS traffic to multiple services with a single entry point and path-based rules.',
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
          command:
            'kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.0/deploy/static/provider/kind/deploy.yaml',
          output: [
            'namespace/ingress-nginx created',
            'serviceaccount/ingress-nginx created',
            'configmap/ingress-nginx-controller created',
            'deployment.apps/ingress-nginx-controller created',
            'service/ingress-nginx-controller created',
          ],
          explanation:
            'The IngressController is a Deployment (not a CRD or built-in controller) that runs in the ingress-nginx namespace. It watches for Ingress resources cluster-wide and configures an nginx process to route traffic accordingly. Without this, Ingress resources are just inert config objects.',
          clusterState: {
            pods: [
              {
                id: 'ingress-ctrl',
                name: 'ingress-nginx-controller-7d4bc',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { 'app.kubernetes.io/name': 'ingress-nginx' },
                image: 'registry.k8s.io/ingress-nginx/controller:v1.12.0',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'ingress-svc',
                name: 'ingress-nginx-controller',
                namespace: 'default',
                type: 'NodePort',
                selector: { 'app.kubernetes.io/name': 'ingress-nginx' },
                port: 80,
                clusterIP: '10.96.1.100',
              },
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
          instruction:
            'Create two Deployments and expose them as ClusterIP services — the Ingress will route to both.',
          command:
            'kubectl create deployment web --image=nginx:1.27 && kubectl expose deployment web --port=80 && kubectl create deployment api --image=hashicorp/http-echo:latest --port=5678 && kubectl expose deployment api --port=80 --target-port=5678',
          output: [
            'deployment.apps/web created',
            'service/web created',
            'deployment.apps/api created',
            'service/api created',
          ],
          explanation:
            'Both services are ClusterIP — they are not directly accessible from outside the cluster. The Ingress will be the single external entry point that routes /api to the api service and / to the web service. This is the N:1 pattern that makes Ingress cost-effective.',
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
                id: 'api-def34',
                name: 'api-def34',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'api' },
                image: 'hashicorp/http-echo:latest',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'web-svc',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: '10.96.10.10',
              },
              {
                id: 'api-svc',
                name: 'api',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'api' },
                port: 80,
                clusterIP: '10.96.10.11',
              },
            ],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'nginx:1.27',
              },
              {
                id: 'api-deploy',
                name: 'api',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'hashicorp/http-echo:latest',
              },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: [
              'Deployment web created',
              'Service web exposed on port 80',
              'Deployment api created',
              'Service api exposed on port 80',
            ],
          },
        },
        {
          id: 'p3-m4-s3',
          title: 'Create the Ingress routing rules',
          instruction:
            'Apply an Ingress that routes / to the web service and /api to the api service, both for host myapp.local.',
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
          explanation:
            'The Ingress resource is just configuration — the IngressController reads it and reconfigures nginx. ingressClassName: nginx tells Kubernetes which controller should own this Ingress. The rewrite-target annotation strips the /api prefix before forwarding to the api service.',
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
                id: 'api-def34',
                name: 'api-def34',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'api' },
                image: 'hashicorp/http-echo:latest',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'web-svc',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: '10.96.10.10',
              },
              {
                id: 'api-svc',
                name: 'api',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'api' },
                port: 80,
                clusterIP: '10.96.10.11',
              },
              {
                id: 'ingress-ctrl-svc',
                name: 'ingress-nginx-controller',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { 'app.kubernetes.io/name': 'ingress-nginx' },
                port: 80,
                clusterIP: '10.96.1.100',
              },
            ],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'nginx:1.27',
              },
              {
                id: 'api-deploy',
                name: 'api',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'hashicorp/http-echo:latest',
              },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: ['Ingress rule: / → web:80', 'Ingress rule: /api → api:80'],
          },
        },
        {
          id: 'p3-m4-s4',
          title: 'Verify the Ingress ADDRESS is populated',
          instruction:
            "List Ingress resources — the ADDRESS column should show the IngressController's IP once it is ready.",
          command: 'kubectl get ingress',
          output: [
            'NAME    CLASS   HOSTS         ADDRESS        PORTS   AGE',
            'myapp   nginx   myapp.local   192.168.49.2   80      45s',
          ],
          explanation:
            "The ADDRESS column shows the IP of the IngressController's LoadBalancer or NodePort service. If ADDRESS is empty, the IngressController is not yet ready or no external IP has been assigned. In a kind cluster, the address is the Docker container IP of the control plane node.",
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
                id: 'api-def34',
                name: 'api-def34',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'api' },
                image: 'hashicorp/http-echo:latest',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'web-svc',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: '10.96.10.10',
              },
              {
                id: 'api-svc',
                name: 'api',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'api' },
                port: 80,
                clusterIP: '10.96.10.11',
              },
              {
                id: 'ingress-ctrl-svc',
                name: 'ingress-nginx-controller',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { 'app.kubernetes.io/name': 'ingress-nginx' },
                port: 80,
                clusterIP: '10.96.1.100',
              },
            ],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'nginx:1.27',
              },
              {
                id: 'api-deploy',
                name: 'api',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'hashicorp/http-echo:latest',
              },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: [
              'Ingress myapp: ADDRESS=192.168.49.2',
              'Ingress rule: / → web:80',
              'Ingress rule: /api → api:80',
            ],
          },
          tip: 'Test the routing locally by adding "192.168.49.2 myapp.local" to /etc/hosts, then: curl http://myapp.local and curl http://myapp.local/api',
        },
        {
          id: 'p3-m4-s5',
          title: 'Inspect the routing rules',
          instruction:
            'Use describe to see the full routing table the IngressController is applying.',
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
          explanation:
            'The Rules table confirms the routing: requests to myapp.local/ go to the web Service (which resolves to Pod IP 10.244.0.12), and requests to myapp.local/api go to the api Service. The annotation rewrite-target: / is also shown here.',
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
                id: 'api-def34',
                name: 'api-def34',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'api' },
                image: 'hashicorp/http-echo:latest',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'web-svc',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: '10.96.10.10',
              },
              {
                id: 'api-svc',
                name: 'api',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'api' },
                port: 80,
                clusterIP: '10.96.10.11',
              },
              {
                id: 'ingress-ctrl-svc',
                name: 'ingress-nginx-controller',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { 'app.kubernetes.io/name': 'ingress-nginx' },
                port: 80,
                clusterIP: '10.96.1.100',
              },
            ],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'nginx:1.27',
              },
              {
                id: 'api-deploy',
                name: 'api',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'hashicorp/http-echo:latest',
              },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: ['Ingress rule: / → web:80', 'Ingress rule: /api → api:80'],
          },
        },
        {
          id: 'p3-m4-s6',
          title: 'Add TLS to the Ingress',
          instruction:
            'Create a TLS Secret and update the Ingress spec to terminate HTTPS at the IngressController.',
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
          explanation:
            'The spec.tls section references the Secret containing the certificate and private key. The IngressController reads the Secret, configures an HTTPS listener, and terminates TLS before forwarding plain HTTP to the backend Services. Backend Services never see TLS — they always receive plain HTTP. This is called TLS termination.',
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
                id: 'api-def34',
                name: 'api-def34',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'api' },
                image: 'hashicorp/http-echo:latest',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'web-svc',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: '10.96.10.10',
              },
              {
                id: 'api-svc',
                name: 'api',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'api' },
                port: 80,
                clusterIP: '10.96.10.11',
              },
              {
                id: 'ingress-ctrl-svc',
                name: 'ingress-nginx-controller',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { 'app.kubernetes.io/name': 'ingress-nginx' },
                port: 80,
                clusterIP: '10.96.1.100',
              },
            ],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'nginx:1.27',
              },
              {
                id: 'api-deploy',
                name: 'api',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'hashicorp/http-echo:latest',
              },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: [
              'Secret myapp-tls created',
              'Ingress myapp: TLS enabled for myapp.local',
              'Ingress rule: / → web:80',
              'Ingress rule: /api → api:80',
            ],
          },
          tip: "For production, use cert-manager (cert-manager.io) to automatically provision and renew Let's Encrypt certificates instead of managing certs manually.",
        },
      ],
      quiz: [
        {
          id: 'p3-m4-q1',
          question:
            'You create an Ingress resource but traffic is not being routed. What is the most likely missing component?',
          options: [
            'A NetworkPolicy is blocking traffic to the Ingress',
            'An IngressController — the Ingress resource is just config and does nothing without a running controller',
            'The Services must be type LoadBalancer for Ingress to work',
            'The Ingress needs a ClusterRoleBinding to read Service endpoints',
          ],
          answer: 1,
          explanation:
            'An Ingress resource without an IngressController is inert configuration. The IngressController (nginx, Traefik, etc.) is a separately installed component that watches Ingress resources and actually routes traffic. Creating the Ingress resource alone changes nothing until a controller is running and watching for it.',
        },
        {
          id: 'p3-m4-q2',
          question:
            'What is the advantage of Ingress over creating a LoadBalancer Service for each app?',
          options: [
            'Ingress is faster because it bypasses kube-proxy',
            'Ingress uses one cloud load balancer for all Services instead of one per Service, which is more cost-effective',
            'Ingress supports UDP traffic while LoadBalancer Services only support TCP',
            'Ingress automatically scales backends while LoadBalancer Services do not',
          ],
          answer: 1,
          explanation:
            'Each LoadBalancer Service creates a new cloud load balancer, which costs money and adds operational overhead. Ingress funnels all external traffic through a single IngressController (one load balancer), then routes to many backend Services based on host and path rules. This is the N:1 pattern.',
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
          explanation:
            'Prefix matching splits the URL on "/" boundaries. /api (Prefix) matches /api and /api/users (because /api is a path prefix of /api/users) but does NOT match /api-v2 (because "api-v2" is a different path segment from "api"). Use Exact if you want to match only /api with nothing after it.',
        },
        {
          id: 'p3-m4-q4',
          question:
            'Where do you configure controller-specific behaviors like URL rewriting or rate limiting?',
          options: [
            'In the Ingress spec.rules section',
            'In a separate IngressConfig CRD',
            'In annotations on the Ingress resource',
            'In a ConfigMap in the kube-system namespace',
          ],
          answer: 2,
          explanation:
            'Controller-specific behaviour (rewrite-target, rate limiting, auth, timeouts) is configured via annotations on the Ingress resource. The annotations are prefixed with the controller name, e.g., nginx.ingress.kubernetes.io/rewrite-target. Kubernetes itself ignores annotations — only the IngressController reads them.',
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
          explanation:
            'TLS termination at the Ingress means the IngressController handles the HTTPS connection from the client, decrypts it, and forwards plain HTTP to the backend Services. Backend Services do not need TLS certificates or HTTPS configuration. This simplifies backend development and centralises certificate management.',
        },
      ],
      coverage: {
        concepts: [
          'Ingress resource vs IngressController',
          'path-based routing rules',
          'host-based virtual hosting',
          'TLS termination at IngressController',
          'pathType: Prefix/Exact/ImplementationSpecific',
          'IngressClass',
          'controller-specific annotations',
        ],
        commands: [
          'minikube addons enable ingress',
          'kubectl get ingress',
          'kubectl describe ingress',
          'kubectl get ingressclass',
          'curl -H "Host: myapp.local" http://$(minikube ip)',
          'kubectl apply -f ingress.yaml',
        ],
        architecture: [
          'IngressController as reverse proxy (nginx/traefik)',
          'Ingress resource as declarative routing config',
          'TLS termination: HTTPS→HTTP to backend',
          'IngressController reads Service endpoints directly or via ClusterIP',
        ],
        techniques: [
          'path-based routing to multiple services',
          'host-based virtual hosting with multiple rules',
          'TLS Secret of type kubernetes.io/tls',
          'rewrite-target annotation for path stripping',
          'minikube ingress addon setup',
        ],
        procedures: [
          'enable ingress addon in minikube',
          'create Ingress with path rules',
          'test routing with curl and Host header',
          'add TLS to existing Ingress',
        ],
        toolsAndPlugins: ['kubectl', 'minikube', 'nginx IngressController'],
        cases: [
          'Ingress ADDRESS stays empty — controller pod not running',
          'path not routing — pathType mismatch (Prefix vs Exact)',
          'TLS not working — Secret missing tls.crt or tls.key',
        ],
        scenarios: [
          'route /api and /web to different backend services on same host',
          'add HTTPS termination to an existing HTTP Ingress',
        ],
      },
      exercises: [
        {
          id: 'p3-m4-e1',
          title: 'Deploy two services and route via Ingress',
          kind: 'guided',
          goal: 'Route /web and /api paths to two different backend services using a single Ingress.',
          commands: [
            'minikube addons enable ingress',
            'kubectl create deployment web --image=nginx:1.27',
            'kubectl expose deployment web --port=80',
            'kubectl create deployment api --image=nginx:1.26',
            'kubectl expose deployment api --port=80',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: myapp.local
    http:
      paths:
      - path: /web
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
              number: 80
EOF`,
            'kubectl get ingress app-ingress',
            'curl -H "Host: myapp.local" http://$(minikube ip)/web',
          ],
          verify: [
            'Ingress shows ADDRESS populated',
            'curl /web returns nginx response',
            'kubectl describe ingress shows both path rules',
          ],
          expectedOutcome: 'Path-based routing working via nginx IngressController.',
          cleanup: [
            'kubectl delete ingress app-ingress',
            'kubectl delete service web api',
            'kubectl delete deployment web api',
          ],
        },
        {
          id: 'p3-m4-e2',
          title: 'Add TLS to an Ingress',
          kind: 'challenge',
          goal: 'Generate a self-signed TLS Secret and attach it to the Ingress.',
          commands: [
            'openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /tmp/tls.key -out /tmp/tls.crt -subj "/CN=myapp.local"',
            'kubectl create secret tls myapp-tls --cert=/tmp/tls.crt --key=/tmp/tls.key',
            `kubectl patch ingress app-ingress --type=json -p='[{"op":"add","path":"/spec/tls","value":[{"hosts":["myapp.local"],"secretName":"myapp-tls"}]}]'`,
            'kubectl describe ingress app-ingress | grep -A5 TLS',
          ],
          verify: [
            'TLS section visible in describe ingress',
            'Secret myapp-tls created with tls.crt and tls.key',
          ],
          expectedOutcome: 'TLS termination configured on Ingress with self-signed cert.',
          cleanup: [
            'kubectl delete ingress app-ingress --ignore-not-found',
            'kubectl delete secret myapp-tls --ignore-not-found',
            'kubectl delete service web api --ignore-not-found',
            'kubectl delete deployment web api --ignore-not-found',
          ],
        },
        {
          id: 'p3-m4-e3',
          title: 'Diagnose Ingress ADDRESS not populating',
          kind: 'debug',
          goal: 'Identify why an Ingress ADDRESS field is empty and trace the cause.',
          commands: [
            'kubectl get ingress',
            'kubectl describe ingress',
            'kubectl get pods -n ingress-nginx',
            'kubectl get pods -n kube-system | grep ingress',
          ],
          verify: [
            'Ingress shows no ADDRESS when controller is not running',
            'kubectl get pods in ingress-nginx namespace shows controller pod status',
          ],
          expectedOutcome: 'Empty Ingress ADDRESS traced to IngressController pod state.',
          cleanup: [],
        },
        {
          id: 'p3-m4-e4',
          title: '7-day spaced review — Ingress routing',
          kind: 'spaced-review',
          goal: 'Recall Ingress resource structure and controller relationship from memory.',
          commands: [
            'kubectl get ingressclass',
            'kubectl explain ingress.spec.rules',
            'kubectl explain ingress.spec.tls',
          ],
          verify: [
            'IngressClass shows nginx controller',
            'explain output shows rules and tls structure',
          ],
          expectedOutcome: 'Ingress structure and routing concepts recalled without notes.',
          cleanup: [],
        },
      ],
    },

    // ─── Module 5: NetworkPolicies ───────────────────────────────────────────
    {
      id: 'p3-m5',
      slug: 'network-policies',
      title: 'NetworkPolicies',
      description:
        'Implement namespace-level firewall rules to control which Pods can communicate with each other.',
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
          instruction:
            'Create frontend and backend pods and confirm they can reach each other — the default flat network.',
          command:
            'kubectl run frontend --image=nginx:1.27 --labels=app=frontend && kubectl run backend --image=nginx:1.27 --labels=app=backend && kubectl exec frontend -- wget -qO- http://backend',
          output: [
            'pod/frontend created',
            'pod/backend created',
            '<!DOCTYPE html>',
            '<html>',
            '<head><title>Welcome to nginx!</title></head>',
            '...',
          ],
          explanation:
            'By default, any Pod can reach any other Pod. The wget succeeded because there are no NetworkPolicies in this namespace — all traffic is allowed. This is convenient in development but a security risk in production.',
          clusterState: {
            pods: [
              {
                id: 'frontend-xyz',
                name: 'frontend',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'frontend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'backend-abc',
                name: 'backend',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
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
          instruction:
            'Apply a NetworkPolicy that denies ALL ingress traffic to every Pod in the default namespace.',
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
          explanation:
            'podSelector: {} (empty) selects ALL pods in the namespace. policyTypes: [Ingress] with no ingress rules means: deny all ingress traffic to every Pod. This is the starting point for a secure namespace — now you add explicit allow rules for only the traffic you need.',
          clusterState: {
            pods: [
              {
                id: 'frontend-xyz',
                name: 'frontend',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'frontend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'backend-abc',
                name: 'backend',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'NetworkPolicy default-deny-ingress applied',
              'All ingress traffic BLOCKED for all pods in default',
            ],
            highlightedComponent: 'kubelet',
          },
        },
        {
          id: 'p3-m5-s3',
          title: 'Confirm traffic is blocked',
          instruction: 'Try to reach backend from frontend — the connection should time out.',
          command: 'kubectl exec frontend -- wget -qO- http://backend --timeout=5',
          output: ['wget: download timed out'],
          explanation:
            'The default-deny policy is working. frontend can no longer reach backend because all ingress to backend is denied. The connection times out (not refused) because the CNI plugin silently drops the packets rather than sending a TCP RST.',
          clusterState: {
            pods: [
              {
                id: 'frontend-xyz',
                name: 'frontend',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'frontend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'backend-abc',
                name: 'backend',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
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
          instruction:
            'Apply a NetworkPolicy that allows only frontend pods to send ingress traffic to backend pods.',
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
          explanation:
            'This policy selects Pods with app=backend and allows ingress from Pods with app=frontend. The default-deny policy still applies to all other pods — only this specific frontend→backend flow is now permitted. All other pods in the namespace are still blocked from reaching backend.',
          clusterState: {
            pods: [
              {
                id: 'frontend-xyz',
                name: 'frontend',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'frontend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'backend-abc',
                name: 'backend',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'NetworkPolicy allow-frontend-to-backend applied',
              'frontend → backend: ALLOWED',
              'all others → backend: BLOCKED',
            ],
          },
        },
        {
          id: 'p3-m5-s5',
          title: 'Verify allow and block simultaneously',
          instruction:
            'Confirm frontend can reach backend, and that a third "attacker" pod still cannot.',
          command:
            'kubectl exec frontend -- wget -qO- http://backend && kubectl run attacker --image=nginx:1.27 --labels=app=attacker --restart=Never && kubectl exec attacker -- wget -qO- http://backend --timeout=5',
          output: [
            '<!DOCTYPE html>',
            '<html><head><title>Welcome to nginx!</title></head>',
            '...',
            'pod/attacker created',
            'wget: download timed out',
          ],
          explanation:
            'frontend succeeds because it matches the allow policy (app=frontend). attacker times out because it has app=attacker — it does not match the allow rule, so the default-deny policy blocks it. This is the allowlist model in action: only explicitly permitted traffic is allowed.',
          clusterState: {
            pods: [
              {
                id: 'frontend-xyz',
                name: 'frontend',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'frontend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'backend-abc',
                name: 'backend',
                namespace: 'default',
                node: 'node-2',
                status: 'Running',
                labels: { app: 'backend' },
                image: 'nginx:1.27',
                restarts: 0,
              },
              {
                id: 'attacker-zzz',
                name: 'attacker',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'attacker' },
                image: 'nginx:1.27',
                restarts: 0,
              },
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
          explanation:
            'Kubernetes uses a flat network model by default: every Pod can reach every other Pod regardless of namespace. NetworkPolicies must be explicitly applied to restrict this. This is why applying a default-deny policy is a security best practice in production namespaces.',
        },
        {
          id: 'p3-m5-q2',
          question:
            'You apply a NetworkPolicy with podSelector: {} and no ingress rules. What is the effect?',
          options: [
            'No effect — an empty policy is ignored',
            'All pods in the namespace have all ingress traffic denied',
            'All pods in the cluster have all ingress traffic denied',
            'Only pods without labels have ingress traffic denied',
          ],
          answer: 1,
          explanation:
            'podSelector: {} selects ALL pods in the namespace (the empty selector is a wildcard). Including Ingress in policyTypes with no ingress rules means: apply an ingress firewall to all pods, allowing nothing. This is the default-deny pattern — the foundation of secure namespace isolation.',
        },
        {
          id: 'p3-m5-q3',
          question:
            'A NetworkPolicy uses namespaceSelector. What must be true about the target namespace for this to work?',
          options: [
            'The namespace name must exactly match the selector value',
            'The namespace must have a label that matches the namespaceSelector',
            'The namespace must be in the same region as the source namespace',
            'The namespace must have a NetworkPolicy of its own',
          ],
          answer: 1,
          explanation:
            'namespaceSelector matches on namespace labels, not names. The target namespace must have the label you are selecting. For example, if your policy uses namespaceSelector: {matchLabels: {env: monitoring}}, you must first run: kubectl label namespace monitoring env=monitoring.',
        },
        {
          id: 'p3-m5-q4',
          question:
            'Your cluster uses kindnet as the CNI. You apply NetworkPolicies. Are they enforced?',
          options: [
            'Yes — all CNI plugins enforce NetworkPolicies',
            'No — kindnet does not support NetworkPolicy enforcement; you need Calico, Cilium, or another compatible CNI',
            'Only Egress policies are enforced; Ingress policies require a different CNI',
            'Yes, but only within the same namespace',
          ],
          answer: 1,
          explanation:
            'kindnet (the default CNI for kind clusters) does not enforce NetworkPolicies. The resources are accepted by the Kubernetes API but have no effect on actual traffic. To enforce NetworkPolicies in a kind cluster, you must install Calico or Cilium as the CNI plugin instead of kindnet.',
        },
      ],
      coverage: {
        concepts: [
          'NetworkPolicy as namespace-scoped firewall',
          'default allow-all behavior with no policies',
          'ingress rules: who can send TO selected pods',
          'egress rules: where selected pods can send TO',
          'podSelector, namespaceSelector, ipBlock',
          'default deny-all ingress pattern',
          'CNI plugin requirement for enforcement',
        ],
        commands: [
          'kubectl apply -f netpol.yaml',
          'kubectl get networkpolicies',
          'kubectl describe networkpolicy',
          'kubectl exec -- wget -T2 http://<svc> (test connectivity)',
          'kubectl run test-pod --image=busybox --restart=Never -- sleep 3600',
        ],
        architecture: [
          'NetworkPolicy enforced by CNI plugin (Calico/Cilium/Weave)',
          'policy selects pods via podSelector',
          'allow rules are additive — no explicit deny needed',
          'missing CNI support = policies accepted by API but not enforced',
        ],
        techniques: [
          'default deny-all ingress with empty podSelector',
          'allow only specific namespace traffic with namespaceSelector',
          'allow only specific pod with podSelector in from/to',
          'allow external CIDR with ipBlock',
          'test connectivity before and after applying policy',
        ],
        procedures: [
          'apply default deny-all ingress policy',
          'apply allow policy for specific source',
          'verify allowed traffic passes',
          'verify blocked traffic fails',
          'label namespace for namespaceSelector',
        ],
        toolsAndPlugins: ['kubectl', 'minikube with calico addon or cilium CNI'],
        cases: [
          'default minikube CNI does not enforce NetworkPolicy — policies have no effect',
          'namespaceSelector requires namespace label — bare name not used',
          'egress policy blocking DNS port 53 breaks service discovery',
        ],
        scenarios: [
          'isolate a namespace — deny all ingress, then selectively allow frontend → backend',
          'debug why pod cannot reach a service after NetworkPolicy applied',
        ],
      },
      exercises: [
        {
          id: 'p3-m5-e1',
          title: 'Apply default-deny and verify isolation',
          kind: 'guided',
          goal: 'Apply a default-deny-all-ingress policy and confirm traffic is blocked, then allow specific traffic.',
          commands: [
            'kubectl create namespace netpol-test',
            'kubectl run backend --image=nginx:1.27 -n netpol-test --labels=app=backend',
            'kubectl expose pod backend --port=80 -n netpol-test',
            'kubectl run client --image=busybox:1.36 -n netpol-test --restart=Never -- sleep 3600',
            'kubectl exec client -n netpol-test -- wget -T2 -O- http://backend',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: netpol-test
spec:
  podSelector: {}
  policyTypes:
  - Ingress
EOF`,
            'kubectl exec client -n netpol-test -- wget -T2 -O- http://backend',
          ],
          verify: [
            'Before policy: wget returns nginx page',
            'After deny-all: wget times out with connection refused or timeout',
          ],
          expectedOutcome: 'Default-deny ingress blocks all traffic to backend pod.',
          cleanup: ['kubectl delete namespace netpol-test'],
        },
        {
          id: 'p3-m5-e2',
          title: 'Allow only frontend pod to reach backend',
          kind: 'challenge',
          goal: 'Write a NetworkPolicy that allows only pods with label role=frontend to reach backend pods.',
          commands: [
            'kubectl create namespace isolation-test',
            'kubectl run backend --image=nginx:1.27 -n isolation-test --labels=app=backend',
            'kubectl expose pod backend --port=80 -n isolation-test',
            'kubectl run frontend --image=busybox:1.36 -n isolation-test --labels=role=frontend --restart=Never -- sleep 3600',
            'kubectl run other --image=busybox:1.36 -n isolation-test --labels=role=other --restart=Never -- sleep 3600',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
  namespace: isolation-test
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
          role: frontend
EOF`,
            'kubectl exec frontend -n isolation-test -- wget -T2 -O- http://backend',
            'kubectl exec other -n isolation-test -- wget -T2 -O- http://backend',
          ],
          verify: [
            'frontend pod reaches backend successfully',
            'other pod times out — blocked by NetworkPolicy',
          ],
          expectedOutcome: 'Selective ingress allow — only matching pod label passes.',
          cleanup: ['kubectl delete namespace isolation-test'],
        },
        {
          id: 'p3-m5-e3',
          title: 'Diagnose unexpected traffic block after NetworkPolicy',
          kind: 'debug',
          goal: 'Debug why a pod cannot reach a service after a NetworkPolicy was applied, and fix it.',
          commands: [
            'kubectl create namespace debug-netpol',
            'kubectl run app --image=nginx:1.27 -n debug-netpol --labels=app=app',
            'kubectl expose pod app --port=80 -n debug-netpol',
            `cat <<'EOF' | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: block-all
  namespace: debug-netpol
spec:
  podSelector:
    matchLabels:
      app: app
  policyTypes:
  - Ingress
EOF`,
            'kubectl run checker --image=busybox:1.36 -n debug-netpol --restart=Never -- sleep 3600',
            'kubectl exec checker -n debug-netpol -- wget -T2 http://app',
            'kubectl get networkpolicies -n debug-netpol',
            'kubectl describe networkpolicy block-all -n debug-netpol',
          ],
          verify: [
            'wget fails after policy applied',
            'describe shows empty ingress rules (deny-all effect)',
            'kubectl get networkpolicies shows the policy',
          ],
          expectedOutcome:
            'Block-all policy identified as cause; describe shows no ingress allow rules.',
          cleanup: ['kubectl delete namespace debug-netpol'],
        },
        {
          id: 'p3-m5-e4',
          title: '7-day spaced review — NetworkPolicy structure',
          kind: 'spaced-review',
          goal: 'Recall NetworkPolicy fields and enforcement requirements from memory.',
          commands: [
            'kubectl explain networkpolicy.spec.ingress',
            'kubectl explain networkpolicy.spec.egress',
            'kubectl explain networkpolicy.spec.podSelector',
          ],
          verify: [
            'explain returns from/to/ports fields',
            'Can state: CNI plugin required, default allow-all without policies',
          ],
          expectedOutcome:
            'NetworkPolicy structure and CNI enforcement requirement recalled without notes.',
          cleanup: [],
        },
      ],
    },
    {
      id: 'p3-m6',
      slug: 'persistent-volumes',
      title: 'PersistentVolumes — Storage Lifecycle',
      description:
        'Decouple storage from pods: PersistentVolumes, PersistentVolumeClaims, and StorageClasses for dynamic provisioning.',
      duration: '60 min',
      difficulty: 'intermediate' as const,
      masteryChecks: [
        'Explain the PV → PVC → Pod binding lifecycle',
        'Create a PersistentVolume and bind a PVC to it',
        'Mount a PVC in a pod and verify data persists across pod restarts',
        'Describe the three access modes: RWO, ROX, RWX',
        'Describe the three reclaim policies: Retain, Delete, Recycle',
        'Use a StorageClass for dynamic provisioning on minikube',
      ],
      theory: `> 🧠 **Brain Warm-Up**: A pod crashes and is rescheduled to a different node. An emptyDir volume is gone. A hostPath volume might have data on the wrong node. What storage abstraction would let the pod resume with the same data regardless of which node it lands on?

## The Storage Abstraction Stack

\`\`\`
Pod
 └── Volume (PVC reference)
      └── PersistentVolumeClaim (namespace-scoped request)
           └── PersistentVolume (cluster-scoped actual storage)
                └── Storage backend (NFS, cloud disk, hostPath...)
\`\`\`

**PV**: Cluster-scoped storage resource. Provisioned by an admin or dynamically.
**PVC**: Namespace-scoped claim by a workload. Specifies size, access mode, StorageClass.
**StorageClass**: Defines a provisioner. Enables dynamic PV creation on demand.

## Binding

PVC binding is automatic when a PV matches:
1. PVC requested size ≤ PV capacity
2. Access modes overlap
3. StorageClass matches (or both empty)

Once bound, the PVC and PV are exclusive to each other.

## Access Modes

| Mode | Short | Meaning |
|------|-------|---------|
| ReadWriteOnce | RWO | One node, read+write |
| ReadOnlyMany | ROX | Many nodes, read-only |
| ReadWriteMany | RWX | Many nodes, read+write |

Most cloud block devices only support RWO. NFS supports RWX.

## Reclaim Policies

| Policy | After PVC deleted |
|--------|-----------------|
| **Retain** | PV stays, data kept, must manually reclaim |
| **Delete** | PV and backing storage deleted |
| **Recycle** | Deprecated — rm -rf then reuse |

## Dynamic Provisioning with StorageClass

Instead of pre-creating PVs, a StorageClass provisions them on demand:

\`\`\`
PVC created → StorageClass provisioner creates PV → PVC binds to PV
\`\`\`

minikube has a default StorageClass (standard) backed by hostPath.`,
      labSteps: [
        {
          id: 'p3-m6-s1',
          title: 'List available StorageClasses',
          instruction: 'See what StorageClasses minikube provides.',
          command: 'kubectl get storageclasses',
          output: [
            'NAME                 PROVISIONER                RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE',
            'standard (default)   k8s.io/minikube-hostpath   Delete          Immediate           false                  45m',
          ],
          explanation:
            'The "standard" StorageClass is marked (default). Any PVC without a storageClassName gets this class. RECLAIMPOLICY=Delete means the PV is deleted when the PVC is deleted.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p3-m6-s2',
          title: 'Create a PVC using dynamic provisioning',
          instruction: 'Request 1Gi of storage — the StorageClass creates the PV automatically.',
          yamlContent: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi`,
          output: [],
          explanation:
            'No storageClassName specified → uses the default (standard). The provisioner creates a PV and binds it immediately.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['my-pvc created, bound to pvc-abc12'],
          },
        },
        {
          id: 'p3-m6-s3',
          title: 'Verify PVC is Bound',
          instruction: 'Check PVC status.',
          command: 'kubectl get pvc my-pvc',
          output: [
            'NAME     STATUS   VOLUME           CAPACITY   ACCESS MODES   STORAGECLASS   AGE',
            'my-pvc   Bound    pvc-abc12-def5   1Gi        RWO            standard       8s',
          ],
          explanation:
            'STATUS=Bound means a PV was found/created and exclusively paired with this PVC. VOLUME shows the auto-generated PV name. If STATUS=Pending, the provisioner is working or no matching PV exists.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [],
          },
        },
        {
          id: 'p3-m6-s4',
          title: 'Mount the PVC in a Pod',
          instruction: 'Create a pod that writes to the PVC.',
          yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: pvc-writer
spec:
  containers:
  - name: writer
    image: busybox:1.36
    command: ["/bin/sh", "-c"]
    args: ["echo 'persistent data' > /data/file.txt && sleep 3600"]
    volumeMounts:
    - name: storage
      mountPath: /data
  volumes:
  - name: storage
    persistentVolumeClaim:
      claimName: my-pvc`,
          output: [],
          explanation:
            'The pod mounts my-pvc at /data. Any writes to /data survive pod restarts and rescheduling (to the same node, for RWO).',
          clusterState: {
            pods: [
              {
                id: 'pw',
                name: 'pvc-writer',
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
            events: ['pvc-writer scheduled → node-1'],
          },
        },
        {
          id: 'p3-m6-s5',
          title: 'Verify data persists after pod restart',
          instruction: 'Delete the pod and create a new one — the data should still be there.',
          command: 'kubectl delete pod pvc-writer && kubectl apply -f pod-with-pvc.yaml',
          output: ['pod "pvc-writer" deleted', 'pod/pvc-writer created'],
          explanation:
            'The PVC (and PV) survive pod deletion. A new pod mounting the same PVC finds the existing data. This is the key difference from emptyDir.',
          clusterState: {
            pods: [
              {
                id: 'pw2',
                name: 'pvc-writer',
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
          id: 'p3-m6-s6',
          title: 'Verify file contents',
          instruction: 'Read the file from the new pod to confirm persistence.',
          command: 'kubectl exec pvc-writer -- cat /data/file.txt',
          output: ['persistent data'],
          explanation:
            'The file written by the first pod is still there. This confirms the PVC persisted data across pod deletion and recreation.',
          clusterState: {
            pods: [
              {
                id: 'pw2',
                name: 'pvc-writer',
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
          tip: 'Clean up: kubectl delete pod pvc-writer && kubectl delete pvc my-pvc',
        },
      ],
      quiz: [
        {
          id: 'p3-m6-q1',
          question: 'A PVC is Pending. What is the most likely cause?',
          options: [
            'The pod mounting it has not been created yet',
            'No PV matches the PVC requirements (size, access mode, StorageClass)',
            'The namespace does not allow PVCs',
            'PVCs always start Pending and become Bound after 30 seconds',
          ],
          answer: 1,
          explanation:
            "Pending means no available PV matches the PVC's requirements. Check: is the requested size ≤ available PV? Do access modes overlap? Is the StorageClass correct? For dynamic provisioning: is the provisioner running?",
        },
        {
          id: 'p3-m6-q2',
          question:
            'A PVC with RWO access mode is Bound. Two pods try to mount it simultaneously on different nodes. What happens?',
          options: [
            'Both pods mount successfully',
            'The second pod stays Pending — RWO allows only one node at a time',
            'The first pod is evicted to make room for the second',
            'The PVC is automatically upgraded to RWX',
          ],
          answer: 1,
          explanation:
            'ReadWriteOnce allows only one node to mount the volume for writing. The second pod on a different node stays Pending. On the same node, multiple pods can mount RWO (depends on the storage driver).',
        },
        {
          id: 'p3-m6-q3',
          question: 'A PVC is deleted with reclaimPolicy: Retain. What state is the PV in?',
          options: [
            'Deleted — both PVC and PV are gone',
            'Released — PV exists but is not available for new PVCs',
            'Available — PV is recycled and ready for a new PVC',
            'Bound — PV stays bound until explicitly released',
          ],
          answer: 1,
          explanation:
            'With Retain, the PV moves to Released state. The data is preserved on the underlying storage. A new PVC cannot bind to it (Released ≠ Available). An admin must manually clean up and recycle it.',
        },
        {
          id: 'p3-m6-q4',
          question: 'What does a StorageClass do?',
          options: [
            'Limits the amount of storage a namespace can request',
            'Defines a provisioner and parameters for dynamic PV creation',
            'Assigns storage QoS to pods',
            'Maps physical disk partitions to namespaces',
          ],
          answer: 1,
          explanation:
            'StorageClass specifies which provisioner to use (e.g. AWS EBS, GCE PD, minikube hostpath) and its parameters (e.g. disk type, zone). When a PVC references a StorageClass, the provisioner creates the PV automatically.',
        },
        {
          id: 'p3-m6-q5',
          question: 'You delete a pod that was using a PVC. What happens to the data?',
          options: [
            'Data is deleted with the pod',
            'Data persists in the PVC/PV — only deleting the PVC removes it',
            'Data is copied to etcd for backup',
            'Data persists only if the pod had restartPolicy: Never',
          ],
          answer: 1,
          explanation:
            'PVCs are independent of pod lifecycle. Deleting a pod does not delete the PVC. The data persists until the PVC itself is deleted (and depending on reclaimPolicy, until the PV is also deleted).',
        },
        {
          id: 'p3-m6-q6',
          question: 'Which access mode allows multiple nodes to read AND write simultaneously?',
          options: [
            'ReadWriteOnce (RWO)',
            'ReadOnlyMany (ROX)',
            'ReadWriteMany (RWX)',
            'ReadWriteAll (RWA)',
          ],
          answer: 2,
          explanation:
            'ReadWriteMany (RWX) allows multiple nodes to mount the volume for reading and writing simultaneously. NFS and some cloud file systems support RWX. Most block storage (AWS EBS, GCE PD) only supports RWO.',
        },
      ],
      exercises: [
        {
          id: 'p3-m6-e1',
          title: 'Prove PVC data survives pod deletion',
          kind: 'guided' as const,
          goal: 'Write data to a PVC, delete the pod, create a new pod, read the data back',
          commands: [
            'kubectl apply -f pvc.yaml',
            'kubectl apply -f pod-pvc.yaml',
            'kubectl exec pvc-writer -- sh -c "echo hello > /data/test.txt"',
            'kubectl delete pod pvc-writer',
            'kubectl apply -f pod-pvc.yaml',
            'kubectl exec pvc-writer -- cat /data/test.txt',
          ],
          verify: [
            'Second pod reads "hello" from /data/test.txt',
            'kubectl get pvc shows STATUS=Bound throughout',
          ],
          expectedOutcome: 'Data persists across pod restart via PVC',
          cleanup: ['kubectl delete pod pvc-writer', 'kubectl delete pvc my-pvc'],
        },
      ],
    },
    // ─── Module 7: Gateway API ────────────────────────────────────────────────
    {
      id: 'p3-m7',
      slug: 'gateway-api',
      title: 'Gateway API — Next-Generation Ingress',
      description:
        'Replace classic Ingress with the role-oriented Gateway API: GatewayClass, Gateway, and HTTPRoute.',
      duration: '60 min',
      difficulty: 'intermediate' as const,
      learningObjectives: [
        'Explain why Gateway API was created and what limitations of classic Ingress it solves',
        'Describe the GatewayClass → Gateway → HTTPRoute resource hierarchy',
        'Apply Gateway API CRDs and create working HTTPRoute traffic routing',
        'Distinguish which role (infra admin vs app developer) owns each resource',
      ],
      keyConcepts: [
        'GatewayClass: cluster-scoped, names the controller implementation',
        'Gateway: namespace-scoped, defines listeners (protocol + port)',
        'HTTPRoute: namespace-scoped, defines routing rules to backend Services',
        'parentRef: links HTTPRoute to a specific Gateway',
        'Gateway API vs Ingress: role separation, traffic splitting, header routing',
      ],
      practicePrompts: [
        'Without notes: draw the GatewayClass → Gateway → HTTPRoute hierarchy and explain who creates each.',
        'What field in HTTPRoute links it to a Gateway?',
        'Which Gateway API resource is cluster-scoped vs namespace-scoped?',
      ],
      masteryChecks: [
        'Can explain the three Gateway API resources and their ownership model',
        'Can write a GatewayClass, Gateway, and HTTPRoute manifest from memory',
        'Can distinguish parentRef from backendRef fields in an HTTPRoute',
        'Can identify why classic Ingress cannot do traffic splitting natively',
      ],
      theory: `> 🧠 **Brain Warm-Up**: Classic Kubernetes Ingress routes HTTP traffic, but it has no standard way to split traffic 90/10 between two backends, or route based on HTTP headers. Why do you think that is — and what would you need to add to the API to support it? Think before reading.

## Why Gateway API Exists

Classic Ingress was designed for a simple use case: route HTTP hostnames to Services. As teams tried to do more — canary deployments, header-based routing, gRPC, TCP — they discovered that Ingress annotations were the only escape hatch. Every controller (nginx, traefik, haproxy) invented its own annotation namespace, making configs non-portable.

**Gateway API** (GA since Kubernetes 1.28) solves this with a structured, role-oriented API that is expressive enough to cover these use cases without annotations.

## Resource Hierarchy

\`\`\`
Cluster-scoped:
  GatewayClass  ←── names the controller (e.g. nginx, istio, cilium)

Namespace-scoped:
  Gateway       ←── defines listeners: protocol (HTTP/HTTPS/TCP) + port
    └── HTTPRoute ←── defines routing rules → backend Services
\`\`\`

### Role Separation

| Resource | Owner | Scope |
|---|---|---|
| GatewayClass | Infrastructure admin | Cluster |
| Gateway | Infrastructure admin | Namespace |
| HTTPRoute | Application developer | Namespace |

This separation means app developers can attach routes to a shared Gateway without needing cluster-admin privileges — a major improvement over Ingress.

## Ingress vs Gateway API Comparison

| Feature | Ingress | Gateway API |
|---|---|---|
| Traffic splitting | Annotation-only (non-standard) | \`weight\` field in HTTPRoute |
| Header routing | Annotation-only | \`matches.headers\` in HTTPRoute |
| TCP/gRPC | Not standard | TCPRoute / GRPCRoute |
| Role separation | None | GatewayClass / Gateway / Route |
| Multi-controller | One controller per Ingress | Multiple Gateways per class |

## HTTPRoute Key Fields

\`\`\`yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: my-route
spec:
  parentRefs:          # which Gateway(s) to attach to
    - name: my-gateway
      namespace: default
  hostnames:           # replaces Ingress host
    - "app.example.com"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api
      backendRefs:     # where to send traffic
        - name: api-service
          port: 8080
          weight: 90
        - name: api-service-v2
          port: 8080
          weight: 10
\`\`\`

The \`weight\` field enables canary deployments natively — no annotations needed.`,
      labSteps: [
        {
          id: 'p3-m7-s1',
          title: 'Install Gateway API CRDs',
          instruction:
            'Gateway API ships as CRDs separate from Kubernetes core. Install the standard channel (GA resources only).',
          command:
            'kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml',
          output: [
            'customresourcedefinition.apiextensions.k8s.io/gatewayclasses.gateway.networking.k8s.io created',
            'customresourcedefinition.apiextensions.k8s.io/gateways.gateway.networking.k8s.io created',
            'customresourcedefinition.apiextensions.k8s.io/httproutes.gateway.networking.k8s.io created',
          ],
          explanation:
            'The standard channel installs three CRDs: GatewayClass, Gateway, HTTPRoute. The experimental channel adds TCPRoute, GRPCRoute, and others. Always use the release tag — never HEAD — for reproducibility.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system'],
            events: ['Gateway API CRDs installed (standard channel v1.2.0)'],
          },
          tip: 'Check the latest release at https://github.com/kubernetes-sigs/gateway-api/releases before using the URL above — the minor version may have advanced.',
        },
        {
          id: 'p3-m7-s2',
          title: 'Verify CRDs are registered',
          instruction: 'Confirm all three Gateway API CRDs are available in the cluster.',
          command:
            'kubectl get crd | grep gateway.networking.k8s.io',
          output: [
            'gatewayclasses.gateway.networking.k8s.io   2024-01-15T10:00:00Z',
            'gateways.gateway.networking.k8s.io         2024-01-15T10:00:00Z',
            'httproutes.gateway.networking.k8s.io       2024-01-15T10:00:00Z',
          ],
          explanation:
            'Three CRDs registered. GatewayClass is cluster-scoped; Gateway and HTTPRoute are namespace-scoped. Until a controller implementing GatewayClass is installed, creating Gateway objects will leave them in an Accepted=False state.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system'],
            events: ['Verified: gatewayclasses, gateways, httproutes CRDs present'],
          },
        },
        {
          id: 'p3-m7-s3',
          title: 'Apply GatewayClass and Gateway manifests',
          instruction:
            'Create a GatewayClass (names the controller) and a Gateway (defines the listener on port 80). For minikube, we use the envoy-gateway implementation.',
          command: 'kubectl apply -f gateway-class.yaml -f gateway.yaml',
          output: [
            'gatewayclass.gateway.networking.k8s.io/envoy created',
            'gateway.gateway.networking.k8s.io/my-gateway created',
          ],
          explanation:
            'GatewayClass is cluster-scoped and references the controller (controllerName field). Gateway is namespace-scoped and references the GatewayClass by name. The controller watches for Gateways referencing its class and provisions the actual load balancer or proxy.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['GatewayClass: envoy created', 'Gateway: my-gateway created in default'],
          },
          yamlContent: `# gateway-class.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: envoy
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
---
# gateway.yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: my-gateway
  namespace: default
spec:
  gatewayClassName: envoy
  listeners:
    - name: http
      protocol: HTTP
      port: 80`,
        },
        {
          id: 'p3-m7-s4',
          title: 'Deploy a backend service',
          instruction: 'Create a simple nginx deployment and Service to use as the HTTPRoute backend.',
          command:
            'kubectl create deployment web --image=nginx:stable-alpine && kubectl expose deployment web --port=80',
          output: [
            'deployment.apps/web created',
            'service/web created',
          ],
          explanation:
            'HTTPRoute backendRefs point to a Service name and port. The Service must exist in the same namespace as the HTTPRoute (or the Gateway must grant cross-namespace access via ReferenceGrant).',
          clusterState: {
            pods: [
              {
                id: 'web-abc12',
                name: 'web-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:stable-alpine',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'web-svc',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: '10.96.0.100',
              },
            ],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'nginx:stable-alpine',
              },
            ],
            namespaces: ['default'],
            events: ['Deployment web created', 'Service web exposed on port 80'],
          },
        },
        {
          id: 'p3-m7-s5',
          title: 'Create an HTTPRoute',
          instruction:
            'Apply an HTTPRoute that attaches to the Gateway and routes all traffic to the web Service.',
          command: 'kubectl apply -f httproute.yaml',
          output: ['httproute.gateway.networking.k8s.io/web-route created'],
          explanation:
            'parentRefs links this HTTPRoute to the Gateway named my-gateway in the same namespace. backendRefs sends matched traffic to the web Service on port 80. The hostnames field replaces the host field from classic Ingress rules.',
          clusterState: {
            pods: [
              {
                id: 'web-abc12',
                name: 'web-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:stable-alpine',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'web-svc',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: '10.96.0.100',
              },
            ],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'nginx:stable-alpine',
              },
            ],
            namespaces: ['default'],
            events: ['HTTPRoute web-route created — attached to my-gateway'],
          },
          yamlContent: `apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: web-route
  namespace: default
spec:
  parentRefs:
    - name: my-gateway
      namespace: default
  hostnames:
    - "web.example.com"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: web
          port: 80`,
        },
        {
          id: 'p3-m7-s6',
          title: 'Inspect HTTPRoute status',
          instruction: 'Check the HTTPRoute status to confirm it was accepted by the Gateway.',
          command: 'kubectl describe httproute web-route',
          output: [
            'Name:         web-route',
            'Namespace:    default',
            'Status:',
            '  Parents:',
            '    Conditions:',
            '      Type:   Accepted',
            '      Status: True',
            '      Type:   ResolvedRefs',
            '      Status: True',
          ],
          explanation:
            'Two status conditions confirm success: Accepted=True means the Gateway accepted the attachment; ResolvedRefs=True means all backendRefs (Services) were found and resolved. If either is False, describe will show the reason — most commonly a wrong parentRef name or missing Service.',
          clusterState: {
            pods: [
              {
                id: 'web-abc12',
                name: 'web-abc12',
                namespace: 'default',
                node: 'node-1',
                status: 'Running',
                labels: { app: 'web' },
                image: 'nginx:stable-alpine',
                restarts: 0,
              },
            ],
            services: [
              {
                id: 'web-svc',
                name: 'web',
                namespace: 'default',
                type: 'ClusterIP',
                selector: { app: 'web' },
                port: 80,
                clusterIP: '10.96.0.100',
              },
            ],
            deployments: [
              {
                id: 'web-deploy',
                name: 'web',
                namespace: 'default',
                replicas: 1,
                availableReplicas: 1,
                image: 'nginx:stable-alpine',
              },
            ],
            namespaces: ['default'],
            events: ['HTTPRoute web-route: Accepted=True, ResolvedRefs=True'],
          },
          tip: 'Accepted=False with reason "NoMatchingParent" means the parentRef name or namespace is wrong. ResolvedRefs=False means the backend Service does not exist.',
        },
      ],
      quiz: [
        {
          id: 'p3-m7-q1',
          question: 'Which Gateway API resource is cluster-scoped (not namespace-scoped)?',
          options: ['HTTPRoute', 'Gateway', 'GatewayClass', 'TCPRoute'],
          answer: 2,
          explanation:
            'GatewayClass is cluster-scoped because it names the controller implementation for the entire cluster. Gateway and HTTPRoute (and all Route types) are namespace-scoped.',
        },
        {
          id: 'p3-m7-q2',
          question: 'Which field in an HTTPRoute links it to a specific Gateway?',
          options: ['gatewayRef', 'parentRefs', 'backendRefs', 'hostnames'],
          answer: 1,
          explanation:
            'parentRefs specifies which Gateway(s) the HTTPRoute attaches to. backendRefs specifies the backend Services to send traffic to. hostnames filters by Host header.',
        },
        {
          id: 'p3-m7-q3',
          question: 'What does the HTTPRoute status condition "ResolvedRefs=False" indicate?',
          options: [
            'The Gateway controller is not running',
            'The HTTPRoute has an invalid hostnames field',
            'One or more backendRefs (Services) could not be found',
            'The GatewayClass does not exist',
          ],
          answer: 2,
          explanation:
            'ResolvedRefs=False means the controller tried to resolve the backendRefs Services and failed — usually because the Service does not exist or is in a different namespace without a ReferenceGrant.',
        },
        {
          id: 'p3-m7-q4',
          question:
            'A team wants to split traffic 90% to v1 and 10% to v2 of their app. Which resource controls this in Gateway API?',
          options: [
            'Gateway listeners field',
            'GatewayClass parameters',
            'HTTPRoute backendRefs weight field',
            'A separate TrafficSplit CRD',
          ],
          answer: 2,
          explanation:
            'HTTPRoute backendRefs supports a weight field on each backend. Weights are relative integers — e.g., weight: 90 and weight: 10 split traffic 90/10. This is a native capability requiring no annotations, unlike classic Ingress.',
        },
      ],
      coverage: {
        concepts: [
          'GatewayClass: cluster-scoped, names the controller',
          'Gateway: namespace-scoped, defines listeners',
          'HTTPRoute: namespace-scoped, routing rules to Services',
          'parentRefs: attaches route to a Gateway',
          'backendRefs weight: native traffic splitting',
          'Role separation: infra admin vs app developer',
        ],
        commands: [
          'kubectl apply -f standard-install.yaml (CRD install)',
          'kubectl get crd | grep gateway.networking.k8s.io',
          'kubectl apply -f gatewayclass.yaml',
          'kubectl apply -f gateway.yaml',
          'kubectl apply -f httproute.yaml',
          'kubectl describe httproute',
          'kubectl get gateway',
        ],
        architecture: [
          'CRDs separate from Kubernetes core — must install explicitly',
          'Controller watches GatewayClass controllerName to claim resources',
          'Accepted condition: Gateway accepted the HTTPRoute attachment',
          'ResolvedRefs condition: all backendRefs Services resolved',
          'Standard vs experimental channel: different CRD sets',
        ],
        techniques: [
          'Pin CRD install URL to a release tag, not HEAD',
          'Check HTTPRoute status conditions before debugging traffic',
          'Use weight field for canary traffic splitting',
          'Use matches.headers for header-based routing',
        ],
        procedures: [
          'Install standard-channel CRDs',
          'Create GatewayClass → Gateway → HTTPRoute in order',
          'Verify with kubectl describe httproute status conditions',
          'Expose backend Service before creating HTTPRoute',
        ],
        toolsAndPlugins: ['kubectl', 'gateway-api CRDs'],
        cases: [
          'Accepted=False / NoMatchingParent — wrong parentRef name or namespace',
          'ResolvedRefs=False — backend Service missing or wrong namespace',
          'Gateway stuck in Unknown — controller not installed or not watching this GatewayClass',
        ],
        scenarios: [
          'Replace classic Ingress with HTTPRoute for a web service',
          'Canary deploy: 90/10 traffic split with backendRefs weight',
          'Path-based routing: /api → api-service, / → web-service',
        ],
      },
      exercises: [
        {
          id: 'p3-m7-e1',
          title: 'Install Gateway API and create end-to-end routing',
          kind: 'guided' as const,
          goal: 'Install CRDs, create GatewayClass + Gateway + HTTPRoute, verify Accepted=True status.',
          commands: [
            'kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml',
            'kubectl apply -f gatewayclass.yaml -f gateway.yaml -f httproute.yaml',
            'kubectl describe httproute web-route',
          ],
          verify: [
            'kubectl get crd | grep gateway.networking.k8s.io shows 3 CRDs',
            'kubectl describe httproute shows Accepted=True',
          ],
          expectedOutcome: 'HTTPRoute attached to Gateway with Accepted=True and ResolvedRefs=True.',
          cleanup: [
            'kubectl delete httproute web-route',
            'kubectl delete gateway my-gateway',
            'kubectl delete gatewayclass envoy',
            'kubectl delete deployment web',
            'kubectl delete service web',
          ],
        },
        {
          id: 'p3-m7-e2',
          title: 'Write HTTPRoute with path-based routing from memory',
          kind: 'challenge' as const,
          goal: 'Write an HTTPRoute manifest from memory that routes /api to api-svc:8080 and / to web-svc:80.',
          commands: ['kubectl apply -f my-route.yaml', 'kubectl describe httproute my-route'],
          verify: [
            'HTTPRoute has two rules: one matching /api, one matching /',
            'Each rule has correct backendRefs name and port',
          ],
          expectedOutcome: 'HTTPRoute with two path-based routing rules applied without errors.',
          cleanup: ['kubectl delete httproute my-route'],
        },
        {
          id: 'p3-m7-e3',
          title: 'Debug: HTTPRoute not routing — wrong parentRef',
          kind: 'debug' as const,
          goal: 'An HTTPRoute has Accepted=False. Find and fix the parentRef error.',
          commands: [
            'kubectl describe httproute broken-route',
            'kubectl get gateway -A',
            'kubectl edit httproute broken-route',
          ],
          verify: [
            'kubectl describe httproute broken-route shows Accepted=True after fix',
          ],
          expectedOutcome: 'Fixed parentRef namespace or name so HTTPRoute attaches to the correct Gateway.',
          cleanup: ['kubectl delete httproute broken-route'],
        },
        {
          id: 'p3-m7-e4',
          title: '7-day spaced review — Gateway API hierarchy',
          kind: 'spaced-review' as const,
          goal: 'Recall the GatewayClass → Gateway → HTTPRoute hierarchy, ownership model, and key fields from memory.',
          commands: ['kubectl explain httproute.spec.parentRefs', 'kubectl explain httproute.spec.rules.backendRefs'],
          verify: [
            'Can state which resources are cluster-scoped vs namespace-scoped',
            'Can state what parentRefs and backendRefs do without notes',
            'Can explain Accepted vs ResolvedRefs status conditions',
          ],
          expectedOutcome: 'Gateway API hierarchy and ownership model recalled without notes.',
          cleanup: [],
        },
      ],
    },
  ],
}

export default phase3
