import { useEffect, useMemo, useState, ReactNode } from "react";
import {
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  Chip,
  Alert,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  PersonOff as PersonOffIcon,
  RestoreFromTrash as RestoreIcon,
  Badge as BadgeIcon,
  ContactPhone as ContactIcon,
  Inventory2 as InventoryIcon,
  MedicationLiquid as MedicationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import Page from "../components/Page";
import { Table } from "../components/Table";
import { api } from "../api/client";
import { Patient, Contact, PatientMedication, PersonalObject, User } from "../types";
import { useAuth } from "../contexts/AuthContext";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";

type StatusTab = "activo" | "baja" | "todos";
type FilterType = "az" | "edad_mayor" | "edad_menor" | "id" | "fecha_ingreso_mayor" | "fecha_ingreso_menor";

const STATUS_TABS: { label: string; value: StatusTab }[] = [
  { label: "Activos", value: "activo" },
  { label: "Bajas", value: "baja" },
  { label: "Todos", value: "todos" }
];

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: "A-Z (por abecedario)", value: "az" },
  { label: "Edad (De mayor a menor)", value: "edad_mayor" },
  { label: "Edad (De menor a mayor)", value: "edad_menor" },
  { label: "Por ID/Clave", value: "id" },
  { label: "Fecha de ingreso (De mayor a menor)", value: "fecha_ingreso_mayor" },
  { label: "Fecha de ingreso (De menor a mayor)", value: "fecha_ingreso_menor" }
];

