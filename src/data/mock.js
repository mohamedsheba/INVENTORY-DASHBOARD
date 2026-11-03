// Mock data. Field names mirror the future Supabase columns (snake_case → camelCase in the service layer).

export const categories = [
  { id: 'cat-1', name: 'Electronics' },
  { id: 'cat-2', name: 'Office supplies' },
  { id: 'cat-3', name: 'Packaging' },
  { id: 'cat-4', name: 'Tools' },
  { id: 'cat-5', name: 'Cleaning' },
]

export const suppliers = [
  { id: 'sup-1', name: 'Nile Trading Co.' },
  { id: 'sup-2', name: 'Delta Wholesale' },
  { id: 'sup-3', name: 'Alexandria Imports' },
  { id: 'sup-4', name: 'Cairo Industrial' },
]

const p = (n, sku, name, categoryId, supplierId, quantity, reorderLevel, price) => ({
  id: `prod-${n}`,
  sku,
  name,
  categoryId,
  supplierId,
  quantity,
  reorderLevel,
  price,
  updatedAt: new Date(Date.now() - n * 36e5 * 7).toISOString(),
})

export const products = [
  p(1, 'ELC-1001', 'Wireless barcode scanner', 'cat-1', 'sup-1', 42, 15, 89.5),
  p(2, 'ELC-1002', 'Thermal label printer', 'cat-1', 'sup-1', 9, 10, 214),
  p(3, 'ELC-1003', 'USB-C hub, 7 port', 'cat-1', 'sup-3', 120, 30, 34.99),
  p(4, 'ELC-1004', 'Rugged tablet 10"', 'cat-1', 'sup-3', 0, 5, 499),
  p(5, 'OFC-2001', 'A4 copy paper, 500 sheets', 'cat-2', 'sup-2', 340, 100, 4.2),
  p(6, 'OFC-2002', 'Permanent marker, black', 'cat-2', 'sup-2', 18, 50, 1.15),
  p(7, 'OFC-2003', 'Heavy-duty stapler', 'cat-2', 'sup-2', 64, 20, 12.75),
  p(8, 'OFC-2004', 'Clipboard, hardboard', 'cat-2', 'sup-2', 85, 25, 3.4),
  p(9, 'PKG-3001', 'Corrugated box 40×30×30', 'cat-3', 'sup-4', 780, 300, 0.95),
  p(10, 'PKG-3002', 'Stretch film, 500 mm', 'cat-3', 'sup-4', 56, 40, 11.6),
  p(11, 'PKG-3003', 'Packing tape, clear', 'cat-3', 'sup-4', 12, 60, 1.8),
  p(12, 'PKG-3004', 'Bubble wrap roll, 50 m', 'cat-3', 'sup-4', 33, 20, 18.25),
  p(13, 'PKG-3005', 'Pallet strapping kit', 'cat-3', 'sup-1', 7, 10, 42),
  p(14, 'TLS-4001', 'Cordless drill, 18 V', 'cat-4', 'sup-3', 24, 8, 129),
  p(15, 'TLS-4002', 'Socket set, 40 pieces', 'cat-4', 'sup-3', 15, 10, 56.9),
  p(16, 'TLS-4003', 'Box cutter, retractable', 'cat-4', 'sup-2', 210, 80, 2.3),
  p(17, 'TLS-4004', 'Hand pallet jack', 'cat-4', 'sup-4', 3, 4, 320),
  p(18, 'TLS-4005', 'Tape measure, 8 m', 'cat-4', 'sup-3', 96, 30, 5.75),
  p(19, 'CLN-5001', 'Floor cleaner, 5 L', 'cat-5', 'sup-2', 48, 20, 9.9),
  p(20, 'CLN-5002', 'Disinfectant wipes, 80 ct', 'cat-5', 'sup-2', 6, 25, 4.6),
  p(21, 'CLN-5003', 'Nitrile gloves, box of 100', 'cat-5', 'sup-1', 140, 60, 7.2),
  p(22, 'CLN-5004', 'Industrial mop set', 'cat-5', 'sup-4', 0, 10, 24.5),
  p(23, 'CLN-5005', 'Trash bags, 120 L, 25 ct', 'cat-5', 'sup-1', 72, 30, 6.4),
  p(24, 'ELC-1005', 'Handheld label gun', 'cat-1', 'sup-1', 28, 12, 16.8),
]