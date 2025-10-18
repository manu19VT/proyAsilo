import { ReactNode } from "react";

export default function Printable({ title, children }: {title:string; children:ReactNode}) {
  const print = () => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(`<html><head><title>${title}</title>
      <style>body{font-family:system-ui;padding:24px}</style></head><body>${(children as any)}</body></html>`);
    w.document.close();
    w.print();
  };
  return <button onClick={print}>Imprimir</button>;
}
