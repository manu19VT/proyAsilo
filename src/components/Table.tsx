import { PropsWithChildren } from "react";
import { Table as MuiTable, TableHead, TableRow, TableCell, TableBody, Paper } from "@mui/material";

export function Table({ headers, children }: PropsWithChildren<{ headers: string[] }>) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <MuiTable
        size="small"
        sx={{
          "& thead th": {
            bgcolor: "grey.100",
            fontWeight: 600,
            textTransform: "uppercase",
            fontSize: 12,
            letterSpacing: 0.3,
          },
          "& tbody tr:nth-of-type(odd)": {
            bgcolor: "grey.50",
          },
          "& tbody td": {
            borderBottom: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <TableHead>
          <TableRow>
            {headers.map(h => <TableCell key={h}>{h}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </MuiTable>
    </Paper>
  );
}
