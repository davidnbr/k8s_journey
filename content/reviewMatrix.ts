import type { ModuleReview, SourceRef, TopicCoverage } from '@/lib/types'

const checkedAt = '2026-06'
const verifiedAgainst = [
  'Kubernetes v1.36 docs',
  'Kubernetes 1.36.1 release series',
  'minikube v1.38.1 docs',
]

const sourceRefs = {
  releases: {
    title: 'Kubernetes 1.36 release series',
    url: 'https://kubernetes.io/releases/1.36/',
    checkedAt,
    scope: 'release',
  },
  concepts: {
    title: 'Kubernetes Concepts',
    url: 'https://kubernetes.io/docs/concepts/',
    checkedAt,
    scope: 'concepts',
  },
  components: {
    title: 'Kubernetes Components',
    url: 'https://kubernetes.io/docs/concepts/overview/components/',
    checkedAt,
    scope: 'concepts',
  },
  kubectl: {
    title: 'kubectl reference',
    url: 'https://kubernetes.io/docs/reference/kubectl/',
    checkedAt,
    scope: 'commands',
  },
  api: {
    title: 'Kubernetes API reference v1.36',
    url: 'https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.36/',
    checkedAt,
    scope: 'commands',
  },
  basicsDeploy: {
    title: 'Using kubectl to Create a Deployment',
    url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/deploy-app/deploy-intro/',
    checkedAt,
    scope: 'tutorial',
  },
  minikube: {
    title: 'minikube documentation',
    url: 'https://minikube.sigs.k8s.io/docs/',
    checkedAt,
    scope: 'tooling',
  },
  minikube101: {
    title: 'minikube Kubernetes 101',
    url: 'https://minikube.sigs.k8s.io/docs/tutorials/kubernetes_101/',
    checkedAt,
    scope: 'tutorial',
  },
  minikubeAccess: {
    title: 'minikube accessing apps',
    url: 'https://minikube.sigs.k8s.io/docs/handbook/accessing/',
    checkedAt,
    scope: 'tutorial',
  },
  minikubeAddons: {
    title: 'minikube addons command reference',
    url: 'https://minikube.sigs.k8s.io/docs/commands/addons/',
    checkedAt,
    scope: 'tooling',
  },
  pods: {
    title: 'Pods',
    url: 'https://kubernetes.io/docs/concepts/workloads/pods/',
    checkedAt,
    scope: 'concepts',
  },
  deployments: {
    title: 'Deployments',
    url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/',
    checkedAt,
    scope: 'concepts',
  },
  services: {
    title: 'Services',
    url: 'https://kubernetes.io/docs/concepts/services-networking/service/',
    checkedAt,
    scope: 'concepts',
  },
  initContainers: {
    title: 'Init Containers',
    url: 'https://kubernetes.io/docs/concepts/workloads/pods/init-containers/',
    checkedAt,
    scope: 'concepts',
  },
  lifecycle: {
    title: 'Container Lifecycle Hooks',
    url: 'https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/',
    checkedAt,
    scope: 'concepts',
  },
  namespaces: {
    title: 'Namespaces',
    url: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/',
    checkedAt,
    scope: 'concepts',
  },
  labels: {
    title: 'Labels and Selectors',
    url: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/',
    checkedAt,
    scope: 'concepts',
  },
  configmaps: {
    title: 'ConfigMaps',
    url: 'https://kubernetes.io/docs/concepts/configuration/configmap/',
    checkedAt,
    scope: 'concepts',
  },
  secrets: {
    title: 'Secrets',
    url: 'https://kubernetes.io/docs/concepts/configuration/secret/',
    checkedAt,
    scope: 'concepts',
  },
  probes: {
    title: 'Liveness, Readiness, and Startup Probes',
    url: 'https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/',
    checkedAt,
    scope: 'concepts',
  },
  resources: {
    title: 'Resource Management for Pods and Containers',
    url: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
    checkedAt,
    scope: 'concepts',
  },
  volumes: {
    title: 'Volumes',
    url: 'https://kubernetes.io/docs/concepts/storage/volumes/',
    checkedAt,
    scope: 'concepts',
  },
  persistentVolumes: {
    title: 'Persistent Volumes',
    url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/',
    checkedAt,
    scope: 'concepts',
  },
  statefulsets: {
    title: 'StatefulSets',
    url: 'https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/',
    checkedAt,
    scope: 'concepts',
  },
  daemonsets: {
    title: 'DaemonSets',
    url: 'https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/',
    checkedAt,
    scope: 'concepts',
  },
  ingress: {
    title: 'Ingress',
    url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/',
    checkedAt,
    scope: 'concepts',
  },
  networkPolicies: {
    title: 'Network Policies',
    url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/',
    checkedAt,
    scope: 'concepts',
  },
  rbac: {
    title: 'Using RBAC Authorization',
    url: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/',
    checkedAt,
    scope: 'concepts',
  },
  jobs: {
    title: 'Jobs',
    url: 'https://kubernetes.io/docs/concepts/workloads/controllers/job/',
    checkedAt,
    scope: 'concepts',
  },
  cronjobs: {
    title: 'CronJobs',
    url: 'https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/',
    checkedAt,
    scope: 'concepts',
  },
  hpa: {
    title: 'Horizontal Pod Autoscaling',
    url: 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/',
    checkedAt,
    scope: 'tutorial',
  },
  scheduling: {
    title: 'Assigning Pods to Nodes',
    url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/',
    checkedAt,
    scope: 'concepts',
  },
  taints: {
    title: 'Taints and Tolerations',
    url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/',
    checkedAt,
    scope: 'concepts',
  },
  pdb: {
    title: 'Pod Disruption Budgets',
    url: 'https://kubernetes.io/docs/tasks/run-application/configure-pdb/',
    checkedAt,
    scope: 'tutorial',
  },
  helm: {
    title: 'Helm documentation',
    url: 'https://helm.sh/docs/',
    checkedAt,
    scope: 'tooling',
  },
  kustomize: {
    title: 'Kustomize',
    url: 'https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/',
    checkedAt,
    scope: 'tutorial',
  },
  crds: {
    title: 'Extend the Kubernetes API with CustomResourceDefinitions',
    url: 'https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/',
    checkedAt,
    scope: 'tutorial',
  },
  observability: {
    title: 'Resource metrics pipeline',
    url: 'https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/',
    checkedAt,
    scope: 'concepts',
  },
  debugging: {
    title: 'Debugging Kubernetes nodes',
    url: 'https://kubernetes.io/docs/tasks/debug/debug-cluster/',
    checkedAt,
    scope: 'tutorial',
  },
  argocd: {
    title: 'Argo CD Getting Started',
    url: 'https://argo-cd.readthedocs.io/en/stable/getting_started/',
    checkedAt,
    scope: 'tooling',
  },
  istio: {
    title: 'Istio Getting Started',
    url: 'https://istio.io/latest/docs/setup/getting-started/',
    checkedAt,
    scope: 'tooling',
  },
  cncfCerts: {
    title: 'CNCF Training and Certification',
    url: 'https://www.cncf.io/training/certification/',
    checkedAt,
    scope: 'concepts',
  },
  replicaSets: {
    title: 'ReplicaSets',
    url: 'https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/',
    checkedAt,
    scope: 'concepts',
  },
  cronJobs: {
    title: 'CronJobs',
    url: 'https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/',
    checkedAt,
    scope: 'concepts',
  },
  multiContainer: {
    title: 'Multi-container Pods',
    url: 'https://kubernetes.io/docs/concepts/workloads/pods/#how-pods-manage-multiple-containers',
    checkedAt,
    scope: 'concepts',
  },
  serviceTypes: {
    title: 'Service Types',
    url: 'https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types',
    checkedAt,
    scope: 'concepts',
  },
  dns: {
    title: 'DNS for Services and Pods',
    url: 'https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/',
    checkedAt,
    scope: 'concepts',
  },
  limitRange: {
    title: 'LimitRange',
    url: 'https://kubernetes.io/docs/concepts/policy/limit-range/',
    checkedAt,
    scope: 'concepts',
  },
  resourceQuota: {
    title: 'ResourceQuota',
    url: 'https://kubernetes.io/docs/concepts/policy/resource-quotas/',
    checkedAt,
    scope: 'concepts',
  },
  securityContext: {
    title: 'Security Context',
    url: 'https://kubernetes.io/docs/tasks/configure-pod-container/security-context/',
    checkedAt,
    scope: 'concepts',
  },
  podSecurity: {
    title: 'Pod Security Standards',
    url: 'https://kubernetes.io/docs/concepts/security/pod-security-standards/',
    checkedAt,
    scope: 'concepts',
  },
  nodeManagement: {
    title: 'Node management and safe draining',
    url: 'https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/',
    checkedAt,
    scope: 'tutorial',
  },
  kubeadm: {
    title: 'kubeadm — bootstrapping a cluster',
    url: 'https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/',
    checkedAt,
    scope: 'tutorial',
  },
  etcd: {
    title: 'Operating etcd for Kubernetes',
    url: 'https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/',
    checkedAt,
    scope: 'tutorial',
  },
  clusterUpgrade: {
    title: 'Upgrading kubeadm clusters',
    url: 'https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/',
    checkedAt,
    scope: 'tutorial',
  },
  pki: {
    title: 'PKI certificates and requirements',
    url: 'https://kubernetes.io/docs/setup/best-practices/certificates/',
    checkedAt,
    scope: 'concepts',
  },
  troubleshootingApps: {
    title: 'Troubleshooting Applications',
    url: 'https://kubernetes.io/docs/tasks/debug/debug-application/',
    checkedAt,
    scope: 'tutorial',
  },
  troubleshootingCluster: {
    title: 'Troubleshooting Clusters',
    url: 'https://kubernetes.io/docs/tasks/debug/debug-cluster/',
    checkedAt,
    scope: 'tutorial',
  },
} satisfies Record<string, SourceRef>

