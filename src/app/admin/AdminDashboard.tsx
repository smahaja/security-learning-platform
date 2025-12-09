'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './admin.module.css';

interface Tutorial {
    id: string;
    title: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
}

const DEFAULT_CATEGORIES = [
    "LLM Security",
    "Cloud Infrastructure",
    "Adversarial ML",
    "Compliance & Governance",
    "Red Teaming"
];

export default function AdminDashboard({ initialTutorials }: { initialTutorials: Tutorial[] }) {
    const router = useRouter();
    const [tutorials, setTutorials] = useState<Tutorial[]>(initialTutorials);

    // Derive available categories dynamically from existing tutorials + defaults
    const availableCategories = Array.from(new Set([
        ...DEFAULT_CATEGORIES,
        ...tutorials.map(t => t.category).filter(Boolean)
    ])).sort();

    const [formData, setFormData] = useState({ title: '', description: '', content: '', category: 'LLM Security', tags: '' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleEdit = (tutorial: Tutorial) => {
        setEditingId(tutorial.id);
        setFormData({
            title: tutorial.title,
            description: tutorial.description,
            content: tutorial.content,
            category: tutorial.category,
            tags: tutorial.tags ? tutorial.tags.join(', ') : ''
        });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ title: '', description: '', content: '', category: 'LLM Security', tags: '' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tutorial?')) return;

        try {
            await fetch(`/api/tutorials/${id}`, { method: 'DELETE' });
            setTutorials(prev => prev.filter(t => t.id !== id));
            router.refresh();
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
            const url = editingId ? `/api/tutorials/${editingId}` : '/api/tutorials';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    content: formData.content,
                    category: formData.category,
                    tags: tagsArray
                })
            });

            if (res.ok) {
                const { tutorial } = await res.json();
                if (editingId) {
                    setTutorials(prev => prev.map(t => t.id === editingId ? tutorial : t));
                } else {
                    setTutorials(prev => [tutorial, ...prev]);
                }
                handleCancelEdit(); // Reset form
                router.refresh();
            }
        } catch (error) {
            console.error('Failed to save', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-xl" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Control Panel</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your learning modules and content.</p>
                </div>
                <Link href="/" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>&larr; Back to Platform</span>
                </Link>
            </div>

            <div className={styles.layout}>
                {/* Create Form */}
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--primary)' }}>{editingId ? '✏️' : '+'}</span> {editingId ? 'Edit Tutorial' : 'Publish New Content'}
                    </h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Title */}
                        <div>
                            <label className={styles.label}>Module Title</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="e.g. Advanced Prompt Injection Techniques"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        {/* Category & Tags Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className={styles.label}>Category</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <select
                                        className={styles.input}
                                        value={availableCategories.includes(formData.category) ? formData.category : 'Other'}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === 'Other') {
                                                setFormData({ ...formData, category: '' });
                                            } else {
                                                setFormData({ ...formData, category: val });
                                            }
                                        }}
                                    >
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option value="Other">Other (Create New)</option>
                                    </select>
                                    {(availableCategories.includes(formData.category) === false || formData.category === '') && (
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="Enter Custom Category Name"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            autoFocus
                                        />
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className={styles.label}>Tags (comma separated)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="e.g. red-teaming, owasp, basic"
                                    value={formData.tags}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className={styles.label}>Short Description</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Brief summary for the card view..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        {/* Content */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className={styles.label} style={{ marginBottom: 0 }}>HTML Content</label>
                                <label className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>
                                    📁 Import HTML File
                                    <input
                                        type="file"
                                        accept=".html,.htm"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    const text = ev.target?.result as string;
                                                    setFormData(prev => ({ ...prev, content: text }));
                                                };
                                                reader.readAsText(file);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                            <textarea
                                className={styles.textarea}
                                placeholder="Paste your full HTML content here..."
                                rows={10}
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                required
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                                Tip: You can paste a full standalone HTML file here. It will be rendered in a secure iframe.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                                {loading ? (editingId ? 'Updating...' : 'Publishing...') : (editingId ? 'Update Tutorial' : 'Publish Tutorial')}
                            </button>
                            {editingId && (
                                <button type="button" onClick={handleCancelEdit} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Tutorial List */}
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Active Tutorials ({tutorials.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {tutorials.map(t => (
                            <div key={t.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t.title}</h3>
                                        <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{t.category || 'General'}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>ID: {t.id}</p>

                                    {t.tags && t.tags.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {t.tags.map((tag, i) => (
                                                <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                                    <button
                                        onClick={() => handleEdit(t)}
                                        className="btn btn-outline"
                                        style={{ flex: 1, padding: '0.5rem', justifyContent: 'center', fontSize: '0.85rem' }}
                                    >
                                        Edit
                                    </button>
                                    <Link href={`/tutorial/${t.id}`} className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', justifyContent: 'center', fontSize: '0.85rem' }}>View Live</Link>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        className="btn btn-outline"
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            justifyContent: 'center',
                                            fontSize: '0.85rem',
                                            color: 'var(--accent-danger)',
                                            borderColor: 'rgba(239, 68, 68, 0.3)'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                        {tutorials.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                                No tutorials yet. Publish your first module.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
