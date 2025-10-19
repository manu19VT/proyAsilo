// src/theme.ts
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#f9bc16ff",   // naranja principal
      dark: "#ea580c",
      light: "#ec7615ff",
      contrastText: "#eae7e7ff",
    },
    background: {
      default: "#fffefcff", // ← color de fondo global (body)
      paper:   "#f3ebd6ff", // ← fondo de tarjetas/papers
    },

  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: [
      "Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"
    ].join(","),
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // asegura que el color de fondo se aplique siempre
          backgroundColor: "#f1efedff",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16, border: "1px solid #eee" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", borderRadius: 12 },
        containedPrimary: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none", backgroundColor: "#ea580c" },
        },
      },
    },
    // Si usas Tabs, mantén el acento naranja:
    MuiTabs: { styleOverrides: { indicator: { backgroundColor: "#f97316" } } },
    MuiTab:  { styleOverrides: { root: { "&.Mui-selected": { color: "#f97316" } } } },
  },
});

export default theme;
