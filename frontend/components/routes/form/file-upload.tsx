import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { SectionHeader } from "./section-header";
import { Upload } from "lucide-react";

interface FileUploadProps {
  file: File | null;
  onChange: (file: File) => void;
}

export const FileUpload = ({ file, onChange }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isValidFile = (uploadedFile: File) =>
    uploadedFile.name.endsWith(".csv") ||
    uploadedFile.name.endsWith(".json") ||
    uploadedFile.name.endsWith(".xslx");

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile &&
      isValidFile(droppedFile)
    ) {
        onChange(droppedFile);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      onChange(selectedFile);
    }
  };

  return (
    <div className="mb-8">
      <SectionHeader
        step={2}
        title="Archivo de paquetes"
        description="Sube un archivo .csv o .json con las ubicaciones de entrega"
      />

        <button 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center
            py-12 px-6 rounded-xl
            border-2 border-dashed
            transition-colors duration-200
            ${
              isDragging
                ? "border-primary-500 bg-primary-500/10"
                : "border-border bg-surface/50 hover:border-divisor"
            }
          `}
        >
          <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-surface border border-border">
            <Upload className="w-5 h-5 text-text-secondary" />
          </div>

          {file ? (
            <p className="text-text-primary font-medium">
              {file.name}
            </p>
          ) : (
            <>
              <p className="text-text-primary mb-1">Arrastra tu archivo aquí</p>
              <p className="text-sm text-text-secondary">
                o <span className="text-primary-400 underline">selecciona un archivo</span> de tu computadora
              </p>
            </>
          )}

          <div className="flex items-center gap-4 mt-4">
            <span className="px-3 py-1 text-xs font-medium text-text-secondary bg-surface border border-border rounded">
              .csv
            </span>
            <span className="px-3 py-1 text-xs font-medium text-text-secondary bg-surface border border-border rounded">
              .json
            </span>
            <span className="px-3 py-1 text-xs font-medium text-text-secondary bg-surface border border-border rounded">
              .xslx
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </button>
      </div>
  );
}