import { useEffect, useState } from "react";
import { Box, TextField, Button, Alert, Chip, Typography, Stack, Paper } from "@mui/material";
import Page from "../components/Page";
import { Table } from "../components/Table";
import { api } from "../api/mock";
import { Medication } from "../types";
import { fmt, monthsUntil } from "../utils/date";

export default function MedsPage() {
  const [items, setItems] = useState<Medication[]>([]);
  const [form, setForm] = useState({ name: "", qty: 1, expiresAt: "" });
  const [error, setError] = useState<string | null>(null);

  const load = async () => setItems(await api.listMeds());
  useEffect(() => { load(); }, []);

  const add = async () => {
    setError(null);
    try {
      if (!form.name || !form.expiresAt) return;
      const months = monthsUntil(form.expiresAt);
      if (months > 3) throw new Error("La caducidad supera 3 meses.");
      await api.addMed({ ...form, qty: Number(form.qty) });
      setForm({ name: "", qty: 1, expiresAt: "" });
      load();
    } catch (e:any) { setError(e.message); }
  };

  return (
    <Page>
      <Typography variant="h5" gutterBottom>Medicamentos</Typography>

      {/* Tarjeta de formulario */}
      <Paper sx={{ p: 2, mb: 2 }}>
        {/* Fila responsive: en móvil columna, en desktop fila */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            fullWidth size="small" label="Nombre"
            value={form.name} onChange={e=>setForm({...form, name:e.target.value})}
          />
          <TextField
            fullWidth size="small" type="number" label="Cantidad"
            value={form.qty} onChange={e=>setForm({...form, qty:+e.target.value})}
            inputProps={{ min: 0 }}
            sx={{ maxWidth: { sm: 160 } }}
          />
          <TextField
            fullWidth size="small" type="date" label="Caducidad"
            InputLabelProps={{ shrink: true }}
            value={form.expiresAt} onChange={e=>setForm({...form, expiresAt:e.target.value})}
            sx={{ maxWidth: { sm: 220 } }}
          />
          <Button variant="contained" onClick={add} sx={{ height: 40 }}>
            Agregar
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
      </Paper>

      {/* Tabla de medicamentos */}
      <Box>
        <Table headers={["Nombre","Cantidad","Caducidad","Regla"]}>
          {items.map(m => {
            const ok = monthsUntil(m.expiresAt) <= 3;
            return (
              <tr key={m.id}>
                <td style={{ padding: 8 }}>{m.name}</td>
                <td style={{ padding: 8 }}>{m.qty}</td>
                <td style={{ padding: 8 }}>{fmt(m.expiresAt)}</td>
                <td style={{ padding: 8 }}>
                  <Chip
                    size="small"
                    color={ok ? "success" : "error"}
                    variant={ok ? "outlined" : "filled"}
                    label={ok ? "✔ Permitido" : "❌ > 3 meses"}
                  />
                </td>
              </tr>
            );
          })}
        </Table>
      </Box>
    </Page>
  );
}
