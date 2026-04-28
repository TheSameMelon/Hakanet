'use client';

import React, { useState } from 'react';
import Image from 'next/image'; // Импорт для работы с картинками
import Link from 'next/link';   // Импорт для навигации
import styles from './page.module.css';

const mockData = [
  { fio: 'Алексеев Дмитрий Петрович', region: 'Москва', rating: 9.2 },
  { fio: 'Белова Елена Игоревна', region: 'Санкт-Петербург', rating: 8.5 },
  { fio: 'Громов Иван Сергеевич', region: 'Новосибирск', rating: 7.9 },
  { fio: 'Дмитриева Анна Владимировна', region: 'Екатеринбург', rating: 9.8 },
  { fio: 'Елисеев Артем Маркович', region: 'Казань', rating: 6.4 },
];

type SortOrder = 'none' | 'asc' | 'desc';

export default function Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('none');

  let filteredData = mockData.filter((user) => {
    const searchStr = searchQuery.toLowerCase();
    return (
      user.fio.toLowerCase().includes(searchStr) || 
      user.region.toLowerCase().includes(searchStr)
    );
  });

  if (sortOrder !== 'none') {
    filteredData = [...filteredData].sort((a, b) => {
      if (sortOrder === 'asc') return a.rating - b.rating;
      return b.rating - a.rating;
    });
  }

  const toggleSort = () => {
    if (sortOrder === 'none') setSortOrder('desc');
    else if (sortOrder === 'desc') setSortOrder('asc');
    else setSortOrder('none');
  };

  const getSortText = () => {
    if (sortOrder === 'desc') return 'Сначала лучшие';
    if (sortOrder === 'asc') return 'Сначала худшие';
    return 'Без сортировки';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {/* ЗАМЕНА: Теперь здесь кликабельное изображение */}
        <Link href="/" className={styles.logoLink}>
          <Image 
            src="/logo-full.png" // Убедись, что файл лежит в папке public
            alt="Aerobic Space+" 
            width={240} 
            height={70} 
            priority
            className={styles.logoImage}
          />
        </Link>
        
        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <input 
              type="text" 
              placeholder="Поиск по ФИО или городу" 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
          
          <button className={styles.filterBtn} onClick={toggleSort}>
            <span>{sortOrder === 'none' ? '▼' : sortOrder === 'desc' ? '📈' : '📉'}</span> 
            {getSortText()}
          </button>
        </div>
      </header>

      <main className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Фамилия имя отчество</th>
              <th>Регион (Город)</th>
              <th>Рейтинг (0-10)</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((user, index) => (
                <tr key={index}>
                  <td>
                    {/* Фамилия теперь кликабельна и ведет на профиль */}
                    <Link href={`/profile/${encodeURIComponent(user.fio)}`} className={styles.nameLink}>
                      {user.fio}
                    </Link>
                  </td>
                  <td>{user.region}</td>
                  <td style={{ 
                    fontWeight: 700, 
                    color: user.rating > 8 ? '#155DFC' : user.rating > 7 ? '#60A5FA' : '#f87171' 
                  }}>
                    {user.rating}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '40px' }}>
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