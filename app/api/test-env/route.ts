import { NextResponse } from 'next/server';
import { designBuilding } from '@/lib/floor-zero';
import { createGoal } from '@/lib/building-manager';

export async function GET() {
  try {
    const goal = await createGoal({
      customerId: 'test@test.com',
      email: 'test@test.com', 
      goalText: 'Say hello in 5 words',
    });
    const result = await designBuilding(goal.id, 'Say hello in 5 words', '', null);
    return NextResponse.json({ summary: result.buildingSummary?.slice(0, 100) });
  } catch (e: any) {
    return NextResponse.json({ 
      error: e.message?.slice(0, 300),
      raw: e.message?.includes('Raw response:\n') ? e.message.split('Raw response:\n')[1]?.slice(0, 200) : 'no raw'
    }, { status: 500 });
  }
}
