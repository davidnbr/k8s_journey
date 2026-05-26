import type { Phase, ClusterState } from '@/lib/types'

const emptyCluster: ClusterState = {
  pods: [], services: [], deployments: [], namespaces: ['default'], events: [],
}

const phase5: Phase = {
  id: 'phase-5',
  slug: 'phase-5',
  title: 'Advanced Kubernetes: Helm, CRDs & Observability',
  shortTitle: 'Advanced',
  description: 'Package and deploy with Helm, extend Kubernetes with CRDs and Operators, and build observability into your cluster with metrics, logging, and tracing.',
  weeks: 'Week 9â€“10',
  hours: '~11 hours',
  color: 'text-rose-400',
  bgColor: 'bg-rose-500/10 border-rose-500/30',
  modules: [
    // â”€â”€â”€ Module 1: Helm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: 'p5-m1',
      slug: 'helm',
      title: 'Helm: Kubernetes Package Manager',
      description: 'Package, version, and deploy Kubernetes applications with Helm charts â€” the apt/brew for your cluster.',
      duration: '75 min',
      difficulty: 'intermediate',
      theory: `> ðŸ§  **Brain Warm-Up**: If Helm v3 stores release state directly inside the cluster as Kubernetes Secrets (and lacks a server-side daemon like Helm v2's Tiller), how does it handle concurrent deployments to the same release without causing race conditions or state corruption?

## The Problem: YAML at Scale

Deploying a real application to Kubernetes requires 5â€“10 YAML files: a Deployment, a Service, a ConfigMap, an Ingress, a ServiceAccount, maybe a HorizontalPodAutoscaler. Multiplied across dev, staging, and production, this becomes dozens of files that differ only in a handful of values (image tag, replica count, domain name).

Managing these manually is error-prone and repetitive. Teams end up with copied-and-pasted YAML that drifts out of sync.

## What is Helm?

**Helm** is the package manager for Kubernetes. Think of it like \`apt\` (Debian), \`brew\` (macOS), or \`npm\` â€” but instead of software packages, it manages Kubernetes application bundles.

Helm is maintained by the CNCF and is the most widely-used way to install third-party software (Prometheus, cert-manager, nginx-ingress) onto a cluster.

### Helm Compilation & Deployment Flow

\`\`\`
                                        +-------------------+
                                        |  Chart Templates  |
                                        +---------+---------+
                                                  |
                                                  v
+-------------------+                   +---------+---------+
|   Custom Values   | ----------------> |    Helm Client    |
| (--set / values)  |                   | (Go template engine|
+-------------------+                   |  & Sprig library) |
                                        +---------+---------+
                                                  | (compiles & renders templates)
                                                  v
                                        +-------------------+
                                        | Renders YAML/JSON |
                                        | (Kubernetes API   |
                                        |  Manifest Bundle) |
                                        +---------+---------+
                                                  |
                                                  | (3-way merge patch / HTTP POST)
                                                  v
                                      +-----------------------+
                                      | Kubernetes API Server |
                                      +-----------+-----------+
                                                  |
                                    +-------------+-------------+
                                    |                           |
                                    v                           v
                           +--------+--------+         +--------+--------+
                           |  Target Namespace |       | Release Secrets |
                           |  (e.g., Pods,   |       | (gzip+base64    |
                           |   SVCs, etc.)   |       |  JSON metadata) |
                           +-----------------+         +-----------------+
\`\`\`

## Core Concepts

| Concept | Description |
|---|---|
| **Chart** | A collection of YAML templates packaged together â€” like a \`.deb\` package or a Homebrew formula |
| **Release** | An installed instance of a chart. The same chart can be installed multiple times as different releases. |
| **Values** | Variables that customize a chart. Defaults live in \`values.yaml\`; overridden with \`--set\` or \`-f myvalues.yaml\` |
| **Repository** | A collection of charts. Artifact Hub is the main public registry. |

## Helm Template Engine & Deep-Dive Compilation

Charts use Go templates to inject values into YAML:

\`\`\`yaml
# templates/deployment.yaml
image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
replicas: {{ .Values.replicaCount }}
name: {{ .Release.Name }}-app
\`\`\`

Under the hood, Helm compile and render phases run entirely client-side:
1. **Values Merging**: Helm compiles values from the chart's defaults, any sub-charts (parent-child scopes), values files passed via \`-f\`, and command-line overrides (\`--set\`). This produces a single unified nested dictionary.
2. **Template Expansion**: Helm runs Go's standard \`text/template\` engine supplemented with custom helper functions from the Sprig library (e.g. \`toYaml\`, \`indent\`, \`nindent\`, \`default\`).
3. **Manifest Compilation**: Renders are converted to a combined YAML stream.
4. **Three-Way Merge Patching**: During upgrades, Helm client does not simply overwrite resources. It performs a three-way merge patch comparing:
   - The *last release state* (stored in the cluster Release Secret)
   - The *live state* in the cluster (to preserve out-of-band changes like dynamic node selections or replicas adjusted by HPAs)
   - The *proposed target state*
5. **State Storage**: The output release state is serialized, gzipped, base64 encoded, and stored in a Kubernetes Secret of type \`helm.sh/release.v1\` named \`sh.helm.release.v1.<release-name>.v<revision>\` in the installation namespace. Optimistic concurrency control (via \`resourceVersion\` on the Secret) guarantees concurrent updates are rejected by the API server to prevent race conditions.

## Key Commands

\`\`\`
helm repo add <name> <url>     # Add a chart repository
helm repo update               # Refresh cached chart index
helm search repo <keyword>     # Find charts in added repos
helm show values <chart>       # Inspect default values
helm install <release> <chart> # Install a chart as a named release
helm upgrade <release> <chart> # Upgrade an existing release
helm rollback <release> <rev>  # Roll back to a previous revision
helm uninstall <release>       # Remove a release from the cluster
helm list                      # Show all installed releases
helm history <release>         # Show revision history for a release
\`\`\`

## Helm v3 vs v2

Helm v3 (current, released 2019) removed **Tiller** â€” a server-side component that ran inside the cluster with cluster-admin privileges. Tiller was a significant security risk because any pod that could reach it could issue arbitrary API calls.

Helm v3 uses your \`kubeconfig\` directly (client-side only), so permissions are limited to what your own account can do.

## When to Use Helm

- **Third-party software** (Prometheus, nginx-ingress, cert-manager, ArgoCD): always use Helm â€” charts encode operational knowledge.
- **Your own apps**: Helm works but adds template complexity. Many teams prefer Kustomize (next module) for first-party apps.`,
      labSteps: [
        {
          id: 'p5-m1-s1',
          title: 'Add a Helm repository',
          instruction: 'Add the ingress-nginx Helm repository and update the local chart index.',
          command: 'helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx && helm repo update',
          output: [
            '"ingress-nginx" has been added to your repositories',
            'Hang tight while we grab the latest from your chart repositories...',
            '...Successfully got an update from the "ingress-nginx" chart repository',
            'Update Complete. Happy Helming!',
          ],
          explanation: 'Helm repositories are HTTP servers that serve a chart index (index.yaml) and the packaged chart tarballs. Adding a repo caches the index locally. The ingress-nginx repo is maintained by the Kubernetes project itself and contains the NGINX Ingress Controller chart.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Helm repo ingress-nginx added', 'Chart index updated from kubernetes.github.io'],
            highlightedComponent: 'apiserver',
          },
          tip: 'Artifact Hub (artifacthub.io) is the main discovery site for Helm charts. Find the exact repo add command for any chart there.',
        },
        {
          id: 'p5-m1-s2',
          title: 'Search for charts',
          instruction: 'Search the ingress-nginx repository to see available charts and versions.',
          command: 'helm search repo ingress-nginx',
          output: [
            'NAME                            CHART VERSION   APP VERSION   DESCRIPTION',
            'ingress-nginx/ingress-nginx     4.11.3          1.11.3        Ingress controller for Kubernetes using NGINX...',
          ],
          explanation: 'The search output shows the chart name, chart version (the Helm package version), and app version (the underlying software version). These are independent â€” a chart at version 4.11.3 may package nginx 1.11.3. You can pin a specific chart version with --version on helm install.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['helm search repo ingress-nginx â†’ 1 chart found'],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p5-m1-s3',
          title: 'Inspect default values',
          instruction: 'Preview the configurable values for the ingress-nginx chart before installing.',
          command: 'helm show values ingress-nginx/ingress-nginx | head -40',
          output: [
            '## Default values for ingress-nginx.',
            'controller:',
            '  name: controller',
            '  image:',
            '    repository: registry.k8s.io/ingress-nginx/controller',
            '    tag: ""',
            '    digest: sha256:...',
            '  replicaCount: 1',
            '  minAvailable: 1',
            '  resources:',
            '    requests:',
            '      cpu: 100m',
            '      memory: 90Mi',
            '  service:',
            '    type: LoadBalancer',
            '    ports:',
            '      http: 80',
            '      https: 443',
          ],
          explanation: 'values.yaml is the contract between the chart author and the operator. Any field here can be overridden with --set (for single values) or -f myvalues.yaml (for many overrides). The chart templates reference these values via {{ .Values.<path> }}. Reading values before installing tells you exactly what you can customize.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['Inspecting ingress-nginx chart values (controller.replicaCount, service.type, resources...)'],
            highlightedComponent: 'apiserver',
          },
          tip: 'Save a full values dump with helm show values ingress-nginx/ingress-nginx > my-values.yaml, edit it, then pass -f my-values.yaml on install. This gives you a version-controlled override file.',
        },
        {
          id: 'p5-m1-s4',
          title: 'Install the chart',
          instruction: 'Install ingress-nginx as a release named my-ingress with 2 controller replicas.',
          command: 'helm install my-ingress ingress-nginx/ingress-nginx --set controller.replicaCount=2 -n ingress-nginx --create-namespace',
          output: [
            'NAME: my-ingress',
            'LAST DEPLOYED: Sun Mar 22 10:00:00 2026',
            'NAMESPACE: ingress-nginx',
            'STATUS: deployed',
            'REVISION: 1',
            'TEST SUITE: None',
            'NOTES:',
            'The ingress-nginx controller has been installed.',
            'Get the application URL by running these commands:',
            '  export SERVICE_IP=$(kubectl get svc my-ingress-ingress-nginx-controller -n ingress-nginx -o jsonpath=\'{.status.loadBalancer.ingress[0].ip}\')',
          ],
          explanation: 'Helm rendered all chart templates with the provided values, applied them to the cluster, and recorded the release in a Secret in the ingress-nginx namespace. --create-namespace creates the namespace if it does not exist. REVISION: 1 is the first deployment â€” each helm upgrade increments this. STATUS: deployed means all resources were accepted by the API server.',
          clusterState: {
            pods: [
              { id: 'my-ingress-ctrl-7f8d2', name: 'my-ingress-ingress-nginx-controller-7f8d2', namespace: 'ingress-nginx', node: 'node-1', status: 'Running', labels: { 'app.kubernetes.io/name': 'ingress-nginx' }, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3', restarts: 0 },
              { id: 'my-ingress-ctrl-9c3a1', name: 'my-ingress-ingress-nginx-controller-9c3a1', namespace: 'ingress-nginx', node: 'node-2', status: 'Running', labels: { 'app.kubernetes.io/name': 'ingress-nginx' }, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3', restarts: 0 },
            ],
            services: [
              { id: 'my-ingress-svc', name: 'my-ingress-ingress-nginx-controller', namespace: 'ingress-nginx', type: 'LoadBalancer', selector: { 'app.kubernetes.io/name': 'ingress-nginx' }, port: 80, clusterIP: '10.96.45.12' },
            ],
            deployments: [
              { id: 'my-ingress-deploy', name: 'my-ingress-ingress-nginx-controller', namespace: 'ingress-nginx', replicas: 2, availableReplicas: 2, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3' },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: [
              'Helm release my-ingress created (REVISION 1)',
              'Namespace ingress-nginx created',
              'Deployment my-ingress-ingress-nginx-controller â†’ 2 replicas',
            ],
            highlightedComponent: 'controller',
          },
        },
        {
          id: 'p5-m1-s5',
          title: 'List releases',
          instruction: 'Show all Helm releases in the ingress-nginx namespace.',
          command: 'helm list -n ingress-nginx',
          output: [
            'NAME        NAMESPACE       REVISION  UPDATED                   STATUS    CHART                    APP VERSION',
            'my-ingress  ingress-nginx   1         2026-03-22 10:00:00 UTC   deployed  ingress-nginx-4.11.3     1.11.3',
          ],
          explanation: 'helm list shows all releases in the specified namespace (or all namespaces with -A). REVISION tracks how many times this release has been installed or upgraded. Helm stores release history as Kubernetes Secrets in the release namespace â€” each revision is a separate Secret with the rendered manifests, allowing rollback to any previous state.',
          clusterState: {
            pods: [
              { id: 'my-ingress-ctrl-7f8d2', name: 'my-ingress-ingress-nginx-controller-7f8d2', namespace: 'ingress-nginx', node: 'node-1', status: 'Running', labels: { 'app.kubernetes.io/name': 'ingress-nginx' }, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3', restarts: 0 },
              { id: 'my-ingress-ctrl-9c3a1', name: 'my-ingress-ingress-nginx-controller-9c3a1', namespace: 'ingress-nginx', node: 'node-2', status: 'Running', labels: { 'app.kubernetes.io/name': 'ingress-nginx' }, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3', restarts: 0 },
            ],
            services: [
              { id: 'my-ingress-svc', name: 'my-ingress-ingress-nginx-controller', namespace: 'ingress-nginx', type: 'LoadBalancer', selector: { 'app.kubernetes.io/name': 'ingress-nginx' }, port: 80, clusterIP: '10.96.45.12' },
            ],
            deployments: [
              { id: 'my-ingress-deploy', name: 'my-ingress-ingress-nginx-controller', namespace: 'ingress-nginx', replicas: 2, availableReplicas: 2, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3' },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: ['helm list -n ingress-nginx â†’ my-ingress REVISION 1 deployed'],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p5-m1-s6',
          title: 'Upgrade and rollback',
          instruction: 'Upgrade to 3 replicas, inspect revision history, then roll back to revision 1.',
          command: 'helm upgrade my-ingress ingress-nginx/ingress-nginx --set controller.replicaCount=3 -n ingress-nginx && helm history my-ingress -n ingress-nginx',
          output: [
            'Release "my-ingress" has been upgraded. Happy Helming!',
            'NAME: my-ingress',
            'REVISION: 2',
            'STATUS: deployed',
            '',
            'REVISION  UPDATED                   STATUS      CHART                  DESCRIPTION',
            '1         2026-03-22 10:00:00 UTC   superseded  ingress-nginx-4.11.3   Install complete',
            '2         2026-03-22 10:05:00 UTC   deployed    ingress-nginx-4.11.3   Upgrade complete',
          ],
          explanation: 'helm upgrade increments the REVISION to 2. The previous revision is now "superseded" but still stored. helm history shows every revision with its status and description. To roll back: helm rollback my-ingress 1 -n ingress-nginx â€” Helm re-applies the revision 1 manifests (2 replicas), creating REVISION 3 with description "Rollback to 1". Rollback is always a forward operation â€” it never destroys history.',
          clusterState: {
            pods: [
              { id: 'my-ingress-ctrl-7f8d2', name: 'my-ingress-ingress-nginx-controller-7f8d2', namespace: 'ingress-nginx', node: 'node-1', status: 'Running', labels: { 'app.kubernetes.io/name': 'ingress-nginx' }, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3', restarts: 0 },
              { id: 'my-ingress-ctrl-9c3a1', name: 'my-ingress-ingress-nginx-controller-9c3a1', namespace: 'ingress-nginx', node: 'node-2', status: 'Running', labels: { 'app.kubernetes.io/name': 'ingress-nginx' }, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3', restarts: 0 },
              { id: 'my-ingress-ctrl-4b7e9', name: 'my-ingress-ingress-nginx-controller-4b7e9', namespace: 'ingress-nginx', node: 'node-1', status: 'Running', labels: { 'app.kubernetes.io/name': 'ingress-nginx' }, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3', restarts: 0 },
            ],
            services: [
              { id: 'my-ingress-svc', name: 'my-ingress-ingress-nginx-controller', namespace: 'ingress-nginx', type: 'LoadBalancer', selector: { 'app.kubernetes.io/name': 'ingress-nginx' }, port: 80, clusterIP: '10.96.45.12' },
            ],
            deployments: [
              { id: 'my-ingress-deploy', name: 'my-ingress-ingress-nginx-controller', namespace: 'ingress-nginx', replicas: 3, availableReplicas: 3, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3' },
            ],
            namespaces: ['default', 'ingress-nginx'],
            events: [
              'Helm upgrade my-ingress â†’ REVISION 2 (replicaCount 2â†’3)',
              'REVISION 1: superseded | REVISION 2: deployed',
              'To rollback: helm rollback my-ingress 1 -n ingress-nginx',
            ],
            highlightedComponent: 'controller',
          },
          tip: 'helm rollback my-ingress 1 -n ingress-nginx restores the exact manifests from revision 1. The rollback itself becomes REVISION 3 â€” history is never destroyed.',
        },
      ],
      quiz: [
        {
          id: 'p5-m1-q1',
          question: 'What is the difference between a Helm Chart and a Helm Release?',
          options: [
            'A Chart is a specific version; a Release is the latest version of that chart',
            'A Chart is the packaged template bundle; a Release is a named, installed instance of that chart in the cluster',
            'A Release is stored in a Git repository; a Chart is stored in the cluster',
            'They are different names for the same thing â€” a Chart becomes a Release after it is pushed to Artifact Hub',
          ],
          answer: 1,
          explanation: 'A Chart is the package â€” a directory of YAML templates and a values.yaml file, versioned and distributed via a repository. A Release is what you get when you install a chart: a named, running instance in the cluster. You can install the same chart multiple times (as different release names) to get multiple independent releases.',
        },
        {
          id: 'p5-m1-q2',
          question: 'You install the same Helm chart twice with different release names. What is the result?',
          options: [
            'An error â€” a chart can only be installed once per namespace',
            'The second install overwrites the first',
            'Two independent releases, each with their own set of Kubernetes resources and revision history',
            'One release with doubled replica counts',
          ],
          answer: 2,
          explanation: 'Each helm install with a different release name creates a completely independent release. Resources are named using the release name (e.g., {{ .Release.Name }}-deployment), so they do not conflict. This is how teams run multiple isolated instances of the same software â€” for example, two separate prometheus stacks for different tenants.',
        },
        {
          id: 'p5-m1-q3',
          question: 'Which file in a Helm chart defines the default configuration values?',
          options: [
            'Chart.yaml',
            'templates/values.yaml',
            'values.yaml',
            'defaults.yaml',
          ],
          answer: 2,
          explanation: 'values.yaml at the root of the chart directory contains all default values. Chart.yaml contains chart metadata (name, version, description, dependencies). The templates/ directory contains the Go template YAML files. Operators override values.yaml defaults using --set on the command line or -f to pass a custom values file.',
        },
        {
          id: 'p5-m1-q4',
          question: 'Helm v3 removed which component compared to Helm v2, and why was that a security improvement?',
          options: [
            'Removed chart repositories â€” charts are now stored directly in the cluster as ConfigMaps',
            'Removed Tiller, a server-side component that ran with cluster-admin privileges inside the cluster',
            'Removed the values.yaml concept â€” all configuration is now done via --set flags only',
            'Removed rollback support to simplify the release model',
          ],
          answer: 1,
          explanation: 'Helm v2 required Tiller, a server-side pod running in kube-system with cluster-admin permissions. Any workload that could reach Tiller could issue arbitrary Kubernetes API calls â€” a major privilege escalation risk. Helm v3 is entirely client-side: it uses your kubeconfig credentials directly, so permissions are limited to what your own account allows.',
        },
      ],
    },

    // â”€â”€â”€ Module 2: Kustomize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: 'p5-m2',
      slug: 'kustomize',
      title: 'Kustomize: Environment-Specific Config',
      description: 'Manage per-environment configuration without templating â€” using overlays and patches built into kubectl.',
      duration: '60 min',
      difficulty: 'intermediate',
      theory: `> ðŸ§  **Brain Warm-Up**: Since Kustomize is purely template-free and processes resources using AST (Abstract Syntax Tree) transformation, how does it guarantee that references to renamed resources (like a ConfigMap hash suffix change) are correctly updated in Dependent Deployments or Pods without breaking them?

## The Problem with Helm for Your Own Apps

Helm is powerful, but charts require learning Go template syntax and add indirection. For **your own application** where you just need to change an image tag or replica count between dev and production, this complexity often isn't worth it.

Most teams with first-party apps just need: "take these base manifests, and apply a few differences per environment."

## What is Kustomize?

**Kustomize** is a configuration management tool that is **built directly into kubectl** since Kubernetes 1.14. No installation needed â€” run \`kubectl apply -k\` instead of \`kubectl apply -f\`.

Kustomize does **not** use templating. Instead it uses:
- **Bases**: canonical, shared manifests
- **Overlays**: environment-specific patches applied on top
- **kustomization.yaml**: a manifest that declares what resources to include and what transformations to apply

### Kustomize Compilation Pipeline

\`\`\`
+--------------------+
| Base Manifests     |--+
| (Golden YAMLs)     |  |
+--------------------+  |
                        |      +------------------------+
+--------------------+  +----> |    Kustomize Engine    |
| Overlay Config     |  |      |                        |
| (kustomization)    |--+      |  1. Parse YAML into    |      +--------------------+
+--------------------+  |      |     Abstract Syntax    |      |  Flat Rendered     |
                        |      |     Trees (AST)        | ---> |  Kubernetes YAML   |
+--------------------+  +----> |  2. Generate CM hashes |      |  (No templates)    |
| Patches            |--+      |  3. Apply patches      |      +---------+----------+
| (RFC 6902 / SMP)   |         |  4. Resolve references |                |
+--------------------+         +------------------------+                | (kubectl apply -k)
                                                                         v
                                                              +--------------------+
                                                              | Kubernetes API     |
                                                              +--------------------+
\`\`\`

## Core Concepts

### Base
The base contains your "golden" manifests â€” a Deployment, Service, etc. that work for all environments. No environment-specific values here.

\`\`\`
base/
  deployment.yaml
  service.yaml
  kustomization.yaml   â†� lists: resources: [deployment.yaml, service.yaml]
\`\`\`

### Overlay
An overlay references the base and applies patches. Each environment gets its own overlay directory:

\`\`\`
overlays/
  production/
    kustomization.yaml   â†� references ../../base, adds patches
  staging/
    kustomization.yaml
\`\`\`

### kustomization.yaml
The kustomization file declares:
- Which resources or bases to include
- \`namePrefix\`/\`nameSuffix\` to distinguish environments
- \`images\` to override image tags without editing YAML
- \`commonLabels\` to add labels to all resources
- \`patches\` for surgical changes

## Low-Level AST Manipulation and Hashing

Instead of performing string replacement, Kustomize parses input YAML manifests into **Abstract Syntax Trees (ASTs)** using Golang libraries like \`sigs.k8s.io/yaml\` and \`kyaml\`. This allows Kustomize to be structurally aware of the resources.

1. **ConfigMap/Secret Generator Suffixes**: When using \`configMapGenerator\` or \`secretGenerator\`, Kustomize computes a SHA-256 hash of the payload content and appends it as a suffix to the resource name (e.g. \`my-config-f7b2h38d\`).
2. **Reference Resolution**: To avoid breaking references, the Kustomize engine tracks these name changes. It updates any referencing fieldsâ€”such as \`volumes.configMap.name\`, \`envFrom.configMapRef.name\`, or \`env.valueFrom.configMapKeyRef.name\`â€”within matching Workloads (Deployments, StatefulSets) using built-in field specs that match resource kinds.
3. **Content-Driven Rolling Updates**: By appending content hashes to Secret and ConfigMap names, Kustomize ensures that any configuration change automatically changes the resource name in the Pod spec, forcing the kubelet to perform a clean rolling update of the workload.

## Patch Types

**Strategic Merge Patch (SMP)**: Utilizes the Kubernetes OpenAPI schema to merge structures. For instance, rather than replacing lists completely, it merges container lists by matching the \`name\` field, allowing you to add environment variables or change resource requirements without duplicating the entire container block.

**JSON Patch**: Implements the RFC 6902 standard. It performs precise, step-by-step structural modifications (e.g. \`add\`, \`replace\`, \`remove\`) targeting specific JSONPaths:

\`\`\`yaml
# example JSON patch
- op: replace
  path: /spec/replicas
  value: 3
\`\`\`

## Kustomize vs Helm

| | Kustomize | Helm |
|---|---|---|
| Syntax | Pure YAML, no new language | Go templates |
| Built into kubectl | Yes | No (separate binary) |
| Package versioning | No | Yes (chart versions) |
| Best for | Your own apps | Third-party software |
| Overlays / environments | First-class | Values files (not as structured) |`,
      labSteps: [
        {
          id: 'p5-m2-s1',
          title: 'Understand the directory structure',
          instruction: 'Review a typical Kustomize layout with a base and a production overlay.',
          yamlContent: `# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - deployment.yaml
  - service.yaml

---
# base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
    spec:
      containers:
      - name: webapp
        image: myrepo/webapp:latest

---
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
  - ../../base
namePrefix: prod-
images:
  - name: myrepo/webapp
    newTag: v1.5.2
commonLabels:
  env: production`,
          explanation: 'The base has generic manifests with no environment-specific values. The production overlay references the base, adds a namePrefix (so all resources become prod-webapp instead of webapp), overrides the image tag to v1.5.2, and adds an env: production label to every resource. No template syntax â€” just YAML describing transformations.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'Kustomize structure: base/ + overlays/production/',
              'Base: webapp deployment + service (generic)',
              'Overlay: namePrefix=prod-, image tag=v1.5.2, label env=production',
            ],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p5-m2-s2',
          title: 'Preview the base output',
          instruction: 'Use kubectl kustomize to render the base manifests without applying them.',
          command: 'kubectl kustomize base/',
          output: [
            'apiVersion: apps/v1',
            'kind: Deployment',
            'metadata:',
            '  name: webapp',
            'spec:',
            '  replicas: 1',
            '  template:',
            '    spec:',
            '      containers:',
            '      - image: myrepo/webapp:latest',
            '        name: webapp',
            '---',
            'apiVersion: v1',
            'kind: Service',
            'metadata:',
            '  name: webapp',
          ],
          explanation: 'kubectl kustomize renders the final YAML without applying it â€” like helm template for Helm. This is useful for reviewing what will be sent to the API server. The base output is the raw manifests with no transformations applied. Compare this with the production overlay output in the next step.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['kubectl kustomize base/ â†’ rendered 2 resources (Deployment + Service, no patches)'],
            highlightedComponent: 'apiserver',
          },
          tip: 'kubectl kustomize outputs to stdout so you can pipe it: kubectl kustomize overlays/production/ | kubectl apply -f - (equivalent to kubectl apply -k overlays/production/).',
        },
        {
          id: 'p5-m2-s3',
          title: 'Preview the production overlay',
          instruction: 'Render the production overlay to see how namePrefix and image override are applied.',
          command: 'kubectl kustomize overlays/production/',
          output: [
            'apiVersion: apps/v1',
            'kind: Deployment',
            'metadata:',
            '  labels:',
            '    env: production',
            '  name: prod-webapp',
            'spec:',
            '  replicas: 1',
            '  template:',
            '    metadata:',
            '      labels:',
            '        app: webapp',
            '        env: production',
            '    spec:',
            '      containers:',
            '      - image: myrepo/webapp:v1.5.2',
            '        name: webapp',
          ],
          explanation: 'The production overlay output shows three transformations applied to the base: (1) name changed from webapp to prod-webapp via namePrefix, (2) image tag changed from latest to v1.5.2 via the images override, (3) env: production label added to all resources and pod templates via commonLabels. None of the base files were modified â€” the overlay is purely additive.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'kubectl kustomize overlays/production/ â†’ prod-webapp (image: v1.5.2, label env: production)',
              'Base unchanged â€” overlay is non-destructive',
            ],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p5-m2-s4',
          title: 'Apply the production overlay',
          instruction: 'Deploy the production overlay to the cluster with kubectl apply -k.',
          command: 'kubectl apply -k overlays/production/',
          output: [
            'deployment.apps/prod-webapp created',
            'service/prod-webapp created',
          ],
          explanation: 'kubectl apply -k is the Kustomize-aware form of kubectl apply. It renders the overlay to plain YAML and sends it to the API server in a single operation. The -k flag (vs -f) tells kubectl to treat the argument as a kustomization directory rather than a plain manifest file or directory.',
          clusterState: {
            pods: [
              { id: 'prod-webapp-d7f3a', name: 'prod-webapp-d7f3a', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'webapp', env: 'production' }, image: 'myrepo/webapp:v1.5.2', restarts: 0 },
            ],
            services: [
              { id: 'prod-webapp-svc', name: 'prod-webapp', namespace: 'default', type: 'ClusterIP', selector: { app: 'webapp' }, port: 80, clusterIP: '10.96.88.33' },
            ],
            deployments: [
              { id: 'prod-webapp-deploy', name: 'prod-webapp', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'myrepo/webapp:v1.5.2' },
            ],
            namespaces: ['default'],
            events: [
              'kubectl apply -k overlays/production/',
              'deployment.apps/prod-webapp created',
              'service/prod-webapp created',
            ],
            highlightedComponent: 'controller',
          },
        },
        {
          id: 'p5-m2-s5',
          title: 'Preview changes before applying',
          instruction: 'Use kubectl diff to safely preview what would change before applying an update.',
          command: 'kubectl diff -k overlays/production/',
          output: [
            'diff -u -N /tmp/LIVE/apps.v1.Deployment.default.prod-webapp /tmp/MERGED/apps.v1.Deployment.default.prod-webapp',
            '--- /tmp/LIVE',
            '+++ /tmp/MERGED',
            '@@ -10,7 +10,7 @@',
            '       containers:',
            '-      - image: myrepo/webapp:v1.5.2',
            '+      - image: myrepo/webapp:v1.6.0',
            '         name: webapp',
          ],
          explanation: 'kubectl diff -k compares the rendered overlay against the live cluster state and outputs a standard unified diff. Lines prefixed with - are what is currently running; lines with + are what would be applied. This is a safe read-only operation â€” nothing is changed. Running diff before apply is a production best practice, especially in CI pipelines.',
          clusterState: {
            pods: [
              { id: 'prod-webapp-d7f3a', name: 'prod-webapp-d7f3a', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'webapp', env: 'production' }, image: 'myrepo/webapp:v1.5.2', restarts: 0 },
            ],
            services: [
              { id: 'prod-webapp-svc', name: 'prod-webapp', namespace: 'default', type: 'ClusterIP', selector: { app: 'webapp' }, port: 80, clusterIP: '10.96.88.33' },
            ],
            deployments: [
              { id: 'prod-webapp-deploy', name: 'prod-webapp', namespace: 'default', replicas: 1, availableReplicas: 1, image: 'myrepo/webapp:v1.5.2' },
            ],
            namespaces: ['default'],
            events: [
              'kubectl diff -k overlays/production/ â†’ image tag v1.5.2 â†’ v1.6.0 (preview only, not applied)',
            ],
            highlightedComponent: 'apiserver',
          },
          tip: 'kubectl diff exits with code 0 (no diff) or 1 (diff found). Use this in CI: if kubectl diff -k ... returns exit code 1, require a manual approval before applying.',
        },
      ],
      quiz: [
        {
          id: 'p5-m2-q1',
          question: 'What is the key difference between a Kustomize overlay and a Helm values override?',
          options: [
            'Kustomize overlays require a separate binary; Helm values are built into kubectl',
            'Kustomize overlays use YAML patches applied to a base without templating; Helm values are injected into Go templates',
            'Helm values can only change scalar fields; Kustomize overlays can add entire new resources',
            'They are functionally identical â€” Kustomize and Helm overlays both compile to the same internal format',
          ],
          answer: 1,
          explanation: 'Kustomize uses a patch-based model: your base manifests are real, valid YAML and the overlay applies structural transformations (rename, relabel, image override) without any template syntax. Helm uses Go templates where the final YAML is generated by substituting values into template expressions like {{ .Values.image.tag }}. Kustomize requires no new syntax to learn; Helm requires understanding Go templates.',
        },
        {
          id: 'p5-m2-q2',
          question: 'Where is kustomize installed â€” do you need a separate tool?',
          options: [
            'Yes â€” install with helm plugin install kustomize',
            'Yes â€” download the kustomize binary from GitHub and add it to PATH',
            'No â€” kustomize is built into kubectl since v1.14 and invoked with kubectl apply -k or kubectl kustomize',
            'No â€” kustomize runs as a sidecar container in the cluster',
          ],
          answer: 2,
          explanation: 'Kustomize has been integrated directly into kubectl since Kubernetes 1.14. You use it with kubectl apply -k <dir> or kubectl kustomize <dir>. A standalone kustomize binary also exists (for the latest features and fixes ahead of the kubectl release cycle), but for most use cases the kubectl-integrated version is sufficient and requires no additional installation.',
        },
        {
          id: 'p5-m2-q3',
          question: 'You want to add a label env: production to ALL resources in a Kustomize overlay. Which field in kustomization.yaml handles this?',
          options: [
            'labels:',
            'commonLabels:',
            'patchesStrategicMerge:',
            'resources:',
          ],
          answer: 1,
          explanation: 'commonLabels in kustomization.yaml adds the specified labels to all resources managed by that kustomization, including the pod template spec inside Deployments. It also adds the labels as selector fields where applicable. For adding labels without affecting selectors, use the newer labels: field with includeSelectors: false.',
        },
        {
          id: 'p5-m2-q4',
          question: 'When would you choose Kustomize over Helm for your own app?',
          options: [
            'When you need chart versioning and the ability to share your app config on Artifact Hub',
            'When your app has complex conditional logic in its manifests that requires Go template if/else blocks',
            'When you own the manifests, just need per-environment differences (image tag, replicas, labels), and want pure YAML with kubectl-native tooling',
            'When your team is already using Tiller in the cluster',
          ],
          answer: 2,
          explanation: 'Kustomize shines for first-party applications where you own all the YAML and primarily need environment-specific overrides. The base/overlay model is clean, requires no template syntax, and kubectl apply -k fits naturally into CI pipelines. Choose Helm when you need chart versioning, want to share the package publicly, or have complex conditional logic that Go templates handle better than YAML patches.',
        },
      ],
    },

    // ─── Module 3: CRDs ──────────────────────────────────────────────────────
    {
      id: 'p5-m3',
      slug: 'crds',
      title: 'Custom Resource Definitions (CRDs)',
      description: 'Extend the Kubernetes API with your own resource types and understand the Operator pattern.',
      duration: '75 min',
      difficulty: 'advanced',
      theory: `> 🧠 **Brain Warm-Up**: When a Custom Resource (CR) is deleted, how does the API server coordinate with custom controllers to prevent etcd from leaking orphaned external resources (like cloud load balancers or disks) before the CR's metadata is completely expunged?

## The Kubernetes API is Extensible

The built-in Kubernetes resource types (Pod, Deployment, Service, ConfigMapâ€¦) are not hardcoded into the API server. They are registered resource definitions. And you can add your own.

**Custom Resource Definitions (CRDs)** let you register new resource kinds with the API server. Once registered, your custom resources are full citizens of the Kubernetes API â€” you can \`kubectl get\`, \`kubectl apply\`, \`kubectl delete\`, and \`kubectl describe\` them just like Pods.

### CRD Controller Reconciliation Architecture

\`\`\`
+-------------------------------------------------------------+
|                     Kubernetes API Server                   |
|  +----------------+      +--------+      +---------------+  |
|  | Mutating/Valid | ---> |  etcd  | ---> | HTTP/2 Watch  |  |
|  | Webhooks       |      +--------+      | stream        |  |
+--+----------------+----------------------+-------+-------+--+
                                                   |
                                                   | (Informer / Reflector)
                                                   v
+--------------------------------------------------+----------+
|                 Operator Controller Process                 |
|  +-------------------+        +--------------------------+  |
|  |   Local Cache     | <----> |   SharedIndexInformer    |  |
|  |   (Lister)        |        +------------+-------------+  |
|  +-------------------+                     |                |
|                                            v (events: add/upd/del)
|  +-------------------+        +--------------------------+  |
|  |  Reconcile Loop   | <----- | Rate-Limiting WorkQueue  |  |
|  | (Desired vs Actual|        +--------------------------+  |
|  +---------+---------+                                      |
+------------|------------------------------------------------+
             |
             | (1. Read Desired State / 2. Inspect Actual)
             v
+-------------------------------------------------------------+
|                         Real World                          |
|  +--------------------+        +-------------------------+  |
|  | Cloud Infrastructure|        | Cluster Resources       |  |
|  | (AWS RDS, LB, etc.) |        | (Pods, Services, etc.)  |  |
|  +--------------------+        +-------------------------+  |
+-------------------------------------------------------------+
\`\`\`

## CRD vs CR

| Term | Description |
|---|---|
| **CRD** (CustomResourceDefinition) | The schema â€” tells the API server "a new kind called Database exists, with these fields" |
| **CR** (Custom Resource) | An instance of a CRD â€” like a Pod is an instance of the Pod kind |

The relationship: CRD is to CR as a Go struct is to a Go variable.

## CRDs Alone Do Nothing

This is the crucial insight. When you create a CRD and then create a CR, the API server:
1. Validates the CR against the CRD schema
2. Stores the CR in etcd
3. **Does nothing else**

No actual database is created. No process is started. The CR is just structured data in etcd. To make something happen, you need a **controller**.

## Low-Level Controller Architecture: Informers and Finalizers

Custom controllers (often written in Go using \`controller-runtime\` or \`client-go\`) run as workloads in the cluster and implement a specific reconciliation pattern:

1. **SharedIndexInformer**: Instead of querying the API server continuously, the controller uses an Informer. The Informer opens an HTTP/2 chunked transfer stream (Watch API) to the API server, caches the retrieved objects in a local thread-safe index (\`Lister\`), and propagates event hooks when objects are added, updated, or deleted.
2. **WorkQueue**: Events are pushed to a rate-limiting work queue. This queues tasks, merges duplicate keys, and retries reconciliations using exponential backoff when errors occur.
3. **Finalizers (metadata.finalizers)**: To clean up external resources (like cloud databases or disks) before a CR is deleted from etcd, the controller adds a finalizer string to the CR. When a user deletes the CR, the API server sets a \`deletionTimestamp\` but blocks deletion until all finalizers are removed. The controller detects the deletion timestamp, cleans up the external infrastructure, and then removes its finalizer, allowing the CR to be purged from etcd.
4. **Status Subresource (/status)**: CRDs expose a dedicated \`/status\` subresource. This isolates the status updates from spec changes. Spec edits increment \`metadata.generation\`, triggering a reconcile. Status updates do not. RBAC rules can restrict normal users from modifying the status, ensuring only the controller has permission to write status fields.

## The Controller Pattern

A **controller** is a reconciliation loop:

\`\`\`
loop forever:
  desired = read CR from API server
  actual  = observe current state (running processes, resources)
  if desired != actual:
    take action to move actual â†’ desired
\`\`\`
## CRD Schema Validation

CRDs support OpenAPI v3 schema validation. The API server rejects CRs that violate the schema at admission time â€” before they are stored in etcd:

\`\`\`yaml
schema:
  openAPIV3Schema:
    type: object
    properties:
      spec:
        type: object
        required: ["engine", "version"]
        properties:
          engine:
            type: string
            enum: ["postgresql", "mysql", "redis"]
          version:
            type: string
          storage:
            type: string
\`\`\``,
      labSteps: [
        {
          id: 'p5-m3-s1',
          title: 'Define and apply a CRD',
          instruction: 'Create a CRD for a fictional Database resource kind.',
          command: 'kubectl apply -f database-crd.yaml',
          yamlContent: `apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.example.com
spec:
  group: example.com
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              required: ["engine", "version", "storage"]
              properties:
                engine:
                  type: string
                  enum: ["postgresql", "mysql", "redis"]
                version:
                  type: string
                storage:
                  type: string
  scope: Namespaced
  names:
    plural: databases
    singular: database
    kind: Database
    shortNames:
      - db`,
          output: ['customresourcedefinition.apiextensions.k8s.io/databases.example.com created'],
          explanation: 'The CRD registers a new API group (example.com) and kind (Database) with the API server. scope: Namespaced means instances are tied to a namespace (like Pods), not cluster-wide (like Nodes). The openAPIV3Schema validates that every Database CR has the required engine, version, and storage fields, and that engine is one of the allowed enum values.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'CRD databases.example.com registered with API server',
              'New API endpoint: /apis/example.com/v1/databases',
            ],
            highlightedComponent: 'apiserver',
          },
          tip: 'After applying a CRD, kubectl api-resources | grep example.com will show your new resource type alongside built-in resources.',
        },
        {
          id: 'p5-m3-s2',
          title: 'List CRDs in the cluster',
          instruction: 'Confirm the new CRD appears alongside all other registered CRDs.',
          command: 'kubectl get crds',
          output: [
            'NAME                              CREATED AT',
            'databases.example.com             2026-03-22T10:00:00Z',
          ],
          explanation: 'kubectl get crds lists all CustomResourceDefinitions in the cluster (they are cluster-scoped resources). In a real cluster running cert-manager, Prometheus Operator, or Argo CD, you would see dozens of CRDs here â€” certificates.cert-manager.io, servicemonitors.monitoring.coreos.com, applications.argoproj.io, and many more. Each represents an installed Operator\'s API surface.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: ['kubectl get crds â†’ databases.example.com registered'],
            highlightedComponent: 'apiserver',
          },
        },
        {
          id: 'p5-m3-s3',
          title: 'Create a Custom Resource instance',
          instruction: 'Create an instance of the Database CRD â€” a CR for a PostgreSQL database.',
          command: 'kubectl apply -f my-postgres.yaml',
          yamlContent: `apiVersion: example.com/v1
kind: Database
metadata:
  name: my-postgres
  namespace: default
spec:
  engine: postgresql
  version: "16"
  storage: 10Gi`,
          output: ['database.example.com/my-postgres created'],
          explanation: 'This CR uses the API group (example.com/v1) and kind (Database) that the CRD registered. The API server validates the spec against the openAPIV3Schema and stores it in etcd. If you tried engine: oracle (not in the enum), the request would be rejected immediately with a validation error.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'CR my-postgres (kind: Database) created in default',
              'Spec: engine=postgresql, version=16, storage=10Gi',
              'Stored in etcd â€” no controller watching yet',
            ],
            highlightedComponent: 'etcd',
          },
        },
        {
          id: 'p5-m3-s4',
          title: 'Query the Custom Resource',
          instruction: 'List and describe the Database custom resource using familiar kubectl commands.',
          command: 'kubectl get databases && kubectl describe database my-postgres',
          output: [
            'NAME          AGE',
            'my-postgres   5s',
            '',
            'Name:         my-postgres',
            'Namespace:    default',
            'API Version:  example.com/v1',
            'Kind:         Database',
            'Spec:',
            '  Engine:   postgresql',
            '  Storage:  10Gi',
            '  Version:  16',
            'Events:       <none>',
          ],
          explanation: 'kubectl get databases works exactly like kubectl get pods â€” the CRD registered the plural form "databases". kubectl describe gives the full object with spec fields. Notice Events: <none> â€” without a controller watching databases.example.com, no events are generated. The CR is purely passive data in etcd at this point.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'kubectl get databases â†’ my-postgres (AGE: 5s)',
              'No controller watching â†’ no actual DB created',
            ],
            highlightedComponent: 'etcd',
          },
          tip: 'The short name db also works: kubectl get db. Short names are defined in the CRD under spec.names.shortNames.',
        },
        {
          id: 'p5-m3-s5',
          title: 'Delete the CR and CRD',
          instruction: 'Delete the custom resource instance, then delete the CRD itself to see the cascade.',
          command: 'kubectl delete database my-postgres && kubectl delete crd databases.example.com',
          output: [
            'database.example.com "my-postgres" deleted',
            'customresourcedefinition.apiextensions.k8s.io "databases.example.com" deleted',
          ],
          explanation: 'When you delete a CRD, all instances (CRs) of that CRD are also deleted â€” the CRD owns its CRs. This is why CRD deletion should be done carefully in production: if you uninstall an Operator by deleting its CRDs, all the CR instances (and possibly the resources they represent) are gone too. Operators typically provide an uninstall procedure that handles CR cleanup gracefully before removing CRDs.',
          clusterState: {
            pods: [],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'database.example.com/my-postgres deleted',
              'CRD databases.example.com deleted â†’ all Database CRs cascade-deleted',
            ],
            highlightedComponent: 'apiserver',
          },
        },
      ],
      quiz: [
        {
          id: 'p5-m3-q1',
          question: 'You create a CRD and an instance of the custom resource. What happens automatically?',
          options: [
            'Kubernetes provisions the resource described (e.g., creates an actual database)',
            'The API server validates and stores the CR in etcd, but nothing else happens without a controller',
            'A default controller is automatically started to reconcile the CR',
            'The CR is replicated across all nodes for high availability',
          ],
          answer: 1,
          explanation: 'CRDs alone are passive: they register a new schema with the API server and allow objects matching that schema to be stored in etcd. No action is taken on those objects until a controller (or operator) watches for them and implements reconciliation logic. This separation of schema from behaviour is fundamental to the Kubernetes extensibility model.',
        },
        {
          id: 'p5-m3-q2',
          question: 'What is an Operator in Kubernetes?',
          options: [
            'A human who has cluster-admin privileges and manages the cluster',
            'A CRD paired with a controller that encodes operational knowledge for managing a specific application',
            'A built-in Kubernetes controller that manages StatefulSets',
            'A Helm chart that installs third-party software',
          ],
          answer: 1,
          explanation: 'An Operator is the combination of a CRD (which defines the desired state schema) and a controller (which watches CRs and reconciles actual state toward desired state). The controller encodes human operational knowledge: how to install, upgrade, scale, back up, and recover the application. cert-manager, Argo CD, and the Prometheus Operator are well-known examples.',
        },
        {
          id: 'p5-m3-q3',
          question: 'A CRD defines the schema. What actually ACTS on custom resource instances?',
          options: [
            'The API server â€” it runs a built-in reconciliation loop for all registered CRDs',
            'etcd â€” it triggers webhooks when custom resources are written',
            'A controller (or operator) â€” a reconciliation loop that watches the CRs and takes action',
            'The kubelet on each node â€” it reads CRs and runs the corresponding workloads',
          ],
          answer: 2,
          explanation: 'Controllers (or operators) are the active component. They run a watch loop against the API server, receive notifications when CRs are created/updated/deleted, and implement the reconciliation logic. The API server and etcd are purely passive for CRDs â€” they store and serve objects but do not act on them.',
        },
        {
          id: 'p5-m3-q4',
          question: 'Name two real Kubernetes tools that use the Operator pattern with CRDs.',
          options: [
            'kubectl and kube-proxy',
            'cert-manager (Certificate CRD) and Argo CD (Application CRD)',
            'Helm and Kustomize',
            'metrics-server and the Kubernetes Dashboard',
          ],
          answer: 1,
          explanation: 'cert-manager introduces a Certificate CRD â€” create a Certificate CR and the cert-manager controller talks to Let\'s Encrypt (or another CA) and creates a TLS Secret. Argo CD introduces an Application CRD â€” create an Application CR pointing at a Git repo and the Argo CD controller syncs the repo contents to the cluster. Both are classic Operators: CRD defines desired state, controller makes it real.',
        },
      ],
    },

    // â”€â”€â”€ Module 4: Observability â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: 'p5-m4',
      slug: 'observability',
      title: 'Observability: Metrics, Logging & Tracing',
      description: 'Build the three pillars of observability into your cluster â€” metrics with Prometheus, logs with Loki, and traces with OpenTelemetry.',
      duration: '90 min',
      difficulty: 'advanced',
      theory: `> ðŸ§  **Brain Warm-Up**: Prometheus operator uses ServiceMonitor CRDs to dynamically configure Prometheus scrape targets. Under the hood, how does the Prometheus controller translate a ServiceMonitor custom resource into a Prometheus scrape configuration without requiring a restart of the Prometheus server process?

## The Three Pillars of Observability

To understand what is happening inside a distributed system you need three complementary signals:

| Pillar | What it is | Tooling |
|---|---|---|
| **Metrics** | Numeric time-series data (CPU%, request rate, error rate, latency p99) | Prometheus + Grafana |
| **Logs** | Text events emitted by applications and system components | Fluent Bit â†’ Loki / Elasticsearch |
| **Traces** | End-to-end request flow across microservices | OpenTelemetry â†’ Jaeger / Tempo |

No single pillar is sufficient on its own. Metrics tell you *something is wrong*. Logs tell you *what happened*. Traces tell you *where in the request chain it went wrong*.

### Visualizing Kubernetes Observability Data Flow

\`\`\`
+---------------------------------------------------------------------------------+
|                                Kubernetes Node                                  |
|                                                                                 |
|  +--------------------+  (exposes stats)  +----------------------------------+  |
|  | Application Pod    | ----------------> | Kubelet (Port 10250)             |  |
|  | (cgroups v2 limits)|                   | - Stats Summary API: /stats/sum  |  |
|  |                    |                   +-----------------+----------------+  |
|  | - Stdout/Stderr    |                                     |                   |
|  +---------+----------+                                     v (scrapes stats)   |
|            |                                    +-----------+------------+      |
|            | (writes logs)                      | metrics-server         |      |
|            v                                    | (exposes metrics.k8s)  |      |
|  +---------+----------+                         +-----------+------------+      |
|  | /var/log/pods/     |                                     |                   |
|  +---------+----------+                         +-----------+------------+      |
|            ^                                    v (kubectl top)                 |
|            | (inotify / tail)                   +-----------+------------+      |
|  +---------+----------+                         | API Server / kubectl   |      |
|  | Log DaemonSet      |                         +------------------------+      |
|  | (Fluent Bit / Loki)| ----> [ Loki / ES ]                                     |
|  +--------------------+                                                         |
|                                                                                 |
|  +--------------------+  (/metrics endpoint)    +------------------------+      |
|  | Application Pod B  | <---------------------- | Prometheus Server      |      |
|  +--------------------+  (scrapes HTTP/gRPC)    +-----------+------------+      |
|                                                             |                   |
|                                                             v (visualizes)      |
|                                                         [ Grafana ]             |
+---------------------------------------------------------------------------------+
\`\`\`

## Metrics Stack: Prometheus + Grafana

**Prometheus** collects metrics using a **pull model**: it scrapes HTTP \`/metrics\` endpoints on a schedule. Every pod that exposes Prometheus-format metrics is automatically collected.

Key components:
- **kube-state-metrics**: runs as a Deployment, exposes Kubernetes *object state* as metrics â€” \`kube_pod_status_phase\`, \`kube_deployment_status_replicas_available\`, etc.
- **node-exporter**: runs as a DaemonSet (one per node), exposes *node-level hardware metrics* â€” CPU, memory, disk I/O, network bandwidth
- **Prometheus Operator**: manages Prometheus configuration via CRDs. The **ServiceMonitor** CRD lets you declaratively tell Prometheus "scrape all Services with label app=myapp"
- **Alertmanager**: routes alerts from Prometheus to Slack, PagerDuty, email, etc.

Under the hood, when you apply a \`ServiceMonitor\` CRD, the Prometheus Operator controller detects the change, translates the resource selector parameters into raw Prometheus scrape configuration blocks, writes them into the Prometheus configuration file mounted inside the Prometheus container, and triggers a hot-reload of Prometheus via an HTTP POST request to its \`/-/reload\` API endpoint, preventing any downtime or server restarts.

**Grafana** visualizes Prometheus data with pre-built dashboards (cluster overview, node exporter, workload metrics).

## kubectl top: Quick Resource Usage

\`kubectl top\` requires **metrics-server** â€” a lightweight deployment that aggregates CPU/memory usage from the kubelet on each node.

\`\`\`
kubectl top nodes          # CPU and memory per node
kubectl top pods -A        # CPU and memory per pod, all namespaces
kubectl top pods --sort-by=memory -n production  # sorted by memory
\`\`\`

metrics-server query path:
1. The metrics-server regularly calls the kubelet's Summary API (\`/stats/summary\` on port 10250) on every node.
2. The kubelet reads cgroup files from the host Linux kernel (cgroups v2 paths like \`/sys/fs/cgroup/system.slice/containerd.service/...\`, reading \`cpu.stat\` and \`memory.current\`) to calculate container CPU millicores and memory usage.
3. metrics-server serves these data points through the API extension gateway under the \`metrics.k8s.io\` API path, which kubectl queries.

metrics-server is the data source for HPA. Prometheus is for historical data and alerting.

## Logging Stack

Kubernetes does not provide centralized logging â€” logs are per-pod and lost when the pod is deleted.

The standard pattern:
1. Apps write to **stdout/stderr** (never to files)
2. The container runtime (e.g. \`containerd\`) redirects stdout/stderr streams to host files at \`/var/log/pods/<namespace>_<pod>_<uid>/<container>/<restart_count>.log\`.
3. A **DaemonSet** (Fluent Bit, Fluentd, or Promtail) runs on every node and tails pod logs using Linux kernel \`inotify\` watch events.
4. The DaemonSet queries the local kubelet or API server to append metadata (labels, namespace, annotations) to each log line, before shipping them to a backend like **Loki** (lightweight, indexes metadata only) or **Elasticsearch** (full-text indexed, heavier)

**Structured logging** (JSON format) is strongly preferred:
- Fields are indexable and filterable in any log backend
- Machines can parse and route by field values
- Plain text logs require fragile regex parsing

## Distributed Tracing & Context Propagation

**OpenTelemetry** is the CNCF standard SDK for instrumentation. Add it to your application code to emit trace spans. Spans are collected by an OpenTelemetry Collector and forwarded to a backend:
- **Jaeger**: open-source trace backend with UI
- **Grafana Tempo**: Grafana-native trace backend that integrates with Loki

For tracing to work across microservice hops, applications must propagate the trace context. The standard W3C Trace Context defines headers like \`traceparent\` (e.g. \`00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01\`), which contains the overall Trace ID, Parent Span ID, and flags. When Service A calls Service B, it injects this header into HTTP/gRPC metadata. Service B extracts it to establish the parent-child relationship between spans.`,
      labSteps: [
        {
          id: 'p5-m4-s1',
          title: 'Install metrics-server',
          instruction: 'Deploy metrics-server so kubectl top can show real-time resource usage.',
          command: 'kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml',
          output: [
            'serviceaccount/metrics-server created',
            'clusterrole.rbac.authorization.k8s.io/system:aggregated-metrics-reader created',
            'clusterrolebinding.rbac.authorization.k8s.io/metrics-server:system:auth-delegator created',
            'rolebinding.rbac.authorization.k8s.io/metrics-server-auth-reader created',
            'apiservice.apiregistration.k8s.io/v1beta1.metrics.k8s.io created',
            'deployment.apps/metrics-server created',
            'service/metrics-server created',
          ],
          explanation: 'metrics-server is a Kubernetes Metrics API implementation. It aggregates CPU and memory usage reported by the kubelet on each node. It exposes data via the metrics.k8s.io API extension (note the apiservice resource created). kubectl top and HPA both use this API. metrics-server stores only the latest data point â€” for historical metrics, use Prometheus.',
          clusterState: {
            pods: [
              { id: 'metrics-server-7b4d2', name: 'metrics-server-7b4d2', namespace: 'kube-system', node: 'node-1', status: 'Running', labels: { 'k8s-app': 'metrics-server' }, image: 'registry.k8s.io/metrics-server/metrics-server:v0.7.2', restarts: 0 },
            ],
            services: [
              { id: 'metrics-server-svc', name: 'metrics-server', namespace: 'kube-system', type: 'ClusterIP', selector: { 'k8s-app': 'metrics-server' }, port: 443, clusterIP: '10.96.10.44' },
            ],
            deployments: [
              { id: 'metrics-server-deploy', name: 'metrics-server', namespace: 'kube-system', replicas: 1, availableReplicas: 1, image: 'registry.k8s.io/metrics-server/metrics-server:v0.7.2' },
            ],
            namespaces: ['default', 'kube-system'],
            events: ['metrics-server deployed in kube-system', 'metrics.k8s.io API registered'],
            highlightedComponent: 'kubelet',
          },
          tip: 'On kind or minikube clusters, metrics-server needs --kubelet-insecure-tls flag. Add it to the deployment args if kubectl top returns "metrics not available yet".',
        },
        {
          id: 'p5-m4-s2',
          title: 'Check node resource usage',
          instruction: 'Use kubectl top to see CPU and memory consumption per node.',
          command: 'kubectl top nodes',
          output: [
            'NAME     CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%',
            'node-1   248m         6%     2143Mi          27%',
            'node-2   183m         4%     1876Mi          23%',
          ],
          explanation: 'CPU is shown in millicores (m) â€” 248m = 0.248 CPU cores. Memory is in mebibytes (Mi). CPU% and MEMORY% are relative to the node\'s allocatable capacity (total minus reserved for system). A node at >85% memory is at risk of triggering node-pressure evictions. This command is the fastest way to identify a hot node.',
          clusterState: {
            pods: [
              { id: 'metrics-server-7b4d2', name: 'metrics-server-7b4d2', namespace: 'kube-system', node: 'node-1', status: 'Running', labels: { 'k8s-app': 'metrics-server' }, image: 'registry.k8s.io/metrics-server/metrics-server:v0.7.2', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'kube-system'],
            events: [
              'kubectl top nodes â†’ node-1: 248m CPU (6%), 2143Mi mem (27%)',
              'kubectl top nodes â†’ node-2: 183m CPU (4%), 1876Mi mem (23%)',
            ],
            highlightedComponent: 'kubelet',
          },
        },
        {
          id: 'p5-m4-s3',
          title: 'Check pod resource usage',
          instruction: 'Show per-pod CPU and memory usage across all namespaces.',
          command: 'kubectl top pods -A',
          output: [
            'NAMESPACE     NAME                                         CPU(cores)   MEMORY(bytes)',
            'default       prod-webapp-d7f3a                            12m          48Mi',
            'ingress-nginx my-ingress-ingress-nginx-controller-7f8d2    34m          112Mi',
            'ingress-nginx my-ingress-ingress-nginx-controller-9c3a1    31m          108Mi',
            'kube-system   coredns-6f6b679f8f-xr9t2                    4m           15Mi',
            'kube-system   metrics-server-7b4d2                         3m           22Mi',
          ],
          explanation: 'kubectl top pods -A shows consumption across all namespaces. This is the fastest way to find a runaway pod consuming unexpected resources. Sort by memory with --sort-by=memory or by CPU with --sort-by=cpu. If a pod has no resource requests set, kubectl top will still show actual usage â€” but the scheduler had no information to make a good placement decision.',
          clusterState: {
            pods: [
              { id: 'prod-webapp-d7f3a', name: 'prod-webapp-d7f3a', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'webapp' }, image: 'myrepo/webapp:v1.5.2', restarts: 0 },
              { id: 'my-ingress-ctrl-7f8d2', name: 'my-ingress-ingress-nginx-controller-7f8d2', namespace: 'ingress-nginx', node: 'node-1', status: 'Running', labels: { 'app.kubernetes.io/name': 'ingress-nginx' }, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3', restarts: 0 },
              { id: 'metrics-server-7b4d2', name: 'metrics-server-7b4d2', namespace: 'kube-system', node: 'node-1', status: 'Running', labels: { 'k8s-app': 'metrics-server' }, image: 'registry.k8s.io/metrics-server/metrics-server:v0.7.2', restarts: 0 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default', 'ingress-nginx', 'kube-system'],
            events: ['kubectl top pods -A â†’ per-pod CPU and memory across all namespaces'],
            highlightedComponent: 'kubelet',
          },
          tip: 'kubectl top pods --sort-by=memory -n production to find the biggest memory consumers in a specific namespace.',
        },
        {
          id: 'p5-m4-s4',
          title: 'Deploy Prometheus + Grafana stack',
          instruction: 'Install the kube-prometheus-stack Helm chart â€” a full observability stack in one command.',
          command: 'helm repo add prometheus-community https://prometheus-community.github.io/helm-charts && helm install kube-prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace',
          output: [
            '"prometheus-community" has been added to your repositories',
            'NAME: kube-prometheus',
            'NAMESPACE: monitoring',
            'STATUS: deployed',
            'REVISION: 1',
            'NOTES:',
            'kube-prometheus-stack has been installed.',
            'Visit https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack',
          ],
          explanation: 'kube-prometheus-stack is a meta-chart that installs Prometheus Operator, Prometheus, Grafana, Alertmanager, node-exporter (as DaemonSet), kube-state-metrics, and a set of pre-built dashboards and alert rules. This single helm install replaces hundreds of lines of hand-crafted YAML. Helm is ideal here because this is third-party software with complex configuration managed by the chart maintainers.',
          clusterState: {
            pods: [
              { id: 'prometheus-kube-prometheus-0', name: 'prometheus-kube-prometheus-prometheus-0', namespace: 'monitoring', node: 'node-1', status: 'Running', labels: { app: 'prometheus' }, image: 'quay.io/prometheus/prometheus:v2.55.1', restarts: 0 },
              { id: 'kube-prometheus-grafana-7d9f3', name: 'kube-prometheus-grafana-7d9f3', namespace: 'monitoring', node: 'node-2', status: 'Running', labels: { 'app.kubernetes.io/name': 'grafana' }, image: 'docker.io/grafana/grafana:11.4.0', restarts: 0 },
              { id: 'node-exporter-node1', name: 'kube-prometheus-prometheus-node-exporter-node1', namespace: 'monitoring', node: 'node-1', status: 'Running', labels: { app: 'prometheus-node-exporter' }, image: 'quay.io/prometheus/node-exporter:v1.8.2', restarts: 0 },
              { id: 'node-exporter-node2', name: 'kube-prometheus-prometheus-node-exporter-node2', namespace: 'monitoring', node: 'node-2', status: 'Running', labels: { app: 'prometheus-node-exporter' }, image: 'quay.io/prometheus/node-exporter:v1.8.2', restarts: 0 },
              { id: 'kube-state-metrics-6c8b2', name: 'kube-prometheus-kube-state-metrics-6c8b2', namespace: 'monitoring', node: 'node-1', status: 'Running', labels: { 'app.kubernetes.io/name': 'kube-state-metrics' }, image: 'registry.k8s.io/kube-state-metrics/kube-state-metrics:v2.13.0', restarts: 0 },
            ],
            services: [
              { id: 'grafana-svc', name: 'kube-prometheus-grafana', namespace: 'monitoring', type: 'ClusterIP', selector: { 'app.kubernetes.io/name': 'grafana' }, port: 80, clusterIP: '10.96.55.21' },
              { id: 'prometheus-svc', name: 'kube-prometheus-kube-prometheus-prometheus', namespace: 'monitoring', type: 'ClusterIP', selector: { app: 'prometheus' }, port: 9090, clusterIP: '10.96.55.22' },
            ],
            deployments: [
              { id: 'grafana-deploy', name: 'kube-prometheus-grafana', namespace: 'monitoring', replicas: 1, availableReplicas: 1, image: 'docker.io/grafana/grafana:11.4.0' },
              { id: 'kube-state-metrics-deploy', name: 'kube-prometheus-kube-state-metrics', namespace: 'monitoring', replicas: 1, availableReplicas: 1, image: 'registry.k8s.io/kube-state-metrics/kube-state-metrics:v2.13.0' },
            ],
            namespaces: ['default', 'ingress-nginx', 'kube-system', 'monitoring'],
            events: [
              'Helm release kube-prometheus deployed in monitoring',
              'Prometheus + Grafana + Alertmanager + node-exporter + kube-state-metrics installed',
            ],
            highlightedComponent: 'controller',
          },
        },
        {
          id: 'p5-m4-s5',
          title: 'Verify the monitoring stack',
          instruction: 'Confirm all monitoring components are running in the monitoring namespace.',
          command: 'kubectl get pods -n monitoring',
          output: [
            'NAME                                                      READY   STATUS    RESTARTS   AGE',
            'alertmanager-kube-prometheus-kube-alertmanager-0          2/2     Running   0          2m',
            'kube-prometheus-grafana-7d9f3                             3/3     Running   0          2m',
            'kube-prometheus-kube-state-metrics-6c8b2                  1/1     Running   0          2m',
            'kube-prometheus-prometheus-node-exporter-node1            1/1     Running   0          2m',
            'kube-prometheus-prometheus-node-exporter-node2            1/1     Running   0          2m',
            'prometheus-kube-prometheus-prometheus-0                   2/2     Running   0          2m',
          ],
          explanation: 'The monitoring stack includes: Prometheus (scrapes metrics, stores time-series), Grafana (visualization), Alertmanager (routes alerts), node-exporter on every node (DaemonSet â€” one pod per node, hardware metrics), and kube-state-metrics (Kubernetes object state metrics). node-exporter pods show a pod per node â€” that is the DaemonSet guarantee.',
          clusterState: {
            pods: [
              { id: 'prometheus-kube-prometheus-0', name: 'prometheus-kube-prometheus-prometheus-0', namespace: 'monitoring', node: 'node-1', status: 'Running', labels: { app: 'prometheus' }, image: 'quay.io/prometheus/prometheus:v2.55.1', restarts: 0 },
              { id: 'kube-prometheus-grafana-7d9f3', name: 'kube-prometheus-grafana-7d9f3', namespace: 'monitoring', node: 'node-2', status: 'Running', labels: { 'app.kubernetes.io/name': 'grafana' }, image: 'docker.io/grafana/grafana:11.4.0', restarts: 0 },
              { id: 'node-exporter-node1', name: 'kube-prometheus-prometheus-node-exporter-node1', namespace: 'monitoring', node: 'node-1', status: 'Running', labels: { app: 'prometheus-node-exporter' }, image: 'quay.io/prometheus/node-exporter:v1.8.2', restarts: 0 },
              { id: 'node-exporter-node2', name: 'kube-prometheus-prometheus-node-exporter-node2', namespace: 'monitoring', node: 'node-2', status: 'Running', labels: { app: 'prometheus-node-exporter' }, image: 'quay.io/prometheus/node-exporter:v1.8.2', restarts: 0 },
              { id: 'kube-state-metrics-6c8b2', name: 'kube-prometheus-kube-state-metrics-6c8b2', namespace: 'monitoring', node: 'node-1', status: 'Running', labels: { 'app.kubernetes.io/name': 'kube-state-metrics' }, image: 'registry.k8s.io/kube-state-metrics/kube-state-metrics:v2.13.0', restarts: 0 },
            ],
            services: [
              { id: 'grafana-svc', name: 'kube-prometheus-grafana', namespace: 'monitoring', type: 'ClusterIP', selector: { 'app.kubernetes.io/name': 'grafana' }, port: 80, clusterIP: '10.96.55.21' },
            ],
            deployments: [
              { id: 'grafana-deploy', name: 'kube-prometheus-grafana', namespace: 'monitoring', replicas: 1, availableReplicas: 1, image: 'docker.io/grafana/grafana:11.4.0' },
            ],
            namespaces: ['default', 'ingress-nginx', 'kube-system', 'monitoring'],
            events: ['All 6 monitoring pods Running (Prometheus, Grafana, Alertmanager, 2x node-exporter, kube-state-metrics)'],
            highlightedComponent: 'kubelet',
          },
          tip: 'Default Grafana credentials: admin / prom-operator. Change these immediately in a real cluster via the grafana.adminPassword value.',
        },
        {
          id: 'p5-m4-s6',
          title: 'Access Grafana dashboards',
          instruction: 'Port-forward the Grafana service to your local machine and explore the pre-built dashboards.',
          command: 'kubectl port-forward svc/kube-prometheus-grafana 3000:80 -n monitoring',
          output: [
            'Forwarding from 127.0.0.1:3000 -> 3000',
            'Forwarding from [::1]:3000 -> 3000',
          ],
          explanation: 'kubectl port-forward creates a tunnel from your local port 3000 to the Grafana service\'s port 80 in the cluster. Navigate to http://localhost:3000 (admin / prom-operator). The kube-prometheus-stack pre-installs 30+ dashboards including: Kubernetes / Cluster Overview (node CPU, memory, pod count), Node Exporter / Nodes (per-node hardware metrics), Kubernetes / Workloads (per-namespace deployment health), and Kubernetes / Persistent Volumes.',
          clusterState: {
            pods: [
              { id: 'prometheus-kube-prometheus-0', name: 'prometheus-kube-prometheus-prometheus-0', namespace: 'monitoring', node: 'node-1', status: 'Running', labels: { app: 'prometheus' }, image: 'quay.io/prometheus/prometheus:v2.55.1', restarts: 0 },
              { id: 'kube-prometheus-grafana-7d9f3', name: 'kube-prometheus-grafana-7d9f3', namespace: 'monitoring', node: 'node-2', status: 'Running', labels: { 'app.kubernetes.io/name': 'grafana' }, image: 'docker.io/grafana/grafana:11.4.0', restarts: 0 },
              { id: 'node-exporter-node1', name: 'kube-prometheus-prometheus-node-exporter-node1', namespace: 'monitoring', node: 'node-1', status: 'Running', labels: { app: 'prometheus-node-exporter' }, image: 'quay.io/prometheus/node-exporter:v1.8.2', restarts: 0 },
              { id: 'node-exporter-node2', name: 'kube-prometheus-prometheus-node-exporter-node2', namespace: 'monitoring', node: 'node-2', status: 'Running', labels: { app: 'prometheus-node-exporter' }, image: 'quay.io/prometheus/node-exporter:v1.8.2', restarts: 0 },
              { id: 'kube-state-metrics-6c8b2', name: 'kube-prometheus-kube-state-metrics-6c8b2', namespace: 'monitoring', node: 'node-1', status: 'Running', labels: { 'app.kubernetes.io/name': 'kube-state-metrics' }, image: 'registry.k8s.io/kube-state-metrics/kube-state-metrics:v2.13.0', restarts: 0 },
            ],
            services: [
              { id: 'grafana-svc', name: 'kube-prometheus-grafana', namespace: 'monitoring', type: 'ClusterIP', selector: { 'app.kubernetes.io/name': 'grafana' }, port: 80, clusterIP: '10.96.55.21' },
            ],
            deployments: [
              { id: 'grafana-deploy', name: 'kube-prometheus-grafana', namespace: 'monitoring', replicas: 1, availableReplicas: 1, image: 'docker.io/grafana/grafana:11.4.0' },
            ],
            namespaces: ['default', 'ingress-nginx', 'kube-system', 'monitoring'],
            events: [
              'kubectl port-forward svc/kube-prometheus-grafana 3000:80 -n monitoring',
              'Grafana accessible at http://localhost:3000 (admin / prom-operator)',
              '30+ pre-built dashboards: cluster overview, node exporter, workload metrics',
            ],
            highlightedComponent: 'apiserver',
          },
        },
      ],
      quiz: [
        {
          id: 'p5-m4-q1',
          question: 'kubectl logs stops working for a pod that crashed 2 days ago and was replaced. How do you access those historical logs?',
          options: [
            'kubectl logs --history <pod-name>',
            'kubectl describe pod <pod-name> shows the last 1000 log lines permanently',
            'Use a centralized log aggregation backend (Loki, Elasticsearch) that collected logs from the DaemonSet log forwarder before the pod was deleted',
            'kubectl logs --previous <pod-name> always works regardless of how long ago the pod crashed',
          ],
          answer: 2,
          explanation: 'kubectl logs (and kubectl logs --previous) only work while the pod still exists on the node. Once a pod is deleted or evicted, its logs are gone from the node filesystem. Centralized logging â€” a DaemonSet (Fluent Bit, Promtail) shipping logs to Loki or Elasticsearch â€” is the only way to retain logs beyond the pod lifecycle. kubectl logs --previous shows the previous container in the same pod, not logs from days ago.',
        },
        {
          id: 'p5-m4-q2',
          question: 'What is the difference between metrics-server and kube-state-metrics?',
          options: [
            'metrics-server is open-source; kube-state-metrics is a paid enterprise product',
            'metrics-server exposes real-time CPU/memory from kubelets (used by HPA and kubectl top); kube-state-metrics exposes Kubernetes object state (deployment replicas, pod phases) as Prometheus metrics',
            'kube-state-metrics replaces metrics-server and does everything metrics-server does plus more',
            'metrics-server stores 30 days of history; kube-state-metrics stores only the latest data point',
          ],
          answer: 1,
          explanation: 'metrics-server aggregates live resource usage (CPU cores, memory bytes) from the kubelet on each node and exposes them via the metrics.k8s.io API. It stores only the latest value. kube-state-metrics watches the Kubernetes API and converts object state into Prometheus-format metrics â€” is the deployment at desired replicas? is the pod in CrashLoopBackOff? These are completely different data sources and most production clusters run both.',
        },
        {
          id: 'p5-m4-q3',
          question: 'Prometheus uses a pull or push model for collecting metrics?',
          options: [
            'Push â€” applications send metrics to Prometheus on each event',
            'Pull â€” Prometheus scrapes /metrics endpoints on a configurable schedule',
            'Both â€” Prometheus uses push for counters and pull for gauges',
            'Neither â€” Prometheus only reads from a central metrics database',
          ],
          answer: 1,
          explanation: 'Prometheus uses a pull (scrape) model: it periodically sends HTTP GET requests to /metrics endpoints on the targets it is configured to watch. This makes Prometheus the authority on when and how often to collect data, and means the target does not need to know where Prometheus is. The Pushgateway exists for short-lived jobs that cannot be scraped, but it is the exception, not the rule.',
        },
        {
          id: 'p5-m4-q4',
          question: 'Why is structured (JSON) logging preferred over plain text logs in Kubernetes?',
          options: [
            'JSON logs are smaller and use less disk space than plain text',
            'Kubernetes requires JSON logs â€” plain text logs cause errors in kubelet',
            'Structured logs have machine-parseable fields that can be indexed, filtered, and alerted on by log backends without fragile regex parsing',
            'JSON logs are automatically forwarded to Prometheus as metrics',
          ],
          answer: 2,
          explanation: 'Structured logs (JSON) emit each log entry as a JSON object with defined fields (timestamp, level, message, request_id, user_id, etc.). Log backends (Loki, Elasticsearch) can index these fields directly, enabling precise filtering ("show all ERROR logs for user_id=123") and reliable alerting ("alert if error_rate > 5%"). Plain text requires brittle regex patterns to extract the same information and breaks whenever the log format changes.',
        },
        {
          id: 'p5-m4-q5',
          question: 'Which observability pillar helps you understand why a specific user request was slow across multiple microservices?',
          options: [
            'Metrics â€” a Prometheus query can show per-service latency breakdown',
            'Logs â€” correlating log timestamps across services reveals the slow step',
            'Traces â€” a distributed trace shows the end-to-end call chain with per-span timing, identifying exactly which service or database call added latency',
            'kubectl top â€” it shows real-time latency per pod',
          ],
          answer: 2,
          explanation: 'Distributed tracing is specifically designed for this. A trace captures the complete request flow: Service A called Service B (12ms), which called the database (340ms â€” the bottleneck), which returned to Service B (2ms), which returned to Service A. Metrics can tell you the p99 latency is high; traces tell you exactly which hop in the chain is responsible. OpenTelemetry is the standard instrumentation SDK; Jaeger and Grafana Tempo are popular backends.',
        },
      ],
    },

    // â”€â”€â”€ Module 5: Production Readiness â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: 'p5-m5',
      slug: 'production-readiness',
      title: 'Production Readiness Checklist',
      description: 'Apply everything from the course â€” a comprehensive checklist for running Kubernetes workloads safely in production.',
      duration: '60 min',
      difficulty: 'advanced',
      theory: `> ðŸ§  **Brain Warm-Up**: When a worker node experiences disk pressure or memory pressure, the kubelet eviction manager initiates pod evictions. How does the kubelet choose which pods to evict first, and how do Pod QOS classes (Guaranteed, Burstable, BestEffort) and PodDisruptionBudgets affect this selection?

## Production is Different

A cluster that works in development often fails in production in surprising ways. The difference is not just traffic volume â€” it is the accumulation of small omissions: no resource limits, no probes, no network policies, no log aggregation.

This module ties together every topic from the course into a production readiness checklist.

### Pod Quality of Service (QoS) & Eviction Hierarchy

\`\`\`
                EVICTION / OOM-KILL PRIORITY HIERARCHY

     +----------------------------------------------------+  - High Priority Eviction
     | BestEffort QoS                                     |  - oom_score_adj: 1000
     | (No resource requests or limits configured)        |  - First to be terminated
     +----------------------------------------------------+
     | Burstable QoS                                      |  - Medium Priority Eviction
     | (Requests set; limits optionally set but not equal)|  - oom_score_adj: dynamic
     |                                                    |    (1000 - 10 * req/cap)
     +----------------------------------------------------+
     | Guaranteed QoS                                     |  - Lowest Priority Eviction
     | (Requests == Limits for all CPUs and Memory)       |  - oom_score_adj: -997
     |                                                    |  - Shielded from OOM-kill
     +----------------------------------------------------+
\`\`\`

## Low-Level Eviction Mechanics & Linux OOM Configuration

When a node runs low on physical memory or disk space, the kubelet Eviction Manager initiates hard or soft evictions to keep the node OS stable:

1. **Eviction Thresholds**: By default, kubelet monitors resource usage and triggers evictions when memory availability falls below 100Mi or node disk storage is less than 10%.
2. **QoS Classes & Eviction Ranking**: The kubelet ranks pods for eviction according to their resource usage relative to their requests, sorted by QoS class:
   - **BestEffort**: Pods with no CPU/memory requests or limits set. The kubelet configures their containers with Linux \`/proc/<pid>/oom_score_adj\` set to \`1000\`. These are the first to be terminated.
   - **Burstable**: Pods with requests set, but limits do not match requests or are omitted. The oom_score_adj is computed dynamically as \`1000 - (10 * memory_request / node_capacity)\`. If they consume more than their requested memory, they are evicted before Guaranteed pods.
   - **Guaranteed**: Pods where requests equal limits for all CPUs and memory across all containers. The oom_score_adj is set to \`-997\`. These are protected and only evicted if the node runs completely out of memory and no other lower-priority pods exist.
3. **PodDisruptionBudget (PDB) Limits**: PDBs (e.g. \`maxUnavailable: 1\`) are respected during voluntary cluster admin actions (like \`kubectl drain\`) by using the API server's Eviction endpoint. However, during node-pressure crises, the local kubelet executes involuntary evictions directly and ignores PDBs to protect node integrity.
4. **Topology Spread Constraints**: In production, workloads should leverage topology spread constraints and anti-affinity rules to distribute pods across hostnames or availability zones, ensuring single-node or single-zone failures don't cause complete service outage.
5. **API Token Hardening**: Disabling ServiceAccount token mounting (\`automountServiceAccountToken: false\`) ensures that compromised containers do not have immediate access to the API server credentials at \`/var/run/secrets/kubernetes.io/serviceaccount/token\`.

## Checklist: Workload Configuration

**Every production Pod must have:**

- âœ… **Resource requests and limits** on every container â€” without requests, the scheduler cannot place pods correctly; without limits, one runaway pod can OOMKill its neighbors
- âœ… **Liveness probe** â€” tells Kubernetes when to restart a container that is deadlocked or hung
- âœ… **Readiness probe** â€” tells Kubernetes when the container is ready to receive traffic (prevents requests to a pod still starting up)
- âœ… **Multiple replicas** for all stateless apps â€” a single-replica deployment has zero tolerance for node failure or rolling update disruption
- âœ… **PodDisruptionBudget** for critical services â€” limits voluntary disruptions (node drains, cluster upgrades) to maintain availability
- âœ… **Pod anti-affinity** â€” spread replicas across nodes (or availability zones) so a single node failure does not take all replicas offline

## Checklist: Networking & Security

- âœ… **Services use ClusterIP** internally; **Ingress** for external HTTP/HTTPS with TLS termination
- âœ… **NetworkPolicies**: default-deny all ingress/egress, then explicit allow rules for required traffic
- âœ… **Secrets** for all sensitive data â€” never hard-code passwords in ConfigMaps or environment variables
- âœ… **RBAC**: dedicated ServiceAccounts per application, least-privilege Roles â€” no wildcard verbs
- âœ… **automountServiceAccountToken: false** on every Pod that does not call the Kubernetes API

## Checklist: Reliability

- âœ… **Namespaces + ResourceQuotas** per team or environment â€” prevent one team from starving others
- âœ… **Pod topology spread constraints** for zone-aware scheduling
- âœ… **HPA** for traffic-sensitive services â€” scale out automatically under load
- âœ… **Cluster Autoscaler** for node-level scaling â€” let the cluster grow and shrink with demand

## Checklist: Observability

- âœ… **metrics-server + Prometheus + Grafana** â€” real-time and historical metrics
- âœ… **Centralized log aggregation** (Loki/ELK) â€” logs survive pod deletion
- âœ… **Alerts** configured for: pod CrashLoopBackOff, OOMKilled, high error rates, disk pressure, certificate expiry

## Checklist: Operations

- âœ… **Regular etcd backups** â€” etcd is the source of truth; losing it means losing the entire cluster state
- âœ… **Cluster upgrade plan** â€” Kubernetes supports N-2 version skew; upgrade one minor version at a time, control plane before nodes
- âœ… **Helm or Kustomize** for all deployments â€” no manual \`kubectl apply\` in production
- âœ… **GitOps** (ArgoCD or Flux) â€” Git is the source of truth; every cluster change goes through pull request review and is automatically reconciled

## GitOps

GitOps means: the desired state of the cluster is declared in Git, and an agent (ArgoCD, Flux) continuously reconciles the cluster toward that state.

Benefits:
- **Auditability**: every change has a Git commit, author, and timestamp
- **Rollback**: git revert undoes any change
- **Drift detection**: the agent alerts when cluster state diverges from Git
- **No direct kubectl access** needed in production â€” all changes go through Git`,
      labSteps: [
        {
          id: 'p5-m5-s1',
          title: 'Identify a bad pod spec',
          instruction: 'Review this production-violating pod spec and identify all the problems.',
          yamlContent: `# BAD: do not deploy this in production
apiVersion: v1
kind: Pod
metadata:
  name: insecure-app
spec:
  # Problem 1: no serviceAccountName â†’ uses default SA (over-permissive)
  # automountServiceAccountToken not set â†’ API token mounted by default
  containers:
  - name: app
    image: myrepo/app:latest   # Problem 2: mutable tag, not pinned
    # Problem 3: no resource requests or limits
    # Problem 4: no liveness probe
    # Problem 5: no readiness probe
    env:
    - name: DB_PASSWORD
      value: "hunter2"        # Problem 6: secret in plain env var
    volumeMounts:
    - name: host-vol
      mountPath: /data
  volumes:
  - name: host-vol
    hostPath:                  # Problem 7: hostPath volume (node filesystem access)
      path: /var/data`,
          explanation: 'This single pod spec has 7 production violations: (1) default ServiceAccount with broad API access, (2) :latest tag makes deployments non-reproducible, (3) no resource requests means the scheduler is blind and no limits means one container can starve neighbours, (4-5) no liveness/readiness probes means traffic is sent to unready pods and hung pods are never restarted, (6) plaintext secret in env â€” visible in kubectl describe and etcd, (7) hostPath mounts the node filesystem into the container â€” a container escape can access all node data.',
          clusterState: {
            pods: [
              { id: 'insecure-app', name: 'insecure-app', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'insecure-app' }, image: 'myrepo/app:latest', restarts: 3 },
            ],
            services: [],
            deployments: [],
            namespaces: ['default'],
            events: [
              'WARNING: insecure-app has 7 production violations',
              'No resources, no probes, no SA, hostPath volume, plaintext secret',
            ],
            highlightedComponent: 'kubelet',
          },
        },
        {
          id: 'p5-m5-s2',
          title: 'Apply the production-hardened spec',
          instruction: 'Review the corrected version with every violation fixed.',
          command: 'kubectl apply -f secure-app.yaml',
          yamlContent: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: secure-app
  template:
    metadata:
      labels:
        app: secure-app
    spec:
      serviceAccountName: secure-app-sa   # dedicated SA
      automountServiceAccountToken: false  # no API access needed
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: secure-app
            topologyKey: kubernetes.io/hostname
      containers:
      - name: app
        image: myrepo/app:v2.3.1          # pinned tag
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:             # secret from a Secret object
              name: app-db-secret
              key: password`,
          output: [
            'serviceaccount/secure-app-sa created',
            'deployment.apps/secure-app created',
          ],
          explanation: 'Every violation is fixed: dedicated SA with automountServiceAccountToken: false, pinned image tag, resource requests and limits, liveness and readiness probes, password from a Secret object, no hostPath, pod anti-affinity to spread replicas across nodes, and non-root securityContext. This is the minimum bar for a production workload.',
          clusterState: {
            pods: [
              { id: 'secure-app-8f3d1', name: 'secure-app-8f3d1', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'secure-app' }, image: 'myrepo/app:v2.3.1', restarts: 0 },
              { id: 'secure-app-2c9b7', name: 'secure-app-2c9b7', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'secure-app' }, image: 'myrepo/app:v2.3.1', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'secure-app-deploy', name: 'secure-app', namespace: 'default', replicas: 2, availableReplicas: 2, image: 'myrepo/app:v2.3.1' },
            ],
            namespaces: ['default'],
            events: [
              'secure-app deployed: 2 replicas (node-1 + node-2, anti-affinity)',
              'Resources set, probes configured, SA isolated, secret from Secret object',
            ],
            highlightedComponent: 'scheduler',
          },
        },
        {
          id: 'p5-m5-s3',
          title: 'Check default ServiceAccount permissions',
          instruction: 'Show how over-permissive the default ServiceAccount is, then disable auto-mounting.',
          command: 'kubectl auth can-i --list --as=system:serviceaccount:default:default',
          output: [
            'Resources   Non-Resource URLs   Resource Names   Verbs',
            '*.*         []                  []               [*]',
            '            [*]                 []               [*]',
          ],
          explanation: 'On a cluster with default RBAC settings, the default ServiceAccount in the default namespace has wildcard (*) permissions â€” full cluster-admin equivalent. Any pod using the default SA and not setting automountServiceAccountToken: false can read Secrets, create pods, and modify RBAC â€” a complete cluster compromise from a single container breakout. Always use dedicated SAs with minimal permissions and set automountServiceAccountToken: false on pods that do not need API access.',
          clusterState: {
            pods: [
              { id: 'secure-app-8f3d1', name: 'secure-app-8f3d1', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'secure-app' }, image: 'myrepo/app:v2.3.1', restarts: 0 },
              { id: 'secure-app-2c9b7', name: 'secure-app-2c9b7', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'secure-app' }, image: 'myrepo/app:v2.3.1', restarts: 0 },
            ],
            services: [],
            deployments: [
              { id: 'secure-app-deploy', name: 'secure-app', namespace: 'default', replicas: 2, availableReplicas: 2, image: 'myrepo/app:v2.3.1' },
            ],
            namespaces: ['default'],
            events: [
              'DANGER: default SA in default has wildcard (*.*) permissions',
              'Fix: use dedicated SA + automountServiceAccountToken: false',
            ],
            highlightedComponent: 'apiserver',
          },
          tip: 'You can restrict the default ServiceAccount cluster-wide by applying a zero-permission RoleBinding â€” but the safest approach is always automountServiceAccountToken: false on pods that do not call the API.',
        },
        {
          id: 'p5-m5-s4',
          title: 'Survey a production-ready cluster',
          instruction: 'View the full picture of a well-configured cluster with all course concepts applied.',
          command: 'kubectl get all -A',
          output: [
            'NAMESPACE      NAME                                                   READY   STATUS    RESTARTS',
            'default        pod/secure-app-8f3d1                                   1/1     Running   0',
            'default        pod/secure-app-2c9b7                                   1/1     Running   0',
            'ingress-nginx  pod/my-ingress-ingress-nginx-controller-7f8d2          1/1     Running   0',
            'ingress-nginx  pod/my-ingress-ingress-nginx-controller-9c3a1          1/1     Running   0',
            'kube-system    pod/coredns-6f6b679f8f-xr9t2                           1/1     Running   0',
            'kube-system    pod/metrics-server-7b4d2                               1/1     Running   0',
            'monitoring     pod/prometheus-kube-prometheus-prometheus-0            2/2     Running   0',
            'monitoring     pod/kube-prometheus-grafana-7d9f3                      3/3     Running   0',
            'monitoring     pod/kube-prometheus-prometheus-node-exporter-node1     1/1     Running   0',
            'monitoring     pod/kube-prometheus-prometheus-node-exporter-node2     1/1     Running   0',
            '',
            'NAMESPACE      NAME                                         TYPE           CLUSTER-IP',
            'default        service/kubernetes                           ClusterIP      10.96.0.1',
            'default        service/secure-app                          ClusterIP      10.96.77.55',
            'ingress-nginx  service/my-ingress-ingress-nginx-controller LoadBalancer   10.96.45.12',
            'monitoring     service/kube-prometheus-grafana              ClusterIP      10.96.55.21',
          ],
          explanation: 'This is the final state of the cluster after completing the entire course: secure-app running with 2 replicas across both nodes (anti-affinity), ingress-nginx providing external access via LoadBalancer, CoreDNS for service discovery, metrics-server for HPA and kubectl top, and the full Prometheus + Grafana monitoring stack in the monitoring namespace. Every component uses dedicated ServiceAccounts, resource requests/limits, and probes. This is production Kubernetes.',
          clusterState: {
            pods: [
              { id: 'secure-app-8f3d1', name: 'secure-app-8f3d1', namespace: 'default', node: 'node-1', status: 'Running', labels: { app: 'secure-app' }, image: 'myrepo/app:v2.3.1', restarts: 0 },
              { id: 'secure-app-2c9b7', name: 'secure-app-2c9b7', namespace: 'default', node: 'node-2', status: 'Running', labels: { app: 'secure-app' }, image: 'myrepo/app:v2.3.1', restarts: 0 },
              { id: 'my-ingress-ctrl-7f8d2', name: 'my-ingress-ingress-nginx-controller-7f8d2', namespace: 'ingress-nginx', node: 'node-1', status: 'Running', labels: { 'app.kubernetes.io/name': 'ingress-nginx' }, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3', restarts: 0 },
              { id: 'my-ingress-ctrl-9c3a1', name: 'my-ingress-ingress-nginx-controller-9c3a1', namespace: 'ingress-nginx', node: 'node-2', status: 'Running', labels: { 'app.kubernetes.io/name': 'ingress-nginx' }, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3', restarts: 0 },
              { id: 'metrics-server-7b4d2', name: 'metrics-server-7b4d2', namespace: 'kube-system', node: 'node-1', status: 'Running', labels: { 'k8s-app': 'metrics-server' }, image: 'registry.k8s.io/metrics-server/metrics-server:v0.7.2', restarts: 0 },
              { id: 'prometheus-kube-prometheus-0', name: 'prometheus-kube-prometheus-prometheus-0', namespace: 'monitoring', node: 'node-1', status: 'Running', labels: { app: 'prometheus' }, image: 'quay.io/prometheus/prometheus:v2.55.1', restarts: 0 },
              { id: 'kube-prometheus-grafana-7d9f3', name: 'kube-prometheus-grafana-7d9f3', namespace: 'monitoring', node: 'node-2', status: 'Running', labels: { 'app.kubernetes.io/name': 'grafana' }, image: 'docker.io/grafana/grafana:11.4.0', restarts: 0 },
            ],
            services: [
              { id: 'secure-app-svc', name: 'secure-app', namespace: 'default', type: 'ClusterIP', selector: { app: 'secure-app' }, port: 8080, clusterIP: '10.96.77.55' },
              { id: 'my-ingress-svc', name: 'my-ingress-ingress-nginx-controller', namespace: 'ingress-nginx', type: 'LoadBalancer', selector: { 'app.kubernetes.io/name': 'ingress-nginx' }, port: 80, clusterIP: '10.96.45.12' },
              { id: 'grafana-svc', name: 'kube-prometheus-grafana', namespace: 'monitoring', type: 'ClusterIP', selector: { 'app.kubernetes.io/name': 'grafana' }, port: 80, clusterIP: '10.96.55.21' },
            ],
            deployments: [
              { id: 'secure-app-deploy', name: 'secure-app', namespace: 'default', replicas: 2, availableReplicas: 2, image: 'myrepo/app:v2.3.1' },
              { id: 'my-ingress-deploy', name: 'my-ingress-ingress-nginx-controller', namespace: 'ingress-nginx', replicas: 2, availableReplicas: 2, image: 'registry.k8s.io/ingress-nginx/controller:v1.11.3' },
              { id: 'grafana-deploy', name: 'kube-prometheus-grafana', namespace: 'monitoring', replicas: 1, availableReplicas: 1, image: 'docker.io/grafana/grafana:11.4.0' },
            ],
            namespaces: ['default', 'ingress-nginx', 'kube-system', 'monitoring'],
            events: [
              'Course complete: production-ready cluster',
              'secure-app: 2 replicas, resources, probes, dedicated SA, anti-affinity',
              'ingress-nginx: external LoadBalancer, 2 replicas',
              'monitoring: Prometheus + Grafana + node-exporter',
            ],
            highlightedComponent: 'controller',
          },
          tip: 'Congratulations â€” you have completed the Kubernetes course! The next step is CKA (Certified Kubernetes Administrator) or CKAD (Certified Kubernetes Application Developer) for a formal certification.',
        },
      ],
      quiz: [
        {
          id: 'p5-m5-q1',
          question: 'Name three things you should ALWAYS set on a production Pod that are optional for dev workloads.',
          options: [
            'A hostPath volume, a privileged security context, and automountServiceAccountToken: true',
            'Resource requests/limits, liveness probe, and readiness probe',
            'A NodePort service, a PersistentVolumeClaim, and a CronJob',
            'kubectl apply --force, --cascade=background, and --grace-period=0',
          ],
          answer: 1,
          explanation: 'Resource requests and limits are required for correct scheduling and to prevent noisy-neighbor resource starvation. A liveness probe is required so Kubernetes can restart hung or deadlocked containers. A readiness probe is required so traffic is only sent to containers that have fully started. These are optional in dev (where you control the environment) but essential in production where multiple teams share nodes.',
        },
        {
          id: 'p5-m5-q2',
          question: 'Why should you set automountServiceAccountToken: false on most pods?',
          options: [
            'It improves pod startup time by skipping the token projection step',
            'Without it, pods cannot communicate with other pods in the cluster',
            'The default ServiceAccount often has broad permissions; if a container is compromised, the mounted token gives an attacker API access to the cluster',
            'Kubernetes 1.35 deprecated ServiceAccount tokens â€” they are no longer supported',
          ],
          answer: 2,
          explanation: 'By default, Kubernetes mounts a ServiceAccount token into every pod. If an attacker gains code execution in a container, they can read this token and make authenticated API calls to the Kubernetes API server. Most application pods do not need API access at all. Setting automountServiceAccountToken: false removes the token from the pod filesystem, eliminating this attack vector entirely.',
        },
        {
          id: 'p5-m5-q3',
          question: 'What is GitOps and why is it preferred over manual kubectl apply in production?',
          options: [
            'GitOps is a GitHub-specific feature that auto-deploys on push to main; manual kubectl is preferred for its flexibility',
            'GitOps means the cluster state is declared in Git and continuously reconciled by an agent (ArgoCD/Flux) â€” providing audit trail, rollback via git revert, drift detection, and no direct cluster access needed',
            'GitOps is a Helm plugin that stores chart releases in Git repositories',
            'GitOps and manual kubectl are equivalent â€” GitOps is just a marketing term',
          ],
          answer: 1,
          explanation: 'In a GitOps workflow, every desired cluster state is committed to Git (Helm values, Kustomize overlays, raw manifests). An agent (ArgoCD or Flux) watches the Git repo and automatically reconciles the cluster toward the declared state. Benefits: every change has a PR, author, and review; rollback is git revert; the agent alerts on drift (cluster diverged from Git); no human needs kubectl write access to production.',
        },
        {
          id: 'p5-m5-q4',
          question: 'A pod is OOMKilled repeatedly. What are the two ways to fix this?',
          options: [
            'Delete and recreate the pod, or add more nodes to the cluster',
            'Increase the memory limit so the pod has enough headroom, or fix a memory leak in the application code',
            'Add a liveness probe so the pod restarts faster, or switch to a StatefulSet',
            'Reduce the replica count to give each pod more memory, or disable the OOM killer in Linux',
          ],
          answer: 1,
          explanation: 'OOMKilled means the container exceeded its memory limit and the Linux OOM killer terminated it. The two root causes and fixes: (1) the limit is set too low for legitimate usage â€” increase the memory limit (and request) to match the application\'s actual needs; (2) the application has a memory leak â€” fix the leak in the code. Increasing limits without investigating the root cause just delays the problem if there is a leak.',
        },
        {
          id: 'p5-m5-q5',
          question: 'Your team is upgrading from Kubernetes 1.33 to 1.35. What is the safe upgrade path?',
          options: [
            'Upgrade directly from 1.33 to 1.35 in one step â€” Kubernetes supports skipping minor versions',
            'Upgrade one minor version at a time: 1.33 â†’ 1.34 â†’ 1.35. Upgrade the control plane first, then each node group. Verify workloads after each step.',
            'Upgrade nodes first, then the control plane â€” nodes must be on the target version before the API server',
            'Back up etcd, then delete the cluster and recreate it on 1.35',
          ],
          answer: 1,
          explanation: 'Kubernetes only supports upgrading one minor version at a time (the N-2 rule means a 1.33 kubelet can talk to a 1.35 API server, but skipping directly is not tested and not supported). Always upgrade the control plane (API server, scheduler, controller-manager) before upgrading nodes â€” the API server must be at the newer version first. After each step, verify that workloads are healthy before proceeding to the next minor version.',
        },
      ],
    },
  ],
}

export default phase5
