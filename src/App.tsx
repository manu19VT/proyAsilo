import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import PatientsPage from "./pages/PatientsPage";
import MedsPage from "./pages/MedsPage";
import EntriesPage from "./pages/EntriesPage";
import ObjectsPage from "./pages/ObjectsPage";
import UsersPage from "./pages/UsersPage";
import "./styles.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Dashboard/>}/>
          <Route path="/patients" element={<PatientsPage/>}/>
          <Route path="/meds" element={<MedsPage/>}/>
          <Route path="/entries" element={<EntriesPage/>}/>
          <Route path="/objects" element={<ObjectsPage/>}/>
          <Route path="/users" element={<UsersPage/>}/>
        </Routes>
      </main>
    </BrowserRouter>
  );
}
