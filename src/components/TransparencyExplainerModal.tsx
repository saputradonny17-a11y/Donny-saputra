import React from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, Scale, Award, Info } from 'lucide-react';
import { MasterAttitudeRecord } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  masterAttitudeList?: MasterAttitudeRecord[];
}

export const TransparencyExplainerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  masterAttitudeList,
}) => {
  if (!isOpen) return null;

  const activeAttitude = masterAttitudeList?.filter((c) => c.enabled !== false) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Transparansi Rumus & Metodologi Penilaian</h3>
              <p className="text-slate-300 text-sm">Prinsip objektivitas, pembobotan seimbang, dan keadilan evaluasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
          {/* Section 1: Overview */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-base mb-1">Prinsip Penilaian 50% - 50%</h4>
              <p className="text-blue-800 dark:text-blue-300">
                Nilai Akhir dihitung seimbang antara <strong>Karakter & Kedisiplinan Kerja (Sikap 50%)</strong> dan{' '}
                <strong>Pencapaian Target Teknis Divisi (KPI 50%)</strong> pada skala penilaian 1 hingga 10.
                Semua perhitungan otomatis tanpa intervensi subjektif.
              </p>
            </div>
          </div>

          {/* Section 2: Formulas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box A */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100 font-bold text-base mb-3">
                <span className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-xs">A</span>
                <h4>Penilaian Sikap (Bobot 50%)</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                Total Skor A = ∑ (Skor Kriteria × Bobot Kriteria) [Total Akumulasi 100%]
              </p>
              <div className="space-y-2 text-xs">
                {activeAttitude.length > 0 ? (
                  activeAttitude.map((c) => {
                    const percent = Math.round(c.weight * 100);
                    return (
                      <div key={c.id} className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/80">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{c.name}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {c.isAttendancePenalty && c.penaltyWeight
                            ? `Maks ${percent}% (atau ${Math.round(c.penaltyWeight * 100)}% jika telat)`
                            : `Maks ${percent}%`}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/80">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">Integritas / Bebas Kriminal</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Maks 25%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/80">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">Hindari Kesalahan Fatal</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Maks 20%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/80">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">Kerajinan & Absensi</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Maks 15% (atau 10% jika telat)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/80">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">Izin Keluar / Kerapihan / Taat Aturan</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Masing-masing 10%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">Sopan Santun / Fokus & Keberadaan</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Masing-masing 5%</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Box B */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100 font-bold text-base mb-3">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">B</span>
                <h4>Penilaian KPI Teknis (Bobot 50%)</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                Total Skor B = (Skor KPI 1 × Bobot 1) + (Skor KPI 2 × Bobot 2)
              </p>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <p className="text-slate-600 dark:text-slate-300">
                  Target KPI disesuaikan secara dinamis berdasarkan <strong>Divisi Karyawan</strong> di Master Data.
                </p>
                <div className="bg-slate-50 dark:bg-slate-800/70 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Contoh Divisi:</p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mt-1 space-y-1">
                    <li>Produksi: Target Output (60%) & Waste Barang (40%)</li>
                    <li>Marketing: Target Sales (70%) & Akuisisi Klien (30%)</li>
                    <li>QC: Pencegahan Komplain 0-Defect (70%) & Ketelitian (30%)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Tardiness Rule */}
          <div className="border-l-4 border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 p-4 rounded-r-xl border border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-semibold mb-1">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h5>Aturan Ketat: Penalti Sering Terlambat</h5>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Jika indikator <strong>Sering Telat = &quot;Ya&quot;</strong>, maka bobot maksimal komponen <em>Kerajinan & Absensi</em> dipotong dari <strong>15% menjadi 10%</strong>. Hal ini menyebabkan total bobot penilaian sikap berkurang 5% (maksimal skor sikap turun menjadi 9.50), mendorong seluruh karyawan untuk selalu disiplin jam kerja.
            </p>
          </div>

          {/* Section 4: Grades Scale */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center space-x-2">
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Standar Kategori & Rekomendasi Tindak Lanjut</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Sangat Baik (A)</div>
                <div className="text-emerald-900 dark:text-emerald-200 font-mono font-semibold my-1">Skor &ge; 8.50</div>
                <p className="text-emerald-700 dark:text-emerald-400">Bonus prestasi kerja maksimal & prioritas promosi.</p>
              </div>
              <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40">
                <div className="font-bold text-blue-800 dark:text-blue-300 text-sm">Baik (B)</div>
                <div className="text-blue-900 dark:text-blue-200 font-mono font-semibold my-1">7.00 - 8.49</div>
                <p className="text-blue-700 dark:text-blue-400">Sesuai ekspektasi target & insentif standar berjalan.</p>
              </div>
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40">
                <div className="font-bold text-amber-800 dark:text-amber-300 text-sm">Cukup (C)</div>
                <div className="text-amber-900 dark:text-amber-200 font-mono font-semibold my-1">5.00 - 6.99</div>
                <p className="text-amber-700 dark:text-amber-400">Evaluasi bimbingan / coaching oleh supervisor.</p>
              </div>
              <div className="p-3 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40">
                <div className="font-bold text-orange-800 dark:text-orange-300 text-sm">Kurang (D)</div>
                <div className="text-orange-900 dark:text-orange-200 font-mono font-semibold my-1">3.00 - 4.99</div>
                <p className="text-orange-700 dark:text-orange-400">Peringatan Surat Peringatan (SP 1) & monitoring ketat.</p>
              </div>
              <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40">
                <div className="font-bold text-rose-800 dark:text-rose-300 text-sm">Sangat Kurang (E)</div>
                <div className="text-rose-900 dark:text-rose-200 font-mono font-semibold my-1">&lt; 3.00</div>
                <p className="text-rose-700 dark:text-rose-400">Evaluasi pemutusan hubungan kerja (PHK) / non-aktif.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1.5" />
            Formula sesuai acuan standar HRD & openpyxl formula
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
