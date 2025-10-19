import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#f9cf16ff",   // naranja
      dark: "#eaa40cff",
      light: "#fb923c",
      contrastText: "#fff",
    },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", borderRadius: 12 },
        containedPrimary: {
          boxShadow: "none",
          "&:hover": { boxShadow: "none", backgroundColor: "#ea580c" },
        },
      },
    },
  },
});

export default theme;
