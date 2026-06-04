import { school } from '../../styles/design-tokens'

export default function DepEdHeader({ compact = false }) {
  return (
    <div className="bg-deped-blue text-white">
      <div className={`mx-auto max-w-7xl px-4 ${compact ? 'py-1.5 text-[10px]' : 'py-2 text-xs'} text-center leading-relaxed`}>
        <p className="font-medium tracking-wide">Republika ng Pilipinas</p>
        <p>Kagawaran ng Edukasyon · {school.region} · {school.division}</p>
      </div>
    </div>
  )
}
