import { HashRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Container } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import Nav from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import PatientsPage from "./pages/PatientsPage";
import MedsPage from "./pages/MedsPage";
import LoginPage from "./pages/LoginPage";

 import EntriesPage from "./pages/EntriesPage";
 import ObjectsPage from "./pages/ObjectsPage";
 import UsersPage from "./pages/UsersPage";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Dashboard - accesible para todos (con o sin autenticación) */}
        <Route path="/" element={
          <ProtectedRoute allowUnauthenticated={true}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute allowUnauthenticated={true}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Rutas protegidas - requieren permisos específicos o roles predeterminados */}
        <Route path="/patients" element={
          <ProtectedRoute requiredPermission="pacientes">
            <PatientsPage />
          </ProtectedRoute>
        } />
        <Route path="/meds" element={
          <ProtectedRoute requiredPermission="medicamentos">
            <MedsPage />
          </ProtectedRoute>
        } />
        <Route path="/entries" element={
          <ProtectedRoute requiredPermission="control_es">
            <EntriesPage />
          </ProtectedRoute>
        } />
        <Route path="/objects" element={
          <ProtectedRoute requiredPermission="objetos">
            <ObjectsPage />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute excludeRoles={["nurse"]}>
            <UsersPage />
          </ProtectedRoute>
        } />
        
        {/* Rutas legacy en español (redirigen a las nuevas) */}
        <Route path="/pacientes" element={<Navigate to="/patients" replace />} />
        <Route path="/medicamentos" element={<Navigate to="/meds" replace />} />
        <Route path="/entradas" element={<Navigate to="/entries" replace />} />
        <Route path="/objetos" element={<Navigate to="/objects" replace />} />
        <Route path="/usuarios" element={<Navigate to="/users" replace />} />
        
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Cualquier otra ruta redirige al dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <Nav />
      <Container maxWidth="lg">
        <AnimatedRoutes />
      </Container>
    </Router>
  );
}
