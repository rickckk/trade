const tradeAmt = (t) =>
  t.amount != null
    ? Number(t.amount) || 0
    : (Number(t.entryPrice) || 0) * (Number(t.quantity) || 0);

export default tradeAmt;
