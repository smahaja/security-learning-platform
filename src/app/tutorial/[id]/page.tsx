import { getTutorial } from '@/lib/tutorials';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TutorialPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const tutorial = getTutorial(id);

    if (!tutorial) {
        notFound();
    }

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
            {/* Floating Navigation Controls */}
            <div className="glass-panel" style={{
                position: 'absolute',
                bottom: '2rem',
                right: '2rem',
                zIndex: 50,
                padding: '0.75rem 1.5rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                background: 'rgba(5, 5, 16, 0.8)'
            }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
                    <span style={{ fontSize: '1.2rem' }}>&larr;</span> Back to Dashboard
                </Link>
                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>
                <a
                    href={`/tutorial/${tutorial.id}/raw`}
                    target="_blank"
                    style={{ fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
                    title="Open raw HTML in new tab"
                >
                    Open New Tab ↗
                </a>
            </div>

            {/* Full Screen Content */}
            <iframe
                src={`/tutorial/${tutorial.id}/raw`}
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    background: '#fff'
                }}
                title={tutorial.title}
            />
        </div>
    );
}
