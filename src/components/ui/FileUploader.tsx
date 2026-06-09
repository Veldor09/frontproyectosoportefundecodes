"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, X, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onFileUpload: (file: File) => Promise<void>;
  acceptedTypes?: string[];
  maxSize?: number; // en bytes
}

export function FileUploader({ 
  onFileSelect, 
  onFileUpload,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'],
  maxSize = 10 * 1024 * 1024 // 10MB por defecto
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Validar tipo de archivo
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!acceptedTypes.includes(fileExtension)) {
      setError(`Tipo de archivo no permitido. Aceptados: ${acceptedTypes.join(', ')}`);
      return;
    }

    // Validar tamaño
    if (file.size > maxSize) {
      setError(`El archivo excede el tamaño máximo de ${(maxSize / (1024 * 1024)).toFixed(0)}MB`);
      return;
    }

    setError(null);
    setSuccess(false);
    setSelectedFile(file);
    setUploadProgress(0);
    onFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setSuccess(false);

    // Simular progreso
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await onFileUpload(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);
      
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setSuccess(false);
      }, 2000);
      
    } catch (error) {
      clearInterval(progressInterval);
      setError(error instanceof Error ? error.message : 'Error al subir archivo');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Área de Drag & Drop */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
          ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${selectedFile ? 'border-green-400 bg-green-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          disabled={isUploading}
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            {isDragging ? (
              <Upload className="w-6 h-6 text-blue-500" />
            ) : selectedFile ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <Upload className="w-6 h-6 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragging ? 'Suelta el archivo aquí' : 'Arrastra y suelta un archivo'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              o haz clic para seleccionar
            </p>
          </div>
          
          <div className="text-xs text-gray-500">
            Formatos: {acceptedTypes.join(', ')} • Máximo: {(maxSize / (1024 * 1024)).toFixed(0)}MB
          </div>
        </div>
      </div>

      {/* Preview del archivo seleccionado */}
      {selectedFile && (
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              
              {!isUploading && !success && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Barra de progreso */}
            {isUploading && (
              <div className="mt-4 space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center text-gray-500">
                  Subiendo... {uploadProgress}%
                </p>
              </div>
            )}

            {/* Mensaje de éxito */}
            {success && (
              <div className="mt-4 flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">¡Archivo subido exitosamente!</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botón de subir */}
      {selectedFile && !isUploading && !success && (
        <Button 
          onClick={handleUpload} 
          className="w-full"
          disabled={isUploading}
        >
          Subir Archivo
        </Button>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}