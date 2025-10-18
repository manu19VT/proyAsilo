import { useEffect, useState } from "react";
import { api } from "../api/mock";
import { Table } from "../components/Table";
import { User } from "../types";

export default function UsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [form, setForm] = useState<Omit<User,"id">>({ name:"", role:"reception", email:"" });

  const load = async ()=> setItems(await api.listUsers());
  useEffect(()=>{ load(); },[]);

  const add = async ()=>{
    if (!form.name) return;
    await api.addUser(form); setForm({ name:"", role:"reception", email:"" }); load();
  };

  return (
    <div style={{padding:16}}>
      <h2>Usuarios</h2>
      <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
        <input placeholder="Nombre" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
        <select value={form.role} onChange={e=>setForm({...form, role: e.target.value as User["role"]})}>
          <option value="admin">admin</option>
          <option value="doctor">doctor</option>
          <option value="nurse">nurse</option>
          <option value="reception">reception</option>
        </select>
        <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
        <button onClick={add}>Agregar</button>
      </div>

      <Table headers={["Nombre","Rol","Email"]}>
        {items.map(u=>(
          <tr key={u.id}>
            <td style={{padding:8}}>{u.name}</td>
            <td style={{padding:8}}>{u.role}</td>
            <td style={{padding:8}}>{u.email}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
