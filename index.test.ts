import { buildActualShifts as buildScheduleEntries, ScheduleEntry } from './index'

function expectUnorderedEntries(
  result: ScheduleEntry[],
  expected: ScheduleEntry[]
) {
  expect(result).toHaveLength(expected.length)
  expect(result).toEqual(expect.arrayContaining(expected))
}

describe('Schedule entries do not overlap', () => {
    test('should throw error for overlapping schedule entries', () => {
        const overlappingSchedule: ScheduleEntry[] = [
            {
                user_id: '1',
                start_at: new Date('2024-01-01T09:00:00.000Z'),
                end_at: new Date('2024-01-01T17:00:00.000Z'),
            },
            {
                user_id: '2',
                start_at: new Date('2024-01-01T16:00:00.000Z'),
                end_at: new Date('2024-01-01T20:00:00.000Z'),
            },
        ]

        expect(() => buildScheduleEntries(overlappingSchedule, [])).toThrow()
    })

    test('should not throw error for non-overlapping schedule entries', () => {
        const nonOverlappingSchedule: ScheduleEntry[] = [
            {
                user_id: '1',
                start_at: new Date('2024-01-01T09:00:00.000Z'),
                end_at: new Date('2024-01-01T17:00:00.000Z'),
            },
            {
                user_id: '2',
                start_at: new Date('2024-01-01T17:00:00.000Z'),
                end_at: new Date('2024-01-01T20:00:00.000Z'),
            },
        ]

        expect(() => buildScheduleEntries(nonOverlappingSchedule, [])).not.toThrow()
    })
})

describe('No gaps in schedule', () => {
    test('should throw error for schedule with gaps', () => {
        const scheduleWithGaps: ScheduleEntry[] = [
            {
                user_id: '1',
                start_at: new Date('2024-01-01T09:00:00.000Z'),
                end_at: new Date('2024-01-01T17:00:00.000Z'),
            },
            {
                user_id: '2',
                start_at: new Date('2024-01-01T18:00:00.000Z'),
                end_at: new Date('2024-01-01T20:00:00.000Z'),
            },
        ]

        expect(() => buildScheduleEntries(scheduleWithGaps, [])).toThrow()
    })

    test('should not throw error for schedule without gaps', () => {
        const scheduleWithoutGaps: ScheduleEntry[] = [
            {
                user_id: '1',
                start_at: new Date('2024-01-01T09:00:00.000Z'),
                end_at: new Date('2024-01-01T17:00:00.000Z'),
            },
            {
                user_id: '2',
                start_at: new Date('2024-01-01T17:00:00.000Z'),
                end_at: new Date('2024-01-01T20:00:00.000Z'),
            },
        ]

        expect(() => buildScheduleEntries(scheduleWithoutGaps, [])).not.toThrow()
    })
})

describe('Override entries do not overlap', () => {
    test('should throw error for overlapping override entries', () => {
        const overlappingOverrides: ScheduleEntry[] = [
            {
                user_id: '1',
                start_at: new Date('2024-01-01T12:00:00.000Z'),
                end_at: new Date('2024-01-01T15:00:00.000Z'),
            },
            {
                user_id: '2',
                start_at: new Date('2024-01-01T14:00:00.000Z'),
                end_at: new Date('2024-01-01T17:00:00.000Z'),
            },
        ]

        const validSchedule: ScheduleEntry[] = [
            {
                user_id: '3',
                start_at: new Date('2024-01-01T09:00:00.000Z'),
                end_at: new Date('2024-01-01T20:00:00.000Z'),
            },
        ]

        expect(() =>
            buildScheduleEntries(validSchedule, overlappingOverrides)
        ).toThrow()
    })

    test('should not throw error for non-overlapping override entries', () => {
        const nonOverlappingOverrides: ScheduleEntry[] = [
            {
                user_id: '1',
                start_at: new Date('2024-01-01T12:00:00.000Z'),
                end_at: new Date('2024-01-01T15:00:00.000Z'),
            },
            {
                user_id: '2',
                start_at: new Date('2024-01-01T16:00:00.000Z'),
                end_at: new Date('2024-01-01T18:00:00.000Z'),
            },
        ]

        const validSchedule: ScheduleEntry[] = [
            {
                user_id: '3',
                start_at: new Date('2024-01-01T09:00:00.000Z'),
                end_at: new Date('2024-01-01T20:00:00.000Z'),
            },
        ]

        expect(() =>
            buildScheduleEntries(validSchedule, nonOverlappingOverrides)
        ).not.toThrow()
    })
})

