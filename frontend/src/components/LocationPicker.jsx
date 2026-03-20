import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { searchCity, reverseGeocode } from '../utils/nominatim';
import useDebounce from '../hooks/useDebounce';

// Fix default marker icons (bundler workaround)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [39.8, -98.5];
const DEFAULT_ZOOM = 4;
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

function MapClickHandler({ onClick }) {
  useMapEvents({ click: e => onClick(e.latlng) });
  return null;
}

function MapAutoFit({ lat, lng, radiusMiles }) {
  const map = useMap();
  useEffect(() => {
    if (lat == null || lng == null) return;
    // Defer fitBounds until map is ready (has a valid size)
    const fit = () => {
      const radiusMeters = radiusMiles * 1609.34;
      const center = L.latLng(lat, lng);
      const bounds = center.toBounds(radiusMeters * 2);
      map.fitBounds(bounds, { padding: [20, 20] });
    };
    if (map.getSize().x > 0) {
      fit();
    } else {
      map.whenReady(fit);
    }
  }, [lat, lng, radiusMiles, map]);
  return null;
}

export default function LocationPicker({ city, setCity, latitude, longitude, setLatLng, radius, setRadius }) {
  const [query, setQuery] = useState(city || '');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const wrapperRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search as user types
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) {
      setResults([]);
      return;
    }
    let cancelled = false;
    searchCity(debouncedQuery).then(r => {
      if (!cancelled) {
        setResults(r);
        setShowDropdown(r.length > 0);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const selectResult = (r) => {
    setCity(r.city || r.display_name.split(',')[0]);
    setQuery(r.city || r.display_name.split(',')[0]);
    setLatLng(r.lat, r.lon);
    setShowDropdown(false);
    setResults([]);
  };

  const handleMapClick = async (latlng) => {
    setLatLng(latlng.lat, latlng.lng);
    try {
      const r = await reverseGeocode(latlng.lat, latlng.lng);
      setCity(r.city || r.display_name.split(',')[0]);
      setQuery(r.city || r.display_name.split(',')[0]);
    } catch {}
  };

  const handleMarkerDrag = async (e) => {
    const { lat, lng } = e.target.getLatLng();
    setLatLng(lat, lng);
    try {
      const r = await reverseGeocode(lat, lng);
      setCity(r.city || r.display_name.split(',')[0]);
      setQuery(r.city || r.display_name.split(',')[0]);
    } catch {}
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLatLng(lat, lon);
        try {
          const r = await reverseGeocode(lat, lon);
          setCity(r.city || r.display_name.split(',')[0]);
          setQuery(r.city || r.display_name.split(',')[0]);
        } catch {}
        setGeoLoading(false);
      },
      () => {
        setGeoError('Location access denied');
        setGeoLoading(false);
      }
    );
  };

  const hasPosition = latitude != null && longitude != null;

  return (
    <div className="space-y-3">
      {/* Autocomplete input */}
      <div ref={wrapperRef} className="relative">
        <label className="text-sm text-text-secondary block mb-1">City</label>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
          placeholder="e.g. New York, Toronto, London"
          className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
        {showDropdown && results.length > 0 && (
          <ul className="absolute z-[1000] w-full mt-1 bg-surface-elevated rounded-xl border border-white/10 shadow-lg max-h-60 overflow-y-auto">
            {results.map((r, i) => (
              <li
                key={i}
                onClick={() => selectResult(r)}
                className="px-4 py-2.5 text-sm text-text-primary hover:bg-white/5 cursor-pointer first:rounded-t-xl last:rounded-b-xl"
              >
                {r.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Use my location button */}
      <button
        type="button"
        onClick={useMyLocation}
        disabled={geoLoading}
        className="text-sm text-accent hover:text-accent-hover transition disabled:opacity-50 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {geoLoading ? 'Getting location...' : 'Use my location'}
      </button>
      {geoError && <p className="text-xs text-danger">{geoError}</p>}

      {/* Radius input */}
      <div>
        <label className="text-sm text-text-secondary block mb-1">
          Search radius (miles)
        </label>
        <input
          type="number"
          value={radius}
          onChange={e => setRadius(Number(e.target.value))}
          min={10}
          max={500}
          className="w-full bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
      </div>

      {/* Map */}
      <MapContainer
        center={hasPosition ? [latitude, longitude] : DEFAULT_CENTER}
        zoom={hasPosition ? 10 : DEFAULT_ZOOM}
        className="h-64 rounded-xl border border-white/10"
        style={{ zIndex: 0 }}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
        <MapClickHandler onClick={handleMapClick} />
        {hasPosition && (
          <>
            <MapAutoFit lat={latitude} lng={longitude} radiusMiles={radius} />
            <Marker
              position={[latitude, longitude]}
              draggable
              eventHandlers={{ dragend: handleMarkerDrag }}
            />
            <Circle
              center={[latitude, longitude]}
              radius={radius * 1609.34}
              pathOptions={{
                color: '#FF5A36',
                fillColor: '#FF5A36',
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
