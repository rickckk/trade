const toRows = (groupMap) =>
  Object.entries(groupMap).map(([name, d]) => {
    const wl = d.wins + d.losses;
    return {
      name,
      winRate: wl ? ((d.wins / wl) * 100).toFixed(0) : "0",
      pnl: d.pnl,
      total: d.total,
    };
  });

export default toRows;
