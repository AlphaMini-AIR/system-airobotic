'use client';
import { useState, useEffect, useMemo, startTransition, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import air from './index.module.css';
import { Svg_Dark, Svg_Left, Svg_Logout, Svg_Menu, Svg_Mode, Svg_Student, Svg_Course, Svg_Canlendar, Svg_Setting } from '../../(icon)/svg';
import Menu from '../../(ui)/(button)/menu';
import Switch from "@/components/(ui)/(button)/swith";
import WrapIcon from '../../(ui)/(button)/hoveIcon';
import Loading from '@/components/(ui)/(loading)/loading';
import Link from 'next/link';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';

const Svg_More = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" {...props}>
    <path d="M8 256a56 56 0 1 1 112 0A56 56 0 1 1 8 256zm160 0a56 56 0 1 1 112 0 56 56 0 1 1 -112 0zm216-56a56 56 0 1 1 0 112 56 56 0 1 1 0-112z" />
  </svg>
);
const ITEM_HEIGHT = 82;
const initialNavItems = [
  { href: '/student/list', icon: <Svg_Student w={24} h={24} c={'var(--text-secondary)'} />, content: 'Học sinh' },
  {
    href: '/teacher', icon: <div style={{ marginBottom: 1 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" height={21} width={21} fill={'var(--text-secondary)'}>
        <path d="M160 64c0-35.3 28.7-64 64-64L576 0c35.3 0 64 28.7 64 64l0 288c0 35.3-28.7 64-64 64l-239.2 0c-11.8-25.5-29.9-47.5-52.4-64l99.6 0 0-32c0-17.7 14.3-32 32-32l64 0c17.7 0 32 14.3 32 32l0 32 64 0 0-288L224 64l0 49.1C205.2 102.2 183.3 96 160 96l0-32zm0 64a96 96 0 1 1 0 192 96 96 0 1 1 0-192zM133.3 352l53.3 0C260.3 352 320 411.7 320 485.3c0 14.7-11.9 26.7-26.7 26.7L26.7 512C11.9 512 0 500.1 0 485.3C0 411.7 59.7 352 133.3 352z" />
      </svg>
    </div>, content: 'Giáo viên'
  },
  { href: '/course', icon: <div style={{ marginBottom: 1 }}><Svg_Course w={20} h={19} c={'var(--text-secondary)'} /></div>, content: 'Khóa học' },
  { href: '/calendar', icon: <div style={{ marginBottom: 1 }}><Svg_Canlendar w={20} h={19} c={'var(--text-secondary)'} /></div>, content: 'Lịch dạy' },
  {
    href: '/client', icon: <div style={{ marginBottom: 1 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" height={19} width={20} fill={'var(--text-secondary)'} >
        <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c10 0 18.8-4.9 24.2-12.5l-99.2-99.2c-14.9-14.9-23.3-35.1-23.3-56.1l0-33c-15.9-4.7-32.8-7.2-50.3-7.2l-91.4 0zM384 224c-17.7 0-32 14.3-32 32l0 82.7c0 17 6.7 33.3 18.7 45.3L478.1 491.3c18.7 18.7 49.1 18.7 67.9 0l73.4-73.4c18.7-18.7 18.7-49.1 0-67.9L512 242.7c-12-12-28.3-18.7-45.3-18.7L384 224zm24 80a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z" />
      </svg>
    </div>, content: 'Chăm sóc'
  }
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [orderedItems, setOrderedItems] = useState(initialNavItems);
  const [visibleCount, setVisibleCount] = useState(initialNavItems.length);
  const [isMorePopupOpen, setIsMorePopupOpen] = useState(false);
  const navContainerRef = useRef(null);
  const draggedItem = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem('navItemOrder');
      if (savedOrder) {
        const orderedHrefs = JSON.parse(savedOrder);
        const newOrderedItems = orderedHrefs
          .map(href => initialNavItems.find(item => item.href === href))
          .filter(Boolean);
        initialNavItems.forEach(item => {
          if (!newOrderedItems.find(i => i.href === item.href)) {
            newOrderedItems.push(item);
          }
        });
        setOrderedItems(newOrderedItems);
      }
    } catch (e) {
      console.error("Failed to parse nav item order from localStorage", e);
      setOrderedItems(initialNavItems);
    }
  }, []);

  useEffect(() => {
    if (navContainerRef.current) {
      const containerHeight = navContainerRef.current.clientHeight;
      const maxItemsThatFit = Math.floor(containerHeight / ITEM_HEIGHT);
      setVisibleCount(maxItemsThatFit);
    }
  }, []);

  const showMoreButton = orderedItems.length > visibleCount;
  const itemsToDisplay = showMoreButton ? orderedItems.slice(0, visibleCount - 1) : orderedItems;
  const activeIndex = useMemo(() => {
    const activeItem = orderedItems.find(item => pathname.startsWith(item.href) && item.href !== '/') ||
      (pathname === '/' && orderedItems.find(item => item.href === '/'));
    return activeItem ? orderedItems.findIndex(i => i.href === activeItem.href) : -1;
  }, [pathname, orderedItems]);

  const targetOffset = activeIndex * ITEM_HEIGHT;
  const [barOffset, setBarOffset] = useState(targetOffset);

  useEffect(() => {
    setBarOffset(targetOffset);
  }, [targetOffset]);

  const [activeMenu, setActiveMenu] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  const [load, setload] = useState(false);
  const logout = async () => {
    setload(true);
    try {
      await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setload(false);
      window.location.reload();
    }
  };

  const handleDragStart = (e, position) => {
    draggedItem.current = position;
  };

  const handleDragEnter = (e, position) => {
    if (draggedItem.current === null || dragOverIndex === position) return;
    setDragOverIndex(position);
  };

  const handleDrop = () => {
    if (draggedItem.current === null || dragOverIndex === null) return;
    const newItems = [...orderedItems];
    const draggedItemContent = newItems[draggedItem.current];
    newItems.splice(draggedItem.current, 1);
    newItems.splice(dragOverIndex, 0, draggedItemContent);
    draggedItem.current = null;
    setDragOverIndex(null);
    setOrderedItems(newItems);
    localStorage.setItem('navItemOrder', JSON.stringify(newItems.map(item => item.href)));
  };

  const handleDragEnd = () => {
    draggedItem.current = null;
    setDragOverIndex(null);
  };

  const renderReorderList = (items) => (
    <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onDragEnd={handleDragEnd}>
      <p className={air.popupDescription}>Kéo và thả để sắp xếp lại menu.</p>
      <div>
        {items.reduce((acc, item, index) => {
          const isDragging = draggedItem.current === index;
          const isDropTarget = dragOverIndex === index;
          if (isDropTarget) {
            acc.push(<div key={`placeholder-${index}`} className={air.placeholder} />);
          }
          acc.push(
            <div
              key={item.href}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              className={`${air.reorderItem} ${isDragging ? air.isDragging : ''}`}
            >
              {item.icon}
              <span className='text_5_400'>{item.content}</span>
            </div>
          );
          return acc;
        }, [])}
        {dragOverIndex === items.length && (
          <div key="placeholder-end" className={air.placeholder} />
        )}
        <div
          className={air.lastDropZone}
          onDragEnter={() => {
            if (draggedItem.current !== null) {
              setDragOverIndex(items.length);
            }
          }}
        />
      </div>
    </div>
  );

  const menuItems = (
    <div style={{ listStyle: 'none', margin: 0, width: 180, borderRadius: 12, background: 'var(--bg-secondary)', boxShadow: 'var(--boxshaw)', marginBottom: 8 }}>
      <div style={{ padding: 8, gap: 3 }} className='flex_col'>
        <Link href={'/setting'} className={`${air.menu_li} text_5_400`} onClick={() => setActiveMenu(2)}>
          <Svg_Setting w={16} h={16} c={'var(--text-secondary)'} />Cài đặt
        </Link>
        <p className={`${air.menu_li} text_5_400`} onClick={() => setActiveMenu(2)}>
          <Svg_Mode w={16} h={16} c={'var(--text-secondary)'} />Giao diện
        </p>
      </div>
      <div style={{ padding: 8, borderTop: 'thin solid var(--border-color)' }} onClick={logout}>
        <p className={`${air.menu_li} ${air.logout} text_5_400`}>
          <Svg_Logout w={16} h={16} c={'white'} />Đăng xuất
        </p>
      </div>
    </div>
  );

  const menuMode = (
    <div style={{ listStyle: 'none', margin: 0, width: 210, borderRadius: 12, background: 'var(--bg-secondary)', boxShadow: 'var(--boxshaw)', marginBottom: 8 }}>
      <div style={{ padding: 8, borderBottom: 'thin solid var(--border-color)', justifyContent: 'start', gap: 8 }} className='flex_center'>
        <div onClick={() => setActiveMenu(1)}>
          <WrapIcon icon={<Svg_Left w={12} h={12} c={'var(--text-secondary)'} />} w={'32px'} />
        </div>
        <p className="text_5">Chế độ giao diện</p>
        <Svg_Mode w={16} h={16} c={'var(--text-secondary)'} />
      </div>
      <div style={{ padding: 8 }}>
        <div className={`${air.menu_li} text_5_400`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={toggleTheme}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Svg_Dark w={18} h={18} c={'var(--text-secondary)'} />
            <p style={{ flex: 1, marginLeft: 8 }}>Giao diện Tối</p>
          </div>
          <Switch checked={isDark} size="small" activeColor="#ffffff" inactiveColor="#ddd" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className='flex_col' style={{ justifyContent: 'space-between', height: '100%', alignItems: 'center' }}>
        <div style={{ height: 100, width: 100, minHeight: 100 }} className="flex_center">
          <p className="text_1">
            <span style={{ color: 'var(--main_d)' }}> AI</span>
            <span>R</span>
          </p>
        </div>
        <div className={air.container} ref={navContainerRef}>
          {activeIndex !== -1 && itemsToDisplay.some(item => orderedItems[activeIndex].href === item.href) && (
            <div
              className={air.highlight}
              style={{ transform: `translateY(${barOffset}px)`, transition: 'transform .3s ease-in-out' }}
            />
          )}
          {itemsToDisplay.map(({ href, icon, content }) => (
            <div
              key={href}
              className={air.navItem}
              onClick={() => startTransition(() => router.push(href))}
            >
              {icon}
              <p className={air.navText}>{content}</p>
            </div>
          ))}
          {showMoreButton && (
            <div className={air.navItem} onClick={() => setIsMorePopupOpen(true)}>
              <Svg_More height={22} width={22} fill={'var(--text-primary)'} />
              <p className={air.navText} style={{ marginTop: 2 }}>Thêm</p>
            </div>
          )}
        </div>
        <FlexiblePopup
          open={isMorePopupOpen}
          onClose={() => setIsMorePopupOpen(false)}
          data={orderedItems}
          renderItemList={renderReorderList}
          title="Tùy chỉnh Menu"
          width={400}
        />
        <div>
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
            style={`display: 'flex'`}
            onOpenChange={(isOpen) => {
              setIsMenuOpen(isOpen);
              if (!isOpen) setActiveMenu(1);
            }}
          />
        </div>
      </div>
      {load && (
        <div className={air.loading}>
          <Loading content={<p className='text_6_400' style={{ color: 'white' }}>Đang đăng xuất...</p>} />
        </div>
      )}
    </>
  );
}