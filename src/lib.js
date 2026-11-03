export const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function stockStatus(product) {
  if (product.quantity <= 0) return 'out'
  if (product.quantity <= product.reorderLevel) return 'low'
  return 'ok'
}

export const STATUS_LABEL = { ok: 'In stock', low: 'Low stock', out: 'Out of stock' }
