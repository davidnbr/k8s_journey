'use client'

import React from 'react'

interface NodeProps {
  title: string
  subtitle?: string
  accent?: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'slate'
  className?: string
}

function Box({ title, subtitle, accent = 'blue', className = '' }: NodeProps) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    red: 'bg-red-500/10 border-red-500/30 text-red-300',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    slate: 'bg-slate-800/30 border-slate-700/50 text-slate-400',
  }

  return (
    <div className={`border rounded-xl p-3 font-mono text-xs shadow-md transition-all hover:scale-[1.01] ${colors[accent]} ${className}`}>
      <div className="font-bold flex items-center gap-1.5">{title}</div>
      {subtitle && <div className="text-[10px] opacity-75 mt-1 leading-normal">{subtitle}</div>}
    </div>
  )
}

function Arrow({ direction = 'down', text, className = '' }: { direction?: 'down' | 'right' | 'up' | 'left' | 'double'; text?: string; className?: string }) {
  const isHorizontal = direction === 'right' || direction === 'left' || direction === 'double'
  return (
    <div className={`flex ${isHorizontal ? 'flex-row items-center' : 'flex-col items-center'} justify-center gap-1 font-mono text-[9px] text-slate-500 ${className}`}>
      {text && !isHorizontal && <span className="text-center">{text}</span>}
      <span className="text-center font-bold">
        {direction === 'down' && '▼'}
        {direction === 'up' && '▲'}
        {direction === 'right' && '▶'}
        {direction === 'left' && '◀'}
        {direction === 'double' && '◀ ── ▶'}
      </span>
      {text && isHorizontal && <span className="ml-1">{text}</span>}
    </div>
  )
}

// ─── Phase 0 Diagrams ────────────────────────────────────────────────────────

function WhyKubernetesDiagram() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div>
        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Traditional Deploy</div>
        <div className="flex flex-col gap-1">
          <Box title="💻 Web App" subtitle="Single runtime instance" accent="blue" />
          <Arrow />
          <Box title="💿 Host OS" subtitle="Shared OS libraries" accent="slate" />
          <Arrow />
          <Box title="🔌 Hypervisor" subtitle="Virtual machines" accent="slate" />
        </div>
      </div>
      <div>
        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Containerized (Docker)</div>
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-2 gap-1">
            <Box title="📦 App 1" accent="purple" />
            <Box title="📦 App 2" accent="purple" />
          </div>
          <Arrow />
          <Box title="🐋 Docker Engine" subtitle="Isolated container runtimes" accent="blue" />
          <Arrow />
          <Box title="💿 Host OS" subtitle="Shared kernel space" accent="slate" />
        </div>
      </div>
      <div>
        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Orchestrated (Kubernetes)</div>
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-2 gap-1">
            <Box title="☸️ Pod 1" subtitle="Auto-reschedules" accent="green" />
            <Box title="🔌 Service" subtitle="Load balances" accent="blue" />
          </div>
          <Arrow />
          <Box title="📦 Worker Nodes" subtitle="Dynamic host scaling" accent="green" />
          <Arrow />
          <Box title="⚙️ Control Plane" subtitle="Self-heals actual state" accent="purple" />
        </div>
      </div>
    </div>
  )
}

function ArchitectureDiagram() {
  return (
    <div className="flex flex-col gap-3 bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="border border-purple-500/20 rounded-xl p-3 bg-purple-950/5">
        <div className="text-purple-300 text-[10px] font-bold uppercase mb-2">⚙️ Control Plane (Brain)</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Box title="kube-apiserver" subtitle="REST API & Val validation Gateway" accent="blue" />
          <Box title="etcd" subtitle="Raft KV Database Store" accent="purple" />
          <Box title="kube-scheduler" subtitle="Node capability matches" accent="green" />
          <Box title="kube-controller-mgr" subtitle="Desired state reconciliation" accent="yellow" />
        </div>
      </div>
      <Arrow direction="down" text="gRPC / secure HTTPs requests" />
      <div className="border border-green-500/20 rounded-xl p-3 bg-emerald-950/5">
        <div className="text-emerald-300 text-[10px] font-bold uppercase mb-2">📦 Worker Node (Muscle)</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Box title="kubelet" subtitle="Node manager Agent daemon" accent="green" />
          <Box title="containerd (CRI)" subtitle="Downloads and runs containers" accent="blue" />
          <Box title="kube-proxy" subtitle="Exposes node iptables rules" accent="purple" />
        </div>
      </div>
    </div>
  )
}

function KubeconfigDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="text-slate-400 text-[10px] font-bold uppercase mb-3">~/.kube/config Structure</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Box title="clusters[ ]" subtitle="API server URL + CA certificate" accent="blue" />
        <Box title="users[ ]" subtitle="Client cert, token, or auth provider" accent="purple" />
        <Box title="contexts[ ]" subtitle="Named: cluster + user + namespace" accent="green" />
      </div>
      <Arrow direction="down" text="current-context points to active triplet" />
      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Box title="Context: dev" subtitle="dev-cluster + dev-admin + namespace: default" accent="blue" />
        <Box title="Context: prod ★" subtitle="prod-cluster + prod-admin + namespace: production" accent="green" />
      </div>
    </div>
  )
}

// ─── Phase 1 Diagrams ────────────────────────────────────────────────────────

function PodsDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col items-center">
      <div className="border border-blue-500/30 rounded-xl p-4 w-full max-w-lg bg-blue-950/5">
        <div className="text-blue-300 font-mono text-[10px] font-bold uppercase mb-2">☸️ Pod (IP: 10.244.1.5)</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Box title="API Container" subtitle="Main app process (Port 8080)" accent="blue" />
          <Box title="Logger Sidecar" subtitle="Helper tool (Port 9000)" accent="purple" />
        </div>
        <Arrow direction="double" text="localhost communication" className="mb-2" />
        <Box title="📁 Shared emptyDir Volume" subtitle="Memory-backed scratch folder mounted at /var/log" accent="green" />
      </div>
    </div>
  )
}

function DeploymentsDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col items-center gap-2">
      <Box title="🚀 Deployment (web)" subtitle="Desired: 3 replicas | Image: nginx:1.27 (v2)" accent="blue" className="w-full max-w-sm text-center" />
      <Arrow />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
        <div className="border border-emerald-500/20 rounded-xl p-3 bg-emerald-950/5">
          <div className="text-emerald-400 font-bold text-[10px] mb-2 text-center">Active ReplicaSet (v2-7f8d)</div>
          <div className="grid grid-cols-3 gap-1">
            <Box title="Pod v2" accent="green" className="text-center" />
            <Box title="Pod v2" accent="green" className="text-center" />
            <Box title="Pod v2" accent="green" className="text-center" />
          </div>
        </div>
        <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/30 opacity-40">
          <div className="text-slate-500 font-bold text-[10px] mb-2 text-center">Old ReplicaSet (v1-56bc) [Scale: 0]</div>
          <div className="text-slate-600 text-center text-[10px] italic py-2">Maintained for rollbacks</div>
        </div>
      </div>
    </div>
  )
}

function ServicesDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col items-center gap-2">
      <Box title="🌐 External Client (curl http://web-service:80)" accent="slate" className="w-full max-w-sm text-center" />
      <Arrow />
      <Box title="🔌 Service (web-service) | ClusterIP: 10.96.45.100:80" subtitle="Stable IP matching labels app=web" accent="blue" className="w-full max-w-md text-center" />
      <Arrow text="Endpoints Load Balancing" />
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <Box title="☸️ Pod (web-aaa)" subtitle="IP: 10.244.1.3 | Port 80" accent="green" className="text-center" />
        <Box title="☸️ Pod (web-bbb)" subtitle="IP: 10.244.2.4 | Port 80" accent="green" className="text-center" />
      </div>
    </div>
  )
}

function InitContainersDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col items-center gap-2">
      <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 self-start">Pod Startup Sequence</div>
      <Box title="1. init-container-1" subtitle="Runs to completion (exit 0) before anything else" accent="yellow" className="w-full max-w-md text-center" />
      <Arrow text="success" />
      <Box title="2. init-container-2" subtitle="Runs after init-1 completes (sequential)" accent="yellow" className="w-full max-w-md text-center" />
      <Arrow text="success" />
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <Box title="Main container A" subtitle="Starts in parallel after all inits" accent="green" className="text-center" />
        <Box title="Main container B" subtitle="Starts in parallel after all inits" accent="green" className="text-center" />
      </div>
      <div className="mt-3 border border-slate-700 rounded-xl p-2 w-full max-w-md text-center text-[10px] text-slate-400">
        preStop hook → SIGTERM → grace period → SIGKILL (on deletion)
      </div>
    </div>
  )
}

