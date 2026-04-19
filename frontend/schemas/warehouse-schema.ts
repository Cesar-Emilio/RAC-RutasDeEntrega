import { z } from "zod";

export const warehouseSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "Mínimo 2 caracteres"),
  address: z
    .string()
    .min(1, "La dirección es requerida")
    .min(5, "Mínimo 5 caracteres"),
  city: z
    .string()
    .min(1, "La ciudad es requerida")
    .regex(/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/, "Solo letras"),
  state: z
    .string()
    .min(1, "Selecciona un estado"),
  postal_code: z
    .string()
    .regex(/^\d{5}$/, "5 dígitos requeridos"),
  latitude: z
    .string()
    .min(1, "La latitud es obligatoria")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 14.5 && num <= 32.7;
      },
      "Entre 14.5 y 32.7"
    ),
  longitude: z
    .string()
    .min(1, "La longitud es obligatoria")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= -118.4 && num <= -86.7;
      },
      "Entre -118.4 y -86.7"
    ),
});

export type WarehouseFormErrors = Partial<Record<keyof z.infer<typeof warehouseSchema>, string>>;
