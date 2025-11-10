import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  Chip,
  Alert,
  Box,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tabs,
  Tab
} from "@mui/material";
import {
  Add as AddIcon,
  Email as EmailIcon,
  Key as KeyIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import Page from "../components/Page";
import { Table } from "../components/Table";
import { api } from "../api/mock";
import { User } from "../types";

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [filteredItems, setFilteredItems] = useState<User[]>([]);
  
  // Filtros
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  
  // Formulario
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "nurse" | "doctor" | "reception">("reception");
  
  // Diálogo de contraseña
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  
  // Cambiar contraseña
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const load = async () => {
    const data = await api.listUsers(roleFilter === "todos" ? undefined : roleFilter);
    setItems(data);
    setFilteredItems(data);
  };

  useEffect(() => {
    load();
  }, [roleFilter]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("reception");
    setShowForm(false);
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const add = async () => {
    if (!name.trim() || !email.trim() || !validateEmail(email)) {
      alert("Por favor completa todos los campos correctamente");
      return;
    }
    
    try {
      const user = await api.addUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role
      });
      
      // Mostrar contraseña generada
      setSelectedUser(user);
      setGeneratedPassword(user.password || "");
      setPasswordDialog(true);
      
      resetForm();
      load();
    } catch (error) {
      alert("Error al crear usuario");
    }
  };

  const openChangePassword = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordDialog(true);
  };

  const changePassword = async () => {
    if (!selectedUser || !newPassword.trim() || newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    
    if (newPassword.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    
    try {
      await api.changePassword(selectedUser.id, newPassword);
      alert("Contraseña actualizada correctamente");
      setChangePasswordDialog(false);
      load();
    } catch (error) {
      alert("Error al cambiar contraseña");
    }
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      admin: "Administrador",
      nurse: "Enfermera/o",
      doctor: "Doctor/a",
      reception: "Recepción"
    };
    return roles[role] || role;
  };

  const getRoleColor = (role: string): "primary" | "success" | "info" | "secondary" => {
    const colors: Record<string, "primary" | "success" | "info" | "secondary"> = {
      admin: "primary",
      doctor: "success",
      nurse: "info",
      reception: "secondary"
    };
    return colors[role] || "secondary";
  };

  return (
    <Page>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Usuarios</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "Nuevo Usuario"}
        </Button>
      </Stack>

      <Alert severity="info" icon={<KeyIcon />} sx={{ mb: 2 }}>
        Al crear un usuario, se genera automáticamente una contraseña aleatoria que debe ser enviada por correo. 
        El usuario deberá cambiarla en su primer inicio de sesión.
      </Alert>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Filtrar por rol</Typography>
        <Tabs value={roleFilter} onChange={(_, v) => setRoleFilter(v)}>
          <Tab label="Todos" value="todos" />
          <Tab label="Administradores" value="admin" />
          <Tab label="Doctores" value="doctor" />
          <Tab label="Enfermeras/os" value="nurse" />
          <Tab label="Recepción" value="reception" />
        </Tabs>
      </Paper>

      {/* Formulario */}
      {showForm && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Nuevo Usuario</Typography>
          <Stack spacing={2}>
            <TextField
              label="Nombre completo *"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: "text.secondary" }} />
              }}
            />
            
            <TextField
              label="Correo electrónico *"
              type="email"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              error={email.length > 0 && !validateEmail(email)}
              helperText={email.length > 0 && !validateEmail(email) ? "Correo inválido" : "Se enviará la contraseña a este correo"}
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />
              }}
            />

            <TextField
              label="Rol *"
              select
              size="small"
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              fullWidth
            >
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="doctor">Doctor/a</MenuItem>
              <MenuItem value="nurse">Enfermera/o</MenuItem>
              <MenuItem value="reception">Recepción</MenuItem>
            </TextField>

            <Alert severity="warning">
              <Typography variant="body2" fontWeight={600}>Permisos del rol seleccionado:</Typography>
              <Typography variant="caption" component="div">
                {role === "admin" && "• Acceso completo a todas las funciones del sistema"}
                {role === "doctor" && "• Gestión de pacientes y medicamentos, prescripciones"}
                {role === "nurse" && "• Registro de medicamentos y cuidados de pacientes"}
                {role === "reception" && "• Gestión de entradas/salidas y objetos personales"}
              </Typography>
            </Alert>

            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={resetForm} fullWidth>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={add}
                disabled={!name.trim() || !email.trim() || !validateEmail(email)}
                fullWidth
              >
                Crear Usuario
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Tabla de usuarios */}
      <Typography variant="body2" color="text.secondary" mb={1}>
        Mostrando {filteredItems.length} de {items.length} usuarios
      </Typography>

      <Table headers={["Nombre", "Correo", "Rol", "Fecha de creación", "Estado", "Acciones"]}>
        <AnimatePresence initial={false}>
          {filteredItems.map(u => (
            <motion.tr
              key={u.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <td style={{ padding: 8, fontWeight: 600 }}>{u.name}</td>
              <td style={{ padding: 8, fontSize: 12 }}>{u.email}</td>
              <td style={{ padding: 8 }}>
                <Chip
                  label={getRoleName(u.role)}
                  color={getRoleColor(u.role)}
                  size="small"
                />
              </td>
              <td style={{ padding: 8, fontSize: 12 }}>
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
              </td>
              <td style={{ padding: 8 }}>
                {u.passwordChangeRequired ? (
                  <Chip
                    label="Cambio pendiente"
                    color="warning"
                    size="small"
                    icon={<KeyIcon />}
                  />
                ) : (
                  <Chip label="Activo" color="success" size="small" />
                )}
              </td>
              <td style={{ padding: 8 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => openChangePassword(u)}
                >
                  Cambiar contraseña
                </Button>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </Table>

      {filteredItems.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No se encontraron usuarios.
        </Alert>
      )}

      {/* Diálogo de contraseña generada */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <KeyIcon color="primary" />
            <span>Usuario creado correctamente</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Alert severity="success">
              El usuario <strong>{selectedUser?.name}</strong> ha sido creado exitosamente.
            </Alert>

            <Paper sx={{ p: 2, bgcolor: "#f5f5f5", border: "2px dashed #ccc" }}>
              <Typography variant="subtitle2" gutterBottom>Contraseña temporal generada:</Typography>
              <Typography
                variant="h6"
                fontFamily="monospace"
                sx={{
                  bgcolor: "#fff",
                  p: 1.5,
                  borderRadius: 1,
                  textAlign: "center",
                  letterSpacing: 2,
                  userSelect: "all"
                }}
              >
                {generatedPassword}
              </Typography>
            </Paper>

            <Alert severity="warning">
              <Typography variant="body2" fontWeight={600}>Importante:</Typography>
              <Typography variant="caption" component="div">
                • Esta contraseña debe ser enviada al correo: <strong>{selectedUser?.email}</strong>
                <br />
                • El usuario debe cambiarla en su primer inicio de sesión
                <br />
                • Guarda esta contraseña ya que no se mostrará nuevamente
              </Typography>
            </Alert>

            <Alert severity="info">
              <Typography variant="caption">
                <strong>TODO para tu compañero del backend:</strong> Implementar el envío automático de correo con esta contraseña.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setPasswordDialog(false)}>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo cambiar contraseña */}
      <Dialog open={changePasswordDialog} onClose={() => setChangePasswordDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cambiar contraseña</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Usuario: <strong>{selectedUser?.name}</strong>
            </Alert>

            <TextField
              label="Nueva contraseña *"
              type="password"
              size="small"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              helperText="Mínimo 8 caracteres"
            />

            <TextField
              label="Confirmar contraseña *"
              type="password"
              size="small"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              error={confirmPassword.length > 0 && newPassword !== confirmPassword}
              helperText={confirmPassword.length > 0 && newPassword !== confirmPassword ? "Las contraseñas no coinciden" : ""}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={changePassword}
            disabled={!newPassword.trim() || newPassword !== confirmPassword || newPassword.length < 8}
          >
            Cambiar Contraseña
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}