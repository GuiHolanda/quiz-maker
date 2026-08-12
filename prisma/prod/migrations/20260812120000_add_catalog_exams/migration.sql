-- Migration: add_catalog_exams
-- Inserts 17 certification template exams (tech + international finance + Brazilian finance).
-- Idempotent: all inserts are guarded by IF NOT EXISTS / ON CONFLICT DO NOTHING.
-- Also fixes 4 broken Wikimedia logo URLs and upgrades GARP thumbnail to full-res.
--
-- Corrections applied vs original seed data (verified 2026-08-12):
--   AZ-104          examDurationMinutes 120 → 100
--   AZ-900          examDurationMinutes 65  → 45  (65 is seat time, not exam time)
--   GCP PCA         sections 5 → 6 (adds "Managing implementation"; fixes last section title)
--   CompTIA SY0-701 passingScore 75 → 83  (750/900 ≈ 83%; CompTIA uses 100–900 scale)
--   Terraform       003 (retired) → 004 (current); 8 new domains, equal weight distribution
--   CFP (USA)       examDurationMinutes 370 → 360; sections corrected per 2021 Principal Knowledge Topics
--   CPA-10          examDurationMinutes 75  → 90  (75 unconfirmable; best estimate 90)
--   CPA-20          examDurationMinutes 120 → 150; sections 10 → 7 (official ANBIMA modules)
--   CFP-BR          totalQuestions 170 → 140; duration 360 → 420; passingScore 65 → 70;
--                   sections fully rewritten to 2026 FPSB 8-module format (52nd exam onwards)
--   AAI             sections fully rewritten to official ANCORD regulation (14 topic areas)
--   4 logos fixed   CompTIA, HashiCorp, CNCF, CFA Institute (all returned 404)
--   GARP logo       thumbnail URL → full-resolution URL

DO $$
DECLARE
  v_aws_id      TEXT;
  v_ms_id       TEXT;
  v_gcp_id      TEXT;
  v_comptia_id  TEXT;
  v_cisco_id    TEXT;
  v_hashi_id    TEXT;
  v_cncf_id     TEXT;
  v_cfa_id      TEXT;
  v_garp_id     TEXT;
  v_cfpb_id     TEXT;
  v_anbima_id   TEXT;
  v_ancord_id   TEXT;
  v_planejar_id TEXT;
  v_exam_id     TEXT;
