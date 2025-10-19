import { NavLink } from "react-router-dom";
import { AppBar, Toolbar, Stack, Button, Box } from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import MedicationIcon from "@mui/icons-material/Medication";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import logo from "../assets/logo.png";

const tabs = [
  { to: "/",             label: "Panel" },
  { to: "/pacientes",    label: "Pacientes",    icon: <GroupIcon /> },
  { to: "/medicamentos", label: "Medicamentos", icon: <MedicationIcon /> },
  { to: "/entradas",     label: "Entradas",     icon: <AssignmentTurnedInIcon /> },
  { to: "/objetos",      label: "Objetos",      icon: <Inventory2Icon /> },
  { to: "/usuarios",     label: "Usuarios",     icon: <PeopleAltIcon /> },
];

export default function Navbar() {
  return (
    <AppBar position="sticky" color="inherit" elevation={0}
      sx={{ borderBottom: "1px solid #eee", backdropFilter: "saturate(180%) blur(8px)" }}>
      <Toolbar sx={{ gap: 1 }}>
        {/* Logo */}
        <NavLink to="/" style={{ textDecoration: "none" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", pr: 1 }}>
            <Box component="img" src={logo} alt="Logo" sx={{ height: 100, width: "auto", objectFit: "contain" }} />
          </Box>
        </NavLink>

        <Box sx={{ flexGrow: 1 }} />

        {/* Pestañas como BOTONES MUI */}
        <Stack direction="row" spacing={1} sx={{ mr: 1 }}>
          {tabs.map(t => (
            <NavLink key={t.to} to={t.to} style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <Button
                  startIcon={t.icon}
                  size="large"
                  color={isActive ? "primary" : "inherit"}
                  variant={isActive ? "contained" : "text"}
                  sx={{
                    ...( !isActive && {
                      color: "text.primary",
                      "&:hover": { backgroundColor: "rgba(249,115,22,.08)" } // naranja tenue al hover
                    })
                  }}
                >
                  {t.label}
                </Button>
              )}
            </NavLink>
          ))}
        </Stack>

        {/* Login */}
        <NavLink to="/login" style={{ textDecoration: "none" }}>
          <Button variant="outlined" color="primary" size="small" startIcon={<LoginIcon />}>
            Iniciar sesión
          </Button>
        </NavLink>
      </Toolbar>
    </AppBar>
  );
}
