// Data layer. Every function is async and returns plain objects, exactly like a Supabase call would.
// When we move to Supabase, only THIS file changes — pages and components stay the same.

import { categories as seedCategories, products as seedProducts, suppliers } from '../data/mock.js'
import { normalizeName } from '../format.js'

const PRODUCTS_KEY = 'stockroom.products.v1'
const CATEGORIES_KEY = 'stockroom.categories.v1'
const LATENCY_MS = 350

const wait = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms))

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fall through to seed data */
  }
  return fallback
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: keep working in memory */
  }
}

let productsDb = read(PRODUCTS_KEY, seedProducts)
let categoriesDb = read(CATEGORIES_KEY, seedCategories)

/* ---------- Products ---------- */

export async function getProducts() {
  await wait()
  return [...productsDb]
}

export async function createProduct(input) {
  await wait()
  const product = { ...input, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }
  productsDb = [product, ...productsDb]
  write(PRODUCTS_KEY, productsDb)
  return product
}

export async function updateProduct(id, input) {
  await wait()
  let updated = null
  productsDb = productsDb.map((item) => {
    if (item.id !== id) return item
    updated = { ...item, ...input, updatedAt: new Date().toISOString() }
    return updated
  })
  write(PRODUCTS_KEY, productsDb)
  return updated
}

export async function deleteProduct(id) {
  await wait()
  productsDb = productsDb.filter((item) => item.id !== id)
  write(PRODUCTS_KEY, productsDb)
}

/* ---------- Suppliers ---------- */

export async function getSuppliers() {
  await wait(150)
  return [...suppliers]
}

/* ---------- Categories ---------- */

function assertUniqueName(name, ignoreId) {
  const taken = categoriesDb.some((c) => c.id !== ignoreId && normalizeName(c.name) === normalizeName(name))
  if (taken) throw new Error('A category with this name already exists.')
}

export async function getCategories() {
  await wait(150)
  return [...categoriesDb]
}

export async function createCategory(input) {
  await wait()
  assertUniqueName(input.name)
  const category = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: (input.description || '').trim(),
    status: input.status,
    color: input.color,
    createdAt: new Date().toISOString(),
  }
  categoriesDb = [category, ...categoriesDb]
  write(CATEGORIES_KEY, categoriesDb)
  return category
}

export async function updateCategory(id, input) {
  await wait()
  assertUniqueName(input.name, id)
  let updated = null
  categoriesDb = categoriesDb.map((c) => {
    if (c.id !== id) return c
    updated = {
      ...c,
      name: input.name.trim(),
      description: (input.description || '').trim(),
      status: input.status,
      color: input.color,
    }
    return updated
  })
  if (!updated) throw new Error('This category no longer exists.')
  write(CATEGORIES_KEY, categoriesDb)
  return updated
}

// resolution is only needed when the category still has products:
//   { action: 'move', targetCategoryId }  → products move to another category
//   { action: 'delete' }                  → products are deleted with the category
// Products are never left without a valid category. In Supabase this whole function should be
// one database transaction (an RPC), so the products and the category change together.
export async function deleteCategory(id, resolution = {}) {
  await wait()
  const inCategory = productsDb.filter((p) => p.categoryId === id)
  let count = 0

  if (inCategory.length > 0) {
    if (resolution.action === 'move') {
      const target = categoriesDb.find((c) => c.id === resolution.targetCategoryId && c.id !== id)
      if (!target) throw new Error('Choose a valid category to move the products to.')
      const now = new Date().toISOString()
      productsDb = productsDb.map((p) => (p.categoryId === id ? { ...p, categoryId: target.id, updatedAt: now } : p))
    } else if (resolution.action === 'delete') {
      productsDb = productsDb.filter((p) => p.categoryId !== id)
    } else {
      throw new Error('This category still has products. Choose what to do with them first.')
    }
    count = inCategory.length
    write(PRODUCTS_KEY, productsDb)
  }

  categoriesDb = categoriesDb.filter((c) => c.id !== id)
  write(CATEGORIES_KEY, categoriesDb)
  return { action: resolution.action ?? null, count }
}
