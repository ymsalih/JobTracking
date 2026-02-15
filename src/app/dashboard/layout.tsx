'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    // Menüdeki linklerimiz
    const menuItems = [
        { name: 'Ana Sayfa', path: '/dashboard', icon: '🏠' },
        { name: 'Firmalar', path: '/dashboard/companies', icon: '🏢' },
        { name: 'Görevler', path: '/dashboard/tasks', icon: '📋' },
        { name: 'Personeller', path: '/dashboard/workers', icon: '👥' },

        // --- YENİ EKLENEN KISIM: KASA ---
        // Oluşturduğumuz finance sayfasına buradan gidilecek
        { name: 'Kasa & Finans', path: '/dashboard/finance', icon: '💸' },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* SOL MENÜ (Sidebar) */}
            <aside className="w-64 bg-white shadow-xl flex flex-col fixed inset-y-0 left-0 z-10 md:relative">
                <div className="p-6 text-center border-b border-gray-100">
                    <h2 className="text-2xl font-extrabold text-blue-600 tracking-tight italic">GÖREV TAKİP</h2>
                    <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">Yönetim Paneli</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-105'
                                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="font-bold text-sm uppercase">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Çıkış Yap Butonu */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-red-100 text-red-500 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-black uppercase text-xs shadow-sm"
                    >
                        <span>🚪</span> Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* SAĞ İÇERİK ALANI (Sayfaların geleceği yer) */}
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                {children}
            </main>

        </div>
    );
}