
import { google } from 'googleapis'

const SHEET_ID = process.env.GOOGLE_SHEET_ID

// ── Singleton auth client ──────────────────────────────────
let _auth = null
function auth() {
  if (_auth) return _auth
  _auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
  return _auth
}

async function client() {
  return google.sheets({ version: 'v4', auth: auth() })
}

// ── Read entire sheet (skips header row) ──────────────────
export async function readSheet(sheetName) {
  const s = await client()
  const res = await s.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A2:Z`
  })
  return res.data.values || []
}

// ── Batch read multiple sheets in ONE API call ────────────
export async function batchRead(sheetNames) {
  const s = await client()
  const res = await s.spreadsheets.values.batchGet({
    spreadsheetId: SHEET_ID,
    ranges: sheetNames.map(n => `${n}!A2:Z`)
  })
  return res.data.valueRanges.map(vr => vr.values || [])
}

// ── Append a new row ──────────────────────────────────────
export async function appendRow(sheetName, values) {
  const s = await client()
  await s.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] }
  })
}

// ── Update a single cell or contiguous range ──────────────
export async function updateRange(range, values) {
  const s = await client()
  await s.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [values] }
  })
}

// ── Batch update multiple ranges in ONE API call ──────────
// data = [{ range: 'Sheet!A1', values: [v1, v2, …] }, …]
export async function batchUpdate(data) {
  const s = await client()
  await s.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: data.map(d => ({ range: d.range, values: [d.values] }))
    }
  })
}

// ── Find a row's 1-based sheet row number by column value ─
// Returns -1 if not found. Adds +2 to account for header + 0-index.
export function rowNum(rows, colIdx, value) {
  const i = rows.findIndex(r => r[colIdx] === value)
  return i === -1 ? -1 : i + 2
}

// ── Build a targeted single-cell range string ─────────────
// e.g. cellRange('Users', 5, 3) → 'Users!D5'
export function cellRange(sheet, row, colIdx) {
  return `${sheet}!${String.fromCharCode(65 + colIdx)}${row}`
}

// Helper: Get correct books sheet based on library location
export function getBooksSheet(libraryLocation) {
  const { SHEETS, LIBRARY } = require('./constants')
  return libraryLocation === LIBRARY.HIGH_SCHOOL 
    ? SHEETS.BOOKS_HS 
    : SHEETS.BOOKS_MAIN
}