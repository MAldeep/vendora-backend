import { Router } from "express";
import { validate } from "../middleware/validate.middleware.js";
import { acceptInvitationSchema, forgotPasswordSchema, inviteUserSchema, loginSchema, registerTenantOwnerSchema, registerUserSchema, resetPasswordSchema, verifyEmailSchema, } from "../validation/auth.schema.js";
import { AuthController } from "../controllers/auth.controllers.js";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/restrictTo.js";
const router = Router();
// Send Mail => user
/**
 * @openapi
 * /api/v1/auth/register/user/init:
 *   post:
 *     summary: Start a customer registration by sending a verification email
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Pass1234
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 nullable: true
 *                 example: "+201234567890"
 *               birthDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "1990-01-15T00:00:00.000Z"
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *                 nullable: true
 *                 example: MALE
 *     responses:
 *       200:
 *         description: Verification email successfully sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Verification code sent to your email.
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Verification email sent successfully. Please check your inbox.
 *                     verificationToken:
 *                       type: string
 *                       example: jwt-token
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post("/register/user/init", validate(registerUserSchema), AuthController.registerUserInit);
/**
 * @openapi
 * /api/v1/auth/register/owner/init:
 *   post:
 *     summary: Start a tenant-owner registration by sending a verification email
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *               - tenantName
 *               - tenantSlug
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: owner@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Pass1234
 *               fullName:
 *                 type: string
 *                 example: Ahmed Ali
 *               phoneNumber:
 *                 type: string
 *                 nullable: true
 *                 example: "+201234567890"
 *               tenantName:
 *                 type: string
 *                 example: my-store
 *               tenantSlug:
 *                 type: string
 *                 pattern: '^[a-z0-9-]+$'
 *                 example: my-store
 *     responses:
 *       200:
 *         description: Verification email for tenant owner registration sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Verification code sent to your email.
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Verification email sent. Please verify your email to create your store.
 *                     verificationToken:
 *                       type: string
 *                       example: jwt-token
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post("/register/owner/init", validate(registerTenantOwnerSchema), AuthController.registerTenantOwnerInit);
/**
 * @openapi
 * /api/v1/auth/register/verify/{token}:
 *   post:
 *     summary: Verify the email token and complete the registration
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token received in the registration email
 *     responses:
 *       201:
 *         description: User and tenant created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User Created Successfully !
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         userType:
 *                           type: string
 *                           enum: [PLATFORM_SUPER_ADMIN, USER]
 *                     tenant:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         slug:
 *                           type: string
 *                         ownerId:
 *                           type: string
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post("/register/verify/:token", validate(verifyEmailSchema), AuthController.verifyEmailAndRegister);
/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in a user and issue access and refresh tokens
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: Pass1234
 *     responses:
 *       200:
 *         description: Login successful and tokens returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User LoggedIn Succesfully !
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         userType:
 *                           type: string
 *                         tenants:
 *                           type: array
 *                           items:
 *                             type: object
 *                         activeTenant:
 *                           type: object
 *                           nullable: true
 *                     accessToken:
 *                       type: string
 *       401:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post("/login", validate(loginSchema), AuthController.login);
/**
 * @openapi
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh an expired access token using the refresh token cookie
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: HttpOnly refresh token stored in cookies
 *     responses:
 *       200:
 *         description: New access and refresh tokens issued.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     accessToken:
 *                       type: string
 *       401:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post("/refresh-token", AuthController.refreshToken);
/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Clear authentication cookies from the client
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: User logged out successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Logged out successfully!
 */
router.post("/logout", AuthController.logout);
/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request a password reset link for the given email
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email if an account exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: If an account with that email exists, a password reset link has been sent.
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post("/forgot-password", validate(forgotPasswordSchema), AuthController.forgotPassword);
/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset a user's password using a valid reset token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: jwt-reset-token
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: NewPass123
 *     responses:
 *       200:
 *         description: Password reset was successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Password reset successful. You can now log in with your new password.
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post("/reset-password", validate(resetPasswordSchema), AuthController.resetPassword);
/**
 * @openapi
 * /api/v1/auth/accept-invitation:
 *   post:
 *     summary: Accept a tenant invitation and create or attach a user to the tenant
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - fullName
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: invitation-jwt-token
 *               fullName:
 *                 type: string
 *                 example: Sara Johnson
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Pass1234
 *     responses:
 *       201:
 *         description: Invitation accepted, tenant membership created, and tokens returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Invitation accepted and account setup completed successfully!
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     accessToken:
 *                       type: string
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post("/accept-invitation", validate(acceptInvitationSchema), AuthController.acceptInvitation);
/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Fetch the authenticated user's profile and tenant memberships
 *     tags:
 *       - Auth
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user details with tenant access metadata.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User Detected Successfully !
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                       nullable: true
 *                     birthDate:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     gender:
 *                       type: string
 *                       enum: [MALE, FEMALE, OTHER]
 *                       nullable: true
 *                     userType:
 *                       type: string
 *                       enum: [PLATFORM_SUPER_ADMIN, USER]
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     tenants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tenantId:
 *                             type: string
 *                           tenantName:
 *                             type: string
 *                           tenantSlug:
 *                             type: string
 *                           tenantIsActive:
 *                             type: boolean
 *                           role:
 *                             type: string
 *                             enum: [OWNER, MANAGER, INVENTORY_STAFF, CUSTOMER_SERVICE, CUSTOM]
 *                           permissions:
 *                             type: array
 *                             items:
 *                               type: string
 *                           customRoleName:
 *                             type: string
 *                             nullable: true
 *                           customRoleId:
 *                             type: string
 *                             nullable: true
 *                     activeTenant:
 *                       type: object
 *                       nullable: true
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.get("/me", protect, AuthController.getMe);
/**
 * @openapi
 * /api/v1/auth/invite-user:
 *   post:
 *     summary: Invite a new employee or user to a tenant with a role assignment
 *     tags:
 *       - Auth
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - email
 *               - role
 *             properties:
 *               tenantId:
 *                 type: string
 *                 example: tenant-uuid
 *               email:
 *                 type: string
 *                 format: email
 *                 example: invited.user@example.com
 *               role:
 *                 type: string
 *                 enum: [OWNER, MANAGER, INVENTORY_STAFF, CUSTOMER_SERVICE, CUSTOM]
 *                 example: MANAGER
 *               customRoleId:
 *                 type: string
 *                 nullable: true
 *                 example: custom-role-uuid
 *     responses:
 *       200:
 *         description: Invitation created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Invitation successfully created for invited.user@example.com.
 *       403:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       400:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.post("/invite-user", protect, validate(inviteUserSchema), AuthController.inviteUser);
/**
 * @openapi
 * /api/v1/auth/delete-user:
 *   delete:
 *     summary: Remove a user from the current tenant as the tenant owner
 *     tags:
 *       - Auth
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - userId
 *             properties:
 *               tenantId:
 *                 type: string
 *                 example: tenant-uuid
 *               userId:
 *                 type: string
 *                 example: user-uuid
 *     responses:
 *       200:
 *         description: User removed successfully from the tenant.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User removed from tenant successfully
 *       403:
 *         $ref: '#/components/schemas/AppErrorResponse'
 *       404:
 *         $ref: '#/components/schemas/AppErrorResponse'
 */
router.delete("/delete-user", protect, restrictTo("OWNER"), AuthController.deleteUser);
export default router;
