-- Migration: seed_demo_question_pool
-- Provisions the interactive demo (/demo) in production.
--
-- Why this is needed: the catalog templates were inserted by 20260812120000_add_catalog_exams
-- as raw SQL, which bypasses promoteExam() — the only code path that creates QuestionPool
-- rows. And the demo question content has only ever existed as a dev script
-- (prisma/dev/scripts/seed-demo-pool.ts). So production had templates but no pools and no
-- pooled questions, and DemoCatalogService drops any exam with fewer than DEMO_SLICE_MIN
-- (10) eligible questions — leaving the demo empty for every exam.
--
-- Inserts 170 questions across 17 exams, with options, gabarito and
-- per-option explanations. DemoCatalogService.isDemoEligible requires all three.
--
-- userId is deliberately left NULL on every question. That is what marks a row as catalog
-- content: DemoCatalogService reads the pool with `where: { userId: null }` so the public
-- demo can never serve a subscriber's private questions. A seeded row with a userId would
-- be invisible to the demo and the exercise would be pointless.
--
-- "Certified CloudOps Engineer - Associate" is in the demo pool data but has no template in
-- production, so it is not included here.
--
-- Idempotent: pools are looked up before insert, and each question is guarded by
-- (poolId, text) — the same key the dev seed script dedupes on. Exams whose template is
-- missing are skipped rather than failing the migration.

DO $$
DECLARE
  v_exam_id     TEXT;
  v_section_id  TEXT;
  v_provider_id TEXT;
  v_board_id    TEXT;
  v_type        TEXT;
  v_pool_id     TEXT;
  v_question_id INTEGER;
  v_answer_id   INTEGER;
