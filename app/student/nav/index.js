'use client'
import { usePathname } from 'next/navigation'
import { Svg_Chart, Svg_List } from '@/components/svg'
import air from './index.module.css'
import Link from 'next/link'

export default function Nav() {
  const pathname = usePathname()
  const isOverviewActive = pathname.startsWith('/student/overview')
  const isListActive = pathname.startsWith('/student/list')

  return (
    <div className={air.wrap}>
      <Link href={'/student/overview'}
        className={`${air.button} text_4_m flex_center ${isOverviewActive ? `${air.active}` : ''}`}
        style={{ gap: 8 }}
      >
        <Svg_Chart w={16} h={16} c={'var(--main_d)'} />
        Biểu đồ
      </Link>
      <Link href={'/student/list'}
        className={`${air.button} text_4_m flex_center ${isListActive ? `${air.active}` : ''}`}
        style={{ gap: 8 }}
      >
        <Svg_List w={16} h={16} c={'var(--main_d)'} />
        Danh sách
      </Link>
    </div>
  )
}
