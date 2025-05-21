import { Prisma } from "@prisma/client"
import { prisma } from "../../../prisma/prisma"
import { ProductFilterParams, CreateProductDTO, UpdateProductDTO, ProductReview } from '../../interfaces/product'

/**
 * Listar todos os produtos com filtros
 */
export async function getProducts(filters: ProductFilterParams) {
    // Construir a consulta com base nos filtros
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
        // Precisamos verificar o preço no JSON para a moeda específica
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

    // Filtros para coleções
    if (filters.collections && filters.collections.length > 0) {
        where.collections = {
            some: {
                collectionId: { in: filters.collections },
            },
        }
    }

    // Filtros para tags
    if (filters.tags && filters.tags.length > 0) {
        where.tags = {
            hasSome: filters.tags,
        }
    }

    // Filtros para materiais
    if (filters.materials && filters.materials.length > 0) {
        where.materials = {
            some: {
                type: { in: filters.materials },
            },
        }
    }

    // Filtros para gemas
    if (filters.gemstones && filters.gemstones.length > 0) {
        where.gemstones = {
            some: {
                type: { in: filters.gemstones },
            },
        }
    }

    // Calcular paginação
    const page = filters.page ?? 1
    const skip = (page - 1) * (filters.limit ?? 10)

    // Definir ordenação
    const orderBy: any = {}
    if (filters.sortBy) {
        orderBy[filters.sortBy] = filters.sortOrder || "asc"
    } else {
        orderBy.createdAt = "desc"
    }

    try {
        // Executar a consulta
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

        // Contar o total de produtos para paginação
        const total = await prisma.product.count({ where })

        // Formatar a resposta
        const formattedProducts = products.map((product) => {
            // Extrair os dados multilíngues e de preço para o idioma e moeda solicitados
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

        // Formatar a resposta
        // Extrair os dados multilíngues e de preço para o idioma e moeda solicitados
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

        // Formatar a resposta
        // Extrair os dados multilíngues e de preço para o idioma e moeda solicitados
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
                // Criar materiais
                materials: {
                    create: data.materials.map((material) => ({
                        type: material.type,
                        color: material.color,
                        purity: material.purity,
                        description: material.description as any,
                    })),
                },
                // Criar gemas
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
                // Criar variantes
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

/**
 * Atualizar um produto
 */
export async function updateProduct(id: string, data: UpdateProductDTO) {
    try {
        // Verificar se o produto existe
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

        // Verificar se o SKU já existe (se estiver sendo atualizado)
        if (data.sku && data.sku !== existingProduct.sku) {
            const existingSku = await prisma.product.findUnique({
                where: { sku: data.sku },
            })

            if (existingSku) {
                throw new Error("SKU já existe")
            }
        }

        // Verificar se o slug já existe (se estiver sendo atualizado)
        if (data.slug && data.slug !== existingProduct.slug) {
            const existingSlug = await prisma.product.findUnique({
                where: { slug: data.slug },
            })

            if (existingSlug) {
                throw new Error("Slug já existe")
            }
        }

        // Atualizar coleções se necessário
        if (data.collections) {
            // Remover todas as associações existentes
            await prisma.collectionProduct.deleteMany({
                where: { productId: id },
            })

            // Adicionar novas associações
            for (const collectionId of data.collections) {
                await prisma.collectionProduct.create({
                    data: {
                        productId: id,
                        collectionId,
                    },
                })
            }
        }

        // Atualizar materiais se necessário
        if (data.materials) {
            // Remover todos os materiais existentes
            await prisma.productMaterial.deleteMany({
                where: { productId: id },
            })

            // Adicionar novos materiais
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

        // Atualizar gemas se necessário
        if (data.gemstones) {
            // Remover todas as gemas existentes
            await prisma.productGemstone.deleteMany({
                where: { productId: id },
            })

            // Adicionar novas gemas
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

        // Atualizar variantes se necessário
        if (data.hasVariants !== undefined || data.variants) {
            // Se hasVariants for false, remover todas as variantes
            if (data.hasVariants === false) {
                await prisma.productVariant.deleteMany({
                    where: { productId: id },
                })
            }
            // Se houver novas variantes, atualizar
            else if (data.variants) {
                // Remover todas as variantes existentes
                await prisma.productVariant.deleteMany({
                    where: { productId: id },
                })

                // Adicionar novas variantes
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

        // Remover campos que serão tratados separadamente
        const { collections, materials, gemstones, variants, ...updateData } = data

        // Atualizar o status com base no estoque, se o estoque estiver sendo atualizado
        if (updateData.stock !== undefined) {
            (updateData as any).status = updateData.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK"
        }

        // Atualizar o produto
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

        // Formatar a resposta
        return {
            ...updatedProduct,
            collections: updatedProduct.collections.map((cp) => cp.collection.id),
        }
    } catch (error) {
        console.error(`Erro ao atualizar produto ${id}:`, error)
        throw error
    }
}

/**
 * Excluir um produto
 */
export async function deleteProduct(id: string) {
    try {
        // Verificar se o produto existe
        const existingProduct = await prisma.product.findUnique({
            where: { id },
        })

        if (!existingProduct) {
            return false
        }

        // Excluir o produto
        await prisma.product.delete({
            where: { id },
        })

        return true
    } catch (error) {
        console.error(`Erro ao excluir produto ${id}:`, error)
        throw error
    }
}

/**
 * Obter avaliações de um produto
 */
export async function getProductReviews(
    productId: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string,
) {
    try {
        // Verificar se o produto existe
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true },
        })

        if (!product) {
            return null
        }

        // Calcular paginação
        const skip = (page - 1) * limit

        // Definir ordenação
        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        // Buscar avaliações
        const reviews = await prisma.productReview.findMany({
            where: { productId },
            orderBy,
            skip,
            take: limit,
        })

        // Contar o total de avaliações para paginação
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

/**
 * Adicionar uma avaliação a um produto
 */
export async function addProductReview(productId: string, data: ProductReview) {
    try {
        // Verificar se o produto existe
        const product = await prisma.product.findUnique({
            where: { id: productId },
        })

        if (!product) {
            return null
        }

        // Criar a avaliação
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

        // Atualizar a média de avaliações e o contador de avaliações do produto
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

/**
 * Incrementar a contagem de visualizações de um produto
 */
export async function incrementProductView(id: string) {
    try {
        // Verificar se o produto existe
        const product = await prisma.product.findUnique({
            where: { id },
            select: { id: true, viewCount: true },
        })

        if (!product) {
            return false
        }

        // Incrementar a contagem de visualizações
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
