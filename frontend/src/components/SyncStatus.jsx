import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function SyncStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await api.get('/users/me/sync-status');
        setStatus(data);
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!status || !status.syncing) return null;

  const stageLabels = {
    1: 'Fetching top artists...',
    2: 'Scanning liked songs & playlists...',
    3: 'Finding related artists & building recommendations...',
  };

  return (
    <div className="flex items-center gap-2 bg-surface-elevated rounded-full px-4 py-2 text-sm">
      <div className="animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full" />
      <span className="text-text-secondary">
        {stageLabels[status.stage] || 'Syncing...'}
      </span>
      {status.artists_found > 0 && (
        <span className="text-accent">{status.artists_found} artists</span>
      )}
    </div>
  );
}
