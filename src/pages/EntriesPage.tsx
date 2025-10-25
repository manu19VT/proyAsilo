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
  Box,
  Tabs,
  Tab,
  IconButton
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon,
  Delete as DeleteIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import Page from "../components/Page";
import { Table } from "../components/Table";
import Printable from "../components/Printable";
import { api } from "../api/mock";
import { EntryRequest, Patient, Medication } from "../types";

export default function EntriesPage() {
  const [items, setItems] = useState<EntryRequest[]>([]);
  const [filteredItems, setFilteredItems] = useState<EntryRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  
  // Filtros
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [searchFolio, setSearchFolio] = useState("");
  
  // Formulario (borrador)
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"entrada" | "salida">("salida");
  const [patientId, setPatientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedItems, setSelectedItems] = useState<{ medicationId: string; qty: number }[]>([]);
  
  // Agregar item
  const [selectedMedId, setSelectedMedId] = useState("");
  const [itemQty, setItemQty] = useState("");
  
  // Impresión
  const [printEntry, setPrintEntry] = useState<EntryRequest | null>(null);

  const load = async () => {
    const data = await api.listEntries({
      type: typeFilter === "todos" ? undefined : typeFilter as "entrada" | "salida"
    });
    setItems(data);
    setFilteredItems(data);
    
    const patientsData = await api.listPatients({ status: "activo" });
    setPatients(patientsData);
    
    const medsData = await api.listMeds();
    setMeds(medsData);
  };

  useEffect(() => {
    load();
  }, [typeFilter]);

  useEffect(() => {
    if (searchFolio.trim()) {
      const filtered = items.filter(e => 
        e.folio.toLowerCase().includes(searchFolio.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchFolio, items]);

  const resetForm = () => {
    setType("salida");
    setPatientId("");
    setDueDate("");
    setSelectedItems([]);
    setSelectedMedId("");
    setItemQty("");
    setShowForm(false);
  };

  const addItem = () => {
    if (!selectedMedId || !itemQty || Number(itemQty) <= 0) {
      alert("Selecciona un medicamento y cantidad válida");
      return;
    }

    const med = meds.find(m => m.id === selectedMedId);
    if (!med) return;

    if (Number(itemQty) > med.qty) {
      alert(`Solo hay ${med.qty} ${med.unit || "unidades"} disponibles`);
      return;
    }

    const exists = selectedItems.find(i => i.medicationId === selectedMedId);
    if (exists) {
      alert("Este medicamento ya está agregado");
      return;
    }

    setSelectedItems([...selectedItems, {
      medicationId: selectedMedId,
      qty: Number(itemQty)
    }]);

    setSelectedMedId("");
    setItemQty("");
  };

  const removeItem = (medicationId: string) => {
    setSelectedItems(selectedItems.filter(i => i.medicationId !== medicationId));
  };

  const create = async () => {
    if (!patientId || selectedItems.length === 0) {
      alert("Selecciona un paciente y al menos un medicamento");
      return;
    }

    try {
      await api.addEntry({
        type,
        patientId,
        items: selectedItems,
        status: "completa",
        dueDate: dueDate || undefined
      });

      resetForm();
      load();
      alert(`${type === "entrada" ? "Entrada" : "Salida"} registrada correctamente`);
    } catch (error) {
      alert("Error al registrar");
    }
  };

  const getMedName = (medId: string) => {
    const med = meds.find(m => m.id === medId);
    return med ? `${med.name} (${med.unit || ""})` : "Desconocido";
  };

  const getPatientName = (patId: string) => {
    const patient = patients.find(p => p.id === patId);
    return patient?.name || "Desconocido";
  };

  const getTotalItems = (entry: EntryRequest) => {
    return entry.items.reduce((sum, item) => sum + item.qty, 0);
  };

  return (
    <Page>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Entradas y Salidas</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "Nuevo Registro"}
        </Button>
      </Stack>

      <Alert severity="info" icon={<ReceiptIcon />} sx={{ mb: 2 }}>
        Sistema de folios automático para control de entradas y salidas del almacén.
      </Alert>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Filtrar por tipo</Typography>
        <Tabs value={typeFilter} onChange={(_, v) => setTypeFilter(v)} sx={{ mb: 2 }}>
          <Tab label="Todos" value="todos" />
          <Tab label="Salidas" value="salida" />
          <Tab label="Entradas" value="entrada" />
        </Tabs>

        <Typography variant="subtitle2" gutterBottom>Buscar por folio</Typography>
        <TextField
          placeholder="Buscar folio..."
          size="small"
          value={searchFolio}
          onChange={(e) => setSearchFolio(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
          }}
        />
      </Paper>

      {/* Formulario */}
      {showForm && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Nuevo Registro</Typography>
          
          <Stack spacing={2}>
            <TextField
              label="Tipo de movimiento *"
              select
              size="small"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              fullWidth
            >
              <MenuItem value="salida">
                <Stack direction="row" spacing={1} alignItems="center">
                  <ShippingIcon fontSize="small" />
                  <span>Salida - Medicamento para paciente</span>
                </Stack>
              </MenuItem>
              <MenuItem value="entrada">
                <Stack direction="row" spacing={1} alignItems="center">
                  <InventoryIcon fontSize="small" />
                  <span>Entrada - Abastecimiento de almacén</span>
                </Stack>
              </MenuItem>
            </TextField>

            <TextField
              label="Paciente *"
              select
              size="small"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              fullWidth
            >
              {patients.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.age ? `(${p.age} años)` : ""}
                </MenuItem>
              ))}
            </TextField>

            {type === "salida" && (
              <TextField
                label="Fecha para volver (opcional)"
                type="date"
                size="small"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText="Próxima fecha estimada de entrega de medicamentos"
              />
            )}

            <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
              Medicamentos
            </Typography>

            {selectedItems.length > 0 && (
              <Stack spacing={1}>
                {selectedItems.map(item => {
                  const med = meds.find(m => m.id === item.medicationId);
                  return (
                    <Paper key={item.medicationId} sx={{ p: 1.5, bgcolor: "#f5f5f5" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {med?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Cantidad: {item.qty} {med?.unit || "unidades"}
                          </Typography>
                        </Box>
                        <IconButton size="small" color="error" onClick={() => removeItem(item.medicationId)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}

            <Paper sx={{ p: 2, bgcolor: "#fff3e6", border: "1px solid #f97316" }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Agregar Medicamento
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  label="Medicamento"
                  select
                  size="small"
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  fullWidth
                >
                  {meds.map(m => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name} - Disponible: {m.qty} {m.unit || ""}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Cantidad"
                  type="number"
                  size="small"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  fullWidth
                  inputProps={{ min: 1 }}
                />

                <Button
                  variant="outlined"
                  size="small"
                  onClick={addItem}
                  disabled={!selectedMedId || !itemQty}
                >
                  Agregar
                </Button>
              </Stack>
            </Paper>

            <Alert severity="info">
              El folio se generará automáticamente al guardar el registro.
            </Alert>

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={resetForm} fullWidth>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={create}
                disabled={!patientId || selectedItems.length === 0}
                fullWidth
              >
                Guardar Registro
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Tabla de historial */}
      <Typography variant="body2" color="text.secondary" mb={1}>
        Mostrando {filteredItems.length} de {items.length} registros
      </Typography>

      <Table headers={["Folio", "Tipo", "Paciente", "Items", "Total", "Fecha", "Estado", "Acciones"]}>
        <AnimatePresence initial={false}>
          {filteredItems.map(e => (
            <motion.tr
              key={e.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <td style={{ padding: 8, fontFamily: "monospace", fontWeight: 700, color: "#f97316" }}>
                {e.folio}
              </td>
              <td style={{ padding: 8 }}>
                {e.type === "entrada" ? (
                  <Chip
                    label="Entrada"
                    color="info"
                    size="small"
                    icon={<InventoryIcon />}
                  />
                ) : (
                  <Chip
                    label="Salida"
                    color="primary"
                    size="small"
                    icon={<ShippingIcon />}
                  />
                )}
              </td>
              <td style={{ padding: 8, fontWeight: 600 }}>
                {getPatientName(e.patientId)}
              </td>
              <td style={{ padding: 8 }}>
                <Stack spacing={0.5}>
                  {e.items.slice(0, 2).map((item, i) => (
                    <Typography key={i} variant="caption" display="block">
                      • {getMedName(item.medicationId)}: {item.qty}
                    </Typography>
                  ))}
                  {e.items.length > 2 && (
                    <Typography variant="caption" color="text.secondary">
                      +{e.items.length - 2} más...
                    </Typography>
                  )}
                </Stack>
              </td>
              <td style={{ padding: 8, fontWeight: 600 }}>
                {getTotalItems(e)} items
              </td>
              <td style={{ padding: 8, fontSize: 12 }}>
                {new Date(e.createdAt).toLocaleDateString()}
              </td>
              <td style={{ padding: 8 }}>
                <Chip
                  label={e.status === "completa" ? "Completa" : "Incompleta"}
                  color={e.status === "completa" ? "success" : "warning"}
                  size="small"
                />
              </td>
              <td style={{ padding: 8 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={() => setPrintEntry(e)}
                >
                  Imprimir
                </Button>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </Table>

      {filteredItems.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No se encontraron registros.
        </Alert>
      )}

      {/* Vista de impresión - Modal con vista previa */}
      {printEntry && (
        <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, bgcolor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
          <Paper sx={{ maxWidth: 800, width: "100%", maxHeight: "90vh", overflow: "auto", p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight={700}>Vista Previa</Typography>
              <Button variant="outlined" onClick={() => setPrintEntry(null)}>Cerrar</Button>
            </Stack>

            <Box>
              <Typography variant="h5" gutterBottom align="center" fontWeight={700}>
                {printEntry.type === "entrada" ? "ENTRADA DE ALMACÉN" : "SALIDA DE MEDICAMENTOS"}
              </Typography>
              
              <Typography variant="h6" align="center" color="primary" gutterBottom>
                Folio: {printEntry.folio}
              </Typography>

              <Box sx={{ my: 3, p: 2, border: "1px solid #ccc", borderRadius: 1 }}>
                <Stack spacing={1}>
                  <Typography variant="body1">
                    <strong>Paciente:</strong> {getPatientName(printEntry.patientId)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Fecha:</strong> {new Date(printEntry.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Estado:</strong> {printEntry.status === "completa" ? "Completa" : "Incompleta"}
                  </Typography>
                  {printEntry.dueDate && (
                    <Typography variant="body1">
                      <strong>Próxima fecha:</strong> {new Date(printEntry.dueDate).toLocaleDateString()}
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Typography variant="h6" gutterBottom>Medicamentos:</Typography>
              
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #000" }}>
                    <th style={{ padding: 8, textAlign: "left" }}>Medicamento</th>
                    <th style={{ padding: 8, textAlign: "right" }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {printEntry.items.map((item, i) => {
                    const med = meds.find(m => m.id === item.medicationId);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #ccc" }}>
                        <td style={{ padding: 8 }}>{med?.name || "Desconocido"}</td>
                        <td style={{ padding: 8, textAlign: "right" }}>
                          {item.qty} {med?.unit || ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #000", fontWeight: 700 }}>
                    <td style={{ padding: 8 }}>TOTAL</td>
                    <td style={{ padding: 8, textAlign: "right" }}>
                      {getTotalItems(printEntry)} items
                    </td>
                  </tr>
                </tfoot>
              </table>

              <Box sx={{ mt: 4, pt: 2, borderTop: "1px dashed #ccc" }}>
                <Typography variant="caption" color="text.secondary">
                  Generado el {new Date().toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <Printable
                title={`${printEntry.type === "entrada" ? "ENTRADA" : "SALIDA"} - ${printEntry.folio}`}
                buttonText="Imprimir"
                buttonProps={{ variant: "contained", fullWidth: true }}
              >
                {`
                  <h1 style="text-align: center;">${printEntry.type === "entrada" ? "ENTRADA DE ALMACÉN" : "SALIDA DE MEDICAMENTOS"}</h1>
                  <h2 style="text-align: center; color: #f97316;">Folio: ${printEntry.folio}</h2>
                  <div style="margin: 24px 0; padding: 16px; border: 1px solid #ccc; border-radius: 8px;">
                    <p><strong>Paciente:</strong> ${getPatientName(printEntry.patientId)}</p>
                    <p><strong>Fecha:</strong> ${new Date(printEntry.createdAt).toLocaleString()}</p>
                    <p><strong>Estado:</strong> ${printEntry.status === "completa" ? "Completa" : "Incompleta"}</p>
                    ${printEntry.dueDate ? `<p><strong>Próxima fecha:</strong> ${new Date(printEntry.dueDate).toLocaleDateString()}</p>` : ""}
                  </div>
                  <h3>Medicamentos:</h3>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                    <thead>
                      <tr style="border-bottom: 2px solid #000;">
                        <th style="padding: 8px; text-align: left;">Medicamento</th>
                        <th style="padding: 8px; text-align: right;">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${printEntry.items.map(item => {
                        const med = meds.find(m => m.id === item.medicationId);
                        return `
                          <tr style="border-bottom: 1px solid #ccc;">
                            <td style="padding: 8px;">${med?.name || "Desconocido"}</td>
                            <td style="padding: 8px; text-align: right;">${item.qty} ${med?.unit || ""}</td>
                          </tr>
                        `;
                      }).join("")}
                    </tbody>
                    <tfoot>
                      <tr style="border-top: 2px solid #000; font-weight: 700;">
                        <td style="padding: 8px;">TOTAL</td>
                        <td style="padding: 8px; text-align: right;">${getTotalItems(printEntry)} items</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px dashed #ccc;">
                    <small>Generado el ${new Date().toLocaleString()}</small>
                  </div>
                `}
              </Printable>
              <Button variant="outlined" onClick={() => setPrintEntry(null)} fullWidth>
                Cerrar
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Page>
  );
}