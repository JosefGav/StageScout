import SpotifyLoginButton from '../components/SpotifyLoginButton';

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <div className="text-6xl mb-6">🎵</div>
        <h1 className="text-4xl font-bold text-text-primary mb-4">
          Concert Discovery
        </h1>
        <p className="text-text-secondary text-lg mb-8">
          Connect your Spotify account to discover upcoming concerts from
          artists you love — and find new ones you'll like.
        </p>
        <SpotifyLoginButton />
        <p className="text-text-secondary text-sm mt-6">
          We'll analyze your listening history to find concerts near you.
        </p>
      </div>
    </div>
  );
}
