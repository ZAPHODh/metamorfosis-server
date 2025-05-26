import { Router } from "express"
import { authController } from "../controllers/auth"
import { permissionMiddleware } from "../middlewares/perimission"
import { settingsController } from "../controllers/settings"
import { validateBodyMiddleware } from "../middlewares/validate-body"
import { storeSettingsSchema } from "../../../lib/zodschemas/settings"
const { secure } = authController

const router = Router()

router.use(secure)

router.get("/", permissionMiddleware(["ADMIN", "MANAGER"]), settingsController.getSettings)

router.put(
    "/",
    permissionMiddleware(["ADMIN"]),
    validateBodyMiddleware(storeSettingsSchema),
    settingsController.updateSettings,
)

export default router
