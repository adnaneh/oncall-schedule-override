import { processSchedule, ScheduleEntry } from './index';


// Test for requirement 1: Check that schedule entries do not overlap
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
                start_at: new Date('2024-01-01T16:00:00.000Z'), // Overlaps with previous entry
                end_at: new Date('2024-01-01T20:00:00.000Z'),
            },
        ];

        expect(() => processSchedule(overlappingSchedule, [])).toThrow();
    });

    test('should not throw error for non-overlapping schedule entries', () => {
        const nonOverlappingSchedule: ScheduleEntry[] = [
            {
                user_id: '1',
                start_at: new Date('2024-01-01T09:00:00.000Z'),
                end_at: new Date('2024-01-01T17:00:00.000Z'),
            },
            {
                user_id: '2',
                start_at: new Date('2024-01-01T17:00:00.000Z'), // Starts when previous ends
                end_at: new Date('2024-01-01T20:00:00.000Z'),
            },
        ];

        expect(() => processSchedule(nonOverlappingSchedule, [])).not.toThrow();
    });
});

// Test for requirement 2: Check that there are no gaps in the schedule
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
                start_at: new Date('2024-01-01T18:00:00.000Z'), // 1 hour gap
                end_at: new Date('2024-01-01T20:00:00.000Z'),
            },
        ];

        expect(() => processSchedule(scheduleWithGaps, [])).toThrow();
    });

    test('should not throw error for schedule without gaps', () => {
        const scheduleWithoutGaps: ScheduleEntry[] = [
            {
                user_id: '1',
                start_at: new Date('2024-01-01T09:00:00.000Z'),
                end_at: new Date('2024-01-01T17:00:00.000Z'),
            },
            {
                user_id: '2',
                start_at: new Date('2024-01-01T17:00:00.000Z'), // No gap
                end_at: new Date('2024-01-01T20:00:00.000Z'),
            },
        ];

        expect(() => processSchedule(scheduleWithoutGaps, [])).not.toThrow();
    });
});

// Test for requirement 3: Check that override entries do not overlap
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
                start_at: new Date('2024-01-01T14:00:00.000Z'), // Overlaps with previous
                end_at: new Date('2024-01-01T17:00:00.000Z'),
            },
        ];

        const validSchedule: ScheduleEntry[] = [
            {
                user_id: '3',
                start_at: new Date('2024-01-01T09:00:00.000Z'),
                end_at: new Date('2024-01-01T20:00:00.000Z'),
            },
        ];

        expect(() => processSchedule(validSchedule, overlappingOverrides)).toThrow();
    });

    test('should not throw error for non-overlapping override entries', () => {
        const nonOverlappingOverrides: ScheduleEntry[] = [
            {
                user_id: '1',
                start_at: new Date('2024-01-01T12:00:00.000Z'),
                end_at: new Date('2024-01-01T15:00:00.000Z'),
            },
            {
                user_id: '2',
                start_at: new Date('2024-01-01T16:00:00.000Z'), // No overlap
                end_at: new Date('2024-01-01T18:00:00.000Z'),
            },
        ];

        const validSchedule: ScheduleEntry[] = [
            {
                user_id: '3',
                start_at: new Date('2024-01-01T09:00:00.000Z'),
                end_at: new Date('2024-01-01T20:00:00.000Z'),
            },
        ];

        expect(() => processSchedule(validSchedule, nonOverlappingOverrides)).not.toThrow();
    });
});

// Test for requirement 4: Flatten schedule and overrides into single list
describe('Flatten schedule and overrides', () => {
    test('should correctly flatten schedule and overrides into single list', () => {
        const scheduleEntries: ScheduleEntry[] = [
            {
                user_id: '1',
                start_at: new Date('2024-01-01T09:00:00.000Z'),
                end_at: new Date('2024-01-01T17:00:00.000Z'),
            },
        ];

        const overrideEntries: ScheduleEntry[] = [
            {
                user_id: '2',
                start_at: new Date('2024-01-01T12:00:00.000Z'),
                end_at: new Date('2024-01-01T14:00:00.000Z'),
            },
        ];

        const result = processSchedule(scheduleEntries, overrideEntries);

        // Expected result: 3 entries
        // 1. User 1: 9:00-12:00 (original schedule before override)
        // 2. User 2: 12:00-14:00 (override period)
        // 3. User 1: 14:00-17:00 (original schedule after override)
        expect(result).toHaveLength(3);

        const expectedSlots = [
            { user_id: '1', start_at: new Date('2024-01-01T09:00:00.000Z'), end_at: new Date('2024-01-01T12:00:00.000Z') },
            { user_id: '2', start_at: new Date('2024-01-01T12:00:00.000Z'), end_at: new Date('2024-01-01T14:00:00.000Z') },
            { user_id: '1', start_at: new Date('2024-01-01T14:00:00.000Z'), end_at: new Date('2024-01-01T17:00:00.000Z') },
        ];

        // Check that each expected entry exists in the result
        expectedSlots.forEach(expected => {
            const found = result.find(entry => 
                entry.user_id === expected.user_id &&
                entry.start_at.getTime() === expected.start_at.getTime() &&
                entry.end_at.getTime() === expected.end_at.getTime()
            );
            
            if (!found) {
                // Build useful error message showing actual vs expected
                const actualEntries = result.map(entry => 
                    `User ${entry.user_id}: ${entry.start_at.toISOString()} → ${entry.end_at.toISOString()}`
                ).join('\n');
                
                const expectedEntry = `User ${expected.user_id}: ${expected.start_at.toISOString()} → ${expected.end_at.toISOString()}`;
                
                throw new Error(`Expected to find entry: ${expectedEntry}\n\nActual entries found:\n${actualEntries}`);
            }
        });
    });
});