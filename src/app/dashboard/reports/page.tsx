'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [allData, setAllData] = useState<{ finance: any[], tasks: any[] }>({ finance: [], tasks: [] });
    const [selectedMonth, setSelectedMonth] = useState('all');

    const [stats, setStats] = useState({
        income: 0,
        expense: 0,
        completed: 0,
        pending: 0,
        performance: [] as any[],
        availableMonths: [] as string[]
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        calculateStats();
    }, [selectedMonth, allData]);

    const fetchInitialData = async () => {
        setLoading(true);
        const { data: finance } = await supabase.from('finance').select('*'); //
        const { data: tasks } = await supabase
            .from('tasks')
            .select('status, created_at, assigned_worker_id, profiles:assigned_worker_id(full_name)'); //

        if (finance && tasks) {
            setAllData({ finance, tasks });
        }
        setLoading(false);
    };

    const calculateStats = () => {
        const { finance, tasks } = allData;
        const monthsSet = new Set<string>();
        finance.forEach(f => {
            const d = new Date(f.created_at);
            monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        });
        const availableMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));

        const filteredFinance = selectedMonth === 'all'
            ? finance
            : finance.filter(f => f.created_at.startsWith(selectedMonth));

        const filteredTasks = selectedMonth === 'all'
            ? tasks
            : tasks.filter(t => t.created_at.startsWith(selectedMonth));

        let inc = 0, exp = 0, comp = 0, pend = 0;
        const perfMap: any = {};

        filteredFinance.forEach(f => {
            if (f.type === 'income') inc += (f.amount || 0); //
            else exp += (f.amount || 0);
        });

        filteredTasks.forEach(t => {
            if (t.status === 'completed') {
                comp++;
                const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
                const name = profile?.full_name || 'Atanmamış';
                perfMap[name] = (perfMap[name] || 0) + 1;
            } else {
                pend++;
            }
        });

        setStats({
            income: inc,
            expense: exp,
            completed: comp,
            pending: pend,
            performance: Object.entries(perfMap).map(([name, count]) => ({ name, count })),
            availableMonths
        });
    };

    // --- GRAFİK HESAPLAMALARI ---
    // 1. İş Durumu Grafiği
    const totalTasks = stats.completed + stats.pending;
    const taskPercentage = totalTasks > 0 ? (stats.completed / totalTasks) * 100 : 0;
    const taskStroke = `${taskPercentage} ${100 - taskPercentage}`;

    // 2. Finansal Durum Grafiği (Gelir / Toplam İşlem)
    const totalCashFlow = stats.income + stats.expense;
    const financePercentage = totalCashFlow > 0 ? (stats.income / totalCashFlow) * 100 : 0;
    const financeStroke = `${financePercentage} ${100 - financePercentage}`;

    if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest">Veriler Hazırlanıyor...</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-6 pb-20">
            {/* ... Üst Başlık ve Filtre Aynı Kalıyor ... */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">PERFORMANS MERKEZİ</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Zaman Bazlı İşletme Analizi</p>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase ml-2">Dönem:</span>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 border-none text-sm font-black text-slate-700 rounded-xl px-4 py-2 outline-none cursor-pointer">
                        <option value="all">TÜM ZAMANLAR</option>
                        {stats.availableMonths.map(m => (
                            <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* --- ÖZET KARTLAR --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border-t-8 border-green-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOPLAM GELİR</p>
                    <h2 className="text-4xl font-black text-green-600">+{stats.income.toLocaleString()} ₺</h2>
                </div>
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border-t-8 border-red-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOPLAM GİDER</p>
                    <h2 className="text-4xl font-black text-red-600">-{stats.expense.toLocaleString()} ₺</h2>
                </div>
                <div className="bg-slate-900 p-8 rounded-[3rem] shadow-xl border-t-8 border-blue-400 text-white">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">NET BAKİYE</p>
                    <h2 className="text-4xl font-black text-blue-400">{(stats.income - stats.expense).toLocaleString()} ₺</h2>
                </div>
            </div>

            {/* --- GRAFİKLER ALANI --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

                {/* 1. GRAFİK: İŞ TAMAMLAMA */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 self-start flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span> OPERASYONEL VERİMLİLİK
                    </h3>
                    <div className="relative w-56 h-56 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#fb923c" strokeWidth="3.5" />
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="3.5" strokeDasharray={taskStroke} strokeDashoffset="0" className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute text-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase block">BİTEN İŞ</span>
                            <span className="text-3xl font-black text-slate-900">%{taskPercentage.toFixed(0)}</span>
                            <p className="text-[10px] font-bold text-slate-500 mt-1">{stats.completed} / {totalTasks}</p>
                        </div>
                    </div>
                </div>

                {/* 2. GRAFİK: GELİR/GİDER DENGESİ (YENİ) */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 self-start flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> FİNANSAL DENGE (GELİR ORANI)
                    </h3>
                    <div className="relative w-56 h-56 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="3.5" />
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3.5" strokeDasharray={financeStroke} strokeDashoffset="0" className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute text-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase block">GELİR PAYI</span>
                            <span className="text-3xl font-black text-slate-900">%{financePercentage.toFixed(0)}</span>
                            <p className="text-[10px] font-bold text-slate-500 mt-1">Kasa Giriş Oranı</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* --- PERSONEL PERFORMANS LİSTESİ --- */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span> PERSONEL LİGİ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.performance.sort((a, b) => b.count - a.count).map((worker, index) => (
                        <div key={worker.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-4">
                                <span className="w-8 h-8 bg-slate-800 text-white text-[10px] font-black rounded-lg flex items-center justify-center">{index + 1}</span>
                                <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{worker.name}</span>
                            </div>
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-[10px] font-black">{worker.count} GÖREV BİTTİ</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}