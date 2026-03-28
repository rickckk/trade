import tradeAmt from "./tradeAmt";

const calcStats = (trades) => {
  const closed = trades.filter((t) => t.exitPrice != null);
  const pnlOf = (t) => Number(t.pnl) || 0;
  const wins = closed.filter((t) => pnlOf(t) > 0);
  const losses = closed.filter((t) => pnlOf(t) < 0);
  const breakEvens = closed.length - wins.length - losses.length;
  const maxWin = wins.reduce((m, t) => Math.max(m, pnlOf(t)), 0);
  const maxLoss = losses.reduce((m, t) => Math.min(m, pnlOf(t)), 0);
  const totalPnl = closed.reduce((s, t) => s + pnlOf(t), 0);
  const winRate = (wins.length + losses.length) ? (wins.length / (wins.length + losses.length)) * 100 : 0;
  const totalWinAmt = wins.reduce((s, t) => s + pnlOf(t), 0);
  const totalLossAmt = Math.abs(losses.reduce((s, t) => s + pnlOf(t), 0));
  const avgWin = wins.length ? totalWinAmt / wins.length : 0;
  const avgLoss = losses.length ? totalLossAmt / losses.length : 0;
  const profitFactor =
    totalLossAmt > 0
      ? totalWinAmt / totalLossAmt
      : totalWinAmt > 0
        ? Infinity
        : 0;

  let maxDD = 0,
    peak = 0,
    running = 0;
  let maxWinStreak = 0,
    maxLossStreak = 0,
    curStreak = 0,
    lastDir = null;
  [...closed]
    .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.id > b.id ? 1 : a.id < b.id ? -1 : 0))
    .forEach((t) => {
      const p = pnlOf(t);
      running += p;
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDD) maxDD = dd;
      const dir = p > 0 ? "w" : p < 0 ? "l" : null;
      if (dir === null) {
        // break-even resets the streak
        curStreak = 0;
        lastDir = null;
      } else {
        curStreak = dir === lastDir ? curStreak + 1 : 1;
        lastDir = dir;
        if (dir === "w" && curStreak > maxWinStreak) maxWinStreak = curStreak;
        if (dir === "l" && curStreak > maxLossStreak) maxLossStreak = curStreak;
      }
    });

  const groupBy = (key) => {
    const acc = {};
    closed.forEach((t) => {
      const k = t[key];
      if (!k) return; // skip empty / null / undefined
      if (!acc[k]) acc[k] = { wins: 0, losses: 0, total: 0, pnl: 0 };
      const p = pnlOf(t);
      acc[k].total++;
      acc[k].pnl += p;
      if (p > 0) acc[k].wins++;
      if (p < 0) acc[k].losses++;
    });
    return acc;
  };
  const byStrategy = groupBy("strategy");
  const byEmotion = groupBy("emotion");
  const byMarket = groupBy("market");
  const bySymbol = groupBy("symbol");
  const byDirection = groupBy("direction");

  // 统计所有交易的手续费和金额（不论是否平仓，因为这些是实际发生的）
  // 仅统计 USDT 手续费（feeCurrency 为空或 "USDT"），非 USDT 计价的手续费不纳入
  const totalFee = trades
    .filter((t) => !t.feeCurrency || t.feeCurrency === "USDT")
    .reduce((s, t) => s + (Number(t.fee) || 0), 0);
  const totalAmount = trades.reduce((s, t) => s + tradeAmt(t), 0);

  return {
    totalPnl,
    winRate,
    profitFactor,
    maxDD,
    totalTrades: trades.length,
    closedTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    breakEvens,
    avgWin,
    avgLoss,
    maxWinStreak,
    maxLossStreak,
    maxWin,
    maxLoss,
    totalFee,
    totalAmount,
    byStrategy,
    byEmotion,
    byMarket,
    bySymbol,
    byDirection,
  };
};

export default calcStats;
