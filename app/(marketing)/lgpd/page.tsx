import type { Metadata } from 'next';
import { LegalPageShell } from '@/app/(marketing)/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Conformidade LGPD | CertifiqueAI',
  description: 'Conheça seus direitos como titular de dados pessoais e saiba como exercê-los na CertifiqueAI.',
  alternates: { canonical: 'https://www.certifiqueai.com/lgpd' },
};

export default function LgpdPage() {
  return (
    <LegalPageShell title="Conformidade LGPD" lastUpdated="5 de agosto de 2026">
      <p>
        A CertifiqueAI trata dados pessoais em conformidade com a{' '}
        <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)</strong>. Esta página detalha seus
        direitos como titular de dados e como exercê-los.
      </p>

      <h2>1. Papel da CertifiqueAI</h2>
      <p>
        A CertifiqueAI atua como <strong>controladora</strong> dos dados pessoais coletados em sua plataforma: define
        as finalidades e os meios do tratamento. Para detalhes sobre quais dados coletamos e com qual finalidade,
        consulte nossa <a href="/privacy">Política de Privacidade</a>.
      </p>
      <p>
        A OpenAI, o Stripe e a Vercel atuam como <strong>operadores</strong>: processam dados sob nossas instruções e
        em conformidade com seus próprios programas de privacidade.
      </p>

      <h2>2. Seus direitos (LGPD art. 18)</h2>
      <p>Como titular de dados pessoais, você tem os seguintes direitos:</p>

      <h3>2.1 Acesso</h3>
      <p>Confirmar se tratamos seus dados e obter uma cópia dos dados pessoais que mantemos sobre você.</p>

      <h3>2.2 Correção</h3>
      <p>Solicitar a correção de dados incompletos, inexatos ou desatualizados.</p>

      <h3>2.3 Anonimização, bloqueio ou eliminação</h3>
      <p>
        Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em
        desconformidade com a LGPD.
      </p>

      <h3>2.4 Portabilidade</h3>
      <p>
        Solicitar a portabilidade dos seus dados a outro fornecedor de serviço ou produto, mediante requisição
        expressa, em formato interoperável.
      </p>

      <h3>2.5 Eliminação de dados com base em consentimento</h3>
      <p>
        Solicitar a eliminação dos dados pessoais tratados com base no seu consentimento, exceto nos casos previstos
        em lei (ex.: obrigação legal de guarda de registros fiscais).
      </p>

      <h3>2.6 Informação sobre compartilhamento</h3>
      <p>
        Obter informações sobre as entidades públicas e privadas com as quais realizamos o compartilhamento dos seus
        dados.
      </p>

      <h3>2.7 Informação sobre consentimento</h3>
      <p>
        Ser informado sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa.
      </p>

      <h3>2.8 Revogação do consentimento</h3>
      <p>
        Revogar o consentimento a qualquer momento, sem prejuízo da licitude do tratamento realizado anteriormente.
      </p>

      <h3>2.9 Oposição</h3>
      <p>
        Opor-se ao tratamento realizado com fundamento em uma das hipóteses de dispensa de consentimento, em caso de
        descumprimento da LGPD.
      </p>

      <h2>3. Como exercer seus direitos</h2>
      <p>
        Para exercer qualquer dos direitos acima, entre em contato com nossa equipe de privacidade pelo e-mail:{' '}
        <a href="mailto:privacidade@certifiqueai.com">privacidade@certifiqueai.com</a>
      </p>
      <p>Inclua no seu e-mail:</p>
      <ul>
        <li>Seu nome completo e e-mail cadastrado;</li>
        <li>O direito que deseja exercer;</li>
        <li>Uma breve descrição da sua solicitação.</li>
      </ul>
      <p>
        Respondemos a todas as solicitações em até <strong>15 dias úteis</strong>, conforme prazo estabelecido no
        art. 19 da LGPD. Em casos de solicitações complexas, podemos prorrogar esse prazo com justificativa.
      </p>

      <h2>4. Encarregado de Proteção de Dados (DPO)</h2>
      <p>
        Nos termos do art. 41 da LGPD, a CertifiqueAI designa como canal de contato para assuntos relacionados à
        privacidade e proteção de dados o endereço:{' '}
        <a href="mailto:privacidade@certifiqueai.com">privacidade@certifiqueai.com</a>
      </p>

      <h2>5. Reclamação à ANPD</h2>
      <p>
        Caso considere que seus direitos não foram adequadamente atendidos, você pode apresentar reclamação à
        Autoridade Nacional de Proteção de Dados (ANPD) através do portal{' '}
        <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">
          www.gov.br/anpd
        </a>
        .
      </p>

      <h2>6. Segurança dos dados</h2>
      <p>
        Adotamos medidas técnicas e administrativas para proteger seus dados pessoais contra acessos não autorizados,
        situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou difusão. Veja mais em nossa{' '}
        <a href="/security">página de Segurança</a>.
      </p>

      <h2>7. Incidentes de segurança</h2>
      <p>
        Em caso de incidente de segurança com risco relevante aos titulares, comunicaremos a ANPD e os usuários
        afetados dentro do prazo de 72 horas da ciência do incidente, conforme art. 48 da LGPD, com as informações
        exigidas por lei.
      </p>
    </LegalPageShell>
  );
}
