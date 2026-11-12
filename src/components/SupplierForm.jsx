import { useState } from 'react'
import { normalizeName } from '../format.js'

const LIMITS = { name: 60, contactName: 60, city: 40, notes: 200 }
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[0-9\s().-]{6,20}$/

function validate(values, suppliers, editingId) {
  const errors = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Enter a supplier name.'
  else if (name.length > LIMITS.name) errors.name = `Use ${LIMITS.name} characters or fewer.`
  else if (suppliers.some((s) => s.id !== editingId && normalizeName(s.name) === normalizeName(name))) {
    errors.name = 'A supplier with this name already exists.'
  }
  if (values.contactName.trim().length > LIMITS.contactName) errors.contactName = `Use ${LIMITS.contactName} characters or fewer.`
  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email, like name@company.com.'
  if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) errors.phone = 'Use digits, spaces and + only (6 to 20 characters).'
  if (values.city.trim().length > LIMITS.city) errors.city = `Use ${LIMITS.city} characters or fewer.`
  if (values.notes.length > LIMITS.notes) errors.notes = `Use ${LIMITS.notes} characters or fewer.`
  return errors
}

const EMPTY = { name: '', contactName: '', email: '', phone: '', city: '', notes: '', status: 'active' }

export default function SupplierForm({ supplier, suppliers, saving, error, onSubmit, onCancel }) {
  const [values, setValues] = useState(
    supplier
      ? {
          name: supplier.name,
          contactName: supplier.contactName,
          email: supplier.email,
          phone: supplier.phone,
          city: supplier.city,
          notes: supplier.notes,
          status: supplier.status,
        }
      : EMPTY
  )
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  function handleSubmit(e) {
    e.preventDefault()
    const found = validate(values, suppliers, supplier?.id)
    setErrors(found)
    if (Object.keys(found).length) return
    onSubmit({
      name: values.name.trim(),
      contactName: values.contactName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      city: values.city.trim(),
      notes: values.notes.trim(),
      status: values.status,
    })
  }

  const field = (key, label, input) => (
    <div className="field">
      <label htmlFor={`s-${key}`}>{label}</label>
      {input}
      {errors[key] && <p className="field-error">{errors[key]}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} noValidate>
      {field('name', 'Supplier name', <input id="s-name" value={values.name} onChange={set('name')} autoFocus />)}

      <div className="row">
        {field('contactName', 'Contact person (optional)', <input id="s-contactName" value={values.contactName} onChange={set('contactName')} />)}
        {field('city', 'City (optional)', <input id="s-city" value={values.city} onChange={set('city')} />)}
      </div>

      <div className="row">
        {field('email', 'Email (optional)', <input id="s-email" type="email" value={values.email} onChange={set('email')} />)}
        {field('phone', 'Phone (optional)', <input id="s-phone" type="tel" value={values.phone} onChange={set('phone')} />)}
      </div>

      {field(
        'status',
        'Status',
        <select id="s-status" value={values.status} onChange={set('status')}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      )}

      <div className="field">
        <label htmlFor="s-notes">Notes (optional)</label>
        <textarea id="s-notes" rows={3} value={values.notes} onChange={set('notes')} />
        <p className={errors.notes ? 'field-error' : 'hint'}>{errors.notes || `${values.notes.length}/${LIMITS.notes}`}</p>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving…' : supplier ? 'Save changes' : 'Add supplier'}
        </button>
      </div>
    </form>
  )
}