function coverage(topic: string, extras: Partial<TopicCoverage> = {}): TopicCoverage {
  return {
    concepts: extras.concepts ?? [topic, 'desired state', 'actual state', 'resource lifecycle'],
    commands: extras.commands ?? [
      'kubectl get',
      'kubectl describe',
      'kubectl apply',
      'kubectl delete',
    ],
    architecture: extras.architecture ?? [
      'kube-apiserver',
      'controller reconciliation',
      'node/runtime state',
    ],
    techniques: extras.techniques ?? [
      'predict before running',
      'verify after mutation',
      'repeat with a variant',
    ],
    procedures: extras.procedures ?? [
      'prepare minikube',
      'run guided commands',
      'verify state',
      'clean up',
    ],
    toolsAndPlugins: extras.toolsAndPlugins ?? ['kubectl', 'minikube'],
    cases: extras.cases ?? ['happy path', 'misconfiguration', 'cleanup'],
    scenarios: extras.scenarios ?? ['local development', 'debugging', 'production mental model'],
  }
}

function review(
  phaseSlug: string,
  moduleSlug: string,
  moduleId: string,
  refs: SourceRef[],
  topic: string,
  extras: Partial<
    Pick<
      ModuleReview,
      | 'coverage'
      | 'minikubePrerequisites'
      | 'supplementalCommands'
      | 'reviewNotes'
      | 'reviewStatus'
      | 'verifiedAgainst'
    >
  > = {}
): ModuleReview {
  return {
    moduleId,
    phaseSlug,
    moduleSlug,
    verifiedAt: checkedAt,
    verifiedAgainst: extras.verifiedAgainst ?? verifiedAgainst,
    reviewStatus: extras.reviewStatus ?? 'verified',
    reviewNotes: extras.reviewNotes ?? [
      'Reviewed against official Kubernetes/minikube/CNCF project documentation available in June 2026.',
      'Existing guided lab is preserved; supplemental commands add minikube-local practice and review checks.',
    ],
    sourceRefs: [sourceRefs.releases, sourceRefs.kubectl, sourceRefs.minikube, ...refs],
    coverage: extras.coverage ?? coverage(topic),
    minikubePrerequisites: extras.minikubePrerequisites ?? [
      'minikube start --kubernetes-version=v1.36.1',
      'kubectl config current-context',
      'kubectl get nodes',
    ],
    supplementalCommands: extras.supplementalCommands ?? [
      'kubectl explain pods',
      'kubectl get events --sort-by=.lastTimestamp',
      `kubectl get all -A | grep -E '${moduleSlug}|default|kube-system' || true`,
    ],
  }
}

