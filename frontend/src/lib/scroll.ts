export function scrollToTop(smooth = true): void {
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
}

export function scrollToElement(elementId: string, smooth = true): void {
  const element = document.getElementById(elementId)
  if (element) {
    element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  }
}

export function updateUrlHash(hash: string): void {
  window.history.pushState({}, '', hash)
}
