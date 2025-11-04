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
        
        {/* Rutas protegidas - solo para usuarios autenticados con roles admin, nurse o doctor */}
        <Route path="/pacientes" element={
          <ProtectedRoute>
            <PatientsPage />
          </ProtectedRoute>
        } />
        <Route path="/medicamentos" element={
          <ProtectedRoute>
            <MedsPage />
          </ProtectedRoute>
        } />
        <Route path="/entradas" element={
          <ProtectedRoute>
            <EntriesPage />
          </ProtectedRoute>
        } />
        <Route path="/objetos" element={
          <ProtectedRoute>
            <ObjectsPage />
          </ProtectedRoute>
        } />
        <Route path="/usuarios" element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        } />
        
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Cualquier otra ruta redirige al dashboard */}
        <Route path="*" element={<Navigate to="/" />} />
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
