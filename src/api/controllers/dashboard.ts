
import { asyncHandler } from "../../helper"
import dashboardService from "../services/dashboard"

export const dashboardController = {
    getStats: asyncHandler(async (req, res) => {
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string

        const stats = await dashboardService.getStats(startDate, endDate)
        res.json(stats)
    }),

    getSales: asyncHandler(async (req, res) => {
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string
        const groupBy = (req.query.groupBy as "day" | "week" | "month") || "day"

        const sales = await dashboardService.getSales(startDate, endDate, groupBy)
        res.json(sales)
    }),

    getInventory: asyncHandler(async (req, res) => {
        const lowStockOnly = req.query.lowStockOnly === "true"

        const inventory = await dashboardService.getInventory(lowStockOnly)
        res.json(inventory)
    }),
    getCustomerStats: asyncHandler(async (req, res) => {
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string

        const customerStats = await dashboardService.getCustomerStats(startDate, endDate)
        res.json(customerStats)
    }),
    getFinances: asyncHandler(async (req, res) => {
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string
        const groupBy = (req.query.groupBy as "day" | "week" | "month") || "month"

        const finances = await dashboardService.getFinances(startDate, endDate, groupBy)
        res.json(finances)
    }),
}
