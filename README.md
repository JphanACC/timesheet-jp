# Timesheet JP

A lightweight, browser-only weekly timesheet tracker. No server, no build step — just open `index.html` and start logging time.

**Free to use.**

---

## Features

### Weekly Grid (Sat → Fri)
- Seven day columns running **Saturday through Friday**, matching a standard work week.
- Each column has a **date picker** so you can anchor the grid to a specific week.
- A dedicated **Week** column on the right shows the running total across all days.

### Activity Rows
- Each day starts with **6 activity rows** by default.
- Click **Add Row** in the toolbar to append a new row across all seven days at once — no limit.

### Time Entry
Type time in a compact shorthand — no colons or spaces required:

| You type | Interpreted as |
|----------|----------------|
| `12am`   | 12:00 am       |
| `630am`  | 6:30 am        |
| `805am`  | 8:05 am        |
| `130pm`  | 1:30 pm        |
| `1230pm` | 12:30 pm       |

Each activity row has a **From** and **To** field. The decimal result appears instantly to the right as you type.

### Minutes → Decimal Conversion

Whole hours count as their full value. The remaining minutes are mapped to a decimal increment using this table:

| Remaining Minutes | Decimal |
|:-----------------:|:-------:|
| 1 – 2             | 0.0     |
| 3 – 8             | 0.1     |
| 9 – 14            | 0.2     |
| 15 – 20           | 0.3     |
| 21 – 26           | 0.4     |
| 27 – 32           | 0.5     |
| 33 – 38           | 0.6     |
| 39 – 44           | 0.7     |
| 45 – 50           | 0.8     |
| 51 – 56           | 0.9     |
| 57 – 60           | 1.0     |

**Examples:**

| From – To         | Calculation                      | Result |
|-------------------|----------------------------------|--------|
| 2:30 pm – 5:23 pm | 2 hrs + 53 min → 0.9             | **2.9** |
| 5:32 am – 2:00 pm | 8 hrs + 28 min → 0.5             | **8.5** |
| 12:00 pm – 2:00 pm| 2 hrs + 0 min → 0.0             | **2.0** |

Click the **Min → Decimal** button in the toolbar to open a slide-in reference panel at any time.

### Totals
- The **day total** sits just below each day header, updating live as you enter time.
- The **week total** column sums every day total for the full week view.

### Copy to Clipboard
Each day total has a **copy icon** next to it. Clicking it copies all valid entries for that day in a ready-to-paste format:

```
2:30pm - 5:23pm: 2.9
5:32am - 2:00pm: 8.5
12:00pm - 2:00pm: 2.0
```

### Save & Restore
- **Save** stores the entire session (all dates, times, and descriptions) in browser `localStorage`.
- The session is automatically restored the next time you open the file in the same browser.
- **Reset** clears everything and removes the saved session.

### Excel Export
Click **Export** to download a `.xlsx` file. The file contains two sheets:

**Weekly Summary** — one column per day, one row per activity. Each cell shows the time range, decimal value, and description. Cells are pre-formatted with **text wrap enabled** so everything is readable on open without any manual formatting.

**Activity Detail** — a flat table with one row per entry (Day, Date, Activity #, From, To, Decimal Hours, Description).

The filename includes the date range of the exported week (e.g. `timesheet_2025-01-04_to_2025-01-10.xlsx`).

---

## Getting Started

1. Clone or download this repository.
2. Open `index.html` in any modern browser.
3. No internet connection required after the initial load (fonts and libraries load from CDN on first open).

---

## Tech Stack

| Layer | Library |
|-------|---------|
| UI framework | Vanilla HTML + CSS (flex layout) |
| DOM / events | [jQuery 3.7.1](https://jquery.com/) |
| Excel export | [ExcelJS 4.4.0](https://github.com/exceljs/exceljs) |
| Fonts | IBM Plex Mono · DM Sans (Google Fonts) |

Business logic (`timeLogic.js`) and UI logic (`timesheetUI.js`) are kept in separate files.

---

## License

MIT — free to use, modify, and distribute.