'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import request from '@/core/api';

export default function ProfilePage() {
  const params = useParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!params.id) return;
      
      setLoading(true);
      setError(null);

      // Запрашиваем данные по исправленному пути
      const res = await request(`/referee/profile/${params.id}`, 'get');

      if (res.status === "success") {
        setUser(res.data);
      } else {
        setError(res.error || "Не удалось загрузить данные профиля");
      }
      setLoading(false);
    };

    loadProfileData();
  }, [params.id]);

  if (loading) return <div className={styles.pageWrapper}><h3>Загрузка профиля...</h3></div>;
  
  if (error) return (
    <div className={styles.pageWrapper}>
      <h3 style={{ color: 'red' }}>{error}</h3>
      <Link href="/" className={styles.backButton}>
        <span>← Вернуться к списку</span>
      </Link>
    </div>
  );

  if (!user) return <div className={styles.pageWrapper}><h3>Профиль не найден</h3></div>;

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.profileHeader}>
        {/* Новая красивая кнопка с SVG иконкой */}
        <Link href="/" className={styles.backButton}>
          <div className={styles.iconCircle}>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </div>
          <span>Назад к списку судей</span>
        </Link>
      </header>

      <main className={styles.gridContainer}>
        <div className={`${styles.card} ${styles.mainInfo}`}>
          <h1>{user.fio}</h1>
          <p className={styles.subText}>{user.region || 'Регион не указан'}, {user.city || 'город'}</p>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>Сколько раз судил</span>
          <div className={styles.cardValue}>
            {user.performances ? user.performances.length : 0}
          </div>
        </div>

        <div className={`${styles.card} ${styles.ratingCard}`}>
          <span className={styles.cardLabel}>Рейтинг (0-10)</span>
          <div className={styles.cardValue}>{user.rating || '—'}</div>
        </div>

        <div className={`${styles.card} ${styles.historyTable}`}>
          <div className={styles.tableHeader}>
            <div className={styles.col}>Регион уч.</div>
            <div className={styles.col}>Город уч.</div>
            <div className={styles.col}>Тип</div>
            <div className={styles.col}>Название</div>
            <div className={styles.col}>Возраст</div>
            <div className={styles.col}>Дисциплина</div>
          </div>
          <div className={styles.scrollContainer}>
            <div className={styles.tableBody}>
              {user.performances && user.performances.length > 0 ? (
                user.performances.map((p: any, i: number) => (
                  <div key={i} className={styles.tableRow}>
                    <div className={styles.col}>{p.reg_u || p.region}</div>
                    <div className={styles.col}>{p.city_u || p.city}</div>
                    <div className={styles.col}>{p.type}</div>
                    <div className={styles.col}>{p.name}</div>
                    <div className={styles.col}>{p.age}</div>
                    <div className={styles.col}>{p.discipline}</div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyTable}>История выступлений отсутствует</div>
              )}
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.heatMap}`}>
          <span className={styles.cardLabel}>Тепловая карта</span>
          <div className={styles.mapVisual}>
            <div className={styles.gradientBox}></div>
          </div>
        </div>
      </main>
    </div>
  );
}