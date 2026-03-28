import { useState, useMemo, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import Icon from "../components/Icon";
import Dropdown from "../components/Dropdown";
import OpenTradeModal from "../components/OpenTradeModal";
import CloseTradeModal from "../components/CloseTradeModal";
import EditTradeModal from "../components/EditTradeModal";
import Toast from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import { S, colors, font, mono } from "../styles/index";
import tradeAmt from "../utils/tradeAmt";
import TRADE_HEADER_KEYWORDS from "../constants/tradeHeaderKeywords";
import { parseImportDate, parseDirection, createRowHelpers, detectFeeCurrency } from "../utils/importParser";

const TABLE_PAGE_SIZE = 50;

const TradesPage = ({ trades, setTrades, stats }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPnl, setFilterPnl] = useState("全部");
  const [sortField, setSortField] = useState(() => {
    try { return sessionStorage.getItem("tj_sortField") || "date"; }
    catch { return "date"; }
  });
  const [sortDir, setSortDir] = useState(() => {
    try { return sessionStorage.getItem("tj_sortDir") || "desc"; }
    catch { return "desc"; }
  });
  const [tablePage, setTablePage] = useState(0);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [closeTrade, setCloseTrade] = useState(null);
  const [editTrade, setEditTrade] = useState(null);
  const [toast, setToast] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const confirmActionRef = useRef(null);
  const fileRef = useRef(null);
  const restoreRef = useRef(null);

  const closedCount = stats.closedTrades;
  const openCount = trades.length - closedCount;

  const filteredTrades = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const r = trades.filter(
      (t) =>
        (!term || (t.symbol || "").toLowerCase().includes(term)) &&
        (filterPnl === "全部" ||
          (filterPnl === "盈利" ? t.pnl > 0 : t.pnl < 0)),
    );
    const m = sortDir === "asc" ? 1 : -1;
    r.sort((a, b) => {
      if (sortField === "date") {
        const aE = !a.date, bE = !b.date;
        if (aE !== bE) return aE ? 1 : -1;
        const d = m * a.date.localeCompare(b.date);
        if (d !== 0) return d;
      } else if (sortField === "pnl") {
        // 持仓中（exitPrice===null）视为无盈亏，排到末尾
        const aE = a.exitPrice === null, bE = b.exitPrice === null;
        if (aE !== bE) return aE ? 1 : -1;
        const aV = Number(a.pnl ?? 0), bV = Number(b.pnl ?? 0);
        const d = m * (aV - bV);
        if (d !== 0) return d;
      } else if (sortField === "amount") {
        const aV = tradeAmt(a), bV = tradeAmt(b);
        const aE = isNaN(aV), bE = isNaN(bV);
        if (aE !== bE) return aE ? 1 : -1;
        const d = m * (aV - bV);
        if (d !== 0) return d;
      } else if (sortField === "fee") {
        const isUsdt = (t) => !t.feeCurrency || t.feeCurrency === "USDT";
        const aU = isUsdt(a), bU = isUsdt(b);
        if (aU !== bU) return aU ? -1 : 1;
        const aV = Number(a.fee ?? NaN), bV = Number(b.fee ?? NaN);
        const aE = isNaN(aV), bE = isNaN(bV);
        if (aE !== bE) return aE ? 1 : -1;
        const d = m * (aV - bV);
        if (d !== 0) return d;
      }
      // stable secondary sort: by date desc, then by id desc
      const bDate = b.date || "", aDate = a.date || "";
      const dateDiff = bDate.localeCompare(aDate);
      if (dateDiff !== 0) return dateDiff;
      return b.id > a.id ? 1 : b.id < a.id ? -1 : 0;
    });
    return r;
  }, [trades, searchTerm, filterPnl, sortField, sortDir]);

  /* Reset to first page whenever filters/sort change OR filtered count shrinks below current page */
  useEffect(() => {
    setTablePage(0);
  }, [searchTerm, filterPnl, sortField, sortDir]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredTrades.length / TABLE_PAGE_SIZE) - 1);
    setTablePage((p) => (p > maxPage ? maxPage : p));
  }, [filteredTrades.length]);

  const totalPages = Math.ceil(filteredTrades.length / TABLE_PAGE_SIZE);
  const pagedTrades = filteredTrades.slice(
    tablePage * TABLE_PAGE_SIZE,
    (tablePage + 1) * TABLE_PAGE_SIZE,
  );

  const handleSort = (field) => {
    if (sortField === field) {
      const next = sortDir === "asc" ? "desc" : "asc";
      setSortDir(next);
      try { sessionStorage.setItem("tj_sortDir", next); } catch { /* ignore */ }
    } else {
      setSortField(field);
      setSortDir("desc");
      try {
        sessionStorage.setItem("tj_sortField", field);
        sessionStorage.setItem("tj_sortDir", "desc");
      } catch { /* ignore */ }
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];

        // Use header:1 to get raw rows (preserves number types for Excel serial dates)
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (!rawRows.length) {
          setToast("文件中没有找到数据");
          return;
        }

        // Auto-detect real header row: find first row with ≥2 cells exactly matching known trade column keywords
        let headerIdx = 0;
        for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
          const row = rawRows[i];
          if (!Array.isArray(row)) continue;
          const matchCount = row.filter((c) =>
            TRADE_HEADER_KEYWORDS.has(String(c ?? "").trim()),
          ).length;
          if (matchCount >= 2) {
            headerIdx = i;
            break;
          }
        }
        const headers = rawRows[headerIdx].map((h) => String(h ?? "").trim());
        const dataRows = rawRows
          .slice(headerIdx + 1)
          .filter(
            (r) =>
              Array.isArray(r) &&
              r.some(
                (c) => c !== undefined && c !== null && String(c).trim() !== "",
              ),
          );
        if (!dataRows.length) {
          setToast("文件中没有找到数据行");
          return;
        }

        const { getRaw, getStr, getNum } = createRowHelpers(headers);

        // Date.now() * 1000 + rowIndex — stays within MAX_SAFE_INTEGER (Date.now()*10000 exceeded it)
        const importBase = Date.now() * 1000;
        const newTrades = dataRows.map((row, i) => {
          const dateRaw = getRaw(
            row,
            "日期",
            "时间",
            "date",
            "Date",
            "Date(UTC)",
            "开仓时间",
            "交易时间",
            "Time",
            "创建时间",
            "Fill Time",
          );
          const symbol = getStr(
            row,
            "标的",
            "symbol",
            "Symbol",
            "Pair",
            "pair",
            "代币名称/币种名称/币对",
            "交易对",
            "币对",
            "instId",
            "Market",
            "Instrument",
            "Contract",
          )
            .replace(/\s+/g, "")
            .toUpperCase();
          const rawDir = getStr(
            row,
            "方向",
            "direction",
            "Direction",
            "Side",
            "side",
            "操作",
            "Type",
            "Order Type",
            "Buy/Sell",
          );

          const entryPrice = getNum(
            row,
            "开仓价",
            "Price",
            "price",
            "价格",
            "entryPrice",
            "Entry Price",
            "成交均价",
            "Average Price",
            "Avg Price",
            "Fill Price",
            "成交价格",
          );
          const quantity = getNum(
            row,
            "数量",
            "Quantity",
            "quantity",
            "Executed",
            "成交数量",
            "Size",
            "Vol",
            "Volume",
            "Filled",
            "成交量",
            "成交数量(Base)",
          );
          const amount = getNum(
            row,
            "金额",
            "Amount",
            "amount",
            "成交金额",
            "Turnover",
            "Total",
            "Notional",
            "Quote Amount",
            "成交额",
          );
          const fee = getNum(
            row,
            "手续费",
            "Fee",
            "fee",
            "手续费(USDT)",
            "Fees",
            "Trading Fee",
            "Commission",
            "手续费(Quote)",
          );
          const feeCurrency = detectFeeCurrency(headers, row, getRaw);
          const pnl = getNum(
            row,
            "盈亏", "pnl", "PnL", "P&L",
            "已实现利润", "已实现盈亏", "实现盈亏",
            "盈利", "亏损", "利润",
            "Realized PnL", "realizedPnl", "Realized P&L",
            "Realized Profit", "Profit and Loss", "Profit", "profit",
          );

          // exitPrice: from app's own export; if not found but pnl is known → trade is closed, use 0 as sentinel
          const exitPriceRaw = getStr(row, "平仓价", "exitPrice", "Exit Price");
          const exitPrice =
            exitPriceRaw && exitPriceRaw !== "持仓中"
              ? parseFloat(exitPriceRaw) || null
              : pnl !== null
              ? 0   // closed trade, exit price not in file
              : null; // open position

          // Only set optional fields if explicitly present in file
          const strategy = getStr(row, "策略", "strategy", "Strategy");
          const emotion = getStr(row, "情绪", "emotion", "Emotion");
          const market = getStr(row, "市场", "market", "Market");

          return {
            id: importBase + i,
            date: parseImportDate(dateRaw),
            symbol,
            direction: parseDirection(rawDir),
            entryPrice: entryPrice ?? 0,
            exitPrice,
            quantity: quantity ?? 0,
            amount: amount ?? null,
            fee: fee ?? 0,
            feeCurrency,
            pnl: pnl ?? 0,
            strategy,
            emotion,
            market,
            source: "manual",
          };
        });

        const validTrades = newTrades.filter((t) => t.date && t.symbol);
        const skipped = newTrades.length - validTrades.length;
        if (!validTrades.length) {
          const colsFound = headers.filter((h) => h).join("、");
          setToast(
            `未找到有效交易记录。\n识别到的列名：${colsFound}\n\n需要包含日期（时间/Date(UTC)/日期）和标的（Pair/代币名称/币种名称/币对）列。`,
          );
          return;
        }
        setTrades((prev) => [...prev, ...validTrades]);
        const skipMsg = skipped > 0 ? `，跳过 ${skipped} 条无效行（缺少日期或标的）` : "";
        setToast(`成功导入 ${validTrades.length} 条交易记录${skipMsg}`);
      } catch (err) {
        setToast("导入失败: " + (err.message || "文件格式不正确"));
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* CSV Export */
  const csvEscape = (v) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const handleExport = () => {
    const header =
      "日期,标的,方向,开仓价,平仓价,数量,金额,手续费,手续费币种,盈亏,策略,情绪,市场\n";
    const exitPriceDisplay = (t) =>
      t.exitPrice === null ? "持仓中" : t.exitPrice === 0 ? "0" : t.exitPrice;
    const rows = trades
      .map((t) =>
        [t.date, t.symbol, t.direction, t.entryPrice, exitPriceDisplay(t),
          t.quantity, tradeAmt(t), t.fee, t.feeCurrency ?? "",
          t.pnl, t.strategy, t.emotion, t.market]
          .map(csvEscape).join(","),
      )
      .join("\n");
    downloadBlob(
      new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8" }),
      `trades_${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  /* JSON Backup */
  const handleBackup = () => {
    downloadBlob(
      new Blob([JSON.stringify(trades, null, 2)], { type: "application/json" }),
      `trades_backup_${new Date().toISOString().slice(0, 10)}.json`,
    );
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed)) {
          setToast("恢复失败：文件不是有效的交易记录数组");
          return;
        }
        const valid = parsed.filter(
          (t) => t && typeof t === "object" && t.id != null && t.date && t.symbol,
        );
        const skipped = parsed.length - valid.length;
        setTrades(valid);
        const skipMsg = skipped > 0 ? `，跳过 ${skipped} 条无效记录` : "";
        setToast(`恢复成功：${valid.length} 条记录${skipMsg}`);
      } catch {
        setToast("恢复失败：文件格式不正确或已损坏");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const deleteTrade = (id) => {
    confirmActionRef.current = () =>
      setTrades((prev) => prev.filter((t) => t.id !== id));
    setConfirmMsg("确定删除这条交易记录吗？此操作不可撤销。");
  };

  const startCloseTrade = (trade) => {
    setCloseTrade(trade);
  };

  const startEditTrade = (t) => {
    setEditTrade(t);
  };

  const handleClearAll = () => {
    confirmActionRef.current = () => setTrades([]);
    setConfirmMsg("确定要清空所有交易记录吗？此操作不可撤销。");
  };

  const handleAddTrade = (trade) => {
    setTrades((prev) => [...prev, trade]);
  };

  const handleCloseTrade = (id, exitPrice, pnl, exitFee) => {
    setTrades((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, exitPrice, pnl };
        if (exitFee) updated.fee = (Number(t.fee) || 0) + exitFee;
        return updated;
      }),
    );
    setCloseTrade(null);
  };

  const handleSaveTrade = (updatedTrade) => {
    setTrades((prev) =>
      prev.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)),
    );
    setEditTrade(null);
  };

  return (
    <>
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      {confirmMsg && (
        <ConfirmDialog
          message={confirmMsg}
          onConfirm={() => {
            confirmActionRef.current?.();
            confirmActionRef.current = null;
            setConfirmMsg("");
          }}
          onCancel={() => {
            confirmActionRef.current = null;
            setConfirmMsg("");
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div>
          <h1 style={S.pageTitle}>交易记录</h1>
          <p style={S.pageSubtitle}>
            <span style={{ fontWeight: 600, color: colors.text }}>
              {trades.length}
            </span>{" "}
            笔交易
            <span
              style={{ margin: "0 8px", color: colors.borderLight }}
            >
              |
            </span>
            <span style={{ fontWeight: 600, color: colors.profit }}>
              {closedCount}
            </span>{" "}
            已平仓
            <span
              style={{ margin: "0 8px", color: colors.borderLight }}
            >
              |
            </span>
            <span style={{ fontWeight: 600, color: colors.loss }}>
              {openCount}
            </span>{" "}
            持仓中
            <span
              style={{ margin: "0 8px", color: colors.borderLight }}
            >
              |
            </span>
            总盈亏{" "}
            <span style={{ ...S.pnl(stats.totalPnl), fontSize: 13 }}>
              {stats.totalPnl > 0 ? "+" : ""}
              {stats.totalPnl.toFixed(0)}
            </span>
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <button
            style={S.btn("sm")}
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="upload" size={13} /> 导入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: "none" }}
            onChange={handleFileImport}
          />
          <button style={S.btn("sm")} onClick={handleExport}>
            <Icon name="download" size={13} /> 导出
          </button>
          <button style={S.btn("sm")} onClick={handleBackup}>
            <Icon name="download" size={13} /> 备份
          </button>
          <button
            style={S.btn("sm")}
            onClick={() => restoreRef.current?.click()}
          >
            <Icon name="upload" size={13} /> 恢复
          </button>
          <input
            ref={restoreRef}
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleRestore}
          />
          <button
            style={{
              ...S.btn("sm"),
              color: colors.loss,
              borderColor: colors.loss + "40",
            }}
            onClick={handleClearAll}
          >
            <Icon name="x" size={13} /> 清空
          </button>
          <button
            style={S.btnPrimary}
            onClick={() => setShowOpenModal(true)}
          >
            <Icon name="plus" size={14} /> 新增开仓
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={S.filterBar}>
        <div style={{ position: "relative", flex: 1, maxWidth: 260 }}>
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.textTertiary,
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <Icon name="search" size={15} />
          </span>
          <input
            style={{ ...S.input, paddingLeft: 32 }}
            placeholder="搜索标的..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Dropdown
          value={filterPnl}
          onChange={setFilterPnl}
          options={["全部", "盈利", "亏损"]}
        />
      </div>

      {/* Table */}
      <div style={S.card}>
        <table style={S.table}>
          <thead>
            <tr>
              <th
                style={{ ...S.th, cursor: "pointer" }}
                onClick={() => handleSort("date")}
              >
                日期{" "}
                {sortField === "date"
                  ? sortDir === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th style={S.th}>标的</th>
              <th style={S.th}>方向</th>
              <th style={S.th}>开仓价</th>
              <th style={S.th}>平仓价</th>
              <th style={S.th}>数量</th>
              <th
                style={{ ...S.th, cursor: "pointer" }}
                onClick={() => handleSort("amount")}
              >
                金额{" "}
                {sortField === "amount"
                  ? sortDir === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th
                style={{ ...S.th, cursor: "pointer" }}
                onClick={() => handleSort("fee")}
              >
                手续费{" "}
                {sortField === "fee"
                  ? sortDir === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th
                style={{ ...S.th, cursor: "pointer" }}
                onClick={() => handleSort("pnl")}
              >
                盈亏{" "}
                {sortField === "pnl"
                  ? sortDir === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th style={S.th}>策略</th>
              <th style={S.th}>市场</th>
              <th style={S.th}>情绪</th>
              <th style={S.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedTrades.map((t) => (
              <tr
                key={t.id}
                style={{ cursor: "pointer" }}
                onClick={() => startEditTrade(t)}
              >
                <td
                  style={{
                    ...S.td,
                    fontFamily: mono,
                    fontSize: 12,
                    color: colors.textSecondary,
                  }}
                >
                  {t.date}
                </td>
                <td style={{ ...S.td, fontWeight: 600 }}>{t.symbol}</td>
                <td style={S.td}>
                  <span style={S.dirTag(t.direction)}>
                    {t.direction}
                  </span>
                </td>
                <td style={{ ...S.td, fontFamily: mono, fontSize: 12 }}>
                  {t.entryPrice}
                </td>
                <td style={{ ...S.td, fontFamily: mono, fontSize: 12 }}>
                  {t.exitPrice === null ? (
                    <span
                      style={{
                        color: colors.textTertiary,
                        fontFamily: font,
                        fontStyle: "italic",
                        fontSize: 12,
                      }}
                    >
                      持仓中
                    </span>
                  ) : t.exitPrice === 0 ? (
                    <span style={{ color: colors.textTertiary }}>—</span>
                  ) : (
                    t.exitPrice
                  )}
                </td>
                <td style={{ ...S.td, fontFamily: mono, fontSize: 12 }}>
                  {t.quantity}
                </td>
                <td
                  style={{
                    ...S.td,
                    fontFamily: mono,
                    fontSize: 12,
                    color: colors.textSecondary,
                  }}
                >
                  {tradeAmt(t).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td
                  style={{
                    ...S.td,
                    fontFamily: mono,
                    fontSize: 12,
                    color: colors.textSecondary,
                  }}
                >
                  {t.fee}
                  {t.feeCurrency && t.feeCurrency !== "USDT" && (
                    <span style={{ fontSize: 10, marginLeft: 3, color: colors.textTertiary }}>
                      {t.feeCurrency}
                    </span>
                  )}
                </td>
                <td
                  style={{ ...S.td, ...S.pnl(t.pnl), fontFamily: mono }}
                >
                  {t.exitPrice != null
                    ? (Number(t.pnl) > 0 ? "+" : "") + Number(t.pnl).toFixed(0)
                    : "—"}
                </td>
                <td style={S.td}>
                  {t.strategy ? (
                    <span style={S.tag(t.strategy)}>{t.strategy}</span>
                  ) : (
                    <span style={{ color: colors.textTertiary }}>—</span>
                  )}
                </td>
                <td style={{ ...S.td, color: colors.textSecondary, fontSize: 12 }}>
                  {t.market || <span style={{ color: colors.textTertiary }}>—</span>}
                </td>
                <td style={{ ...S.td, color: colors.textSecondary, fontSize: 12 }}>
                  {t.emotion || <span style={{ color: colors.textTertiary }}>—</span>}
                </td>
                <td style={S.td}>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t.exitPrice == null && (
                      <button
                        onClick={() => startCloseTrade(t)}
                        style={{
                          ...S.btn("sm"),
                          fontSize: 11,
                          padding: "4px 8px",
                          color: colors.profit,
                          borderColor: colors.profit + "40",
                        }}
                      >
                        平仓
                      </button>
                    )}
                    <button
                      onClick={() => deleteTrade(t.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: colors.textTertiary,
                        padding: 2,
                      }}
                    >
                      <Icon name="x" size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTrades.length === 0 && (
          <div style={S.emptyState}>暂无匹配的交易记录</div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: `1px solid ${colors.border}` }}>
            <span style={{ fontSize: 13, color: colors.textSecondary }}>
              第 {tablePage * TABLE_PAGE_SIZE + 1}–{Math.min((tablePage + 1) * TABLE_PAGE_SIZE, filteredTrades.length)} 条，共 {filteredTrades.length} 条
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => setTablePage((p) => Math.max(0, p - 1))}
                disabled={tablePage === 0}
                style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: tablePage === 0 ? colors.textTertiary : colors.text, cursor: tablePage === 0 ? "default" : "pointer", fontSize: 13, fontFamily: font }}
              >上一页</button>
              <span style={{ fontSize: 13, color: colors.textSecondary }}>
                {tablePage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setTablePage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={tablePage >= totalPages - 1}
                style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: tablePage >= totalPages - 1 ? colors.textTertiary : colors.text, cursor: tablePage >= totalPages - 1 ? "default" : "pointer", fontSize: 13, fontFamily: font }}
              >下一页</button>
              <span style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4 }}>跳至</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                defaultValue={tablePage + 1}
                key={tablePage}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = parseInt(e.currentTarget.value, 10);
                    if (!isNaN(v)) setTablePage(Math.max(0, Math.min(totalPages - 1, v - 1)));
                  }
                }}
                onBlur={(e) => {
                  const v = parseInt(e.currentTarget.value, 10);
                  if (!isNaN(v)) setTablePage(Math.max(0, Math.min(totalPages - 1, v - 1)));
                }}
                style={{ width: 52, padding: "5px 8px", borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, fontFamily: font, textAlign: "center", outline: "none" }}
              />
              <span style={{ fontSize: 13, color: colors.textSecondary }}>页</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <OpenTradeModal
        show={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        onAddTrade={handleAddTrade}
      />
      <CloseTradeModal
        trade={closeTrade}
        onClose={() => setCloseTrade(null)}
        onCloseTrade={handleCloseTrade}
      />
      <EditTradeModal
        trade={editTrade}
        onClose={() => setEditTrade(null)}
        onSaveTrade={handleSaveTrade}
      />
    </>
  );
};

export default TradesPage;
