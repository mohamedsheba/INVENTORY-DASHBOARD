import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal.jsx'
import ProductForm from '../components/ProductForm.jsx'
import StockGauge from '../components/StockGauge.jsx'
import { createProduct, deleteProduct, getCategories, getProducts, getSuppliers, updateProduct } from '../services/inventoryService.js'
import { money, STATUS_LABEL, stockStatus } from '../lib.js'
import StatisticCard from '../components/StatisticCard.jsx'

const PAGE_SIZE = 6

const COLUMNS = [
	{ key: 'name', label: 'Product' },
	{ key: 'category', label: 'Category' },
	{ key: 'supplier', label: 'Supplier' },
	{ key: 'quantity', label: 'Stock' },
	{ key: 'price', label: 'Price', align: 'right' },
]

export default function Products() {
	const [products, setProducts] = useState([])
	const [categories, setCategories] = useState([])
	const [suppliers, setSuppliers] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	const [query, setQuery] = useState('')
	const [supplierFilter, setSupplierFilter] = useState('')
	const [categoryFilter, setCategoryFilter] = useState('')
	const [statusFilter, setStatusFilter] = useState('')
	const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
	const [page, setPage] = useState(1)

	const [editing, setEditing] = useState(null)
	const [deleting, setDeleting] = useState(null)
	const [busy, setBusy] = useState(false)

	const load = useCallback(async () => {
		setLoading(true)
		setError('')
		try {
			const [p, c, s] = await Promise.all([getProducts(), getCategories(), getSuppliers()])
			setProducts(p)
			setCategories(c)
			setSuppliers(s)
		} catch {
			setError('Couldn’t load products. Check your connection and try again.')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		load()
	}, [load])

	const categoryName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories])
	const supplierName = useMemo(() => Object.fromEntries(suppliers.map((s) => [s.id, s.name])), [suppliers])

	const rows = useMemo(() => {
		const q = query.trim().toLowerCase()
		const filtered = products.filter((item) => {
			if (q && !`${item.name} ${item.sku}`.toLowerCase().includes(q)) return false
			if (supplierFilter && item.supplierId !== supplierFilter) return false
			if (categoryFilter && item.categoryId !== categoryFilter) return false
			if (statusFilter && stockStatus(item) !== statusFilter) return false
			return true
		})
		const value = (item) => {
			if (sort.key === 'category') return categoryName[item.categoryId] ?? ''
			if (sort.key === 'supplier') return supplierName[item.supplierId] ?? ''
			return item[sort.key]
		}
		const dir = sort.dir === 'asc' ? 1 : -1
		return filtered.sort((a, b) => {
			const x = value(a)
			const y = value(b)
			return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * dir
		})
	}, [products, query, supplierFilter, categoryFilter, statusFilter, sort, categoryName, supplierName])

	const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
	const safePage = Math.min(page, pageCount)
	const visible = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

	const resetPage = (fn) => (e) => {
		fn(e.target.value)
		setPage(1)
	}

	function toggleSort(key) {
		setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
	}

	function filterByStatus(status) {
		setStatusFilter((current) => (current === status ? '' : status))
		setPage(1)
	}

	async function handleSave(values) {
		setBusy(true)
		try {
			if (editing === 'new') {
				const created = await createProduct(values)
				setProducts((list) => [created, ...list])
			} else {
				const updated = await updateProduct(editing.id, values)
				setProducts((list) => list.map((item) => (item.id === updated.id ? updated : item)))
			}
			setEditing(null)
		} finally {
			setBusy(false)
		}
	}

	async function handleDelete() {
		setBusy(true)
		try {
			await deleteProduct(deleting.id)
			setProducts((list) => list.filter((item) => item.id !== deleting.id))
			setDeleting(null)
		} finally {
			setBusy(false)
		}
	}

	const okCount = products.filter((item) => stockStatus(item) === 'ok').length
	const lowCount = products.filter((item) => stockStatus(item) === 'low').length
	const outCount = products.filter((item) => stockStatus(item) === 'out').length

	return (
		<>
			<header className="page-head">
				<div>
					<h1>Products</h1>
					{!loading && !error && (
						<p className="sub">
							Mange and track all your inventory products
						</p>
					)}
				</div>
				<button className="btn primary" onClick={() => setEditing('new')} disabled={loading || !!error}>
					Add product
				</button>
			</header>
			<div className="statistic-cards">
				<StatisticCard
					label="Total products"
					value={products.length}
					active={statusFilter === ''}
					onClick={() => { setStatusFilter(''); setPage(1) }}
				/>
				<StatisticCard
					label="In stock"
					value={okCount + lowCount}
					tone="ok"
					active={statusFilter === 'ok'}
					onClick={() => filterByStatus('ok')}
				/>
				<StatisticCard
					label="Low stock"
					value={lowCount}
					tone="warn"
					active={statusFilter === 'low'}
					onClick={() => filterByStatus('low')}
				/>
				<StatisticCard
					label="Out of stock"
					value={outCount}
					tone="alert"
					active={statusFilter === 'out'}
					onClick={() => filterByStatus('out')}
				/>
			</div>

			<div className="toolbar">
				<input
					type="search"
					placeholder="Search by name or SKU"
					aria-label="Search products"
					value={query}
					onChange={resetPage(setQuery)}
				/>
				<select aria-label="Filter by supplier" value={supplierFilter} onChange={resetPage(setSupplierFilter)}>
					<option value="">All suppliers</option>
					{suppliers.map((s) => (
						<option key={s.id} value={s.id}>{s.name}</option>
					))}
				</select>
				<select aria-label="Filter by category" value={categoryFilter} onChange={resetPage(setCategoryFilter)}>
					<option value="">All categories</option>
					{categories.map((c) => (
						<option key={c.id} value={c.id}>{c.name}</option>
					))}
				</select>
				<select aria-label="Filter by stock status" value={statusFilter} onChange={resetPage(setStatusFilter)}>
					<option value="">Any stock level</option>
					<option value="ok">In stock</option>
					<option value="low">Low stock</option>
					<option value="out">Out of stock</option>
				</select>
			</div>

			<div className="panel">
				{error ? (
					<div className="empty">
						<p>{error}</p>
						<button className="btn" onClick={load}>Try again</button>
					</div>
				) : loading ? (
					<div className="skeleton" aria-busy="true" aria-label="Loading products">
						{Array.from({ length: 6 }).map((_, i) => (
							<span key={i} />
						))}
					</div>
				) : rows.length === 0 ? (
					<div className="empty">
						<p>{products.length === 0 ? 'No products yet.' : 'No products match these filters.'}</p>
						{products.length === 0 ? (
							<button className="btn primary" onClick={() => setEditing('new')}>Add your first product</button>
						) : (
							<button
								className="btn"
								onClick={() => {
									setQuery('')
									setSupplierFilter('')
									setCategoryFilter('')
									setStatusFilter('')
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
									{COLUMNS.map((col) => (
										<th
											key={col.key}
											className={col.align === 'right' ? 'right' : ''}
											aria-sort={sort.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
										>
											<button className="sort" onClick={() => toggleSort(col.key)}>
												{col.label}
												<span className="arrow" aria-hidden="true">
													{sort.key === col.key ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
												</span>
											</button>
										</th>
									))}
									<th><span className="visually-hidden">Actions</span></th>
								</tr>
							</thead>
							<tbody>
								{visible.map((item) => (
									<tr key={item.id}>
										<td>
											<div className="name">{item.name}</div>
											<div className="sku">{item.sku}</div>
										</td>
										<td data-label="Category">{categoryName[item.categoryId]}</td>
										<td data-label="Supplier">{supplierName[item.supplierId]}</td>
										<td data-label="Stock">
											<StockGauge product={item} />
											<span className={`status ${stockStatus(item)}`}>{STATUS_LABEL[stockStatus(item)]}</span>
										</td>
										<td className="right num" data-label="Price">{money.format(item.price)}</td>										<td className="row-actions">
											<button className="link" onClick={() => setEditing(item)}>Edit</button>
											<button className="link danger" onClick={() => setDeleting(item)}>Delete</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{!loading && !error && rows.length > 0 && (
					<footer className="pager">
						<span>
							{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length}
						</span>
						<div>
							<button className="btn small" onClick={() => setPage(safePage - 1)} disabled={safePage === 1}>Previous</button>
							<span className="page-num">Page {safePage} of {pageCount}</span>
							<button className="btn small" onClick={() => setPage(safePage + 1)} disabled={safePage === pageCount}>Next</button>
						</div>
					</footer>
				)}
			</div>

			{editing && (
				<Modal title={editing === 'new' ? 'Add product' : 'Edit product'} onClose={() => setEditing(null)}>
					<ProductForm
						product={editing === 'new' ? null : editing}
						categories={categories}
						suppliers={suppliers}
						saving={busy}
						onSubmit={handleSave}
						onCancel={() => setEditing(null)}
					/>
				</Modal>
			)}

			{deleting && (
				<Modal title="Delete product" onClose={() => setDeleting(null)}>
					<p className="confirm">
						Delete <strong>{deleting.name}</strong>? This removes the product and can’t be undone.
					</p>
					<div className="actions">
						<button className="btn" onClick={() => setDeleting(null)}>Keep product</button>
						<button className="btn danger-solid" onClick={handleDelete} disabled={busy}>
							{busy ? 'Deleting…' : 'Delete product'}
						</button>
					</div>
				</Modal>
			)}
		</>
	)
}
