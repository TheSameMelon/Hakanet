'use client';

import React, { useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import styles from './page.module.css';

type UploadType = 'referee' | 'performance' | 'score';

type FilesState = {
  [key in UploadType]: File | null;
};

export default function UploadPage() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedType, setSelectedType] = useState<UploadType>('referee');
  const [files, setFiles] = useState<FilesState>({
    referee: null,
    performance: null,
    score: null
  });

  const [dragActive, setDragActive] = useState(false);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerError = () => {
    setIsError(true);
    setTimeout(() => setIsError(false), 1000);
  };

  const validateAndSetFile = (selectedFile: File | undefined) => {
    if (selectedFile?.name.endsWith('.csv')) {
      setFiles(prev => ({ ...prev, [selectedType]: selectedFile }));
    } else if (selectedFile) {
      triggerError();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Проверка: загружен ли хоть один файл вообще?
  const hasAnyFiles = Object.values(files).some(file => file !== null);

  const handleGlobalUpload = () => {
    if (!hasAnyFiles) return;

    // Собираем список того, что отправляем
    const toUpload = Object.entries(files)
      .filter(([_, file]) => file !== null)
      .map(([type, file]) => `${type}: ${file?.name}`);

    console.log("Отправка пакета данных:", toUpload);

    // Полная очистка всех вкладок
    setFiles({ referee: null, performance: null, score: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    alert(`Успешно отправлено файлов: ${toUpload.length}`);
  };

  const currentFile = files[selectedType];

  return (
    <div className={`${styles.layoutWrapper} ${isError ? styles.errorFlash : ''}`}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <main className={`${styles.mainContent} ${isCollapsed ? '' : styles.contentExpanded}`}>
        <div className={styles.uploadContainer}>
          
          <div className={styles.typeSelector}>
            {(['referee', 'performance', 'score'] as const).map((type) => (
              <button 
                key={type}
                className={`
                  ${styles.typeBtn} 
                  ${selectedType === type ? styles.activeType : ''} 
                  ${files[type] ? styles.hasData : ''}
                `}
                onClick={() => setSelectedType(type)}
              >
                {type === 'referee' ? 'Судьи' : type === 'performance' ? 'Выступления' : 'Оценки'}
                {files[type] && <span className={styles.dot}>●</span>}
              </button>
            ))}
          </div>

          <div 
            className={`
              ${styles.dropZone} 
              ${dragActive ? styles.dragActive : ''} 
              ${currentFile ? styles.fileSelected : ''}
            `}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              validateAndSetFile(e.dataTransfer.files?.[0]);
            }}
          >
            <input 
              type="file" 
              accept=".csv" 
              className={styles.hiddenInput} 
              id="fileInput"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <label htmlFor="fileInput" className={styles.dropLabel}>
              <span className={styles.uploadIcon}>{currentFile ? '📄' : '📥'}</span>
              <p className={styles.mainText}>
                {currentFile ? currentFile.name : 'Перетащите файл сюда'}
              </p>
              <p className={styles.subText}>
                {currentFile ? `${(currentFile.size / 1024).toFixed(1)} KB` : 'или выберите CSV файл'}
              </p>
              <div className={styles.selectBtn}>
                {currentFile ? 'Заменить файл' : 'Выбрать данные'}
              </div>
            </label>
          </div>

          {/* ОБЩАЯ КНОПКА ОТПРАВКИ */}
          <button 
            className={styles.sendBtn} 
            disabled={!hasAnyFiles} 
            onClick={handleGlobalUpload}
          >
            Отправить всё выбранное
          </button>
        </div>
      </main>
    </div>
  );
}