BEGIN
  -- ── AWS Certified Solutions Architect – Associate ─────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'AWS Certified Solutions Architect – Associate' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Design Resilient Architectures' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Design Resilient Architectures' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Design Resilient Architectures', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma aplicação web usa um banco Amazon RDS for MySQL em uma única zona de disponibilidade. O time precisa de failover automático em caso de falha da AZ, sem alterar o código da aplicação. Qual abordagem atende ao requisito?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma aplicação web usa um banco Amazon RDS for MySQL em uma única zona de disponibilidade. O time precisa de failover automático em caso de falha da AZ, sem alterar o código da aplicação. Qual abordagem atende ao requisito?', 1, 'easy', 'mc_4', 'AWS Certified Solutions Architect – Associate', 'Design Resilient Architectures', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Habilitar a implantação Multi-AZ do RDS, que mantém uma réplica standby síncrona em outra AZ'),
        (v_question_id, 'B', 'Criar uma read replica em outra AZ e promovê-la manualmente quando houver falha'),
        (v_question_id, 'C', 'Habilitar snapshots automáticos diários e restaurar o snapshot em caso de falha'),
        (v_question_id, 'D', 'Colocar o banco atrás de um Application Load Balancer com health checks');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Multi-AZ mantém uma standby síncrona em outra AZ e faz failover automático, mantendo o mesmo endpoint DNS — a aplicação não precisa mudar.', NOW()),
        (v_answer_id, 'B', 'Read replicas são assíncronas e a promoção é manual, o que não atende ao requisito de failover automático.', NOW()),
        (v_answer_id, 'C', 'Restaurar snapshot é um processo manual e demorado, com perda de dados desde o último snapshot.', NOW()),
        (v_answer_id, 'D', 'ALB balanceia tráfego HTTP para camadas de aplicação; não faz failover de instâncias de banco de dados.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Um sistema de processamento de pedidos perde mensagens quando o serviço consumidor fica indisponível. Qual serviço deve ser introduzido para desacoplar produtor e consumidor, garantindo que as mensagens persistam até serem processadas?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Um sistema de processamento de pedidos perde mensagens quando o serviço consumidor fica indisponível. Qual serviço deve ser introduzido para desacoplar produtor e consumidor, garantindo que as mensagens persistam até serem processadas?', 1, 'easy', 'mc_4', 'AWS Certified Solutions Architect – Associate', 'Design Resilient Architectures', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Amazon SQS'),
        (v_question_id, 'B', 'Amazon SNS com entrega direta por HTTP'),
        (v_question_id, 'C', 'AWS Step Functions'),
        (v_question_id, 'D', 'Amazon Kinesis Data Firehose');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O SQS armazena mensagens de forma durável até que um consumidor as processe e delete, absorvendo a indisponibilidade do consumidor.', NOW()),
        (v_answer_id, 'B', 'SNS é pub/sub com entrega push; se o endpoint HTTP estiver indisponível, a entrega pode falhar sem retenção equivalente a uma fila.', NOW()),
        (v_answer_id, 'C', 'Step Functions orquestra fluxos de trabalho, mas não é um buffer de mensagens entre produtor e consumidor.', NOW()),
        (v_answer_id, 'D', 'Firehose entrega streams para destinos de armazenamento e análise, não serve como fila de trabalho.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma empresa quer que o tráfego seja redirecionado automaticamente para uma região secundária caso a região primária fique indisponível. Quais recursos do Amazon Route 53 devem ser combinados? (Escolha DUAS)') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma empresa quer que o tráfego seja redirecionado automaticamente para uma região secundária caso a região primária fique indisponível. Quais recursos do Amazon Route 53 devem ser combinados? (Escolha DUAS)', 2, 'medium', 'mc_5', 'AWS Certified Solutions Architect – Associate', 'Design Resilient Architectures', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Health checks associados aos registros DNS'),
        (v_question_id, 'B', 'Política de roteamento de failover'),
        (v_question_id, 'C', 'Política de roteamento por geolocalização'),
        (v_question_id, 'D', 'Zona hospedada privada'),
        (v_question_id, 'E', 'Registro CNAME apontando para o endpoint secundário');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A","B"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Health checks detectam a indisponibilidade do endpoint primário e disparam a mudança de resposta DNS.', NOW()),
        (v_answer_id, 'B', 'Correto. A política de failover define explicitamente registros primário e secundário, respondendo com o secundário quando o health check falha.', NOW()),
        (v_answer_id, 'C', 'Geolocalização roteia com base na origem do usuário, não em disponibilidade do endpoint.', NOW()),
        (v_answer_id, 'D', 'Zona hospedada privada resolve nomes dentro de VPCs; não trata de failover entre regiões.', NOW()),
        (v_answer_id, 'E', 'Um CNAME estático sempre resolve para o mesmo destino, sem reagir à indisponibilidade da região primária.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Design High-Performing Architectures' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Design High-Performing Architectures' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Design High-Performing Architectures', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma aplicação de leitura intensiva consulta repetidamente os mesmos registros no Amazon RDS, gerando latência alta e carga elevada no banco. Qual solução reduz a latência de leitura com menor esforço de reescrita?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma aplicação de leitura intensiva consulta repetidamente os mesmos registros no Amazon RDS, gerando latência alta e carga elevada no banco. Qual solução reduz a latência de leitura com menor esforço de reescrita?', 1, 'medium', 'mc_4', 'AWS Certified Solutions Architect – Associate', 'Design High-Performing Architectures', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Adicionar o Amazon ElastiCache como cache de resultados frequentemente consultados'),
        (v_question_id, 'B', 'Migrar o banco para uma instância com mais vCPUs'),
        (v_question_id, 'C', 'Habilitar backups automáticos com retenção estendida'),
        (v_question_id, 'D', 'Mover as tabelas para o Amazon S3 e consultar com Athena');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O ElastiCache serve leituras repetidas da memória em latência de sub-milissegundos e alivia a carga do banco.', NOW()),
        (v_answer_id, 'B', 'Aumentar a instância trata o sintoma com custo permanente maior e não elimina consultas repetidas.', NOW()),
        (v_answer_id, 'C', 'Backups protegem dados; não têm efeito sobre latência de leitura.', NOW()),
        (v_answer_id, 'D', 'S3 com Athena serve análise sob demanda, não consultas transacionais de baixa latência.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Usuários em várias regiões relatam lentidão ao baixar imagens e vídeos hospedados em um bucket S3 em us-east-1. Qual solução melhora o desempenho de entrega globalmente?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Usuários em várias regiões relatam lentidão ao baixar imagens e vídeos hospedados em um bucket S3 em us-east-1. Qual solução melhora o desempenho de entrega globalmente?', 1, 'easy', 'mc_4', 'AWS Certified Solutions Architect – Associate', 'Design High-Performing Architectures', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Distribuir o conteúdo via Amazon CloudFront, com o bucket S3 como origem'),
        (v_question_id, 'B', 'Habilitar versionamento no bucket S3'),
        (v_question_id, 'C', 'Alterar a classe de armazenamento para S3 Glacier Instant Retrieval'),
        (v_question_id, 'D', 'Criar um Application Load Balancer na frente do bucket');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O CloudFront armazena o conteúdo em edge locations próximas dos usuários, reduzindo latência e uso de banda da origem.', NOW()),
        (v_answer_id, 'B', 'Versionamento protege contra sobrescrita e exclusão acidental; não afeta desempenho de entrega.', NOW()),
        (v_answer_id, 'C', 'Glacier Instant Retrieval reduz custo de dados raramente acessados, não melhora a latência global.', NOW()),
        (v_answer_id, 'D', 'ALB distribui tráfego entre targets de computação; não é usado como front-end de um bucket S3.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Design Secure Architectures' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Design Secure Architectures' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Design Secure Architectures', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma aplicação em instâncias EC2 precisa ler objetos de um bucket S3. Qual é a forma recomendada de conceder esse acesso?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma aplicação em instâncias EC2 precisa ler objetos de um bucket S3. Qual é a forma recomendada de conceder esse acesso?', 1, 'easy', 'mc_4', 'AWS Certified Solutions Architect – Associate', 'Design Secure Architectures', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Anexar uma IAM role à instância EC2 com permissão de leitura no bucket'),
        (v_question_id, 'B', 'Armazenar access key e secret key em um arquivo de configuração na instância'),
        (v_question_id, 'C', 'Tornar o bucket público e restringir por endereço IP'),
        (v_question_id, 'D', 'Definir as credenciais do usuário root como variáveis de ambiente');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. IAM roles fornecem credenciais temporárias rotacionadas automaticamente, sem segredos persistidos na instância.', NOW()),
        (v_answer_id, 'B', 'Chaves de longa duração em disco podem vazar e exigem rotação manual — prática desaconselhada.', NOW()),
        (v_answer_id, 'C', 'Tornar o bucket público expõe os dados amplamente; restrição por IP é frágil e não substitui autenticação.', NOW()),
        (v_answer_id, 'D', 'Credenciais root nunca devem ser usadas por aplicações; violam o princípio do menor privilégio.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual afirmação distingue corretamente security groups de network ACLs em uma VPC?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual afirmação distingue corretamente security groups de network ACLs em uma VPC?', 1, 'medium', 'mc_4', 'AWS Certified Solutions Architect – Associate', 'Design Secure Architectures', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Security groups são stateful e atuam na instância; network ACLs são stateless e atuam na sub-rede'),
        (v_question_id, 'B', 'Security groups são stateless e atuam na sub-rede; network ACLs são stateful e atuam na instância'),
        (v_question_id, 'C', 'Ambos são stateful, diferindo apenas na ordem de avaliação das regras'),
        (v_question_id, 'D', 'Security groups suportam regras de negação explícita; network ACLs não suportam');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Security groups avaliam estado de conexão e se aplicam a ENIs; NACLs avaliam pacotes individualmente na fronteira da sub-rede.', NOW()),
        (v_answer_id, 'B', 'Inverte as características: é o security group que é stateful e ligado à instância.', NOW()),
        (v_answer_id, 'C', 'NACLs são stateless — o tráfego de retorno precisa ser permitido explicitamente.', NOW()),
        (v_answer_id, 'D', 'É o oposto: NACLs suportam regras de deny; security groups só permitem (allow).', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma empresa precisa garantir que todos os objetos gravados em um bucket S3 sejam criptografados em repouso com chaves gerenciadas pelo cliente, com trilha de auditoria do uso das chaves. Qual configuração atende?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma empresa precisa garantir que todos os objetos gravados em um bucket S3 sejam criptografados em repouso com chaves gerenciadas pelo cliente, com trilha de auditoria do uso das chaves. Qual configuração atende?', 1, 'medium', 'mc_4', 'AWS Certified Solutions Architect – Associate', 'Design Secure Architectures', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Criptografia padrão do bucket com SSE-KMS usando uma customer managed key'),
        (v_question_id, 'B', 'Criptografia padrão do bucket com SSE-S3'),
        (v_question_id, 'C', 'Criptografia do lado do cliente sem configuração adicional no bucket'),
        (v_question_id, 'D', 'Habilitar apenas o bloqueio de acesso público no bucket');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. SSE-KMS com CMK dá controle sobre a política e rotação da chave, e registra cada uso no AWS CloudTrail.', NOW()),
        (v_answer_id, 'B', 'SSE-S3 usa chaves gerenciadas pela AWS, sem controle do cliente nem trilha por chave.', NOW()),
        (v_answer_id, 'C', 'Criptografia no cliente é possível, mas não garante por si só que todo objeto gravado esteja criptografado.', NOW()),
        (v_answer_id, 'D', 'Bloqueio de acesso público controla exposição, não criptografia em repouso.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Design Cost-Optimized Architectures' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Design Cost-Optimized Architectures' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Design Cost-Optimized Architectures', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Logs precisam ficar acessíveis com baixa latência por 30 dias, depois raramente acessados por 1 ano e, então, excluídos. Qual abordagem minimiza custo com menor esforço operacional?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Logs precisam ficar acessíveis com baixa latência por 30 dias, depois raramente acessados por 1 ano e, então, excluídos. Qual abordagem minimiza custo com menor esforço operacional?', 1, 'medium', 'mc_4', 'AWS Certified Solutions Architect – Associate', 'Design Cost-Optimized Architectures', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Uma regra de ciclo de vida do S3 que faz transição para S3 Glacier Flexible Retrieval após 30 dias e expira após 1 ano'),
        (v_question_id, 'B', 'Copiar manualmente os objetos entre classes de armazenamento por meio de um script mensal'),
        (v_question_id, 'C', 'Manter todos os logs em S3 Standard e excluí-los manualmente ao fim do período'),
        (v_question_id, 'D', 'Armazenar os logs em volumes EBS anexados a uma instância dedicada');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Regras de ciclo de vida automatizam transição e expiração, sem código nem intervenção manual.', NOW()),
        (v_answer_id, 'B', 'Scripts manuais adicionam esforço operacional e risco de falha exatamente onde há automação nativa.', NOW()),
        (v_answer_id, 'C', 'Manter tudo em Standard por 13 meses é a opção mais cara para dados raramente acessados.', NOW()),
        (v_answer_id, 'D', 'EBS custa significativamente mais por GB que S3 e não é adequado para arquivamento de logs.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Um workload de processamento em lote é tolerante a interrupções, pode ser reiniciado a qualquer momento e roda fora do horário comercial. Qual modelo de compra oferece o menor custo?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Um workload de processamento em lote é tolerante a interrupções, pode ser reiniciado a qualquer momento e roda fora do horário comercial. Qual modelo de compra oferece o menor custo?', 1, 'easy', 'mc_4', 'AWS Certified Solutions Architect – Associate', 'Design Cost-Optimized Architectures', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Spot Instances'),
        (v_question_id, 'B', 'On-Demand Instances'),
        (v_question_id, 'C', 'Reserved Instances de 3 anos com pagamento antecipado total'),
        (v_question_id, 'D', 'Dedicated Hosts');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Spot oferece o maior desconto sobre On-Demand e é indicado justamente para cargas tolerantes a interrupção.', NOW()),
        (v_answer_id, 'B', 'On-Demand não tem compromisso, mas é o preço cheio — mais caro que Spot para esse perfil.', NOW()),
        (v_answer_id, 'C', 'Reserved exige compromisso de longo prazo e faz sentido para carga estável e contínua, não intermitente.', NOW()),
        (v_answer_id, 'D', 'Dedicated Hosts atendem requisitos de licenciamento e isolamento físico, com custo mais alto.', NOW());
    END IF;

  END IF;

  -- ── AWS Certified Developer – Associate ───────────────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'AWS Certified Developer – Associate' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Development with AWS Services' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Development with AWS Services' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Development with AWS Services', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma função AWS Lambda precisa processar itens de uma tabela DynamoDB sempre que houver inserção ou atualização. Qual integração atende ao requisito?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma função AWS Lambda precisa processar itens de uma tabela DynamoDB sempre que houver inserção ou atualização. Qual integração atende ao requisito?', 1, 'easy', 'mc_4', 'AWS Certified Developer – Associate', 'Development with AWS Services', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Habilitar DynamoDB Streams na tabela e configurá-lo como fonte de eventos da função'),
        (v_question_id, 'B', 'Criar uma regra do EventBridge que consulte a tabela a cada minuto'),
        (v_question_id, 'C', 'Fazer a aplicação chamar a função Lambda após cada gravação'),
        (v_question_id, 'D', 'Habilitar point-in-time recovery na tabela');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. DynamoDB Streams publica as alterações em ordem e o Lambda pode consumi-las como event source mapping.', NOW()),
        (v_answer_id, 'B', 'Consultas periódicas geram latência e custo desnecessários, além de poderem perder alterações intermediárias.', NOW()),
        (v_answer_id, 'C', 'Acoplaria a aplicação à função e falharia para gravações feitas por outros clientes.', NOW()),
        (v_answer_id, 'D', 'PITR é recurso de backup contínuo; não emite eventos de alteração.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Ao gravar um item no DynamoDB, o desenvolvedor precisa garantir que a operação só ocorra se o item ainda não existir. Qual recurso deve ser usado?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Ao gravar um item no DynamoDB, o desenvolvedor precisa garantir que a operação só ocorra se o item ainda não existir. Qual recurso deve ser usado?', 1, 'medium', 'mc_4', 'AWS Certified Developer – Associate', 'Development with AWS Services', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Uma condition expression com attribute_not_exists na chave de partição'),
        (v_question_id, 'B', 'Uma leitura fortemente consistente antes do PutItem'),
        (v_question_id, 'C', 'Habilitar transações com TransactWriteItems sem condições'),
        (v_question_id, 'D', 'Configurar TTL no atributo de chave');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A condition expression é avaliada atomicamente pelo serviço, evitando condição de corrida entre leitura e escrita.', NOW()),
        (v_answer_id, 'B', 'Ler antes de escrever não é atômico: outro cliente pode gravar entre as duas operações.', NOW()),
        (v_answer_id, 'C', 'Transações agrupam operações, mas sem condição não impedem a sobrescrita de um item existente.', NOW()),
        (v_answer_id, 'D', 'TTL agenda expiração automática de itens; não controla a condição de gravação.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual serviço é mais adequado para armazenar segredos de banco de dados com rotação automática gerenciada?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual serviço é mais adequado para armazenar segredos de banco de dados com rotação automática gerenciada?', 1, 'easy', 'mc_4', 'AWS Certified Developer – Associate', 'Development with AWS Services', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'AWS Secrets Manager'),
        (v_question_id, 'B', 'AWS Systems Manager Parameter Store no tier Standard'),
        (v_question_id, 'C', 'Variáveis de ambiente da função Lambda'),
        (v_question_id, 'D', 'Um objeto criptografado no Amazon S3');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Secrets Manager oferece rotação automática nativa integrada a bancos de dados suportados.', NOW()),
        (v_answer_id, 'B', 'O Parameter Store armazena parâmetros com segurança, mas não fornece rotação automática gerenciada.', NOW()),
        (v_answer_id, 'C', 'Variáveis de ambiente ficam visíveis na configuração da função e não têm rotação.', NOW()),
        (v_answer_id, 'D', 'Um objeto no S3 exigiria implementar rotação, versionamento e controle de acesso manualmente.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Deployment' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Deployment' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Deployment', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Um time quer publicar uma nova versão de função Lambda direcionando inicialmente 10% do tráfego para ela, aumentando gradualmente. Qual recurso permite isso nativamente?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Um time quer publicar uma nova versão de função Lambda direcionando inicialmente 10% do tráfego para ela, aumentando gradualmente. Qual recurso permite isso nativamente?', 1, 'medium', 'mc_4', 'AWS Certified Developer – Associate', 'Deployment', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Alias da função com weighted routing entre duas versões'),
        (v_question_id, 'B', 'Publicar a nova versão sobrescrevendo $LATEST'),
        (v_question_id, 'C', 'Criar uma segunda função e alternar via Route 53'),
        (v_question_id, 'D', 'Aumentar a memória alocada da função gradualmente');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Aliases suportam distribuição ponderada de tráfego entre duas versões, viabilizando canary e linear deployments.', NOW()),
        (v_answer_id, 'B', 'Sobrescrever $LATEST envia 100% do tráfego à nova versão de uma vez, sem controle gradual.', NOW()),
        (v_answer_id, 'C', 'Funciona para endpoints HTTP, mas é complexo e desnecessário diante do recurso nativo de alias.', NOW()),
        (v_answer_id, 'D', 'Memória afeta desempenho e custo, não a divisão de tráfego entre versões.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Em um template do AWS SAM, qual seção define os recursos serverless que serão provisionados?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Em um template do AWS SAM, qual seção define os recursos serverless que serão provisionados?', 1, 'easy', 'mc_4', 'AWS Certified Developer – Associate', 'Deployment', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Resources'),
        (v_question_id, 'B', 'Parameters'),
        (v_question_id, 'C', 'Outputs'),
        (v_question_id, 'D', 'Mappings');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A seção Resources declara funções, APIs, tabelas e demais recursos a serem criados.', NOW()),
        (v_answer_id, 'B', 'Parameters define valores de entrada do template, não os recursos em si.', NOW()),
        (v_answer_id, 'C', 'Outputs expõe valores após a criação da stack, como ARNs e endpoints.', NOW()),
        (v_answer_id, 'D', 'Mappings define pares chave-valor estáticos para lookup, geralmente por região.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Security' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Security' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Security', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma API REST no Amazon API Gateway precisa autenticar usuários de um user pool do Amazon Cognito. Qual configuração é a mais direta?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma API REST no Amazon API Gateway precisa autenticar usuários de um user pool do Amazon Cognito. Qual configuração é a mais direta?', 1, 'medium', 'mc_4', 'AWS Certified Developer – Associate', 'Security', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Configurar um Cognito user pool authorizer no método da API'),
        (v_question_id, 'B', 'Validar o token JWT dentro do código de cada função Lambda'),
        (v_question_id, 'C', 'Habilitar API keys e distribuí-las aos usuários finais'),
        (v_question_id, 'D', 'Restringir a API por resource policy baseada em IP');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O authorizer do Cognito valida o token no API Gateway antes de invocar o backend, sem código adicional.', NOW()),
        (v_answer_id, 'B', 'Funciona, mas duplica lógica de validação em cada função e permite invocações desnecessárias.', NOW()),
        (v_answer_id, 'C', 'API keys servem para identificar aplicações e aplicar throttling, não para autenticar usuários.', NOW()),
        (v_answer_id, 'D', 'Restrição por IP não identifica usuários e é inviável para clientes móveis ou residenciais.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual prática deve ser adotada para uma aplicação em ECS acessar um bucket S3 com o menor privilégio possível?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual prática deve ser adotada para uma aplicação em ECS acessar um bucket S3 com o menor privilégio possível?', 1, 'easy', 'mc_4', 'AWS Certified Developer – Associate', 'Security', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Atribuir uma IAM task role com permissão apenas nas ações e no bucket necessários'),
        (v_question_id, 'B', 'Usar a instance role do host EC2 com política AmazonS3FullAccess'),
        (v_question_id, 'C', 'Injetar chaves de acesso de um usuário IAM como variáveis de ambiente da task'),
        (v_question_id, 'D', 'Conceder permissão s3:* na conta inteira e restringir por tags');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A task role limita o escopo à própria task e permite restringir ações e recursos específicos.', NOW()),
        (v_answer_id, 'B', 'A instance role vale para todas as tasks do host e FullAccess viola o menor privilégio.', NOW()),
        (v_answer_id, 'C', 'Chaves estáticas em variáveis de ambiente vazam com facilidade e não rotacionam.', NOW()),
        (v_answer_id, 'D', 'Conceder s3:* amplamente é o oposto do menor privilégio, mesmo com condições por tag.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Troubleshooting and Optimization' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Troubleshooting and Optimization' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Troubleshooting and Optimization', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma função Lambda encerra com timeout ao chamar um serviço externo lento. Qual ação investiga a causa com maior granularidade por chamada?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma função Lambda encerra com timeout ao chamar um serviço externo lento. Qual ação investiga a causa com maior granularidade por chamada?', 1, 'medium', 'mc_4', 'AWS Certified Developer – Associate', 'Troubleshooting and Optimization', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Habilitar o AWS X-Ray para rastrear os segmentos da invocação'),
        (v_question_id, 'B', 'Aumentar o timeout da função para o máximo permitido'),
        (v_question_id, 'C', 'Reduzir a memória alocada para forçar reciclagem do ambiente'),
        (v_question_id, 'D', 'Migrar a função para uma VPC privada');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O X-Ray decompõe a invocação em segmentos e subsegmentos, mostrando onde o tempo é consumido.', NOW()),
        (v_answer_id, 'B', 'Elevar o timeout mascara o problema e aumenta o custo sem revelar a causa.', NOW()),
        (v_answer_id, 'C', 'Menos memória tende a piorar o desempenho, pois a CPU é proporcional à memória alocada.', NOW()),
        (v_answer_id, 'D', 'Colocar a função em VPC adiciona complexidade de rede e não diagnostica a lentidão externa.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma aplicação recebe erro ProvisionedThroughputExceededException ao ler uma tabela DynamoDB. Quais medidas ajudam a mitigar o problema? (Escolha DUAS)') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma aplicação recebe erro ProvisionedThroughputExceededException ao ler uma tabela DynamoDB. Quais medidas ajudam a mitigar o problema? (Escolha DUAS)', 2, 'hard', 'mc_5', 'AWS Certified Developer – Associate', 'Troubleshooting and Optimization', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Implementar retentativa com exponential backoff e jitter'),
        (v_question_id, 'B', 'Adotar o modo de capacidade on-demand da tabela'),
        (v_question_id, 'C', 'Aumentar o tamanho da página de cada Scan para ler mais itens por chamada'),
        (v_question_id, 'D', 'Substituir as consultas por Scan em vez de Query'),
        (v_question_id, 'E', 'Remover os índices secundários globais da tabela');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A","B"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Backoff exponencial com jitter distribui as retentativas e evita amplificar o throttling.', NOW()),
        (v_answer_id, 'B', 'Correto. O modo on-demand escala automaticamente conforme a demanda, eliminando o limite provisionado fixo.', NOW()),
        (v_answer_id, 'C', 'Páginas maiores consomem mais capacidade por chamada, agravando o throttling.', NOW()),
        (v_answer_id, 'D', 'Scan lê a tabela inteira e consome muito mais capacidade que Query, piorando a situação.', NOW()),
        (v_answer_id, 'E', 'Remover GSIs não alivia o throttling de leitura da tabela base e ainda quebra os padrões de consulta existentes.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual variável de ambiente do runtime Lambda permite reaproveitar conexões de cliente entre invocações no mesmo ambiente de execução?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual variável de ambiente do runtime Lambda permite reaproveitar conexões de cliente entre invocações no mesmo ambiente de execução?', 1, 'hard', 'mc_4', 'AWS Certified Developer – Associate', 'Troubleshooting and Optimization', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Inicializar o cliente fora do handler, aproveitando o escopo global do módulo'),
        (v_question_id, 'B', 'Declarar o cliente dentro do handler a cada invocação'),
        (v_question_id, 'C', 'Definir a memória da função para o valor máximo'),
        (v_question_id, 'D', 'Habilitar o modo de concorrência reservada');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Código fora do handler roda uma vez por ambiente de execução e é reaproveitado nas invocações seguintes (warm start).', NOW()),
        (v_answer_id, 'B', 'Criar o cliente por invocação repete handshake e resolução DNS, aumentando a latência.', NOW()),
        (v_answer_id, 'C', 'Mais memória acelera a execução, mas não afeta o reaproveitamento de conexões.', NOW()),
        (v_answer_id, 'D', 'Concorrência reservada limita execuções simultâneas; não influencia reuso de conexões.', NOW());
    END IF;

  END IF;

  -- ── Microsoft Azure Administrator ─────────────────────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'Microsoft Azure Administrator' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Manage Azure Identities and Governance' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Manage Azure Identities and Governance' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Manage Azure Identities and Governance', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual recurso do Microsoft Entra ID exige uma segunda forma de verificação no login, reduzindo o risco de credenciais comprometidas?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual recurso do Microsoft Entra ID exige uma segunda forma de verificação no login, reduzindo o risco de credenciais comprometidas?', 1, 'easy', 'mc_4', 'Microsoft Azure Administrator', 'Manage Azure Identities and Governance', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Multi-factor authentication (MFA)'),
        (v_question_id, 'B', 'Conditional Access report-only mode'),
        (v_question_id, 'C', 'Self-service password reset'),
        (v_question_id, 'D', 'Administrative units');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O MFA exige um segundo fator além da senha, mitigando o uso de credenciais roubadas.', NOW()),
        (v_answer_id, 'B', 'O modo report-only avalia políticas sem aplicá-las, servindo para testes.', NOW()),
        (v_answer_id, 'C', 'O SSPR permite ao usuário redefinir a própria senha; não adiciona fator no login.', NOW()),
        (v_answer_id, 'D', 'Administrative units delimitam escopo administrativo, sem relação com autenticação.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma empresa precisa impedir a criação de recursos fora das regiões Brazil South e East US em uma subscription. Qual mecanismo aplica essa restrição?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma empresa precisa impedir a criação de recursos fora das regiões Brazil South e East US em uma subscription. Qual mecanismo aplica essa restrição?', 1, 'medium', 'mc_4', 'Microsoft Azure Administrator', 'Manage Azure Identities and Governance', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Azure Policy com efeito Deny sobre localizações permitidas'),
        (v_question_id, 'B', 'Um resource lock do tipo ReadOnly na subscription'),
        (v_question_id, 'C', 'Uma atribuição de RBAC com a role Reader'),
        (v_question_id, 'D', 'Uma tag obrigatória de região aplicada aos grupos de recursos');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Azure Policy avalia a criação e bloqueia recursos em regiões fora da lista permitida.', NOW()),
        (v_answer_id, 'B', 'Um lock ReadOnly bloquearia toda alteração, inclusive nas regiões permitidas.', NOW()),
        (v_answer_id, 'C', 'RBAC controla quem pode agir, não em qual região o recurso pode ser criado.', NOW()),
        (v_answer_id, 'D', 'Tags são metadados e não impedem a criação em regiões indesejadas.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Implement and Manage Storage' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Implement and Manage Storage' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Implement and Manage Storage', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual camada de acesso do Azure Blob Storage oferece o menor custo de armazenamento para dados raramente acessados, aceitando maior custo de recuperação e latência de horas?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual camada de acesso do Azure Blob Storage oferece o menor custo de armazenamento para dados raramente acessados, aceitando maior custo de recuperação e latência de horas?', 1, 'medium', 'mc_4', 'Microsoft Azure Administrator', 'Implement and Manage Storage', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Archive'),
        (v_question_id, 'B', 'Cool'),
        (v_question_id, 'C', 'Hot'),
        (v_question_id, 'D', 'Premium');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A camada Archive tem o menor custo por GB e exige reidratação, que pode levar horas.', NOW()),
        (v_answer_id, 'B', 'A camada Cool serve dados acessados com pouca frequência, mas com acesso imediato.', NOW()),
        (v_answer_id, 'C', 'A camada Hot é otimizada para acesso frequente e tem o maior custo de armazenamento entre as padrão.', NOW()),
        (v_answer_id, 'D', 'Premium usa SSD para baixa latência e alto IOPS, com o maior custo por GB.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual opção de redundância replica os dados de uma conta de armazenamento em uma região secundária, protegendo contra a indisponibilidade regional?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual opção de redundância replica os dados de uma conta de armazenamento em uma região secundária, protegendo contra a indisponibilidade regional?', 1, 'easy', 'mc_4', 'Microsoft Azure Administrator', 'Implement and Manage Storage', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Geo-redundant storage (GRS)'),
        (v_question_id, 'B', 'Locally redundant storage (LRS)'),
        (v_question_id, 'C', 'Zone-redundant storage (ZRS)'),
        (v_question_id, 'D', 'Premium file shares');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O GRS replica de forma assíncrona para uma região secundária a centenas de quilômetros.', NOW()),
        (v_answer_id, 'B', 'O LRS mantém três cópias dentro de um único datacenter, sem proteção regional.', NOW()),
        (v_answer_id, 'C', 'O ZRS distribui cópias entre zonas da mesma região, protegendo contra falha de zona, não de região.', NOW()),
        (v_answer_id, 'D', 'Premium file shares é um tipo de armazenamento, não uma opção de redundância geográfica.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Implement and Manage Virtual Networking' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Implement and Manage Virtual Networking' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Implement and Manage Virtual Networking', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Duas virtual networks em regiões diferentes precisam se comunicar por IP privado com baixa latência e sem gateway VPN. Qual recurso atende?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Duas virtual networks em regiões diferentes precisam se comunicar por IP privado com baixa latência e sem gateway VPN. Qual recurso atende?', 1, 'medium', 'mc_4', 'Microsoft Azure Administrator', 'Implement and Manage Virtual Networking', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Global VNet peering'),
        (v_question_id, 'B', 'Um Azure Application Gateway compartilhado'),
        (v_question_id, 'C', 'Um Network Security Group permitindo o tráfego'),
        (v_question_id, 'D', 'Uma rota definida pelo usuário apontando para a internet');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O global VNet peering conecta VNets de regiões distintas pela backbone da Microsoft, usando IPs privados.', NOW()),
        (v_answer_id, 'B', 'O Application Gateway é um balanceador de camada 7, não um mecanismo de conectividade entre VNets.', NOW()),
        (v_answer_id, 'C', 'NSGs filtram tráfego, mas não estabelecem conectividade entre redes.', NOW()),
        (v_answer_id, 'D', 'Rotear para a internet não fornece comunicação por IP privado.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Em qual ordem o Azure avalia as regras de um Network Security Group?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Em qual ordem o Azure avalia as regras de um Network Security Group?', 1, 'medium', 'mc_4', 'Microsoft Azure Administrator', 'Implement and Manage Virtual Networking', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Por prioridade crescente, aplicando a primeira regra correspondente e interrompendo a avaliação'),
        (v_question_id, 'B', 'Por prioridade decrescente, aplicando a última regra correspondente'),
        (v_question_id, 'C', 'Todas as regras são avaliadas e a mais permissiva prevalece'),
        (v_question_id, 'D', 'Regras de negação sempre são avaliadas antes das de permissão');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. As regras são processadas do menor para o maior número de prioridade e a primeira correspondência decide o resultado.', NOW()),
        (v_answer_id, 'B', 'A avaliação não é decrescente nem considera a última correspondência.', NOW()),
        (v_answer_id, 'C', 'A avaliação para na primeira correspondência; não há comparação de permissividade.', NOW()),
        (v_answer_id, 'D', 'A ordem depende exclusivamente do número de prioridade, não do tipo da regra.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Deploy and Manage Azure Compute Resources' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Deploy and Manage Azure Compute Resources' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Deploy and Manage Azure Compute Resources', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual recurso garante que as VMs de um conjunto sejam distribuídas entre domínios de falha e de atualização dentro de um datacenter?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual recurso garante que as VMs de um conjunto sejam distribuídas entre domínios de falha e de atualização dentro de um datacenter?', 1, 'medium', 'mc_4', 'Microsoft Azure Administrator', 'Deploy and Manage Azure Compute Resources', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Availability set'),
        (v_question_id, 'B', 'Availability zone'),
        (v_question_id, 'C', 'Scale set com uma única instância'),
        (v_question_id, 'D', 'Proximity placement group');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O availability set distribui as VMs entre fault domains e update domains, reduzindo impacto de falha ou manutenção.', NOW()),
        (v_answer_id, 'B', 'Availability zones distribuem entre datacenters distintos da região, não entre domínios internos.', NOW()),
        (v_answer_id, 'C', 'Um scale set com uma instância não oferece distribuição alguma.', NOW()),
        (v_answer_id, 'D', 'Proximity placement groups aproximam recursos para reduzir latência, o que é o objetivo oposto.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual serviço permite executar contêineres sem gerenciar a infraestrutura de nós subjacente, adequado para cargas de curta duração?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual serviço permite executar contêineres sem gerenciar a infraestrutura de nós subjacente, adequado para cargas de curta duração?', 1, 'easy', 'mc_4', 'Microsoft Azure Administrator', 'Deploy and Manage Azure Compute Resources', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Azure Container Instances'),
        (v_question_id, 'B', 'Azure Kubernetes Service com node pools dedicados'),
        (v_question_id, 'C', 'Azure Virtual Machine Scale Sets'),
        (v_question_id, 'D', 'Azure Batch com pools de VMs');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O ACI executa contêineres sob demanda sem provisionamento ou gestão de servidores.', NOW()),
        (v_answer_id, 'B', 'O AKS exige gerenciar node pools, versões e escalonamento do cluster.', NOW()),
        (v_answer_id, 'C', 'Scale sets gerenciam VMs, não contêineres diretamente.', NOW()),
        (v_answer_id, 'D', 'O Azure Batch orquestra jobs em larga escala sobre pools de VMs administrados.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Monitor and Maintain Azure Resources' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Monitor and Maintain Azure Resources' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Monitor and Maintain Azure Resources', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual solução do Azure Monitor permite consultar dados de log com a linguagem KQL?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual solução do Azure Monitor permite consultar dados de log com a linguagem KQL?', 1, 'easy', 'mc_4', 'Microsoft Azure Administrator', 'Monitor and Maintain Azure Resources', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Log Analytics workspace'),
        (v_question_id, 'B', 'Azure Service Health'),
        (v_question_id, 'C', 'Azure Advisor'),
        (v_question_id, 'D', 'Metrics Explorer');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Log Analytics armazena os dados de log e é consultado com Kusto Query Language.', NOW()),
        (v_answer_id, 'B', 'O Service Health informa incidentes e manutenções da plataforma.', NOW()),
        (v_answer_id, 'C', 'O Advisor gera recomendações de custo, segurança e desempenho.', NOW()),
        (v_answer_id, 'D', 'O Metrics Explorer visualiza métricas numéricas, sem consultas KQL.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma VM precisa ser restaurada a um estado anterior após uma atualização malsucedida. Qual serviço fornece essa capacidade com retenção configurável?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma VM precisa ser restaurada a um estado anterior após uma atualização malsucedida. Qual serviço fornece essa capacidade com retenção configurável?', 1, 'easy', 'mc_4', 'Microsoft Azure Administrator', 'Monitor and Maintain Azure Resources', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Azure Backup com um Recovery Services vault'),
        (v_question_id, 'B', 'Azure Site Recovery configurado para failover contínuo'),
        (v_question_id, 'C', 'Azure Monitor com alertas de disponibilidade'),
        (v_question_id, 'D', 'Azure Update Manager');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Azure Backup cria pontos de recuperação com política de retenção e permite restaurar a VM ou discos.', NOW()),
        (v_answer_id, 'B', 'O Site Recovery é voltado a recuperação de desastres com replicação entre regiões.', NOW()),
        (v_answer_id, 'C', 'O Azure Monitor detecta problemas, mas não restaura estados anteriores.', NOW()),
        (v_answer_id, 'D', 'O Update Manager coordena atualizações, sem função de restauração.', NOW());
    END IF;

  END IF;

  -- ── Microsoft Azure Fundamentals ──────────────────────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'Microsoft Azure Fundamentals' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Cloud Concepts' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Cloud Concepts' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Cloud Concepts', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual característica descreve o modelo de despesa operacional (OpEx) típico da computação em nuvem?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual característica descreve o modelo de despesa operacional (OpEx) típico da computação em nuvem?', 1, 'easy', 'mc_4', 'Microsoft Azure Fundamentals', 'Cloud Concepts', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Pagamento conforme o consumo, sem investimento inicial em hardware'),
        (v_question_id, 'B', 'Aquisição antecipada de servidores amortizada ao longo de anos'),
        (v_question_id, 'C', 'Contrato fixo de capacidade independentemente do uso'),
        (v_question_id, 'D', 'Licenciamento perpétuo pago uma única vez');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Na nuvem o custo é operacional e proporcional ao consumo, sem CapEx inicial.', NOW()),
        (v_answer_id, 'B', 'Compra antecipada de hardware caracteriza despesa de capital (CapEx), típica do modelo on-premises.', NOW()),
        (v_answer_id, 'C', 'Capacidade fixa contratada não reflete o modelo elástico de consumo da nuvem.', NOW()),
        (v_answer_id, 'D', 'Licença perpétua é um pagamento único de capital, não consumo recorrente.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'No modelo de responsabilidade compartilhada, qual item é sempre responsabilidade do cliente, independentemente de usar IaaS, PaaS ou SaaS?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('No modelo de responsabilidade compartilhada, qual item é sempre responsabilidade do cliente, independentemente de usar IaaS, PaaS ou SaaS?', 1, 'medium', 'mc_4', 'Microsoft Azure Fundamentals', 'Cloud Concepts', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Os dados e as identidades de acesso'),
        (v_question_id, 'B', 'A segurança física dos datacenters'),
        (v_question_id, 'C', 'A manutenção do hipervisor'),
        (v_question_id, 'D', 'A rede física do provedor');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Dados, identidades e a gestão de acessos permanecem sob responsabilidade do cliente em todos os modelos.', NOW()),
        (v_answer_id, 'B', 'A segurança física dos datacenters é sempre responsabilidade do provedor.', NOW()),
        (v_answer_id, 'C', 'O hipervisor é gerenciado pela Microsoft em todos os modelos de serviço.', NOW()),
        (v_answer_id, 'D', 'A infraestrutura de rede física pertence e é operada pelo provedor.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual modelo de serviço entrega ao cliente uma aplicação completa e pronta para uso, sem que ele gerencie sistema operacional ou runtime?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual modelo de serviço entrega ao cliente uma aplicação completa e pronta para uso, sem que ele gerencie sistema operacional ou runtime?', 1, 'easy', 'mc_4', 'Microsoft Azure Fundamentals', 'Cloud Concepts', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'SaaS'),
        (v_question_id, 'B', 'PaaS'),
        (v_question_id, 'C', 'IaaS'),
        (v_question_id, 'D', 'Nuvem híbrida');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. No SaaS o provedor entrega o software pronto, como o Microsoft 365.', NOW()),
        (v_answer_id, 'B', 'No PaaS o cliente gerencia a aplicação e os dados sobre uma plataforma administrada.', NOW()),
        (v_answer_id, 'C', 'No IaaS o cliente gerencia sistema operacional, runtime e aplicação sobre a infraestrutura provisionada.', NOW()),
        (v_answer_id, 'D', 'Nuvem híbrida descreve topologia de implantação, não modelo de serviço.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Azure Architecture and Services' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Azure Architecture and Services' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Azure Architecture and Services', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que é uma região do Azure?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que é uma região do Azure?', 1, 'easy', 'mc_4', 'Microsoft Azure Fundamentals', 'Azure Architecture and Services', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Um conjunto de datacenters implantados dentro de um perímetro geográfico definido'),
        (v_question_id, 'B', 'Um único servidor físico dedicado a um cliente'),
        (v_question_id, 'C', 'Um grupo lógico de recursos para cobrança'),
        (v_question_id, 'D', 'Uma assinatura com limite de gastos');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Uma região reúne datacenters conectados por rede de baixa latência dentro de um perímetro geográfico.', NOW()),
        (v_answer_id, 'B', 'Servidor físico dedicado corresponde a um Azure Dedicated Host.', NOW()),
        (v_answer_id, 'C', 'Agrupamento lógico para gestão e cobrança é o resource group.', NOW()),
        (v_answer_id, 'D', 'Assinatura é o contêiner de faturamento e limites, não uma região.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual serviço do Azure é um banco de dados NoSQL distribuído globalmente, com múltiplos modelos de dados e latência de milissegundos?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual serviço do Azure é um banco de dados NoSQL distribuído globalmente, com múltiplos modelos de dados e latência de milissegundos?', 1, 'medium', 'mc_4', 'Microsoft Azure Fundamentals', 'Azure Architecture and Services', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Azure Cosmos DB'),
        (v_question_id, 'B', 'Azure SQL Database'),
        (v_question_id, 'C', 'Azure Table Storage'),
        (v_question_id, 'D', 'Azure Synapse Analytics');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Cosmos DB oferece distribuição global, múltiplas APIs e SLAs de latência de milissegundos.', NOW()),
        (v_answer_id, 'B', 'O Azure SQL Database é relacional e gerenciado, não NoSQL multimodelo.', NOW()),
        (v_answer_id, 'C', 'O Table Storage é um armazenamento chave-valor simples, sem distribuição global multimodelo.', NOW()),
        (v_answer_id, 'D', 'O Synapse é uma plataforma de análise e data warehousing.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual recurso permite executar código sob demanda sem provisionar servidores, cobrando apenas pelo tempo de execução?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual recurso permite executar código sob demanda sem provisionar servidores, cobrando apenas pelo tempo de execução?', 1, 'easy', 'mc_4', 'Microsoft Azure Fundamentals', 'Azure Architecture and Services', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Azure Functions'),
        (v_question_id, 'B', 'Azure Virtual Machines'),
        (v_question_id, 'C', 'Azure Virtual Desktop'),
        (v_question_id, 'D', 'Azure ExpressRoute');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Azure Functions é a oferta serverless de execução de código orientada a eventos.', NOW()),
        (v_answer_id, 'B', 'VMs exigem provisionamento e são cobradas enquanto estiverem alocadas.', NOW()),
        (v_answer_id, 'C', 'O Virtual Desktop entrega desktops e aplicações virtualizadas aos usuários.', NOW()),
        (v_answer_id, 'D', 'O ExpressRoute cria conectividade privada dedicada com o Azure.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Azure Management and Governance' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Azure Management and Governance' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Azure Management and Governance', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual ferramenta ajuda a estimar o custo de uma solução no Azure antes de provisionar os recursos?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual ferramenta ajuda a estimar o custo de uma solução no Azure antes de provisionar os recursos?', 1, 'easy', 'mc_4', 'Microsoft Azure Fundamentals', 'Azure Management and Governance', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Azure Pricing Calculator'),
        (v_question_id, 'B', 'Azure Cost Management, na visão de custos acumulados'),
        (v_question_id, 'C', 'Azure Advisor'),
        (v_question_id, 'D', 'Azure Monitor');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A Pricing Calculator estima custos de uma arquitetura planejada antes da implantação.', NOW()),
        (v_answer_id, 'B', 'O Cost Management analisa e controla gastos já incorridos.', NOW()),
        (v_answer_id, 'C', 'O Advisor recomenda otimizações sobre recursos existentes.', NOW()),
        (v_answer_id, 'D', 'O Monitor coleta telemetria de recursos em execução.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual recurso impede a exclusão acidental de um recurso, mesmo por usuários com permissão de proprietário?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual recurso impede a exclusão acidental de um recurso, mesmo por usuários com permissão de proprietário?', 1, 'medium', 'mc_4', 'Microsoft Azure Fundamentals', 'Azure Management and Governance', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Resource lock do tipo CanNotDelete'),
        (v_question_id, 'B', 'Uma tag chamada DoNotDelete'),
        (v_question_id, 'C', 'Uma atribuição RBAC com a role Contributor'),
        (v_question_id, 'D', 'Um orçamento configurado no Cost Management');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O lock CanNotDelete bloqueia a exclusão até que o próprio lock seja removido, independentemente do RBAC.', NOW()),
        (v_answer_id, 'B', 'Tags são apenas metadados e não impõem restrição alguma.', NOW()),
        (v_answer_id, 'C', 'A role Contributor concede permissão de alteração, inclusive exclusão.', NOW()),
        (v_answer_id, 'D', 'Orçamentos disparam alertas de gasto, sem impedir exclusões.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual recurso do Azure organiza várias subscriptions em uma hierarquia para aplicar políticas e controles de acesso de forma consistente?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual recurso do Azure organiza várias subscriptions em uma hierarquia para aplicar políticas e controles de acesso de forma consistente?', 1, 'medium', 'mc_4', 'Microsoft Azure Fundamentals', 'Azure Management and Governance', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Management groups'),
        (v_question_id, 'B', 'Resource groups'),
        (v_question_id, 'C', 'Availability zones'),
        (v_question_id, 'D', 'Blueprints de rede');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Management groups agregam subscriptions em uma hierarquia que propaga políticas e RBAC.', NOW()),
        (v_answer_id, 'B', 'Resource groups organizam recursos dentro de uma única subscription.', NOW()),
        (v_answer_id, 'C', 'Availability zones tratam de resiliência dentro de uma região.', NOW()),
        (v_answer_id, 'D', 'Não é o mecanismo hierárquico de governança entre subscriptions.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual afirmação sobre o Azure Service Level Agreement (SLA) está correta?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual afirmação sobre o Azure Service Level Agreement (SLA) está correta?', 1, 'hard', 'mc_4', 'Microsoft Azure Fundamentals', 'Azure Management and Governance', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Combinar serviços em série tende a reduzir o SLA composto da solução'),
        (v_question_id, 'B', 'O SLA composto é sempre igual ao do serviço com maior disponibilidade'),
        (v_question_id, 'C', 'Serviços gratuitos e em preview costumam ter o mesmo SLA da versão paga'),
        (v_question_id, 'D', 'O SLA garante que nenhuma indisponibilidade ocorrerá');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Em dependência serial, os percentuais se multiplicam, resultando em disponibilidade composta menor que a de cada parte.', NOW()),
        (v_answer_id, 'B', 'O composto tende ao menor, não ao maior, quando há dependência em série.', NOW()),
        (v_answer_id, 'C', 'Serviços gratuitos e em preview geralmente não têm SLA financeiramente respaldado.', NOW()),
        (v_answer_id, 'D', 'O SLA define metas e créditos de serviço; não elimina a possibilidade de indisponibilidade.', NOW());
    END IF;

  END IF;

  -- ── Google Cloud Professional Cloud Architect ─────────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'Google Cloud Professional Cloud Architect' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Designing and planning a cloud solution architecture' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Designing and planning a cloud solution architecture' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Designing and planning a cloud solution architecture', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma aplicação precisa de um banco relacional com escala horizontal global e consistência forte. Qual serviço do Google Cloud atende a esses requisitos?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma aplicação precisa de um banco relacional com escala horizontal global e consistência forte. Qual serviço do Google Cloud atende a esses requisitos?', 1, 'medium', 'mc_4', 'Google Cloud Professional Cloud Architect', 'Designing and planning a cloud solution architecture', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Cloud Spanner'),
        (v_question_id, 'B', 'Cloud SQL'),
        (v_question_id, 'C', 'Firestore no modo nativo'),
        (v_question_id, 'D', 'BigQuery');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Spanner combina semântica relacional com escala horizontal global e consistência externa.', NOW()),
        (v_answer_id, 'B', 'O Cloud SQL é gerenciado, mas escala verticalmente e é regional.', NOW()),
        (v_answer_id, 'C', 'O Firestore é um banco de documentos NoSQL, sem semântica relacional completa.', NOW()),
        (v_answer_id, 'D', 'O BigQuery é um data warehouse analítico, não um banco transacional.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual classe de armazenamento do Cloud Storage é mais econômica para dados acessados no máximo uma vez por ano, com duração mínima de 365 dias?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual classe de armazenamento do Cloud Storage é mais econômica para dados acessados no máximo uma vez por ano, com duração mínima de 365 dias?', 1, 'medium', 'mc_4', 'Google Cloud Professional Cloud Architect', 'Designing and planning a cloud solution architecture', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Archive'),
        (v_question_id, 'B', 'Coldline'),
        (v_question_id, 'C', 'Nearline'),
        (v_question_id, 'D', 'Standard');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Archive tem o menor custo de armazenamento e duração mínima de 365 dias, indicado para acesso anual.', NOW()),
        (v_answer_id, 'B', 'Coldline tem duração mínima de 90 dias, voltada a acesso trimestral.', NOW()),
        (v_answer_id, 'C', 'Nearline tem duração mínima de 30 dias, para acesso mensal.', NOW()),
        (v_answer_id, 'D', 'Standard é para acesso frequente, com o maior custo por GB.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Managing and provisioning a cloud solution infrastructure' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Managing and provisioning a cloud solution infrastructure' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Managing and provisioning a cloud solution infrastructure', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual recurso permite que instâncias em uma sub-rede sem IP externo acessem APIs e serviços do Google sem passar pela internet pública?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual recurso permite que instâncias em uma sub-rede sem IP externo acessem APIs e serviços do Google sem passar pela internet pública?', 1, 'hard', 'mc_4', 'Google Cloud Professional Cloud Architect', 'Managing and provisioning a cloud solution infrastructure', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Private Google Access na sub-rede'),
        (v_question_id, 'B', 'Cloud NAT com regras de saída irrestritas'),
        (v_question_id, 'C', 'Um balanceador de carga externo na frente das instâncias'),
        (v_question_id, 'D', 'VPC Network Peering com a rede default');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Private Google Access permite alcançar APIs do Google por IPs internos, sem endereço externo.', NOW()),
        (v_answer_id, 'B', 'O Cloud NAT dá saída para a internet; resolve conectividade externa, não acesso privado às APIs.', NOW()),
        (v_answer_id, 'C', 'Balanceadores tratam de tráfego de entrada, não de acesso de saída às APIs.', NOW()),
        (v_answer_id, 'D', 'Peering conecta VPCs entre si e não fornece acesso privado às APIs do Google.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual ferramenta é a recomendada pelo Google Cloud para provisionar infraestrutura de forma declarativa e versionada?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual ferramenta é a recomendada pelo Google Cloud para provisionar infraestrutura de forma declarativa e versionada?', 1, 'easy', 'mc_4', 'Google Cloud Professional Cloud Architect', 'Managing and provisioning a cloud solution infrastructure', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Terraform, com o provider oficial do Google Cloud'),
        (v_question_id, 'B', 'Comandos gcloud executados manualmente pelo operador'),
        (v_question_id, 'C', 'Console web, com registro manual das alterações'),
        (v_question_id, 'D', 'Cloud Shell com scripts ad hoc não versionados');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Terraform permite descrever a infraestrutura como código, versioná-la e aplicá-la de forma reproduzível.', NOW()),
        (v_answer_id, 'B', 'Comandos manuais não são declarativos nem reproduzíveis de forma confiável.', NOW()),
        (v_answer_id, 'C', 'O console é adequado para exploração, não para infraestrutura gerenciada como código.', NOW()),
        (v_answer_id, 'D', 'Scripts ad hoc sem versionamento reintroduzem exatamente o problema que IaC resolve.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Designing for security and compliance' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Designing for security and compliance' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Designing for security and compliance', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual recurso cria um perímetro em torno de serviços gerenciados para mitigar exfiltração de dados, mesmo com credenciais válidas?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual recurso cria um perímetro em torno de serviços gerenciados para mitigar exfiltração de dados, mesmo com credenciais válidas?', 1, 'hard', 'mc_4', 'Google Cloud Professional Cloud Architect', 'Designing for security and compliance', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'VPC Service Controls'),
        (v_question_id, 'B', 'Identity-Aware Proxy'),
        (v_question_id, 'C', 'Cloud Armor'),
        (v_question_id, 'D', 'Shielded VMs');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O VPC Service Controls define perímetros de serviço que bloqueiam movimentação de dados para fora, mesmo com IAM válido.', NOW()),
        (v_answer_id, 'B', 'O IAP controla o acesso de usuários a aplicações, não a exfiltração entre serviços.', NOW()),
        (v_answer_id, 'C', 'O Cloud Armor protege contra ataques de rede e camada 7 na borda.', NOW()),
        (v_answer_id, 'D', 'Shielded VMs protegem a integridade de boot das instâncias.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual prática do IAM no Google Cloud melhor implementa o princípio do menor privilégio?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual prática do IAM no Google Cloud melhor implementa o princípio do menor privilégio?', 1, 'easy', 'mc_4', 'Google Cloud Professional Cloud Architect', 'Designing for security and compliance', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Conceder papéis predefinidos ou personalizados no menor escopo necessário, preferencialmente a grupos'),
        (v_question_id, 'B', 'Conceder o papel de Editor no nível da organização para simplificar a gestão'),
        (v_question_id, 'C', 'Compartilhar uma única service account entre todas as aplicações'),
        (v_question_id, 'D', 'Atribuir papéis básicos diretamente a cada usuário no nível do projeto');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Papéis específicos no menor escopo, atribuídos a grupos, reduzem a superfície de permissão e simplificam a manutenção.', NOW()),
        (v_answer_id, 'B', 'Editor na organização concede permissões amplas em todos os projetos.', NOW()),
        (v_answer_id, 'C', 'Uma service account compartilhada impede rastreabilidade e amplia o impacto de um vazamento.', NOW()),
        (v_answer_id, 'D', 'Papéis básicos são amplos por definição e contrariam o menor privilégio.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Analyzing and optimizing technical and business processes' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Analyzing and optimizing technical and business processes' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Analyzing and optimizing technical and business processes', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual métrica define o volume máximo de dados que a organização aceita perder em um incidente?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual métrica define o volume máximo de dados que a organização aceita perder em um incidente?', 1, 'easy', 'mc_4', 'Google Cloud Professional Cloud Architect', 'Analyzing and optimizing technical and business processes', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Recovery Point Objective (RPO)'),
        (v_question_id, 'B', 'Recovery Time Objective (RTO)'),
        (v_question_id, 'C', 'Mean Time Between Failures (MTBF)'),
        (v_question_id, 'D', 'Service Level Indicator (SLI)');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O RPO expressa a perda de dados tolerável, medida em tempo desde o último ponto de recuperação.', NOW()),
        (v_answer_id, 'B', 'O RTO define o tempo aceitável para restabelecer o serviço.', NOW()),
        (v_answer_id, 'C', 'O MTBF mede o intervalo médio entre falhas de um componente.', NOW()),
        (v_answer_id, 'D', 'O SLI é uma medida quantitativa do nível de serviço observado.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Ensuring solution and operations excellence' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Ensuring solution and operations excellence' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Ensuring solution and operations excellence', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Segundo as práticas de SRE adotadas pelo Google, o que é um error budget?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Segundo as práticas de SRE adotadas pelo Google, o que é um error budget?', 1, 'hard', 'mc_4', 'Google Cloud Professional Cloud Architect', 'Ensuring solution and operations excellence', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A quantidade de indisponibilidade tolerada pelo SLO em um período, que pode ser gasta em mudanças e riscos'),
        (v_question_id, 'B', 'O orçamento financeiro reservado para corrigir incidentes'),
        (v_question_id, 'C', 'O número máximo de alertas que a equipe pode receber por semana'),
        (v_question_id, 'D', 'A margem de erro aceitável nas estimativas de capacidade');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O error budget é o complemento do SLO: define quanta falha é aceitável e regula o ritmo de mudanças.', NOW()),
        (v_answer_id, 'B', 'Não se trata de orçamento financeiro, e sim de confiabilidade.', NOW()),
        (v_answer_id, 'C', 'Volume de alertas relaciona-se a fadiga operacional, não ao conceito de error budget.', NOW()),
        (v_answer_id, 'D', 'Estimativas de capacidade são planejamento, não orçamento de erro.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual serviço centraliza logs de aplicações e infraestrutura no Google Cloud, com consulta e exportação para análise?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual serviço centraliza logs de aplicações e infraestrutura no Google Cloud, com consulta e exportação para análise?', 1, 'easy', 'mc_4', 'Google Cloud Professional Cloud Architect', 'Ensuring solution and operations excellence', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Cloud Logging'),
        (v_question_id, 'B', 'Cloud Trace'),
        (v_question_id, 'C', 'Cloud Profiler'),
        (v_question_id, 'D', 'Cloud Deploy');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Cloud Logging agrega, indexa e permite exportar logs por meio de sinks.', NOW()),
        (v_answer_id, 'B', 'O Cloud Trace analisa latência distribuída de requisições.', NOW()),
        (v_answer_id, 'C', 'O Cloud Profiler mede consumo de CPU e memória do código em produção.', NOW()),
        (v_answer_id, 'D', 'O Cloud Deploy orquestra entregas contínuas para ambientes.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Managing implementation' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Managing implementation' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Managing implementation', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Uma migração de VMs on-premises para o Google Cloud precisa minimizar o tempo de indisponibilidade durante a transição. Qual serviço é indicado?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Uma migração de VMs on-premises para o Google Cloud precisa minimizar o tempo de indisponibilidade durante a transição. Qual serviço é indicado?', 1, 'medium', 'mc_4', 'Google Cloud Professional Cloud Architect', 'Managing implementation', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Migrate to Virtual Machines, com replicação contínua antes do cutover'),
        (v_question_id, 'B', 'Exportar discos manualmente e importá-los como imagens personalizadas'),
        (v_question_id, 'C', 'Recriar cada VM manualmente e copiar os dados por SCP'),
        (v_question_id, 'D', 'Transfer Appliance para envio físico dos discos');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O serviço replica as VMs em execução e permite um cutover curto, minimizando a indisponibilidade.', NOW()),
        (v_answer_id, 'B', 'Exportação e importação manuais exigem parada prolongada durante a cópia.', NOW()),
        (v_answer_id, 'C', 'Recriação manual é lenta, propensa a erro e maximiza a indisponibilidade.', NOW()),
        (v_answer_id, 'D', 'O Transfer Appliance move grandes volumes de dados offline, sem replicação contínua de VMs.', NOW());
    END IF;

  END IF;

  -- ── CFA Level I ───────────────────────────────────────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'CFA Level I' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Ethical and Professional Standards' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Ethical and Professional Standards' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Ethical and Professional Standards', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Um analista recebe informação material não pública sobre uma fusão iminente durante uma conversa casual. Segundo o CFA Institute Code and Standards, a conduta mais apropriada é:') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Um analista recebe informação material não pública sobre uma fusão iminente durante uma conversa casual. Segundo o CFA Institute Code and Standards, a conduta mais apropriada é:', 1, 'medium', 'mc_5', 'CFA Level I', 'Ethical and Professional Standards', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'abster-se de negociar o papel e de recomendar sua negociação até que a informação se torne pública.'),
        (v_question_id, 'B', 'negociar imediatamente, pois a informação não foi obtida por meios ilícitos.'),
        (v_question_id, 'C', 'repassar a informação apenas a clientes discricionários de longa data.');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Standard II(A) proíbe agir ou induzir outros a agir com base em informação material não pública.', NOW()),
        (v_answer_id, 'B', 'A forma de obtenção não altera o dever: o que importa é a natureza material e não pública da informação.', NOW()),
        (v_answer_id, 'C', 'Repassar a clientes selecionados configura justamente o uso indevido vedado pelo padrão.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Quantitative Methods' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Quantitative Methods' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Quantitative Methods', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Um investimento de USD 1.000 rende 8% ao ano com capitalização anual. O valor futuro ao final de 3 anos é mais próximo de:') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Um investimento de USD 1.000 rende 8% ao ano com capitalização anual. O valor futuro ao final de 3 anos é mais próximo de:', 1, 'easy', 'mc_5', 'CFA Level I', 'Quantitative Methods', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'USD 1.259.'),
        (v_question_id, 'B', 'USD 1.240.'),
        (v_question_id, 'C', 'USD 1.280.');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. VF = 1.000 × (1,08)³ = 1.000 × 1,2597 ≈ USD 1.259.', NOW()),
        (v_answer_id, 'B', 'USD 1.240 corresponderia a juros simples de 8% ao ano por 3 anos.', NOW()),
        (v_answer_id, 'C', 'USD 1.280 superestima o efeito da capitalização no período.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Economics' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Economics' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Economics', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Segundo a paridade do poder de compra relativa, a variação esperada da taxa de câmbio entre dois países é mais bem explicada pela diferença entre:') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Segundo a paridade do poder de compra relativa, a variação esperada da taxa de câmbio entre dois países é mais bem explicada pela diferença entre:', 1, 'medium', 'mc_5', 'CFA Level I', 'Economics', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'as taxas de inflação dos dois países.'),
        (v_question_id, 'B', 'as taxas de crescimento populacional dos dois países.'),
        (v_question_id, 'C', 'os saldos de conta capital dos dois países.');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Na PPC relativa, a moeda do país com inflação mais alta tende a se depreciar na proporção do diferencial.', NOW()),
        (v_answer_id, 'B', 'Crescimento populacional afeta a economia no longo prazo, mas não é a variável da PPC relativa.', NOW()),
        (v_answer_id, 'C', 'Fluxos de capital influenciam o câmbio, porém não são o mecanismo descrito pela PPC.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Financial Statement Analysis' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Financial Statement Analysis' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Financial Statement Analysis', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Em um ambiente de preços crescentes, o uso do método FIFO em comparação ao LIFO resulta, mais provavelmente, em:') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Em um ambiente de preços crescentes, o uso do método FIFO em comparação ao LIFO resulta, mais provavelmente, em:', 1, 'hard', 'mc_5', 'CFA Level I', 'Financial Statement Analysis', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'maior lucro líquido e maior valor de estoque no balanço.'),
        (v_question_id, 'B', 'menor lucro líquido e menor valor de estoque no balanço.'),
        (v_question_id, 'C', 'maior custo das mercadorias vendidas e menor lucro bruto.');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O FIFO baixa primeiro os custos mais antigos e baratos, elevando o lucro e deixando itens mais caros no estoque.', NOW()),
        (v_answer_id, 'B', 'Esse é o efeito do LIFO em preços crescentes, não do FIFO.', NOW()),
        (v_answer_id, 'C', 'Sob FIFO o CMV é menor, elevando o lucro bruto.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Corporate Issuers' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Corporate Issuers' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Corporate Issuers', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O custo médio ponderado de capital (WACC) é mais bem descrito como:') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O custo médio ponderado de capital (WACC) é mais bem descrito como:', 1, 'medium', 'mc_5', 'CFA Level I', 'Corporate Issuers', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'a média do custo de dívida e de capital próprio ponderada pelas participações na estrutura de capital.'),
        (v_question_id, 'B', 'o custo da dívida após impostos, isoladamente.'),
        (v_question_id, 'C', 'o custo do capital próprio acrescido do benefício fiscal dos juros.');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O WACC combina as fontes de financiamento ponderadas por seu peso relativo na estrutura de capital.', NOW()),
        (v_answer_id, 'B', 'O WACC inclui também o custo do capital próprio, não apenas a dívida.', NOW()),
        (v_answer_id, 'C', 'O benefício fiscal incide sobre os juros da dívida, não sobre o capital próprio.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Equity Investments' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Equity Investments' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Equity Investments', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'No modelo de crescimento de Gordon, o denominador da fórmula de avaliação é mais bem representado por:') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('No modelo de crescimento de Gordon, o denominador da fórmula de avaliação é mais bem representado por:', 1, 'medium', 'mc_5', 'CFA Level I', 'Equity Investments', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'r − g.'),
        (v_question_id, 'B', 'r + g.'),
        (v_question_id, 'C', 'g − r.');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O valor é D₁ / (r − g), exigindo que a taxa requerida supere o crescimento perpétuo.', NOW()),
        (v_answer_id, 'B', 'Somar as taxas não reflete a lógica de perpetuidade crescente.', NOW()),
        (v_answer_id, 'C', 'Inverter os termos produziria denominador negativo quando r > g.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Fixed Income' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Fixed Income' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Fixed Income', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'A relação entre o preço de um título prefixado e a taxa de juros de mercado é mais bem descrita como:') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('A relação entre o preço de um título prefixado e a taxa de juros de mercado é mais bem descrita como:', 1, 'easy', 'mc_5', 'CFA Level I', 'Fixed Income', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'inversa: quando a taxa sobe, o preço cai.'),
        (v_question_id, 'B', 'direta: quando a taxa sobe, o preço sobe.'),
        (v_question_id, 'C', 'inexistente, pois o preço permanece fixo até o vencimento.');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Fluxos futuros fixos descontados a uma taxa maior resultam em valor presente menor.', NOW()),
        (v_answer_id, 'B', 'A relação é inversa, não direta.', NOW()),
        (v_answer_id, 'C', 'O preço de mercado oscila continuamente; apenas o valor de resgate no vencimento é conhecido.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Derivatives' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Derivatives' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Derivatives', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'A perda máxima de um investidor que compra uma opção de compra (call) é mais bem descrita como:') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('A perda máxima de um investidor que compra uma opção de compra (call) é mais bem descrita como:', 1, 'easy', 'mc_5', 'CFA Level I', 'Derivatives', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'o prêmio pago pela opção.'),
        (v_question_id, 'B', 'o preço de exercício da opção.'),
        (v_question_id, 'C', 'ilimitada, acompanhando a variação do ativo subjacente.');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O titular da call pode simplesmente não exercer, limitando a perda ao prêmio desembolsado.', NOW()),
        (v_answer_id, 'B', 'O preço de exercício só é pago se houver exercício, quando a operação é vantajosa.', NOW()),
        (v_answer_id, 'C', 'Perda ilimitada é característica do lançador descoberto de call, não do titular.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Portfolio Management' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Portfolio Management' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Portfolio Management', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O índice de Sharpe é mais bem descrito como a medida do retorno excedente por unidade de:') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O índice de Sharpe é mais bem descrito como a medida do retorno excedente por unidade de:', 1, 'medium', 'mc_5', 'CFA Level I', 'Portfolio Management', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'risco total, medido pelo desvio-padrão.'),
        (v_question_id, 'B', 'risco sistemático, medido pelo beta.'),
        (v_question_id, 'C', 'risco de crédito, medido pelo spread.');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Sharpe divide o retorno acima do ativo livre de risco pelo desvio-padrão, que representa o risco total.', NOW()),
        (v_answer_id, 'B', 'Ajuste por risco sistemático corresponde ao índice de Treynor, que usa o beta.', NOW()),
        (v_answer_id, 'C', 'O spread de crédito não integra a formulação do índice de Sharpe.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Alternative Investments' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Alternative Investments' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Alternative Investments', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Em comparação a ações listadas, um investimento em private equity é mais provavelmente caracterizado por:') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Em comparação a ações listadas, um investimento em private equity é mais provavelmente caracterizado por:', 1, 'medium', 'mc_5', 'CFA Level I', 'Alternative Investments', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'baixa liquidez e horizonte de investimento longo.'),
        (v_question_id, 'B', 'marcação a mercado diária e resgate imediato.'),
        (v_question_id, 'C', 'ausência de taxa de performance para o gestor.');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Private equity envolve capital comprometido por vários anos e ausência de mercado secundário líquido.', NOW()),
        (v_answer_id, 'B', 'Não há marcação diária nem resgate imediato nesses veículos.', NOW()),
        (v_answer_id, 'C', 'Taxa de performance (carried interest) é justamente uma característica marcante do setor.', NOW());
    END IF;

  END IF;

  -- ── FRM Part I ────────────────────────────────────────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'FRM Part I' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Foundations of Risk Management' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Foundations of Risk Management' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Foundations of Risk Management', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Segundo o CAPM, qual tipo de risco é remunerado pelo mercado?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Segundo o CAPM, qual tipo de risco é remunerado pelo mercado?', 1, 'medium', 'mc_4', 'FRM Part I', 'Foundations of Risk Management', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Apenas o risco sistemático, medido pelo beta'),
        (v_question_id, 'B', 'O risco total, medido pelo desvio-padrão'),
        (v_question_id, 'C', 'Apenas o risco específico da empresa'),
        (v_question_id, 'D', 'O risco de liquidez do papel');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O risco não sistemático pode ser eliminado por diversificação, então o mercado remunera apenas o sistemático.', NOW()),
        (v_answer_id, 'B', 'O risco total inclui a parcela diversificável, que não é remunerada no CAPM.', NOW()),
        (v_answer_id, 'C', 'O risco específico é justamente o que a diversificação elimina.', NOW()),
        (v_answer_id, 'D', 'Risco de liquidez não é a variável de precificação do CAPM.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual categoria de risco decorre de falhas em processos internos, pessoas, sistemas ou eventos externos?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual categoria de risco decorre de falhas em processos internos, pessoas, sistemas ou eventos externos?', 1, 'easy', 'mc_4', 'FRM Part I', 'Foundations of Risk Management', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Risco operacional'),
        (v_question_id, 'B', 'Risco de mercado'),
        (v_question_id, 'C', 'Risco de crédito'),
        (v_question_id, 'D', 'Risco de liquidez de funding');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Essa é a definição de risco operacional adotada por Basileia.', NOW()),
        (v_answer_id, 'B', 'Risco de mercado decorre de variações em preços e taxas.', NOW()),
        (v_answer_id, 'C', 'Risco de crédito decorre do descumprimento de obrigações pela contraparte.', NOW()),
        (v_answer_id, 'D', 'Risco de funding refere-se à incapacidade de obter recursos para honrar compromissos.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual conceito descreve a situação em que a existência de proteção leva o agente a assumir mais risco do que assumiria sem ela?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual conceito descreve a situação em que a existência de proteção leva o agente a assumir mais risco do que assumiria sem ela?', 1, 'medium', 'mc_4', 'FRM Part I', 'Foundations of Risk Management', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Risco moral (moral hazard)'),
        (v_question_id, 'B', 'Seleção adversa'),
        (v_question_id, 'C', 'Risco de base'),
        (v_question_id, 'D', 'Risco de modelo');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O risco moral surge quando o agente protegido altera seu comportamento e assume mais risco.', NOW()),
        (v_answer_id, 'B', 'A seleção adversa ocorre antes da contratação, por assimetria de informação sobre a qualidade do risco.', NOW()),
        (v_answer_id, 'C', 'Risco de base é o descasamento entre o instrumento de hedge e a exposição protegida.', NOW()),
        (v_answer_id, 'D', 'Risco de modelo decorre de premissas ou formulações incorretas.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Quantitative Analysis' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Quantitative Analysis' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Quantitative Analysis', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que representa o VaR (Value at Risk) de 1 dia a 99% de confiança igual a R$ 1 milhão?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que representa o VaR (Value at Risk) de 1 dia a 99% de confiança igual a R$ 1 milhão?', 1, 'medium', 'mc_4', 'FRM Part I', 'Quantitative Analysis', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Há 1% de probabilidade de a perda em um dia exceder R$ 1 milhão'),
        (v_question_id, 'B', 'A perda máxima possível em um dia é de R$ 1 milhão'),
        (v_question_id, 'C', 'A perda média esperada em um dia é de R$ 1 milhão'),
        (v_question_id, 'D', 'Há 99% de probabilidade de perder exatamente R$ 1 milhão');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O VaR é um quantil da distribuição de perdas: em 1% dos dias a perda tende a superar esse valor.', NOW()),
        (v_answer_id, 'B', 'O VaR não limita a perda máxima; nada diz sobre a magnitude além do quantil.', NOW()),
        (v_answer_id, 'C', 'A perda média condicional além do VaR é o expected shortfall, não o próprio VaR.', NOW()),
        (v_answer_id, 'D', 'O VaR não indica perda exata, e sim um limiar associado a uma probabilidade.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a principal limitação do VaR que motivou a adoção do expected shortfall em Basileia III?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a principal limitação do VaR que motivou a adoção do expected shortfall em Basileia III?', 1, 'hard', 'mc_4', 'FRM Part I', 'Quantitative Analysis', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'O VaR não informa a severidade das perdas que ultrapassam o quantil e não é subaditivo em geral'),
        (v_question_id, 'B', 'O VaR não pode ser calculado para carteiras com derivativos'),
        (v_question_id, 'C', 'O VaR exige distribuição normal obrigatoriamente'),
        (v_question_id, 'D', 'O VaR não permite escolher o nível de confiança');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O VaR ignora a cauda além do quantil e pode violar a subaditividade, falhando como medida coerente de risco.', NOW()),
        (v_answer_id, 'B', 'O VaR é amplamente calculado para carteiras com derivativos, inclusive por simulação.', NOW()),
        (v_answer_id, 'C', 'Existem abordagens histórica e de Monte Carlo que não pressupõem normalidade.', NOW()),
        (v_answer_id, 'D', 'O nível de confiança é um parâmetro escolhido livremente.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Financial Markets and Products' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Financial Markets and Products' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Financial Markets and Products', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Em um contrato futuro negociado em bolsa, qual mecanismo reduz o risco de crédito entre as partes?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Em um contrato futuro negociado em bolsa, qual mecanismo reduz o risco de crédito entre as partes?', 1, 'medium', 'mc_4', 'FRM Part I', 'Financial Markets and Products', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A interposição da câmara de compensação como contraparte central, com ajustes diários de margem'),
        (v_question_id, 'B', 'A garantia bilateral negociada diretamente entre comprador e vendedor'),
        (v_question_id, 'C', 'A ausência de liquidação financeira até o vencimento'),
        (v_question_id, 'D', 'A negociação exclusivamente em mercado de balcão');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A clearing atua como contraparte central e o ajuste diário limita o acúmulo de exposição.', NOW()),
        (v_answer_id, 'B', 'Garantias bilaterais são típicas do mercado de balcão, não do futuro em bolsa.', NOW()),
        (v_answer_id, 'C', 'É justamente o contrário: há ajuste diário de posições no mercado futuro.', NOW()),
        (v_answer_id, 'D', 'Contratos futuros são padronizados e negociados em bolsa, não em balcão.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a diferença essencial entre um contrato a termo (forward) e um contrato futuro?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a diferença essencial entre um contrato a termo (forward) e um contrato futuro?', 1, 'medium', 'mc_4', 'FRM Part I', 'Financial Markets and Products', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'O futuro é padronizado e negociado em bolsa com ajuste diário; o termo é customizado e negociado em balcão'),
        (v_question_id, 'B', 'O termo é padronizado e o futuro é customizado'),
        (v_question_id, 'C', 'Apenas o termo admite liquidação financeira'),
        (v_question_id, 'D', 'Apenas o futuro pode ter ativo subjacente de commodities');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Padronização, bolsa e ajuste diário caracterizam o futuro; flexibilidade e balcão caracterizam o termo.', NOW()),
        (v_answer_id, 'B', 'Inverte as características dos dois instrumentos.', NOW()),
        (v_answer_id, 'C', 'Ambos admitem liquidação financeira conforme o contrato.', NOW()),
        (v_answer_id, 'D', 'Tanto termos quanto futuros podem ter commodities como subjacente.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Valuation and Risk Models' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Valuation and Risk Models' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Valuation and Risk Models', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que a duration modificada de um título de renda fixa mede?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que a duration modificada de um título de renda fixa mede?', 1, 'medium', 'mc_4', 'FRM Part I', 'Valuation and Risk Models', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A sensibilidade percentual aproximada do preço a uma variação de 1 ponto percentual na taxa de juros'),
        (v_question_id, 'B', 'O prazo médio ponderado até o recebimento dos fluxos, em anos'),
        (v_question_id, 'C', 'A probabilidade de inadimplência do emissor no horizonte de um ano'),
        (v_question_id, 'D', 'A convexidade da relação entre preço e taxa');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A duration modificada traduz a duration de Macaulay em sensibilidade percentual de preço.', NOW()),
        (v_answer_id, 'B', 'O prazo médio ponderado dos fluxos é a duration de Macaulay.', NOW()),
        (v_answer_id, 'C', 'Probabilidade de inadimplência é medida de risco de crédito, não de taxa.', NOW()),
        (v_answer_id, 'D', 'A convexidade é o efeito de segunda ordem, complementar à duration.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'No modelo de Black-Scholes, qual variável de entrada NÃO é diretamente observável no mercado, exigindo estimativa?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('No modelo de Black-Scholes, qual variável de entrada NÃO é diretamente observável no mercado, exigindo estimativa?', 1, 'hard', 'mc_4', 'FRM Part I', 'Valuation and Risk Models', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A volatilidade do ativo subjacente'),
        (v_question_id, 'B', 'O preço de exercício da opção'),
        (v_question_id, 'C', 'O prazo até o vencimento'),
        (v_question_id, 'D', 'O preço à vista do ativo subjacente');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A volatilidade futura precisa ser estimada, o que dá origem ao conceito de volatilidade implícita.', NOW()),
        (v_answer_id, 'B', 'O strike é definido contratualmente e é plenamente conhecido.', NOW()),
        (v_answer_id, 'C', 'O prazo até o vencimento decorre do calendário do contrato.', NOW()),
        (v_answer_id, 'D', 'O preço à vista é observável diretamente no mercado.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é o objetivo de um teste de estresse em gestão de riscos?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é o objetivo de um teste de estresse em gestão de riscos?', 1, 'easy', 'mc_4', 'FRM Part I', 'Valuation and Risk Models', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Avaliar o impacto de cenários extremos, porém plausíveis, sobre a carteira ou a instituição'),
        (v_question_id, 'B', 'Calcular o retorno esperado da carteira em condições normais'),
        (v_question_id, 'C', 'Determinar a alocação ótima segundo a fronteira eficiente'),
        (v_question_id, 'D', 'Estimar a correlação média histórica entre os ativos');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O teste de estresse examina eventos de cauda que modelos estatísticos usuais tendem a subestimar.', NOW()),
        (v_answer_id, 'B', 'Retorno em condições normais é objeto de projeções ordinárias, não de estresse.', NOW()),
        (v_answer_id, 'C', 'Alocação ótima é tema de otimização de carteira.', NOW()),
        (v_answer_id, 'D', 'Correlações históricas são insumo de modelos, não o objetivo do teste.', NOW());
    END IF;

  END IF;

  -- ── Certified Financial Planner ───────────────────────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'Certified Financial Planner' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'General Principles of Financial Planning' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'General Principles of Financial Planning' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'General Principles of Financial Planning', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a primeira etapa do processo de planejamento financeiro conforme o padrão do CFP Board?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a primeira etapa do processo de planejamento financeiro conforme o padrão do CFP Board?', 1, 'easy', 'mc_4', 'Certified Financial Planner', 'General Principles of Financial Planning', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Entender as circunstâncias pessoais e financeiras do cliente'),
        (v_question_id, 'B', 'Implementar as recomendações do plano'),
        (v_question_id, 'C', 'Monitorar o progresso do plano'),
        (v_question_id, 'D', 'Desenvolver as recomendações de investimento');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O processo começa pela compreensão da situação, objetivos e restrições do cliente.', NOW()),
        (v_answer_id, 'B', 'A implementação vem depois da elaboração e aprovação das recomendações.', NOW()),
        (v_answer_id, 'C', 'O monitoramento é a etapa final e contínua do processo.', NOW()),
        (v_answer_id, 'D', 'Recomendações só podem ser formuladas após entender e analisar a situação do cliente.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual indicador é mais adequado para avaliar a capacidade de um cliente de honrar compromissos de curto prazo?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual indicador é mais adequado para avaliar a capacidade de um cliente de honrar compromissos de curto prazo?', 1, 'easy', 'mc_4', 'Certified Financial Planner', 'General Principles of Financial Planning', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A reserva de emergência em relação às despesas mensais essenciais'),
        (v_question_id, 'B', 'O patrimônio líquido total'),
        (v_question_id, 'C', 'A rentabilidade acumulada da carteira no ano'),
        (v_question_id, 'D', 'O valor de mercado dos imóveis do cliente');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A cobertura de despesas essenciais por ativos líquidos mede a resiliência de curto prazo.', NOW()),
        (v_answer_id, 'B', 'O patrimônio líquido pode estar concentrado em ativos ilíquidos.', NOW()),
        (v_answer_id, 'C', 'Rentabilidade passada não indica capacidade de pagamento imediato.', NOW()),
        (v_answer_id, 'D', 'Imóveis são ativos de baixa liquidez e demoram a se converter em caixa.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Professional Conduct and Regulation' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Professional Conduct and Regulation' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Professional Conduct and Regulation', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que o dever fiduciário exige de um profissional CFP ao prestar aconselhamento financeiro?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que o dever fiduciário exige de um profissional CFP ao prestar aconselhamento financeiro?', 1, 'medium', 'mc_4', 'Certified Financial Planner', 'Professional Conduct and Regulation', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Agir no melhor interesse do cliente, com cuidado, lealdade e divulgação de conflitos'),
        (v_question_id, 'B', 'Recomendar apenas produtos que sejam adequados, mesmo que existam melhores alternativas'),
        (v_question_id, 'C', 'Priorizar a rentabilidade da instituição que o remunera'),
        (v_question_id, 'D', 'Evitar qualquer forma de remuneração variável');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O padrão fiduciário reúne os deveres de lealdade, cuidado e tratamento adequado de conflitos.', NOW()),
        (v_answer_id, 'B', 'O critério de mera adequação (suitability) é menos exigente do que o padrão fiduciário.', NOW()),
        (v_answer_id, 'C', 'Priorizar o interesse da instituição é exatamente a violação que o dever fiduciário veda.', NOW()),
        (v_answer_id, 'D', 'Remuneração variável é permitida desde que divulgada e gerida quanto ao conflito.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Investment Planning' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Investment Planning' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Investment Planning', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é o principal benefício da diversificação em uma carteira de investimentos?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é o principal benefício da diversificação em uma carteira de investimentos?', 1, 'easy', 'mc_4', 'Certified Financial Planner', 'Investment Planning', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Reduzir o risco não sistemático sem sacrificar proporcionalmente o retorno esperado'),
        (v_question_id, 'B', 'Eliminar completamente todo o risco da carteira'),
        (v_question_id, 'C', 'Garantir retorno positivo em qualquer cenário de mercado'),
        (v_question_id, 'D', 'Aumentar a alavancagem sem elevar o risco');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Combinar ativos pouco correlacionados reduz a parcela diversificável do risco.', NOW()),
        (v_answer_id, 'B', 'O risco sistemático de mercado permanece, por mais diversificada que seja a carteira.', NOW()),
        (v_answer_id, 'C', 'Nenhuma estratégia garante retorno positivo em todos os cenários.', NOW()),
        (v_answer_id, 'D', 'Diversificação não se relaciona a aumento de alavancagem.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que caracteriza o rebalanceamento de uma carteira de investimentos?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que caracteriza o rebalanceamento de uma carteira de investimentos?', 1, 'easy', 'mc_4', 'Certified Financial Planner', 'Investment Planning', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Ajustar as posições para retornar à alocação-alvo definida na política de investimento'),
        (v_question_id, 'B', 'Vender todos os ativos com desempenho negativo no período'),
        (v_question_id, 'C', 'Concentrar a carteira na classe de ativo de melhor desempenho recente'),
        (v_question_id, 'D', 'Aumentar progressivamente a exposição a renda variável ao longo do tempo');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O rebalanceamento restaura os pesos-alvo, vendendo o que subiu e comprando o que caiu.', NOW()),
        (v_answer_id, 'B', 'Vender apenas perdedores altera a alocação sem critério de política.', NOW()),
        (v_answer_id, 'C', 'Concentrar no vencedor recente é perseguir desempenho, o oposto do rebalanceamento.', NOW()),
        (v_answer_id, 'D', 'Elevar continuamente a renda variável descreve uma mudança de perfil, não rebalanceamento.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Risk Management and Insurance Planning' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Risk Management and Insurance Planning' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Risk Management and Insurance Planning', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual estratégia de gestão de risco é mais apropriada para eventos de baixa probabilidade e alto impacto financeiro?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual estratégia de gestão de risco é mais apropriada para eventos de baixa probabilidade e alto impacto financeiro?', 1, 'medium', 'mc_4', 'Certified Financial Planner', 'Risk Management and Insurance Planning', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Transferência do risco por meio de seguro'),
        (v_question_id, 'B', 'Retenção integral do risco pelo próprio cliente'),
        (v_question_id, 'C', 'Evitar qualquer atividade que gere exposição'),
        (v_question_id, 'D', 'Redução do risco por controles operacionais apenas');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Seguro é eficiente justamente quando a probabilidade é baixa mas o impacto seria financeiramente devastador.', NOW()),
        (v_answer_id, 'B', 'Reter um risco de alto impacto pode comprometer todo o patrimônio do cliente.', NOW()),
        (v_answer_id, 'C', 'Evitar é viável apenas quando a atividade é dispensável, o que raramente ocorre.', NOW()),
        (v_answer_id, 'D', 'Controles reduzem frequência, mas não cobrem a severidade residual do evento.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Tax Planning' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Tax Planning' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Tax Planning', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a diferença entre uma dedução fiscal e um crédito fiscal?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a diferença entre uma dedução fiscal e um crédito fiscal?', 1, 'medium', 'mc_4', 'Certified Financial Planner', 'Tax Planning', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A dedução reduz a base tributável; o crédito reduz diretamente o imposto devido'),
        (v_question_id, 'B', 'A dedução reduz o imposto devido; o crédito reduz a base tributável'),
        (v_question_id, 'C', 'Ambos reduzem a base tributável, diferindo apenas no limite anual'),
        (v_question_id, 'D', 'Ambos reduzem o imposto devido, diferindo apenas na forma de apuração');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A dedução diminui o rendimento tributável; o crédito abate valor do imposto apurado.', NOW()),
        (v_answer_id, 'B', 'Inverte as definições dos dois institutos.', NOW()),
        (v_answer_id, 'C', 'O crédito não atua sobre a base de cálculo.', NOW()),
        (v_answer_id, 'D', 'A dedução não abate diretamente o imposto devido.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Retirement Savings and Income Planning' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Retirement Savings and Income Planning' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Retirement Savings and Income Planning', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Ao projetar a renda de aposentadoria, qual variável tem maior impacto sobre a probabilidade de o patrimônio se esgotar precocemente?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Ao projetar a renda de aposentadoria, qual variável tem maior impacto sobre a probabilidade de o patrimônio se esgotar precocemente?', 1, 'hard', 'mc_4', 'Certified Financial Planner', 'Retirement Savings and Income Planning', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A taxa de retirada anual combinada à sequência de retornos nos primeiros anos'),
        (v_question_id, 'B', 'A quantidade de instituições financeiras utilizadas pelo cliente'),
        (v_question_id, 'C', 'A frequência de rebalanceamento mensal da carteira'),
        (v_question_id, 'D', 'O número de classes de ativos presentes na carteira');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O risco de sequência de retornos faz perdas iniciais combinadas a retiradas elevadas comprometerem a longevidade do patrimônio.', NOW()),
        (v_answer_id, 'B', 'A quantidade de instituições é irrelevante para a sustentabilidade das retiradas.', NOW()),
        (v_answer_id, 'C', 'A frequência de rebalanceamento tem efeito marginal frente à taxa de retirada.', NOW()),
        (v_answer_id, 'D', 'Mais classes de ativos ajudam a diversificar, mas não é o fator determinante.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Estate Planning' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Estate Planning' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Estate Planning', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a principal vantagem de designar beneficiários diretamente em apólices de seguro e planos previdenciários?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a principal vantagem de designar beneficiários diretamente em apólices de seguro e planos previdenciários?', 1, 'medium', 'mc_4', 'Certified Financial Planner', 'Estate Planning', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Os valores são transferidos diretamente aos beneficiários, sem passar pelo inventário'),
        (v_question_id, 'B', 'Os valores ficam automaticamente isentos de qualquer tributação'),
        (v_question_id, 'C', 'Os beneficiários passam a ter direito ao valor ainda em vida do titular'),
        (v_question_id, 'D', 'A designação impede qualquer contestação judicial');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A designação de beneficiário permite transferência direta, evitando o processo de inventário.', NOW()),
        (v_answer_id, 'B', 'A tributação depende do instrumento e da legislação aplicável, não sendo automática a isenção.', NOW()),
        (v_answer_id, 'C', 'O direito dos beneficiários se concretiza com o falecimento do titular.', NOW()),
        (v_answer_id, 'D', 'A designação reduz litígios, mas não elimina a possibilidade de contestação.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Psychology of Financial Planning' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Psychology of Financial Planning' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Psychology of Financial Planning', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Um cliente mantém um investimento em prejuízo apenas para evitar admitir a perda. Qual viés comportamental melhor descreve esse comportamento?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Um cliente mantém um investimento em prejuízo apenas para evitar admitir a perda. Qual viés comportamental melhor descreve esse comportamento?', 1, 'medium', 'mc_4', 'Certified Financial Planner', 'Psychology of Financial Planning', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Aversão à perda, reforçada pelo efeito de disposição'),
        (v_question_id, 'B', 'Excesso de confiança na própria capacidade de análise'),
        (v_question_id, 'C', 'Viés de disponibilidade sobre notícias recentes'),
        (v_question_id, 'D', 'Viés de ancoragem em preços-alvo de analistas');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A aversão à perda e o efeito de disposição levam o investidor a segurar perdedores e realizar ganhos cedo demais.', NOW()),
        (v_answer_id, 'B', 'Excesso de confiança se manifesta em negociação excessiva e subestimação de risco.', NOW()),
        (v_answer_id, 'C', 'O viés de disponibilidade decorre da facilidade de lembrar eventos recentes.', NOW()),
        (v_answer_id, 'D', 'A ancoragem prende o julgamento a um valor de referência arbitrário.', NOW());
    END IF;

  END IF;

  -- ── AAI — Agente Autônomo de Investimentos (ANCORD) ───────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'AAI — Agente Autônomo de Investimentos (ANCORD)' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Atividade do Assessor de Investimentos' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Atividade do Assessor de Investimentos' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Atividade do Assessor de Investimentos', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Segundo a regulamentação vigente, qual atividade é vedada ao assessor de investimentos?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Segundo a regulamentação vigente, qual atividade é vedada ao assessor de investimentos?', 1, 'medium', 'mc_4', 'AAI — Agente Autônomo de Investimentos (ANCORD)', 'Atividade do Assessor de Investimentos', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Administrar carteira de valores mobiliários de clientes'),
        (v_question_id, 'B', 'Prospectar e captar clientes para a instituição contratante'),
        (v_question_id, 'C', 'Prestar informações sobre os produtos oferecidos pela instituição'),
        (v_question_id, 'D', 'Receber ordens do cliente e transmiti-las à instituição intermediária');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A administração de carteiras exige registro específico na CVM e é vedada ao assessor de investimentos.', NOW()),
        (v_answer_id, 'B', 'Prospecção e captação de clientes são atividades típicas da função.', NOW()),
        (v_answer_id, 'C', 'Prestar informações sobre produtos distribuídos pela instituição integra a atividade.', NOW()),
        (v_answer_id, 'D', 'Receber e transmitir ordens é atividade própria do assessor vinculado à instituição.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Um cliente solicita ao assessor que mantenha temporariamente recursos na conta pessoal do próprio assessor. Qual deve ser a conduta?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Um cliente solicita ao assessor que mantenha temporariamente recursos na conta pessoal do próprio assessor. Qual deve ser a conduta?', 1, 'easy', 'mc_4', 'AAI — Agente Autônomo de Investimentos (ANCORD)', 'Atividade do Assessor de Investimentos', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Recusar, pois é vedado ao assessor manter recursos de clientes em conta própria'),
        (v_question_id, 'B', 'Aceitar, desde que documentado por escrito entre as partes'),
        (v_question_id, 'C', 'Aceitar, se o valor for inferior ao limite de movimentação diária'),
        (v_question_id, 'D', 'Aceitar, desde que informe a instituição posteriormente');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A movimentação de recursos de clientes por conta do assessor é expressamente vedada.', NOW()),
        (v_answer_id, 'B', 'Documentar não convalida uma prática proibida pela regulamentação.', NOW()),
        (v_answer_id, 'C', 'Não há limite de valor que autorize a conduta.', NOW()),
        (v_answer_id, 'D', 'Comunicar depois não afasta a vedação nem a responsabilidade.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Sistema Financeiro Nacional' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Sistema Financeiro Nacional' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Sistema Financeiro Nacional', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual órgão é responsável por normatizar e fiscalizar o mercado de valores mobiliários no Brasil?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual órgão é responsável por normatizar e fiscalizar o mercado de valores mobiliários no Brasil?', 1, 'easy', 'mc_4', 'AAI — Agente Autônomo de Investimentos (ANCORD)', 'Sistema Financeiro Nacional', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Comissão de Valores Mobiliários (CVM)'),
        (v_question_id, 'B', 'Banco Central do Brasil (BACEN)'),
        (v_question_id, 'C', 'Conselho Monetário Nacional (CMN)'),
        (v_question_id, 'D', 'Superintendência de Seguros Privados (SUSEP)');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A CVM regula, fiscaliza e disciplina o mercado de valores mobiliários.', NOW()),
        (v_answer_id, 'B', 'O BACEN atua sobre instituições financeiras, política monetária e sistema de pagamentos.', NOW()),
        (v_answer_id, 'C', 'O CMN é órgão normativo máximo, mas não exerce a fiscalização direta do mercado.', NOW()),
        (v_answer_id, 'D', 'A SUSEP fiscaliza os mercados de seguros, previdência aberta e capitalização.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Prevenção à Lavagem de Dinheiro (PLD/AML)' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Prevenção à Lavagem de Dinheiro (PLD/AML)' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Prevenção à Lavagem de Dinheiro (PLD/AML)', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a finalidade do procedimento "conheça seu cliente" (KYC) na prevenção à lavagem de dinheiro?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a finalidade do procedimento "conheça seu cliente" (KYC) na prevenção à lavagem de dinheiro?', 1, 'medium', 'mc_4', 'AAI — Agente Autônomo de Investimentos (ANCORD)', 'Prevenção à Lavagem de Dinheiro (PLD/AML)', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Identificar o cliente e verificar a compatibilidade entre sua capacidade financeira e as movimentações realizadas'),
        (v_question_id, 'B', 'Definir o perfil de risco apenas para fins de recomendação de produtos'),
        (v_question_id, 'C', 'Determinar a alíquota de imposto de renda aplicável às operações'),
        (v_question_id, 'D', 'Estabelecer o limite de crédito que o cliente pode obter');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O KYC busca conhecer a origem dos recursos e detectar incompatibilidades que sinalizem lavagem.', NOW()),
        (v_answer_id, 'B', 'A adequação de produtos é objeto do suitability, processo distinto do KYC.', NOW()),
        (v_answer_id, 'C', 'A tributação segue a legislação fiscal, sem relação com o KYC.', NOW()),
        (v_answer_id, 'D', 'Limites de crédito derivam de análise creditícia, não de PLD.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Mercado de Capitais — Produtos e Modalidades Operacionais' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Mercado de Capitais — Produtos e Modalidades Operacionais' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Mercado de Capitais — Produtos e Modalidades Operacionais', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Em uma oferta pública inicial (IPO) que consiste em distribuição primária, para onde vão os recursos captados?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Em uma oferta pública inicial (IPO) que consiste em distribuição primária, para onde vão os recursos captados?', 1, 'medium', 'mc_4', 'AAI — Agente Autônomo de Investimentos (ANCORD)', 'Mercado de Capitais — Produtos e Modalidades Operacionais', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Para o caixa da companhia emissora'),
        (v_question_id, 'B', 'Para os acionistas vendedores que alienaram suas ações'),
        (v_question_id, 'C', 'Integralmente para a instituição coordenadora da oferta'),
        (v_question_id, 'D', 'Para um fundo garantidor administrado pela bolsa');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Na distribuição primária são emitidas novas ações e os recursos capitalizam a companhia.', NOW()),
        (v_answer_id, 'B', 'Recursos que vão para acionistas vendedores caracterizam a distribuição secundária.', NOW()),
        (v_answer_id, 'C', 'O coordenador recebe comissão, não a totalidade dos recursos.', NOW()),
        (v_answer_id, 'D', 'Não há destinação dos recursos da oferta a fundo garantidor.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a diferença essencial entre ações ordinárias e preferenciais no mercado brasileiro?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a diferença essencial entre ações ordinárias e preferenciais no mercado brasileiro?', 1, 'easy', 'mc_4', 'AAI — Agente Autônomo de Investimentos (ANCORD)', 'Mercado de Capitais — Produtos e Modalidades Operacionais', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'As ordinárias conferem direito a voto; as preferenciais têm prioridade na distribuição de dividendos'),
        (v_question_id, 'B', 'As preferenciais conferem direito a voto; as ordinárias têm prioridade em dividendos'),
        (v_question_id, 'C', 'Ambas conferem direito a voto, diferindo apenas na liquidez'),
        (v_question_id, 'D', 'As preferenciais garantem recompra pela companhia a qualquer momento');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A ordinária dá voto em assembleia e a preferencial oferece preferência na distribuição de resultados.', NOW()),
        (v_answer_id, 'B', 'Inverte as características dos dois tipos de ação.', NOW()),
        (v_answer_id, 'C', 'A preferencial em regra não tem direito a voto pleno.', NOW()),
        (v_answer_id, 'D', 'Não há garantia de recompra a qualquer tempo pela companhia.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Mercado Financeiro — Outros Produtos' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Mercado Financeiro — Outros Produtos' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Mercado Financeiro — Outros Produtos', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual característica distingue a LCI e a LCA de um CDB quanto à tributação para pessoa física?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual característica distingue a LCI e a LCA de um CDB quanto à tributação para pessoa física?', 1, 'medium', 'mc_4', 'AAI — Agente Autônomo de Investimentos (ANCORD)', 'Mercado Financeiro — Outros Produtos', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'LCI e LCA são isentas de imposto de renda para pessoa física; o CDB é tributado pela tabela regressiva'),
        (v_question_id, 'B', 'Todas são isentas de imposto de renda para pessoa física'),
        (v_question_id, 'C', 'O CDB é isento e a LCI e a LCA são tributadas na fonte'),
        (v_question_id, 'D', 'Todas são tributadas com alíquota única de 15%');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. LCI e LCA têm isenção de IR para pessoa física; o CDB segue a tabela regressiva de 22,5% a 15%.', NOW()),
        (v_answer_id, 'B', 'O CDB não é isento para pessoa física.', NOW()),
        (v_answer_id, 'C', 'Inverte o tratamento tributário dos instrumentos.', NOW()),
        (v_answer_id, 'D', 'Não há alíquota única; a do CDB é regressiva conforme o prazo.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Mercados Derivativos' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Mercados Derivativos' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Mercados Derivativos', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Um investidor detém ações e compra uma opção de venda (put) sobre elas. Qual é o objetivo dessa operação?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Um investidor detém ações e compra uma opção de venda (put) sobre elas. Qual é o objetivo dessa operação?', 1, 'medium', 'mc_4', 'AAI — Agente Autônomo de Investimentos (ANCORD)', 'Mercados Derivativos', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Proteger a carteira contra queda, estabelecendo um preço mínimo de venda'),
        (v_question_id, 'B', 'Ampliar o ganho caso as ações subam fortemente'),
        (v_question_id, 'C', 'Eliminar o custo de carregamento da posição em ações'),
        (v_question_id, 'D', 'Garantir o recebimento de dividendos adicionais');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A put funciona como seguro: assegura o direito de vender ao preço de exercício, limitando a perda.', NOW()),
        (v_answer_id, 'B', 'O ganho na alta é potencializado por calls, não por puts.', NOW()),
        (v_answer_id, 'C', 'A compra da put tem custo (prêmio), aumentando o custo da posição.', NOW()),
        (v_answer_id, 'D', 'Dividendos decorrem da titularidade das ações, não da opção.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Fundos de Investimento' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Fundos de Investimento' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Fundos de Investimento', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que representa a taxa de administração em um fundo de investimento?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que representa a taxa de administração em um fundo de investimento?', 1, 'easy', 'mc_4', 'AAI — Agente Autônomo de Investimentos (ANCORD)', 'Fundos de Investimento', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A remuneração pela gestão e administração do fundo, já deduzida do valor da cota divulgado'),
        (v_question_id, 'B', 'Um valor cobrado do cotista apenas no momento do resgate'),
        (v_question_id, 'C', 'Uma taxa incidente somente quando o fundo supera seu benchmark'),
        (v_question_id, 'D', 'Um encargo pago diretamente pelo cotista fora do fundo');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A taxa é provisionada diariamente e já está refletida na cota divulgada ao cotista.', NOW()),
        (v_answer_id, 'B', 'Cobrança apenas no resgate caracterizaria taxa de saída, não de administração.', NOW()),
        (v_answer_id, 'C', 'Cobrança condicionada à superação do benchmark é a taxa de performance.', NOW()),
        (v_answer_id, 'D', 'A taxa é debitada do patrimônio do fundo, não paga por fora pelo cotista.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Administração de Risco' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Administração de Risco' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Administração de Risco', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que caracteriza o risco de liquidez de um ativo financeiro?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que caracteriza o risco de liquidez de um ativo financeiro?', 1, 'medium', 'mc_4', 'AAI — Agente Autônomo de Investimentos (ANCORD)', 'Administração de Risco', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A dificuldade de negociar o ativo rapidamente sem aceitar desconto relevante no preço'),
        (v_question_id, 'B', 'A possibilidade de o emissor não honrar os pagamentos devidos'),
        (v_question_id, 'C', 'A oscilação do preço do ativo em razão de fatores de mercado'),
        (v_question_id, 'D', 'A perda decorrente de falhas em processos internos da instituição');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O risco de liquidez se manifesta na necessidade de conceder deságio para vender com rapidez.', NOW()),
        (v_answer_id, 'B', 'O descumprimento pelo emissor caracteriza risco de crédito.', NOW()),
        (v_answer_id, 'C', 'A oscilação por fatores de mercado é risco de mercado.', NOW()),
        (v_answer_id, 'D', 'Falhas em processos internos configuram risco operacional.', NOW());
    END IF;

  END IF;

  -- ── CPA-10 — Certificação Profissional ANBIMA Série 10 ────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'CPA-10 — Certificação Profissional ANBIMA Série 10' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Sistema Financeiro Nacional e Participantes do Mercado' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Sistema Financeiro Nacional e Participantes do Mercado' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Sistema Financeiro Nacional e Participantes do Mercado', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a principal atribuição do Conselho Monetário Nacional (CMN) no Sistema Financeiro Nacional?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a principal atribuição do Conselho Monetário Nacional (CMN) no Sistema Financeiro Nacional?', 1, 'easy', 'mc_4', 'CPA-10 — Certificação Profissional ANBIMA Série 10', 'Sistema Financeiro Nacional e Participantes do Mercado', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Formular a política da moeda e do crédito, estabelecendo as diretrizes normativas do sistema'),
        (v_question_id, 'B', 'Executar a política monetária por meio de operações de mercado aberto'),
        (v_question_id, 'C', 'Fiscalizar diretamente as companhias abertas listadas em bolsa'),
        (v_question_id, 'D', 'Administrar as reservas internacionais do país');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O CMN é o órgão normativo máximo, responsável pelas diretrizes de moeda e crédito.', NOW()),
        (v_answer_id, 'B', 'A execução da política monetária cabe ao Banco Central.', NOW()),
        (v_answer_id, 'C', 'A fiscalização de companhias abertas é competência da CVM.', NOW()),
        (v_answer_id, 'D', 'A administração das reservas internacionais é atribuição do Banco Central.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Compliance, Ética e Análise do Perfil do Investidor' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Compliance, Ética e Análise do Perfil do Investidor' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Compliance, Ética e Análise do Perfil do Investidor', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é o objetivo do processo de suitability (análise do perfil do investidor)?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é o objetivo do processo de suitability (análise do perfil do investidor)?', 1, 'easy', 'mc_4', 'CPA-10 — Certificação Profissional ANBIMA Série 10', 'Compliance, Ética e Análise do Perfil do Investidor', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Verificar a adequação dos produtos recomendados ao perfil, objetivos e situação financeira do cliente'),
        (v_question_id, 'B', 'Determinar o limite de crédito disponível ao cliente'),
        (v_question_id, 'C', 'Calcular a tributação incidente sobre os investimentos'),
        (v_question_id, 'D', 'Definir a taxa de administração aplicável aos fundos');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O suitability assegura que o produto recomendado seja compatível com o perfil e os objetivos do investidor.', NOW()),
        (v_answer_id, 'B', 'Limites de crédito decorrem de análise creditícia.', NOW()),
        (v_answer_id, 'C', 'A tributação segue a legislação, independentemente do perfil.', NOW()),
        (v_answer_id, 'D', 'Taxas são definidas no regulamento do fundo.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual conduta caracteriza conflito de interesse na distribuição de produtos de investimento?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual conduta caracteriza conflito de interesse na distribuição de produtos de investimento?', 1, 'medium', 'mc_4', 'CPA-10 — Certificação Profissional ANBIMA Série 10', 'Compliance, Ética e Análise do Perfil do Investidor', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Recomendar o produto que gera maior remuneração ao distribuidor, em detrimento do mais adequado ao cliente'),
        (v_question_id, 'B', 'Informar ao cliente todos os custos e riscos do produto antes da contratação'),
        (v_question_id, 'C', 'Registrar formalmente o perfil do investidor antes da recomendação'),
        (v_question_id, 'D', 'Oferecer produtos de terceiros ao lado dos produtos da própria instituição');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Priorizar a própria remuneração em detrimento da adequação ao cliente é conflito de interesse.', NOW()),
        (v_answer_id, 'B', 'Transparência sobre custos e riscos é justamente o comportamento esperado.', NOW()),
        (v_answer_id, 'C', 'Registrar o perfil é obrigação regulatória, não conflito.', NOW()),
        (v_answer_id, 'D', 'Ofertar produtos de terceiros amplia as opções e não configura conflito por si só.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Noções de Economia e Finanças' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Noções de Economia e Finanças' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Noções de Economia e Finanças', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é o efeito esperado de uma elevação da taxa Selic sobre a atividade econômica no curto prazo?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é o efeito esperado de uma elevação da taxa Selic sobre a atividade econômica no curto prazo?', 1, 'medium', 'mc_4', 'CPA-10 — Certificação Profissional ANBIMA Série 10', 'Noções de Economia e Finanças', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Retração do consumo e do investimento, com tendência de desaceleração da inflação'),
        (v_question_id, 'B', 'Expansão imediata do crédito e aceleração do consumo'),
        (v_question_id, 'C', 'Aumento automático do salário real dos trabalhadores'),
        (v_question_id, 'D', 'Elevação imediata dos preços de todos os ativos financeiros');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Juros maiores encarecem o crédito e estimulam a poupança, esfriando a demanda agregada.', NOW()),
        (v_answer_id, 'B', 'Juros mais altos tendem a contrair, não expandir, o crédito.', NOW()),
        (v_answer_id, 'C', 'Não há efeito automático da Selic sobre o salário real.', NOW()),
        (v_answer_id, 'D', 'Ativos de renda variável e títulos prefixados tendem a se desvalorizar com a alta de juros.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Princípios de Investimento' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Princípios de Investimento' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Princípios de Investimento', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Considerando os três princípios básicos de investimento, qual afirmação está correta?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Considerando os três princípios básicos de investimento, qual afirmação está correta?', 1, 'medium', 'mc_4', 'CPA-10 — Certificação Profissional ANBIMA Série 10', 'Princípios de Investimento', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Existe uma relação de troca entre rentabilidade, liquidez e segurança, não sendo possível maximizar as três simultaneamente'),
        (v_question_id, 'B', 'É possível obter alta rentabilidade, alta liquidez e alta segurança ao mesmo tempo'),
        (v_question_id, 'C', 'A segurança é irrelevante quando o horizonte de investimento é longo'),
        (v_question_id, 'D', 'A liquidez é sempre inversamente proporcional à segurança');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O tripé impõe escolhas: privilegiar um atributo normalmente implica abrir mão de outro.', NOW()),
        (v_answer_id, 'B', 'Maximizar os três simultaneamente não é viável no mercado.', NOW()),
        (v_answer_id, 'C', 'A segurança permanece relevante em qualquer horizonte, ajustada ao perfil.', NOW()),
        (v_answer_id, 'D', 'Não há relação inversa obrigatória entre liquidez e segurança: a poupança tem ambas em grau elevado.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Fundos de Investimento' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Fundos de Investimento' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Fundos de Investimento', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que é o come-cotas em fundos de investimento?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que é o come-cotas em fundos de investimento?', 1, 'medium', 'mc_4', 'CPA-10 — Certificação Profissional ANBIMA Série 10', 'Fundos de Investimento', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A antecipação semestral do imposto de renda, realizada em maio e novembro, mediante redução da quantidade de cotas'),
        (v_question_id, 'B', 'A taxa cobrada pelo administrador para cobrir custos de custódia'),
        (v_question_id, 'C', 'O resgate compulsório de parte das cotas para pagamento da taxa de performance'),
        (v_question_id, 'D', 'A conversão automática de cotas entre classes do mesmo fundo');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Em fundos sujeitos ao regime, o IR é antecipado semestralmente pela redução do número de cotas.', NOW()),
        (v_answer_id, 'B', 'Custos de custódia integram os encargos do fundo, não o come-cotas.', NOW()),
        (v_answer_id, 'C', 'A taxa de performance é provisionada no patrimônio, sem relação com o come-cotas.', NOW()),
        (v_answer_id, 'D', 'Não se trata de conversão entre classes de cotas.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a responsabilidade do administrador de um fundo de investimento?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a responsabilidade do administrador de um fundo de investimento?', 1, 'easy', 'mc_4', 'CPA-10 — Certificação Profissional ANBIMA Série 10', 'Fundos de Investimento', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Responder pela constituição e pelo funcionamento do fundo perante os cotistas e o regulador'),
        (v_question_id, 'B', 'Selecionar os ativos que comporão a carteira do fundo'),
        (v_question_id, 'C', 'Garantir a rentabilidade mínima aos cotistas'),
        (v_question_id, 'D', 'Custodiar fisicamente os títulos em nome próprio');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O administrador responde pelo funcionamento regular do fundo e pelo cumprimento das normas.', NOW()),
        (v_answer_id, 'B', 'A seleção de ativos é atribuição do gestor.', NOW()),
        (v_answer_id, 'C', 'Fundos não podem prometer rentabilidade garantida.', NOW()),
        (v_answer_id, 'D', 'A guarda dos ativos cabe ao custodiante.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Instrumentos de Renda Fixa e Renda Variável' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Instrumentos de Renda Fixa e Renda Variável' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Instrumentos de Renda Fixa e Renda Variável', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual instrumento de renda fixa conta com a cobertura do Fundo Garantidor de Créditos (FGC)?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual instrumento de renda fixa conta com a cobertura do Fundo Garantidor de Créditos (FGC)?', 1, 'medium', 'mc_4', 'CPA-10 — Certificação Profissional ANBIMA Série 10', 'Instrumentos de Renda Fixa e Renda Variável', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Certificado de Depósito Bancário (CDB)'),
        (v_question_id, 'B', 'Debênture emitida por companhia aberta'),
        (v_question_id, 'C', 'Título público federal negociado no Tesouro Direto'),
        (v_question_id, 'D', 'Cota de fundo de investimento em renda fixa');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O CDB é emitido por instituição financeira e está coberto pelo FGC, dentro dos limites vigentes.', NOW()),
        (v_answer_id, 'B', 'Debêntures são emitidas por empresas não financeiras e não contam com o FGC.', NOW()),
        (v_answer_id, 'C', 'Títulos públicos têm a garantia do Tesouro Nacional, não do FGC.', NOW()),
        (v_answer_id, 'D', 'Cotas de fundos não são cobertas pelo FGC.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Como funciona a tabela regressiva de imposto de renda aplicável a investimentos de renda fixa?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Como funciona a tabela regressiva de imposto de renda aplicável a investimentos de renda fixa?', 1, 'medium', 'mc_4', 'CPA-10 — Certificação Profissional ANBIMA Série 10', 'Instrumentos de Renda Fixa e Renda Variável', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A alíquota diminui conforme aumenta o prazo da aplicação, de 22,5% até 15%'),
        (v_question_id, 'B', 'A alíquota aumenta conforme aumenta o prazo, de 15% até 22,5%'),
        (v_question_id, 'C', 'A alíquota é fixa em 20% independentemente do prazo'),
        (v_question_id, 'D', 'A alíquota varia conforme o valor aplicado, não conforme o prazo');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A tabela parte de 22,5% até 180 dias e cai a 15% acima de 720 dias.', NOW()),
        (v_answer_id, 'B', 'Inverte a lógica regressiva, que premia a permanência.', NOW()),
        (v_answer_id, 'C', 'Não há alíquota única para renda fixa.', NOW()),
        (v_answer_id, 'D', 'O critério é o prazo da aplicação, não o valor investido.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Previdência Complementar' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Previdência Complementar' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Previdência Complementar', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a principal diferença tributária entre PGBL e VGBL na fase de resgate?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a principal diferença tributária entre PGBL e VGBL na fase de resgate?', 1, 'hard', 'mc_4', 'CPA-10 — Certificação Profissional ANBIMA Série 10', 'Previdência Complementar', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'No PGBL o IR incide sobre o valor total resgatado; no VGBL incide apenas sobre os rendimentos'),
        (v_question_id, 'B', 'No PGBL o IR incide apenas sobre os rendimentos; no VGBL sobre o valor total'),
        (v_question_id, 'C', 'Ambos são isentos de imposto de renda no resgate'),
        (v_question_id, 'D', 'Ambos têm incidência exclusiva sobre o valor das contribuições');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O PGBL permite dedução na declaração e, por isso, tributa o montante total no resgate; o VGBL tributa só o ganho.', NOW()),
        (v_answer_id, 'B', 'Inverte o tratamento tributário dos dois planos.', NOW()),
        (v_answer_id, 'C', 'Não há isenção de IR no resgate desses planos.', NOW()),
        (v_answer_id, 'D', 'A base de cálculo não se restringe às contribuições.', NOW());
    END IF;

  END IF;

  -- ── CPA-20 — Certificação Profissional ANBIMA Série 20 ────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'CPA-20 — Certificação Profissional ANBIMA Série 20' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Sistema Financeiro Nacional e Participantes do Mercado' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Sistema Financeiro Nacional e Participantes do Mercado' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Sistema Financeiro Nacional e Participantes do Mercado', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual instituição atua como depositária central e câmara de compensação dos ativos negociados no mercado brasileiro?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual instituição atua como depositária central e câmara de compensação dos ativos negociados no mercado brasileiro?', 1, 'medium', 'mc_4', 'CPA-20 — Certificação Profissional ANBIMA Série 20', 'Sistema Financeiro Nacional e Participantes do Mercado', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'B3'),
        (v_question_id, 'B', 'ANBIMA'),
        (v_question_id, 'C', 'Banco Central do Brasil'),
        (v_question_id, 'D', 'Tesouro Nacional');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A B3 concentra as funções de bolsa, depositária central e contraparte central garantidora.', NOW()),
        (v_answer_id, 'B', 'A ANBIMA é entidade autorreguladora e representativa do mercado.', NOW()),
        (v_answer_id, 'C', 'O Banco Central opera o SPB, mas não é a depositária central dos ativos privados.', NOW()),
        (v_answer_id, 'D', 'O Tesouro Nacional é emissor da dívida pública federal.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Compliance, Ética e Análise do Perfil do Investidor' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Compliance, Ética e Análise do Perfil do Investidor' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Compliance, Ética e Análise do Perfil do Investidor', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Quando o cliente deseja aplicar em produto incompatível com seu perfil de suitability, qual é o procedimento correto da instituição?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Quando o cliente deseja aplicar em produto incompatível com seu perfil de suitability, qual é o procedimento correto da instituição?', 1, 'hard', 'mc_4', 'CPA-20 — Certificação Profissional ANBIMA Série 20', 'Compliance, Ética e Análise do Perfil do Investidor', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Alertar formalmente sobre a inadequação e obter declaração expressa de ciência antes de executar a operação'),
        (v_question_id, 'B', 'Recusar a operação em qualquer hipótese'),
        (v_question_id, 'C', 'Executar a operação normalmente, pois a decisão é do cliente'),
        (v_question_id, 'D', 'Reclassificar automaticamente o perfil do cliente para permitir a operação');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A norma exige alerta sobre a inadequação e ciência formal do investidor antes da execução.', NOW()),
        (v_answer_id, 'B', 'A recusa incondicional não é o procedimento previsto quando há ciência formal.', NOW()),
        (v_answer_id, 'C', 'Executar sem alertar descumpre o dever de informação da instituição.', NOW()),
        (v_answer_id, 'D', 'Reclassificar o perfil para acomodar a operação desvirtua o processo de suitability.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Economia e Finanças' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Economia e Finanças' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Economia e Finanças', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a diferença entre taxa de juros nominal e taxa de juros real?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a diferença entre taxa de juros nominal e taxa de juros real?', 1, 'medium', 'mc_4', 'CPA-20 — Certificação Profissional ANBIMA Série 20', 'Economia e Finanças', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A taxa real desconta o efeito da inflação da taxa nominal'),
        (v_question_id, 'B', 'A taxa nominal desconta o efeito da inflação da taxa real'),
        (v_question_id, 'C', 'A taxa real considera apenas os juros pagos por títulos públicos'),
        (v_question_id, 'D', 'Não há diferença prática entre as duas quando a inflação é positiva');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A taxa real expressa o ganho de poder de compra, expurgando a inflação da taxa nominal.', NOW()),
        (v_answer_id, 'B', 'Inverte a relação entre as duas taxas.', NOW()),
        (v_answer_id, 'C', 'A distinção vale para qualquer aplicação, não apenas títulos públicos.', NOW()),
        (v_answer_id, 'D', 'Com inflação positiva a diferença é justamente relevante.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual índice é utilizado como referência oficial para a meta de inflação no Brasil?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual índice é utilizado como referência oficial para a meta de inflação no Brasil?', 1, 'easy', 'mc_4', 'CPA-20 — Certificação Profissional ANBIMA Série 20', 'Economia e Finanças', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'IPCA'),
        (v_question_id, 'B', 'IGP-M'),
        (v_question_id, 'C', 'INCC'),
        (v_question_id, 'D', 'IPA');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O IPCA, calculado pelo IBGE, é o índice oficial do regime de metas de inflação.', NOW()),
        (v_answer_id, 'B', 'O IGP-M é bastante usado em contratos de aluguel, mas não é a meta oficial.', NOW()),
        (v_answer_id, 'C', 'O INCC mede a evolução dos custos da construção civil.', NOW()),
        (v_answer_id, 'D', 'O IPA acompanha preços no atacado e compõe o IGP.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Renda Fixa, Renda Variável e Derivativos' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Renda Fixa, Renda Variável e Derivativos' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Renda Fixa, Renda Variável e Derivativos', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que ocorre com o preço de um título público prefixado quando a expectativa de juros futuros aumenta?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que ocorre com o preço de um título público prefixado quando a expectativa de juros futuros aumenta?', 1, 'medium', 'mc_4', 'CPA-20 — Certificação Profissional ANBIMA Série 20', 'Renda Fixa, Renda Variável e Derivativos', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'O preço do título cai, pois seus fluxos fixos passam a ser descontados a uma taxa maior'),
        (v_question_id, 'B', 'O preço do título sobe, acompanhando a expectativa de juros'),
        (v_question_id, 'C', 'O preço permanece inalterado até o vencimento'),
        (v_question_id, 'D', 'O preço varia apenas se houver mudança no rating soberano');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A marcação a mercado reduz o valor presente dos fluxos quando a taxa de desconto sobe.', NOW()),
        (v_answer_id, 'B', 'A relação entre preço e taxa é inversa.', NOW()),
        (v_answer_id, 'C', 'O preço oscila diariamente pela marcação a mercado.', NOW()),
        (v_answer_id, 'D', 'O rating influencia o spread, mas a sensibilidade à taxa é o fator direto aqui.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a função da margem de garantia exigida em operações no mercado futuro?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a função da margem de garantia exigida em operações no mercado futuro?', 1, 'medium', 'mc_4', 'CPA-20 — Certificação Profissional ANBIMA Série 20', 'Renda Fixa, Renda Variável e Derivativos', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Cobrir o risco de inadimplência das partes diante das oscilações diárias de preço'),
        (v_question_id, 'B', 'Remunerar a corretora pela intermediação da operação'),
        (v_question_id, 'C', 'Antecipar o imposto de renda devido sobre os ganhos'),
        (v_question_id, 'D', 'Substituir a necessidade de ajuste diário das posições');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A margem é depositada como garantia contra o risco de a contraparte não honrar os ajustes.', NOW()),
        (v_answer_id, 'B', 'A remuneração da corretora é a corretagem, não a margem.', NOW()),
        (v_answer_id, 'C', 'A margem não tem natureza tributária.', NOW()),
        (v_answer_id, 'D', 'A margem complementa o ajuste diário, sem substituí-lo.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Fundos de Investimento' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Fundos de Investimento' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Fundos de Investimento', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual característica define um fundo exclusivo?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual característica define um fundo exclusivo?', 1, 'medium', 'mc_4', 'CPA-20 — Certificação Profissional ANBIMA Série 20', 'Fundos de Investimento', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Possui um único cotista, necessariamente investidor profissional'),
        (v_question_id, 'B', 'Aplica exclusivamente em títulos públicos federais'),
        (v_question_id, 'C', 'Não pode cobrar taxa de administração dos cotistas'),
        (v_question_id, 'D', 'Tem resgate garantido em D+0 para o cotista');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O fundo exclusivo é constituído para um único cotista, que deve ser investidor profissional.', NOW()),
        (v_answer_id, 'B', 'A política de investimento pode abranger diversas classes de ativos.', NOW()),
        (v_answer_id, 'C', 'Taxa de administração pode ser cobrada normalmente.', NOW()),
        (v_answer_id, 'D', 'O prazo de resgate segue o regulamento, sem garantia de D+0.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Mensuração e Gestão de Performance e Riscos' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Mensuração e Gestão de Performance e Riscos' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Mensuração e Gestão de Performance e Riscos', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que o índice de Sharpe indica na avaliação de um fundo de investimento?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que o índice de Sharpe indica na avaliação de um fundo de investimento?', 1, 'medium', 'mc_4', 'CPA-20 — Certificação Profissional ANBIMA Série 20', 'Mensuração e Gestão de Performance e Riscos', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'O retorno obtido acima do ativo livre de risco por unidade de risco total assumido'),
        (v_question_id, 'B', 'A rentabilidade nominal acumulada no período'),
        (v_question_id, 'C', 'A aderência da carteira ao índice de referência'),
        (v_question_id, 'D', 'A parcela do retorno atribuível ao gestor, descontado o mercado');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Sharpe relaciona o prêmio sobre o ativo livre de risco à volatilidade da carteira.', NOW()),
        (v_answer_id, 'B', 'A rentabilidade acumulada não pondera o risco assumido.', NOW()),
        (v_answer_id, 'C', 'A aderência ao benchmark é medida pelo tracking error.', NOW()),
        (v_answer_id, 'D', 'O retorno atribuível ao gestor além do mercado é o alfa.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que mede o tracking error de um fundo em relação ao seu benchmark?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que mede o tracking error de um fundo em relação ao seu benchmark?', 1, 'hard', 'mc_4', 'CPA-20 — Certificação Profissional ANBIMA Série 20', 'Mensuração e Gestão de Performance e Riscos', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'O desvio-padrão da diferença entre os retornos do fundo e os do benchmark'),
        (v_question_id, 'B', 'A diferença absoluta de rentabilidade acumulada no período'),
        (v_question_id, 'C', 'A correlação entre o fundo e o benchmark'),
        (v_question_id, 'D', 'O percentual do patrimônio investido em ativos do benchmark');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O tracking error é a volatilidade do retorno relativo, indicando o grau de aderência ao índice.', NOW()),
        (v_answer_id, 'B', 'A diferença acumulada é o retorno relativo, não sua dispersão.', NOW()),
        (v_answer_id, 'C', 'Correlação mede associação linear, não dispersão do diferencial.', NOW()),
        (v_answer_id, 'D', 'A composição da carteira não define, por si só, o tracking error.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Previdência Complementar' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Previdência Complementar' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Previdência Complementar', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'No regime de tributação regressiva de planos de previdência, qual é a alíquota aplicável a recursos acumulados por mais de 10 anos?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('No regime de tributação regressiva de planos de previdência, qual é a alíquota aplicável a recursos acumulados por mais de 10 anos?', 1, 'medium', 'mc_4', 'CPA-20 — Certificação Profissional ANBIMA Série 20', 'Previdência Complementar', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', '10%'),
        (v_question_id, 'B', '15%'),
        (v_question_id, 'C', '20%'),
        (v_question_id, 'D', '35%');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A tabela regressiva parte de 35% e chega a 10% para prazos superiores a 10 anos.', NOW()),
        (v_answer_id, 'B', '15% corresponde à faixa entre 8 e 10 anos.', NOW()),
        (v_answer_id, 'C', '20% corresponde à faixa entre 6 e 8 anos.', NOW()),
        (v_answer_id, 'D', '35% é a alíquota inicial, aplicável a prazos de até 2 anos.', NOW());
    END IF;

  END IF;

  -- ── CEA — Certificação de Especialista em Investimentos ANBIMA ────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'CEA — Certificação de Especialista em Investimentos ANBIMA' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Planejamento de Investimentos e API' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Planejamento de Investimentos e API' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Planejamento de Investimentos e API', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Ao elaborar uma política de investimento para o cliente, qual elemento deve ser definido antes da seleção de produtos?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Ao elaborar uma política de investimento para o cliente, qual elemento deve ser definido antes da seleção de produtos?', 1, 'medium', 'mc_4', 'CEA — Certificação de Especialista em Investimentos ANBIMA', 'Planejamento de Investimentos e API', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Os objetivos, o horizonte de investimento e a tolerância a risco do investidor'),
        (v_question_id, 'B', 'A taxa de administração máxima aceitável dos fundos disponíveis'),
        (v_question_id, 'C', 'O ranking de rentabilidade dos produtos nos últimos 12 meses'),
        (v_question_id, 'D', 'A quantidade de instituições com as quais o cliente trabalha');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Objetivos, prazo e tolerância a risco orientam toda a alocação subsequente.', NOW()),
        (v_answer_id, 'B', 'Custos importam, mas são restrição operacional, não o ponto de partida.', NOW()),
        (v_answer_id, 'C', 'Rentabilidade passada não é critério inicial de política de investimento.', NOW()),
        (v_answer_id, 'D', 'O número de instituições é detalhe operacional irrelevante para a política.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual conceito descreve a distribuição estratégica do patrimônio entre classes de ativos, responsável pela maior parte da variabilidade dos retornos de longo prazo?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual conceito descreve a distribuição estratégica do patrimônio entre classes de ativos, responsável pela maior parte da variabilidade dos retornos de longo prazo?', 1, 'medium', 'mc_4', 'CEA — Certificação de Especialista em Investimentos ANBIMA', 'Planejamento de Investimentos e API', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Asset allocation'),
        (v_question_id, 'B', 'Market timing'),
        (v_question_id, 'C', 'Stock picking'),
        (v_question_id, 'D', 'Alavancagem financeira');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A alocação entre classes de ativos é o principal determinante da variabilidade dos retornos no longo prazo.', NOW()),
        (v_answer_id, 'B', 'Market timing tenta antecipar movimentos de mercado, com resultados historicamente inconsistentes.', NOW()),
        (v_answer_id, 'C', 'Stock picking é a seleção de papéis individuais dentro de uma classe.', NOW()),
        (v_answer_id, 'D', 'Alavancagem amplifica resultados, mas não é a decisão estrutural de alocação.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Produtos de Renda Fixa' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Produtos de Renda Fixa' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Produtos de Renda Fixa', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a característica de um título público indexado ao IPCA, como o Tesouro IPCA+?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a característica de um título público indexado ao IPCA, como o Tesouro IPCA+?', 1, 'medium', 'mc_4', 'CEA — Certificação de Especialista em Investimentos ANBIMA', 'Produtos de Renda Fixa', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Paga uma taxa real acordada acrescida da variação do IPCA, protegendo o poder de compra'),
        (v_question_id, 'B', 'Paga apenas a variação do IPCA, sem juros reais'),
        (v_question_id, 'C', 'Paga taxa prefixada, sem qualquer indexação à inflação'),
        (v_question_id, 'D', 'Tem rentabilidade atrelada exclusivamente à taxa Selic');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O título combina juro real contratado com correção pela inflação medida pelo IPCA.', NOW()),
        (v_answer_id, 'B', 'Além da correção monetária, há uma taxa real pactuada.', NOW()),
        (v_answer_id, 'C', 'Título sem indexação é o Tesouro Prefixado.', NOW()),
        (v_answer_id, 'D', 'Indexação à Selic caracteriza o Tesouro Selic.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que representa a duration de uma carteira de renda fixa?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que representa a duration de uma carteira de renda fixa?', 1, 'hard', 'mc_4', 'CEA — Certificação de Especialista em Investimentos ANBIMA', 'Produtos de Renda Fixa', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Uma medida de sensibilidade do valor da carteira a variações nas taxas de juros'),
        (v_question_id, 'B', 'O prazo máximo de vencimento entre os títulos da carteira'),
        (v_question_id, 'C', 'O percentual da carteira alocado em títulos pós-fixados'),
        (v_question_id, 'D', 'A taxa média de retorno esperada até o vencimento');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Quanto maior a duration, maior a oscilação do valor da carteira para uma dada variação de juros.', NOW()),
        (v_answer_id, 'B', 'O prazo máximo não pondera os fluxos intermediários.', NOW()),
        (v_answer_id, 'C', 'A duration não expressa composição entre pré e pós-fixados.', NOW()),
        (v_answer_id, 'D', 'O retorno esperado até o vencimento é a taxa interna de retorno, não a duration.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Produtos de Renda Variável' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Produtos de Renda Variável' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Produtos de Renda Variável', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que é o índice preço/lucro (P/L) de uma ação?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que é o índice preço/lucro (P/L) de uma ação?', 1, 'medium', 'mc_4', 'CEA — Certificação de Especialista em Investimentos ANBIMA', 'Produtos de Renda Variável', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A razão entre o preço da ação e o lucro por ação, indicando quantos anos de lucro pagam o preço atual'),
        (v_question_id, 'B', 'A razão entre o lucro líquido e o patrimônio líquido da companhia'),
        (v_question_id, 'C', 'O percentual do lucro distribuído aos acionistas na forma de dividendos'),
        (v_question_id, 'D', 'A relação entre o preço da ação e seu valor patrimonial');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O P/L compara o preço pago por ação ao lucro que ela gera, sendo múltiplo de avaliação relativa.', NOW()),
        (v_answer_id, 'B', 'Lucro sobre patrimônio líquido é o ROE.', NOW()),
        (v_answer_id, 'C', 'A parcela distribuída do lucro é o payout.', NOW()),
        (v_answer_id, 'D', 'Preço sobre valor patrimonial é o índice P/VPA.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é o tratamento tributário das operações de day trade com ações para pessoa física?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é o tratamento tributário das operações de day trade com ações para pessoa física?', 1, 'hard', 'mc_4', 'CEA — Certificação de Especialista em Investimentos ANBIMA', 'Produtos de Renda Variável', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Alíquota de 20% sobre o ganho líquido, sem a isenção mensal aplicável às operações comuns'),
        (v_question_id, 'B', 'Alíquota de 15% com isenção para vendas até R$ 20 mil no mês'),
        (v_question_id, 'C', 'Isenção integral de imposto de renda'),
        (v_question_id, 'D', 'Alíquota de 27,5% conforme a tabela progressiva');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Day trade é tributado a 20% e não se beneficia da isenção mensal das operações comuns.', NOW()),
        (v_answer_id, 'B', 'A alíquota de 15% e a isensão de R$ 20 mil aplicam-se às operações comuns, não ao day trade.', NOW()),
        (v_answer_id, 'C', 'Não há isenção para day trade.', NOW()),
        (v_answer_id, 'D', 'A tabela progressiva não se aplica a ganhos líquidos em renda variável.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Fundos de Investimento' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Fundos de Investimento' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Fundos de Investimento', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a característica principal de um fundo de investimento em direitos creditórios (FIDC)?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a característica principal de um fundo de investimento em direitos creditórios (FIDC)?', 1, 'medium', 'mc_4', 'CEA — Certificação de Especialista em Investimentos ANBIMA', 'Fundos de Investimento', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Aplica parcela preponderante do patrimônio em direitos creditórios originados de operações comerciais ou financeiras'),
        (v_question_id, 'B', 'Aplica exclusivamente em ações de companhias abertas'),
        (v_question_id, 'C', 'Tem liquidez diária garantida a todos os cotistas'),
        (v_question_id, 'D', 'É acessível a qualquer investidor de varejo sem restrição');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O FIDC tem por objeto preponderante a aquisição de direitos creditórios (recebíveis).', NOW()),
        (v_answer_id, 'B', 'Investimento preponderante em ações caracteriza fundo de ações.', NOW()),
        (v_answer_id, 'C', 'FIDCs costumam ter liquidez restrita, muitas vezes fechados a resgates.', NOW()),
        (v_answer_id, 'D', 'O acesso é normalmente restrito a investidores qualificados ou profissionais.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Derivativos' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Derivativos' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Derivativos', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é o objetivo de uma operação de swap de taxa de juros?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é o objetivo de uma operação de swap de taxa de juros?', 1, 'medium', 'mc_4', 'CEA — Certificação de Especialista em Investimentos ANBIMA', 'Derivativos', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Trocar fluxos de pagamento entre indexadores distintos, como prefixado por CDI'),
        (v_question_id, 'B', 'Adquirir o direito, mas não a obrigação, de comprar um ativo no futuro'),
        (v_question_id, 'C', 'Padronizar contratos para negociação em bolsa com ajuste diário'),
        (v_question_id, 'D', 'Antecipar o recebimento de dividendos de uma carteira de ações');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O swap troca fluxos financeiros referenciados a indexadores diferentes entre as partes.', NOW()),
        (v_answer_id, 'B', 'Direito sem obrigação descreve uma opção.', NOW()),
        (v_answer_id, 'C', 'Padronização em bolsa com ajuste diário caracteriza contratos futuros.', NOW()),
        (v_answer_id, 'D', 'Swaps de juros não antecipam dividendos.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Análise de Investimentos' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Análise de Investimentos' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Análise de Investimentos', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'No método do fluxo de caixa descontado, qual é o efeito de aumentar a taxa de desconto sobre o valor presente calculado?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('No método do fluxo de caixa descontado, qual é o efeito de aumentar a taxa de desconto sobre o valor presente calculado?', 1, 'medium', 'mc_4', 'CEA — Certificação de Especialista em Investimentos ANBIMA', 'Análise de Investimentos', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'O valor presente diminui'),
        (v_question_id, 'B', 'O valor presente aumenta'),
        (v_question_id, 'C', 'O valor presente permanece constante'),
        (v_question_id, 'D', 'O efeito depende exclusivamente do prazo dos fluxos');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Descontar os mesmos fluxos a uma taxa maior reduz seu valor presente.', NOW()),
        (v_answer_id, 'B', 'A relação entre taxa de desconto e valor presente é inversa.', NOW()),
        (v_answer_id, 'C', 'O valor presente é diretamente sensível à taxa utilizada.', NOW()),
        (v_answer_id, 'D', 'O prazo amplifica o efeito, mas o sentido da variação é sempre de redução.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Finanças Pessoais e Planejamento de Aposentadoria' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Finanças Pessoais e Planejamento de Aposentadoria' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Finanças Pessoais e Planejamento de Aposentadoria', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a principal função da reserva de emergência no planejamento financeiro pessoal?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a principal função da reserva de emergência no planejamento financeiro pessoal?', 1, 'easy', 'mc_4', 'CEA — Certificação de Especialista em Investimentos ANBIMA', 'Finanças Pessoais e Planejamento de Aposentadoria', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Cobrir despesas imprevistas sem exigir o resgate de investimentos de longo prazo em momento desfavorável'),
        (v_question_id, 'B', 'Maximizar a rentabilidade da carteira no longo prazo'),
        (v_question_id, 'C', 'Servir como garantia para obtenção de crédito consignado'),
        (v_question_id, 'D', 'Concentrar recursos em ativos de maior potencial de valorização');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A reserva protege o plano de longo prazo, evitando liquidações forçadas em momentos ruins.', NOW()),
        (v_answer_id, 'B', 'A reserva prioriza liquidez e segurança, não rentabilidade máxima.', NOW()),
        (v_answer_id, 'C', 'Não tem função de garantia de crédito.', NOW()),
        (v_answer_id, 'D', 'Concentrar em ativos voláteis contraria a finalidade da reserva.', NOW());
    END IF;

  END IF;

  -- ── CFP — Planejador Financeiro Pessoal (PLANEJAR) ────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'CFP — Planejador Financeiro Pessoal (PLANEJAR)' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Planejamento Financeiro: Princípios, Processos e Habilidades' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Planejamento Financeiro: Princípios, Processos e Habilidades' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Planejamento Financeiro: Princípios, Processos e Habilidades', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a etapa inicial do processo de planejamento financeiro pessoal?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a etapa inicial do processo de planejamento financeiro pessoal?', 1, 'easy', 'mc_4', 'CFP — Planejador Financeiro Pessoal (PLANEJAR)', 'Planejamento Financeiro: Princípios, Processos e Habilidades', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Coletar dados e compreender a situação financeira e os objetivos do cliente'),
        (v_question_id, 'B', 'Recomendar produtos de investimento adequados ao perfil'),
        (v_question_id, 'C', 'Implementar a estratégia de alocação definida'),
        (v_question_id, 'D', 'Revisar periodicamente os resultados obtidos');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Sem entender a situação e os objetivos, qualquer recomendação seria arbitrária.', NOW()),
        (v_answer_id, 'B', 'Recomendações vêm após o diagnóstico da situação do cliente.', NOW()),
        (v_answer_id, 'C', 'A implementação sucede a definição e a aprovação do plano.', NOW()),
        (v_answer_id, 'D', 'A revisão é a etapa contínua final do processo.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Gestão Financeira' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Gestão Financeira' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Gestão Financeira', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual indicador mede a proporção do patrimônio do cliente financiada por dívidas?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual indicador mede a proporção do patrimônio do cliente financiada por dívidas?', 1, 'medium', 'mc_4', 'CFP — Planejador Financeiro Pessoal (PLANEJAR)', 'Gestão Financeira', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Índice de endividamento, que relaciona passivos totais ao ativo total'),
        (v_question_id, 'B', 'Índice de liquidez corrente, que relaciona ativos e passivos circulantes'),
        (v_question_id, 'C', 'Taxa de poupança mensal sobre a renda líquida'),
        (v_question_id, 'D', 'Índice de cobertura de despesas essenciais');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O índice de endividamento revela quanto do patrimônio está comprometido com terceiros.', NOW()),
        (v_answer_id, 'B', 'A liquidez corrente trata da capacidade de honrar obrigações de curto prazo.', NOW()),
        (v_answer_id, 'C', 'A taxa de poupança mede a formação de capital, não o endividamento.', NOW()),
        (v_answer_id, 'D', 'A cobertura de despesas avalia a suficiência da reserva de emergência.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a recomendação usual para o tamanho da reserva de emergência de um profissional com renda estável?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a recomendação usual para o tamanho da reserva de emergência de um profissional com renda estável?', 1, 'easy', 'mc_4', 'CFP — Planejador Financeiro Pessoal (PLANEJAR)', 'Gestão Financeira', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'De três a seis meses das despesas essenciais'),
        (v_question_id, 'B', 'Equivalente a um mês de renda bruta'),
        (v_question_id, 'C', 'Equivalente a cinco anos de despesas essenciais'),
        (v_question_id, 'D', 'Não é necessária quando há seguro de vida contratado');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Para renda estável, de três a seis meses de despesas essenciais é a faixa usualmente recomendada.', NOW()),
        (v_answer_id, 'B', 'Um mês é insuficiente para absorver desemprego ou imprevistos relevantes.', NOW()),
        (v_answer_id, 'C', 'Cinco anos imobilizaria capital excessivo em ativos de baixa rentabilidade.', NOW()),
        (v_answer_id, 'D', 'Seguro de vida cobre outro risco e não substitui a reserva de liquidez.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Planejamento de Investimentos e Gestão de Ativos' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Planejamento de Investimentos e Gestão de Ativos' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Planejamento de Investimentos e Gestão de Ativos', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'O que caracteriza a fronteira eficiente na teoria moderna de carteiras?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('O que caracteriza a fronteira eficiente na teoria moderna de carteiras?', 1, 'hard', 'mc_4', 'CFP — Planejador Financeiro Pessoal (PLANEJAR)', 'Planejamento de Investimentos e Gestão de Ativos', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'O conjunto de carteiras que oferecem o maior retorno esperado para cada nível de risco'),
        (v_question_id, 'B', 'A carteira composta exclusivamente pelo ativo livre de risco'),
        (v_question_id, 'C', 'O conjunto de carteiras com risco zero e retorno positivo'),
        (v_question_id, 'D', 'A carteira que maximiza o retorno sem qualquer restrição de risco');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A fronteira eficiente reúne as combinações ótimas de risco e retorno esperado.', NOW()),
        (v_answer_id, 'B', 'O ativo livre de risco é um ponto de referência, não a fronteira.', NOW()),
        (v_answer_id, 'C', 'Carteiras com risco zero e retorno relevante não existem no mercado.', NOW()),
        (v_answer_id, 'D', 'Maximizar retorno sem restrição de risco ignora a natureza do problema de otimização.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Planejamento de Seguros e Gestão de Riscos' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Planejamento de Seguros e Gestão de Riscos' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Planejamento de Seguros e Gestão de Riscos', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a função da franquia em um contrato de seguro?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a função da franquia em um contrato de seguro?', 1, 'medium', 'mc_4', 'CFP — Planejador Financeiro Pessoal (PLANEJAR)', 'Planejamento de Seguros e Gestão de Riscos', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Estabelecer a parcela do prejuízo que fica a cargo do segurado, reduzindo o prêmio e desestimulando sinistros pequenos'),
        (v_question_id, 'B', 'Definir o valor máximo que a seguradora pagará em caso de sinistro'),
        (v_question_id, 'C', 'Determinar o prazo de carência antes do início da cobertura'),
        (v_question_id, 'D', 'Corrigir monetariamente a importância segurada ao longo da vigência');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A franquia transfere ao segurado a primeira parcela do prejuízo, barateando o prêmio.', NOW()),
        (v_answer_id, 'B', 'O teto de indenização é a importância segurada, não a franquia.', NOW()),
        (v_answer_id, 'C', 'O prazo antes do início da cobertura é a carência.', NOW()),
        (v_answer_id, 'D', 'A atualização do valor segurado decorre de cláusula de correção específica.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Planejamento da Aposentadoria' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Planejamento da Aposentadoria' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Planejamento da Aposentadoria', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Ao projetar a necessidade de recursos para a aposentadoria, qual variável costuma ser subestimada e compromete o plano?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Ao projetar a necessidade de recursos para a aposentadoria, qual variável costuma ser subestimada e compromete o plano?', 1, 'hard', 'mc_4', 'CFP — Planejador Financeiro Pessoal (PLANEJAR)', 'Planejamento da Aposentadoria', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A longevidade do cliente combinada ao efeito da inflação sobre o poder de compra'),
        (v_question_id, 'B', 'O valor nominal acumulado na data da aposentadoria'),
        (v_question_id, 'C', 'A quantidade de planos previdenciários contratados'),
        (v_question_id, 'D', 'A frequência de contribuições mensais realizadas');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Viver mais do que o previsto e a corrosão inflacionária são os principais riscos do plano de aposentadoria.', NOW()),
        (v_answer_id, 'B', 'O valor nominal é conhecido; o problema está no poder de compra futuro.', NOW()),
        (v_answer_id, 'C', 'O número de planos não determina a suficiência dos recursos.', NOW()),
        (v_answer_id, 'D', 'A frequência de aportes é variável controlada e facilmente observável.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Planejamento Tributário' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Planejamento Tributário' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Planejamento Tributário', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a diferença entre elisão e evasão fiscal?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a diferença entre elisão e evasão fiscal?', 1, 'medium', 'mc_4', 'CFP — Planejador Financeiro Pessoal (PLANEJAR)', 'Planejamento Tributário', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A elisão é o planejamento lícito para reduzir a carga tributária; a evasão é a sonegação, prática ilícita'),
        (v_question_id, 'B', 'A elisão é ilícita e a evasão é lícita'),
        (v_question_id, 'C', 'Ambas são lícitas, diferindo apenas no momento em que ocorrem'),
        (v_question_id, 'D', 'Ambas são ilícitas, diferindo apenas na pena aplicável');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A elisão usa meios legais antes do fato gerador; a evasão oculta ou falseia o fato gerador.', NOW()),
        (v_answer_id, 'B', 'Inverte completamente os conceitos.', NOW()),
        (v_answer_id, 'C', 'A evasão é ilícita em qualquer momento.', NOW()),
        (v_answer_id, 'D', 'A elisão é lícita e não está sujeita a penalidade.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Planejamento Patrimonial e Sucessório' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Planejamento Patrimonial e Sucessório' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Planejamento Patrimonial e Sucessório', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual instrumento permite ao titular definir em vida a destinação de seus bens após o falecimento, respeitados os limites da legítima?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual instrumento permite ao titular definir em vida a destinação de seus bens após o falecimento, respeitados os limites da legítima?', 1, 'medium', 'mc_4', 'CFP — Planejador Financeiro Pessoal (PLANEJAR)', 'Planejamento Patrimonial e Sucessório', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Testamento'),
        (v_question_id, 'B', 'Procuração por instrumento público'),
        (v_question_id, 'C', 'Contrato de mútuo entre familiares'),
        (v_question_id, 'D', 'Declaração anual de imposto de renda');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O testamento dispõe sobre a parcela disponível do patrimônio, respeitada a legítima dos herdeiros necessários.', NOW()),
        (v_answer_id, 'B', 'A procuração produz efeitos em vida e se extingue com a morte do outorgante.', NOW()),
        (v_answer_id, 'C', 'O mútuo é contrato de empréstimo, sem função sucessória.', NOW()),
        (v_answer_id, 'D', 'A declaração de IR é obrigação acessória fiscal.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'No Brasil, qual é a fração do patrimônio que constitui a legítima, reservada aos herdeiros necessários?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('No Brasil, qual é a fração do patrimônio que constitui a legítima, reservada aos herdeiros necessários?', 1, 'hard', 'mc_4', 'CFP — Planejador Financeiro Pessoal (PLANEJAR)', 'Planejamento Patrimonial e Sucessório', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', '50% do patrimônio'),
        (v_question_id, 'B', '25% do patrimônio'),
        (v_question_id, 'C', '75% do patrimônio'),
        (v_question_id, 'D', '100% do patrimônio');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O Código Civil reserva metade do patrimônio aos herdeiros necessários, deixando a outra metade disponível.', NOW()),
        (v_answer_id, 'B', '25% subestima a proteção legal conferida aos herdeiros necessários.', NOW()),
        (v_answer_id, 'C', '75% excede a fração legalmente reservada.', NOW()),
        (v_answer_id, 'D', 'Se fosse integral, não haveria parcela disponível para testamento.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Psicologia no Planejamento Financeiro' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Psicologia no Planejamento Financeiro' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Psicologia no Planejamento Financeiro', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual prática ajuda o planejador a lidar com um cliente que demonstra excesso de confiança nas próprias decisões de investimento?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual prática ajuda o planejador a lidar com um cliente que demonstra excesso de confiança nas próprias decisões de investimento?', 1, 'medium', 'mc_4', 'CFP — Planejador Financeiro Pessoal (PLANEJAR)', 'Psicologia no Planejamento Financeiro', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Apresentar evidências objetivas de desempenho histórico e registrar as decisões para revisão posterior'),
        (v_question_id, 'B', 'Concordar com todas as decisões para preservar o relacionamento'),
        (v_question_id, 'C', 'Assumir integralmente as decisões sem consultar o cliente'),
        (v_question_id, 'D', 'Concentrar a carteira nos ativos preferidos pelo cliente');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Confrontar o viés com dados e criar registro auditável favorece o autoconhecimento e a disciplina.', NOW()),
        (v_answer_id, 'B', 'Concordar sempre reforça o viés e desvirtua o papel do planejador.', NOW()),
        (v_answer_id, 'C', 'Decidir sem consultar viola o dever de comunicação com o cliente.', NOW()),
        (v_answer_id, 'D', 'Concentrar na preferência do cliente amplifica o risco decorrente do viés.', NOW());
    END IF;

  END IF;

  -- ── Kubernetes CKA ────────────────────────────────────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'Kubernetes CKA' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Cluster Architecture, Installation and Configuration' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Cluster Architecture, Installation and Configuration' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Cluster Architecture, Installation and Configuration', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual componente do control plane do Kubernetes é responsável por atribuir Pods pendentes a nós adequados?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual componente do control plane do Kubernetes é responsável por atribuir Pods pendentes a nós adequados?', 1, 'easy', 'mc_4', 'Kubernetes CKA', 'Cluster Architecture, Installation and Configuration', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'kube-scheduler'),
        (v_question_id, 'B', 'kube-controller-manager'),
        (v_question_id, 'C', 'kubelet'),
        (v_question_id, 'D', 'etcd');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O kube-scheduler observa Pods sem nó atribuído e escolhe um nó viável conforme recursos, afinidades e taints.', NOW()),
        (v_answer_id, 'B', 'O controller-manager executa laços de controle como ReplicaSet e Node, mas não faz o agendamento.', NOW()),
        (v_answer_id, 'C', 'O kubelet roda em cada nó e executa os Pods já atribuídos a ele.', NOW()),
        (v_answer_id, 'D', 'O etcd é o armazenamento de estado do cluster, sem lógica de agendamento.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual objeto do Kubernetes concede permissões a um ServiceAccount dentro de um namespace específico?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual objeto do Kubernetes concede permissões a um ServiceAccount dentro de um namespace específico?', 1, 'medium', 'mc_4', 'Kubernetes CKA', 'Cluster Architecture, Installation and Configuration', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'RoleBinding, associando um Role ao ServiceAccount'),
        (v_question_id, 'B', 'ClusterRoleBinding, obrigatoriamente'),
        (v_question_id, 'C', 'NetworkPolicy aplicada ao namespace'),
        (v_question_id, 'D', 'ResourceQuota definida no namespace');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O RoleBinding vincula um Role (escopo de namespace) a um sujeito, como um ServiceAccount.', NOW()),
        (v_answer_id, 'B', 'ClusterRoleBinding concede permissões em todo o cluster, mais amplo que o necessário.', NOW()),
        (v_answer_id, 'C', 'NetworkPolicy controla tráfego de rede entre Pods, não autorização de API.', NOW()),
        (v_answer_id, 'D', 'ResourceQuota limita consumo de recursos, sem relação com RBAC.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Workloads and Scheduling' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Workloads and Scheduling' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Workloads and Scheduling', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual recurso garante que exatamente um Pod seja executado em cada nó do cluster, incluindo nós adicionados posteriormente?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual recurso garante que exatamente um Pod seja executado em cada nó do cluster, incluindo nós adicionados posteriormente?', 1, 'easy', 'mc_4', 'Kubernetes CKA', 'Workloads and Scheduling', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'DaemonSet'),
        (v_question_id, 'B', 'Deployment com replicas igual ao número de nós'),
        (v_question_id, 'C', 'StatefulSet'),
        (v_question_id, 'D', 'Job com paralelismo definido');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O DaemonSet mantém uma cópia do Pod em cada nó elegível e cobre nós novos automaticamente.', NOW()),
        (v_answer_id, 'B', 'Um Deployment não garante distribuição de um Pod por nó nem acompanha a entrada de novos nós.', NOW()),
        (v_answer_id, 'C', 'StatefulSet gerencia workloads com identidade estável e armazenamento persistente ordenado.', NOW()),
        (v_answer_id, 'D', 'Jobs executam tarefas até a conclusão, sem vínculo com a topologia de nós.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual mecanismo impede que Pods sejam agendados em um nó, a menos que declarem explicitamente uma tolerância correspondente?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual mecanismo impede que Pods sejam agendados em um nó, a menos que declarem explicitamente uma tolerância correspondente?', 1, 'medium', 'mc_4', 'Kubernetes CKA', 'Workloads and Scheduling', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Taints aplicados ao nó'),
        (v_question_id, 'B', 'Labels aplicados ao nó'),
        (v_question_id, 'C', 'nodeSelector definido no Pod'),
        (v_question_id, 'D', 'PodDisruptionBudget');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Taints repelem Pods do nó, salvo aqueles que declaram a toleration correspondente.', NOW()),
        (v_answer_id, 'B', 'Labels apenas identificam o nó; sozinhos não repelem Pods.', NOW()),
        (v_answer_id, 'C', 'nodeSelector atrai Pods para nós com certos labels, mas não impede outros Pods de chegarem lá.', NOW()),
        (v_answer_id, 'D', 'PodDisruptionBudget limita interrupções voluntárias, sem influenciar agendamento inicial.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Services and Networking' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Services and Networking' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Services and Networking', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual tipo de Service expõe uma aplicação apenas dentro do cluster, atribuindo um IP virtual estável?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual tipo de Service expõe uma aplicação apenas dentro do cluster, atribuindo um IP virtual estável?', 1, 'easy', 'mc_4', 'Kubernetes CKA', 'Services and Networking', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'ClusterIP'),
        (v_question_id, 'B', 'NodePort'),
        (v_question_id, 'C', 'LoadBalancer'),
        (v_question_id, 'D', 'ExternalName');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O ClusterIP é o tipo padrão e só é alcançável de dentro do cluster.', NOW()),
        (v_answer_id, 'B', 'NodePort abre uma porta em cada nó, tornando o serviço acessível externamente.', NOW()),
        (v_answer_id, 'C', 'LoadBalancer provisiona um balanceador externo do provedor de nuvem.', NOW()),
        (v_answer_id, 'D', 'ExternalName mapeia o serviço para um nome DNS externo, sem proxy.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Por padrão, qual é o comportamento de rede entre Pods de namespaces diferentes em um cluster sem NetworkPolicies?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Por padrão, qual é o comportamento de rede entre Pods de namespaces diferentes em um cluster sem NetworkPolicies?', 1, 'medium', 'mc_4', 'Kubernetes CKA', 'Services and Networking', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Todo o tráfego é permitido entre quaisquer Pods do cluster'),
        (v_question_id, 'B', 'Todo o tráfego entre namespaces distintos é bloqueado'),
        (v_question_id, 'C', 'Apenas tráfego de saída é permitido'),
        (v_question_id, 'D', 'O tráfego depende do CNI e é sempre negado por padrão');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O modelo de rede do Kubernetes é plano: sem NetworkPolicy, qualquer Pod alcança qualquer outro.', NOW()),
        (v_answer_id, 'B', 'O isolamento entre namespaces só existe quando NetworkPolicies são aplicadas.', NOW()),
        (v_answer_id, 'C', 'Não há restrição direcional padrão no modelo de rede.', NOW()),
        (v_answer_id, 'D', 'Embora o CNI implemente as políticas, o padrão do Kubernetes é permitir todo o tráfego.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Storage' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Storage' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Storage', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual objeto permite que um Pod solicite armazenamento persistente sem conhecer os detalhes do backend de storage?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual objeto permite que um Pod solicite armazenamento persistente sem conhecer os detalhes do backend de storage?', 1, 'easy', 'mc_4', 'Kubernetes CKA', 'Storage', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'PersistentVolumeClaim'),
        (v_question_id, 'B', 'PersistentVolume'),
        (v_question_id, 'C', 'ConfigMap'),
        (v_question_id, 'D', 'EmptyDir volume');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O PVC é a solicitação de armazenamento feita pelo consumidor, ligada dinamicamente a um PV.', NOW()),
        (v_answer_id, 'B', 'O PersistentVolume representa o recurso de armazenamento provisionado, normalmente pelo administrador.', NOW()),
        (v_answer_id, 'C', 'ConfigMap armazena dados de configuração, não volumes de dados persistentes.', NOW()),
        (v_answer_id, 'D', 'EmptyDir é efêmero e perde os dados quando o Pod é removido do nó.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual campo de uma StorageClass define o que acontece ao volume quando o PersistentVolumeClaim correspondente é excluído?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual campo de uma StorageClass define o que acontece ao volume quando o PersistentVolumeClaim correspondente é excluído?', 1, 'hard', 'mc_4', 'Kubernetes CKA', 'Storage', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'reclaimPolicy'),
        (v_question_id, 'B', 'volumeBindingMode'),
        (v_question_id, 'C', 'allowVolumeExpansion'),
        (v_question_id, 'D', 'provisioner');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O reclaimPolicy define se o volume é excluído (Delete) ou preservado (Retain) após a remoção do PVC.', NOW()),
        (v_answer_id, 'B', 'volumeBindingMode controla quando o volume é vinculado, imediatamente ou no primeiro consumidor.', NOW()),
        (v_answer_id, 'C', 'allowVolumeExpansion habilita o redimensionamento posterior do volume.', NOW()),
        (v_answer_id, 'D', 'provisioner indica qual driver provisiona o volume.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Troubleshooting' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Troubleshooting' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Troubleshooting', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Um Pod permanece no estado CrashLoopBackOff. Qual comando é o mais direto para inspecionar a saída do contêiner na execução anterior?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Um Pod permanece no estado CrashLoopBackOff. Qual comando é o mais direto para inspecionar a saída do contêiner na execução anterior?', 1, 'medium', 'mc_4', 'Kubernetes CKA', 'Troubleshooting', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'kubectl logs <pod> --previous'),
        (v_question_id, 'B', 'kubectl get pod <pod> -o wide'),
        (v_question_id, 'C', 'kubectl top pod <pod>'),
        (v_question_id, 'D', 'kubectl cordon <node>');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A flag --previous mostra os logs da instância anterior do contêiner, que é justamente a que falhou.', NOW()),
        (v_answer_id, 'B', 'O get exibe estado e nó, mas não a saída do contêiner.', NOW()),
        (v_answer_id, 'C', 'O top mostra consumo de recursos, sem os logs da falha.', NOW()),
        (v_answer_id, 'D', 'O cordon impede novos agendamentos no nó e não ajuda no diagnóstico.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Um nó aparece como NotReady. Quais verificações são apropriadas para diagnosticar a causa? (Escolha DUAS)') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Um nó aparece como NotReady. Quais verificações são apropriadas para diagnosticar a causa? (Escolha DUAS)', 2, 'hard', 'mc_4', 'Kubernetes CKA', 'Troubleshooting', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Verificar o status do serviço kubelet no nó'),
        (v_question_id, 'B', 'Inspecionar as condições do nó com kubectl describe node'),
        (v_question_id, 'C', 'Recriar todos os Deployments do cluster'),
        (v_question_id, 'D', 'Excluir o etcd e restaurá-lo de um backup');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A","B"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Se o kubelet estiver parado ou falhando, o nó deixa de reportar heartbeat e passa a NotReady.', NOW()),
        (v_answer_id, 'B', 'Correto. As condições do nó indicam pressão de memória, disco, PID ou problemas de rede.', NOW()),
        (v_answer_id, 'C', 'Recriar workloads não corrige a causa e provoca indisponibilidade desnecessária.', NOW()),
        (v_answer_id, 'D', 'Restaurar o etcd é uma medida drástica e desconectada do sintoma de um único nó NotReady.', NOW());
    END IF;

  END IF;

  -- ── HashiCorp Terraform Associate ─────────────────────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'HashiCorp Terraform Associate' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Infrastructure as Code (IaC) with Terraform' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Infrastructure as Code (IaC) with Terraform' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Infrastructure as Code (IaC) with Terraform', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual característica define uma configuração declarativa de infraestrutura como código?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual característica define uma configuração declarativa de infraestrutura como código?', 1, 'easy', 'mc_4', 'HashiCorp Terraform Associate', 'Infrastructure as Code (IaC) with Terraform', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'O código descreve o estado final desejado, e a ferramenta determina as ações necessárias'),
        (v_question_id, 'B', 'O código descreve passo a passo cada comando a ser executado, na ordem exata'),
        (v_question_id, 'C', 'A infraestrutura é criada apenas por meio da interface gráfica do provedor'),
        (v_question_id, 'D', 'Cada execução recria todos os recursos do zero');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Em IaC declarativa o operador descreve o resultado desejado e a ferramenta calcula o plano de convergência.', NOW()),
        (v_answer_id, 'B', 'Descrever passos ordenados caracteriza a abordagem imperativa.', NOW()),
        (v_answer_id, 'C', 'Uso de interface gráfica é o oposto de infraestrutura como código.', NOW()),
        (v_answer_id, 'D', 'O Terraform converge para o estado desejado, alterando apenas o que difere.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Terraform fundamentals' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Terraform fundamentals' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Terraform fundamentals', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual comando inicializa o diretório de trabalho, baixando providers e configurando o backend?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual comando inicializa o diretório de trabalho, baixando providers e configurando o backend?', 1, 'easy', 'mc_4', 'HashiCorp Terraform Associate', 'Terraform fundamentals', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'terraform init'),
        (v_question_id, 'B', 'terraform plan'),
        (v_question_id, 'C', 'terraform apply'),
        (v_question_id, 'D', 'terraform validate');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O init baixa os plugins de provider, instala módulos e prepara o backend configurado.', NOW()),
        (v_answer_id, 'B', 'O plan calcula as mudanças, mas exige que o diretório já esteja inicializado.', NOW()),
        (v_answer_id, 'C', 'O apply executa as mudanças, também após a inicialização.', NOW()),
        (v_answer_id, 'D', 'O validate confere a sintaxe e a consistência interna da configuração.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Core Terraform workflow' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Core Terraform workflow' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Core Terraform workflow', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a sequência correta do fluxo de trabalho principal do Terraform?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a sequência correta do fluxo de trabalho principal do Terraform?', 1, 'easy', 'mc_4', 'HashiCorp Terraform Associate', 'Core Terraform workflow', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Write, Plan, Apply'),
        (v_question_id, 'B', 'Plan, Write, Destroy'),
        (v_question_id, 'C', 'Apply, Validate, Plan'),
        (v_question_id, 'D', 'Init, Destroy, Write');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O fluxo canônico é escrever a configuração, revisar o plano e então aplicá-lo.', NOW()),
        (v_answer_id, 'B', 'Não se planeja antes de escrever a configuração.', NOW()),
        (v_answer_id, 'C', 'Aplicar antes de planejar inverte a etapa de revisão das mudanças.', NOW()),
        (v_answer_id, 'D', 'Destruir antes de escrever não descreve o fluxo de trabalho principal.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Terraform configuration' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Terraform configuration' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Terraform configuration', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual bloco é usado para consultar informações de recursos existentes que não são gerenciados pela configuração atual?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual bloco é usado para consultar informações de recursos existentes que não são gerenciados pela configuração atual?', 1, 'medium', 'mc_4', 'HashiCorp Terraform Associate', 'Terraform configuration', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'data'),
        (v_question_id, 'B', 'resource'),
        (v_question_id, 'C', 'output'),
        (v_question_id, 'D', 'locals');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Data sources leem informações externas sem assumir a gestão do ciclo de vida do recurso.', NOW()),
        (v_answer_id, 'B', 'O bloco resource cria e gerencia o ciclo de vida do recurso.', NOW()),
        (v_answer_id, 'C', 'O bloco output expõe valores após a aplicação.', NOW()),
        (v_answer_id, 'D', 'O bloco locals define valores nomeados reutilizáveis dentro do módulo.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual meta-argumento cria uma dependência explícita entre recursos quando o Terraform não consegue inferi-la automaticamente?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual meta-argumento cria uma dependência explícita entre recursos quando o Terraform não consegue inferi-la automaticamente?', 1, 'medium', 'mc_4', 'HashiCorp Terraform Associate', 'Terraform configuration', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'depends_on'),
        (v_question_id, 'B', 'count'),
        (v_question_id, 'C', 'provider'),
        (v_question_id, 'D', 'lifecycle');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. depends_on força a ordem quando não há referência direta entre os recursos.', NOW()),
        (v_answer_id, 'B', 'count controla quantas instâncias do recurso serão criadas.', NOW()),
        (v_answer_id, 'C', 'provider seleciona qual configuração de provider usar.', NOW()),
        (v_answer_id, 'D', 'lifecycle ajusta comportamentos como create_before_destroy e prevent_destroy.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Terraform state management' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Terraform state management' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Terraform state management', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Por que o Terraform mantém um arquivo de estado?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Por que o Terraform mantém um arquivo de estado?', 1, 'medium', 'mc_4', 'HashiCorp Terraform Associate', 'Terraform state management', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Para mapear os recursos da configuração aos objetos reais e detectar diferenças'),
        (v_question_id, 'B', 'Para armazenar o histórico completo de comandos executados pela equipe'),
        (v_question_id, 'C', 'Para guardar as credenciais de acesso aos provedores'),
        (v_question_id, 'D', 'Para substituir a necessidade de consultar as APIs dos provedores');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O estado associa endereços da configuração a IDs reais, permitindo calcular o diff a cada plano.', NOW()),
        (v_answer_id, 'B', 'O estado não é um log de auditoria de comandos.', NOW()),
        (v_answer_id, 'C', 'Credenciais não devem ser armazenadas no estado; vêm de variáveis de ambiente ou de mecanismos do provider.', NOW()),
        (v_answer_id, 'D', 'O Terraform continua consultando as APIs para atualizar o estado durante o refresh.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é o principal benefício de usar um backend remoto com bloqueio de estado em um time?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é o principal benefício de usar um backend remoto com bloqueio de estado em um time?', 1, 'hard', 'mc_4', 'HashiCorp Terraform Associate', 'Terraform state management', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Impedir execuções concorrentes que corromperiam o arquivo de estado'),
        (v_question_id, 'B', 'Eliminar a necessidade de executar terraform init'),
        (v_question_id, 'C', 'Tornar o plano determinístico independentemente do provider'),
        (v_question_id, 'D', 'Permitir aplicar mudanças sem permissões no provedor de nuvem');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O bloqueio serializa as operações, evitando que dois applies simultâneos corrompam o estado.', NOW()),
        (v_answer_id, 'B', 'O init continua sendo necessário para configurar o backend e baixar providers.', NOW()),
        (v_answer_id, 'C', 'O determinismo do plano depende da configuração e do estado real, não do backend.', NOW()),
        (v_answer_id, 'D', 'Permissões no provedor continuam obrigatórias para criar ou alterar recursos.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Terraform modules' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Terraform modules' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Terraform modules', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual afirmação sobre módulos no Terraform está correta?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual afirmação sobre módulos no Terraform está correta?', 1, 'medium', 'mc_4', 'HashiCorp Terraform Associate', 'Terraform modules', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Variáveis são a interface de entrada e outputs expõem valores ao módulo chamador'),
        (v_question_id, 'B', 'Módulos não podem receber parâmetros; devem ser copiados e editados'),
        (v_question_id, 'C', 'Um módulo só pode ser consumido a partir do Terraform Registry público'),
        (v_question_id, 'D', 'Outputs de um módulo filho são automaticamente visíveis em qualquer módulo do projeto');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Variáveis parametrizam o módulo e outputs devolvem valores a quem o chamou.', NOW()),
        (v_answer_id, 'B', 'Módulos são parametrizáveis justamente para evitar cópia e edição.', NOW()),
        (v_answer_id, 'C', 'Módulos podem vir de caminhos locais, Git, S3 e outros sources, além do registry.', NOW()),
        (v_answer_id, 'D', 'Outputs só ficam acessíveis ao chamador direto, e precisam ser repassados explicitamente adiante.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Maintain infrastructure with Terraform' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Maintain infrastructure with Terraform' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Maintain infrastructure with Terraform', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual comando marca um recurso para ser destruído e recriado na próxima aplicação, nas versões atuais do Terraform?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual comando marca um recurso para ser destruído e recriado na próxima aplicação, nas versões atuais do Terraform?', 1, 'hard', 'mc_4', 'HashiCorp Terraform Associate', 'Maintain infrastructure with Terraform', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'terraform apply -replace=<endereço do recurso>'),
        (v_question_id, 'B', 'terraform taint <endereço do recurso>'),
        (v_question_id, 'C', 'terraform refresh -target=<endereço do recurso>'),
        (v_question_id, 'D', 'terraform state rm <endereço do recurso>');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O -replace substituiu o antigo taint como forma recomendada de forçar recriação.', NOW()),
        (v_answer_id, 'B', 'O comando taint está obsoleto desde a versão 0.15.2, embora ainda funcione em algumas versões.', NOW()),
        (v_answer_id, 'C', 'O refresh apenas atualiza o estado com a realidade, sem recriar nada.', NOW()),
        (v_answer_id, 'D', 'Remover do estado faz o Terraform esquecer o recurso, que passaria a ser criado de novo sem destruir o existente.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'HCP Terraform' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'HCP Terraform' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'HCP Terraform', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual recurso do HCP Terraform (antigo Terraform Cloud) permite executar planos e aplicações em infraestrutura gerenciada pela HashiCorp, com histórico e controle de acesso?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual recurso do HCP Terraform (antigo Terraform Cloud) permite executar planos e aplicações em infraestrutura gerenciada pela HashiCorp, com histórico e controle de acesso?', 1, 'medium', 'mc_4', 'HashiCorp Terraform Associate', 'HCP Terraform', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Remote execution em workspaces'),
        (v_question_id, 'B', 'Execução exclusivamente local com backend local'),
        (v_question_id, 'C', 'Armazenamento do estado apenas em disco do operador'),
        (v_question_id, 'D', 'Provisionamento manual pela interface do provedor');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Workspaces com execução remota rodam as operações na plataforma, com log, versionamento e políticas de acesso.', NOW()),
        (v_answer_id, 'B', 'Execução local não aproveita o histórico centralizado nem o controle de acesso da plataforma.', NOW()),
        (v_answer_id, 'C', 'Estado em disco local é justamente o que o HCP Terraform substitui.', NOW()),
        (v_answer_id, 'D', 'Provisionamento manual não faz parte do fluxo do HCP Terraform.', NOW());
    END IF;

  END IF;

  -- ── Cisco CCNA ────────────────────────────────────────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'Cisco CCNA' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Network Fundamentals' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Network Fundamentals' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Network Fundamentals', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual dispositivo opera na camada 2 do modelo OSI e encaminha quadros com base no endereço MAC de destino?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual dispositivo opera na camada 2 do modelo OSI e encaminha quadros com base no endereço MAC de destino?', 1, 'easy', 'mc_4', 'Cisco CCNA', 'Network Fundamentals', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Switch'),
        (v_question_id, 'B', 'Roteador'),
        (v_question_id, 'C', 'Hub'),
        (v_question_id, 'D', 'Firewall de camada 7');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O switch aprende endereços MAC e encaminha quadros somente para a porta correspondente.', NOW()),
        (v_answer_id, 'B', 'O roteador opera na camada 3, encaminhando pacotes por endereço IP.', NOW()),
        (v_answer_id, 'C', 'O hub apenas repete o sinal elétrico em todas as portas, sem inspecionar endereços.', NOW()),
        (v_answer_id, 'D', 'Firewalls de camada 7 inspecionam conteúdo de aplicação, acima da camada 2.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Quantos endereços de host utilizáveis existem em uma sub-rede IPv4 com máscara /29?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Quantos endereços de host utilizáveis existem em uma sub-rede IPv4 com máscara /29?', 1, 'medium', 'mc_4', 'Cisco CCNA', 'Network Fundamentals', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', '6'),
        (v_question_id, 'B', '8'),
        (v_question_id, 'C', '14'),
        (v_question_id, 'D', '30');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Uma /29 tem 8 endereços no total; descontando rede e broadcast, restam 6 utilizáveis.', NOW()),
        (v_answer_id, 'B', '8 é o total de endereços do bloco, sem descontar rede e broadcast.', NOW()),
        (v_answer_id, 'C', '14 utilizáveis corresponde a uma /28.', NOW()),
        (v_answer_id, 'D', '30 utilizáveis corresponde a uma /27.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Network Access' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Network Access' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Network Access', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual protocolo permite que múltiplas VLANs trafeguem por um único enlace entre switches?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual protocolo permite que múltiplas VLANs trafeguem por um único enlace entre switches?', 1, 'easy', 'mc_4', 'Cisco CCNA', 'Network Access', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'IEEE 802.1Q'),
        (v_question_id, 'B', 'IEEE 802.3af'),
        (v_question_id, 'C', 'Spanning Tree Protocol'),
        (v_question_id, 'D', 'CDP');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O 802.1Q insere uma tag de VLAN no quadro, permitindo o entroncamento (trunk).', NOW()),
        (v_answer_id, 'B', 'O 802.3af define Power over Ethernet.', NOW()),
        (v_answer_id, 'C', 'O STP previne loops de camada 2, sem transportar VLANs.', NOW()),
        (v_answer_id, 'D', 'O CDP é um protocolo proprietário de descoberta de vizinhos Cisco.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é o objetivo principal do Spanning Tree Protocol em uma rede comutada?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é o objetivo principal do Spanning Tree Protocol em uma rede comutada?', 1, 'medium', 'mc_4', 'Cisco CCNA', 'Network Access', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Prevenir loops de camada 2 bloqueando caminhos redundantes'),
        (v_question_id, 'B', 'Balancear a carga igualmente entre todos os enlaces'),
        (v_question_id, 'C', 'Atribuir endereços IP dinamicamente aos hosts'),
        (v_question_id, 'D', 'Criptografar o tráfego entre switches');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O STP calcula uma topologia livre de loops, bloqueando portas redundantes até que sejam necessárias.', NOW()),
        (v_answer_id, 'B', 'O STP bloqueia caminhos em vez de balancear carga entre eles.', NOW()),
        (v_answer_id, 'C', 'Atribuição dinâmica de IP é função do DHCP.', NOW()),
        (v_answer_id, 'D', 'O STP não provê criptografia.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'IP Connectivity' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'IP Connectivity' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'IP Connectivity', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Ao escolher entre múltiplas rotas para o mesmo destino aprendidas por protocolos diferentes, qual critério o roteador Cisco avalia primeiro?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Ao escolher entre múltiplas rotas para o mesmo destino aprendidas por protocolos diferentes, qual critério o roteador Cisco avalia primeiro?', 1, 'hard', 'mc_4', 'Cisco CCNA', 'IP Connectivity', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'A distância administrativa do protocolo de origem'),
        (v_question_id, 'B', 'A métrica calculada pelo protocolo'),
        (v_question_id, 'C', 'O tempo em que a rota foi aprendida'),
        (v_question_id, 'D', 'O número de saltos até o destino');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A distância administrativa decide entre fontes distintas; a métrica só desempata dentro do mesmo protocolo.', NOW()),
        (v_answer_id, 'B', 'A métrica é comparada apenas entre rotas do mesmo protocolo.', NOW()),
        (v_answer_id, 'C', 'A antiguidade da rota não é critério de seleção.', NOW()),
        (v_answer_id, 'D', 'Número de saltos é a métrica do RIP, aplicável apenas dentro desse protocolo.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual comando configura uma rota estática padrão em um roteador Cisco IOS, encaminhando para o próximo salto 203.0.113.1?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual comando configura uma rota estática padrão em um roteador Cisco IOS, encaminhando para o próximo salto 203.0.113.1?', 1, 'medium', 'mc_4', 'Cisco CCNA', 'IP Connectivity', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'ip route 0.0.0.0 0.0.0.0 203.0.113.1'),
        (v_question_id, 'B', 'ip route 203.0.113.1 255.255.255.255 0.0.0.0'),
        (v_question_id, 'C', 'ip default-network 203.0.113.1'),
        (v_question_id, 'D', 'ip route any any 203.0.113.1');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A rota 0.0.0.0/0 corresponde a qualquer destino e aponta para o próximo salto informado.', NOW()),
        (v_answer_id, 'B', 'Inverte os campos: define uma rota de host para 203.0.113.1 com próximo salto inválido.', NOW()),
        (v_answer_id, 'C', 'O default-network é um mecanismo legado com semântica distinta da rota padrão.', NOW()),
        (v_answer_id, 'D', 'A sintaxe com "any" não é válida no comando ip route.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'IP Services' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'IP Services' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'IP Services', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual serviço traduz endereços IP privados em endereços públicos para permitir acesso à internet?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual serviço traduz endereços IP privados em endereços públicos para permitir acesso à internet?', 1, 'easy', 'mc_4', 'Cisco CCNA', 'IP Services', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'NAT'),
        (v_question_id, 'B', 'DNS'),
        (v_question_id, 'C', 'DHCP'),
        (v_question_id, 'D', 'NTP');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O NAT reescreve endereços de origem ou destino, permitindo que redes privadas alcancem a internet.', NOW()),
        (v_answer_id, 'B', 'O DNS resolve nomes em endereços IP.', NOW()),
        (v_answer_id, 'C', 'O DHCP atribui endereços IP automaticamente aos hosts.', NOW()),
        (v_answer_id, 'D', 'O NTP sincroniza relógios entre dispositivos.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual protocolo é usado para sincronizar o relógio dos dispositivos de rede, garantindo logs com marcação temporal consistente?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual protocolo é usado para sincronizar o relógio dos dispositivos de rede, garantindo logs com marcação temporal consistente?', 1, 'easy', 'mc_4', 'Cisco CCNA', 'IP Services', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'NTP'),
        (v_question_id, 'B', 'SNMP'),
        (v_question_id, 'C', 'Syslog'),
        (v_question_id, 'D', 'TFTP');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O NTP sincroniza relógios, o que é essencial para correlacionar eventos entre dispositivos.', NOW()),
        (v_answer_id, 'B', 'O SNMP coleta métricas e permite gerenciamento de dispositivos.', NOW()),
        (v_answer_id, 'C', 'O Syslog transporta mensagens de log, que dependem do relógio já sincronizado.', NOW()),
        (v_answer_id, 'D', 'O TFTP transfere arquivos, como imagens de IOS e configurações.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Security Fundamentals' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Security Fundamentals' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Security Fundamentals', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual recurso de segurança de porta em switches Cisco limita quais endereços MAC podem se comunicar por uma interface?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual recurso de segurança de porta em switches Cisco limita quais endereços MAC podem se comunicar por uma interface?', 1, 'medium', 'mc_4', 'Cisco CCNA', 'Security Fundamentals', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Port security'),
        (v_question_id, 'B', 'DHCP snooping'),
        (v_question_id, 'C', 'BPDU guard'),
        (v_question_id, 'D', 'Storm control');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O port security restringe os MACs permitidos na porta e pode desativá-la em caso de violação.', NOW()),
        (v_answer_id, 'B', 'O DHCP snooping filtra respostas DHCP não autorizadas.', NOW()),
        (v_answer_id, 'C', 'O BPDU guard desativa portas de acesso que recebem BPDUs inesperados.', NOW()),
        (v_answer_id, 'D', 'O storm control limita tráfego de broadcast e multicast excessivo.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Automation and Programmability' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Automation and Programmability' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Automation and Programmability', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual formato de dados é comumente usado em APIs REST de equipamentos de rede por ser leve e legível?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual formato de dados é comumente usado em APIs REST de equipamentos de rede por ser leve e legível?', 1, 'easy', 'mc_4', 'Cisco CCNA', 'Automation and Programmability', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'JSON'),
        (v_question_id, 'B', 'CSV'),
        (v_question_id, 'C', 'Binário proprietário'),
        (v_question_id, 'D', 'Texto plano sem estrutura');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O JSON é o formato predominante em APIs REST por ser estruturado, leve e amplamente suportado.', NOW()),
        (v_answer_id, 'B', 'O CSV é tabular e não representa bem estruturas aninhadas.', NOW()),
        (v_answer_id, 'C', 'Formatos binários proprietários dificultam a interoperabilidade.', NOW()),
        (v_answer_id, 'D', 'Texto sem estrutura exige parsing frágil e não é usado em APIs REST modernas.', NOW());
    END IF;

  END IF;

  -- ── CompTIA Security+ ─────────────────────────────────────────────
  SELECT id, "providerId", "examBoardId", type
    INTO v_exam_id, v_provider_id, v_board_id, v_type
    FROM "Exam" WHERE name = 'CompTIA Security+' AND "isTemplate" = true LIMIT 1;

  IF v_exam_id IS NOT NULL THEN
    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'General Security Concepts' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'General Security Concepts' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'General Security Concepts', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Quais são os três pilares da tríade CIA em segurança da informação?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Quais são os três pilares da tríade CIA em segurança da informação?', 1, 'easy', 'mc_4', 'CompTIA Security+', 'General Security Concepts', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Confidencialidade, integridade e disponibilidade'),
        (v_question_id, 'B', 'Controle, identificação e autenticação'),
        (v_question_id, 'C', 'Criptografia, isolamento e auditoria'),
        (v_question_id, 'D', 'Conformidade, inventário e avaliação');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A tríade CIA reúne confidencialidade, integridade e disponibilidade como objetivos fundamentais.', NOW()),
        (v_answer_id, 'B', 'São conceitos de gestão de identidade, não os pilares da tríade.', NOW()),
        (v_answer_id, 'C', 'São controles ou práticas que apoiam a tríade, mas não a definem.', NOW()),
        (v_answer_id, 'D', 'Descrevem atividades de governança, não os pilares clássicos.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual conceito descreve a prática de exigir que mais de uma pessoa aprove uma ação crítica, reduzindo risco de fraude interna?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual conceito descreve a prática de exigir que mais de uma pessoa aprove uma ação crítica, reduzindo risco de fraude interna?', 1, 'medium', 'mc_4', 'CompTIA Security+', 'General Security Concepts', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Separação de funções'),
        (v_question_id, 'B', 'Menor privilégio'),
        (v_question_id, 'C', 'Defesa em profundidade'),
        (v_question_id, 'D', 'Rotação de credenciais');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A separação de funções divide etapas críticas entre pessoas distintas, exigindo conluio para fraudar.', NOW()),
        (v_answer_id, 'B', 'Menor privilégio limita permissões ao necessário, mas não exige múltiplas aprovações.', NOW()),
        (v_answer_id, 'C', 'Defesa em profundidade sobrepõe camadas de controle técnico.', NOW()),
        (v_answer_id, 'D', 'Rotação de credenciais reduz a janela de uso de segredos comprometidos.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Threats, Vulnerabilities, and Mitigations' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Threats, Vulnerabilities, and Mitigations' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Threats, Vulnerabilities, and Mitigations', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Um atacante envia e-mails altamente personalizados a um executivo específico, usando informações públicas sobre ele. Qual tipo de ataque é esse?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Um atacante envia e-mails altamente personalizados a um executivo específico, usando informações públicas sobre ele. Qual tipo de ataque é esse?', 1, 'medium', 'mc_4', 'CompTIA Security+', 'Threats, Vulnerabilities, and Mitigations', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Spear phishing'),
        (v_question_id, 'B', 'Phishing genérico em massa'),
        (v_question_id, 'C', 'Smishing'),
        (v_question_id, 'D', 'Tailgating');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O spear phishing é direcionado a um alvo específico com conteúdo personalizado para aumentar a credibilidade.', NOW()),
        (v_answer_id, 'B', 'Phishing em massa envia mensagens genéricas a muitos destinatários.', NOW()),
        (v_answer_id, 'C', 'Smishing usa mensagens SMS como vetor.', NOW()),
        (v_answer_id, 'D', 'Tailgating é o acesso físico não autorizado seguindo uma pessoa autorizada.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual técnica de mitigação é mais eficaz contra ataques de injeção de SQL em uma aplicação web?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual técnica de mitigação é mais eficaz contra ataques de injeção de SQL em uma aplicação web?', 1, 'medium', 'mc_4', 'CompTIA Security+', 'Threats, Vulnerabilities, and Mitigations', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Usar consultas parametrizadas com validação de entrada no servidor'),
        (v_question_id, 'B', 'Ocultar as mensagens de erro do banco de dados'),
        (v_question_id, 'C', 'Aplicar validação apenas no lado do cliente'),
        (v_question_id, 'D', 'Renomear as tabelas do banco de dados');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Consultas parametrizadas separam código de dados, impedindo que a entrada altere a estrutura da query.', NOW()),
        (v_answer_id, 'B', 'Ocultar erros dificulta a exploração, mas não elimina a vulnerabilidade.', NOW()),
        (v_answer_id, 'C', 'Validação no cliente é facilmente contornada por requisições diretas.', NOW()),
        (v_answer_id, 'D', 'Renomear tabelas é segurança por obscuridade e não impede a injeção.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Security Architecture' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Security Architecture' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Security Architecture', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual princípio de arquitetura de rede coloca servidores acessíveis externamente em um segmento separado da rede interna?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual princípio de arquitetura de rede coloca servidores acessíveis externamente em um segmento separado da rede interna?', 1, 'easy', 'mc_4', 'CompTIA Security+', 'Security Architecture', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Zona desmilitarizada (DMZ) ou rede de perímetro'),
        (v_question_id, 'B', 'Rede plana sem segmentação'),
        (v_question_id, 'C', 'Air gap total entre todos os servidores'),
        (v_question_id, 'D', 'Tunelamento dividido em VPN');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A DMZ isola serviços expostos, limitando o alcance de um comprometimento na rede interna.', NOW()),
        (v_answer_id, 'B', 'Redes planas permitem movimentação lateral irrestrita após um comprometimento.', NOW()),
        (v_answer_id, 'C', 'Air gap isola fisicamente, o que é incompatível com servidores acessíveis pela internet.', NOW()),
        (v_answer_id, 'D', 'Split tunneling é uma configuração de VPN, não um princípio de segmentação de servidores.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual modelo de segurança parte do princípio de que nenhuma requisição é confiável por padrão, exigindo verificação contínua de identidade e contexto?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual modelo de segurança parte do princípio de que nenhuma requisição é confiável por padrão, exigindo verificação contínua de identidade e contexto?', 1, 'medium', 'mc_4', 'CompTIA Security+', 'Security Architecture', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Zero trust'),
        (v_question_id, 'B', 'Segurança baseada em perímetro'),
        (v_question_id, 'C', 'Modelo de confiança implícita na rede interna'),
        (v_question_id, 'D', 'Controle de acesso discricionário');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O zero trust elimina a confiança implícita e valida cada requisição com base em identidade, dispositivo e contexto.', NOW()),
        (v_answer_id, 'B', 'O modelo de perímetro confia no que está dentro da rede, premissa que o zero trust rejeita.', NOW()),
        (v_answer_id, 'C', 'Confiança implícita interna é exatamente o que o zero trust busca eliminar.', NOW()),
        (v_answer_id, 'D', 'DAC é um modelo de controle de acesso em que o dono do recurso define permissões.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Security Operations' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Security Operations' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Security Operations', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual é a ordem correta das fases de resposta a incidentes segundo as práticas cobertas pelo Security+?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual é a ordem correta das fases de resposta a incidentes segundo as práticas cobertas pelo Security+?', 1, 'hard', 'mc_4', 'CompTIA Security+', 'Security Operations', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Preparação, identificação, contenção, erradicação, recuperação e lições aprendidas'),
        (v_question_id, 'B', 'Identificação, preparação, recuperação, contenção, erradicação e revisão'),
        (v_question_id, 'C', 'Contenção, identificação, preparação, erradicação, revisão e recuperação'),
        (v_question_id, 'D', 'Preparação, contenção, identificação, recuperação, erradicação e auditoria');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. Essa é a sequência canônica do ciclo de resposta a incidentes.', NOW()),
        (v_answer_id, 'B', 'A preparação antecede a identificação, e a recuperação vem após a erradicação.', NOW()),
        (v_answer_id, 'C', 'Não se contém um incidente antes de identificá-lo, e a preparação é prévia a tudo.', NOW()),
        (v_answer_id, 'D', 'A identificação precede a contenção, e a erradicação vem antes da recuperação.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual ferramenta agrega e correlaciona logs de múltiplas fontes para detecção de incidentes em tempo quase real?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual ferramenta agrega e correlaciona logs de múltiplas fontes para detecção de incidentes em tempo quase real?', 1, 'easy', 'mc_4', 'CompTIA Security+', 'Security Operations', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'SIEM'),
        (v_question_id, 'B', 'Scanner de vulnerabilidades'),
        (v_question_id, 'C', 'Proxy reverso'),
        (v_question_id, 'D', 'Gerenciador de senhas corporativo');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O SIEM centraliza, normaliza e correlaciona eventos, gerando alertas para análise.', NOW()),
        (v_answer_id, 'B', 'Scanners identificam vulnerabilidades conhecidas em ativos, sem correlacionar logs.', NOW()),
        (v_answer_id, 'C', 'Proxies reversos intermediam requisições e podem gerar logs, mas não os correlacionam.', NOW()),
        (v_answer_id, 'D', 'Gerenciadores de senha protegem credenciais, sem função de detecção.', NOW());
    END IF;

    SELECT id INTO v_section_id FROM "ExamSection"
      WHERE "examId" = v_exam_id AND name = 'Security Program Management and Oversight' LIMIT 1;

    SELECT id INTO v_pool_id FROM "QuestionPool"
      WHERE type = v_type
        AND "providerId" IS NOT DISTINCT FROM v_provider_id
        AND "examBoardId" IS NOT DISTINCT FROM v_board_id
        AND "sectionName" = 'Security Program Management and Oversight' AND "topicName" IS NULL LIMIT 1;
    IF v_pool_id IS NULL THEN
      v_pool_id := gen_random_uuid()::text;
      INSERT INTO "QuestionPool" (id, type, "providerId", "examBoardId", "sectionName", "topicName", "createdAt")
      VALUES (v_pool_id, v_type, v_provider_id, v_board_id, 'Security Program Management and Oversight', NULL, NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Qual documento define o tempo e as condições de restauração de serviço acordados entre um provedor e o cliente?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Qual documento define o tempo e as condições de restauração de serviço acordados entre um provedor e o cliente?', 1, 'medium', 'mc_4', 'CompTIA Security+', 'Security Program Management and Oversight', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'Service Level Agreement (SLA)'),
        (v_question_id, 'B', 'Memorandum of Understanding (MOU)'),
        (v_question_id, 'C', 'Non-Disclosure Agreement (NDA)'),
        (v_question_id, 'D', 'Business Impact Analysis (BIA)');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. O SLA formaliza metas mensuráveis de serviço, incluindo prazos de restauração e penalidades.', NOW()),
        (v_answer_id, 'B', 'O MOU registra intenções entre as partes, sem obrigações contratuais detalhadas.', NOW()),
        (v_answer_id, 'C', 'O NDA trata de confidencialidade das informações compartilhadas.', NOW()),
        (v_answer_id, 'D', 'A BIA analisa impactos de interrupção para orientar prioridades de continuidade.', NOW());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ExamQuestion" WHERE "poolId" = v_pool_id AND text = 'Ao calcular o risco quantitativo, qual fórmula representa a expectativa de perda anual (ALE)?') THEN
      INSERT INTO "ExamQuestion" (text, "correctCount", difficulty, format, "examName", "sectionName", "topicName", "examId", "sectionId", "poolId", "createdAt")
      VALUES ('Ao calcular o risco quantitativo, qual fórmula representa a expectativa de perda anual (ALE)?', 1, 'hard', 'mc_4', 'CompTIA Security+', 'Security Program Management and Oversight', NULL, v_exam_id, v_section_id, v_pool_id, NOW())
      RETURNING id INTO v_question_id;
      INSERT INTO "ExamOption" ("questionId", label, text) VALUES
        (v_question_id, 'A', 'ALE = SLE × ARO'),
        (v_question_id, 'B', 'ALE = SLE ÷ ARO'),
        (v_question_id, 'C', 'ALE = AV × EF ÷ ARO'),
        (v_question_id, 'D', 'ALE = ARO ÷ EF');
      INSERT INTO "ExamAnswer" ("questionId", "correctOptions")
      VALUES (v_question_id, '["A"]'::jsonb) RETURNING id INTO v_answer_id;
      INSERT INTO "ExamExplanation" ("answerId", label, text, "createdAt") VALUES
        (v_answer_id, 'A', 'Correto. A perda esperada por ocorrência (SLE) multiplicada pela frequência anual (ARO) resulta na ALE.', NOW()),
        (v_answer_id, 'B', 'Dividir inverte a relação: maior frequência deve aumentar, não reduzir, a perda anual.', NOW()),
        (v_answer_id, 'C', 'AV × EF define o próprio SLE; dividir por ARO não produz a ALE.', NOW()),
        (v_answer_id, 'D', 'Não há relação de divisão entre frequência e fator de exposição que resulte na ALE.', NOW());
    END IF;

  END IF;

END $$;
