import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  Stack
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  itemType: string;
  warningMessage?: string;
  details?: Array<{ label: string; value: string }>;
  loading?: boolean;
}

export default function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  warningMessage,
  details,
  loading = false
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center">
          <WarningIcon color="error" />
          <Typography variant="h6">{title}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esta acción ocultará el {itemType.toLowerCase()} de todas las listas. El registro se mantendrá en la base de datos.
        </Alert>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {itemType}: {itemName}
          </Typography>
        </Box>

        {warningMessage && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {warningMessage}
          </Alert>
        )}

        {details && details.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Detalles que se eliminarán:
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {details.map((detail, index) => (
                <Typography key={index} variant="body2">
                  <strong>{detail.label}:</strong> {detail.value}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            ¿Estás seguro de que deseas eliminar este {itemType.toLowerCase()}?
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
        >
          {loading ? "Eliminando..." : "Sí, eliminar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

