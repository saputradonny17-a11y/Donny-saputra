import React, { useState, useEffect } from 'react';
import { Database, Plus, Edit2, Check, AlertCircle, Sparkles, CheckSquare, Target } from 'lucide-react';
import { MasterAttitudeRecord, MasterKPIRecord } from '../types';
import { MasterAttitudeView } from './MasterAttitudeView';

interface Props {
  masterList: MasterKPIRecord[];
  onUpdateMasterList: (newList: MasterKPIRecord[]) => void;
  masterAttitudeList: MasterAttitudeRecord[];
  onUpdateMasterAttitude: (newList: MasterAttitudeRecord[], shouldRecalculateScores?: boolean) => void;
  activeSubTab?: 'sikap' | 'kpi';
  onSubTabChange?: (tab: 'sikap' | 'kpi') => void;
}

export const MasterDataView: React.FC<Props> = ({
  masterList,
  onUpdateMasterList,
  masterAttitudeList,
  onUpdateMasterAttitude,
  activeSubTab = 'sikap',
  onSubTabChange,
}) => {
  const [currentTab, setCurrentTab] = useState<'sikap' | 'kpi'>(activeSubTab);

  useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: 'sikap' | 'kpi') => {
    setCurrentTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  // KPI Master Data State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<MasterKPIRecord | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRow, setNewRow] = useState<MasterKPIRecord>({
    divisi: '',
    kpi1: '',
    bobot1: 0.60,
    kpi2: '',
    bobot2: 0.40,
    satuanKpi1: '',
    satuanKpi2: '',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleStartEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditRow({ ...masterList[idx] });
    setErrorMessage('');
  };

  const handleSaveEdit = () => {
    if (!editRow) return;
    const sum = Number((editRow.bobot1 + editRow.bobot2).toFixed(2));
    if (sum !== 1.00) {
      setErrorMessage(
        `Total bobot KPI 1 (${(editRow.bobot1 * 100).toFixed(0)}%) + KPI 2 (${(
          editRow.bobot2 * 100
        ).toFixed(0)}%) harus berjumlah 100% (saat ini ${(sum * 100).toFixed(0)}%)`
      );
      return;
    }

    const updated = [...masterList];
    if (editingIndex !== null) {
      updated[editingIndex] = editRow;
    }
    onUpdateMasterList(updated);
    setEditingIndex(null);
    setEditRow(null);
    setErrorMessage('');
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRow.divisi.trim() || !newRow.kpi1.trim() || !newRow.kpi2.trim()) {
      setErrorMessage('Harap isi Nama Divisi, KPI 1, dan KPI 2');
      return;
    }
    const sum = Number((newRow.bobot1 + newRow.bobot2).toFixed(2));
    if (sum !== 1.00) {
      setErrorMessage(
        `Total bobot KPI 1 (${(newRow.bobot1 * 100).toFixed(0)}%) + KPI 2 (${(
          newRow.bobot2 * 100
        ).toFixed(0)}%) harus 100%`
      );
      return;
    }

    onUpdateMasterList([...masterList, newRow]);
    setIsAddingNew(false);
    setNewRow({
      divisi: '',
      kpi1: '',
      bobot1: 0.60,
      kpi2: '',
      bobot2: 0.40,
    });
    setErrorMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Master Data Suite Top Switcher Bar */}
      <div className="bg-slate-900 p-1.5 rounded-2xl flex items-center space-x-1.5 max-w-xl shadow-lg border border-slate-800">
        <button
          type="button"
          onClick={() => handleTabSwitch('sikap')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition ${
            currentTab === 'sikap'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Master Sikap & Absensi (A)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('kpi')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition ${
            currentTab === 'kpi'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Master KPI Divisi (B)</span>
        </button>
      </div>

      {/* Conditional Sub-View Rendering */}
      {currentTab === 'sikap' ? (
        <MasterAttitudeView
          masterAttitudeList={masterAttitudeList}
          onUpdateMasterAttitude={onUpdateMasterAttitude}
        />
      ) : (
        /* KPI Master Data Content */
        <div className="space-y-6 animate-in fade-in">
          {/* Top Banner */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  B
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Master Data Divisi, KPI & Bobot Teknis
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Data master ini menjadi acuan otomatis rumus VLOOKUP di sheet KPI (B).
                Setiap divisi memiliki 2 KPI terukur dengan total bobot 100%.
              </p>
            </div>

            <button
              onClick={() => {
                setIsAddingNew(true);
                setErrorMessage('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Divisi Baru</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Add New Division Form */}
          {isAddingNew && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 text-xs animate-in fade-in">
              <h3 className="font-bold text-blue-900 mb-3 text-sm flex items-center space-x-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Form Tambah Divisi & KPI Baru</span>
              </h3>
              <form onSubmit={handleSaveNew} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nama Divisi</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Logistik"
                    value={newRow.divisi}
                    onChange={(e) => setNewRow({ ...newRow, divisi: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nama KPI 1</label>
                  <input
                    type="text"
                    required
                    placeholder="Target Pengiriman"
                    value={newRow.kpi1}
                    onChange={(e) => setNewRow({ ...newRow, kpi1: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bobot 1 (Desimal)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="0.9"
                    value={newRow.bobot1}
                    onChange={(e) => {
                      const b1 = parseFloat(e.target.value) || 0;
                      setNewRow({ ...newRow, bobot1: b1, bobot2: Number((1 - b1).toFixed(2)) });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nama KPI 2</label>
                  <input
                    type="text"
                    required
                    placeholder="Efisiensi Bahan Bakar"
                    value={newRow.kpi2}
                    onChange={(e) => setNewRow({ ...newRow, kpi2: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl bg-white"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition flex-1"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-3 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-white"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table Sheet 4: Master Data */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#1F4E78] text-white font-bold text-center border-b border-slate-300">
                    <th className="py-2.5 px-3 text-center w-12 border border-slate-300">No</th>
                    <th className="py-2.5 px-4 text-left border border-slate-300 min-w-[150px]">Divisi</th>
                    <th className="py-2.5 px-4 text-left border border-slate-300 min-w-[280px]">KPI 1</th>
                    <th className="py-2.5 px-3 text-center border border-slate-300 min-w-[100px]">Bobot 1</th>
                    <th className="py-2.5 px-4 text-left border border-slate-300 min-w-[280px]">KPI 2</th>
                    <th className="py-2.5 px-3 text-center border border-slate-300 min-w-[100px]">Bobot 2</th>
                    <th className="py-2.5 px-3 text-center border border-slate-300 w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {masterList.map((item, idx) => {
                    const isEditing = editingIndex === idx;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition border-b border-slate-200">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 border border-slate-200">
                          {idx + 1}
                        </td>

                        {/* Divisi */}
                        <td className="py-2.5 px-4 font-bold text-slate-900 border border-slate-200">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editRow?.divisi || ''}
                              onChange={(e) =>
                                setEditRow(editRow ? { ...editRow, divisi: e.target.value } : null)
                              }
                              className="w-full px-2 py-1 border border-blue-400 rounded text-xs"
                            />
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                              {item.divisi}
                            </span>
                          )}
                        </td>

                        {/* KPI 1 */}
                        <td className="py-2.5 px-4 text-slate-800 border border-slate-200">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editRow?.kpi1 || ''}
                              onChange={(e) =>
                                setEditRow(editRow ? { ...editRow, kpi1: e.target.value } : null)
                              }
                              className="w-full px-2 py-1 border border-blue-400 rounded text-xs"
                            />
                          ) : (
                            <div>
                              <div className="font-medium text-slate-900">{item.kpi1}</div>
                              {item.satuanKpi1 && (
                                <div className="text-[10px] text-slate-400">{item.satuanKpi1}</div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Bobot 1 */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 border border-slate-200 bg-slate-50/50">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.05"
                              min="0.1"
                              max="0.9"
                              value={editRow?.bobot1 || 0.6}
                              onChange={(e) => {
                                const b1 = parseFloat(e.target.value) || 0;
                                setEditRow(
                                  editRow
                                    ? { ...editRow, bobot1: b1, bobot2: Number((1 - b1).toFixed(2)) }
                                    : null
                                );
                              }}
                              className="w-16 px-1.5 py-1 text-center border border-blue-400 rounded text-xs font-mono font-bold"
                            />
                          ) : (
                            <span>{(item.bobot1 * 100).toFixed(0)}%</span>
                          )}
                        </td>

                        {/* KPI 2 */}
                        <td className="py-2.5 px-4 text-slate-800 border border-slate-200">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editRow?.kpi2 || ''}
                              onChange={(e) =>
                                setEditRow(editRow ? { ...editRow, kpi2: e.target.value } : null)
                              }
                              className="w-full px-2 py-1 border border-blue-400 rounded text-xs"
                            />
                          ) : (
                            <div>
                              <div className="font-medium text-slate-900">{item.kpi2}</div>
                              {item.satuanKpi2 && (
                                <div className="text-[10px] text-slate-400">{item.satuanKpi2}</div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Bobot 2 */}
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 border border-slate-200 bg-slate-50/50">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.05"
                              min="0.1"
                              max="0.9"
                              value={editRow?.bobot2 || 0.4}
                              onChange={(e) => {
                                const b2 = parseFloat(e.target.value) || 0;
                                setEditRow(
                                  editRow
                                    ? { ...editRow, bobot2: b2, bobot1: Number((1 - b2).toFixed(2)) }
                                    : null
                                );
                              }}
                              className="w-16 px-1.5 py-1 text-center border border-blue-400 rounded text-xs font-mono font-bold"
                            />
                          ) : (
                            <span>{(item.bobot2 * 100).toFixed(0)}%</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-2.5 px-3 text-center border border-slate-200">
                          {isEditing ? (
                            <button
                              onClick={handleSaveEdit}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 font-semibold text-xs flex items-center space-x-1 mx-auto"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>OK</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(idx)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Edit KPI Divisi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
