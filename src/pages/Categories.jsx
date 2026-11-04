import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import CategoryForm from '../components/CategoryForm.jsx'
import DeleteCategoryModal from '../components/DeleteCategoryModal.jsx'
import Modal from '../components/Modal.jsx'
import StatisticCard from '../components/StatisticCard.jsx'
import { formatDate, plural } from '../format.js'
import { createCategory, deleteCategory, getCategories, getProducts, updateCategory } from '../services/inventoryService.js'

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'products-desc', label: 'Products (most first)' },
  { value: 'products-asc', label: 'Products (fewest first)' },
]

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [emptyOnly, setEmptyOnly] = useState(false)
  const [sortBy, setSortBy] = useState('name-asc')

  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [modalError, setModalError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    const [c, p] = await Promise.all([getCategories(), getProducts()])
    setCategories(c)
    setProducts(p)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      await refresh()
    } catch {
      setError('Couldn’t load categories. Check your connection and try again.')
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

  // Product counts are calculated from the products themselves, never stored.
  const counts = useMemo(() => {
    const result = {}
    for (const p of products) result[p.categoryId] = (result[p.categoryId] || 0) + 1
    return result
  }, [products])

  const activeCount = categories.filter((c) => c.status === 'active').length
  const inactiveCount = categories.filter((c) => c.status === 'inactive').length
  const emptyCount = categories.filter((c) => !counts[c.id]).length

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = categories.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false
      if (statusFilter && c.status !== statusFilter) return false
      if (emptyOnly && counts[c.id]) return false
      return true
    })
    const [field, dir] = sortBy.split('-')
    const sign = dir === 'asc' ? 1 : -1
    return filtered.sort((a, b) => {
      if (field === 'name') return a.name.localeCompare(b.name) * sign
      const diff = ((counts[a.id] || 0) - (counts[b.id] || 0)) * sign
      return diff || a.name.localeCompare(b.name)
    })
  }, [categories, counts, query, statusFilter, emptyOnly, sortBy])

  function openModal(target) {
    setModalError('')
    setEditing(target)
  }

  async function handleSave(values) {
    const isNew = editing === 'new'
    setBusy(true)
    setModalError('')
    try {
      if (isNew) await createCategory(values)
      else await updateCategory(editing.id, values)
      await refresh()
      setEditing(null)
      setNotice(isNew ? `Category “${values.name}” added.` : `Category “${values.name}” updated.`)
    } catch (err) {
      setModalError(err.message || 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(resolution) {
    const category = deleting
    setBusy(true)
    setModalError('')
    try {
      const result = await deleteCategory(category.id, resolution)
      await refresh()
      setDeleting(null)
      if (result.action === 'move') {
        const target = categories.find((c) => c.id === resolution.targetCategoryId)
        setNotice(`“${category.name}” deleted. ${plural(result.count, 'product')} moved to “${target?.name}”.`)
      } else if (result.action === 'delete') {
        setNotice(`“${category.name}” deleted along with ${plural(result.count, 'product')}.`)
      } else {
        setNotice(`“${category.name}” deleted.`)
      }
    } catch (err) {
      setModalError(err.message || 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const stat = (value) => (loading || error ? '–' : value)

  const noFilters = statusFilter === '' && !emptyOnly
  return (
    <>
      <header className="page-head">
        <div>
          <h1>Categories</h1>
          <p className="sub">Manage and organize your inventory categories.</p>
        </div>
        <button className="btn primary" onClick={() => openModal('new')} disabled={loading || !!error}>
          + Add Category
        </button>
      </header>

      <div className="statistic-cards">
        <StatisticCard
          label="Total Categories"
          value={stat(categories.length)}
          active={noFilters}
          onClick={() => {
            setStatusFilter('')
            setEmptyOnly(false)
          }}
        />
        <StatisticCard
          label="Active Categories"
          value={stat(activeCount)}
          tone="ok"
          active={statusFilter === 'active'}
          onClick={() => setStatusFilter(statusFilter === 'active' ? '' : 'active')}
        />
        <StatisticCard
          label="Inactive Categories"
          value={stat(inactiveCount)}
          tone="warn"
          active={statusFilter === 'inactive'}
          onClick={() => setStatusFilter(statusFilter === 'inactive' ? '' : 'inactive')}
        />
        <StatisticCard
          label="Empty Categories"
          value={stat(emptyCount)}
          tone='alert'
          active={emptyOnly}
          onClick={() => setEmptyOnly(!emptyOnly)}
        />
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search categories by name"
          aria-label="Search categories"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select aria-label="Sort categories" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
          <div className="skeleton" aria-busy="true" aria-label="Loading categories">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <p>{categories.length === 0 ? 'No categories yet.' : 'No categories match these filters.'}</p>
            {categories.length === 0 ? (
              <button className="btn primary" onClick={() => openModal('new')}>Add your first category</button>
            ) : (
              <button
                className="btn"
                onClick={() => {
                  setQuery('')
                  setStatusFilter('')
                  setEmptyOnly(false)
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
                  <th><span className="th-text">Category</span></th>
                  <th><span className="th-text">Description</span></th>
                  <th><span className="th-text">Products</span></th>
                  <th><span className="th-text">Status</span></th>
                  <th><span className="th-text">Created At</span></th>
                  <th className="right"><span className="th-text">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="cat-name">
                        <span className="cat-dot" style={{ background: item.color }} aria-hidden="true" />
                        <span className="name">{item.name}</span>
                      </span>
                    </td>
                    <td className="desc" title={item.description}>
                      {item.description || <span className="muted">No description</span>}
                    </td>
                    <td className="num">{counts[item.id] || 0}</td>
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
        <Modal title={editing === 'new' ? 'Add category' : 'Edit category'} onClose={() => setEditing(null)}>
          <CategoryForm
            category={editing === 'new' ? null : editing}
            categories={categories}
            saving={busy}
            error={modalError}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleting && (
        <DeleteCategoryModal
          category={deleting}
          products={products.filter((p) => p.categoryId === deleting.id)}
          otherCategories={categories.filter((c) => c.id !== deleting.id)}
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
