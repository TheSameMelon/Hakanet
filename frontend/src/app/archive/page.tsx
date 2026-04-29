'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Импортируем роутер
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar/Sidebar';
import styles from './page.module.css';
import request from '@/core/api';

export default function ArchivePage() {
  const router = useRouter(); // Инициализируем роутер
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [archives, setArchives] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка списка архивов
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

  useEffect(() => {
    fetchArchives();
  }, []);

  // ЛОГИКА КНОПКИ ЗАМЕНИТЬ
  const handleSwitch = async (archiveName: string) => {
    try {
      const res = await request('/upload/switch', 'post', { archive: archiveName });
      
      if (res.status === "success") {
        // Если замена прошла успешно, летим на страницу судей
        router.push('/judges');
      } else {
        alert("Ошибка при переключении архива: " + (res.error || "неизвестная ошибка"));
      }
    } catch (err) {
      console.error("Ошибка при запросе switch:", err);
      alert("Сервер не ответил на запрос переключения");
    }
  };

  const deleteArchive = async (archiveName: string) => {
    if (confirm(`Удалить архив ${archiveName}?`)) {
      try {
        // Заглушка под удаление (если эндпоинт появится)
        // await request('/upload/archive/delete', 'post', { archive: archiveName });
        setArchives(prev => prev.filter(item => item !== archiveName));
      } catch (err) {
        alert("Не удалось удалить архив");
      }
    }
  };

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <main className={`${styles.mainContent} ${isCollapsed ? styles.expanded : ''}`}>
        <div className={styles.pageWrapper}>
          <header className={styles.header}>
            <h1 className={styles.title}>Архив данных</h1>
            <p className={styles.subtitle}>Список состояний системы. Выберите архив для активации данных.</p>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={styles.rowCard}
                    >
                      <div className={styles.col}>
                        <span className={styles.dateText}>{archiveName}</span>
                      </div>
                      
                      <div className={styles.colCenter}>
                        <div className={styles.actions}>
                          {/* КНОПКА ЗАМЕНИТЬ */}
                          <button 
                            className={styles.btnReplace}
                            onClick={() => handleSwitch(archiveName)}
                          >
                            Заменить
                          </button>
                          
                          <button 
                            className={styles.btnDelete} 
                            onClick={() => deleteArchive(archiveName)}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className={styles.loader}>Синхронизация с архивом...</div>
                )}
              </AnimatePresence>
              
              {!loading && archives.length === 0 && (
                <div className={styles.emptyState}>Архивных записей не обнаружено</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}