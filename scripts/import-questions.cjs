#!/usr/bin/env node
/**
 * scripts/import-questions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dev tool: bulk-import questions from a CSV into a campaign's questions.json.
 *
 * Usage:
 *   node scripts/import-questions.js --campaign japanese --file ./my-questions.csv
 *   node scripts/import-questions.js --campaign korean   --file ./my-questions.csv --dry-run
 *   node scripts/import-questions.js --campaign spanish  --file ./my-questions.csv --overwrite
 *
 * Flags:
 *   --campaign  <name>   Required. Campaign folder under src/data/ (japanese | korean | spanish)
 *   --file      <path>   Required. Path to the CSV file.
 *   --dry-run            Preview what would be imported without writing.
 *   --overwrite          Replace a question if the same `id` already exists (default: skip).
 *   --help               Show this message.
 *
 * CSV format  (see scripts/questions-template.csv for a full example):
 *   id, campaign, floor_tier, type, question, opt1, opt2, opt3, opt4,
 *   correct_index, hint, graveyard_label, graveyard_reading, explanation, tags
 *
 *   • All columns are required except `explanation` (can be blank).
 *   • `floor_tier`    : 1 | 2 | 3 | 4
 *   • `type`          : vocabulary | grammar | reading
 *   • `correct_index` : 0-based index of the correct option (0 = opt1)
 *   • `tags`          : pipe-separated e.g.  verb|food|basic
 */

const fs   = require('fs')
const path = require('path')

// ── Arg parsing ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2)

function getArg(name) {
  const i = args.indexOf(name)
  return i !== -1 && args[i + 1] ? args[i + 1] : null
}

const campaign  = getArg('--campaign')
const csvFile   = getArg('--file')
const dryRun    = args.includes('--dry-run')
const overwrite = args.includes('--overwrite')
const showHelp  = args.includes('--help') || args.includes('-h')

if (showHelp || !campaign || !csvFile) {
  console.log(`
Ascendant Question Importer
─────────────────────────────
Usage:
  node scripts/import-questions.js --campaign japanese --file ./my-questions.csv

Flags:
  --campaign  <name>   japanese | korean | spanish
  --file      <path>   Path to the CSV file
  --dry-run            Preview without writing
  --overwrite          Replace existing IDs instead of skipping them
  --help               This message
  `)
  process.exit(showHelp ? 0 : 1)
}

// ── Resolve paths ─────────────────────────────────────────────────────────────
const questionsPath = path.resolve(
  __dirname, '..', 'src', 'data', campaign, 'questions.json'
)
const csvPath = path.resolve(csvFile)

if (!fs.existsSync(questionsPath)) {
  console.error(`✗ Campaign not found: ${questionsPath}`)
  process.exit(1)
}
if (!fs.existsSync(csvPath)) {
  console.error(`✗ CSV file not found: ${csvPath}`)
  process.exit(1)
}

// ── CSV parser ────────────────────────────────────────────────────────────────
// Handles quoted fields (including fields with commas/newlines inside quotes).
function parseCSV(raw) {
  const lines   = []
  let cur       = ''
  let inQuote   = false

  for (let i = 0; i < raw.length; i++) {
    const ch   = raw[i]
    const next = raw[i + 1]

    if (ch === '"') {
      if (inQuote && next === '"') { cur += '"'; i++ }   // escaped quote
      else inQuote = !inQuote
    } else if (ch === '\n' && !inQuote) {
      lines.push(cur); cur = ''
    } else if (ch === '\r' && next === '\n' && !inQuote) {
      lines.push(cur); cur = ''; i++
    } else {
      cur += ch
    }
  }
  if (cur.trim()) lines.push(cur)

  return lines.map(line => {
    const cells = []
    let cell    = ''
    let inQ     = false
    for (let i = 0; i < line.length; i++) {
      const ch   = line[i]
      const next = line[i + 1]
      if (ch === '"') {
        if (inQ && next === '"') { cell += '"'; i++ }
        else inQ = !inQ
      } else if (ch === ',' && !inQ) {
        cells.push(cell.trim()); cell = ''
      } else {
        cell += ch
      }
    }
    cells.push(cell.trim())
    return cells
  })
}

// ── Validation ─────────────────────────────────────────────────────────────────
const VALID_TYPES = new Set(['vocabulary', 'grammar', 'reading'])
const VALID_TIERS = new Set([1, 2, 3, 4])

