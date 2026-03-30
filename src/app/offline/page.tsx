export default function OfflinePage() {
  return (
    <html>
      <body style={{ background: '#090d18', color: '#e8ecf4', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0, flexDirection: 'column', gap: 16, textAlign: 'center', padding: '0 24px' }}>
        <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#3b7fff,#7c3aff)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🛡</div>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Watchtower</h1>
        <p style={{ margin: 0, color: '#7a8aa4', fontSize: '0.9rem', maxWidth: 280 }}>You&apos;re offline. Connect to the internet to access your SOC dashboard.</p>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#4f8fff', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginTop: 8 }}>Try again</button>
      </body>
    </html>
  );
}
