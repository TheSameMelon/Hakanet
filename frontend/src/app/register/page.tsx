'use client';

import { useState, FormEvent } from 'react';
import useRegister from '@/modules/register/service';
import { APIResponce, Roles } from '@/core/types';
import { RegisterData} from '@/modules/register/types';
import styles from './page.module.css';

export default function RegisterPage() {
    const [loading, register] = useRegister();
    const [formData, setFormData] = useState<RegisterData>({
        username: '',
        password: '',
        role: Roles.USER
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);
        
        const result: APIResponce = await register(formData);
        
        if (result.status === 'success') {
            setMessage({ type: 'success', text: 'Registration successful! Redirecting...' });
            setTimeout(() => {
                // Перенаправление на страницу входа или дашборд
                window.location.href = '/login';
            }, 1500);
        } else {
            setMessage({ type: 'error', text: result.error || 'Registration failed. Please try again.' });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={styles.gradient}></div>
            </div>
            
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Create Account</h1>
                    <p className={styles.subtitle}>Join our community today</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username" className={styles.label}>
                            Username
                        </label>
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
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={styles.input}
                            placeholder="Enter your password"
                            required
                            minLength={6}
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="role" className={styles.label}>
                            Role
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className={styles.select}
                            disabled={loading}
                        >
                            <option value={Roles.USER}>User</option>
                            <option value={Roles.MENTOR}>MENTOR</option>
                        </select>
                    </div>

                    {message && (
                        <div className={`${styles.message} ${styles[message.type]}`}>
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
                                Creating account...
                            </span>
                        ) : (
                            'Register'
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        Already have an account?{' '}
                        <a href="/login" className={styles.link}>Sign in</a>
                    </p>
                </div>
            </div>
        </div>
    );
}