'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // 1. ADIM: Kullanıcı girişi yap
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert('Giriş hatası: ' + error.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            // 2. ADIM: profiles tablosundan ROL bilgisini çek
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile) {
                alert('Profil bilgisi bulunamadı!');
                setLoading(false);
                return;
            }

            // 3. ADIM: Rol kontrolü ve doğru sayfaya yönlendirme
            // Veritabanında 'admin' veya 'worker' olarak kayıtlı olduğunu varsayıyoruz
            const userRole = profile.role?.toLowerCase();

            if (userRole === 'admin') {
                router.push('/dashboard'); // Yönetici Paneli
            } else if (userRole === 'worker') {
                router.push('/worker');    // Saha Çalışanı Sayfası
            } else {
                alert('Tanımsız rol yetkisi!');
            }
        }

        setLoading(false);
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-2xl border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-blue-700 tracking-tight">Sistem Girişi</h1>
                    <p className="text-gray-500 font-medium mt-2">Lütfen bilgilerinizi kontrol edin</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">E-posta</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-xl border border-gray-300 p-4 text-black font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Şifre</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full rounded-xl border border-gray-300 p-4 text-black font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white hover:bg-blue-700 shadow-lg transition-all active:scale-[0.98] disabled:bg-gray-400"
                    >
                        {loading ? 'Kontrol Ediliyor...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </main>
    );
}