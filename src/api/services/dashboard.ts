
import { prisma } from "../../../prisma/prisma"

export async function getStats(startDate?: string, endDate?: string) {
    try {
        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1))
        const end = endDate ? new Date(endDate) : new Date()
        const salesStats = await prisma.order.aggregate({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            _count: {
                id: true,
            },
            _sum: {
                total: true,
            },
        })
        const productStats = await prisma.product.aggregate({
            _count: {
                id: true,
            },
        })
        const lowStockCount = await prisma.product.count({
            where: {
                stock: {
                    lt: 10,
                },
            },
        })
        const customerStats = await prisma.user.aggregate({
            where: {
                role: "CUSTOMER",
            },
            _count: {
                id: true,
            },
        })
        const newCustomersCount = await prisma.user.count({
            where: {
                role: "CUSTOMER",
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
        })
        const supportStats = await prisma.supportTicket.groupBy({
            by: ["status"],
            _count: {
                id: true,
            },
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
        })
        const supportCounts = {
            total: 0,
            open: 0,
            inProgress: 0,
            closed: 0,
        }
        supportStats.forEach((stat) => {
            supportCounts.total += stat._count.id
            if (stat.status === "OPEN") supportCounts.open = stat._count.id
            if (stat.status === "ANSWERED") supportCounts.inProgress = stat._count.id
            if (stat.status === "CLOSED") supportCounts.closed = stat._count.id
        })

        return {
            period: {
                start,
                end,
            },
            sales: {
                count: salesStats._count.id || 0,
                total: salesStats._sum.total || 0,
            },
            products: {
                count: productStats._count.id || 0,
                lowStock: lowStockCount,
            },
            customers: {
                count: customerStats._count.id || 0,
                new: newCustomersCount,
            },
            support: supportCounts,
        }
    } catch (error) {
        console.error("Erro ao buscar estatísticas do dashboard:", error)
        throw error
    }
}


export async function getSales(startDate?: string, endDate?: string, groupBy: "day" | "week" | "month" = "day") {
    try {
        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1))
        const end = endDate ? new Date(endDate) : new Date()
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            select: {
                id: true,
                total: true,
                createdAt: true,
                items: {
                    select: {
                        quantity: true,
                        product: {
                            select: {
                                id: true,
                                name: true,
                                category: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        })
        const salesByPeriod = groupSalesByPeriod(orders, groupBy)
        const salesByCategory = calculateSalesByCategory(orders)
        const topProducts = calculateTopProducts(orders)
        return {
            period: {
                start,
                end,
                groupBy,
            },
            salesByPeriod,
            salesByCategory,
            topProducts,
            totalSales: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + Number(order.total), 0),
        }
    } catch (error) {
        console.error("Erro ao buscar dados de vendas:", error)
        throw error
    }
}


function groupSalesByPeriod(orders: any[], groupBy: "day" | "week" | "month") {
    const salesByPeriod = new Map()
    orders.forEach((order) => {
        let periodKey
        if (groupBy === "day") {
            periodKey = order.createdAt.toISOString().split("T")[0]
        } else if (groupBy === "week") {
            const date = new Date(order.createdAt)
            const firstDayOfWeek = new Date(date.setDate(date.getDate() - date.getDay()))
            periodKey = firstDayOfWeek.toISOString().split("T")[0]
        } else if (groupBy === "month") {
            periodKey = order.createdAt.toISOString().substring(0, 7)
        }
        if (!salesByPeriod.has(periodKey)) {
            salesByPeriod.set(periodKey, {
                period: periodKey,
                count: 0,
                revenue: 0,
            })
        }
        const periodData = salesByPeriod.get(periodKey)
        periodData.count += 1
        periodData.revenue += order.total
        salesByPeriod.set(periodKey, periodData)
    })
    return Array.from(salesByPeriod.values()).sort((a, b) => a.period.localeCompare(b.period))
}

function calculateSalesByCategory(orders: any[]) {
    const salesByCategory = new Map()
    orders.forEach((order) => {
        order.items.forEach((item) => {
            const category = item.product.category || "Sem categoria"
            const revenue = item.price * item.quantity
            if (!salesByCategory.has(category)) {
                salesByCategory.set(category, {
                    category,
                    count: 0,
                    revenue: 0,
                })
            }

            const categoryData = salesByCategory.get(category)
            categoryData.count += item.quantity
            categoryData.revenue += revenue
            salesByCategory.set(category, categoryData)
        })
    })
    return Array.from(salesByCategory.values()).sort((a, b) => b.revenue - a.revenue)
}

