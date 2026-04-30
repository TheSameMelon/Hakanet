'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import styles from './page.module.css';
import request from '@/core/api';

interface Judge {
  id: number;
  fio: string;
  region: string;
  city: string;
  rating: number;
}

export default function LandingPage() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopJudges = async () => {
    try {
      const res = await request('/referee/all', 'get');
      if (res.status === "success" && Array.isArray(res.data)) {
        const sorted = [...res.data]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 10);
        setJudges(sorted);
      }
    } catch (err) {
      console.error("Ошибка при получении судей:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopJudges();
    const interval = setInterval(fetchTopJudges, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.wrapper}>
      <header className={styles.hero}>
        <nav className={styles.nav}>
          <Link href="/Image.png" className={styles.logo}>
            AEROBIC <span>SPACE</span>
          </Link>
          
          <div className={styles.menu}>
            <Link href="/judges" className={styles.menuItem}>Судьи</Link>
            <Link href="/competitions" className={styles.menuItem}>Соревнования</Link>
            <Link href="/upload" className={styles.menuItem}>Загрузка</Link>
            <Link href="/archive" className={styles.menuItem}>Архив</Link>
          </div>
          <div className={styles.navSpacer}></div> 
        </nav>

        <motion.div 
          className={styles.heroContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className={styles.titleMain}>AEROBIC SPACE</h1>
          <p className={styles.subtitle}>Экосистема спортивной аэробики</p>
          <Link href="/judges">
            <button className={styles.ctaButton}>Перейти к аналитике</button>
          </Link>
        </motion.div>
      </header>

      <section className={styles.ratingSection}>
        <h2 className={styles.sectionTitle}>Топ-10 судей</h2>
        
        <div className={styles.listContainer}>
          <div className={styles.listHeader}>
            <span>#</span>
            <span>Судья</span>
            <span>Регион / Город</span>
            <span className={styles.centerText}>Рейтинг</span>
          </div>

          <div className={styles.listBody}>
            <AnimatePresence mode="popLayout">
              {judges.map((judge, index) => (
                <Link href="/" key={judge.id} className={styles.rowLink}>
                  <motion.div
                    layout
                    whileHover={{ backgroundColor: "rgba(21, 93, 252, 0.05)" }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 40 
                    }}
                    className={`${styles.row} ${index < 3 ? styles.topThree : ''}`}
                  >
                    <div className={styles.rank}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div className={styles.fio}>{judge.fio}</div>
                    <div className={styles.location}>{judge.region}, {judge.city}</div>
                    <div className={styles.score}>{judge.rating.toFixed(1)}</div>
                  </motion.div>
                </Link>
              ))}
            </AnimatePresence>

            {loading && judges.length === 0 && (
              <div className={styles.loader}>Загрузка данных...</div>
            )}
          </div>
        </div>
      </section>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            AEROBIC <span>SPACE</span>
          </div>
          <p>Tobkvant 2026</p>
        </div>
      </footer>
    </div> // это самый последний div обертки
  );
}