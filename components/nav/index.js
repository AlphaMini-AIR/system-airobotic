'use client';

import { useState, useEffect, useMemo, startTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import air from './index.module.css';
import { Svg_Dark, Svg_Left, Svg_Logout, Svg_Menu, Svg_Mode, Svg_Student, Svg_Course, Svg_Canlendar } from '../svg';
import Menu from '../(button)/menu';
import Switch from "@/components/(button)/swith";
import WrapIcon from '../(button)/hoveIcon';

const ITEM_HEIGHT = 82;

const navItems = [
  { href: '/student/overview', icon: <Svg_Student w={24} h={24} c={'var(--text-secondary)'} />, content: 'Học sinh' },
  {
    href: '/course', icon: <div style={{ marginBottom: 1 }}>
      <Svg_Course w={20} h={19} c={'var(--text-secondary)'} />
    </div>, content: 'Khóa học'
  },
  {
    href: '/calendar', icon: <div style={{ marginBottom: 1 }}>
      <Svg_Canlendar w={20} h={19} c={'var(--text-secondary)'} />
    </div>, content: 'Lịch dạy'
  }
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  const activeIndex = useMemo(() => {
    let bestMatchIndex = -1;
    navItems.forEach((item, index) => {
      if (item.href === '/') {
        if (pathname === '/') {
          if (bestMatchIndex === -1 || item.href.length > navItems[bestMatchIndex].href.length) {
            bestMatchIndex = index;
          }
        }
      } else if (pathname.startsWith(item.href)) {
        if (bestMatchIndex === -1 || item.href.length > navItems[bestMatchIndex].href.length) {
          bestMatchIndex = index;
        }
      }
    });
    return bestMatchIndex === -1 ? 0 : bestMatchIndex;
  }, [pathname]);

  const targetOffset = activeIndex * ITEM_HEIGHT;
  const [barOffset, setBarOffset] = useState(targetOffset);

  useEffect(() => {
    setBarOffset(targetOffset);
  }, [targetOffset]);

  // Quản lý trạng thái menu
  const [activeMenu, setActiveMenu] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Quản lý dark mode: đọc từ localStorage khi component mount
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Hàm chuyển đổi theme: thêm/xóa class .dark trên documentElement và lưu vào localStorage
  const toggleTheme = () => {
    setIsDark((prev) => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newTheme;
    });
  };

  // Menu chính
  const menuItems = (
    <div style={{
      listStyle: 'none',
      margin: 0,
      width: 180,
      borderRadius: 12,
      background: 'var(--bg-secondary)',
      boxShadow: 'var(--boxshaw)',
      marginBottom: 8
    }}>
      <div style={{ padding: 8, gap: 3 }} className='flex_col'>
        <p className={`${air.menu_li} text_5_400`} onClick={() => setActiveMenu(2)}>
          <Svg_Mode w={16} h={16} c={'var(--text-secondary)'} />Giao diện
        </p>
        <p className={`${air.menu_li} text_5_400`} onClick={() => setActiveMenu(2)}>
          <Svg_Mode w={16} h={16} c={'var(--text-secondary)'} />Giao diện
        </p>
      </div>

      <div style={{ padding: 8, borderTop: 'thin solid var(--border-color)' }}>
        <p className={`${air.menu_li} ${air.logout} text_5_400`}>
          <Svg_Logout w={16} h={16} c={'white'} />Đăng xuất
        </p>
      </div>
    </div>
  );

  // Menu giao diện (Mode) có chứa Switch chuyển dark mode
  const menuMode = (
    <div style={{
      listStyle: 'none',
      margin: 0,
      width: 210,
      borderRadius: 12,
      background: 'var(--bg-secondary)',
      boxShadow: 'var(--boxshaw)',
      marginBottom: 8
    }}>
      <div style={{ padding: 8, borderBottom: 'thin solid var(--border-color)', justifyContent: 'start', gap: 8 }} className='flex_center'>
        <div onClick={() => setActiveMenu(1)}>
          <WrapIcon icon={<Svg_Left w={12} h={12} c={'var(--text-secondary)'} />} w={'32px'} />
        </div>
        <p className="text_5">Chế độ giao diện</p>
        <Svg_Mode w={16} h={16} c={'var(--text-secondary)'} />
      </div>
      <div style={{ padding: 8 }}>
        <div className={`${air.menu_li} text_5_400`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          onClick={toggleTheme}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Svg_Dark w={18} h={18} c={'var(--text-secondary)'} />
            <p style={{ flex: 1, marginLeft: 8 }}>Giao diện Tối</p>
          </div>
          <Switch
            checked={isDark}
            size="small"
            activeColor="#ffffff"
            inactiveColor="#ddd"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className='flex_col' style={{ justifyContent: 'space-between', height: '100%', alignItems: 'center' }}>
      <div style={{ height: 100, width: 100 }} className="flex_center">
        <p className="text_1">
          <span style={{ color: 'var(--main_d)' }}> AI</span>
          <span>R</span>
        </p>
      </div>
      <div className={air.container}>
        <div
          className={air.highlight}
          style={{
            transform: `translateY(${barOffset}px)`,
            transition: 'transform .2s .1s ease'
          }}
        />
        {navItems.map(({ href, icon: Icon, content }) => (
          <div
            key={href}
            className={air.navItem}
            onClick={() => startTransition(() => router.push(href))}
          >
            {Icon}
            <p className={air.navText}>{content}</p>
          </div>
        ))}
      </div>
      <Menu
        isOpen={isMenuOpen}
        menuItems={activeMenu === 1 ? menuItems : menuMode}
        menuPosition="top"
        customButton={
          <div className={air.navItem} style={{ marginBottom: 8 }}>
            <Svg_Menu w={22} h={22} c={'var(--text-primary)'} />
            <p className={air.navText} style={{ marginTop: 2 }}>Thêm</p>
          </div>
        }
        onOpenChange={(isOpen) => {
          setIsMenuOpen(isOpen);
          if (!isOpen) setActiveMenu(1);
        }}
      />
    </div>
  );
}
