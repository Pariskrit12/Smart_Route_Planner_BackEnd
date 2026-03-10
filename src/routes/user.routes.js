import { Router } from "express";
import {
  refreshToken,
  userLogin,
  userLogout,
  userProfile,
  userRegister,
} from "../controllers/user.controller.js";
import { authorization } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(userRegister);
router.route("/login").post(userLogin);
router.route("/refreshToken").get(refreshToken);
//protected routes
router.route("/logout").post(authorization, userLogout);
router.route("/profile").get(authorization, userProfile);
export default router;
