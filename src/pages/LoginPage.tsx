// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Paper, TextField, Button, Typography, Alert, Stack } from "@mui/material";
import { motion } from "framer-motion";
import Page from "../components/Page";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !pass) return setError("Completa correo y contraseña.");

    try {
      setBusy(true);
      const { user } = await api.login(email, pass);
      login(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setBusy(false);
    }
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
        <Typography variant="h5" gutterBottom>
          Iniciar sesión
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Usa tus credenciales para acceder al sistema. Si necesitas acceso, solicita a un administrador que cree tu cuenta.
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
            <Button type="submit" variant="contained" disabled={busy}>
              Entrar
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Page>
  );
}
