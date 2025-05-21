import type { Request, Response } from "express"


import { asyncHandler } from "../../helper"



export const orderController = {

    getOrders: asyncHandler(async (req: Request, res: Response) => {
        const filters = {
            search: req.query.search as string,
            status: req.query.status as string,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
            sortBy: (req.query.sortBy as string) || "createdAt",
            sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
        }

        const result = await orderService.getOrders(filters)
        res.json(result)
    }),


    getOrderById: asyncHandler(async (req, res) => {
        const id = req.params.id

        const order = await orderService.getOrderById(id)

        if (!order) {
            res.status(404).json({ error: "Pedido não encontrado" })
            return
        }

        res.json(order)
    }),


    createOrder: asyncHandler(async (req, res) => {

        const data = req.body

        const order = await orderService.createOrder(data)
        res.status(201).json(order)
    }),

    updateOrder: asyncHandler(async (req, res) => {
        const id = req.params.id
        const data = req.body

        const order = await orderService.updateOrder(id, data)

        if (!order) {
            res.status(404).json({ error: "Pedido não encontrado" })
            return
        }

        res.json(order)
    }),

    updateOrderStatus: asyncHandler(async (req, res) => {
        const id = req.params.id
        const data = req.body

        const order = await orderService.updateOrderStatus(id, data)

        if (!order) {
            res.status(404).json({ error: "Pedido não encontrado" })
            return
        }

        res.json(order)
    }),
}