export default function PatientsPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<Patient[]>([]);
  const [filteredItems, setFilteredItems] = useState<Patient[]>([]);

  const [statusFilter, setStatusFilter] = useState<StatusTab>("activo");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("az");

  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [curp, setCurp] = useState("");
  const [rfc, setRfc] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [nurseId, setNurseId] = useState("");
  const [doctors, setDoctors] = useState<User[]>([]);
  const [nurses, setNurses] = useState<User[]>([]);

  const [contacts, setContacts] = useState<Omit<Contact, "id" | "patientId">[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRelation, setContactRelation] = useState("");
  const [contactRfc, setContactRfc] = useState("");
  const [contactAge, setContactAge] = useState("");
  const [contactAddress, setContactAddress] = useState("");

  const [dischargeDialog, setDischargeDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dischargeReason, setDischargeReason] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [detailMedications, setDetailMedications] = useState<PatientMedication[]>([]);
  const [detailObjects, setDetailObjects] = useState<PersonalObject[]>([]);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    patient: Patient | null;
  } | null>(null);

  const InfoLine = ({ label, value }: { label: string; value?: ReactNode }) => (
    <Typography variant="body2">
      <Box component="span" fontWeight={600} mr={0.5}>{label}:</Box>
      {value ?? "-"}
    </Typography>
  );

  const DetailSection = ({
    title,
    icon,
    subtitle,
    children
  }: {
    title: string;
    icon: ReactNode;
    subtitle?: string;
    children: ReactNode;
  }) => (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              p: 0.75,
              borderRadius: 1,
              bgcolor: "primary.light",
              color: "primary.main",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {children}
      </Stack>
    </Paper>
  );

  const calculateAge = (birthDateStr?: string): number | undefined => {
    if (!birthDateStr) return undefined;
    const birth = new Date(birthDateStr);
    if (Number.isNaN(birth.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
  };

  // Función para buscar pacientes (independiente del filtro)
  const searchPatients = useMemo(
    () => (data: Patient[], query: string): Patient[] => {
      if (!query.trim()) return data;
      const q = query.toLowerCase().trim();
      return data.filter(p => {
        // Buscar por ID
        if (p.id.toLowerCase().includes(q)) return true;
        // Buscar por nombre
        if (p.name.toLowerCase().includes(q)) return true;
        // Buscar por CURP
        if (p.curp?.toLowerCase().includes(q)) return true;
        // Buscar por contactos (nombre, teléfono)
        if (p.contacts.some(
              c =>
                c.name.toLowerCase().includes(q) ||
            c.phone.includes(q)
        )) return true;
        return false;
      });
    },
    []
  );

  // Función para ordenar/filtrar pacientes
  const sortPatients = useMemo(
    () => (data: Patient[], type: FilterType): Patient[] => {
      const sorted = [...data];
      
      switch (type) {
        case "az":
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case "edad_mayor":
          return sorted.sort((a, b) => {
            const ageA = a.age ?? 0;
            const ageB = b.age ?? 0;
            return ageB - ageA; // Mayor a menor
          });
        case "edad_menor":
          return sorted.sort((a, b) => {
            const ageA = a.age ?? 0;
            const ageB = b.age ?? 0;
            return ageA - ageB; // Menor a mayor
          });
        case "id":
          return sorted.sort((a, b) => {
            // Intentar ordenar numéricamente si ambos son números
            const numA = parseInt(a.id, 10);
            const numB = parseInt(b.id, 10);
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            return a.id.localeCompare(b.id);
          });
        case "fecha_ingreso_mayor":
          return sorted.sort((a, b) => {
            const dateA = a.admissionDate ? new Date(a.admissionDate).getTime() : 0;
            const dateB = b.admissionDate ? new Date(b.admissionDate).getTime() : 0;
            return dateB - dateA; // Más reciente primero
          });
        case "fecha_ingreso_menor":
          return sorted.sort((a, b) => {
            const dateA = a.admissionDate ? new Date(a.admissionDate).getTime() : 0;
            const dateB = b.admissionDate ? new Date(b.admissionDate).getTime() : 0;
            return dateA - dateB; // Más antiguo primero
          });
          default:
          return sorted;
        }
    },
    []
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listPatients({
        status: statusFilter === "todos" ? undefined : statusFilter,
        userId: user?.id,
        userRole: user?.role
      });
      const normalized = data.map(p => ({
        ...p,
        age: p.age ?? calculateAge(p.birthDate),
        contacts: p.contacts || []
      }));
      setItems(normalized);
      
      // Aplicar búsqueda primero (si hay query)
      let filtered = searchQuery.trim() 
        ? searchPatients(normalized, searchQuery)
        : normalized;
      
      // Aplicar ordenamiento/filtro
      filtered = sortPatients(filtered, filterType);
      
      setFilteredItems(filtered);
    } catch (error: any) {
      console.error("Error al cargar pacientes:", error);
      const errorMessage = error?.message || "Error desconocido al cargar los pacientes";
      setError(`Error al cargar los pacientes: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (showForm) {
      loadDoctorsAndNurses();
    }
  }, [showForm]);

  useEffect(() => {
    // Aplicar búsqueda primero (si hay query)
    let filtered = searchQuery.trim() 
      ? searchPatients(items, searchQuery)
      : items;
    
    // Aplicar ordenamiento/filtro
    filtered = sortPatients(filtered, filterType);
    
    setFilteredItems(filtered);
  }, [items, searchQuery, filterType, searchPatients, sortPatients]);

  const resetForm = () => {
    setName("");
    setBirthDate("");
    setBirthPlace("");
    setCurp("");
    setRfc("");
    setAdmissionDate("");
    setAddress("");
    setNotes("");
    setDoctorId("");
    setNurseId("");
    setContacts([]);
    setContactName("");
    setContactPhone("");
    setContactRelation("");
    setContactRfc("");
    setContactAge("");
    setContactAddress("");
    setShowForm(false);
    setEditingPatient(null);
  };

  const openEditForm = (patient: Patient) => {
    setEditingPatient(patient);
    setName(patient.name);
    setBirthDate(patient.birthDate ? patient.birthDate.split('T')[0] : "");
    setBirthPlace(patient.birthPlace || "");
    setCurp(patient.curp || "");
    setRfc(patient.rfc || "");
    setAdmissionDate(patient.admissionDate ? patient.admissionDate.split('T')[0] : "");
    setAddress(patient.address || "");
    setNotes(patient.notes || "");
    setDoctorId(patient.doctorId || "");
    setNurseId(patient.nurseId || "");
    setContacts(patient.contacts.map(c => ({
      name: c.name,
      phone: c.phone,
      relation: c.relation,
      rfc: c.rfc,
      age: c.age,
      address: c.address
    })));
    setShowForm(true);
  };

  const loadDoctorsAndNurses = async () => {
    try {
      const [doctorsData, nursesData] = await Promise.all([
        api.listDoctors(),
        api.listNurses()
      ]);
      setDoctors(doctorsData);
      setNurses(nursesData);
    } catch (error) {
      console.error("Error al cargar doctores y enfermeros:", error);
    }
  };

  const addContact = () => {
    if (!contactName.trim() || !contactPhone.trim() || !contactRelation.trim()) {
      alert("Completa todos los campos del contacto");
      return;
    }
    const trimmedAge = contactAge.trim();
    const parsedAge = trimmedAge ? Number(trimmedAge) : undefined;
    if (trimmedAge && (Number.isNaN(parsedAge) || (parsedAge ?? 0) < 0)) {
      alert("La edad del contacto debe ser un número válido");
      return;
    }
    setContacts(prev => [
      ...prev,
      {
        name: contactName.trim(),
        phone: contactPhone.trim(),
        relation: contactRelation.trim(),
        rfc: contactRfc.trim() || undefined,
        age: parsedAge,
        address: contactAddress.trim() || undefined
      }
    ]);
    setContactName("");
    setContactPhone("");
    setContactRelation("");
    setContactRfc("");
    setContactAge("");
    setContactAddress("");
  };

  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPatient = async () => {
    if (!name.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    // Validar que tenga al menos un contacto
    if (contacts.length === 0) {
      const confirmContinue = window.confirm(
        "⚠️ ADVERTENCIA: No has agregado ningún contacto al paciente.\n\n" +
        "Es recomendable agregar al menos un contacto de emergencia.\n\n" +
        "¿Deseas continuar sin agregar un contacto?"
      );
      if (!confirmContinue) {
        return;
      }
    }

    // Mostrar mensaje si es enfermero (solo al crear, no al editar)
    if (user?.role === "nurse" && !editingPatient) {
      alert("Se le asignará un doctor y enfermero en un momento.");
    }

    try {
      await api.addPatient({
        name: name.trim(),
        birthDate: birthDate || undefined,
        age: birthDate ? calculateAge(birthDate) : undefined,
        birthPlace: birthPlace.trim() || undefined,
        curp: curp.trim() || undefined,
        rfc: rfc.trim() || undefined,
        admissionDate: admissionDate
          ? new Date(admissionDate).toISOString()
          : new Date().toISOString(),
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        contacts: contacts as Contact[],
        userId: user?.id,
        userRole: user?.role,
        doctorId: doctorId || undefined,
        nurseId: nurseId || undefined
      });

      resetForm();
      load();
    } catch (error) {
      console.error(error);
      alert("Error al agregar paciente");
    }
  };

  const handleUpdatePatient = async () => {
    if (!editingPatient || !name.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    // Validar que tenga al menos un contacto
    if (contacts.length === 0) {
      const confirmContinue = window.confirm(
        "⚠️ ADVERTENCIA: El paciente no tiene ningún contacto agregado.\n\n" +
        "Es recomendable agregar al menos un contacto de emergencia.\n\n" +
        "¿Deseas continuar sin agregar un contacto?"
      );
      if (!confirmContinue) {
        return;
      }
    }

    try {
      await api.updatePatient(editingPatient.id, {
        name: name.trim(),
        birthDate: birthDate || undefined,
        age: birthDate ? calculateAge(birthDate) : undefined,
        birthPlace: birthPlace.trim() || undefined,
        curp: curp.trim() || undefined,
        rfc: rfc.trim() || undefined,
        admissionDate: admissionDate
          ? new Date(admissionDate).toISOString()
          : undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        contacts: contacts as Contact[],
        userId: user?.id,
        doctorId: doctorId || undefined,
        nurseId: nurseId || undefined
      });

      resetForm();
      load();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar paciente");
    }
  };

  const openDischargeDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setDischargeReason("");
    setDischargeDialog(true);
  };

  const handleDischarge = async () => {
    if (!selectedPatient || !dischargeReason.trim()) {
      alert("Ingresa el motivo de baja");
      return;
    }
    try {
      await api.dischargePatient(selectedPatient.id, dischargeReason.trim(), user?.id);
      setDischargeDialog(false);
      load();
    } catch (error) {
      console.error(error);
      alert("Error al dar de baja");
    }
  };

  const handleReactivate = async (patientId: string) => {
    if (!window.confirm("¿Reactivar este paciente?")) return;
    try {
      await api.reactivatePatient(patientId, user?.id);
      load();
    } catch (error) {
      console.error(error);
      alert("Error al reactivar paciente");
    }
  };

  const openDeleteDialog = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    
    setDeleteLoading(true);
    try {
      await api.deletePatient(patientToDelete.id, user?.id, user?.name);
      setDeleteDialog(false);
      setPatientToDelete(null);
      load();
      alert("Paciente eliminado correctamente. Puede restaurarse desde la base de datos si es necesario.");
    } catch (error) {
      console.error(error);
      alert("Error al eliminar paciente");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openPatientDetails = async (patientId: string) => {
    setDetailDialog(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailPatient(null);
    setDetailMedications([]);
    setDetailObjects([]);
    try {
      const [patientData, medicationsData, objectsData] = await Promise.all([
        api.getPatient(patientId),
        api.getPatientMedications(patientId),
        api.listObjects(patientId)
      ]);
      setDetailPatient({
        ...patientData,
        age: patientData.age ?? calculateAge(patientData.birthDate),
        contacts: patientData.contacts || []
      });
      setDetailMedications(medicationsData);
      setDetailObjects(objectsData ?? []);
    } catch (error) {
      console.error(error);
      setDetailError("Error al cargar los detalles del paciente");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailDialog = () => {
    setDetailDialog(false);
    setDetailPatient(null);
    setDetailMedications([]);
    setDetailObjects([]);
    setDetailError(null);
  };

  const handleRowClick = (event: React.MouseEvent, patient: Patient) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            patient
          }
        : null
    );
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuAction = (action: string, patient: Patient) => {
    handleContextMenuClose();
    
    switch (action) {
      case 'view':
        openPatientDetails(patient.id);
        break;
      case 'edit':
        openEditForm(patient);
        break;
      case 'discharge':
        if (patient.status === 'activo') {
          openDischargeDialog(patient);
        }
        break;
      case 'delete':
        if (user?.role === 'admin' && patient.status === 'activo') {
          openDeleteDialog(patient);
        }
        break;
      case 'reactivate':
        if (patient.status === 'baja') {
          handleReactivate(patient.id);
        }
        break;
    }
  };

  return (
    <Page>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Pacientes</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "Nuevo Paciente"}
        </Button>
      </Stack>

      <Alert severity="info" icon={<BadgeIcon />} sx={{ mb: 2 }}>
        <Typography variant="body2" component="span">
          <strong>Para modificar, eliminar, ver detalles o dar de baja:</strong> Haz clic en la tabla sobre el paciente para abrir el menú de opciones.
        </Typography>
      </Alert>

      <Alert severity="info" icon={<BadgeIcon />} sx={{ mb: 2 }}>
        Registra pacientes con su información completa (CURP, RFC, contactos) para un mejor seguimiento.
      </Alert>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Filtrar por estado</Typography>
        <Tabs
          value={statusFilter}
          onChange={(_, value) => setStatusFilter(value)}
          sx={{ mb: 2 }}
        >
          {STATUS_TABS.map(tab => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </Tabs>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Filtrar por:</Typography>
          <TextField
            select
            size="small"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            sx={{ minWidth: 250 }}
          >
            {FILTER_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Buscar:</Typography>
          <TextField
            placeholder="Buscar por ID, nombre, CURP o contacto..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
            }}
          />
        </Stack>
      </Paper>

      {showForm && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Nuevo Paciente</Typography>
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="primary">Datos del Paciente</Typography>

            <TextField
              label="Nombre completo *"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Fecha de nacimiento"
                type="date"
                size="small"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Edad"
                size="small"
                value={birthDate ? calculateAge(birthDate) ?? "" : ""}
                disabled
                fullWidth
              />
            </Stack>

            <TextField
              label="Lugar de nacimiento"
              size="small"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              fullWidth
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="CURP"
                size="small"
                value={curp}
                onChange={(e) => setCurp(e.target.value.toUpperCase())}
                inputProps={{ maxLength: 18 }}
                fullWidth
              />
              <TextField
                label="RFC"
                size="small"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                inputProps={{ maxLength: 13 }}
                fullWidth
              />
            </Stack>

            <TextField
              label="Fecha de ingreso"
              type="date"
              size="small"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              helperText="Si se deja vacío, se toma la fecha actual"
            />

            <TextField
              label="Domicilio"
              size="small"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="Notas"
              size="small"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
              Asignación de Personal
            </Typography>

            {user?.role === "admin" && (
              <TextField
                select
                label="Doctor asignado"
                size="small"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                fullWidth
              >
                <MenuItem value="">
                  <em>Seleccionar doctor</em>
                </MenuItem>
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.name} (Doctor)
                  </MenuItem>
                ))}
              </TextField>
            )}

            {(user?.role === "admin" || user?.role === "doctor") && (
              <TextField
                select
                label="Enfermero/a asignado"
                size="small"
                value={nurseId}
                onChange={(e) => setNurseId(e.target.value)}
                fullWidth
              >
                <MenuItem value="">
                  <em>Seleccionar enfermero/a</em>
                </MenuItem>
                {nurses.map((nurse) => (
                  <MenuItem key={nurse.id} value={nurse.id}>
                    {nurse.name} (Enfermero/a)
                  </MenuItem>
                ))}
              </TextField>
            )}

            {user?.role === "doctor" && (
              <Alert severity="info" sx={{ mt: 1 }}>
                El paciente será asignado automáticamente a ti como doctor.
              </Alert>
            )}

            <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
              Contactos / Familiares
            </Typography>

            {contacts.length > 0 && (
              <Stack spacing={1}>
                {contacts.map((c, index) => (
                  <Paper key={index} sx={{ p: 1.5, bgcolor: "#f5f5f5" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.relation} • {c.phone}
                          {(() => {
                            const extras = [
                              c.rfc ? `RFC: ${c.rfc}` : null,
                              typeof c.age === "number" ? `Edad: ${c.age}` : null,
                              c.address ? `Domicilio: ${c.address}` : null
                            ].filter(Boolean) as string[];
                            return extras.length ? ` • ${extras.join(" • ")}` : "";
                          })()}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => {
                            // Cargar los datos del contacto en los campos para editar
                            setContactName(c.name);
                            setContactPhone(c.phone);
                            setContactRelation(c.relation);
                            setContactRfc(c.rfc || "");
                            setContactAge(c.age ? String(c.age) : "");
                            setContactAddress(c.address || "");
                            // Eliminar el contacto de la lista (se agregará de nuevo con los cambios)
                            removeContact(index);
                          }}
                        >
                          Editar
                        </Button>
                      <Button size="small" color="error" onClick={() => removeContact(index)}>
                        Eliminar
                      </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}

            <Paper sx={{ p: 2, bgcolor: "#fff3e6", border: "1px solid #f97316" }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Agregar Contacto
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  label="Nombre del contacto"
                  size="small"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  fullWidth
                />
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Teléfono"
                    size="small"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Relación"
                    size="small"
                    value={contactRelation}
                    onChange={(e) => setContactRelation(e.target.value)}
                    placeholder="Hijo, esposa, etc."
                    fullWidth
                  />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Edad (opcional)"
                    size="small"
                    value={contactAge}
                    onChange={(e) => setContactAge(e.target.value)}
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0 }}
                    fullWidth
                  />
                  <TextField
                    label="Domicilio del contacto (opcional)"
                    size="small"
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    fullWidth
                  />
                </Stack>
                <TextField
                  label="RFC del contacto (opcional)"
                  size="small"
                  value={contactRfc}
                  onChange={(e) => setContactRfc(e.target.value.toUpperCase())}
                  inputProps={{ maxLength: 13 }}
                  fullWidth
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={addContact}
                  disabled={!contactName.trim() || !contactPhone.trim() || !contactRelation.trim()}
                  sx={{
                    bgcolor: "#f97316",
                    color: "#000",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: "#ea580c",
                    },
                    "&:disabled": {
                      bgcolor: "#fbbf24",
                      color: "#000",
                      opacity: 0.6
                    }
                  }}
                >
                  Agregar Contacto
                </Button>
              </Stack>
            </Paper>

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={resetForm} fullWidth>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={editingPatient ? handleUpdatePatient : handleAddPatient}
                disabled={!name.trim()}
                fullWidth
              >
                {editingPatient ? "Actualizar Paciente" : "Guardar Paciente"}
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
        {loading ? "Cargando..." : `Mostrando ${filteredItems.length} de ${items.length} pacientes`}
      </Typography>

      {loading && items.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Cargando pacientes, por favor espere...
        </Alert>
      ) : (
        <Table headers={["ID", "Nombre", "Edad", "CURP", "RFC", "Contactos", "Fecha Ingreso", "Estado"]}>
        <AnimatePresence initial={false}>
          {filteredItems.map(patient => (
            <motion.tr
              key={patient.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => handleRowClick(e, patient)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRowClick(e, patient);
              }}
              style={{ 
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
              }}
            >
              <td style={{ padding: 8, fontSize: 11, fontFamily: "monospace" }}>
                {patient.id}
              </td>
              <td style={{ padding: 8, fontWeight: 600 }}>{patient.name}</td>
              <td style={{ padding: 8 }}>{patient.age ?? "-"}</td>
              <td style={{ padding: 8, fontSize: 11 }}>{patient.curp || "-"}</td>
              <td style={{ padding: 8, fontSize: 11 }}>{patient.rfc || "-"}</td>
              <td style={{ padding: 8 }}>
                {patient.contacts.length > 0 ? (
                  <Stack spacing={0.5}>
                    {patient.contacts.map((c, index) => (
                      <Typography key={index} variant="caption" display="block">
                        {c.name} ({c.relation})
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Sin contactos
                  </Typography>
                )}
              </td>
              <td style={{ padding: 8, fontSize: 12 }}>
                {patient.admissionDate ? new Date(patient.admissionDate).toLocaleDateString() : "-"}
              </td>
              <td style={{ padding: 8 }}>
                <Chip
                  label={patient.status === "activo" ? "Activo" : "Baja"}
                  color={patient.status === "activo" ? "success" : "error"}
                  size="small"
                />
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </Table>
      )}

      {!loading && filteredItems.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No se encontraron pacientes.
        </Alert>
      )}

      <Dialog
        open={detailDialog}
        onClose={closeDetailDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>Detalles del paciente</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={closeDetailDialog}
              sx={{
                minWidth: 100,
                fontWeight: 600,
                boxShadow: 2
              }}
            >
              Cerrar
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 4 }}>
              <CircularProgress size={28} />
              <Typography variant="body2" color="text.secondary">
                Cargando información...
              </Typography>
            </Stack>
          ) : detailError ? (
            <Alert severity="error">{detailError}</Alert>
          ) : detailPatient ? (
            <Stack spacing={2}>
              <DetailSection
                title="Datos generales"
                icon={<BadgeIcon fontSize="small" />}
              >
                <Stack spacing={1}>
                  <Typography variant="h6" fontWeight={700}>{detailPatient.name}</Typography>
                  <InfoLine
                    label="ID"
                    value={(
                      <Typography component="span" fontFamily="monospace">
                        {detailPatient.id}
                      </Typography>
                    )}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <InfoLine label="Fecha de nacimiento" value={formatDate(detailPatient.birthDate)} />
                    <InfoLine label="Edad" value={detailPatient.age ? `${detailPatient.age} años` : "-"} />
                  </Stack>
                  {detailPatient.birthPlace && (
                    <InfoLine label="Lugar de nacimiento" value={detailPatient.birthPlace} />
                  )}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <InfoLine label="CURP" value={detailPatient.curp || "-"} />
                    <InfoLine label="RFC" value={detailPatient.rfc || "-"} />
                  </Stack>
                  {detailPatient.address && (
                    <InfoLine label="Domicilio" value={detailPatient.address} />
                  )}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="center">
                    <InfoLine label="Ingreso" value={formatDate(detailPatient.admissionDate)} />
                    <InfoLine
                      label="Estado"
                      value={(
                        <Chip
                          size="small"
                          color={detailPatient.status === "activo" ? "success" : "default"}
                          label={detailPatient.status === "activo" ? "Activo" : "Baja"}
                        />
                      )}
                    />
                  </Stack>
                </Stack>
                {detailPatient.notes && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    {detailPatient.notes}
                  </Alert>
                )}
              </DetailSection>

              {(detailPatient.doctorName || detailPatient.nurseName) && (
                <DetailSection
                  title="Personal Asignado"
                  icon={<BadgeIcon fontSize="small" />}
                  subtitle="Doctor y enfermero a cargo del paciente"
                >
                  <Stack spacing={1}>
                    {detailPatient.doctorName && (
                      <InfoLine
                        label="Doctor"
                        value={`${detailPatient.doctorName} (Doctor)`}
                      />
                    )}
                    {detailPatient.nurseName && (
                      <InfoLine
                        label="Enfermero/a"
                        value={`${detailPatient.nurseName} (Enfermero/a)`}
                      />
                    )}
                    {!detailPatient.doctorName && !detailPatient.nurseName && (
                      <Typography variant="body2" color="text.secondary">
                        No hay personal asignado
                      </Typography>
                    )}
                  </Stack>
                </DetailSection>
              )}

              <DetailSection
                title="Contactos"
                icon={<ContactIcon fontSize="small" />}
                subtitle={detailPatient.contacts.length > 0 ? `${detailPatient.contacts.length} contacto(s)` : "Sin contactos registrados"}
              >
                {detailPatient.contacts.length > 0 ? (
                  <List
                    dense
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "background.paper",
                      "& .MuiListItemIcon-root": { minWidth: 32, color: "primary.main" },
                      "& .MuiListItem-root:not(:last-of-type)": {
                        borderBottom: "1px solid",
                        borderColor: "divider"
                      }
                    }}
                  >
                    {detailPatient.contacts.map(contact => {
                      const extras = [
                        contact.phone ? `Teléfono: ${contact.phone}` : null,
                        contact.rfc ? `RFC: ${contact.rfc}` : null,
                        typeof contact.age === "number" ? `Edad: ${contact.age}` : null,
                        contact.address ? `Domicilio: ${contact.address}` : null
                      ].filter(Boolean).join(" • ");
                      return (
                        <ListItem key={contact.id || `${contact.name}-${contact.phone}`} alignItems="flex-start">
                          <ListItemIcon>
                            <ContactIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={(
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography variant="body2" fontWeight={600}>
                                  {contact.name}
                                </Typography>
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  label={contact.relation}
                                />
                              </Stack>
                            )}
                            secondary={extras ? (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {extras}
                              </Typography>
                            ) : null}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay contactos registrados.
                  </Typography>
                )}
              </DetailSection>

              <DetailSection
                title="Medicamentos recetados"
                icon={<MedicationIcon fontSize="small" />}
                subtitle={detailMedications.length > 0 ? `${detailMedications.length} receta(s)` : "Sin medicamentos registrados"}
              >
                {detailMedications.length > 0 ? (
                  <List
                    dense
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "background.paper",
                      "& .MuiListItemIcon-root": { minWidth: 32, color: "primary.main" },
                      "& .MuiListItem-root:not(:last-of-type)": {
                        borderBottom: "1px solid",
                        borderColor: "divider"
                      }
                    }}
                  >
                    {detailMedications.map(med => (
                      <ListItem key={med.id} alignItems="flex-start">
                        <ListItemIcon>
                          <MedicationIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={(
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography variant="body2" fontWeight={600}>
                                {med.medicationName || "Medicamento"}
                              </Typography>
                              {med.cantidad && (
                                <Chip size="small" color="primary" label={`Cantidad: ${med.cantidad} ${med.medicationUnit || ""}`} />
                              )}
                              <Chip size="small" label={`Dosis: ${med.dosage}`} />
                              <Chip size="small" variant="outlined" label={med.frequency} />
                            </Stack>
                          )}
                          secondary={(
                            <Typography variant="caption" color="text.secondary" display="block">
                              Recetado: {formatDateTime(med.prescribedAt)}
                              {med.medicationDosage && ` • Dosis recomendada del medicamento: ${med.medicationDosage}`}
                            </Typography>
                          )}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    Este paciente no tiene medicamentos recetados.
                  </Alert>
                )}
              </DetailSection>

              <DetailSection
                title="Objetos personales"
                icon={<InventoryIcon fontSize="small" />}
                subtitle={detailObjects.length > 0 ? `${detailObjects.length} objeto(s)` : "Sin objetos registrados"}
              >
                {detailObjects.length > 0 ? (
                  <List
                    dense
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "background.paper",
                      "& .MuiListItemIcon-root": { minWidth: 32, color: "primary.main" },
                      "& .MuiListItem-root:not(:last-of-type)": {
                        borderBottom: "1px solid",
                        borderColor: "divider"
                      }
                    }}
                  >
                    {detailObjects.map(obj => (
                      <ListItem key={obj.id}>
                        <ListItemIcon>
                          <InventoryIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={(
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography variant="body2" fontWeight={600}>
                                {obj.name}
                              </Typography>
                              <Chip size="small" label={`Cantidad: ${obj.qty}`} />
                            </Stack>
                          )}
                          secondary={(
                            <Typography variant="caption" color="text.secondary" display="block">
                              Registrado: {formatDate(obj.receivedAt)}
                            </Typography>
                          )}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No hay objetos personales registrados.
                  </Typography>
                )}
              </DetailSection>
            </Stack>
          ) : (
            <Typography variant="body2">Selecciona un paciente para ver sus detalles.</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDeleteDialog
        open={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
          setPatientToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Paciente"
        itemName={patientToDelete?.name || ""}
        itemType="Paciente"
        warningMessage="Esta acción ocultará el paciente de todas las listas. El registro se mantendrá en la base de datos y puede restaurarse si es necesario."
        details={patientToDelete ? [
          { label: "ID", value: patientToDelete.id },
          { label: "Nombre", value: patientToDelete.name },
          { label: "CURP", value: patientToDelete.curp || "No registrado" },
          { label: "Estado actual", value: patientToDelete.status === "activo" ? "Activo" : "Baja" }
        ] : []}
        loading={deleteLoading}
      />

      {/* Menú contextual para acciones del paciente */}
      <Menu
        open={contextMenu !== null}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {contextMenu?.patient && (
          <>
            <MenuItem onClick={() => handleContextMenuAction('view', contextMenu.patient!)}>
              <ListItemIcon>
                <BadgeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Ver detalles</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleContextMenuAction('edit', contextMenu.patient!)}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Editar</ListItemText>
            </MenuItem>
            {contextMenu.patient.status === "activo" ? (
              <>
                <MenuItem onClick={() => handleContextMenuAction('discharge', contextMenu.patient!)}>
                  <ListItemIcon>
                    <PersonOffIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Dar de baja</ListItemText>
                </MenuItem>
                {user?.role === "admin" && (
                  <MenuItem onClick={() => handleContextMenuAction('delete', contextMenu.patient!)}>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Eliminar</ListItemText>
                  </MenuItem>
                )}
              </>
            ) : (
              <MenuItem onClick={() => handleContextMenuAction('reactivate', contextMenu.patient!)}>
                <ListItemIcon>
                  <RestoreIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Reactivar</ListItemText>
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      <Dialog
        open={dischargeDialog}
        onClose={() => setDischargeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Dar de baja paciente</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              Paciente: <strong>{selectedPatient?.name}</strong>
            </Alert>
            <TextField
              label="Motivo de baja *"
              multiline
              rows={4}
              size="small"
              value={dischargeReason}
              onChange={(e) => setDischargeReason(e.target.value)}
              fullWidth
              placeholder="Ej: Alta médica, traslado a otro centro, fallecimiento, etc."
            />
            <Alert severity="info">
              La fecha de baja se registrará automáticamente. El paciente podrá ser reactivado posteriormente si es necesario.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDischargeDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDischarge}
            disabled={!dischargeReason.trim()}
          >
            Confirmar Baja
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}



