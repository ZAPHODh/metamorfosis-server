import {
    PrismaClient,
    type SupportTicketStatus,
    type SupportTicketPriority,
    type SupportTicketCategory,
    type SupportMessageSender,
} from "@prisma/client"

// Shared PrismaClient instance
const prisma = new PrismaClient()

// Types based on the schema
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

/**
 * Get support tickets with filters
 */
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

        // Build filters
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

        // Count total records
        const total = await prisma.supportTicket.count({ where })

        // Fetch tickets
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

        // Map to DTO
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

/**
 * Get a support ticket by ID
 */
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

/**
 * Get messages for a support ticket
 */
async function getSupportTicketMessages(id: string): Promise<SupportMessageDTO[] | null> {
    try {
        // Check if ticket exists
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        })

        if (!ticket) {
            return null
        }

        // Fetch messages
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

/**
 * Create a new support ticket
 */
async function createSupportTicket(data: SupportTicketCreateDTO): Promise<SupportTicketDTO> {
    try {
        // Generate a unique ticket number
        const ticketNumber = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`

        // Create ticket
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

        // Add initial message if provided
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

/**
 * Update a support ticket
 */
async function updateSupportTicket(id: string, data: SupportTicketUpdateDTO): Promise<SupportTicketDTO | null> {
    try {
        // Check if ticket exists
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        })

        if (!ticket) {
            return null
        }

        // Prepare update data
        const updateData: any = {
            subject: data.subject,
            status: data.status,
            priority: data.priority,
            category: data.category,
            unread: data.unread,
        }

        // Set timestamps based on status
        if (data.status === "CLOSED" && ticket.status !== "CLOSED") {
            updateData.closedAt = new Date()
        }

        if (data.status === "ANSWERED" && ticket.status !== "ANSWERED") {
            updateData.resolvedAt = new Date()
        }

        // Update assignee if provided
        if (data.assignedToId) {
            updateData.assignedTo = {
                connect: {
                    id: data.assignedToId,
                },
            }
        }

        // Update ticket
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

/**
 * Add a message to a support ticket
 */
async function addSupportTicketMessage(id: string, data: SupportMessageCreateDTO): Promise<SupportMessageDTO | null> {
    try {
        // Check if ticket exists
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        })

        if (!ticket) {
            return null
        }

        // Add message
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

        // Update ticket status if needed
        if (data.updateStatus) {
            const updateData: any = {
                status: data.updateStatus,
                unread: data.sender === "STAFF", // Mark as unread for customer if staff replied
            }

            // Set timestamps based on status
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
            // Update unread status based on sender
            await prisma.supportTicket.update({
                where: { id },
                data: {
                    unread: data.sender === "STAFF", // Mark as unread for customer if staff replied
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

/**
 * Assign a support ticket to a staff member
 */
async function assignSupportTicket(id: string, staffId: string): Promise<SupportTicketDTO | null> {
    try {
        // Check if ticket exists
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        })

        if (!ticket) {
            return null
        }

        // Check if staff exists
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

        // Assign ticket
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

        // Add internal message about assignment
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

/**
 * Close a support ticket
 */
async function closeSupportTicket(id: string, resolution?: string): Promise<SupportTicketDTO | null> {
    try {
        // Check if ticket exists
        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
        })

        if (!ticket) {
            return null
        }

        // Close ticket
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

        // Add resolution message if provided
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

// Export all functions as an object
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



// import { prisma } from "../../../prisma/prisma"
// import type {
//     SupportTicket,
//     SupportTicketCategory,
//     SupportMessage,
// } from "../../interfaces"


// export async function getSupportTickets(filters: {
//     search?: string
//     status?: string
//     priority?: string
//     assignedTo?: string
//     sortBy?: string
//     sortOrder?: "asc" | "desc"
//     page?: number
//     limit?: number
// }) {
//     try {
//         const {
//             search,
//             status,
//             priority,
//             assignedTo,
//             sortBy = "updatedAt",
//             sortOrder = "desc",
//             page = 1,
//             limit = 10,
//         } = filters

//         // Construir filtros
//         const where: any = {}

//         if (search) {
//             where.OR = [
//                 { title: { contains: search, mode: "insensitive" } },
//                 { description: { contains: search, mode: "insensitive" } },
//                 { customer: { name: { contains: search, mode: "insensitive" } } },
//             ]
//         }

//         if (status) {
//             where.status = status
//         }

//         if (priority) {
//             where.priority = priority
//         }

//         if (assignedTo) {
//             where.assignedToId = assignedTo
//         }

//         // Contar total de registros
//         const total = await prisma.supportTicket.count({ where })

//         // Buscar tickets
//         const tickets = await prisma.supportTicket.findMany({
//             where,
//             orderBy: {
//                 [sortBy]: sortOrder,
//             },
//             skip: (page - 1) * limit,
//             take: limit,
//             include: {
//                 user: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                     },
//                 },
//                 assignedTo: {
//                     select: {
//                         id: true,
//                         name: true,
//                     },
//                 },
//                 _count: {
//                     select: {
//                         messages: true,
//                     },
//                 },
//             },
//         })

//         // Mapear para DTO
//         const ticketsDTO = tickets.map((ticket) => ({
//             id: ticket.id,
//             subjetct: ticket.subject,
//             category: ticket.category,
//             status: ticket.status,
//             priority: ticket.priority,
//             customer: ticket.user
//                 ? {
//                     id: ticket.user.id,
//                     name: ticket.user.name,
//                     email: ticket.user.email,
//                 }
//                 : null,
//             assignedTo: ticket.assignedTo
//                 ? {
//                     id: ticket.assignedTo.id,
//                     name: ticket.assignedTo.name,
//                 }
//                 : null,
//             messageCount: ticket._count.messages,
//             createdAt: ticket.createdAt,
//             updatedAt: ticket.updatedAt,
//             resolvedAt: ticket.resolvedAt,
//         }))

//         return {
//             data: ticketsDTO,
//             pagination: {
//                 total,
//                 page,
//                 limit,
//                 totalPages: Math.ceil(total / limit),
//             },
//         }
//     } catch (error) {
//         console.error("Erro ao buscar tickets de suporte:", error)
//         throw error
//     }
// }

// /**
//  * Obtém um ticket de suporte pelo ID
//  */
// export async function getSupportTicketById(id: string): Promise<SupportTicket | null> {
//     try {
//         const ticket = await prisma.supportTicket.findUnique({
//             where: { id },
//             include: {
//                 customer: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                         phone: true,
//                     },
//                 },
//                 assignedTo: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                     },
//                 },
//                 messages: {
//                     orderBy: {
//                         createdAt: "asc",
//                     },
//                     include: {
//                         sender: {
//                             select: {
//                                 id: true,
//                                 name: true,
//                             },
//                         },
//                     },
//                 },
//             },
//         })

//         if (!ticket) {
//             return null
//         }

//         return {
//             id: ticket.id,
//             title: ticket.title,
//             description: ticket.description,
//             status: ticket.status,
//             priority: ticket.priority,
//             customer: ticket.customer
//                 ? {
//                     id: ticket.customer.id,
//                     name: ticket.customer.name,
//                     email: ticket.customer.email,
//                     phone: ticket.customer.phone,
//                 }
//                 : null,
//             assignedTo: ticket.assignedTo
//                 ? {
//                     id: ticket.assignedTo.id,
//                     name: ticket.assignedTo.name,
//                     email: ticket.assignedTo.email,
//                 }
//                 : null,
//             messages: ticket.messages.map((message) => ({
//                 id: message.id,
//                 content: message.content,
//                 isInternal: message.isInternal,
//                 sender: message.sender
//                     ? {
//                         id: message.sender.id,
//                         name: message.sender.name,
//                     }
//                     : null,
//                 createdAt: message.createdAt,
//             })),
//             createdAt: ticket.createdAt,
//             updatedAt: ticket.updatedAt,
//             resolvedAt: ticket.resolvedAt,
//         }
//     } catch (error) {
//         console.error(`Erro ao buscar ticket ${id}:`, error)
//         throw error
//     }
// }

// /**
//  * Obtém mensagens de um ticket de suporte
//  */
// export async function getSupportTicketMessages(id: string): Promise<SupportMessageDTO[] | null> {
//     try {
//         // Verificar se o ticket existe
//         const ticket = await prisma.supportTicket.findUnique({
//             where: { id },
//         })

//         if (!ticket) {
//             return null
//         }

//         // Buscar mensagens
//         const messages = await prisma.supportMessage.findMany({
//             where: {
//                 ticketId: id,
//             },
//             orderBy: {
//                 createdAt: "asc",
//             },
//             include: {
//                 sender: {
//                     select: {
//                         id: true,
//                         name: true,
//                     },
//                 },
//             },
//         })

//         return messages.map((message) => ({
//             id: message.id,
//             content: message.content,
//             isInternal: message.isInternal,
//             sender: message.sender
//                 ? {
//                     id: message.sender.id,
//                     name: message.sender.name,
//                 }
//                 : null,
//             createdAt: message.createdAt,
//         }))
//     } catch (error) {
//         console.error(`Erro ao buscar mensagens do ticket ${id}:`, error)
//         throw error
//     }
// }

// /**
//  * Cria um novo ticket de suporte
//  */
// export async function createSupportTicket(data: SupportTicketCreateDTO): Promise<SupportTicketDTO> {
//     try {
//         // Criar ticket
//         const ticket = await prisma.supportTicket.create({
//             data: {
//                 title: data.title,
//                 description: data.description,
//                 status: data.status || "OPEN",
//                 priority: data.priority || "MEDIUM",
//                 customer: data.customerId
//                     ? {
//                         connect: {
//                             id: data.customerId,
//                         },
//                     }
//                     : undefined,
//                 assignedTo: data.assignedToId
//                     ? {
//                         connect: {
//                             id: data.assignedToId,
//                         },
//                     }
//                     : undefined,
//             },
//             include: {
//                 customer: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                         phone: true,
//                     },
//                 },
//                 assignedTo: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                     },
//                 },
//             },
//         })

//         // Adicionar mensagem inicial se fornecida
//         const messages: SupportMessageDTO[] = []
//         if (data.initialMessage) {
//             const message = await prisma.supportMessage.create({
//                 data: {
//                     content: data.initialMessage,
//                     isInternal: false,
//                     ticket: {
//                         connect: {
//                             id: ticket.id,
//                         },
//                     },
//                     sender: data.customerId
//                         ? {
//                             connect: {
//                                 id: data.customerId,
//                             },
//                         }
//                         : undefined,
//                 },
//                 include: {
//                     sender: {
//                         select: {
//                             id: true,
//                             name: true,
//                         },
//                     },
//                 },
//             })

//             messages.push({
//                 id: message.id,
//                 content: message.content,
//                 isInternal: message.isInternal,
//                 sender: message.sender
//                     ? {
//                         id: message.sender.id,
//                         name: message.sender.name,
//                     }
//                     : null,
//                 createdAt: message.createdAt,
//             })
//         }

//         return {
//             id: ticket.id,
//             title: ticket.title,
//             description: ticket.description,
//             status: ticket.status,
//             priority: ticket.priority,
//             customer: ticket.customer
//                 ? {
//                     id: ticket.customer.id,
//                     name: ticket.customer.name,
//                     email: ticket.customer.email,
//                     phone: ticket.customer.phone,
//                 }
//                 : null,
//             assignedTo: ticket.assignedTo
//                 ? {
//                     id: ticket.assignedTo.id,
//                     name: ticket.assignedTo.name,
//                     email: ticket.assignedTo.email,
//                 }
//                 : null,
//             messages,
//             createdAt: ticket.createdAt,
//             updatedAt: ticket.updatedAt,
//             resolvedAt: ticket.resolvedAt,
//         }
//     } catch (error) {
//         console.error("Erro ao criar ticket de suporte:", error)
//         throw error
//     }
// }

// /**
//  * Atualiza um ticket de suporte
//  */
// export async function updateSupportTicket(id: string, data: SupportTicketUpdateDTO): Promise<SupportTicketDTO | null> {
//     try {
//         // Verificar se o ticket existe
//         const ticket = await prisma.supportTicket.findUnique({
//             where: { id },
//         })

//         if (!ticket) {
//             return null
//         }

//         // Atualizar ticket
//         const updatedTicket = await prisma.supportTicket.update({
//             where: { id },
//             data: {
//                 title: data.title,
//                 description: data.description,
//                 status: data.status,
//                 priority: data.priority,
//                 assignedTo: data.assignedToId
//                     ? {
//                         connect: {
//                             id: data.assignedToId,
//                         },
//                     }
//                     : undefined,
//                 resolvedAt: data.status === "CLOSED" ? new Date() : ticket.resolvedAt,
//             },
//             include: {
//                 customer: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                         phone: true,
//                     },
//                 },
//                 assignedTo: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                     },
//                 },
//                 messages: {
//                     orderBy: {
//                         createdAt: "asc",
//                     },
//                     include: {
//                         sender: {
//                             select: {
//                                 id: true,
//                                 name: true,
//                             },
//                         },
//                     },
//                 },
//             },
//         })

//         return {
//             id: updatedTicket.id,
//             title: updatedTicket.title,
//             description: updatedTicket.description,
//             status: updatedTicket.status,
//             priority: updatedTicket.priority,
//             customer: updatedTicket.customer
//                 ? {
//                     id: updatedTicket.customer.id,
//                     name: updatedTicket.customer.name,
//                     email: updatedTicket.customer.email,
//                     phone: updatedTicket.customer.phone,
//                 }
//                 : null,
//             assignedTo: updatedTicket.assignedTo
//                 ? {
//                     id: updatedTicket.assignedTo.id,
//                     name: updatedTicket.assignedTo.name,
//                     email: updatedTicket.assignedTo.email,
//                 }
//                 : null,
//             messages: updatedTicket.messages.map((message) => ({
//                 id: message.id,
//                 content: message.content,
//                 isInternal: message.isInternal,
//                 sender: message.sender
//                     ? {
//                         id: message.sender.id,
//                         name: message.sender.name,
//                     }
//                     : null,
//                 createdAt: message.createdAt,
//             })),
//             createdAt: updatedTicket.createdAt,
//             updatedAt: updatedTicket.updatedAt,
//             resolvedAt: updatedTicket.resolvedAt,
//         }
//     } catch (error) {
//         console.error(`Erro ao atualizar ticket ${id}:`, error)
//         throw error
//     }
// }

// /**
//  * Adiciona uma mensagem a um ticket de suporte
//  */
// export async function addSupportTicketMessage(
//     id: string,
//     data: SupportMessageCreateDTO,
// ): Promise<SupportMessageDTO | null> {
//     try {
//         // Verificar se o ticket existe
//         const ticket = await prisma.supportTicket.findUnique({
//             where: { id },
//         })

//         if (!ticket) {
//             return null
//         }

//         // Adicionar mensagem
//         const message = await prisma.supportMessage.create({
//             data: {
//                 content: data.content,
//                 isInternal: data.isInternal || false,
//                 ticket: {
//                     connect: {
//                         id,
//                     },
//                 },
//                 sender: data.senderId
//                     ? {
//                         connect: {
//                             id: data.senderId,
//                         },
//                     }
//                     : undefined,
//             },
//             include: {
//                 sender: {
//                     select: {
//                         id: true,
//                         name: true,
//                     },
//                 },
//             },
//         })

//         // Atualizar status do ticket se necessário
//         if (data.updateStatus) {
//             await prisma.supportTicket.update({
//                 where: { id },
//                 data: {
//                     status: data.updateStatus,
//                     resolvedAt: data.updateStatus === "CLOSED" ? new Date() : null,
//                 },
//             })
//         }

//         return {
//             id: message.id,
//             content: message.content,
//             isInternal: message.isInternal,
//             sender: message.sender
//                 ? {
//                     id: message.sender.id,
//                     name: message.sender.name,
//                 }
//                 : null,
//             createdAt: message.createdAt,
//         }
//     } catch (error) {
//         console.error(`Erro ao adicionar mensagem ao ticket ${id}:`, error)
//         throw error
//     }
// }

// /**
//  * Atribui um ticket de suporte a um funcionário
//  */
// export async function assignSupportTicket(id: string, employeeId: string): Promise<SupportTicketDTO | null> {
//     try {
//         // Verificar se o ticket existe
//         const ticket = await prisma.supportTicket.findUnique({
//             where: { id },
//         })

//         if (!ticket) {
//             return null
//         }

//         // Verificar se o funcionário existe
//         const employee = await prisma.user.findUnique({
//             where: {
//                 id: employeeId,
//                 role: {
//                     not: "CUSTOMER",
//                 },
//             },
//         })

//         if (!employee) {
//             throw new Error("Funcionário não encontrado")
//         }

//         // Atribuir ticket
//         const updatedTicket = await prisma.supportTicket.update({
//             where: { id },
//             data: {
//                 assignedTo: {
//                     connect: {
//                         id: employeeId,
//                     },
//                 },
//                 status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
//             },
//             include: {
//                 customer: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                         phone: true,
//                     },
//                 },
//                 assignedTo: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                     },
//                 },
//                 messages: {
//                     orderBy: {
//                         createdAt: "asc",
//                     },
//                     include: {
//                         sender: {
//                             select: {
//                                 id: true,
//                                 name: true,
//                             },
//                         },
//                     },
//                 },
//             },
//         })

//         // Adicionar mensagem interna sobre a atribuição
//         await prisma.supportMessage.create({
//             data: {
//                 content: `Ticket atribuído para ${employee.name}`,
//                 isInternal: true,
//                 ticket: {
//                     connect: {
//                         id,
//                     },
//                 },
//             },
//         })

//         return {
//             id: updatedTicket.id,
//             title: updatedTicket.title,
//             description: updatedTicket.description,
//             status: updatedTicket.status,
//             priority: updatedTicket.priority,
//             customer: updatedTicket.customer
//                 ? {
//                     id: updatedTicket.customer.id,
//                     name: updatedTicket.customer.name,
//                     email: updatedTicket.customer.email,
//                     phone: updatedTicket.customer.phone,
//                 }
//                 : null,
//             assignedTo: updatedTicket.assignedTo
//                 ? {
//                     id: updatedTicket.assignedTo.id,
//                     name: updatedTicket.assignedTo.name,
//                     email: updatedTicket.assignedTo.email,
//                 }
//                 : null,
//             messages: updatedTicket.messages.map((message) => ({
//                 id: message.id,
//                 content: message.content,
//                 isInternal: message.isInternal,
//                 sender: message.sender
//                     ? {
//                         id: message.sender.id,
//                         name: message.sender.name,
//                     }
//                     : null,
//                 createdAt: message.createdAt,
//             })),
//             createdAt: updatedTicket.createdAt,
//             updatedAt: updatedTicket.updatedAt,
//             resolvedAt: updatedTicket.resolvedAt,
//         }
//     } catch (error) {
//         console.error(`Erro ao atribuir ticket ${id}:`, error)
//         throw error
//     }
// }

// /**
//  * Fecha um ticket de suporte
//  */
// export async function closeSupportTicket(id: string, resolution?: string): Promise<SupportTicketDTO | null> {
//     try {
//         // Verificar se o ticket existe
//         const ticket = await prisma.supportTicket.findUnique({
//             where: { id },
//         })

//         if (!ticket) {
//             return null
//         }

//         // Fechar ticket
//         const updatedTicket = await prisma.supportTicket.update({
//             where: { id },
//             data: {
//                 status: "CLOSED",
//                 resolvedAt: new Date(),
//             },
//             include: {
//                 customer: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                         phone: true,
//                     },
//                 },
//                 assignedTo: {
//                     select: {
//                         id: true,
//                         name: true,
//                         email: true,
//                     },
//                 },
//                 messages: {
//                     orderBy: {
//                         createdAt: "asc",
//                     },
//                     include: {
//                         sender: {
//                             select: {
//                                 id: true,
//                                 name: true,
//                             },
//                         },
//                     },
//                 },
//             },
//         })

//         // Adicionar mensagem de resolução se fornecida
//         if (resolution) {
//             await prisma.supportMessage.create({
//                 data: {
//                     content: `Ticket fechado: ${resolution}`,
//                     isInternal: true,
//                     ticket: {
//                         connect: {
//                             id,
//                         },
//                     },
//                 },
//             })
//         }

//         return {
//             id: updatedTicket.id,
//             title: updatedTicket.title,
//             description: updatedTicket.description,
//             status: updatedTicket.status,
//             priority: updatedTicket.priority,
//             customer: updatedTicket.customer
//                 ? {
//                     id: updatedTicket.customer.id,
//                     name: updatedTicket.customer.name,
//                     email: updatedTicket.customer.email,
//                     phone: updatedTicket.customer.phone,
//                 }
//                 : null,
//             assignedTo: updatedTicket.assignedTo
//                 ? {
//                     id: updatedTicket.assignedTo.id,
//                     name: updatedTicket.assignedTo.name,
//                     email: updatedTicket.assignedTo.email,
//                 }
//                 : null,
//             messages: updatedTicket.messages.map((message) => ({
//                 id: message.id,
//                 content: message.content,
//                 isInternal: message.isInternal,
//                 sender: message.sender
//                     ? {
//                         id: message.sender.id,
//                         name: message.sender.name,
//                     }
//                     : null,
//                 createdAt: message.createdAt,
//             })),
//             createdAt: updatedTicket.createdAt,
//             updatedAt: updatedTicket.updatedAt,
//             resolvedAt: updatedTicket.resolvedAt,
//         }
//     } catch (error) {
//         console.error(`Erro ao fechar ticket ${id}:`, error)
//         throw error
//     }
// }

// // Exportar todas as funções como um objeto
// export const supportService = {
//     getSupportTickets,
//     getSupportTicketById,
//     getSupportTicketMessages,
//     createSupportTicket,
//     updateSupportTicket,
//     addSupportTicketMessage,
//     assignSupportTicket,
//     closeSupportTicket,
// }

// export default supportService
