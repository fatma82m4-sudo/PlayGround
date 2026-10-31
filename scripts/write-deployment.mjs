import { mkdirSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'

const [output, project, directory] = process.argv.slice(2)
if (!output || !project || !directory) {
  console.error('Usage: write-deployment.mjs <output> <project> <directory>')
  process.exit(1)
}

const projectRoot = realpathSync(resolve(project))
const built = realpathSync(resolve(directory))
if (built !== projectRoot && !built.startsWith(projectRoot + sep)) {
  console.error(`Built directory must stay inside the project: ${built}`)
  process.exit(1)
}

mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, JSON.stringify({ project: projectRoot, directory: built }) + '\n')
console.log(`Deployment output: ${output} -> ${built}`)
