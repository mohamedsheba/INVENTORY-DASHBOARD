import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Products from './pages/Products.jsx'
import Categories from './pages/Categories.jsx'
import ComingSoon from './pages/ComingSoon.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/products" replace />} />
        <Route path="overview" element={<ComingSoon title="Overview" />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="suppliers" element={<ComingSoon title="Suppliers" />} />
        <Route path="movements" element={<ComingSoon title="Stock movements" />} />
        <Route path="reports" element={<ComingSoon title="Reports" />} />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Route>
    </Routes>
  )
}
