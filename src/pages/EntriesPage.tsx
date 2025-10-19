import { useEffect, useMemo, useState } from "react";
import { Box, TextField, Button, Alert, Typography, Stack, Paper } from "@mui/material";
import Page from "../components/Page";
import { Table } from "../components/Table";
import Printable from "../components/Printable";      // tu componente existente
import { api } from "../api/mock";                    // tus mocks
import { EntryRequest, Medication, Patient } from "../types";
import { fmt } from "../utils/date";

export default function EntriesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [entries, setEntries] = useState<EntryRequest[]>([]);
  const [draft, setDraft] = useState<{patientId?:string; items:{med:Medication; qty:number}[]; dueDate?:string}>({ items:[] });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setPatients(await api.listPatients());
    setMeds(await api.listMeds());
    setEntries(await api.listEntries());
  };
  useEffect(()=>{ load(); }, []);

  const addItem = (medId: string) => {
    const med = meds.find(m=>m.id===medId); if (!med) return;
    setDraft(d => ({...d, items:[...d.items, { med, qty:1 }]}));
  };

  const save = async () => {
    setError(null);
    try {
      if (!draft.patientId || draft.items.length===0) return;
      const status: EntryRequest["status"] =
        draft.items.some(it => it.qty > it.med.qty) ? "incompleta" : "completa";
      await api.addEntry({
        patientId: draft.patientId,
        items: draft.items.map(it=>({ medicationId: it.med.id, qty: it.qty })),
        status,
        dueDate: draft.dueDate
      });
      setDraft({ items:[] });
      load();
    } catch (e:any) { setError(e.message); }
  };

  const incomplete = useMemo(()=>entries.filter(e=>e.status==="incompleta"),[entries]);

  return (
    <Page>
      <Typography variant="h5" gutterBottom>Entradas / Solicitudes</Typography>

      {incomplete.length>0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          🔔 <b>Familiares con faltante de medicamento</b> — {incomplete.length} pendiente(s).
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Layout responsive sin <Grid>: 1 columna (xs) / 2 columnas (md) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {/* Columna izquierda: formulario */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Nueva solicitud/entrega</Typography>

          <Stack spacing={1.25} sx={{ mb: 1.5 }}>
            {/* Paciente */}
            <TextField
              fullWidth size="small" select label="Paciente"
              SelectProps={{ native: true }}
              value={draft.patientId ?? ""}
              onChange={e=>setDraft({...draft, patientId:e.target.value})}
            >
              <option value=""></option>
              {patients.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
            </TextField>

            {/* Fila: medicamento + fecha + guardar */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                fullWidth size="small" select label="Agregar medicamento"
                SelectProps={{ native: true }}
                defaultValue=""
                onChange={e=>addItem(e.target.value)}
              >
                <option value=""></option>
                {meds.map(m=> <option key={m.id} value={m.id}>{m.name} (stock {m.qty})</option>)}
              </TextField>

              <TextField
                size="small" type="date" label="Fecha regreso"
                InputLabelProps={{ shrink: true }}
                value={draft.dueDate ?? ""}
                onChange={e=>setDraft({...draft, dueDate:e.target.value})}
                sx={{ minWidth: 180 }}
              />

              <Button variant="contained" onClick={save}>Guardar</Button>
            </Stack>
          </Stack>

          {/* Tabla de ítems del borrador */}
          <Table headers={["Medicamento","Cantidad solicitada"]}>
            {draft.items.map((it,i)=>(
              <tr key={i}>
                <td style={{ padding: 8 }}>{it.med.name}</td>
                <td style={{ padding: 8 }}>
                  <TextField
                    size="small" type="number" inputProps={{ min:1 }}
                    value={it.qty}
                    onChange={e=>{
                      const qty = +e.target.value;
                      setDraft(d=>({...d, items: d.items.map((x,ix)=> ix===i?{...x, qty}:x)}));
                    }}
                    sx={{ width: 120 }}
                  />
                </td>
              </tr>
            ))}
          </Table>

          {/* Imprimible */}
          <Printable title="Solicitud de medicamento">
            {`<h1>Solicitud de medicamento</h1>
              <p>Paciente: ${(patients.find(p=>p.id===draft.patientId)?.name) ?? "-"}</p>
              <ul>${draft.items.map(it=>`<li>${it.med.name} — ${it.qty}</li>`).join("")}</ul>
              <p>Fecha de regreso: ${fmt(draft.dueDate)}</p>`}
          </Printable>
        </Paper>

        {/* Columna derecha: historial */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Historial</Typography>
          <Table headers={["Paciente","Fecha","Estatus","Regresar"]}>
            {entries.map(e=>(
              <tr key={e.id}>
                <td style={{ padding: 8 }}>{patients.find(p=>p.id===e.patientId)?.name ?? "-"}</td>
                <td style={{ padding: 8 }}>{fmt(e.createdAt)}</td>
                <td style={{ padding: 8 }}>{e.status}</td>
                <td style={{ padding: 8 }}>{fmt(e.dueDate)}</td>
              </tr>
            ))}
          </Table>
        </Paper>
      </Box>
    </Page>
  );
}
