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
  Box
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  QrCodeScanner as QrCodeScannerIcon
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import Page from "../components/Page";
import { Table } from "../components/Table";
import { api } from "../api/client";
import { Medication } from "../types";
import { useAuth } from "../contexts/AuthContext";

export default function MedsPage() {
  const { user } = useAuth();

  const [items, setItems] = useState<Medication[]>([]);
  const [filteredItems, setFilteredItems] = useState<Medication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [unit, setUnit] = useState("tabletas");
  const [dosage, setDosage] = useState("");

  const [scanMode, setScanMode] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const isExpired = useMemo(
    () => (date: string) => {
      const expiry = new Date(date);
      const now = new Date();
      // Resetear horas para comparar solo fechas
      expiry.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      return expiry <= now;
    },
    []
  );

  const isExpiringSoon = useMemo(
    () => (date: string) => {
      const expiry = new Date(date);
      const now = new Date();
      const threeMonthsFromNow = new Date(now);
      threeMonthsFromNow.setMonth(now.getMonth() + 3);
      return expiry >= now && expiry <= threeMonthsFromNow;
    },
    []
  );

  const getExpiryChip = (date: string) => {
    if (isExpired(date)) {
      return <Chip label="CADUCADO" color="error" size="small" icon={<WarningIcon />} />;
    }
    if (isExpiringSoon(date)) {
      return <Chip label="Por caducar" color="warning" size="small" icon={<WarningIcon />} />;
    }
    return <Chip label="Vigente" color="success" size="small" />;
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const medications = await api.listMeds();
      setItems(medications);
      setFilteredItems(medications);
    } catch (error: any) {
      console.error("Error al cargar medicamentos:", error);
      const errorMessage = error?.message || "Error desconocido al cargar los medicamentos";
      setError(`Error al cargar los medicamentos: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFilteredItems(items);
      return;
    }
    setFilteredItems(
      items.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.unit?.toLowerCase().includes(q) ||
        m.dosage?.toLowerCase().includes(q) ||
        m.barcode?.toLowerCase().includes(q)
      )
    );
  }, [items, searchQuery]);

  const resetForm = () => {
    setBarcode("");
    setName("");
    setQty("");
    setExpiresAt("");
    setUnit("tabletas");
    setDosage("");
    setShowForm(false);
    setScanMode(false);
  };

  const handleAddMedication = async () => {
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
        dosage: dosage.trim() || undefined,
        barcode: barcode.trim() || undefined,
        userId: user?.id
      } as any);
      resetForm();
      load();
    } catch (error) {
      console.error(error);
      alert("Error al agregar medicamento");
    }
  };

  const expiredCount = items.filter(m => isExpired(m.expiresAt)).length;
  const expiringSoonCount = items.filter(m => !isExpired(m.expiresAt) && isExpiringSoon(m.expiresAt)).length;

  // --- escáner ---
  const startScan = () => {
    setScanMode(true);
    setBarcode("");
    setTimeout(() => scanInputRef.current?.focus(), 0);
  };

  const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setScanMode(false);
      (document.getElementById("med-name-input") as HTMLInputElement | null)?.focus();
    }
  };

  return (
    <Page>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Medicamentos</Typography>
        {canAddMedication && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancelar" : "Nuevo Medicamento"}
          </Button>
        )}
      </Stack>
      
      {!canAddMedication && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Solo administradores, doctores y enfermeras pueden agregar medicamentos.
        </Alert>
      )}

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

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Buscar medicamento</Typography>
        <TextField
          placeholder="Buscar por nombre, unidad, dosis o código de barras..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
          }}
        />
      </Paper>

      {showForm && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "#f7f0dc" }}>
          <Typography variant="h6" gutterBottom>Nuevo Medicamento</Typography>

          <Stack spacing={2}>
            {/* === Código de barras + botón a la derecha en el mismo renglón === */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                label="Código de barras"
                size="small"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                fullWidth
                placeholder="Escanéalo o escríbelo manualmente"
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

            {/* input oculto para el lector */}
            <input
              ref={scanInputRef}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={handleScanKeyDown}
              aria-hidden
              style={{
                position: "absolute",
                opacity: 0,
                height: 0,
                width: 0,
                pointerEvents: "none"
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {scanMode
                ? "Modo escaneo activo: apunta el lector al código y presiona Enter al finalizar."
                : "Tip: pulsa “Escanear con lector” para capturar con un lector USB/Bluetooth."}
            </Typography>

            <TextField
              id="med-name-input"
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
                onClick={handleAddMedication}
                disabled={!name.trim() || !qty || !expiresAt}
                fullWidth
              >
                Guardar Medicamento
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
        {loading ? "Cargando..." : `Mostrando ${filteredItems.length} de ${items.length} medicamentos`}
      </Typography>

      <Table headers={["Medicamento", "Cantidad", "Unidad", "Dosis", "Caducidad", "Estado", "Código"]}>
        <AnimatePresence initial={false}>
          {filteredItems.map(med => (
            <motion.tr
              key={med.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <td style={{ padding: 8, fontWeight: 600 }}>{med.name}</td>
              <td style={{ padding: 8 }}>{med.qty}</td>
              <td style={{ padding: 8 }}>{med.unit || "-"}</td>
              <td style={{ padding: 8, fontSize: 12 }}>{med.dosage || "-"}</td>
              <td style={{ padding: 8, fontSize: 12 }}>
                {new Date(med.expiresAt).toLocaleDateString()}
              </td>
              <td style={{ padding: 8 }}>{getExpiryChip(med.expiresAt)}</td>
              <td style={{ padding: 8, fontFamily: "monospace", fontSize: 12 }}>
                {med.barcode || "-"}
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </Table>
      )}

      {!loading && filteredItems.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No se encontraron medicamentos.
        </Alert>
      )}
    </Page>
  );
}
