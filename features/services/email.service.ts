import { Resend } from 'resend';

// Outlook uses Word's rendering engine — no CSS classes, no <style> block support.
// All styles must be inline. Layout via tables, not divs with flexbox/grid.
// MSO conditional comments handle VML-based rounded corners for Outlook.

const BRAND_COLOR = '#4f46e5';
const BRAND_NAME = 'CertifiqueAI';

function emailLayout(title: string, previewText: string, bodyHtml: string, bodyText: string) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Preview text (hidden) -->
  <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${BRAND_COLOR};padding:28px 40px;border-radius:16px 16px 0 0;">
              <p style="margin:0;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.3px;">${BRAND_NAME}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <p style="margin:0 0 4px;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;">${BRAND_NAME} &mdash; Preparação para certificações com IA</p>
              <p style="margin:0;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;">Se você não reconhece esta atividade, pode ignorar este e-mail.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text: bodyText };
}

export class EmailService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);
  private readonly from = process.env.RESEND_FROM_EMAIL!;

  async sendEmailVerification(to: string, code: string): Promise<void> {
    const bodyHtml = `
      <h1 style="margin:0 0 8px;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Verifique seu e-mail</h1>
      <p style="margin:0 0 32px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">Use o codigo abaixo para confirmar seu cadastro no ${BRAND_NAME}. Ele expira em <strong>15 minutos</strong>.</p>

      <!-- OTP box -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
        <tr>
          <td align="center" style="background-color:#f1f5f9;border-radius:12px;padding:28px 24px;">
            <p style="margin:0;color:${BRAND_COLOR};font-family:'Courier New',Courier,monospace;font-size:40px;font-weight:800;letter-spacing:0.3em;line-height:1;">${code}</p>
            <p style="margin:10px 0 0;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;">Digite este codigo na pagina de verificacao</p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
        <tr><td style="border-top:1px solid #e2e8f0;font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>

      <p style="margin:0;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;">Se voce nao criou uma conta no ${BRAND_NAME}, pode ignorar este e-mail com seguranca.</p>
    `;

    const bodyText = `Verifique seu e-mail no ${BRAND_NAME}\n\nSeu codigo de verificacao: ${code}\n\nEle expira em 15 minutos.\n\nSe voce nao criou uma conta, ignore este e-mail.`;

    const { html, text } = emailLayout(
      `Verifique seu e-mail — ${BRAND_NAME}`,
      `Seu codigo: ${code} — expira em 15 minutos`,
      bodyHtml,
      bodyText
    );

    await this.resend.emails.send({
      from: this.from,
      to,
      subject: `${code} e o seu codigo de verificacao`,
      html,
      text,
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const bodyHtml = `
      <h1 style="margin:0 0 8px;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Redefinir senha</h1>
      <p style="margin:0 0 32px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;">Recebemos uma solicitacao para redefinir a senha da sua conta. Clique no botao abaixo para criar uma nova senha. Este link expira em <strong>1 hora</strong>.</p>

      <!-- CTA button -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
        <tr>
          <td align="center">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="21%" stroke="f" fillcolor="${BRAND_COLOR}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:700;">Redefinir minha senha</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${resetUrl}" style="background-color:${BRAND_COLOR};border-radius:10px;color:#ffffff;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;line-height:48px;text-align:center;text-decoration:none;width:240px;-webkit-text-size-adjust:none;">Redefinir minha senha</a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px;">
        <tr><td style="border-top:1px solid #e2e8f0;font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>

      <p style="margin:0 0 8px;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;">Se o botao nao funcionar, copie e cole o link abaixo no seu navegador:</p>
      <p style="margin:0 0 16px;font-family:'Courier New',Courier,monospace;font-size:12px;line-height:1.6;word-break:break-all;"><a href="${resetUrl}" style="color:${BRAND_COLOR};text-decoration:none;">${resetUrl}</a></p>
      <p style="margin:0;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;">Se voce nao solicitou a redefinicao de senha, ignore este e-mail. Sua senha permanece a mesma.</p>
    `;

    const bodyText = `Redefinir senha — ${BRAND_NAME}\n\nClique no link abaixo para redefinir sua senha (expira em 1 hora):\n\n${resetUrl}\n\nSe voce nao solicitou isso, ignore este e-mail.`;

    const { html, text } = emailLayout(
      `Redefinicao de senha — ${BRAND_NAME}`,
      'Clique para criar uma nova senha. Link expira em 1 hora.',
      bodyHtml,
      bodyText
    );

    await this.resend.emails.send({
      from: this.from,
      to,
      subject: `Redefinicao de senha — ${BRAND_NAME}`,
      html,
      text,
    });
  }
}
