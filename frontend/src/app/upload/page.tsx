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
  const [isUploading, setIsUploading] = useState(false);
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

  // Проверка: загружены ли ВСЕ ТРИ файла
  const canUpload = files.referee && files.performance && files.score;

  const handleGlobalUpload = async () => {
    if (!canUpload) {
      alert("Необходимо выбрать все три файла!");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    
    // ВНИМАНИЕ: Ключи строго по твоему бэкенду
    formData.append('refreree', files.referee as File);
    formData.append('performance', files.performance as File);
    formData.append('assessments', files.score as File);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
        // Content-Type НЕ СТАВИМ, браузер сделает это сам
      });

      if (response.ok) {
        const result = await response.json();
        alert('Данные успешно загружены!');
        setFiles({ referee: null, performance: null, score: null });
      } else {
        const error = await response.json();
        alert(`Ошибка сервера: ${JSON.stringify(error.detail)}`);
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка сети или сервер недоступен');
    } finally {
      setIsUploading(false);
    }
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

          <button 
            className={styles.sendBtn} 
            disabled={!canUpload || isUploading} 
            onClick={handleGlobalUpload}
          >
            {isUploading ? 'Загрузка...' : 'Отправить все данные'}
          </button>
        </div>
      </main>
    </div>
  );
}