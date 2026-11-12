import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import DeleteSupplierModal from '../components/DeleteSupplierModal.jsx'
import Modal from '../components/Modal.jsx'
import StatisticCard from '../components/StatisticCard.jsx'
import SupplierForm from '../components/SupplierForm.jsx'
import { formatDate, plural } from '../format.js'
import { stockStatus } from '../lib.js'
import { createSupplier, deleteSupplier, getProducts, getSuppliers, updateSupplier } from '../services/inventoryService.js'

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'products-desc', label: 'Products (most first)' },
  { value: 'products-asc', label: 'Products (fewest first)' },
]

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // '' | 'active' | 'inactive'
  const [reorderOnly, setReorderOnly] = useState(false)
  const [sortBy, setSortBy] = useState('name-asc')

  const [editing, setEditing] = useState(null) // null | 'new' | supplier
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [modalError, setModalError] = useState('')
  const [notice, setNotice] = useState('')

  // Loads both lists. Everything on the page is derived from these two, so one reload updates it all.
  const refresh = useCallback(async () => {
    const [s, p] = await Promise.all([getSuppliers(), getProducts()])
    setSuppliers(s)
    setProducts(p)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await refresh()
    } catch {
      setError('Couldn’t load suppliers. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [refresh])

  useEffect(() => {
    load()
  }, [load])

  // The success message disappears by itself.
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])

  // Both numbers are calculated from the products themselves, never stored.
  //   counts[id] = how many products the supplier supplies
  //   lowCounts[id] = how many of them are low or out of stock
  const { counts, lowCounts } = useMemo(() => {
    const counts = {}
    const lowCounts = {}
    for (const p of products) {
      counts[p.supplierId] = (counts[p.supplierId] || 0) + 1
      if (stockStatus(p) !== 'ok') lowCounts[p.supplierId] = (lowCounts[p.supplierId] || 0) + 1
    }
    return { counts, lowCounts }
  }, [products])

  const activeCount = suppliers.filter((s) => s.status === 'active').length
  const inactiveCount = suppliers.filter((s) => s.status === 'inactive').length
  const reorderCount = suppliers.filter((s) => lowCounts[s.id]).length

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = suppliers.filter((s) => {
      if (q && !`${s.name} ${s.contactName} ${s.email}`.toLowerCase().includes(q)) return false
      if (statusFilter && s.status !== statusFilter) return false
      if (reorderOnly && !lowCounts[s.id]) return false
      return true
    })
    const [field, dir] = sortBy.split('-')
    const sign = dir === 'asc' ? 1 : -1
    return filtered.sort((a, b) => {
      if (field === 'name') return a.name.localeCompare(b.name) * sign
      const diff = ((counts[a.id] || 0) - (counts[b.id] || 0)) * sign
      return diff || a.name.localeCompare(b.name)
    })
  }, [suppliers, counts, lowCounts, query, statusFilter, reorderOnly, sortBy])

  function openModal(target) {
    setModalError('')
    setEditing(target)
  }

  async function handleSave(values) {
    const isNew = editing === 'new'
    setBusy(true)
    setModalError('')
    try {
      if (isNew) await createSupplier(values)
      else await updateSupplier(editing.id, values)
      await refresh()
      setEditing(null)
      setNotice(isNew ? `Supplier “${values.name}” added.` : `Supplier “${values.name}” updated.`)
    } catch (err) {
      setModalError(err.message || 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(resolution) {
    const supplier = deleting
    setBusy(true)
    setModalError('')
    try {
      const result = await deleteSupplier(supplier.id, resolution)
      await refresh()
      setDeleting(null)
      if (result.action === 'move') {
        const target = suppliers.find((s) => s.id === resolution.targetSupplierId)
        setNotice(`“${supplier.name}” deleted. ${plural(result.count, 'product')} moved to “${target?.name}”.`)
      } else if (result.action === 'delete') {
        setNotice(`“${supplier.name}” deleted along with ${plural(result.count, 'product')}.`)
      } else {
        setNotice(`“${supplier.name}” deleted.`)
      }
    } catch (err) {
      setModalError(err.message || 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const stat = (value) => (loading || error ? '–' : value)
  const noFilters = statusFilter === '' && !reorderOnly

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Suppliers</h1>
          <p className="sub">Manage your suppliers and see who you need to reorder from.</p>
        </div>
        <button className="btn primary" onClick={() => openModal('new')} disabled={loading || !!error}>
          + Add Supplier
        </button>
      </header>

      <div className="statistic-cards">
        <StatisticCard
          label="Total Suppliers"
          value={stat(suppliers.length)}
          active={noFilters}
          onClick={() => {
            setStatusFilter('')
            setReorderOnly(false)
          }}
        />
        <StatisticCard
          label="Active Suppliers"
          value={stat(activeCount)}
          tone="ok"
          active={statusFilter === 'active'}
          onClick={() => setStatusFilter(statusFilter === 'active' ? '' : 'active')}
        />
        <StatisticCard
          label="Inactive Suppliers"
          value={stat(inactiveCount)}
          tone="warn"
          active={statusFilter === 'inactive'}
          onClick={() => setStatusFilter(statusFilter === 'inactive' ? '' : 'inactive')}
        />
        <StatisticCard
          label="Suppliers to Reorder From"
          value={stat(reorderCount)}
          tone={reorderCount > 0 ? 'alert' : 'neutral'}
          note={loading || error ? undefined : reorderCount > 0 ? 'Have low or out-of-stock products' : 'Nothing to reorder'}
          active={reorderOnly}
          onClick={() => setReorderOnly(!reorderOnly)}
        />
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name, contact or email"
          aria-label="Search suppliers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select aria-label="Sort suppliers" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="panel">
        {error ? (
          <div className="empty">
            <p>{error}</p>
            <button className="btn" onClick={load}>Try again</button>
          </div>
        ) : loading ? (
          <div className="skeleton" aria-busy="true" aria-label="Loading suppliers">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <p>{suppliers.length === 0 ? 'No suppliers yet.' : 'No suppliers match these filters.'}</p>
            {suppliers.length === 0 ? (
              <button className="btn primary" onClick={() => openModal('new')}>Add your first supplier</button>
            ) : (
              <button
                className="btn"
                onClick={() => {
                  setQuery('')
                  setStatusFilter('')
                  setReorderOnly(false)
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th><span className="th-text">Supplier</span></th>
                  <th><span className="th-text">Contact</span></th>
                  <th><span className="th-text">Products</span></th>
                  <th><span className="th-text" title="Products that are low or out of stock">Low Stock</span></th>
                  <th><span className="th-text">Status</span></th>
                  <th><span className="th-text">Created At</span></th>
                  <th className="right"><span className="th-text">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="name">{item.name}</div>
                      <div className="sku">{[item.contactName, item.city].filter(Boolean).join(' · ') || 'No contact person'}</div>
                    </td>
                    <td>
                      {item.email || item.phone ? (
                        <>
                          {item.email && <div>{item.email}</div>}
                          {item.phone && <div className="sku">{item.phone}</div>}
                        </>
                      ) : (
                        <span className="muted">No contact info</span>
                      )}
                    </td>
                    <td className="num">{counts[item.id] || 0}</td>
                    <td className="num">
                      {lowCounts[item.id] ? <span className="low-count">{lowCounts[item.id]}</span> : <span className="muted">0</span>}
                    </td>
                    <td>
                      <span className={`badge ${item.status}`}>{item.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="num">{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn small" onClick={() => openModal(item)}>Edit</button>
                        <button
                          className="btn small icon-danger"
                          aria-label={`Delete ${item.name}`}
                          title="Delete"
                          onClick={() => {
                            setModalError('')
                            setDeleting(item)
                          }}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add supplier' : 'Edit supplier'} onClose={() => setEditing(null)}>
          <SupplierForm
            supplier={editing === 'new' ? null : editing}
            suppliers={suppliers}
            saving={busy}
            error={modalError}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleting && (
        <DeleteSupplierModal
          supplier={deleting}
          products={products.filter((p) => p.supplierId === deleting.id)}
          otherSuppliers={suppliers.filter((s) => s.id !== deleting.id)}
          busy={busy}
          error={modalError}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </>
  )
}
