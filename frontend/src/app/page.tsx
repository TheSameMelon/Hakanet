'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import request from '@/core/api';

type SortOrder = 'none' | 'asc' | 'desc';

export default function Page() {
  const [referees, setReferees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');
  
  // Новые состояния для живого поиска
  const [placeholder, setPlaceholder] = useState('Найти судью...');
  const [isFocused, setIsFocused] = useState(false);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const res = await request('/referee/all', 'get');
      if (res.status === "success") {
        setReferees(res.data);
      } else {
        setError(res.error || "Ошибка загрузки");
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Динамический плейсхолдер
  useEffect(() => {
    const phrases = [
      'Найти судью по ФИО...',
      'Найти по городу...',
      'Поиск по региону...',
      'Введите фамилию...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % phrases.length;
      setPlaceholder(phrases[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = referees.filter((user) => {
    const searchStr = searchQuery.toLowerCase();
    return (
      user.fio?.toLowerCase().includes(searchStr) || 
      user.region?.toLowerCase().includes(searchStr) ||
      user.city?.toLowerCase().includes(searchStr)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortOrder === 'none') return 0;
    const rateA = a.rating || 0;
    const rateB = b.rating || 0;
    return sortOrder === 'asc' ? rateA - rateB : rateB - rateA;
  });

  const toggleSort = () => {
    if (sortOrder === 'none') setSortOrder('desc');
    else if (sortOrder === 'desc') setSortOrder('asc');
    else setSortOrder('none');
  };

  if (loading) return <div className={styles.container}><h3>Загрузка...</h3></div>;
  if (error) return <div className={styles.container}><h3 style={{color: 'red'}}>{error}</h3></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logoLink}>
          <Image 
            src="/logo-full.png" 
            alt="Aerobic Space+" 
            width={240} 
            height={70} 
            priority
            className={styles.logoImage}
          />
        </Link>
        
        <div className={styles.controls}>
          {/* ОБНОВЛЕННЫЙ ЖИВОЙ ПОИСК */}
          <div className={`${styles.searchWrapper} ${isFocused ? styles.focused : ''}`}>
            <input 
              type="text" 
              placeholder={placeholder} 
              className={styles.searchInput}
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div 
              className={styles.iconContainer} 
              onClick={() => searchQuery && setSearchQuery('')}
            >
              {searchQuery ? (
                <span className={styles.clearIcon}>✕</span>
              ) : (
                <span className={styles.searchIcon}>🔍</span>
              )}
            </div>
          </div>
          
          <button className={styles.filterBtn} onClick={toggleSort}>
            <span>{sortOrder === 'none' ? '▼' : sortOrder === 'desc' ? '📈' : '📉'}</span> 
            {sortOrder === 'desc' ? 'Сначала лучшие' : sortOrder === 'asc' ? 'Сначала худшие' : 'Без сортировки'}
          </button>
        </div>
      </header>

      <main className={styles.tableWrapper}>
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
            {sortedData.length > 0 ? (
              sortedData.map((user) => (
                <Link key={user.id} href={`/profile/${user.id}`} legacyBehavior passHref>
                  <tr className={styles.clickableRow}>
                    <td className={styles.nameCell}>{user.fio}</td>
                    <td>{user.region || '—'}</td>
                    <td>{user.city || '—'}</td>
                    <td className={styles.ratingCell}>
                      {user.rating ? user.rating : '—'}
                    </td>
                  </tr>
                </Link>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>
                  Ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
}