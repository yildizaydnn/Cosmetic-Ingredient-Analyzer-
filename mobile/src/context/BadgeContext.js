import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BADGES } from '../constants/badges';
import {
  getEarnedBadges,
  saveBadge,
  getStats,
  recordAnalysis,
  recordDetailView,
  clearBadges,
} from '../services/badgeStorage';

const BadgeContext = createContext({});

export const BadgeProvider = ({ children }) => {
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [stats, setStats] = useState({});
  const [newBadge, setNewBadge] = useState(null); // yeni kazanılan rozet bildirimi

  useEffect(() => {
    loadBadgeData();
  }, []);

  const loadBadgeData = async () => {
    const [earned, currentStats] = await Promise.all([getEarnedBadges(), getStats()]);
    setEarnedBadges(earned);
    setStats(currentStats);
  };

  // Mevcut stats'a göre yeni rozetleri kontrol et
  const checkNewBadges = useCallback(
    async (currentStats) => {
      const earned = await getEarnedBadges();
      const earnedIds = new Set(earned.map((b) => b.id));
      let latestNew = null;

      for (const badge of BADGES) {
        if (!earnedIds.has(badge.id) && badge.condition(currentStats)) {
          await saveBadge(badge.id);
          latestNew = badge;
        }
      }

      if (latestNew) {
        const updatedEarned = await getEarnedBadges();
        setEarnedBadges(updatedEarned);
        setNewBadge(latestNew);
      }
    },
    []
  );

  // Analiz tamamlandığında çağrılır
  const onAnalysisComplete = useCallback(
    async (summary, source = 'scan') => {
      const updatedStats = await recordAnalysis(summary, source);
      setStats(updatedStats);
      await checkNewBadges(updatedStats);
    },
    [checkNewBadges]
  );

  // İçerik detayı görüntülendiğinde çağrılır
  const onDetailView = useCallback(async () => {
    const updatedStats = await recordDetailView();
    setStats(updatedStats);
    await checkNewBadges(updatedStats);
  }, [checkNewBadges]);

  // Rozet bildirimini kapat
  const dismissBadgeNotification = useCallback(() => {
    setNewBadge(null);
  }, []);

  // Tüm rozetleri sıfırla (logout'ta kullanılabilir)
  const resetBadges = useCallback(async () => {
    await clearBadges();
    setEarnedBadges([]);
    setStats({});
    setNewBadge(null);
  }, []);

  return (
    <BadgeContext.Provider
      value={{
        earnedBadges,
        stats,
        newBadge,
        onAnalysisComplete,
        onDetailView,
        dismissBadgeNotification,
        resetBadges,
      }}
    >
      {children}
    </BadgeContext.Provider>
  );
};

export const useBadges = () => useContext(BadgeContext);
