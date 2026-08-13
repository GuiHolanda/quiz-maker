import { NextRequest, NextResponse } from 'next/server';

import { DemoQuizService } from '@/features/services/demo-quiz.service';
import { EXAM_LANDING_PAGE_MAP } from '@/config/exam-landing-pages';
import { toApiErrorResponse } from '@/lib/api-error';

export const maxDuration = 60;

const demoQuizService = new DemoQuizService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const config = EXAM_LANDING_PAGE_MAP.get(slug);
    if (!config) {
      return NextResponse.json({ error: 'Unknown exam slug' }, { status: 404 });
    }

    const questions = await demoQuizService.generate({
      examName: config.name,
      examType: config.examType,
      topics: config.topics as string[],
      count: 20,
    });

    return NextResponse.json({ questions });
  } catch (err: unknown) {
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
