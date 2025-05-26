import { z } from "zod";

export const storeSettingsSchema = z.object({
    storeName: z.string().min(1, "Nome da loja é obrigatório"),
    storeDescription: z.string().optional(),
    logo: z.string().url().optional(),
    phone: z.string().optional(),
    email: z.string().email("Email inválido").optional(),
})
