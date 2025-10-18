import { useState } from "react";

export default function SearchBar({ onSearch }: { onSearch: (q:string)=>void }) {
  const [q, setQ] = useState("");
  return (
    <div style={{display:"flex",gap:8}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." />
      <button onClick={()=>onSearch(q)}>Buscar</button>
    </div>
  );
}
