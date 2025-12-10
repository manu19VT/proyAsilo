import { useEffect, useState, useMemo } from "react";
import {
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Menu,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import Page from "../components/Page";
import { Table } from "../components/Table";
import { api } from "../api/client";
import { PersonalObject, Patient } from "../types";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";

type FilterType = "objeto_az" | "propietario_az" | "fecha_registro";

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: "Objeto (A-Z)", value: "objeto_az" },
  { label: "Propietario (A-Z)", value: "propietario_az" },
  { label: "Fecha (Registro)", value: "fecha_registro" }
];

export default function ObjectsPage() {
  const [objects, setObjects] = useState<PersonalObject[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados para filtros y búsqueda
  const [filterType, setFilterType] = useState<FilterType>("objeto_az");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estados para menú contextual
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    object: PersonalObject | null;
  } | null>(null);
  
  // Estados para edición
  const [editingObject, setEditingObject] = useState<PersonalObject | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editPatientId, setEditPatientId] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  
  // Estados para eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [objectToDelete, setObjectToDelete] = useState<PersonalObject | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Filtrar y ordenar objetos
  const filteredObjects = useMemo(() => {
    let filtered = [...objects];

    // Aplicar búsqueda (independiente del filtro)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(obj => {
        const objectName = obj.name?.toLowerCase() || "";
        const patientName = obj.patientName?.toLowerCase() || "";
        const patientId = obj.patientId?.toLowerCase() || "";
        return objectName.includes(query) || 
               patientName.includes(query) || 
               patientId.includes(query);
      });
    }

    // Aplicar ordenamiento según el filtro seleccionado
    filtered.sort((a, b) => {
      switch (filterType) {
        case "objeto_az":
          return (a.name || "").localeCompare(b.name || "");
        case "propietario_az":
          return (a.patientName || "").localeCompare(b.patientName || "");
        case "fecha_registro":
          const dateA = a.receivedAt ? new Date(a.receivedAt).getTime() : 0;
          const dateB = b.receivedAt ? new Date(b.receivedAt).getTime() : 0;
          return dateB - dateA; // Más reciente primero
        default:
          return 0;
      }
    });

    return filtered;
  }, [objects, filterType, searchQuery]);

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

  // Funciones para menú contextual
  const handleRowClick = (event: React.MouseEvent, obj: PersonalObject) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            object: obj
          }
        : null
    );
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleContextMenuAction = (action: string, obj: PersonalObject) => {
    handleContextMenuClose();
    
    switch (action) {
      case 'edit':
        handleOpenEditDialog(obj);
        break;
      case 'delete':
        handleOpenDeleteDialog(obj);
        break;
    }
  };

  // Funciones para edición
  const handleOpenEditDialog = (obj: PersonalObject) => {
    setEditingObject(obj);
    setEditName(obj.name);
    setEditQty(obj.qty.toString());
    setEditPatientId(obj.patientId);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingObject(null);
    setEditName("");
    setEditQty("");
    setEditPatientId("");
  };

  const handleSaveEdit = async () => {
    if (!editingObject || !editName.trim() || !editQty.trim() || !editPatientId) {
      alert("Completa todos los campos requeridos");
      return;
    }
    const quantity = Number(editQty);
    if (Number.isNaN(quantity) || quantity <= 0) {
      alert("La cantidad debe ser un número mayor a 0");
      return;
    }

    try {
      setEditSaving(true);
      await api.updateObject(editingObject.id, {
        name: editName.trim(),
        qty: quantity,
        patientId: editPatientId
      });
      handleCloseEditDialog();
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el objeto personal");
    } finally {
      setEditSaving(false);
    }
  };

  // Funciones para eliminación
  const handleOpenDeleteDialog = (obj: PersonalObject) => {
    setObjectToDelete(obj);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setObjectToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!objectToDelete) return;

    try {
      setDeleteLoading(true);
      await api.deleteObject(objectToDelete.id);
      handleCloseDeleteDialog();
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar el objeto personal");
    } finally {
      setDeleteLoading(false);
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

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2" component="span">
          <strong>Para modificar o eliminar:</strong> Haz clic en la tabla sobre el objeto para abrir el menú de opciones.
        </Typography>
      </Alert>

      <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Registrar objeto personal
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom mb={2}>
          Asigna el objeto a un paciente activo para que aparezca en su ficha de detalles.
        </Typography>
        
        {/* Filtros y búsqueda */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por</InputLabel>
            <Select
              value={filterType}
              label="Filtrar por"
              onChange={(e) => setFilterType(e.target.value as FilterType)}
            >
              {FILTER_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Buscar"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por objeto, propietario o ID del paciente"
            fullWidth
          />
        </Stack>

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
        {loading ? "Cargando objetos..." : `Mostrando ${filteredObjects.length} de ${objects.length} objeto(s)`}
      </Typography>

      <Table headers={["Objeto", "Cantidad", "Propietario", "Registrado"]}>
        {filteredObjects.length > 0 ? (
          filteredObjects.map(obj => (
            <tr
              key={obj.id}
              onClick={(e) => handleRowClick(e, obj)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRowClick(e, obj);
              }}
              style={{ 
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
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
                {loading ? "Actualizando información..." : searchQuery.trim() ? "No se encontraron objetos que coincidan con la búsqueda." : "Aún no hay objetos registrados."}
              </Alert>
            </td>
          </tr>
        )}
      </Table>

      {/* Menú contextual para acciones del objeto */}
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
        {contextMenu?.object && (
          <>
            <MenuItem onClick={() => handleContextMenuAction('edit', contextMenu.object!)}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Modificar</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleContextMenuAction('delete', contextMenu.object!)}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Eliminar</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Diálogo de edición */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar objeto personal</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Puedes modificar el nombre, cantidad y propietario. La fecha de recepción se mantiene igual.
            </Alert>
            <TextField
              label="Nombre del objeto *"
              size="small"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Cantidad *"
              size="small"
              value={editQty}
              onChange={(e) => setEditQty(e.target.value)}
              type="number"
              inputProps={{ min: 1 }}
              fullWidth
            />
            <TextField
              label="Propietario (paciente activo) *"
              size="small"
              select
              value={editPatientId}
              onChange={(e) => setEditPatientId(e.target.value)}
              fullWidth
            >
              {patients.map(patient => (
                <MenuItem key={patient.id} value={patient.id}>
                  {patient.name} {patient.age ? `(${patient.age} años)` : ""}
                </MenuItem>
              ))}
            </TextField>
            {editingObject && (
              <Typography variant="caption" color="text.secondary">
                Fecha de recepción: {formatDate(editingObject.receivedAt)}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={editSaving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={editSaving || !editName.trim() || !editQty.trim() || !editPatientId}
          >
            {editSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Eliminar objeto personal"
        itemName={objectToDelete?.name || ""}
        itemType="Objeto personal"
        warningMessage="Esta acción marcará el objeto como eliminado. El registro se mantendrá en la base de datos y puede restaurarse si es necesario."
        details={objectToDelete ? [
          { label: "ID", value: objectToDelete.id },
          { label: "Nombre", value: objectToDelete.name },
          { label: "Cantidad", value: objectToDelete.qty.toString() },
          { label: "Propietario", value: objectToDelete.patientName || "No asignado" },
          { label: "Fecha de recepción", value: formatDate(objectToDelete.receivedAt) }
        ] : []}
        loading={deleteLoading}
      />
    </Page>
  );
}
