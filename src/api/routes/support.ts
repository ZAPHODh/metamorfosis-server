import { Router } from "express"
import { permissionMiddleware } from "../middlewares/perimission"
import supportController from "../controllers/support"
import { validateBodyMiddleware } from "../middlewares/validate-body"
import { addSupportTicketMessageSchema, assignSupportTicketSchema, closeSupportTicketSchema, createSupportTicketSchema, updateSupportTicketSchema } from "../../../lib/zodschemas/support"
import { authController } from "../controllers/auth"
const { secure } = authController

const router = Router()

router.use(secure)

router.get("/", permissionMiddleware(["ADMIN", "MANAGER", "SUPPORT"]), supportController.getSupportTickets)

router.get("/:id", permissionMiddleware(["ADMIN", "MANAGER", "SUPPORT"]), supportController.getSupportTicketById)

router.get(
    "/:id/messages",
    permissionMiddleware(["ADMIN", "MANAGER", "SUPPORT"]),
    supportController.getSupportTicketMessages,
)

router.post("/", validateBodyMiddleware(createSupportTicketSchema), supportController.createSupportTicket)

router.put(
    "/:id",
    permissionMiddleware(["ADMIN", "MANAGER", "SUPPORT"]),
    validateBodyMiddleware(updateSupportTicketSchema),
    supportController.updateSupportTicket,
)

router.post("/:id/messages", validateBodyMiddleware(addSupportTicketMessageSchema), supportController.addSupportTicketMessage)

router.post(
    "/:id/assign",
    permissionMiddleware(["ADMIN", "MANAGER", "SUPPORT"]),
    validateBodyMiddleware(assignSupportTicketSchema),
    supportController.assignSupportTicket,
)

router.post(
    "/:id/close",
    permissionMiddleware(["ADMIN", "MANAGER", "SUPPORT"]),
    validateBodyMiddleware(closeSupportTicketSchema),
    supportController.closeSupportTicket,
)

export default router
