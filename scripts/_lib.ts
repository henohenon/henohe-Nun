import { readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'

export function loadEnvFile(path: string): void {
  const content = readFileSync(path, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const raw = trimmed.slice(eqIdx + 1).trim()
    const q = raw[0]
    const end = (q === '"' || q === "'") ? raw.indexOf(q, 1) : -1
    const val = end !== -1
      ? raw.slice(1, end)
      : raw.replace(/\s+#.*$/, '').trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
}

export function runCommand(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: true })
    proc.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`)))
  })
}

export interface ParsedArgs {
  values: Record<string, string>
  flags: Set<string>
}

export function parseArgs(argv = process.argv.slice(2)): ParsedArgs {
  const values: Record<string, string> = {}
  const flags = new Set<string>()
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const next = argv[i + 1]
    if (next == null || next.startsWith('--')) {
      flags.add(key)
    } else {
      values[key] = next
      i++
    }
  }
  return { values, flags }
}
