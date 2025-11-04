// src/pages/LoginPage.tsx
import { useState } from "react";
import { Box, Paper, TextField, Button, Typography, Alert, Stack, Divider, MenuItem } from "@mui/material";
import { motion } from "framer-motion";
import Page from "../components/Page";
import { api } from "../api/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>("login");
  const [name, setName] = useState("");
  const [role, setRole] = useState<'admin' | 'nurse' | 'doctor' | 'reception'>("reception");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (mode === 'login') {
      if (!email || !pass) return setError("Completa correo y contraseña.");
      try {
        setBusy(true);
        const { user } = await api.login(email, pass);
        setInfo(`Bienvenido ${user.name}`);
      } catch (err: any) {
        setError(err.message || 'Error al iniciar sesión');
      } finally {
        setBusy(false);
      }
    } else {
      if (!name || !email) return setError("Completa nombre y correo.");
      try {
        setBusy(true);
        const { user, password } = await api.register({ name, role, email });
        setInfo(`Cuenta creada para ${user.name}. Guarda tu contraseña: ${password}`);
        setPass(password);
        setMode('login');
      } catch (err: any) {
        setError(err.message || 'Error al crear cuenta');
      } finally {
        setBusy(false);
      }
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
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {mode === 'login' ? 'Usa tus credenciales para acceder al sistema.' : 'Crea una cuenta y te daremos una contraseña aleatoria.'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {info && <Alert severity="info" sx={{ mb: 2 }}>{info}</Alert>}

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={1.5}>
            {mode === 'register' && (
              <>
                <TextField
                  label="Nombre"
                  size="small"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <TextField
                  select
                  label="Rol"
                  size="small"
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="nurse">Enfermería</MenuItem>
                  <MenuItem value="doctor">Médico</MenuItem>
                  <MenuItem value="reception">Recepción</MenuItem>
                </TextField>
              </>
            )}
            <TextField
              type="email"
              label="Correo"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            {mode === 'login' && (
            <TextField
              type="password"
              label="Contraseña"
              size="small"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
              required
            />
            )}
            <Button type="submit" variant="contained" disabled={busy}>
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </Button>
            <Divider flexItem />
            <Button variant="text" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setInfo(null); }}>
              {mode === 'login' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Inicia sesión'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Page>
  );
}
