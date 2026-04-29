'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import request from '@/core/api';
import dynamic from 'next/dynamic';

// Динамический импорт для предотвращения ошибок SSR
const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Загрузка аналитики...</div>
});

export default function ProfilePage() {
  const params = useParams();
  const [user, setUser] = useState<any>(null);
  const [dispersion, setDispersion] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllData = async () => {
      if (!params.id) return;
      setLoading(true);
      setError(null);

      try {
        const [resProfile, resDispersion, resPerformances, resHeatmap] = await Promise.all([
          request(`/referee/profile/${params.id}`, 'get'),
          request(`/dispersion/profile/${params.id}`, 'get'),
          request(`/performances/referee/${params.id}`, 'get'),
          request(`/dispersion/heatmap/${params.id}`, 'get').catch(() => null)
        ]);

        if (resProfile?.status === "success") {
          const userData = resProfile.data;
          if (resPerformances?.status === "success") userData.performances = resPerformances.data;
          setUser(userData);
        }

        if (resDispersion?.status === "success" && resDispersion.data.length > 0) {
          const rawData = resDispersion.data[0];
          setDispersion({
            artistic: rawData.artistic ? JSON.parse(rawData.artistic) : null,
            execution: rawData.execution ? JSON.parse(rawData.execution) : null
          });
        }

        if (resHeatmap?.status === "success") {
          setHeatmapData(resHeatmap.data);
        }
      } catch (err) {
        setError("Ошибка связи с сервером");
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [params.id]);

  const prepareHeatmapSeries = () => {
    if (!heatmapData) return [];

    const execution = heatmapData.execution || {};
    const artistic = heatmapData.artistic || {};
    
    // Получаем все уникальные регионы из обоих объектов
    const regions = Array.from(new Set([...Object.keys(execution), ...Object.keys(artistic)]));

    if (regions.length === 0) return [];

    return [
      {
        name: 'Execution (Исполнение)',
        data: regions.map(region => ({
          x: region,
          y: execution[region] !== undefined ? parseFloat(execution[region].toFixed(2)) : 0
        }))
      },
      {
        name: 'Artistic (Артистизм)',
        data: regions.map(region => ({
          x: region,
          y: artistic[region] !== undefined ? parseFloat(artistic[region].toFixed(2)) : 0
        }))
      }
    ];
  };

  const heatmapOptions: any = {
    chart: {
      type: 'heatmap',
      toolbar: { show: false },
      animations: { enabled: true }
    },
    dataLabels: {
      enabled: true,
      style: { colors: ['#fff'], fontSize: '12px', fontWeight: '600' }
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 4,
        useFillColorAsStroke: false,
        colorScale: {
          ranges: [
            { from: -10, to: -0.51, name: 'Занижение', color: '#ef4444' },
            { from: -0.5, to: 0.5, name: 'Объективно', color: '#22c55e' },
            { from: 0.51, to: 10, name: 'Завышение', color: '#f59e0b' }
          ]
        }
      }
    },
    xaxis: {
      type: 'category',
      labels: {
        rotate: -45,
        trim: true,
        style: { fontSize: '11px', fontWeight: 500 }
      }
    },
    grid: { padding: { bottom: 20 } },
    tooltip: {
      y: { formatter: (val: number) => `${val > 0 ? '+' : ''}${val} (откл.)` }
    }
  };

  const getRatingClass = (diff: number) => {
    const absDiff = Math.abs(diff);
    if (absDiff > 1.5) return styles.ratingRed;
    if (absDiff >= 0.5) return styles.ratingYellow;
    return styles.ratingGreen;
  };

  if (loading) return <div className={styles.pageWrapper}><h3>Загрузка профиля...</h3></div>;
  if (error) return <div className={styles.pageWrapper}><h3 style={{color: 'red'}}>{error}</h3></div>;
  if (!user) return <div className={styles.pageWrapper}><h3>Судья не найден</h3></div>;

  const series = prepareHeatmapSeries();

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <div className={styles.iconCircle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
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

        {/* Сводные карточки */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.label}>Кол-во выходов</span>
            <div className={styles.value}>{user.performances?.length || 0}</div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.label}>Артистизм (Accuracy)</span>
            <div className={styles.value}>{dispersion?.artistic?.accuracy_rate ? (dispersion.artistic.accuracy_rate * 100).toFixed(1) + '%' : '—'}</div>
            <span className={`${styles.subStatus} ${dispersion?.artistic?.bias_interpretation === 'Объективен' ? styles.statusSuccess : ''}`}>
              {dispersion?.artistic?.bias_interpretation || 'Нет данных'}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.label}>Исполнение (Accuracy)</span>
            <div className={styles.value}>{dispersion?.execution?.accuracy_rate > 0 ? (dispersion.execution.accuracy_rate * 100).toFixed(1) + '%' : '—'}</div>
            <span className={`${styles.subStatus} ${dispersion?.execution?.bias_interpretation === 'Объективен' ? styles.statusSuccess : ''}`}>
              {dispersion?.execution?.bias_interpretation || 'Нет данных'}
            </span>
          </div>
        </div>

        {/* Таблица истории */}
        <section className={styles.historySection} style={{ marginBottom: '48px' }}>
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
                <div className={styles.emptyTable}>История отсутствует</div>
              )}
            </div>
          </div>
        </section>

        {/* Тепловая карта — Анализ отклонений по регионам */}
        {series.length > 0 ? (
          <section className={styles.heatmapSection} style={{ paddingBottom: '40px' }}>
            <h3 className={styles.heatmapTitle}>Дисперсия оценок по регионам участников</h3>
            <div className={styles.chartContainer}>
              <Chart 
                options={heatmapOptions} 
                series={series} 
                type="heatmap" 
                height={300} 
              />
            </div>
          </section>
        ) : (
          <div className={styles.statCard} style={{ textAlign: 'center', color: '#94a3b8' }}>
            Данные для анализа регионов отсутствуют
          </div>
        )}
      </main>
    </div>
  );
}