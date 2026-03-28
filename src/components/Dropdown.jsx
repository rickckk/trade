import { useState, useRef, useEffect } from "react";
import Icon from "./Icon";
import { colors, font } from "../styles/index";

const Dropdown = ({ value, onChange, options, block, upward }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", width: block ? "100%" : "auto" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          padding: "8px 10px 8px 12px",
          borderRadius: 8,
          fontSize: 13,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          color: colors.text,
          cursor: "pointer",
          fontFamily: font,
          outline: "none",
          whiteSpace: "nowrap",
          width: block ? "100%" : "auto",
        }}
      >
        <span>{value}</span>
        <span
          style={{
            color: colors.textTertiary,
            display: "flex",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          <Icon name="chevron" size={14} />
        </span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            ...(upward
              ? { bottom: "calc(100% + 4px)" }
              : { top: "calc(100% + 4px)" }),
            left: 0,
            zIndex: 9999,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: "4px 0",
            minWidth: "100%",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: font,
                background: opt === value ? colors.accentLight : "transparent",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  opt === value ? colors.accentLight : colors.hover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  opt === value ? colors.accentLight : "transparent")
              }
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
