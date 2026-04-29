'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import request from '@/core/api';

export default function ProfilePage() {
  const params = useParams();
  const [user, setUser] = useState<any>(null);
  const [dispersion, setDispersion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllData = async () => {
      if (!params.id) return;
      setLoading(true);
      setError(null);

      try {
        // 1. Основные данные судьи
        const resProfile = await request(`/referee/profile/${params.id}`, 'get');
        
        // 2. Статистика артистизма/исполнения
        const resDispersion = await request(`/dispersion/profile/${params.id}`, 'get');

        // 3. История выступлений
        const resPerformances = await request(`/performances/referee/${params.id}`, 'get');

        if (resProfile.status === "success") {
          const userData = resProfile.data;
          // Добавляем историю из нового запроса в объект пользователя
          if (resPerformances.status === "success") {
            userData.performances = resPerformances.data;
          }
          setUser(userData);
        } else {
          setError("Ошибка загрузки профиля");
        }

        if (resDispersion.status === "success" && resDispersion.data.length > 0) {
          const rawData = resDispersion.data[0];
          setDispersion({
            artistic: rawData.artistic ? JSON.parse(rawData.artistic) : null,
            execution: rawData.execution ? JSON.parse(rawData.execution) : null
          });
        }
      } catch (err) {
        setError("Ошибка связи с сервером");
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [params.id]);

  const getRatingClass = (diff: number) => {
    const absDiff = Math.abs(diff);
    if (absDiff > 1.5) return styles.ratingRed;
    if (absDiff >= 0.5) return styles.ratingYellow;
    return styles.ratingGreen;
  };

  if (loading) return <div className={styles.pageWrapper}><h3>Загрузка данных...</h3></div>;
  if (error) return <div className={styles.pageWrapper}><h3 style={{color: 'red'}}>{error}</h3></div>;
  if (!user) return <div className={styles.pageWrapper}><h3>Судья не найден</h3></div>;

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <div className={styles.iconCircle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </div>
          <span>Назад к списку</span>
        </Link>
      </header>

      <main className={styles.main}>
        <section className={styles.personalInfo}>
          <h1>{user.fio}</h1>
          <p>{user.region || 'Регион'}, {user.city || 'Город'}</p>
        </section>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.label}>Кол-во выходов</span>
            <div className={styles.value}>{user.performances?.length || 0}</div>
          </div>

          <div className={styles.statCard}>
            <span className={styles.label}>Артистизм</span>
            <div className={styles.value}>
              {dispersion?.artistic?.accuracy_rate 
                ? (dispersion.artistic.accuracy_rate * 100).toFixed(1) + '%' 
                : '—'}
            </div>
            <span className={`${styles.subStatus} ${dispersion?.artistic?.bias_interpretation === 'Объективен' ? styles.statusSuccess : ''}`}>
              {dispersion?.artistic?.bias_interpretation || 'Нет данных'}
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.label}>Исполнение</span>
            <div className={styles.value}>
              {dispersion?.execution?.accuracy_rate > 0 
                ? (dispersion.execution.accuracy_rate * 100).toFixed(1) + '%' 
                : '—'}
            </div>
            <span className={`${styles.subStatus} ${dispersion?.execution?.bias_interpretation === 'Объективен' ? styles.statusSuccess : ''}`}>
              {dispersion?.execution?.bias_interpretation || 'Нет данных'}
            </span>
          </div>
        </div>

        <section className={styles.historySection}>
          <div className={styles.tableHeader}>
            <div className={styles.col}>Регион уч.</div>
            <div className={styles.col}>Город уч.</div>
            <div className={styles.col}>Соревнование</div>
            <div className={styles.col}>Категория</div>
            <div className={styles.col}>Дисциплина</div>
            <div className={styles.col}>Оценка (diff)</div>
          </div>

          <div className={styles.tableScrollContainer}>
            <div className={styles.tableBody}>
              {user.performances && user.performances.length > 0 ? (
                user.performances.map((p: any, i: number) => (
                  <div key={i} className={styles.tableRow}>
                    <div className={styles.col}>{p.region || '—'}</div>
                   <div className={styles.col}>{p.city || '—'}</div>
                    <div className={styles.col}>{p.competition || '—'}</div>
                    <div className={styles.col}>{p.age_category || '—'}</div>
                   <div className={styles.col}>{p.discipline || '—'}</div>
                   <div className={`${styles.col} ${styles.ratingCell}`}>
                     <span className={getRatingClass(p.diff)}>
                        {p.mark} ({p.diff > 0 ? `+${p.diff.toFixed(2)}` : p.diff.toFixed(2)})
                     </span>
                   </div>
                 </div>
               ))
             ) : (
              <div className={styles.emptyTable}>История выступлений отсутствует</div>
           )}
            </div>
           </div>
          </section>
      </main>
    </div>
  );
}