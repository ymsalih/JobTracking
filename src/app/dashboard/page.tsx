'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({ companyCount: 0, taskCount: 0, workerCount: 0 });

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                fetchStats();
            }
        };

        const fetchStats = async () => {
            const { count: companies } = await supabase.from('companies').select('*', { count: 'exact', head: true });
            const { count: tasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'beklemede');
            const { count: workers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'worker');

            setStats({
                companyCount: companies || 0,
                taskCount: tasks || 0,
                workerCount: workers || 0
            });
        };

        fetchUserData();
    }, []);

    if (!user) return <div className="animate-pulse text-blue-600 font-bold">Veriler yükleniyor...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            <div className="mb-8 border-b border-gray-100 pb-4">
                <h1 className="text-3xl font-extrabold text-gray-800">Sistem Özeti</h1>
                <p className="text-gray-500 mt-2">Hoşgeldin, <span className="font-bold text-blue-600">{user.email}</span>. İşte son durumlar:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 flex flex-col items-center shadow-sm">
                    <h3 className="font-bold text-blue-800 mb-2 text-lg">Toplam Firma</h3>
                    <p className="text-5xl font-black text-blue-600">{stats.companyCount}</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border border-yellow-200 flex flex-col items-center shadow-sm">
                    <h3 className="font-bold text-yellow-800 mb-2 text-lg">Bekleyen İşler</h3>
                    <p className="text-5xl font-black text-yellow-600">{stats.taskCount}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 flex flex-col items-center shadow-sm">
                    <h3 className="font-bold text-purple-800 mb-2 text-lg">Çalışan Personel</h3>
                    <p className="text-5xl font-black text-purple-600">{stats.workerCount}</p>
                </div>
            </div>

        </div>
    );
}