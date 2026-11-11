import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { resolveBrandLogo } from '../../utils/brandLogo'

export function BrandLogo({ url, explicitUrl, fallback: Icon, className }: { url: string; explicitUrl?: string; fallback: LucideIcon; className: string }) {
  const logoUrl = resolveBrandLogo(url, explicitUrl)
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'fallback'>(() => logoUrl ? 'loading' : 'fallback')

  if (!logoUrl || imageState === 'fallback') {
    return <span className={`${className} brand-fallback`} aria-hidden="true"><Icon size={18} /></span>
  }

  return <span className={`${className} brand-icon`} aria-hidden="true"><img key={logoUrl} src={logoUrl} alt="" onLoad={() => setImageState('ready')} onError={() => setImageState('fallback')} /><span className={`brand-sheen ${imageState === 'loading' ? 'active' : ''}`} /></span>
}
