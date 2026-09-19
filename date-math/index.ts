/**
 * THE pure date-math module (ARCHITECTURE §8).
 *
 * Every piece of date arithmetic in Keepbook lives here, and only here.
 * Rules:
 *  - Pure and explicit: every function takes `today` (and business-day config)
 *    as a parameter. No Date construction anywhere in this module — asserted
 *    by a unit test that greps this source (AT-004, AT-012).
 *  - ISO strings in, ISO strings out ('YYYY-MM-DD'). No Date objects in
 *    signatures. Deterministic, trivially testable.
 *  - All arithmetic is integer civil-calendar math (days-from-civil algorithm),
 *    so DST and timezones are structurally irrelevant.
 *
 * This module is how Keepbook kills AgencyZoom's documented Sat/Sun/Mon
 * triple-fire bug class (matrix 1b): business-day sequence steps are computed
 * with addBusinessDays from the anchor, so distinct offsets land on distinct
 * business days and can never collapse onto one Monday (AT-005..AT-008).
 */

/** 'YYYY-MM-DD', validated against the real calendar. */
export type ISODate = string;

/** Business-day configuration (API-CONTRACTS §1).
 *  workDays: days of week that count as working days, 0=Sunday .. 6=Saturday.
 *  holidays: ISO dates that are NOT business days even if on a work day. */
export interface BusinessDayConfig {
  workDays: number[];
  holidays: ISODate[];
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

interface Ymd {
  y: number;
  m: number; // 1-12
  d: number; // 1-31
}

/** Gregorian leap-year rule. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Days in a month (m: 1-12), leap-aware. */
export function daysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }
  return month === 2 && isLeapYear(year) ? 29 : (DAYS_IN_MONTH[month - 1] as number);
}

function parseYmd(date: string): Ymd {
  const m = ISO_DATE_RE.exec(date);
  if (m === null) {
    throw new Error(`Invalid ISO date: ${JSON.stringify(date)} (expected YYYY-MM-DD)`);
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12) {
    throw new Error(`Invalid ISO date: ${date} (month out of range)`);
  }
  if (d < 1 || d > daysInMonth(y, mo)) {
    throw new Error(`Invalid ISO date: ${date} (day out of range for month)`);
  }
  return { y, m: mo, d };
}

function formatYmd({ y, m, d }: Ymd): ISODate {
  const yy = String(y).padStart(4, '0');
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** True iff the string is a real calendar date in YYYY-MM-DD form.
 *  Used by the shared zod `isoDate` helper (API-CONTRACTS §0 house rules). */
export function isValidISODate(date: string): boolean {
  try {
    parseYmd(date);
    return true;
  } catch {
    return false;
  }
}

// Howard Hinnant's days-from-civil / civil-from-days algorithms.
// Epoch day 0 = 1970-01-01. Pure integer math — no Date, no timezones.
function toEpochDays({ y, m, d }: Ymd): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400; // 0..399
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1; // 0..365
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy; // 0..146096
  return era * 146097 + doe - 719468;
}

function fromEpochDays(days: number): Ymd {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097; // 0..146096
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  ); // 0..399
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100)); // 0..365
  const mp = Math.floor((5 * doy + 2) / 153); // 0..11
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1; // 1..31
  const m = mp < 10 ? mp + 3 : mp - 9; // 1..12
  return { y: m <= 2 ? y + 1 : y, m, d };
}

function assertInt(n: number, what: string): void {
  if (!Number.isInteger(n)) {
    throw new Error(`${what} must be an integer, got ${n}`);
  }
}

function assertWorkable(cfg: BusinessDayConfig): void {
  if (cfg.workDays.length === 0) {
    throw new Error('BusinessDayConfig.workDays must not be empty');
  }
}

/** Day of week for an ISO date: 0=Sunday .. 6=Saturday. */
export function dayOfWeek(date: ISODate): number {
  const e = toEpochDays(parseYmd(date));
  return (((e + 4) % 7) + 7) % 7; // 1970-01-01 was a Thursday (4)
}

