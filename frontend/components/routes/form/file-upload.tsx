import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { SectionHeader } from "./section-header";
import { ChevronDown, Download, Upload } from "lucide-react";
import { downloadCsvTemplate, downloadExcelTemplate, downloadJsonTemplate } from "@/lib/templates";

interface FileUploadProps {
  file: File | null;
  onChange: (file: File) => void;
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
    <div className="mb-8">
        <SectionHeader step={2} title="Archivo de paquetes" description="Sube un archivo .csv, .json o xslx con las ubicaciones de entrega" />

        <div className="flex items-center justify-between mb-4">
          <div className="relative group">
            <button
              className="
                flex items-center gap-2
                px-3 py-2 rounded-lg
                bg-surface border border-border
                text-text-secondary text-sm
                hover:border-divisor hover:text-text-primary
                transition-colors duration-200
              "
            >
              <Download className="w-4 h-4" />
              <span>Descargar plantilla</span>
              <ChevronDown className="w-4 h-4" />
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
            py-12 px-6 rounded-xl
            border-2 border-dashed
            transition-colors duration-200
            ${isDragging 
              ? "border-primary-500 bg-primary-500/10" 
              : "border-border bg-surface/50 hover:border-divisor"
            }
          `}
        >
          <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-surface border border-border">
            <Upload className="w-5 h-5 text-text-secondary" />
          </div>
          
          {file ? (
            <p className="text-text-primary font-medium">{file.name}</p>
          ) : (
            <>
              <p className="text-text-primary mb-1">Arrastra tu archivo aquí</p>
              <p className="text-sm text-text-secondary">
                o{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-400 hover:text-primary-300 underline"
                >
                  selecciona un archivo
                </button>
                {" "}de tu computadora
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
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
  );
}