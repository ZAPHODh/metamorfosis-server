import { z } from "zod"

const baseCollectionSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
    slug: z
        .string()
        .regex(/^[a-z0-9-]+$/, "Slug inválido")
        .optional(),
    image: z.string().url().optional(),
    bannerImage: z.string().url().optional(),
    featured: z.boolean().default(false),
    active: z.boolean().default(true),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    products: z.array(z.string()).optional(),
});

export const createCollectionSchema = baseCollectionSchema.refine(
    (data) => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
    {
        message: "Data de início deve ser anterior à data de término",
        path: ["startDate", "endDate"],
    }
);


export const updateCollectionSchema = baseCollectionSchema.partial();

export const collectionFilterSchema = z.object({
    search: z.string().optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional(),
    hasProducts: z.boolean().optional(),
    sortBy: z.enum(["name", "startDate", "createdAt", "order"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
})


export const addProductsToCollectionSchema = z.object({
    productIds: z.array(z.string()).min(1, "Pelo menos um produto é obrigatório"),
})

export const removeProductsFromCollectionSchema = z.object({
    productIds: z.array(z.string()).min(1, "Pelo menos um produto é obrigatório"),
})
