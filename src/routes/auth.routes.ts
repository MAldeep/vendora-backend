import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {
  loginSchema,
  registerTenantOwnerSchema,
  registerUserSchema,
} from "../validation/auth.schema.js";
import { AuthController } from "../controllers/auth.controllers.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
// Send Mail => user
router.post(
  "/register/user/init",
  validate(registerUserSchema),
  AuthController.registerUserInit,
);

// send Mail => Owner
router.post(
  "/register/owner/init",
  validate(registerTenantOwnerSchema),
  AuthController.registerTenantOwnerInit,
);

router.post("/register/verify/:token", AuthController.verifyEmailAndRegister);
router.post("/login", validate(loginSchema), AuthController.login);

router.post("/refresh-token", AuthController.refreshToken);

router.post(
  "/forgot-password",
  // validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);

router.post(
  "/reset-password",
  // validate(resetPasswordSchema),
  AuthController.resetPassword,
);
router.post(
  "/accept-invitation",
  // validate(acceptInvitationSchema),
  AuthController.acceptInvitation,
);

router.get("/me", protect, AuthController.getMe);

router.post(
  "/invite-user",
  protect,
  // validate(inviteUserSchema),
  AuthController.inviteUser,
);

export default router;
