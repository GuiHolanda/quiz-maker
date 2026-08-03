'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { HeroCta } from '@/app/(marketing)/components/HeroCta';

export function HeroStaticContent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="font-sora font-extrabold text-white text-3xl sm:text-4xl xl:text-5xl leading-tight mb-6">
        {t('homepage.hero.headline')}
      </h1>
      <p className="text-navy-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
        {t('homepage.hero.description')}
      </p>
      <HeroCta />
      <div className="flex items-center gap-6">
        <div className="flex -space-x-2">
          {['AB', 'ML', 'RC', 'PK'].map((initials) => (
            <div
              key={initials}
              className="w-8 h-8 rounded-full border-2 border-navy-900 bg-navy-700 flex items-center justify-center text-[10px] font-bold text-navy-300"
            >
              {initials}
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <FontAwesomeIcon key={i} className="text-yellow-400 text-xs" icon={faStar} />
            ))}
          </div>
          <p className="font-mono text-xs text-navy-400">
            {t('homepage.hero.professionalsCertified', { count: '12,400' })}
          </p>
        </div>
      </div>
    </div>
  );
}
