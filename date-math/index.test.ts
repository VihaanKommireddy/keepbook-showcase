/**
 * Exhaustive tests for the pure date-math module (ACCEPTANCE-TESTS §1,
 * AT-001..AT-012, AT-014, AT-015). Anti-bug-class tests are named for the bug
 * they kill. 100% branch coverage is enforced by the root vitest config.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  addBusinessDays,
  addDays,
  addHours,
  addMonthsClamped,
  age,
  dayOfWeek,
  daysInMonth,
  diffDays,
  isBusinessDay,
  isLeapYear,
  isValidISODate,
  isWithinDays,
  monthKey,
  nextAnniversary,
  nextBirthday,
  nextBusinessDayOnOrAfter,
  scheduleSequenceSteps,
  type BusinessDayConfig,
} from './index.js';

/** Default business-day config (BDC): Mon–Fri + the holidays the ATs rely on. */
const BDC: BusinessDayConfig = {
  workDays: [1, 2, 3, 4, 5],
  holidays: ['2026-09-07', '2026-11-26', '2026-12-25', '2027-01-01'],
};

describe('parsing & validation', () => {
  it('rejects malformed and impossible dates', () => {
    expect(() => addDays('2026-8-15', 1)).toThrow(/Invalid ISO date/); // unpadded
    expect(() => addDays('not-a-date', 1)).toThrow(/Invalid ISO date/);
    expect(() => addDays('2026-00-15', 1)).toThrow(/month out of range/);
    expect(() => addDays('2026-13-01', 1)).toThrow(/month out of range/);
    expect(() => addDays('2026-01-00', 1)).toThrow(/day out of range/);
    expect(() => addDays('2026-02-30', 1)).toThrow(/day out of range/);
    expect(() => addDays('2027-02-29', 1)).toThrow(/day out of range/); // non-leap
  });

  it('isValidISODate mirrors the parser', () => {
    expect(isValidISODate('2028-02-29')).toBe(true); // leap day
    expect(isValidISODate('2027-02-29')).toBe(false);
    expect(isValidISODate('junk')).toBe(false);
  });

  it('rejects non-integer offsets', () => {
    expect(() => addDays('2026-08-15', 1.5)).toThrow(/must be an integer/);
    expect(() => addBusinessDays('2026-08-13', 0.5, BDC)).toThrow(/must be an integer/);
    expect(() => addMonthsClamped('2026-08-15', 1.1)).toThrow(/must be an integer/);
    expect(() => isWithinDays('2026-08-16', '2026-08-15', 1.5)).toThrow(/must be an integer/);
  });

  it('isLeapYear covers all Gregorian rule branches', () => {
    expect(isLeapYear(2024)).toBe(true); // div 4
    expect(isLeapYear(1900)).toBe(false); // div 100, not 400
    expect(isLeapYear(2000)).toBe(true); // div 400
    expect(isLeapYear(2027)).toBe(false); // not div 4
  });

  it('daysInMonth is leap-aware and validates the month', () => {
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2027, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
    expect(() => daysInMonth(2026, 0)).toThrow(/Invalid month/);
    expect(() => daysInMonth(2026, 13)).toThrow(/Invalid month/);
  });
});

describe('AT-001 addDays: month-end crossings exact', () => {
  it('crosses month ends in both directions', () => {
    expect(addDays('2027-01-31', 1)).toBe('2027-02-01');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
  });
});

