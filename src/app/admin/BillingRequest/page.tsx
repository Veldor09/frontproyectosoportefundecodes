// src/app/admin/BillingRequest/page.tsx
"use client";

import { useState } from "react";
import RequestNav, { type RequestTab } from "./components/RequestNav";
import { useSolicitanteRole } from "./hooks/useSolicitanteRole";

import RequestsTable from "./components/RequestsTable";
import AccountantValidationTable from "./components/AccountantValidationTable";
import DirectorApprovalTable from "./components/DirectorApprovalTable";
import PaymentTable from "./components/PaymentTable";
import HistoryTable from "./components/HistoryTable";

/** Tabs a los que un colaboradorsolicitante tiene acceso. */
const SOLICITANTE_ALLOWED: RequestTab[] = ["Solicitudes", "Historial"];

export default function RequestPage() {
  const { isSolicitante } = useSolicitanteRole();
  const [vista, setVista] = useState<RequestTab>("Solicitudes");

  /** Evita que un cambio de tab directo llegue a tabs restringidos. */
  function handleChange(tab: RequestTab) {
    if (isSolicitante && !SOLICITANTE_ALLOWED.includes(tab)) return;
    setVista(tab);
  }

  return (
    <>
      <RequestNav active={vista} onChange={handleChange} />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {vista === "Solicitudes" && <RequestsTable />}

          {/* Solo visible para roles con permisos de validación / aprobación / pago */}
          {!isSolicitante && vista === "Validación Contable" && <AccountantValidationTable />}
          {!isSolicitante && vista === "Aprobación Dirección" && <DirectorApprovalTable />}
          {!isSolicitante && vista === "Pendientes de pago" && <PaymentTable />}

          {vista === "Historial" && <HistoryTable />}
        </div>
      </main>
    </>
  );
}
