export default function LocationPicker({ city, setCity }) {
  return (
    <div>
      <label className="text-sm text-text-secondary block mb-1">City</label>
      <input
        type="text"
        value={city}
        onChange={e => setCity(e.target.value)}
        placeholder="e.g. New York, Toronto, London"
        className="w-full bg-surface rounded-lg px-3 py-2 text-text-primary border border-surface-hover focus:border-accent focus:outline-none"
      />
    </div>
  );
}
