// Small helpers shared by the Categories page, its modals, and the service layer.

export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

const dateFormat = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
export const formatDate = (iso) => dateFormat.format(new Date(iso))

// "  Office   Supplies " and "office supplies" count as the same name.
export const normalizeName = (name) => name.trim().replace(/\s+/g, ' ').toLowerCase()
