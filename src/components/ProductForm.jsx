import { useState } from 'react'

const EMPTY = { name: '', sku: '', categoryId: '', supplierId: '', quantity: '0', reorderLevel: '10', price: '' }

function validate(v) {
  const errors = {}
  if (!v.name.trim()) errors.name = 'Enter a product name.'
  if (!v.sku.trim()) errors.sku = 'Enter a SKU.'
  if (!v.categoryId) errors.categoryId = 'Choose a category.'
  if (!v.supplierId) errors.supplierId = 'Choose a supplier.'
  if (v.quantity === '' || Number(v.quantity) < 0 || !Number.isInteger(Number(v.quantity))) errors.quantity = 'Use a whole number, 0 or more.'
  if (v.reorderLevel === '' || Number(v.reorderLevel) < 0 || !Number.isInteger(Number(v.reorderLevel))) errors.reorderLevel = 'Use a whole number, 0 or more.'
  if (v.price === '' || Number(v.price) < 0) errors.price = 'Enter a price of 0 or more.'
  return errors
}

export default function ProductForm({ product, categories, suppliers, saving, onSubmit, onCancel }) {
  const [values, setValues] = useState(
    product
      ? { ...product, quantity: String(product.quantity), reorderLevel: String(product.reorderLevel), price: String(product.price) }
      : EMPTY
  )
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  function handleSubmit(e) {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return
    onSubmit({
      name: values.name.trim(),
      sku: values.sku.trim().toUpperCase(),
      categoryId: values.categoryId,
      supplierId: values.supplierId,
      quantity: Number(values.quantity),
      reorderLevel: Number(values.reorderLevel),
      price: Number(values.price),
    })
  }

  const field = (key, label, input) => (
    <div className="field">
      <label htmlFor={`f-${key}`}>{label}</label>
      {input}
      {errors[key] && <p className="field-error">{errors[key]}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} noValidate>
      {field('name', 'Product name', <input id="f-name" value={values.name} onChange={set('name')} autoFocus />)}
      <div className="row">
        {field('sku', 'SKU', <input id="f-sku" value={values.sku} onChange={set('sku')} />)}
        {field('price', 'Unit price (USD)', <input id="f-price" type="number" min="0" step="0.01" value={values.price} onChange={set('price')} />)}
      </div>
      <div className="row">
        {field(
          'categoryId',
          'Category',
          <select id="f-categoryId" value={values.categoryId} onChange={set('categoryId')}>
            <option value="">Choose…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        {field(
          'supplierId',
          'Supplier',
          <select id="f-supplierId" value={values.supplierId} onChange={set('supplierId')}>
            <option value="">Choose…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>
      <div className="row">
        {field('quantity', 'Quantity on hand', <input id="f-quantity" type="number" min="0" step="1" value={values.quantity} onChange={set('quantity')} />)}
        {field('reorderLevel', 'Reorder level', <input id="f-reorderLevel" type="number" min="0" step="1" value={values.reorderLevel} onChange={set('reorderLevel')} />)}
      </div>
      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving…' : product ? 'Save changes' : 'Add product'}
        </button>
      </div>
    </form>
  )
}
