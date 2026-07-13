-- Change simuladoQuestionId FK from RESTRICT to CASCADE on CertificationSimuladoAttemptAnswer
-- so that deleting a CertificationSimuladoQuestion also removes its attempt answers
ALTER TABLE "public"."CertificationSimuladoAttemptAnswer"
    DROP CONSTRAINT "CertificationSimuladoAttemptAnswer_simuladoQuestionId_fkey";

ALTER TABLE "public"."CertificationSimuladoAttemptAnswer"
    ADD CONSTRAINT "CertificationSimuladoAttemptAnswer_simuladoQuestionId_fkey"
    FOREIGN KEY ("simuladoQuestionId")
    REFERENCES "public"."CertificationSimuladoQuestion"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
