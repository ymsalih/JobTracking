'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        companyCount: 0,
        pendingTasks: 0,
        workerCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                await fetchStats();
            }
            setLoading(false);
        };

        const fetchStats = async () => {
            // 1. Toplam Firma Sayısı
            const { count: companies } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true });

            // 2. Bekleyen İşler (Veritabanındaki 'pending' durumuna göre güncellendi)
            const { count: tasks } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // 3. Çalışan Personel Sayısı
            const { count: workers } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'worker');

            setStats({
                companyCount: companies || 0,
                pendingTasks: tasks || 0,
                workerCount: workers || 0
            });
        };

        fetchUserData();
    }, []);

    if (loading) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Üst Karşılama Kartı */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Sistem Özeti</h1>
                    <p className="text-gray-500 mt-2 font-medium text-lg">
                        Hoşgeldin, <span className="text-blue-600 font-extrabold">{user?.email}</span>. Sistemin güncel durumu aşağıdadır:
                    </p>
                </div>
                {/* Dekoratif Arka Plan Objesi */}
                <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
            </div>

            {/* İstatistik Grid Yapısı */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Toplam Firma Kartı */}
                <div className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-2xl group-hover:scale-110 transition-transform duration-300">🏢</div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">Aktif Portföy</span>
                    </div>
                    <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Toplam Firma</h3>
                    <p className="text-6xl font-black text-gray-900 mt-2 group-hover:text-blue-600 transition-colors tracking-tighter">
                        {stats.companyCount}
                    </p>
                </div>

                {/* Bekleyen İşler Kartı */}
                <div className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 rounded-2xl text-2xl group-hover:scale-110 transition-transform duration-300">⏳</div>
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-md">İşlem Bekleyen</span>
                    </div>
                    <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Bekleyen İşler</h3>
                    <p className="text-6xl font-black text-gray-900 mt-2 group-hover:text-orange-500 transition-colors tracking-tighter">
                        {stats.pendingTasks}
                    </p>
                </div>

                {/* Çalışan Personel Kartı */}
                <div className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 rounded-2xl text-2xl group-hover:scale-110 transition-transform duration-300">👨‍🔧</div>
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded-md">Saha Ekibi</span>
                    </div>
                    <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Kayıtlı Personel</h3>
                    <p className="text-6xl font-black text-gray-900 mt-2 group-hover:text-purple-600 transition-colors tracking-tighter">
                        {stats.workerCount}
                    </p>
                </div>

            </div>

            {/* Alt Bilgi Barı */}
            <div className="bg-gray-900 text-white p-6 rounded-[2rem] shadow-lg flex items-center justify-between border-b-4 border-blue-600">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-full animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="font-black text-lg tracking-tight uppercase">Operasyon Yönetimi</h4>
                        <p className="text-gray-400 text-sm font-medium">Yeni görevler atamak için sol menüdeki Görevler sekmesini kullanın.</p>
                    </div>
                </div>
                <div className="hidden sm:block text-4xl grayscale opacity-20">🚀</div>
            </div>
        </div>
    );
}