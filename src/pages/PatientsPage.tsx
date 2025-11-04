import { useEffect, useState } from "react";
import { TextField, Button, Stack, Typography, Paper, Chip } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import Page from "../components/Page";
import { Table } from "../components/Table";
import { api } from "../api/client";
import { Patient } from "../types";
import { useAuth } from "../contexts/AuthContext";

export default function PatientsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Patient[]>([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => setItems(await api.listPatients());
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    await api.addPatient({ 
      name: name.trim(), 
      notes: notes.trim(),
      userId: user?.id 
    });
    setName(""); setNotes("");
    load();
  };

  return (
    <Page>
      <Typography variant="h5" gutterBottom>Pacientes</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Nuevo paciente</Typography>
        <Stack spacing={1.25}>
          <TextField
            label="Nombre del paciente"
            size="small"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Nota"
            value={notes}
            onChange={(e)=>setNotes(e.target.value)}
            placeholder="Observaciones, alergias, padecimientos, etc."
            multiline
            minRows={4}
            maxRows={12}
            fullWidth
            sx={{
              "& .MuiInputBase-input": { lineHeight: 1.5 },
              "& textarea": { resize: "vertical" }
            }}
          />
          <Button variant="contained" onClick={add} disabled={!name.trim()}>
            Agregar
          </Button>
        </Stack>
      </Paper>

      <Table headers={["Nombre", "Notas", "Creado por", "Actualizado por"]}>
        <AnimatePresence initial={false}>
          {items.map(p => (
            <motion.tr key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: .25 }}>
              <td style={{ padding: 8, width: 260 }}>{p.name}</td>
              <td style={{ padding: 8, whiteSpace: "pre-wrap" }}>{p.notes ?? ""}</td>
              <td style={{ padding: 8 }}>
                {p.createdByName ? (
                  <Chip label={p.createdByName} size="small" color="primary" variant="outlined" />
                ) : (
                  <Typography variant="caption" color="text.secondary">-</Typography>
                )}
              </td>
              <td style={{ padding: 8 }}>
                {p.updatedByName ? (
                  <Chip label={p.updatedByName} size="small" color="secondary" variant="outlined" />
                ) : (
                  <Typography variant="caption" color="text.secondary">-</Typography>
                )}
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </Table>
    </Page>
  );
}