/** Calendar-day addition. n may be negative. Month/year ends and leap days exact (AT-001..003). */
export function addDays(date: ISODate, n: number): ISODate {
  assertInt(n, 'n');
  return formatYmd(fromEpochDays(toEpochDays(parseYmd(date)) + n));
}

/** Signed day difference: diffDays(a, b) === number of days from a to b.
 *  Property: diffDays(a, addDays(a, n)) === n (AT-015). */
export function diffDays(a: ISODate, b: ISODate): number {
  return toEpochDays(parseYmd(b)) - toEpochDays(parseYmd(a));
}

/** True iff `date` falls on a configured work day and is not a listed holiday. */
export function isBusinessDay(date: ISODate, cfg: BusinessDayConfig): boolean {
  return cfg.workDays.includes(dayOfWeek(date)) && !cfg.holidays.includes(parseAndReformat(date));
}

// Normalizes so holiday membership can't be dodged by an unpadded input.
function parseAndReformat(date: ISODate): ISODate {
  return formatYmd(parseYmd(date));
}

/**
 * Add n business days. n=0 returns the input unchanged (even if it is not a
 * business day — callers that need a business day use nextBusinessDayOnOrAfter).
 * Negative n walks backward. Weekends AND configured holidays are skipped
 * (AT-002: Thu Dec 31 + 1 business day over a New Year's Day holiday = Mon Jan 4).
 */
export function addBusinessDays(date: ISODate, n: number, cfg: BusinessDayConfig): ISODate {
  assertInt(n, 'n');
  assertWorkable(cfg);
  let epoch = toEpochDays(parseYmd(date));
  const step = n >= 0 ? 1 : -1;
  let remaining = Math.abs(n);
  while (remaining > 0) {
    epoch += step;
    if (isBusinessDay(formatYmd(fromEpochDays(epoch)), cfg)) {
      remaining -= 1;
    }
  }
  return formatYmd(fromEpochDays(epoch));
}

/** Smallest business day >= date (AT-014: Sat→Mon, holiday→next working day, Wed→Wed). */
export function nextBusinessDayOnOrAfter(date: ISODate, cfg: BusinessDayConfig): ISODate {
  assertWorkable(cfg);
  let epoch = toEpochDays(parseYmd(date));
  while (!isBusinessDay(formatYmd(fromEpochDays(epoch)), cfg)) {
    epoch += 1;
  }
  return formatYmd(fromEpochDays(epoch));
}

/** Month addition with day-of-month clamping: Jan 31 + 1mo = Feb 28/29 (AT-003, AT-009).
 *  Works in both directions (negative n). */
export function addMonthsClamped(date: ISODate, n: number): ISODate {
  assertInt(n, 'n');
  const { y, m, d } = parseYmd(date);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12 + 1;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return formatYmd({ y: ny, m: nm, d: nd });
}

// Effective occurrence of a MM-DD anniversary within a given year, clamping
// Feb 29 to Feb 28 in non-leap years (the module's documented clamp rule, AT-003).
function occurrenceInYear(m: number, d: number, year: number): Ymd {
  return { y: year, m, d: Math.min(d, daysInMonth(year, m)) };
}

/** Age in whole years at `today` (AT-010: boundary-exact; feeds the age-65 rule).
 *  Feb-29 births are treated as Feb 28 in non-leap years (clamp rule). */
export function age(dob: ISODate, today: ISODate): number {
  const b = parseYmd(dob);
  const t = parseYmd(today);
  const eff = occurrenceInYear(b.m, b.d, t.y);
  let years = t.y - b.y;
  if (t.m < eff.m || (t.m === eff.m && t.d < eff.d)) {
    years -= 1;
  }
  return years;
}

function nextOccurrenceOnOrAfter(anchor: ISODate, today: ISODate): ISODate {
  const a = parseYmd(anchor);
  const t = parseYmd(today);
  const thisYear = occurrenceInYear(a.m, a.d, t.y);
  if (toEpochDays(thisYear) >= toEpochDays(t)) {
    return formatYmd(thisYear);
  }
  return formatYmd(occurrenceInYear(a.m, a.d, t.y + 1));
}

