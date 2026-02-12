'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State'leri
    const [companyId, setCompanyId] = useState('');
    const [workerId, setWorkerId] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [description, setDescription] = useState('');

    // Sayfa açıldığında tüm verileri (Görevler, Firmalar, Personeller) çek
    const fetchData = async () => {
        setLoading(true);

        // 1. Görevleri Çek (İlişkili tablo isimleriyle birlikte)
        const { data: tasksData } = await supabase
            .from('tasks')
            .select(`
        *,
        companies (name),
        profiles (full_name)
      `)
            .order('created_at', { ascending: false });

        // 2. Firmaları Çek (Formdaki seçmeli liste için)
        const { data: companiesData } = await supabase.from('companies').select('id, name');

        // 3. Personelleri Çek (Sadece 'worker' rolünde olanlar)
        const { data: workersData } = await supabase.from('profiles').select('id, full_name').eq('role', 'worker');

        if (tasksData) setTasks(tasksData);
        if (companiesData) setCompanies(companiesData);
        if (workersData) setWorkers(workersData);

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Yeni Görev Kaydetme
    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();

        const { error } = await supabase
            .from('tasks')
            .insert([{
                company_id: companyId,
                assigned_worker_id: workerId || null, // Seçilmemişse boş (null) gönder
                client_name: clientName,
                client_phone: clientPhone,
                client_address: clientAddress,
                description: description,
                status: 'beklemede'
            }]);

        if (error) {
            alert('Hata oluştu: ' + error.message);
        } else {
            // Formu temizle ve listeyi yenile
            setCompanyId('');
            setWorkerId('');
            setClientName('');
            setClientPhone('');
            setClientAddress('');
            setDescription('');
            setShowForm(false);
            fetchData();
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-full">

            {/* Üst Kısım */}
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Görevler</h1>
                    <p className="text-gray-500 mt-1">Sahadaki işleri ve atamaları buradan yönetin.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`${showForm ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-600 text-white'
                        } px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap`}
                >
                    {showForm ? 'İptal Et' : '+ Yeni Görev Oluştur'}
                </button>
            </div>

            {/* Yeni Görev Formu */}
            {showForm && (
                <form onSubmit={handleAddTask} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                        {/* Firma Seçimi */}
                        <div>
                            <label className="block text-sm font-extrabold text-gray-800 mb-2">Hangi Firma İçin?</label>
                            <select required value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 outline-none text-gray-900 bg-white">
                                <option value="">-- Firma Seçin --</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* Personel Seçimi */}
                        <div>
                            <label className="block text-sm font-extrabold text-gray-800 mb-2">Atanacak Personel</label>
                            <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 outline-none text-gray-900 bg-white">
                                <option value="">-- Henüz Atanmadı --</option>
                                {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                            </select>
                        </div>

                        {/* Müşteri Bilgileri */}
                        <div>
                            <label className="block text-sm font-extrabold text-gray-800 mb-2">Müşteri Yetkilisi</label>
                            <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 outline-none text-gray-900 bg-white" placeholder="Örn: Ahmet Bey" />
                        </div>
                        <div>
                            <label className="block text-sm font-extrabold text-gray-800 mb-2">İletişim Numarası</label>
                            <input type="text" required value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 outline-none text-gray-900 bg-white" placeholder="Örn: 0555 123 45 67" />
                        </div>

                        {/* Adres ve Açıklama */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-extrabold text-gray-800 mb-2">Açık Adres</label>
                            <input type="text" required value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 outline-none text-gray-900 bg-white" placeholder="Görev yeri adresi..." />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-extrabold text-gray-800 mb-2">Yapılacak İşin Açıklaması</label>
                            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg p-3 outline-none text-gray-900 bg-white" placeholder="Detayları buraya yazın..."></textarea>
                        </div>

                    </div>
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-md">
                        Görevi Kaydet ve Ata
                    </button>
                </form>
            )}

            {/* Görevler Tablosu */}
            {loading ? (
                <div className="text-center py-10 text-gray-500 font-medium animate-pulse">Görevler yükleniyor...</div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-800">
                                <th className="p-4 font-bold border-b border-gray-200">İş Tanımı</th>
                                <th className="p-4 font-bold border-b border-gray-200">Firma</th>
                                <th className="p-4 font-bold border-b border-gray-200">Atanan Personel</th>
                                <th className="p-4 font-bold border-b border-gray-200">Durum</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Henüz hiç görev yok.</td></tr>
                            ) : (
                                tasks.map((task) => (
                                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-gray-900">{task.client_name}</p>
                                            <p className="text-sm text-gray-600 truncate max-w-xs">{task.description}</p>
                                        </td>
                                        <td className="p-4 text-gray-700 font-medium">{task.companies?.name || '-'}</td>
                                        <td className="p-4 text-gray-700">{task.profiles?.full_name || <span className="text-red-500 text-sm">Atanmadı</span>}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.status === 'tamamlandı' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {task.status === 'tamamlandı' ? 'Tamamlandı' : 'Beklemede'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}