
import { asyncHandler } from "../../helper"
import dashboardService from "../services/dashboard"

export const dashboardController = {
    /**
     * Retorna estatísticas gerais do sistema no intervalo de datas especificado.
     *
     * @returns {Promise<Stats>} Estatísticas como número de vendas, clientes, etc.
     */
    getStats: asyncHandler(async (req, res) => {
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string

        const stats = await dashboardService.getStats(startDate, endDate)
        res.json(stats)
    }),

    /**
     * Retorna os dados de vendas agrupados por dia, semana ou mês.
     *
     * @returns {Promise<SaleGroup[]>} Lista de vendas agrupadas por período.
     */
    getSales: asyncHandler(async (req, res) => {
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string
        const groupBy = (req.query.groupBy as "day" | "week" | "month") || "day"

        const sales = await dashboardService.getSales(startDate, endDate, groupBy)
        res.json(sales)
    }),

    /**
     * Retorna o inventário atual. Pode filtrar apenas os produtos com baixo estoque.
     *
     * @returns {Promise<InventoryItem[]>} Lista de itens do inventário.
     */
    getInventory: asyncHandler(async (req, res) => {
        const lowStockOnly = req.query.lowStockOnly === "true"

        const inventory = await dashboardService.getInventory(lowStockOnly)
        res.json(inventory)
    }),

    /**
     * Retorna estatísticas de clientes dentro de um intervalo de datas.
     *
     * @returns {Promise<CustomerStats>} Dados sobre novos clientes, frequência, etc.
     */
    getCustomerStats: asyncHandler(async (req, res) => {
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string

        const customerStats = await dashboardService.getCustomerStats(startDate, endDate)
        res.json(customerStats)
    }),

    /**
     * Retorna os dados financeiros do sistema agrupados por período.
     *
     * @returns {Promise<FinanceStats>} Entradas, saídas e balanço agrupados.
     */
    getFinances: asyncHandler(async (req, res) => {
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string
        const groupBy = (req.query.groupBy as "day" | "week" | "month") || "month"

        const finances = await dashboardService.getFinances(startDate, endDate, groupBy)
        res.json(finances)
    }),
}