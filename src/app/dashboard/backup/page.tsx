'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export default function BackupPage() {
    const [exporting, setExporting] = useState(false);

    // --- Hücre Genişliğini Otomatik Ayarlayan Yardımcı Fonksiyon ---
    const autoFitColumns = (data: any[]) => {
        if (!data || data.length === 0) return [];
        const keys = Object.keys(data[0]);
        return keys.map(key => {
            let maxLen = key.length;
            data.forEach(row => {
                const cellValue = String(row[key] || "");
                if (cellValue.length > maxLen) maxLen = cellValue.length;
            });
            return { wch: maxLen + 4 }; // Yazı boyutuna göre genişlik + pay
        });
    };

    const exportToExcel = async () => {
        setExporting(true);
        try {
            // 1. Tüm Verileri Çekiyoruz (Tüm Zamanlar)
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*, companies(name), profiles:assigned_worker_id(full_name)');

            const { data: finance } = await supabase
                .from('finance')
                .select('*');

            const { data: companies } = await supabase.from('companies').select('*');
            const { data: workers } = await supabase.from('profiles').select('*');

            // 2. Excel Kitabı Oluştur
            const workbook = XLSX.utils.book_new();

            // 3. GÖREVLER SEKMESİ
            const taskList = tasks?.map(t => ({
                'GÖREV BAŞLIĞI': t.title,
                'FİRMA': t.companies?.name,
                'PERSONEL': t.profiles?.full_name,
                'MÜŞTERİ': t.client_name,
                'TELEFON': t.client_phone,
                'ADRES': t.client_address,
                'CİHAZ BİLGİSİ': t.product_info || '-',
                'SERİ NO': t.serial_no || '-',
                'TAHSİLAT (TL)': t.service_fee || 0,
                'DURUM': t.status === 'completed' ? 'Tamamlandı' : 'Beklemede',
                'KAYIT TARİHİ': new Date(t.created_at).toLocaleDateString('tr-TR')
            })) || [];
            const taskSheet = XLSX.utils.json_to_sheet(taskList);
            taskSheet['!cols'] = autoFitColumns(taskList); // Genişlik Ayarı
            XLSX.utils.book_append_sheet(workbook, taskSheet, "Görev Listesi");

            // 4. GELİR & GİDER SEKMESİ
            const financeList = finance?.map(f => ({
                'İŞLEM TÜRÜ': f.type === 'income' ? 'GELİR (+)' : 'GİDER (-)',
                'AÇIKLAMA': f.description,
                'TUTAR (TL)': f.amount,
                'TARİH/SAAT': new Date(f.created_at).toLocaleString('tr-TR'),
                'REFERANS': f.task_id ? 'Görev Kaydı' : 'Genel İşlem'
            })) || [];
            const financeSheet = XLSX.utils.json_to_sheet(financeList);
            financeSheet['!cols'] = autoFitColumns(financeList); // Genişlik Ayarı
            XLSX.utils.book_append_sheet(workbook, financeSheet, "Kasa Hareketleri");

            // 5. FİRMALAR SEKMESİ
            const companyList = companies?.map(c => ({
                'FİRMA ADI': c.name,
                'KAYIT TARİHİ': new Date(c.created_at).toLocaleDateString('tr-TR')
            })) || [];
            const companySheet = XLSX.utils.json_to_sheet(companyList);
            companySheet['!cols'] = autoFitColumns(companyList);
            XLSX.utils.book_append_sheet(workbook, companySheet, "Firmalar");

            // 6. PERSONELLER SEKMESİ
            const workerList = workers?.map(w => ({
                'AD SOYAD': w.full_name,
                'E-POSTA': w.email,
                'YETKİ/ROL': w.role === 'admin' ? 'YÖNETİCİ' : 'PERSONEL'
            })) || [];
            const workerSheet = XLSX.utils.json_to_sheet(workerList);
            workerSheet['!cols'] = autoFitColumns(workerList);
            XLSX.utils.book_append_sheet(workbook, workerSheet, "Personel Listesi");

            // 7. Dosyayı İndir
            const fileName = `isletme_tam_yedek_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            alert("Tüm veriler (Görevler, Finans, Firmalar, Personeller) düzenlenmiş şekilde indirildi! 📂✅");
        } catch (error: any) {
            alert("Hata: " + error.message);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center font-sans">
            <div className="max-w-2xl w-full bg-white rounded-[3rem] p-12 shadow-2xl text-center border border-slate-100">
                <div className="w-24 h-24 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner animate-bounce">
                    📊
                </div>
                <h1 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter mb-4">TAM SİSTEM YEDEĞİ</h1>
                <p className="text-slate-500 font-bold text-sm mb-10 leading-relaxed uppercase tracking-wide">
                    Tüm veritabanınızı <span className="text-blue-600 font-black italic">otomatik genişletilmiş</span> sekmelerle <br />
                    Excel (.xlsx) olarak tek dosyada birleştirin.
                </p>

                <button
                    onClick={exportToExcel}
                    disabled={exporting}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-4 uppercase tracking-tighter"
                >
                    {exporting ? 'VERİLER DÜZENLENİYOR...' : '📥 TÜM VERİLERİ İNDİR'}
                </button>

                <div className="mt-10 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase italic">Kasa Hareketleri</p>
                        <p className="text-xs font-bold text-green-600 uppercase">Dahil Edildi ✅</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase italic">Görev Kayıtları</p>
                        <p className="text-xs font-bold text-green-600 uppercase">Dahil Edildi ✅</p>
                    </div>
                </div>

                <p className="mt-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                    * İndirilen dosya her sütunu içeriğe göre otomatik boyutlandırır.
                </p>
            </div>
        </div>
    );
}