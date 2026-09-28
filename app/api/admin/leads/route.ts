import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leads = body.leads;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'No leads provided' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const batchSize = 100;
    const insertedLeads: any[] = [];

    for (let i = 0; i < leads.length; i += batchSize) {
      const chunk = leads.slice(i, i + batchSize);
      const chunkPayload = chunk.map((r: any) => ({
        business_name: r.business_name?.trim() || 'Unnamed Business',
        phone: r.phone?.trim() || '',
        email: r.email?.trim() || null,
        address: r.address?.trim() || null,
        city: r.city?.trim() || null,
        state: r.state?.trim() || null,
        category: r.category?.trim() || null,
        status: r.status || 'new',
        assigned_to: r.assigned_to || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('leads')
        .insert(chunkPayload)
        .select();

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          },
          { status: 400 }
        );
      }

      if (data) {
        insertedLeads.push(...data);
      }
    }

    return NextResponse.json({ success: true, count: insertedLeads.length, leads: insertedLeads });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to upload leads' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { leadIds, assigned_to } = body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds must be an array' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('leads')
      .update({
        assigned_to: assigned_to || null,
        updated_at: new Date().toISOString(),
      })
      .in('id', leadIds)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, updatedCount: data?.length ?? leadIds.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to reassign leads' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { leadIds } = body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds array required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const batchSize = 100;

    for (let i = 0; i < leadIds.length; i += batchSize) {
      const chunk = leadIds.slice(i, i + batchSize);

      await Promise.all([
        supabase.from('calls').delete().in('lead_id', chunk),
        supabase.from('meetings').delete().in('lead_id', chunk),
        supabase.from('sales').delete().in('lead_id', chunk),
      ]);

      const { error } = await supabase.from('leads').delete().in('id', chunk);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, count: leadIds.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete leads' }, { status: 500 });
  }
}
