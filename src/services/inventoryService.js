// Data layer. Every function is async and returns plain objects, exactly like a Supabase call would.
// When we move to Supabase, only THIS file changes — pages and components stay the same.

import { categories, products as seedProducts, suppliers } from '../data/mock.js'

const STORAGE_KEY = 'stockroom.products.v1'
const LATENCY_MS = 350

const wait = (ms = LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms))

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* fall through to seed data */
  }
  return seedProducts
}

function save(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* storage unavailable: keep working in memory */
  }
}

let db = load()

export async function getProducts() {
  await wait()
  return [...db]
}

export async function getCategories() {
  await wait(150)
  return [...categories]
}

export async function getSuppliers() {
  await wait(150)
  return [...suppliers]
}

export async function createProduct(input) {
  await wait()
  const product = { ...input, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }
  db = [product, ...db]
  save(db)
  return product
}

export async function updateProduct(id, input) {
  await wait()
  let updated = null
  db = db.map((item) => {
    if (item.id !== id) return item
    updated = { ...item, ...input, updatedAt: new Date().toISOString() }
    return updated
  })
  save(db)
  return updated
}

export async function deleteProduct(id) {
  await wait()
  db = db.filter((item) => item.id !== id)
  save(db)
}
