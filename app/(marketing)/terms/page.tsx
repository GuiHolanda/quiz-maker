import type { Metadata } from 'next';
import { LegalPageShell } from '@/app/(marketing)/components/LegalPageShell';

export const metadata: Metadata = {
  title: 'Termos de Serviço | CertifiqueAI',
  description: 'Leia os Termos de Serviço da CertifiqueAI antes de usar a plataforma.',
  alternates: { canonical: 'https://www.certifiqueai.com/terms' },
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Termos de Serviço" lastUpdated="5 de agosto de 2026">
      <p>
        Ao criar uma conta ou utilizar qualquer funcionalidade da CertifiqueAI (<strong>certifiqueai.com</strong>),
        você concorda com estes Termos de Serviço. Leia-os com atenção antes de usar a plataforma.
      </p>

      <h2>1. Descrição do serviço</h2>
      <p>
        A CertifiqueAI é uma plataforma de preparação para certificações profissionais e concursos públicos que
        utiliza inteligência artificial para gerar questões de prática personalizadas. O serviço inclui geração de
        questões, simulados, histórico de estudo e, nos planos elegíveis, assistente de estudos por IA.
      </p>

      <h2>2. Elegibilidade</h2>
      <p>
        Para utilizar o serviço, você deve ter pelo menos 18 anos de idade e capacidade legal para celebrar
        contratos. Ao aceitar estes termos, você declara atender a esses requisitos.
      </p>

      <h2>3. Cadastro e segurança da conta</h2>
      <p>
        Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades
        realizadas em sua conta. Notifique-nos imediatamente em caso de uso não autorizado pelo e-mail{' '}
        <a href="mailto:suporte@certifiqueai.com">suporte@certifiqueai.com</a>.
      </p>

      <h2>4. Planos e pagamento</h2>
      <ul>
        <li>
          O plano <strong>Gratuito</strong> é disponibilizado sem custo, com limites de uso conforme descrito na{' '}
          <a href="/pricing">página de Planos</a>.
        </li>
        <li>
          Os planos pagos (<strong>Pro</strong> e <strong>Pro AI</strong>) são cobrados mensalmente ou anualmente via
          Stripe. A cobrança ocorre no dia do início da assinatura e se renova automaticamente.
        </li>
        <li>
          Preços são expressos em Reais (BRL) e podem ser alterados com aviso prévio de 30 dias por e-mail.
        </li>
      </ul>

      <h2>5. Política de cancelamento e reembolso</h2>
      <ul>
        <li>
          <strong>Direito de arrependimento (CDC art. 49):</strong> assinaturas contratadas online podem ser
          canceladas em até 7 dias corridos da data da contratação, com reembolso integral.
        </li>
        <li>
          Cancelamentos após o período de arrependimento encerram a assinatura ao fim do ciclo de cobrança vigente.
          Não há reembolso proporcional pelo período não utilizado, exceto quando exigido por lei.
        </li>
        <li>
          Para solicitar cancelamento ou reembolso, acesse as configurações da conta ou entre em contato pelo e-mail{' '}
          <a href="mailto:suporte@certifiqueai.com">suporte@certifiqueai.com</a>.
        </li>
      </ul>

      <h2>6. Isenção de responsabilidade sobre conteúdo gerado por IA</h2>
      <p>
        As questões, respostas e explicações geradas pela CertifiqueAI são produzidas por modelos de linguagem de
        inteligência artificial e têm <strong>finalidade exclusivamente educacional e de prática de estudos</strong>.
      </p>
      <ul>
        <li>
          A CertifiqueAI <strong>não garante</strong> a precisão, completude ou atualidade do conteúdo gerado.
        </li>
        <li>
          O conteúdo gerado <strong>não substitui</strong> o material oficial de preparação para exames, editais,
          apostilas ou orientação de profissionais habilitados.
        </li>
        <li>
          A CertifiqueAI <strong>não se responsabiliza</strong> por resultados em provas reais, aprovação em
          concursos ou obtenção de certificações com base no uso exclusivo da plataforma.
        </li>
        <li>
          O usuário é o único responsável pelas decisões tomadas com base no conteúdo gerado.
        </li>
      </ul>

      <h2>7. Uso permitido</h2>
      <p>Você pode usar a CertifiqueAI para:</p>
      <ul>
        <li>Estudar e praticar para certificações e concursos de uso pessoal;</li>
        <li>Criar e gerenciar exames de prática em sua conta.</li>
      </ul>
      <p>É expressamente proibido:</p>
      <ul>
        <li>Redistribuir, vender ou licenciar questões geradas pela plataforma para terceiros;</li>
        <li>Utilizar o conteúdo gerado em provas, avaliações ou seleções reais de forma fraudulenta;</li>
        <li>Fazer engenharia reversa, extrair dados em massa (scraping) ou sobrecarregar os servidores;</li>
        <li>Compartilhar credenciais de acesso com terceiros;</li>
        <li>Usar a plataforma para finalidades ilegais ou que violem direitos de terceiros.</li>
      </ul>

      <h2>8. Propriedade intelectual</h2>
      <p>
        A marca CertifiqueAI, o código da plataforma, o design e a metodologia de geração de questões são de
        propriedade exclusiva da CertifiqueAI. O conteúdo gerado pela IA com base nas suas configurações pode ser
        usado por você para fins pessoais de estudo, não sendo transferida nenhuma titularidade de propriedade
        intelectual sobre os prompts ou outputs da IA.
      </p>

      <h2>9. Suspensão e encerramento de conta</h2>
      <p>
        Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, com notificação prévia
        sempre que possível. Em casos de uso fraudulento ou abusivo, a suspensão pode ser imediata. Você pode
        encerrar sua conta a qualquer momento nas configurações da plataforma.
      </p>

      <h2>10. Limitação de responsabilidade</h2>
      <p>
        Na extensão máxima permitida pela legislação aplicável, a CertifiqueAI não será responsável por danos
        indiretos, incidentais, especiais ou consequentes decorrentes do uso ou da impossibilidade de uso do serviço.
        Nossa responsabilidade total perante você não excederá o valor pago nos últimos 3 meses de assinatura.
      </p>

      <h2>11. Lei aplicável e foro</h2>
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de São
        Paulo/SP para dirimir eventuais controvérsias, ressalvada a possibilidade de utilização dos Juizados
        Especiais Cíveis pelo consumidor.
      </p>

      <h2>12. Alterações nos termos</h2>
      <p>
        Podemos atualizar estes Termos periodicamente. Alterações relevantes serão comunicadas por e-mail com pelo
        menos 30 dias de antecedência. O uso continuado da plataforma após a data de vigência das alterações implica
        aceitação dos novos termos.
      </p>

      <h2>13. Contato</h2>
      <p>
        Dúvidas sobre estes termos:{' '}
        <a href="mailto:suporte@certifiqueai.com">suporte@certifiqueai.com</a>
      </p>
    </LegalPageShell>
  );
}
