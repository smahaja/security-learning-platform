import Link from 'next/link';
import styles from './page.module.css';
import TutorialLibrary from './TutorialLibrary';
import { getTutorials } from '@/lib/tutorials';

export const dynamic = 'force-dynamic';

export default function Home() {
  const allTutorials = getTutorials();

  // Sort by newest first
  const sortedTutorials = [...allTutorials].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const featured = sortedTutorials.slice(0, 2);

  return (
    <main className={styles.mainWrapper}>
      <div className="bg-grid absolute inset-0 z-0"></div>
      <div className="glow-orb" style={{ top: '-10%', left: '20%' }}></div>
      <div className="glow-orb" style={{ bottom: '10%', right: '10%', background: 'rgb(6, 182, 212)' }}></div>

      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navLogo}>
          <div className={styles.navIcon}>🛡️</div>
          <span className="text-gradient">SecPlatform</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/admin" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
            Admin Panel
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.heroSection}>
        <div className="container-xl" style={{ position: 'relative', zIndex: 2 }}>
          <div className={styles.heroContent}>
            <div className="badge badge-blue mb-4">v2.0 Platform Live</div>
            <h1 className={styles.heroTitle}>
              Master <span className={styles.highlight}>Cloud & AI Security</span>
            </h1>
            <p className={styles.heroSubtitle}>
              A professional learning ecosystem designed for security architects.
              Explore interactive modules on LLM reasoning and cloud defense.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
              <Link href="#featured" className="btn btn-outline" style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}>
                Explore Modules
              </Link>
            </div>
          </div>
        </div>
        <div className={styles.heroGlow} />
      </header>

      {/* Featured Section */}
      <section id="featured" className={styles.section} style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="container-xl">
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Latest Intelligence</h2>
              <p className={styles.sectionDiff}>Freshly published security briefings.</p>
            </div>
            <div className="badge badge-new">New Releases</div>
          </div>

          <div className={styles.grid}>
            {featured.map(t => (
              <Link href={`/tutorial/${t.id}`} key={t.id} className="glass-card element-hover" style={{
                overflow: 'hidden',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                position: 'relative'
              }}>
                {/* Decorative gradient top bar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  background: 'linear-gradient(90deg, var(--accent-primary) 0%, transparent 100%)'
                }}></div>

                <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                  <span className="badge badge-new" style={{ fontSize: '0.7rem' }}>FEATURED</span>
                  {t.category && <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{t.category.toUpperCase()}</span>}
                </div>

                <h3 className={styles.cardTitle} style={{
                  fontSize: '1.75rem',
                  marginBottom: '1rem',
                  background: 'linear-gradient(to right, #fff, #94a3b8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2
                }}>{t.title}</h3>

                <p className={styles.cardDesc} style={{ flex: 1, fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>{t.description}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    Read Briefing <span>&rarr;</span>
                  </span>
                </div>
              </Link>
            ))}
            {featured.length === 0 && <div style={{ color: '#64748b' }}>No featured content yet.</div>}
          </div>
        </div>
      </section>

      {/* Library Section (Client Component) */}
      <TutorialLibrary tutorials={sortedTutorials} />

      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '2rem 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        <div className="container-xl">
          <p>&copy; 2025 AI Security Platform. Enterprise Grade Learning.</p>
        </div>
      </footer>
    </main>
  );
}
