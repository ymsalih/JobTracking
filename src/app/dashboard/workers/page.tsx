'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function WorkersPage() {
    const [workers, setWorkers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('worker');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Veritabanındaki 'profiles' tablosundan tüm verileri (email dahil) çeker
    const fetchWorkers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*') // Tüm sütunları seçer (email sütunu dahil)
            .order('created_at', { ascending: false });

        if (data) setWorkers(data);
        setLoading(false);
    };

    useEffect(() => { fetchWorkers(); }, []);

    const toggleForm = (worker: any = null) => {
        if (worker) {
            // Düzenleme Modu: Mevcut personelin email bilgisini state'e atar
            setEditingId(worker.id);
            setFullName(worker.full_name);
            setRole(worker.role);
            setEmail(worker.email || ''); // Veritabanından gelen maili kutuya yazar
            setPassword('');
            setShowForm(true);
        } else {
            // Yeni Kayıt Modu
            setEditingId(null);
            setFullName('');
            setRole('worker');
            setEmail('');
            setPassword('');
            setShowForm(!showForm);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId
                ? { id: editingId, full_name: fullName, role, password }
                : { email, password, full_name: fullName, role };

            const res = await fetch('/api/workers', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error);
            }

            alert(editingId ? 'Personel güncellendi!' : 'Yeni personel başarıyla eklendi!');
            toggleForm();
            fetchWorkers(); // Listeyi yeniler
        } catch (error: any) {
            alert('Hata: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-full">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Personeller</h1>
                <button onClick={() => toggleForm()} className={`px-6 py-3 rounded-2xl font-black transition-all ${showForm ? 'bg-red-50 text-red-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'}`}>
                    {showForm ? 'VAZGEÇ' : '+ YENİ PERSONEL EKLE'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-blue-50/50 p-8 rounded-[2.5rem] border-2 border-blue-100 mb-10 shadow-sm animate-in fade-in zoom-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">Ad Soyad</label>
                            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border-2 border-white rounded-2xl p-4 text-black font-bold shadow-sm outline-none focus:border-blue-500 transition-all" />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">Sistem Yetkisi</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border-2 border-white rounded-2xl p-4 text-black font-bold bg-white outline-none cursor-pointer">
                                <option value="worker">Saha Çalışanı (Worker)</option>
                                <option value="admin">Yönetici (Admin)</option>
                            </select>
                        </div>

                        {/* E-POSTA ALANI: Düzenlemede kilitli, Yeni eklemede açık */}
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">E-posta Adresi</label>
                            <input
                                type="email"
                                required={!editingId}
                                disabled={!!editingId}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="mail@firma.com"
                                className={`w-full border-2 rounded-2xl p-4 font-bold shadow-sm outline-none transition-all ${editingId
                                        ? 'bg-gray-200 border-gray-300 text-gray-600 cursor-not-allowed italic'
                                        : 'bg-white border-white text-black focus:border-blue-500'
                                    }`}
                            />
                            {editingId && <p className="text-[9px] text-blue-600 font-bold mt-2 ml-2 tracking-tight">* Bu personelin sistemdeki kayıtlı e-posta adresidir.</p>}
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 mb-1">{editingId ? 'Şifre Güncelle (Boş Bırakılabilir)' : 'Giriş Şifresi'}</label>
                            <input type="password" required={!editingId} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border-2 border-white rounded-2xl p-4 text-black font-bold outline-none focus:border-blue-500 transition-all" placeholder={editingId ? "Değişmeyecekse boş bırakın.." : "En az 6 karakter"} />
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl uppercase tracking-widest active:scale-95 transition-all">
                        {isSubmitting ? 'İŞLENİYOR...' : (editingId ? 'GÜNCELLEMEYİ KAYDET' : 'PERSONELİ OLUŞTUR')}
                    </button>
                </form>
            )}

            <div className="overflow-hidden rounded-[2rem] border border-gray-100 shadow-xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest">
                            <th className="p-6">Personel Bilgisi</th>
                            <th className="p-6 text-center">Yetki Seviyesi</th>
                            <th className="p-6 text-right">Yönetim</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-bold">
                        {workers.map((w) => (
                            <tr key={w.id} className="hover:bg-gray-50 transition-all">
                                <td className="p-6">
                                    <div className="text-gray-900 text-lg uppercase font-black">{w.full_name}</div>
                                    <div className="text-xs text-gray-400 italic font-medium">{w.email || 'Email bilgisi yok'}</div>
                                </td>
                                <td className="p-6 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 ${w.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                        {w.role === 'admin' ? 'Yönetici' : 'Saha Çalışanı'}
                                    </span>
                                </td>
                                <td className="p-6 text-right space-x-2">
                                    <button onClick={() => toggleForm(w)} className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-yellow-500 hover:text-white transition-all shadow-sm">DÜZENLE</button>
                                    <button onClick={() => { if (confirm(`${w.full_name} isimli personeli silmek istediğinize emin misiniz?`)) fetch(`/api/workers?id=${w.id}`, { method: 'DELETE' }).then(() => fetchWorkers()) }} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all shadow-sm">SİL</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}