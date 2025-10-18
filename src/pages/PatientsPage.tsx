import { useEffect, useState } from "react";
import { api } from "../api/mock";
import { Patient } from "../types";
import SearchBar from "../components/SearchBar";
import { Table } from "../components/Table";

export default function PatientsPage() {
  const [items, setItems] = useState<Patient[]>([]);
  const [name, setName] = useState("");

  const load = async (q?: string) => setItems(await api.listPatients(q));
  useEffect(()=>{ load(); },[]);

  const add = async () => {
    if (!name.trim()) return;
    await api.addPatient({ name, notes: "" });
    setName(""); load();
  };

  return (
    <div style={{padding:16}}>
      <h2>Pacientes</h2>
      <SearchBar onSearch={load}/>
      <div style={{display:"flex",gap:8, margin:"12px 0"}}>
        <input placeholder="Nombre del paciente" value={name} onChange={e=>setName(e.target.value)} />
        <button onClick={add}>Agregar</button>
      </div>

      <Table headers={["Nombre","Notas"]}>
        {items.map(p=>(
          <tr key={p.id}>
            <td style={{padding:8}}>{p.name}</td>
            <td style={{padding:8}}>{p.notes ?? ""}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
