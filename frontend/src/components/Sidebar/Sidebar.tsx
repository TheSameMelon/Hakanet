'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const pathname = usePathname();

  const isRefereesActive = pathname === "/judges" || pathname.startsWith('/profile');
  const isCompetitionsActive = pathname.startsWith('/competitions');
  const isUploadActive = pathname.startsWith('/upload');

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.burgerWrapper}>
        <button 
          className={styles.burgerBtn} 
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className={styles.line}></div>
          <div className={styles.line}></div>
          <div className={styles.line}></div>
        </button>
      </div>

      <Link href="/" className={styles.logo} style={{ textDecoration: 'none' }}>
        <span className={styles.logoText}>A{isCollapsed ? '' : 'EROBIC'}</span>
        <span className={styles.logoSubtext}>S{isCollapsed ? '✦' : 'PACE✦'}</span>
      </Link>

      <nav className={styles.nav}>
        <Link href="/judges" className={`${styles.navItem} ${isRefereesActive ? styles.active : ''}`}>
          <span className={styles.icon}>👥</span>
          {!isCollapsed && <span className={styles.text}>Судьи</span>}
        </Link>

        <Link href="/competitions" className={`${styles.navItem} ${isCompetitionsActive ? styles.active : ''}`}>
          <span className={styles.icon}>🏆</span>
          {!isCollapsed && <span className={styles.text}>Соревнования</span>}
        </Link>

        <Link href="/upload" className={`${styles.navItem} ${isUploadActive ? styles.active : ''}`}>
          <span className={styles.icon}>📤</span>
          {!isCollapsed && <span className={styles.text}>Загрузить данные</span>}
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;