export const moduleReviews: Record<string, ModuleReview> = {
  'phase-0/why-kubernetes': review(
    'phase-0',
    'why-kubernetes',
    'p0-m1',
    [sourceRefs.concepts, sourceRefs.components, sourceRefs.minikube101],
    'why Kubernetes exists',
    {
      coverage: coverage('orchestration problem and cluster basics', {
        commands: [
          'minikube start',
          'minikube status',
          'kubectl cluster-info',
          'kubectl get nodes',
          'kubectl get pods -n kube-system',
        ],
        architecture: [
          'control plane',
          'worker nodes',
          'kube-system components',
          'kube-apiserver entrypoint',
        ],
        scenarios: ['single-container failure', 'self-healing need', 'local cluster inspection'],
      }),
      supplementalCommands: [
        'minikube start --kubernetes-version=v1.36.1',
        'minikube status',
        'kubectl version',
        'kubectl cluster-info',
        'kubectl get nodes -o wide',
        'kubectl get pods -n kube-system',
      ],
    }
  ),
  'phase-0/architecture': review(
    'phase-0',
    'architecture',
    'p0-m2',
    [sourceRefs.components, sourceRefs.concepts],
    'cluster architecture',
    {
      coverage: coverage('control plane and node architecture', {
        commands: [
          'kubectl get componentstatuses',
          'kubectl get pods -n kube-system',
          'kubectl describe node',
          'kubectl get events',
        ],
        architecture: [
          'kube-apiserver',
          'etcd',
          'scheduler',
          'controller-manager',
          'kubelet',
          'kube-proxy',
          'container runtime',
        ],
      }),
      supplementalCommands: [
        'kubectl get pods -n kube-system -o wide',
        'kubectl describe node minikube',
        'kubectl get events -A --sort-by=.lastTimestamp',
        'kubectl explain pod.spec.nodeName',
      ],
    }
  ),
  'phase-0/kubectl-kubeconfig': review(
    'phase-0',
    'kubectl-kubeconfig',
    'p0-m3',
    [sourceRefs.kubectl, sourceRefs.api],
    'kubectl and kubeconfig',
    {
      coverage: coverage('kubectl client configuration', {
        commands: [
          'kubectl config current-context',
          'kubectl config view',
          'kubectl config get-contexts',
          'kubectl explain',
          'kubectl api-resources',
        ],
        architecture: [
          'client kubeconfig',
          'clusters/users/contexts',
          'API discovery',
          'jsonpath output',
        ],
      }),
      supplementalCommands: [
        'kubectl config current-context',
        'kubectl config get-contexts',
        'kubectl api-resources',
        'kubectl explain deployment.spec.replicas',
        "kubectl get nodes -o jsonpath='{.items[*].metadata.name}'",
      ],
    }
  ),

  'phase-1/pods': review(
    'phase-1',
    'pods',
    'p1-m1',
    [sourceRefs.pods, sourceRefs.basicsDeploy, sourceRefs.minikube101],
    'Pods',
    {
      supplementalCommands: [
        'kubectl explain pod',
        'kubectl run pod-review --image=nginx:1.27 --restart=Never',
        'kubectl wait --for=condition=Ready pod/pod-review --timeout=90s',
        'kubectl logs pod-review',
        'kubectl exec pod-review -- nginx -v',
        'kubectl delete pod pod-review',
      ],
    }
  ),
  'phase-1/deployments': review(
    'phase-1',
    'deployments',
    'p1-m2',
    [sourceRefs.deployments, sourceRefs.basicsDeploy, sourceRefs.minikube101],
    'Deployments',
    {
      coverage: coverage('Deployment controller and ReplicaSets', {
        commands: [
          'kubectl create deployment',
          'kubectl get deployments',
          'kubectl rollout status',
          'kubectl rollout history',
          'kubectl rollout undo',
          'kubectl scale',
        ],
        techniques: [
          'self-healing',
          'rolling update',
          'rollback',
          'scaling',
          'rollout verification',
        ],
      }),
      supplementalCommands: [
        'kubectl create deployment kubernetes-bootcamp --image=registry.k8s.io/minikube/kubernetes-bootcamp:v1',
        'kubectl get deployments,pods,replicasets',
        'kubectl scale deployment/kubernetes-bootcamp --replicas=4',
        'kubectl rollout status deployment/kubernetes-bootcamp',
        'kubectl set image deployment/kubernetes-bootcamp kubernetes-bootcamp=registry.k8s.io/minikube/kubernetes-bootcamp:v2',
        'kubectl rollout undo deployment/kubernetes-bootcamp',
        'kubectl delete deployment kubernetes-bootcamp',
      ],
    }
  ),
  'phase-1/services': review(
    'phase-1',
    'services',
    'p1-m3',
    [sourceRefs.services, sourceRefs.minikubeAccess, sourceRefs.minikube101],
    'Services',
    {
      coverage: coverage('Service discovery and stable networking', {
        commands: [
          'kubectl expose',
          'kubectl get svc',
          'kubectl get endpoints',
          'minikube service',
          'kubectl port-forward',
        ],
        architecture: [
          'Service selector',
          'EndpointSlice/endpoints',
          'ClusterIP',
          'NodePort',
          'kube-proxy',
        ],
      }),
      supplementalCommands: [
        'kubectl create deployment hello-minikube1 --image=kicbase/echo-server:1.0',
        'kubectl expose deployment hello-minikube1 --type=NodePort --port=8080',
        'kubectl get svc hello-minikube1',
        'minikube service hello-minikube1 --url',
        'kubectl delete svc hello-minikube1',
        'kubectl delete deployment hello-minikube1',
      ],
    }
  ),
  'phase-1/init-containers': review(
    'phase-1',
    'init-containers',
    'p1-m4',
    [sourceRefs.initContainers, sourceRefs.lifecycle, sourceRefs.pods],
    'Init Containers and lifecycle hooks',
    {
      coverage: coverage('Pod startup and termination sequencing', {
        commands: [
          'kubectl apply',
          'kubectl get pods -w',
          'kubectl logs -c',
          'kubectl describe pod',
          'kubectl delete',
        ],
        techniques: ['dependency wait', 'shared volume handoff', 'graceful shutdown with preStop'],
      }),
      supplementalCommands: [
        'kubectl explain pod.spec.initContainers',
        'kubectl explain pod.spec.containers.lifecycle',
        'kubectl get pod app-with-init -o jsonpath="{.status.initContainerStatuses}"',
        'kubectl describe pod app-with-init',
        'kubectl delete pod app-with-init --ignore-not-found',
      ],
    }
  ),

  'phase-2/namespaces': review(
    'phase-2',
    'namespaces',
    'p2-m1',
    [sourceRefs.namespaces, sourceRefs.kubectl],
    'Namespaces',
    {
      supplementalCommands: [
        'kubectl create namespace review-ns',
        'kubectl config set-context --current --namespace=review-ns',
        'kubectl run ns-check --image=nginx:1.27',
        'kubectl get pods -n review-ns',
        'kubectl config set-context --current --namespace=default',
        'kubectl delete namespace review-ns',
      ],
    }
  ),
  'phase-2/labels-selectors': review(
    'phase-2',
    'labels-selectors',
    'p2-m2',
    [sourceRefs.labels, sourceRefs.services],
    'Labels and selectors',
    {
      supplementalCommands: [
        'kubectl run review-web --image=nginx:1.27 --labels=app=review,tier=frontend',
        'kubectl get pods --show-labels',
        "kubectl get pods -l 'tier in (frontend,backend)'",
        'kubectl label pod review-web env=dev --overwrite',
        'kubectl delete pod review-web',
      ],
    }
  ),
  'phase-2/configmaps': review(
    'phase-2',
    'configmaps',
    'p2-m3',
    [sourceRefs.configmaps, sourceRefs.api],
    'ConfigMaps',
    {
      supplementalCommands: [
        'kubectl create configmap review-config --from-literal=MODE=practice',
        'kubectl describe configmap review-config',
        'kubectl get configmap review-config -o yaml',
        'kubectl delete configmap review-config',
      ],
    }
  ),
  'phase-2/secrets': review(
    'phase-2',
    'secrets',
    'p2-m4',
    [sourceRefs.secrets, sourceRefs.api],
    'Secrets',
    {
      coverage: coverage('Secret data and pod injection', {
        commands: [
          'kubectl create secret',
          'kubectl get secret -o yaml',
          'jsonpath',
          'base64 --decode',
          'kubectl apply',
        ],
        cases: [
          'base64 is encoding not encryption',
          'environment variable injection',
          'imagePullSecret reference',
        ],
      }),
      supplementalCommands: [
        'kubectl create secret generic review-secret --from-literal=password=s3cr3t',
        "kubectl get secret review-secret -o jsonpath='{.data.password}' | base64 --decode",
        'kubectl describe secret review-secret',
        'kubectl delete secret review-secret',
      ],
    }
  ),
  'phase-2/probes': review(
    'phase-2',
    'probes',
    'p2-m5',
    [sourceRefs.probes, sourceRefs.deployments],
    'Health probes',
    {
      supplementalCommands: [
        'kubectl explain pod.spec.containers.livenessProbe',
        'kubectl explain pod.spec.containers.readinessProbe',
        'kubectl get events --sort-by=.lastTimestamp',
        'kubectl describe pod -l app=nginx-probes',
        'kubectl delete deployment nginx-probes --ignore-not-found',
      ],
    }
  ),
  'phase-2/resources': review(
    'phase-2',
    'resources',
    'p2-m6',
    [sourceRefs.resources, sourceRefs.pods],
    'Resource requests and limits',
    {
      supplementalCommands: [
        'kubectl explain pod.spec.containers.resources',
        'kubectl run resources-review --image=nginx:1.27 --requests=cpu=100m,memory=64Mi --limits=cpu=200m,memory=128Mi',
        "kubectl describe pod resources-review | grep 'QoS Class'",
        'kubectl delete pod resources-review',
      ],
    }
  ),

  'phase-3/volumes': review(
    'phase-3',
    'volumes',
    'p3-m1',
    [sourceRefs.volumes, sourceRefs.persistentVolumes],
    'Volumes and PersistentVolumes',
    {
      supplementalCommands: [
        'kubectl explain pod.spec.volumes',
        'kubectl explain persistentvolumeclaim',
        'kubectl get storageclass',
        'kubectl get pv,pvc',
        'kubectl delete pod scratch --ignore-not-found',
      ],
    }
  ),
  'phase-3/statefulsets': review(
    'phase-3',
    'statefulsets',
    'p3-m2',
    [sourceRefs.statefulsets, sourceRefs.persistentVolumes, sourceRefs.services],
    'StatefulSets',
    {
      supplementalCommands: [
        'kubectl explain statefulset.spec.serviceName',
        'kubectl get statefulsets,pods,pvc',
        'kubectl get pod web-0 -o jsonpath="{.metadata.name} {.spec.hostname}"',
        'kubectl delete pod web-1 --ignore-not-found',
      ],
    }
  ),
  'phase-3/daemonsets': review(
    'phase-3',
    'daemonsets',
    'p3-m3',
    [sourceRefs.daemonsets, sourceRefs.scheduling],
    'DaemonSets',
    {
      supplementalCommands: [
        'kubectl explain daemonset',
        'kubectl get nodes',
        'kubectl get daemonsets -A',
        'kubectl describe daemonset log-collector',
        'kubectl delete daemonset log-collector --ignore-not-found',
      ],
    }
  ),
  'phase-3/ingress': review(
    'phase-3',
    'ingress',
    'p3-m4',
    [sourceRefs.ingress, sourceRefs.minikubeAddons, sourceRefs.minikubeAccess],
    'Ingress',
    {
      minikubePrerequisites: [
        'minikube start --kubernetes-version=v1.36.1',
        'minikube addons enable ingress',
        'kubectl get pods -n ingress-nginx',
      ],
      supplementalCommands: [
        'minikube addons enable ingress',
        'kubectl get pods -n ingress-nginx',
        'kubectl create deployment web --image=nginx:1.27',
        'kubectl expose deployment web --port=80',
        'kubectl get ingress',
        'kubectl describe ingress myapp',
      ],
    }
  ),
  'phase-3/network-policies': review(
    'phase-3',
    'network-policies',
    'p3-m5',
    [sourceRefs.networkPolicies, sourceRefs.minikube],
    'NetworkPolicies',
    {
      minikubePrerequisites: [
        'minikube start --kubernetes-version=v1.36.1 --cni=calico',
        'kubectl get pods -A',
      ],
      supplementalCommands: [
        'kubectl explain networkpolicy',
        'kubectl get networkpolicies',
        'kubectl run np-client --image=busybox:1.36 --restart=Never -- sleep 3600',
        'kubectl delete pod np-client --ignore-not-found',
      ],
    }
  ),

  'phase-4/rbac': review(
    'phase-4',
    'rbac',
    'p4-m1',
    [sourceRefs.rbac, sourceRefs.kubectl],
    'RBAC',
    {
      supplementalCommands: [
        'kubectl auth whoami',
        'kubectl auth can-i list pods',
        'kubectl create serviceaccount review-reader',
        'kubectl auth can-i get pods --as=system:serviceaccount:default:review-reader',
        'kubectl delete serviceaccount review-reader',
      ],
    }
  ),
  'phase-4/jobs': review(
    'phase-4',
    'jobs',
    'p4-m2',
    [sourceRefs.jobs, sourceRefs.cronjobs],
    'Jobs and CronJobs',
    {
      supplementalCommands: [
        'kubectl create job review-job --image=busybox:1.36 -- echo done',
        'kubectl wait --for=condition=complete job/review-job --timeout=90s',
        'kubectl logs job/review-job',
        'kubectl create cronjob review-cron --image=busybox:1.36 --schedule="*/5 * * * *" -- echo scheduled',
        'kubectl delete cronjob review-cron',
        'kubectl delete job review-job',
      ],
    }
  ),
  'phase-4/hpa': review(
    'phase-4',
    'hpa',
    'p4-m3',
    [sourceRefs.hpa, sourceRefs.observability, sourceRefs.minikubeAddons],
    'Horizontal Pod Autoscaler',
    {
      minikubePrerequisites: ['minikube addons enable metrics-server', 'kubectl top nodes'],
      supplementalCommands: [
        'minikube addons enable metrics-server',
        'kubectl top nodes',
        'kubectl autoscale deployment php-apache --cpu-percent=50 --min=1 --max=10',
        'kubectl get hpa',
        'kubectl delete hpa php-apache --ignore-not-found',
      ],
    }
  ),
  'phase-4/scheduling': review(
    'phase-4',
    'scheduling',
    'p4-m4',
    [sourceRefs.scheduling, sourceRefs.taints],
    'Scheduling, taints, tolerations, and affinity',
    {
      supplementalCommands: [
        'kubectl get nodes --show-labels',
        'kubectl explain pod.spec.affinity',
        'kubectl explain pod.spec.tolerations',
        'kubectl taint nodes minikube dedicated=review:NoSchedule',
        'kubectl taint nodes minikube dedicated=review:NoSchedule-',
      ],
    }
  ),
  'phase-4/pdb': review(
    'phase-4',
    'pdb',
    'p4-m5',
    [sourceRefs.pdb, sourceRefs.deployments],
    'PodDisruptionBudgets',
    {
      supplementalCommands: [
        'kubectl explain poddisruptionbudget',
        'kubectl get pdb',
        'kubectl get nodes',
        'kubectl drain minikube --ignore-daemonsets --delete-emptydir-data --dry-run=server',
        'kubectl uncordon minikube',
      ],
    }
  ),

  'phase-5/helm': review(
    'phase-5',
    'helm',
    'p5-m1',
    [sourceRefs.helm, sourceRefs.ingress],
    'Helm',
    {
      verifiedAgainst: [...verifiedAgainst, 'Helm official docs checked June 2026'],
      supplementalCommands: [
        'helm version',
        'helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx',
        'helm repo update',
        'helm search repo ingress-nginx',
        'helm show values ingress-nginx/ingress-nginx | head -40',
        'helm list -A',
      ],
    }
  ),
  'phase-5/kustomize': review(
    'phase-5',
    'kustomize',
    'p5-m2',
    [sourceRefs.kustomize, sourceRefs.kubectl],
    'Kustomize',
    {
      supplementalCommands: [
        'kubectl kustomize base/',
        'kubectl kustomize overlays/production/',
        'kubectl diff -k overlays/production/',
        'kubectl apply -k overlays/production/',
        'kubectl delete -k overlays/production/',
      ],
    }
  ),
  'phase-5/crds': review(
    'phase-5',
    'crds',
    'p5-m3',
    [sourceRefs.crds, sourceRefs.api],
    'CustomResourceDefinitions',
    {
      supplementalCommands: [
        'kubectl explain customresourcedefinition',
        'kubectl get crds',
        'kubectl apply --dry-run=server -f database-crd.yaml',
        'kubectl get databases',
        'kubectl delete crd databases.example.com --ignore-not-found',
      ],
    }
  ),
  'phase-5/observability': review(
    'phase-5',
    'observability',
    'p5-m4',
    [sourceRefs.observability, sourceRefs.minikubeAddons, sourceRefs.helm],
    'Observability',
    {
      minikubePrerequisites: ['minikube addons enable metrics-server', 'helm version'],
      supplementalCommands: [
        'minikube addons enable metrics-server',
        'kubectl top nodes',
        'kubectl top pods -A',
        'helm repo add prometheus-community https://prometheus-community.github.io/helm-charts',
        'helm list -n monitoring',
      ],
    }
  ),
  'phase-5/production-readiness': review(
    'phase-5',
    'production-readiness',
    'p5-m5',
    [sourceRefs.resources, sourceRefs.rbac, sourceRefs.pdb, sourceRefs.probes],
    'Production readiness',
    {
      coverage: coverage('production readiness checks', {
        commands: [
          'kubectl auth can-i',
          'kubectl get all -A',
          'kubectl describe',
          'kubectl top',
          'kubectl get events',
        ],
        techniques: [
          'least privilege',
          'resource controls',
          'health checking',
          'disruption planning',
          'observability checks',
        ],
        cases: [
          'unsafe default ServiceAccount',
          'missing limits',
          'missing probes',
          'privileged containers',
        ],
      }),
      supplementalCommands: [
        'kubectl auth can-i --list --as=system:serviceaccount:default:default',
        'kubectl get all -A',
        'kubectl get events -A --sort-by=.lastTimestamp',
        'kubectl get pods -A -o wide',
      ],
    }
  ),
  'phase-5/gitops': review(
    'phase-5',
    'gitops',
    'p5-m6',
    [sourceRefs.argocd, sourceRefs.kubectl],
    'GitOps with Argo CD',
    {
      verifiedAgainst: [...verifiedAgainst, 'Argo CD official docs checked June 2026'],
      minikubePrerequisites: [
        'minikube start --kubernetes-version=v1.36.1',
        'kubectl create namespace argocd',
        'argocd version --client',
      ],
      supplementalCommands: [
        'argocd version --client',
        'kubectl create namespace argocd',
        'kubectl get pods -n argocd',
        'kubectl port-forward svc/argocd-server -n argocd 8080:443',
        'argocd app list',
      ],
    }
  ),
  'phase-5/service-mesh': review(
    'phase-5',
    'service-mesh',
    'p5-m7',
    [sourceRefs.istio, sourceRefs.services],
    'Service mesh with Istio',
    {
      verifiedAgainst: [...verifiedAgainst, 'Istio official docs checked June 2026'],
      minikubePrerequisites: [
        'minikube start --kubernetes-version=v1.36.1',
        'istioctl version --remote=false',
        'kubectl get namespace default',
      ],
      supplementalCommands: [
        'istioctl version --remote=false',
        'istioctl install --set profile=demo -y',
        'kubectl label namespace default istio-injection=enabled --overwrite',
        'kubectl get pods',
        'istioctl proxy-status',
      ],
    }
  ),

  'phase-6/kcna': review(
    'phase-6',
    'kcna',
    'p6-m1',
    [sourceRefs.cncfCerts, sourceRefs.components, sourceRefs.observability, sourceRefs.helm],
    'KCNA exam domains',
    {
      supplementalCommands: [
        'kubectl get pods -n kube-system',
        'kubectl get nodes -o wide',
        'kubectl api-versions',
        'kubectl top nodes',
        'helm list -A',
      ],
    }
  ),
  'phase-6/cka': review(
    'phase-6',
    'cka',
    'p6-m2',
    [
      sourceRefs.cncfCerts,
      sourceRefs.rbac,
      sourceRefs.networkPolicies,
      sourceRefs.persistentVolumes,
      sourceRefs.debugging,
    ],
    'CKA administrator tasks',
    {
      coverage: coverage('CKA operational procedures', {
        commands: [
          'kubectl create',
          'kubectl expose',
          'kubectl auth can-i',
          'kubectl drain',
          'etcdctl',
          'systemctl',
        ],
        toolsAndPlugins: ['kubectl', 'minikube', 'systemctl', 'etcdctl'],
        scenarios: [
          'timed administration',
          'node troubleshooting',
          'RBAC',
          'backup and restore',
          'network isolation',
        ],
      }),
      supplementalCommands: [
        'kubectl create deployment cka-review --image=nginx:1.27 --replicas=2',
        'kubectl expose deployment cka-review --port=80',
        'kubectl auth can-i list pods',
        'kubectl get events --sort-by=.lastTimestamp',
        'kubectl delete deployment cka-review',
        'kubectl delete svc cka-review',
      ],
    }
  ),
  'phase-6/ckad': review(
    'phase-6',
    'ckad',
    'p6-m3',
    [
      sourceRefs.cncfCerts,
      sourceRefs.pods,
      sourceRefs.configmaps,
      sourceRefs.secrets,
      sourceRefs.probes,
      sourceRefs.jobs,
    ],
    'CKAD application tasks',
    {
      supplementalCommands: [
        'kubectl explain pod.spec.containers',
        'kubectl explain pod.spec.initContainers',
        'kubectl create configmap ckad-config --from-literal=MODE=review',
        'kubectl create secret generic ckad-secret --from-literal=password=s3cr3t',
        'kubectl create job ckad-job --image=busybox:1.36 -- echo done',
        'kubectl delete configmap ckad-config',
        'kubectl delete secret ckad-secret',
        'kubectl delete job ckad-job',
      ],
    }
  ),
  'phase-0/local-setup': review(
    'phase-0',
    'local-setup',
    'p0-m0',
    [sourceRefs.minikube, sourceRefs.minikube101, sourceRefs.kubectl],
    'local cluster setup with minikube',
    {
      minikubePrerequisites: [],
      supplementalCommands: [
        'kubectl version --client',
        'minikube version',
        'minikube start --cpus=2 --memory=4096',
        'kubectl cluster-info',
        'kubectl get nodes',
        'minikube addons enable metrics-server',
      ],
    }
  ),

  'phase-1/replicasets': review(
    'phase-1',
    'replicasets',
    'p1-m5',
    [sourceRefs.replicaSets, sourceRefs.deployments],
    'ReplicaSets and self-healing',
    {
      supplementalCommands: [
        'kubectl explain replicaset',
        'kubectl get rs',
        'kubectl describe rs nginx-rs',
        "kubectl delete pod $(kubectl get pods -l app=nginx -o jsonpath='{.items[0].metadata.name}')",
        'kubectl scale rs nginx-rs --replicas=5',
        'kubectl delete rs nginx-rs --ignore-not-found',
      ],
    }
  ),

  'phase-1/cronjobs': review(
    'phase-1',
    'cronjobs',
    'p1-m6',
    [sourceRefs.cronJobs, sourceRefs.jobs],
    'CronJobs and scheduled work',
    {
      supplementalCommands: [
        'kubectl explain cronjob.spec.schedule',
        'kubectl get cronjobs',
        'kubectl create job manual-run --from=cronjob/date-printer',
        'kubectl logs job/manual-run',
        'kubectl delete cronjob date-printer --ignore-not-found',
        'kubectl delete jobs --all --ignore-not-found',
      ],
    }
  ),

  'phase-1/multi-container-patterns': review(
    'phase-1',
    'multi-container-patterns',
    'p1-m7',
    [sourceRefs.multiContainer, sourceRefs.pods, sourceRefs.initContainers],
    'multi-container pod patterns',
    {
      supplementalCommands: [
        'kubectl explain pod.spec.containers',
        "kubectl get pod sidecar-demo -o jsonpath='{.spec.containers[*].name}'",
        'kubectl logs sidecar-demo -c log-reader',
        'kubectl exec sidecar-demo -c app -- cat /var/log/app.log',
        'kubectl delete pod sidecar-demo --ignore-not-found',
      ],
    }
  ),

  'phase-2/service-types': review(
    'phase-2',
    'service-types',
    'p2-m7',
    [sourceRefs.serviceTypes, sourceRefs.services, sourceRefs.minikubeAccess],
    'Service types: ClusterIP, NodePort, LoadBalancer, ExternalName, Headless',
    {
      minikubePrerequisites: [
        'minikube start --kubernetes-version=v1.36.1',
        'kubectl create deployment nginx --image=nginx:1.27',
      ],
      supplementalCommands: [
        'kubectl explain service.spec.type',
        'kubectl get svc',
        'kubectl get endpoints',
        'minikube service nginx-nodeport --url',
        'kubectl delete svc nginx-clusterip nginx-nodeport --ignore-not-found',
      ],
    }
  ),

  'phase-2/dns-coredns': review(
    'phase-2',
    'dns-coredns',
    'p2-m8',
    [sourceRefs.dns, sourceRefs.services],
    'Kubernetes DNS and CoreDNS',
    {
      supplementalCommands: [
        'kubectl get pods -n kube-system -l k8s-app=kube-dns',
        'kubectl get configmap coredns -n kube-system -o yaml',
        'kubectl run dns-test --image=busybox:1.36 --rm -it --restart=Never -- nslookup kubernetes',
        'kubectl logs -n kube-system -l k8s-app=kube-dns --tail=20',
      ],
    }
  ),

  'phase-2/resource-quotas': review(
    'phase-2',
    'resource-quotas',
    'p2-m9',
    [sourceRefs.limitRange, sourceRefs.resourceQuota, sourceRefs.resources],
    'LimitRange and ResourceQuota',
    {
      supplementalCommands: [
        'kubectl explain limitrange',
        'kubectl explain resourcequota',
        'kubectl describe resourcequota -n quota-test',
        'kubectl describe limitrange -n quota-test',
        'kubectl delete namespace quota-test --ignore-not-found',
      ],
    }
  ),

  'phase-3/persistent-volumes': review(
    'phase-3',
    'persistent-volumes',
    'p3-m6',
    [sourceRefs.persistentVolumes, sourceRefs.volumes],
    'PersistentVolumes, PVCs, and StorageClasses',
    {
      supplementalCommands: [
        'kubectl get storageclass',
        'kubectl explain persistentvolumeclaim',
        'kubectl get pv,pvc',
        'kubectl describe pvc my-pvc',
        'kubectl delete pvc my-pvc --ignore-not-found',
        'kubectl delete pod pvc-writer --ignore-not-found',
      ],
    }
  ),

  'phase-4/security-context': review(
    'phase-4',
    'security-context',
    'p4-m6',
    [sourceRefs.securityContext, sourceRefs.podSecurity, sourceRefs.pods],
    'SecurityContext pod and container hardening',
    {
      supplementalCommands: [
        'kubectl explain pod.spec.securityContext',
        'kubectl explain pod.spec.containers.securityContext',
        'kubectl exec nonroot-pod -- id',
        'kubectl exec readonly-pod -- sh -c "echo test > /etc/hack"',
        'kubectl delete pod nonroot-pod readonly-pod --ignore-not-found',
      ],
    }
  ),

  'phase-4/node-management': review(
    'phase-4',
    'node-management',
    'p4-m7',
    [sourceRefs.nodeManagement, sourceRefs.scheduling, sourceRefs.taints],
    'Node cordon, drain, uncordon, taints',
    {
      supplementalCommands: [
        'kubectl get nodes',
        'kubectl cordon minikube',
        'kubectl drain minikube --ignore-daemonsets --delete-emptydir-data',
        'kubectl uncordon minikube',
        'kubectl taint nodes minikube env=prod:NoSchedule',
        'kubectl taint nodes minikube env=prod:NoSchedule-',
      ],
    }
  ),

  'phase-7/cluster-setup': review(
    'phase-7',
    'cluster-setup',
    'p7-m1',
    [sourceRefs.kubeadm, sourceRefs.components],
    'bootstrapping a cluster with kubeadm',
    {
      coverage: coverage('cluster setup and node joining', {
        commands: ['kubeadm init', 'kubeadm join', 'kubectl apply -f <cni>', 'kubectl get nodes'],
        architecture: [
          'kubeadm preflight',
          'control plane static pods',
          'bootstrap tokens',
          'CNI plugin',
        ],
        toolsAndPlugins: ['kubeadm', 'kubectl', 'flannel/calico'],
        scenarios: ['single control plane setup', 'worker node join', 'post-init verification'],
      }),
      supplementalCommands: [
        'kubeadm version',
        'kubeadm init --dry-run',
        'kubectl get nodes -o wide',
        'kubectl get pods -n kube-system',
      ],
    }
  ),

  'phase-7/etcd-operations': review(
    'phase-7',
    'etcd-operations',
    'p7-m2',
    [sourceRefs.etcd, sourceRefs.components],
    'etcd backup, restore, and health checks',
    {
      coverage: coverage('etcd operations', {
        commands: [
          'etcdctl snapshot save',
          'etcdctl snapshot restore',
          'etcdctl endpoint health',
          'etcdctl snapshot status',
        ],
        toolsAndPlugins: ['etcdctl', 'kubectl'],
        scenarios: ['scheduled backup', 'disaster recovery', 'health monitoring'],
      }),
      supplementalCommands: [
        'export ETCDCTL_API=3',
        'kubectl get pods -n kube-system | grep etcd',
        'etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key endpoint health',
      ],
    }
  ),

  'phase-7/cluster-upgrades': review(
    'phase-7',
    'cluster-upgrades',
    'p7-m3',
    [sourceRefs.clusterUpgrade, sourceRefs.kubeadm, sourceRefs.nodeManagement],
    'upgrading a cluster with kubeadm',
    {
      coverage: coverage('cluster upgrade process', {
        commands: [
          'kubeadm upgrade plan',
          'kubeadm upgrade apply',
          'kubectl drain',
          'kubectl uncordon',
          'systemctl restart kubelet',
        ],
        procedures: [
          'check upgrade path',
          'upgrade control plane',
          'drain worker',
          'upgrade kubelet/kubectl',
          'uncordon',
        ],
        scenarios: ['minor version upgrade', 'control plane first', 'rolling worker upgrade'],
      }),
      supplementalCommands: [
        'kubeadm upgrade plan',
        'kubectl get nodes',
        'kubectl drain minikube --ignore-daemonsets',
        'kubectl uncordon minikube',
      ],
    }
  ),

  'phase-7/certificate-management': review(
    'phase-7',
    'certificate-management',
    'p7-m4',
    [sourceRefs.pki, sourceRefs.kubeadm],
    'PKI and certificate management',
    {
      coverage: coverage('certificate lifecycle management', {
        commands: [
          'kubeadm certs check-expiration',
          'kubeadm certs renew',
          'openssl x509 -text',
          'kubectl config view',
        ],
        architecture: [
          'Kubernetes PKI',
          'CA chain',
          'component certificates',
          'ServiceAccount tokens',
        ],
        scenarios: ['pre-expiry renewal', 'certificate inspection', 'kubeconfig verification'],
      }),
      supplementalCommands: [
        'kubeadm certs check-expiration',
        'ls /etc/kubernetes/pki/',
        'openssl x509 -in /etc/kubernetes/pki/apiserver.crt -text -noout | grep -A2 Validity',
        'kubeadm certs renew --dry-run apiserver',
      ],
    }
  ),

  'phase-8/troubleshooting-pods': review(
    'phase-8',
    'troubleshooting-pods',
    'p8-m1',
    [sourceRefs.troubleshootingApps, sourceRefs.pods, sourceRefs.debugging],
    'pod troubleshooting: CrashLoopBackOff, OOMKilled, ImagePullBackOff',
    {
      coverage: coverage('pod failure diagnosis', {
        commands: [
          'kubectl get pods',
          'kubectl describe pod',
          'kubectl logs',
          'kubectl logs --previous',
          'kubectl exec',
          'kubectl get events',
        ],
        techniques: [
          'read status field',
          'check events section',
          'check previous container logs',
          'exec to inspect state',
        ],
        cases: [
          'CrashLoopBackOff',
          'OOMKilled',
          'ImagePullBackOff',
          'Pending no resources',
          'Init container failure',
        ],
        scenarios: [
          'application crash',
          'resource exhaustion',
          'image registry issue',
          'cluster resource shortage',
        ],
      }),
      supplementalCommands: [
        'kubectl get pods -A',
        'kubectl describe pod <name>',
        'kubectl logs <pod> --previous',
        'kubectl get events --sort-by=.lastTimestamp',
        'kubectl run debug --image=busybox:1.36 --rm -it -- sh',
      ],
    }
  ),

  'phase-8/troubleshooting-networking': review(
    'phase-8',
    'troubleshooting-networking',
    'p8-m2',
    [sourceRefs.troubleshootingApps, sourceRefs.serviceTypes, sourceRefs.dns, sourceRefs.debugging],
    'network troubleshooting: service unreachable, DNS failures',
    {
      coverage: coverage('network failure diagnosis', {
        commands: [
          'kubectl get endpoints',
          'kubectl exec -- curl',
          'kubectl exec -- nslookup',
          'kubectl port-forward',
          'kubectl logs -n kube-system coredns',
        ],
        techniques: [
          'check endpoints',
          'verify selector matches',
          'test DNS from pod',
          'inspect CoreDNS logs',
        ],
        cases: [
          'empty endpoints',
          'wrong selector',
          'DNS timeout',
          'NetworkPolicy blocking',
          'wrong port',
        ],
      }),
      supplementalCommands: [
        'kubectl get endpoints',
        'kubectl run debug --image=curlimages/curl --rm -it --restart=Never -- sh',
        'kubectl logs -n kube-system -l k8s-app=kube-dns',
        'kubectl get networkpolicies',
      ],
    }
  ),

  'phase-8/troubleshooting-nodes': review(
    'phase-8',
    'troubleshooting-nodes',
    'p8-m3',
    [sourceRefs.troubleshootingCluster, sourceRefs.nodeManagement, sourceRefs.debugging],
    'node troubleshooting: NotReady, kubelet, disk pressure',
    {
      coverage: coverage('node failure diagnosis', {
        commands: [
          'kubectl get nodes',
          'kubectl describe node',
          'systemctl status kubelet',
          'journalctl -u kubelet',
          'kubectl cordon',
        ],
        architecture: [
          'node conditions',
          'kubelet process',
          'container runtime',
          'disk/memory pressure',
        ],
        cases: [
          'NotReady',
          'MemoryPressure',
          'DiskPressure',
          'kubelet crash',
          'network unavailable',
        ],
      }),
      supplementalCommands: [
        'kubectl get nodes -o wide',
        'kubectl describe node minikube',
        'kubectl get events -A --sort-by=.lastTimestamp | grep -i node',
      ],
    }
  ),

  'phase-8/troubleshooting-cluster': review(
    'phase-8',
    'troubleshooting-cluster',
    'p8-m4',
    [
      sourceRefs.troubleshootingCluster,
      sourceRefs.components,
      sourceRefs.etcd,
      sourceRefs.debugging,
    ],
    'cluster component troubleshooting: control plane, static pods, etcd',
    {
      coverage: coverage('control plane failure diagnosis', {
        commands: [
          'kubectl get pods -n kube-system',
          'kubectl logs -n kube-system',
          'ls /etc/kubernetes/manifests',
          'etcdctl endpoint health',
        ],
        architecture: [
          'static pod manifests',
          'kube-apiserver',
          'kube-scheduler',
          'kube-controller-manager',
          'etcd health',
        ],
        toolsAndPlugins: ['kubectl', 'etcdctl', 'systemctl', 'journalctl'],
        cases: [
          'broken static pod manifest',
          'wrong flag in apiserver',
          'etcd unreachable',
          'controller-manager crash',
        ],
      }),
      supplementalCommands: [
        'kubectl get pods -n kube-system',
        'ls /etc/kubernetes/manifests/',
        'kubectl logs -n kube-system kube-apiserver-minikube',
        'kubectl get componentstatuses 2>/dev/null || true',
      ],
    }
  ),

  'phase-1/container-images': review(
    'phase-1',
    'container-images',
    'p1-m8',
    [sourceRefs.pods, sourceRefs.concepts, sourceRefs.minikube],
    'Container image build, multi-stage Dockerfiles, and loading images into minikube',
    {
      supplementalCommands: [
        'docker build -t myapp:v1 .',
        'docker images',
        'docker history myapp:v1',
        'minikube image load myapp:v1',
        'minikube image ls',
        'eval $(minikube docker-env)',
        'kubectl run myapp --image=myapp:v1 --image-pull-policy=Never',
      ],
    }
  ),

  'phase-3/gateway-api': review(
    'phase-3',
    'gateway-api',
    'p3-m7',
    [sourceRefs.ingress, sourceRefs.services, sourceRefs.crds],
    'Gateway API: GatewayClass, Gateway, HTTPRoute resources',
    {
      supplementalCommands: [
        'kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml',
        'kubectl get crd | grep gateway.networking.k8s.io',
        'kubectl get gatewayclass',
        'kubectl get gateway',
        'kubectl get httproute',
        'kubectl describe httproute',
      ],
    }
  ),

  'phase-4/admission-controllers': review(
    'phase-4',
    'admission-controllers',
    'p4-m8',
    [sourceRefs.podSecurity, sourceRefs.securityContext, sourceRefs.rbac],
    'Admission controllers: PodSecurity standards, mutating and validating webhooks',
    {
      supplementalCommands: [
        'kubectl label ns psa-test pod-security.kubernetes.io/enforce=restricted',
        'kubectl get mutatingwebhookconfigurations',
        'kubectl get validatingwebhookconfigurations',
        'kubectl describe mutatingwebhookconfiguration',
        'kubectl delete ns psa-test --ignore-not-found',
      ],
    }
  ),

  'phase-5/api-deprecations': review(
    'phase-5',
    'api-deprecations',
    'p5-m8',
    [sourceRefs.releases, sourceRefs.kubectl, sourceRefs.concepts],
    'Kubernetes API deprecation policy, detection with Pluto, kubectl convert',
    {
      supplementalCommands: [
        'kubectl api-versions | sort',
        'kubectl api-resources',
        'kubectl explain ingress',
        'kubectl explain cronjob',
        'kubectl krew install convert',
        'kubectl convert -f old.yaml --output-version networking.k8s.io/v1',
        'pluto detect-files -d ./manifests --target-versions k8s=v1.32.0',
      ],
    }
  ),

  'phase-7/ha-control-plane': review(
    'phase-7',
    'ha-control-plane',
    'p7-m5',
    [sourceRefs.kubeadm, sourceRefs.etcd, sourceRefs.components],
    'HA control plane: stacked vs external etcd, kubeadm HA init, leader election Leases',
    {
      supplementalCommands: [
        'kubectl get lease -n kube-system',
        'kubectl describe lease kube-controller-manager -n kube-system',
        'kubectl exec -n kube-system etcd-minikube -- etcdctl member list',
        'kubeadm init --help | grep control-plane-endpoint',
        'kubeadm config validate --config ha-config.yaml',
      ],
    }
  ),
}

export function getModuleReview(phaseSlug: string, moduleSlug: string): ModuleReview | undefined {
  return moduleReviews[`${phaseSlug}/${moduleSlug}`]
}

export function getAllModuleReviews(): ModuleReview[] {
  return Object.values(moduleReviews)
}
