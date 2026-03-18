const BASE = 'https://nominatim.openstreetmap.org';

let searchController = null;
let reverseController = null;

export async function searchCity(query) {
  if (!query || query.length < 3) return [];

  if (searchController) searchController.abort();
  searchController = new AbortController();

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    addressdetails: '1',
  });

  const res = await fetch(`${BASE}/search?${params}`, {
    signal: searchController.signal,
    headers: { 'Accept-Language': 'en' },
  });

  const data = await res.json();
  return data.map(item => {
    const addr = item.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || '';
    return {
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      city,
    };
  });
}

export async function reverseGeocode(lat, lon) {
  if (reverseController) reverseController.abort();
  reverseController = new AbortController();

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
  });

  const res = await fetch(`${BASE}/reverse?${params}`, {
    signal: reverseController.signal,
    headers: { 'Accept-Language': 'en' },
  });

  const data = await res.json();
  const addr = data.address || {};
  const city = addr.city || addr.town || addr.village || addr.county || '';
  return {
    display_name: data.display_name,
    lat: parseFloat(data.lat),
    lon: parseFloat(data.lon),
    city,
  };
}
