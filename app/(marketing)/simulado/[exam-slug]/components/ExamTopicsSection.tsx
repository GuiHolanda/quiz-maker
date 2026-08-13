import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

import type { ExamLandingConfig } from '@/shared/types';

interface ExamTopicsSectionProps {
  readonly config: ExamLandingConfig;
}

export function ExamTopicsSection({ config }: ExamTopicsSectionProps) {
  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="font-mono text-xs text-navy-500 uppercase tracking-widest">Conteúdo programático</span>
          <h2 className="font-sora font-bold text-white text-2xl sm:text-3xl mt-2">
            O que você vai treinar
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {config.topics.map((topic) => (
            <div
              key={topic}
              className="flex items-center gap-3 bg-navy-900/60 border border-navy-800 rounded-lg px-4 py-3"
            >
              <FontAwesomeIcon className="text-[#e07820] text-xs shrink-0" icon={faCheck} />
              <span className="text-sm text-navy-200">{topic}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
