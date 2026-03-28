const getEquityCurve = (trades) => {
  const sorted = [...trades]
    .filter((t) => t.exitPrice != null)
    .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.id > b.id ? 1 : a.id < b.id ? -1 : 0));
  const years = new Set(sorted.map((t) => (t.date || "").slice(0, 4)));
  const multiYear = years.size > 1;
  let cum = 0;
  return [
    { date: "起始", cumPnl: 0 },
    ...sorted.map((t) => {
      cum += Number(t.pnl) || 0;
      return {
        date: multiYear ? (t.date || "").slice(2) : (t.date || "").slice(5),
        cumPnl: cum,
        pnl: t.pnl,
        symbol: t.symbol,
      };
    }),
  ];
};

export default getEquityCurve;
