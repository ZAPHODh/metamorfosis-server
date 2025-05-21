import { Prisma } from "@prisma/client"
import { prisma } from "../../../prisma/prisma"
import { ProductFilterParams, CreateProductDTO, UpdateProductDTO, ProductReview } from '../../interfaces/product'

/**
 * Listar todos os produtos com filtros
 */
export async function getProducts(filters: ProductFilterParams) {
    const where: any = {}

    if (filters.search) {
        where.OR = [
            { name: { path: "$[*]", string_contains: filters.search } },
            { sku: { contains: filters.search, mode: "insensitive" } },
            { description: { path: "$[*]", string_contains: filters.search } },
        ]
    }

    if (filters.category) {
        where.category = filters.category
    }

    if (filters.subcategory) {
        where.subcategory = filters.subcategory
    }

    if (filters.featured !== undefined) {
        where.featured = filters.featured
    }

    if (filters.isNew !== undefined) {
        where.isNew = filters.isNew
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        if (filters.minPrice !== undefined) {
            where.price = {
                path: `$."${filters.currency}".value`,
                gte: filters.minPrice,
            }
        }

        if (filters.maxPrice !== undefined) {
            where.price = {
                ...where.price,
                path: `$."${filters.currency}".value`,
                lte: filters.maxPrice,
            }
        }
    }

    if (filters.inStock !== undefined) {
        where.stock = filters.inStock ? { gt: 0 } : { equals: 0 }
    }

    if (filters.hasReviews !== undefined) {
        where.reviewCount = filters.hasReviews ? { gt: 0 } : { equals: 0 }
    }

    if (filters.minRating !== undefined) {
        where.rating = { gte: filters.minRating }
    }

    if (filters.collections && filters.collections.length > 0) {
        where.collections = {
            some: {
                collectionId: { in: filters.collections },
            },
        }
    }

    if (filters.tags && filters.tags.length > 0) {
        where.tags = {
            hasSome: filters.tags,
        }
    }

    if (filters.materials && filters.materials.length > 0) {
        where.materials = {
            some: {
                type: { in: filters.materials },
            },
        }
    }

    if (filters.gemstones && filters.gemstones.length > 0) {
        where.gemstones = {
            some: {
                type: { in: filters.gemstones },
            },
        }
    }

    const page = filters.page ?? 1
    const skip = (page - 1) * (filters.limit ?? 10)

    const orderBy: any = {}
    if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortOrder || "asc"
    } else {
        orderBy.createdAt = "desc"
    }

    try {
        const products = await prisma.product.findMany({
            where,
            orderBy,
            skip,
            take: filters.limit,
            include: {
                collections: {
                    include: {
                        collection: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
                materials: true,
                gemstones: true,
                variants: true,
            },
        })

        const total = await prisma.product.count({ where })

        const formattedProducts = products.map((product) => {
            const name = filters.language && (product.name as any)[filters.language] !== undefined
                ? (product.name as any)[filters.language]
                : Object.values(product.name as any)[0]
            const description = filters.language && (product.description as any)[filters.language] !== undefined
                ? (product.description as any)[filters.language]
                : Object.values(product.description as any)[0]
            const shortDescription =
                filters.language && (product.shortDescription as any)[filters.language] !== undefined
                    ? (product.shortDescription as any)[filters.language]
                    : Object.values(product.shortDescription as any)[0]
            const price = filters.currency && (product.price as any)[filters.currency] !== undefined
                ? (product.price as any)[filters.currency]
                : Object.values(product.price as any)[0]

            return {
                ...product,
                name,
                description,
                shortDescription,
                price,
                collections: product.collections.map((cp) => cp.collection.id),
            }
        })

        return {
            products: formattedProducts,
            pagination: {
                total,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(total / (filters.limit ?? 1)),
            },
        }
    } catch (error) {
        console.error("Erro ao buscar produtos:", error)
        throw error
    }
}

/**
 * Obter um produto pelo ID
 */
export async function getProductById(id: string, language: string, currency: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                collections: {
                    include: {
                        collection: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
                materials: true,
                gemstones: true,
                variants: true,
                reviews: {
                    take: 5,
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        })

        if (!product) {
            return null
        }
        const name = (product.name as any)[language] || Object.values(product.name as any)[0]
        const description = (product.description as any)[language] || Object.values(product.description as any)[0]
        const shortDescription =
            (product.shortDescription as any)[language] || Object.values(product.shortDescription as any)[0]
        const price = (product.price as any)[currency] || Object.values(product.price as any)[0]

        return {
            ...product,
            name,
            description,
            shortDescription,
            price,
            collections: product.collections.map((cp) => cp.collection.id),
        }
    } catch (error) {
        console.error(`Erro ao buscar produto ${id}:`, error)
        throw error
    }
}

/**
 * Obter um produto pelo slug
 */
export async function getProductBySlug(slug: string, language: string, currency: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { slug },
            include: {
                collections: {
                    include: {
                        collection: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
                materials: true,
                gemstones: true,
                variants: true,
                reviews: {
                    take: 5,
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        })

        if (!product) {
            return null
        }

        const name = (product.name as any)[language] || Object.values(product.name as any)[0]
        const description = (product.description as any)[language] || Object.values(product.description as any)[0]
        const shortDescription =
            (product.shortDescription as any)[language] || Object.values(product.shortDescription as any)[0]
        const price = (product.price as any)[currency] || Object.values(product.price as any)[0]

        return {
            ...product,
            name,
            description,
            shortDescription,
            price,
            collections: product.collections.map((cp) => cp.collection.id),
        }
    } catch (error) {
        console.error(`Erro ao buscar produto pelo slug ${slug}:`, error)
        throw error
    }
}

/**
 * Criar um novo produto
 */
export async function createProduct(data: CreateProductDTO) {
    try {
        const existingSku = await prisma.product.findUnique({
            where: { sku: data.sku },
        })

        if (existingSku) {
            throw new Error("SKU já existe")
        }
        const existingSlug = await prisma.product.findUnique({
            where: { slug: data.slug },
        })

        if (existingSlug) {
            throw new Error("Slug já existe")
        }
        const product = await prisma.product.create({
            data: {
                slug: data.slug,
                sku: data.sku,
                name: data.name,
                description: data.description,
                shortDescription: data.shortDescription,
                price: data.price as unknown as Prisma.InputJsonValue,
                costPrice: data.costPrice as number | string | Prisma.Decimal | Prisma.DecimalJsLike | null | undefined,
                category: data.category,
                subcategory: data.subcategory,
                tags: data.tags || [],
                images: data.images as unknown as Prisma.InputJsonValue,
                videos: data.videos || [],
                threeDModel: data.threeDModel,
                weight: data.weight,
                dimensions: data.dimensions as any,
                sizes: data.sizes || [],
                stock: data.stock,
                lowStockThreshold: data.lowStockThreshold,
                hasVariants: data.hasVariants,
                featured: data.featured,
                isNew: data.isNew,
                metadata: data.metadata as unknown as Prisma.InputJsonValue,
                customizationOptions: data.customizationOptions as any,
                careInstructions: data.careInstructions as any,
                warranty: data.warranty as any,
                notes: data.notes,
                hidden: data.hidden,
                status: data.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
                collections: {
                    create: data.collections?.map((collectionId) => ({
                        collection: {
                            connect: { id: collectionId },
                        },
                    })),
                },
                materials: {
                    create: data.materials.map((material) => ({
                        type: material.type,
                        color: material.color,
                        purity: material.purity,
                        description: material.description as any,
                    })),
                },
                gemstones: {
                    create: data.gemstones.map((gemstone) => ({
                        type: gemstone.type,
                        carat: gemstone.carat,
                        color: gemstone.color,
                        clarity: gemstone.clarity,
                        cut: gemstone.cut,
                        quantity: gemstone.quantity,
                        description: gemstone.description as any,
                    })),
                },
                variants:
                    data.hasVariants && data.variants
                        ? {
                            create: data.variants.map((variant) => ({
                                sku: variant.sku,
                                attributes: variant.attributes,
                                price: variant.price as unknown as Prisma.InputJsonValue,
                                stock: variant.stock,
                                images: variant.images as unknown as Prisma.InputJsonValue,
                            })),
                        }
                        : undefined,
            },
        })

        return product
    } catch (error) {
        console.error("Erro ao criar produto:", error)
        throw error
    }
}


export async function updateProduct(id: string, data: UpdateProductDTO) {
    try {
        const existingProduct = await prisma.product.findUnique({
            where: { id },
            include: {
                collections: true,
                materials: true,
                gemstones: true,
                variants: true,
            },
        })

        if (!existingProduct) {
            return null
        }

        if (data.sku && data.sku !== existingProduct.sku) {
            const existingSku = await prisma.product.findUnique({
                where: { sku: data.sku },
            })

            if (existingSku) {
                throw new Error("SKU já existe")
            }
        }

        if (data.slug && data.slug !== existingProduct.slug) {
            const existingSlug = await prisma.product.findUnique({
                where: { slug: data.slug },
            })

            if (existingSlug) {
                throw new Error("Slug já existe")
            }
        }

        if (data.collections) {
            await prisma.collectionProduct.deleteMany({
                where: { productId: id },
            })

            for (const collectionId of data.collections) {
                await prisma.collectionProduct.create({
                    data: {
                        productId: id,
                        collectionId,
                    },
                })
            }
        }
        if (data.materials) {
            await prisma.productMaterial.deleteMany({
                where: { productId: id },
            })
            for (const material of data.materials) {
                await prisma.productMaterial.create({
                    data: {
                        productId: id,
                        type: material.type,
                        color: material.color,
                        purity: material.purity,
                        description: material.description as any,
                    },
                })
            }
        }

        if (data.gemstones) {
            await prisma.productGemstone.deleteMany({
                where: { productId: id },
            })

            for (const gemstone of data.gemstones) {
                await prisma.productGemstone.create({
                    data: {
                        productId: id,
                        type: gemstone.type,
                        carat: gemstone.carat,
                        color: gemstone.color,
                        clarity: gemstone.clarity,
                        cut: gemstone.cut,
                        quantity: gemstone.quantity,
                        description: gemstone.description as any,
                    },
                })
            }
        }

        if (data.hasVariants !== undefined || data.variants) {
            if (data.hasVariants === false) {
                await prisma.productVariant.deleteMany({
                    where: { productId: id },
                })
            }
            else if (data.variants) {
                await prisma.productVariant.deleteMany({
                    where: { productId: id },
                })

                for (const variant of data.variants) {
                    await prisma.productVariant.create({
                        data: {
                            productId: id,
                            sku: variant.sku,
                            attributes: variant.attributes,
                            price: variant.price as unknown as Prisma.InputJsonValue,
                            stock: variant.stock,
                            images: variant.images as unknown as Prisma.InputJsonValue,
                        },
                    })
                }
            }
        }

        const { collections, materials, gemstones, variants, ...updateData } = data
        if (updateData.stock !== undefined) {
            (updateData as any).status = updateData.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK"
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: updateData as any,
            include: {
                collections: {
                    include: {
                        collection: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                },
                materials: true,
                gemstones: true,
                variants: true,
            },
        })
        return {
            ...updatedProduct,
            collections: updatedProduct.collections.map((cp) => cp.collection.id),
        }
    } catch (error) {
        console.error(`Erro ao atualizar produto ${id}:`, error)
        throw error
    }
}

export async function deleteProduct(id: string) {
    try {
        const existingProduct = await prisma.product.findUnique({
            where: { id },
        })

        if (!existingProduct) {
            return false
        }


        await prisma.product.delete({
            where: { id },
        })

        return true
    } catch (error) {
        console.error(`Erro ao excluir produto ${id}:`, error)
        throw error
    }
}

export async function getProductReviews(
    productId: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string,
) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true },
        })

        if (!product) {
            return null
        }

        const skip = (page - 1) * limit

        const orderBy: any = {}
        orderBy[sortBy] = sortOrder
        const reviews = await prisma.productReview.findMany({
            where: { productId },
            orderBy,
            skip,
            take: limit,
        })
        const total = await prisma.productReview.count({ where: { productId } })

        return {
            reviews,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        }
    } catch (error) {
        console.error(`Erro ao buscar avaliações do produto ${productId}:`, error)
        throw error
    }
}


export async function addProductReview(productId: string, data: ProductReview) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
        })

        if (!product) {
            return null
        }

        const review = await prisma.productReview.create({
            data: {
                productId,
                userId: data.userId,
                rating: data.rating,
                title: data.title,
                content: data.content,
                images: data.images || [],
                verified: data.verified || false,
            },
        })
        const allReviews = await prisma.productReview.findMany({
            where: { productId },
            select: { rating: true },
        })

        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0)
        const averageRating = totalRating / allReviews.length

        await prisma.product.update({
            where: { id: productId },
            data: {
                rating: averageRating,
                reviewCount: allReviews.length,
            },
        })
        return review
    } catch (error) {
        console.error(`Erro ao adicionar avaliação ao produto ${productId}:`, error)
        throw error
    }
}

export async function incrementProductView(id: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            select: { id: true, viewCount: true },
        })

        if (!product) {
            return false
        }

        await prisma.product.update({
            where: { id },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
        })
        return true
    } catch (error) {
        console.error(`Erro ao incrementar visualização do produto ${id}:`, error)
        throw error
    }
}


export const productService = {
    getProducts,
    getProductById,
    getProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductReviews,
    addProductReview,
    incrementProductView,
}

export default productService
