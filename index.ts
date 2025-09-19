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

export const runScript = () => {
    const scheduleData: ScheduleData = loadData("input.json")

    const processedSchedule = processSchedule(scheduleData.schedule_entries, scheduleData.override_entries)

    writeOutputJson(processedSchedule)
}

// loadData reads the JSON data from the specified input file and parses
// it into a ScheduleData object.
function loadData(inputFile: string): ScheduleData {
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'))

    for (let scheduleEntry of data.schedule_entries) {
        scheduleEntry.start_at = parseJSON(scheduleEntry.start_at)
        scheduleEntry.end_at = parseJSON(scheduleEntry.end_at)
    }

    for (let scheduleEntry of data.override_entries) {
        scheduleEntry.start_at = parseJSON(scheduleEntry.start_at)
        scheduleEntry.end_at = parseJSON(scheduleEntry.end_at)
    }

    return data
}

// writeOutputJson writes the processed schedule entries to a JSON file named "output.json".
function writeOutputJson(schedule: ScheduleEntry[]): void {
    const output = {
        entries: schedule
    }
    fs.writeFileSync('output.json', JSON.stringify(output, null, 2))
}


export function processSchedule(schedule: ScheduleEntry[], overrides: ScheduleEntry[]): ScheduleEntry[] {
	// TODO: Implement the logic to validate and calculate the actual on-call schedule!

	return []
}
