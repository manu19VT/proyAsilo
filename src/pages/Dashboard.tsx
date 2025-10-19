// src/pages/Dashboard.tsx
import { Typography, Box, Paper, Chip } from "@mui/material";
import { motion } from "framer-motion";
import Page from "../components/Page";

const hover = { y: -4, boxShadow: "0 8px 24px rgba(0,0,0,.08)" };

export default function Dashboard() {
  const cards = [
    { title: "Pacientes", value: 36, hint: "+2 hoy" },
    { title: "Medicamentos", value: 128, hint: "5 por caducar" },
    { title: "Entradas", value: 18, hint: "3 incompletas" },
    { title: "Objetos", value: 67, hint: "Nuevos" },
  ];

  return (
    <Page>
      <Typography variant="h4" gutterBottom>Panel</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Bienvenido. Desde aquí podrás gestionar pacientes, entradas, medicamentos y objetos personales.
      </Typography>

      {/* Tarjetas métricas */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        {cards.map((k) => (
          <Paper
            key={k.title}
            component={motion.div}
            whileHover={hover}
            transition={{ duration: 0.2 }}
            sx={{ p: 2, display: "grid", gap: 0.5 }}
          >
            <Typography variant="body2" color="text.secondary">{k.title}</Typography>
            <Typography variant="h4">{k.value}</Typography>
            <Chip size="small" color="primary" variant="outlined" label={k.hint} />
          </Paper>
        ))}
      </Box>

      {/* Lista informativa */}
      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 2 }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>🔎 Sistema de búsqueda</li>
            <li>🔔 Avisos de faltantes (en Entradas)</li>
            <li>🖨️ Impresión de solicitudes y recibos</li>
          </ul>
        </Paper>
      </Box>
    </Page>
  );
}
