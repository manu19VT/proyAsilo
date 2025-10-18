import { useEffect, useMemo, useState } from "react";
import { api } from "../api/mock";
import { EntryRequest, Medication, Patient } from "../types";
import { Table } from "../components/Table";
import Printable from "../components/Printable";
import { fmt } from "../utils/date";

export default function EntriesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [entries, setEntries] = useState<EntryRequest[]>([]);
  const [draft, setDraft] = useState<{patientId?:string; items:{med:Medication; qty:number}[]; dueDate?:string}>({ items:[] });

  const load = async () => {
    setPatients(await api.listPatients());
    setMeds(await api.listMeds());
    setEntries(await api.listEntries());
  };
  useEffect(()=>{ load(); },[]);

  const addItem = (medId: string) => {
    const med = meds.find(m=>m.id===medId); if (!med) return;
    setDraft(d => ({...d, items:[...d.items, { med, qty:1 }]}));
  };

  const save = async () => {
    if (!draft.patientId || draft.items.length===0) return;
    // completa vs incompleta: si algún qty solicitado > stock registrado, márcalo incompleto (simulación)
    const status: EntryRequest["status"] = draft.items.some(it => it.qty > it.med.qty) ? "incompleta" : "completa";
    await api.addEntry({
      patientId: draft.patientId,
      items: draft.items.map(it=>({ medicationId: it.med.id, qty: it.qty })),
      status,
      dueDate: draft.dueDate
    });
    setDraft({ items:[] });
    load();
  };

  const incomplete = useMemo(()=>entries.filter(e=>e.status==="incompleta"),[entries]);

  return (
    <div style={{padding:16}}>
      <h2>Entradas / Solicitudes</h2>

      {incomplete.length>0 && (
        <div style={{background:"#fff7ed", border:"1px solid #fed7aa", padding:12, borderRadius:8, marginBottom:12}}>
          🔔 <b>Familiares con faltante de medicamento</b> — {incomplete.length} pendiente(s).
        </div>
      )}

      <div style={{display:"grid", gap:8, gridTemplateColumns:"1fr 1fr", alignItems:"start"}}>
        <section>
          <h3>Nueva solicitud/entrega</h3>
          <div style={{display:"grid", gap:8}}>
            <select value={draft.patientId ?? ""} onChange={e=>setDraft({...draft, patientId:e.target.value})}>
              <option value="">Selecciona paciente…</option>
              {patients.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <div style={{display:"flex", gap:8}}>
              <select onChange={e=>addItem(e.target.value)} defaultValue="">
                <option value="">Agregar medicamento…</option>
                {meds.map(m=> <option key={m.id} value={m.id}>{m.name} (stock {m.qty})</option>)}
              </select>
              <input type="date" value={draft.dueDate ?? ""} onChange={e=>setDraft({...draft, dueDate:e.target.value})} />
              <button onClick={save}>Guardar</button>
            </div>

            <Table headers={["Medicamento","Cantidad solicitada"]}>
              {draft.items.map((it,i)=>(
                <tr key={i}>
                  <td style={{padding:8}}>{it.med.name}</td>
                  <td style={{padding:8}}>
                    <input type="number" min={1} value={it.qty}
                      onChange={e=>{
                        const qty = +e.target.value;
                        setDraft(d=>({...d, items: d.items.map((x,ix)=> ix===i?{...x, qty}:x)}));
                      }} style={{width:90}}/>
                  </td>
                </tr>
              ))}
            </Table>

            <Printable title="Solicitud de medicamento">
              {`<h1>Solicitud de medicamento</h1>
                <p>Paciente: ${(patients.find(p=>p.id===draft.patientId)?.name) ?? "-"}</p>
                <ul>${draft.items.map(it=>`<li>${it.med.name} — ${it.qty}</li>`).join("")}</ul>
                <p>Fecha de regreso: ${fmt(draft.dueDate)}</p>`}
            </Printable>
          </div>
        </section>

        <section>
          <h3>Historial</h3>
          <Table headers={["Paciente","Fecha","Estatus","Regresar"]}>
            {entries.map(e=>(
              <tr key={e.id}>
                <td style={{padding:8}}>{patients.find(p=>p.id===e.patientId)?.name ?? "-"}</td>
                <td style={{padding:8}}>{fmt(e.createdAt)}</td>
                <td style={{padding:8}}>{e.status}</td>
                <td style={{padding:8}}>{fmt(e.dueDate)}</td>
              </tr>
            ))}
          </Table>
        </section>
      </div>
    </div>
  );
}
