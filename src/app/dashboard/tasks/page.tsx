'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Filtre State'leri
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedCompanyId, setSelectedCompanyId] = useState('all');

    // Form State'leri
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [workerId, setWorkerId] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('pending');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        // Tüm alanları çekiyoruz (*), bu sayede product_info, serial_no, service_fee gelir.
        const { data: t } = await supabase
            .from('tasks')
            .select('*, companies(name), profiles!assigned_worker_id(full_name)')
            .order('created_at', { ascending: false });

        const { data: c } = await supabase.from('companies').select('*');
        const { data: w } = await supabase.from('profiles').select('*').eq('role', 'worker');

        if (t) setTasks(t);
        if (c) setCompanies(c);
        if (w) setWorkers(w);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        let result = tasks;

        if (activeFilter !== 'all') {
            result = result.filter(task => task.status === activeFilter);
        }

        if (selectedCompanyId !== 'all') {
            result = result.filter(task => task.company_id === selectedCompanyId);
        }

        setFilteredTasks(result);
    }, [activeFilter, selectedCompanyId, tasks]);

    const toggleForm = (task: any = null) => {
        if (task) {
            setEditingId(task.id);
            setTitle(task.title || '');
            setCompanyId(task.company_id);
            setWorkerId(task.assigned_worker_id);
            setClientName(task.client_name || '');
            setClientPhone(task.client_phone || '');
            setClientAddress(task.client_address || '');
            setDescription(task.description || '');
            setStatus(task.status || 'pending');
            setShowForm(true);
        } else {
            setEditingId(null);
            setTitle('');
            setCompanyId('');
            setWorkerId('');
            setClientName('');
            setClientPhone('');
            setClientAddress('');
            setDescription('');
            setStatus('pending');
            setShowForm(!showForm);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const taskData = {
            title,
            company_id: companyId,
            assigned_worker_id: workerId,
            client_name: clientName,
            client_phone: clientPhone,
            client_address: clientAddress,
            description,
            status
        };

        const { error } = editingId
            ? await supabase.from('tasks').update(taskData).eq('id', editingId)
            : await supabase.from('tasks').insert([taskData]);

        if (error) {
            alert("Hata: " + error.message);
        } else {
            alert(editingId ? "Görev güncellendi" : "Görev başarıyla atandı");
            toggleForm();
            fetchData();
        }
        setIsSubmitting(false);
    };

    const deleteTask = async (id: string) => {
        if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
            await supabase.from('tasks').delete().eq('id', id);
            fetchData();
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6">

            {/* BAŞLIK VE FİLTRELEME */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Görev Yönetimi</h1>
                        <p className="text-sm text-gray-500 font-semibold italic">Saha operasyonlarını buradan izleyin</p>
                    </div>
                    <button
                        onClick={() => toggleForm()}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 ${showForm ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        {showForm ? 'Vazgeç' : '+ Yeni Görev'}
                    </button>
                </div>

                {/* FİLTRELEME ÇUBUĞU */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full sm:w-fit shadow-inner">
                        <button onClick={() => setActiveFilter('all')} className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Hepsi</button>
                        <button onClick={() => setActiveFilter('pending')} className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeFilter === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Bekleyenler</button>
                        <button onClick={() => setActiveFilter('completed')} className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeFilter === 'completed' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Tamamlananlar</button>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl shadow-inner border border-transparent hover:border-blue-200 transition-all">
                        <span className="text-[10px] font-black text-gray-400 uppercase ml-3 mr-1">FİRMALAR:</span>
                        <select
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 outline-none pr-4 cursor-pointer min-w-[150px]"
                        >
                            <option value="all">Tüm Firmalar</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* FORM ALANI */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-2xl mb-10 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-200">
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">İş / Görev Başlığı</label>
                        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200 text-black font-bold outline-none focus:border-blue-500 shadow-sm" placeholder="Örn: Klima Onarımı" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Müşteri Ad Soyad</label>
                        <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200 text-black font-bold outline-none shadow-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Müşteri Telefon</label>
                        <input type="text" required value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200 text-black font-bold outline-none shadow-sm" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Firma Seçin</label>
                        <select required value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200 text-black font-bold bg-white outline-none shadow-sm">
                            <option value="">Seçiniz...</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Personel Ata</label>
                        <select required value={workerId} onChange={(e) => setWorkerId(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200 text-black font-bold bg-white outline-none shadow-sm">
                            <option value="">Seçiniz...</option>
                            {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Görev Adresi</label>
                        <input type="text" required value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200 text-black font-bold outline-none shadow-sm" />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Durum</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200 text-black font-bold bg-white outline-none shadow-sm">
                            <option value="pending">⏳ Beklemede</option>
                            <option value="completed">✅ Tamamlandı</option>
                        </select>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="md:col-span-2 bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest active:scale-95">
                        {isSubmitting ? 'İşleniyor...' : (editingId ? 'GÜNCELLE' : 'GÖREVİ KAYDET VE ATA')}
                    </button>
                </form>
            )}

            {/* GÖREV LİSTESİ */}
            <div className="space-y-6">
                {loading ? (
                    <div className="text-center py-10 text-gray-400 font-bold animate-pulse uppercase tracking-[0.2em]">Veriler Hazırlanıyor...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold italic">Seçilen kriterlere uygun görev bulunamadı.</p>
                    </div>
                ) : filteredTasks.map(t => (
                    <div key={t.id} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border-l-8" style={{ borderLeftColor: t.status === 'completed' ? '#22c55e' : '#f97316' }}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h2 className="text-xl font-black text-gray-900 leading-tight uppercase italic tracking-tight">{t.title}</h2>
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-sm ${t.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                        {t.status === 'completed' ? 'TAMAMLANDI' : 'BEKLEMEDE'}
                                    </span>
                                </div>
                                <p className="text-sm font-extrabold text-blue-600 uppercase">{t.companies?.name}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => toggleForm(t)} className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-yellow-100 transition-colors">Düzenle</button>
                                <button onClick={() => deleteTask(t.id)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-red-100 transition-colors">Sil</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-gray-50 pt-5">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] block mb-1">Müşteri Detay</span>
                                <p className="text-sm font-bold text-gray-800">{t.client_name}</p>
                                <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-tighter italic">📍 {t.client_address}</p>
                                <p className="text-xs font-black text-blue-700 mt-2">📞 {t.client_phone}</p>
                            </div>
                            <div className="bg-purple-50/30 p-4 rounded-2xl border border-purple-100/50">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] block mb-1">Sorumlu Personel</span>
                                <p className="text-sm font-black text-purple-700 flex items-center gap-2 uppercase">
                                    <span className="text-lg">👨‍🔧</span> {t.profiles?.full_name || 'Henüz Atanmadı'}
                                </p>
                            </div>
                        </div>

                        {/* --- YENİ EKLENEN KISIM: TEKNİK & FİNANSAL DETAY (Sadece Tamamlanmışsa Görünür) --- */}
                        {t.status === 'completed' && (
                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                {/* Teknik Bilgi Kutusu */}
                                <div className="bg-white border-2 border-dashed border-gray-200 p-4 rounded-2xl">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cihaz Bilgisi</p>
                                            <p className="text-sm font-bold text-slate-800">{t.product_info || '-'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seri No</p>
                                            <p className="text-sm font-mono font-bold text-slate-500">{t.serial_no || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Finansal Bilgi Kutusu (Yeşil Vurgu) */}
                                <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Tahsilat</p>
                                        <p className="text-xs text-green-600/70 font-medium">Kasa girişine eklendi</p>
                                    </div>
                                    <p className="text-3xl font-black text-green-600 tracking-tight">
                                        {t.service_fee} ₺
                                    </p>
                                </div>
                            </div>
                        )}

                        {t.status === 'completed' && t.work_photo_url && (
                            <div className="mt-5 pt-5 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex flex-col gap-3">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        📷 İş Sonu Kanıt Fotoğrafı
                                    </span>
                                    <div className="relative group w-fit">
                                        <a href={t.work_photo_url} target="_blank" rel="noreferrer" className="relative block">
                                            <img
                                                src={t.work_photo_url}
                                                alt="İş Sonu"
                                                className="w-32 h-32 object-cover rounded-[1.5rem] border-4 border-white shadow-lg hover:scale-105 transition-all duration-300 cursor-zoom-in"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-[1.5rem] flex items-center justify-center transition-opacity">
                                                <span className="text-white text-[10px] font-bold uppercase">Büyüt</span>
                                            </div>
                                        </a>
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 italic">Personel tarafından saha kanıtı olarak eklendi.</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}