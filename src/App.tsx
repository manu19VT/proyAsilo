import { HashRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Container } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import Nav from "./components/Navbar";

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
        <Route path="/" element={<Dashboard />} />
        <Route path="/pacientes" element={<PatientsPage />} />
        <Route path="/medicamentos" element={<MedsPage />} />
        { <Route path="/entradas" element={<EntriesPage />} /> }
        { <Route path="/objetos" element={<ObjectsPage />} />}
        { <Route path="/usuarios" element={<UsersPage />} /> }
        <Route path="/login" element={<LoginPage />} />
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
