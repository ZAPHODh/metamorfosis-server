import { z } from "zod"

const SupportTicketStatusSchema = z.enum(["OPEN", "ANSWERED", "CLOSED"])
const SupportTicketPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"])
const SupportTicketCategorySchema = z.enum(["ORDER", "PRODUCT", "PAYMENT", "SHIPPING", "RETURN", "OTHER"])
const SupportMessageSenderSchema = z.enum(["CUSTOMER", "STAFF"])

export const getSupportTicketsSchema = z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    category: z.string().optional(),
    assignedTo: z.string().optional(),
    sortBy: z.string().optional().default("updatedAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().optional().default(10),
})


export const createSupportTicketSchema = z.object({
    subject: z.string().min(3, "Subject must be at least 3 characters").max(100, "Subject cannot exceed 100 characters"),
    userId: z.string().uuid("Invalid user ID format"),
    status: SupportTicketStatusSchema.optional().default("OPEN"),
    priority: SupportTicketPrioritySchema.optional().default("MEDIUM"),
    category: SupportTicketCategorySchema,
    assignedToId: z.string().uuid("Invalid staff ID format").optional(),
    initialMessage: z.string().optional(),
})


export const updateSupportTicketSchema = z.object({
    subject: z
        .string()
        .min(3, "Subject must be at least 3 characters")
        .max(100, "Subject cannot exceed 100 characters")
        .optional(),
    status: SupportTicketStatusSchema.optional(),
    priority: SupportTicketPrioritySchema.optional(),
    category: SupportTicketCategorySchema.optional(),
    assignedToId: z.string().uuid("Invalid staff ID format").optional(),
    unread: z.boolean().optional(),
})

export const addSupportTicketMessageSchema = z.object({
    content: z
        .string()
        .min(1, "Message content cannot be empty")
        .max(5000, "Message content cannot exceed 5000 characters"),
    sender: SupportMessageSenderSchema,
    attachments: z.any().optional(),
    updateStatus: SupportTicketStatusSchema.optional(),
})

export const assignSupportTicketSchema = z.object({
    staffId: z.string().uuid("Invalid staff ID format"),
})

export const closeSupportTicketSchema = z.object({
    resolution: z.string().optional(),
})

export type GetSupportTicketsInput = z.infer<typeof getSupportTicketsSchema>
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>
export type UpdateSupportTicketInput = z.infer<typeof updateSupportTicketSchema>
export type AddSupportTicketMessageInput = z.infer<typeof addSupportTicketMessageSchema>
export type AssignSupportTicketInput = z.infer<typeof assignSupportTicketSchema>
export type CloseSupportTicketInput = z.infer<typeof closeSupportTicketSchema>
