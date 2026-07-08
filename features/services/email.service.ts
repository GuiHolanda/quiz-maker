import { Resend } from 'resend';

export class EmailService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);
  private readonly from = process.env.RESEND_FROM_EMAIL!;

  async sendEmailVerification(to: string, code: string): Promise<void> {
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Seu código de verificação - CertifiqueAI',
      html: `
        <p>Olá,</p>
        <p>Use o código abaixo para verificar seu e-mail no CertifiqueAI:</p>
        <h2 style="letter-spacing: 0.2em; font-size: 2rem;">${code}</h2>
        <p>Este código expira em 15 minutos.</p>
        <p>Se você não solicitou este código, ignore este e-mail.</p>
      `,
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Redefinição de senha - CertifiqueAI',
      html: `
        <p>Você solicitou a redefinição de senha da sua conta no CertifiqueAI.</p>
        <p><a href="${resetUrl}">Clique aqui para redefinir sua senha</a></p>
        <p>Este link expira em 1 hora. Se você não fez essa solicitação, ignore este e-mail.</p>
      `,
    });
  }
}
