'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
// Removed Image import as per new design requirement

interface Tutorial {
    id: string;
    title: string;
    description: string;
    category?: string;
    tags?: string[];
    createdAt: string;
}

const CATEGORIES = [
    "All",
    "LLM Security",
    "Cloud Infrastructure",
    "Adversarial ML",
    "Compliance & Governance",
    "Red Teaming",
    "Other"
];

export default function TutorialLibrary({ tutorials }: { tutorials: Tutorial[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const filteredTutorials = useMemo(() => {
        return tutorials.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

            const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [tutorials, searchTerm, selectedCategory]);

    return (
        <section id="library" style={{ padding: '5rem 0' }}>
            <div className="container-xl">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '3rem', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Learning Library</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Explore our comprehensive security modules.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', border: '1px solid var(--glass-border)' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    background: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                                    border: 'none',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '6px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                                title="Grid View"
                            >
                                ⊞
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    background: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                                    border: 'none',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '6px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                                title="List View"
                            >
                                ☰
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="Search keywords..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                color: 'white',
                                padding: '0.6rem 1rem',
                                borderRadius: '8px',
                                minWidth: '250px'
                            }}
                        />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                color: 'white',
                                padding: '0.6rem 1rem',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat} style={{ background: '#1e1e2e' }}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{
                    display: viewMode === 'grid' ? 'grid' : 'flex',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'none',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {filteredTutorials.map((t) => (
                        <div key={t.id} className="glass-card element-hover" style={{
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            borderTop: '1px solid rgba(255,255,255,0.1)',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '220px'
                        }}>
                            {/* Decorative gradient top bar */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '2px',
                                background: 'linear-gradient(90deg, var(--primary) 0%, transparent 100%)'
                            }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                {t.category ? (
                                    <span className="badge badge-blue" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                                        {t.category.toUpperCase()}
                                    </span>
                                ) : <span></span>}
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                    {new Date(t.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <Link href={`/tutorial/${t.id}`} style={{ textDecoration: 'none' }}>
                                <h3 style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    marginBottom: '0.5rem',
                                    lineHeight: 1.3,
                                    color: '#fff'
                                }}>
                                    {t.title}
                                </h3>
                            </Link>

                            <p style={{
                                color: 'var(--text-secondary)',
                                marginBottom: '1rem',
                                lineHeight: 1.5,
                                fontSize: '0.85rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                flex: 1
                            }}>
                                {t.description}
                            </p>

                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', maxWidth: '70%' }}>
                                    {t.tags && t.tags.slice(0, 2).map((tag, i) => (
                                        <span key={i} style={{
                                            fontSize: '0.7rem',
                                            color: '#94a3b8',
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                <Link href={`/tutorial/${t.id}`} style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap'
                                }}>
                                    Open &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}

                    {filteredTutorials.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>
                            <h3 style={{ marginBottom: '1rem' }}>No modules found.</h3>
                            <p>Try adjusting your search criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
