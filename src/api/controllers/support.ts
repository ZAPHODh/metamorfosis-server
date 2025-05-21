import { asyncHandler } from "../../helper"
import supportService from "../services/support"



export const supportController = {

    getSupportTickets: asyncHandler(async (req, res) => {
        const filters = {
            search: req.query.search as string,
            status: req.query.status as string,
            priority: req.query.priority as string,
            assignedTo: req.query.assignedTo as string,
            sortBy: (req.query.sortBy as string) || "updatedAt",
            sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
        }

        const result = await supportService.getSupportTickets(filters)
        res.json(result)
    }),

    getSupportTicketById: asyncHandler(async (req, res) => {
        const id = req.params.id

        const ticket = await supportService.getSupportTicketById(id)

        if (!ticket) {
            res.status(404).json({ error: "Ticket não encontrado" })
            return
        }

        res.json(ticket)
    }),

    getSupportTicketMessages: asyncHandler(async (req, res) => {
        const id = req.params.id

        const messages = await supportService.getSupportTicketMessages(id)

        if (!messages) {
            res.status(404).json({ error: "Ticket não encontrado" })
            return
        }

        res.json(messages)
    }),

    createSupportTicket: asyncHandler(async (req, res) => {
        const data = req.body

        const ticket = await supportService.createSupportTicket(data)
        res.status(201).json(ticket)
    }),

    updateSupportTicket: asyncHandler(async (req, res) => {
        const id = req.params.id
        const data = req.body

        const ticket = await supportService.updateSupportTicket(id, data)

        if (!ticket) {
            res.status(404).json({ error: "Ticket não encontrado" })
            return
        }

        res.json(ticket)
    }),

    addSupportTicketMessage: asyncHandler(async (req, res) => {
        const id = req.params.id
        const data = req.body

        const message = await supportService.addSupportTicketMessage(id, data)

        if (!message) {
            res.status(404).json({ error: "Ticket não encontrado" })
            return
        }

        res.status(201).json(message)
    }),

    assignSupportTicket: asyncHandler(async (req, res) => {
        const id = req.params.id
        const { employeeId } = req.body

        if (!employeeId) {
            res.status(400).json({ error: "ID do funcionário é obrigatório" })
            return
        }

        const ticket = await supportService.assignSupportTicket(id, employeeId)

        if (!ticket) {
            res.status(404).json({ error: "Ticket não encontrado" })
            return
        }

        res.json(ticket)
    }),

    closeSupportTicket: asyncHandler(async (req, res) => {
        const id = req.params.id
        const { resolution } = req.body

        const ticket = await supportService.closeSupportTicket(id, resolution)

        if (!ticket) {
            res.status(404).json({ error: "Ticket não encontrado" })
            return
        }

        res.json(ticket)
    }),
}

export default supportController
