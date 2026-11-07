export type SavedLink = {
  id: string
  label: string
  createdAt: number
}

const STORAGE_KEY = 'realtracker.savedLinks'

export function getSavedLinks(): SavedLink[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedLink[]
  } catch {
    return []
  }
}

export function saveLink(link: SavedLink) {
  const links = getSavedLinks().filter((item) => item.id !== link.id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([link, ...links]))
}

export function deleteSavedLink(id: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(getSavedLinks().filter((item) => item.id !== id)),
  )
}