import { Component } from "react";
import { colors } from "../styles/index";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("页面渲染错误:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: colors.textSecondary,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: colors.text }}>
            页面渲染出错
          </div>
          <div style={{ fontSize: 13, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            {String(this.state.error?.message || "未知错误")}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.text,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
