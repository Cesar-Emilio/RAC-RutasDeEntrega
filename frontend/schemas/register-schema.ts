import { z } from "zod";

export const registerSchema = z.object({
    name: z
      .string()
      .min(1, "El nombre es requerido")
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre no puede exceder 100 caracteres"),
    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z
      .string()
      .min(1, "Debe confirmar la contraseña"),
    companyName: z
      .string()
      .min(1, "El nombre de la empresa es requerido")
      .min(2, "El nombre de la empresa debe tener al menos 2 caracteres")
      .max(100, "El nombre de la empresa no puede exceder 100 caracteres"),
    rfc: z
      .string()
      .min(1, "El RFC es requerido")
      .regex(
        /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/,
        "RFC inválido. Formato: ABC123456XYZ (3-4 letras, 6 dígitos, 3 caracteres)"
      ),
})
.refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterFormErrors = Partial<Record<keyof z.infer<typeof registerSchema>, string>>;