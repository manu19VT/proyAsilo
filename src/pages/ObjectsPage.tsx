import { useEffect, useState } from "react";
import { api } from "../api/mock";
import { Patient, PersonalObject } from "../types";
import { Table } from "../components/Table";
import Printable from "../components/Printable";
import { fmt } from "../utils/date";

export default function ObjectsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [items, setItems] = useState<PersonalObject[]>([]);
  const [form, setForm] = useState<{patientId?:string; name:string; qty:number}>({ name:"", qty:1 });

  const load = async () => {
    setPatients(await api.listPatients());
    setItems(await api.listObjects());
  };
  useEffect(()=>{ load(); },[]);

  const add = async () => {
    if (!form.patientId || !form.name) return;
    await api.addObject({ patientId: form.patientId, name: form.name, qty: form.qty });
    setForm({ name:"", qty:1 }); load();
  };

  return (
    <div style={{padding:16}}>
      <h2>Objetos personales</h2>
      <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
        <select value={form.patientId ?? ""} onChange={e=>setForm({...form, patientId:e.target.value})}>
          <option value="">Paciente…</option>
          {patients.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input placeholder="Objeto (jabón, toalla…)" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
        <input type="number" min={1} value={form.qty} onChange={e=>setForm({...form, qty:+e.target.value})}/>
        <button onClick={add}>Registrar</button>

        <Printable title="Recibo de objetos">
          {`<h1>Recibo de objetos</h1>
            <p>Paciente: ${(patients.find(p=>p.id===form.patientId)?.name) ?? "-"}</p>
            <ul>${items.filter(o=>o.patientId===form.patientId).map(o=>`<li>${o.name} — ${o.qty}</li>`).join("")}</ul>`}
        </Printable>
      </div>

      <Table headers={["Paciente","Objeto","Cantidad","Fecha"]}>
        {items.map(o=>(
          <tr key={o.id}>
            <td style={{padding:8}}>{patients.find(p=>p.id===o.patientId)?.name ?? "-"}</td>
            <td style={{padding:8}}>{o.name}</td>
            <td style={{padding:8}}>{o.qty}</td>
            <td style={{padding:8}}>{fmt(o.receivedAt)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
