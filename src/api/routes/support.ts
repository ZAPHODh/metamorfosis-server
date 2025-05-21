import { Router } from "express"
import { permissionMiddleware } from "../middlewares/perimission"
import supportController from "../controllers/support"
import { validateBodyMiddleware } from "../middlewares/validate-body"
import { addSupportTicketMessageSchema, assignSupportTicketSchema, closeSupportTicketSchema, createSupportTicketSchema, updateSupportTicketSchema } from "../../../lib/zodschemas/support"
import { authController } from "../controllers/auth"
const { secure } = authController

const router = Router()


router.use(secure)

// Listar tickets de suporte (requer permissão de admin, gerente ou suporte)
router.get("/", permissionMiddleware(["ADMIN", "MANAGER", "SUPPORT"]), supportController.getSupportTickets)

// Obter ticket por ID (requer permissão de admin, gerente ou suporte)
router.get("/:id", permissionMiddleware(["ADMIN", "MANAGER", "SUPPORT"]), supportController.getSupportTicketById)

// Obter mensagens de um ticket (requer permissão de admin, gerente ou suporte)
router.get(
    "/:id/messages",
    permissionMiddleware(["ADMIN", "MANAGER", "SUPPORT"]),
    supportController.getSupportTicketMessages,
)

// Criar ticket (qualquer usuário autenticado pode criar)
router.post("/", validateBodyMiddleware(createSupportTicketSchema), supportController.createSupportTicket)

// Atualizar ticket (requer permissão de admin, gerente ou suporte)
router.put(
    "/:id",
    permissionMiddleware(["ADMIN", "MANAGER", "SUPPORT"]),
    validateBodyMiddleware(updateSupportTicketSchema),
    supportController.updateSupportTicket,
)

// Adicionar mensagem a um ticket (qualquer usuário autenticado pode adicionar)
router.post("/:id/messages", validateBodyMiddleware(addSupportTicketMessageSchema), supportController.addSupportTicketMessage)

// Atribuir ticket a um funcionário (requer permissão de admin, gerente ou suporte)
router.post(
    "/:id/assign",
    permissionMiddleware(["ADMIN", "MANAGER", "SUPPORT"]),
    validateBodyMiddleware(assignSupportTicketSchema),
    supportController.assignSupportTicket,
)

// Fechar ticket (requer permissão de admin, gerente ou suporte)
router.post(
    "/:id/close",
    permissionMiddleware(["ADMIN", "MANAGER", "SUPPORT"]),
    validateBodyMiddleware(closeSupportTicketSchema),
    supportController.closeSupportTicket,
)

export default router
