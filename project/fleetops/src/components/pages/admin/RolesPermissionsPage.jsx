import React, { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../../utils/api.js'
import {
  Card, PageHeader, TableWrap, TblAction, Btn, Loading,
  Modal, FormGroup, Input, Textarea, showToast,
} from '../../ui/index.jsx'

export default function RolesPermissionsPage({ scope = 'business' }) {
  const basePath = scope === 'system' ? '/super-admin/roles' : '/admin/roles'
  const canCreate = true
  const canEditScope = scope

  const [roles, setRoles]       = useState([])
  const [catalog, setCatalog]   = useState({})
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        apiFetch('GET', basePath),
        apiFetch('GET', basePath + '/catalog'),
      ])
      setRoles(r1.data?.roles || [])
      setCatalog(r2.data?.permissions || {})
    } catch (err) {
      showToast(err.message || 'Failed to load roles.', 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [basePath])

  const selectedPermissions = useMemo(() => new Set(editing?.permissions || []), [editing])

  function startNew() {
    setEditing({ _id: null, name: '', description: '', permissions: [], scope, builtin: false })
  }
  function startEdit(role) {
    setEditing({ ...role, permissions: [...(role.permissions || [])] })
  }
  function cancelEdit() { setEditing(null) }

  function togglePermission(key) {
    setEditing(e => {
      const next = new Set(e.permissions)
      if (next.has(key)) next.delete(key); else next.add(key)
      return { ...e, permissions: Array.from(next) }
    })
  }
  function toggleModule(moduleKeys, allSelected) {
    setEditing(e => {
      const next = new Set(e.permissions)
      if (allSelected) moduleKeys.forEach(k => next.delete(k))
      else             moduleKeys.forEach(k => next.add(k))
      return { ...e, permissions: Array.from(next) }
    })
  }

  async function save() {
    if (!editing.name.trim()) { showToast('Role name is required.', 'error'); return }
    try {
      if (editing._id) {
        await apiFetch('PUT', `${basePath}/${editing._id}`, {
          name: editing.name.trim(),
          description: editing.description || '',
          permissions: editing.permissions,
        })
        showToast('Role updated.')
      } else {
        await apiFetch('POST', basePath, {
          name: editing.name.trim(),
          description: editing.description || '',
          permissions: editing.permissions,
        })
        showToast('Role created.')
      }
      await load()
      setEditing(null)
    } catch (err) {
      showToast(err.message || 'Could not save role.', 'error')
    }
  }

  async function doDelete() {
    if (!confirmDel) return
    try {
      await apiFetch('DELETE', `${basePath}/${confirmDel._id}`)
      showToast('Role deleted.')
      setConfirmDel(null)
      await load()
    } catch (err) {
      showToast(err.message || 'Could not delete role.', 'error')
    }
  }

  const moduleEntries = Object.entries(catalog)

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle={scope === 'system'
          ? 'System-wide role templates available to every tenant'
          : 'Roles scoped to your business + inherited system templates'}
      >
        {canCreate && <Btn variant="primary" onClick={startNew}>+ New Role</Btn>}
      </PageHeader>

      <Card noPad>
        {loading ? <Loading /> : (
          <TableWrap>
            <thead>
              <tr>
                <th>Name</th>
                <th>Scope</th>
                <th>Permissions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-10 text-text2 text-sm">No roles defined yet.</td></tr>
              ) : roles.map(r => {
                const editable = r.scope === canEditScope
                return (
                  <tr
                    key={r._id}
                    className="cursor-pointer hover:bg-surface2 transition-colors"
                    onClick={() => startEdit(r)}
                  >
                    <td data-label="Name">
                      <div className="font-medium">{r.name}{r.builtin && <span className="ml-1.5 text-[10px] text-text3 uppercase">built-in</span>}</div>
                      {r.description && <div className="text-[11px] text-text2">{r.description}</div>}
                    </td>
                    <td data-label="Scope">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${r.scope === 'system' ? 'bg-purple-50 text-purple-800' : 'bg-blue-50 text-blue-800'}`}>
                        {r.scope}
                      </span>
                    </td>
                    <td data-label="Permissions" className="text-text2">{(r.permissions || []).length} permissions</td>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>

      {editing && (() => {
        const readOnly = editing._id && editing.scope !== canEditScope
        return (
          <Modal
            title={editing._id ? (readOnly ? `View Role — ${editing.name}` : `Edit Role — ${editing.name}`) : 'New Role'}
            onClose={cancelEdit}
            size="lg"
            actions={readOnly
              ? [{ label: 'Close', onClick: cancelEdit }]
              : [
                  { label: editing._id ? 'Save' : 'Create', primary: true, onClick: save },
                  ...(editing._id && !editing.builtin && editing.scope === canEditScope
                    ? [{ label: 'Delete', onClick: () => { cancelEdit(); setConfirmDel(editing) } }]
                    : []
                  ),
                  { label: 'Cancel', onClick: cancelEdit },
                ]}
          >
            <div className="space-y-3">
              <FormGroup label="Role name">
                <Input
                  value={editing.name}
                  onChange={e => setEditing(x => ({ ...x, name: e.target.value }))}
                  placeholder="e.g. Delivery Coordinator"
                  disabled={readOnly}
                />
              </FormGroup>

              <FormGroup label="Description" hint="Optional — shown in the role picker.">
                <Textarea
                  rows={2}
                  value={editing.description || ''}
                  onChange={e => setEditing(x => ({ ...x, description: e.target.value }))}
                  disabled={readOnly}
                />
              </FormGroup>

              <div>
                <div className="text-[12px] font-medium text-text1 mb-2">
                  Permissions <span className="text-text3">({(editing.permissions || []).length} selected)</span>
                </div>

                {moduleEntries.length === 0 ? (
                  <div className="text-[12px] text-text2">No permission catalog available.</div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto border border-border rounded-lg p-3">
                    {moduleEntries.map(([mod, perms]) => {
                      const allSelected = perms.every(p => selectedPermissions.has(p.key))
                      const someSelected = perms.some(p => selectedPermissions.has(p.key))
                      return (
                        <div key={mod} className="border-b border-border pb-3 last:border-0 last:pb-0">
                          <label className="flex items-center gap-2 text-[12px] font-semibold text-text1 capitalize mb-1.5 select-none">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                              onChange={() => toggleModule(perms.map(p => p.key), allSelected)}
                              disabled={readOnly}
                            />
                            {mod}
                          </label>
                          <div className="pl-5 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                            {perms.map(p => (
                              <label key={p.key} className="flex items-center gap-2 text-[12px] text-text2 select-none">
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.has(p.key)}
                                  onChange={() => togglePermission(p.key)}
                                  disabled={readOnly}
                                />
                                {p.label}
                                <span className="ml-auto text-[10px] text-text3 font-mono">{p.key}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )
      })()}

      {confirmDel && (
        <Modal
          title="Delete Role"
          onClose={() => setConfirmDel(null)}
          actions={[
            { label: 'Delete', primary: true, onClick: doDelete },
            { label: 'Cancel', onClick: () => setConfirmDel(null) },
          ]}
        >
          <div className="text-[13px]">
            Delete role <span className="font-semibold">{confirmDel.name}</span>? Users currently assigned this role will keep their existing permissions; re-assign them afterward if needed.
          </div>
        </Modal>
      )}
    </div>
  )
}