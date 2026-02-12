'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        companyCount: 0,
        taskCount: 0,
        workerCount: 0
    });
    const router = useRouter();

    useEffect(() => {
        // 1. Oturum Kontrolü
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/');
            } else {
                setUser(session.user);
                fetchStats(); // Kullanıcı varsa verileri çek
            }
        };

        // 2. İstatistikleri Veritabanından Çeken Fonksiyon
        const fetchStats = async () => {
            // Firmaları Say
            const { count: companies } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true });

            // Bekleyen Görevleri Say (Sadece 'beklemede' olanlar)
            const { count: tasks } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'beklemede');

            // Personelleri Say (Admin hariç, sadece worker'lar)
            const { count: workers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'worker');

            // Sayıları ekrana yansıt
            setStats({
                companyCount: companies || 0,
                taskCount: tasks || 0,
                workerCount: workers || 0
            });
        };

        checkUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (!user) return <div className="flex min-h-screen items-center justify-center">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">

                {/* Üst Başlık ve Çıkış */}
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Yönetim Paneli</h1>
                        <p className="text-sm text-gray-500">Hoşgeldin, <span className="font-semibold text-blue-600">{user.email}</span></p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                        Çıkış Yap
                    </button>
                </div>

                {/* İstatistik Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Kart 1: Firmalar */}
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex flex-col items-center">
                        <h3 className="font-bold text-blue-800 mb-2">Toplam Firma</h3>
                        <p className="text-4xl font-extrabold text-blue-600">{stats.companyCount}</p>
                    </div>

                    {/* Kart 2: Aktif Görevler */}
                    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100 flex flex-col items-center">
                        <h3 className="font-bold text-yellow-800 mb-2">Bekleyen İşler</h3>
                        <p className="text-4xl font-extrabold text-yellow-600">{stats.taskCount}</p>
                    </div>

                    {/* Kart 3: Personel */}
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 flex flex-col items-center">
                        <h3 className="font-bold text-purple-800 mb-2">Çalışan Personel</h3>
                        <p className="text-4xl font-extrabold text-purple-600">{stats.workerCount}</p>
                    </div>

                </div>

            </div>
        </div>
    );
}