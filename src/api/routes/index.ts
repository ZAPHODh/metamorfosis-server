import { Router } from 'express';
import productsRoutes from './products'
import dashboardRoutes from './dashboard'
const router = Router();

router.use('/products', productsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/collections', dashboardRoutes);
router.use('/support', dashboardRoutes);

export default router;