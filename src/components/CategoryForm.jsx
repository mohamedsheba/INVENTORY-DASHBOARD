import { useState } from 'react'
import { normalizeName } from '../format.js'

// Category identity colors. They are stored on each category and shown as a small square in the table.
export const CATEGORY_COLORS = [
  { name: 'Blue', value: '#2F5D8A' },
  { name: 'Teal', value: '#2A8C8C' },
  { name: 'Green', value: '#2E7D5A' },
  { name: 'Amber', value: '#B7791F' },
  { name: 'Rust', value: '#C0432B' },
  { name: 'Purple', value: '#6B5B95' },
  { name: 'Steel', value: '#566573' },
  { name: 'Ink', value: '#16212B' },
]

const NAME_MAX = 40
const DESCRIPTION_MAX = 160

function validate(values, categories, editingId) {
  const errors = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Enter a category name.'
  else if (name.length > NAME_MAX) errors.name = `Use ${NAME_MAX} characters or fewer.`
  else if (categories.some((c) => c.id !== editingId && normalizeName(c.name) === normalizeName(name))) {
    errors.name = 'A category with this name already exists.'
  }
  if (values.description.length > DESCRIPTION_MAX) errors.description = `Use ${DESCRIPTION_MAX} characters or fewer.`
  return errors
}

export default function CategoryForm({ category, categories, saving, error, onSubmit, onCancel }) {
  const [values, setValues] = useState(
    category
      ? { name: category.name, description: category.description, status: category.status, color: category.color }
      : { name: '', description: '', status: 'active', color: CATEGORY_COLORS[0].value }
  )
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  function handleSubmit(e) {
    e.preventDefault()
    const found = validate(values, categories, category?.id)
    setErrors(found)
    if (Object.keys(found).length) return
    onSubmit({
      name: values.name.trim(),
      description: values.description.trim(),
      status: values.status,
      color: values.color,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="c-name">Category name</label>
        <input id="c-name" value={values.name} onChange={set('name')} maxLength={NAME_MAX + 10} autoFocus />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>

      <div className="field">
        <label htmlFor="c-description">Description (optional)</label>
        <textarea id="c-description" rows={3} value={values.description} onChange={set('description')} />
        <p className={errors.description ? 'field-error' : 'hint'}>
          {errors.description || `${values.description.length}/${DESCRIPTION_MAX}`}
        </p>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="c-status">Status</label>
          <select id="c-status" value={values.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="field">
          <span className="field-label" id="c-color-label">Color</span>
          <div className="swatches" role="group" aria-labelledby="c-color-label">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={values.color === c.value ? 'swatch selected' : 'swatch'}
                style={{ background: c.value }}
                aria-label={c.name}
                aria-pressed={values.color === c.value}
                title={c.name}
                onClick={() => setValues((v) => ({ ...v, color: c.value }))}
              />
            ))}
          </div>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving…' : category ? 'Save changes' : 'Add category'}
        </button>
      </div>
    </form>
  )
}