describe('AT-002 year-end crossings exact', () => {
  it('crosses the year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });
  it('business day from Thu Dec 31 skips New Year holiday + weekend', () => {
    expect(addBusinessDays('2026-12-31', 1, BDC)).toBe('2027-01-04');
  });
});

describe('AT-003 leap day never crashes or skips', () => {
  it('addDays around Feb 28/29', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29'); // leap year
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01'); // non-leap
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
  });
  it('addMonthsClamped: Jan 31 + 1mo clamps to end of February', () => {
    expect(addMonthsClamped('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonthsClamped('2027-01-31', 1)).toBe('2027-02-28');
  });
  it('Feb-29 birthday clamps to Feb 28 in non-leap years (documented policy)', () => {
    expect(nextBirthday('2000-02-29', '2027-01-01')).toBe('2027-02-28');
    expect(nextBirthday('2000-02-29', '2028-01-01')).toBe('2028-02-29'); // real day in leap years
  });
});

describe('AT-004 DST irrelevance', () => {
  it('spring-forward and fall-back dates are exactly 2 days apart, both directions', () => {
    expect(diffDays('2027-03-13', '2027-03-15')).toBe(2);
    expect(diffDays('2027-03-15', '2027-03-13')).toBe(-2);
    expect(addDays('2027-03-13', 2)).toBe('2027-03-15');
    expect(diffDays('2027-11-06', '2027-11-08')).toBe(2);
    expect(addDays('2027-11-08', -2)).toBe('2027-11-06');
  });
  it('proof: module source contains no Date construction and no timezone API', () => {
    const source = readFileSync(fileURLToPath(new URL('./index.ts', import.meta.url)), 'utf8');
    expect(source).not.toMatch(/new Date\(/);
    expect(source).not.toMatch(/Date\.now/);
    expect(source).not.toMatch(/Intl\./);
    expect(source).not.toMatch(/getTimezoneOffset/);
    expect(source).not.toMatch(/toLocale/);
  });
});

describe('AT-005 the named anti-bug-class test: never Mon/Mon/Mon', () => {
  it('addBusinessDays from a Thursday lands Fri, Mon, Tue — three distinct days', () => {
    expect(addBusinessDays('2026-08-13', 1, BDC)).toBe('2026-08-14'); // Fri
    expect(addBusinessDays('2026-08-13', 2, BDC)).toBe('2026-08-17'); // Mon
    expect(addBusinessDays('2026-08-13', 3, BDC)).toBe('2026-08-18'); // Tue
  });
});

describe('AT-006 scheduleSequenceSteps: the Sat+Sun+Mon collapse is impossible', () => {
  it('+1/+2/+3 business days from a Friday = Mon/Tue/Wed, strictly increasing', () => {
    const due = scheduleSequenceSteps(
      '2026-08-14', // a Friday — raw calendar dates would land Sat/Sun/Mon
      [
        { offsetDays: 1, businessDaysOnly: true },
        { offsetDays: 2, businessDaysOnly: true },
        { offsetDays: 3, businessDaysOnly: true },
      ],
      BDC,
    );
    expect(due).toEqual(['2026-08-17', '2026-08-18', '2026-08-19']);
    expect(new Set(due).size).toBe(3); // distinct
    expect([...due].sort()).toEqual(due); // strictly increasing
    for (const d of due) expect(isBusinessDay(d, BDC)).toBe(true);
  });
});

describe('AT-007 holiday + weekend both skipped, steps still distinct', () => {
  it('Friday before Labor Day: +1/+2 business days = Tue/Wed', () => {
    const due = scheduleSequenceSteps(
      '2026-09-04',
      [
        { offsetDays: 1, businessDaysOnly: true },
        { offsetDays: 2, businessDaysOnly: true },
      ],
      BDC,
    );
    expect(due).toEqual(['2026-09-08', '2026-09-09']);
  });
});

describe('AT-008 mixed calendar/business steps across the year boundary', () => {
  it('each step lands on its own date; calendar steps ignore weekends', () => {
    const due = scheduleSequenceSteps(
      '2026-12-24', // Thursday; Dec 25 + Jan 1 are holidays
      [
        { offsetDays: 0, businessDaysOnly: false },
        { offsetDays: 1, businessDaysOnly: true },
        { offsetDays: 5, businessDaysOnly: false },
        { offsetDays: 5, businessDaysOnly: true },
      ],
      BDC,
    );
    expect(due).toEqual(['2026-12-24', '2026-12-28', '2026-12-29', '2027-01-04']);
    expect(new Set(due).size).toBe(4); // no two distinct-raw-date steps coincide
  });
  it('offset 0 businessDaysOnly on a weekend anchor rolls forward once', () => {
    expect(
      scheduleSequenceSteps('2026-08-15', [{ offsetDays: 0, businessDaysOnly: true }], BDC),
    ).toEqual(['2026-08-17']); // Sat → Mon
  });
  it('empty step list yields an empty schedule', () => {
    expect(scheduleSequenceSteps('2026-08-14', [], BDC)).toEqual([]);
  });
});

describe('DATE-1 weekend/holiday anchors: offsets 0 and 1 must NOT collapse', () => {
  const bdOffsets = (offs: number[]) =>
    offs.map((offsetDays) => ({ offsetDays, businessDaysOnly: true }));

  const assertStrictlyIncreasingBusinessDays = (due: string[]) => {
    expect(new Set(due).size).toBe(due.length); // all distinct
    for (let i = 1; i < due.length; i += 1) {
      expect(diffDays(due[i - 1] as string, due[i] as string)).toBeGreaterThan(0); // strictly increasing
    }
    for (const d of due) expect(isBusinessDay(d, BDC)).toBe(true);
  };

  it('Saturday anchor → Mon/Tue/Wed/Thu for offsets [0,1,2,3] (was Mon/Mon/Tue/Wed)', () => {
    const due = scheduleSequenceSteps('2026-08-15', bdOffsets([0, 1, 2, 3]), BDC); // Sat
    expect(due).toEqual(['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20']);
    assertStrictlyIncreasingBusinessDays(due);
  });

  it('Sunday anchor → Mon/Tue/Wed/Thu for offsets [0,1,2,3]', () => {
    const due = scheduleSequenceSteps('2026-08-16', bdOffsets([0, 1, 2, 3]), BDC); // Sun
    expect(due).toEqual(['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20']);
    assertStrictlyIncreasingBusinessDays(due);
  });

  it('holiday anchor (Labor Day Mon 2026-09-07) → Tue/Wed/Thu/Fri for offsets [0,1,2,3]', () => {
    const due = scheduleSequenceSteps('2026-09-07', bdOffsets([0, 1, 2, 3]), BDC); // holiday
    expect(due).toEqual(['2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11']);
    assertStrictlyIncreasingBusinessDays(due);
  });

  it('holiday+weekend combo anchor (Fri 2026-12-25 holiday) → Mon/Tue/Wed for offsets [0,1,2]', () => {
    // Dec 25 (holiday) → rolls to Mon Dec 28, then distinct business days after.
    const due = scheduleSequenceSteps('2026-12-25', bdOffsets([0, 1, 2]), BDC);
    expect(due).toEqual(['2026-12-28', '2026-12-29', '2026-12-30']);
    assertStrictlyIncreasingBusinessDays(due);
  });

  it('the exact defect-doc repro: Sat anchor, offsets [0,1] no longer both land on Mon', () => {
    const due = scheduleSequenceSteps('2026-08-15', bdOffsets([0, 1]), BDC);
    expect(due).toEqual(['2026-08-17', '2026-08-18']); // was ['2026-08-17','2026-08-17']
    expect(due[0]).not.toBe(due[1]);
  });

  it('Friday-anchor behavior is preserved: [0,1,2,3] → Fri/Mon/Tue/Wed', () => {
    const due = scheduleSequenceSteps('2026-08-14', bdOffsets([0, 1, 2, 3]), BDC); // Fri
    expect(due).toEqual(['2026-08-14', '2026-08-17', '2026-08-18', '2026-08-19']);
    assertStrictlyIncreasingBusinessDays(due);
  });

  it('the seeded default sequence offsets [0,1,3] from a Sat anchor stay distinct', () => {
    // 'New lead follow-up' ships BD steps at offsets 0,1,3 (pos4 is calendar).
    const due = scheduleSequenceSteps('2026-08-15', bdOffsets([0, 1, 3]), BDC);
    expect(due).toEqual(['2026-08-17', '2026-08-18', '2026-08-20']);
    assertStrictlyIncreasingBusinessDays(due);
  });
});

describe('AT-009 policy-term month clamps, both directions', () => {
  it('clamps 1-, 6- and 12-month arithmetic', () => {
    expect(addMonthsClamped('2026-05-31', 1)).toBe('2026-06-30');
    expect(addMonthsClamped('2026-08-31', 6)).toBe('2027-02-28');
    expect(addMonthsClamped('2026-08-31', -6)).toBe('2026-02-28');
    expect(addMonthsClamped('2026-08-15', 12)).toBe('2027-08-15');
    expect(addMonthsClamped('2026-01-15', -2)).toBe('2025-11-15'); // backward year crossing
    expect(addMonthsClamped('2026-03-31', -1)).toBe('2026-02-28'); // backward clamp
  });
});

describe('AT-010 birthday boundary exact (feeds the age-65 rule)', () => {
  it('nextBirthday on-or-after semantics', () => {
    expect(nextBirthday('1961-08-20', '2026-08-15')).toBe('2026-08-20');
    expect(nextBirthday('1961-08-20', '2026-08-21')).toBe('2027-08-20');
    expect(nextBirthday('1961-08-20', '2026-08-20')).toBe('2026-08-20'); // today IS the birthday
  });
  it('age is boundary-exact', () => {
    expect(age('1961-08-20', '2026-08-19')).toBe(64);
    expect(age('1961-08-20', '2026-08-20')).toBe(65);
    expect(age('1961-08-20', '2026-07-01')).toBe(64); // earlier month branch
    expect(age('1961-08-20', '2026-09-01')).toBe(65); // later month branch
    expect(age('2000-02-29', '2027-02-28')).toBe(27); // clamp rule: Feb 28 counts in non-leap years
    expect(age('2000-02-29', '2027-02-27')).toBe(26);
  });
  it('nextAnniversary uses the same on-or-after + clamp rules', () => {
    expect(nextAnniversary('2020-06-01', '2026-08-15')).toBe('2027-06-01');
    expect(nextAnniversary('2020-09-01', '2026-08-15')).toBe('2026-09-01');
  });
});

describe('AT-011 window boundaries inclusive at the edge', () => {
  it('isWithinDays: exactly N days out is within; N+1 is not; past dates are not', () => {
    expect(isWithinDays('2026-12-13', '2026-08-15', 120)).toBe(true);
    expect(isWithinDays('2026-12-14', '2026-08-15', 120)).toBe(false);
    expect(isWithinDays('2026-08-15', '2026-08-15', 0)).toBe(true); // today is within
    expect(isWithinDays('2026-08-14', '2026-08-15', 120)).toBe(false); // past
  });
  it('monthKey buckets to YYYY-MM', () => {
    expect(monthKey('2026-08-15')).toBe('2026-08');
    expect(() => monthKey('2026-8-15')).toThrow(/Invalid ISO date/);
  });
});

describe('AT-012 purity & determinism', () => {
  it('every exported function returns identical output for identical input', () => {
    expect(addDays('2026-08-15', 30)).toBe(addDays('2026-08-15', 30));
    expect(diffDays('2026-01-01', '2026-12-31')).toBe(diffDays('2026-01-01', '2026-12-31'));
    expect(addBusinessDays('2026-08-13', 3, BDC)).toBe(addBusinessDays('2026-08-13', 3, BDC));
    expect(nextBusinessDayOnOrAfter('2026-08-15', BDC)).toBe(
      nextBusinessDayOnOrAfter('2026-08-15', BDC),
    );
    expect(addMonthsClamped('2026-01-31', 1)).toBe(addMonthsClamped('2026-01-31', 1));
    expect(age('1961-08-20', '2026-08-15')).toBe(age('1961-08-20', '2026-08-15'));
    expect(nextBirthday('1961-08-20', '2026-08-15')).toBe(nextBirthday('1961-08-20', '2026-08-15'));
    expect(nextAnniversary('2020-06-01', '2026-08-15')).toBe(
      nextAnniversary('2020-06-01', '2026-08-15'),
    );
    expect(monthKey('2026-08-15')).toBe(monthKey('2026-08-15'));
    expect(isWithinDays('2026-09-01', '2026-08-15', 30)).toBe(
      isWithinDays('2026-09-01', '2026-08-15', 30),
    );
    expect(
      scheduleSequenceSteps('2026-08-14', [{ offsetDays: 2, businessDaysOnly: true }], BDC),
    ).toEqual(scheduleSequenceSteps('2026-08-14', [{ offsetDays: 2, businessDaysOnly: true }], BDC));
  });
});

describe('AT-014 isBusinessDay / nextBusinessDayOnOrAfter', () => {
  it('Saturday, Sunday, holiday, Wednesday', () => {
    expect(isBusinessDay('2026-08-15', BDC)).toBe(false); // Sat
    expect(isBusinessDay('2026-08-16', BDC)).toBe(false); // Sun
    expect(isBusinessDay('2026-09-07', BDC)).toBe(false); // Labor Day (a Monday)
    expect(isBusinessDay('2026-08-19', BDC)).toBe(true); // Wed
  });
  it('rolls each to the correct business day', () => {
    expect(nextBusinessDayOnOrAfter('2026-08-15', BDC)).toBe('2026-08-17'); // Sat → Mon
    expect(nextBusinessDayOnOrAfter('2026-08-16', BDC)).toBe('2026-08-17'); // Sun → Mon
    expect(nextBusinessDayOnOrAfter('2026-09-07', BDC)).toBe('2026-09-08'); // holiday → Tue
    expect(nextBusinessDayOnOrAfter('2026-08-19', BDC)).toBe('2026-08-19'); // Wed → same Wed
  });
});

describe('AT-015 diffDays sign convention + property test', () => {
  it('documented sign: diffDays(a, b) counts from a to b', () => {
    expect(diffDays('2026-08-15', '2026-08-16')).toBe(1);
    expect(diffDays('2026-08-16', '2026-08-15')).toBe(-1);
    expect(diffDays('2026-08-15', '2026-08-15')).toBe(0);
  });
  it('property: diffDays(a, addDays(a, n)) === n for n in −1000..1000', () => {
    const a = '2026-08-15';
    for (let n = -1000; n <= 1000; n += 1) {
      expect(diffDays(a, addDays(a, n))).toBe(n);
    }
  });
});

describe('remaining branch coverage', () => {
  it('dayOfWeek across epochs, including pre-1970 dates', () => {
    expect(dayOfWeek('1970-01-01')).toBe(4); // Thursday
    expect(dayOfWeek('1961-08-20')).toBe(0); // Sunday, negative epoch days
    expect(dayOfWeek('2026-08-15')).toBe(6); // Saturday
    expect(dayOfWeek('2026-02-01')).toBe(0); // Jan/Feb month-mapping branch
    expect(dayOfWeek('2000-02-29')).toBe(2); // Tuesday, leap century
  });
  it('addBusinessDays: zero and negative offsets', () => {
    expect(addBusinessDays('2026-08-15', 0, BDC)).toBe('2026-08-15'); // unchanged, even on a Saturday
    expect(addBusinessDays('2026-08-17', -1, BDC)).toBe('2026-08-14'); // Mon → Fri, backward over weekend
    expect(addBusinessDays('2027-01-04', -1, BDC)).toBe('2026-12-31'); // backward over holiday + weekend
  });
  it('empty workDays config throws instead of looping forever', () => {
    const dead: BusinessDayConfig = { workDays: [], holidays: [] };
    expect(() => addBusinessDays('2026-08-13', 1, dead)).toThrow(/workDays/);
    expect(() => nextBusinessDayOnOrAfter('2026-08-13', dead)).toThrow(/workDays/);
  });
  it('custom work weeks are honored (Tue–Sat shop)', () => {
    const tueSat: BusinessDayConfig = { workDays: [2, 3, 4, 5, 6], holidays: [] };
    expect(isBusinessDay('2026-08-15', tueSat)).toBe(true); // Saturday works here
    expect(isBusinessDay('2026-08-17', tueSat)).toBe(false); // Monday off
    expect(addBusinessDays('2026-08-14', 2, tueSat)).toBe('2026-08-18'); // Fri → Sat, Tue
  });
});

describe('addHours (ISO datetime arithmetic for Autopilot holds)', () => {
  it('adds within a day', () => {
    expect(addHours('2026-09-08T09:15:30Z', 2)).toBe('2026-09-08T11:15:30Z');
  });
  it('rolls over midnight, month end, and leap day', () => {
    expect(addHours('2026-09-08T23:00:00Z', 24)).toBe('2026-09-09T23:00:00Z');
    expect(addHours('2026-09-30T20:00:00Z', 5)).toBe('2026-10-01T01:00:00Z');
    expect(addHours('2028-02-28T23:00:00Z', 1)).toBe('2028-02-29T00:00:00Z');
  });
  it('zero is identity; negative walks back across a day boundary', () => {
    expect(addHours('2026-09-08T00:30:00Z', 0)).toBe('2026-09-08T00:30:00Z');
    expect(addHours('2026-09-08T00:30:00Z', -1)).toBe('2026-09-07T23:30:00Z');
  });
  it('rejects bad input', () => {
    expect(() => addHours('2026-09-08', 1)).toThrow(RangeError);
    // assertInt (shared with addBusinessDays et al.) throws a plain Error, not
    // RangeError — matching that existing style rather than special-casing here.
    expect(() => addHours('2026-09-08T09:00:00Z', 1.5)).toThrow();
  });
});
