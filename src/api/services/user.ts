import { PrismaClient, type UserRole, type UserStatus } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prisma } from "../../../prisma/prisma"

export interface UserCreateDTO {
    name: string
    email: string
    password: string
    role: UserRole
    phone?: string
    document?: string
    birthDate?: string
    department?: string
    permissions?: string[]
}

export interface UserUpdateDTO {
    name?: string
    email?: string
    phone?: string
    document?: string
    birthDate?: string
    role?: UserRole
    department?: string
    status?: UserStatus
    endDate?: string
    permissions?: string[]
    avatar?: string
}

export class UserService {
    private prisma: PrismaClient

    constructor() {
        this.prisma = prisma
    }

    /**
     * Obtém lista de usuários com filtros
     */
    async getUsers(filters: {
        search?: string
        role?: UserRole
        status?: UserStatus
        sortBy?: string
        sortOrder?: "asc" | "desc"
        page?: number
        limit?: number
    }) {
        try {
            const { search, role, status, sortBy = "name", sortOrder = "asc", page = 1, limit = 10 } = filters

            // Construir filtros
            const where: any = {}

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search, mode: "insensitive" } },
                ]
            }

            if (role) {
                where.role = role
            }

            if (status) {
                where.status = status
            }

            const total = await this.prisma.user.count({ where })


            const users = await this.prisma.user.findMany({
                where,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    document: true,
                    birthDate: true,
                    role: true,
                    department: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    permissions: true,
                    avatar: true,
                    createdAt: true,
                    updatedAt: true,
                },
            })

            return {
                data: users,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            }
        } catch (error) {
            console.error("Erro ao buscar usuários:", error)
            throw error
        }
    }

    /**
     * Obtém um usuário pelo ID
     */
    async getUserById(id: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    document: true,
                    birthDate: true,
                    role: true,
                    department: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    permissions: true,
                    avatar: true,
                    createdAt: true,
                    updatedAt: true,
                },
            })

            return user
        } catch (error) {
            console.error(`Erro ao buscar usuário ${id}:`, error)
            throw error
        }
    }

    /**
     * Cria um novo usuário
     */
    async createUser(data: UserCreateDTO) {
        try {
            // Verificar se já existe um usuário com o mesmo email
            const existingUser = await this.prisma.user.findUnique({
                where: { email: data.email },
            })

            if (existingUser) {
                throw new Error("Email já cadastrado")
            }

            // Hash da senha
            const passwordHash = await bcrypt.hash(data.password, 10)

            // Criar usuário
            const user = await this.prisma.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    passwordHash,
                    role: data.role,
                    phone: data.phone,
                    document: data.document,
                    birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                    department: data.department,
                    permissions: data.permissions || [],
                    startDate: data.role !== "CUSTOMER" ? new Date() : undefined,
                    status: "ACTIVE",
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    document: true,
                    birthDate: true,
                    role: true,
                    department: true,
                    status: true,
                    startDate: true,
                    permissions: true,
                    createdAt: true,
                    updatedAt: true,
                },
            })

            return user
        } catch (error) {
            console.error("Erro ao criar usuário:", error)
            throw error
        }
    }

    /**
     * Atualiza um usuário
     */
    async updateUser(id: string, data: UserUpdateDTO) {
        try {
            // Verificar se o usuário existe
            const user = await this.prisma.user.findUnique({
                where: { id },
            })

            if (!user) {
                return null
            }

            // Verificar se o email já está em uso por outro usuário
            if (data.email && data.email !== user.email) {
                const existingUser = await this.prisma.user.findUnique({
                    where: { email: data.email },
                })

                if (existingUser && existingUser.id !== id) {
                    throw new Error("Email já cadastrado")
                }
            }

            // Atualizar usuário
            const updatedUser = await this.prisma.user.update({
                where: { id },
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    document: data.document,
                    birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                    role: data.role,
                    department: data.department,
                    status: data.status,
                    endDate: data.endDate ? new Date(data.endDate) : undefined,
                    permissions: data.permissions,
                    avatar: data.avatar,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    document: true,
                    birthDate: true,
                    role: true,
                    department: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                    permissions: true,
                    avatar: true,
                    createdAt: true,
                    updatedAt: true,
                },
            })

            return updatedUser
        } catch (error) {
            console.error(`Erro ao atualizar usuário ${id}:`, error)
            throw error
        }
    }

    /**
     * Desativa um usuário
     */
    async deactivateUser(id: string) {
        try {
            // Verificar se o usuário existe
            const user = await this.prisma.user.findUnique({
                where: { id },
            })

            if (!user) {
                return false
            }

            // Desativar usuário
            await this.prisma.user.update({
                where: { id },
                data: {
                    status: "INACTIVE",
                    endDate: user.role !== "CUSTOMER" ? new Date() : undefined,
                },
            })

            return true
        } catch (error) {
            console.error(`Erro ao desativar usuário ${id}:`, error)
            throw error
        }
    }

    /**
     * Obtém dados de desempenho de um funcionário
     */
    async getUserPerformance(id: string, startDate?: string, endDate?: string) {
        try {
            // Verificar se o usuário existe e é um funcionário
            const user = await this.prisma.user.findUnique({
                where: {
                    id,
                    role: {
                        not: "CUSTOMER",
                    },
                },
            })

            if (!user) {
                return null
            }

            // Converter datas
            const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1))
            const end = endDate ? new Date(endDate) : new Date()

            // Buscar vendas do funcionário
            const sales = await this.prisma.order.findMany({
                where: {
                    createdById: id,
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                },
                select: {
                    id: true,
                    orderNumber: true,
                    total: true,
                    createdAt: true,
                },
            })

            // Buscar tickets de suporte atendidos
            const supportTickets = await this.prisma.supportTicket.findMany({
                where: {
                    assignedToId: id,
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                },
                select: {
                    id: true,
                    ticketNumber: true,
                    status: true,
                    createdAt: true,
                    resolvedAt: true,
                },
            })

            // Calcular métricas
            const totalSales = sales.length
            const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0)
            const totalTickets = supportTickets.length
            const resolvedTickets = supportTickets.filter((ticket) => ticket.status === "CLOSED").length
            const avgResolutionTime = resolvedTickets
                ? supportTickets
                    .filter((ticket) => ticket.status === "CLOSED" && ticket.resolvedAt)
                    .reduce((sum, ticket) => {
                        const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()
                        return sum + resolutionTime
                    }, 0) /
                resolvedTickets /
                (1000 * 60 * 60) // em horas
                : 0

            return {
                userId: id,
                userName: user.name,
                period: {
                    start,
                    end,
                },
                sales: {
                    count: totalSales,
                    revenue: totalRevenue,
                    items: sales.map((sale) => ({
                        id: sale.id,
                        orderNumber: sale.orderNumber,
                        total: sale.total,
                        date: sale.createdAt,
                    })),
                },
                support: {
                    count: totalTickets,
                    resolved: resolvedTickets,
                    resolutionRate: totalTickets ? (resolvedTickets / totalTickets) * 100 : 0,
                    avgResolutionTime,
                    tickets: supportTickets.map((ticket) => ({
                        id: ticket.id,
                        ticketNumber: ticket.ticketNumber,
                        status: ticket.status,
                        createdAt: ticket.createdAt,
                        resolvedAt: ticket.resolvedAt,
                    })),
                },
            }
        } catch (error) {
            console.error(`Erro ao buscar desempenho do usuário ${id}:`, error)
            throw error
        }
    }
}

export default new UserService()
