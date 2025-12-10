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
  Tab,
  Checkbox,
  FormControlLabel,
  Divider,
  Box,
  Select,
  FormControl,
  InputLabel,
  InputAdornment
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
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
import { customRolesService, CustomRole, Permission } from "../services/customRolesService";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  doctor: "Doctor/a",
  nurse: "Enfermera/o",
  usuario: "Usuario",
  reception: "Recepción"
};

// Función para obtener el nombre del rol (incluyendo personalizados)
// Nota: Esta función se actualizará cuando se carguen los roles
const getRoleLabel = (role: string, customRoleId?: string, customRoles: CustomRole[] = []): string => {
  if (customRoleId) {
    const customRole = customRoles.find(cr => cr.id === customRoleId);
    return customRole ? customRole.nombre : role;
  }
  return ROLE_LABELS[role] || role;
};

const ROLE_COLORS: Record<User["role"], "primary" | "success" | "info" | "secondary" | "default"> = {
  admin: "primary",
  doctor: "success",
  nurse: "info",
  usuario: "default",
  reception: "secondary"
};

type RoleFilter = "todos" | User["role"] | string; // string para roles personalizados

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para roles personalizados
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);

  // Función para aplicar filtros (rol y búsqueda)
  const applyFilters = (userList: User[]) => {
    let filtered = userList;

    // Si hay búsqueda activa, buscar en TODOS los usuarios (ignorar filtro de rol)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        (user.email && user.email.toLowerCase().includes(query))
      );
    } 
    // Si NO hay búsqueda, aplicar el filtro de rol
    else if (roleFilter !== "todos") {
      // Verificar si es un rol personalizado
      const isCustomRole = customRoles.some(cr => cr.id === roleFilter);
      if (isCustomRole) {
        // Filtrar por usuarios que tienen este rol personalizado
        filtered = filtered.filter(user => user.customRoleId === roleFilter);
      } else {
        // Filtrar por rol predeterminado
        filtered = filtered.filter(user => user.role === roleFilter);
      }
    }
    // Si no hay búsqueda ni filtro de rol, mostrar todos

    setFilteredUsers(filtered);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Siempre cargar todos los usuarios primero, luego aplicar filtro
      // Usar noCache=true para evitar caché del navegador
      const allData = await api.listUsers(undefined, true);
      console.log("Usuarios cargados desde API:", allData.length, allData.map(u => ({ id: u.id, name: u.name })));
      
      // Actualizar estado directamente
      setUsers(allData);
      
      // Aplicar filtros después de cargar
      applyFilters(allData);
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error);
      const errorMessage = error?.message || "Error desconocido al cargar los usuarios";
      setError(`Error al cargar los usuarios: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para aplicar filtros cuando cambian (solo si ya hay usuarios cargados)
  useEffect(() => {
    if (users.length > 0) {
      applyFilters(users);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, searchQuery, customRoles]);

  useEffect(() => {
    load();
    // Cargar roles personalizados
    customRolesService.getAll().then(roles => setCustomRoles(roles));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Determinar si es un rol personalizado
    const isCustomRole = customRoles.some(cr => cr.id === role);
    const roleToSend = isCustomRole ? "usuario" : role; // Enviar "usuario" como base si es personalizado
    const customRoleId = isCustomRole ? role : undefined;

    try {
      const createdUser = await api.addUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: roleToSend,
        age: ageValue,
        birthDate: birthDateValue,
        password: password.trim(),
        customRoleId: customRoleId
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
      alert("Por favor ingresa la contraseña de administrador para confirmar la eliminación");
      return;
    }
    if (!currentUser?.email) {
      alert("Error: No se pudo obtener el email del administrador");
      return;
    }
    try {
      const deletedUserId = selectedUser.id;
      const deletedUserName = selectedUser.name;
      console.log("Eliminando usuario:", deletedUserName, deletedUserId);
      
      await api.deleteUser(selectedUser.id, deletePassword, currentUser.email);
      console.log("Usuario eliminado en backend. Recargando lista...");
      
      setDeleteDialog(false);
      setDeletePassword("");
      setSelectedUser(null);
      
      // Esperar un momento para asegurar que la BD se actualizó
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Recargar la lista sin caché
      const updatedUsers = await api.listUsers(undefined, true);
      console.log("Usuarios después de eliminar:", updatedUsers.length, updatedUsers.map(u => ({ id: u.id, name: u.name })));
      
      // Verificar que el usuario fue eliminado
      const stillExists = updatedUsers.some(u => u.id === deletedUserId);
      
      if (stillExists) {
        console.error("ERROR: El usuario aún aparece en la lista después de eliminarlo!");
        alert("Error: El usuario no se eliminó correctamente. Por favor recarga la página.");
      } else {
        console.log("✓ Usuario eliminado correctamente de la lista");
        // Actualizar estado directamente
        setUsers(updatedUsers);
        applyFilters(updatedUsers);
        alert("Usuario eliminado correctamente");
      }
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
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
          {/* Botón "Todos" */}
          <Button
            variant={roleFilter === "todos" ? "contained" : "outlined"}
            onClick={() => setRoleFilter("todos")}
            sx={{ minWidth: 100 }}
          >
            Todos
          </Button>

          {/* Selector "Filtrar por" */}
          <FormControl size="small" sx={{ minWidth: 200, flexGrow: { xs: 1, sm: 0 } }}>
            <InputLabel>Filtrar por</InputLabel>
            <Select
              value={roleFilter === "todos" ? "" : roleFilter}
              onChange={(e) => setRoleFilter(e.target.value || "todos")}
              label="Filtrar por"
            >
              <MenuItem value="">
                <em>Todos los roles</em>
              </MenuItem>
              <Divider />
              <Typography variant="caption" sx={{ px: 2, py: 0.5, color: "text.secondary" }}>
                Roles predeterminados
              </Typography>
              <MenuItem value="admin">Administradores</MenuItem>
              <MenuItem value="doctor">Doctores</MenuItem>
              <MenuItem value="nurse">Enfermeras/os</MenuItem>
              <MenuItem value="reception">Recepción</MenuItem>
              <MenuItem value="usuario">Usuario</MenuItem>
              {customRoles.length > 0 && (
                <>
                  <Divider />
                  <Typography variant="caption" sx={{ px: 2, py: 0.5, color: "text.secondary" }}>
                    Roles personalizados
                  </Typography>
                  {customRoles.map((customRole) => (
                    <MenuItem key={customRole.id} value={customRole.id}>
                      {customRole.nombre}
                    </MenuItem>
                  ))}
                </>
              )}
            </Select>
          </FormControl>

          {/* Buscador por nombre o correo */}
          <TextField
            size="small"
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, maxWidth: { xs: "100%", sm: 300 } }}
          />
        </Stack>
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
              onChange={(e) => {
                const value = e.target.value;
                if (value === "__add_custom_role__") {
                  setShowCreateRoleDialog(true);
                } else {
                  setRole(value as User["role"]);
                }
              }}
              fullWidth
            >
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="doctor">Doctor/a</MenuItem>
              <MenuItem value="nurse">Enfermera/o</MenuItem>
              <MenuItem value="reception">Recepción</MenuItem>
              {customRoles.length > 0 && <Divider />}
              {customRoles.map((customRole) => (
                <MenuItem key={customRole.id} value={customRole.id}>
                  {customRole.nombre}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem value="__add_custom_role__" sx={{ fontStyle: "italic", color: "primary.main" }}>
                + Añadir rol
              </MenuItem>
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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" mb={1}>
        {loading ? "Cargando..." : `Mostrando ${filteredUsers.length} de ${users.length} usuarios`}
      </Typography>

      {loading && users.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Cargando usuarios, por favor espere...
        </Alert>
      ) : (
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
                  label={getRoleLabel(user.role, user.customRoleId, customRoles)}
                  color={(ROLE_COLORS[user.role as keyof typeof ROLE_COLORS] || "default") as any}
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
      )}

      {!loading && filteredUsers.length === 0 && (
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
              autoFocus
              helperText="Ingresa la contraseña actual para confirmar"
            />
            <TextField
              label="Nueva contraseña *"
              type="password"
              size="small"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              error={newPassword.length > 0 && newPassword.length < 8}
              helperText={
                newPassword.length > 0 && newPassword.length < 8
                  ? "La contraseña debe tener al menos 8 caracteres"
                  : "Mínimo 8 caracteres"
              }
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
                  : confirmPassword.length > 0 && newPassword === confirmPassword && newPassword.length >= 8
                  ? "✓ Las contraseñas coinciden"
                  : ""
              }
            />
            {currentPassword && newPassword && currentPassword === newPassword && (
              <Alert severity="warning">
                La nueva contraseña debe ser diferente a la contraseña actual
              </Alert>
            )}
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
              currentPassword.trim() === newPassword.trim()
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
            <Alert severity="info">
              Se necesita un administrador para esto
            </Alert>
            <TextField
              label="Contraseña de administrador *"
              type="password"
              size="small"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              fullWidth
              helperText="Ingresa la contraseña de administrador para confirmar la eliminación"
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

      {/* Diálogo para crear rol personalizado */}
      <Dialog
        open={showCreateRoleDialog}
        onClose={() => {
          setShowCreateRoleDialog(false);
          setNewRoleName("");
          setSelectedPermissions([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crear nuevo rol personalizado</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nombre del rol *"
              size="small"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              fullWidth
              placeholder="Ej: Supervisor, Auxiliar, etc."
            />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Permisos a seleccionar para "{newRoleName || "nuevo rol"}":
              </Typography>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedPermissions.includes("pacientes")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, "pacientes"]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== "pacientes"));
                        }
                      }}
                    />
                  }
                  label="Pacientes"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedPermissions.includes("medicamentos")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, "medicamentos"]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== "medicamentos"));
                        }
                      }}
                    />
                  }
                  label="Medicamentos"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedPermissions.includes("control_es")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, "control_es"]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== "control_es"));
                        }
                      }}
                    />
                  }
                  label="Control E/S"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedPermissions.includes("objetos")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, "objetos"]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== "objetos"));
                        }
                      }}
                    />
                  }
                  label="Objetos"
                />
              </Stack>
            </Box>

            {selectedPermissions.length === 0 && (
              <Alert severity="warning">
                Selecciona al menos un permiso para el rol.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowCreateRoleDialog(false);
              setNewRoleName("");
              setSelectedPermissions([]);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!newRoleName.trim() || selectedPermissions.length === 0) {
                alert("Completa el nombre del rol y selecciona al menos un permiso");
                return;
              }
              try {
                const newRole = await customRolesService.create(newRoleName.trim(), selectedPermissions);
                const updatedRoles = await customRolesService.getAll();
                setCustomRoles(updatedRoles);
                setRole(newRole.id); // Seleccionar el nuevo rol automáticamente
                setShowCreateRoleDialog(false);
                setNewRoleName("");
                setSelectedPermissions([]);
                alert(`Rol "${newRole.nombre}" creado exitosamente`);
              } catch (error: any) {
                alert(error?.message || "Error al crear el rol");
              }
            }}
            disabled={!newRoleName.trim() || selectedPermissions.length === 0}
          >
            Guardar Rol
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}

