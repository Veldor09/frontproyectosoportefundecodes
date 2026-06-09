"use client";

import { useState } from "react";
import ColaboradoresNav, { type CollabTab } from "@/app/admin/Collaborators/components/ColaboradoresNav";
import CollaboratorsTable from "@/app/admin/Collaborators/components/CollaboratorsTable";
import ExternalCollaboratorsPanel from "@/app/admin/Collaborators/components/ExternalCollaboratorsPanel";

export default function Page() {
  const [activeTab, setActiveTab] = useState<CollabTab>("colaboradores");

  return (
    <main className="min-h-screen bg-slate-50">
      <ColaboradoresNav active={activeTab} onChange={setActiveTab} />
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        {activeTab === "colaboradores" && <CollaboratorsTable />}
        {activeTab === "externos" && <ExternalCollaboratorsPanel />}
      </div>
    </main>
  );
}
