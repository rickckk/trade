const TRADE_HEADER_KEYWORDS = new Set([
  // 时间/日期
  "时间", "日期", "Date", "Date(UTC)", "下单时间", "成交时间",
  "开仓时间", "平仓时间", "交易时间", "创建时间", "Fill Time", "Time",
  "Open Time", "Close Time", "Datetime",
  // 标的/交易对
  "Pair", "代币名称", "币种名称", "币对", "标的", "Symbol", "Contract",
  "交易对", "合约", "instId", "Instrument", "Market",
  // 方向
  "Side", "方向", "买卖方向", "Direction", "direction", "操作", "Buy/Sell",
  // 价格
  "Price", "价格", "开仓价", "平仓价", "成交均价", "Average Price",
  "Entry Price", "Avg Price", "Fill Price", "成交价格", "成交价",
  // 数量
  "Executed", "数量", "Quantity", "Size", "Vol", "Volume",
  "Filled", "成交数量", "成交量", "Qty",
  // 金额
  "Amount", "金额", "Turnover", "Quote Amount", "成交金额", "成交额",
  "Total", "Notional",
  // 手续费
  "Fee", "手续费", "手续费(USDT)", "手续费(Quote)", "Fees",
  "Trading Fee", "Commission", "Exec Fee",
  // 手续费币种
  "Fee Asset", "手续费币种", "Fee Coin", "Fee Currency",
  // 盈亏
  "已实现利润", "已实现盈亏", "盈亏", "盈利", "亏损", "利润",
  "实现盈亏", "Realized Profit", "PNL", "P&L", "Profit",
  "Realized PnL", "Realized P&L", "PnL",
  // 其他
  "策略", "情绪", "市场",
]);

export default TRADE_HEADER_KEYWORDS;
