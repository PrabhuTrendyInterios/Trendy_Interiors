const { buildCalendarInvite } = require('../../utils/calendarInvite');

// Helper: buildCalendarInvite returns a Buffer; convert to string for assertions
const ics = (data) => buildCalendarInvite(data).toString('utf-8');
const icsCtx = (data, ctx) => buildCalendarInvite(data, ctx).toString('utf-8');

describe('server/utils/calendarInvite — buildCalendarInvite', () => {
  test('returns a Buffer containing VCALENDAR', () => {
    const result = buildCalendarInvite({ name: 'Alice', email: 'a@b.com', preferredDate: '2026-12-01', preferredTime: '10:00 am' });
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.toString()).toContain('BEGIN:VCALENDAR');
    expect(result.toString()).toContain('END:VCALENDAR');
  });

  test('uses default time (10:00 UTC) when preferredTime is invalid', () => {
    const result = ics({ name: 'Bob', email: 'b@b.com', preferredDate: '2026-11-15', preferredTime: 'not-a-time' });
    expect(result).toContain('DTSTART:20261115T100000Z');
  });

  test('uses default time when preferredTime is empty string', () => {
    const result = ics({ name: 'Bob', email: 'b@b.com', preferredDate: '2026-11-15', preferredTime: '' });
    expect(result).toContain('DTSTART:20261115T100000Z');
  });

  test('falls back gracefully when preferredDate is null (omits DTSTART)', () => {
    const result = ics({ name: 'Carol', email: 'c@c.com', preferredDate: null });
    expect(result).toContain('BEGIN:VCALENDAR');
    expect(result).not.toContain('DTSTART:');
  });

  test('falls back gracefully when preferredDate is an invalid string', () => {
    const result = ics({ name: 'Dave', email: 'd@d.com', preferredDate: 'not-a-date' });
    expect(result).toContain('BEGIN:VCALENDAR');
    expect(result).not.toContain('DTSTART:');
  });

  test('handles PM time correctly', () => {
    const result = ics({ name: 'Eve', email: 'e@e.com', preferredDate: '2026-10-20', preferredTime: '3:30 pm' });
    expect(result).toContain('DTSTART:20261020T153000Z');
  });

  test('includes meeting title with projectType when provided', () => {
    expect(ics({ projectType: 'Bedroom Interiors', name: 'X', email: 'x@x.com' })).toContain('Bedroom Interiors');
  });

  test('uses generic title when projectType is absent', () => {
    expect(ics({ name: 'X', email: 'x@x.com' })).toContain('TrendyInterios Meeting Request');
  });

  test('uses company address in LOCATION when provided', () => {
    expect(icsCtx({ name: 'X', email: 'x@x.com' }, { address: '42 Design Street\\, Chennai' })).toContain('42 Design Street');
  });

  test('ISO date string path produces correct DTSTART', () => {
    expect(ics({ name: 'F', email: 'f@f.com', preferredDate: '2027-03-05', preferredTime: '9 am' })).toContain('DTSTART:20270305T090000Z');
  });
});
