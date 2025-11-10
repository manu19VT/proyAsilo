import { useEffect, useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  MenuItem,
  Alert
} from "@mui/material";
import Page from "../components/Page";
import { Table } from "../components/Table";
import { api } from "../api/client";
import { PersonalObject, Patient } from "../types";

export default function ObjectsPage() {
  const [objects, setObjects] = useState<PersonalObject[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [objectsResponse, patientsResponse] = await Promise.all([
        api.listObjects(),
        api.listPatients({ status: "activo" })
      ]);
      setObjects(objectsResponse);
      setPatients(patientsResponse);
    } catch (error) {
      console.error(error);
      alert("Error al cargar objetos personales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setName("");
    setQty("");
    setPatientId("");
  };

  const handleAddObject = async () => {
    if (!name.trim() || !qty.trim() || !patientId) {
      alert("Completa todos los campos requeridos");
      return;
    }
    const quantity = Number(qty);
    if (Number.isNaN(quantity) || quantity <= 0) {
      alert("La cantidad debe ser un número mayor a 0");
      return;
    }

    try {
      setSaving(true);
      await api.addObject({
        name: name.trim(),
        qty: quantity,
        patientId
      });
      resetForm();
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Error al registrar el objeto personal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Objetos personales</Typography>
        <Button variant="text" onClick={loadData} disabled={loading || saving}>
          Actualizar lista
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Registrar objeto personal
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Asigna el objeto a un paciente activo para que aparezca en su ficha de detalles.
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "flex-end" }}>
          <TextField
            label="Nombre del objeto *"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            placeholder="Ej: Lentes, bastón, joyería"
          />
          <TextField
            label="Cantidad *"
            size="small"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            type="number"
            inputProps={{ min: 1 }}
            sx={{ maxWidth: { md: 140 } }}
          />
          <TextField
            label="Propietario (paciente activo) *"
            size="small"
            select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            fullWidth
          >
            {patients.map(patient => (
              <MenuItem key={patient.id} value={patient.id}>
                {patient.name} {patient.age ? `(${patient.age} años)` : ""}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={resetForm} disabled={saving}>
              Limpiar
            </Button>
            <Button
              variant="contained"
              onClick={handleAddObject}
              disabled={saving || !name.trim() || !qty.trim() || !patientId}
            >
              {saving ? "Guardando..." : "Registrar"}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Objetos registrados
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={1}>
        {loading ? "Cargando objetos..." : `Mostrando ${objects.length} objeto(s)`}
      </Typography>

      <Table headers={["Objeto", "Cantidad", "Propietario", "Registrado"]}>
        {objects.length > 0 ? (
          objects.map(obj => (
            <tr key={obj.id}>
              <td style={{ padding: 12, fontWeight: 600 }}>{obj.name}</td>
              <td style={{ padding: 12 }}>{obj.qty}</td>
              <td style={{ padding: 12 }}>{obj.patientName || "-"}</td>
              <td style={{ padding: 12 }}>{formatDate(obj.receivedAt)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} style={{ padding: 16 }}>
              <Alert severity="info" sx={{ m: 0 }}>
                {loading ? "Actualizando información..." : "Aún no hay objetos registrados."}
              </Alert>
            </td>
          </tr>
        )}
      </Table>
    </Page>
  );
}
