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
  MedicationLiquid as MedicationIcon
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import Page from "../components/Page";
import { Table } from "../components/Table";
import { api } from "../api/client";
import { Patient, Contact, PatientMedication, PersonalObject } from "../types";
import { useAuth } from "../contexts/AuthContext";

type StatusTab = "activo" | "baja" | "todos";
type SearchType = "nombre" | "id" | "contacto" | "curp" | "rfc";

const STATUS_TABS: { label: string; value: StatusTab }[] = [
  { label: "Activos", value: "activo" },
  { label: "Bajas", value: "baja" },
  { label: "Todos", value: "todos" }
];

const SEARCH_OPTIONS: { label: string; value: SearchType }[] = [
  { label: "Por nombre", value: "nombre" },
  { label: "Por ID/Clave", value: "id" },
  { label: "Por contacto", value: "contacto" },
  { label: "Por CURP", value: "curp" },
  { label: "Por RFC", value: "rfc" }
];

export default function PatientsPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<Patient[]>([]);
  const [filteredItems, setFilteredItems] = useState<Patient[]>([]);

  const [statusFilter, setStatusFilter] = useState<StatusTab>("activo");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("nombre");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [curp, setCurp] = useState("");
  const [rfc, setRfc] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

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
  const [detailDialog, setDetailDialog] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [detailMedications, setDetailMedications] = useState<PatientMedication[]>([]);
  const [detailObjects, setDetailObjects] = useState<PersonalObject[]>([]);
  const [detailError, setDetailError] = useState<string | null>(null);

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

  const filterPatients = useMemo(
    () => (data: Patient[], query: string, type: SearchType): Patient[] => {
      if (!query.trim()) return data;
      const q = query.toLowerCase().trim();
      return data.filter(p => {
        switch (type) {
          case "nombre":
            return p.name.toLowerCase().includes(q);
          case "id":
            return p.id.toLowerCase().includes(q);
          case "contacto":
            return p.contacts.some(
              c =>
                c.name.toLowerCase().includes(q) ||
                c.phone.includes(q) ||
                (c.rfc && c.rfc.toLowerCase().includes(q))
            );
          case "curp":
            return p.curp?.toLowerCase().includes(q) ?? false;
          case "rfc":
            return (
              p.rfc?.toLowerCase().includes(q) ||
              p.contacts.some(c => c.rfc?.toLowerCase().includes(q))
            ) ?? false;
          default:
            return true;
        }
      });
    },
    []
  );

  const load = async () => {
    try {
      const data = await api.listPatients({
        status: statusFilter === "todos" ? undefined : statusFilter
      });
      const normalized = data.map(p => ({
        ...p,
        age: p.age ?? calculateAge(p.birthDate),
        contacts: p.contacts || []
      }));
      setItems(normalized);
      setFilteredItems(filterPatients(normalized, searchQuery, searchType));
    } catch (error) {
      console.error(error);
      alert("Error al cargar pacientes");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    setFilteredItems(filterPatients(items, searchQuery, searchType));
  }, [items, searchQuery, searchType, filterPatients]);

  const resetForm = () => {
    setName("");
    setBirthDate("");
    setBirthPlace("");
    setCurp("");
    setRfc("");
    setAdmissionDate("");
    setAddress("");
    setNotes("");
    setContacts([]);
    setContactName("");
    setContactPhone("");
    setContactRelation("");
    setContactRfc("");
    setContactAge("");
    setContactAddress("");
    setShowForm(false);
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
        userId: user?.id
      });

      resetForm();
      load();
    } catch (error) {
      console.error(error);
      alert("Error al agregar paciente");
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

        <Typography variant="subtitle2" gutterBottom>Buscar paciente</Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            select
            size="small"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as SearchType)}
            sx={{ minWidth: 160 }}
          >
            {SEARCH_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>

          <TextField
            placeholder={`Buscar ${searchType}...`}
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
                      <Button size="small" color="error" onClick={() => removeContact(index)}>
                        Eliminar
                      </Button>
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
                  variant="outlined"
                  size="small"
                  onClick={addContact}
                  disabled={!contactName.trim() || !contactPhone.trim() || !contactRelation.trim()}
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
                onClick={handleAddPatient}
                disabled={!name.trim()}
                fullWidth
              >
                Guardar Paciente
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Typography variant="body2" color="text.secondary" mb={1}>
        Mostrando {filteredItems.length} de {items.length} pacientes
      </Typography>

      <Table headers={["ID", "Nombre", "Edad", "CURP", "RFC", "Contactos", "Fecha Ingreso", "Estado", "Acciones"]}>
        <AnimatePresence initial={false}>
          {filteredItems.map(patient => (
            <motion.tr
              key={patient.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <td style={{ padding: 8, fontSize: 11, fontFamily: "monospace" }}>
                {patient.id.slice(0, 8)}
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
              <td style={{ padding: 8 }}>
                <Stack spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => openPatientDetails(patient.id)}
                  >
                    Ver detalles
                  </Button>
                  {patient.status === "activo" ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<PersonOffIcon />}
                      onClick={() => openDischargeDialog(patient)}
                    >
                      Dar de baja
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<RestoreIcon />}
                      onClick={() => handleReactivate(patient.id)}
                    >
                      Reactivar
                    </Button>
                  )}
                </Stack>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </Table>

      {filteredItems.length === 0 && (
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
        <DialogTitle>Detalles del paciente</DialogTitle>
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
        <DialogActions>
          <Button onClick={closeDetailDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

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



