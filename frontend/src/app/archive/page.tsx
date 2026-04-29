'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar/Sidebar';
import styles from './page.module.css';

// Пример данных: ID сезона теперь в формате YYYYMMDDHHMM
const initialArchives = [
  { id: 101, fullDate: "150120261430", displayDate: "15.01.2026 14:30" },
  { id: 102, fullDate: "200520251015", displayDate: "20.05.2025 10:15" },
  { id: 103, fullDate: "120620241800", displayDate: "12.06.2024 18:00" },
  { id: 104, fullDate: "010920230945", displayDate: "01.09.2023 09:45" },
];

export default function ArchivePage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [archives, setArchives] = useState(initialArchives);

  const deleteArchive = (id: number) => {
    if (confirm('Удалить эту запись из архива?')) {
      setArchives(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <main className={`${styles.mainContent} ${isCollapsed ? styles.expanded : ''}`}>
        <div className={styles.pageWrapper}>
          <header className={styles.header}>
            <h1 className={styles.title}>Архив данных</h1>
            <p className={styles.subtitle}>Список состояний системы по дате и времени</p>
          </header>

          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              {/* ЗАМЕНЕНО: Заголовок */}
              <div className={styles.col}>Дата и время архива</div>
              <div className={styles.colCenter}>Действия</div>
            </div>

            <div className={styles.rowsContainer}>
              <AnimatePresence mode="popLayout">
                {archives.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    className={styles.rowCard}
                  >
                    <div className={styles.col}>
                      {/* ЗАМЕНЕНО: Вывод ID без точек (дата+время) */}
                      <span className={styles.dateText}>{item.fullDate}</span>
                    </div>
                    
                    <div className={styles.colCenter}>
                      <div className={styles.actions}>
                        <button className={styles.btnReplace}>Заменить</button>
                        <button 
                          className={styles.btnDelete} 
                          onClick={() => deleteArchive(item.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}