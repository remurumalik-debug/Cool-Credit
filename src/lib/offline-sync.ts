'use client';

export interface QueuedRecovery {
  idempotencyKey: string;
  equipment: string;
  gasLogged: string;
  estGrams: number;
  location: {
    text: string;
    lat?: number;
    lng?: number;
    accuracy?: number;
  };
  photos: {
    url: string;
    type: 'cylinder' | 'equipment';
  }[];
  queuedAt: string;
}

const STORAGE_KEY = 'coolcredit_offline_recoveries_queue';

export function getOfflineQueue(): QueuedRecovery[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read offline queue', e);
    return [];
  }
}

export function saveToOfflineQueue(recovery: Omit<QueuedRecovery, 'idempotencyKey' | 'queuedAt'>): QueuedRecovery {
  const queue = getOfflineQueue();
  const newEntry: QueuedRecovery = {
    ...recovery,
    idempotencyKey: 'offline_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
    queuedAt: new Date().toISOString(),
  };

  queue.push(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('coolcredit_queue_updated', { detail: { count: queue.length } }));
  return newEntry;
}

export function removeFromOfflineQueue(idempotencyKey: string): void {
  const queue = getOfflineQueue();
  const updated = queue.filter((item) => item.idempotencyKey !== idempotencyKey);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('coolcredit_queue_updated', { detail: { count: updated.length } }));
}

export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of [...queue]) {
    try {
      const res = await fetch('/api/recoveries/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (res.ok) {
        removeFromOfflineQueue(item.idempotencyKey);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
