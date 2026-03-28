import { S, font } from "../styles/index";

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  if (!message) return null;

  return (
    <div
      style={{ ...S.modal, paddingBottom: "24vh", paddingRight: "6vw" }}
      onClick={onCancel}
    >
      <div
        style={{ ...S.modalContent, width: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            marginBottom: 24,
            fontFamily: font,
            whiteSpace: "pre-wrap",
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button style={S.btn()} onClick={onCancel}>取消</button>
          <button style={S.btnPrimary} onClick={onConfirm}>确定</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
