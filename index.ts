import { parseJSON } from 'date-fns'
import * as fs from 'fs'

export type ScheduleEntry = {
    user_id: string
    start_at: Date
    end_at: Date
}

export type ScheduleData = {
    schedule_entries: ScheduleEntry[]
    override_entries: ScheduleEntry[]
}

type RawScheduleEntry = {
    user_id: string
    start_at: string
    end_at: string
}

type RawScheduleData = {
    schedule_entries: RawScheduleEntry[]
    override_entries: RawScheduleEntry[]
}

export const runScript = () => {
    const scheduleData: ScheduleData = loadData('input.json')
    const actualShifts = buildActualShifts(
        scheduleData.schedule_entries,
        scheduleData.override_entries
    )
    writeOutputJson(actualShifts)
}

function loadData(filePath: string): ScheduleData {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed: RawScheduleData = JSON.parse(raw)
    const toScheduleEntry = (rawScheduleEntry: RawScheduleEntry): ScheduleEntry => ({
        user_id: rawScheduleEntry.user_id,
        start_at: parseJSON(rawScheduleEntry.start_at),
        end_at: parseJSON(rawScheduleEntry.end_at),
    })
    return {
        schedule_entries: parsed.schedule_entries.map(toScheduleEntry),
        override_entries: parsed.override_entries.map(toScheduleEntry),
    }
}

function writeOutputJson(scheduleEntries: ScheduleEntry[]): void {
    const output = {
        entries: scheduleEntries,
    }
    const path = require('path')
    const dir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
    }
    const outPath = path.join(dir, 'output.json')
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2))
}

// Assumes:
// - max 100 schedule or override entries
// - overrides do not extend beyond the start or end of the schedule
// - dates have an explicit timezone
// Time complexity: O(n**2) and could be optimized to O(n) if the entries are sorted by start time, O(nlog(n)) otherwise
export function buildActualShifts(
    scheduleEntries: ScheduleEntry[],
    overrides: ScheduleEntry[]
): ScheduleEntry[] {
    assertContiguousSchedule(scheduleEntries)
    assertNoOverlap(overrides)

    let actualShifts: ScheduleEntry[] = scheduleEntries.slice()
    for (const override of overrides) {
        actualShifts = applySingleOverride(actualShifts, override)
    }
    actualShifts = mergeAdjacentSameUserEntries(actualShifts)
    return actualShifts
}

function assertNoOverlap(sorted: ScheduleEntry[]): void {
    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i]
        const next = sorted[i + 1]
        if (current.end_at.getTime() > next.start_at.getTime()) {
            throw new Error(
                `Schedule has overlapping entries between ${current.end_at.toISOString()} and ${next.start_at.toISOString()}`
            )
        }
    }
}

function assertContiguousSchedule(sorted: ScheduleEntry[]): void {
    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i]
        const next = sorted[i + 1]
        if (current.end_at.getTime() !== next.start_at.getTime()) {
            throw new Error(
                `Schedule is not contiguous between ${current.end_at.toISOString()} and ${next.start_at.toISOString()}`
            )
        }
    }
}

function applySingleOverride(scheduleEntries: ScheduleEntry[], override: ScheduleEntry): ScheduleEntry[] {
    const output: ScheduleEntry[] = []
    const overrideStart = override.start_at.getTime()
    const overrideEnd = override.end_at.getTime()
    for (const scheduleEntry of scheduleEntries) {
        const scheduledStart = scheduleEntry.start_at.getTime()
        const scheduledEnd = scheduleEntry.end_at.getTime()

        const hasOverlap = scheduledStart < overrideEnd && scheduledEnd > overrideStart
        if (!hasOverlap) {
            output.push(scheduleEntry)
            continue
        }

        // Split into up to three segments: leftEntry / middleEntry(override) / rightEntry
        if (scheduledStart < overrideStart) {
            const leftEntry = {
                user_id: scheduleEntry.user_id,
                start_at: new Date(scheduledStart),
                end_at: new Date(overrideStart),
            }
            output.push(leftEntry)
        }
        const middleStart = Math.max(scheduledStart, overrideStart)
        const middleEnd = Math.min(scheduledEnd, overrideEnd)
        const middleEntry = {
            user_id: override.user_id,
            start_at: new Date(middleStart),
            end_at: new Date(middleEnd),
        }
        output.push(middleEntry)
        if (overrideEnd < scheduledEnd) {
            const rightEntry = {
                user_id: scheduleEntry.user_id,
                start_at: new Date(overrideEnd),
                end_at: new Date(scheduledEnd),
            }
            output.push(rightEntry)
        }
    }
    return output
}

function mergeAdjacentSameUserEntries(scheduleEntries: ScheduleEntry[]): ScheduleEntry[] {
    if (scheduleEntries.length <= 1) return scheduleEntries.slice()
    const merged: ScheduleEntry[] = []
    for (const scheduleEntry of scheduleEntries) {
        if (merged.length === 0) {
            merged.push(scheduleEntry)
            continue
        }
        const last = merged[merged.length - 1]
        if (last.user_id === scheduleEntry.user_id) {
            last.end_at = new Date(scheduleEntry.end_at.getTime())
        } else {
            merged.push(scheduleEntry)
        }
    }
    return merged
}
