import type { Request, Response } from "express"
import { asyncHandler } from "../../helper"

const userService = new UserService()

export const userController = {
    /**
     * Listar todos os usuários com filtros
     */
    getUsers: asyncHandler(async (req: Request, res: Response) => {
        const filters = {
            search: req.query.search as string,
            role: req.query.role as any,
            status: req.query.status as any,
            sortBy: (req.query.sortBy as string) || "name",
            sortOrder: (req.query.sortOrder as "asc" | "desc") || "asc",
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 10,
        }

        const result = await userService.getUsers(filters)
        res.json(result)
    }),

    /**
     * Obter um usuário pelo ID
     */
    getUserById: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id

        const user = await userService.getUserById(id)

        if (!user) {
            res.status(404).json({ error: "Usuário não encontrado" })
            return
        }

        res.json(user)
    }),

    /**
     * Obter dados de desempenho de um funcionário
     */
    getUserPerformance: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id
        const startDate = req.query.startDate as string
        const endDate = req.query.endDate as string

        const performance = await userService.getUserPerformance(id, startDate, endDate)

        if (!performance) {
            res.status(404).json({ error: "Usuário não encontrado ou não é um funcionário" })
            return
        }

        res.json(performance)
    }),

    /**
     * Criar um novo usuário
     */
    createUser: asyncHandler(async (req: Request, res: Response) => {
        // A validação é feita pelo middleware validateUserCreate
        const data = req.body

        const user = await userService.createUser(data)
        res.status(201).json(user)
    }),

    /**
     * Atualizar um usuário
     */
    updateUser: asyncHandler(async (req: Request, res: Response) => {
        // A validação é feita pelo middleware validateUserUpdate
        const id = req.params.id
        const data = req.body

        const user = await userService.updateUser(id, data)

        if (!user) {
            res.status(404).json({ error: "Usuário não encontrado" })
            return
        }

        res.json(user)
    }),

    /**
     * Desativar um usuário
     */
    deactivateUser: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id

        const success = await userService.deactivateUser(id)

        if (!success) {
            res.status(404).json({ error: "Usuário não encontrado" })
            return
        }

        res.json({ success: true })
    }),
}
