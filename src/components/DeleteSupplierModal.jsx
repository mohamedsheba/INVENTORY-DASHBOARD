import { useState } from 'react'
import Modal from './Modal.jsx'
import { plural } from '../format.js'

const PREVIEW_LIMIT = 5

export default function DeleteSupplierModal({ supplier, products, otherSuppliers, busy, error, onConfirm, onCancel }) {
  const count = products.length
  const [choice, setChoice] = useState('') // '' | 'move' | 'delete'
  const [target, setTarget] = useState('')

  // Normal confirmation: the supplier has no products.
  if (count === 0) {
    return (
      <Modal title="Delete supplier" onClose={onCancel}>
        <p className="confirm">
          Delete <strong>{supplier.name}</strong>? It has no products. This can’t be undone.
        </p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="actions">
          <button className="btn" onClick={onCancel}>Keep supplier</button>
          <button className="btn danger-solid" onClick={() => onConfirm({})} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete supplier'}
          </button>
        </div>
      </Modal>
    )
  }

  // The supplier still has products: the user must choose what happens to them.
  const noOthers = otherSuppliers.length === 0
  const targetName = otherSuppliers.find((s) => s.id === target)?.name
  const canConfirm = choice === 'delete' || (choice === 'move' && target !== '')

  const confirmLabel =
    choice === 'move'
      ? `Move ${plural(count, 'product')} and delete supplier`
      : choice === 'delete'
        ? `Delete supplier and ${plural(count, 'product')}`
        : 'Delete supplier'

  function handleConfirm() {
    onConfirm(choice === 'move' ? { action: 'move', targetSupplierId: target } : { action: 'delete' })
  }

  return (
    <Modal title="Delete supplier" onClose={onCancel}>
      <p className="confirm">
        <strong>{supplier.name}</strong> supplies {plural(count, 'product')}. Choose what happens to them before the supplier is deleted.
      </p>

      <div className="choices">
        <label className={`choice${choice === 'move' ? ' selected' : ''}${noOthers ? ' disabled' : ''}`}>
          <input
            type="radio"
            name="resolution"
            checked={choice === 'move'}
            disabled={noOthers}
            onChange={() => setChoice('move')}
          />
          <span className="choice-body">
            <span className="choice-title">Move the products to another supplier</span>
            <span className="choice-desc">
              {noOthers
                ? 'There is no other supplier to move them to. Create one first.'
                : target
                  ? `All ${plural(count, 'product')} will be assigned to “${targetName}”. Only the supplier “${supplier.name}” is deleted, and no product is lost.`
                  : 'Pick a supplier below. The products keep all their data, only their supplier changes.'}
            </span>
          </span>
        </label>
        {choice === 'move' && (
          <div className="choice-extra">
            <select aria-label="Move products to" value={target} onChange={(e) => setTarget(e.target.value)} autoFocus>
              <option value="">Choose a supplier…</option>
              {otherSuppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.status === 'inactive' ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className={`choice danger${choice === 'delete' ? ' selected' : ''}`}>
          <input type="radio" name="resolution" checked={choice === 'delete'} onChange={() => setChoice('delete')} />
          <span className="choice-body">
            <span className="choice-title">Delete the products along with the supplier</span>
            <span className="choice-desc">
              {plural(count, 'product')} will be permanently deleted together with “{supplier.name}”. This can’t be undone.
            </span>
          </span>
        </label>
        {choice === 'delete' && (
          <ul className="product-preview">
            {products.slice(0, PREVIEW_LIMIT).map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
            {count > PREVIEW_LIMIT && <li>and {plural(count - PREVIEW_LIMIT, 'more product')}</li>}
          </ul>
        )}
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="actions">
        <button className="btn" onClick={onCancel}>Keep supplier</button>
        <button className="btn danger-solid" onClick={handleConfirm} disabled={!canConfirm || busy}>
          {busy ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
