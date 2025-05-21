
import { prisma } from "../../../prisma/prisma"
import type { CollectionFilterParams, CreateCollectionDTO, UpdateCollectionDTO } from "../../interfaces/index"




export async function getCollections(filters: CollectionFilterParams) {
    try {
        const where: any = {}

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: "insensitive" } },
                { description: { contains: filters.search, mode: "insensitive" } },
            ]
        }

        if (filters.featured !== undefined) {
            where.featured = filters.featured
        }

        if (filters.active !== undefined) {
            where.active = filters.active
        }

        // Calcular paginação
        const page = filters.page ?? 1
        const limit = filters.limit ?? 10
        const skip = (page - 1) * limit

        // Definir ordenação
        const orderBy: any = {}
        if (filters.sortBy) {
            orderBy[filters.sortBy] = filters.sortOrder || "asc"
        } else {
            orderBy.createdAt = "desc"
        }

        const collections = await prisma.collection.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: {
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        })

        // Contar o total de coleções para paginação
        const total = await prisma.collection.count({ where })

        return {
            collections,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        }
    } catch (error) {
        console.error("Erro ao buscar coleções:", error)
        throw error
    }
}

/**
 * Obter uma coleção pelo ID
 */
export async function getCollectionById(id: string) {
    try {
        const collection = await prisma.collection.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        })

        return collection
    } catch (error) {
        console.error(`Erro ao buscar coleção ${id}:`, error)
        throw error
    }
}

/**
 * Obter uma coleção pelo slug
 */
export async function getCollectionBySlug(slug: string) {
    try {
        const collection = await prisma.collection.findUnique({
            where: { slug },
            include: {
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        })

        return collection
    } catch (error) {
        console.error(`Erro ao buscar coleção com slug ${slug}:`, error)
        throw error
    }
}

/**
 * Obter produtos de uma coleção
 */
export async function getCollectionProducts(
    id: string,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: string,
    language: string,
    currency: string,
) {
    try {
        // Verificar se a coleção existe
        const collection = await prisma.collection.findUnique({
            where: { id },
            select: { id: true },
        })

        if (!collection) {
            return null
        }

        // Calcular paginação
        const skip = (page - 1) * limit

        // Definir ordenação
        const orderBy: any = {}
        if (sortBy) {
            orderBy[sortBy] = sortOrder || "asc"
        } else {
            orderBy.createdAt = "desc"
        }

        // Buscar produtos da coleção
        const products = await prisma.product.findMany({
            where: {
                collections: {
                    some: {
                        collectionId: id,
                    },
                },
            },
            orderBy,
            skip,
            take: limit,
            include: {
                materials: true,
                gemstones: true,
                variants: true,
            },
        })

        // Contar o total de produtos para paginação
        const total = await prisma.product.count({
            where: {
                collections: {
                    some: {
                        collectionId: id,
                    },
                },
            },
        })

        // Formatar a resposta
        const formattedProducts = products.map((product) => {
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
            }
        })

        return {
            products: formattedProducts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        }
    } catch (error) {
        console.error(`Erro ao buscar produtos da coleção ${id}:`, error)
        throw error
    }
}

/**
 * Criar uma nova coleção
 */
export async function createCollection(data: CreateCollectionDTO) {
    try {
        // Validar dados
        if (!data.name || !data.description) {
            throw new Error("Nome e descrição são obrigatórios")
        }

        // Verificar se o slug já existe
        if (data.slug) {
            const existingSlug = await prisma.collection.findUnique({
                where: { slug: data.slug },
            })

            if (existingSlug) {
                throw new Error("Slug já existe")
            }
        }

        // Criar a coleção
        const collection = await prisma.collection.create({
            data: {
                name: data.name,
                description: data.description,
                slug: data.slug || data.name.toLowerCase().replace(/\s+/g, "-"),
                image: data.image,
                featured: data.featured || false,
                active: data.active !== undefined ? data.active : true,
                startDate: data.startDate,
                endDate: data.endDate,
            },
        })

        return collection
    } catch (error) {
        console.error("Erro ao criar coleção:", error)
        throw error
    }
}

