import { useLanguage } from '../state/LanguageContext.jsx'
import { Shield } from './Icon.jsx'

// The trust line — always visible on Home and on every Samjhao result.
export default function TrustFooter({ className = '' }) {
  const { t } = useLanguage()
  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 text-center text-[13px] leading-snug text-indigo/80 ${className}`}
    >
      <Shield size={18} className="shrink-0" />
      <span>{t('trust')}</span>
    </div>
  )
}
