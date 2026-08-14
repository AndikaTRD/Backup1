import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import uploadRouter from "./upload";
import customerAuthRouter from "./customer-auth";
import absensiRouter from "./absensi";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(uploadRouter);
router.use(customerAuthRouter);
router.use(absensiRouter);

export default router;
