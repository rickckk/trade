import { useState, useEffect } from "react";
import Icon from "./Icon";
import Dropdown from "./Dropdown";
import Toast from "./Toast";
import { S, colors } from "../styles/index";

const OpenTradeModal = ({ show, onClose, onAddTrade }) => {
  const [toast, setToast] = useState("");
  const [newTrade, setNewTrade] = useState({
    date: new Date().toISOString().slice(0, 10),
    symbol: "",
    direction: "多",
    entryPrice: "",
    quantity: "",
    fee: "",
    strategy: "",
    market: "",
    emotion: "",
  });

  useEffect(() => {
    if (show) {
      setNewTrade({
        date: new Date().toISOString().slice(0, 10),
        symbol: "",
        direction: "多",
        entryPrice: "",
        quantity: "",
        fee: "",
        strategy: "",
        market: "",
        emotion: "",
      });
    }
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [show, onClose]);

  const handleOpenTrade = () => {
    if (
      !newTrade.date ||
      !newTrade.symbol ||
      !newTrade.entryPrice ||
      !newTrade.quantity
    ) {
      setToast("请填写必填项：日期、标的、开仓价、数量");
      return;
    }
    const ep = parseFloat(newTrade.entryPrice);
    const qty = parseFloat(newTrade.quantity);
    if (!ep || ep <= 0) { setToast("开仓价必须大于 0"); return; }
    if (!qty || qty <= 0) { setToast("数量必须大于 0"); return; }
    const t = {
      id: Date.now(),
      date: newTrade.date,
      symbol: newTrade.symbol.toUpperCase(),
      direction: newTrade.direction,
      entryPrice: parseFloat(newTrade.entryPrice) || 0,
      exitPrice: null,
      quantity: parseFloat(newTrade.quantity) || 0,
      fee: parseFloat(newTrade.fee) || 0,
      pnl: 0,
      strategy: newTrade.strategy,
      emotion: newTrade.emotion,
      market: newTrade.market,
    };
    onAddTrade(t);
    onClose();
    setNewTrade({
      date: new Date().toISOString().slice(0, 10),
      symbol: "",
      direction: "多",
      entryPrice: "",
      quantity: "",
      fee: "",
      strategy: "",
      market: "",
      emotion: "",
    });
  };

  if (!show) return null;

  return (
    <>
    {toast && <Toast message={toast} onClose={() => setToast("")} />}
    <div style={{ ...S.modal, paddingBottom: "10vh", paddingRight: "3vw" }} onClick={onClose}>
      <div style={S.modalContent} onClick={(e) => e.stopPropagation()}>
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
            新增开仓
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.textSecondary,
            }}
          >
            <Icon name="x" />
          </button>
        </div>
        <div style={S.formGrid}>
          {/* 日期 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>日期 *</label>
            <input style={S.input} type="date" value={newTrade.date}
              onChange={(e) => setNewTrade((p) => ({ ...p, date: e.target.value }))} />
          </div>
          {/* 标的 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>标的 *</label>
            <input style={S.input} placeholder="BTC" value={newTrade.symbol}
              onChange={(e) => setNewTrade((p) => ({ ...p, symbol: e.target.value }))} />
          </div>
          {/* 方向 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>方向 *</label>
            <Dropdown block value={newTrade.direction} options={["多", "空"]}
              onChange={(v) => setNewTrade((p) => ({ ...p, direction: v }))} />
          </div>
          {/* 开仓价 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>开仓价 *</label>
            <input style={S.input} type="number" placeholder="0" value={newTrade.entryPrice}
              onChange={(e) => setNewTrade((p) => ({ ...p, entryPrice: e.target.value }))} />
          </div>
          {/* 数量 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>数量 *</label>
            <input style={S.input} type="number" placeholder="0" value={newTrade.quantity}
              onChange={(e) => setNewTrade((p) => ({ ...p, quantity: e.target.value }))} />
          </div>
          {/* 手续费 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>
              手续费{" "}
              <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(选填)</span>
            </label>
            <input style={S.input} type="number" placeholder="0" value={newTrade.fee}
              onChange={(e) => setNewTrade((p) => ({ ...p, fee: e.target.value }))} />
          </div>
          {/* 策略 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>
              策略{" "}
              <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(选填)</span>
            </label>
            <Dropdown block upward value={newTrade.strategy || "—"} options={["—", "突破", "回调", "反弹"]}
              onChange={(v) => setNewTrade((p) => ({ ...p, strategy: v === "—" ? "" : v }))} />
          </div>
          {/* 市场 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>
              市场{" "}
              <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(选填)</span>
            </label>
            <Dropdown block upward value={newTrade.market || "—"} options={["—", "趋势", "震荡", "单边"]}
              onChange={(v) => setNewTrade((p) => ({ ...p, market: v === "—" ? "" : v }))} />
          </div>
          {/* 情绪 */}
          <div style={S.formGroup}>
            <label style={S.formLabel}>
              情绪{" "}
              <span style={{ color: colors.textTertiary, fontWeight: 400 }}>(选填)</span>
            </label>
            <Dropdown block upward value={newTrade.emotion || "—"} options={["—", "冷静", "冲动", "犹豫"]}
              onChange={(v) => setNewTrade((p) => ({ ...p, emotion: v === "—" ? "" : v }))} />
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
          <button style={S.btnPrimary} onClick={handleOpenTrade}>
            确认开仓
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default OpenTradeModal;
