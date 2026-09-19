import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';
const MODULES = ['CUSTOMER','PRODUCT','SALES_ORDER','PAYMENT','WORK_ORDER','PRODUCTION','PACKING','HANDOVER','FINANCE'];
const ACTIONS = ['VIEW','CREATE','EDIT','DELETE','ACTION'];

function AddRoleModal({ saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState({ code: '', name: '' });

  function submit(event) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card admin-user-modal">
        <div className="modal-header">
          <div><p className="eyebrow">ADMIN / USER MANAGEMENT</p><h2>Add Role</h2></div>
          <button className="button" type="button" disabled={saving} onClick={onClose}>Close</button>
        </div>
        <form className="entity-form" onSubmit={submit}>
          <label>
            Role Code
            <input
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="e.g. SALES_ADMIN"
              autoComplete="off"
              autoFocus
              required
            />
          </label>
          <label>
            Role Name
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="e.g. Sales Admin"
              autoComplete="off"
              required
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" disabled={saving} onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Role'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissionIds, setPermissionIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ code: '', name: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles`, { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to load roles.');
      setRoles(payload.data?.roles || []);
      setPermissions(payload.data?.permissions || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openRole(role) {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles/${role.id}`, { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to load role.');
      setSelectedRole(payload.data.role);
      setPermissionIds((payload.data.permissions || []).map((permission) => permission.id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function hasPermission(code) {
    const permission = permissions.find((item) => item.code === code);
    return permission ? permissionIds.includes(permission.id) : false;
  }

  function togglePermission(code) {
    if (selectedRole?.code === 'OWNER') return;
    const permission = permissions.find((item) => item.code === code);
    if (!permission) return;
    setPermissionIds((current) => current.includes(permission.id)
      ? current.filter((id) => id !== permission.id)
      : [...current, permission.id]);
  }

  async function savePermissions() {
    if (!selectedRole || selectedRole.code === 'OWNER') return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles/${selectedRole.id}/permissions`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionIds }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to save permissions.');
      setPermissionIds((payload.data || []).map((permission) => permission.id));
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setModal('create');
  }

  async function submitRole(form) {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to create role.');
      setModal(null);
      await load();
      await openRole(payload.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(role) {
    if (role.code === 'OWNER') return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles/${role.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: role.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to update role status.');
      await load();
      setSelectedRole(payload.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-roles-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ADMIN / USER MANAGEMENT</p>
          <h1>Roles</h1>
          <p className="page-description">Configure roles and their module permissions.</p>
        </div>
        <button className="primary-button" type="button" onClick={openCreate}>+ Add Role</button>
      </div>

      {error && <div className="error-banner"><span>{error}</span><button type="button" onClick={load}>Retry</button></div>}

      <div className="admin-roles-layout">
        <div className="table-card admin-roles-table">
          {loading ? <div className="state-panel">Loading roles…</div> : (
            <table>
              <thead><tr><th>Role</th><th>Code</th><th>Status</th><th>Permissions</th><th /></tr></thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className={selectedRole?.id === role.id ? 'selected' : ''} onClick={() => openRole(role)}>
                    <td><strong>{role.name}</strong></td>
                    <td><span className="admin-code-chip">{role.code}</span></td>
                    <td><span className={role.status === 'ACTIVE' ? 'status-badge' : 'status-badge status-inactive'}>{role.status}</span></td>
                    <td>{role.code === 'OWNER' ? 'Full access' : role.permission_count}</td>
                    <td><button className="button" type="button" onClick={(event) => { event.stopPropagation(); openRole(role); }}>Configure</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedRole && (
          <aside className="admin-permission-panel">
            <div className="admin-drawer-header">
              <div>
                <p className="eyebrow">ROLE CONFIGURATION</p>
                <h2>{selectedRole.name}</h2>
                <span className="admin-subtle">{selectedRole.code}</span>
              </div>
              <button className="button" type="button" onClick={() => setSelectedRole(null)}>Close</button>
            </div>

            <div className="admin-permission-body">
              <div className="admin-permission-toolbar">
                <strong>Permission Matrix</strong>
                {selectedRole.code === 'OWNER' && <span className="admin-subtle">OWNER has full access.</span>}
              </div>
              <div className="admin-permission-matrix">
                <div className="permission-grid permission-grid-header">
                  <span>Module</span>{ACTIONS.map((action) => <span key={action}>{action}</span>)}
                </div>
                {MODULES.map((module) => (
                  <div className="permission-grid" key={module}>
                    <strong>{module.replaceAll('_', ' ')}</strong>
                    {ACTIONS.map((action) => {
                      const code = `${module}_${action}`;
                      return (
                        <label key={code} className="permission-cell">
                          <input type="checkbox" checked={selectedRole.code === 'OWNER' ? true : hasPermission(code)} disabled={selectedRole.code === 'OWNER' || saving} onChange={() => togglePermission(code)} />
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-drawer-actions">
              {selectedRole.code !== 'OWNER' && (
                <>
                  <button className="secondary-button" type="button" disabled={saving} onClick={() => toggleStatus(selectedRole)}>{selectedRole.status === 'ACTIVE' ? 'Inactivate Role' : 'Activate Role'}</button>
                  <button className="primary-button" type="button" disabled={saving} onClick={savePermissions}>{saving ? 'Saving…' : 'Save Permissions'}</button>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {modal === 'create' && (
        <AddRoleModal
          saving={saving}
          error={error}
          onClose={() => setModal(null)}
          onSubmit={submitRole}
        />
      )}
    </section>
  );
}
