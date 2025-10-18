import { ReactNode } from "react";

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <table style={{width:"100%", borderCollapse:"collapse"}}>
      <thead>
        <tr>{headers.map(h=>(
          <th key={h} style={{textAlign:"left", padding:8, borderBottom:"1px solid #eee"}}>{h}</th>
        ))}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
