import { Typography, TextField, Button, Stack } from "@mui/material";
import Page from "../components/Page";
import { Table } from "../components/Table";

export default function ObjectsPage() {
  return (
    <Page>
      <Typography variant="h5" gutterBottom>Objetos</Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
        <TextField size="small" label="Nombre del objeto" />
        <TextField size="small" label="Propietario" />
        <Button variant="contained">Registrar</Button>
      </Stack>

      <Table headers={["Objeto","Propietario","Fecha"]}>
       
      </Table>
    </Page>
  );
}
