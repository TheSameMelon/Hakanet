'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './page.module.css'; // Создадим этот файл стилей

export default function ProfilePage() {
  const params = useParams();
  const name = decodeURIComponent(params.id as string);

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.profileHeader}>
        <Link href="/" className={styles.backLink}>← К списку судей</Link>
      </header>

      <main className={styles.gridContainer}>
        {/* Верхний ряд карточек */}
        <div className={`${styles.card} ${styles.mainInfo}`}>
          <h1>{name}</h1>
          <p className={styles.subText}>Регион, город</p>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>Сколько раз судил</span>
          <div className={styles.cardValue}>42</div>
        </div>

        <div className={`${styles.card} ${styles.ratingCard}`}>
          <span className={styles.cardLabel}>Рейтинг (0-10)</span>
          <div className={styles.cardValue}>9.8</div>
        </div>

        {/* Таблица истории */}
        <div className={`${styles.card} ${styles.historyTable}`}>
          <div className={styles.tableHeader}>
            <span>Регион уч.</span>
            <span>Город уч.</span>
            <span>Тип</span>
            <span>Название</span>
            <span>Категория</span>
            <span>Дисциплина</span>
          </div>
          <div className={styles.tableBody}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.tableRow}>
                <div className={styles.rowPlaceholder}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Тепловая карта */}
        <div className={`${styles.card} ${styles.heatMap}`}>
          <span className={styles.cardLabel}>Тепловая карта</span>
          <div className={styles.mapVisual}>
            {/* Заглушка для карты */}
            <div className={styles.gradientBox}></div>
          </div>
        </div>
      </main>
    </div>
  );
}