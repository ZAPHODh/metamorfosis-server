import { asyncHandler } from "../../helper"
import collectionService from "../services/collection"
import { CollectionFilterParams } from "../../interfaces"



export const collectionController = {
    getCollections: asyncHandler(async (req, res) => {
        const filters: CollectionFilterParams = {
            search: req.query.search as string,
            featured: req.query.featured === "true" ? true : req.query.featured === "false" ? false : undefined,
            active: req.query.active === "true" ? true : req.query.active === "false" ? false : undefined,
            sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
        }

        const result = await collectionService.getCollections(filters)
        res.json(result)
    }),
    getCollectionById: asyncHandler(async (req, res) => {
        const id = req.params.id

        const collection = await collectionService.getCollectionById(id)

        if (!collection) {
            res.status(404).json({ error: "Coleção não encontrada" })
            return
        }

        res.json(collection)
    }),


    getCollectionBySlug: asyncHandler(async (req, res) => {
        const slug = req.params.slug

        const collection = await collectionService.getCollectionBySlug(slug)

        if (!collection) {
            res.status(404).json({ error: "Coleção não encontrada" })
            return
        }

        res.json(collection)
    }),

    getCollectionProducts: asyncHandler(async (req, res) => {
        const id = req.params.id
        const page = req.query.page ? Number(req.query.page) : 1
        const limit = req.query.limit ? Number(req.query.limit) : 10
        const sortBy = (req.query.sortBy as string) || "createdAt"
        const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc"
        const language = (req.query.language as string) || "pt-BR"
        const currency = (req.query.currency as string) || "BRL"

        const result = await collectionService.getCollectionProducts(id, page, limit, sortBy, sortOrder, language, currency)

        if (!result) {
            res.status(404).json({ error: "Coleção não encontrada" })
            return
        }

        res.json(result)
    }),

    createCollection: asyncHandler(async (req, res) => {
        const data = req.body

        const collection = await collectionService.createCollection(data)
        res.status(201).json(collection)
    }),

    updateCollection: asyncHandler(async (req, res) => {
        const id = req.params.id
        const data = req.body

        const collection = await collectionService.updateCollection(id, data)

        if (!collection) {
            res.status(404).json({ error: "Coleção não encontrada" })
            return
        }

        res.json(collection)
    }),
    deleteCollection: asyncHandler(async (req, res) => {
        const id = req.params.id

        const success = await collectionService.deleteCollection(id)

        if (!success) {
            res.status(404).json({ error: "Coleção não encontrada" })
            return
        }

        res.json({ success: true })
    }),
    addProductsToCollection: asyncHandler(async (req, res) => {
        const id = req.params.id
        const { productIds } = req.body

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            res.status(400).json({ error: "Lista de IDs de produtos é obrigatória" })
            return
        }

        const result = await collectionService.addProductsToCollection(id, productIds)

        if (!result) {
            res.status(404).json({ error: "Coleção não encontrada" })
            return
        }

        res.json(result)
    }),
    removeProductsFromCollection: asyncHandler(async (req, res) => {
        const id = req.params.id
        const { productIds } = req.body

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            res.status(400).json({ error: "Lista de IDs de produtos é obrigatória" })
            return
        }
        const result = await collectionService.removeProductsFromCollection(id, productIds)
        if (!result) {
            res.status(404).json({ error: "Coleção não encontrada" })
            return
        }
        res.json(result)
    }),
}
