/**
 * Auth Strings
 * All authentication-related text - no hardcoded values
 */

export const AUTH_STRINGS = {
  login: {
    title: "Log in to Birdzy",
    titlePrefix: "Log in to",
    forgotPassword: "Forgot password",
    signIn: "Sign in",
    signUp: "Sign up",
    noAccount: "Don't have an account?",
    or: "or",
  },
  signUp: {
    title: "Sign up to Birdzy",
    titlePrefix: "Sign up to",
    signUp: "Sign up",
    signIn: "Sign in",
    hasAccount: "Already have an account?",
    or: "or",
  },
  forgotPassword: {
    title: "Forgot password",
    subtitle:
      "Please enter the e-mail address you use to log in, and we will send you a code to reset your password.",
    sendResetLink: "Send reset link",
    backToLogin: "Back to login",
  },
  socialLogin: {
    apple: "Continue with Apple",
    google: "Continue with Google",
    facebook: "Continue with Facebook",
  },
  placeholders: {
    email: "Enter email",
    password: "Enter your password",
    confirmPassword: "Re-enter your password",
    newPassword: "New password",
  },
  verifyEmailFlow: {
    verifyTitle: "Verify your email",
    verificationCodeLabel: "Verification code",
    verificationCodePlaceholder: "Enter verification code",
    resendPrefix: "Didn't receive the code? ",
    resend: "Resend",
    changeEmail: "Change email address",
  },
  createNewPassword: {
    title: "Create a new password",
    subtitle: "Enter your new password",
    save: "Save",
  },
  signUpScreen: {
    continueWithApple: "Continue with Apple",
    continueWithGoogle: "Continue with Google",
    continueWithEmail: "Continue with email",
    signUpTitle: "Sign up",
    sessionNotReady: "Session not ready. Please try again.",
    privacyPolicy: "privacy\u00A0policy",
    termsOfConditions: "terms\u00A0of\u00A0conditions",
    termsOfConditionsTitle: "Terms of Conditions",
    /** Use COMMON_STRINGS.messages.connectionTakingTooLong for connection timeout */
    /** Use COMMON_STRINGS.messages.somethingWentWrong for generic error */
  },
  errors: {
    signupFailed: "Signup failed",
    loginFailed: "Login failed",
    googleLoginFailed: "Google login failed",
    appleLoginFailed: "Apple login failed",
    appleLoginUnavailable:
      "Sign in with Apple is temporarily unavailable. Please use Google or email.",
    guestLoginFailed: "Guest login failed",
    forgotPasswordFailed: "Failed to send password reset email",
    resetPasswordFailed: "Failed to reset password",
    getProfileFailed: "Failed to get user profile",
    updateProfileFailed: "Failed to update profile",
    deleteAccountFailed: "Failed to delete account",
    resendVerificationFailed: "Failed to resend verification email",
    getReferralsFailed: "Failed to get referrals",
    useReferralFailed: "Failed to use referral code",
    subscribeGoogleFailed: "Failed to subscribe with Google",
    unsubscribeGoogleFailed: "Failed to unsubscribe from Google",
    subscribeAppleFailed: "Failed to subscribe with Apple",
    unsubscribeAppleFailed: "Failed to unsubscribe from Apple",
    parseTokenFailed: "Failed to parse purchase token",
    tokenRefreshFailed: "Token refresh failed",
    invalidCredentials: "Invalid email or password",
    emailRequired: "Please enter both email and password",
    fieldsRequired: "Please fill in all fields correctly",
    passwordsMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    emailInvalid: "Please enter a valid email address",
    verificationCodeRequired: "Please enter the 6-digit code",
  },
  alerts: {
    error: "Error",
    loginFailed: "Login Failed",
    signupFailed: "Signup Failed",
    success: "Success",
  },
  messages: {
    passwordResetSuccess: "Password reset successfully!",
    passwordResetEmailSent: "Password reset email sent!",
    verificationEmailSent: "Verification email sent!",
    pleaseEnterEmail: "Please enter your email",
    checkInbox: "Please check your inbox.",
  },
} as const;
