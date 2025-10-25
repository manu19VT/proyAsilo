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
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  PersonOff as PersonOffIcon,
  RestoreFromTrash as RestoreIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import Page from "../components/Page";
import { Table } from "../components/Table";
import { api } from "../api/mock";
import { Patient, Contact } from "../types";

export default function PatientsPage() {
  const [items, setItems] = useState<Patient[]>([]);
  const [filteredItems, setFilteredItems] = useState<Patient[]>([]);
  
  // Filtros y búsquedas
  const [statusFilter, setStatusFilter] = useState<string>("activo");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"nombre" | "id" | "contacto" | "curp" | "rfc">("nombre");
  
  // Formulario
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [curp, setCurp] = useState("");
  const [rfc, setRfc] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");
  const [notes, setNotes] = useState("");
  
  // Contactos
  const [contacts, setContacts] = useState<Omit<Contact, "id" | "patientId">[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRelation, setContactRelation] = useState("");
  const [contactRfc, setContactRfc] = useState("");
  
  // Diálogo de baja
  const [dischargeDialog, setDischargeDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dischargeReason, setDischargeReason] = useState("");

  const load = async () => {
    const data = await api.listPatients({
      status: statusFilter === "todos" ? undefined : statusFilter as "activo" | "baja"
    });
    setItems(data);
    filterItems(data, searchQuery, searchType);
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  useEffect(() => {
    filterItems(items, searchQuery, searchType);
  }, [searchQuery, searchType]);

  const filterItems = (data: Patient[], query: string, type: string) => {
    if (!query.trim()) {
      setFilteredItems(data);
      return;
    }

    const q = query.toLowerCase().trim();
    const filtered = data.filter(p => {
      switch (type) {
        case "nombre":
          return p.name.toLowerCase().includes(q);
        case "id":
          return p.id.toLowerCase().includes(q);
        case "contacto":
          return p.contacts.some(c => 
            c.name.toLowerCase().includes(q) || 
            c.phone.includes(q)
          );
        case "curp":
          return p.curp?.toLowerCase().includes(q);
        case "rfc":
          return p.rfc?.toLowerCase().includes(q) || 
                 p.contacts.some(c => c.rfc?.toLowerCase().includes(q));
        default:
          return true;
      }
    });
    setFilteredItems(filtered);
  };

  const resetForm = () => {
    setName("");
    setBirthDate("");
    setCurp("");
    setRfc("");
    setAdmissionDate("");
    setNotes("");
    setContacts([]);
    setShowForm(false);
  };

  const addContact = () => {
    if (!contactName.trim() || !contactPhone.trim() || !contactRelation.trim()) {
      alert("Completa todos los campos del contacto");
      return;
    }

    setContacts([...contacts, {
      name: contactName.trim(),
      phone: contactPhone.trim(),
      relation: contactRelation.trim(),
      rfc: contactRfc.trim() || undefined
    }]);

    setContactName("");
    setContactPhone("");
    setContactRelation("");
    setContactRfc("");
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const calculateAge = (birthDateStr: string): number | undefined => {
    if (!birthDateStr) return undefined;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const add = async () => {
    if (!name.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    try {
      await api.addPatient({
        name: name.trim(),
        birthDate: birthDate || undefined,
        age: birthDate ? calculateAge(birthDate) : undefined,
        curp: curp.trim() || undefined,
        rfc: rfc.trim() || undefined,
        admissionDate: admissionDate || new Date().toISOString(),
        notes: notes.trim() || undefined,
        contacts: contacts as Contact[]
      });

      resetForm();
      load();
    } catch (error) {
      alert("Error al agregar paciente");
    }
  };

  const openDischargeDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setDischargeReason("");
    setDischargeDialog(true);
  };

  const dischargePatient = async () => {
    if (!selectedPatient || !dischargeReason.trim()) {
      alert("Ingresa el motivo de baja");
      return;
    }

    try {
      await api.dischargePatient(selectedPatient.id, dischargeReason.trim());
      setDischargeDialog(false);
      load();
    } catch (error) {
      alert("Error al dar de baja");
    }
  };

  const reactivatePatient = async (patientId: string) => {
   if (!window.confirm("¿Reactivar este paciente?")) return;
    
    try {
      await api.reactivatePatient(patientId);
      load();
    } catch (error) {
      alert("Error al reactivar paciente");
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
        Registra pacientes con su información completa (CURP, RFC, contactos) para un mejor seguimiento.
      </Alert>

      {/* Filtros y búsqueda */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Filtrar por estado</Typography>
        <Tabs value={statusFilter} onChange={(_, v) => setStatusFilter(v)} sx={{ mb: 2 }}>
          <Tab label="Activos" value="activo" />
          <Tab label="Bajas" value="baja" />
          <Tab label="Todos" value="todos" />
        </Tabs>

        <Typography variant="subtitle2" gutterBottom>Buscar paciente</Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            select
            size="small"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as typeof searchType)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="nombre">Por nombre</MenuItem>
            <MenuItem value="id">Por ID/Clave</MenuItem>
            <MenuItem value="contacto">Por contacto</MenuItem>
            <MenuItem value="curp">Por CURP</MenuItem>
            <MenuItem value="rfc">Por RFC</MenuItem>
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

      {/* Formulario */}
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
                value={birthDate ? calculateAge(birthDate) : ""}
                disabled
                fullWidth
              />
            </Stack>

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
              helperText="Si se deja vacío, se usa la fecha actual"
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
                {contacts.map((c, i) => (
                  <Paper key={i} sx={{ p: 1.5, bgcolor: "#f5f5f5" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.relation} • {c.phone}
                          {c.rfc && ` • RFC: ${c.rfc}`}
                        </Typography>
                      </Box>
                      <Button size="small" color="error" onClick={() => removeContact(i)}>
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
                onClick={add}
                disabled={!name.trim()}
                fullWidth
              >
                Guardar Paciente
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Tabla */}
      <Typography variant="body2" color="text.secondary" mb={1}>
        Mostrando {filteredItems.length} de {items.length} pacientes
      </Typography>

      <Table headers={["ID", "Nombre", "Edad", "CURP", "RFC", "Contactos", "Fecha Ingreso", "Estado", "Acciones"]}>
        <AnimatePresence initial={false}>
          {filteredItems.map(p => (
            <motion.tr
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <td style={{ padding: 8, fontSize: 11, fontFamily: "monospace" }}>
                {p.id.slice(0, 8)}
              </td>
              <td style={{ padding: 8, fontWeight: 600 }}>{p.name}</td>
              <td style={{ padding: 8 }}>{p.age || "-"}</td>
              <td style={{ padding: 8, fontSize: 11 }}>{p.curp || "-"}</td>
              <td style={{ padding: 8, fontSize: 11 }}>{p.rfc || "-"}</td>
              <td style={{ padding: 8 }}>
                {p.contacts.length > 0 ? (
                  <Stack spacing={0.5}>
                    {p.contacts.map((c, i) => (
                      <Typography key={i} variant="caption" display="block">
                        {c.name} ({c.relation})
                      </Typography>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary">Sin contactos</Typography>
                )}
              </td>
              <td style={{ padding: 8, fontSize: 12 }}>
                {p.admissionDate ? new Date(p.admissionDate).toLocaleDateString() : "-"}
              </td>
              <td style={{ padding: 8 }}>
                {p.status === "activo" ? (
                  <Chip label="Activo" color="success" size="small" />
                ) : (
                  <Chip label="Baja" color="error" size="small" />
                )}
              </td>
              <td style={{ padding: 8 }}>
                {p.status === "activo" ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<PersonOffIcon />}
                    onClick={() => openDischargeDialog(p)}
                  >
                    Dar de baja
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<RestoreIcon />}
                    onClick={() => reactivatePatient(p.id)}
                  >
                    Reactivar
                  </Button>
                )}
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

      {/* Diálogo de baja */}
      <Dialog open={dischargeDialog} onClose={() => setDischargeDialog(false)} maxWidth="sm" fullWidth>
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
            onClick={dischargePatient}
            disabled={!dischargeReason.trim()}
          >
            Confirmar Baja
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}