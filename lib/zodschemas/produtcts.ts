import { z } from "zod"

// Schema para dimensões do produto
const dimensionsSchema = z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
})

// Schema para SEO do produto
const seoSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
})

// Schema para material do produto
const materialSchema = z.object({
    type: z.string(),
    color: z.string().optional(),
    purity: z.string().optional(),
    description: z.record(z.string(), z.string()).optional(),
})

// Schema para gema do produto
const gemstoneSchema = z.object({
    type: z.string(),
    carat: z.number().optional(),
    color: z.string().optional(),
    clarity: z.string().optional(),
    cut: z.string().optional(),
    quantity: z.number().optional(),
    description: z.record(z.string(), z.string()).optional(),
})

// Schema para variante do produto
const variantSchema = z.object({
    sku: z.string().regex(/^[A-Za-z0-9-_]+$/, "SKU inválido"),
    attributes: z.record(z.string(), z.string()),
    price: z.record(
        z.string(),
        z.object({
            value: z.number().positive(),
            formatted: z.string(),
        }),
    ),
    stock: z.number().min(0),
    images: z.array(z.string().url()),
})

// Schema base para criação de produto (sem refine)
const baseProductSchema = z.object({
    name: z.record(z.string(), z.string()),
    sku: z.string().regex(/^[A-Za-z0-9-_]+$/, "SKU inválido"),
    slug: z
        .string()
        .regex(/^[a-z0-9-]+$/, "Slug inválido")
        .optional(),
    description: z.record(z.string(), z.string()),
    shortDescription: z.record(z.string(), z.string()).optional(),
    price: z.record(
        z.string(),
        z.object({
            value: z.number().positive(),
            formatted: z.string(),
        }),
    ),
    costPrice: z
        .record(
            z.string(),
            z.object({
                value: z.number().positive(),
                formatted: z.string(),
            }),
        )
        .optional(),
    category: z.string(),
    subcategory: z.string().optional(),
    tags: z.array(z.string()).default([]),
    images: z.array(z.string().url()).min(1, "Pelo menos uma imagem é obrigatória"),
    videos: z.array(z.string().url()).optional(),
    threeDModel: z.string().url().optional(),
    weight: z.number().optional(),
    dimensions: dimensionsSchema.optional(),
    sizes: z.array(z.string()).optional(),
    stock: z.number().min(0),
    lowStockThreshold: z.number().optional(),
    hasVariants: z.boolean().default(false),
    featured: z.boolean().default(false),
    isNew: z.boolean().default(false),
    metadata: z.record(z.string(), z.any()).optional(),
    customizationOptions: z.record(z.string(), z.any()).optional(),
    careInstructions: z.record(z.string(), z.string()).optional(),
    warranty: z.record(z.string(), z.string()).optional(),
    notes: z.string().optional(),
    hidden: z.boolean().default(false),
    collections: z.array(z.string()).optional(),
    materials: z.array(materialSchema).min(1, "Pelo menos um material é obrigatório"),
    gemstones: z.array(gemstoneSchema).optional(),
    variants: z
        .array(variantSchema)
        .optional()
        .refine((data) => !data || data.length > 0, "Variantes são obrigatórias quando hasVariants é true"),
});

export const createProductSchema = baseProductSchema.refine(
    (data) => !data.hasVariants || (data.variants && data.variants.length > 0),
    {
        message: "Variantes são obrigatórias quando hasVariants é true",
        path: ["variants"],
    }
);

export const updateProductSchema = baseProductSchema.partial().extend({
    id: z.string().optional(),
}).refine(
    (data) => !data.hasVariants || (data.variants && data.variants.length > 0),
    {
        message: "Variantes são obrigatórias quando hasVariants é true",
        path: ["variants"],
    }
);

// Schema para filtros de produto
export const productFilterSchema = z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    collections: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    materials: z.array(z.string()).optional(),
    gemstones: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    isNew: z.boolean().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    inStock: z.boolean().optional(),
    hasReviews: z.boolean().optional(),
    minRating: z.number().min(0).max(5).optional(),
    sortBy: z.enum(["name", "price", "stock", "createdAt", "rating", "viewCount"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
    language: z.string().optional(),
    currency: z.string().optional(),
})

// Schema para avaliação de produto
export const productReviewSchema = z.object({
    userId: z.string(),
    userName: z.string(),
    rating: z.number().min(1).max(5),
    title: z.string().optional(),
    content: z.string(),
    images: z.array(z.string().url()).optional(),
    verified: z.boolean().optional(),
})
