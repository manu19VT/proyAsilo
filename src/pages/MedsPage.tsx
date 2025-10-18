import { useEffect, useState } from "react";
import { api } from "../api/mock";
import { Medication } from "../types";
import { Table } from "../components/Table";
import { fmt, monthsUntil } from "../utils/date";

export default function MedsPage() {
  const [items, setItems] = useState<Medication[]>([]);
  const [form, setForm] = useState({ name:"", qty:1, expiresAt:"" });
  const [error, setError] = useState<string | null>(null);

  const load = async ()=> setItems(await api.listMeds());
  useEffect(()=>{ load(); },[]);

  const add = async () => {
    setError(null);
    try {
      if (!form.name || !form.expiresAt) return;
      const months = monthsUntil(form.expiresAt);
      if (months > 3) throw new Error("La caducidad supera 3 meses.");
      await api.addMed({ ...form, qty: Number(form.qty) });
      setForm({ name:"", qty:1, expiresAt:"" });
      load();
    } catch (e:any) { setError(e.message); }
  };

  return (
    <div style={{padding:16}}>
      <h2>Medicamentos</h2>
      <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr auto", gap:8, maxWidth:700}}>
        <input placeholder="Nombre" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
        <input type="number" min={1} placeholder="Cantidad" value={form.qty} onChange={e=>setForm({...form, qty:+e.target.value})}/>
        <input type="date" value={form.expiresAt} onChange={e=>setForm({...form, expiresAt:e.target.value})}/>
        <button onClick={add}>Agregar</button>
      </div>
      {error && <p style={{color:"crimson"}}>{error}</p>}

      <Table headers={["Nombre","Cantidad","Caducidad","Regla"]}>
        {items.map(m=>(
          <tr key={m.id}>
            <td style={{padding:8}}>{m.name}</td>
            <td style={{padding:8}}>{m.qty}</td>
            <td style={{padding:8}}>{fmt(m.expiresAt)}</td>
            <td style={{padding:8}}>{monthsUntil(m.expiresAt) <= 3 ? "✔️ Permitido" : "❌ > 3 meses"}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
