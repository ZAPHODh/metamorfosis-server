import type { Request, Response } from "express"

import * as productService from "../services/product"
import { asyncHandler } from "../../helper"
import { ProductFilterParams } from "../../interfaces/product"

export const productController = {
    getProducts: asyncHandler(async (req: Request, res: Response) => {
        const {
            search,
            category,
            subcategory,
            featured,
            isNew,
            minPrice,
            maxPrice,
            currency = "BRL",
            language = "pt-BR",
            inStock,
            hasReviews,
            minRating,
            collections,
            tags,
            sortOrder,
            page = "1",
            limit = "10",
        } = req.query

        const filters: ProductFilterParams = {
            search: search as string,
            category: category as string,
            subcategory: subcategory as string,
            featured: featured === "true",
            isNew: isNew === "true",
            minPrice: minPrice ? Number.parseFloat(minPrice as string) : undefined,
            maxPrice: maxPrice ? Number.parseFloat(maxPrice as string) : undefined,
            currency: currency as string,
            language: language as string,
            inStock: inStock === "true",
            hasReviews: hasReviews === "true",
            minRating: minRating ? Number.parseFloat(minRating as string) : undefined,
            collections: collections ? (collections as string).split(",") : undefined,
            tags: tags ? (tags as string).split(",") : undefined,
            sortOrder: sortOrder as "asc" | "desc",
            page: Number.parseInt(page as string),
            limit: Number.parseInt(limit as string),
        }

        const result = await productService.getProducts(filters)

        res.json(result)
    }),

    getProductById: asyncHandler(async (req, res) => {
        const { id } = req.params
        const { language = "pt-BR", currency = "BRL" } = req.query

        const product = await productService.getProductById(id, language as string, currency as string)

        if (!product) {
            res.status(404).json({ message: "Produto não encontrado" })
            return
        }

        res.json(product)
    }),

    getProductBySlug: asyncHandler(async (req, res) => {
        const { slug } = req.params
        const { language = "pt-BR", currency = "BRL" } = req.query

        const product = await productService.getProductBySlug(slug, language as string, currency as string)

        if (!product) {
            res.status(404).json({ message: "Produto não encontrado" })
            return
        }

        res.json(product)
    }),

    createProduct: asyncHandler(async (req, res) => {
        const productData = req.body

        const product = await productService.createProduct(productData)

        res.status(201).json(product)
    }),

    updateProduct: asyncHandler(async (req, res) => {
        const { id } = req.params
        const productData = req.body

        const product = await productService.updateProduct(id, productData)

        if (!product) {
            res.status(404).json({ message: "Produto não encontrado" })
            return
        }

        res.json(product)
    }),

    deleteProduct: asyncHandler(async (req, res) => {
        const { id } = req.params

        const success = await productService.deleteProduct(id)

        if (!success) {
            res.status(404).json({ message: "Produto não encontrado" })
            return
        }

        res.status(204).send()
    }),

    getProductReviews: asyncHandler(async (req, res) => {
        const { id } = req.params
        const { page = "1", limit = "10", sortBy = "createdAt", sortOrder = "desc" } = req.query

        const reviews = await productService.getProductReviews(
            id,
            Number.parseInt(page as string),
            Number.parseInt(limit as string),
            sortBy as string,
            sortOrder as string,
        )

        if (!reviews) {
            res.status(404).json({ message: "Produto não encontrado" })
            return
        }

        res.json(reviews)
    }),

    addProductReview: asyncHandler(async (req, res) => {
        const { id } = req.params
        const reviewData = req.body

        const review = await productService.addProductReview(id, reviewData)

        if (!review) {
            res.status(404).json({ message: "Produto não encontrado" })
            return
        }

        res.status(201).json(review)
    }),

    incrementProductView: asyncHandler(async (req, res) => {
        const { id } = req.params

        const success = await productService.incrementProductView(id)

        if (!success) {
            res.status(404).json({ message: "Produto não encontrado" })
            return
        }

        res.status(204).send()
    }),
}

export default productController
