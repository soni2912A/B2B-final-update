import React, { useRef, useState } from 'react'
import { apiFetch, apiDownload } from '../../utils/api.js'
import { Btn, Modal, showToast } from './index.jsx'

// Generic bulk-import modal with preview. Two-step flow:
//   1. User picks a file → calls previewPath → shows row table + errors
//   2. User clicks "Confirm Import" → calls importPath → shows results summary
//
// Props:
//   title         — modal heading
//   templatePath  — optional GET path for a blank template download
//   previewPath   — POST path that parses + validates without writing
//   importPath    — POST path that commits the import
//   columns       — [{ key, label }] for the preview table
//   onDone        — called after successful import so parent can reload
//
// Both backend endpoints share the same multipart shape: field name "file",
// xlsx/csv/xls accepted, backend middleware enforces size + mime.
export default function ImportModal({
  title = 'Import',
  templatePath,
  previewPath,
  importPath,
  columns = [],
  onClose,
  onDone,
}) {
  const fileRef = useRef(null)
  const [file, setFile]       = useState(null)
  const [preview, setPreview] = useState(null)   // { rows, errors, total, … }
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState(null)   // populated after import

  async function runPreview(f) {
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const res = await apiFetch('POST', previewPath, fd, true)
      setPreview(res.data || null)
    } catch (err) {
      showToast(err.message || 'Could not preview file.', 'error')
      setFile(null)
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  function onPick(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(null)
    setResults(null)
    runPreview(f)
  }

  async function commit() {
    if (!file) return
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiFetch('POST', importPath, fd, true)
      setResults(res.data?.results || res.data || {})
      // Don't auto-close — the user wants to see the summary first.
    } catch (err) {
      showToast(err.message || 'Import failed.', 'error')
    } finally {
      setImporting(false)
    }
  }

  async function downloadTemplate() {
    if (!templatePath) return
    // apiDownload carries the auth token, unlike window.open. Expected filename
    // is whatever the backend sets via Content-Disposition; this fallback is
    // only used if the response has no disposition header.
    try {
      await apiDownload(templatePath, 'import-template.xlsx')
    } catch (err) {
      showToast(err.message || 'Could not download template.', 'error')
    }
  }

  // Once the import has run, show the results summary with a Close button.
  if (results) {
    const success = results.success ?? 0
    const failed  = results.failed  ?? 0
    const errList = results.errors  ?? []
    return (
      <Modal
        title={`${title} · Complete`}
        onClose={() => { onClose(); if (success > 0) onDone?.() }}
        actions={[{ label: 'Close', primary: true, onClick: () => { onClose(); if (success > 0) onDone?.() } }]}
      >
        <div className="flex gap-4 mb-4">
          <div className="flex-1 p-3 rounded border border-green-200 bg-green-50">
            <div className="text-[11px] text-green-800 uppercase">Succeeded</div>
            <div className="text-2xl font-bold text-green-700">{success}</div>
          </div>
          <div className="flex-1 p-3 rounded border border-red-200 bg-red-50">
            <div className="text-[11px] text-red-800 uppercase">Failed</div>
            <div className="text-2xl font-bold text-red-700">{failed}</div>
          </div>
        </div>
        {errList.length > 0 && (
          <div className="border border-border rounded max-h-[240px] overflow-y-auto">
            <div className="px-3 py-2 bg-surface2 text-[12px] font-semibold uppercase text-text2">Failures</div>
            <div className="divide-y divide-border">
              {errList.slice(0, 50).map((e, i) => (
                <div key={i} className="px-3 py-2 text-[12px]">
                  <span className="font-mono text-text2">{e.row || `row ${i + 1}`}</span>
                  <span className="mx-2 text-text3">·</span>
                  <span className="text-red-700">{e.error}</span>
                </div>
              ))}
              {errList.length > 50 && (
                <div className="px-3 py-2 text-[11px] text-text2 italic">
                  … {errList.length - 50} more not shown
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    )
  }

  // Preview state — show table of rows + validation errors. Confirm button
  // is disabled if there are zero valid rows.
  const hasPreview = !!preview
  const rows = preview?.rows || []
  const previewErrors = preview?.errors || []
  const validCount = preview?.valid ?? (rows.length - rows.filter(r => r.errors?.length).length)
  const invalidCount = preview?.invalid ?? rows.filter(r => r.errors?.length).length

  return (
    <Modal
      title={title}
      size="lg"
      onClose={onClose}
      actions={[
        {
          label: importing ? 'Importing…' : `Confirm Import${hasPreview && validCount > 0 ? ` (${validCount})` : ''}`,
          primary: true,
          onClick: commit,
          disabled: importing || !hasPreview || validCount === 0,
        },
        { label: 'Cancel', onClick: onClose },
      ]}
    >
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onPick}
          disabled={loading || importing}
          className="text-[13px]"
        />
        {templatePath && (
          <Btn size="sm" onClick={downloadTemplate}>↓ Download template</Btn>
        )}
      </div>

      {loading && <div className="text-[12px] text-text2 py-6 text-center">Parsing file…</div>}

      {hasPreview && (
        <>
          <div className="flex gap-3 mb-3 text-[12px]">
            <span className="px-2 py-0.5 rounded bg-accent-light text-accent font-medium">
              Total: {rows.length}
            </span>
            {preview.toCreate !== undefined && (
              <>
                <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 font-medium">
                  {preview.toCreate} new
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                  {preview.toUpdate} update
                </span>
              </>
            )}
            {validCount !== undefined && preview.toCreate === undefined && (
              <>
                <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 font-medium">
                  {validCount} valid
                </span>
                {invalidCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-medium">
                    {invalidCount} invalid
                  </span>
                )}
              </>
            )}
          </div>

          {previewErrors.length > 0 && (
            <div className="mb-3 p-2.5 rounded border border-red-200 bg-red-50 text-red-700 text-[12px]">
              <div className="font-semibold mb-1">Validation errors:</div>
              <ul className="list-disc list-inside space-y-0.5 max-h-[100px] overflow-y-auto">
                {previewErrors.slice(0, 10).map((e, i) => (
                  <li key={i}>Row {e.row} · {e.field}: {e.error}</li>
                ))}
                {previewErrors.length > 10 && (
                  <li className="italic">… {previewErrors.length - 10} more</li>
                )}
              </ul>
            </div>
          )}

          <div className="border border-border rounded overflow-hidden">
            <div className="max-h-[320px] overflow-auto">
              <table className="fleet-table text-[12px] w-full">
                <thead>
                  <tr>
                    {columns.map(c => <th key={c.key}>{c.label}</th>)}
                    {preview.toCreate !== undefined && <th>Action</th>}
                    {rows.some(r => r.errors) && <th>Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r, i) => {
                    const hasErrors = Array.isArray(r.errors) && r.errors.length > 0
                    return (
                      <tr key={i} className={hasErrors ? 'opacity-60' : ''}>
                        {columns.map(c => <td key={c.key}>{String(r[c.key] ?? '—')}</td>)}
                        {preview.toCreate !== undefined && (
                          <td>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${r._action === 'update' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                              {r._action}
                            </span>
                          </td>
                        )}
                        {rows.some(r => r.errors) && (
                          <td>
                            {hasErrors
                              ? <span className="text-red-600 text-[11px]">{r.errors.join(', ')}</span>
                              : <span className="text-green-600 text-[11px]">OK</span>}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {rows.length > 100 && (
              <div className="px-3 py-2 text-[11px] text-text2 bg-surface2 border-t border-border">
                Showing first 100 of {rows.length} rows. All {validCount} valid rows will be imported on confirm.
              </div>
            )}
          </div>
        </>
      )}

      {!hasPreview && !loading && (
        <div className="text-[12px] text-text2 py-6 text-center">
          Pick a CSV or Excel file to preview before importing. Rows are validated before anything is written.
        </div>
      )}
    </Modal>
  )
}
