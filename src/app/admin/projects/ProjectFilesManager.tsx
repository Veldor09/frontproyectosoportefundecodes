"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileUploader } from "@/components/ui/FileUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Trash2, Eye } from "lucide-react";
import {
  uploadProjectFile,
  deleteProjectFile,
  getProjectFiles,
} from "@/services/projects.service";
import { formatFileSize, getFileIcon } from "@/services/files.service";

interface ProjectFile {
  id?: number; // necesario para eliminar por ID
  url: string;
  name: string;
  mimeType: string;
  size?: number;
  createdAt?: string;
}

interface ProjectFilesManagerProps {
  projectId: number;
  onFilesChange: (files: ProjectFile[]) => void;
}

export function ProjectFilesManager({
  projectId,
  onFilesChange,
}: ProjectFilesManagerProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProjectFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProjectFiles = async () => {
    try {
      setLoading(true);
      const projectFiles = await getProjectFiles(projectId);
      setFiles(projectFiles);
      onFilesChange(projectFiles);
    } catch (error) {
      console.error("Error al cargar archivos:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ devuelve boolean por compat con FileUploader
  const handleFileSelect = (file: File): boolean => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
    ];
    const ok =
      allowedTypes.includes(file.type) ||
      /\.(pdf|jpg|jpeg|png|gif|txt)$/i.test(file.name);

    if (!ok) {
      toast.error("Tipo de archivo no permitido. Use: PDF, JPG, PNG, GIF, TXT");
      return false;
    }
    return true;
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      await uploadProjectFile(projectId, file);
      await loadProjectFiles();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Error al subir archivo: ${error.message}`
          : "Error desconocido al subir archivo"
      );
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = (file: ProjectFile) => {
    setFileToDelete(file); // abre la alerta
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    if (fileToDelete.id == null) {
      toast.error("No se encontró el ID del archivo a eliminar.");
      return;
    }
    try {
      setDeleting(true);
      await deleteProjectFile(projectId, Number(fileToDelete.id)); // por ID
      await loadProjectFiles();
      setFileToDelete(null); // cierra solo si todo salió bien
    } catch (error: any) {
      console.error("Error al eliminar archivo:", error);
      toast.error(error?.message || "No se pudo eliminar el archivo.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadFile = (file: ProjectFile) => {
    const filename = file.url.split("/").pop() || "";
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
    // Si el API base ya termina en /api no lo duplicamos
    const apiRoot = base.endsWith("/api") ? base : `${base}/api`;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // download protegido con JWT — usamos fetch para poder enviar el header
    fetch(`${apiRoot}/files/download/${encodeURIComponent(filename)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al descargar");
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch((err) => toast.error(err?.message || "No se pudo descargar el archivo"));
  };

  const handlePreviewFile = (file: ProjectFile) => {
    const filename = file.url.split("/").pop() || "";
    if (!file.mimeType) {
      toast.error("Tipo de archivo no reconocido para vista previa");
      return;
    }
    if (file.mimeType.startsWith("image/") || file.mimeType === "application/pdf") {
      const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
      const apiRoot = base.endsWith("/api") ? base : `${base}/api`;
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      fetch(`${apiRoot}/files/preview/${encodeURIComponent(filename)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Error al previsualizar");
          return res.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
          // liberamos el object URL pasado un tiempo razonable
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        })
        .catch((err) => toast.error(err?.message || "No se pudo previsualizar"));
    } else {
      toast.error("Vista previa no disponible para este tipo de archivo");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Cargando archivos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archivos del Proyecto</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <FileUploader
          onFileSelect={handleFileSelect}
          onFileUpload={handleFileUpload}
          acceptedTypes={[".pdf", ".jpg", ".jpeg", ".png", ".gif", ".txt"]}
          maxSize={10 * 1024 * 1024}
        />

        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">
              Archivos subidos ({files.length})
            </h4>

            {files.map((file) => (
              <div
                key={file.id || file.url}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getFileIcon(file.mimeType)}</div>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {file.size ? formatFileSize(file.size) : "Tamaño desconocido"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreviewFile(file)}
                    title="Vista previa"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadFile(file)}
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file);
                    }}
                    className="text-xs text-red-600 border border-red-200 hover:bg-red-50"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alerta de confirmación */}
        <AlertDialog
          open={!!fileToDelete}
          onOpenChange={(open) => {
            if (!open && !deleting) setFileToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Seguro que quieres eliminar "{fileToDelete?.name}"? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setFileToDelete(null)}
                disabled={deleting}
              >
                Cancelar
              </AlertDialogCancel>

              <Button
                type="button"
                onClick={confirmDeleteFile}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
export default ProjectFilesManager;