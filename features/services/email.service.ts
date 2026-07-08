import { Resend } from 'resend';

const BRAND_COLOR = '#4f46e5';
const BRAND_NAME = 'CertifiqueAI';
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// Outlook uses Word's rendering engine:
// - No CSS classes or <style> blocks — everything must be inline
// - No shorthand padding — use padding-top/right/bottom/left separately
// - border-radius on <table> is ignored — use on <td> for non-Outlook clients only
// - Buttons need VML (<!--[if mso]>) for Outlook + plain <a> for everything else
// - width must be both HTML attribute AND inline style
// - Avoid &zwnj; and display:none combos — spam filters flag them as cloaking

function emailLayout(bodyHtml: string, bodyText: string) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f1f5f9;width:100%;">
  <tr>
    <td align="center" style="padding-top:40px;padding-right:16px;padding-bottom:40px;padding-left:16px;">

      <!-- Card container -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:560px;max-width:100%;background-color:#ffffff;">

        <!-- Header -->
        <tr>
          <td align="center" bgcolor="${BRAND_COLOR}" style="background-color:${BRAND_COLOR};padding-top:24px;padding-right:40px;padding-bottom:24px;padding-left:40px;">
            <p style="margin:0;font-family:${FONT};font-size:18px;font-weight:700;color:#ffffff;line-height:1;">${BRAND_NAME}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding-top:40px;padding-right:40px;padding-bottom:32px;padding-left:40px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding-right:40px;padding-left:40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr><td style="border-top:1px solid #e2e8f0;font-size:0;line-height:0;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-top:24px;padding-right:40px;padding-bottom:32px;padding-left:40px;">
            <p style="margin:0;font-family:${FONT};font-size:12px;color:#94a3b8;line-height:1.6;">${BRAND_NAME} &bull; Preparacao para certificacoes com IA</p>
            <p style="margin:4px 0 0;font-family:${FONT};font-size:12px;color:#94a3b8;line-height:1.6;">Se voce nao reconhece esta atividade, ignore este e-mail.</p>
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
<h1 style="margin:0 0 12px;font-family:${FONT};font-size:22px;font-weight:700;color:#0f172a;line-height:1.2;">Verifique seu e-mail</h1>
<p style="margin:0 0 32px;font-family:${FONT};font-size:15px;color:#64748b;line-height:1.6;">Use o codigo abaixo para confirmar seu cadastro no ${BRAND_NAME}. Ele expira em <strong style="color:#0f172a;">15 minutos</strong>.</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
  <tr>
    <td align="center" bgcolor="#f8fafc" style="background-color:#f8fafc;padding-top:28px;padding-right:24px;padding-bottom:28px;padding-left:24px;border:2px solid #e2e8f0;">
      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:42px;font-weight:800;color:${BRAND_COLOR};line-height:1;letter-spacing:8px;">${code}</p>
      <p style="margin:12px 0 0;font-family:${FONT};font-size:13px;color:#94a3b8;line-height:1.4;">Digite este codigo na pagina de verificacao</p>
    </td>
  </tr>
</table>

<p style="margin:0;font-family:${FONT};font-size:13px;color:#94a3b8;line-height:1.6;">Se voce nao criou uma conta no ${BRAND_NAME}, pode ignorar este e-mail.</p>`;

    const bodyText = [
      `Verifique seu e-mail no ${BRAND_NAME}`,
      '',
      `Seu codigo de verificacao: ${code}`,
      '',
      'Ele expira em 15 minutos.',
      '',
      `Se voce nao criou uma conta no ${BRAND_NAME}, ignore este e-mail.`,
    ].join('\n');

    const { html, text } = emailLayout(bodyHtml, bodyText);

    await this.resend.emails.send({
      from: this.from,
      to,
      subject: `${code} - Codigo de verificacao ${BRAND_NAME}`,
      html,
      text,
    });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const bodyHtml = `
<h1 style="margin:0 0 12px;font-family:${FONT};font-size:22px;font-weight:700;color:#0f172a;line-height:1.2;">Redefinir senha</h1>
<p style="margin:0 0 32px;font-family:${FONT};font-size:15px;color:#64748b;line-height:1.6;">Recebemos uma solicitacao para redefinir a senha da sua conta no ${BRAND_NAME}. Clique no botao abaixo para criar uma nova senha. Este link expira em <strong style="color:#0f172a;">1 hora</strong>.</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
  <tr>
    <td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
        href="${resetUrl}"
        style="height:50px;v-text-anchor:middle;width:260px;"
        arcsize="10%" stroke="f" fillcolor="${BRAND_COLOR}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:700;">Redefinir minha senha</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${resetUrl}"
        style="background-color:${BRAND_COLOR};border-radius:8px;color:#ffffff;display:inline-block;font-family:${FONT};font-size:15px;font-weight:700;line-height:50px;text-align:center;text-decoration:none;width:260px;-webkit-text-size-adjust:none;mso-hide:all;">Redefinir minha senha</a>
      <!--<![endif]-->
    </td>
  </tr>
</table>

<p style="margin:0 0 8px;font-family:${FONT};font-size:13px;color:#94a3b8;line-height:1.6;">Se o botao nao funcionar, copie e cole este link no navegador:</p>
<p style="margin:0 0 24px;font-family:'Courier New',Courier,monospace;font-size:12px;color:#4f46e5;line-height:1.6;word-break:break-all;">${resetUrl}</p>

<p style="margin:0;font-family:${FONT};font-size:13px;color:#94a3b8;line-height:1.6;">Se voce nao solicitou a redefinicao de senha, ignore este e-mail. Sua senha permanece a mesma.</p>`;

    const bodyText = [
      `Redefinir senha - ${BRAND_NAME}`,
      '',
      'Clique no link abaixo para redefinir sua senha (expira em 1 hora):',
      '',
      resetUrl,
      '',
      `Se voce nao solicitou isso, ignore este e-mail. Sua senha permanece a mesma.`,
    ].join('\n');

    const { html, text } = emailLayout(bodyHtml, bodyText);

    await this.resend.emails.send({
      from: this.from,
      to,
      subject: `Redefinicao de senha - ${BRAND_NAME}`,
      html,
      text,
    });
  }
}
