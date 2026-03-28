import { useEffect, useRef } from "react";
import { S, font } from "../styles/index";

const Toast = ({ message, onClose, zIndex = 1100 }) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onCloseRef.current(), 4000);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <div
      style={{ ...S.modal, paddingBottom: "24vh", paddingRight: "6vw", zIndex }}
      onClick={onClose}
    >
      <div
        style={{ ...S.modalContent, width: 380, padding: "24px 28px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            marginBottom: 20,
            fontFamily: font,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={S.btnPrimary} onClick={onClose}>好的</button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
