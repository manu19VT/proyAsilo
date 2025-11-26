import { useEffect, useState } from "react";
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
  Checkbox,
  FormControlLabel,
  Box,
  IconButton,
  Divider
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

export default function ObjectsPage() {
  const [objects, setObjects] = useState<PersonalObject[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados para el diálogo de selección
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set());
  
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

  // Funciones para el diálogo de selección
  const handleOpenSelectDialog = () => {
    setSelectDialogOpen(true);
    setSelectedObjects(new Set());
  };

  const handleCloseSelectDialog = () => {
    setSelectDialogOpen(false);
    setSelectedObjects(new Set());
  };

  const handleToggleObject = (objectId: string) => {
    const newSelected = new Set(selectedObjects);
    if (newSelected.has(objectId)) {
      newSelected.delete(objectId);
    } else {
      newSelected.add(objectId);
    }
    setSelectedObjects(newSelected);
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
      // Si había seleccionado este objeto, quitarlo de la selección
      const newSelected = new Set(selectedObjects);
      newSelected.delete(editingObject.id);
      setSelectedObjects(newSelected);
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
      // Si había seleccionado este objeto, quitarlo de la selección
      const newSelected = new Set(selectedObjects);
      newSelected.delete(objectToDelete.id);
      setSelectedObjects(newSelected);
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
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={handleOpenSelectDialog} disabled={loading || saving || objects.length === 0}>
            Seleccionar
          </Button>
          <Button variant="text" onClick={loadData} disabled={loading || saving}>
            Actualizar lista
          </Button>
        </Stack>
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

      {/* Diálogo de selección con checkboxes */}
      <Dialog
        open={selectDialogOpen}
        onClose={handleCloseSelectDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Seleccionar objetos personales</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Selecciona uno o más objetos para editarlos o eliminarlos.
            </Alert>
            {objects.length === 0 ? (
              <Alert severity="warning">No hay objetos personales registrados.</Alert>
            ) : (
              <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                {objects.map(obj => {
                  const isSelected = selectedObjects.has(obj.id);
                  return (
                    <Box key={obj.id}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: isSelected ? "action.selected" : "transparent",
                          "&:hover": {
                            bgcolor: "action.hover"
                          }
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleToggleObject(obj.id)}
                            />
                          }
                          label={
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={600} sx={{ minWidth: 150 }}>
                                {obj.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                                Cantidad: {obj.qty}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                                Propietario: {obj.patientName || "-"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(obj.receivedAt)}
                              </Typography>
                            </Stack>
                          }
                          sx={{ flex: 1, m: 0 }}
                        />
                        {isSelected && (
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                handleCloseSelectDialog();
                                handleOpenEditDialog(obj);
                              }}
                              title="Editar"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                handleCloseSelectDialog();
                                handleOpenDeleteDialog(obj);
                              }}
                              title="Eliminar"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        )}
                      </Stack>
                      <Divider />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSelectDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

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
