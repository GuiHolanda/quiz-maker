import { certificationQuestionsResearchPrompt } from '@/config/prompts/certification-questions/research.prompt';
import { certificationQuestionsFormatPrompt } from '@/config/prompts/certification-questions/format.prompt';
import { certificationQuestionsReviewPrompt } from '@/config/prompts/certification-questions/review.prompt';
import { certificationAnswersPrompt } from '@/config/prompts/certification-questions/answers.prompt';
import { publicExamQuestionsResearchPrompt } from '@/config/prompts/public-exam-questions/research.prompt';
import { publicExamQuestionsFormatPrompt } from '@/config/prompts/public-exam-questions/format.prompt';
import { publicExamQuestionsReviewPrompt } from '@/config/prompts/public-exam-questions/review.prompt';
import { publicExamAnswersPrompt } from '@/config/prompts/public-exam-questions/answers.prompt';

const certResearch = (format?: 'mc_4' | 'mc_5' | 'true_false') =>
  certificationQuestionsResearchPrompt.build({
    certification_name: 'AWS Solutions Architect',
    topic_name: 'Networking',
    num_questions: '5',
    format,
  });

const certFormat = (format?: 'mc_4' | 'mc_5' | 'true_false') =>
  certificationQuestionsFormatPrompt.build({
    certification_name: 'AWS Solutions Architect',
    topic_name: 'Networking',
    reviewed_questions: 'x',
    format,
  });

const publicResearch = (format?: 'mc_4' | 'mc_5' | 'true_false') =>
  publicExamQuestionsResearchPrompt.build({
    public_exam_name: 'TRF 1',
    exam_board_name: 'Cebraspe',
    subject_name: 'Direito Administrativo',
    num_questions: '5',
    format,
  });

describe('drafting prompts derive the option block from the format', () => {
  it('asks for five labeled options by default', () => {
    // No format supplied must keep producing exactly what the pipeline produced before.
    const prompt = certResearch();

    expect(prompt).toContain('exactly 5 options labeled A, B, C, D, E');
    expect(prompt).toContain('A: <option text>\nB: <option text>\nC: <option text>\nD: <option text>\nE: <option text>');
  });

  it('asks for four options and never mentions E when the exam is mc_4', () => {
    const prompt = certResearch('mc_4');

    expect(prompt).toContain('exactly 4 options labeled A, B, C, D');
    expect(prompt).toContain('D: <option text>');
    expect(prompt).not.toContain('E: <option text>');
  });

  it('asks for a Certo/Errado assertion with no distractors', () => {
    const prompt = certResearch('true_false');

    expect(prompt).toContain('C: Certo\nE: Errado');
    expect(prompt).toContain('Never write distractors');
    expect(prompt).not.toContain('A: <option text>');
  });

  it('caps the offered correctCount at what the format can hold', () => {
    expect(certResearch('mc_5')).toContain('correctCount: <1|2|3>');
    expect(certResearch('mc_4')).toContain('correctCount: <1|2>');
    expect(certResearch('true_false')).toContain('correctCount: <1>');
  });

  it('applies the same derivation to the concursos drafting prompt', () => {
    expect(publicResearch('true_false')).toContain('C: Certo\nE: Errado');
    expect(publicResearch('mc_4')).not.toContain('E: <texto>');
    expect(publicResearch()).toContain('correctCount: <1|2|3>');
  });
});

describe('format prompts derive the JSON skeleton from the format', () => {
  it('emits the full A–E skeleton by default', () => {
    expect(certFormat()).toContain('"options":{"A":"<text>","B":"<text>","C":"<text>","D":"<text>","E":"<text>"}');
  });

  it('emits only the labels the format declares', () => {
    const prompt = certFormat('mc_4');

    expect(prompt).toContain('"options":{"A":"<text>","B":"<text>","C":"<text>","D":"<text>"}');
    expect(prompt).toContain('exactly the keys A, B, C, D');
    expect(prompt).toContain('correctCount (integer 1–2)');
  });

  it('emits the Certo/Errado skeleton', () => {
    const prompt = certFormat('true_false');

    expect(prompt).toContain('"options":{"C":"<text>","E":"<text>"}');
    expect(prompt).toContain('exactly the keys C, E');
  });

  it('applies the same derivation to the concursos format prompt', () => {
    const prompt = publicExamQuestionsFormatPrompt.build({
      public_exam_name: 'TRF 1',
      exam_board_name: 'Cebraspe',
      subject_name: 'Direito Administrativo',
      reviewed_questions: 'x',
      format: 'true_false',
    });

    expect(prompt).toContain('"options":{"C":"<texto>","E":"<texto>"}');
    expect(prompt).toContain('exatamente as chaves C, E');
  });
});

describe('review prompts bound correctCount to the format ceiling', () => {
  it('tells the certification editor the hard ceiling and forbids raising it', () => {
    const prompt = certificationQuestionsReviewPrompt.build({
      certification_name: 'AWS Solutions Architect',
      topic_name: 'Networking',
      draft_questions: 'x',
      format: 'mc_5',
    });

    expect(prompt).toContain('`correctCount` must stay between 1 and 3');
    expect(prompt).toContain('never raise it above 3');
  });

  it('tells the concursos editor the hard ceiling for a four-option exam', () => {
    const prompt = publicExamQuestionsReviewPrompt.build({
      public_exam_name: 'TRF 1',
      exam_board_name: 'FCC',
      subject_name: 'Direito Administrativo',
      draft_questions: 'x',
      format: 'mc_4',
    });

    expect(prompt).toContain('permanecer entre 1 e 2');
    expect(prompt).toContain('nunca o aumente acima de 2');
  });
});

describe('answers prompts constrain the gabarito to the format labels', () => {
  it('restricts the certification gabarito to the declared labels', () => {
    expect(certificationAnswersPrompt.build({ certification_name: 'AWS', topic: 'VPC', questions: '[]' })).toContain(
      'drawn only from A, B, C, D, E'
    );

    expect(
      certificationAnswersPrompt.build({
        certification_name: 'AWS',
        topic: 'VPC',
        questions: '[]',
        format: 'mc_4',
      })
    ).toContain('drawn only from A, B, C, D');
  });

  it('restricts the concursos gabarito to the declared labels', () => {
    const prompt = publicExamAnswersPrompt.build({
      public_exam_name: 'TRF 1',
      exam_board_name: 'Cebraspe',
      subject_name: 'Direito Administrativo',
      questions: [],
      format: 'true_false',
    });

    expect(prompt).toContain('apenas dentro de C, E');
  });
});
