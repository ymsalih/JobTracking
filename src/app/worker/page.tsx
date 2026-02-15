'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';

export default function WorkerPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [selectedPhotos, setSelectedPhotos] = useState<{ [key: string]: File }>({});

    // Form State'leri
    const [productInfos, setProductInfos] = useState<{ [key: string]: string }>({});
    const [serialNos, setSerialNos] = useState<{ [key: string]: string }>({});
    const [serviceFees, setServiceFees] = useState<{ [key: string]: string }>({});

    const [openTaskId, setOpenTaskId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchWorkerTasks = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/'); return; }
            setUser(session.user);

            const { data } = await supabase
                .from('tasks')
                .select('*, companies(name)')
                .eq('assigned_worker_id', session.user.id)
                .order('status', { ascending: false });

            if (data) setTasks(data);
            setLoading(false);
        };
        fetchWorkerTasks();
    }, [router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleFinishTask = async (taskId: string) => {
        const file = selectedPhotos[taskId];
        if (!file) { alert("Lütfen iş sonu fotoğrafı ekleyin."); return; }

        setUploading(taskId);
        try {
            const compressedFile = await imageCompression(file, { maxSizeMB: 0.4, maxWidthOrHeight: 1280 });
            const fileExt = file.name.split('.').pop();
            const fileName = `${taskId}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('task-photos').upload(fileName, compressedFile);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('task-photos').getPublicUrl(fileName);

            const { error: updateError } = await supabase
                .from('tasks')
                .update({
                    status: 'completed',
                    work_photo_url: publicUrl,
                    product_info: productInfos[taskId] || '',
                    serial_no: serialNos[taskId] || '',
                    service_fee: parseFloat(serviceFees[taskId] || '0')
                })
                .eq('id', taskId);

            if (updateError) throw updateError;

            alert("Kayıt başarıyla tamamlandı! ✅");
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed', work_photo_url: publicUrl } : t));
            setOpenTaskId(null);
        } catch (error: any) {
            alert("Hata: " + error.message);
        } finally {
            setUploading(null);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-10">

            {/* --- ÜST BAR (BİLGİ & ÇIKIŞ) --- */}
            <div className="bg-white px-6 py-4 sticky top-0 z-50 border-b border-gray-100 flex justify-between items-center shadow-sm mb-6">
                <div className="flex flex-col">
                    <h1 className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">GÖREVLERİM</h1>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-red-500 hover:text-white transition-colors"
                >
                    ÇIKIŞ YAP
                </button>
            </div>

            {/* --- GRID KART SİSTEMİ --- */}
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">

                    {tasks.map(task => (
                        <div key={task.id} className="bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden">

                            {/* --- KART BAŞLIĞI (HEADER) --- */}
                            {/* Hem bekleyen hem tamamlanan işler için tıklanabilir yapıldı */}
                            <div
                                onClick={() => setOpenTaskId(openTaskId === task.id ? null : task.id)}
                                className={`p-6 cursor-pointer flex justify-between items-center transition-colors ${task.status === 'completed' ? 'bg-green-50/50' : 'bg-white'}`}
                            >
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter mb-1">
                                        {task.companies?.name}
                                    </span>
                                    <h2 className={`text-xl font-black uppercase leading-none italic ${task.status === 'completed' ? 'text-green-800 decoration-green-500/50 line-through decoration-2' : 'text-slate-900'}`}>
                                        {task.title}
                                    </h2>
                                </div>

                                {/* İKONLAR */}
                                <div>
                                    {task.status === 'completed' ? (
                                        // YEŞİL TİK (TAMAMLANANLAR İÇİN)
                                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-green-200 shadow-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    ) : (
                                        // MOR ARTI (BEKLEYENLER İÇİN)
                                        <span className={`text-5xl font-black text-purple-700 leading-none select-none transition-transform duration-300 ${openTaskId === task.id ? 'rotate-45' : ''}`}>+</span>
                                    )}
                                </div>
                            </div>

                            {/* --- AÇILIR İÇERİK (BODY) --- */}
                            {openTaskId === task.id && (
                                <div className="px-6 pb-6 space-y-6 animate-in slide-in-from-top-2 duration-200">

                                    {task.status === 'pending' ? (
                                        /* -------------------- BEKLEYEN İŞ FORMU -------------------- */
                                        <>
                                            {/* Yönetici Bilgileri */}
                                            <div className="bg-slate-100/50 rounded-3xl p-5 space-y-4 border border-slate-100 mt-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-lg">📍</span>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adres</p>
                                                        <p className="text-sm font-extrabold text-slate-800 leading-tight italic">{task.client_address}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <span className="text-lg">👤</span>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Müşteri</p>
                                                        <p className="text-sm font-extrabold text-slate-900 uppercase">{task.client_name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <span className="text-lg">📞</span>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefon</p>
                                                        <a href={`tel:${task.client_phone}`} className="text-sm font-black text-blue-700 underline underline-offset-2">{task.client_phone}</a>
                                                    </div>
                                                </div>
                                                {task.description && (
                                                    <div className="pt-3 border-t border-slate-200">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Yönetici Notu</p>
                                                        <p className="text-xs font-bold text-slate-600 italic">"{task.description}"</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Personel Girişleri */}
                                            <div className="space-y-3">
                                                <input
                                                    placeholder="Ürün Bilgisi (Örn: Bosch Klima)"
                                                    className="w-full p-4 rounded-2xl border-0 bg-white shadow-md text-sm font-black text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    onChange={(e) => setProductInfos({ ...productInfos, [task.id]: e.target.value })}
                                                />
                                                <input
                                                    placeholder="Seri Numarası"
                                                    className="w-full p-4 rounded-2xl border-0 bg-white shadow-md text-sm font-black text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    onChange={(e) => setSerialNos({ ...serialNos, [task.id]: e.target.value })}
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        placeholder="Hizmet Ücreti"
                                                        className="w-full p-4 pl-12 rounded-2xl border-0 bg-white shadow-md text-sm font-black text-green-700 placeholder:text-green-300 focus:ring-2 focus:ring-green-500 outline-none"
                                                        onChange={(e) => setServiceFees({ ...serviceFees, [task.id]: e.target.value })}
                                                    />
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-green-600 text-lg">₺</span>
                                                </div>
                                            </div>

                                            {/* Fotoğraf Butonu */}
                                            <label className={`cursor-pointer relative overflow-hidden flex items-center gap-4 p-3 rounded-2xl border-2 border-dashed transition-all active:scale-95 ${selectedPhotos[task.id] ? 'border-green-500 bg-green-50' : 'border-blue-300 bg-blue-50 hover:bg-blue-100'}`}>
                                                <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-sm ${selectedPhotos[task.id] ? 'bg-green-500 text-white' : 'bg-white text-blue-500'}`}>
                                                    <span className="text-xl">📸</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-[11px] font-black uppercase tracking-wider ${selectedPhotos[task.id] ? 'text-green-700' : 'text-blue-600'}`}>
                                                        {selectedPhotos[task.id] ? "FOTOĞRAF HAZIR" : "FOTOĞRAF EKLE"}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400">
                                                        {selectedPhotos[task.id] ? "Değiştirmek için tıkla" : "Kanıt fotoğrafı yüklemek için dokun"}
                                                    </span>
                                                </div>
                                                {selectedPhotos[task.id] && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-green-600 rounded-full p-1 shadow-sm">
                                                        ✔
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" capture="environment" className="hidden"
                                                    onChange={(e) => e.target.files?.[0] && setSelectedPhotos({ ...selectedPhotos, [task.id]: e.target.files[0] })}
                                                />
                                            </label>

                                            <button
                                                onClick={() => handleFinishTask(task.id)}
                                                disabled={uploading === task.id}
                                                className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-tighter"
                                            >
                                                {uploading === task.id ? 'VERİLER İŞLENİYOR...' : 'GÖREVİ TAMAMLA ✅'}
                                            </button>
                                        </>
                                    ) : (
                                        /* -------------------- TAMAMLANAN İŞ DETAYI -------------------- */
                                        <div className="space-y-4 pt-4">
                                            {/* Özet Bilgiler (Adres vb.) */}
                                            <div className="bg-slate-100/50 rounded-3xl p-5 space-y-4 border border-slate-100">
                                                <div className="flex items-start gap-3">
                                                    <span className="text-lg">📍</span>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adres</p>
                                                        <p className="text-sm font-extrabold text-slate-800 leading-tight italic">{task.client_address}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <span className="text-lg">👤</span>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Müşteri</p>
                                                        <p className="text-sm font-extrabold text-slate-900 uppercase">{task.client_name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <span className="text-lg">📞</span>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefon</p>
                                                        <a href={`tel:${task.client_phone}`} className="text-sm font-black text-blue-700 underline underline-offset-2">{task.client_phone}</a>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Ürün ve Ücret Özeti */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">Ürün / Seri</p>
                                                    <p className="text-xs font-bold text-slate-800">{task.product_info || '-'} / {task.serial_no || '-'}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-end">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">Tahsilat</p>
                                                    <p className="text-sm font-black text-green-600">{task.service_fee} ₺</p>
                                                </div>
                                            </div>

                                            {/* Kanıt Fotoğrafı */}
                                            <img src={task.work_photo_url} className="w-full h-36 object-cover rounded-3xl border-4 border-white shadow-lg" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}