function calculateTopProducts(orders: any[]) {
    const productSales = new Map()
    orders.forEach((order) => {
        order.items.forEach((item) => {
            const productId = item.product.id
            const revenue = item.price * item.quantity
            if (!productSales.has(productId)) {
                productSales.set(productId, {
                    id: productId,
                    name: item.product.name,
                    category: item.product.category,
                    quantity: 0,
                    revenue: 0,
                })
            }
            const productData = productSales.get(productId)
            productData.quantity += item.quantity
            productData.revenue += revenue
            productSales.set(productId, productData)
        })
    })
    return Array.from(productSales.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)
}


export async function getInventory(lowStockOnly = false) {
    try {
        const products = await prisma.product.findMany({
            where: lowStockOnly
                ? {
                    stock: {
                        lt: 10,
                    },
                }
                : {},
            select: {
                id: true,
                name: true,
                sku: true,
                stock: true,
                category: true,
                price: true,
                _count: {
                    select: {
                        orderItems: true,
                    },
                },
            },
            orderBy: lowStockOnly
                ? {
                    stock: "asc",
                }
                : {
                    orderItems: {
                        _count: "desc",
                    },
                },
            take: 50,
        })
        const totalInventoryValue = products.reduce((sum, product) => {
            const price = typeof product.price === "number" && product.price !== null ? product.price : 0;
            return sum + price * product.stock;
        }, 0)
        const categoryCounts = new Map()
        products.forEach((product) => {
            const category = product.category || "Sem categoria"
            if (!categoryCounts.has(category)) {
                categoryCounts.set(category, {
                    category,
                    count: 0,
                    value: 0,
                })
            }
            const categoryData = categoryCounts.get(category)
            categoryData.count += 1
            categoryData.value += product.price ? product.price : 0 * product.stock
            categoryCounts.set(category, categoryData)
        })

        return {
            products: products.map((product) => ({
                id: product.id,
                name: product.name,
                sku: product.sku,
                stock: product.stock,
                category: product.category,
                price: product.price,
                value: product.price ? product.price : 0 * product.stock,
                orderCount: product._count.orderItems,
            })),
            categories: Array.from(categoryCounts.values()),
            totalProducts: products.length,
            totalValue: totalInventoryValue,
            lowStockCount: products.filter((p) => p.stock < 10).length,
        }
    } catch (error) {
        console.error("Erro ao buscar status do inventário:", error)
        throw error
    }
}


export async function getCustomerStats(startDate?: string, endDate?: string) {
    try {
        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1))
        const end = endDate ? new Date(endDate) : new Date()

        const newCustomers = await prisma.user.findMany({
            where: {
                role: "CUSTOMER",
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        })
        const topCustomers = await prisma.user.findMany({
            where: {
                role: "CUSTOMER",
            },
            select: {
                id: true,
                name: true,
                email: true,
                _count: {
                    select: {
                        orders: true,
                    },
                },
                orders: {
                    select: {
                        total: true,
                    },
                },
            },
            orderBy: {
                orders: {
                    _count: "desc",
                },
            },
            take: 10,
        })
        const topCustomersWithTotal = topCustomers.map((customer) => ({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            orderCount: customer._count.orders,
            totalSpent: customer.orders.reduce((sum, order) => sum + (typeof order.total === "number" ? order.total : order.total.toNumber()), 0),
        }))
        const totalCustomers = await prisma.user.count({
            where: {
                role: "CUSTOMER",
            },
        })
        const activeCustomers = await prisma.user.count({
            where: {
                role: "CUSTOMER",
                orders: {
                    some: {
                        createdAt: {
                            gte: start,
                        },
                    },
                },
            },
        })
        return {
            period: {
                start,
                end,
            },
            newCustomers,
            topCustomers: topCustomersWithTotal,
            stats: {
                total: totalCustomers,
                new: newCustomers.length,
                active: activeCustomers,
                inactive: totalCustomers - activeCustomers,
            },
        }
    } catch (error) {
        console.error("Erro ao buscar estatísticas de clientes:", error)
        throw error
    }
}
export async function getFinances(startDate?: string, endDate?: string, groupBy: "day" | "week" | "month" = "month") {
    try {
        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6))
        const end = endDate ? new Date(endDate) : new Date()

        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            select: {
                id: true,
                total: true,
                createdAt: true,
                status: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        })
        const expenses = await prisma.expense.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end,
                },
            },
            select: {
                id: true,
                amount: true,
                category: true,
                date: true,
            },
            orderBy: {
                date: "asc",
            },
        })
        const revenueByPeriod = groupFinancesByPeriod(orders, groupBy, "total")
        const expensesByPeriod = groupFinancesByPeriod(expenses, groupBy, "amount")
        const profitByPeriod = calculateProfitByPeriod(revenueByPeriod, expensesByPeriod)
        const expensesByCategory = calculateExpensesByCategory(expenses)
        const totalRevenue = orders.reduce((sum, order) => sum + (typeof order.total === "number" ? order.total : order.total.toNumber()), 0)
        const totalExpenses = expenses.reduce((sum, expense) => sum + (typeof expense.amount === "number" ? expense.amount : expense.amount.toNumber()), 0)
        const totalProfit = totalRevenue - totalExpenses

        return {
            period: {
                start,
                end,
                groupBy,
            },
            revenueByPeriod,
            expensesByPeriod,
            profitByPeriod,
            expensesByCategory,
            totals: {
                revenue: totalRevenue,
                expenses: totalExpenses,
                profit: totalProfit,
                profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
            },
        }
    } catch (error) {
        console.error("Erro ao buscar dados financeiros:", error)
        throw error
    }
}

