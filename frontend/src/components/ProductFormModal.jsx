import './ProductFormModal.css';

function Field({ label, name, values, onChange, required = false, type = 'text', min, step, placeholder, fullWidth = false }) {
  return (
    <label className={fullWidth ? 'product-form-field product-form-field-full' : 'product-form-field'}>
      <span>{label}{required ? ' *' : ''}</span>
      <input
        type={type}
        min={min}
        step={step}
        value={values[name] ?? ''}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

export default function ProductFormModal({
  title,
  description,
  values,
  onChange,
  onSubmit,
  onClose,
  submitting,
  error,
}) {
  const editing = title.toLowerCase().startsWith('edit ');

  return (
    <div className="product-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="product-modal-card" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
        <header className="product-modal-header">
          <div>
            <h2 id="product-form-title">{title}</h2>
            <p>{description}</p>
          </div>
          <button className="product-modal-close" type="button" onClick={onClose} disabled={submitting} aria-label="Close form">×</button>
        </header>

        <form onSubmit={onSubmit}>
          <div className="product-form-layout">
            <div className="product-form-main">
              <section className="product-form-section">
                <h3>Product Information</h3>
                <div className="product-form-grid">
                  <Field label="SKU" name="sku" values={values} onChange={onChange} required placeholder="e.g. AKR-PLT-001" />
                  <Field label="Product Name" name="name" values={values} onChange={onChange} required placeholder="e.g. Acrylic Sheet 3mm" />
                  <Field label="Category" name="category" values={values} onChange={onChange} placeholder="e.g. Acrylic Sheet" />
                  <Field label="Unit" name="unit" values={values} onChange={onChange} required placeholder="e.g. pcs, sheet" />
                </div>
              </section>

              <section className="product-form-section">
                <h3>Product Specification</h3>
                <div className="product-form-grid">
                  <Field label="Material" name="material" values={values} onChange={onChange} placeholder="e.g. Acrylic" />
                  <Field label="Color" name="color" values={values} onChange={onChange} placeholder="e.g. Clear, White, Black" />
                  <Field label="Thickness (mm)" name="thickness" values={values} onChange={onChange} placeholder="e.g. 3" />
                  <div className="product-form-field">
                    <span>Dimension (cm)</span>
                    <div className="dimension-fields">
                      <input type="number" min="0" step="0.01" value={values.lengthCm ?? ''} onChange={(event) => onChange('lengthCm', event.target.value)} placeholder="Length" aria-label="Length" />
                      <span>×</span>
                      <input type="number" min="0" step="0.01" value={values.widthCm ?? ''} onChange={(event) => onChange('widthCm', event.target.value)} placeholder="Width" aria-label="Width" />
                      <span>×</span>
                      <input type="number" min="0" step="0.01" value={values.heightCm ?? ''} onChange={(event) => onChange('heightCm', event.target.value)} placeholder="Height" aria-label="Height" />
                    </div>
                  </div>
                  <Field label="Specification" name="specification" values={values} onChange={onChange} placeholder="e.g. acrylic sheet, laser cut, UV print, etc." fullWidth />
                </div>
              </section>

              <section className="product-form-section">
                <h3>Pricing &amp; Stock</h3>
                <div className="product-form-grid product-form-grid-three">
                  <Field label="Standard Purchase Price" name="standardPurchasePrice" values={values} onChange={onChange} type="number" min="0" step="0.01" placeholder="0" />
                  <Field label="Standard Selling Price" name="standardPrice" values={values} onChange={onChange} required type="number" min="0" step="0.01" placeholder="0" />
                  <Field label="Initial Stock" name="initialStock" values={values} onChange={onChange} type="number" min="0" step="0.01" placeholder="0" />
                </div>
              </section>

              <section className="product-form-section">
                <h3>Additional Information</h3>
                <label className="product-form-field product-form-field-full">
                  <span>Description</span>
                  <textarea rows="3" value={values.description ?? ''} onChange={(event) => onChange('description', event.target.value)} placeholder="Enter product description (optional)" />
                </label>
                {editing && (
                  <label className="product-form-field">
                    <span>Status</span>
                    <select value={values.status ?? 'ACTIVE'} onChange={(event) => onChange('status', event.target.value)}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </label>
                )}
              </section>
            </div>

            <aside className="product-form-side">
              <section className="product-form-section product-image-section">
                <h3>Product Image</h3>
                <div className="product-image-preview">
                  {values.imageUrl ? <img src={values.imageUrl} alt="Product preview" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span>No image selected</span>}
                </div>
                <label className="product-form-field product-form-field-full">
                  <span>Image URL</span>
                  <input type="url" value={values.imageUrl ?? ''} onChange={(event) => onChange('imageUrl', event.target.value)} placeholder="https://..." />
                </label>
              </section>

              <section className="product-form-section">
                <h3>Website &amp; SEO</h3>
                <label className="product-checkbox">
                  <input type="checkbox" checked={Boolean(values.publishToWebsite)} onChange={(event) => onChange('publishToWebsite', event.target.checked)} />
                  <span>
                    <strong>Publish to Website</strong>
                    <small>Make this product visible on the website when the website integration is linked.</small>
                  </span>
                </label>
                <label className="product-form-field product-form-field-full">
                  <span>Meta SEO Keywords</span>
                  <textarea rows="3" value={values.metaSeoKeywords ?? ''} onChange={(event) => onChange('metaSeoKeywords', event.target.value)} placeholder="e.g. akrilik, neon box, huruf timbul, display, custom" />
                  <small>Enter keywords separated by comma.</small>
                </label>
              </section>
            </aside>
          </div>

          {error && <div className="product-form-error" role="alert">{error}</div>}
          <footer className="product-modal-actions">
            <button className="secondary-button" type="button" onClick={onClose} disabled={submitting}>Cancel</button>
            <button className="primary-button" type="submit" disabled={submitting}>{submitting ? (editing ? 'Updating…' : 'Creating…') : (editing ? 'Update Product' : 'Create Product')}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
