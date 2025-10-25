
import { useEffect, useState } from "react";
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
  Box
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  Medication as MedicationIcon,
  LocalPharmacy as PharmacyIcon
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import Page from "../components/Page";
import { Table } from "../components/Table";
import { api } from "../api/mock";
import { Medication, Patient } from "../types";

export default function MedsPage() {
  const [items, setItems] = useState<Medication[]>([]);
  const [filteredItems, setFilteredItems] = useState<Medication[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  
  // Búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  
  // Formulario
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [unit, setUnit] = useState("tabletas");
  const [dosage, setDosage] = useState("");
  
  // Asignar medicamento a paciente
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientDosage, setPatientDosage] = useState("");
  const [frequency, setFrequency] = useState("");

  const load = async () => {
    const data = await api.listMeds();
    setItems(data);
    filterItems(data, searchQuery);
    
    const patientsData = await api.listPatients({ status: "activo" });
    setPatients(patientsData);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    filterItems(items, searchQuery);
  }, [searchQuery]);

  const filterItems = (data: Medication[], query: string) => {
    if (!query.trim()) {
      setFilteredItems(data);
      return;
    }

    const q = query.toLowerCase().trim();
    const filtered = data.filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.unit?.toLowerCase().includes(q) ||
      m.dosage?.toLowerCase().includes(q)
    );
    setFilteredItems(filtered);
  };

  const resetForm = () => {
    setName("");
    setQty("");
    setExpiresAt("");
    setUnit("tabletas");
    setDosage("");
    setShowForm(false);
  };

  const add = async () => {
    if (!name.trim() || !qty || !expiresAt) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    if (Number(qty) <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    try {
      await api.addMed({
        name: name.trim(),
        qty: Number(qty),
        expiresAt,
        unit: unit.trim() || undefined,
        dosage: dosage.trim() || undefined
      });

      resetForm();
      load();
    } catch (error) {
      alert("Error al agregar medicamento");
    }
  };

  const openAssignDialog = (med: Medication) => {
    setSelectedMed(med);
    setSelectedPatientId("");
    setPatientDosage("");
    setFrequency("");
    setAssignDialog(true);
  };

  const assignToPatient = async () => {
    if (!selectedMed || !selectedPatientId || !patientDosage.trim() || !frequency.trim()) {
      alert("Completa todos los campos");
      return;
    }

    try {
      await api.addPatientMedication({
        patientId: selectedPatientId,
        medicationId: selectedMed.id,
        dosage: patientDosage.trim(),
        frequency: frequency.trim(),
        prescribedAt: new Date().toISOString()
      });

      alert("Medicamento asignado correctamente");
      setAssignDialog(false);
      load();
    } catch (error) {
      alert("Error al asignar medicamento");
    }
  };

  const isExpiringSoon = (expiresAt: string): boolean => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);
    return expiry <= threeMonthsFromNow;
  };

  const isExpired = (expiresAt: string): boolean => {
    return new Date(expiresAt) < new Date();
  };

  const getExpiryChip = (expiresAt: string) => {
    if (isExpired(expiresAt)) {
      return <Chip label="CADUCADO" color="error" size="small" icon={<WarningIcon />} />;
    }
    if (isExpiringSoon(expiresAt)) {
      return <Chip label="Por caducar" color="warning" size="small" icon={<WarningIcon />} />;
    }
    return <Chip label="Vigente" color="success" size="small" />;
  };

  const expiringSoonCount = items.filter(m => isExpiringSoon(m.expiresAt) && !isExpired(m.expiresAt)).length;
  const expiredCount = items.filter(m => isExpired(m.expiresAt)).length;

  return (
    <Page>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Medicamentos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "Nuevo Medicamento"}
        </Button>
      </Stack>

      {/* Alertas de caducidad */}
      {expiredCount > 0 && (
        <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            ¡Atención! Hay {expiredCount} medicamento(s) CADUCADO(S)
          </Typography>
        </Alert>
      )}

      {expiringSoonCount > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            Hay {expiringSoonCount} medicamento(s) por caducar en los próximos 3 meses
          </Typography>
        </Alert>
      )}

      {/* Búsqueda */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Buscar medicamento</Typography>
        <TextField
          placeholder="Buscar por nombre, unidad o dosis..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
          }}
        />
      </Paper>

      {/* Formulario */}
      {showForm && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Nuevo Medicamento</Typography>
          
          <Stack spacing={2}>
            <TextField
              label="Nombre del medicamento *"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              placeholder="Ej: Paracetamol, Ibuprofeno, etc."
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Cantidad *"
                type="number"
                size="small"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                fullWidth
                inputProps={{ min: 1 }}
              />

              <TextField
                label="Unidad *"
                select
                size="small"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                fullWidth
              >
                <MenuItem value="tabletas">Tabletas</MenuItem>
                <MenuItem value="cápsulas">Cápsulas</MenuItem>
                <MenuItem value="ml">ml (mililitros)</MenuItem>
                <MenuItem value="mg">mg (miligramos)</MenuItem>
                <MenuItem value="g">g (gramos)</MenuItem>
                <MenuItem value="ampolletas">Ampolletas</MenuItem>
                <MenuItem value="sobres">Sobres</MenuItem>
                <MenuItem value="frascos">Frascos</MenuItem>
                <MenuItem value="cajas">Cajas</MenuItem>
              </TextField>
            </Stack>

            <TextField
              label="Fecha de caducidad *"
              type="date"
              size="small"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              helperText="Se alertará cuando falten 3 meses o menos para caducar"
            />

            <TextField
              label="Dosis recomendada"
              size="small"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              fullWidth
              placeholder="Ej: 500mg, 10ml, 1 tableta, etc."
            />

            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={resetForm} fullWidth>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={add}
                disabled={!name.trim() || !qty || !expiresAt}
                fullWidth
              >
                Guardar Medicamento
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Tabla */}
      <Typography variant="body2" color="text.secondary" mb={1}>
        Mostrando {filteredItems.length} de {items.length} medicamentos
      </Typography>

      <Table headers={["Medicamento", "Cantidad", "Unidad", "Dosis", "Fecha Caducidad", "Estado", "Acciones"]}>
        <AnimatePresence initial={false}>
          {filteredItems.map(m => (
            <motion.tr
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <td style={{ padding: 8, fontWeight: 600 }}>{m.name}</td>
              <td style={{ padding: 8 }}>{m.qty}</td>
              <td style={{ padding: 8 }}>{m.unit || "-"}</td>
              <td style={{ padding: 8, fontSize: 12 }}>{m.dosage || "-"}</td>
              <td style={{ padding: 8, fontSize: 12 }}>
                {new Date(m.expiresAt).toLocaleDateString()}
              </td>
              <td style={{ padding: 8 }}>
                {getExpiryChip(m.expiresAt)}
              </td>
              <td style={{ padding: 8 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PharmacyIcon />}
                  onClick={() => openAssignDialog(m)}
                  disabled={isExpired(m.expiresAt)}
                >
                  Recetar
                </Button>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </Table>

      {filteredItems.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No se encontraron medicamentos.
        </Alert>
      )}

      {/* Diálogo asignar medicamento */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PharmacyIcon color="primary" />
            <span>Recetar medicamento a paciente</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Medicamento: <strong>{selectedMed?.name}</strong>
              <br />
              Disponible: <strong>{selectedMed?.qty} {selectedMed?.unit}</strong>
            </Alert>

            <TextField
              label="Seleccionar paciente *"
              select
              size="small"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              fullWidth
            >
              {patients.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.age ? `(${p.age} años)` : ""}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Dosis para este paciente *"
              size="small"
              value={patientDosage}
              onChange={(e) => setPatientDosage(e.target.value)}
              fullWidth
              placeholder="Ej: 500mg, 1 tableta, 10ml, etc."
              helperText={selectedMed?.dosage ? `Dosis recomendada: ${selectedMed.dosage}` : ""}
            />

            <TextField
              label="Frecuencia *"
              size="small"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              fullWidth
              placeholder="Ej: Cada 8 horas, 3 veces al día, cada 12 horas, etc."
            />

            <Alert severity="warning">
              <Typography variant="caption">
                Esta receta quedará registrada en el historial del paciente.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={assignToPatient}
            disabled={!selectedPatientId || !patientDosage.trim() || !frequency.trim()}
          >
            Confirmar Receta
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  );
}