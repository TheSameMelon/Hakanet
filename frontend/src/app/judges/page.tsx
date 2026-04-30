'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar/Sidebar';
import styles from './page.module.css';
import request from '@/core/api';

export default function Page() {
  const [referees, setReferees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [placeholder, setPlaceholder] = useState('Найти...');
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');

  useEffect(() => {
    const loadData = async () => {
      const res = await request('/referee/all', 'get');
      if (res.status === "success") setReferees(res.data);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredData = referees.filter((user) => {
    const searchStr = searchQuery.toLowerCase();
    
    const fioMatch = user.fio?.toLowerCase().includes(searchStr);
    const regionMatch = user.region?.toLowerCase().includes(searchStr);
    const cityMatch = user.city?.toLowerCase().includes(searchStr);

    return fioMatch || regionMatch || cityMatch;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortOrder === 'none') return 0;
    
    const valA = a.rating || 0;
    const valB = b.rating || 0;

    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <main className={`${styles.mainContent} ${isCollapsed ? styles.contentCollapsed : styles.contentExpanded}`}>
        <header className={styles.header}>
          <div className={styles.controls}>
            {/* Контейнер поиска */}
            <div className={styles.searchWrapper} data-focused={isFocused}>
              <input 
                type="text" 
                placeholder={placeholder}
                className={styles.searchInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>

            {/* Кнопка сортировки */}
            <button 
              className={styles.filterBtn} 
              onClick={() => setSortOrder(sortOrder === 'none' ? 'desc' : sortOrder === 'desc' ? 'asc' : 'none')}
            >
              <span>{sortOrder === 'none' ? '▼' : sortOrder === 'desc' ? '📈' : '📉'}</span> 
              {sortOrder === 'none' ? 'Без сортировки' : sortOrder === 'desc' ? 'Сначала лучшие' : 'Сначала худшие'}
            </button>
          </div>
        </header>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Фамилия имя отчество</th>
                <th>Регион</th>
                <th>Город</th>
                <th>Рейтинг</th>
              </tr>
            </thead>
            <tbody>
              {/* Выводим именно sortedData, чтобы работала и фильтрация, и сортировка */}
              {sortedData.map((user) => (
                <Link key={user.id} href={`/profile/${user.id}`} legacyBehavior passHref>
                  <tr className={styles.clickableRow}>
                    <td className={styles.nameCell}>{user.fio}</td>
                    <td>{user.region || '—'}</td>
                    <td>{user.city || '—'}</td>
                    <td className={styles.ratingCell}>{user.rating || '0'}</td>
                  </tr>
                </Link>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}