/** Next birthday on or after `today`. Feb-29 birthdays clamp to Feb 28 in
 *  non-leap years (AT-003: nextBirthday('2000-02-29','2027-01-01') = '2027-02-28'). */
export function nextBirthday(dob: ISODate, today: ISODate): ISODate {
  return nextOccurrenceOnOrAfter(dob, today);
}

/** Next anniversary of any anchor date, on or after `today`. Same clamp rule as birthdays. */
export function nextAnniversary(date: ISODate, today: ISODate): ISODate {
  return nextOccurrenceOnOrAfter(date, today);
}

/** 'YYYY-MM' bucket key (AT-011). */
export function monthKey(date: ISODate): string {
  return parseAndReformat(date).slice(0, 7);
}

/** True iff `date` is today or in the future AND at most `days` days away.
 *  Boundary inclusive: exactly `days` days out is within (AT-011). Past dates are not within. */
export function isWithinDays(date: ISODate, today: ISODate, days: number): boolean {
  assertInt(days, 'days');
  const diff = diffDays(today, date);
  return diff >= 0 && diff <= days;
}

export interface SequenceStepOffset {
  offsetDays: number;
  businessDaysOnly: boolean;
}

/**
 * Turn an anchor date + step offsets into due dates — THE anti-bug-class
 * function (AT-006/007/008, matrix 1b).
 *
 * Each step is computed independently from the ANCHOR (offsets are
 * anchor-relative, never prior-step-relative — DATA-MODEL sequence_steps):
 *  - calendar steps: addDays(anchor, offsetDays) — weekends/holidays irrelevant;
 *  - business-day steps: FIRST roll the anchor to the next business day
 *    on-or-after it (so a weekend/holiday anchor becomes its Monday), THEN
 *    count offsetDays business days from that rolled base.
 *
 * Rolling the anchor to a business day BEFORE counting is what makes distinct
 * business-day offsets land on distinct, strictly-increasing business days
 * regardless of the anchor's weekday. Doing it the other way round
 * (count-then-roll) collapses offset 0 and offset 1 onto the same Monday for
 * every weekend/holiday anchor — the AgencyZoom Sat/Sun/Mon pile-up (DATE-1).
 * With roll-first: from a Saturday, offsets +0/+1/+2/+3 = Mon/Tue/Wed/Thu; from
 * a Friday, +1/+2/+3 = Mon/Tue/Wed — never Mon/Mon/Mon. The collapse is
 * structurally impossible; distinct offsets can never share a due date
 * (AT-006 "never collapse" contract).
 */
export function scheduleSequenceSteps(
  anchor: ISODate,
  steps: SequenceStepOffset[],
  cfg: BusinessDayConfig,
): ISODate[] {
  return steps.map((step) => {
    if (step.businessDaysOnly) {
      const base = nextBusinessDayOnOrAfter(anchor, cfg);
      return addBusinessDays(base, step.offsetDays, cfg);
    }
    return addDays(anchor, step.offsetDays);
  });
}

const ISO_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/;

/**
 * Add whole hours to a 'YYYY-MM-DDTHH:MM:SSZ' instant (the nowIso() shape).
 * Pure epoch arithmetic — no Date object — so Renewal Autopilot's hold_until
 * math is deterministic and timezone-proof. Negative n walks backward.
 */
export function addHours(dateTime: string, hours: number): string {
  const m = ISO_DATETIME_RE.exec(dateTime);
  if (m === null) throw new RangeError(`Invalid ISO datetime: ${dateTime}`);
  assertInt(hours, 'hours');
  const days = toEpochDays(parseYmd(`${m[1]}-${m[2]}-${m[3]}`));
  const total =
    days * 86_400 + Number(m[4]) * 3600 + Number(m[5]) * 60 + Number(m[6]) + hours * 3600;
  const outDays = Math.floor(total / 86_400);
  const rem = total - outDays * 86_400;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${formatYmd(fromEpochDays(outDays))}T${pad(Math.floor(rem / 3600))}:${pad(Math.floor((rem % 3600) / 60))}:${pad(rem % 60)}Z`;
}