// ─── Phase 2 Diagrams ────────────────────────────────────────────────────────

function NamespacesDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="text-slate-400 text-[10px] font-bold uppercase mb-2">☸️ Kubernetes Cluster (Physical Nodes)</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div className="border border-blue-500/20 rounded-xl p-3 bg-blue-950/5">
          <div className="text-blue-300 font-bold text-[10px] mb-1">📁 Namespace: dev</div>
          <div className="grid grid-cols-2 gap-2">
            <Box title="Pod: api-server" accent="blue" />
            <Box title="Service: db" accent="slate" />
          </div>
        </div>
        <div className="border border-purple-500/20 rounded-xl p-3 bg-purple-950/5">
          <div className="text-purple-300 font-bold text-[10px] mb-1">📁 Namespace: prod</div>
          <div className="grid grid-cols-2 gap-2">
            <Box title="Pod: api-server" accent="purple" />
            <Box title="Service: db" accent="slate" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Box title="🖥️ Node 1" accent="slate" className="text-center" />
        <Box title="🖥️ Node 2" accent="slate" className="text-center" />
        <Box title="💾 Storage Class" accent="slate" className="text-center" />
      </div>
    </div>
  )
}

function LabelsDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col items-center gap-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
        <Box title="🔌 Service (web)" subtitle="Selector: { app: web, tier: frontend }" accent="blue" />
        <Box title="🚀 Deployment (api)" subtitle="Selector: { app: api }" accent="purple" />
      </div>
      <div className="h-4 border-l border-slate-700 border-dashed" />
      <div className="grid grid-cols-3 gap-2 w-full max-w-xl">
        <Box title="Pod 1" subtitle="Labels: { app: web, tier: frontend, env: prod }" accent="green" />
        <Box title="Pod 2" subtitle="Labels: { app: web, tier: frontend, env: dev }" accent="green" />
        <Box title="Pod 3" subtitle="Labels: { app: api, tier: backend }" accent="purple" />
      </div>
    </div>
  )
}

function ConfigMapsDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="flex flex-col items-center gap-2">
        <Box title="🗂️ ConfigMap (app-config)" subtitle="data: { DB_HOST: 'mysql-service', API_DEBUG: 'true' }" accent="yellow" className="w-full max-w-sm text-center" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-lg mt-2">
          <div className="flex flex-col items-center">
            <Arrow direction="down" text="Injected as env vars" />
            <Box title="☸️ Pod Environment" subtitle="Injected at container start. Cannot sync live updates without container restarts." accent="blue" className="w-full" />
          </div>
          <div className="flex flex-col items-center">
            <Arrow direction="down" text="Mounted as Volume" />
            <Box title="📁 Volume Mount (/etc/config)" subtitle="Kubelet syncs symlink pointers dynamically. Updates live inside container." accent="green" className="w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

function SecretsDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col items-center gap-2">
      <Box title="🔒 Secret (db-creds) | base64 encoded" subtitle="Stored securely in etcd with KMS Envelope encryption" accent="purple" className="w-full max-w-sm text-center" />
      <Arrow direction="down" text="Requested by Kubelet" />
      <div className="border border-slate-800 rounded-xl p-3 w-full max-w-md bg-slate-900/30">
        <div className="text-[10px] text-slate-400 font-bold mb-2">🖥️ Worker Node RAM Mount</div>
        <Box title="tmpfs Memory Volume" subtitle="Mounted to pod as virtual memory files. Never written to node local disk." accent="green" />
      </div>
    </div>
  )
}

function ProbesDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="text-slate-400 text-[10px] font-bold uppercase mb-3">⏱️ Pod Startup & Health Lifecycle Timeline</div>
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-2">
        <Box title="1. Container Starts" subtitle="Pulling image & init" accent="slate" className="flex-1 text-center" />
        <Arrow direction="right" className="hidden md:flex" />
        <Box title="2. Startup Probe" subtitle="Exposes initial check. Blocks other probes from killing app during slow initialization." accent="yellow" className="flex-1 text-center" />
        <Arrow direction="right" className="hidden md:flex" />
        <Box title="3. Liveness Probe" subtitle="Continuously checks app deadlock. Restarts container on fail." accent="red" className="flex-1 text-center" />
        <Arrow direction="right" className="hidden md:flex" />
        <Box title="4. Readiness Probe" subtitle="Checks app initialization. Connects/disconnects Service traffic." accent="green" className="flex-1 text-center" />
      </div>
    </div>
  )
}

function ResourcesDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-blue-500/20 rounded-xl p-3 bg-blue-950/5">
          <div className="text-blue-300 font-bold text-[10px] mb-2">📈 CPU (Compressible)</div>
          <Box title="Requests" subtitle="Assigned weight via cpu.shares. Used by scheduler for placement." accent="blue" className="mb-2" />
          <Box title="Limits" subtitle="Enforced via CFS CFS quotas. Container is throttled if exceeded; NEVER killed." accent="red" />
        </div>
        <div className="border border-purple-500/20 rounded-xl p-3 bg-purple-950/5">
          <div className="text-purple-300 font-bold text-[10px] mb-2">📉 Memory (Incompressible)</div>
          <Box title="Requests" subtitle="Used by scheduler. Ensures host memory capacity is reserved." accent="purple" className="mb-2" />
          <Box title="Limits" subtitle="Enforced via cgroups memory.max. Container is instantly OOMKilled if limits hit." accent="red" />
        </div>
      </div>
    </div>
  )
}

// ─── Phase 3 Diagrams ────────────────────────────────────────────────────────

function VolumesDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="flex flex-col md:flex-row items-stretch gap-2 justify-between">
        <Box title="☸️ Pod spec" subtitle="claims: fast-pvc" accent="slate" className="flex-1" />
        <Arrow direction="right" className="hidden md:flex" />
        <Box title="💾 PVC (fast-pvc)" subtitle="Requests 5Gi of 'fast-storage'" accent="purple" className="flex-1" />
        <Arrow direction="right" className="hidden md:flex" />
        <Box title="⚙️ StorageClass" subtitle="Provisioner calls CSI CreateVolume" accent="blue" className="flex-1" />
        <Arrow direction="right" className="hidden md:flex" />
        <Box title="💿 PV (pv-block)" subtitle="Bound exclusively to PVC on cloud device" accent="green" className="flex-1" />
      </div>
    </div>
  )
}

function StatefulSetsDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col gap-3">
      <div className="text-[10px] font-bold text-slate-400 uppercase">StatefulSet Pod/Volume Sticky Mapping</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Box title="Pod: mysql-0" subtitle="DNS: mysql-0.db.svc" accent="blue" />
        <Box title="Pod: mysql-1" subtitle="DNS: mysql-1.db.svc" accent="blue" />
        <Box title="Pod: mysql-2" subtitle="DNS: mysql-2.db.svc" accent="blue" />
        <Box title="Headless Service" subtitle="clusterIP: None (returns Pod IPs)" accent="purple" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
        <Box title="PVC: data-mysql-0" subtitle="Bound to PV 0 (Retained)" accent="green" />
        <Box title="PVC: data-mysql-1" subtitle="Bound to PV 1 (Retained)" accent="green" />
        <Box title="PVC: data-mysql-2" subtitle="Bound to PV 2 (Retained)" accent="green" />
      </div>
    </div>
  )
}

function DaemonSetsDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">DaemonSet Controller (1 Pod Per Node)</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border border-slate-800 rounded-xl p-2 bg-slate-900/20">
          <div className="text-slate-400 font-bold text-[10px] mb-1.5">🖥️ Master Node</div>
          <Box title="agent-pod" subtitle="Tolerates Master NoSchedule taint" accent="purple" />
        </div>
        <div className="border border-slate-800 rounded-xl p-2 bg-slate-900/20">
          <div className="text-slate-400 font-bold text-[10px] mb-1.5">🖥️ Worker Node 1</div>
          <Box title="agent-pod" accent="green" />
        </div>
        <div className="border border-slate-800 rounded-xl p-2 bg-slate-900/20">
          <div className="text-slate-400 font-bold text-[10px] mb-1.5">🖥️ Worker Node 2</div>
          <Box title="agent-pod" accent="green" />
        </div>
      </div>
    </div>
  )
}

function IngressDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col items-center gap-2">
      <Box title="🌐 Client HTTPS Request (https://myapp.com/api)" accent="slate" className="w-full max-w-sm text-center" />
      <Arrow />
      <Box title="🔌 Ingress Controller (L7)" subtitle="Terminates TLS. Inspects Host/Path headers. Bypasses Service proxy routing." accent="purple" className="w-full max-w-md text-center" />
      <Arrow text="Sends directly to Pod IPs" />
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <Box title="Pod: api-pod-1" subtitle="IP: 10.244.1.3" accent="green" />
        <Box title="Pod: api-pod-2" subtitle="IP: 10.244.2.8" accent="green" />
      </div>
    </div>
  )
}

function NetpolDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">NetworkPolicy Stateful Traffic Isolation</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
        <Box title="Pod (role: frontend)" subtitle="Namespace: default" accent="green" />
        <div className="flex flex-col items-center">
          <Box title="🛡️ Policy: allow-ingress" subtitle="Selector app=db. Allows ingress only from role=frontend" accent="red" />
          <Arrow direction="right" text="Port 5432 allowed" className="hidden md:flex mt-1" />
        </div>
        <Box title="Pod (app: db)" subtitle="Blocked from all other namespace requests" accent="blue" />
      </div>
    </div>
  )
}

// ─── Phase 4 Diagrams ────────────────────────────────────────────────────────

function RbacDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-blue-500/20 rounded-xl p-3 bg-blue-950/5">
          <div className="text-blue-300 font-bold text-[10px] mb-2">📁 RoleBinding (Namespace-scoped)</div>
          <Box title="Subject: User / ServiceAccount" accent="slate" className="mb-2" />
          <Arrow />
          <Box title="Role" subtitle="verbs: [get, list] | resources: [pods]" accent="blue" />
        </div>
        <div className="border border-purple-500/20 rounded-xl p-3 bg-purple-950/5">
          <div className="text-purple-300 font-bold text-[10px] mb-2">⚙️ ClusterRoleBinding (Cluster-wide)</div>
          <Box title="Subject: User / ServiceAccount" accent="slate" className="mb-2" />
          <Arrow />
          <Box title="ClusterRole" subtitle="verbs: [get, list, watch] | resources: [nodes, pv]" accent="purple" />
        </div>
      </div>
    </div>
  )
}

function JobsDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col items-center gap-2">
      <Box title="⏰ CronJob (schedule: */5 * * * *)" subtitle="Triggers on cron timer schedule" accent="yellow" className="w-full max-w-sm text-center" />
      <Arrow />
      <Box title="🏃 Job (cleanup-run-1)" subtitle="Batch runner controller" accent="blue" className="w-full max-w-sm text-center" />
      <Arrow />
      <Box title="☸️ Pod (cleanup-run-1-xxxxx)" subtitle="Runs container script. Exits to status 'Completed' (exited 0)." accent="green" className="w-full max-w-sm text-center" />
    </div>
  )
}

function HpaDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col items-center gap-2">
      <div className="grid grid-cols-3 gap-2 w-full max-w-lg items-center">
        <Box title="📈 metrics-server" subtitle="Collects CPU/Mem usage" accent="purple" />
        <Arrow direction="left" text="Scrapes metrics" />
        <Box title="☸️ Pods (Deployment)" subtitle="Running workloads" accent="green" />
      </div>
      <Arrow direction="down" text="Queries usage every 15s" />
      <Box title="⚙️ HPA Controller" subtitle="Computes: ceil(desired * current/target)" accent="blue" className="w-full max-w-sm text-center" />
      <Arrow direction="down" text="Updates replica configuration" />
      <Box title="🚀 Deployment" subtitle="Scales replicas count dynamically" accent="purple" className="w-full max-w-sm text-center" />
    </div>
  )
}

function SchedulingDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/30">
          <div className="text-slate-400 font-bold text-[10px] mb-2">Taints & Tolerations (Repelling Nodes)</div>
          <Box title="Node: dedicated=gpu:NoSchedule" subtitle="Taint blocks normal pods" accent="red" className="mb-2" />
          <Box title="Pod (tolerations: dedicated=gpu)" subtitle="Allowed to schedule on tainted node" accent="green" />
        </div>
        <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/30">
          <div className="text-slate-400 font-bold text-[10px] mb-2">Node/Pod Affinity (Attracting Pods)</div>
          <Box title="Node: disk=nvme" accent="slate" className="mb-2" />
          <Box title="Pod (nodeAffinity: disk=nvme)" subtitle="Scheduler must schedule Pod here" accent="blue" />
        </div>
      </div>
    </div>
  )
}

function PdbDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col items-center gap-2">
      <Box title="⚠️ kubectl drain node-1" subtitle="Voluntary disruption trigger" accent="yellow" className="w-full max-w-sm text-center" />
      <Arrow />
      <Box title="🛡️ PodDisruptionBudget (PDB)" subtitle="minAvailable: 2 replicas | actual: 3 running" accent="red" className="w-full max-w-md text-center" />
      <Arrow text="Validates request" />
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <Box title="Eviction: Pod A" subtitle="Evacuation allowed (2 left)" accent="green" className="text-center" />
        <Box title="Eviction: Pod B" subtitle="Blocked! (Would drop below minAvailable)" accent="red" className="text-center" />
      </div>
    </div>
  )
}

// ─── Phase 5 Diagrams ────────────────────────────────────────────────────────

function HelmDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Helm Compilation & Deployment Flow</div>
      <div className="flex flex-col md:flex-row items-stretch gap-2 justify-between">
        <Box title="1. Chart Templates" subtitle="Go templates + defaults" accent="slate" className="flex-1" />
        <Arrow direction="right" className="hidden md:flex" />
        <Box title="2. Values Merge" subtitle="Overridden by user --set / -f" accent="blue" className="flex-1" />
        <Arrow direction="right" className="hidden md:flex" />
        <Box title="3. Rendered Manifest" subtitle="strategic merge patch" accent="purple" className="flex-1" />
        <Arrow direction="right" className="hidden md:flex" />
        <Box title="4. API Secret v1" subtitle="Saves release state in target namespace" accent="green" className="flex-1" />
      </div>
    </div>
  )
}

function KustomizeDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Kustomize Base / Overlay Inheritance</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border border-slate-800 rounded-xl p-2 bg-slate-900/20 col-span-1">
          <Box title="📁 Base" subtitle="deployment.yaml | service.yaml" accent="slate" />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <div className="border border-blue-500/20 rounded-xl p-2 bg-blue-950/5 flex items-center justify-between">
            <span className="text-blue-300 text-[10px] font-bold">📂 Overlay: dev</span>
            <Box title="Replicas: 1" subtitle="Strategic patch applied" accent="blue" />
          </div>
          <div className="border border-purple-500/20 rounded-xl p-2 bg-purple-950/5 flex items-center justify-between">
            <span className="text-purple-300 text-[10px] font-bold">📂 Overlay: prod</span>
            <Box title="Replicas: 5" subtitle="Strategic patch applied" accent="purple" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CrdsDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col items-center gap-2">
      <Box title="⚙️ CustomResourceDefinition (CRD: Database)" subtitle="Registers /apis/example.com/v1/databases in API server" accent="purple" className="w-full max-w-sm text-center" />
      <Arrow />
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <Box title="1. Custom Resource (CR)" subtitle="spec: { engine: postgres, size: 50Gi }" accent="blue" />
        <Box title="2. Custom Controller" subtitle="SharedIndexInformer loops. Reconciles state." accent="green" />
      </div>
    </div>
  )
}

function ObservabilityDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Kubernetes Telemetry Pipeline</div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-2">
          <div className="text-slate-500 text-[9px] uppercase font-bold text-center">Metrics</div>
          <Box title="Kubelet stats" subtitle="cgroups usage metrics" accent="purple" />
          <Box title="metrics-server" subtitle="Aggregates for HPA" accent="blue" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-slate-500 text-[9px] uppercase font-bold text-center">Logs</div>
          <Box title="CRI-O / containerd" subtitle="Writes log streams to node" accent="green" />
          <Box title="FluentBit / Log tailer" subtitle="DaemonSet pipes to storage" accent="slate" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-slate-500 text-[9px] uppercase font-bold text-center">Traces</div>
          <Box title="OTel SDK" subtitle="Application tracing spans" accent="yellow" />
          <Box title="Jaeger / OTel Coll" subtitle="Stores tracing pipelines" accent="slate" />
        </div>
      </div>
    </div>
  )
}

function QosEvictionDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">Memory Eviction & QoS Priority Hierarchy</div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between border border-red-500/20 rounded-xl p-2 bg-red-950/5">
          <span className="text-red-300 font-bold text-xs">BestEffort (oom_score_adj: 1000)</span>
          <Box title="Evicted First" subtitle="No resource requests or limits configured" accent="red" />
        </div>
        <div className="flex items-center justify-between border border-yellow-500/20 rounded-xl p-2 bg-yellow-950/5">
          <span className="text-yellow-300 font-bold text-xs">Burstable (oom_score_adj: 2 to 999)</span>
          <Box title="Evicted Second" subtitle="Requests set < limits" accent="yellow" />
        </div>
        <div className="flex items-center justify-between border border-emerald-500/20 rounded-xl p-2 bg-emerald-950/5">
          <span className="text-emerald-300 font-bold text-xs">Guaranteed (oom_score_adj: -997 to -998)</span>
          <Box title="Protected" subtitle="Requests == limits configured exactly" accent="green" />
        </div>
      </div>
    </div>
  )
}

function GitOpsDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6 flex flex-col items-center gap-2">
      <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 self-start">GitOps Pull-Based Reconciliation Loop</div>
      <Box title="📁 Git Repository (desired state)" subtitle="manifests/ | helm/ | kustomize/" accent="blue" className="w-full max-w-sm text-center" />
      <Arrow text="ArgoCD polls every ~3 min or via webhook" />
      <Box title="⚙️ ArgoCD Application Controller" subtitle="Diffs live cluster state vs Git — detects drift" accent="purple" className="w-full max-w-md text-center" />
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <div className="flex flex-col items-center gap-1">
          <Box title="In Sync" subtitle="Git == Cluster. No action." accent="green" className="w-full text-center" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Box title="OutOfSync" subtitle="Applies diff to Kubernetes API" accent="red" className="w-full text-center" />
        </div>
      </div>
    </div>
  )
}

function ServiceMeshDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="text-slate-400 text-[10px] font-bold uppercase mb-3">Istio Sidecar Pattern — mTLS & Traffic Control</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-blue-500/20 rounded-xl p-3 bg-blue-950/5">
          <div className="text-blue-300 text-[10px] font-bold mb-2">Pod A</div>
          <Box title="App Container" subtitle="Sends plain HTTP to localhost" accent="blue" className="mb-2" />
          <Box title="Envoy Sidecar (istio-proxy)" subtitle="Intercepts via iptables — upgrades to mTLS" accent="purple" />
        </div>
        <div className="border border-green-500/20 rounded-xl p-3 bg-emerald-950/5">
          <div className="text-green-300 text-[10px] font-bold mb-2">Pod B</div>
          <Box title="Envoy Sidecar (istio-proxy)" subtitle="Terminates mTLS — validates SPIFFE cert" accent="purple" className="mb-2" />
          <Box title="App Container" subtitle="Receives plain HTTP from sidecar" accent="green" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-500">
        <span className="text-purple-400 font-bold">istiod (control plane)</span>
        <span>distributes config + issues X.509 certs to all sidecars</span>
      </div>
    </div>
  )
}

// ─── Phase 6 Diagrams ────────────────────────────────────────────────────────

function CncfDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="text-[10px] font-bold text-slate-400 uppercase mb-3">CNCF Project Maturity Lifecycle Funnel</div>
      <div className="flex flex-col gap-2">
        <div className="border border-slate-700 rounded-xl p-2 bg-slate-800/10 text-center">
          <div className="font-bold text-slate-400">1. Sandbox (Experimental)</div>
          <div className="text-[10px] text-slate-500">Inception, early development, low production usage</div>
        </div>
        <div className="border border-yellow-500/20 rounded-xl p-2 bg-yellow-950/5 text-center">
          <div className="font-bold text-yellow-300">2. Incubating (Production Ready)</div>
          <div className="text-[10px] text-slate-400">Adopted by multiple teams, proven stability, audit check</div>
        </div>
        <div className="border border-emerald-500/20 rounded-xl p-2 bg-emerald-950/5 text-center">
          <div className="font-bold text-emerald-300">3. Graduated (Industry Standard)</div>
          <div className="text-[10px] text-slate-300">Kubernetes, Helm, Prometheus, Envoy. Mature governance.</div>
        </div>
      </div>
    </div>
  )
}

function CkaFlowDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/30">
          <div className="text-slate-400 font-bold text-[10px] mb-2">Kubelet Node ready Lease Heartbeat</div>
          <Box title="Kubelet agent" subtitle="Exposes heartbeat checks" accent="green" className="mb-2" />
          <Arrow />
          <Box title="Node Lease object" subtitle="Checks Node health every 10s in kube-node-lease namespace" accent="blue" />
        </div>
        <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/30">
          <div className="text-slate-400 font-bold text-[10px] mb-2">etcd Snapshot backup process</div>
          <Box title="Control Plane Node" subtitle="Runs etcdctl with server cert/keys" accent="purple" className="mb-2" />
          <Arrow />
          <Box title="Snapshot file (.db)" subtitle="Stored in local folder backup (e.g. /srv/data)" accent="green" />
        </div>
      </div>
    </div>
  )
}

function CkadFlowDiagram() {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 my-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/30">
          <div className="text-slate-400 font-bold text-[10px] mb-2">Infra (Pause) Container Namespace boundary</div>
          <Box title="Infra Container (Pause)" subtitle="Holds namespaces (Network, IPC) open" accent="purple" className="mb-2" />
          <Arrow direction="double" text="localhost shares namespaces" />
          <Box title="App Container" subtitle="Main app process" accent="blue" />
        </div>
        <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/30">
          <div className="text-slate-400 font-bold text-[10px] mb-2">Pod initialization order</div>
          <Box title="1. initContainers" subtitle="Runs to completion sequentially" accent="yellow" className="mb-2" />
          <Arrow />
          <Box title="2. containers" subtitle="Runs in parallel after init succeeds" accent="green" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component Router ──────────────────────────────────────────────────

export default function LessonDiagram({ name }: { name: string }) {
  switch (name) {
    case 'kubectl-kubeconfig':
      return <KubeconfigDiagram />
    case 'why-kubernetes':
      return <WhyKubernetesDiagram />
    case 'architecture':
      return <ArchitectureDiagram />
    case 'pods':
      return <PodsDiagram />
    case 'deployments':
      return <DeploymentsDiagram />
    case 'services':
      return <ServicesDiagram />
    case 'init-containers':
      return <InitContainersDiagram />
    case 'namespaces':
      return <NamespacesDiagram />
    case 'labels':
      return <LabelsDiagram />
    case 'configmaps':
      return <ConfigMapsDiagram />
    case 'secrets':
      return <SecretsDiagram />
    case 'probes':
      return <ProbesDiagram />
    case 'resources':
      return <ResourcesDiagram />
    case 'volumes':
      return <VolumesDiagram />
    case 'statefulsets':
      return <StatefulSetsDiagram />
    case 'daemonsets':
      return <DaemonSetsDiagram />
    case 'ingress':
      return <IngressDiagram />
    case 'netpol':
      return <NetpolDiagram />
    case 'rbac':
      return <RbacDiagram />
    case 'jobs':
      return <JobsDiagram />
    case 'hpa':
      return <HpaDiagram />
    case 'scheduling':
      return <SchedulingDiagram />
    case 'pdb':
      return <PdbDiagram />
    case 'helm':
      return <HelmDiagram />
    case 'kustomize':
      return <KustomizeDiagram />
    case 'crds':
      return <CrdsDiagram />
    case 'observability':
      return <ObservabilityDiagram />
    case 'gitops':
      return <GitOpsDiagram />
    case 'service-mesh':
      return <ServiceMeshDiagram />
    case 'qos':
      return <QosEvictionDiagram />
    case 'cncf':
      return <CncfDiagram />
    case 'cka-flow':
      return <CkaFlowDiagram />
    case 'ckad-flow':
      return <CkadFlowDiagram />
    default:
      return null
  }
}
