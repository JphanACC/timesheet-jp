// ============================================================
// timeLogic.js — Business Logic for Timesheet Application
// ============================================================

/**
 * Parse a human-typed time string into { hours, minutes, period }
 * Accepts formats like: 12am, 130pm, 1230pm, 630am, 805am, 1200pm
 */
function parseTimeInput(raw) {
  if (!raw) return null;
  let s = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;

  // Extract period
  let period = null;
  if (s.endsWith('am')) { period = 'am'; s = s.slice(0, -2); }
  else if (s.endsWith('pm')) { period = 'pm'; s = s.slice(0, -2); }
  else return null; // period required

  if (!/^\d+$/.test(s)) return null;

  let hours, minutes;
  if (s.length <= 2) {
    hours = parseInt(s, 10);
    minutes = 0;
  } else if (s.length === 3) {
    hours = parseInt(s.slice(0, 1), 10);
    minutes = parseInt(s.slice(1), 10);
  } else if (s.length === 4) {
    hours = parseInt(s.slice(0, 2), 10);
    minutes = parseInt(s.slice(2), 10);
  } else {
    return null;
  }

  if (hours < 1 || hours > 12) return null;
  if (minutes < 0 || minutes > 59) return null;

  return { hours, minutes, period };
}

/**
 * Convert parsed time to total minutes from midnight (0-based)
 */
function toMinutesSinceMidnight(parsed) {
  if (!parsed) return null;
  let { hours, minutes, period } = parsed;
  let h = hours % 12; // 12am/12pm fix
  if (period === 'pm') h += 12;
  return h * 60 + minutes;
}

/**
 * Convert a raw minutes-difference value to the decimal time value
 * per the lookup table provided.
 *
 * Minutes | Value
 * 1-2     | 0
 * 3-8     | 0.1
 * 9-14    | 0.2
 * 15-20   | 0.3
 * 21-26   | 0.4
 * 27-32   | 0.5
 * 33-38   | 0.6
 * 39-44   | 0.7
 * 45-50   | 0.8
 * 51-56   | 0.9
 * 57-60   | 1.0  (full hour)
 * 0       | 0
 */
function minuteFractionToDecimal(mins) {
  if (mins <= 0) return 0;
  if (mins <= 2) return 0;
  if (mins <= 8) return 0.1;
  if (mins <= 14) return 0.2;
  if (mins <= 20) return 0.3;
  if (mins <= 26) return 0.4;
  if (mins <= 32) return 0.5;
  if (mins <= 38) return 0.6;
  if (mins <= 44) return 0.7;
  if (mins <= 50) return 0.8;
  if (mins <= 56) return 0.9;
  return 1.0; // 57-60
}

/**
 * Full minute-to-decimal lookup table for UI reference (0-60)
 */
const MINUTE_LOOKUP_TABLE = (function() {
  const table = [];
  for (let m = 0; m <= 60; m++) {
    table.push({ minutes: m, value: minuteFractionToDecimal(m) });
  }
  return table;
})();

/**
 * Calculate the decimal duration between two raw time strings.
 * Returns { decimal, fromFormatted, toFormatted, error }
 */
function calculateDuration(fromRaw, toRaw) {
  const fromParsed = parseTimeInput(fromRaw);
  const toParsed = parseTimeInput(toRaw);

  if (!fromParsed) return { error: 'Invalid "from" time' };
  if (!toParsed) return { error: 'Invalid "to" time' };

  const fromMins = toMinutesSinceMidnight(fromParsed);
  const toMins = toMinutesSinceMidnight(toParsed);

  if (fromMins === null || toMins === null) return { error: 'Parse error' };

  let diff = toMins - fromMins;
  if (diff < 0) diff += 24 * 60; // overnight
  if (diff === 0) return { error: 'Same time' };

  const wholeHours = Math.floor(diff / 60);
  const remainingMins = diff % 60;
  const decimal = wholeHours + minuteFractionToDecimal(remainingMins);

  return {
    decimal: Math.round(decimal * 10) / 10,
    fromFormatted: formatTime(fromParsed),
    toFormatted: formatTime(toParsed),
    error: null
  };
}

/**
 * Format parsed time to a readable string like "2:30pm"
 */
function formatTime(parsed) {
  if (!parsed) return '';
  const { hours, minutes, period } = parsed;
  const m = String(minutes).padStart(2, '0');
  return `${hours}:${m}${period}`;
}

/**
 * Format a raw time string to display format (best-effort)
 */
function formatRawTime(raw) {
  const p = parseTimeInput(raw);
  return p ? formatTime(p) : raw;
}

// Export for use in other scripts
window.TimeLogic = {
  parseTimeInput,
  toMinutesSinceMidnight,
  minuteFractionToDecimal,
  calculateDuration,
  formatTime,
  formatRawTime,
  MINUTE_LOOKUP_TABLE
};
