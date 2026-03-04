#!/usr/bin/env node

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const projectDir = process.cwd()
const projectSkillDir = path.join(projectDir, 'skills', 'flashcard-local')
const skillName = 'flashcard-local'
const openclawDir = process.env.OPENCLAW_DIR || path.join(os.homedir(), '.openclaw')
const configPath = path.join(openclawDir, 'openclaw.json')
const managedSkillsDir = path.join(openclawDir, 'skills')
const managedSkillDir = path.join(managedSkillsDir, skillName)
const baseUrl = process.env.FLASHCARD_BASE_URL || 'http://localhost:3000'
const accountId = process.env.FLASHCARD_ACCOUNT_ID || ''

function printSection(title) {
  process.stdout.write(`\n=== ${title} ===\n`)
}

async function fileExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function ensureSkillInstalled() {
  printSection('Skill copy')
  const exists = await fileExists(projectSkillDir)
  if (!exists) {
    throw new Error(`skill source not found: ${projectSkillDir}`)
  }
  await fs.mkdir(managedSkillsDir, { recursive: true })
  await fs.rm(managedSkillDir, { recursive: true, force: true })
  await fs.cp(projectSkillDir, managedSkillDir, { recursive: true })
  process.stdout.write(`copied: ${projectSkillDir} -> ${managedSkillDir}\n`)
}

async function loadConfig() {
  if (!(await fileExists(configPath))) {
    return {}
  }
  const raw = await fs.readFile(configPath, 'utf8')
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(
      [
        `openclaw config is not strict JSON: ${configPath}`,
        'JSON5 or comments may exist. 백업 후 수동 반영하거나 openclaw 설정 파일을 순수 JSON으로 정리하세요.',
      ].join('\n'),
    )
  }
}

function toArray(value) {
  return Array.isArray(value) ? value : []
}

function normalizeStringMap(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

async function writeConfig(config) {
  await fs.mkdir(openclawDir, { recursive: true })
  await fs.writeFile(
    configPath,
    `${JSON.stringify(config, null, 2)}\n`,
    'utf8',
  )
}

async function syncOpenClawConfig() {
  printSection('openclaw config merge')
  const config = await loadConfig()
  const skills = normalizeStringMap(config.skills)
  const load = normalizeStringMap(skills.load)
  const extraDirs = toArray(load.extraDirs)
  const entries = normalizeStringMap(skills.entries)

  const normalizedProjectsSkillsPath = path.join(projectDir, 'skills')
  const mergedExtraDirs = [
    ...extraDirs.filter((item) => typeof item === 'string' && item.trim()),
    path.resolve(normalizedProjectsSkillsPath),
  ]

  load.extraDirs = [...new Set(mergedExtraDirs)]
  if (!load.watch) load.watch = true
  if (!load.watchDebounceMs) load.watchDebounceMs = 250
  skills.load = load

  const currentEntry = normalizeStringMap(entries[skillName])
  skills.entries = {
    ...entries,
    [skillName]: {
      ...currentEntry,
      enabled: true,
      env: {
        ...(normalizeStringMap(currentEntry.env)),
        FLASHCARD_BASE_URL: baseUrl,
        ...(accountId ? { FLASHCARD_ACCOUNT_ID: accountId } : {}),
      },
      config: {
        ...(normalizeStringMap(currentEntry.config)),
      },
    },
  }

  config.skills = skills

  if (!config.agents) config.agents = {}
  await writeConfig(config)
  process.stdout.write(`updated: ${configPath}\n`)
}

async function main() {
  try {
    await ensureSkillInstalled()
    await syncOpenClawConfig()
    printSection('Done')
    process.stdout.write('openclaw registration finished.\n')
    process.stdout.write(`Skill: ${skillName}\n`)
    process.stdout.write(`Config: ${configPath}\n`)
    process.stdout.write(`MCP: set server command to scripts/mcp-flashcard-server.mjs\n`)
  } catch (error) {
    process.stderr.write(`failed: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}

main()
