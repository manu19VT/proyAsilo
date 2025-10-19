// src/components/Printable.tsx
import * as React from "react";
import { Button, type ButtonProps } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";

type Props = {
  title?: string;             // <title> del documento
  children: string;           // HTML a imprimir
  buttonText?: string;        // Texto del botón
  buttonProps?: ButtonProps;  // Props del botón MUI (variant, color, sx, etc.)
};

export default function Printable({
  title = "Documento",
  children,
  buttonText = "Imprimir",
  buttonProps,
}: Props) {
  const handlePrint = () => {
    // 1) Crear iframe oculto
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // 2) Documento mínimo (sin barras ni avisos propios)
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #fff;
    }
    .doc { max-width: 720px; margin: 24px auto; padding: 0 12px; }
    h1,h2,h3 { margin: 0 0 12px; }
    p { margin: 0 0 8px; }
    ul { margin: 8px 0 0 20px; }
  </style>
</head>
<body>
  <div class="doc">
    ${children}
  </div>
</body>
</html>`;

    // 3) Escribir y cerrar el doc del iframe
    doc.open();
    doc.write(html);
    doc.close();

    // 4) Esperar un instante, imprimir y limpiar el iframe (solo se ve el diálogo del navegador)
    const w = iframe.contentWindow!;
    const cleanup = () => { try { document.body.removeChild(iframe); } catch {} };

    // Cerrar/limpiar tras imprimir (o cancelar)
    w.addEventListener("afterprint", cleanup, { once: true });

    // Algunas plataformas no disparan 'afterprint': fallback
    setTimeout(cleanup, 5000);

    // Lanzar diálogo nativo
    setTimeout(() => {
      w.focus();
      w.print();
    }, 150);
  };

  return (
    <Button
      variant="outlined"
      startIcon={<PrintIcon />}
      onClick={handlePrint}
      sx={{ mt: 1.5 }}
      {...buttonProps}
    >
      {buttonText}
    </Button>
  );
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (m) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]!
  ));
}
