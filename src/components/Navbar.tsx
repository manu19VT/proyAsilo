import { useState, useEffect } from "react";
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
  InputAdornment,
  Alert,
  Stack
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api/client";
import { customRolesService, Permission } from "../services/customRolesService";

export default function Navbar() {
  const { user, logout, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Obtener permisos del usuario (roles predeterminados o personalizados)
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setUserPermissions([]);
        return;
      }
      
      // Si es admin, tiene todos los permisos
      if (user.role === "admin") {
        setUserPermissions(["pacientes", "medicamentos", "control_es", "objetos"]);
        return;
      }
      
      // Si tiene un rol personalizado, obtener sus permisos
      if (user.customRoleId) {
        const customRole = await customRolesService.getById(user.customRoleId);
        setUserPermissions(customRole ? customRole.permisos : []);
        return;
      }
      
      // Permisos para roles predeterminados
      const defaultPermissions: Record<string, Permission[]> = {
        doctor: ["pacientes", "medicamentos"],
        nurse: ["pacientes", "medicamentos", "control_es"],
        reception: ["control_es", "objetos"],
        usuario: [] // Sin permisos por defecto
      };
      
      setUserPermissions(defaultPermissions[user.role] || []);
    };

    loadPermissions();
  }, [user]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Diálogo Iniciar sesión
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  // Diálogo Cambiar contraseña
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) {
      // Si no hay usuario, abrir diálogo de inicio de sesión
      setLoginOpen(true);
    } else {
      // Si hay usuario, mostrar menú
      setAnchorEl(event.currentTarget);
    }
  };
  const handleClose = () => setAnchorEl(null);

  const handleLogin = async () => {
    setLoginError(null);
    if (!email || !password) {
      setLoginError("Completa correo y contraseña.");
      return;
    }

    try {
      setLoginBusy(true);
      const { user: loggedUser } = await api.login(email, password);
      login(loggedUser);
      setLoginOpen(false);
      setEmail("");
      setPassword("");
      navigate('/');
    } catch (err: any) {
      setLoginError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoginBusy(false);
    }
  };

  const submitChangePassword = async () => {
    if (!user?.id) return;
    if (!currentPassword.trim() || !newPassword.trim()) {
      alert("Completa la contraseña actual y la nueva contraseña.");
      return;
    }
    if (newPassword.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (currentPassword === newPassword) {
      alert("La nueva contraseña debe ser diferente a la actual");
      return;
    }
    try {
      setSaving(true);
      await api.changePassword(user.id, currentPassword, newPassword);
      alert("Contraseña actualizada correctamente");
      setPwOpen(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "No se pudo actualizar la contraseña. Verifica la contraseña actual.");
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
          {userPermissions.includes("pacientes") && (
            <RouterLink to="/patients" style={linkStyle("/patients")}>Pacientes</RouterLink>
          )}
          {userPermissions.includes("medicamentos") && (
            <RouterLink to="/meds" style={linkStyle("/meds")}>Medicamentos</RouterLink>
          )}
          {userPermissions.includes("control_es") && (
            <RouterLink to="/entries" style={linkStyle("/entries")}>Control E/S</RouterLink>
          )}
          {userPermissions.includes("objetos") && (
            <RouterLink to="/objects" style={linkStyle("/objects")}>Objetos</RouterLink>
          )}
          {user?.role === "admin" && (
            <RouterLink to="/users" style={linkStyle("/users")}>Usuarios</RouterLink>
          )}
        </Box>

        <Box>
          <Button color="inherit" onClick={handleMenu}>
            {user?.name || "Iniciar sesión"}
          </Button>
          {user && (
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
          )}
        </Box>
      </Toolbar>

      {/* Diálogo Iniciar sesión */}
      <Dialog
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          setEmail("");
          setPassword("");
          setLoginError(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Iniciar sesión</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {loginError && <Alert severity="error">{loginError}</Alert>}
            <TextField
              type="email"
              label="Correo"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              fullWidth
              autoFocus
            />
            <TextField
              type="password"
              label="Contraseña"
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setLoginOpen(false);
              setEmail("");
              setPassword("");
              setLoginError(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleLogin}
            disabled={!email || !password || loginBusy}
          >
            {loginBusy ? "Iniciando..." : "Entrar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Cambiar contraseña */}
      <Dialog
        open={pwOpen}
        onClose={() => {
          setPwOpen(false);
          setCurrentPassword("");
          setNewPassword("");
        }}
        maxWidth="xs"
        fullWidth
      >
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
            error={newPassword.length > 0 && newPassword.length < 8}
            helperText={
              newPassword.length > 0 && newPassword.length < 8
                ? "La contraseña debe tener al menos 8 caracteres"
                : "Mínimo 8 caracteres"
            }
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
          {currentPassword && newPassword && currentPassword === newPassword && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="error">
                La nueva contraseña debe ser diferente a la actual
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPwOpen(false);
              setCurrentPassword("");
              setNewPassword("");
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={submitChangePassword}
            disabled={
              !currentPassword.trim() ||
              !newPassword.trim() ||
              newPassword.length < 8 ||
              currentPassword === newPassword ||
              saving
            }
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
