'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import request from '@/core/api';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Загрузка аналитики...</div>
});

export default function ProfilePage() {
  const params = useParams();
  const [user, setUser] = useState<any>(null);
  const [dispersion, setDispersion] = useState<any>(null);
  const [strictness, setStrictness] = useState<any>(null); // Новое состояние
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllData = async () => {
      if (!params.id) return;
      setLoading(true);
      setError(null);

      try {
        const [resProfile, resDispersion, resPerformances, resHeatmap, resStrictness] = await Promise.all([
          request(`/referee/profile/${params.id}`, 'get'),
          request(`/dispersion/profile/${params.id}`, 'get'),
          request(`/performances/referee/${params.id}`, 'get'),
          request(`/dispersion/heatmap/${params.id}`, 'get').catch(() => null),
          request(`/dispersion/strictness/${params.id}`, 'get').catch(() => null) // Новый запрос
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

        if (resStrictness?.status === "success") {
          setStrictness(resStrictness.data);
        }
      } catch (err) {
        setError("Ошибка связи с сервером");
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [params.id]);

  // Расчет среднего вердикта строгости
  const getStrictnessVerdict = () => {
    if (!strictness) return 'Нет данных';
    const categories = ['weak', 'medium', 'strong'];
    const verdicts = categories
      .map(cat => strictness[cat]?.verdict)
      .filter(v => v && v !== 'объективен');
    
    return verdicts.length > 0 ? verdicts[0] : 'Объективен';
  };

  // Расчет средней тяжести (Severity)
  const getAvgSeverity = () => {
    if (!strictness) return null;
    const vals = [strictness.weak?.severity, strictness.medium?.severity, strictness.strong?.severity]
      .filter(v => v !== undefined);
    if (vals.length === 0) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return (avg * 100).toFixed(1) + '%';
  };

  const prepareHeatmapSeries = () => {
    if (!heatmapData) return [];
    const execution = heatmapData.execution || {};
    const artistic = heatmapData.artistic || {};
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
    chart: { type: 'heatmap', toolbar: { show: false }, animations: { enabled: true } },
    dataLabels: { enabled: true, style: { colors: ['#fff'], fontSize: '12px', fontWeight: '600' } },
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
    xaxis: { type: 'category', labels: { rotate: -45, trim: true, style: { fontSize: '11px', fontWeight: 500 } } },
    grid: { padding: { bottom: 20 } },
    tooltip: { y: { formatter: (val: number) => `${val > 0 ? '+' : ''}${val} (откл.)` } }
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

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <Link href="/judges" className={styles.backButton}>
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

          {/* НОВАЯ КАРТОЧКА: СТРОГОСТЬ */}
          <div className={styles.statCard}>
            <span className={styles.label}>Строгость (Severity)</span>
            <div className={styles.value}>{getAvgSeverity() || '—'}</div>
            <span className={`${styles.subStatus} ${getStrictnessVerdict() === 'Объективен' ? styles.statusSuccess : ''}`}>
              {getStrictnessVerdict()}
            </span>
          </div>
        </div>

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
              {user.performances?.length > 0 ? (
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

        {prepareHeatmapSeries().length > 0 ? (
          <section className={styles.heatmapSection} style={{ paddingBottom: '40px' }}>
            <h3 className={styles.heatmapTitle}>Дисперсия оценок по регионам участников</h3>
            <div className={styles.chartContainer}>
              <Chart options={heatmapOptions} series={prepareHeatmapSeries()} type="heatmap" height={300} />
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