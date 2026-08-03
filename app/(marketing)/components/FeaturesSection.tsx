'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faRobot, faFileLines } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-navy-950 border-t border-navy-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <h2 className="font-sora font-bold text-white text-2xl sm:text-3xl mb-3">
            {t('homepage.features.title.before')}{' '}
            <span className="text-accent">{t('homepage.features.title.highlight')}</span>
          </h2>
          <p className="text-navy-400 text-base max-w-2xl">{t('homepage.features.subtitle')}</p>
        </div>

        {renderFeature1()}
        {renderFeature2()}
        {renderFeature3()}
      </div>
    </section>
  );

  function renderFeature1() {
    return (
      <div className="grid lg:grid-cols-2 gap-10 items-center mb-16 pb-16 border-b border-navy-800/40">
        <div className="order-2 lg:order-1">
          <h3 className="font-sora font-bold text-white text-xl sm:text-2xl mb-4">
            {t('homepage.features.ai.heading')}
          </h3>
          <p className="text-navy-400 text-base leading-relaxed mb-6">{t('homepage.features.ai.body')}</p>
          <div className="space-y-3">
            {[
              t('homepage.features.feature1.bullet1'),
              t('homepage.features.feature1.bullet2'),
              t('homepage.features.feature1.bullet3'),
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 py-3 border-b border-navy-800/40 last:border-0">
                <FontAwesomeIcon className="text-accent text-xs w-4 shrink-0" icon={faCheck} />
                <span className="text-sm text-navy-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="relative border border-navy-700 rounded-lg overflow-hidden bg-navy-900/60">
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
              <div className="scan-line" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon className="text-navy-500 text-sm" icon={faFileLines} />
                <span className="font-mono text-xs text-navy-500">
                  source_material.pdf → AWS_Well_Architected_Framework.pdf
                </span>
              </div>
              <div className="bg-navy-950/60 rounded p-4 mb-4 border border-navy-800">
                <p className="font-mono text-xs text-navy-400 leading-relaxed">
                  <span className="text-navy-600 select-none">01 </span>The Well-Architected Framework provides a
                  consistent approach...
                  <br />
                  <span className="text-navy-600 select-none">02 </span>
                  <span className="px-0.5" style={{ background: 'rgba(0,212,255,0.2)', color: '#00d4ff' }}>
                    The five pillars include: Operational Excellence, Security, Reliability,
                  </span>
                  <br />
                  <span className="text-navy-600 select-none">03 </span>
                  <span className="px-0.5" style={{ background: 'rgba(0,212,255,0.2)', color: '#00d4ff' }}>
                    Performance Efficiency, and Cost Optimization.
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-navy-800" />
                <span className="font-mono text-xs text-accent px-2">AI PROCESSING</span>
                <div className="h-px flex-1 bg-navy-800" />
              </div>
              <div className="bg-navy-950/60 rounded p-4 border border-accent/20">
                <p className="font-mono text-xs text-navy-500 uppercase tracking-widest mb-2">Generated Question:</p>
                <p className="font-mono text-xs text-white">
                  Which of the following correctly identifies the five pillars of the AWS Well-Architected Framework?
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded"
                    style={{
                      background: 'rgba(74,222,128,0.1)',
                      color: '#4ade80',
                      border: '1px solid rgba(74,222,128,0.2)',
                    }}
                  >
                    Quality: 98/100
                  </span>
                  <span className="font-mono text-xs text-navy-500">· 4 distractors generated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderFeature2() {
    return (
      <div className="grid lg:grid-cols-2 gap-10 items-center mb-16 pb-16 border-b border-navy-800/40">
        <div>
          <div className="border border-navy-700 rounded-lg overflow-hidden bg-navy-900/60">
            <div className="flex border-b border-navy-800">
              <div className="flex-1 p-4 border-r border-navy-800">
                <p className="font-mono text-xs text-navy-500 uppercase tracking-widest mb-3">
                  {t('homepage.features.mockup.yourAnswer')}
                </p>
                <div className="rounded p-3 bg-danger/10 border border-danger/30">
                  <div className="flex items-start gap-2">
                    <FontAwesomeIcon className="text-red-400 text-xs mt-0.5 shrink-0" icon={faXmark} />
                    <p className="font-mono text-xs text-red-300">
                      A. SQS standard queues guarantee exactly-once delivery
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4">
                <p className="font-mono text-xs text-navy-500 uppercase tracking-widest mb-3">
                  {t('homepage.features.mockup.correctAnswer')}
                </p>
                <div className="rounded p-3 bg-success/10 border border-success/30">
                  <div className="flex items-start gap-2">
                    <FontAwesomeIcon className="text-green-400 text-xs mt-0.5 shrink-0" icon={faCheck} />
                    <p className="font-mono text-xs text-green-300">D. FIFO queues provide exactly-once processing</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-accent/10 border border-accent/30">
                  <FontAwesomeIcon className="text-accent text-xs" icon={faRobot} />
                </div>
                <span className="font-mono text-xs text-accent">{t('homepage.features.mockup.aiExplanation')}</span>
              </div>
              <p className="font-mono text-xs text-navy-300 leading-relaxed">
                Standard SQS queues use a distributed architecture providing{' '}
                <span className="text-white">at-least-once delivery</span>, meaning duplicates can occur. FIFO queues
                ensure <span className="text-white">exactly-once processing</span> using message deduplication IDs.
              </p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-sora font-bold text-white text-xl sm:text-2xl mb-4">
            {t('homepage.features.answers.heading')}
          </h3>
          <p className="text-navy-400 text-base leading-relaxed mb-6">{t('homepage.features.answers.body')}</p>
          <div className="space-y-3">
            {[
              t('homepage.features.feature2.bullet1'),
              t('homepage.features.feature2.bullet2'),
              t('homepage.features.feature2.bullet3'),
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 py-3 border-b border-navy-800/40 last:border-0">
                <FontAwesomeIcon className="text-accent text-xs w-4 shrink-0" icon={faCheck} />
                <span className="text-sm text-navy-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderFeature3() {
    const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8'];
    const yourScore = [32, 41, 48, 55, 59, 67, 73, 78];
    const cohort = [30, 35, 39, 44, 49, 53, 57, 61];
    const passLine = 72;

    const W = 480,
      H = 200,
      PAD = { t: 10, r: 12, b: 32, l: 36 };
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;
    const minY = 20,
      maxY = 90;

    function sx(i: number) {
      return PAD.l + (i / (weeks.length - 1)) * innerW;
    }
    function sy(v: number) {
      return PAD.t + innerH - ((v - minY) / (maxY - minY)) * innerH;
    }

    const yourPath = yourScore.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i)},${sy(v)}`).join(' ');
    const cohortPath = cohort.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i)},${sy(v)}`).join(' ');
    const fillPath = `${yourPath} L${sx(yourScore.length - 1)},${sy(minY)} L${sx(0)},${sy(minY)} Z`;

    const yTicks = [20, 40, 60, 80];

    return (
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="order-2 lg:order-1">
          <h3 className="font-sora font-bold text-white text-xl sm:text-2xl mb-4">
            {t('homepage.features.feature3.heading')}
          </h3>
          <p className="text-navy-400 text-base leading-relaxed mb-6">{t('homepage.features.feature3.body')}</p>
          <div className="space-y-3">
            {[
              t('homepage.features.feature3.bullet1'),
              t('homepage.features.feature3.bullet2'),
              t('homepage.features.feature3.bullet3'),
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 py-3 border-b border-navy-800/40 last:border-0">
                <FontAwesomeIcon className="text-accent text-xs w-4 shrink-0" icon={faCheck} />
                <span className="text-sm text-navy-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="border border-navy-700 rounded-lg bg-navy-900/60 p-4">
            {/* Chart header */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-navy-400 uppercase tracking-widest">
                {t('homepage.features.chart.title')}
              </span>
              <span className="font-mono text-xs text-green-400">{t('homepage.features.chart.weeklyGain')}</span>
            </div>

            {/* SVG chart */}
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="w-full"
              style={{ height: 200 }}
              role="img"
              aria-label={t('homepage.features.chart.ariaLabel')}
            >
              {/* Grid lines + Y ticks */}
              {yTicks.map((v) => (
                <g key={v}>
                  <line
                    x1={PAD.l}
                    y1={sy(v)}
                    x2={W - PAD.r}
                    y2={sy(v)}
                    stroke="rgba(59,111,160,0.15)"
                    strokeWidth="1"
                  />
                  <text x={PAD.l - 4} y={sy(v) + 4} textAnchor="end" fontSize="9" fill="#4d87bc" fontFamily="monospace">
                    {v}%
                  </text>
                </g>
              ))}

              {/* Pass threshold dashed line */}
              <line
                x1={PAD.l}
                y1={sy(passLine)}
                x2={W - PAD.r}
                y2={sy(passLine)}
                stroke="#4ade80"
                strokeWidth="1"
                strokeDasharray="5,4"
              />

              {/* Fill under your score */}
              <path d={fillPath} fill="rgba(0,212,255,0.06)" />

              {/* Cohort avg dashed */}
              <path d={cohortPath} fill="none" stroke="#3b6fa0" strokeWidth="1.5" strokeDasharray="4,3" />

              {/* Your score line */}
              <path
                d={yourPath}
                fill="none"
                stroke="#00d4ff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dots on your score */}
              {yourScore.map((v, i) => (
                <circle key={i} cx={sx(i)} cy={sy(v)} r="3.5" fill="#00d4ff" />
              ))}

              {/* X-axis labels */}
              {weeks.map((w, i) => (
                <text
                  key={w}
                  x={sx(i)}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#4d87bc"
                  fontFamily="monospace"
                >
                  {w}
                </text>
              ))}
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-1 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 bg-accent rounded" />
                <span className="font-mono text-xs text-navy-500">{t('homepage.features.chart.yourScore')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="20" height="2" aria-hidden="true">
                  <line x1="0" y1="1" x2="20" y2="1" stroke="#3b6fa0" strokeWidth="1.5" strokeDasharray="4,3" />
                </svg>
                <span className="font-mono text-xs text-navy-500">{t('homepage.features.chart.avgCohort')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="20" height="2" aria-hidden="true">
                  <line x1="0" y1="1" x2="20" y2="1" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="5,4" />
                </svg>
                <span className="font-mono text-xs text-navy-500">{t('homepage.features.chart.passThreshold')}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-navy-800">
              <div className="text-center">
                <p className="font-mono text-sm text-white font-medium">78.4%</p>
                <p className="font-mono text-xs text-navy-500 mt-0.5">{t('homepage.features.chart.current')}</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-sm text-green-400 font-medium">82.1%</p>
                <p className="font-mono text-xs text-navy-500 mt-0.5">{t('homepage.features.chart.projected')}</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-sm text-accent font-medium">Top 12%</p>
                <p className="font-mono text-xs text-navy-500 mt-0.5">{t('homepage.features.chart.peerRank')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
