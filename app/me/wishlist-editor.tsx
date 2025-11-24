'use client';

import { useState } from 'react';

type Props = {
  initialItems: string[];
};

export default function WishlistEditor({ initialItems }: Props) {
  const [items, setItems] = useState<string[]>(initialItems);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const addItem = () => {
    if (!input.trim()) return;
    setItems((prev) => [...prev, input.trim()]);
    setInput('');
    setMessage(null);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/me/wishlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }
      // Use server-confirmed data to ensure UI matches DB
      if (Array.isArray(data.wishlist)) {
        setItems(data.wishlist.map((item: any) => String(item)));
      }
      setMessage('Saved');
    } catch (error: any) {
      setMessage(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Your Wishlist</h2>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add an item..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
        />
        <button
          onClick={addItem}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          type="button"
        >
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 mb-4">No items yet. Add your wishes!</p>
      ) : (
        <ul className="space-y-2 mb-4">
          {items.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded"
            >
              <span className="text-gray-800">{item}</span>
              <button
                onClick={() => removeItem(idx)}
                className="text-sm text-red-600 hover:underline"
                type="button"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        type="button"
      >
        {saving ? 'Saving...' : 'Save Wishlist'}
      </button>
      {message && <p className="text-sm text-gray-600 mt-3">{message}</p>}
    </div>
  );
}
