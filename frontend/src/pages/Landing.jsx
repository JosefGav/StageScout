import SpotifyLoginButton from '../components/SpotifyLoginButton';

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-grad-amber/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-grad-red/10 blur-[100px] pointer-events-none" />

      <div className="max-w-xl text-center relative z-10">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-grad-amber mb-8 shadow-[0_0_40px_rgba(255,90,54,0.4)]">
          <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Light beams */}
            <polygon points="5,2 2,14 8,14" fill="currentColor" opacity="0.35" />
            <polygon points="12,1 9,14 15,14" fill="currentColor" opacity="0.55" />
            <polygon points="19,2 16,14 22,14" fill="currentColor" opacity="0.35" />
            {/* Stage platform */}
            <rect x="1" y="17" width="22" height="3" rx="1" fill="currentColor" />
            {/* Stage edge highlight */}
            <line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            {/* Spotlight heads */}
            <circle cx="5" cy="2" r="1.5" fill="currentColor" />
            <circle cx="12" cy="1" r="1.8" fill="currentColor" />
            <circle cx="19" cy="2" r="1.5" fill="currentColor" />
          </svg>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
          <span className="text-gradient">StageScout</span>
        </h1>
        <p className="text-text-secondary text-lg md:text-xl mb-10 leading-relaxed max-w-md mx-auto">
          Connect your Spotify account to discover upcoming concerts from
          artists you love — and find new ones you'll like.
        </p>

        <SpotifyLoginButton />

        <p className="text-text-secondary/60 text-sm mt-8">
          We'll analyze your listening history to find concerts near you.
        </p>
      </div>
    </div>
  );
}
