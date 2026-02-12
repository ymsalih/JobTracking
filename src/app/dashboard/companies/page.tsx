'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State'leri
    const [name, setName] = useState('');
    const [details, setDetails] = useState('');

    // Firmaları Veritabanından Çek
    const fetchCompanies = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setCompanies(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    // Yeni Firma Kaydetme İşlemi
    const handleAddCompany = async (e: React.FormEvent) => {
        e.preventDefault();

        const { error } = await supabase
            .from('companies')
            .insert([{ name, details }]);

        if (error) {
            alert('Hata oluştu: ' + error.message);
        } else {
            setName('');
            setDetails('');
            setShowForm(false);
            fetchCompanies();
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-full">

            {/* Üst Kısım: Başlık ve Ekle Butonu */}
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Firmalar</h1>
                    <p className="text-gray-500 mt-1">Müşteri firmalarınızı buradan yönetebilirsiniz.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`${showForm ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' : 'bg-blue-600 text-white hover:bg-blue-700'
                        } px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap`}
                >
                    {showForm ? 'Vazgeç' : '+ Yeni Firma Ekle'}
                </button>
            </div>

            {/* Yeni Firma Ekleme Formu */}
            {showForm && (
                <form onSubmit={handleAddCompany} className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-extrabold text-gray-800 mb-2">Firma Adı</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white shadow-sm"
                                placeholder="Örn: ABC İnşaat"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-extrabold text-gray-800 mb-2">Detay / Adres</label>
                            <input
                                type="text"
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white shadow-sm"
                                placeholder="Örn: Kadıköy Şantiyesi"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-md"
                    >
                        Firmayı Kaydet
                    </button>
                </form>
            )}

            {/* Firmalar Listesi */}
            {loading ? (
                <div className="text-center py-10 text-gray-500 font-medium animate-pulse">Firmalar yükleniyor...</div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-800">
                                <th className="p-4 font-bold border-b border-gray-200">Firma Adı</th>
                                <th className="p-4 font-bold border-b border-gray-200">Detaylar</th>
                                <th className="p-4 font-bold border-b border-gray-200">Kayıt Tarihi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">Henüz hiç firma eklenmemiş.</td>
                                </tr>
                            ) : (
                                companies.map((company) => (
                                    <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-gray-900">{company.name}</td>
                                        <td className="p-4 text-gray-700">{company.details || '-'}</td>
                                        <td className="p-4 text-gray-500 text-sm">
                                            {new Date(company.created_at).toLocaleDateString('tr-TR')}
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