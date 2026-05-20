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

// ─── Account approval email ──────────────────────────────────────────────────

export async function sendAccountApprovedEmail(to: string, fullName: string): Promise<void> {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%);padding:32px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Lab Manager</h1>
            <p style="color:#93c5fd;margin:4px 0 0;font-size:13px;">Universidad José Antonio Páez</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#0f172a;font-size:20px;margin:0 0 12px;">¡Cuenta aprobada!</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Hola <strong>${fullName}</strong>, tu cuenta ha sido <strong>aprobada</strong> por el administrador.
              Ya puedes iniciar sesión y comenzar a hacer reservas de laboratorios.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
              <p style="color:#15803d;font-size:14px;font-weight:600;margin:0;">✓ Tu cuenta está activa</p>
            </div>
            <p style="color:#64748b;font-size:13px;margin:0;">Si tienes algún problema para acceder, contacta al administrador del sistema.</p>
          </td>
        </tr>
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
    subject: '¡Tu cuenta ha sido aprobada! — Lab Manager UJAP',
    html,
  });
}

// ─── Reservation reminder email ──────────────────────────────────────────────

export async function sendReservationReminderEmail(
  to: string,
  window: '24h' | '1h',
  details: {
    labName: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    purpose?: string | null;
    computerNumber?: number | null;
  }
): Promise<void> {
  const transporter = createTransporter();
  const windowLabel = window === '24h' ? 'mañana' : 'en 1 hora';
  const resource = details.type === 'lab' ? 'Laboratorio completo' : `Computadora #${details.computerNumber ?? '?'}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%);padding:32px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Lab Manager</h1>
            <p style="color:#93c5fd;margin:4px 0 0;font-size:13px;">Universidad José Antonio Páez</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#0f172a;font-size:20px;margin:0 0 12px;">⏰ Recordatorio de reserva</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Tienes una reserva aprobada <strong>${windowLabel}</strong>. Te recordamos los detalles:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:13px;width:40%;">Laboratorio</td>
                    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${details.labName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:13px;">Recurso</td>
                    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${resource}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:13px;">Fecha</td>
                    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${formatDate(details.date)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:13px;">Horario</td>
                    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${details.startTime} – ${details.endTime}</td>
                  </tr>
                  ${details.purpose ? `
                  <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:13px;">Propósito</td>
                    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${details.purpose}</td>
                  </tr>` : ''}
                </table>
              </td></tr>
            </table>
            <p style="color:#64748b;font-size:13px;margin:0;">Si no puedes asistir, recuerda cancelar tu reserva con anticipación.</p>
          </td>
        </tr>
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
    subject: `Recordatorio ${window === '24h' ? '(mañana)' : '(en 1 hora)'}: ${details.labName} ${details.startTime}–${details.endTime} | Lab Manager UJAP`,
    html,
  });
}

// ─── Reservation emails ───────────────────────────────────────────────────────

type ReservationEvent = 'created' | 'approved' | 'rejected' | 'cancelled' | 'finished' | 'updated';

const EVENT_META: Record<ReservationEvent, { subject: string; heading: string; message: string; color: string; badge: string }> = {
  created:   { subject: 'Reserva recibida',       heading: 'Solicitud recibida',       message: 'Tu solicitud ha sido registrada y está <strong>pendiente de aprobación</strong>. Te notificaremos cuando el administrador la revise.', color: '#1e40af', badge: '#dbeafe' },
  approved:  { subject: 'Reserva aprobada',       heading: '¡Reserva aprobada!',       message: 'Tu reserva ha sido <strong>aprobada</strong>. Recuerda presentarte puntualmente en la fecha y horario indicados.', color: '#15803d', badge: '#dcfce7' },
  rejected:  { subject: 'Reserva rechazada',      heading: 'Reserva rechazada',        message: 'Tu solicitud de reserva fue <strong>rechazada</strong> por el administrador. Puedes crear una nueva solicitud si lo deseas.', color: '#b91c1c', badge: '#fee2e2' },
  cancelled: { subject: 'Reserva cancelada',      heading: 'Reserva cancelada',        message: 'Tu reserva ha sido <strong>cancelada</strong>. Si tienes alguna duda, contacta al administrador.', color: '#475569', badge: '#f1f5f9' },
  finished:  { subject: 'Reserva finalizada',     heading: 'Reserva finalizada',       message: 'Tu reserva ha <strong>finalizado</strong>. Esperamos que haya sido de utilidad.', color: '#1e40af', badge: '#dbeafe' },
  updated:   { subject: 'Reserva actualizada',    heading: 'Reserva actualizada',      message: 'Los datos de tu reserva han sido <strong>actualizados</strong>. A continuación encontrarás la información vigente.', color: '#7c3aed', badge: '#ede9fe' },
};

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export async function sendReservationEmail(
  to: string,
  event: ReservationEvent,
  details: {
    labName: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    purpose?: string | null;
    computerNumber?: number | null;
  }
): Promise<void> {
  const meta = EVENT_META[event];
  const transporter = createTransporter();

  const resource = details.type === 'lab' ? 'Laboratorio completo' : `Computadora #${details.computerNumber ?? '?'}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a8a 0%,#1e40af 100%);padding:32px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Lab Manager</h1>
            <p style="color:#93c5fd;margin:4px 0 0;font-size:13px;">Universidad José Antonio Páez</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#0f172a;font-size:20px;margin:0 0 8px;">${meta.heading}</h2>
            <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 28px;">${meta.message}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
              <tr><td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:13px;width:40%;">Laboratorio</td>
                    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${details.labName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:13px;">Recurso</td>
                    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${resource}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:13px;">Fecha</td>
                    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${formatDate(details.date)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:13px;">Horario</td>
                    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${details.startTime} – ${details.endTime}</td>
                  </tr>
                  ${details.purpose ? `
                  <tr>
                    <td style="padding:6px 0;color:#64748b;font-size:13px;">Propósito</td>
                    <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${details.purpose}</td>
                  </tr>` : ''}
                </table>
              </td></tr>
            </table>
            <div style="background:${meta.badge};border-radius:8px;padding:12px 16px;display:inline-block;">
              <span style="color:${meta.color};font-size:13px;font-weight:700;">Estado: ${meta.subject}</span>
            </div>
          </td>
        </tr>
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
    subject: `${meta.subject} — ${details.labName} | Lab Manager UJAP`,
    html,
  });
}
