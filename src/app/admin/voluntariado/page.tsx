"use client";

import { useState } from "react";
import VoluntariadoNav from "./components/VoluntariadoNav";
import VoluntarioTable from "./components/VoluntarioTable";
import SancionTable from "./components/SancionTable";
import ProgramasAsignacion from "./programaVoluntariado/page";

// La gestión de programas (CRUD) se movió al módulo "Proyectos y Programas".
type Vista = "Asignación" | "Voluntarios" | "Sanciones";

export default function VoluntariadoPage() {
  const [vista, setVista] = useState<Vista>("Voluntarios");

  return (
    <>
      <VoluntariadoNav active={vista} onChange={setVista} />

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {vista === "Asignación" && <ProgramasAsignacion />}
          {vista === "Voluntarios" && <VoluntarioTable />}
          {vista === "Sanciones" && <SancionTable />}
        </div>
      </main>
    </>
  );
}
