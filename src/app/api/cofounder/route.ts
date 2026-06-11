import { NextRequest, NextResponse } from 'next/server';
import { runCoFounderModule, CoFounderModule } from '@/ai/flows/cofounder-flow';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      module,
      idea,
      sector,
      stage,
      revenueModel,
      targetMarket,
      teamSize,
      location,
      useOllama,
      ollamaBaseUrl,
      ollamaModel,
    } = body;

    if (!module || !idea) {
      return NextResponse.json(
        { error: 'Missing required fields: module and idea' },
        { status: 400 }
      );
    }

    const validModules: CoFounderModule[] = [
      'validate',
      'competitors',
      'pitch-deck',
      'discovery',
      'financials',
      'investors',
      'hiring',
      'schemes',
      'cofounder-match',
    ];

    if (!validModules.includes(module as CoFounderModule)) {
      return NextResponse.json(
        { error: `Invalid module. Must be one of: ${validModules.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await runCoFounderModule({
      module: module as CoFounderModule,
      idea,
      sector,
      stage,
      revenueModel,
      targetMarket,
      teamSize,
      location,
      useOllama,
      ollamaBaseUrl,
      ollamaModel,
    });

    return NextResponse.json({ result: JSON.parse(result) });
  } catch (error: any) {
    console.error('[CoFounder API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Co-Founder AI execution failed' },
      { status: 500 }
    );
  }
}
