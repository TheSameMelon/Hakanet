'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import styles from './page.module.css';
import request from '@/core/api';
import Link from 'next/link';

export default function CompetitionsPage() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await request('/dispersion/competitions/', 'get');
        if (res.status === "success") {
          const items = Array.isArray(res.data) ? res.data : Object.entries(res.data).map(([name, stats]: any) => ({
            name,
            ...stats
          }));
          setData(items);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = data.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <main className={`${styles.mainContent} ${isCollapsed ? '' : styles.contentExpanded}`}>
        <header className={styles.header}>
          <div className={styles.searchWrapper} data-focused={isFocused}>
            <input 
              type="text" 
              placeholder="Найти соревнование..." 
              className={styles.searchInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
        </header>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Название соревнования</th>
                <th>Исполнение (Execution)</th>
                <th>Артистизм (Artistic)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className={styles.infoCell}>Загрузка статистики...</td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <Link key={idx} href={`/competitions/${encodeURIComponent(item.name)}`} legacyBehavior passHref>
                    <tr className={styles.clickableRow}>
                      <td className={styles.nameCell}>{item.name}</td>
                      <td>
                        <StatBlock stats={item.execution} color="#10b981" />
                      </td>
                      <td>
                        <StatBlock stats={item.artistic} color="#155DFC" />
                      </td>
                    </tr>
                  </Link>
                ))
              ) : (
                <tr><td colSpan={3} className={styles.infoCell}>Соревнования не найдены</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function StatBlock({ stats, color }: any) {
  // Округляем до 2 знаков
  const formattedPercent = stats.percentage ? Number(stats.percentage).toFixed(2) : "0.00";

  return (
    <div className={styles.statContainer}>
      <div className={styles.statInfo}>
        <span className={styles.fraction}>
          {stats.within_tolerance} / {stats.total}
        </span>
        <span className={styles.percent}>
          {formattedPercent}%
        </span>
      </div>
      <div className={styles.progressTrack}>
        <div 
          className={styles.progressBar} 
          style={{ width: `${stats.percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}