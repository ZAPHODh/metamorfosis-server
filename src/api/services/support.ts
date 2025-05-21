import {
    type SupportTicketStatus,
    type SupportTicketPriority,
    type SupportTicketCategory,
    type SupportMessageSender,
} from "@prisma/client"
import { prisma } from "../../../prisma/prisma"



type SupportTicketFilters = {
    search?: string
    status?: string
    priority?: string
    category?: string
    assignedTo?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
    page?: number
    limit?: number
}

type SupportTicketDTO = {
    id: string
    ticketNumber: string
    subject: string
    status: SupportTicketStatus
    priority: SupportTicketPriority
    category: SupportTicketCategory
    userId: string
    assignedToId?: string | null
    user?: {
        id: string
        name: string
        email: string
        phone?: string | null
    } | null
    assignedTo?: {
        id: string
        name: string
        email?: string | null
    } | null
    messages?: SupportMessageDTO[]
    unread: boolean
    createdAt: Date
    updatedAt: Date
    closedAt?: Date | null
    resolvedAt?: Date | null
}

type SupportTicketCreateDTO = {
    subject: string
    userId: string
    status?: SupportTicketStatus
    priority?: SupportTicketPriority
    category: SupportTicketCategory
    assignedToId?: string
    initialMessage?: string
}

type SupportTicketUpdateDTO = {
    subject?: string
    status?: SupportTicketStatus
    priority?: SupportTicketPriority
    category?: SupportTicketCategory
    assignedToId?: string
    unread?: boolean
}

type SupportMessageDTO = {
    id: string
    content: string
    sender: SupportMessageSender
    attachments?: any
    createdAt: Date
    updatedAt: Date
}

type SupportMessageCreateDTO = {
    content: string
    sender: SupportMessageSender
    attachments?: any
    updateStatus?: SupportTicketStatus
}


async function getSupportTickets(filters: SupportTicketFilters) {
    try {
        const {
            search,
            status,
            priority,
            category,
            assignedTo,
            sortBy = "updatedAt",
            sortOrder = "desc",
            page = 1,
            limit = 10,
        } = filters

        const where: any = {}

        if (search) {
            where.OR = [
                { subject: { contains: search, mode: "insensitive" } },
                { ticketNumber: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
            ]
        }

        if (status) {
            where.status = status
        }

        if (priority) {
            where.priority = priority
        }

        if (category) {
            where.category = category
        }

        if (assignedTo) {
            where.assignedToId = assignedTo
        }

        const total = await prisma.supportTicket.count({ where })

        const tickets = await prisma.supportTicket.findMany({
            where,
            orderBy: {
                [sortBy]: sortOrder,
            },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        messages: true,
                    },
                },
            },
        })

        const ticketsDTO = tickets.map((ticket) => ({
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category,
            userId: ticket.userId,
            assignedToId: ticket.assignedToId,
            user: ticket.user
                ? {
                    id: ticket.user.id,
                    name: ticket.user.name,
                    email: ticket.user.email,
                    phone: ticket.user.phone,
                }
                : null,
            assignedTo: ticket.assignedTo
                ? {
                    id: ticket.assignedTo.id,
                    name: ticket.assignedTo.name,
                    email: ticket.assignedTo.email,
                }
                : null,
            messageCount: ticket._count.messages,
            unread: ticket.unread,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
            closedAt: ticket.closedAt,
            resolvedAt: ticket.resolvedAt,
        }))

        return {
            data: ticketsDTO,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        }
    } catch (error) {
        console.error("Error fetching support tickets:", error)
        throw error
    }
}

async function getSupportTicketById(id: string): Promise<SupportTicketDTO | null> {
    try {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        })

        if (!ticket) {
            return null
        }

        return {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category,
            userId: ticket.userId,
            assignedToId: ticket.assignedToId,
            user: ticket.user
                ? {
                    id: ticket.user.id,
                    name: ticket.user.name,
                    email: ticket.user.email,
                    phone: ticket.user.phone,
                }
                : null,
            assignedTo: ticket.assignedTo
                ? {
                    id: ticket.assignedTo.id,
                    name: ticket.assignedTo.name,
                    email: ticket.assignedTo.email,
                }
                : null,
            messages: ticket.messages.map((message) => ({
                id: message.id,
                content: message.content,
                sender: message.sender,
                attachments: message.attachments,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
            })),
            unread: ticket.unread,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
            closedAt: ticket.closedAt,
            resolvedAt: ticket.resolvedAt,
        }
    } catch (error) {
        console.error(`Error fetching ticket ${id}:`, error)
        throw error
    }
}

async function getSupportTicketMessages(id: string): Promise<SupportMessageDTO[] | null> {
    try {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        })

        if (!ticket) {
            return null
        }

        const messages = await prisma.supportMessage.findMany({
            where: {
                ticketId: id,
            },
            orderBy: {
                createdAt: "asc",
            },
        })

        return messages.map((message) => ({
            id: message.id,
            content: message.content,
            sender: message.sender,
            attachments: message.attachments,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        }))
    } catch (error) {
        console.error(`Error fetching messages for ticket ${id}:`, error)
        throw error
    }
}

