import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import {
  initDb, saveProducts, saveCustomers, saveInventory,
  getSyncQueue, removeFromQueue
} from '../db/sqliteManager';
import { useAuth } from './AuthContext';

interface SyncContextType {
  isOnline: boolean;
  syncPending: number;
  lastSync: Date | null;
  forceSync: () => Promise<void>;
  inventoryMode: string;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncPending, setSyncPending] = useState<number>(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [inventoryMode] = useState<string>("Strict");
  const { user } = useAuth();

  // Watch network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize DB and Downlink on Mount
  useEffect(() => {
    if (user) {
      initDb().then(() => {
        performDownlink();
      });
    }
  }, [user]);

  // Try Uplink when coming back online
  useEffect(() => {
    if (isOnline && user) {
      performUplink();
    }
  }, [isOnline, user]);

  const performDownlink = async () => {
    if (!navigator.onLine) return;
    try {
      const [prodRes, custRes, invRes] = await Promise.all([
        api.get('/inventory/products'),
        api.get('/customers'),
        api.get('/inventory/stock')
      ]);
      
      await saveProducts(prodRes.data);
      await saveCustomers(custRes.data);
      
      // If the inventory endpoint returns a list of { variant_id, quantity }, save it
      if (invRes.data && Array.isArray(invRes.data)) {
         await saveInventory(invRes.data);
      }
      
      setLastSync(new Date());
    } catch (error) {
      console.error("Downlink Sync Failed", error);
    }
  };

  const performUplink = async () => {
    if (!navigator.onLine) return;
    
    try {
      const queue = await getSyncQueue();
      setSyncPending(queue.length);
      
      if (queue.length === 0) return;

      const payloads = queue.map((q: any) => JSON.parse(q.payload));
      
      // Send batched to backend
      const response = await api.post('/sales/sync', { invoices: payloads });
      
      if (response.status === 200) {
        // Clear queue upon success
        for (const q of queue) {
          await removeFromQueue(q.id);
        }
        setSyncPending(0);
        
        // After successful uplink, fetch latest inventory to resolve stock levels
        await performDownlink();
      }
    } catch (error) {
      console.error("Uplink Sync Failed", error);
    }
  };

  const forceSync = async () => {
    await performUplink();
    await performDownlink();
  };

  // Poll sync_queue to update badge
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        try {
          const q = await getSyncQueue();
          setSyncPending(q.length);
        } catch (e) {}
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <SyncContext.Provider value={{ isOnline, syncPending, lastSync, forceSync, inventoryMode }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
