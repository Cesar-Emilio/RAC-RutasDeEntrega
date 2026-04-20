import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { SectionHeader } from "./section-header";
import { ChevronDown, Download, FileText, Upload, X } from "lucide-react";
import { downloadCsvTemplate, downloadExcelTemplate, downloadJsonTemplate } from "@/lib/templates";

interface FileUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

const templateOptions = [
  { id: "excel", label: "Excel" },
  { id: "json", label: "JSON" },
  { id: "csv", label: "CSV" },
];

export const FileUpload = ({ file, onChange }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isValidFile = (uploadedFile: File) =>
    uploadedFile.name.endsWith(".csv") ||
    uploadedFile.name.endsWith(".json") ||
    uploadedFile.name.endsWith(".xlsx");

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

  const handleTemplateDownload = (templateName: string) => {
    if (templateName === "Excel") {
      downloadExcelTemplate();
    } else if (templateName === "JSON") {
      downloadJsonTemplate();
    } else if (templateName === "CSV") {
      downloadCsvTemplate();
    } else {
      console.error("what")
    }
  };

  return (
    <div className="mb-6">
        <SectionHeader step={2} title="Archivo de paquetes" description="Sube un archivo .csv, .json o xlsx con las ubicaciones de entrega" />

        <div className="mb-3 flex items-center justify-between">
          <div className="relative group">
            <button
              className="
                flex items-center gap-2
                px-3 py-1.5 rounded-lg
                bg-surface border border-border
                text-text-secondary text-xs sm:text-sm
                hover:border-divisor hover:text-text-primary
                transition-colors duration-200
                cursor-pointer
              "
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar plantilla</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <div
              className="
                absolute right-0 top-full mt-1 z-10
                min-w-[140px] py-1
                bg-surface border border-border rounded-lg shadow-lg
                opacity-0 invisible
                group-hover:opacity-100 group-hover:visible
                transition-all duration-200
              "
            >
              {templateOptions.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateDownload(template.label)}
                  className="
                    w-full px-4 py-2 text-left text-sm
                    text-text-primary hover:bg-border/50
                    transition-colors duration-200
                    cursor-pointer
                  "
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center
            px-6 py-9 rounded-xl
            border-2 border-dashed
            transition-colors duration-200
            ${isDragging 
              ? "border-primary-500 bg-primary-500/10" 
              : "border-border bg-surface/50 hover:border-divisor"
            }
          `}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface">
            <Upload className="h-4 w-4 text-text-secondary" />
          </div>
          
          {file ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2">
            <FileText className="h-4 w-4 shrink-0 text-text-secondary" />
            <span className="max-w-xs truncate text-sm font-medium text-text-primary">
              {file.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="ml-auto p-1 rounded hover:bg-border/60 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Eliminar archivo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          ) : (
            <>
              <p className="mb-1 text-sm text-text-primary">Arrastra tu archivo aquí</p>
              <p className="text-xs text-text-secondary sm:text-sm">
                o{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-400 hover:text-primary-300 underline cursor-pointer"
                >
                  selecciona un archivo
                </button>
                {" "}de tu computadora
              </p>
            </>
          )}
          
          <div className="mt-3 flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-medium text-text-secondary bg-surface border border-border rounded">
              .csv
            </span>
            <span className="px-3 py-1 text-xs font-medium text-text-secondary bg-surface border border-border rounded">
              .json
            </span>
            <span className="px-3 py-1 text-xs font-medium text-text-secondary bg-surface border border-border rounded">
              .xlsx
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
  );
}