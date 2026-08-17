import { NextResponse } from 'next/server';

import { DemoCatalogService } from '@/features/services/demo-catalog.service';
import { toApiErrorResponse } from '@/lib/api-error';

export const revalidate = 3600;

const demoCatalogService = new DemoCatalogService();

export async function GET() {
  try {
    const exams = await demoCatalogService.listDemoExams();

    return NextResponse.json({ exams });
  } catch (err: unknown) {
    console.error('Failed to list demo catalog:', err);
    const { status, ...body } = toApiErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
