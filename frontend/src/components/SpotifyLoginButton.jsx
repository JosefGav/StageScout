import { api } from '../api/client';

function isValidSpotifyUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'accounts.spotify.com';
  } catch {
    return false;
  }
}

export default function SpotifyLoginButton() {
  const handleLogin = async () => {
    try {
      const data = await api.get('/auth/spotify/login');
      if (!isValidSpotifyUrl(data.url)) {
        console.error('Invalid Spotify login URL');
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error('Failed to get Spotify login URL:', err);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="btn-gradient text-white font-semibold px-10 py-4 rounded-2xl transition-all inline-flex items-center gap-3 text-base shadow-[0_4px_24px_rgba(255,90,54,0.3)]"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
      Connect with Spotify
    </button>
  );
}
