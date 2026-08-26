import type { Metadata } from 'next';
import { LegalPageShell } from '@/app/(marketing)/components/legal/LegalPageShell';
import { alternatesFor } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Saiba como a CertifiqueAI coleta, usa e protege seus dados pessoais conforme a LGPD.',
  alternates: alternatesFor('/privacy'),
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Política de Privacidade" lastUpdated="5 de agosto de 2026">
      <p>
        A CertifiqueAI (<strong>certifiqueai.com</strong>) é uma plataforma de preparação para certificações e concursos
        públicos. Esta Política de Privacidade explica como coletamos, usamos, compartilhamos e protegemos seus dados
        pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD).
      </p>

      <h2>1. Dados que coletamos</h2>
      <p>Coletamos os seguintes dados pessoais ao longo do uso da plataforma:</p>
      <ul>
        <li>
          <strong>Dados de cadastro:</strong> nome completo, endereço de e-mail e senha (armazenada como hash
          irreversível com bcrypt).
        </li>
        <li>
          <strong>Dados de uso:</strong> questões geradas, simulados realizados, respostas e histórico de estudo.
        </li>
        <li>
          <strong>Dados de faturamento:</strong> histórico de assinatura e plano ativo. Dados de cartão de crédito são
          processados exclusivamente pelo Stripe e nunca armazenados em nossos servidores.
        </li>
        <li>
          <strong>Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operacional, páginas acessadas e
          data/hora de acesso, coletados automaticamente pelos servidores.
        </li>
        <li>
          <strong>Preferências de sessão:</strong> idioma escolhido e estado da interface, armazenados no localStorage
          do seu navegador.
        </li>
      </ul>

      <h2>2. Finalidade do tratamento</h2>
      <p>Seus dados são tratados exclusivamente para as finalidades abaixo:</p>
      <ul>
        <li>Prestar o serviço de geração de questões personalizadas por IA;</li>
        <li>Gerenciar sua conta, plano e cobrança;</li>
        <li>Enviar comunicações transacionais (confirmação de e-mail, redefinição de senha);</li>
        <li>Melhorar a qualidade e a relevância das questões geradas;</li>
        <li>Cumprir obrigações legais e regulatórias.</li>
      </ul>

      <h2>3. Base legal</h2>
      <p>Tratamos seus dados pessoais com base nos seguintes fundamentos do art. 7º da LGPD:</p>
      <ul>
        <li>
          <strong>Execução de contrato</strong> (art. 7º, V): para fornecer o serviço que você contratou.
        </li>
        <li>
          <strong>Legítimo interesse</strong> (art. 7º, IX): para melhorar a plataforma, prevenir fraudes e garantir
          segurança.
        </li>
        <li>
          <strong>Cumprimento de obrigação legal</strong> (art. 7º, II): quando exigido por lei ou ordem judicial.
        </li>
        <li>
          <strong>Consentimento</strong> (art. 7º, I): para comunicações de marketing, quando aplicável.
        </li>
      </ul>

      <h2>4. Compartilhamento com terceiros</h2>
      <p>
        Não vendemos seus dados. Compartilhamos apenas com parceiros essenciais para a prestação do serviço, na condição
        de operadores (LGPD art. 39):
      </p>
      <ul>
        <li>
          <strong>OpenAI (EUA):</strong> as questões inseridas como contexto de geração são enviadas à API da OpenAI
          para processamento por IA. Não enviamos nome, e-mail ou dados de identificação pessoal direta nestas
          requisições.
        </li>
        <li>
          <strong>Stripe (EUA):</strong> processa pagamentos e gerencia assinaturas. Opera como controlador independente
          dos dados de pagamento.
        </li>
        <li>
          <strong>Vercel (EUA):</strong> hospedagem da aplicação e funções serverless.
        </li>
        <li>
          <strong>Turso / libSQL (EUA):</strong> banco de dados em produção.
        </li>
      </ul>

      <h2>5. Transferência internacional de dados</h2>
      <p>
        Os parceiros listados acima operam nos Estados Unidos. A transferência de dados para fora do Brasil ocorre com
        base no art. 33 da LGPD, mediante cláusulas contratuais adequadas e/ou certificações de conformidade dos
        parceiros. A OpenAI, a Stripe e a Vercel possuem programas de compliance com GDPR e CCPA, que estabelecem
        salvaguardas equivalentes às exigidas pela LGPD.
      </p>

      <h2>6. Retenção de dados</h2>
      <ul>
        <li>
          <strong>Dados de conta e estudo:</strong> mantidos enquanto sua conta estiver ativa. Após a exclusão da conta,
          são anonimizados ou excluídos em até 30 dias.
        </li>
        <li>
          <strong>Dados de faturamento:</strong> mantidos por 5 anos, conforme exigência fiscal (Lei nº 9.249/1995).
        </li>
        <li>
          <strong>Logs de acesso:</strong> mantidos por 6 meses, conforme art. 15 do Marco Civil da Internet.
        </li>
      </ul>

      <h2>7. Seus direitos (LGPD art. 18)</h2>
      <p>
        Você tem o direito de acessar, corrigir, portar, anonimizar ou excluir seus dados. Veja como exercer cada
        direito na nossa <a href="/lgpd">página de Conformidade LGPD</a>.
      </p>

      <h2>8. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia em trânsito
        (HTTPS/TLS), hashing de senhas com bcrypt e controles de acesso. Veja mais na nossa{' '}
        <a href="/security">página de Segurança</a>.
      </p>

      <h2>9. Cookies e armazenamento local</h2>
      <p>
        A plataforma utiliza <strong>cookies de sessão</strong> para autenticação (NextAuth.js) e{' '}
        <strong>localStorage</strong> para preferências de idioma e estado da interface. Não utilizamos cookies de
        rastreamento ou publicidade de terceiros.
      </p>

      <h2>10. Menores de idade</h2>
      <p>
        O serviço não é direcionado a menores de 18 anos. Não coletamos intencionalmente dados de menores. Se
        identificarmos tal situação, excluiremos os dados imediatamente.
      </p>

      <h2>11. Alterações nesta política</h2>
      <p>
        Reservamo-nos o direito de atualizar esta política. Alterações relevantes serão comunicadas por e-mail ou
        notificação na plataforma. A versão vigente sempre estará disponível nesta página com a data da última
        atualização.
      </p>

      <h2>12. Contato</h2>
      <p>
        Para dúvidas sobre esta política ou para exercer seus direitos, entre em contato pelo e-mail:{' '}
        <a href="mailto:privacidade@certifiqueai.com">privacidade@certifiqueai.com</a>
      </p>
    </LegalPageShell>
  );
}
