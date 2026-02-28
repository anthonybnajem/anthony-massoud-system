export const themeColors = {
  accent: {
    green: {
      hex: "#7ED957",
      soft: "#7ED95726",
      glow: "#7ED95766",
      shadow: "#7ED95747",
    },

    black: {
      hex: "#0B0B0C", // base black (not pure black → better for UI)
      soft: "#1A1A1D", // surfaces / cards
      glow: "#2A2A2F", // borders / glass glow / hover
      shadow: "#00000000", // real shadow anchor
    },
    purple: {
      hex: "#8B5CF6",
      shadow: "#8B5CF640",
    },
    blue: { hex: "#38BDF8" },
    red: {
      hex: "#F87171",
      textHex: "#b93f3f",
      alpha20: "#F8717133",
      alpha30: "#F871714D",
      alpha40: "#F8717166",
      alpha50: "#F8717180",
      shadow: "#F8717140",
    },
  },
  semantic: {
    background: { hex: "#EEF1FB" },
    foreground: { hex: "#1F2937" },
    card: { hex: "#FFFFFF" },
    cardForeground: { hex: "#1F2937" },
    popover: { hex: "#FFFFFF" },
    popoverForeground: { hex: "#1F2937" },
    primary: { hex: "#0B0B0C" },
    primaryForeground: { hex: "#FFFFFF" },
    secondary: { hex: "#F2F4FB" },
    secondaryForeground: { hex: "#1F2937" },
    muted: { hex: "#F2F4FB" },
    mutedForeground: { hex: "#6B7280" },
    accent: { hex: "#F2F4FB" },
    accentForeground: { hex: "#1F2937" },
    destructive: { hex: "#F87171" },
    destructiveForeground: { hex: "#FFFFFF" },
    border: { hex: "#FFFFFF" },
    input: { hex: "#FFFFFF" },
    ring: { hex: "#A7B3C9" },
    sidebarBackground: { hex: "#F6F7FD" },
    sidebarForeground: { hex: "#4B5563" },
    sidebarPrimary: { hex: "#1F2937" },
    sidebarPrimaryForeground: { hex: "#FFFFFF" },
    sidebarAccent: { hex: "#EEF1FB" },
    sidebarAccentForeground: { hex: "#1F2937" },
    sidebarBorder: { hex: "#FFFFFF" },
    sidebarRing: { hex: "#A7B3C9" },
    chart1: { hex: "#0B0B0C" },
    chart2: { hex: "#8B5CF6" },
    chart3: { hex: "#38BDF8" },
    chart4: { hex: "#FBC2EB" },
    chart5: { hex: "#F4B96A" },
  },
  typography: {
    greeting: {
      size: "30px",
      weight: 600,
      color: "#1F2937",
    },
    section: {
      size: "17px",
      weight: 500,
      color: "#374151",
    },
    kpi: {
      size: "48px",
      weight: 700,
      color: "#1F2937",
      letterSpacing: "-0.02em",
    },
    secondary: {
      size: "14px",
      weight: 400,
      color: "#6B7280",
    },
  },
} as const;
