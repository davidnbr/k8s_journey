import type { Phase, ClusterState } from "@/lib/types";

const phase7: Phase = {
  id: "phase-7",
  slug: "phase-7",
  title: "Cluster Operations",
  shortTitle: "Cluster Ops",
  description:
    "Master day-2 Kubernetes operations: bootstrap clusters with kubeadm, safeguard cluster state with etcd backup/restore, perform zero-downtime version upgrades, and manage PKI certificates before they expire.",
  weeks: "Weeks 14–16",
  hours: "~20 hours",
  color: "text-orange-400",
  bgColor: "bg-orange-500/10 border-orange-500/30",
  modules: [
    // ─── Module 1: Bootstrapping a Cluster with kubeadm ──────────────────────
    {
      id: "p7-m1",
      slug: "cluster-setup",
      title: "Bootstrapping a Cluster with kubeadm",
      description:
        "Learn how kubeadm automates the complex PKI and static-pod setup required to stand up a production-grade control plane, then join worker nodes using bootstrap tokens.",
      duration: "5 hours",
      difficulty: "intermediate",
      learningObjectives: [
        "Describe each phase of the kubeadm init workflow from preflight checks to kubelet configuration",
        "Explain what a bootstrap token is and how workers use it to join securely",
        "Install a CNI plugin and verify nodes reach Ready status",
        "Reproduce a two-node cluster setup from memory",
      ],
      keyConcepts: [
        "kubeadm preflight checks",
        "PKI bootstrap (CA, apiserver cert, front-proxy, etcd)",
        "Static pod manifests in /etc/kubernetes/manifests",
        "Bootstrap token and discovery-token-ca-cert-hash",
        "CNI plugin requirement for pod networking",
        "admin.conf and KUBECONFIG setup",
      ],
      practicePrompts: [
        "Without looking, list the 6 phases kubeadm init goes through.",
        "Why must a CNI plugin be installed before pods can communicate across nodes?",
        "What would happen if you ran kubeadm join with an expired bootstrap token?",
      ],
      masteryChecks: [
        "Can explain what kubeadm preflight checks verify before init proceeds",
        "Can describe why static pods are used for the control plane instead of regular deployments",
        "Can reproduce the full kubeadm init → CNI → kubeadm join sequence from memory",
        "Can explain the purpose of --pod-network-cidr and how it relates to the CNI choice",
        "Can locate and interpret admin.conf and know which component it authenticates as",
        "Can identify the bootstrap token format and explain why it has a short TTL",
      ],
      theory: `> 🧠 **Brain Warm-Up**: Before Kubernetes existed, administrators had to manually generate TLS certificates for every control plane component, configure systemd units, and wire static files by hand. What would break first if the etcd CA and the apiserver CA were different root certificates? Think about it before reading below.

## kubeadm: Automated Cluster Bootstrap

**kubeadm** is the official Kubernetes cluster bootstrap tool. It handles the hard parts: generating a PKI from scratch, writing static pod manifests, and producing kubeconfig files so each control-plane component can authenticate to the API server.

### The kubeadm init Workflow

kubeadm init runs through six well-defined phases. Each phase can be run individually with \`kubeadm init phase <name>\` for debugging:

\`\`\`
kubeadm init
    │
    ├─ 1. Preflight Checks ──── swap disabled? kernel params? required binaries?
    │                            ports available? container runtime responding?
    │
    ├─ 2. Certificates ─────── generate /etc/kubernetes/pki/
    │                            ca.crt, apiserver.crt, apiserver-etcd-client.crt,
    │                            front-proxy-ca.crt, etcd/ca.crt, sa.key/sa.pub
    │
    ├─ 3. Kubeconfigs ──────── admin.conf, controller-manager.conf,
    │                            scheduler.conf, kubelet.conf
    │
    ├─ 4. Control Plane ────── write static pod manifests to
    │      Static Pods          /etc/kubernetes/manifests/
    │                            kube-apiserver.yaml, kube-controller-manager.yaml,
    │                            kube-scheduler.yaml, etcd.yaml
    │                            (kubelet auto-starts them as "mirror pods")
    │
    ├─ 5. Bootstrap Token ──── generate short-lived token (format: abcdef.0123456789abcdef)
    │                            used by workers to authenticate during join
    │
    └─ 6. Kubelet Config ───── write /var/lib/kubelet/config.yaml and
                                /etc/kubernetes/kubelet.conf
                                then restart kubelet
\`\`\`

### Post-init: CNI Plugin

After init, the control plane is running but the CoreDNS pods will remain **Pending** until a CNI plugin is installed. Without a CNI, there is no overlay network for pod-to-pod traffic across nodes.

\`\`\`
Without CNI:
  node-1 Pod ──X──▶ node-2 Pod   (no route)

With Flannel (VXLAN):
  node-1 Pod ──▶ flannel0 ──▶ VXLAN encap ──▶ eth0 ──▶ node-2 eth0 ──▶ VXLAN decap ──▶ flannel0 ──▶ node-2 Pod
\`\`\`

### Worker Join Flow

The worker node uses the bootstrap token to authenticate a one-time TLS handshake:

\`\`\`
Worker Node
    │
    ├─ kubeadm join <control-plane-ip>:6443
    │      --token <bootstrap-token>
    │      --discovery-token-ca-cert-hash sha256:<hash>
    │
    ├─ Contacts API server with token ──▶ API server validates token
    ├─ Downloads cluster CA cert ──▶ verifies against provided hash
    ├─ Generates kubelet client cert (TLS bootstrap) ──▶ signed by cluster CA
    └─ kubelet starts with permanent certificate → node appears Ready
\`\`\`

### kubeadm vs. Manual Setup

| Aspect | Manual | kubeadm |
|--------|--------|---------|
| PKI generation | openssl commands by hand | Automated with sane defaults |
| Static pods | Write YAML by hand | Generated from version-aware templates |
| Kubelet config | Manual systemd unit | Written by kubeadm, restarted automatically |
| Upgrade path | Fully manual | \`kubeadm upgrade apply\` |
| Bootstrap tokens | N/A | Auto-generated with 24h TTL |

kubeadm does not manage the underlying infrastructure (VMs, network) — it only configures the Kubernetes layer on top of an already-running OS.`,
      labSteps: [
        {
          id: "p7-m1-s1",
          title: "Initialize the Control Plane",
          instruction:
            "Run kubeadm init on the control plane node, specifying the pod network CIDR for Flannel. The output includes the join command with bootstrap token.",
          command: "kubeadm init --pod-network-cidr=10.244.0.0/16",
          output: [
            "[init] Using Kubernetes version: v1.30.0",
            "[preflight] Running pre-flight checks",
            "[preflight] Pulling images required for setting up a Kubernetes cluster",
            '[certs] Using certificateDir folder "/etc/kubernetes/pki"',
            '[certs] Generating "ca" certificate and key',
            '[certs] Generating "apiserver" certificate and key',
            '[certs] Generating "etcd/ca" certificate and key',
            '[kubeconfig] Writing "admin.conf" kubeconfig file',
            '[kubeconfig] Writing "kubelet.conf" kubeconfig file',
            '[control-plane] Using manifest folder "/etc/kubernetes/manifests"',
            '[control-plane] Creating static Pod manifest for "kube-apiserver"',
            '[control-plane] Creating static Pod manifest for "etcd"',
            '[bootstraptoken] Creating the "cluster-info" ConfigMap',
            "",
            "Your Kubernetes control-plane has initialized successfully!",
            "",
            "To start using your cluster, run:",
            "  mkdir -p $HOME/.kube",
            "  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config",
            "  sudo chown $(id -u):$(id -g) $HOME/.kube/config",
            "",
            "Then you can join any number of worker nodes by running:",
            "  kubeadm join 192.168.1.10:6443 --token abcdef.0123456789abcdef \\",
            "      --discovery-token-ca-cert-hash sha256:<hash>...",
          ],
          explanation:
            "kubeadm init runs preflight checks, generates the full PKI under /etc/kubernetes/pki/, writes static pod manifests, and prints the join command. Save the join command — it includes the bootstrap token (valid for 24 hours) and the CA cert hash.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
              {
                id: "etcd",
                name: "etcd-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "etcd" },
                image: "registry.k8s.io/etcd:3.5.12",
                restarts: 0,
              },
              {
                id: "scheduler",
                name: "kube-scheduler-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-scheduler" },
                image: "registry.k8s.io/kube-scheduler:v1.30.0",
                restarts: 0,
              },
              {
                id: "controller",
                name: "kube-controller-manager-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-controller-manager" },
                image: "registry.k8s.io/kube-controller-manager:v1.30.0",
                restarts: 0,
              },
              {
                id: "coredns-1",
                name: "coredns-78fcd69978-a1b2c",
                namespace: "kube-system",
                node: "node-1",
                status: "Pending",
                labels: { app: "coredns" },
                image: "registry.k8s.io/coredns/coredns:v1.11.1",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: [
              "default",
              "kube-system",
              "kube-public",
              "kube-node-lease",
            ],
            events: [
              "Control plane initialized. CoreDNS Pending — CNI not yet installed.",
            ],
            highlightedComponent: "apiserver",
          },
          tip: "If init fails at preflight, the most common causes are: swap enabled (fix: swapoff -a), a port already in use (fix: kill the process), or a stale /etc/kubernetes directory (fix: kubeadm reset).",
        },
        {
          id: "p7-m1-s2",
          title: "Configure kubectl for the Admin User",
          instruction:
            "Copy the generated admin.conf to your home directory so kubectl can authenticate as the cluster-admin.",
          command:
            "mkdir -p $HOME/.kube && sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config && sudo chown $(id -u):$(id -g) $HOME/.kube/config",
          output: ["# No output on success"],
          explanation:
            'The admin.conf kubeconfig embeds a client certificate signed by the cluster CA with the cluster-admin ClusterRole. Without this step, kubectl commands will fail with "no configuration has been provided".',
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
              {
                id: "etcd",
                name: "etcd-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "etcd" },
                image: "registry.k8s.io/etcd:3.5.12",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: [
              "admin.conf copied to ~/.kube/config",
              "kubectl now authenticates as cluster-admin",
            ],
            highlightedComponent: "apiserver",
          },
          tip: "You can inspect who you are authenticated as at any time with: kubectl auth whoami",
        },
        {
          id: "p7-m1-s3",
          title: "Install the Flannel CNI Plugin",
          instruction:
            "Apply the Flannel DaemonSet manifest to install the CNI plugin. This enables pod-to-pod networking across nodes.",
          command:
            "kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml",
          output: [
            "namespace/kube-flannel created",
            "clusterrole.rbac.authorization.k8s.io/flannel created",
            "clusterrolebinding.rbac.authorization.k8s.io/flannel created",
            "serviceaccount/flannel created",
            "configmap/kube-flannel-cfg created",
            "daemonset.apps/kube-flannel-ds created",
          ],
          explanation:
            "Flannel runs as a DaemonSet — one pod on every node. Each Flannel pod configures VXLAN interfaces and writes CNI config to /etc/cni/net.d/ so the container runtime can set up pod networking. Once Flannel is ready, CoreDNS transitions from Pending to Running.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
              {
                id: "flannel-1",
                name: "kube-flannel-ds-xk9p2",
                namespace: "kube-flannel",
                node: "node-1",
                status: "Running",
                labels: { app: "flannel" },
                image: "docker.io/flannel/flannel:v0.24.4",
                restarts: 0,
              },
              {
                id: "coredns-1",
                name: "coredns-78fcd69978-a1b2c",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { app: "coredns" },
                image: "registry.k8s.io/coredns/coredns:v1.11.1",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system", "kube-flannel"],
            events: [
              "Flannel DaemonSet created",
              "CoreDNS transitioned Pending → Running",
            ],
          },
        },
        {
          id: "p7-m1-s4",
          title: "Verify Control Plane Node is Ready",
          instruction:
            "Check that the control plane node has transitioned to Ready status now that CNI is installed.",
          command: "kubectl get nodes",
          output: [
            "NAME     STATUS   ROLES           AGE   VERSION",
            "node-1   Ready    control-plane   3m    v1.30.0",
          ],
          explanation:
            "The node transitions from NotReady to Ready once the CNI plugin is installed and the kubelet can confirm all required conditions are healthy: MemoryPressure=False, DiskPressure=False, PIDPressure=False, Ready=True.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
              {
                id: "flannel-1",
                name: "kube-flannel-ds-xk9p2",
                namespace: "kube-flannel",
                node: "node-1",
                status: "Running",
                labels: { app: "flannel" },
                image: "docker.io/flannel/flannel:v0.24.4",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system", "kube-flannel"],
            events: ["node-1 status: Ready", "Control plane fully operational"],
          },
        },
        {
          id: "p7-m1-s5",
          title: "Join a Worker Node",
          instruction:
            "On the worker node, run the kubeadm join command with the bootstrap token from the init output.",
          command:
            "kubeadm join 192.168.1.10:6443 --token abcdef.0123456789abcdef --discovery-token-ca-cert-hash sha256:<hash>",
          output: [
            "[preflight] Running pre-flight checks",
            "[preflight] Reading configuration from the cluster...",
            '[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"',
            '[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"',
            "[kubelet-start] Starting the kubelet",
            "[kubelet-check] Initial timeout of 40s passed.",
            "",
            "This node has joined the cluster:",
            "* Certificate signing request was sent to apiserver and a response was received.",
            "* The kubelet was informed of the new secure connection details.",
            "",
            'Run "kubectl get nodes" on the control-plane to see this node join the cluster.',
          ],
          explanation:
            "The worker contacts the API server with the bootstrap token. The API server validates the token, signs a kubelet client certificate via the TLS bootstrap mechanism, and the new node registers itself. The --discovery-token-ca-cert-hash prevents MITM attacks by pinning the cluster CA fingerprint.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
              {
                id: "flannel-1",
                name: "kube-flannel-ds-xk9p2",
                namespace: "kube-flannel",
                node: "node-1",
                status: "Running",
                labels: { app: "flannel" },
                image: "docker.io/flannel/flannel:v0.24.4",
                restarts: 0,
              },
              {
                id: "flannel-2",
                name: "kube-flannel-ds-m7n8o",
                namespace: "kube-flannel",
                node: "node-2",
                status: "Running",
                labels: { app: "flannel" },
                image: "docker.io/flannel/flannel:v0.24.4",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system", "kube-flannel"],
            events: [
              "node-2 sent CSR to API server",
              "Certificate signed — node-2 joining cluster",
            ],
            highlightedComponent: "apiserver",
          },
          tip: "If the bootstrap token has expired (default TTL: 24h), regenerate one on the control plane with: kubeadm token create --print-join-command",
        },
        {
          id: "p7-m1-s6",
          title: "Verify Both Nodes Are Ready",
          instruction:
            "From the control plane, confirm both nodes have joined and are in Ready status.",
          command: "kubectl get nodes -o wide",
          output: [
            "NAME     STATUS   ROLES           AGE    VERSION   INTERNAL-IP    OS-IMAGE             KERNEL-VERSION      CONTAINER-RUNTIME",
            "node-1   Ready    control-plane   8m     v1.30.0   192.168.1.10   Ubuntu 22.04.3 LTS   5.15.0-101-generic  containerd://1.7.13",
            "node-2   Ready    <none>          2m     v1.30.0   192.168.1.11   Ubuntu 22.04.3 LTS   5.15.0-101-generic  containerd://1.7.13",
          ],
          explanation:
            "Both nodes show Ready, confirming the CNI is working cluster-wide and the kubelet on node-2 is successfully communicating with the API server. The -o wide flag reveals the container runtime, internal IP, and OS image — all relevant for troubleshooting.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
              {
                id: "etcd",
                name: "etcd-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "etcd" },
                image: "registry.k8s.io/etcd:3.5.12",
                restarts: 0,
              },
              {
                id: "flannel-1",
                name: "kube-flannel-ds-xk9p2",
                namespace: "kube-flannel",
                node: "node-1",
                status: "Running",
                labels: { app: "flannel" },
                image: "docker.io/flannel/flannel:v0.24.4",
                restarts: 0,
              },
              {
                id: "flannel-2",
                name: "kube-flannel-ds-m7n8o",
                namespace: "kube-flannel",
                node: "node-2",
                status: "Running",
                labels: { app: "flannel" },
                image: "docker.io/flannel/flannel:v0.24.4",
                restarts: 0,
              },
              {
                id: "proxy-1",
                name: "kube-proxy-p2q3r",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { app: "kube-proxy" },
                image: "registry.k8s.io/kube-proxy:v1.30.0",
                restarts: 0,
              },
              {
                id: "proxy-2",
                name: "kube-proxy-s4t5u",
                namespace: "kube-system",
                node: "node-2",
                status: "Running",
                labels: { app: "kube-proxy" },
                image: "registry.k8s.io/kube-proxy:v1.30.0",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system", "kube-flannel"],
            events: [
              "node-1: Ready (control-plane)",
              "node-2: Ready (worker)",
              "Cluster fully operational — 2 nodes",
            ],
          },
        },
      ],
      quiz: [
        {
          id: "p7-m1-q1",
          question:
            "During kubeadm init, which directory receives the static pod manifests that the kubelet auto-starts as control plane components?",
          options: [
            "/var/lib/kubelet/manifests",
            "/etc/kubernetes/manifests",
            "/usr/share/kubernetes/static",
            "/opt/kubernetes/pods",
          ],
          answer: 1,
          explanation:
            "The kubelet watches /etc/kubernetes/manifests for static pod YAML files. kubeadm writes kube-apiserver.yaml, kube-controller-manager.yaml, kube-scheduler.yaml, and etcd.yaml there. The kubelet starts and manages them directly, without going through the API server.",
        },
        {
          id: "p7-m1-q2",
          question:
            "After kubeadm init completes, CoreDNS pods remain in Pending state. What is the most likely cause?",
          options: [
            "The admin.conf file has not been copied to ~/.kube/config yet",
            "No CNI plugin has been installed, so pods have no network and cannot be scheduled",
            "CoreDNS requires a LoadBalancer service which is not available on bare metal",
            "The bootstrap token has already expired",
          ],
          answer: 1,
          explanation:
            "Without a CNI plugin, the Kubernetes network model cannot be implemented — pods have no IP routes between nodes. CoreDNS (and any pod) stays Pending because the scheduler correctly identifies there is no node with a working network configuration.",
        },
        {
          id: "p7-m1-q3",
          question:
            'A worker node fails to join the cluster with error: "token is expired". What is the correct remediation on the control plane?',
          options: [
            "Run kubeadm reset on the worker and restart the control plane",
            "Regenerate a join command with: kubeadm token create --print-join-command",
            "Re-run kubeadm init with a longer --token-ttl value",
            "Manually copy /etc/kubernetes/admin.conf to the worker",
          ],
          answer: 1,
          explanation:
            "Bootstrap tokens have a default TTL of 24 hours. kubeadm token create --print-join-command generates a fresh token and prints the complete join command. There is no need to reinitialize the control plane.",
        },
        {
          id: "p7-m1-q4",
          question:
            "What is the purpose of the --discovery-token-ca-cert-hash flag in kubeadm join?",
          options: [
            "It identifies which bootstrap token to use when multiple tokens exist",
            "It pins the cluster CA fingerprint so the worker can verify it is connecting to the legitimate API server, preventing MITM attacks",
            "It specifies the hash algorithm used to encrypt etcd data",
            "It provides the hash of the node's own certificate for the API server to verify",
          ],
          answer: 1,
          explanation:
            "Before a worker can trust the cluster CA it downloads from the API server, it must verify the CA against the provided SHA-256 hash. This prevents an attacker from substituting a malicious CA during the bootstrap handshake.",
        },
        {
          id: "p7-m1-q5",
          question:
            "Which kubeconfig file does the controller-manager use to authenticate to the API server after kubeadm init?",
          options: [
            "admin.conf",
            "controller-manager.conf",
            "kubelet.conf",
            "scheduler.conf",
          ],
          answer: 1,
          explanation:
            "kubeadm generates separate kubeconfig files for each control plane component under /etc/kubernetes/. controller-manager.conf embeds a client certificate with the system:kube-controller-manager identity. admin.conf is for human cluster administrators.",
        },
        {
          id: "p7-m1-q6",
          question:
            "You need to add a second control plane node to achieve HA. Which kubeadm command do you run on the new machine?",
          options: [
            "kubeadm join <ip>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash> --control-plane --certificate-key <key>",
            "kubeadm init --control-plane-endpoint <ip>",
            "kubeadm join <ip>:6443 --token <token> --role=control-plane",
            "kubeadm upgrade apply --add-control-plane",
          ],
          answer: 0,
          explanation:
            "Joining a second control plane node requires the same kubeadm join command used for workers, plus --control-plane (to install control plane components) and --certificate-key (to decrypt the PKI certificates uploaded by the first init). The certificate-key is printed at the end of kubeadm init.",
        },
      ],
      exercises: [
        {
          id: "p7-m1-e1",
          title: "Trace the kubeadm init phases",
          kind: "guided",
          goal: "Inspect the artifacts kubeadm init created — PKI files, static pod manifests, and kubeconfigs — to understand what each phase produced.",
          commands: [
            "ls /etc/kubernetes/pki/",
            "ls /etc/kubernetes/pki/etcd/",
            "ls /etc/kubernetes/manifests/",
            "kubectl get pods -n kube-system -o wide",
            "kubectl config view --minify",
            "kubeadm token list",
          ],
          verify: [
            "PKI directory contains ca.crt, apiserver.crt, apiserver-etcd-client.crt, front-proxy-ca.crt, sa.key",
            "Manifests directory contains kube-apiserver.yaml, etcd.yaml, kube-controller-manager.yaml, kube-scheduler.yaml",
            "kubectl config view shows server URL and certificate-authority-data",
          ],
          expectedOutcome:
            "All kubeadm init artifacts located and mapped to their init phases.",
          cleanup: [],
        },
        {
          id: "p7-m1-e2",
          title: "Recover from expired bootstrap token",
          kind: "challenge",
          goal: "Simulate a worker join failure due to an expired token, then generate a new join command and successfully add the node.",
          commands: [
            "kubeadm token list",
            "kubeadm token create --print-join-command",
            "kubeadm token create --ttl 10m --print-join-command",
            "kubectl get nodes",
          ],
          verify: [
            "kubeadm token create outputs a valid join command",
            "New token appears in kubeadm token list",
            "TTL-limited token visible with short expiry",
          ],
          expectedOutcome:
            "Bootstrap token regeneration procedure confirmed for CKA exam.",
          cleanup: [
            'kubeadm token list | awk "NR>1{print $1}" | xargs -I{} kubeadm token delete {} 2>/dev/null || true',
          ],
        },
      ],
    },
    // ─── Module 2: etcd — Backup, Restore & Health ───────────────────────────
    {
      id: "p7-m2",
      slug: "etcd-operations",
      title: "etcd — Backup, Restore & Health",
      description:
        "Understand etcd as the cluster's single source of truth, then master the snapshot backup and restore procedure that appears on every CKA exam.",
      duration: "5 hours",
      difficulty: "advanced",
      learningObjectives: [
        "Explain why losing etcd means losing the entire cluster state",
        "Set ETCDCTL_API=3 and use the correct certificate flags for every etcdctl command",
        "Take a verified etcd snapshot backup to a specified path",
        "Restore an etcd snapshot and reconfigure the static pod manifest to use the new data directory",
      ],
      keyConcepts: [
        "etcd as distributed key-value store (Raft consensus)",
        "ETCDCTL_API=3 environment variable requirement",
        "etcd client TLS: --cacert, --cert, --key, --endpoints",
        "etcdctl endpoint health and endpoint status",
        "etcdctl snapshot save vs snapshot restore",
        "Halting the control plane during restore (move /etc/kubernetes/manifests)",
      ],
      practicePrompts: [
        "Without looking, write the full etcdctl snapshot save command with all certificate flags.",
        "What is the difference between snapshot save and snapshot restore in terms of what they do to the data directory?",
        "Why must you stop the API server before restoring an etcd snapshot?",
      ],
      masteryChecks: [
        "Can recite all 4 required etcdctl TLS flags and their certificate file paths from memory",
        "Can explain the Raft quorum formula and why a 3-node etcd cluster tolerates 1 failure",
        "Can describe the exact restore procedure: stop control plane → restore → update manifest → restart",
        "Can verify a snapshot with etcdctl snapshot status before using it",
        "Can explain the difference between etcd ports 2379 (client) and 2380 (peer)",
        "Can identify where etcd certificate files are located in a kubeadm cluster",
      ],
      theory: `> 🧠 **Brain Warm-Up**: etcd uses the Raft consensus algorithm. If you have a 3-node etcd cluster and 2 nodes fail, what happens to write operations? What about read operations with stale reads allowed? Think about the difference between availability and consistency before reading.

## etcd: The Cluster Brain

**etcd** is a distributed, strongly consistent key-value store. In Kubernetes, it is the only persistent storage layer — every object you create with kubectl (pods, deployments, secrets, configmaps) is ultimately a serialized protobuf blob stored in etcd. If etcd is lost without a backup, the cluster state is **gone permanently**.

### Raft Consensus and Quorum

etcd uses the **Raft algorithm** to keep all cluster members consistent:

\`\`\`
3-node etcd cluster (quorum = 2):

  Leader ◄──── heartbeat ────► Follower-1
     │                              │
     └──────── heartbeat ──────► Follower-2

  Write request → Leader proposes → 2/3 nodes acknowledge → committed
  1 node can fail and the cluster remains available

5-node etcd cluster (quorum = 3):
  Can tolerate 2 simultaneous failures
\`\`\`

### etcd Ports

| Port | Purpose |
|------|---------|
| 2379 | Client traffic (kube-apiserver → etcd, etcdctl → etcd) |
| 2380 | Peer-to-peer Raft replication (etcd nodes talk to each other) |

### ETCDCTL_API=3: Why It Matters

etcdctl supports two API versions. The v2 API is deprecated and behaves differently:

\`\`\`bash
# Wrong (v2 API — different command syntax, incompatible snapshots):
etcdctl backup ...

# Correct (v3 API — required for all Kubernetes operations):
export ETCDCTL_API=3
etcdctl snapshot save ...
\`\`\`

Always export ETCDCTL_API=3 at the start of any CKA task involving etcd.

### Certificate Flags (Memorize These)

All etcdctl v3 commands that contact the live etcd cluster require four TLS flags:

\`\`\`
--endpoints=https://127.0.0.1:2379          # etcd client port on control plane
--cacert=/etc/kubernetes/pki/etcd/ca.crt    # cluster CA for etcd
--cert=/etc/kubernetes/pki/etcd/server.crt  # client certificate
--key=/etc/kubernetes/pki/etcd/server.key   # client private key
\`\`\`

### Backup and Restore Flow

\`\`\`
BACKUP (no downtime required):
  etcdctl snapshot save /backup/etcd-snapshot.db
      │
      └─▶ etcd streams a consistent point-in-time snapshot to the file
          Cluster continues running normally during backup

RESTORE (requires control plane downtime):

  Step 1: Move static pod manifests out (stops apiserver, scheduler, controller-manager, etcd)
    mv /etc/kubernetes/manifests/*.yaml /tmp/k8s-manifests/

  Step 2: Restore snapshot to a new data directory
    etcdctl snapshot restore /backup/etcd-snapshot.db --data-dir=/var/lib/etcd-restore

  Step 3: Update etcd static pod manifest to use new data directory
    Edit /tmp/k8s-manifests/etcd.yaml: change --data-dir value

  Step 4: Move manifests back (kubelet restarts control plane)
    mv /tmp/k8s-manifests/*.yaml /etc/kubernetes/manifests/

  Step 5: Wait for API server to come back and verify
    kubectl get all
\`\`\`

### Why Stop the API Server During Restore?

If the API server is running while you restore etcd, it will continue writing new state to the old etcd instance. When you swap to the restored snapshot, those in-flight writes are lost and you have a split-brain scenario. Always halt the control plane first.`,
      labSteps: [
        {
          id: "p7-m2-s1",
          title: "Set API Version and Locate etcd Pod",
          instruction:
            "Export the required environment variable and verify the etcd pod is running in kube-system.",
          command:
            "export ETCDCTL_API=3 && kubectl get pods -n kube-system | grep etcd",
          output: ["etcd-node-1   1/1   Running   0   45d"],
          explanation:
            "ETCDCTL_API=3 must be set in every shell session before using etcdctl commands. The etcd pod in kube-system is a static pod managed directly by the kubelet — it does not go through the scheduler.",
          clusterState: {
            pods: [
              {
                id: "etcd",
                name: "etcd-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "etcd" },
                image: "registry.k8s.io/etcd:3.5.12",
                restarts: 0,
              },
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: ["ETCDCTL_API=3 exported", "etcd-node-1 confirmed Running"],
            highlightedComponent: "etcd",
          },
          tip: 'Add "export ETCDCTL_API=3" to your ~/.bashrc at the start of the CKA exam so it persists across new terminal sessions.',
        },
        {
          id: "p7-m2-s2",
          title: "Check etcd Endpoint Health",
          instruction:
            "Verify the etcd endpoint is reachable and healthy using etcdctl endpoint health.",
          command:
            "etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key endpoint health",
          output: [
            "https://127.0.0.1:2379 is healthy: successfully committed proposal: took = 1.823ms",
          ],
          explanation:
            "endpoint health performs a test write to verify the Raft log is accepting commits. If this fails, check whether the etcd pod is running and whether the certificate paths are correct.",
          clusterState: {
            pods: [
              {
                id: "etcd",
                name: "etcd-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "etcd" },
                image: "registry.k8s.io/etcd:3.5.12",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: ["etcd endpoint health check: healthy"],
            highlightedComponent: "etcd",
          },
          tip: 'Use "etcdctl endpoint status --write-out=table" to inspect the cluster ID, member ID, and Raft index — useful for confirming a restored snapshot is at the expected revision.',
        },
        {
          id: "p7-m2-s3",
          title: "Take an etcd Snapshot Backup",
          instruction:
            "Save a point-in-time snapshot of all cluster state to /tmp/etcd-backup.db.",
          command:
            "etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key snapshot save /tmp/etcd-backup.db",
          output: [
            '{"level":"info","ts":"2026-06-05T10:14:33.421Z","caller":"snapshot/v3_snapshot.go:65","msg":"created temporary db file","path":"/tmp/etcd-backup.db.part"}',
            '{"level":"info","ts":"2026-06-05T10:14:33.433Z","caller":"snapshot/v3_snapshot.go:269","msg":"saved","path":"/tmp/etcd-backup.db"}',
            "Snapshot saved at /tmp/etcd-backup.db",
          ],
          explanation:
            "snapshot save streams the current Raft snapshot from etcd to the local file. The cluster continues operating normally during the backup — no downtime required. The file contains all keys, values, and Raft metadata.",
          clusterState: {
            pods: [
              {
                id: "etcd",
                name: "etcd-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "etcd" },
                image: "registry.k8s.io/etcd:3.5.12",
                restarts: 0,
              },
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: [
              "Snapshot saved: /tmp/etcd-backup.db",
              "Cluster continued running during backup",
            ],
            highlightedComponent: "etcd",
          },
        },
        {
          id: "p7-m2-s4",
          title: "Verify Snapshot Integrity",
          instruction:
            "Check the snapshot metadata to confirm it is valid and note the revision number.",
          command:
            "etcdctl snapshot status /tmp/etcd-backup.db --write-out=table",
          output: [
            "+----------+----------+------------+------------+",
            "|   HASH   | REVISION | TOTAL KEYS | TOTAL SIZE |",
            "+----------+----------+------------+------------+",
            "| a3f8c2d1 |    18423 |        832 |     4.1 MB |",
            "+----------+----------+------------+------------+",
          ],
          explanation:
            "snapshot status reads the snapshot file without contacting the live etcd cluster — no certificate flags needed. The revision number and total keys help you confirm the snapshot was taken at the expected point in time. Always verify before storing a backup.",
          clusterState: {
            pods: [
              {
                id: "etcd",
                name: "etcd-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "etcd" },
                image: "registry.k8s.io/etcd:3.5.12",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: [
              "Snapshot status: 832 keys at revision 18423, 4.1 MB — valid",
            ],
            highlightedComponent: "etcd",
          },
          tip: "The HASH field is an xxhash of the snapshot content. If you copy the file to another host, run snapshot status again to confirm the hash matches — bit-flip corruption is rare but possible.",
        },
        {
          id: "p7-m2-s5",
          title: "Restore the Snapshot to a New Data Directory",
          instruction:
            "Restore the etcd snapshot to a fresh data directory. This command does not require certificate flags as it operates entirely on a local file.",
          command:
            "etcdctl snapshot restore /tmp/etcd-backup.db --data-dir=/var/lib/etcd-restore",
          output: [
            '{"level":"info","ts":"2026-06-05T10:22:11.334Z","msg":"restoring snapshot","path":"/tmp/etcd-backup.db","wal-dir":"/var/lib/etcd-restore/member/wal","data-dir":"/var/lib/etcd-restore","snap-dir":"/var/lib/etcd-restore/member/snap"}',
            '{"level":"info","ts":"2026-06-05T10:22:11.798Z","msg":"restored snapshot","path":"/tmp/etcd-backup.db","wal-dir":"/var/lib/etcd-restore/member/wal","data-dir":"/var/lib/etcd-restore","snap-dir":"/var/lib/etcd-restore/member/snap"}',
          ],
          explanation:
            "snapshot restore reads the snapshot file and writes a fresh etcd data directory to the specified --data-dir. It does NOT modify the running etcd instance. After this, you must update the etcd static pod manifest to point --data-dir at /var/lib/etcd-restore and restart the control plane.",
          clusterState: {
            pods: [
              {
                id: "etcd",
                name: "etcd-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Pending",
                labels: { component: "etcd" },
                image: "registry.k8s.io/etcd:3.5.12",
                restarts: 1,
              },
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Pending",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: [
              "Snapshot restored to /var/lib/etcd-restore",
              "Control plane paused — manifests moved out",
            ],
            highlightedComponent: "etcd",
          },
          tip: "In a multi-member etcd cluster, you must run etcdctl snapshot restore separately on each member with a different --name, --initial-advertise-peer-urls, and --initial-cluster for each node. For single-node kubeadm clusters (CKA exam), the simple form above is sufficient.",
        },
        {
          id: "p7-m2-s6",
          title: "Verify Cluster Recovery",
          instruction:
            "After updating the etcd manifest to use --data-dir=/var/lib/etcd-restore and moving manifests back, verify the cluster is fully operational.",
          command: "kubectl get all -A",
          output: [
            "NAMESPACE     NAME                                       READY   STATUS    RESTARTS   AGE",
            "kube-system   pod/coredns-78fcd69978-a1b2c               1/1     Running   0          46d",
            "kube-system   pod/etcd-node-1                            1/1     Running   0          1m",
            "kube-system   pod/kube-apiserver-node-1                  1/1     Running   0          1m",
            "kube-system   pod/kube-controller-manager-node-1         1/1     Running   0          1m",
            "kube-system   pod/kube-scheduler-node-1                  1/1     Running   0          1m",
            "default       pod/nginx-deployment-6d6565499c-abc12      1/1     Running   0          30d",
            "",
            "NAMESPACE   NAME                 TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE",
            "default     service/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   46d",
          ],
          explanation:
            "The cluster has recovered all state from the snapshot. Workloads that existed at the time of the backup are running again. Any resources created after the snapshot was taken are permanently lost — this is expected behavior for a point-in-time restore.",
          clusterState: {
            pods: [
              {
                id: "etcd",
                name: "etcd-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "etcd" },
                image: "registry.k8s.io/etcd:3.5.12",
                restarts: 0,
              },
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
              {
                id: "nginx-1",
                name: "nginx-deployment-6d6565499c-abc12",
                namespace: "default",
                node: "node-2",
                status: "Running",
                labels: { app: "nginx" },
                image: "nginx:1.27",
                restarts: 0,
              },
            ],
            services: [
              {
                id: "kubernetes",
                name: "kubernetes",
                namespace: "default",
                type: "ClusterIP",
                selector: {},
                port: 443,
                clusterIP: "10.96.0.1",
              },
            ],
            deployments: [
              {
                id: "nginx-deploy",
                name: "nginx-deployment",
                namespace: "default",
                replicas: 1,
                availableReplicas: 1,
                image: "nginx:1.27",
              },
            ],
            namespaces: ["default", "kube-system"],
            events: [
              "etcd restored from snapshot",
              "All control plane components Running",
              "Workload state recovered from backup point",
            ],
            highlightedComponent: "etcd",
          },
        },
      ],
      quiz: [
        {
          id: "p7-m2-q1",
          question:
            "Which environment variable must be set before running any etcdctl v3 commands, and what value should it have?",
          options: [
            "ETCD_VERSION=3",
            "ETCDCTL_API=3",
            "ETCD_API_VERSION=v3",
            "ETCDCTL_VERSION=v3alpha",
          ],
          answer: 1,
          explanation:
            'ETCDCTL_API=3 switches etcdctl from the legacy v2 API to the v3 API. The v3 API is required for snapshot operations and all modern Kubernetes clusters. Without it, commands like "snapshot save" either fail or behave differently.',
        },
        {
          id: "p7-m2-q2",
          question:
            "A 3-node etcd cluster has 2 nodes fail simultaneously. What is the state of the cluster?",
          options: [
            "The cluster continues read and write operations normally on the single surviving node",
            "The cluster loses quorum — write operations fail but reads may succeed depending on configuration",
            "The cluster automatically elects a new leader from the single surviving node",
            "The cluster immediately restores itself from the most recent automatic snapshot",
          ],
          answer: 1,
          explanation:
            "A 3-node etcd cluster requires a quorum of 2 nodes to commit writes (Raft majority = floor(3/2)+1 = 2). With only 1 node remaining, the cluster cannot achieve quorum, so writes fail. Stale reads may still be served by the surviving node depending on the read consistency mode.",
        },
        {
          id: "p7-m2-q3",
          question:
            "Which port do you specify in --endpoints when running etcdctl against a standard kubeadm cluster?",
          options: [
            "https://127.0.0.1:2380",
            "https://127.0.0.1:2379",
            "https://127.0.0.1:6443",
            "https://127.0.0.1:10250",
          ],
          answer: 1,
          explanation:
            "Port 2379 is the etcd client port used by the kube-apiserver and etcdctl for all read/write operations. Port 2380 is reserved for inter-node Raft peer replication. Port 6443 is the Kubernetes API server. Port 10250 is the kubelet.",
        },
        {
          id: "p7-m2-q4",
          question:
            "Does etcdctl snapshot restore require the four TLS certificate flags (--cacert, --cert, --key, --endpoints)?",
          options: [
            "Yes — it must authenticate to the running etcd instance to restore data",
            "No — snapshot restore operates entirely on a local file and does not contact the live etcd cluster",
            "Only --cacert is required for signature verification",
            "Yes, but only in multi-node clusters",
          ],
          answer: 1,
          explanation:
            "etcdctl snapshot restore reads the snapshot file from disk and writes a new data directory. It never contacts the live etcd cluster, so no TLS flags or --endpoints are needed. The certificate flags are only required for commands that connect to the running etcd process.",
        },
        {
          id: "p7-m2-q5",
          question:
            "Why must the kube-apiserver be stopped before performing an etcd snapshot restore?",
          options: [
            "The API server holds an exclusive file lock on the etcd data directory",
            "If the API server continues writing to the old etcd while you restore a snapshot, the in-flight writes are lost and the cluster enters an inconsistent state",
            "The restore command requires port 6443 to be free",
            "The API server deletes snapshot files if it detects they are being used",
          ],
          answer: 1,
          explanation:
            "Stopping the API server (by moving its static pod manifest) halts all writes to etcd. This ensures a clean boundary between the pre-restore state and the post-restore state. If the API server keeps writing during the restore, objects created after the snapshot timestamp will disappear when the restored etcd comes online, causing objects the API server believes exist to be absent from etcd.",
        },
        {
          id: "p7-m2-q6",
          question:
            "After running etcdctl snapshot restore --data-dir=/var/lib/etcd-restore, what additional step is required before the cluster uses the restored data?",
          options: [
            "Run etcdctl snapshot apply to activate the restored data",
            "Update the etcd static pod manifest to set --data-dir=/var/lib/etcd-restore, then restore the manifest to /etc/kubernetes/manifests/",
            "Restart the kubelet service on all worker nodes",
            "Run kubeadm reset and then kubeadm init again",
          ],
          answer: 1,
          explanation:
            "The restore command only writes a new data directory on disk. The running (or restarting) etcd process will still point to the old --data-dir until you update the static pod manifest. Edit the etcd.yaml manifest to change --data-dir, then move it back to /etc/kubernetes/manifests/ so the kubelet restarts etcd with the restored data.",
        },
      ],
      exercises: [
        {
          id: "p7-m2-e1",
          title: "Full etcd backup and verify workflow",
          kind: "guided",
          goal: "Execute the complete etcd backup procedure and verify the snapshot is valid, simulating the most common CKA exam etcd task.",
          commands: [
            "export ETCDCTL_API=3",
            "kubectl get pods -n kube-system -l component=etcd",
            "etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key endpoint health",
            "etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key snapshot save /tmp/etcd-backup.db",
            "etcdctl snapshot status /tmp/etcd-backup.db --write-out=table",
            "ls -lh /tmp/etcd-backup.db",
          ],
          verify: [
            "etcd endpoint health check returns healthy",
            "Snapshot file created at /tmp/etcd-backup.db",
            "snapshot status shows valid HASH, REVISION, TOTAL KEYS",
          ],
          expectedOutcome:
            "etcd backup procedure confirmed and all certificate flags memorized.",
          cleanup: ["rm -f /tmp/etcd-backup.db"],
        },
        {
          id: "p7-m2-e2",
          title: "Inspect etcd keys stored by Kubernetes",
          kind: "challenge",
          goal: "Use etcdctl get with a prefix to browse the raw keys Kubernetes stores in etcd, understanding the key structure.",
          commands: [
            "export ETCDCTL_API=3",
            "etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key get / --prefix --keys-only | head -30",
            "etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key get /registry/namespaces/ --prefix --keys-only",
            "etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key endpoint status --write-out=table",
          ],
          verify: [
            "Keys follow /registry/<resource-type>/<namespace>/<name> pattern",
            "Namespaces visible under /registry/namespaces/",
            "endpoint status shows cluster member ID, Raft index, leader status",
          ],
          expectedOutcome: "etcd key structure and query patterns understood.",
          cleanup: [],
        },
      ],
    },
    // ─── Module 3: Upgrading a Cluster with kubeadm ──────────────────────────
    {
      id: "p7-m3",
      slug: "cluster-upgrades",
      title: "Upgrading a Cluster with kubeadm",
      description:
        "Execute a safe, one-minor-version-at-a-time cluster upgrade: control plane first, then workers — with zero application downtime.",
      duration: "5 hours",
      difficulty: "advanced",
      learningObjectives: [
        "Explain why only one minor version increment is allowed per upgrade",
        "Describe the full upgrade sequence: kubeadm → control plane → drain → kubelet/kubectl → uncordon",
        "Perform a control plane upgrade with kubeadm upgrade apply",
        "Drain a node safely, upgrade the kubelet, and uncordon to restore scheduling",
      ],
      keyConcepts: [
        "Skew policy: only one minor version at a time (1.28 → 1.29, not 1.28 → 1.30)",
        "kubeadm upgrade plan vs kubeadm upgrade apply",
        "Node drain: evicts non-daemonset pods, marks SchedulingDisabled",
        "apt-mark hold/unhold for kubelet and kubeadm version pinning",
        "systemctl daemon-reload && systemctl restart kubelet after upgrade",
        "kubectl uncordon to restore scheduling after kubelet upgrade",
      ],
      practicePrompts: [
        "What happens to workloads on a node while it is being drained during upgrade?",
        "Why do you need to upgrade kubeadm before running kubeadm upgrade apply?",
        "After upgrading the kubelet on a worker node, what two systemctl commands must you run?",
      ],
      masteryChecks: [
        "Can explain the Kubernetes version skew policy and why it limits upgrades to one minor version",
        "Can list the full upgrade sequence for a control plane node in order",
        "Can describe what kubectl drain does and why --ignore-daemonsets is typically required",
        "Can explain the difference between kubeadm upgrade plan and kubeadm upgrade apply",
        "Can reproduce the worker node upgrade sequence: drain → apt upgrade kubelet+kubectl → daemon-reload → restart kubelet → uncordon",
        "Can verify upgrade success with kubectl get nodes and confirm version numbers",
      ],
      theory: `> 🧠 **Brain Warm-Up**: Kubernetes components tolerate limited version skew between each other. The kubelet on a node may be one minor version behind the API server, but not two. What would happen if you upgraded a 5-node cluster's control plane from 1.28 to 1.30 in one jump, skipping 1.29? Think about what breaks before reading.

## Kubernetes Upgrade Strategy

Kubernetes follows a strict **N-1 version skew policy** between components. You must upgrade one minor version at a time:

\`\`\`
Allowed:   v1.28 → v1.29 → v1.30
Forbidden: v1.28 → v1.30   (skips v1.29)
\`\`\`

### Why One Minor Version at a Time?

The kube-apiserver and kubelet may differ by at most one minor version. If you skip a version:
- The kubeadm upgrade apply logic may not have migration steps for the skipped version
- API deprecations that were removed in the skipped version cause silent failures
- etcd schema changes may be incompatible across two minor versions

### Upgrade Sequence Overview

\`\`\`
Control Plane Node:
  ① apt-mark unhold kubeadm && apt-get install kubeadm=1.30.0-00
  ② kubeadm upgrade plan              ← shows available upgrade targets
  ③ kubeadm upgrade apply v1.30.0    ← upgrades: apiserver, controller-manager,
  │                                      scheduler, etcd manifests, and kubeadm addons
  ④ apt-get install kubelet=1.30.0-00 kubectl=1.30.0-00
  ⑤ systemctl daemon-reload && systemctl restart kubelet
  ⑥ kubectl get nodes                 ← control plane node shows v1.30.0

Worker Nodes (repeat for each):
  ① kubectl drain <node> --ignore-daemonsets --delete-emptydir-data
  ② On the worker: apt-get install kubelet=1.30.0-00 kubectl=1.30.0-00
  ③ systemctl daemon-reload && systemctl restart kubelet
  ④ kubectl uncordon <node>           ← scheduling resumes
\`\`\`

### What kubeadm upgrade apply Does

kubeadm upgrade apply updates the control plane static pod manifests and the cluster ConfigMaps (kubeadm-config, kubelet-config) but does **not** upgrade the kubelet binary. The kubelet must be upgraded separately on every node.

### Node Drain Deep Dive

\`\`\`
kubectl drain node-2 --ignore-daemonsets --delete-emptydir-data
    │
    ├─ Cordon the node (SchedulingDisabled) — no new pods land here
    ├─ Evict all regular pods (graceful termination, PodDisruptionBudgets respected)
    ├─ --ignore-daemonsets: skip DaemonSet pods (they can't be moved anyway)
    └─ --delete-emptydir-data: force-evict pods using emptyDir (data is lost)

Result: node appears "Ready,SchedulingDisabled" in kubectl get nodes
\`\`\`

### Comparison: Control Plane vs Worker Upgrade

| Step | Control Plane | Worker Node |
|------|--------------|-------------|
| Update kubeadm | Yes (required first) | No (kubeadm upgrade node, not apply) |
| Run upgrade command | kubeadm upgrade apply | kubeadm upgrade node |
| Drain before upgrade | Optional (taint manually) | Required |
| Upgrade kubelet | Yes | Yes |
| Uncordon after | N/A if not drained | Yes |`,
      labSteps: [
        {
          id: "p7-m3-s1",
          title: "Check Current Cluster Version",
          instruction:
            "Verify the current version of all nodes before planning the upgrade.",
          command: "kubectl get nodes",
          output: [
            "NAME     STATUS   ROLES           AGE   VERSION",
            "node-1   Ready    control-plane   45d   v1.29.4",
            "node-2   Ready    <none>          45d   v1.29.4",
          ],
          explanation:
            "Both nodes are running v1.29.4. The upgrade target is v1.30.0 — a single minor version increment, which is allowed by the Kubernetes version skew policy.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.29.4",
                restarts: 0,
              },
              {
                id: "nginx-1",
                name: "nginx-deploy-abc12",
                namespace: "default",
                node: "node-2",
                status: "Running",
                labels: { app: "nginx" },
                image: "nginx:1.27",
                restarts: 0,
              },
              {
                id: "nginx-2",
                name: "nginx-deploy-def34",
                namespace: "default",
                node: "node-2",
                status: "Running",
                labels: { app: "nginx" },
                image: "nginx:1.27",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [
              {
                id: "nginx-deploy",
                name: "nginx-deploy",
                namespace: "default",
                replicas: 2,
                availableReplicas: 2,
                image: "nginx:1.27",
              },
            ],
            namespaces: ["default", "kube-system"],
            events: ["Cluster at v1.29.4. Upgrade target: v1.30.0"],
            highlightedComponent: "apiserver",
          },
        },
        {
          id: "p7-m3-s2",
          title: "Check Available kubeadm Versions",
          instruction:
            "Use apt-cache madison to see what kubeadm versions are available in the package repository.",
          command: "apt-cache madison kubeadm | head -5",
          output: [
            "kubeadm | 1.30.2-1.1 | https://pkgs.k8s.io/core:/stable:/v1.30/deb  Packages",
            "kubeadm | 1.30.1-1.1 | https://pkgs.k8s.io/core:/stable:/v1.30/deb  Packages",
            "kubeadm | 1.30.0-1.1 | https://pkgs.k8s.io/core:/stable:/v1.30/deb  Packages",
          ],
          explanation:
            "Before upgrading, check which versions are available. You must add the target minor version repository (pkgs.k8s.io/core:/stable:/v1.30) to apt sources before v1.30.x packages become visible. The CKA exam environment typically has this pre-configured.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.29.4",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: ["v1.30.x packages available in repository"],
          },
          tip: 'If v1.30 packages are not found, add the repo: echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /" | sudo tee /etc/apt/sources.list.d/kubernetes.list && apt-get update',
        },
        {
          id: "p7-m3-s3",
          title: "Review the Upgrade Plan",
          instruction:
            "Run kubeadm upgrade plan to see what components will be upgraded and confirm there are no blockers.",
          command: "kubeadm upgrade plan",
          output: [
            "Components that must be upgraded manually after you have upgraded the control plane with 'kubeadm upgrade apply':",
            "COMPONENT   NODE     CURRENT    TARGET",
            "kubelet     node-1   v1.29.4    v1.30.0",
            "kubelet     node-2   v1.29.4    v1.30.0",
            "",
            "Upgrade to the latest stable version:",
            "COMPONENT                 CURRENT    TARGET",
            "kube-apiserver            v1.29.4    v1.30.0",
            "kube-controller-manager   v1.29.4    v1.30.0",
            "kube-scheduler            v1.29.4    v1.30.0",
            "kube-proxy                v1.29.4    v1.30.0",
            "CoreDNS                   v1.11.1    v1.11.3",
            "etcd                      3.5.12     3.5.15",
            "",
            "You can now apply the upgrade by executing the following command:",
            "  kubeadm upgrade apply v1.30.0",
          ],
          explanation:
            "kubeadm upgrade plan checks the cluster state and shows the upgrade path. It separates components that kubeadm handles automatically (apiserver, scheduler, controller-manager, etcd) from those you must upgrade manually (kubelet on every node).",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.29.4",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: ["Upgrade plan verified. No blockers. Target: v1.30.0"],
            highlightedComponent: "apiserver",
          },
        },
        {
          id: "p7-m3-s4",
          title: "Apply the Control Plane Upgrade",
          instruction:
            "Upgrade the kubeadm binary to v1.30.0, then apply the control plane upgrade.",
          command:
            "apt-mark unhold kubeadm && apt-get update && apt-get install -y kubeadm=1.30.0-1.1 && apt-mark hold kubeadm && kubeadm upgrade apply v1.30.0",
          output: [
            "Canceled hold on kubeadm.",
            "Fetched 12.4 MB in 3s",
            "Setting up kubeadm (1.30.0-1.1) ...",
            "kubeadm set on hold.",
            "[upgrade/config] Making sure the configuration is correct:",
            "[upgrade/prepull] Pulling images required for setting up a Kubernetes cluster",
            '[upgrade/apply] Upgrading your Static Pod-hosted control plane to version "v1.30.0"...',
            '[upgrade/staticpods] Writing new Static Pod manifests to "/etc/kubernetes/manifests"',
            "[upgrade/staticpods] Waiting for the kubelet to restart the component",
            "[apiclient] Found 1 Pods for label selector component=kube-apiserver",
            '[upgrade/staticpods] Component "kube-apiserver" upgraded successfully!',
            '[upgrade/staticpods] Component "kube-controller-manager" upgraded successfully!',
            '[upgrade/staticpods] Component "kube-scheduler" upgraded successfully!',
            "[upgrade/etcd] Upgrading to TLS for etcd",
            "[upgrade/etcd] Non fatal issue encountered during upgrade: ...",
            "",
            '[upgrade/successful] SUCCESS! Your cluster was upgraded to "v1.30.0". Enjoy!',
            "",
            "[upgrade/kubelet] Now that your control plane is upgraded, please proceed with upgrading your kubelets if you wish.",
          ],
          explanation:
            "kubeadm upgrade apply rewrites the static pod manifests with the new image tags and waits for kubelet to restart each component. The kubelet on node-1 is still at v1.29.4 and must be upgraded separately in the next step.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 1,
              },
              {
                id: "etcd",
                name: "etcd-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "etcd" },
                image: "registry.k8s.io/etcd:3.5.15",
                restarts: 1,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: [
              "Control plane upgraded to v1.30.0",
              "kube-apiserver, scheduler, controller-manager, etcd: v1.30.0",
            ],
            highlightedComponent: "apiserver",
          },
          tip: "After kubeadm upgrade apply, run kubectl get nodes — node-1 will still show v1.29.4 because the kubelet binary has not been updated yet. The node version reflects the kubelet version, not the API server version.",
        },
        {
          id: "p7-m3-s5",
          title: "Drain and Upgrade Worker Node",
          instruction:
            "Drain node-2 to evict workloads, then upgrade the kubelet and kubectl on the worker.",
          command:
            "kubectl drain node-2 --ignore-daemonsets --delete-emptydir-data && apt-mark unhold kubelet kubectl && apt-get install -y kubelet=1.30.0-1.1 kubectl=1.30.0-1.1 && apt-mark hold kubelet kubectl",
          output: [
            "node/node-2 cordoned",
            "WARNING: ignoring DaemonSet-managed Pods: kube-system/kube-flannel-ds-m7n8o, kube-system/kube-proxy-s4t5u",
            "evicting pod default/nginx-deploy-abc12",
            "evicting pod default/nginx-deploy-def34",
            "pod/nginx-deploy-abc12 evicted",
            "pod/nginx-deploy-def34 evicted",
            "node/node-2 drained",
            "",
            "Canceled hold on kubelet.",
            "Canceled hold on kubectl.",
            "Setting up kubelet (1.30.0-1.1) ...",
            "Setting up kubectl (1.30.0-1.1) ...",
            "kubelet set on hold.",
            "kubectl set on hold.",
          ],
          explanation:
            "Draining node-2 gracefully terminates all evictable pods (the Deployment reschedules them on node-1). apt-mark unhold releases the package version pin so the upgrade can proceed. After installing, apt-mark hold re-pins the version to prevent unintended upgrades.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
              {
                id: "nginx-1",
                name: "nginx-deploy-abc12",
                namespace: "default",
                node: "node-1",
                status: "Running",
                labels: { app: "nginx" },
                image: "nginx:1.27",
                restarts: 0,
              },
              {
                id: "nginx-2",
                name: "nginx-deploy-def34",
                namespace: "default",
                node: "node-1",
                status: "Running",
                labels: { app: "nginx" },
                image: "nginx:1.27",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [
              {
                id: "nginx-deploy",
                name: "nginx-deploy",
                namespace: "default",
                replicas: 2,
                availableReplicas: 2,
                image: "nginx:1.27",
              },
            ],
            namespaces: ["default", "kube-system"],
            events: [
              "node-2 cordoned (SchedulingDisabled)",
              "Workloads rescheduled to node-1",
              "kubelet and kubectl upgraded to v1.30.0 on node-2",
            ],
            highlightedComponent: "kubelet",
          },
        },
        {
          id: "p7-m3-s6",
          title: "Restart Kubelet and Uncordon Worker",
          instruction:
            "Reload systemd and restart the upgraded kubelet on node-2, then uncordon the node to restore scheduling.",
          command:
            "systemctl daemon-reload && systemctl restart kubelet && kubectl uncordon node-2",
          output: [
            "# (systemctl commands produce no output on success)",
            "node/node-2 uncordoned",
          ],
          explanation:
            "systemctl daemon-reload is required when the kubelet service unit file may have changed. After restarting, kubelet registers with the API server at the new version. kubectl uncordon removes the SchedulingDisabled taint, allowing pods to be scheduled on node-2 again.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
              {
                id: "nginx-1",
                name: "nginx-deploy-abc12",
                namespace: "default",
                node: "node-1",
                status: "Running",
                labels: { app: "nginx" },
                image: "nginx:1.27",
                restarts: 0,
              },
              {
                id: "nginx-2",
                name: "nginx-deploy-def34",
                namespace: "default",
                node: "node-2",
                status: "Running",
                labels: { app: "nginx" },
                image: "nginx:1.27",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [
              {
                id: "nginx-deploy",
                name: "nginx-deploy",
                namespace: "default",
                replicas: 2,
                availableReplicas: 2,
                image: "nginx:1.27",
              },
            ],
            namespaces: ["default", "kube-system"],
            events: [
              "kubelet restarted on node-2",
              "node-2 uncordoned — scheduling restored",
              "Both nodes now at v1.30.0",
            ],
          },
        },
      ],
      quiz: [
        {
          id: "p7-m3-q1",
          question:
            "You are running Kubernetes v1.28.5. Which is the correct next upgrade target according to the Kubernetes version skew policy?",
          options: [
            "v1.30.0 (latest stable release)",
            "v1.29.x (the next minor version)",
            "v1.28.6 (latest patch of current minor)",
            "Any version as long as it is not more than 2 minor versions ahead",
          ],
          answer: 1,
          explanation:
            "Kubernetes only supports upgrading one minor version at a time. From v1.28, you must go to v1.29 first, even if v1.30 is available. This ensures kubeadm can apply all required migration steps and that the version skew between components stays within the supported N-1 range.",
        },
        {
          id: "p7-m3-q2",
          question:
            'What does "kubectl drain node-2 --ignore-daemonsets" do to the node?',
          options: [
            "Deletes the node from the cluster permanently",
            "Cordons the node (marks it SchedulingDisabled) and evicts all non-DaemonSet pods gracefully",
            "Stops the kubelet service on node-2",
            "Removes all DaemonSet pods from the node",
          ],
          answer: 1,
          explanation:
            "kubectl drain first cordons the node (preventing new pods from being scheduled there), then evicts all pods that are not managed by DaemonSets. DaemonSets are skipped with --ignore-daemonsets because they cannot be evicted — they exist on every node by definition.",
        },
        {
          id: "p7-m3-q3",
          question:
            "After running kubeadm upgrade apply v1.30.0 on the control plane, kubectl get nodes still shows node-1 at v1.29.4. What must you do next?",
          options: [
            "Run kubeadm upgrade apply again with --force",
            "Upgrade the kubelet binary on node-1 and restart it with systemctl daemon-reload && systemctl restart kubelet",
            "Delete and re-create the node-1 object in Kubernetes",
            "Wait — the version will update automatically after 5 minutes",
          ],
          answer: 1,
          explanation:
            "The VERSION column in kubectl get nodes reflects the kubelet binary version, not the API server version. kubeadm upgrade apply only updates the control plane static pod manifests. You must separately install the new kubelet package on each node and restart the service.",
        },
        {
          id: "p7-m3-q4",
          question:
            "Which kubeadm command shows you what will be upgraded before you commit to running the upgrade?",
          options: [
            "kubeadm upgrade diff",
            "kubeadm upgrade plan",
            "kubeadm upgrade check",
            "kubeadm version --check-upgrade",
          ],
          answer: 1,
          explanation:
            "kubeadm upgrade plan reads the current cluster state and the available versions in the repository, then prints a table showing every component with its current and target version. It performs no changes and is safe to run at any time.",
        },
        {
          id: "p7-m3-q5",
          question:
            "After upgrading and restarting the kubelet on a worker node, what kubectl command restores pod scheduling to that node?",
          options: [
            "kubectl label node node-2 scheduling=enabled",
            "kubectl uncordon node-2",
            "kubectl taint node node-2 node.kubernetes.io/unschedulable:NoSchedule-",
            'kubectl patch node node-2 -p \'{"spec":{"unschedulable":false}}\'',
          ],
          answer: 1,
          explanation:
            "kubectl uncordon is the standard command to remove the SchedulingDisabled status set by kubectl drain or kubectl cordon. While the patch command would also technically work, kubectl uncordon is the idiomatic and exam-expected approach.",
        },
        {
          id: "p7-m3-q6",
          question:
            "Why must you upgrade kubeadm to the target version BEFORE running kubeadm upgrade apply?",
          options: [
            "kubeadm upgrade apply reads the new version from the kubeadm binary itself",
            "The old kubeadm binary does not know about the new version's required migration steps, configuration changes, and manifest templates",
            "The API server refuses upgrade requests from older kubeadm versions",
            "It is just a convention — you could also upgrade kubeadm after applying the upgrade",
          ],
          answer: 1,
          explanation:
            "Each version of kubeadm contains the manifest templates, migration logic, and configuration schema for its own release. Running v1.29 kubeadm upgrade apply v1.30.0 would either fail or produce incorrect manifests because v1.29 kubeadm has no knowledge of v1.30 requirements.",
        },
      ],
      exercises: [
        {
          id: "p7-m3-e1",
          title: "Practice upgrade sequence dry run",
          kind: "guided",
          goal: "Walk through the full upgrade workflow commands without actually upgrading, to memorize the sequence for the CKA exam.",
          commands: [
            "kubectl get nodes",
            'kubectl get pods -n kube-system -o wide | grep -E "apiserver|etcd|scheduler|controller"',
            'kubeadm upgrade plan 2>/dev/null || echo "Run on control plane node with kubeadm installed"',
            'kubectl drain node-2 --ignore-daemonsets --delete-emptydir-data --dry-run 2>/dev/null || echo "kubectl drain dry-run: node-2"',
            "kubectl get nodes",
          ],
          verify: [
            "Current node versions visible",
            "kubeadm upgrade plan shows component versions (or prints expected command)",
            "drain --dry-run shows which pods would be evicted",
          ],
          expectedOutcome:
            "Upgrade command sequence memorized. Ready to execute in CKA exam environment.",
          cleanup: [],
        },
        {
          id: "p7-m3-e2",
          title: "Simulate upgrade failure recovery",
          kind: "debug",
          goal: "Identify what to check if a node is stuck in SchedulingDisabled after an upgrade.",
          commands: [
            "kubectl get nodes",
            'kubectl describe node $(kubectl get nodes --no-headers | grep SchedulingDisabled | awk "{print \\$1}" | head -1) 2>/dev/null | grep -E "Taints|Conditions" -A5',
            'kubectl get nodes --no-headers | grep SchedulingDisabled | awk "{print \\$1}" | xargs -I{} kubectl uncordon {} 2>/dev/null || echo "No SchedulingDisabled nodes found"',
            "kubectl get nodes",
          ],
          verify: [
            "SchedulingDisabled nodes identified via describe",
            "kubectl uncordon removes scheduling restriction",
            "All nodes back to Ready status",
          ],
          expectedOutcome: "Recovery from stuck drain/upgrade state confirmed.",
          cleanup: [],
        },
      ],
    },
    // ─── Module 4: PKI & Certificate Management ──────────────────────────────
    {
      id: "p7-m4",
      slug: "certificate-management",
      title: "PKI & Certificate Management",
      description:
        "Understand the Kubernetes PKI hierarchy, inspect certificate expiry dates, renew certificates before they expire, and trace how kubeconfig files embed certificates for component authentication.",
      duration: "5 hours",
      difficulty: "advanced",
      learningObjectives: [
        "List the certificate files generated by kubeadm and explain what each authenticates",
        "Use kubeadm certs check-expiration to audit all certificate expiry dates",
        "Renew all or individual certificates with kubeadm certs renew",
        "Inspect certificate validity with openssl and understand Subject/SAN fields",
        "Explain the difference between certificate auth and ServiceAccount token auth",
      ],
      keyConcepts: [
        "Kubernetes PKI hierarchy: cluster CA, etcd CA, front-proxy CA",
        "/etc/kubernetes/pki/ layout and file naming conventions",
        "kubeadm certs check-expiration: annual renewal cycle",
        "kubeadm certs renew all vs renew <component>",
        "ServiceAccount tokens vs X.509 certificate authentication",
        "kubeconfig files: admin.conf, controller-manager.conf, scheduler.conf, kubelet.conf",
      ],
      practicePrompts: [
        "Without looking, name the three root CAs that kubeadm generates and what each one signs.",
        "What happens to a cluster when all certificates expire simultaneously?",
        "How does the kube-controller-manager authenticate to the kube-apiserver?",
      ],
      masteryChecks: [
        "Can describe the three CA hierarchies in a kubeadm cluster (cluster CA, etcd CA, front-proxy CA)",
        "Can run kubeadm certs check-expiration and interpret the output table",
        "Can use openssl x509 to inspect a certificate validity period and Subject Alternative Names",
        "Can identify which kubeconfig file each control plane component uses",
        "Can explain when to use kubeadm certs renew all vs renewing individual certificates",
        "Can explain the difference between a ServiceAccount JWT token and an X.509 client certificate",
      ],
      theory: `> 🧠 **Brain Warm-Up**: A kubeadm cluster was bootstrapped one year ago and no certificate maintenance has been performed. The cluster suddenly becomes unreachable — kubectl commands return "tls: certificate has expired or is not yet valid". Which certificates likely expired, and what is the fastest path to recovery? Think before reading.

## Kubernetes PKI Architecture

When kubeadm init runs, it generates a complete Public Key Infrastructure with three separate root Certificate Authorities:

\`\`\`
/etc/kubernetes/pki/
│
├─ ca.crt / ca.key              ← Cluster root CA
│   Signs: apiserver.crt, apiserver-kubelet-client.crt,
│          all kubeconfig client certs (admin, controller-manager, scheduler)
│
├─ etcd/
│   ├─ ca.crt / ca.key          ← etcd root CA (separate from cluster CA)
│   │   Signs: etcd server cert, etcd peer certs, apiserver-etcd-client.crt
│   ├─ server.crt / server.key
│   ├─ peer.crt / peer.key
│   └─ healthcheck-client.crt
│
├─ front-proxy-ca.crt / front-proxy-ca.key  ← Front proxy CA
│   Signs: front-proxy-client.crt (used by aggregation layer)
│
└─ sa.key / sa.pub              ← ServiceAccount signing keypair
                                   (NOT a certificate — used to sign/verify JWT tokens)
\`\`\`

### Certificate Lifetime

By default, kubeadm issues certificates with a **1-year validity period**. The cluster CA itself has a **10-year** validity. This means:
- Certificates must be renewed before they expire (ideally 30–60 days in advance)
- kubeadm certs check-expiration shows days until expiry for every certificate
- kubeadm certs renew all renews everything in one command, then each component must be restarted

### Certificate Authentication vs ServiceAccount Tokens

| Aspect | X.509 Certificate | ServiceAccount Token (JWT) |
|--------|-------------------|---------------------------|
| Who uses it | Control plane components, human admins | Pods, in-cluster apps |
| Storage | /etc/kubernetes/pki/ and kubeconfigs | Projected into pods as files |
| Expiry | 1 year (kubeadm default) | Configurable, auto-rotated by kubelet |
| Validation | TLS handshake, cert chain verification | OIDC JWT signature verification by apiserver |
| Rotation | Manual (kubeadm certs renew) | Automatic (kubernetes.io/service-account-token) |

### kubeconfig Files and Certificate Embedding

Each kubeconfig file embeds:
- The cluster CA cert (to verify the API server's TLS cert)
- A client certificate and key (base64 encoded)
- The API server URL

\`\`\`
kubectl config view --raw
    │
    └─ certificate-authority-data: <base64 of ca.crt>
       client-certificate-data: <base64 of apiserver-kubelet-client.crt>
       client-key-data: <base64 of key>
\`\`\`

### Recovery from Expired Certificates

If certificates expire:
1. \`kubeadm certs renew all\` — regenerates all certificates
2. Restart each static pod (move manifests out and back in, or: \`crictl rm --all\`)
3. Regenerate kubeconfigs if needed: \`kubeadm init phase kubeconfig all\`
4. Copy the new admin.conf to ~/.kube/config`,
      labSteps: [
        {
          id: "p7-m4-s1",
          title: "Check All Certificate Expiry Dates",
          instruction:
            "Run kubeadm certs check-expiration to see the expiry date and residual lifetime of every certificate in the cluster.",
          command: "kubeadm certs check-expiration",
          output: [
            "CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY   EXTERNALLY MANAGED",
            "admin.conf                 Jun 05, 2027 10:14 UTC   364d            ca                      no",
            "apiserver                  Jun 05, 2027 10:14 UTC   364d            ca                      no",
            "apiserver-etcd-client      Jun 05, 2027 10:14 UTC   364d            etcd-ca                 no",
            "apiserver-kubelet-client   Jun 05, 2027 10:14 UTC   364d            ca                      no",
            "controller-manager.conf    Jun 05, 2027 10:14 UTC   364d            ca                      no",
            "etcd-healthcheck-client    Jun 05, 2027 10:14 UTC   364d            etcd-ca                 no",
            "etcd-peer                  Jun 05, 2027 10:14 UTC   364d            etcd-ca                 no",
            "etcd-server                Jun 05, 2027 10:14 UTC   364d            etcd-ca                 no",
            "front-proxy-client         Jun 05, 2027 10:14 UTC   364d            front-proxy-ca          no",
            "scheduler.conf             Jun 05, 2027 10:14 UTC   364d            ca                      no",
            "",
            "CERTIFICATE AUTHORITY   EXPIRES                  RESIDUAL TIME   EXTERNALLY MANAGED",
            "ca                      Jun 03, 2036 10:14 UTC   9y              no",
            "etcd-ca                 Jun 03, 2036 10:14 UTC   9y              no",
            "front-proxy-ca          Jun 03, 2036 10:14 UTC   9y              no",
          ],
          explanation:
            "The output shows every certificate signed by kubeadm with its expiry date and days remaining. The root CAs have a 10-year lifetime; component certificates have a 1-year lifetime. Schedule annual renewal before the certificates approach expiry.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: [
              "Certificate audit complete. All certs expire Jun 2027 (~364d remaining)",
            ],
            highlightedComponent: "apiserver",
          },
          tip: "Set a calendar reminder 60 days before the certificate expiry date. Running kubeadm certs renew all during a cluster upgrade automatically renews certificates at the same time.",
        },
        {
          id: "p7-m4-s2",
          title: "Explore the PKI Directory",
          instruction:
            "List the contents of /etc/kubernetes/pki/ to map each file to its role in the certificate hierarchy.",
          command: "ls /etc/kubernetes/pki/",
          output: [
            "apiserver.crt             apiserver-etcd-client.key    front-proxy-ca.crt",
            "apiserver.key             apiserver-kubelet-client.crt  front-proxy-ca.key",
            "apiserver-etcd-client.crt apiserver-kubelet-client.key  front-proxy-client.crt",
            "ca.crt                    etcd/                         front-proxy-client.key",
            "ca.key                    sa.key",
            "                          sa.pub",
          ],
          explanation:
            "The /etc/kubernetes/pki/ directory is the heart of the cluster's security. ca.crt/ca.key is the root of trust for most components. etcd/ contains a separate CA for etcd isolation. sa.key/sa.pub is a keypair (not a certificate) used to sign and verify ServiceAccount JWT tokens. Keep ca.key and sa.key secret — anyone with these can sign arbitrary certificates or tokens.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: [
              "PKI directory listed. 3 root CAs identified: ca, etcd/ca, front-proxy-ca",
            ],
            highlightedComponent: "apiserver",
          },
        },
        {
          id: "p7-m4-s3",
          title: "Inspect a Certificate with openssl",
          instruction:
            "Use openssl to inspect the validity period and Subject Alternative Names of the API server certificate.",
          command:
            "openssl x509 -in /etc/kubernetes/pki/apiserver.crt -text -noout | grep -A2 Validity",
          output: [
            "        Validity",
            "            Not Before: Jun  5 10:14:33 2026 GMT",
            "            Not After : Jun  5 10:14:33 2027 GMT",
          ],
          explanation:
            'openssl x509 -text -noout reads a PEM certificate and prints its human-readable details. The Validity block shows the exact UTC timestamps for when the cert becomes valid and when it expires. For a more complete picture, also grep for "Subject:" and "DNS:" (Subject Alternative Names).',
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: ["apiserver.crt validity confirmed: Jun 2026 – Jun 2027"],
            highlightedComponent: "apiserver",
          },
          tip: 'To see all SANs (critical for apiserver cert which must include the node IP, cluster IP, and DNS names): openssl x509 -in /etc/kubernetes/pki/apiserver.crt -text -noout | grep -A5 "Subject Alternative"',
        },
        {
          id: "p7-m4-s4",
          title: "Renew a Single Certificate",
          instruction:
            "Renew only the apiserver certificate without affecting other certificates.",
          command: "kubeadm certs renew apiserver",
          output: [
            "[renew] Reading configuration from the cluster...",
            "[renew] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -o yaml'",
            "certificate for serving the Kubernetes API Server renewed",
          ],
          explanation:
            "kubeadm certs renew <name> renews a single certificate using the existing CA. After renewal, you must restart the API server for it to load the new certificate — the easiest way is to move its manifest out of /etc/kubernetes/manifests/ and back in, or run: crictl rm $(crictl ps -q --name kube-apiserver)",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 1,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: [
              "apiserver certificate renewed",
              "apiserver restarted to load new certificate",
            ],
            highlightedComponent: "apiserver",
          },
          tip: "kubeadm certs renew all renews every certificate in one command — the recommended approach before planned cluster maintenance. Always restart all control plane components afterward: they cache their certificates at startup.",
        },
        {
          id: "p7-m4-s5",
          title: "Inspect kubeconfig Certificate Data",
          instruction:
            "View the raw kubeconfig to see how the cluster CA and client certificate are embedded.",
          command: "kubectl config view --raw",
          output: [
            "apiVersion: v1",
            "clusters:",
            "- cluster:",
            "    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0t...",
            "    server: https://192.168.1.10:6443",
            "  name: kubernetes",
            "contexts:",
            "- context:",
            "    cluster: kubernetes",
            "    user: kubernetes-admin",
            "  name: kubernetes-admin@kubernetes",
            "current-context: kubernetes-admin@kubernetes",
            "kind: Config",
            "preferences: {}",
            "users:",
            "- name: kubernetes-admin",
            "  user:",
            "    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0t...",
            "    client-key-data: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVkt...",
          ],
          explanation:
            "The kubeconfig embeds all three pieces of the mTLS authentication: the cluster CA (to verify the API server), the client certificate (the user's identity), and the client key (proof of identity). All values are base64-encoded PEM. Without --raw, kubectl config view redacts the certificate data as DATA+OMITTED.",
          clusterState: {
            pods: [
              {
                id: "apiserver",
                name: "kube-apiserver-node-1",
                namespace: "kube-system",
                node: "node-1",
                status: "Running",
                labels: { component: "kube-apiserver" },
                image: "registry.k8s.io/kube-apiserver:v1.30.0",
                restarts: 0,
              },
            ],
            services: [],
            deployments: [],
            namespaces: ["default", "kube-system"],
            events: [
              "kubeconfig raw view: cluster CA, client cert, client key all embedded",
            ],
            highlightedComponent: "apiserver",
          },
          tip: "To decode and inspect the client certificate embedded in a kubeconfig: kubectl config view --raw -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -text -noout | grep Subject",
        },
      ],
      quiz: [
        {
          id: "p7-m4-q1",
          question:
            "How many root CAs does a standard kubeadm cluster create, and what is each one responsible for?",
          options: [
            "1 CA — a single root signs all cluster and etcd certificates",
            "3 CAs — cluster CA (components/kubeconfigs), etcd CA (etcd certs), and front-proxy CA (aggregation layer)",
            "2 CAs — one for the control plane and one for worker nodes",
            "4 CAs — one per control plane component (apiserver, etcd, scheduler, controller-manager)",
          ],
          answer: 1,
          explanation:
            "kubeadm creates three separate root CAs. The cluster CA signs component certificates and kubeconfig client certs. The etcd CA is isolated so etcd compromise does not automatically compromise the rest of the cluster. The front-proxy CA signs certificates used by the aggregation layer for extension API servers.",
        },
        {
          id: "p7-m4-q2",
          question:
            "What is the default validity period for component certificates issued by kubeadm?",
          options: [
            "90 days (Let's Encrypt standard)",
            "1 year (365 days)",
            "5 years",
            "10 years (same as the root CA)",
          ],
          answer: 1,
          explanation:
            "kubeadm issues component certificates (apiserver, etcd-server, etc.) with a 1-year validity period. The root CAs have a 10-year validity. This means you must renew component certificates annually, while the root CA itself rarely needs renewal.",
        },
        {
          id: "p7-m4-q3",
          question:
            'After running "kubeadm certs renew all", what additional step is required for the cluster to use the new certificates?',
          options: [
            "No additional steps — the renewal is applied automatically by kubelet",
            "Each control plane component must be restarted because components load certificates at startup",
            "Run kubeadm upgrade apply to push the new certificates to all nodes",
            "Copy the new certificates to all worker nodes",
          ],
          answer: 1,
          explanation:
            "kubeadm certs renew writes new certificate files to /etc/kubernetes/pki/ but does not restart any processes. Control plane components (apiserver, controller-manager, scheduler, etcd) cache their certificates at startup. They must be restarted — typically by moving their static pod manifests out and back into /etc/kubernetes/manifests/.",
        },
        {
          id: "p7-m4-q4",
          question:
            "What does the sa.key file in /etc/kubernetes/pki/ contain, and why is it different from other files in that directory?",
          options: [
            "The storage admin private key used to encrypt etcd data at rest",
            "A private key (not a certificate) used by the controller-manager to sign ServiceAccount JWT tokens and by the apiserver to verify them",
            "The system:admin user's private key for kubectl access",
            "A scheduled certificate authority renewal key",
          ],
          answer: 1,
          explanation:
            "sa.key and sa.pub are an RSA keypair used for ServiceAccount token signing, not X.509 certificates. The controller-manager signs JWT tokens with sa.key when it creates a ServiceAccount token. The apiserver verifies incoming JWT tokens using sa.pub. This is separate from the TLS certificate hierarchy.",
        },
        {
          id: "p7-m4-q5",
          question:
            "Which command decodes and inspects the certificate embedded in a kubeconfig file, without needing to find the certificate file on disk?",
          options: [
            "kubectl describe certificate admin",
            "kubectl config view --raw -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -text -noout",
            "kubeadm certs check-expiration --kubeconfig ~/.kube/config",
            "openssl x509 -in ~/.kube/config -text -noout",
          ],
          answer: 1,
          explanation:
            "The certificate-data fields in kubeconfigs are base64-encoded PEM certificates. To inspect them, extract the base64 value with jsonpath, decode it with base64 -d, then pipe it to openssl x509 -text -noout. kubectl config view without --raw omits the certificate data entirely.",
        },
        {
          id: "p7-m4-q6",
          question:
            "A cluster's certificates expired overnight and kubectl commands fail with a TLS error. Which kubeadm command should you run first on the control plane node?",
          options: [
            "kubeadm init --cert-renewal",
            "kubeadm certs renew all",
            "kubeadm reset && kubeadm init",
            "kubectl certificate approve --all",
          ],
          answer: 1,
          explanation:
            "kubeadm certs renew all regenerates all expired component certificates using the existing root CAs (which have a 10-year lifetime and are very unlikely to have expired). After renewal, restart all control plane static pods and copy the new admin.conf to ~/.kube/config. Running kubeadm reset would destroy the cluster — never do that to recover from expired certs.",
        },
      ],
      exercises: [
        {
          id: "p7-m4-e1",
          title: "Full PKI audit and renewal simulation",
          kind: "guided",
          goal: "Audit all cluster certificate expiry dates and practice the renewal command sequence, simulating annual maintenance.",
          commands: [
            "kubeadm certs check-expiration",
            "ls /etc/kubernetes/pki/",
            "ls /etc/kubernetes/pki/etcd/",
            'openssl x509 -in /etc/kubernetes/pki/apiserver.crt -text -noout | grep -E "Subject:|Not Before|Not After|DNS:"',
            'openssl x509 -in /etc/kubernetes/pki/ca.crt -text -noout | grep -E "Subject:|Not Before|Not After"',
            'kubeadm certs renew all --dry-run 2>/dev/null || echo "kubeadm certs renew all (run on control plane node)"',
          ],
          verify: [
            "check-expiration shows all certificates with expiry dates and residual time",
            "PKI directory contains ca.crt, apiserver.crt, etcd/ca.crt, sa.key",
            "openssl shows apiserver cert validity and SANs",
            "Cluster CA has 10-year lifetime",
          ],
          expectedOutcome:
            "PKI audit procedure memorized. Certificate locations and renewal sequence confirmed.",
          cleanup: [],
        },
        {
          id: "p7-m4-e2",
          title: "Decode kubeconfig certificates",
          kind: "challenge",
          goal: "Extract and inspect the client certificate embedded in the current kubeconfig to understand what identity and permissions it carries.",
          commands: [
            "kubectl config view --minify",
            "kubectl config view --raw -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -text -noout | grep -E \"Subject:|Not Before|Not After|O =\"",
            "kubectl config view --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 -d | openssl x509 -text -noout | grep -E \"Subject:|Not Before|Not After\"",
            "kubectl auth whoami",
          ],
          verify: [
            "Client cert Subject shows CN=kubernetes-admin, O=system:masters",
            "CA cert Subject shows CN=kubernetes (or cluster name)",
            "kubectl auth whoami confirms identity as kubernetes-admin",
          ],
          expectedOutcome:
            "kubeconfig certificate structure decoded and mapped to Kubernetes RBAC identity.",
          cleanup: [],
        },
      ],
    },
  ],
};

export default phase7;
