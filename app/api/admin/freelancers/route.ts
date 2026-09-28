import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isExplicitAdminEmail } from '@/lib/supabase/admin-queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('freelancers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message, freelancers: [] }, { status: 500 });
    }

    let freelancers = data || [];
    freelancers = freelancers.map((f: any) => {
      if (isExplicitAdminEmail(f.email)) {
        return { ...f, is_admin: true };
      }
      const nameLower = (f.name || '').toLowerCase();
      const emailLower = (f.email || '').toLowerCase();
      if (nameLower.includes('edoxe') || emailLower.includes('edoxe')) {
        return { ...f, is_admin: false };
      }
      return f;
    });

    return NextResponse.json({ freelancers });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error', freelancers: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      country,
      timezone,
      status = 'active',
      commission_rate,
      user_id,
      is_admin = false,
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Safe commission rate conversion (e.g. 15% -> 0.150 for numeric(4,3) safety)
    const rawRate = parseFloat(commission_rate);
    const normalizedRate = isNaN(rawRate) ? 0.15 : rawRate > 1 ? rawRate / 100 : rawRate;

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      country: country?.trim() || null,
      timezone: timezone?.trim() || null,
      status: status || 'active',
      commission_rate: normalizedRate,
      user_id: user_id?.trim() || null,
      is_admin: Boolean(is_admin),
      created_at: new Date().toISOString(),
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('freelancers')
      .insert(payload)
      .select()
      .single();

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

    return NextResponse.json({ freelancer: data, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create freelancer' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, commission_rate, status, is_admin } = body;

    if (!id) {
      return NextResponse.json({ error: 'Freelancer ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (commission_rate !== undefined) {
      const rawRate = parseFloat(commission_rate);
      updates.commission_rate = isNaN(rawRate) ? 0.15 : rawRate > 1 ? rawRate / 100 : rawRate;
    }
    if (status !== undefined) {
      updates.status = status;
    }
    if (is_admin !== undefined) {
      updates.is_admin = Boolean(is_admin);
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('freelancers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ freelancer: data, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update freelancer' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Freelancer ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Step 1: Unassign leads
    await supabase.from('leads').update({ assigned_to: null }).eq('assigned_to', id);

    // Step 2: Delete freelancer row
    const { error } = await supabase.from('freelancers').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete freelancer' }, { status: 500 });
  }
}
