import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck, faClock, faAward, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import type { ExamLandingConfig } from '@/shared/types';

interface ExamLandingStatsProps {
  readonly config: ExamLandingConfig;
}

interface StatItem {
  readonly icon: IconDefinition;
  readonly value: string;
  readonly label: string;
}

export function ExamLandingStats({ config }: ExamLandingStatsProps) {
  const stats: StatItem[] = [
    { icon: faListCheck, value: String(config.totalQuestions), label: 'questões no exame' },
    { icon: faClock, value: String(config.examDurationMinutes), label: 'minutos de duração' },
    { icon: faAward, value: `${config.passingScore}%`, label: 'de aproveitamento mínimo' },
    { icon: faLayerGroup, value: String(config.topics.length), label: 'tópicos cobertos' },
  ];

  return (
    <section className="py-10 bg-navy-950 border-y border-navy-800/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <FontAwesomeIcon className="text-[#e07820] text-lg mb-2" icon={stat.icon} />
              <div className="font-mono text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-navy-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