function groupFinancesByPeriod(items: any[], groupBy: "day" | "week" | "month", amountField: string) {
    const byPeriod = new Map()

    items.forEach((item) => {
        let periodKey
        const date = new Date(item.createdAt || item.date)

        if (groupBy === "day") {
            periodKey = date.toISOString().split("T")[0] // YYYY-MM-DD
        } else if (groupBy === "week") {
            const firstDayOfWeek = new Date(date.setDate(date.getDate() - date.getDay()))
            periodKey = firstDayOfWeek.toISOString().split("T")[0] // YYYY-MM-DD (primeiro dia da semana)
        } else if (groupBy === "month") {
            periodKey = date.toISOString().substring(0, 7) // YYYY-MM
        }

        if (!byPeriod.has(periodKey)) {
            byPeriod.set(periodKey, {
                period: periodKey,
                amount: 0,
            })
        }

        const periodData = byPeriod.get(periodKey)
        periodData.amount += item[amountField]
        byPeriod.set(periodKey, periodData)
    })

    return Array.from(byPeriod.values()).sort((a, b) => a.period.localeCompare(b.period))
}

function calculateProfitByPeriod(revenue: any[], expenses: any[]) {
    const profitByPeriod = new Map()
    revenue.forEach((item) => {
        profitByPeriod.set(item.period, {
            period: item.period,
            revenue: item.amount,
            expenses: 0,
            profit: item.amount,
        })
    })
    expenses.forEach((item) => {
        if (!profitByPeriod.has(item.period)) {
            profitByPeriod.set(item.period, {
                period: item.period,
                revenue: 0,
                expenses: item.amount,
                profit: -item.amount,
            })
        } else {
            const periodData = profitByPeriod.get(item.period)
            periodData.expenses = item.amount
            periodData.profit = periodData.revenue - item.amount
            profitByPeriod.set(item.period, periodData)
        }
    })

    return Array.from(profitByPeriod.values()).sort((a, b) => a.period.localeCompare(b.period))
}

function calculateExpensesByCategory(expenses: any[]) {
    const expensesByCategory = new Map()

    expenses.forEach((expense) => {
        const category = expense.category || "Outros"

        if (!expensesByCategory.has(category)) {
            expensesByCategory.set(category, {
                category,
                amount: 0,
                count: 0,
            })
        }

        const categoryData = expensesByCategory.get(category)
        categoryData.amount += expense.amount
        categoryData.count += 1
        expensesByCategory.set(category, categoryData)
    })

    return Array.from(expensesByCategory.values()).sort((a, b) => b.amount - a.amount)
}

export const dashboardService = {
    getStats,
    getSales,
    getInventory,
    getCustomerStats,
    getFinances,
}

export default dashboardService
