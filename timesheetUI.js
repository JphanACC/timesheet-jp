// ============================================================
// timesheetUI.js — UI Logic for Timesheet Application
// ============================================================
// Depends on: jQuery, timeLogic.js

$(function () {
  const TL = window.TimeLogic;

  // ── State ───────────────────────────────────────────────────
  const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const INITIAL_ROWS = 6;
  const state = {
    dates: Array(7).fill(''),
    rows: Array.from({ length: 7 }, () =>
      Array.from({ length: INITIAL_ROWS }, () => ({ from: '', to: '', desc: '' }))
    )
  };

  // ── Build structure ─────────────────────────────────────────
  function buildSheet() {
    const $wrap = $('#sheet-scroll');
    $wrap.empty();

    const $grid = $('<div class="ts-grid"></div>');

    // Label column
    const $labelCol = $('<div class="ts-col ts-label-col"></div>');
    $labelCol.append('<div class="ts-cell ts-head-date"></div>');
    $labelCol.append('<div class="ts-cell ts-head-total"><span>Total</span></div>');
    for (let r = 0; r < getMaxRows(); r++) {
      $labelCol.append(`<div class="ts-cell ts-row-label">Activity ${r + 1}</div>`);
    }
    $labelCol.append('<div class="ts-cell ts-add-row-cell"></div>');
    $grid.append($labelCol);

    // Day columns
    DAYS.forEach((day, d) => {
      $grid.append(buildDayColumn(day, d));
    });

    // Weekly total column
    $grid.append(buildTotalColumn());

    $wrap.append($grid);
    refreshAllTotals();
  }

  function getMaxRows() {
    return Math.max(...state.rows.map(r => r.length));
  }

  function buildDayColumn(day, d) {
    const $col = $(`<div class="ts-col ts-day-col" data-day="${d}"></div>`);

    // Header: day name + date input
    const $head = $('<div class="ts-cell ts-head-date"></div>');
    $head.append(`<div class="ts-day-name">${day}</div>`);
    const $dateInp = $(`<input type="date" class="ts-date-input" data-day="${d}" value="${state.dates[d]}" />`);
    $head.append($dateInp);
    $col.append($head);

    // Total row
    const $totalCell = $('<div class="ts-cell ts-head-total"></div>');
    $totalCell.append(`<span class="ts-day-total" id="day-total-${d}">0.0</span>`);
    const $copyBtn = $(`<button class="ts-copy-btn" data-day="${d}" title="Copy day summary">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
      </svg>
    </button>`);
    $totalCell.append($copyBtn);
    $col.append($totalCell);

    // Activity rows
    const maxR = getMaxRows();
    for (let r = 0; r < maxR; r++) {
      $col.append(buildActivityCell(d, r));
    }

    // Add row button (only on last day column, or we can add on each – let's put it in label col)
    $col.append('<div class="ts-cell ts-add-row-cell"></div>');

    return $col;
  }

  function buildActivityCell(d, r) {
    const rowData = state.rows[d][r] || { from: '', to: '', desc: '' };
    const desc = (rowData.desc || '').replace(/"/g, '&quot;');
    const $cell = $(`<div class="ts-cell ts-activity-cell" data-day="${d}" data-row="${r}"></div>`);

    // Top row: time inputs + result
    const $timeRow = $('<div class="ts-time-row"></div>');
    const $from = $(`<input type="text" class="ts-time-input ts-from" placeholder="From" data-day="${d}" data-row="${r}" data-field="from" value="${rowData.from}" maxlength="8" />`);
    const $to   = $(`<input type="text" class="ts-time-input ts-to"   placeholder="To"   data-day="${d}" data-row="${r}" data-field="to"   value="${rowData.to}"   maxlength="8" />`);
    const $result = $(`<span class="ts-row-result" id="result-${d}-${r}"></span>`);
    $timeRow.append($from, $('<span class="ts-arrow">→</span>'), $to, $result);

    // Bottom row: description
    const $desc = $(`<textarea class="ts-desc-input" placeholder="Description…" data-day="${d}" data-row="${r}" data-field="desc" maxlength="200">${rowData.desc || ''}</textarea>`);

    $cell.append($timeRow, $desc);
    return $cell;
  }

  function buildTotalColumn() {
    const $col = $('<div class="ts-col ts-total-col"></div>');
    $col.append('<div class="ts-cell ts-head-date"><div class="ts-day-name ts-week-label">Week</div></div>');
    $col.append('<div class="ts-cell ts-head-total"><span class="ts-week-total" id="week-total">0.0</span></div>');
    const maxR = getMaxRows();
    for (let r = 0; r < maxR; r++) {
      $col.append('<div class="ts-cell ts-total-placeholder"></div>');
    }
    $col.append('<div class="ts-cell ts-add-row-cell"></div>');
    return $col;
  }

  // ── Refresh / Compute ────────────────────────────────────────
  function computeRowResult(d, r) {
    const rowData = state.rows[d] && state.rows[d][r];
    if (!rowData || !rowData.from || !rowData.to) return null;
    return TL.calculateDuration(rowData.from, rowData.to);
  }

  function refreshRow(d, r) {
    const result = computeRowResult(d, r);
    const $res = $(`#result-${d}-${r}`);
    if (!$res.length) return;

    if (!result) {
      $res.text('').removeClass('ts-result-ok ts-result-err');
    } else if (result.error) {
      $res.text('!').attr('title', result.error).addClass('ts-result-err').removeClass('ts-result-ok');
    } else {
      $res.text(result.decimal.toFixed(1)).attr('title', '').addClass('ts-result-ok').removeClass('ts-result-err');
    }
  }

  function refreshDayTotal(d) {
    let sum = 0;
    (state.rows[d] || []).forEach((_, r) => {
      const result = computeRowResult(d, r);
      if (result && !result.error) sum += result.decimal;
    });
    sum = Math.round(sum * 10) / 10;
    $(`#day-total-${d}`).text(sum.toFixed(1));
    return sum;
  }

  function refreshWeekTotal() {
    let total = 0;
    for (let d = 0; d < 7; d++) total += refreshDayTotal(d);
    total = Math.round(total * 10) / 10;
    $('#week-total').text(total.toFixed(1));
  }

  function refreshAllTotals() {
    for (let d = 0; d < 7; d++) {
      const maxR = state.rows[d].length;
      for (let r = 0; r < maxR; r++) refreshRow(d, r);
    }
    refreshWeekTotal();
  }

  // ── Add Row ──────────────────────────────────────────────────
  function addRow() {
    for (let d = 0; d < 7; d++) {
      state.rows[d].push({ from: '', to: '', desc: '' });
    }
    buildSheet();
  }

  // ── Save State ───────────────────────────────────────────────
  const STORAGE_KEY = 'timesheet_state_v1';

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      showToast('State saved!', 'ok');
    } catch (e) {
      showToast('Save failed.', 'warn');
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (saved.dates) state.dates = saved.dates;
      if (saved.rows) state.rows = saved.rows;
      return true;
    } catch (e) {
      return false;
    }
  }

  // ── Reset State ──────────────────────────────────────────────
  function resetState() {
    if (!confirm('Reset all entries? This cannot be undone.')) return;
    state.dates = Array(7).fill('');
    state.rows = Array.from({ length: 7 }, () =>
      Array.from({ length: INITIAL_ROWS }, () => ({ from: '', to: '', desc: '' }))
    );
    localStorage.removeItem(STORAGE_KEY);
    buildSheet();
    showToast('Timesheet reset.', 'warn');
  }

  // ── Export to Excel ──────────────────────────────────────────
  async function exportToExcel() {
    if (!window.ExcelJS) { showToast('ExcelJS not loaded.', 'warn'); return; }

    const workbook = new ExcelJS.Workbook();
    const maxR = getMaxRows();

    const HEAD_FILL  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E2535' } };
    const HEAD_FONT  = { bold: true, color: { argb: 'FFD4DAF0' } };
    const TOTAL_FONT = { bold: true, color: { argb: 'FFE8A94A' } };
    const WRAP_ALIGN   = { vertical: 'top', wrapText: true };
    const NOWRAP_ALIGN = { vertical: 'top', wrapText: false };

    // ── Sheet 1: Weekly Summary ───────────────────────────────
    const wsSummary = workbook.addWorksheet('Weekly Summary');
    wsSummary.columns = [
      { width: 14 },
      ...DAYS.map(() => ({ width: 30 })),
      { width: 12 }
    ];

    // Header row
    const fmtDate = iso => { const [y, m, d] = iso.split('-'); return `${m}/${d}/${y}`; };
    const headerVals = ['Activity'];
    DAYS.forEach((day, d) => {
      const dateStr = state.dates[d] ? ` (${fmtDate(state.dates[d])})` : '';
      headerVals.push(`${day}${dateStr}`);
    });
    headerVals.push('Week Total');

    const hRow = wsSummary.addRow(headerVals);
    hRow.height = 22;
    hRow.eachCell(cell => {
      cell.fill = HEAD_FILL;
      cell.font = HEAD_FONT;
      cell.alignment = NOWRAP_ALIGN;
    });

    // Activity rows
    for (let r = 0; r < maxR; r++) {
      const rowVals = [`Activity ${r + 1}`];
      for (let d = 0; d < 7; d++) {
        const result = computeRowResult(d, r);
        const desc = (state.rows[d][r] && state.rows[d][r].desc) || '';
        let cellVal = '';
        if (result && !result.error) {
          const timeStr = `${result.fromFormatted} - ${result.toFormatted}: ${result.decimal.toFixed(1)}`;
          cellVal = desc ? `${timeStr}\n${desc}` : timeStr;
        } else {
          cellVal = desc;
        }
        rowVals.push(cellVal);
      }
      rowVals.push('');

      const row = wsSummary.addRow(rowVals);
      row.height = 50;
      row.eachCell((cell, colNum) => {
        // columns 2–8 are the day columns (wrap time + description)
        cell.alignment = (colNum >= 2 && colNum <= 8) ? WRAP_ALIGN : NOWRAP_ALIGN;
      });
    }

    // Blank separator
    wsSummary.addRow([]);

    // Totals row
    const totalsVals = ['Total Hours'];
    let weekSum = 0;
    for (let d = 0; d < 7; d++) {
      let daySum = 0;
      state.rows[d].forEach((_, r2) => {
        const res = computeRowResult(d, r2);
        if (res && !res.error) daySum += res.decimal;
      });
      daySum = Math.round(daySum * 10) / 10;
      weekSum += daySum;
      totalsVals.push(daySum);
    }
    weekSum = Math.round(weekSum * 10) / 10;
    totalsVals.push(weekSum);

    const tRow = wsSummary.addRow(totalsVals);
    tRow.height = 22;
    tRow.eachCell(cell => {
      cell.font = TOTAL_FONT;
      cell.alignment = NOWRAP_ALIGN;
    });

    // ── Sheet 2: Activity Detail ──────────────────────────────
    const wsDetail = workbook.addWorksheet('Activity Detail');
    wsDetail.columns = [
      { header: 'Day',           key: 'day',  width: 12 },
      { header: 'Date',          key: 'date', width: 12 },
      { header: 'Activity #',    key: 'act',  width: 12 },
      { header: 'From',          key: 'from', width: 10 },
      { header: 'To',            key: 'to',   width: 10 },
      { header: 'Decimal Hours', key: 'dec',  width: 16 },
      { header: 'Description',   key: 'desc', width: 36 },
    ];

    const detailHRow = wsDetail.getRow(1);
    detailHRow.height = 22;
    detailHRow.eachCell(cell => {
      cell.fill = HEAD_FILL;
      cell.font = HEAD_FONT;
      cell.alignment = NOWRAP_ALIGN;
    });

    for (let d = 0; d < 7; d++) {
      state.rows[d].forEach((rowData, r) => {
        const result = computeRowResult(d, r);
        const desc = rowData.desc || '';
        if (result && !result.error) {
          const row = wsDetail.addRow({
            day: DAYS[d], date: state.dates[d] || '', act: r + 1,
            from: result.fromFormatted, to: result.toFormatted,
            dec: result.decimal, desc
          });
          row.getCell('desc').alignment = WRAP_ALIGN;
        } else if (desc) {
          const row = wsDetail.addRow({
            day: DAYS[d], date: state.dates[d] || '', act: r + 1,
            from: rowData.from || '', to: rowData.to || '', dec: '', desc
          });
          row.getCell('desc').alignment = WRAP_ALIGN;
        }
      });
    }

    // Generate filename with date range if available
    const filledDates = state.dates.filter(Boolean);
    let filename = 'timesheet';
    if (filledDates.length) {
      const sorted = [...filledDates].sort();
      filename = `timesheet_${sorted[0]}_to_${sorted[sorted.length - 1]}`;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Exported to Excel!', 'ok');
  }

  // ── Copy to Clipboard ────────────────────────────────────────
  function copyDaySummary(d) {
    const rows = state.rows[d] || [];
    const lines = [];
    rows.forEach((rowData, r) => {
      const result = computeRowResult(d, r);
      if (result && !result.error) {
        const desc = (rowData.desc || '').trim();
        const line = `${result.fromFormatted} - ${result.toFormatted}: ${result.decimal.toFixed(1)}${desc ? '. ' + desc : ''}`;
        lines.push(line);
      }
    });
    if (!lines.length) {
      showToast('No valid entries to copy.', 'warn');
      return;
    }
    const text = lines.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!', 'ok');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Copied!', 'ok');
    });
  }

  // ── Toast ─────────────────────────────────────────────────────
  function showToast(msg, type) {
    const $t = $(`<div class="ts-toast ts-toast-${type}">${msg}</div>`);
    $('#toast-container').append($t);
    setTimeout(() => $t.addClass('ts-toast-show'), 10);
    setTimeout(() => {
      $t.removeClass('ts-toast-show');
      setTimeout(() => $t.remove(), 400);
    }, 2000);
  }

  // ── Lookup Table Toggle ───────────────────────────────────────
  function buildLookupTable() {
    const $tbody = $('#lookup-tbody');
    $tbody.empty();

    const groups = [
      { label: '0 – 2', value: '0' },
      { label: '3 – 8', value: '0.1' },
      { label: '9 – 14', value: '0.2' },
      { label: '15 – 20', value: '0.3' },
      { label: '21 – 26', value: '0.4' },
      { label: '27 – 32', value: '0.5' },
      { label: '33 – 38', value: '0.6' },
      { label: '39 – 44', value: '0.7' },
      { label: '45 – 50', value: '0.8' },
      { label: '51 – 56', value: '0.9' },
      { label: '57 – 60', value: '1.0' },
    ];

    groups.forEach(g => {
      $tbody.append(`<tr><td>${g.label}</td><td>${g.value}</td></tr>`);
    });
  }

  // ── Event Delegation ─────────────────────────────────────────
  $(document).on('input', '.ts-time-input, .ts-desc-input', function () {
    const d = +$(this).data('day');
    const r = +$(this).data('row');
    const field = $(this).data('field');
    if (!state.rows[d]) state.rows[d] = [];
    if (!state.rows[d][r]) state.rows[d][r] = { from: '', to: '', desc: '' };
    state.rows[d][r][field] = $(this).val();
    if (field !== 'desc') {
      refreshRow(d, r);
      refreshWeekTotal();
    }
  });

  $(document).on('change', '.ts-date-input', function () {
    const d = +$(this).data('day');
    state.dates[d] = $(this).val();
  });

  $(document).on('click', '.ts-copy-btn', function () {
    const d = +$(this).data('day');
    copyDaySummary(d);
  });

  $(document).on('click', '#add-row-btn', function () {
    addRow();
  });

  $('#save-btn').on('click', saveState);
  $('#reset-btn').on('click', resetState);
  $('#export-btn').on('click', () => exportToExcel().catch(() => showToast('Export failed.', 'warn')));

  $('#toggle-lookup').on('click', function () {
    const $panel = $('#lookup-panel');
    $panel.toggleClass('open');
    $(this).toggleClass('active');
  });

  $('#close-lookup').on('click', function () {
    $('#lookup-panel').removeClass('open');
    $('#toggle-lookup').removeClass('active');
  });

  // ── Init ─────────────────────────────────────────────────────
  if (window.APP_VERSION) $('#app-version').text('v' + window.APP_VERSION);

  buildLookupTable();
  const hadSaved = loadState();
  buildSheet();
  if (hadSaved) showToast('Previous session restored.', 'ok');
});
