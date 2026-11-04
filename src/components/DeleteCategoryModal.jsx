import { useState } from 'react'
import Modal from './Modal.jsx'
import { plural } from '../format.js'

const PREVIEW_LIMIT = 5

export default function DeleteCategoryModal({ category, products, otherCategories, busy, error, onConfirm, onCancel }) {
  const count = products.length
  const [choice, setChoice] = useState('') // '' | 'move' | 'delete'
  const [target, setTarget] = useState('')

  // Normal confirmation: the category is empty.
  if (count === 0) {
    return (
      <Modal title="Delete category" onClose={onCancel}>
        <p className="confirm">
          Delete <strong>{category.name}</strong>? It has no products. This can’t be undone.
        </p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="actions">
          <button className="btn" onClick={onCancel}>Keep category</button>
          <button className="btn danger-solid" onClick={() => onConfirm({})} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete category'}
          </button>
        </div>
      </Modal>
    )
  }

  // The category still has products: the user must choose what happens to them.
  const noOthers = otherCategories.length === 0
  const targetName = otherCategories.find((c) => c.id === target)?.name
  const canConfirm = choice === 'delete' || (choice === 'move' && target !== '')

  const confirmLabel =
    choice === 'move'
      ? `Move ${plural(count, 'product')} and delete category`
      : choice === 'delete'
        ? `Delete category and ${plural(count, 'product')}`
        : 'Delete category'

  function handleConfirm() {
    onConfirm(choice === 'move' ? { action: 'move', targetCategoryId: target } : { action: 'delete' })
  }

  return (
    <Modal title="Delete category" onClose={onCancel}>
      <p className="confirm">
        <strong>{category.name}</strong> has {plural(count, 'product')}. Choose what happens to them before the category is deleted.
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
            <span className="choice-title">Move the products to another category</span>
            <span className="choice-desc">
              {noOthers
                ? 'There is no other category to move them to. Create one first.'
                : target
                  ? `All ${plural(count, 'product')} will move to “${targetName}”. Only the category “${category.name}” is deleted, and no product is lost.`
                  : 'Pick a category below. The products keep all their data, only their category changes.'}
            </span>
          </span>
        </label>
        {choice === 'move' && (
          <div className="choice-extra">
            <select aria-label="Move products to" value={target} onChange={(e) => setTarget(e.target.value)} autoFocus>
              <option value="">Choose a category…</option>
              {otherCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.status === 'inactive' ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className={`choice danger${choice === 'delete' ? ' selected' : ''}`}>
          <input type="radio" name="resolution" checked={choice === 'delete'} onChange={() => setChoice('delete')} />
          <span className="choice-body">
            <span className="choice-title">Delete the products along with the category</span>
            <span className="choice-desc">
              {plural(count, 'product')} will be permanently deleted together with “{category.name}”. This can’t be undone.
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
        <button className="btn" onClick={onCancel}>Keep category</button>
        <button className="btn danger-solid" onClick={handleConfirm} disabled={!canConfirm || busy}>
          {busy ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