describe('Flatten schedule and overrides', () => {
  test('override at the middle of the shift', () => {
    const scheduleEntries: ScheduleEntry[] = [
      {
        user_id: '1',
        start_at: new Date('2024-01-01T09:00:00.000Z'),
        end_at: new Date('2024-01-01T17:00:00.000Z'),
      },
    ]

    const overrideEntries: ScheduleEntry[] = [
      {
        user_id: '2',
        start_at: new Date('2024-01-01T12:00:00.000Z'),
        end_at: new Date('2024-01-01T14:00:00.000Z'),
      },
    ]

    const result = buildScheduleEntries(scheduleEntries, overrideEntries)

    expectUnorderedEntries(result, [
      {
        user_id: '1',
        start_at: new Date('2024-01-01T09:00:00.000Z'),
        end_at: new Date('2024-01-01T12:00:00.000Z'),
      },
      {
        user_id: '2',
        start_at: new Date('2024-01-01T12:00:00.000Z'),
        end_at: new Date('2024-01-01T14:00:00.000Z'),
      },
      {
        user_id: '1',
        start_at: new Date('2024-01-01T14:00:00.000Z'),
        end_at: new Date('2024-01-01T17:00:00.000Z'),
      },
    ])
  })

  test('override at the very start of the shift', () => {
    const scheduleEntries: ScheduleEntry[] = [
      {
        user_id: '1',
        start_at: new Date('2024-01-01T09:00:00.000Z'),
        end_at: new Date('2024-01-01T17:00:00.000Z'),
      },
    ]
    const overrides: ScheduleEntry[] = [
      {
        user_id: '2',
        start_at: new Date('2024-01-01T09:00:00.000Z'),
        end_at: new Date('2024-01-01T12:00:00.000Z'),
      },
    ]

    const result = buildScheduleEntries(scheduleEntries, overrides)

    expectUnorderedEntries(result, [
      {
        user_id: '2',
        start_at: new Date('2024-01-01T09:00:00.000Z'),
        end_at: new Date('2024-01-01T12:00:00.000Z'),
      },
      {
        user_id: '1',
        start_at: new Date('2024-01-01T12:00:00.000Z'),
        end_at: new Date('2024-01-01T17:00:00.000Z'),
      },
    ])
  })

  test('override at the very end of the shift', () => {
    const scheduleEntries: ScheduleEntry[] = [
      {
        user_id: '1',
        start_at: new Date('2024-01-01T09:00:00.000Z'),
        end_at: new Date('2024-01-01T17:00:00.000Z'),
      },
    ]
    const overrides: ScheduleEntry[] = [
      {
        user_id: '2',
        start_at: new Date('2024-01-01T15:00:00.000Z'),
        end_at: new Date('2024-01-01T17:00:00.000Z'),
      },
    ]

    const result = buildScheduleEntries(scheduleEntries, overrides)

    expectUnorderedEntries(result, [
      {
        user_id: '1',
        start_at: new Date('2024-01-01T09:00:00.000Z'),
        end_at: new Date('2024-01-01T15:00:00.000Z'),
      },
      {
        user_id: '2',
        start_at: new Date('2024-01-01T15:00:00.000Z'),
        end_at: new Date('2024-01-01T17:00:00.000Z'),
      },
    ])
  })

  test('override spanning a schedule boundary', () => {
    const scheduledShifts: ScheduleEntry[] = [
      {
        user_id: '1',
        start_at: new Date('2024-01-01T09:00:00.000Z'),
        end_at: new Date('2024-01-01T12:00:00.000Z'),
      },
      {
        user_id: '2',
        start_at: new Date('2024-01-01T12:00:00.000Z'),
        end_at: new Date('2024-01-01T17:00:00.000Z'),
      },
    ]
    const overrides: ScheduleEntry[] = [
      {
        user_id: '3',
        start_at: new Date('2024-01-01T11:00:00.000Z'),
        end_at: new Date('2024-01-01T13:00:00.000Z'),
      },
    ]

    const result = buildScheduleEntries(scheduledShifts, overrides)

    expectUnorderedEntries(result, [
      {
        user_id: '1',
        start_at: new Date('2024-01-01T09:00:00.000Z'),
        end_at: new Date('2024-01-01T11:00:00.000Z'),
      },
      {
        user_id: '3',
        start_at: new Date('2024-01-01T11:00:00.000Z'),
        end_at: new Date('2024-01-01T13:00:00.000Z'),
      },
      {
        user_id: '2',
        start_at: new Date('2024-01-01T13:00:00.000Z'),
        end_at: new Date('2024-01-01T17:00:00.000Z'),
      },
    ])
  })

  test('multiple non-adjacent overrides in one shift', () => {
    const scheduledShifts: ScheduleEntry[] = [
      {
        user_id: '1',
        start_at: new Date('2024-01-01T09:00:00.000Z'),
        end_at: new Date('2024-01-01T17:00:00.000Z'),
      },
    ]
    const overrides: ScheduleEntry[] = [
      {
        user_id: '2',
        start_at: new Date('2024-01-01T10:00:00.000Z'),
        end_at: new Date('2024-01-01T11:00:00.000Z'),
      },
      {
        user_id: '3',
        start_at: new Date('2024-01-01T13:00:00.000Z'),
        end_at: new Date('2024-01-01T14:00:00.000Z'),
      },
    ]

    const result = buildScheduleEntries(scheduledShifts, overrides)

    expectUnorderedEntries(result, [
      {
        user_id: '1',
        start_at: new Date('2024-01-01T09:00:00.000Z'),
        end_at: new Date('2024-01-01T10:00:00.000Z'),
      },
      {
        user_id: '2',
        start_at: new Date('2024-01-01T10:00:00.000Z'),
        end_at: new Date('2024-01-01T11:00:00.000Z'),
      },
      {
        user_id: '1',
        start_at: new Date('2024-01-01T11:00:00.000Z'),
        end_at: new Date('2024-01-01T13:00:00.000Z'),
      },
      {
        user_id: '3',
        start_at: new Date('2024-01-01T13:00:00.000Z'),
        end_at: new Date('2024-01-01T14:00:00.000Z'),
      },
      {
        user_id: '1',
        start_at: new Date('2024-01-01T14:00:00.000Z'),
        end_at: new Date('2024-01-01T17:00:00.000Z'),
      },
    ])
  })
})
