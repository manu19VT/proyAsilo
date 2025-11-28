import { useEffect, useMemo, useRef, useState } from "react";
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
  WarningAmber as WarningIcon,
  QrCodeScanner as QrCodeScannerIcon
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

type NewMedDraft = {
  name: string;
  unit?: string;
  dosage?: string;
  expiresAt: string;
  barcode?: string;
};

const WAREHOUSE_PATIENT_ID = "__ALMACEN__";

export default function EntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EntryRequest[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<EntryRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [dueDateError, setDueDateError] = useState<string | null>(null);

  // Subform ENTRADA (nuevo med)
  const [nmBarcode, setNmBarcode] = useState("");
  const [nmName, setNmName] = useState("");
  const [nmQty, setNmQty] = useState("");
  const [nmUnit, setNmUnit] = useState("tabletas");
  const [nmExpiresAt, setNmExpiresAt] = useState("");
  const [nmDosage, setNmDosage] = useState("");
  const [scanMode, setScanMode] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [newMeds, setNewMeds] = useState<Record<string, NewMedDraft>>({});

  const [printEntry, setPrintEntry] = useState<EntryRequest | null>(null);

  // cargar datos
  const load = async () => {
    setLoading(true);
    setError(null);
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
    } catch (error: any) {
      console.error("Error al cargar registros:", error);
      const errorMessage = error?.message || "Error desconocido al cargar los registros";
      setError(`Error al cargar los registros: ${errorMessage}`);
      // Mantener datos anteriores si hay error
    } finally {
      setLoading(false);
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

  // helpers
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
    setNmBarcode("");
    setNmName("");
    setNmQty("");
    setNmUnit("tabletas");
    setNmExpiresAt("");
    setNmDosage("");
    setNewMeds({});
    setScanMode(false);
    setShowForm(false);
  };

  const getMedById = useMemo(
    () => new Map(medications.map(m => [m.id, m] as const)),
    [medications]
  );

  const getPatientName = (id?: string) =>
    !id || id === WAREHOUSE_PATIENT_ID
      ? "Almacén"
      : patients.find(p => p.id === id)?.name || "Desconocido";

  const getMedicationLabel = (id: string) => {
    const med = getMedById.get(id);
    return med ? `${med.name}${med.unit ? ` (${med.unit})` : ""}` : "Medicamento";
  };

  // ---------- Agregar item (Salida/Caducidad) ----------
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

    setSelectedItems(prev => {
      const updated = [...prev, newItem];
      // Validar la fecha cuando se agrega un nuevo item
      if (entryType === "salida" && dueDate) {
        const error = validateDueDate(dueDate);
        setDueDateError(error);
      }
      return updated;
    });
    setSelectedMedId("");
    setItemQty("");
    setItemDosis("");
    setItemFrecuencia("");
    
    // Validar fecha si ya está seleccionada
    if (dueDate) {
      const error = validateDueDate(dueDate);
      setDueDateError(error);
    }
  };

  // ---------- Agregar item (Entrada: NUEVO) ----------
  const addItemEntradaNuevo = () => {
    if (!nmName.trim() || !nmQty || !nmExpiresAt) {
      alert("Completa nombre, cantidad y caducidad");
      return;
    }
    const tempId = `new-${Date.now()}`;
    const draft: NewMedDraft = {
      name: nmName.trim(),
      unit: nmUnit.trim() || undefined,
      dosage: nmDosage.trim() || undefined,
      expiresAt: nmExpiresAt,
      barcode: nmBarcode.trim() || undefined
    };
    setNewMeds(prev => ({ ...prev, [tempId]: draft }));
    setSelectedItems(prev => [...prev, { medicationId: tempId, qty: Number(nmQty) }]);

    // limpiar subform
    setNmBarcode("");
    setNmName("");
    setNmQty("");
    setNmUnit("tabletas");
    setNmExpiresAt("");
    setNmDosage("");
    setScanMode(false);
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.medicationId !== id));
    setNewMeds(prev => {
      const c = { ...prev };
      delete c[id];
      return c;
    });
  };

  // ---------- Guardar ----------
  const handleCreateEntry = async () => {
    if (selectedItems.length === 0) {
      alert("Agrega al menos un medicamento");
      return;
    }
    if ((entryType === "salida" || entryType === "caducidad") && !patientId) {
      alert("Selecciona un paciente");
      return;
    }

    // Validar fecha antes de crear
    if (entryType === "salida" && dueDate) {
      const error = validateDueDate(dueDate);
      if (error) {
        alert(error);
        return;
      }
    }

    try {
      let itemsToSend: SelectedItem[] = [...selectedItems];

      if (entryType === "entrada") {
        for (const it of itemsToSend) {
          if (it.medicationId.startsWith("new-")) {
            const draft = newMeds[it.medicationId];
            if (!draft) continue;
            const created = await api.addMed({
              name: draft.name,
              qty: 0,
              expiresAt: draft.expiresAt,
              unit: draft.unit,
              dosage: draft.dosage,
              barcode: draft.barcode,
              userId: user?.id
            } as any);
            it.medicationId = created.id;
          }
        }
      }

      const payload = {
        type: entryType,
        patientId: entryType === "entrada" ? WAREHOUSE_PATIENT_ID : patientId,
        items: itemsToSend,
        status: "completa",
        dueDate: entryType === "salida" && dueDate ? new Date(dueDate).toISOString() : undefined,
        comment: comment.trim() || undefined,
        userId: user?.id
      } as any;

      await api.addEntry(payload);
      alert(
        `${entryType === "entrada" ? "Entrada" : entryType === "salida" ? "Salida" : "Caducidad"} registrada correctamente`
      );
      resetForm();
      load();
    } catch (error) {
      console.error(error);
      alert("Error al registrar el movimiento");
    }
  };

  const entryTitle = (t: "entrada" | "salida" | "caducidad") =>
    t === "entrada"
      ? "ENTRADA DE ALMACÉN"
      : t === "salida"
      ? "SALIDA DE MEDICAMENTOS"
      : "REGISTRO DE CADUCIDAD";

  // escaneo con lector USB/BT (solo ENTRADA, sin dependencias)
  const startScan = () => {
    setScanMode(true);
    setNmBarcode("");
    setTimeout(() => scanInputRef.current?.focus(), 0);
  };

  const getTotalItems = (entry: EntryRequest) =>
    entry.items.reduce((sum, item) => sum + item.qty, 0);

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

            {entryType !== "entrada" ? (
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
            ) : (
              <Alert severity="info">
                Movimiento de <strong>Entrada</strong>: no requiere paciente (se registra a nombre de <em>Almacén</em>).
              </Alert>
            )}

            {entryType === "salida" && (
              <TextField
                label="Fecha para volver (opcional)"
                type="date"
                size="small"
                value={dueDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDueDate(newDate);
                  const error = validateDueDate(newDate);
                  setDueDateError(error);
                }}
                InputLabelProps={{ shrink: true }}
                fullWidth
                error={!!dueDateError}
                helperText={dueDateError || "Próxima fecha estimada para entregar medicamentos"}
                inputProps={{
                  max: selectedItems.length > 0 
                    ? (() => {
                        // Encontrar la fecha de caducidad más temprana
                        const dates = selectedItems
                          .map(item => item.fechaCaducidad)
                          .filter((date): date is string => !!date)
                          .map(date => new Date(date));
                        if (dates.length > 0) {
                          const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                          minDate.setDate(minDate.getDate() - 1); // Un día antes de la caducidad
                          return minDate.toISOString().split('T')[0];
                        }
                        return undefined;
                      })()
                    : undefined
                }}
              />
            )}

            <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
              Medicamentos
            </Typography>

            {/* Lista de items */}
            {selectedItems.length > 0 && (
              <Stack spacing={1}>
                {selectedItems.map(item => {
                  const med = item.medicationId.startsWith("new-")
                    ? undefined
                    : getMedById.get(item.medicationId);
                  const label = item.medicationId.startsWith("new-")
                    ? (newMeds[item.medicationId]?.name || "Nuevo medicamento")
                    : (med?.name || "Desconocido");
                  const unit = med?.unit || (item.medicationId.startsWith("new-") ? newMeds[item.medicationId]?.unit : undefined);
                  return (
                    <Paper key={item.medicationId} sx={{ p: 1.5, bgcolor: "#f5f5f5" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Cantidad: {item.qty} {unit || "unidades"}
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
                        <IconButton size="small" color="error" onClick={() => handleRemoveItem(item.medicationId)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}

            {/* Sección para agregar items */}
            {entryType === "entrada" ? (
              <Paper sx={{ p: 2, bgcolor: "#fff3e6", border: "1px solid #f97316" }}>
                <Typography variant="body2" fontWeight={600} gutterBottom>
                  Agregar “Nuevo Medicamento” (Entrada)
                </Typography>

                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <TextField
                      label="Código de barras"
                      size="small"
                      value={nmBarcode}
                      onChange={(e) => setNmBarcode(e.target.value)}
                      fullWidth
                    />
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<QrCodeScannerIcon />}
                      onClick={startScan}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      Escanear con lector
                    </Button>
                  </Stack>

                  <input
                    ref={scanInputRef}
                    value={nmBarcode}
                    onChange={(e) => setNmBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setScanMode(false);
                        (document.getElementById("nm-name") as HTMLInputElement | null)?.focus();
                      }
                    }}
                    aria-hidden
                    style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
                  />
                  {scanMode && (
                    <Typography variant="caption" color="text.secondary">
                      Modo escaneo activo: apunta el lector y presiona Enter para terminar.
                    </Typography>
                  )}

                  <TextField
                    id="nm-name"
                    label="Nombre *"
                    size="small"
                    value={nmName}
                    onChange={(e) => setNmName(e.target.value)}
                    fullWidth
                  />

                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      label="Cantidad *"
                      type="number"
                      size="small"
                      value={nmQty}
                      onChange={(e) => setNmQty(e.target.value)}
                      inputProps={{ min: 1 }}
                      fullWidth
                    />
                    <TextField
                      label="Unidad *"
                      select
                      size="small"
                      value={nmUnit}
                      onChange={(e) => setNmUnit(e.target.value)}
                      fullWidth
                    >
                      <MenuItem value="tabletas">Tabletas</MenuItem>
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
                    value={nmExpiresAt}
                    onChange={(e) => setNmExpiresAt(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />

                  <TextField
                    label="Dosis recomendada"
                    size="small"
                    value={nmDosage}
                    onChange={(e) => setNmDosage(e.target.value)}
                    fullWidth
                  />

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={addItemEntradaNuevo}
                    disabled={!nmName || !nmQty || !nmExpiresAt}
                  >
                    Agregar
                  </Button>
                </Stack>
              </Paper>
            ) : (
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
                    {medications.map(med => (
                      <MenuItem key={med.id} value={med.id}>
                        {med.name} - Disponible: {med.qty} {med.unit || ""}
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
            )}

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
                disabled={(entryType !== "entrada" && !patientId) || selectedItems.length === 0}
                fullWidth
              >
                Guardar Registro
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
        {loading ? "Cargando..." : `Mostrando ${filteredEntries.length} de ${entries.length} registros`}
      </Typography>

      {loading && entries.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Cargando registros, por favor espere...
        </Alert>
      ) : (
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
              <td style={{ padding: 8, fontWeight: 600 }}>
                {getPatientName(entry.patientId)}
              </td>
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
              <td style={{ padding: 8, fontSize: 12 }}>
                {new Date(entry.createdAt).toLocaleDateString()}
              </td>
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
      )}

      {!loading && filteredEntries.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No se encontraron registros.
        </Alert>
      )}

      {/* Vista previa + impresión */}
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
                    const label = med?.name || "Medicamento";
                    return (
                      <tr key={index} style={{ borderBottom: "1px solid #ccc" }}>
                        <td style={{ padding: 8 }}>{label}</td>
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
                    <p><strong>Paciente:</strong> ${getPatientName(printEntry.patientId)}</p>
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
                        const medName = med?.name || "Medicamento";
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