async function createSupportTicket(data: SupportTicketCreateDTO): Promise<SupportTicketDTO> {
    try {
        const ticketNumber = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`

        const ticket = await prisma.supportTicket.create({
            data: {
                ticketNumber,
                subject: data.subject,
                status: data.status || "OPEN",
                priority: data.priority || "MEDIUM",
                category: data.category,
                unread: true,
                user: {
                    connect: {
                        id: data.userId,
                    },
                },
                assignedTo: data.assignedToId
                    ? {
                        connect: {
                            id: data.assignedToId,
                        },
                    }
                    : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        })

        const messages: SupportMessageDTO[] = []
        if (data.initialMessage) {
            const message = await prisma.supportMessage.create({
                data: {
                    content: data.initialMessage,
                    sender: "CUSTOMER",
                    ticket: {
                        connect: {
                            id: ticket.id,
                        },
                    },
                },
            })
            messages.push({
                id: message.id,
                content: message.content,
                sender: message.sender,
                attachments: message.attachments,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
            })
        }
        return {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            subject: ticket.subject,
            status: ticket.status,
            priority: ticket.priority,
            category: ticket.category,
            userId: ticket.userId,
            assignedToId: ticket.assignedToId,
            user: ticket.user
                ? {
                    id: ticket.user.id,
                    name: ticket.user.name,
                    email: ticket.user.email,
                    phone: ticket.user.phone,
                }
                : null,
            assignedTo: ticket.assignedTo
                ? {
                    id: ticket.assignedTo.id,
                    name: ticket.assignedTo.name,
                    email: ticket.assignedTo.email,
                }
                : null,
            messages,
            unread: ticket.unread,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
            closedAt: ticket.closedAt,
            resolvedAt: ticket.resolvedAt,
        }
    } catch (error) {
        console.error("Error creating support ticket:", error)
        throw error
    }
}

async function updateSupportTicket(id: string, data: SupportTicketUpdateDTO): Promise<SupportTicketDTO | null> {
    try {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        })

        if (!ticket) {
            return null
        }

        const updateData: any = {
            subject: data.subject,
            status: data.status,
            priority: data.priority,
            category: data.category,
            unread: data.unread,
        }

        if (data.status === "CLOSED" && ticket.status !== "CLOSED") {
            updateData.closedAt = new Date()
        }

        if (data.status === "ANSWERED" && ticket.status !== "ANSWERED") {
            updateData.resolvedAt = new Date()
        }

        if (data.assignedToId) {
            updateData.assignedTo = {
                connect: {
                    id: data.assignedToId,
                },
            }
        }
        const updatedTicket = await prisma.supportTicket.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        })

        return {
            id: updatedTicket.id,
            ticketNumber: updatedTicket.ticketNumber,
            subject: updatedTicket.subject,
            status: updatedTicket.status,
            priority: updatedTicket.priority,
            category: updatedTicket.category,
            userId: updatedTicket.userId,
            assignedToId: updatedTicket.assignedToId,
            user: updatedTicket.user
                ? {
                    id: updatedTicket.user.id,
                    name: updatedTicket.user.name,
                    email: updatedTicket.user.email,
                    phone: updatedTicket.user.phone,
                }
                : null,
            assignedTo: updatedTicket.assignedTo
                ? {
                    id: updatedTicket.assignedTo.id,
                    name: updatedTicket.assignedTo.name,
                    email: updatedTicket.assignedTo.email,
                }
                : null,
            messages: updatedTicket.messages.map((message) => ({
                id: message.id,
                content: message.content,
                sender: message.sender,
                attachments: message.attachments,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
            })),
            unread: updatedTicket.unread,
            createdAt: updatedTicket.createdAt,
            updatedAt: updatedTicket.updatedAt,
            closedAt: updatedTicket.closedAt,
            resolvedAt: updatedTicket.resolvedAt,
        }
    } catch (error) {
        console.error(`Error updating ticket ${id}:`, error)
        throw error
    }
}


async function addSupportTicketMessage(id: string, data: SupportMessageCreateDTO): Promise<SupportMessageDTO | null> {
    try {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        })

        if (!ticket) {
            return null
        }

        const message = await prisma.supportMessage.create({
            data: {
                content: data.content,
                sender: data.sender,
                attachments: data.attachments,
                ticket: {
                    connect: {
                        id,
                    },
                },
            },
        })

        if (data.updateStatus) {
            const updateData: any = {
                status: data.updateStatus,
                unread: data.sender === "STAFF",
            }

            if (data.updateStatus === "CLOSED" && ticket.status !== "CLOSED") {
                updateData.closedAt = new Date()
            }

            if (data.updateStatus === "ANSWERED" && ticket.status !== "ANSWERED") {
                updateData.resolvedAt = new Date()
            }

            await prisma.supportTicket.update({
                where: { id },
                data: updateData,
            })
        } else {
            await prisma.supportTicket.update({
                where: { id },
                data: {
                    unread: data.sender === "STAFF",
                },
            })
        }
        return {
            id: message.id,
            content: message.content,
            sender: message.sender,
            attachments: message.attachments,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        }
    } catch (error) {
        console.error(`Error adding message to ticket ${id}:`, error)
        throw error
    }
}


async function assignSupportTicket(id: string, staffId: string): Promise<SupportTicketDTO | null> {
    try {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        })

        if (!ticket) {
            return null
        }
        const staff = await prisma.user.findUnique({
            where: {
                id: staffId,
                role: {
                    not: "CUSTOMER",
                },
            },
        })

        if (!staff) {
            throw new Error("Staff member not found")
        }

        const updatedTicket = await prisma.supportTicket.update({
            where: { id },
            data: {
                assignedTo: {
                    connect: {
                        id: staffId,
                    },
                },
                status: ticket.status === "OPEN" ? "ANSWERED" : ticket.status,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        })

        await prisma.supportMessage.create({
            data: {
                content: `Ticket assigned to ${staff.name}`,
                sender: "STAFF",
                ticket: {
                    connect: {
                        id,
                    },
                },
            },
        })

        return {
            id: updatedTicket.id,
            ticketNumber: updatedTicket.ticketNumber,
            subject: updatedTicket.subject,
            status: updatedTicket.status,
            priority: updatedTicket.priority,
            category: updatedTicket.category,
            userId: updatedTicket.userId,
            assignedToId: updatedTicket.assignedToId,
            user: updatedTicket.user
                ? {
                    id: updatedTicket.user.id,
                    name: updatedTicket.user.name,
                    email: updatedTicket.user.email,
                    phone: updatedTicket.user.phone,
                }
                : null,
            assignedTo: updatedTicket.assignedTo
                ? {
                    id: updatedTicket.assignedTo.id,
                    name: updatedTicket.assignedTo.name,
                    email: updatedTicket.assignedTo.email,
                }
                : null,
            messages: updatedTicket.messages.map((message) => ({
                id: message.id,
                content: message.content,
                sender: message.sender,
                attachments: message.attachments,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
            })),
            unread: updatedTicket.unread,
            createdAt: updatedTicket.createdAt,
            updatedAt: updatedTicket.updatedAt,
            closedAt: updatedTicket.closedAt,
            resolvedAt: updatedTicket.resolvedAt,
        }
    } catch (error) {
        console.error(`Error assigning ticket ${id}:`, error)
        throw error
    }
}

async function closeSupportTicket(id: string, resolution?: string): Promise<SupportTicketDTO | null> {
    try {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        })

        if (!ticket) {
            return null
        }

        const updatedTicket = await prisma.supportTicket.update({
            where: { id },
            data: {
                status: "CLOSED",
                closedAt: new Date(),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        })

        if (resolution) {
            await prisma.supportMessage.create({
                data: {
                    content: `Ticket closed: ${resolution}`,
                    sender: "STAFF",
                    ticket: {
                        connect: {
                            id,
                        },
                    },
                },
            })
        }

        return {
            id: updatedTicket.id,
            ticketNumber: updatedTicket.ticketNumber,
            subject: updatedTicket.subject,
            status: updatedTicket.status,
            priority: updatedTicket.priority,
            category: updatedTicket.category,
            userId: updatedTicket.userId,
            assignedToId: updatedTicket.assignedToId,
            user: updatedTicket.user
                ? {
                    id: updatedTicket.user.id,
                    name: updatedTicket.user.name,
                    email: updatedTicket.user.email,
                    phone: updatedTicket.user.phone,
                }
                : null,
            assignedTo: updatedTicket.assignedTo
                ? {
                    id: updatedTicket.assignedTo.id,
                    name: updatedTicket.assignedTo.name,
                    email: updatedTicket.assignedTo.email,
                }
                : null,
            messages: updatedTicket.messages.map((message) => ({
                id: message.id,
                content: message.content,
                sender: message.sender,
                attachments: message.attachments,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
            })),
            unread: updatedTicket.unread,
            createdAt: updatedTicket.createdAt,
            updatedAt: updatedTicket.updatedAt,
            closedAt: updatedTicket.closedAt,
            resolvedAt: updatedTicket.resolvedAt,
        }
    } catch (error) {
        console.error(`Error closing ticket ${id}:`, error)
        throw error
    }
}

export const supportService = {
    getSupportTickets,
    getSupportTicketById,
    getSupportTicketMessages,
    createSupportTicket,
    updateSupportTicket,
    addSupportTicketMessage,
    assignSupportTicket,
    closeSupportTicket,
}

export default supportService

