'use client';

import { useState, FormEvent, useEffect } from 'react';
import useAuth from '@/modules/auth/service';
import AuthData from "@/modules/auth/types"
import { APIResponce } from '@/core/types';
import styles from './page.module.css';

export default function LoginPage() {
    const [loading, auth] = useAuth();
    const [formData, setFormData] = useState<AuthData>({
        username: '',
        password: ''
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        
        const result: APIResponce = await auth(formData);
        
        if (result.status === 'success') {
            setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
            // Сохраняем токен в localStorage (или в cookie)
            if (result.data?.token) {
                localStorage.setItem('authToken', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
            }
            
            setTimeout(() => {
                // Перенаправление на дашборд или главную страницу
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            setMessage({ type: 'error', text: result.error || 'Login failed. Please try again.' });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDemoLogin = () => {
        setFormData({
            username: 'demo',
            password: 'demo123'
        });
    };

    // Очищаем сообщение при изменении полей
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [formData, message]);

    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={styles.gradient}></div>
                <div className={styles.particles}>
                    <div className={styles.particle}></div>
                    <div className={styles.particle}></div>
                    <div className={styles.particle}></div>
                    <div className={styles.particle}></div>
                </div>
            </div>
            
            <div className={styles.card}>
                
                <div className={styles.header}>
                    <h1 className={styles.title}>Welcome Back</h1>
                    <p className={styles.subtitle}>Sign in to continue to your account</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username" className={styles.label}>
                            Username
                            <span className={styles.required}>*</span>
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Enter your username"
                                required
                                minLength={3}
                                disabled={loading}
                                autoComplete="username"
                            />
                        </div>
                        <div className={styles.inputHint}>
                            Min. 3 characters
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Password
                            <span className={styles.required}>*</span>
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Enter your password"
                                required
                                minLength={6}
                                disabled={loading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={styles.passwordToggle}
                                disabled={loading}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        <div className={styles.inputHint}>
                            Min. 6 characters
                        </div>
                    </div>

                    {/*<div className={styles.options}>
                        <label className={styles.checkboxLabel}>
                            <input type="checkbox" className={styles.checkbox} />
                            <span>Remember me</span>
                        </label>
                        <a href="/forgot-password" className={styles.forgotLink}>
                            Forgot password?
                        </a>
                    </div> */ }

                    {/* Тестовые поля согласно вашему заданию */}
                    

                    {message && (
                        <div className={`${styles.message} ${styles[message.type]}`}>
                            <span className={styles.messageIcon}>
                                {message.type === 'success' ? '✓' : '✗'}
                            </span>
                            {message.text}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className={styles.loader}>
                                <span className={styles.spinner}></span>
                                Authenticating...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        Don't have an account?{' '}
                        <a href="/register" className={styles.link}>Create Account</a>
                    </p>
                </div>
            </div>
        </div>
    );
}