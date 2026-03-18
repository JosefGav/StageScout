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
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {message && (
        <div className="bg-surface-elevated rounded-lg px-4 py-3 mb-4 text-sm text-accent">
          {message}
        </div>
      )}

      {/* Location */}
      <section className="bg-surface-elevated rounded-lg p-6 mb-4">
        <h2 className="text-lg font-semibold mb-4">Location</h2>
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
          className="mt-4 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Location'}
        </button>
      </section>

      {/* Notifications */}
      <section className="bg-surface-elevated rounded-lg p-6 mb-4">
        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={digestEnabled}
            onChange={e => setDigestEnabled(e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          <span className="text-sm">Email digest enabled</span>
        </label>
        <div>
          <label className="text-sm text-text-secondary block mb-1">Frequency</label>
          <select
            value={digestFrequency}
            onChange={e => setDigestFrequency(e.target.value)}
            className="w-full bg-surface rounded-lg px-3 py-2 text-text-primary border border-surface-hover focus:border-accent focus:outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="never">Never</option>
          </select>
        </div>
        <button
          onClick={saveNotifications}
          disabled={saving}
          className="mt-4 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </section>

      {/* Sync */}
      <section className="bg-surface-elevated rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Spotify Sync</h2>
        <p className="text-sm text-text-secondary mb-4">
          Re-sync your Spotify library to discover new artists and update recommendations.
        </p>
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {syncing ? 'Starting...' : 'Re-sync Now'}
        </button>
      </section>
    </div>
  );
}
