'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

const Drawer = React.memo(function Drawer({
  isOpen,
  onClose,
  children,
  direction = 'right',
  size = '300px',
  animationDuration = 0.3,
  className = ''
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [renderOpen, setRenderOpen] = useState(false);
  useEffect(() => {
    let timer;
    if (isOpen) {
      setShouldRender(true);
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

  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);

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

  if (!shouldRender) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        onClick={handleOverlayClick}
      ></div>
      <div style={drawerStyle} className={className}>
        {children}
      </div>
    </div>,
    document.body
  );
});

export default Drawer;
