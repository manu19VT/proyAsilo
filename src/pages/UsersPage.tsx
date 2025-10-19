import { Typography, TextField, Button, Stack, Chip } from "@mui/material";
import Page from "../components/Page";
import { Table } from "../components/Table";

export default function UsersPage() {
  return (
    <Page>
      <Typography variant="h5" gutterBottom>Usuarios</Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
        <TextField size="small" label="Nombre" />
        <TextField size="small" label="Correo" type="email" />
        <Button variant="contained">Crear</Button>
      </Stack>

      <Table headers={["Nombre","Correo","Rol"]}>
        <tr>
        
        </tr>
      </Table>
    </Page>
  );
}
