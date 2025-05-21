import { Router } from "express"
import productController from "../controllers/product"
import { validateBodyMiddleware } from "../middlewares/validate-body"
import { permissionMiddleware } from "../middlewares/perimission"
import { createProductSchema, updateProductSchema, productReviewSchema } from "../../../lib/zodschemas/produtcts"
import { authController } from "../controllers/auth"
const { secure } = authController

const router = Router()

router.get("/", productController.getProducts)
router.get("/:id", productController.getProductById)
router.get("/slug/:slug", productController.getProductBySlug)
router.get("/:id/reviews", productController.getProductReviews)
router.post("/:id/view", productController.incrementProductView)


router.use(secure)

router.post(
    "/",
    permissionMiddleware("admin"),
    validateBodyMiddleware(createProductSchema),
    productController.createProduct,
)

router.put(
    "/:id",
    permissionMiddleware('admin'),
    validateBodyMiddleware(updateProductSchema),
    productController.updateProduct,
)

router.delete("/:id", permissionMiddleware("admin"), productController.deleteProduct)

router.post("/:id/reviews", validateBodyMiddleware(productReviewSchema), productController.addProductReview)

export default router
