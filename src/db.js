import { openDB } from 'idb';

const DB_NAME = 'tradejournal';
const DB_VERSION = 1;

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('trades')) {
        const store = db.createObjectStore('trades', { keyPath: 'id' });
        store.createIndex('date', 'date');
        store.createIndex('symbol', 'symbol');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
}

export async function loadTrades() {
  const db = await getDB();
  return db.getAll('trades');
}

export async function saveTrades(trades) {
  const db = await getDB();
  const tx = db.transaction('trades', 'readwrite');
  const existingKeys = new Set(await tx.store.getAllKeys());
  const newKeys = new Set(trades.map((t) => t.id));
  for (const key of existingKeys) {
    if (!newKeys.has(key)) tx.store.delete(key);
  }
  for (const t of trades) tx.store.put(t);
  await tx.done;
}

export async function loadSetting(key) {
  const db = await getDB();
  const row = await db.get('settings', key);
  return row?.value;
}

export async function saveSetting(key, value) {
  const db = await getDB();
  await db.put('settings', { key, value });
}
