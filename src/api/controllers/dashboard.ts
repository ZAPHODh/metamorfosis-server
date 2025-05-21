
import { asyncHandler } from "../../helper"

export const dashboardController = {
    /**
     * Obter estatísticas gerais do dashboard
     */
    getStats: asyncHandler(async (req, res) => {
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string

        const stats = await dashboardService.getStats(startDate, endDate)
        res.json(stats)
    }),

    /**
     * Obter dados de vendas para o dashboard
     */
    getSales: asyncHandler(async (req, res) => {
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string
        const groupBy = (req.query.groupBy as "day" | "week" | "month") || "day"

        const sales = await dashboardService.getSales(startDate, endDate, groupBy)
        res.json(sales)
    }),

    /**
     * Obter status do inventário para o dashboard
     */
    getInventory: asyncHandler(async (req, res) => {
        const lowStockOnly = req.query.lowStockOnly === "true"

        const inventory = await dashboardService.getInventory(lowStockOnly)
        res.json(inventory)
    }),

    /**
     * Obter estatísticas de clientes para o dashboard
     */
    getCustomerStats: asyncHandler(async (req, res) => {
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string

        const customerStats = await dashboardService.getCustomerStats(startDate, endDate)
        res.json(customerStats)
    }),

    /**
     * Obter dados financeiros para o dashboard
     */
    getFinances: asyncHandler(async (req, res) => {
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string
        const groupBy = (req.query.groupBy as "day" | "week" | "month") || "month"

        const finances = await dashboardService.getFinances(startDate, endDate, groupBy)
        res.json(finances)
    }),
}
