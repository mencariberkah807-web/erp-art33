import { useCallback, useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';
const EMPTY_FORM = { username: '', name: '', email: '', password: '', status: 'ACTIVE' };

function statusClass(status) {
  return status === 'ACTIVE' ? 'status-badge' : 'status-badge status-inactive';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [roleIds, setRoleIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users`, { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to load users.');
      setUsers(payload.data || []);
    } catch (requestError) {
      setError(requestError.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/roles`, { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to load roles.');
      setRoles((payload.data?.roles || []).filter((role) => role.status === 'ACTIVE'));
    } catch (requestError) {
      setFormError(requestError.message);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [loadUsers, loadRoles]);

  async function openDetail(user) {
    setFormError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${user.id}`, { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to load user detail.');
      setSelected(payload.data);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setRoleIds([]);
    setFormError('');
    setModal({ type: 'create' });
  }

  function openEdit(user) {
    setForm({
      username: user.username,
      name: user.name || '',
      email: user.email || '',
      password: '',
      status: user.status || 'ACTIVE',
    });
    setRoleIds((user.roles || []).map((role) => role.id));
    setFormError('');
    setModal({ type: 'edit', user });
  }

  function openRoles(user) {
    setRoleIds((user.roles || []).map((role) => role.id));
    setFormError('');
    setModal({ type: 'roles', user });
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleRole(roleId) {
    setRoleIds((current) => current.includes(roleId)
      ? current.filter((id) => id !== roleId)
      : [...current, roleId]);
  }

  async function submitUser(event) {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const isEdit = modal.type === 'edit';
      const body = isEdit
        ? { name: form.name, email: form.email, status: form.status, ...(form.password ? { password: form.password } : {}) }
        : form;
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users${isEdit ? `/${modal.user.id}` : ''}`, {
        method: isEdit ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to save user.');
      setModal(null);
      setSelected(null);
      await loadUsers();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRoles(event) {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${modal.user.id}/roles`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to update roles.');
      setModal(null);
      setSelected(null);
      await loadUsers();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(user) {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${user.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Unable to update user status.');
      await loadUsers();
      if (selected?.user?.id === user.id) await openDetail(payload.data);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section className="admin-users-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ADMIN / USER MANAGEMENT</p>
          <h1>Users</h1>
          <p className="page-description">Manage system users, account status, and assigned roles.</p>
        </div>
        <button className="primary-button" type="button" onClick={openCreate}>+ Add User</button>
      </div>

      {error && <div className="error-banner"><span>{error}</span><button type="button" onClick={loadUsers}>Retry</button></div>}

      <div className="table-card admin-users-table">
        {loading ? (
          <div className="state-panel">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="state-panel"><strong>No users found</strong><span>User accounts will appear here once created.</span></div>
        ) : (
          <table>
            <thead>
              <tr><th>User</th><th>Email</th><th>Roles</th><th>Status</th><th>Updated</th><th /></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} onClick={() => openDetail(user)}>
                  <td><strong>{user.name}</strong><small className="admin-subtle">@{user.username}</small></td>
                  <td>{user.email || '—'}</td>
                  <td><div className="admin-role-list">{(user.roles || []).map((role) => <span key={role.id} className="admin-role-chip">{role.name}</span>)}</div></td>
                  <td><span className={statusClass(user.status)}>{user.status}</span></td>
                  <td>{user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('id-ID') : '—'}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="button" type="button" onClick={(event) => { event.stopPropagation(); openEdit(user); }}>Edit</button>
                      <button className="button" type="button" onClick={(event) => { event.stopPropagation(); openRoles(user); }}>Roles</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && !modal && (
        <aside className="admin-user-drawer">
          <div className="admin-drawer-header">
            <div>
              <p className="eyebrow">USER DETAIL</p>
              <h2>{selected.user.name}</h2>
              <span className="admin-subtle">@{selected.user.username}</span>
            </div>
            <button className="button" type="button" onClick={() => setSelected(null)}>Close</button>
          </div>
          <div className="admin-drawer-body">
            <div className="admin-detail-status"><span className={statusClass(selected.user.status)}>{selected.user.status}</span></div>
            <dl className="detail-list">
              <dt>Email</dt><dd>{selected.user.email || '—'}</dd>
              <dt>Roles</dt><dd>{selected.roles.length ? selected.roles.map((role) => role.name).join(', ') : 'No role assigned'}</dd>
              <dt>Created</dt><dd>{new Date(selected.user.createdAt).toLocaleString('id-ID')}</dd>
              <dt>Updated</dt><dd>{new Date(selected.user.updatedAt).toLocaleString('id-ID')}</dd>
            </dl>
          </div>
          <div className="admin-drawer-actions">
            <button className="secondary-button" type="button" onClick={() => openEdit(selected.user)}>Edit User</button>
            <button className="secondary-button" type="button" onClick={() => openRoles(selected.user)}>Assign Roles</button>
            <button className="secondary-button" type="button" onClick={() => toggleStatus(selected.user)}>{selected.user.status === 'ACTIVE' ? 'Inactivate User' : 'Activate User'}</button>
          </div>
        </aside>
      )}

      {modal?.type !== 'roles' && modal && (
        <div className="modal-backdrop">
          <div className="modal-card admin-user-modal">
            <div className="modal-header">
              <div><p className="eyebrow">ADMIN / USER MANAGEMENT</p><h2>{modal.type === 'create' ? 'Add User' : 'Edit User'}</h2></div>
              <button className="button" type="button" disabled={submitting} onClick={() => setModal(null)}>Close</button>
            </div>
            <form className="entity-form" onSubmit={submitUser}>
              <label>Username<input value={form.username} onChange={(event) => updateField('username', event.target.value)} disabled={modal.type === 'edit'} required /></label>
              <label>Name<input value={form.name} onChange={(event) => updateField('name', event.target.value)} required /></label>
              <label>Email<input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} /></label>
              <label>Password<input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder={modal.type === 'edit' ? 'Leave blank to keep current password' : 'Minimum 8 characters'} required={modal.type === 'create'} /></label>
              {modal.type === 'edit' && <label>Status<select value={form.status} onChange={(event) => updateField('status', event.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>}
              {formError && <div className="form-error">{formError}</div>}
              <div className="modal-actions"><button className="secondary-button" type="button" disabled={submitting} onClick={() => setModal(null)}>Cancel</button><button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save User'}</button></div>
            </form>
          </div>
        </div>
      )}

      {modal?.type === 'roles' && (
        <div className="modal-backdrop">
          <div className="modal-card admin-user-modal">
            <div className="modal-header">
              <div><p className="eyebrow">USER MANAGEMENT</p><h2>Assign Roles</h2><p className="page-description">{modal.user.name} (@{modal.user.username})</p></div>
              <button className="button" type="button" disabled={submitting} onClick={() => setModal(null)}>Close</button>
            </div>
            <form className="entity-form" onSubmit={submitRoles}>
              <div className="admin-role-options">
                {roles.map((role) => (
                  <label key={role.id} className="admin-role-option">
                    <input type="checkbox" checked={roleIds.includes(role.id)} onChange={() => toggleRole(role.id)} />
                    <span><strong>{role.name}</strong><small>{role.code}</small></span>
                  </label>
                ))}
              </div>
              {formError && <div className="form-error">{formError}</div>}
              <div className="modal-actions"><button className="secondary-button" type="button" disabled={submitting} onClick={() => setModal(null)}>Cancel</button><button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Roles'}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
