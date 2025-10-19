import { PropsWithChildren } from "react";
import { Table as MuiTable, TableHead, TableRow, TableCell, TableBody, Paper } from "@mui/material";

export function Table({ headers, children }: PropsWithChildren<{ headers: string[] }>) {
  return (
    <Paper>
      <MuiTable>
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
