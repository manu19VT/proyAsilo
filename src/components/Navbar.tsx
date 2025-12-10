import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  InputAdornment
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api/client";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Diálogo Cambiar contraseña
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const submitChangePassword = async () => {
    if (!user?.id) return;
    if (!currentPassword.trim() || !newPassword.trim()) {
      alert("Completa la contraseña actual y la nueva contraseña.");
      return;
    }
    try {
      setSaving(true);
      // Tu API: (userId: string, currentPassword: string, newPassword: string)
      await api.changePassword(user.id, currentPassword, newPassword);
      alert("Contraseña actualizada");
      setPwOpen(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar la contraseña. Verifica la contraseña actual.");
    } finally {
      setSaving(false);
    }
  };

  const linkStyle = (path: string) => ({
    color: "#fff",
    textDecoration: "none",
    fontWeight: location.pathname === path ? 700 : 500,
    opacity: location.pathname === path ? 1 : 0.9,
    marginRight: 16
  });

  return (
    <AppBar position="sticky" color="primary">
      <Toolbar sx={{ gap: 2 }}>
        <IconButton edge="start" color="inherit" aria-label="menu" sx={{ display: { xs: "inline-flex", md: "none" } }}>
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Asilo Las Margaritas
        </Typography>

        {/* Navegación principal */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
          <RouterLink to="/dashboard" style={linkStyle("/dashboard")}>Dashboard</RouterLink>
          <RouterLink to="/patients" style={linkStyle("/patients")}>Pacientes</RouterLink>
          <RouterLink to="/meds" style={linkStyle("/meds")}>Medicamentos</RouterLink>
          <RouterLink to="/entries" style={linkStyle("/entries")}>Control E/S</RouterLink>
          <RouterLink to="/objects" style={linkStyle("/objects")}>Objetos</RouterLink>
          <RouterLink to="/users" style={linkStyle("/users")}>Usuarios</RouterLink>
        </Box>

        <Box>
          <Button color="inherit" onClick={handleMenu}>
            {user?.name || "Cuenta"}
          </Button>
          <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
            <MenuItem
              onClick={() => {
                setPwOpen(true);
                handleClose();
              }}
            >
              Cambiar contraseña
            </MenuItem>
            <MenuItem onClick={() => { handleClose(); logout(); }}>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Diálogo Cambiar contraseña */}
      <Dialog open={pwOpen} onClose={() => setPwOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar contraseña</DialogTitle>
        <DialogContent>
          <TextField
            label="Contraseña actual"
            type={showCurrent ? "text" : "password"}
            fullWidth
            autoFocus
            margin="dense"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="mostrar contraseña actual"
                    onClick={() => setShowCurrent((s) => !s)}
                    edge="end"
                  >
                    {showCurrent ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            label="Nueva contraseña"
            type={showNew ? "text" : "password"}
            fullWidth
            margin="dense"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="mostrar nueva contraseña"
                    onClick={() => setShowNew((s) => !s)}
                    edge="end"
                  >
                    {showNew ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={submitChangePassword}
            disabled={!currentPassword.trim() || !newPassword.trim() || saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
