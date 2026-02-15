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
        <div className="min-h-screen bg-slate-50 pb-10 font-sans">
            <div className="max-w-md mx-auto p-4 space-y-4">
                {tasks.map(task => (
                    <div key={task.id} className="bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden">

                        {/* GÖREV BAŞLIĞI */}
                        <div
                            onClick={() => task.status === 'pending' && setOpenTaskId(openTaskId === task.id ? null : task.id)}
                            className={`p-6 cursor-pointer flex justify-between items-center ${task.status === 'completed' ? 'bg-green-50' : 'bg-white'}`}
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter mb-1">
                                    {task.companies?.name}
                                </span>
                                <h2 className="text-xl font-black text-slate-900 uppercase leading-none italic">
                                    {task.title}
                                </h2>
                            </div>
                            <span className="text-2xl">{task.status === 'completed' ? '✅' : (openTaskId === task.id ? '➖' : '➕')}</span>
                        </div>

                        {/* DETAY VE FORM PANELİ */}
                        {(openTaskId === task.id || task.status === 'completed') && (
                            <div className="px-6 pb-6 space-y-6">

                                {/* YÖNETİCİ BİLGİLERİ (KOYU VE OKUNAKLI) */}
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
                                    <div className="pt-3 border-t border-slate-200">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Yönetici Notu</p>
                                        <p className="text-xs font-bold text-slate-600 italic">"{task.description}"</p>
                                    </div>
                                </div>

                                {task.status === 'pending' ? (
                                    <div className="space-y-4">
                                        {/* PERSONEL GİRİŞLERİ (KOYU PLACEHOLDER) */}
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

                                        {/* FOTOĞRAF ALANI */}
                                        <label className="cursor-pointer group flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-3xl hover:border-blue-400 hover:bg-blue-50 transition-all">
                                            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">📸</span>
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                {selectedPhotos[task.id] ? "FOTOĞRAF SEÇİLDİ ✔" : "İŞ SONU FOTOĞRAFI EKLE"}
                                            </span>
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
                                    </div>
                                ) : (
                                    /* TAMAMLANAN ÖZET */
                                    <div className="pt-4 border-t border-slate-100 space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white p-3 rounded-2xl border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase">Ürün / Seri</p>
                                                <p className="text-xs font-bold text-slate-800">{task.product_info} / {task.serial_no}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-end">
                                                <p className="text-[9px] font-black text-slate-400 uppercase">Tahsilat</p>
                                                <p className="text-sm font-black text-green-600">{task.service_fee} ₺</p>
                                            </div>
                                        </div>
                                        <img src={task.work_photo_url} className="w-full h-48 object-cover rounded-3xl border-4 border-white shadow-lg" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}