import './EntityFormModal.css';

export default function EntityFormModal({ title, description, fields, values, onChange, onSubmit, onClose, submitting, error }) {
  const editing = title.toLowerCase().startsWith('edit ');

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="entity-form-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">MASTER DATA</p>
            <h2 id="entity-form-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-grid">
            {fields.map((field) => (
              <label className={field.fullWidth ? 'form-field form-field-full' : 'form-field'} key={field.name}>
                <span>{field.label}{field.required ? ' *' : ''}</span>
                {field.type === 'select' ? (
                  <select value={values[field.name] ?? ''} onChange={(event) => onChange(field.name, event.target.value)} required={field.required}>
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {field.options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea rows="3" value={values[field.name] ?? ''} onChange={(event) => onChange(field.name, event.target.value)} required={field.required} />
                ) : (
                  <input type={field.type || 'text'} min={field.min} step={field.step} value={values[field.name] ?? ''} onChange={(event) => onChange(field.name, event.target.value)} required={field.required} />
                )}
              </label>
            ))}
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={submitting}>Cancel</button>
            <button className="primary-button" type="submit" disabled={submitting}>{submitting ? (editing ? 'Updating…' : 'Creating…') : (editing ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
