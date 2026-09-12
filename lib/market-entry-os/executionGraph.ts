import type { CorridorPlan, CorridorStep } from '@/lib/intelligence/workflowEngine'
import type { ExecutionGraph, ExecutionTask } from './types'

function taskId(side: 'export' | 'import', step: CorridorStep): string {
  return `${side}-${step.step}-${step.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
}

export function buildExecutionGraph(plan: CorridorPlan): ExecutionGraph {
  const exportSteps = plan.steps.filter((step) => step.side === 'export')
  const importSteps = plan.steps.filter((step) => step.side === 'import')
  const tasks: ExecutionTask[] = []

  const appendSide = (steps: CorridorStep[], side: 'export' | 'import') => {
    let previousId: string | null = null
    for (const step of steps) {
      const id = taskId(side, step)
      const prerequisiteIds = previousId ? [previousId] : []
      tasks.push({
        id,
        title: step.title,
        description: step.description,
        side,
        status: 'pending',
        prerequisiteIds,
        estimatedWeeks: Number.isFinite(step.estimated_weeks) ? Math.max(0, step.estimated_weeks) : null,
        evidenceIds: [],
      })
      previousId = id
    }
  }

  appendSide(exportSteps, 'export')
  appendSide(importSteps, 'import')

  // Import release cannot be completed before the export chain has produced
  // its shipment-ready output. Other import preparation can proceed in parallel.
  const lastExport = tasks.filter((task) => task.side === 'export').at(-1)
  const firstImport = tasks.find((task) => task.side === 'import')
  if (lastExport && firstImport) firstImport.prerequisiteIds.push(lastExport.id)

  const taskById = new Map(tasks.map((task) => [task.id, task]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const path: string[] = []
  let cycleDetected = false

  const visit = (id: string) => {
    if (cycleDetected || visited.has(id)) return
    if (visiting.has(id)) {
      cycleDetected = true
      return
    }
    visiting.add(id)
    path.push(id)
    for (const prerequisite of taskById.get(id)?.prerequisiteIds ?? []) {
      if (!taskById.has(prerequisite)) {
        cycleDetected = true
        continue
      }
      visit(prerequisite)
    }
    path.pop()
    visiting.delete(id)
    visited.add(id)
  }
  for (const task of tasks) visit(task.id)

  const criticalPathTaskIds: string[] = []
  const longestPath = new Map<string, number>()
  const longestPred = new Map<string, string | null>()

  const depth = (id: string): number => {
    if (longestPath.has(id)) return longestPath.get(id)!
    const task = taskById.get(id)
    if (!task) return 0
    let best = 0
    let bestPred: string | null = null
    for (const prerequisite of task.prerequisiteIds) {
      const candidate = depth(prerequisite)
      if (candidate > best) {
        best = candidate
        bestPred = prerequisite
      }
    }
    const total = best + (task.estimatedWeeks ?? 0)
    longestPath.set(id, total)
    longestPred.set(id, bestPred)
    return total
  }

  let terminalId: string | null = null
  let terminalDepth = 0
  if (!cycleDetected) {
    for (const task of tasks) {
      const d = depth(task.id)
      if (d >= terminalDepth) {
        terminalDepth = d
        terminalId = task.id
      }
    }
    const reversed: string[] = []
    for (let current = terminalId; current; current = longestPred.get(current) ?? null) reversed.push(current)
    criticalPathTaskIds.push(...reversed.reverse())
  }

  return {
    tasks,
    criticalPathTaskIds,
    sequentialWeeks: tasks.reduce((sum, task) => sum + (task.estimatedWeeks ?? 0), 0),
    criticalPathWeeks: cycleDetected ? 0 : terminalDepth,
    cycleDetected,
  }
}
