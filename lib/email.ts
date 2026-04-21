import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendOtpEmail(
  to: string,
  code: string,
  purpose: 'register' | 'login'
): Promise<void> {
  const transporter = createTransporter();

  const subject =
    purpose === 'register'
      ? 'Verifica tu correo — Lab Manager UJAP'
      : 'Tu código de acceso — Lab Manager UJAP';

  const actionText =
    purpose === 'register'
      ? 'Para completar tu registro, ingresa el siguiente código:'
      : 'Para acceder a tu cuenta, ingresa el siguiente código:';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%);padding:32px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Lab Manager</h1>
            <p style="color:#93c5fd;margin:4px 0 0;font-size:13px;">Universidad José Antonio Páez</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#0f172a;font-size:20px;margin:0 0 12px;">${subject}</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 28px;">${actionText}</p>
            <!-- OTP Box -->
            <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
              <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1e40af;font-family:'Courier New',monospace;">${code}</span>
            </div>
            <p style="color:#64748b;font-size:13px;margin:0 0 6px;">⏱ Este código expira en <strong>10 minutos</strong>.</p>
            <p style="color:#64748b;font-size:13px;margin:0;">Si no solicitaste este código, ignora este mensaje.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Universidad José Antonio Páez — Sistema de Gestión de Laboratorios</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}
