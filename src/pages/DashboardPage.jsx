import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import CustomTooltip from "../components/CustomTooltip";
import { S, colors } from "../styles/index";

const DashboardPage = ({ trades, stats, equityCurve, avgNotional }) => {
  const lastCumPnl = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].cumPnl : 0;
  const curveColor = lastCumPnl >= 0 ? colors.profit : colors.loss;
  return (
    <>
      <h1 style={S.pageTitle}>交易概览</h1>
      <p style={S.pageSubtitle}>追踪和优化你的交易表现</p>

      <div style={S.statsGrid}>
        <div style={S.statCard}>
          <div style={S.statLabel}>平均持仓规模</div>
          <div style={S.statValue()}>
            {avgNotional >= 10000
              ? (avgNotional / 1000).toFixed(1) + "K"
              : avgNotional.toFixed(0)}
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                marginLeft: 4,
                letterSpacing: 0,
              }}
            >
              USDT
            </span>
          </div>
          <div style={S.statSub}>{trades.length} 笔交易均值</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>胜率</div>
          <div style={S.statValue()}>{stats.winRate.toFixed(1)}%</div>
          <div style={S.statSub}>
            {stats.wins}胜 / {stats.losses}负
            {stats.breakEvens > 0 ? `（${stats.breakEvens}平）` : ""}
          </div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>盈亏比</div>
          <div style={S.statValue()}>
            {stats.profitFactor === Infinity
              ? "∞"
              : stats.profitFactor.toFixed(2)}
          </div>
          <div style={S.statSub}>
            均盈 {stats.avgWin.toFixed(0)} / 均亏{" "}
            {stats.avgLoss.toFixed(0)}
          </div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>最大回撤</div>
          <div style={S.statValue(colors.loss)}>
            -{stats.maxDD.toFixed(0)}
          </div>
          <div style={S.statSub}>
            连胜{stats.maxWinStreak} / 连亏{stats.maxLossStreak}
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>资金曲线</span>
          <span style={{ fontSize: 12, color: colors.textSecondary }}>
            累计盈亏走势
          </span>
        </div>
        <div style={{ ...S.cardBody, paddingLeft: 8 }}>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={equityCurve}
              margin={{ top: 10, right: 24, bottom: 4, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.borderLight}
                vertical={false}
              />
              <XAxis
                dataKey="date"
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
              <ReferenceLine
                y={0}
                stroke={colors.borderLight}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="cumPnl"
                stroke={curveColor}
                strokeWidth={2}
                dot={{
                  r: 3.5,
                  fill: colors.surface,
                  stroke: curveColor,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  stroke: curveColor,
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
