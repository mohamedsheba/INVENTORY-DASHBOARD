import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ArrowLeftRight, BarChart3, Boxes, LayoutDashboard, Menu, Package, Tags, Truck, X } from 'lucide-react'

const APP_NAME = 'StockFlow'
const APP_TAGLINE = 'Inventory Management'

// Mock user. Later this comes from Supabase Auth.
const CURRENT_USER = { name: 'Mohamed', role: 'admin' }

// The sidebar is built from this data. "roles" says who can see each item.
// Hiding an item is only for the UI. Real protection will come from Supabase RLS.
const NAV_SECTIONS = [
  {
    title: 'Workspace',
    items: [
      { to: '/overview', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'staff'] },
      { to: '/products', label: 'Products', icon: Package, roles: ['admin', 'staff'] },
      { to: '/categories', label: 'Categories', icon: Tags, roles: ['admin', 'staff'] },
      { to: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['admin', 'staff'] },
    ],
  },
  {
    title: 'Inventory',
    items: [{ to: '/movements', label: 'Stock movements', icon: ArrowLeftRight, roles: ['admin', 'staff'] }],
  },
  {
    title: 'Management',
    items: [{ to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'staff'] }],
  },
]

// Same breakpoint as the CSS. At this width and below, the sidebar becomes a drawer.
const DRAWER_QUERY = '(max-width: 1024px)'

export default function Layout() {
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef(null)
  const closeButtonRef = useRef(null)
  const wasOpen = useRef(false)

  const closeMenu = () => setOpen(false)

  // Close with the Escape key, and lock the page scroll while the drawer is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && closeMenu()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  // If the window grows past the breakpoint (for example rotating a tablet), close the drawer.
  useEffect(() => {
    const media = window.matchMedia(DRAWER_QUERY)
    const onChange = (e) => !e.matches && closeMenu()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  // Keyboard focus: move it into the drawer when it opens, and back to the menu button when it closes.
  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus()
    } else if (wasOpen.current) {
      menuButtonRef.current?.focus()
    }
    wasOpen.current = open
  }, [open])

  // Keep only the items this role can see, and drop sections that end up empty.
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(CURRENT_USER.role)),
  })).filter((section) => section.items.length > 0)

  return (
    <div className="shell">
      {/* Top bar: only visible on tablet and mobile */}
      <header className="topbar">
        <button
          ref={menuButtonRef}
          type="button"
          className="menu-btn"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="sidebar"
          onClick={() => setOpen(true)}
        >
          <Menu size={22} aria-hidden="true" />
        </button>
        <span className="topbar-title">{APP_NAME}</span>
      </header>

      <aside id="sidebar" className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Boxes size={20} />
          </span>
          <div>
            <span className="brand-name">{APP_NAME}</span>
            <span className="brand-tag">{APP_TAGLINE}</span>
          </div>
          <button ref={closeButtonRef} type="button" className="sidebar-close" aria-label="Close menu" onClick={closeMenu}>
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Main">
          {sections.map((section) => (
            <div className="nav-section" key={section.title}>
              <p className="nav-heading">{section.title}</p>
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeMenu}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className="avatar" aria-hidden="true">
            {CURRENT_USER.name.charAt(0)}
          </span>
          <div>
            <span className="user-name">{CURRENT_USER.name}</span>
            <span className="user-role">{CURRENT_USER.role}</span>
          </div>
        </div>
      </aside>

      {/* Dark layer behind the drawer. Clicking it closes the menu. */}
      <div className={open ? 'scrim show' : 'scrim'} onClick={closeMenu} aria-hidden="true" />

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}