'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import request from '@/core/api';

export default function CompetitionProfilePage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeDiscipline, setActiveDiscipline] = useState<string | null>(null);
  const [activeAge, setActiveAge] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!name) return;
      setLoading(true);
      try {
        const res = await request(`/dispersion/competitions/${name}`, 'get');
        if (res.status === "success") {
          setData(res.data);
        } else {
          setError("Ошибка загрузки данных соревнования");
        }
      } catch (err) {
        setError("Ошибка связи с сервером");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [name]);

  if (loading) return <div className={styles.pageWrapper}><h3>Загрузка аналитики...</h3></div>;
  if (error) return <div className={styles.pageWrapper}><h3 style={{color: 'red'}}>{error}</h3></div>;
  if (!data) return <div className={styles.pageWrapper}><h3>Данные не найдены</h3></div>;

  const filteredCategories = Object.entries(data.categories).filter(([_, cat]: any) => {
    const matchDiscipline = activeDiscipline ? cat.discipline === activeDiscipline : true;
    const matchAge = activeAge ? cat.age_category === activeAge : true;
    return matchDiscipline && matchAge;
  });

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/competitions" className={styles.backButton}>
            <div className={styles.iconCircle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </div>
            <span>Назад к списку</span>
          </Link>
        </header>

        <section className={styles.heroSection}>
          <h1>{data.competition}</h1>
          <p className={styles.subTitle}>Спортивная аэробика • {name}</p>
        </section>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.label}>Коэф. девиации (Общий)</span>
            <div className={`${styles.value} ${data.overall.deviation_coefficient.overall > 0.3 ? styles.textRed : ''}`}>
              {data.overall.deviation_coefficient.overall.toFixed(3)}
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={styles.label}>Попадание (Исполнение)</span>
            <div className={styles.value}>
              {data.overall.execution_tolerance_percentage.toFixed(1)}%
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={styles.label}>Попадание (Артистизм)</span>
            <div className={styles.value}>
              {data.overall.artistic_tolerance_percentage.toFixed(1)}%
            </div>
          </div>
        </div>

        <section className={styles.filterSection}>
          <div className={styles.filterBlock}>
            <span className={styles.filterLabel}>ДИСЦИПЛИНЫ</span>
            <div className={styles.tagsGrid}>
              {data.disciplines.map((d: string) => (
                <button 
                  key={d} 
                  className={`${styles.tag} ${activeDiscipline === d ? styles.tagActive : ''}`}
                  onClick={() => setActiveDiscipline(activeDiscipline === d ? null : d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterBlock}>
            <span className={styles.filterLabel}>ВОЗРАСТНЫЕ КАТЕГОРИИ</span>
            <div className={styles.tagsGrid}>
              {data.age_categories.map((a: string) => (
                <button 
                  key={a} 
                  className={`${styles.tag} ${activeAge === a ? styles.tagActive : ''}`}
                  onClick={() => setActiveAge(activeAge === a ? null : a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.categoriesSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.resultsTitle}>Результаты по категориям</h2>
            {(activeDiscipline || activeAge) && (
              <button className={styles.resetLink} onClick={() => {setActiveDiscipline(null); setActiveAge(null)}}>
                Сбросить фильтры
              </button>
            )}
          </div>

          <div className={styles.categoriesGrid}>
            {filteredCategories.length > 0 ? (
              filteredCategories.map(([key, cat]: any) => (
                <div key={key} className={styles.categoryCard}>
                  <div className={styles.catHeader}>
                    <div className={styles.catTitles}>
                      <span className={styles.catAge}>{cat.age_category}</span>
                      <span className={styles.catDiscipline}>{cat.discipline}</span>
                    </div>
                    <div className={styles.catBias}>
                      <span className={styles.biasLabel}>Предвзятость:</span>
                      <span className={styles.biasValue}>{cat.bias_coefficient.toFixed(3)}</span>
                    </div>
                  </div>

                  <div className={styles.judgeScoresRow}>
                    {Object.entries(cat.avg_judge_scores).map(([num, score]: any) => (
                      <div key={num} className={styles.judgeBox}>
                        <span className={styles.jNum}>Судья {num}</span>
                        <span className={styles.jScore}>{Number(score).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.catFooter}>
                    Общее кол-во оценок: {cat.assessments_count}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>Нет данных по выбранным фильтрам</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}