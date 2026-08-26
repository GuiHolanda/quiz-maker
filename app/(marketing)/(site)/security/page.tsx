import type { Metadata } from 'next';
import { LegalPageShell } from '@/app/(marketing)/components/legal/LegalPageShell';
import { alternatesFor } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Segurança',
  description:
    'Como a CertifiqueAI protege seus dados com criptografia, hashing de senhas e boas práticas de segurança.',
  alternates: alternatesFor('/security'),
};

export default function SecurityPage() {
  return (
    <LegalPageShell title="Segurança" lastUpdated="5 de agosto de 2026">
      <p>
        A segurança dos seus dados é uma prioridade para a CertifiqueAI. Esta página descreve as medidas técnicas e
        organizacionais que adotamos para proteger suas informações.
      </p>

      <h2>1. Criptografia em trânsito</h2>
      <p>
        Toda comunicação entre seu navegador e nossos servidores é criptografada via <strong>HTTPS/TLS 1.2+</strong>.
        Não permitimos conexões HTTP sem criptografia. Certificados TLS são gerenciados automaticamente pela Vercel com
        renovação contínua.
      </p>

      <h2>2. Armazenamento de senhas</h2>
      <p>
        Senhas nunca são armazenadas em texto claro. Utilizamos o algoritmo <strong>bcrypt</strong> com fator de custo
        adequado para gerar hashes irreversíveis. Nem a equipe da CertifiqueAI tem acesso à sua senha.
      </p>

      <h2>3. Autenticação e sessões</h2>
      <p>
        A autenticação é gerenciada pelo <strong>NextAuth.js</strong> com tokens JWT de duração limitada (8 horas). A
        plataforma possui encerramento automático de sessão por inatividade após 30 minutos. Tokens de redefinição de
        senha são de uso único e expiram em 1 hora.
      </p>

      <h2>4. Dados de pagamento</h2>
      <p>
        Nenhum dado de cartão de crédito passa pelos nossos servidores. Todo processamento de pagamento é feito
        diretamente pelo <strong>Stripe</strong>, certificado PCI DSS Nível 1. A CertifiqueAI armazena apenas o
        identificador de assinatura Stripe, nunca dados do instrumento de pagamento.
      </p>

      <h2>5. Infraestrutura</h2>
      <p>
        A plataforma opera em infraestrutura gerenciada da <strong>Vercel</strong> (funções serverless) e{' '}
        <strong>Turso</strong> (banco de dados). Ambos implementam controles de acesso por rede, isolamento de dados
        entre clientes e backups automáticos.
      </p>

      <h2>6. Controle de acesso interno</h2>
      <p>
        O acesso a dados de produção é restrito a membros autorizados da equipe com necessidade operacional. O painel
        administrativo da plataforma exige autenticação separada e é auditado automaticamente.
      </p>

      <h2>7. Retenção e exclusão de dados</h2>
      <p>
        Dados de contas excluídas são anonimizados ou deletados em até 30 dias. Logs de acesso são mantidos por 6 meses
        conforme o Marco Civil da Internet. Dados fiscais são mantidos pelo prazo legal de 5 anos.
      </p>

      <h2>8. Resposta a incidentes</h2>
      <p>Em caso de incidente de segurança, seguimos o seguinte protocolo:</p>
      <ol>
        <li>Contenção imediata e avaliação do impacto;</li>
        <li>Comunicação à ANPD dentro de 72 horas quando há risco relevante aos titulares (LGPD art. 48);</li>
        <li>Notificação por e-mail aos usuários potencialmente afetados;</li>
        <li>Relatório pós-incidente com medidas corretivas adotadas.</li>
      </ol>

      <h2>9. Reporte de vulnerabilidades</h2>
      <p>
        Se você identificar uma vulnerabilidade de segurança na plataforma, reporte de forma responsável pelo e-mail{' '}
        <a href="mailto:seguranca@certifiqueai.com">seguranca@certifiqueai.com</a>. Comprometemo-nos a responder em até
        5 dias úteis e a não tomar ações legais contra pesquisadores que reportem vulnerabilidades de boa-fé.
      </p>

      <h2>10. Contato</h2>
      <p>
        Para dúvidas sobre segurança: <a href="mailto:seguranca@certifiqueai.com">seguranca@certifiqueai.com</a>
      </p>
    </LegalPageShell>
  );
}
