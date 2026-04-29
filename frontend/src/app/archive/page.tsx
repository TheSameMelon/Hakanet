'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar/Sidebar';
import styles from './page.module.css';
import request from '@/core/api';

export default function ArchivePage() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [archives, setArchives] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Получаем активный архив из localStorage, если там пусто — ставим "Basic"
  const [activeArchive, setActiveArchive] = useState<string>('Basic');

  useEffect(() => {
    // Выполняем в useEffect, так как localStorage доступен только в браузере
    const stored = localStorage.getItem('activeArchive');
    if (stored) {
      setActiveArchive(stored);
    } else {
      localStorage.setItem('activeArchive', 'Basic');
    }
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      const res = await request('/upload/archive/', 'get');
      if (res.status === "success" && Array.isArray(res.data)) {
        setArchives(res.data);
      }
    } catch (err) {
      console.error("Ошибка при загрузке архива:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (archiveName: string) => {
    try {
      const res = await request('/upload/switch', 'post', { archive: archiveName });
      
      if (res.status === "success") {
        localStorage.setItem('activeArchive', archiveName);
        setActiveArchive(archiveName); // Обновляем стейт сразу
        router.push('/judges');
      } else {
        alert("Ошибка при переключении: " + (res.error || "неизвестная ошибка"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (archiveName: string) => {
    // Сравниваем с текущим активным архивом
    if (activeArchive === archiveName) {
      alert(`Нельзя удалить архив "${archiveName}", так как он активен в данный момент!`);
      return;
    }

    if (!confirm(`Вы уверены, что хотите безвозвратно удалить архив ${archiveName}?`)) {
      return;
    }

    try {
      const res = await request('/upload/delete', 'post', { archive: archiveName });
      
      if (res.status === "success") {
        setArchives(prev => prev.filter(item => item !== archiveName));
      } else {
        alert("Ошибка сервера при удалении");
      }
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      alert("Не удалось связаться с сервером");
    }
  };

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <main className={`${styles.mainContent} ${isCollapsed ? styles.expanded : ''}`}>
        <div className={styles.pageWrapper}>
          <header className={styles.header}>
            <h1 className={styles.title}>Архив данных</h1>
            <p className={styles.subtitle}>Управление сохранениями системы</p>
          </header>

          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <div className={styles.col}>Дата и время архива (ID)</div>
              <div className={styles.colCenter}>Действия</div>
            </div>

            <div className={styles.rowsContainer}>
              <AnimatePresence mode="popLayout">
                {!loading ? (
                  archives.map((archiveName) => (
                    <motion.div 
                      key={archiveName}
                      layout
                      className={styles.rowCard}
                    >
                      <div className={styles.col}>
                        <span className={styles.dateText}>{archiveName}</span>
                        {/* Бейдж активного архива */}
                        {activeArchive === archiveName && (
                          <span className={styles.activeBadge}>Активен</span>
                        )}
                      </div>
                      
                      <div className={styles.colCenter}>
                        <div className={styles.actions}>
                          <button 
                            className={styles.btnReplace}
                            onClick={() => handleSwitch(archiveName)}
                          >
                            Заменить
                          </button>
                          
                          <button 
                            className={styles.btnDelete} 
                            onClick={() => handleDelete(archiveName)}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className={styles.loader}>Загрузка данных...</div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}