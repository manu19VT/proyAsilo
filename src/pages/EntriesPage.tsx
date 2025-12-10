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
  Inventory as InventoryIcon,
  WarningAmber as WarningIcon
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import Page from "../components/Page";
import { Table } from "../components/Table";
import Printable from "../components/Printable";
import { api } from "../api/client";
import { EntryRequest, Medication, Patient } from "../types";
import { useAuth } from "../contexts/AuthContext";

type TypeFilter = "todos" | "entrada" | "salida" | "caducidad";

interface SelectedItem {
  medicationId: string;
  qty: number;
  dosisRecomendada?: string;
  frecuencia?: string;
  fechaCaducidad?: string;
}

export default function EntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EntryRequest[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<EntryRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos");
  const [searchFolio, setSearchFolio] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [entryType, setEntryType] = useState<"entrada" | "salida" | "caducidad">("salida");
  const [patientId, setPatientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [comment, setComment] = useState("");

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemDosis, setItemDosis] = useState("");
  const [itemFrecuencia, setItemFrecuencia] = useState("");

  const [printEntry, setPrintEntry] = useState<EntryRequest | null>(null);

  // === NUEVO: buscador local para el combo de medicamentos ===
  const [searchMedQuery, setSearchMedQuery] = useState("");

  const load = async () => {
    try {
      const [entryData, patientsData, medsData] = await Promise.all([
        api.listEntries({ type: typeFilter === "todos" ? undefined : (typeFilter as any) }),
        api.listPatients({ status: "activo" }),
        api.listMeds()
      ]);
      setEntries(entryData);
      setFilteredEntries(entryData);
      setPatients(patientsData);
      setMedications(medsData);
    } catch (error) {
      console.error(error);
      alert("Error al cargar registros");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  useEffect(() => {
    const q = searchFolio.trim().toLowerCase();
    if (!q) {
      setFilteredEntries(entries);
      return;
    }
    setFilteredEntries(entries.filter(entry => entry.folio.toLowerCase().includes(q)));
  }, [entries, searchFolio]);

  const resetForm = () => {
    setEntryType("salida");
    setPatientId("");
    setDueDate("");
    setComment("");
    setSelectedItems([]);
    setSelectedMedId("");
    setItemQty("");
    setItemDosis("");
    setItemFrecuencia("");
    setSearchMedQuery("");
    setShowForm(false);
    setDueDateError(null);
  };

  const getMedById = useMemo(
    () => new Map(medications.map(m => [m.id, m] as const)),
    [medications]
  );

  // === NUEVO: lista filtrada para el combo (incluye CÓDIGO DE BARRAS) ===
  const filteredMeds = useMemo(() => {
    const q = searchMedQuery.trim().toLowerCase();
    if (!q) return medications;
    const matches = (s?: string) => (s ? s.toLowerCase().includes(q) : false);
    return medications.filter(m =>
      matches(m.name) || matches(m.unit) || matches(m.dosage) || matches((m as any).barcode)
    );
  }, [medications, searchMedQuery]);

  const handleAddItem = () => {
    if (!selectedMedId || !itemQty || Number(itemQty) <= 0) {
      alert("Selecciona un medicamento y cantidad válida");
      return;
    }

    const med = getMedById.get(selectedMedId);
    if (!med) {
      alert("Medicamento no encontrado");
      return;
    }

    if (entryType === "salida" && Number(itemQty) > med.qty) {
      alert(`Solo hay ${med.qty} ${med.unit || "unidades"} disponibles`);
      return;
    }

    if (entryType === "salida" && (!itemDosis.trim() || !itemFrecuencia.trim())) {
      alert("Para salidas, debes completar la dosis recomendada y la frecuencia");
      return;
    }

    if (selectedItems.some(i => i.medicationId === selectedMedId)) {
      alert("Este medicamento ya está agregado");
      return;
    }

    const newItem: SelectedItem = {
      medicationId: selectedMedId,
      qty: Number(itemQty)
    };

    if (entryType === "salida") {
      newItem.dosisRecomendada = itemDosis.trim();
      newItem.frecuencia = itemFrecuencia.trim();
      newItem.fechaCaducidad = med.expiresAt;
    }

    if (entryType === "caducidad") {
      newItem.fechaCaducidad = med.expiresAt;
    }

    setSelectedItems(prev => [...prev, newItem]);
    setSelectedMedId("");
    setItemQty("");
    setItemDosis("");
    setItemFrecuencia("");
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.medicationId !== id));
  };

  const handleCreateEntry = async () => {
    if (entryType !== "entrada" && (!patientId || selectedItems.length === 0)) {
      alert("Selecciona un paciente y al menos un medicamento");
      return;
    }
    if (entryType === "entrada" && selectedItems.length === 0) {
      alert("Agrega al menos un medicamento");
      return;
    }

    try {
      const payload = {
        type: entryType,
        patientId: entryType === "entrada" ? patientId || "" : patientId, // no tocamos lógica backend
        items: selectedItems,
        status: "completa",
        comment: comment.trim() || undefined,
        userId: user?.id
      };
      
      // IMPORTANTE: Solo agregar patientId para salidas
      // Para entrada y caducidad, NO incluir patientId en absoluto
      if (entryType === "salida") {
        if (!patientId) {
          alert("Selecciona un paciente para la salida");
          return;
        }
        payload.patientId = patientId;
        if (dueDate) {
          payload.dueDate = new Date(dueDate).toISOString();
        }
      }
      // Para entrada y caducidad, explícitamente NO incluir patientId
      // Esto asegura que el backend no lo requiera

      console.log('Enviando payload:', { 
        type: payload.type, 
        hasPatientId: 'patientId' in payload,
        patientId: payload.patientId 
      });

      const createdEntry = await api.addEntry(payload);
      const entryTypeName = entryType === "entrada" ? "Entrada" : entryType === "salida" ? "Salida" : "Caducidad";
      alert(
        `${entryTypeName} registrada correctamente.\n\nFolio: ${createdEntry.folio}\n\nSe abrirá el folio para imprimir.`
      );
      
      // Mostrar el folio para imprimir
      setPrintEntry(createdEntry);
      resetForm();
      load();
    } catch (error: any) {
      console.error("Error completo:", error);
      const errorMessage = error?.message || error?.error || "Error desconocido al registrar el movimiento";
      alert(`Error al registrar el movimiento: ${errorMessage}`);
    }
  };

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || "Desconocido";

  const getMedicationLabel = (id: string) => {
    const med = getMedById.get(id);
    return med ? `${med.name}${med.unit ? ` (${med.unit})` : ""}` : "Desconocido";
  };

  const getTotalItems = (entry: EntryRequest) =>
    entry.items.reduce((sum, item) => sum + item.qty, 0);

  const entryTitle = (t: "entrada" | "salida" | "caducidad") =>
    t === "entrada"
      ? "ENTRADA DE ALMACÉN"
      : t === "salida"
      ? "SALIDA DE MEDICAMENTOS"
      : "REGISTRO DE CADUCIDAD";

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
        Sistema de folios automático para control de entradas, salidas y caducidad del almacén.
      </Alert>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Filtrar por tipo</Typography>
        <Tabs value={typeFilter} onChange={(_, value) => setTypeFilter(value)} sx={{ mb: 2 }}>
          <Tab label="Todos" value="todos" />
          <Tab label="Salidas" value="salida" />
          <Tab label="Entradas" value="entrada" />
          <Tab label="Caducidad" value="caducidad" />
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

      {showForm && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Nuevo Registro</Typography>
          <Stack spacing={2}>
            <TextField
              label="Tipo de movimiento *"
              select
              size="small"
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as "entrada" | "salida" | "caducidad")}
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
              <MenuItem value="caducidad">
                <Stack direction="row" spacing={1} alignItems="center">
                  <WarningIcon fontSize="small" />
                  <span>Caducidad - Baja por vencimiento</span>
                </Stack>
              </MenuItem>
            </TextField>

            {/* Paciente: visible solo para salida y caducidad */}
            {(entryType === "salida" || entryType === "caducidad") && (
              <TextField
                label="Paciente *"
                select
                size="small"
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
            )}

            {entryType === "salida" && (
              <TextField
                label="Fecha para volver (opcional)"
                type="date"
                size="small"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText="Próxima fecha estimada para entregar medicamentos"
              />
            )}

            <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
              Medicamentos
            </Typography>

            {selectedItems.length > 0 && (
              <Stack spacing={1}>
                {selectedItems.map(item => {
                  const med = getMedById.get(item.medicationId);
                  return (
                    <Paper key={item.medicationId} sx={{ p: 1.5, bgcolor: "#f5f5f5" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {med?.name || "Desconocido"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Cantidad: {item.qty} {med?.unit || "unidades"}
                          </Typography>

                          {entryType === "salida" && item.dosisRecomendada && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Dosis: {item.dosisRecomendada}
                            </Typography>
                          )}
                          {entryType === "salida" && item.frecuencia && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Frecuencia: {item.frecuencia}
                            </Typography>
                          )}

                          {(entryType === "salida" || entryType === "caducidad") && item.fechaCaducidad && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Caducidad: {new Date(item.fechaCaducidad).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(item.medicationId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}

            {/* =================== Agregar Medicamento (con buscador por CÓDIGO) =================== */}
            <Paper sx={{ p: 2, bgcolor: "#fff3e6", border: "1px solid #f97316" }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Agregar Medicamento
              </Typography>

              {/* Buscador local por nombre / unidad / dosis / código de barras */}
              <TextField
                label="Buscar por nombre, unidad, dosis o código de barras"
                size="small"
                fullWidth
                sx={{ mb: 1.5 }}
                value={searchMedQuery}
                onChange={(e) => setSearchMedQuery(e.target.value)}
                placeholder="Ej.: 7501234567890, Paracetamol, cápsulas, 500 mg..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                }}
              />

              <Stack spacing={1.5}>
                <TextField
                  label="Medicamento"
                  select
                  size="small"
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  fullWidth
                >
                  {filteredMeds.map((med) => (
                    <MenuItem key={med.id} value={med.id}>
                      <Stack direction="row" justifyContent="space-between" width="100%">
                        <span>
                          {med.name}
                          {med.unit ? ` (${med.unit})` : ""}
                          {med.dosage ? ` • ${med.dosage}` : ""}
                        </span>
                        <Typography variant="caption" color="text.secondary">
                          {(med as any).barcode ? `CB: ${(med as any).barcode}` : ""}
                        </Typography>
                      </Stack>
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

                {entryType === "salida" && (
                  <>
                    <TextField
                      label="Dosis recomendada *"
                      size="small"
                      value={itemDosis}
                      onChange={(e) => setItemDosis(e.target.value)}
                      fullWidth
                      placeholder="Ej: 500mg, 1 tableta, 10ml, etc."
                      helperText={
                        selectedMedId
                          ? (() => {
                              const med = getMedById.get(selectedMedId);
                              return med?.dosage ? `Dosis del medicamento: ${med.dosage}` : undefined;
                            })()
                          : undefined
                      }
                    />

                    <TextField
                      label="Cada cuándo tomar *"
                      size="small"
                      value={itemFrecuencia}
                      onChange={(e) => setItemFrecuencia(e.target.value)}
                      fullWidth
                      placeholder="Ej: Cada 8 horas, 3 veces al día, etc."
                    />
                  </>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddItem}
                  disabled={
                    !selectedMedId ||
                    !itemQty ||
                    (entryType === "salida" && (!itemDosis.trim() || !itemFrecuencia.trim()))
                  }
                >
                  Agregar
                </Button>
              </Stack>
            </Paper>

            {/* Comentario */}
            <TextField
              label="Comentario (opcional)"
              size="small"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              placeholder="Observaciones, lote, motivo de baja, etc."
            />

            <Alert severity="info">
              El folio se generará automáticamente al guardar el registro.
            </Alert>

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={resetForm} fullWidth>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateEntry}
                disabled={(entryType === "salida" && !patientId) || selectedItems.length === 0}
                fullWidth
              >
                Guardar Registro
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Typography variant="body2" color="text.secondary" mb={1}>
        Mostrando {filteredEntries.length} de {entries.length} registros
      </Typography>

      <Table headers={["Folio", "Tipo", "Paciente", "Items", "Total", "Fecha", "Estado", "Acciones"]}>
        <AnimatePresence initial={false}>
          {filteredEntries.map(entry => (
            <motion.tr
              key={entry.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <td style={{ padding: 8, fontFamily: "monospace", fontWeight: 700, color: "#f97316" }}>
                {entry.folio}
              </td>
              <td style={{ padding: 8 }}>
                {entry.type === "entrada" ? (
                  <Chip label="Entrada" color="info" size="small" icon={<InventoryIcon />} />
                ) : entry.type === "salida" ? (
                  <Chip label="Salida" color="primary" size="small" icon={<ShippingIcon />} />
                ) : (
                  <Chip label="Caducidad" color="error" size="small" icon={<WarningIcon />} />
                )}
              </td>
                    {/* Mostrar Paciente solo para salidas o cuando el filtro es "todos" */}
                    {(typeFilter === "salida" || typeFilter === "todos") && (
              <td style={{ padding: 8, fontWeight: 600 }}>
                        {entry.type === "salida" ? getPatientName(entry.patientId) : "-"}
              </td>
                    )}
              <td style={{ padding: 8 }}>
                <Stack spacing={0.5}>
                  {entry.items.slice(0, 2).map((item, index) => (
                    <Typography key={index} variant="caption" display="block">
                      • {getMedicationLabel(item.medicationId)}: {item.qty}
                    </Typography>
                  ))}
                  {entry.items.length > 2 && (
                    <Typography variant="caption" color="text.secondary">
                      +{entry.items.length - 2} más...
                    </Typography>
                  )}
                </Stack>
              </td>
              <td style={{ padding: 8, fontWeight: 600 }}>
                {getTotalItems(entry)} items
                    </td>
                    {/* Para caducidad, mostrar fecha de caducidad del medicamento y fecha de registro */}
                    {typeFilter === "caducidad" ? (
                      <>
                        <td style={{ padding: 8, fontSize: 12 }}>
                          {entry.items.length > 0 && entry.items[0].fechaCaducidad
                            ? new Date(entry.items[0].fechaCaducidad).toLocaleDateString()
                            : "-"}
              </td>
              <td style={{ padding: 8, fontSize: 12 }}>
                {new Date(entry.createdAt).toLocaleDateString()}
              </td>
                      </>
                    ) : (
                      <td style={{ padding: 8, fontSize: 12 }}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                    )}
              <td style={{ padding: 8 }}>
                <Chip
                  label={entry.status === "completa" ? "Completa" : "Incompleta"}
                  color={entry.status === "completa" ? "success" : "warning"}
                  size="small"
                />
              </td>
              <td style={{ padding: 8 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={() => setPrintEntry(entry)}
                >
                  Imprimir
                </Button>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </Table>

      {filteredEntries.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No se encontraron registros.
        </Alert>
      )}

      {printEntry && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.5)",
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2
          }}
        >
          <Paper sx={{ maxWidth: 800, width: "100%", maxHeight: "90vh", overflow: "auto", p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight={700}>Vista Previa</Typography>
              <Button variant="outlined" onClick={() => setPrintEntry(null)}>Cerrar</Button>
            </Stack>

            <Box>
              <Typography variant="h5" gutterBottom align="center" fontWeight={700}>
                {entryTitle(printEntry.type as any)}
              </Typography>

              <Typography variant="h6" align="center" color="primary" gutterBottom>
                Folio: {printEntry.folio}
              </Typography>

              <Box sx={{ my: 3, p: 2, border: "1px solid #ccc", borderRadius: 1 }}>
                <Stack spacing={1}>
                  {printEntry.type !== "caducidad" && printEntry.type !== "entrada" && (
                  <Typography variant="body1">
                    <strong>Paciente:</strong> {getPatientName(printEntry.patientId)}
                  </Typography>
                  )}
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
                  {(printEntry as any).comment && (
                    <Typography variant="body1">
                      <strong>Comentario:</strong> {(printEntry as any).comment}
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
                    {printEntry.type === "salida" && (
                      <>
                        <th style={{ padding: 8, textAlign: "left" }}>Dosis</th>
                        <th style={{ padding: 8, textAlign: "left" }}>Frecuencia</th>
                        <th style={{ padding: 8, textAlign: "left" }}>Caducidad</th>
                      </>
                    )}
                    {printEntry.type === "caducidad" && (
                      <th style={{ padding: 8, textAlign: "left" }}>Caducidad</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {printEntry.items.map((item, index) => {
                    const med = getMedById.get(item.medicationId);
                    return (
                      <tr key={index} style={{ borderBottom: "1px solid #ccc" }}>
                        <td style={{ padding: 8 }}>{med?.name || "Desconocido"}</td>
                        <td style={{ padding: 8, textAlign: "right" }}>
                          {item.qty} {med?.unit || ""}
                        </td>
                        {printEntry.type === "salida" && (
                          <>
                            <td style={{ padding: 8 }}>{item.dosisRecomendada || "-"}</td>
                            <td style={{ padding: 8 }}>{item.frecuencia || "-"}</td>
                            <td style={{ padding: 8 }}>
                              {item.fechaCaducidad ? new Date(item.fechaCaducidad).toLocaleDateString() : "-"}
                            </td>
                          </>
                        )}
                        {printEntry.type === "caducidad" && (
                          <td style={{ padding: 8 }}>
                            {item.fechaCaducidad ? new Date(item.fechaCaducidad).toLocaleDateString() : "-"}
                          </td>
                        )}
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
                    {printEntry.type === "salida" && <td colSpan={3}></td>}
                    {printEntry.type === "caducidad" && <td></td>}
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
                title={`${entryTitle(printEntry.type as any)} - ${printEntry.folio}`}
                buttonText="Imprimir"
                buttonProps={{ variant: "contained", fullWidth: true }}
              >
                {`
                  <h1 style="text-align: center;">${entryTitle(printEntry.type as any)}</h1>
                  <h2 style="text-align: center; color: #f97316;">Folio: ${printEntry.folio}</h2>
                  <div style="margin: 24px 0; padding: 16px; border: 1px solid #ccc; border-radius: 8px;">
                    ${printEntry.type !== "caducidad" && printEntry.type !== "entrada" ? `<p><strong>Paciente:</strong> ${getPatientName(printEntry.patientId)}</p>` : ""}
                    <p><strong>Fecha:</strong> ${new Date(printEntry.createdAt).toLocaleString()}</p>
                    <p><strong>Estado:</strong> ${printEntry.status === "completa" ? "Completa" : "Incompleta"}</p>
                    ${printEntry.dueDate ? `<p><strong>Próxima fecha:</strong> ${new Date(printEntry.dueDate).toLocaleDateString()}</p>` : ""}
                    ${(printEntry as any).comment ? `<p><strong>Comentario:</strong> ${(printEntry as any).comment}</p>` : ""}
                  </div>
                  <h3>Medicamentos:</h3>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                    <thead>
                      <tr style="border-bottom: 2px solid #000;">
                        <th style="padding: 8px; text-align: left;">Medicamento</th>
                        <th style="padding: 8px; text-align: right;">Cantidad</th>
                        ${printEntry.type === "salida" ? `
                          <th style="padding: 8px; text-align: left;">Dosis</th>
                          <th style="padding: 8px; text-align: left;">Frecuencia</th>
                          <th style="padding: 8px; text-align: left;">Caducidad</th>
                        ` : printEntry.type === "caducidad" ? `
                          <th style="padding: 8px; text-align: left;">Caducidad</th>
                        ` : ""}
                      </tr>
                    </thead>
                    <tbody>
                      ${printEntry.items.map(item => {
                        const med = getMedById.get(item.medicationId);
                        const medName = med?.name || "Desconocido";
                        const medUnit = med?.unit || "";
                        const cad = item.fechaCaducidad ? new Date(item.fechaCaducidad).toLocaleDateString() : "-";
                        return `
                          <tr style="border-bottom: 1px solid #ccc;">
                            <td style="padding: 8px;">${medName}</td>
                            <td style="padding: 8px; text-align: right;">${item.qty} ${medUnit}</td>
                            ${printEntry.type === "salida" ? `
                              <td style="padding: 8px;">${item.dosisRecomendada || "-"}</td>
                              <td style="padding: 8px;">${item.frecuencia || "-"}</td>
                              <td style="padding: 8px;">${cad}</td>
                            ` : printEntry.type === "caducidad" ? `
                              <td style="padding: 8px;">${cad}</td>
                            ` : ""}
                          </tr>
                        `;
                      }).join("")}
                    </tbody>
                    <tfoot>
                      <tr style="border-top: 2px solid #000; font-weight: 700;">
                        <td style="padding: 8px;">TOTAL</td>
                        <td style="padding: 8px; text-align: right;">${getTotalItems(printEntry)} items</td>
                        ${printEntry.type === "salida" ? `<td colspan="3"></td>` : printEntry.type === "caducidad" ? `<td></td>` : ""}
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