function validateRow(row, lineNum) {
  const errs = []
  if (!row.id)         errs.push('missing id')
  if (!row.campaign)   errs.push('missing campaign')
  if (!VALID_TIERS.has(row.floor_tier)) errs.push(`invalid floor_tier "${row.floor_tier}" (must be 1-4)`)
  if (!VALID_TYPES.has(row.type))       errs.push(`invalid type "${row.type}"`)
  if (!row.question)   errs.push('missing question')
  if (!row.opt1 || !row.opt2 || !row.opt3 || !row.opt4) errs.push('need 4 options (opt1-opt4)')
  if (![0,1,2,3].includes(row.correct_index)) errs.push(`invalid correct_index "${row.correct_index}" (must be 0-3)`)
  if (!row.graveyard_label) errs.push('missing graveyard_label')
  return errs.map(e => `  Line ${lineNum}: ${e}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
const rawCSV  = fs.readFileSync(csvPath, 'utf8')
const parsed  = parseCSV(rawCSV)

if (parsed.length < 2) {
  console.error('✗ CSV appears empty or has no data rows.')
  process.exit(1)
}

// First row = headers
const headers = parsed[0].map(h => h.toLowerCase().trim())
const EXPECTED_HEADERS = [
  'id','campaign','floor_tier','type','question',
  'opt1','opt2','opt3','opt4','correct_index',
  'hint','graveyard_label','graveyard_reading','explanation','tags'
]

// Check all required headers exist
const missingHeaders = EXPECTED_HEADERS.filter(h => !headers.includes(h))
if (missingHeaders.length > 0) {
  console.error(`✗ Missing CSV columns: ${missingHeaders.join(', ')}`)
  console.error(`  Expected: ${EXPECTED_HEADERS.join(', ')}`)
  process.exit(1)
}

const col = h => headers.indexOf(h)

const newRows   = []
const allErrors = []

parsed.slice(1).forEach((cells, i) => {
  // Skip blank lines
  if (cells.every(c => !c)) return

  const lineNum = i + 2 // 1-indexed, +1 for header

  const row = {
    id:               cells[col('id')],
    campaign:         cells[col('campaign')] || campaign,
    floor_tier:       parseInt(cells[col('floor_tier')], 10),
    type:             cells[col('type')],
    question:         cells[col('question')],
    opt1:             cells[col('opt1')],
    opt2:             cells[col('opt2')],
    opt3:             cells[col('opt3')],
    opt4:             cells[col('opt4')],
    correct_index:    parseInt(cells[col('correct_index')], 10),
    hint:             cells[col('hint')] || '',
    graveyard_label:  cells[col('graveyard_label')],
    graveyard_reading: cells[col('graveyard_reading')] || '',
    explanation:      cells[col('explanation')] || '',
    tags:             (cells[col('tags')] || '').split('|').map(t => t.trim()).filter(Boolean),
  }

  const errs = validateRow(row, lineNum)
  if (errs.length) { allErrors.push(...errs); return }

  newRows.push({
    id:               row.id,
    campaign:         row.campaign,
    floor_tier:       row.floor_tier,
    type:             row.type,
    question:         row.question,
    options:          [row.opt1, row.opt2, row.opt3, row.opt4],
    correct_index:    row.correct_index,
    hint:             row.hint,
    graveyard_label:  row.graveyard_label,
    graveyard_reading: row.graveyard_reading,
    explanation:      row.explanation,
    tags:             row.tags,
  })
})

if (allErrors.length) {
  console.error(`\n✗ Validation errors found:\n${allErrors.join('\n')}`)
  console.error('\nFix the errors above and re-run. No changes were written.')
  process.exit(1)
}

if (newRows.length === 0) {
  console.warn('⚠  No valid rows found in CSV.')
  process.exit(0)
}

// ── Merge into existing questions.json ────────────────────────────────────────
const existing   = JSON.parse(fs.readFileSync(questionsPath, 'utf8'))
const existingMap = new Map(existing.map(q => [q.id, q]))

let added    = 0
let skipped  = 0
let replaced = 0

for (const row of newRows) {
  if (existingMap.has(row.id)) {
    if (overwrite) {
      existingMap.set(row.id, row)
      replaced++
    } else {
      console.warn(`  ⚠  Skipping duplicate id "${row.id}" (use --overwrite to replace)`)
      skipped++
    }
  } else {
    existingMap.set(row.id, row)
    added++
  }
}

const merged = Array.from(existingMap.values())

// ── Output ────────────────────────────────────────────────────────────────────
console.log(`\nAscendant Question Importer`)
console.log(`─────────────────────────────`)
console.log(`Campaign   : ${campaign}`)
console.log(`CSV file   : ${csvPath}`)
console.log(`Rows read  : ${newRows.length}`)
console.log(`Added      : ${added}`)
console.log(`Replaced   : ${replaced}`)
console.log(`Skipped    : ${skipped}`)
console.log(`Total after: ${merged.length}`)

if (dryRun) {
  console.log(`\n[DRY RUN] No changes written. Remove --dry-run to apply.`)

  if (added + replaced > 0) {
    console.log('\nPreview of first 3 rows that would be imported:')
    newRows.slice(0, 3).forEach(r => {
      console.log(`  ${r.id} | ${r.type} | floor_tier=${r.floor_tier} | "${r.question.slice(0, 50)}..."`)
    })
  }
} else {
  // Write backup first
  const backupPath = questionsPath.replace('.json', `.backup-${Date.now()}.json`)
  fs.writeFileSync(backupPath, JSON.stringify(existing, null, 2), 'utf8')
  console.log(`\nBackup saved : ${backupPath}`)

  fs.writeFileSync(questionsPath, JSON.stringify(merged, null, 2), 'utf8')
  console.log(`✓ Written    : ${questionsPath}`)
  console.log('\nDone! Restart your dev server to pick up the new questions.')
}
