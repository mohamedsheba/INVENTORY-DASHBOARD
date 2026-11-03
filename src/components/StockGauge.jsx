import { stockStatus } from '../lib.js'

export default function StockGauge({ product }) {
  const status = stockStatus(product)
  const scale = Math.max(product.reorderLevel * 3, product.quantity, 1)
  const fill = Math.min(product.quantity / scale, 1) * 100
  const tick = (product.reorderLevel / scale) * 100

  return (
    <div className="gauge-wrap">
      <span className="qty">{product.quantity}</span>
      <div className={`gauge ${status}`} aria-hidden="true">
        <span className="gauge-fill" style={{ width: `${fill}%` }} />
        <span className="gauge-tick" style={{ left: `${tick}%` }} />
      </div>
    </div>
  )
}