BEGIN

  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 1: Fix broken / suboptimal logo URLs on existing providers
  -- ─────────────────────────────────────────────────────────────────────────
  UPDATE "Provider" SET "logoUrl" = 'https://upload.wikimedia.org/wikipedia/commons/6/62/Comptia-logo.svg'
    WHERE name = 'CompTIA';

  UPDATE "Provider" SET "logoUrl" = 'https://upload.wikimedia.org/wikipedia/commons/a/a0/HashiCorp_horizontal_logo.svg'
    WHERE name = 'HashiCorp';

  UPDATE "Provider" SET "logoUrl" = 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Cloud_Native_Computing_Foundation_2023_logo.svg'
    WHERE name = 'CNCF';

  UPDATE "Provider" SET "logoUrl" = 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Cfa-institute-logo.svg'
    WHERE name = 'CFA Institute';

  -- Upgrade GARP from /thumb/ URL to full-resolution (more stable)
  UPDATE "Provider" SET "logoUrl" = 'https://upload.wikimedia.org/wikipedia/en/2/26/Global_Association_of_Risk_Professionals_%28GARP%29_Logo.png'
    WHERE name = 'GARP';


  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 2: Upsert providers
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'AWS', 'Amazon Web Services',
          'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_aws_id FROM "Provider" WHERE name = 'AWS';

  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'Microsoft', 'Microsoft Corporation',
          'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_ms_id FROM "Provider" WHERE name = 'Microsoft';

  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'Google', 'Google LLC',
          'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_gcp_id FROM "Provider" WHERE name = 'Google';

  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'CompTIA', 'Computing Technology Industry Association',
          'https://upload.wikimedia.org/wikipedia/commons/6/62/Comptia-logo.svg')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_comptia_id FROM "Provider" WHERE name = 'CompTIA';

  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'Cisco', 'Cisco Systems',
          'https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_cisco_id FROM "Provider" WHERE name = 'Cisco';

  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'HashiCorp', 'HashiCorp Inc.',
          'https://upload.wikimedia.org/wikipedia/commons/a/a0/HashiCorp_horizontal_logo.svg')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_hashi_id FROM "Provider" WHERE name = 'HashiCorp';

  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'CNCF', 'Cloud Native Computing Foundation',
          'https://upload.wikimedia.org/wikipedia/commons/c/c3/Cloud_Native_Computing_Foundation_2023_logo.svg')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_cncf_id FROM "Provider" WHERE name = 'CNCF';

  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'CFA Institute', 'CFA Institute',
          'https://upload.wikimedia.org/wikipedia/commons/d/d9/Cfa-institute-logo.svg')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_cfa_id FROM "Provider" WHERE name = 'CFA Institute';

  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'GARP', 'Global Association of Risk Professionals',
          'https://upload.wikimedia.org/wikipedia/en/2/26/Global_Association_of_Risk_Professionals_%28GARP%29_Logo.png')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_garp_id FROM "Provider" WHERE name = 'GARP';

  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'CFP Board', 'Certified Financial Planner Board of Standards',
          'https://www.cfp.net/assets/images/logo-cfp-board-black-white.svg')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_cfpb_id FROM "Provider" WHERE name = 'CFP Board';

  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'ANBIMA',
          'Associação Brasileira das Entidades dos Mercados Financeiro e de Capitais',
          'https://www.anbima.com.br/lumis-theme/br/com/anbima/portal/theme/portal-anbima/assets/img/logo-anbima.png')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_anbima_id FROM "Provider" WHERE name = 'ANBIMA';

  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'ANCORD',
          'Associação Nacional das Corretoras e Distribuidoras de Títulos e Valores Mobiliários',
          'https://www.ancord.org.br/wp-content/themes/ancord/assets/images/logo-ancord.svg')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_ancord_id FROM "Provider" WHERE name = 'ANCORD';

  INSERT INTO "Provider" (id, name, "fullName", "logoUrl")
  VALUES (gen_random_uuid()::text, 'PLANEJAR',
          'Associação Brasileira de Planejadores Financeiros',
          'https://framerusercontent.com/images/0mCuFuGOnN9T9Ux7ioZdPGcujw.png')
  ON CONFLICT (name) DO NOTHING;
  SELECT id INTO v_planejar_id FROM "Provider" WHERE name = 'PLANEJAR';


  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 3: Insert exams + sections
  -- Unique guard: name + isTemplate = true  (userId is NULL for templates;
  -- PostgreSQL treats NULLs as distinct in unique indexes, so we check manually)
  -- ─────────────────────────────────────────────────────────────────────────

  -- ── AWS Certified Solutions Architect – Associate (SAA-C03) ──────────────
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'AWS Certified Solutions Architect – Associate' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'AWS Certified Solutions Architect – Associate',
            'SAA-C03', 2024, 65, 130, 72, v_aws_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Design Secure Architectures',          30, 30, v_exam_id),
      (gen_random_uuid()::text, 'Design Resilient Architectures',       26, 26, v_exam_id),
      (gen_random_uuid()::text, 'Design High-Performing Architectures', 24, 24, v_exam_id),
      (gen_random_uuid()::text, 'Design Cost-Optimized Architectures',  20, 20, v_exam_id);
  END IF;

  -- ── AWS Certified Developer – Associate (DVA-C02) ───────────────────────
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'AWS Certified Developer – Associate' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'AWS Certified Developer – Associate',
            'DVA-C02', 2024, 65, 130, 72, v_aws_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Development with AWS Services',    32, 32, v_exam_id),
      (gen_random_uuid()::text, 'Security',                         26, 26, v_exam_id),
      (gen_random_uuid()::text, 'Deployment',                       24, 24, v_exam_id),
      (gen_random_uuid()::text, 'Troubleshooting and Optimization', 18, 18, v_exam_id);
  END IF;

  -- ── Microsoft Azure Administrator (AZ-104) ──────────────────────────────
  -- duration corrected: 120 → 100 min
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'Microsoft Azure Administrator' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'Microsoft Azure Administrator',
            'AZ-104', 2024, 60, 100, 70, v_ms_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Manage Azure Identities and Governance',       20, 25, v_exam_id),
      (gen_random_uuid()::text, 'Implement and Manage Storage',                 15, 20, v_exam_id),
      (gen_random_uuid()::text, 'Deploy and Manage Azure Compute Resources',    20, 25, v_exam_id),
      (gen_random_uuid()::text, 'Implement and Manage Virtual Networking',      15, 20, v_exam_id),
      (gen_random_uuid()::text, 'Monitor and Maintain Azure Resources',         10, 15, v_exam_id);
  END IF;

  -- ── Microsoft Azure Fundamentals (AZ-900) ───────────────────────────────
  -- duration corrected: 65 → 45 min (65 is total seat time, not exam time)
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'Microsoft Azure Fundamentals' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'Microsoft Azure Fundamentals',
            'AZ-900', 2024, 60, 45, 70, v_ms_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Cloud Concepts',                  25, 30, v_exam_id),
      (gen_random_uuid()::text, 'Azure Architecture and Services', 35, 40, v_exam_id),
      (gen_random_uuid()::text, 'Azure Management and Governance', 30, 35, v_exam_id);
  END IF;

  -- ── Google Cloud Professional Cloud Architect (PCA) ─────────────────────
  -- sections corrected: 5 → 6 (added "Managing implementation"; fixed last section title;
  -- fixed section 2 title to match official exam guide)
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'Google Cloud Professional Cloud Architect' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'Google Cloud Professional Cloud Architect',
            'PCA', 2024, 60, 120, 70, v_gcp_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Designing and planning a cloud solution architecture',          25, 25, v_exam_id),
      (gen_random_uuid()::text, 'Managing and provisioning a cloud solution infrastructure',    18, 18, v_exam_id),
      (gen_random_uuid()::text, 'Designing for security and compliance',                        18, 18, v_exam_id),
      (gen_random_uuid()::text, 'Analyzing and optimizing technical and business processes',    15, 15, v_exam_id),
      (gen_random_uuid()::text, 'Managing implementation',                                      12, 12, v_exam_id),
      (gen_random_uuid()::text, 'Ensuring solution and operations excellence',                  12, 12, v_exam_id);
  END IF;

  -- ── CompTIA Security+ (SY0-701) ─────────────────────────────────────────
  -- passingScore corrected: 75 → 83 (CompTIA scale 100–900; passing = 750; 750/900 ≈ 83%)
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'CompTIA Security+' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'CompTIA Security+',
            'SY0-701', 2024, 90, 90, 83, v_comptia_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'General Security Concepts',                  12, 12, v_exam_id),
      (gen_random_uuid()::text, 'Threats, Vulnerabilities, and Mitigations',  22, 22, v_exam_id),
      (gen_random_uuid()::text, 'Security Architecture',                      18, 18, v_exam_id),
      (gen_random_uuid()::text, 'Security Operations',                        28, 28, v_exam_id),
      (gen_random_uuid()::text, 'Security Program Management and Oversight',  20, 20, v_exam_id);
  END IF;

  -- ── Cisco CCNA (200-301) ─────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'Cisco CCNA' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'Cisco CCNA',
            '200-301', 2024, 120, 120, 82, v_cisco_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Network Fundamentals',            20, 20, v_exam_id),
      (gen_random_uuid()::text, 'Network Access',                  20, 20, v_exam_id),
      (gen_random_uuid()::text, 'IP Connectivity',                 25, 25, v_exam_id),
      (gen_random_uuid()::text, 'IP Services',                     10, 10, v_exam_id),
      (gen_random_uuid()::text, 'Security Fundamentals',           15, 15, v_exam_id),
      (gen_random_uuid()::text, 'Automation and Programmability',  10, 10, v_exam_id);
  END IF;

  -- ── HashiCorp Terraform Associate (004) ─────────────────────────────────
  -- Replaces 003 (retired; all official pages return 404).
  -- 004 does not publish domain weights; equal distribution used (8 domains).
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'HashiCorp Terraform Associate' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'HashiCorp Terraform Associate',
            '004', 2025, 57, 60, 70, v_hashi_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Infrastructure as Code (IaC) with Terraform', 12, 12, v_exam_id),
      (gen_random_uuid()::text, 'Terraform fundamentals',                       13, 13, v_exam_id),
      (gen_random_uuid()::text, 'Core Terraform workflow',                      13, 13, v_exam_id),
      (gen_random_uuid()::text, 'Terraform configuration',                      14, 14, v_exam_id),
      (gen_random_uuid()::text, 'Terraform modules',                            12, 12, v_exam_id),
      (gen_random_uuid()::text, 'Terraform state management',                   14, 14, v_exam_id),
      (gen_random_uuid()::text, 'Maintain infrastructure with Terraform',       13, 13, v_exam_id),
      (gen_random_uuid()::text, 'HCP Terraform',                                 9,  9, v_exam_id);
  END IF;

  -- ── Kubernetes CKA ───────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'Kubernetes CKA' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'Kubernetes CKA',
            'CKA', 2024, 17, 120, 66, v_cncf_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Cluster Architecture, Installation and Configuration', 25, 25, v_exam_id),
      (gen_random_uuid()::text, 'Workloads and Scheduling',                             15, 15, v_exam_id),
      (gen_random_uuid()::text, 'Services and Networking',                              20, 20, v_exam_id),
      (gen_random_uuid()::text, 'Storage',                                              10, 10, v_exam_id),
      (gen_random_uuid()::text, 'Troubleshooting',                                      30, 30, v_exam_id);
  END IF;

  -- ── CFA Level I ──────────────────────────────────────────────────────────
  -- Section weights are midpoints within official CFA Institute ranges (confirmed valid).
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'CFA Level I' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'CFA Level I',
            'CFA-I', 2025, 180, 270, 65, v_cfa_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Ethical and Professional Standards', 15, 20, v_exam_id),
      (gen_random_uuid()::text, 'Quantitative Methods',                6,  9, v_exam_id),
      (gen_random_uuid()::text, 'Economics',                           6,  9, v_exam_id),
      (gen_random_uuid()::text, 'Financial Statement Analysis',       11, 14, v_exam_id),
      (gen_random_uuid()::text, 'Corporate Issuers',                   6,  9, v_exam_id),
      (gen_random_uuid()::text, 'Equity Investments',                 11, 14, v_exam_id),
      (gen_random_uuid()::text, 'Fixed Income',                       11, 14, v_exam_id),
      (gen_random_uuid()::text, 'Derivatives',                         5,  8, v_exam_id),
      (gen_random_uuid()::text, 'Alternative Investments',             7, 10, v_exam_id),
      (gen_random_uuid()::text, 'Portfolio Management',                8, 12, v_exam_id);
  END IF;

  -- ── FRM Part I ───────────────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'FRM Part I' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'FRM Part I',
            'FRM-I', 2025, 100, 240, 60, v_garp_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Foundations of Risk Management',  20, 20, v_exam_id),
      (gen_random_uuid()::text, 'Quantitative Analysis',           20, 20, v_exam_id),
      (gen_random_uuid()::text, 'Financial Markets and Products',  30, 30, v_exam_id),
      (gen_random_uuid()::text, 'Valuation and Risk Models',       30, 30, v_exam_id);
  END IF;

  -- ── Certified Financial Planner (CFP – USA) ──────────────────────────────
  -- duration corrected: 370 → 360 (two 3-hour sessions).
  -- sections corrected per 2021 CFP Board Principal Knowledge Topics:
  --   added "Professional Conduct and Regulation" (8%); fixed weights for 2 sections.
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'Certified Financial Planner' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'Certified Financial Planner',
            'CFP', 2025, 170, 360, 64, v_cfpb_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Professional Conduct and Regulation',        8,  8,  v_exam_id),
      (gen_random_uuid()::text, 'General Principles of Financial Planning',  15, 15,  v_exam_id),
      (gen_random_uuid()::text, 'Risk Management and Insurance Planning',    11, 11,  v_exam_id),
      (gen_random_uuid()::text, 'Investment Planning',                       17, 17,  v_exam_id),
      (gen_random_uuid()::text, 'Tax Planning',                              14, 14,  v_exam_id),
      (gen_random_uuid()::text, 'Retirement Savings and Income Planning',    18, 18,  v_exam_id),
      (gen_random_uuid()::text, 'Estate Planning',                           10, 10,  v_exam_id),
      (gen_random_uuid()::text, 'Psychology of Financial Planning',           7,  7,  v_exam_id);
  END IF;

  -- ── CPA-10 ───────────────────────────────────────────────────────────────
  -- duration corrected: 75 → 90 (75 unconfirmable; best estimate from training data is 90 min).
  -- Note: replaced by new ANBIMA "CPA" certification as of Jan 2026; kept as historical reference.
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'CPA-10 — Certificação Profissional ANBIMA Série 10' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'CPA-10 — Certificação Profissional ANBIMA Série 10',
            'CPA-10', 2025, 50, 90, 70, v_anbima_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Sistema Financeiro Nacional e Participantes do Mercado', 5,  5,  v_exam_id),
      (gen_random_uuid()::text, 'Compliance, Ética e Análise do Perfil do Investidor',   10, 10, v_exam_id),
      (gen_random_uuid()::text, 'Noções de Economia e Finanças',                         15, 15, v_exam_id),
      (gen_random_uuid()::text, 'Princípios de Investimento',                            30, 30, v_exam_id),
      (gen_random_uuid()::text, 'Fundos de Investimento',                                20, 20, v_exam_id),
      (gen_random_uuid()::text, 'Instrumentos de Renda Fixa e Renda Variável',           10, 10, v_exam_id),
      (gen_random_uuid()::text, 'Previdência Complementar',                              10, 10, v_exam_id);
  END IF;

  -- ── CPA-20 ───────────────────────────────────────────────────────────────
  -- duration corrected: 120 → 150 min.
  -- sections corrected: 10 non-standard sections → 7 official ANBIMA modules with weight ranges.
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'CPA-20 — Certificação Profissional ANBIMA Série 20' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'CPA-20 — Certificação Profissional ANBIMA Série 20',
            'CPA-20', 2025, 60, 150, 70, v_anbima_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Sistema Financeiro Nacional e Participantes do Mercado',  5, 10, v_exam_id),
      (gen_random_uuid()::text, 'Compliance, Ética e Análise do Perfil do Investidor',    15, 25, v_exam_id),
      (gen_random_uuid()::text, 'Economia e Finanças',                                     5, 10, v_exam_id),
      (gen_random_uuid()::text, 'Renda Fixa, Renda Variável e Derivativos',               17, 25, v_exam_id),
      (gen_random_uuid()::text, 'Fundos de Investimento',                                 18, 25, v_exam_id),
      (gen_random_uuid()::text, 'Previdência Complementar',                                5, 10, v_exam_id),
      (gen_random_uuid()::text, 'Mensuração e Gestão de Performance e Riscos',            10, 20, v_exam_id);
  END IF;

  -- ── CEA — Certificação de Especialista em Investimentos ANBIMA ───────────
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'CEA — Certificação de Especialista em Investimentos ANBIMA' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'CEA — Certificação de Especialista em Investimentos ANBIMA',
            'CEA', 2025, 70, 150, 70, v_anbima_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Planejamento de Investimentos e API',                 15, 15, v_exam_id),
      (gen_random_uuid()::text, 'Fundos de Investimento',                              15, 15, v_exam_id),
      (gen_random_uuid()::text, 'Produtos de Renda Fixa',                              15, 15, v_exam_id),
      (gen_random_uuid()::text, 'Produtos de Renda Variável',                          15, 15, v_exam_id),
      (gen_random_uuid()::text, 'Derivativos',                                         10, 10, v_exam_id),
      (gen_random_uuid()::text, 'Análise de Investimentos',                            20, 20, v_exam_id),
      (gen_random_uuid()::text, 'Finanças Pessoais e Planejamento de Aposentadoria',   10, 10, v_exam_id);
  END IF;

  -- ── CFP — Planejador Financeiro Pessoal (PLANEJAR) ───────────────────────
  -- All three primary metrics corrected (seed had copied US CFP Board values by mistake):
  --   totalQuestions: 170 → 140
  --   examDurationMinutes: 360 → 420  (~7 hours; sources: Suno 7h05, PLANEJAR "7 horas")
  --   passingScore: 65 → 70
  -- sections: fully rewritten to 8-module FPSB 2026 format (effective 52nd exam, Apr 2026)
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'CFP — Planejador Financeiro Pessoal (PLANEJAR)' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'CFP — Planejador Financeiro Pessoal (PLANEJAR)',
            'CFP-BR', 2025, 140, 420, 70, v_planejar_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Planejamento Financeiro: Princípios, Processos e Habilidades', 13, 13, v_exam_id),
      (gen_random_uuid()::text, 'Gestão Financeira',                                            15, 15, v_exam_id),
      (gen_random_uuid()::text, 'Planejamento de Investimentos e Gestão de Ativos',             17, 17, v_exam_id),
      (gen_random_uuid()::text, 'Planejamento da Aposentadoria',                                12, 12, v_exam_id),
      (gen_random_uuid()::text, 'Planejamento de Seguros e Gestão de Riscos',                   12, 12, v_exam_id),
      (gen_random_uuid()::text, 'Planejamento Tributário',                                      12, 12, v_exam_id),
      (gen_random_uuid()::text, 'Planejamento Patrimonial e Sucessório',                        12, 12, v_exam_id),
      (gen_random_uuid()::text, 'Psicologia no Planejamento Financeiro',                         7,  7, v_exam_id);
  END IF;

  -- ── AAI — Agente Autônomo de Investimentos (ANCORD) ──────────────────────
  -- sections fully rewritten to the 14 official topic areas per the ANCORD/FGV regulation
  -- (CVM Resolução 178/23). Weights derived from question counts: area_questions/80.
  IF NOT EXISTS (SELECT 1 FROM "Exam" WHERE name = 'AAI — Agente Autônomo de Investimentos (ANCORD)' AND "isTemplate" = true) THEN
    v_exam_id := gen_random_uuid()::text;
    INSERT INTO "Exam" (id, type, name, key, year, "totalQuestions", "examDurationMinutes", "passingScore", "providerId", "isTemplate", "createdAt", "updatedAt")
    VALUES (v_exam_id, 'certification', 'AAI — Agente Autônomo de Investimentos (ANCORD)',
            'AAI', 2025, 80, 150, 70, v_ancord_id, true, NOW(), NOW());
    INSERT INTO "ExamSection" (id, name, "minQuestions", "maxQuestions", "examId") VALUES
      (gen_random_uuid()::text, 'Atividade do Assessor de Investimentos',                    15, 15, v_exam_id),  -- 12q
      (gen_random_uuid()::text, 'Prevenção à Lavagem de Dinheiro (PLD/AML)',                  5,  5, v_exam_id),  -- 4q
      (gen_random_uuid()::text, 'Economia',                                                   2,  2, v_exam_id),  -- 2q
      (gen_random_uuid()::text, 'Sistema Financeiro Nacional',                                4,  4, v_exam_id),  -- 3q
      (gen_random_uuid()::text, 'Instituições e Intermediadores Financeiros',                 4,  4, v_exam_id),  -- 3q
      (gen_random_uuid()::text, 'Administração de Risco',                                     5,  5, v_exam_id),  -- 4q
      (gen_random_uuid()::text, 'Mercado de Capitais — Produtos e Modalidades Operacionais', 25, 25, v_exam_id),  -- 20q
      (gen_random_uuid()::text, 'Fundos de Investimento',                                     5,  5, v_exam_id),  -- 4q
      (gen_random_uuid()::text, 'Fundos de Investimento — Anexos CVM 175/23',                 2,  2, v_exam_id),  -- 2q
      (gen_random_uuid()::text, 'Securitização de Recebíveis',                                1,  1, v_exam_id),  -- 1q
      (gen_random_uuid()::text, 'Clubes de Investimentos',                                    3,  3, v_exam_id),  -- 2q (rounded up)
      (gen_random_uuid()::text, 'Matemática Financeira',                                      5,  5, v_exam_id),  -- 4q
      (gen_random_uuid()::text, 'Mercado Financeiro — Outros Produtos',                       9,  9, v_exam_id),  -- 7q
      (gen_random_uuid()::text, 'Mercados Derivativos',                                      15, 15, v_exam_id);  -- 12q
  END IF;

END $$;
