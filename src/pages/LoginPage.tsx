// src/pages/LoginPage.tsx
import { useState } from "react";
import { Box, Paper, TextField, Button, Typography, Alert, Stack } from "@mui/material";
import { motion } from "framer-motion";
import Page from "../components/Page";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Aquí luego llamas a tu backend (POST /auth/login)
    if (!email || !pass) return setError("Completa correo y contraseña.");
    console.log("login", { email, pass });
    // TODO: guardar token, redirigir…
  };

  return (
    <Page>
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        sx={{ maxWidth: 420, mx: "auto", p: 3 }}
      >
        <Typography variant="h5" gutterBottom>Iniciar sesión</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Usa tus credenciales para acceder al sistema.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={1.5}>
            <TextField
              type="email"
              label="Correo"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <TextField
              type="password"
              label="Contraseña"
              size="small"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Button type="submit" variant="contained">Entrar</Button>
          </Stack>
        </Box>
      </Paper>
    </Page>
  );
}
