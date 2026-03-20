import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import LocationPicker from '../components/LocationPicker';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const [city, setCity] = useState(user?.city || '');
  const [latitude, setLatitude] = useState(user?.latitude ?? null);
  const [longitude, setLongitude] = useState(user?.longitude ?? null);
  const [radius, setRadius] = useState(user?.search_radius_miles || 50);
  const [digestEnabled, setDigestEnabled] = useState(user?.digest_enabled ?? true);
  const [digestFrequency, setDigestFrequency] = useState(user?.digest_frequency || 'weekly');

  const saveLocation = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.put('/users/me', {
        city,
        latitude,
        longitude,
        search_radius_miles: radius,
      });
      setUser(prev => ({ ...prev, ...updated }));
      setMessage('Location saved!');
    } catch (err) {
      setMessage(err.message);
    }
    setSaving(false);
  };

  const saveNotifications = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.put('/users/me/notifications', {
        digest_enabled: digestEnabled,
        digest_frequency: digestFrequency,
      });
      setUser(prev => ({ ...prev, digest_enabled: digestEnabled, digest_frequency: digestFrequency }));
      setMessage('Notification preferences saved!');
    } catch (err) {
      setMessage(err.message);
    }
    setSaving(false);
  };

  const triggerSync = async () => {
    setSyncing(true);
    setMessage('');
    try {
      await api.post('/users/me/sync');
      setMessage('Sync started! Check back in a few minutes.');
    } catch (err) {
      setMessage(err.message);
    }
    setSyncing(false);
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-extrabold mb-8">Settings</h1>

      {message && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl px-5 py-3 mb-6 text-sm text-accent font-medium">
          {message}
        </div>
      )}

      {/* Location */}
      <section className="glow-card bg-surface-card rounded-2xl p-6 md:p-8 mb-5">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Location
        </h2>
        <LocationPicker
          city={city}
          setCity={setCity}
          latitude={latitude}
          longitude={longitude}
          setLatLng={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
          radius={radius}
          setRadius={setRadius}
        />
        <button
          onClick={saveLocation}
          disabled={saving}
          className="mt-5 btn-gradient text-white px-6 py-2.5 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Location'}
        </button>
      </section>

      {/* Notifications */}
      <section className="glow-card bg-surface-card rounded-2xl p-6 md:p-8 mb-5">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notifications
        </h2>
        <label className="flex items-center gap-3 cursor-pointer mb-5 group">
          <div className="relative">
            <input
              type="checkbox"
              checked={digestEnabled}
              onChange={e => setDigestEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-white/10 rounded-full peer-checked:bg-accent transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow" />
          </div>
          <span className="text-sm">Email digest enabled</span>
        </label>
        <div>
          <label className="text-sm text-text-secondary block mb-2">Frequency</label>
          <select
            value={digestFrequency}
            onChange={e => setDigestFrequency(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 appearance-none cursor-pointer"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="never">Never</option>
          </select>
        </div>
        <button
          onClick={saveNotifications}
          disabled={saving}
          className="mt-5 btn-gradient text-white px-6 py-2.5 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </section>

      {/* Sync */}
      <section className="glow-card bg-surface-card rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Spotify Sync
        </h2>
        <p className="text-sm text-text-secondary mb-5">
          Re-sync your Spotify library to discover new artists and update recommendations.
        </p>
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="btn-gradient text-white px-6 py-2.5 rounded-xl font-semibold transition disabled:opacity-50"
        >
          {syncing ? 'Starting...' : 'Re-sync Now'}
        </button>
      </section>
    </div>
  );
}
