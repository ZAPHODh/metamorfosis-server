import { Router } from "express"
import { collectionController } from "../controllers/collection"
import { authController } from '../controllers/auth'
import { permissionMiddleware } from "../middlewares/perimission"
import { validateBodyMiddleware } from "../middlewares/validate-body"
import { addProductsToCollectionSchema, createCollectionSchema, removeProductsFromCollectionSchema, updateCollectionSchema } from "../../../lib/zodschemas/collection"
const { secure } = authController
const router = Router()

router.get("/", collectionController.getCollections)
router.get("/:id", collectionController.getCollectionById)
router.get("/slug/:slug", collectionController.getCollectionBySlug)
router.get("/:id/products", collectionController.getCollectionProducts)

router.use(secure)

router.post(
    "/",
    permissionMiddleware("ADMIN"),
    validateBodyMiddleware(createCollectionSchema),
    collectionController.createCollection,
)
router.put(
    "/:id",
    permissionMiddleware("ADMIN"),
    validateBodyMiddleware(updateCollectionSchema),
    collectionController.updateCollection,
)
router.delete("/:id", permissionMiddleware("ADMIN"), collectionController.deleteCollection)
router.post(
    "/:id/products",
    permissionMiddleware("ADMIN"),
    validateBodyMiddleware(addProductsToCollectionSchema),
    collectionController.addProductsToCollection,
)

router.delete(
    "/:id/products",
    permissionMiddleware("ADMIN"),
    validateBodyMiddleware(removeProductsFromCollectionSchema),
    collectionController.removeProductsFromCollection,
)

export default router
