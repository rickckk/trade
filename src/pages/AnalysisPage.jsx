import { useMemo } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { S, colors, mono } from "../styles/index";
import toRows from "../utils/toRows";

const AnalysisPage = ({ trades, stats }) => {
  const monthlyPnl = useMemo(() => {
    const map = {};
    trades
      .filter((t) => t.exitPrice != null)
      .forEach((t) => {
        const m = (t.date || "").slice(0, 7);
        map[m] = (map[m] || 0) + (Number(t.pnl) || 0);
      });
    const sorted = Object.entries(map).sort();
    const years = new Set(sorted.map(([m]) => m.slice(0, 4)));
    const multiYear = years.size > 1;
    return sorted.map(([m, pnl]) => ({
      month: multiYear ? m.slice(2, 4) + "-" + m.slice(5) + "月" : m.slice(5) + "月",
      pnl,
    }));
  }, [trades]);

  const strategyData = useMemo(() => toRows(stats.byStrategy), [stats]);
  const marketData = useMemo(() => toRows(stats.byMarket), [stats]);
  const emotionData = useMemo(() => toRows(stats.byEmotion), [stats]);
  const directionData = useMemo(() => toRows(stats.byDirection), [stats]);
  const symbolData = useMemo(
    () => toRows(stats.bySymbol).sort((a, b) => b.total - a.total),
    [stats],
  );

  return (
    <>
      <h1 style={S.pageTitle}>交易分析</h1>
      <p style={S.pageSubtitle}>深入了解你的交易模式和行为偏差</p>

      {/* Row 1: Strategy + Market + Emotion */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 24,
          marginBottom: 24,
        }}
      >
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>策略表现</span>
          </div>
          <div style={S.cardBody}>
            {strategyData.length === 0 && (
              <div style={S.emptyState}>暂无数据</div>
            )}
            {strategyData.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 0",
                  borderBottom: `1px solid ${colors.borderLight}`,
                }}
              >
                <div>
                  <span style={S.tag(s.name)}>{s.name}</span>
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: 12,
                      color: colors.textSecondary,
                    }}
                  >
                    {s.total}笔 · 胜率 {s.winRate}%
                  </span>
                </div>
                <span
                  style={{
                    ...S.pnl(s.pnl),
                    fontFamily: mono,
                    fontSize: 13,
                  }}
                >
                  {s.pnl > 0 ? "+" : ""}
                  {s.pnl.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>市场表现</span>
          </div>
          <div style={S.cardBody}>
            {marketData.length === 0 && (
              <div style={S.emptyState}>暂无数据</div>
            )}
            {marketData.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 0",
                  borderBottom: `1px solid ${colors.borderLight}`,
                }}
              >
                <div>
                  <span style={S.tag(s.name)}>{s.name}</span>
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: 12,
                      color: colors.textSecondary,
                    }}
                  >
                    {s.total}笔 · 胜率 {s.winRate}%
                  </span>
                </div>
                <span
                  style={{
                    ...S.pnl(s.pnl),
                    fontFamily: mono,
                    fontSize: 13,
                  }}
                >
                  {s.pnl > 0 ? "+" : ""}
                  {s.pnl.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>情绪与盈亏</span>
          </div>
          <div style={S.cardBody}>
            {emotionData.length === 0 && (
              <div style={S.emptyState}>暂无数据</div>
            )}
            {emotionData.map((s) => {
              const eColors = { 冷静: "#2563EB", 冲动: "#DC2626", 犹豫: "#F59E0B" };
              return (
                <div
                  key={s.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 0",
                    borderBottom: `1px solid ${colors.borderLight}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: eColors[s.name] || "#888", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: 12, color: colors.textSecondary }}>
                      {s.total}笔 · 胜率 {s.winRate}%
                    </span>
                  </div>
                  <span style={{ ...S.pnl(s.pnl), fontFamily: mono, fontSize: 13 }}>
                    {s.pnl > 0 ? "+" : ""}{s.pnl.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Monthly PnL + Direction */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: 24,
          marginBottom: 24,
        }}
      >
        <div style={{ ...S.card, display: "flex", flexDirection: "column" }}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>月度盈亏</span>
          </div>
          <div style={{ ...S.cardBody, flex: 1, minHeight: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyPnl}
                margin={{ top: 6, right: 16, bottom: 0, left: 0 }}
                barCategoryGap="35%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.borderLight}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: colors.textSecondary }}
                  axisLine={{ stroke: colors.border }}
                  tickLine={false}
                  dy={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: colors.textSecondary }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <ReferenceLine y={0} stroke={colors.border} strokeWidth={1} />
                <Tooltip
                  formatter={(v) => [
                    `${v > 0 ? "+" : ""}${v.toFixed(0)} USDT`,
                    "盈亏",
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    fontSize: 12,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                  }}
                  cursor={false}
                />
                <Bar dataKey="pnl" radius={[5, 5, 0, 0]} maxBarSize={48}>
                  {monthlyPnl.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.pnl >= 0 ? colors.profit : colors.loss}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Direction performance */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>方向表现</span>
          </div>
          <div style={S.cardBody}>
            {directionData.length === 0 && (
              <div style={S.emptyState}>暂无数据</div>
            )}
            {directionData.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 0",
                  borderBottom: `1px solid ${colors.borderLight}`,
                }}
              >
                <div>
                  <span style={S.tag(s.name)}>{s.name}</span>
                  <span style={{ marginLeft: 10, fontSize: 12, color: colors.textSecondary }}>
                    {s.total}笔 · 胜率 {s.winRate}%
                  </span>
                </div>
                <span style={{ ...S.pnl(s.pnl), fontFamily: mono, fontSize: 13 }}>
                  {s.pnl > 0 ? "+" : ""}{s.pnl.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Symbol + Key Data */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: 24,
        }}
      >
        {/* Symbol performance */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>标的表现</span>
          </div>
          <div style={S.cardBody}>
            {symbolData.length === 0 && (
              <div style={S.emptyState}>暂无数据</div>
            )}
            {symbolData.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 0",
                  borderBottom: `1px solid ${colors.borderLight}`,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13, fontFamily: mono }}>{s.name}</span>
                  <span style={{ marginLeft: 10, fontSize: 12, color: colors.textSecondary }}>
                    {s.total}笔 · 胜率 {s.winRate}%
                  </span>
                </div>
                <span style={{ ...S.pnl(s.pnl), fontFamily: mono, fontSize: 13 }}>
                  {s.pnl > 0 ? "+" : ""}{s.pnl.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key stats */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.cardTitle}>关键数据</span>
          </div>
          <div style={S.cardBody}>
            {[
              ["总交易笔数", stats.totalTrades],
              [
                "总金额",
                <span key="ta" style={{ fontFamily: mono }}>
                  {stats.totalAmount >= 1000000
                    ? (stats.totalAmount / 1000000).toFixed(2) + "M"
                    : stats.totalAmount >= 1000
                    ? (stats.totalAmount / 1000).toFixed(1) + "K"
                    : stats.totalAmount.toFixed(0)}
                </span>,
              ],
              [
                "总盈亏",
                <span key="tp" style={S.pnl(stats.totalPnl)}>
                  {stats.totalPnl > 0 ? "+" : ""}
                  {stats.totalPnl.toFixed(0)}
                </span>,
              ],
              [
                "总手续费",
                <span key="tf" style={{ color: colors.loss, fontFamily: mono }}>
                  -{stats.totalFee.toFixed(2)}
                </span>,
              ],
              [
                "最大单笔盈利",
                <span key="mw" style={{ color: colors.profit, fontWeight: 600, fontFamily: mono }}>
                  +{stats.maxWin.toFixed(0)}
                </span>,
              ],
              [
                "最大单笔亏损",
                <span key="ml" style={{ color: colors.loss, fontWeight: 600, fontFamily: mono }}>
                  {stats.maxLoss.toFixed(0)}
                </span>,
              ],
            ].map(([k, v], i, arr) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "11px 0",
                  borderBottom: i < arr.length - 1 ? `1px solid ${colors.borderLight}` : "none",
                }}
              >
                <span style={{ fontSize: 13, color: colors.textSecondary }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: mono }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalysisPage;
