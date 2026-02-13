'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { fetchCompanies(); }, []);

    const fetchCompanies = async () => {
        setLoading(true);
        const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
        if (data) setCompanies(data);
        setLoading(false);
    };

    const toggleForm = (company: any = null) => {
        if (company) {
            setEditingId(company.id);
            setName(company.name);
            setAddress(company.address || '');
            setShowForm(true);
        } else {
            setEditingId(null);
            setName('');
            setAddress('');
            setShowForm(!showForm);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const companyData = { name, address };

        if (editingId) {
            await supabase.from('companies').update(companyData).eq('id', editingId);
        } else {
            await supabase.from('companies').insert([companyData]);
        }

        toggleForm();
        fetchCompanies();
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu firmayı silmek tüm görev bağlantılarını etkileyebilir. Emin misiniz?')) return;
        await supabase.from('companies').delete().eq('id', id);
        fetchCompanies();
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Firmalar</h1>
                    <p className="text-gray-500">Müşteri firmalarınızı yönetin.</p>
                </div>
                <button onClick={() => toggleForm()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold">
                    {showForm ? 'İptal' : '+ Yeni Firma'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input type="text" placeholder="Firma Adı" required value={name} onChange={(e) => setName(e.target.value)} className="p-3 rounded-lg border border-gray-300 text-black font-semibold" />
                        <input type="text" placeholder="Adres" value={address} onChange={(e) => setAddress(e.target.value)} className="p-3 rounded-lg border border-gray-300 text-black font-semibold" />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold">
                        {editingId ? 'Güncelle' : 'Kaydet'}
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map(c => (
                    <div key={c.id} className="p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{c.name}</h3>
                        <p className="text-gray-500 text-sm mb-4">{c.address || 'Adres belirtilmemiş'}</p>
                        <div className="flex gap-2">
                            <button onClick={() => toggleForm(c)} className="text-yellow-600 font-bold text-sm bg-yellow-50 px-3 py-1 rounded">Düzenle</button>
                            <button onClick={() => handleDelete(c.id)} className="text-red-600 font-bold text-sm bg-red-50 px-3 py-1 rounded">Sil</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}