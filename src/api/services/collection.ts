
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

        const page = filters.page ?? 1
        const limit = filters.limit ?? 10
        const skip = (page - 1) * limit

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
        const collection = await prisma.collection.findUnique({
            where: { id },
            select: { id: true },
        })

        if (!collection) {
            return null
        }
        const skip = (page - 1) * limit
        const orderBy: any = {}
        if (sortBy) {
            orderBy[sortBy] = sortOrder || "asc"
        } else {
            orderBy.createdAt = "desc"
        }
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
        const total = await prisma.product.count({
            where: {
                collections: {
                    some: {
                        collectionId: id,
                    },
                },
            },
        })

        const formattedProducts = products.map((product) => {
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

export async function createCollection(data: CreateCollectionDTO) {
    try {
        if (!data.name || !data.description) {
            throw new Error("Nome e descrição são obrigatórios")
        }
        if (data.slug) {
            const existingSlug = await prisma.collection.findUnique({
                where: { slug: data.slug },
            })
            if (existingSlug) {
                throw new Error("Slug já existe")
            }
        }

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

export async function updateCollection(id: string, data: UpdateCollectionDTO) {
    try {
        const existingCollection = await prisma.collection.findUnique({
            where: { id },
        })

        if (!existingCollection) {
            return null
        }

        if (data.slug && data.slug !== existingCollection.slug) {
            const existingSlug = await prisma.collection.findUnique({
                where: { slug: data.slug },
            })

            if (existingSlug) {
                throw new Error("Slug já existe")
            }
        }

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


export async function deleteCollection(id: string) {
    try {
        const existingCollection = await prisma.collection.findUnique({
            where: { id },
        })

        if (!existingCollection) {
            return false
        }

        await prisma.collection.delete({
            where: { id },
        })

        return true
    } catch (error) {
        console.error(`Erro ao excluir coleção ${id}:`, error)
        throw error
    }
}

export async function addProductsToCollection(id: string, productIds: string[]) {
    try {
        const existingCollection = await prisma.collection.findUnique({
            where: { id },
        })

        if (!existingCollection) {
            return null
        }

        const results = await Promise.all(
            productIds.map(async (productId) => {
                try {
                    const product = await prisma.product.findUnique({
                        where: { id: productId },
                        select: { id: true },
                    })

                    if (!product) {
                        return { productId, success: false, error: "Produto não encontrado" }
                    }

                    const existingRelation = await prisma.collectionProduct.findFirst({
                        where: {
                            collectionId: id,
                            productId,
                        },
                    })

                    if (existingRelation) {
                        return { productId, success: false, error: "Produto já está na coleção" }
                    }

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


export async function removeProductsFromCollection(id: string, productIds: string[]) {
    try {
        const existingCollection = await prisma.collection.findUnique({
            where: { id },
        })

        if (!existingCollection) {
            return null
        }

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
