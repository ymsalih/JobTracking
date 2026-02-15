'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FinancePage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyIncome, setDailyIncome] = useState(0);
    const [dailyExpense, setDailyExpense] = useState(0);
    const [dailyNet, setDailyNet] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);

    const [filterType, setFilterType] = useState('all');

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'add' | 'edit'>('add');
    const [editingId, setEditingId] = useState<string | null>(null);

    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [transType, setTransType] = useState<'income' | 'expense'>('expense');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchFinanceData();
    }, [selectedDate]);

    const fetchFinanceData = async () => {
        setLoading(true);

        const { data: allData } = await supabase.from('finance').select('amount, type');
        if (allData) {
            const total = allData.reduce((acc: number, curr: any) => {
                return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
            }, 0);
            setGrandTotal(total);
        }

        const startDate = `${selectedDate}T00:00:00`;
        const endDate = `${selectedDate}T23:59:59`;

        const { data: dailyData, error } = await supabase
            .from('finance')
            .select(`
                *,
                tasks (
                    title,
                    profiles:assigned_worker_id (full_name)
                )
            `)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Hata:', error);
        } else {
            setTransactions(dailyData || []);

            let dIncome = 0;
            let dExpense = 0;

            (dailyData || []).forEach((item: any) => {
                if (item.type === 'income') {
                    dIncome += item.amount;
                } else {
                    dExpense += item.amount;
                }
            });

            setDailyIncome(dIncome);
            setDailyExpense(dExpense);
            setDailyNet(dIncome - dExpense);
        }
        setLoading(false);
    };

    const openAddModal = () => {
        setModalType('add');
        setEditingId(null);
        setDesc('');
        setAmount('');
        setTransType('expense');
        setShowModal(true);
    };

    const openEditModal = (item: any) => {
        setModalType('edit');
        setEditingId(item.id);
        setDesc(item.description);
        setAmount(item.amount.toString());
        setTransType(item.type);
        setShowModal(true);
    };

    // --- SENKRONİZASYONLU KAYDETME İŞLEMİ ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const numericAmount = parseFloat(amount);

        if (!desc || !numericAmount) return alert("Lütfen açıklama ve tutar giriniz.");
        if (numericAmount < 0) return alert("Tutar negatif olamaz.");

        setSubmitting(true);

        let error;

        if (modalType === 'add') {
            const { error: insertError } = await supabase.from('finance').insert([
                {
                    type: 'expense',
                    description: desc,
                    amount: numericAmount,
                    created_at: new Date().toISOString()
                }
            ]);
            error = insertError;
        } else {
            // 1. Önce Kasa (Finance) Tablosunu Güncelle
            const { error: updateError } = await supabase
                .from('finance')
                .update({
                    description: desc,
                    amount: numericAmount,
                })
                .eq('id', editingId);
            error = updateError;

            // --- YENİ EKLENEN KISIM: EĞER GELİR İSE GÖREVİ DE GÜNCELLE ---
            if (!updateError && transType === 'income') {
                // Şu an düzenlediğimiz satırı bulalım ki task_id'sine erişelim
                const currentItem = transactions.find(t => t.id === editingId);

                // Eğer bu işlemin bağlı olduğu bir görev varsa (task_id varsa)
                if (currentItem && currentItem.task_id) {
                    await supabase
                        .from('tasks')
                        .update({ service_fee: numericAmount }) // Görevdeki ücreti de yeni fiyat yap
                        .eq('id', currentItem.task_id);

                    console.log("Görev ücreti de senkronize edildi.");
                }
            }
        }

        if (error) {
            alert("Hata: " + error.message);
        } else {
            alert(modalType === 'add' ? "Kayıt eklendi!" : "Kayıt güncellendi! (Çalışan sayfasıyla eşitlendi)");
            setShowModal(false);
            fetchFinanceData();
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu finans kaydını silmek istediğinize emin misiniz? \n(Bu işlem geri alınamaz ve kasa bakiyesini etkiler.)")) return;

        const { error } = await supabase.from('finance').delete().eq('id', id);

        if (error) {
            alert("Hata: " + error.message);
        } else {
            fetchFinanceData();
        }
    };

    const filteredTransactions = transactions.filter(item => {
        if (filterType === 'all') return true;
        return item.type === filterType;
    });

    return (
        <div className="min-h-screen bg-slate-50 font-sans p-6 pb-20 relative">

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>

                        <h2 className={`text-xl font-black uppercase tracking-tighter mb-1 ${modalType === 'add' ? 'text-red-500' : 'text-blue-600'}`}>
                            {modalType === 'add' ? 'GİDER EKLE' : 'İŞLEMİ DÜZENLE'}
                        </h2>
                        <p className="text-xs text-gray-400 font-bold mb-6">
                            {modalType === 'add' ? 'Kasadan düşülecek harcamayı giriniz.' : 'Mevcut kaydı güncelleyin.'}
                        </p>

                        <form onSubmit={handleSave} className="space-y-4">
                            {modalType === 'edit' && transType === 'income' && (
                                <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-[10px] text-green-700 font-bold mb-4 flex items-center gap-2">
                                    <span>🔄</span>
                                    <span>Bu tutarı değiştirirseniz, ilgili personelin görev ekranındaki "Tahsilat" tutarı da otomatik güncellenir.</span>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Açıklama</label>
                                <input
                                    type="text"
                                    className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-gray-800 font-bold outline-none focus:border-blue-400 transition-colors"
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Tutar (TL)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-800 font-black text-lg outline-none focus:border-blue-400 transition-colors"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full py-4 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all ${modalType === 'add' ? 'bg-red-500 shadow-red-200 hover:bg-red-600' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'}`}
                            >
                                {submitting ? 'İŞLENİYOR...' : (modalType === 'add' ? 'KAYDET' : 'GÜNCELLE & EŞİTLE')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">FİNANS MERKEZİ</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">GELİR / GİDER YÖNETİMİ</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-50 rounded-xl px-3 py-2 font-bold text-slate-700 outline-none uppercase text-sm" />
                    </div>
                    <button onClick={openAddModal} className="bg-red-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase shadow-lg shadow-red-200 hover:bg-red-600 transition-all flex items-center gap-2">
                        <span>💸</span> GİDER EKLE
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group col-span-1 md:col-span-1">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full -mr-10 -mt-10 blur-3xl group-hover:bg-blue-500/30 transition-all"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOPLAM GENEL KASA</p>
                        <h2 className={`text-4xl font-black tracking-tighter ${grandTotal >= 0 ? 'text-white' : 'text-red-400'}`}>{grandTotal.toLocaleString()} ₺</h2>
                    </div>
                </div>
                <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-[2rem] p-6 border border-green-100 text-center flex flex-col justify-center">
                        <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">GÜNLÜK GELİR</p>
                        <p className="text-2xl font-black text-green-600">+{dailyIncome.toLocaleString()} ₺</p>
                    </div>
                    <div className="bg-red-50 rounded-[2rem] p-6 border border-red-100 text-center flex flex-col justify-center">
                        <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">GÜNLÜK GİDER</p>
                        <p className="text-2xl font-black text-red-600">-{dailyExpense.toLocaleString()} ₺</p>
                    </div>
                    <div className="bg-white rounded-[2rem] p-6 border border-slate-200 text-center flex flex-col justify-center shadow-sm">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GÜNLÜK NET</p>
                        <p className={`text-2xl font-black ${dailyNet >= 0 ? 'text-slate-800' : 'text-red-500'}`}>{dailyNet.toLocaleString()} ₺</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6">

                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        HAREKETLER ({filteredTransactions.length})
                    </h3>

                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>HEPSİ</button>
                        <button onClick={() => setFilterType('income')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterType === 'income' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-green-600'}`}>GELİRLER (+)</button>
                        <button onClick={() => setFilterType('expense')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterType === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400 hover:text-red-500'}`}>GİDERLER (-)</button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 font-bold text-slate-300 animate-pulse">HESAPLANIYOR...</div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-slate-400 font-bold italic text-sm">Bu filtreye uygun kayıt bulunamadı.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredTransactions.map((item) => (
                            <div key={item.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl transition-all border-b border-slate-50 last:border-0 gap-4 group ${item.type === 'expense' ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-slate-50'}`}>

                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${item.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {item.type === 'income' ? '💰' : '💸'}
                                    </div>
                                    <div>
                                        {item.type === 'income' ? (
                                            <>
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-0.5">{item.tasks?.profiles?.full_name || 'SİSTEM'}</p>
                                                <p className="text-sm font-extrabold text-slate-800 uppercase italic leading-tight">{item.description}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-xs font-black text-red-400 uppercase tracking-wide mb-0.5">ŞİRKET GİDERİ</p>
                                                <p className="text-sm font-extrabold text-red-900 uppercase italic leading-tight">{item.description}</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 justify-end w-full md:w-auto">
                                    <div className="text-right">
                                        <p className={`text-lg font-black tracking-tight ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.type === 'income' ? '+' : '-'}{Math.abs(item.amount)} ₺
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                                            {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>

                                    <div className="flex gap-2 pl-4 border-l border-slate-200">
                                        <button
                                            onClick={() => openEditModal(item)}
                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-400 hover:text-blue-600 hover:shadow-md transition-all border border-slate-100"
                                            title="Düzenle"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-400 hover:text-red-600 hover:shadow-md transition-all border border-slate-100"
                                            title="Sil"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}