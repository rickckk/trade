import { useState, useEffect } from "react";
import Icon from "./Icon";
import Toast from "./Toast";
import { S, colors, mono } from "../styles/index";

const CloseTradeModal = ({ trade, onClose, onCloseTrade }) => {
  const [toast, setToast] = useState("");
  const [closeForm, setCloseForm] = useState({
    exitPrice: "",
    exitFee: "",
    pnl: "",
  });

  useEffect(() => {
    setCloseForm({ exitPrice: "", exitFee: "", pnl: "" });
  }, [trade]);

  useEffect(() => {
    if (!trade) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [trade, onClose]);

  const autoCalcPnl = (exitPriceStr, exitFeeStr) => {
    if (!trade) return "";
    const ep = parseFloat(exitPriceStr);
    if (isNaN(ep) || exitPriceStr === "") return "";
    const gross =
      trade.direction === "多"
        ? (ep - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - ep) * trade.quantity;
    const exitFee = parseFloat(exitFeeStr) || 0;
    return (gross - (Number(trade.fee) || 0) - exitFee).toFixed(2);
  };

  const handleCloseTrade = () => {
    if (!trade) return;
    if (!closeForm.exitPrice) {
      setToast("请填写平仓价");
      return;
    }
    if (closeForm.pnl === "") {
      setToast("请填写盈亏金额");
      return;
    }
    const exitPrice = parseFloat(closeForm.exitPrice);
    const pnl = parseFloat(closeForm.pnl);
    if (isNaN(exitPrice)) { setToast("平仓价格格式不正确"); return; }
    if (isNaN(pnl)) { setToast("盈亏格式不正确"); return; }
    const exitFee = parseFloat(closeForm.exitFee) || 0;
    onCloseTrade(trade.id, exitPrice, pnl, exitFee);
    onClose();
  };

  if (!trade) return null;

  return (
    <>
    {toast && <Toast message={toast} onClose={() => setToast("")} />}
    <div style={{ ...S.modal, paddingBottom: "16vh", paddingRight: "5vw" }} onClick={onClose}>
      <div
        style={{ ...S.modalContent, width: 420 }}
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
            平仓
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.textSecondary,
              marginLeft: 24,
            }}
          >
            <Icon name="x" />
          </button>
        </div>

        {/* Position info */}
        <div
          style={{
            background: colors.accentLight,
            borderRadius: 10,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700 }}>
              {trade.symbol}
            </span>
            <span style={S.dirTag(trade.direction)}>
              {trade.direction}
            </span>
            {trade.strategy && (
              <span style={S.tag(trade.strategy)}>
                {trade.strategy}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            <span>
              开仓价{" "}
              <span
                style={{
                  fontFamily: mono,
                  color: colors.text,
                  fontWeight: 600,
                }}
              >
                {trade.entryPrice}
              </span>
            </span>
            <span>
              数量{" "}
              <span
                style={{
                  fontFamily: mono,
                  color: colors.text,
                  fontWeight: 600,
                }}
              >
                {trade.quantity}
              </span>
            </span>
            <span>
              手续费{" "}
              <span
                style={{
                  fontFamily: mono,
                  color: colors.text,
                  fontWeight: 600,
                }}
              >
                {trade.fee}
              </span>
            </span>
          </div>
        </div>

        <div style={S.formGrid}>
          <div style={S.formGroup}>
            <label style={S.formLabel}>平仓价 *</label>
            <input
              style={S.input}
              type="number"
              placeholder="平仓价格"
              value={closeForm.exitPrice}
              onChange={(e) => {
                const ep = e.target.value;
                setCloseForm((p) => ({
                  ...p,
                  exitPrice: ep,
                  pnl: autoCalcPnl(ep, p.exitFee),
                }));
              }}
            />
          </div>
          <div style={S.formGroup}>
            <label style={S.formLabel}>
              平仓手续费{" "}
              <span style={{ color: "#888", fontWeight: 400 }}>(选填)</span>
            </label>
            <input
              style={S.input}
              type="number"
              placeholder="平仓手续费"
              value={closeForm.exitFee}
              onChange={(e) => {
                const ef = e.target.value;
                setCloseForm((p) => ({
                  ...p,
                  exitFee: ef,
                  pnl: autoCalcPnl(p.exitPrice, ef),
                }));
              }}
            />
          </div>
          <div style={S.formGroup}>
            <label style={S.formLabel}>盈亏 * (自动计算，可修改)</label>
            <input
              style={S.input}
              type="number"
              placeholder="盈亏金额"
              value={closeForm.pnl}
              onChange={(e) =>
                setCloseForm((p) => ({ ...p, pnl: e.target.value }))
              }
            />
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
          <button style={S.btnPrimary} onClick={handleCloseTrade}>
            确认平仓
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default CloseTradeModal;