/**
 * Atualizar uma coleção
 */
export async function updateCollection(id: string, data: UpdateCollectionDTO) {
    try {
        // Verificar se a coleção existe
        const existingCollection = await prisma.collection.findUnique({
            where: { id },
        })

        if (!existingCollection) {
            return null
        }

        // Verificar se o slug já existe (se estiver sendo atualizado)
        if (data.slug && data.slug !== existingCollection.slug) {
            const existingSlug = await prisma.collection.findUnique({
                where: { slug: data.slug },
            })

            if (existingSlug) {
                throw new Error("Slug já existe")
            }
        }

        // Atualizar a coleção
        const updatedCollection = await prisma.collection.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                slug: data.slug,
                image: data.image,
                featured: data.featured,
                active: data.active,
                startDate: data.startDate,
                endDate: data.endDate,
            },
        })

        return updatedCollection
    } catch (error) {
        console.error(`Erro ao atualizar coleção ${id}:`, error)
        throw error
    }
}

/**
 * Excluir uma coleção
 */
export async function deleteCollection(id: string) {
    try {
        // Verificar se a coleção existe
        const existingCollection = await prisma.collection.findUnique({
            where: { id },
        })

        if (!existingCollection) {
            return false
        }

        // Excluir a coleção
        await prisma.collection.delete({
            where: { id },
        })

        return true
    } catch (error) {
        console.error(`Erro ao excluir coleção ${id}:`, error)
        throw error
    }
}

/**
 * Adicionar produtos a uma coleção
 */
export async function addProductsToCollection(id: string, productIds: string[]) {
    try {
        // Verificar se a coleção existe
        const existingCollection = await prisma.collection.findUnique({
            where: { id },
        })

        if (!existingCollection) {
            return null
        }

        // Adicionar produtos à coleção
        const results = await Promise.all(
            productIds.map(async (productId) => {
                try {
                    // Verificar se o produto existe
                    const product = await prisma.product.findUnique({
                        where: { id: productId },
                        select: { id: true },
                    })

                    if (!product) {
                        return { productId, success: false, error: "Produto não encontrado" }
                    }

                    // Verificar se o produto já está na coleção
                    const existingRelation = await prisma.collectionProduct.findFirst({
                        where: {
                            collectionId: id,
                            productId,
                        },
                    })

                    if (existingRelation) {
                        return { productId, success: false, error: "Produto já está na coleção" }
                    }

                    // Adicionar produto à coleção
                    await prisma.collectionProduct.create({
                        data: {
                            collectionId: id,
                            productId,
                        },
                    })

                    return { productId, success: true }
                } catch (error) {
                    console.error(`Erro ao adicionar produto ${productId} à coleção:`, error)
                    return { productId, success: false, error: "Erro interno" }
                }
            }),
        )

        return {
            collectionId: id,
            results,
            success: results.some((result) => result.success),
        }
    } catch (error) {
        console.error(`Erro ao adicionar produtos à coleção ${id}:`, error)
        throw error
    }
}

/**
 * Remover produtos de uma coleção
 */
export async function removeProductsFromCollection(id: string, productIds: string[]) {
    try {
        // Verificar se a coleção existe
        const existingCollection = await prisma.collection.findUnique({
            where: { id },
        })

        if (!existingCollection) {
            return null
        }

        // Remover produtos da coleção
        await prisma.collectionProduct.deleteMany({
            where: {
                collectionId: id,
                productId: {
                    in: productIds,
                },
            },
        })

        return {
            collectionId: id,
            removedProductIds: productIds,
            success: true,
        }
    } catch (error) {
        console.error(`Erro ao remover produtos da coleção ${id}:`, error)
        throw error
    }
}

// Exportar todas as funções como um objeto
export const collectionService = {
    getCollections,
    getCollectionById,
    getCollectionBySlug,
    getCollectionProducts,
    createCollection,
    updateCollection,
    deleteCollection,
    addProductsToCollection,
    removeProductsFromCollection,
}

export default collectionService
