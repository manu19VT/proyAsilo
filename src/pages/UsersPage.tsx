import { useEffect, useMemo, useState } from "react";
import {
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  Chip,
  Alert,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from "@mui/material";
import {
  Add as AddIcon,
  Email as EmailIcon,
  Key as KeyIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  DeleteOutline as DeleteIcon
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import Page from "../components/Page";
import { Table } from "../components/Table";
import { api } from "../api/client";
import { User } from "../types";
import { useAuth } from "../contexts/AuthContext";

const ROLE_LABELS: Record<User["role"], string> = {
  admin: "Administrador",
  doctor: "Doctor/a",
  nurse: "Enfermera/o",
  usuario: "Usuario",
  reception: "Recepción"
};

const ROLE_COLORS: Record<User["role"], "primary" | "success" | "info" | "secondary" | "default"> = {
  admin: "primary",
  doctor: "success",
  nurse: "info",
  usuario: "default",
  reception: "secondary"
};

type RoleFilter = "todos" | User["role"];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("todos");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<User["role"]>("reception");
  const [age, setAge] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const load = async () => {
    try {
      const data = await api.listUsers(roleFilter === "todos" ? undefined : roleFilter);
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error(error);
      alert("Error al cargar usuarios");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("reception");
    setAge("");
    setBirthDate("");
    setPassword("");
    setShowForm(false);
  };

  const validateEmail = useMemo(
    () => (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    []
  );

  const handleCreateUser = async () => {
    if (!name.trim() || !email.trim() || !validateEmail(email) || !password.trim()) {
      alert("Por favor completa nombre, correo válido y contraseña.");
      return;
    }

    const ageValue = age.trim() ? Number(age) : undefined;
    if (ageValue !== undefined && (Number.isNaN(ageValue) || ageValue < 0)) {
      alert("La edad debe ser un número válido.");
      return;
    }

    const birthDateValue = birthDate.trim() ? birthDate : undefined;

    try {
      await api.addUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        age: ageValue,
        birthDate: birthDateValue,
        password: password.trim()
      });
      setSuccessMessage(`Usuario ${name.trim()} creado correctamente. Comparte la contraseña ingresada con el usuario asignado.`);
      resetForm();
      load();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Error al crear usuario");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!isAdmin) return;
    setSelectedUser(user);
    setDeletePassword("");
    setDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser || !deletePassword.trim()) {
      alert("Por favor ingresa la contraseña del usuario para confirmar la eliminación");
      return;
    }
    try {
      await api.deleteUser(selectedUser.id, deletePassword);
      alert("Usuario eliminado correctamente");
      setDeleteDialog(false);
      setDeletePassword("");
      setSelectedUser(null);
      load();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Error al eliminar usuario. Verifica que la contraseña sea correcta.");
    }
  };

  useEffect(() => {
    if (birthDate.trim()) {
      const birth = new Date(birthDate);
      if (!Number.isNaN(birth.getTime())) {
        const today = new Date();
        let years = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          years--;
        }
        setAge(years >= 0 ? String(years) : "");
        return;
      }
    }
    setAge("");
  }, [birthDate]);

  const openChangePassword = (user: User) => {
    setSelectedUser(user);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordDialog(true);
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !currentPassword.trim()) {
      alert("Por favor ingresa la contraseña actual");
      return;
    }
    if (!newPassword.trim() || newPassword !== confirmPassword) {
      alert("Las contraseñas nuevas no coinciden");
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
      await api.changePassword(selectedUser.id, currentPassword, newPassword, false);
      alert("Contraseña actualizada correctamente");
      setChangePasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSelectedUser(null);
      load();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Error al cambiar contraseña. Verifica que la contraseña actual sea correcta.");
    }
  };

  return (
    <Page>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Usuarios</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSuccessMessage(null);
              setShowForm(!showForm);
            }}
          >
            {showForm ? "Cancelar" : "Nuevo Usuario"}
          </Button>
        )}
      </Stack>

      {!isAdmin && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Solo los administradores pueden crear o modificar cuentas de usuario.
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Filtrar por rol</Typography>
        <Tabs value={roleFilter} onChange={(_, value) => setRoleFilter(value)}>
          <Tab label="Todos" value="todos" />
          <Tab label="Administradores" value="admin" />
          <Tab label="Doctores" value="doctor" />
          <Tab label="Enfermeras/os" value="nurse" />
          <Tab label="Recepción" value="reception" />
        </Tabs>
      </Paper>

      {isAdmin && showForm && (
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
              helperText={
                email.length > 0 && !validateEmail(email)
                  ? "Correo inválido"
                  : "Usa el correo institucional del usuario"
              }
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />
              }}
            />

            <TextField
              label="Rol *"
              select
              size="small"
              value={role}
              onChange={(e) => setRole(e.target.value as User["role"])}
              fullWidth
            >
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="doctor">Doctor/a</MenuItem>
              <MenuItem value="nurse">Enfermera/o</MenuItem>
              <MenuItem value="reception">Recepción</MenuItem>
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Edad"
                type="number"
                size="small"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                fullWidth
                inputProps={{ min: 0 }}
                disabled
                helperText="Se calcula automáticamente al elegir la fecha"
              />
              <TextField
                label="Fecha de nacimiento"
                type="date"
                size="small"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <TextField
              label="Contraseña *"
              type="password"
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              helperText="Comparte esta contraseña con el usuario asignado."
            />

            <Alert severity="warning">
              <Typography variant="body2" fontWeight={600}>Permisos del rol seleccionado:</Typography>
              <Typography variant="caption" component="div">
                {role === "admin" && "• Acceso completo al sistema."}
                {role === "doctor" && "• Gestión de pacientes y medicamentos, prescripciones."}
                {role === "nurse" && "• Registro de medicamentos y cuidados de pacientes."}
                {role === "reception" && "• Gestión de entradas/salidas y objetos personales."}
              </Typography>
            </Alert>

            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={resetForm} fullWidth>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateUser}
                disabled={
                  !name.trim() ||
                  !email.trim() ||
                  !validateEmail(email) ||
                  !password.trim()
                }
                fullWidth
              >
                Crear Usuario
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Typography variant="body2" color="text.secondary" mb={1}>
        Mostrando {filteredUsers.length} de {users.length} usuarios
      </Typography>

      <Table headers={["Nombre", "Correo", "Rol", "Edad", "Año nacimiento", "Fecha de creación", "Estado", "Acciones"]}>
        <AnimatePresence initial={false}>
          {filteredUsers.map(user => (
            <motion.tr
              key={user.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <td style={{ padding: 8, fontWeight: 600 }}>{user.name}</td>
              <td style={{ padding: 8, fontSize: 12 }}>{user.email}</td>
              <td style={{ padding: 8 }}>
                <Chip
                  label={ROLE_LABELS[user.role] || user.role}
                  color={ROLE_COLORS[user.role] || "default"}
                  size="small"
                />
              </td>
              <td style={{ padding: 8 }}>{user.age ?? "-"}</td>
              <td style={{ padding: 8 }}>
                {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : "-"}
              </td>
              <td style={{ padding: 8, fontSize: 12 }}>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
              </td>
              <td style={{ padding: 8 }}>
                {user.passwordChangeRequired ? (
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
                {isAdmin ? (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={() => openChangePassword(user)}
                    >
                      Cambiar contraseña
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteUser(user)}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Solo administradores
                  </Typography>
                )}
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </Table>

      {filteredUsers.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No se encontraron usuarios.
        </Alert>
      )}

      <Dialog
        open={changePasswordDialog}
        onClose={() => {
          setChangePasswordDialog(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cambiar contraseña</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Usuario: <strong>{selectedUser?.name}</strong>
            </Alert>
            <TextField
              label="Contraseña actual *"
              type="password"
              size="small"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              helperText="Ingresa la contraseña actual para confirmar"
            />
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
              label="Confirmar nueva contraseña *"
              type="password"
              size="small"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              error={confirmPassword.length > 0 && newPassword !== confirmPassword}
              helperText={
                confirmPassword.length > 0 && newPassword !== confirmPassword
                  ? "Las contraseñas no coinciden"
                  : ""
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setChangePasswordDialog(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={
              !currentPassword.trim() ||
              !newPassword.trim() ||
              newPassword !== confirmPassword ||
              newPassword.length < 8 ||
              currentPassword === newPassword
            }
          >
            Cambiar Contraseña
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
          setDeletePassword("");
          setSelectedUser(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar usuario</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de <strong>{selectedUser?.name}</strong>.
            </Alert>
            <TextField
              label="Contraseña del usuario *"
              type="password"
              size="small"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              fullWidth
              helperText="Ingresa la contraseña del usuario para confirmar la eliminación"
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialog(false);
            setDeletePassword("");
            setSelectedUser(null);
          }}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteUser}
            disabled={!deletePassword.trim()}
          >
            Eliminar Usuario
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}

