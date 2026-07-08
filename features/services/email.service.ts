import { Resend } from 'resend';

const BASE_STYLES = `
  body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .wrapper { max-width: 560px; margin: 40px auto; padding: 0 16px 40px; }
  .card { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
  .header { background: #4f46e5; padding: 32px 40px; text-align: center; }
  .header-logo { color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; margin: 0; }
  .body { padding: 40px; }
  .title { color: #0f172a; font-size: 22px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.3px; }
  .subtitle { color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 32px; }
  .otp-box { background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px; }
  .otp-code { color: #4f46e5; font-size: 40px; font-weight: 800; letter-spacing: 0.25em; margin: 0; font-variant-numeric: tabular-nums; }
  .otp-hint { color: #94a3b8; font-size: 13px; margin: 8px 0 0; }
  .cta-button { display: block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; text-align: center; margin-bottom: 32px; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 0 0 24px; }
  .notice { color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 8px; }
  .notice a { color: #4f46e5; text-decoration: none; word-break: break-all; }
  .footer { text-align: center; padding-top: 24px; }
  .footer p { color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0; }
`;

function htmlWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <p class="header-logo">CertifiqueAI</p>
      </div>
      <div class="body">
        ${content}
      </div>
    </div>
    <div class="footer">
      <p>CertifiqueAI &mdash; Preparação para certificações com IA</p>
      <p>Se você não reconhece esta atividade, pode ignorar este e-mail.</p>
    </div>
  </div>
</body>
</html>`;
}

export class EmailService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);
  private readonly from = process.env.RESEND_FROM_EMAIL!;

  async sendEmailVerification(to: string, code: string): Promise<void> {
    const content = `
      <h1 class="title">Verifique seu e-mail</h1>
      <p class="subtitle">Use o código abaixo para confirmar seu cadastro no CertifiqueAI. Ele expira em <strong>15 minutos</strong>.</p>

      <div class="otp-box">
        <p class="otp-code">${code}</p>
        <p class="otp-hint">Digite este código na página de verificação</p>
      </div>

      <hr class="divider" />

      <p class="notice">Se você não criou uma conta no CertifiqueAI, pode ignorar este e-mail com segurança.</p>
    `;

    await this.resend.emails.send({
      from: this.from,
      to,
      subject: `${code} é o seu código de verificação — CertifiqueAI`,
      html: htmlWrapper(content),
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const content = `
      <h1 class="title">Redefinir senha</h1>
      <p class="subtitle">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. Este link expira em <strong>1 hora</strong>.</p>

      <a class="cta-button" href="${resetUrl}">Redefinir minha senha</a>

      <hr class="divider" />

      <p class="notice">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
      <p class="notice"><a href="${resetUrl}">${resetUrl}</a></p>
      <p class="notice" style="margin-top: 16px;">Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.</p>
    `;

    await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Redefinição de senha — CertifiqueAI',
      html: htmlWrapper(content),
    });
  }
}
