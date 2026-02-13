import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin yetkisiyle işlem yapmak için service_role kullanıyoruz
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: { autoRefreshToken: false, persistSession: false }
    }
);

// 1. YENİ PERSONEL EKLE (POST)
export async function POST(request: Request) {
    try {
        const { email, password, full_name, role } = await request.json();

        // A. Supabase Auth üzerinde kullanıcıyı oluştur
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, role: role || 'worker' }
        });

        if (authError) throw authError;

        // B. ÇÖZÜM: .insert() yerine .upsert() kullanıyoruz
        // Eğer bir trigger zaten profil oluşturmuşsa, upsert mevcut kaydı bulur ve email/isim bilgilerini üzerine yazar.
        if (authData.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert(
                    {
                        id: authData.user.id, // auth.users.id ile eşleşen UUID
                        full_name: full_name,
                        role: role || 'worker',
                        email: email // Profiles tablosundaki email sütunu
                    },
                    { onConflict: 'id' } // ID çakışması durumunda üzerine yaz (güncelle)
                );

            if (profileError) {
                console.error("Profil güncelleme hatası:", profileError.message);
                throw new Error("Kullanıcı oluşturuldu ancak profil bilgileri işlenemedi: " + profileError.message);
            }
        }

        return NextResponse.json({ success: true, user: authData.user }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// 2. PERSONEL BİLGİLERİNİ GÜNCELLE (PUT)
export async function PUT(request: Request) {
    try {
        const { id, full_name, role, password } = await request.json();

        // 1. Profiller tablosundaki isim ve yetkiyi güncelle
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ full_name, role })
            .eq('id', id);

        if (profileError) throw profileError;

        // 2. Şifre güncelleme işlemi
        if (password && password.length >= 6) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
            if (authError) throw authError;
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// 3. PERSONELİ SİL (DELETE)
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new Error('ID bulunamadı');

        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw error;

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}