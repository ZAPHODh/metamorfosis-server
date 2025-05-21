import { asyncHandler } from "../../helper"


const permissionMiddleware = (permission: string[] | string) => {
    return asyncHandler(async (req, res, next) => {
        const user = req.user
        if (!user) {
            res.status(401).json({ message: "Não autorizado" })
            return
        }
        if (user.role === "ADMIN") {
            next()
            return
        }
        const permissionsArray = Array.isArray(permission) ? permission : [permission];
        if (!user.permissions || !permissionsArray.some(p => user.permissions.includes(p))) {
            res.status(403).json({ message: "Acesso negado" })
            return
        }

        next()
    })
}
export { permissionMiddleware }