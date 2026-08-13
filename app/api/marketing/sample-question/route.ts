import { NextRequest, NextResponse } from 'next/server';

import { DemoQuizService } from '@/features/services/demo-quiz.service';
import { EXAM_LANDING_PAGE_MAP } from '@/config/exam-landing-pages';
import { toApiErrorResponse } from '@/lib/api-error';

export const maxDuration = 60;
export const revalidate = 3600;

const demoQuizService = new DemoQuizService();

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');

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
      count: 1,
    });

    return NextResponse.json({ question: questions[0] ?? null });
  } catch (err: unknown) {
    console.error('Failed to generate sample question:', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
