import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import {
  acceptInvitationSchema,
  forgotPasswordSchema,
  inviteUserSchema,
  loginSchema,
  registerTenantOwnerSchema,
  registerUserSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validation/auth.schema.js";
import { AuthController } from "../controllers/auth.controllers.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();
// Send Mail => user

/* PUBLIC REGISTERATION AND VERIFICATION */
// send Mail => Owner
router.post(
  "/register/user/init",
  validate(registerUserSchema),
  AuthController.registerUserInit,
);
router.post(
  "/register/owner/init",
  validate(registerTenantOwnerSchema),
  AuthController.registerTenantOwnerInit,
);

router.post(
  "/register/verify/:token",
  validate(verifyEmailSchema),
  AuthController.verifyEmailAndRegister,
);

/* AUTHENTICATION & SESSION MANAGEMENT */
router.post("/login", validate(loginSchema), AuthController.login);

router.post("/refresh-token", AuthController.refreshToken);
router.post("/logout", AuthController.logout);

/* PASSWORD RECOVERY */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  AuthController.forgotPassword,
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);

/* INVITATIONS & PROTECTED ROUTES */
router.post(
  "/accept-invitation",
  validate(acceptInvitationSchema),
  AuthController.acceptInvitation,
);

router.get("/me", protect, AuthController.getMe);

router.post(
  "/invite-user",
  protect,
  validate(inviteUserSchema),
  AuthController.inviteUser,
);

export default router;
