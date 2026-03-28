import { colors, S } from "../styles/index";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {d.date} {d.symbol && `· ${d.symbol}`}
      </div>
      <div style={{ color: colors.textSecondary }}>
        累计:{" "}
        <span style={S.pnl(d.cumPnl)}>
          {d.cumPnl > 0 ? "+" : ""}
          {d.cumPnl?.toFixed(0)}
        </span>
      </div>
      {d.pnl !== undefined && (
        <div style={{ color: colors.textSecondary }}>
          本笔:{" "}
          <span style={S.pnl(d.pnl)}>
            {d.pnl > 0 ? "+" : ""}
            {d.pnl?.toFixed(0)}
          </span>
        </div>
      )}
    </div>
  );
};

export default CustomTooltip;
