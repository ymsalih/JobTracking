'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression'; // Kütüphane eklendi

export default function WorkerPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [selectedPhotos, setSelectedPhotos] = useState<{ [key: string]: File }>({});
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

    const handleFileChange = (taskId: string, file: File) => {
        setSelectedPhotos(prev => ({ ...prev, [taskId]: file }));
    };

    // Görevi Fotoğrafla Beraber Tamamlama
    const handleFinishTask = async (taskId: string) => {
        const file = selectedPhotos[taskId];
        if (!file) {
            alert("Lütfen önce bir iş sonu fotoğrafı ekleyin.");
            return;
        }

        setUploading(taskId);
        try {
            // --- FOTOĞRAF SIKIŞTIRMA MANTIĞI BAŞLANGICI ---
            const options = {
                maxSizeMB: 0.4,          // Dosyayı yaklaşık 400KB'a düşürür (1GB Storage için ideal)
                maxWidthOrHeight: 1280, // HD çözünürlük korunur
                useWebWorker: true,     // İşlemi arka planda yapar, telefonu dondurmaz
            };

            // Sıkıştırma işlemi
            const compressedFile = await imageCompression(file, options);
            // --- FOTOĞRAF SIKIŞTIRMA MANTIĞI BİTİŞİ ---

            // 1. Sıkıştırılmış fotoğrafı Storage'a yükle
            const fileExt = file.name.split('.').pop();
            const fileName = `${taskId}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('task-photos')
                .upload(fileName, compressedFile); // Orijinal file yerine compressedFile kullanıldı

            if (uploadError) throw uploadError;

            // 2. URL'i al
            const { data: { publicUrl } } = supabase.storage
                .from('task-photos')
                .getPublicUrl(fileName);

            // 3. Görevi veritabanında 'completed' yap ve URL'i kaydet
            const { error: updateError } = await supabase
                .from('tasks')
                .update({
                    status: 'completed',
                    work_photo_url: publicUrl
                })
                .eq('id', taskId);

            if (updateError) throw updateError;

            alert("Görev başarıyla tamamlandı! ✅");
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed', work_photo_url: publicUrl } : t));
        } catch (error: any) {
            alert("Hata: " + error.message);
        } finally {
            setUploading(null);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-bold italic">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-10 font-sans">
            <div className="bg-white border-b p-4 sticky top-0 z-30 shadow-sm flex justify-between items-center">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Görevlerim</h1>
                    <span className="text-[10px] font-bold text-blue-500 uppercase">{user?.email}</span>
                </div>
                <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase shadow-sm">Çıkış</button>
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6">
                {tasks.map(task => (
                    <div key={task.id} className={`bg-white rounded-[2.5rem] shadow-xl border-2 overflow-hidden transition-all duration-300 ${task.status === 'completed' ? 'border-green-100 opacity-90' : 'border-white'}`}>
                        <div className={`h-3 w-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>

                        <div className="p-6">
                            <h2 className="text-2xl font-black text-gray-900 leading-none mb-4 uppercase tracking-tight italic">{task.title}</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                                    <span className="text-2xl">🏢</span>
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Firma & Görev</p>
                                        <p className="font-extrabold text-blue-900 leading-tight">{task.companies?.name}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
                                    <span className="text-xl">📍</span>
                                    <p className="text-xs font-bold text-gray-600 leading-relaxed italic">{task.client_address}</p>
                                </div>
                            </div>

                            {task.status === 'pending' ? (
                                <div className="space-y-4 pt-2 border-t border-gray-100">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">İş Sonu Fotoğrafı</label>
                                        <label className={`relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed flex items-center justify-center min-h-[100px] transition-all ${selectedPhotos[task.id] ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                                            {selectedPhotos[task.id] ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-2xl">📸</span>
                                                    <span className="text-[10px] font-black text-green-600 uppercase">Seçildi (Sıkıştırılacak)</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1 text-gray-400">
                                                    <span className="text-3xl">➕</span>
                                                    <span className="text-[10px] font-black uppercase">FOTOĞRAF EKLE</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileChange(task.id, e.target.files[0])} />
                                        </label>
                                    </div>

                                    <button
                                        onClick={() => handleFinishTask(task.id)}
                                        disabled={uploading === task.id}
                                        className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 uppercase tracking-widest ${uploading === task.id ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                    >
                                        {uploading === task.id ? 'SIKIŞTIRILIYOR VE YÜKLENİYOR...' : 'GÖREVİ TAMAMLA ✅'}
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="relative rounded-2xl overflow-hidden border-4 border-green-50 shadow-inner">
                                        <img src={task.work_photo_url} alt="Tamamlanan İş" className="w-full h-40 object-cover grayscale-[30%]" />
                                        <div className="absolute inset-0 bg-green-900/40 flex items-center justify-center backdrop-blur-[2px]">
                                            <span className="bg-white text-green-700 px-6 py-2 rounded-full text-xs font-black shadow-2xl uppercase tracking-tighter">İŞ TAMAMLANDI</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}