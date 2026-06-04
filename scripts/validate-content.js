const fs = require('fs')
const path = require('path')

const root = process.cwd()
const contentDir = path.join(root, 'content')
const phaseFiles = fs
  .readdirSync(contentDir)
  .filter((file) => /^phase\d+\.ts$/.test(file))
  .sort()

const modules = []
for (const file of phaseFiles) {
  const source = fs.readFileSync(path.join(contentDir, file), 'utf8')
  const phaseSlug = source.match(/slug:\s*'([^']+)'/)?.[1]
  if (!phaseSlug) {
    throw new Error(`Could not find phase slug in ${file}`)
  }

  const moduleMatches = [...source.matchAll(/^\s{4}\{\n\s{6}id:\s*'(p\d+-m\d+)',([\s\S]*?)(?=^\s{4}\{\n\s{6}id:\s*'p\d+-m\d+',|^\s{2}\],)/gm)]

  for (let i = 0; i < moduleMatches.length; i += 1) {
    const moduleId = moduleMatches[i][1]
    const block = moduleMatches[i][2]
    const moduleSlug = block.match(/slug:\s*'([^']+)'/)?.[1]
    const title = block.match(/title:\s*'([^']+)'/)?.[1]
    if (!moduleId || !moduleSlug || !title) {
      throw new Error(`Could not parse module ${i + 1} in ${file}`)
    }
    modules.push({ phaseSlug, moduleSlug, moduleId, title })
  }
}

const reviewMatrix = fs.readFileSync(path.join(contentDir, 'reviewMatrix.ts'), 'utf8')
const failures = []

for (const mod of modules) {
  const key = `${mod.phaseSlug}/${mod.moduleSlug}`
  const keyLiteral = `'${key}'`
  const keyIndex = reviewMatrix.indexOf(keyLiteral)
  if (keyIndex === -1) {
    failures.push(`${key}: missing reviewMatrix entry`)
    continue
  }

  const nextKeyIndex = reviewMatrix.indexOf("\n  '", keyIndex + keyLiteral.length)
  const block = reviewMatrix.slice(keyIndex, nextKeyIndex === -1 ? reviewMatrix.length : nextKeyIndex)

  if (!block.includes(`'${mod.moduleId}'`)) {
    failures.push(`${key}: review entry does not reference module id ${mod.moduleId}`)
  }
  if (!/reviewStatus:\s*extras\.reviewStatus \?\? 'verified'/.test(reviewMatrix) && !/reviewStatus:\s*'verified'/.test(block)) {
    failures.push(`${key}: missing verified review status`)
  }
  if (!/sourceRefs:\s*\[sourceRefs\.releases,\s*sourceRefs\.kubectl,\s*sourceRefs\.minikube,/.test(reviewMatrix)) {
    failures.push(`${key}: review factory must include release, kubectl, and minikube source refs`)
  }
  if (!/supplementalCommands:\s*\[/.test(block) && !/supplementalCommands:\s*extras\.supplementalCommands/.test(reviewMatrix)) {
    failures.push(`${key}: missing supplemental local commands`)
  }
}

const requiredSourceUrls = [
  'https://kubernetes.io/docs/concepts/',
  'https://kubernetes.io/docs/reference/kubectl/',
  'https://kubernetes.io/docs/tutorials/kubernetes-basics/deploy-app/deploy-intro/',
  'https://minikube.sigs.k8s.io/docs/',
  'https://minikube.sigs.k8s.io/docs/tutorials/',
  'https://helm.sh/docs/',
]

for (const url of requiredSourceUrls) {
  if (!reviewMatrix.includes(url)) {
    failures.push(`reviewMatrix.ts: missing required source URL ${url}`)
  }
}

if (!reviewMatrix.includes("checkedAt = '2026-06'")) {
  failures.push('reviewMatrix.ts: missing June 2026 checkedAt marker')
}

if (failures.length > 0) {
  console.error('Content validation failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log(`Content validation passed: ${modules.length} modules have June 2026 review coverage.`)
