import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Scale,
  Percent,
  Clock,
  Info,
  HelpCircle,
  ArrowUpDown,
  BookOpen,
  ShieldAlert
} from 'lucide-react';
import { MasterAttitudeRecord } from '../types';
import { autoDistributeWeights } from '../utils/calculations';
import { INITIAL_MASTER_ATTITUDE } from '../data/initialData';

interface Props {
  masterAttitudeList: MasterAttitudeRecord[];
  onUpdateMasterAttitude: (newList: MasterAttitudeRecord[], shouldRecalculateScores?: boolean) => void;
}

export const MasterAttitudeView: React.FC<Props> = ({
  masterAttitudeList,
  onUpdateMasterAttitude,
}) => {
  const [editingItem, setEditingItem] = useState<MasterAttitudeRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Form state for adding new category / column
  const [newColumnName, setNewColumnName] = useState('');
  const [newCategoryGroup, setNewCategoryGroup] = useState('Kedisiplinan & Presensi');
  const [newDescription, setNewDescription] = useState('');
  const [newDefaultValue, setNewDefaultValue] = useState<number>(8.5);
  const [newHasPenalty, setNewHasPenalty] = useState(false);
  const [autoBalanceNew, setAutoBalanceNew] = useState(true);

  // Calculate current total weight
  const activeItems = masterAttitudeList.filter((i) => i.enabled !== false);
  const totalWeightPercent = Math.round(
    activeItems.reduce((acc, item) => acc + (item.weight || 0), 0) * 100
  );
  const isWeightValid = totalWeightPercent === 100;

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Reset to company default 8 criteria
  const handleResetToDefault = () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin mengembalikan master data sikap ke 8 kriteria standar resmi perusahaan?'
      )
    ) {
      onUpdateMasterAttitude(INITIAL_MASTER_ATTITUDE, true);
      showNotification('Master data sikap berhasil direset ke standar 8 kriteria perusahaan.');
    }
  };

  // One-click Auto Balance all weights to exact 100%
  const handleAutoBalanceAll = () => {
    const balanced = autoDistributeWeights(masterAttitudeList);
    onUpdateMasterAttitude(balanced, true);
    showNotification('Persentase bobot semua kolom berhasil dihitung ulang dan dibagi rata (Total 100%).');
  };

  // Open add new column form
  const handleOpenAddModal = () => {
    setNewColumnName('');
    setNewCategoryGroup('Kedisiplinan & Presensi');
    setNewDescription('');
    setNewDefaultValue(8.5);
    setNewHasPenalty(false);
    setAutoBalanceNew(true);
    setErrorMessage('');
    setIsAddModalOpen(true);
  };

  // Submit adding new column
  const handleSaveNewColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) {
      setErrorMessage('Harap masukkan nama kolom / kategori penilaian.');
      return;
    }

    const uniqueId = `attitude_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const nextOrder = masterAttitudeList.length + 1;
    const nextCode = `A${nextOrder}`;

    const newRecord: MasterAttitudeRecord = {
      id: uniqueId,
      code: nextCode,
      name: newColumnName.trim(),
      category: newCategoryGroup.trim() || 'Umum',
      description: newDescription.trim() || `Penilaian aspek ${newColumnName.trim()}`,
      weight: 0.10, // temporary, will be auto balanced
      isAttendancePenalty: newHasPenalty,
      penaltyWeight: newHasPenalty ? 0.05 : undefined,
      defaultValue: newDefaultValue,
      order: nextOrder,
      enabled: true,
    };

    let updatedList = [...masterAttitudeList, newRecord];

    // Automatically calculate percentages if checked (default behavior requested by user)
    if (autoBalanceNew) {
      updatedList = autoDistributeWeights(updatedList);
    }

    onUpdateMasterAttitude(updatedList, true);
    setIsAddModalOpen(false);
    showNotification(
      `Kolom "${newRecord.name}" berhasil ditambahkan dan persentase bobot otomatis diperbarui!`
    );
  };

  // Start editing a column
  const handleStartEdit = (item: MasterAttitudeRecord) => {
    setEditingItem({ ...item });
    setErrorMessage('');
  };

  // Save edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.name.trim()) {
      setErrorMessage('Nama kolom tidak boleh kosong.');
      return;
    }

    let updatedList = masterAttitudeList.map((item) =>
      item.id === editingItem.id ? editingItem : item
    );

    onUpdateMasterAttitude(updatedList, true);
    setEditingItem(null);
    showNotification(`Perubahan kolom "${editingItem.name}" berhasil disimpan.`);
  };

  // Delete column
  const handleDeleteColumn = (id: string, name: string) => {
    if (masterAttitudeList.length <= 1) {
      alert('Minimal harus ada 1 kolom kategori penilaian sikap.');
      return;
    }

    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus kolom kategori "${name}"? Persentase kolom lainnya akan otomatis dihitung ulang.`
      )
    ) {
      const remaining = masterAttitudeList.filter((i) => i.id !== id);
      const rebalanced = autoDistributeWeights(remaining);
      onUpdateMasterAttitude(rebalanced, true);
      showNotification(`Kolom "${name}" telah dihapus dan persentase otomatis disesuaikan.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                A
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Master Data Sikap, Kedisiplinan & Absensi
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
              Konfigurasi parameter penilaian sikap kerja (bobot 50% dari Nilai Akhir).
              Anda dapat <strong>mengubah nama kolom</strong> sesuai kebutuhan instansi,{' '}
              <strong>menambah kolom / kategori baru</strong>, dan sistem akan{' '}
              <strong>menghitung persentase bobot secara otomatis</strong> sehingga akumulasi selalu tepat 100%.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleAutoBalanceAll}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition flex items-center space-x-1.5 shadow-xs"
              title="Bagi rata persentase bobot seluruh kolom agar tepat 100%"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Bagi Rata Otomatis</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition flex items-center space-x-1.5"
              title="Kembalikan ke susunan 8 kriteria default perusahaan"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Default</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm shadow-blue-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kolom / Kategori</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Kolom Kategori
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-900 font-mono">
                {activeItems.length}
              </span>
              <span className="text-xs text-slate-500">Kriteria Aktif</span>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              isWeightValid
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider block opacity-80">
              Total Akumulasi Bobot
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-black font-mono">
                {totalWeightPercent}%
              </span>
              <span className="text-xs font-semibold">
                {isWeightValid ? '(Valid 100%)' : '(Belum Seimbang!)'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Kontribusi Nilai Akhir
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg font-black text-blue-700 font-mono">50%</span>
              <span className="text-xs text-slate-500">Skor Sikap (A)</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Aturan Keterlambatan
            </span>
            <div className="mt-1 text-xs font-semibold text-slate-700 truncate">
              {activeItems.some((i) => i.isAttendancePenalty)
                ? 'Penalti Aktif pada Absensi'
                : 'Tidak ada penalti'}
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Warning if total weight != 100% */}
      {!isWeightValid && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Total persentase saat ini adalah <strong>{totalWeightPercent}%</strong>. Disarankan melakukan{' '}
              <strong>Bagi Rata Otomatis</strong> agar akumulasi bobot menjadi tepat 100%.
            </span>
          </div>
          <button
            type="button"
            onClick={handleAutoBalanceAll}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs whitespace-nowrap shadow-xs"
          >
            Seimbangkan Otomatis
          </button>
        </div>
      )}

      {/* Master Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-[#1F4E78] text-white font-bold text-center border-b border-slate-300">
                <th className="py-3 px-3 text-center w-12 border border-slate-300">No</th>
                <th className="py-3 px-4 text-left border border-slate-300 min-w-[200px]">
                  Nama Kolom / Kategori
                </th>
                <th className="py-3 px-3 text-left border border-slate-300 min-w-[150px]">
                  Kelompok Aspek
                </th>
                <th className="py-3 px-4 text-left border border-slate-300 min-w-[280px]">
                  Deskripsi & Panduan Penilaian
                </th>
                <th className="py-3 px-3 text-center border border-slate-300 min-w-[120px]">
                  Persentase Bobot (%)
                </th>
                <th className="py-3 px-3 text-center border border-slate-300 min-w-[140px]">
                  Aturan Penalti
                </th>
                <th className="py-3 px-3 text-center border border-slate-300 w-28">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {masterAttitudeList.map((item, idx) => {
                const percent = Math.round(item.weight * 100);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition border-b border-slate-200 group"
                  >
                    {/* Index */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400 border border-slate-200 bg-slate-50/50">
                      {idx + 1}
                    </td>

                    {/* Column Name */}
                    <td className="py-3 px-4 font-bold text-slate-900 border border-slate-200">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {item.code || `A${idx + 1}`}
                        </span>
                        <span className="text-slate-900 text-sm font-bold">
                          {item.name}
                        </span>
                      </div>
                    </td>

                    {/* Group Category */}
                    <td className="py-3 px-3 text-slate-600 border border-slate-200">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                        {item.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-slate-600 border border-slate-200 leading-relaxed text-[11px]">
                      {item.description}
                    </td>

                    {/* Weight Percentage */}
                    <td className="py-3 px-3 text-center border border-slate-200 bg-slate-50/30">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <span className="font-mono font-black text-sm text-blue-700">
                          {percent}%
                        </span>
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, percent * 3)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Penalty Rule */}
                    <td className="py-3 px-3 text-center border border-slate-200">
                      {item.isAttendancePenalty ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Potong ke {Math.round((item.penaltyWeight || 0.10) * 100)}% jika telat</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Standar</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center border border-slate-200">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Ubah nama kolom & konfigurasi kriteria"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(item.id, item.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus kolom kategori ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Column Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Tambah Kolom / Kategori Penilaian Sikap
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kolom baru akan langsung muncul pada tabel penilaian dan persentase dihitung otomatis.
                  </p>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewColumn} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Kolom / Kategori Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kerjasama Tim (Teamwork), Inisiatif Kerja..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Kelompok Aspek
                  </label>
                  <select
                    value={newCategoryGroup}
                    onChange={(e) => setNewCategoryGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 bg-white"
                  >
                    <option value="Kedisiplinan & Presensi">Kedisiplinan & Presensi</option>
                    <option value="Kualitas & Ketelitian">Kualitas & Ketelitian</option>
                    <option value="Integritas & Etika">Integritas & Etika</option>
                    <option value="Sikap & Hubungan Kerja">Sikap & Hubungan Kerja</option>
                    <option value="Standar Kerja & Lingkungan">Standar Kerja & Lingkungan</option>
                    <option value="Kepatuhan & Regulasi">Kepatuhan & Regulasi</option>
                    <option value="Pengembangan & Inisiatif">Pengembangan & Inisiatif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Nilai Acuan Baseline (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={newDefaultValue}
                    onChange={(e) => setNewDefaultValue(parseFloat(e.target.value) || 8.5)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Deskripsi & Panduan Penilaian
                </label>
                <textarea
                  rows={2}
                  placeholder="Panduan penilaian untuk membantu penilai memberikan skor objektif..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 leading-relaxed"
                />
              </div>

              {/* Automatic Percentage Checkbox */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoBalanceNew}
                    onChange={(e) => setAutoBalanceNew(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="font-bold text-blue-900">
                    Otomatis hitung ulang persentase (Total 100%)
                  </span>
                </label>
                <p className="text-[11px] text-blue-700 pl-6 leading-relaxed">
                  Bila dicentang, persentase bobot semua kolom ({masterAttitudeList.length + 1} kolom) akan otomatis dihitung dan dibagi rata sehingga total pas 100%.
                </p>
              </div>

              {/* Penalty Option */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newHasPenalty}
                    onChange={(e) => setNewHasPenalty(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Terapkan aturan penalti jika karyawan tercatat Sering Telat (Ya)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/30"
                >
                  Simpan Kolom Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Column Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Ubah Kolom: {editingItem.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sesuaikan nama kolom tampilan tabel dan parameter bobot.
                  </p>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Kolom Tampilan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Kelompok Aspek
                  </label>
                  <input
                    type="text"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Bobot Persentase (Desimal, misal 0.15 = 15%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.99"
                    value={editingItem.weight}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        weight: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Deskripsi & Panduan Penilaian
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 leading-relaxed"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isAttendancePenalty || false}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        isAttendancePenalty: e.target.checked,
                        penaltyWeight: e.target.checked
                          ? Math.max(0.05, Number((editingItem.weight - 0.05).toFixed(2)))
                          : undefined,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Terapkan aturan penalti Sering Telat pada kolom ini
                  </span>
                </label>

                {editingItem.isAttendancePenalty && (
                  <div className="pl-6 pt-1">
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">
                      Bobot saat terkena penalti (Desimal, misal 0.10):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="0.9"
                      value={editingItem.penaltyWeight || 0.1}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          penaltyWeight: parseFloat(e.target.value) || 0.1,
                        })
                      }
                      className="w-24 px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/30"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
