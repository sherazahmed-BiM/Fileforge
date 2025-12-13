"""
Email Service for FileForge

Sends emails using SMTP.
"""

import logging
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv

# Load .env file
load_dotenv()

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP."""

    def __init__(self):
        self.frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        self.smtp_host = os.getenv("SMTP_HOST", "")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.email_from = os.getenv("EMAIL_FROM", "")
        self.use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    def _send_email(self, to: str, subject: str, html_body: str) -> bool:
        """Send an email via SMTP."""
        if not self.smtp_host or not self.smtp_user:
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.email_from or self.smtp_user
            msg["To"] = to

            html_part = MIMEText(html_body, "html")
            msg.attach(html_part)

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(msg["From"], to, msg.as_string())

            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}")
            return False

    async def send_verification_email(self, email: str, token: str, name: str | None = None) -> bool:
        """
        Send email verification OTP code.

        Args:
            email: User email address
            token: 6-digit OTP verification code
            name: User name (optional)

        Returns:
            True if email was sent successfully
        """
        user_name = name or "there"

        if not self.smtp_host:
            # Fallback to logging in development
            logger.info(
                f"[EMAIL] Verification email for {email}:\n"
                f"  Name: {name or 'User'}\n"
                f"  Verification Code: {token}"
            )
            return True

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1A1A1A;">Welcome to FileForge!</h2>
            <p style="color: #6B6B6B; font-size: 16px;">
                Hi {user_name},
            </p>
            <p style="color: #6B6B6B; font-size: 16px;">
                Thanks for signing up! Use the verification code below to verify your email address:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #F5F2ED; border: 2px solid #2C2C2C; border-radius: 12px;
                            padding: 20px 40px; display: inline-block;">
                    <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold;
                                 letter-spacing: 8px; color: #1A1A1A;">
                        {token}
                    </span>
                </div>
            </div>
            <p style="color: #6B6B6B; font-size: 16px; text-align: center;">
                Enter this code on the verification page to complete your registration.
            </p>
            <p style="color: #A0A0A0; font-size: 14px; text-align: center;">
                This code expires in 24 hours.
            </p>
            <hr style="border: none; border-top: 1px solid #EDEAE4; margin: 30px 0;">
            <p style="color: #A0A0A0; font-size: 12px;">
                If you didn't create an account, you can safely ignore this email.
            </p>
        </div>
        """

        success = self._send_email(email, "Your FileForge verification code", html_body)
        if success:
            logger.info(f"Verification email sent to {email}")
        return success

    async def send_password_reset_email(self, email: str, token: str, name: str | None = None) -> bool:
        """
        Send password reset link.

        Args:
            email: User email address
            token: Password reset token
            name: User name (optional)

        Returns:
            True if email was sent successfully
        """
        reset_url = f"{self.frontend_url}/reset-password?token={token}"
        user_name = name or "there"

        if not self.smtp_host:
            logger.info(
                f"[EMAIL] Password reset email for {email}:\n"
                f"  Name: {name or 'User'}\n"
                f"  Reset URL: {reset_url}"
            )
            return True

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1A1A1A;">Reset your password</h2>
            <p style="color: #6B6B6B; font-size: 16px;">
                Hi {user_name},
            </p>
            <p style="color: #6B6B6B; font-size: 16px;">
                We received a request to reset your password. Click the button below to choose a new one:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}"
                   style="background-color: #C4705A; color: white; padding: 12px 30px;
                          text-decoration: none; border-radius: 8px; font-weight: bold;
                          display: inline-block;">
                    Reset Password
                </a>
            </div>
            <p style="color: #A0A0A0; font-size: 14px;">
                This link expires in 1 hour.
            </p>
            <hr style="border: none; border-top: 1px solid #EDEAE4; margin: 30px 0;">
            <p style="color: #A0A0A0; font-size: 12px;">
                If you didn't request a password reset, you can safely ignore this email.
            </p>
        </div>
        """

        success = self._send_email(email, "Reset your FileForge password", html_body)
        if success:
            logger.info(f"Password reset email sent to {email}")
        return success

    async def send_welcome_email(self, email: str, name: str | None = None) -> bool:
        """
        Send welcome email after verification.

        Args:
            email: User email address
            name: User name (optional)

        Returns:
            True if email was sent successfully
        """
        user_name = name or "there"
        dashboard_url = f"{self.frontend_url}/upload"

        if not self.smtp_host:
            logger.info(
                f"[EMAIL] Welcome email for {email}:\n"
                f"  Name: {name or 'User'}"
            )
            return True

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1A1A1A;">You're all set!</h2>
            <p style="color: #6B6B6B; font-size: 16px;">
                Hi {user_name},
            </p>
            <p style="color: #6B6B6B; font-size: 16px;">
                Your email has been verified and your FileForge account is ready to use.
            </p>
            <p style="color: #6B6B6B; font-size: 16px;">
                Start converting your documents into LLM-ready JSON data:
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{dashboard_url}"
                   style="background-color: #C4705A; color: white; padding: 12px 30px;
                          text-decoration: none; border-radius: 8px; font-weight: bold;
                          display: inline-block;">
                    Go to Dashboard
                </a>
            </div>
            <hr style="border: none; border-top: 1px solid #EDEAE4; margin: 30px 0;">
            <p style="color: #A0A0A0; font-size: 12px;">
                Questions? Just reply to this email.
            </p>
        </div>
        """

        success = self._send_email(email, "Welcome to FileForge!", html_body)
        if success:
            logger.info(f"Welcome email sent to {email}")
        return success
