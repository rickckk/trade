import { useState, useMemo, useEffect, useRef } from "react";
import { loadTrades as dbLoadTrades, saveTrades as dbSaveTrades, loadSetting as dbLoadSetting, saveSetting as dbSaveSetting } from "./db";
import SAMPLE_TRADES from "./constants/sampleTrades";
import calcStats from "./utils/calcStats";
import getEquityCurve from "./utils/getEquityCurve";
import { S, colors } from "./styles/index";
import Icon from "./components/Icon";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardPage from "./pages/DashboardPage";
import TradesPage from "./pages/TradesPage";
import AnalysisPage from "./pages/AnalysisPage";

export default function TradingReview() {
  const [page, setPage] = useState(() => {
    try { return sessionStorage.getItem("tj_page") || "dashboard"; }
    catch { return "dashboard"; }
  });

  const handleSetPage = (p) => {
    try { sessionStorage.setItem("tj_page", p); } catch { /* ignore */ }
    setPage(p);
  };
  const [trades, setTrades] = useState([]);
  const [dbReady, setDbReady] = useState(false);
  const savingRef = useRef(0);
  const saveChainRef = useRef(Promise.resolve());

  /* Load from IndexedDB on mount, migrate from localStorage if needed */
  useEffect(() => {
    (async () => {
      try {
        let data = await dbLoadTrades();
        if (!data.length) {
          try {
            const saved = localStorage.getItem("tradejournal_trades");
            if (saved) {
              data = JSON.parse(saved);
              await dbSaveTrades(data);
              localStorage.removeItem("tradejournal_trades");
            }
          } catch {
            /* ignore */
          }
        }
        if (!data.length) {
          const everSaved = await dbLoadSetting("everSaved");
          if (!everSaved) {
            data = SAMPLE_TRADES;
            await dbSaveTrades(data);
            await dbSaveSetting("everSaved", true);
          }
        }
        setTrades(data);
      } catch (err) {
        console.error("数据库加载失败:", err);
      } finally {
        setDbReady(true);
      }
    })();
  }, []);

  /* Save to IndexedDB whenever trades change (serialized, with unload guard) */
  useEffect(() => {
    if (!dbReady) return;
    savingRef.current += 1;
    saveChainRef.current = saveChainRef.current
      .then(() => dbSaveTrades(trades))
      .catch((err) => console.error("保存失败（IndexedDB）:", err))
      .finally(() => { savingRef.current -= 1; });
  }, [trades, dbReady]);

  /* Warn user if navigating away while a save is in progress */
  useEffect(() => {
    const handler = (e) => {
      if (savingRef.current > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const stats = useMemo(() => calcStats(trades), [trades]);
  const equityCurve = useMemo(() => getEquityCurve(trades), [trades]);

  const avgNotional = trades.length ? stats.totalAmount / trades.length : 0;

  const navItems = [
    { id: "dashboard", icon: "grid" },
    { id: "trades", icon: "list" },
    { id: "analysis", icon: "activity" },
  ];

  if (!dbReady) {
    return (
      <div style={{ ...S.app, alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: colors.textSecondary }}>
          <Icon name="loader" size={24} />
          <div style={{ marginTop: 12, fontSize: 14 }}>加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.app}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        {navItems.map((n) => (
          <button
            key={n.id}
            style={S.navTab(page === n.id)}
            onClick={() => handleSetPage(n.id)}
            title={
              { dashboard: "概览", trades: "交易记录", analysis: "分析" }[n.id]
            }
          >
            <Icon name={n.icon} size={18} />
          </button>
        ))}
      </aside>

      <div style={S.mainWrap}>
        <main style={S.main}>
          <ErrorBoundary key={page}>
            {page === "dashboard" && (
              <DashboardPage
                trades={trades}
                stats={stats}
                equityCurve={equityCurve}
                avgNotional={avgNotional}
              />
            )}
            {page === "trades" && (
              <TradesPage
                trades={trades}
                setTrades={setTrades}
                stats={stats}
              />
            )}
            {page === "analysis" && (
              <AnalysisPage
                trades={trades}
                stats={stats}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
