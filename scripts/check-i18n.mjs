#!/usr/bin/env node
// CI guard: forbid hardcoded Cyrillic content strings in the source tree.
// All user-facing copy must live in the i18n dictionaries (src/i18n/dicts)
// or arrive from the backend already localized. The dictionaries themselves
// are the single allowed home for Cyrillic, so they are exempt.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')
const EXEMPT = ['src/i18n/dicts']
const CYRILLIC = /[Ѐ-ӿ]/

/** @param {string} dir */
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else if (/\.(ts|tsx)$/.test(full)) yield full
  }
}

const offenders = []
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file)
  if (EXEMPT.some((p) => rel.startsWith(p))) continue
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (CYRILLIC.test(line)) offenders.push(`${rel}:${i + 1}  ${line.trim()}`)
  })
}

if (offenders.length) {
  console.error('✗ Hardcoded Cyrillic strings found outside i18n dictionaries:\n')
  console.error(offenders.join('\n'))
  console.error(
    `\n${offenders.length} offending line(s). Move copy into src/i18n/dicts or fetch it from the API.`,
  )
  process.exit(1)
}

console.log('✓ No hardcoded Cyrillic strings outside i18n dictionaries.')
