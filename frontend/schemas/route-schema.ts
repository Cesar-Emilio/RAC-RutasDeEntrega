import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VALID_EXTENSIONS = [".csv", ".json", ".xlsx"];

export const routeSchema = z.object({
  warehouse: z
    .number({ error: "Selecciona un almacén de partida" })
    .int()
    .positive("Selecciona un almacén de partida"),

  file: z
    .instanceof(File, { message: "Selecciona un archivo de paquetes" })
    .refine(
      (f) => VALID_EXTENSIONS.some((ext) => f.name.endsWith(ext)),
      "El archivo debe ser .csv, .json o .xlsx"
    )
    .refine(
      (f) => f.size <= MAX_FILE_SIZE,
      "El archivo no puede superar 10MB"
    ),
});

export type RouteFormErrors = Partial<Record<keyof z.infer<typeof routeSchema>, string>>;