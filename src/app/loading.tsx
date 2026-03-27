export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#090d18',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter,sans-serif',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect width="44" height="44" rx="11" fill="url(#lg)"/>
          <path d="M22 8L32 13V20C32 26 27.5 31.5 22 33.5C16.5 31.5 12 26 12 20V13L22 8Z"
            fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.9"/>
          <path d="M19 20.5L21.5 23L26 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b7fff"/><stop offset="1" stopColor="#7c3aff"/>
            </linearGradient>
          </defs>
        </svg>
        <div style={{ display: 'flex', gap: 5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%', background: '#4f8fff',
              animation: 'pulse 1.2s ease infinite',
              animationDelay: `${i * 0.18}s`,
              opacity: 0.6,
            }}/>
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
      </div>
    </div>
  );
}
