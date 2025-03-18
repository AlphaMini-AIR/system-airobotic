'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

const Drawer = React.memo(function Drawer({
  isOpen,                 // Trạng thái mở/đóng của Drawer
  onClose,                // Hàm gọi khi cần đóng Drawer
  children,               // Nội dung bên trong Drawer
  direction = 'right',    // Hướng mở: 'left', 'right', 'top', 'bottom'
  size = '300px',         // Kích thước Drawer (chiều rộng hoặc chiều cao)
  animationDuration = 0.3, // Thời gian animation (giây)
  className = ''          // Các lớp CSS bổ sung (có thể dùng Tailwind nếu muốn)
}) {
  // State để quyết định có render Drawer hay không
  const [shouldRender, setShouldRender] = useState(isOpen);
  // State dùng để điều khiển hiệu ứng mở/đóng (để đảm bảo hiệu ứng mở cũng có chuyển động)
  const [renderOpen, setRenderOpen] = useState(false);

  // Khi isOpen thay đổi, nếu mở thì render ngay và sau đó trigger open animation,
  // nếu đóng thì delay unmount cho animation hoàn thành.
  useEffect(() => {
    let timer;
    if (isOpen) {
      setShouldRender(true);
      // Dùng setTimeout nhỏ để đảm bảo component đã được render với trạng thái đóng
      timer = setTimeout(() => {
        setRenderOpen(true);
      }, 10);
    } else {
      setRenderOpen(false);
      timer = setTimeout(() => {
        setShouldRender(false);
      }, animationDuration * 1000);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, animationDuration]);

  // Đăng ký sự kiện bàn phím để đóng Drawer khi nhấn ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Xử lý đóng Drawer khi click vào overlay
  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Tính toán giá trị transform dựa vào trạng thái renderOpen và hướng
  const transformStyle = useMemo(() => {
    if (renderOpen) {
      return 'translate(0, 0)';
    } else {
      if (direction === 'left') return 'translateX(-100%)';
      if (direction === 'right') return 'translateX(100%)';
      if (direction === 'top') return 'translateY(-100%)';
      if (direction === 'bottom') return 'translateY(100%)';
      return 'translate(0, 0)';
    }
  }, [renderOpen, direction]);

  // Tính toán style cho Drawer, bao gồm vị trí, kích thước và animation
  const drawerStyle = useMemo(() => {
    const baseStyle = {
      transition: `transform ${animationDuration}s ease`,
      transform: transformStyle,
      position: 'absolute',
      background: 'white',
      overflow: 'auto'
    };
    if (direction === 'left' || direction === 'right') {
      return {
        ...baseStyle,
        width: typeof size === 'number' ? `${size}px` : size,
        height: '100%',
        top: 0,
        bottom: 0,
        [direction]: 0
      };
    } else {
      return {
        ...baseStyle,
        height: typeof size === 'number' ? `${size}px` : size,
        width: '100%',
        left: 0,
        right: 0,
        [direction]: 0
      };
    }
  }, [direction, size, animationDuration, transformStyle]);

  if (typeof window === 'undefined') {
    return null;
  }

  // Chỉ render Drawer khi shouldRender là true
  if (!shouldRender) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={handleOverlayClick}
      ></div>
      {/* Panel Drawer */}
      <div style={drawerStyle} className={className}>
        {children}
      </div>
    </div>,
    document.body
  );
});

export default Drawer;
