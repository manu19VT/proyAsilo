import { useEffect, useMemo, useState, useRef } from "react";
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
  IconButton,
  FormControl,
  InputLabel,
  Select
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

type TypeFilter = "entrada" | "salida" | "caducidad";

interface SelectedItem {
  medicationId: string;
  qty: number;
  dosisRecomendada?: string;
  frecuencia?: string;
  fechaCaducidad?: string;
  unit?: string; // Para entradas: unidades del medicamento
  medicationName?: string; // Para entradas: nombre del medicamento nuevo
  barcode?: string; // Para entradas: código de barras del medicamento
}

export default function EntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<EntryRequest[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<EntryRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("entrada");
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
  const [itemUnit, setItemUnit] = useState(""); // Para entradas: unidades del medicamento
  const [itemFechaCaducidad, setItemFechaCaducidad] = useState(""); // Para entradas: fecha de caducidad

  const [printEntry, setPrintEntry] = useState<EntryRequest | null>(null);

  // === NUEVO: buscador local para el combo de medicamentos ===
  const [searchMedQuery, setSearchMedQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const [manualMedName, setManualMedName] = useState(""); // Para entrada cuando no se encuentra el medicamento
  const [scannedBarcode, setScannedBarcode] = useState(""); // Guardar el código de barras escaneado
  const [medicationsByBarcode, setMedicationsByBarcode] = useState<Medication[]>([]); // Medicamentos encontrados por código de barras
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const load = async () => {
    try {
      const [entryData, patientsData, medsData] = await Promise.all([
        api.listEntries({ type: typeFilter as any }),
        api.listPatients({ status: "activo" }),
        api.listMeds()
      ]);
      setEntries(entryData);
      
      // Aplicar filtro de folio si hay búsqueda
      applyFilters(entryData);
      
      setPatients(patientsData);
      setMedications(medsData);
    } catch (error) {
      console.error(error);
      alert("Error al cargar registros");
    }
  };

  // Función para aplicar filtros (folio es independiente del tipo)
  const applyFilters = (entryList: EntryRequest[]) => {
    let filtered = entryList;

    // Filtro por folio (independiente del tipo)
    if (searchFolio.trim()) {
      const q = searchFolio.trim().toLowerCase();
      filtered = filtered.filter(entry => entry.folio.toLowerCase().includes(q));
    }

    setFilteredEntries(filtered);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  useEffect(() => {
    // Aplicar filtro de folio cuando cambia (independiente del tipo)
    applyFilters(entries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setItemUnit("");
    setItemFechaCaducidad("");
    setSearchMedQuery("");
    setBarcodeInput("");
    setScannedBarcode("");
    setBarcodeError("");
    setManualMedName("");
    setMedicationsByBarcode([]);
    setShowForm(false);
  };


  const getMedById = useMemo(
    () => new Map(medications.map(m => [m.id, m] as const)),
    [medications]
  );

  // Función para buscar medicamento por código de barras (retorna el primero encontrado)
  const findMedicationByBarcode = (barcode: string): Medication | null => {
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) return null;
    return medications.find(m => m.barcode?.toLowerCase() === trimmedBarcode.toLowerCase()) || null;
  };

  // Función para buscar TODOS los medicamentos por código de barras (con stock > 0)
  const findAllMedicationsByBarcode = (barcode: string): Medication[] => {
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) return [];
    return medications.filter(m => 
      m.barcode?.toLowerCase() === trimmedBarcode.toLowerCase() && 
      m.qty > 0 // Solo los que tienen stock disponible
    );
  };

  // Función para determinar el estado de caducidad de un medicamento
  const getExpirationStatus = (expiresAt?: string): { status: "vigente" | "proximo" | "caducado"; label: string; color: string } => {
    if (!expiresAt) return { status: "vigente", label: "", color: "" };
    
    const expirationDate = new Date(expiresAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);
    
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: "caducado", label: "Caducado", color: "#dc2626" }; // Rojo
    } else if (diffDays <= 90) {
      return { status: "proximo", label: "Próximo a caducar", color: "#f97316" }; // Naranja
    } else {
      return { status: "vigente", label: "", color: "" };
    }
  };

  // Función para auto-rellenar campos cuando se encuentra un medicamento por código de barras
  const handleBarcodeScan = (barcode: string) => {
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) {
      setBarcodeError("");
      return;
    }
    
    console.log("Procesando código de barras:", trimmedBarcode); // Debug
    
    // Para salidas: buscar TODOS los medicamentos con ese código (con stock > 0)
    if (entryType === "salida") {
      const medsFound = findAllMedicationsByBarcode(trimmedBarcode);
      if (medsFound.length > 0) {
        console.log(`Encontrados ${medsFound.length} medicamento(s) con código ${trimmedBarcode}`);
        setMedicationsByBarcode(medsFound);
        setBarcodeError(""); // Limpiar error
        setManualMedName(""); // Limpiar nombre manual
        setScannedBarcode(trimmedBarcode);
        
        // Si hay solo uno, seleccionarlo automáticamente
        if (medsFound.length === 1) {
          const med = medsFound[0];
          setSelectedMedId(med.id);
          setItemQty("1");
          if (med.dosage) {
            setItemDosis(med.dosage);
          }
        } else {
          // Si hay múltiples, dejar que el usuario seleccione
          setSelectedMedId("");
          setItemQty("1");
        }
        // NO limpiar el campo de código de barras
        return;
      } else {
        // No se encontraron medicamentos con stock
        setMedicationsByBarcode([]);
        setBarcodeError("Medicamento no encontrado o sin stock disponible. Verifica el código de barras.");
        setSelectedMedId("");
        return;
      }
    }
    
    // Para caducidad: buscar TODOS los medicamentos con ese código (con stock > 0)
    if (entryType === "caducidad") {
      const medsFound = findAllMedicationsByBarcode(trimmedBarcode);
      if (medsFound.length > 0) {
        console.log(`Encontrados ${medsFound.length} medicamento(s) con código ${trimmedBarcode}`);
        setMedicationsByBarcode(medsFound);
        setBarcodeError(""); // Limpiar error
        setManualMedName(""); // Limpiar nombre manual
        setScannedBarcode(trimmedBarcode);
        
        // Si hay solo uno, seleccionarlo automáticamente
        if (medsFound.length === 1) {
          const med = medsFound[0];
          setSelectedMedId(med.id);
          setItemQty("1");
        } else {
          // Si hay múltiples, dejar que el usuario seleccione
          setSelectedMedId("");
          setItemQty("1");
        }
        // NO limpiar el campo de código de barras
        return;
      } else {
        // No se encontraron medicamentos con stock
        setMedicationsByBarcode([]);
        setBarcodeError("Medicamento no encontrado o sin stock disponible. Verifica el código de barras.");
        setSelectedMedId("");
        return;
      }
    }
    
    // Para entradas: comportamiento original (buscar solo el primero)
    const med = findMedicationByBarcode(trimmedBarcode);
    if (med) {
      console.log("Medicamento encontrado:", med.name); // Debug
      setSelectedMedId(med.id);
      setSearchMedQuery(""); // Limpiar búsqueda de texto
      setBarcodeError(""); // Limpiar error
      setManualMedName(""); // Limpiar nombre manual
      // Guardar el código de barras escaneado para usarlo al agregar el item
      setScannedBarcode(trimmedBarcode);
      
      // Auto-rellenar según el tipo de entrada
      if (entryType === "entrada") {
        // Para entradas: medicamento, cantidad (1 por defecto), unidades y fecha de caducidad
        setItemQty("1");
        if (med.unit) {
          setItemUnit(med.unit);
        }
        if (med.expiresAt) {
          // Convertir la fecha de caducidad al formato YYYY-MM-DD para el input type="date"
          const expiresDate = new Date(med.expiresAt);
          const year = expiresDate.getFullYear();
          const month = String(expiresDate.getMonth() + 1).padStart(2, '0');
          const day = String(expiresDate.getDate()).padStart(2, '0');
          setItemFechaCaducidad(`${year}-${month}-${day}`);
        }
      }
      
      // NO limpiar el campo de código de barras para que el usuario vea que se escaneó correctamente
      // El campo se limpiará cuando se agregue el item o se cancele el formulario
    } else {
      console.log("Medicamento no encontrado para código:", trimmedBarcode); // Debug
      
      // Solo para entradas (caducidad ya se manejó arriba)
      if (entryType === "entrada") {
        // Para entrada: no mostrar error, permitir escribir manualmente
        setBarcodeError(""); // No mostrar error en entradas
        setSelectedMedId("");
        // Guardar el código de barras escaneado para usarlo al agregar el item
        setScannedBarcode(trimmedBarcode);
        // El usuario puede escribir el nombre manualmente
      }
    }
  };

  // Efecto para auto-enfocar el campo de código de barras cuando se muestra el formulario
  useEffect(() => {
    if (showForm) {
      // Delay más largo para asegurar que el campo esté completamente renderizado
      const timer = setTimeout(() => {
        // Buscar el input interno del TextField
        const inputElement = barcodeInputRef.current?.querySelector('input') as HTMLInputElement;
        if (inputElement) {
          // Enfocar y seleccionar el input
          inputElement.focus();
          inputElement.select();
          // Forzar el foco incluso si hay otros elementos
          setTimeout(() => {
            inputElement.focus();
          }, 50);
        } else if (barcodeInputRef.current) {
          // Fallback: intentar enfocar el contenedor
          barcodeInputRef.current.focus();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showForm, entryType]);

  // Manejar entrada de código de barras (detectar escaneo rápido)
  const handleBarcodeInputChange = (value: string) => {
    setBarcodeInput(value);
    
    // Limpiar timeout anterior
    if (barcodeTimeoutRef.current) {
      clearTimeout(barcodeTimeoutRef.current);
    }
    
    // Limpiar búsqueda de texto cuando se escribe código de barras
    if (value.trim()) {
      setSearchMedQuery("");
    }
    
    // Si el valor tiene más de 8 caracteres (típico de códigos de barras)
    // Los escáneres USB suelen escribir muy rápido y terminan con Enter
    // Esperamos un momento para ver si el escáner sigue escribiendo
    if (value.length >= 8) {
      barcodeTimeoutRef.current = setTimeout(() => {
        // Si después de 150ms no hay más cambios, asumir que el escaneo terminó
        handleBarcodeScan(value);
      }, 150);
    }
  };

  // Listener global para detectar entrada rápida (típica de escáneres)
  useEffect(() => {
    if (!showForm) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el usuario está escribiendo en otro campo, ignorar
      const activeElement = document.activeElement;
      const barcodeInputElement = barcodeInputRef.current?.querySelector('input');
      
      if (activeElement && activeElement.tagName === 'INPUT' && activeElement !== barcodeInputElement) {
        return;
      }

      // Si se presiona una tecla y el campo de código de barras no tiene foco, enfocarlo
      if (barcodeInputElement && document.activeElement !== barcodeInputElement) {
        barcodeInputElement.focus();
      }
    };

    // Agregar listener cuando se muestra el formulario
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showForm]);

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
    // Validaciones según el tipo
    if (entryType === "salida" || entryType === "caducidad") {
      // Salida y caducidad: requieren medicamento seleccionado por código de barras
      if (!selectedMedId || !itemQty || Number(itemQty) <= 0) {
        alert("Escanea un código de barras válido y completa la cantidad");
        return;
      }
    } else if (entryType === "entrada") {
      // Entrada: puede ser medicamento seleccionado o nombre manual
      if ((!selectedMedId && !manualMedName.trim()) || !itemQty || Number(itemQty) <= 0) {
        alert("Selecciona un medicamento por código de barras o escribe el nombre manualmente, y completa la cantidad");
        return;
      }
    }

    // Para entrada con nombre manual, necesitamos crear un medicamento temporal
    let med: Medication | null = null;
    if (selectedMedId) {
      med = getMedById.get(selectedMedId) || null;
      if (!med) {
        alert("Medicamento no encontrado");
        return;
      }
    } else if (entryType === "entrada" && manualMedName.trim()) {
      // Crear un objeto temporal para el medicamento nuevo
      med = {
        id: `temp-${Date.now()}`,
        name: manualMedName.trim(),
        qty: Number(itemQty),
        expiresAt: new Date().toISOString(),
        unit: itemUnit.trim() || "",
        dosage: ""
      };
    } else {
      alert("Debe seleccionar o escribir un medicamento");
      return;
    }

    if (entryType === "salida" && med.id && med.id.startsWith("temp-") === false) {
      // Solo validar cantidad disponible si es un medicamento existente (no temporal)
      if (Number(itemQty) > med.qty) {
        alert(`Solo hay ${med.qty} ${med.unit || "unidades"} disponibles`);
        return;
      }
    }

    if (entryType === "salida" && (!itemDosis.trim() || !itemFrecuencia.trim())) {
      alert("Para salidas, debes completar la dosis recomendada y la frecuencia");
      return;
    }

    // Para entrada con medicamento nuevo, usar el nombre como ID temporal
    const medicationIdToUse = selectedMedId || (med.id || `temp-${Date.now()}`);
    
    if (selectedItems.some(i => i.medicationId === medicationIdToUse)) {
      alert("Este medicamento ya está agregado");
      return;
    }

    const newItem: SelectedItem = {
      medicationId: medicationIdToUse,
      qty: Number(itemQty)
    };
    
    // Si es entrada, agregar unidades, nombre (siempre), código de barras y fecha de caducidad
    if (entryType === "entrada") {
      newItem.unit = itemUnit.trim() || (med?.unit || "");
      // Siempre guardar el nombre del medicamento para entradas (para mantener historial)
      if (med) {
        newItem.medicationName = med.name;
        // Priorizar el código de barras escaneado sobre el que tiene el medicamento
        newItem.barcode = scannedBarcode || barcodeInput.trim() || med.barcode || undefined;
      } else if (manualMedName.trim()) {
        newItem.medicationName = manualMedName.trim();
        // Si hay código de barras ingresado pero el medicamento no existe, guardarlo
        newItem.barcode = scannedBarcode || barcodeInput.trim() || undefined;
      }
      if (itemFechaCaducidad) {
        // Convertir fecha de formato YYYY-MM-DD a ISO string
        const fechaDate = new Date(itemFechaCaducidad + 'T00:00:00');
        newItem.fechaCaducidad = fechaDate.toISOString();
      } else if (med?.expiresAt) {
        newItem.fechaCaducidad = med.expiresAt;
      }
    }

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
    setItemUnit("");
    setItemFechaCaducidad("");
    setManualMedName("");
    setBarcodeInput("");
    setScannedBarcode(""); // Limpiar el código de barras guardado
    setBarcodeError("");
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.medicationId !== id));
  };

  const handleCreateEntry = async () => {
    // Validaciones según el tipo
    if (entryType === "salida") {
      // Salida: requiere paciente y al menos un medicamento
      if (!patientId || selectedItems.length === 0) {
        alert("Selecciona un paciente y al menos un medicamento");
        return;
      }
    } else if (entryType === "caducidad") {
      // Caducidad: solo requiere al menos un medicamento (NO requiere paciente)
      if (selectedItems.length === 0) {
        alert("Agrega al menos un medicamento");
        return;
      }
    } else if (entryType === "entrada") {
      // Entrada: solo requiere al menos un medicamento
      if (selectedItems.length === 0) {
        alert("Agrega al menos un medicamento");
        return;
      }
    }

    try {
      const payload: any = {
        type: entryType,
        items: selectedItems,
        status: "completa" as const,
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
        patientId: payload.patientId,
        items: payload.items.map((item: any) => ({
          medicationId: item.medicationId,
          qty: item.qty,
          medicationName: item.medicationName,
          unit: item.unit,
          fechaCaducidad: item.fechaCaducidad,
          barcode: item.barcode
        }))
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

  const getPatientName = (id: string | undefined) => {
    if (!id) return "Desconocido";
    return patients.find(p => p.id === id)?.name || "Desconocido";
  };

  const getMedicationLabel = (item: SelectedItem) => {
    // Si el item tiene medicationName (medicamento nuevo), usarlo
    if (item.medicationName) {
      return `${item.medicationName}${item.unit ? ` (${item.unit})` : ""}`;
    }
    // Si no, buscar en la lista de medicamentos
    const med = getMedById.get(item.medicationId);
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
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Filtrar por tipo:</Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por tipo</InputLabel>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              label="Filtrar por tipo"
            >
              <MenuItem value="entrada">Entradas</MenuItem>
              <MenuItem value="salida">Salidas</MenuItem>
              <MenuItem value="caducidad">Caducidad</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Buscar por folio:</Typography>
          <TextField
            size="small"
            placeholder="Buscar folio..."
            value={searchFolio}
            onChange={(e) => setSearchFolio(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
            }}
          />
        </Stack>
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

            {/* Paciente: visible solo para salida (caducidad NO requiere paciente) */}
            {entryType === "salida" && (
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
                  // Obtener el nombre del medicamento (puede ser nuevo o existente)
                  const medicationName = item.medicationName || med?.name || "Desconocido";
                  const medicationUnit = item.unit || med?.unit || "unidades";
                  
                  return (
                    <Paper key={item.medicationId} sx={{ p: 1.5, bgcolor: "#f5f5f5" }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {medicationName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Cantidad: {item.qty} {medicationUnit}
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

                          {(entryType === "salida" || entryType === "caducidad" || entryType === "entrada") && item.fechaCaducidad && (
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

              {/* Campo para registrar código de barras (todos los tipos) */}
              <TextField
                inputRef={barcodeInputRef}
                label="Registrar código de barras"
                size="small"
                fullWidth
                sx={{ mb: 1.5 }}
                value={barcodeInput}
                onChange={(e) => {
                  handleBarcodeInputChange(e.target.value);
                }}
                onKeyDown={(e) => {
                  // Si presiona Enter (típico de escáneres USB), procesar inmediatamente
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (barcodeTimeoutRef.current) {
                      clearTimeout(barcodeTimeoutRef.current);
                    }
                    // Procesar el código actual en el campo
                    const currentValue = (e.target as HTMLInputElement).value || barcodeInput;
                    if (currentValue.trim()) {
                      handleBarcodeScan(currentValue.trim());
                    }
                  }
                }}
                onFocus={(e) => {
                  // Asegurar que el input interno tenga el foco
                  const input = e.target as HTMLInputElement;
                  if (input) {
                    input.select();
                  }
                }}
                placeholder="Escanear o escribir código de barras manualmente..."
                autoFocus
                tabIndex={1} // Prioridad en el tab order
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                  // Asegurar que el input esté listo para recibir el escaneo
                  onFocus: (e) => {
                    const input = e.target as HTMLInputElement;
                    if (input) {
                      input.select();
                    }
                  }
                }}
                helperText={
                  entryType === "salida" 
                    ? "Escanea el código de barras o escríbelo manualmente. Se auto-rellenarán: medicamento, cantidad, dosis recomendada y cada cuándo tomar."
                    : entryType === "caducidad"
                    ? "Escanea el código de barras o escríbelo manualmente. Se auto-rellenará el medicamento."
                    : "Escanea el código de barras o escríbelo manualmente. Se auto-rellenará el medicamento y la cantidad."
                }
                error={!!barcodeError}
              />
              
              {/* Mensaje de error cuando no se encuentra el medicamento (solo para salida y caducidad) */}
              {barcodeError && entryType !== "entrada" && (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  {barcodeError}
                </Alert>
              )}


              <Stack spacing={1.5}>
                {/* Campo de medicamento según el tipo */}
                {entryType === "salida" ? (
                  // Salida: Select con todos los medicamentos encontrados por código de barras (con stock > 0)
                  <TextField
                    label="Medicamento *"
                    select
                    size="small"
                    value={selectedMedId}
                    onChange={(e) => {
                      const medId = e.target.value;
                      setSelectedMedId(medId);
                      setBarcodeError("");
                      const med = getMedById.get(medId);
                      if (med) {
                        setItemQty("1");
                        if (med.dosage) {
                          setItemDosis(med.dosage);
                        }
                      }
                    }}
                    fullWidth
                    disabled={medicationsByBarcode.length === 0}
                    required
                    helperText={
                      medicationsByBarcode.length === 0
                        ? "Escanea un código de barras para ver medicamentos disponibles"
                        : medicationsByBarcode.length === 1
                        ? "Medicamento seleccionado automáticamente"
                        : `Selecciona uno de los ${medicationsByBarcode.length} medicamentos disponibles con este código`
                    }
                  >
                    {medicationsByBarcode.length === 0 ? (
                      <MenuItem value="" disabled>
                        Escanea un código de barras para ver medicamentos
                      </MenuItem>
                    ) : (
                      medicationsByBarcode.map((med) => (
                        <MenuItem key={med.id} value={med.id}>
                          <Stack direction="row" justifyContent="space-between" width="100%" spacing={2}>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {med.name}
                              </Typography>
                              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                {med.expiresAt && (
                                  <Typography variant="caption" color="text.secondary">
                                    Cad: {new Date(med.expiresAt).toLocaleDateString()}
                                  </Typography>
                                )}
                                {med.unit && (
                                  <Typography variant="caption" color="text.secondary">
                                    • {med.unit}
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                            <Typography variant="body2" sx={{ color: "#f97316", fontWeight: 600 }}>
                              Stock: {med.qty}
                            </Typography>
                          </Stack>
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                ) : entryType === "entrada" ? (
                  // Entrada: TextField editable para escribir manualmente si no se encuentra
                  <TextField
                    label="Medicamento"
                    size="small"
                    value={selectedMedId ? (getMedById.get(selectedMedId)?.name || "") : manualMedName}
                    onChange={(e) => {
                      if (selectedMedId) {
                        // Si hay un medicamento seleccionado, no permitir editar
                        return;
                      }
                      setManualMedName(e.target.value);
                      setBarcodeError(""); // Limpiar error al escribir
                    }}
                    fullWidth
                    disabled={!!selectedMedId}
                    helperText={selectedMedId ? "Medicamento seleccionado automáticamente por código de barras" : "Escribe el nombre del medicamento manualmente si no se encontró por código de barras"}
                    placeholder="Nombre del medicamento"
                  />
                ) : (
                  // Caducidad: Select con todos los medicamentos encontrados por código de barras (con stock > 0)
                  <TextField
                    label="Medicamento *"
                    select
                    size="small"
                    value={selectedMedId}
                    onChange={(e) => {
                      const medId = e.target.value;
                      setSelectedMedId(medId);
                      setBarcodeError("");
                      setItemQty("1");
                    }}
                    fullWidth
                    disabled={medicationsByBarcode.length === 0}
                    required
                    helperText={
                      medicationsByBarcode.length === 0
                        ? "Escanea un código de barras para ver medicamentos disponibles"
                        : medicationsByBarcode.length === 1
                        ? "Medicamento seleccionado automáticamente"
                        : `Selecciona uno de los ${medicationsByBarcode.length} medicamentos disponibles con este código`
                    }
                  >
                    {medicationsByBarcode.length === 0 ? (
                      <MenuItem value="" disabled>
                        Escanea un código de barras para ver medicamentos
                      </MenuItem>
                    ) : (
                      medicationsByBarcode.map((med) => {
                        const expirationStatus = getExpirationStatus(med.expiresAt);
                        return (
                          <MenuItem key={med.id} value={med.id}>
                            <Stack direction="row" justifyContent="space-between" width="100%" spacing={2}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  {med.name}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center">
                                  {med.expiresAt && (
                                    <Typography variant="caption" color="text.secondary">
                                      Cad: {new Date(med.expiresAt).toLocaleDateString()}
                                    </Typography>
                                  )}
                                  {med.unit && (
                                    <Typography variant="caption" color="text.secondary">
                                      • {med.unit}
                                    </Typography>
                                  )}
                                  {expirationStatus.label && (
                                    <Chip
                                      label={expirationStatus.label}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.65rem',
                                        bgcolor: expirationStatus.color,
                                        color: 'white',
                                        fontWeight: 600
                                      }}
                                    />
                                  )}
                                </Stack>
                              </Box>
                              <Typography variant="body2" sx={{ color: "#f97316", fontWeight: 600 }}>
                                Stock: {med.qty}
                              </Typography>
                            </Stack>
                          </MenuItem>
                        );
                      })
                    )}
                  </TextField>
                )}

                <TextField
                  label="Cantidad"
                  type="number"
                  size="small"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  fullWidth
                  inputProps={{ min: 1 }}
                />

                {entryType === "entrada" && (
                  <>
                    <TextField
                      label="Unidades"
                      size="small"
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                      fullWidth
                      placeholder="Ej: cápsulas, tabletas, ml, etc."
                      helperText={selectedMedId && getMedById.get(selectedMedId)?.unit 
                        ? `Unidad del medicamento: ${getMedById.get(selectedMedId)?.unit}`
                        : "Especifica las unidades del medicamento"}
                    />
                    <TextField
                      label="Fecha de caducidad"
                      type="date"
                      size="small"
                      value={itemFechaCaducidad}
                      onChange={(e) => setItemFechaCaducidad(e.target.value)}
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                      helperText={selectedMedId && getMedById.get(selectedMedId)?.expiresAt 
                        ? `Caducidad del medicamento: ${new Date(getMedById.get(selectedMedId)?.expiresAt || "").toLocaleDateString()}`
                        : "Especifica la fecha de caducidad del medicamento"}
                    />
                  </>
                )}

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
                    entryType === "salida" && (!selectedMedId || !itemQty || (!itemDosis.trim() || !itemFrecuencia.trim())) ||
                    entryType === "caducidad" && (!selectedMedId || !itemQty) ||
                    entryType === "entrada" && ((!selectedMedId && !manualMedName.trim()) || !itemQty)
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

      {/* Headers dinámicos según el tipo de filtro */}
      {typeFilter === "salida" && (
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
                  <Chip label="Salida" color="primary" size="small" icon={<ShippingIcon />} />
                </td>
                <td style={{ padding: 8, fontWeight: 600 }}>
                  {entry.type === "salida" ? getPatientName(entry.patientId) : "-"}
                </td>
                <td style={{ padding: 8 }}>
                  <Stack spacing={0.5}>
                    {entry.items.slice(0, 2).map((item, index) => {
                      const med = getMedById.get(item.medicationId);
                      const medName = item.medicationName || med?.name || "Desconocido";
                      const medUnit = item.unit || med?.unit || "";
                      return (
                        <Typography key={index} variant="caption" display="block">
                          • {medName}{medUnit ? ` (${medUnit})` : ""}: {item.qty}
                        </Typography>
                      );
                    })}
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

      {typeFilter === "entrada" && (
        <Table headers={["Folio", "Tipo", "Items", "Total", "Fecha", "Estado", "Acciones"]}>
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
                  <Chip label="Entrada" color="info" size="small" icon={<InventoryIcon />} />
                </td>
                <td style={{ padding: 8 }}>
                  <Stack spacing={0.5}>
                    {entry.items.slice(0, 2).map((item, index) => {
                      const med = getMedById.get(item.medicationId);
                      const medName = item.medicationName || med?.name || "Desconocido";
                      const medUnit = item.unit || med?.unit || "";
                      return (
                        <Typography key={index} variant="caption" display="block">
                          • {medName}{medUnit ? ` (${medUnit})` : ""}: {item.qty}
                        </Typography>
                      );
                    })}
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

      {typeFilter === "caducidad" && (
        <Table headers={["Folio", "Tipo", "Items", "Total", "Fecha", "Estado", "Acciones"]}>
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
                  <Chip label="Caducidad" color="error" size="small" icon={<WarningIcon />} />
                </td>
                <td style={{ padding: 8 }}>
                  <Stack spacing={0.5}>
                    {entry.items.slice(0, 2).map((item, index) => {
                      const med = getMedById.get(item.medicationId);
                      const medName = item.medicationName || med?.name || "Desconocido";
                      const medUnit = item.unit || med?.unit || "";
                      return (
                        <Typography key={index} variant="caption" display="block">
                          • {medName}{medUnit ? ` (${medUnit})` : ""}: {item.qty}
                        </Typography>
                      );
                    })}
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
                    {printEntry.type === "entrada" && (
                      <th style={{ padding: 8, textAlign: "left" }}>Caducidad</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {printEntry.items.map((item, index) => {
                    const med = getMedById.get(item.medicationId);
                    const medName = item.medicationName || med?.name || "Desconocido";
                    const medUnit = item.unit || med?.unit || "";
                    return (
                      <tr key={index} style={{ borderBottom: "1px solid #ccc" }}>
                        <td style={{ padding: 8 }}>{medName}{medUnit ? ` (${medUnit})` : ""}</td>
                        <td style={{ padding: 8, textAlign: "right" }}>
                          {item.qty}
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
                        {printEntry.type === "entrada" && (
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
                    {printEntry.type === "entrada" && <td></td>}
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
                        ` : printEntry.type === "entrada" ? `
                          <th style="padding: 8px; text-align: left;">Caducidad</th>
                        ` : ""}
                      </tr>
                    </thead>
                    <tbody>
                      ${printEntry.items.map(item => {
                        const med = getMedById.get(item.medicationId);
                        const medName = item.medicationName || med?.name || "Desconocido";
                        const medUnit = item.unit || med?.unit || "";
                        const cad = item.fechaCaducidad ? new Date(item.fechaCaducidad).toLocaleDateString() : "-";
                        return `
                          <tr style="border-bottom: 1px solid #ccc;">
                            <td style="padding: 8px;">${medName}${medUnit ? ` (${medUnit})` : ""}</td>
                            <td style="padding: 8px; text-align: right;">${item.qty}</td>
                            ${printEntry.type === "salida" ? `
                              <td style="padding: 8px;">${item.dosisRecomendada || "-"}</td>
                              <td style="padding: 8px;">${item.frecuencia || "-"}</td>
                              <td style="padding: 8px;">${cad}</td>
                            ` : printEntry.type === "caducidad" ? `
                              <td style="padding: 8px;">${cad}</td>
                            ` : printEntry.type === "entrada" ? `
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
                        ${printEntry.type === "salida" ? `<td colspan="3"></td>` : printEntry.type === "caducidad" ? `<td></td>` : printEntry.type === "entrada" ? `<td></td>` : ""}
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
