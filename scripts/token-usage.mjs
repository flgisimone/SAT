/**
 * Consumi delle sessioni di Claude Code su questo progetto (F33-01), dai log locali in
 * `~/.claude/projects/<progetto>/*.jsonl`. Per sessione: chiamate API, contesto per chiamata, compattazioni,
 * token di cache e generati, output degli strumenti per tipo, letture di immagini.
 *
 * Uso: `npm run usage` oppure `npm run usage -- --since 2026-10-18` (solo le voci da quel giorno).
 * I costi non si calcolano: i token sono quelli registrati nei log, i prezzi cambiano per modello.
 */
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

const sinceIndex = process.argv.indexOf('--since')
const since = sinceIndex > 0 ? process.argv[sinceIndex + 1] : undefined
if (since !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(since)) {
  console.error('--since vuole una data AAAA-MM-GG')
  process.exit(1)
}

// Claude Code salva i log in una cartella col percorso del progetto, con ogni carattere non alfanumerico come «-».
const LOGS = join(homedir(), '.claude', 'projects', process.cwd().replace(/[^a-zA-Z0-9]/g, '-'))
if (!existsSync(LOGS)) {
  console.log(`Nessun log di Claude Code per questo progetto (${LOGS}).`)
  process.exit(0)
}

/** Tipo di un comando Bash, per sapere quale output pesa. */
function bashKind(command) {
  if (/playwright|test:e2e|verify:e2e/.test(command)) return 'e2e'
  if (/vitest|test:run/.test(command)) return 'test'
  if (/npm run (build|verify)|\btsc\b/.test(command)) return 'build'
  if (/\blint\b|eslint/.test(command)) return 'lint'
  if (/^\s*(cd [^&]+&&\s*)?git\b/.test(command)) return 'git'
  if (/\b(cat|sed|head|tail)\b/.test(command)) return 'lettura'
  if (/\b(grep|find|rg)\b/.test(command)) return 'ricerca'
  return 'altro'
}

const size = (content) => (typeof content === 'string' ? content : JSON.stringify(content ?? '')).length
const hasImage = (content) => Array.isArray(content) && content.some((block) => block?.type === 'image')

async function readSession(file) {
  const session = { calls: 0, contexts: [], compactions: 0, cacheRead: 0, cacheWrite: 0, input: 0, output: 0, tools: {}, images: 0, malformed: 0 }
  const pending = new Map()
  const lines = createInterface({ input: createReadStream(file), crlfDelay: Infinity })
  for await (const line of lines) {
    if (!line.trim()) continue
    let entry
    try {
      entry = JSON.parse(line)
    } catch {
      session.malformed++
      continue
    }
    if (since && typeof entry.timestamp === 'string' && entry.timestamp.slice(0, 10) < since) continue
    if (entry.isCompactSummary) session.compactions++
    const message = entry.message
    if (!message || typeof message !== 'object') continue
    const usage = message.usage
    if (entry.type === 'assistant' && usage) {
      session.calls++
      session.cacheRead += usage.cache_read_input_tokens ?? 0
      session.cacheWrite += usage.cache_creation_input_tokens ?? 0
      session.input += usage.input_tokens ?? 0
      session.output += usage.output_tokens ?? 0
      session.contexts.push((usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) + (usage.input_tokens ?? 0))
    }
    if (!Array.isArray(message.content)) continue
    for (const block of message.content) {
      if (block?.type === 'tool_use') {
        pending.set(block.id, block.name === 'Bash' ? `Bash · ${bashKind(String(block.input?.command ?? ''))}` : block.name)
      } else if (block?.type === 'tool_result' && pending.has(block.tool_use_id)) {
        const tool = pending.get(block.tool_use_id)
        if (hasImage(block.content)) session.images++
        else {
          const total = (session.tools[tool] ??= { chars: 0, calls: 0 })
          total.chars += size(block.content)
          total.calls++
        }
      }
    }
  }
  return session
}

const number = (value) => Math.round(value).toLocaleString('it-IT')
const files = readdirSync(LOGS)
  .filter((name) => name.endsWith('.jsonl'))
  .map((name) => join(LOGS, name))
  .sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs)

const totals = { calls: 0, cacheRead: 0, cacheWrite: 0, output: 0, tools: {} }
for (const file of files) {
  const session = await readSession(file)
  if (session.calls === 0) continue
  const contexts = session.contexts.sort((a, b) => a - b)
  const mean = contexts.reduce((sum, value) => sum + value, 0) / contexts.length
  console.log(`\nSessione ${file.split('/').pop().slice(0, 8)} · ${new Date(statSync(file).mtimeMs).toLocaleDateString('it-IT')}`)
  console.log(`  chiamate API ${number(session.calls)} · compattazioni ${session.compactions} · immagini lette ${session.images}`)
  console.log(`  contesto per chiamata: media ${number(mean)} · mediana ${number(contexts[contexts.length >> 1])} · massimo ${number(contexts.at(-1))}`)
  console.log(`  token: cache letta ${number(session.cacheRead)} · cache scritta ${number(session.cacheWrite)} · generati ${number(session.output)}`)
  if (session.malformed) console.log(`  righe illeggibili saltate: ${session.malformed}`)
  totals.calls += session.calls
  totals.cacheRead += session.cacheRead
  totals.cacheWrite += session.cacheWrite
  totals.output += session.output
  for (const [tool, value] of Object.entries(session.tools)) {
    const total = (totals.tools[tool] ??= { chars: 0, calls: 0 })
    total.chars += value.chars
    total.calls += value.calls
  }
}

if (totals.calls === 0) {
  console.log(since ? `Nessuna chiamata dal ${since}.` : 'Nessuna chiamata nei log.')
  process.exit(0)
}

console.log(`\nTotale · chiamate ${number(totals.calls)} · cache letta ${number(totals.cacheRead)} · cache scritta ${number(totals.cacheWrite)} · generati ${number(totals.output)}`)
// Circa 4 caratteri per token: basta per confrontare le fonti tra loro e con la cache scritta.
console.log('Output degli strumenti (caratteri, ~token, quota della cache scritta):')
for (const [tool, value] of Object.entries(totals.tools).sort((a, b) => b[1].chars - a[1].chars).slice(0, 15)) {
  const share = ((value.chars / 4 / totals.cacheWrite) * 100).toFixed(1)
  console.log(`  ${tool.padEnd(34)} ${number(value.chars).padStart(12)} · ~${number(value.chars / 4).padStart(10)} · ${share.padStart(5)}% · ${number(value.calls)} chiamate`)
}
