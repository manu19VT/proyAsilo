// src/components/Navbar.tsx
import { Link, NavLink } from "react-router-dom";
// 👇 elimina la línea siguiente si la tienes
// import "./Navbar.css";

export default function Navbar() {
  const link = ({ isActive }: { isActive: boolean }) => ({
    padding: "8px 12px",
    borderRadius: 8,
    textDecoration: "none",
    color: isActive ? "#fff" : "#111",
    background: isActive ? "#2563eb" : "transparent",
  });

  return (
    <header style={{ display: "flex", gap: 8, alignItems: "center", padding: 12, borderBottom: "1px solid #eee" }}>
      <Link to="/" style={{ fontWeight: 700 }}>
        Las Margaritas
      </Link>
      <nav style={{ display: "flex", gap: 6 }}>
        <NavLink to="/patients" style={link}>Pacientes</NavLink>
        <NavLink to="/meds" style={link}>Medicamentos</NavLink>
        <NavLink to="/entries" style={link}>Entradas</NavLink>
        <NavLink to="/objects" style={link}>Objetos</NavLink>
        <NavLink to="/users" style={link}>Usuarios</NavLink>
      </nav>
    </header>
  );
}
