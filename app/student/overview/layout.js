'use client'

import air from '../index.module.css'
import { useRouter, usePathname } from 'next/navigation'
import { Svg_Chart } from '@/components/(icon)/svg';

export default function Home({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const status = [
        { link: '/student/overview', content: 'Tổng quan', icon: <Svg_Chart w={16} h={16} c={'var(--main_d)'} /> }
    ];

    const profit = [
        { link: '/student/overview/overviews', content: 'Theo thời gian', icon: <Svg_Chart w={16} h={16} c={'var(--main_d)'} /> },
        { link: '/student/overview/overviews', content: 'Theo khu vực', icon: <Svg_Chart w={16} h={16} c={'var(--main_d)'} /> },
    ];

    const trend = [
        { link: '/student/overview/overviews', content: 'Khóa học', icon: <Svg_Chart w={16} h={16} c={'var(--main_d)'} /> }
    ];

    return (
        <div className={air.over_wrap}>
            <div className={air.over_nav}>
                <p className={`${air.over_title} text_4`}>Trạng thái học sinh</p>
                {status.map((route, index) => (
                    <div
                        key={index}
                        className={`${air.over_button} ${pathname === route.link ? air.ac : ''}`}
                        onClick={() => router.push(route.link)}
                    >
                        {route.icon}
                        {route.content}
                    </div>
                ))}
                <p className={`${air.over_title} text_4`} style={{ marginTop: 8 }}>Lợi nhuận</p>
                {profit.map((route, index) => (
                    <div
                        key={index}
                        className={`${air.over_button} ${pathname === route.link ? air.ac : ''}`}
                        onClick={() => router.push(route.link)}
                    >
                        {route.icon}
                        {route.content}
                    </div>
                ))}
                <p className={`${air.over_title} text_4`} style={{ marginTop: 8 }}>Xu hướng</p>
                {trend.map((route, index) => (
                    <div
                        key={index}
                        className={`${air.over_button} ${pathname === route.link ? air.ac : ''}`}
                        onClick={() => router.push(route.link)}
                    >
                        {route.icon}
                        {route.content}
                    </div>
                ))}
            </div>
            <div className={`${air.over_main}  scroll`}>
                {children}
            </div>
        </div>
    )
}
