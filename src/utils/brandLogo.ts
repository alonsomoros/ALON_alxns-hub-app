/** Prioridad (Issue 015): logo explícito → favicon por dominio → null (fallback de icono en la vista). */
export const resolveBrandLogo = (url: string, explicitLogoUrl?: string) => {
  if (explicitLogoUrl?.trim()) return explicitLogoUrl.trim()
  try {
    const safeUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`
    const parsed = new URL(safeUrl)
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(parsed.origin)}`
  } catch {
    return null
  }
}
