import { useState, useEffect } from "react";
import Icon from "./Icon";
import Dropdown from "./Dropdown";
import Toast from "./Toast";
import { S, colors } from "../styles/index";

const EditTradeModal = ({ trade, onClose, onSaveTrade }) => {
  const [toast, setToast] = useState("");
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (trade) {
      setEditForm({
        date: trade.date,
        symbol: trade.symbol,
        direction: trade.direction,
        entryPrice: String(trade.entryPrice),
        exitPrice: trade.exitPrice != null ? String(trade.exitPrice) : "",
        quantity: String(trade.quantity),
        fee: String(trade.fee),
        pnl: String(trade.pnl),
        strategy: trade.strategy || "",
        emotion: trade.emotion || "",
        market: trade.market || "",
      });
    }
  }, [trade]);

  useEffect(() => {
    if (!trade) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [trade, onClose]);

  const autoCalcPnl = (form) => {
    const ep = parseFloat(form.exitPrice);
    const entry = parseFloat(form.entryPrice);
    const qty = parseFloat(form.quantity);
    const fee = parseFloat(form.fee) || 0;
    if (isNaN(ep) || isNaN(entry) || isNaN(qty) || form.exitPrice === "") return form.pnl;
    const gross = form.direction === "多" ? (ep - entry) * qty : (entry - ep) * qty;
    return (gross - fee).toFixed(2);
  };

  const handleSaveEdit = () => {
    if (!editForm.date || !editForm.symbol || !editForm.entryPrice || !editForm.quantity) {
      setToast("请填写必填项：日期、标的、开仓价、数量");
      return;
    }
    if (trade.exitPrice != null && !editForm.exitPrice) {
      setToast("请填写平仓价");
      return;
    }
    const exitPrice =
      editForm.exitPrice !== "" ? parseFloat(editForm.exitPrice) : null;
    const updatedTrade = {
      ...trade,
      date: editForm.date,
      symbol: editForm.symbol.toUpperCase(),
      direction: editForm.direction,
      entryPrice: parseFloat(editForm.entryPrice) || 0,
      exitPrice,
      quantity: parseFloat(editForm.quantity) || 0,
      fee: parseFloat(editForm.fee) || 0,
      pnl: exitPrice != null ? parseFloat(editForm.pnl) || 0 : 0,
      strategy: editForm.strategy,
      emotion: editForm.emotion,
      market: editForm.market,
      amount: undefined, // clear stale amount so tradeAmt re-computes from new entryPrice×quantity
    };
    onSaveTrade(updatedTrade);
    onClose();
  };

  if (!trade) return null;

  return (
    <>
    {toast && <Toast message={toast} onClose={() => setToast("")} />}
    <div style={{ ...S.modal, paddingBottom: "10vh", paddingRight: "3vw" }} onClick={onClose}>
      <div
        style={{ ...S.modalContent, width: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}
          >
            {trade?.exitPrice == null ? "编辑持仓" : "编辑已平仓"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.textSecondary,
              outline: "none",
            }}
          >
            <Icon name="x" />
          </button>
        </div>
        <div style={S.formGrid}>
          {/* 日期 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>日期 *</label>
            <input style={S.input} type="date" value={editForm.date || ""}
              onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} />
          </div>
          {/* 标的 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>标的 *</label>
            <input style={S.input} placeholder="BTC" value={editForm.symbol || ""}
              onChange={(e) => setEditForm((p) => ({ ...p, symbol: e.target.value }))} />
          </div>
          {/* 方向 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>方向 *</label>
            <Dropdown block value={editForm.direction || "多"} options={["多", "空"]}
              onChange={(v) => setEditForm((p) => {
                const next = { ...p, direction: v };
                if (trade.exitPrice != null) next.pnl = autoCalcPnl(next);
                return next;
              })} />
          </div>
          {/* 开仓价 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>开仓价 *</label>
            <input style={S.input} type="number" value={editForm.entryPrice ?? ""}
              onChange={(e) => setEditForm((p) => {
                const next = { ...p, entryPrice: e.target.value };
                if (trade.exitPrice != null) next.pnl = autoCalcPnl(next);
                return next;
              })} />
          </div>
          {/* 平仓价：已平仓必填，持仓中不显示 */}
          {trade.exitPrice != null && (
            <div style={S.formGroup}>
              <label style={S.formLabel}>平仓价 *</label>
              <input style={S.input} type="number" value={editForm.exitPrice ?? ""}
                onChange={(e) => setEditForm((p) => {
                  const next = { ...p, exitPrice: e.target.value };
                  next.pnl = autoCalcPnl(next);
                  return next;
                })} />
            </div>
          )}
          {/* 数量 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>数量 *</label>
            <input style={S.input} type="number" value={editForm.quantity ?? ""}
              onChange={(e) => setEditForm((p) => {
                const next = { ...p, quantity: e.target.value };
                if (trade.exitPrice != null) next.pnl = autoCalcPnl(next);
                return next;
              })} />
          </div>
          {/* 手续费 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>
              手续费{" "}
              <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(选填)</span>
            </label>
            <input style={S.input} type="number" value={editForm.fee ?? ""}
              onChange={(e) => setEditForm((p) => {
                const next = { ...p, fee: e.target.value };
                if (trade.exitPrice != null) next.pnl = autoCalcPnl(next);
                return next;
              })} />
          </div>
          {/* 盈亏：已平仓必填，持仓中不显示 */}
          {trade.exitPrice != null && (
            <div style={S.formGroup}>
              <label style={S.formLabel}>盈亏 * (自动计算，可修改)</label>
              <input style={S.input} type="number" value={editForm.pnl ?? ""}
                onChange={(e) => setEditForm((p) => ({ ...p, pnl: e.target.value }))} />
            </div>
          )}
          {/* 策略 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>
              策略{" "}
              <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(选填)</span>
            </label>
            <Dropdown block upward value={editForm.strategy || "—"} options={["—", "突破", "回调", "反弹"]}
              onChange={(v) => setEditForm((p) => ({ ...p, strategy: v === "—" ? "" : v }))} />
          </div>
          {/* 市场 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>
              市场{" "}
              <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(选填)</span>
            </label>
            <Dropdown block upward value={editForm.market || "—"} options={["—", "趋势", "震荡", "单边"]}
              onChange={(v) => setEditForm((p) => ({ ...p, market: v === "—" ? "" : v }))} />
          </div>
          {/* 情绪 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>
              情绪{" "}
              <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(选填)</span>
            </label>
            <Dropdown block upward value={editForm.emotion || "—"} options={["—", "冷静", "冲动", "犹豫"]}
              onChange={(v) => setEditForm((p) => ({ ...p, emotion: v === "—" ? "" : v }))} />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 20,
          }}
        >
          <button style={S.btn()} onClick={onClose}>
            取消
          </button>
          <button style={S.btnPrimary} onClick={handleSaveEdit}>
            保存修改
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default EditTradeModal;
