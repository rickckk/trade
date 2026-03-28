export const parseImportDate = (raw) => {
  if (!raw && raw !== 0) return "";
  // Excel serial date number
  if (typeof raw === "number") {
    const epoch = new Date((raw - 25569) * 86400000);
    return epoch.toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  // YYYY-MM-DD (standard or with time)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // YY-MM-DD (Bitget style: "26-02-12 06:34:24")
  const yyMatch = s.match(/^(\d{2})-(\d{2})-(\d{2})/);
  if (yyMatch) return `20${yyMatch[1]}-${yyMatch[2]}-${yyMatch[3]}`;
  // MM/DD/YYYY or DD/MM/YYYY — if first part >12 it must be the day
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, a, b, y] = slashMatch;
    const [month, day] = Number(a) > 12 ? [b, a] : [a, b];
    return `${y}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  // Fallback: native Date parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
};

export const parseDirection = (v) => {
  const s = String(v || "").trim().toLowerCase().replace(/[\s_]/g, "");
  if (s.includes("buy") || s.includes("long") || s === "多" || s === "开多" || s === "平多") return "多";
  if (s.includes("sell") || s.includes("short") || s === "空" || s === "开空" || s === "平空") return "空";
  return "多";
};

// Detect fee currency from: (1) dedicated asset column, (2) fee header name brackets, (3) raw value suffix
export const detectFeeCurrency = (headers, row, getRaw) => {
  // 1. Dedicated fee asset column
  const assetRaw = getRaw(row, "Fee Asset", "手续费币种", "Fee Coin", "Fee Currency");
  if (assetRaw) return String(assetRaw).trim().toUpperCase();

  // 2. Extract from fee column header, e.g. "手续费(BNB)" or "Fee(USDT)"
  const feeHeaders = [
    "手续费", "Fee", "Fees", "手续费(USDT)", "手续费(Quote)",
    "Trading Fee", "Commission", "Exec Fee",
  ];
  for (const h of feeHeaders) {
    const idx = headers.indexOf(h);
    if (idx !== -1) {
      const m = h.match(/\(([^)]+)\)/);
      if (m) return m[1].toUpperCase();
    }
  }

  // 3. Extract letter suffix from fee raw value, e.g. "0.001BNB"
  const feeRaw = getRaw(row, "手续费", "Fee", "Fees", "Trading Fee", "Commission", "Exec Fee");
  if (feeRaw !== null) {
    const s = String(feeRaw).trim();
    const m = s.match(/[a-zA-Z]+$/);
    if (m) return m[0].toUpperCase();
  }

  return "";
};

export const createRowHelpers = (headers) => {
  const getRaw = (row, ...keys) => {
    for (const k of keys) {
      const idx = headers.indexOf(k);
      if (
        idx !== -1 &&
        row[idx] !== undefined &&
        row[idx] !== null &&
        String(row[idx]).trim() !== ""
      )
        return row[idx];
    }
    return null;
  };
  const getStr = (row, ...keys) => {
    const v = getRaw(row, ...keys);
    return v !== null ? String(v).trim() : "";
  };
  const getNum = (row, ...keys) => {
    const raw = getRaw(row, ...keys);
    if (raw === null) return null;
    if (typeof raw === "number") return raw;
    const s = String(raw).trim();
    // 先尝试直接解析（处理科学计数法 "1.2e+5"、"1.2e-5" 等）
    const direct = parseFloat(s);
    if (!isNaN(direct) && /^-?[\d.eE+-]+$/.test(s)) return direct;
    // 再去除非数字字符后解析（处理 "626USDT"、"1,234.56" 等）
    const cleaned = s.replace(/[^\d.-]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
  };
  return { getRaw, getStr, getNum };
};
