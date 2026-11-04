import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle,
  Building,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  CreditCard,
  Heart,
  Home,
  FileBadge,
  Award,
  Download,
  X
} from 'lucide-react';
import { Employee, EmploymentStatus, MasterKPIRecord } from '../types';

interface Props {
  employees: Employee[];
  masterList: MasterKPIRecord[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onSyncAssessments: () => void;
  currentPeriod: string;
}

export const EmployeeDatabaseView: React.FC<Props> = ({
  employees,
  masterList,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onSyncAssessments,
  currentPeriod,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Detail Modal
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    nickname: '',
    nrpKodeKontrak: '',
    division: masterList[0]?.divisi || 'Finishing',
    position: '',
    status: 'Tetap' as EmploymentStatus,
    joinDate: new Date().toISOString().split('T')[0],
    email: '',
    phone: '',
    noKtp: '',
    noNpwp: '',
    noRekeningBca: '',
    noBpjsTk: '',
    noBpjsKs: '',
    alamat: '',
    tempatLahir: '',
    tanggalLahir: '',
    pendidikan: 'SMA',
    agama: 'Islam',
    statusMarital: 'K0',
    namaPasangan: '',
    namaIbuKandung: '',
  });

  const divisions = Array.from(new Set([...masterList.map((m) => m.divisi), ...employees.map((e) => e.division)])).sort();

  // Status Stats
  const countTetap = employees.filter((e) => e.status.toLowerCase().includes('tetap')).length;
  const countKontrak = employees.filter((e) => e.status.toLowerCase().includes('kontrak')).length;
  const countBorongan = employees.filter((e) => e.status.toLowerCase().includes('borongan')).length;
  const countHonorer = employees.filter((e) => e.status.toLowerCase().includes('honorer')).length;

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    const nextNik = (Math.max(0, ...employees.map((e) => parseInt(e.nik, 10) || 0)) + 1).toString();
    setFormData({
      nik: nextNik,
      name: '',
      nickname: '',
      nrpKodeKontrak: '',
      division: masterList[0]?.divisi || 'Finishing',
      position: '',
      status: 'Tetap',
      joinDate: new Date().toISOString().split('T')[0],
      email: '',
      phone: '',
      noKtp: '',
      noNpwp: '',
      noRekeningBca: '',
      noBpjsTk: '',
      noBpjsKs: '',
      alamat: '',
      tempatLahir: 'Bandung',
      tanggalLahir: '1995-01-01',
      pendidikan: 'SMA',
      agama: 'Islam',
      statusMarital: 'TK',
      namaPasangan: '',
      namaIbuKandung: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      nik: emp.nik,
      name: emp.name,
      nickname: emp.nickname || '',
      nrpKodeKontrak: emp.nrpKodeKontrak || '',
      division: emp.division,
      position: emp.position,
      status: emp.status,
      joinDate: emp.joinDate,
      email: emp.email || '',
      phone: emp.phone || '',
      noKtp: emp.noKtp || '',
      noNpwp: emp.noNpwp || '',
      noRekeningBca: emp.noRekeningBca || '',
      noBpjsTk: emp.noBpjsTk || '',
      noBpjsKs: emp.noBpjsKs || '',
      alamat: emp.alamat || '',
      tempatLahir: emp.tempatLahir || '',
      tanggalLahir: emp.tanggalLahir || '',
      pendidikan: emp.pendidikan || 'SMA',
      agama: emp.agama || 'Islam',
      statusMarital: emp.statusMarital || 'TK',
      namaPasangan: emp.namaPasangan || '',
      namaIbuKandung: emp.namaIbuKandung || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingEmployee) {
      onUpdateEmployee({
        ...editingEmployee,
        nik: formData.nik,
        name: formData.name,
        nickname: formData.nickname,
        nrpKodeKontrak: formData.nrpKodeKontrak,
        division: formData.division,
        position: formData.position,
        status: formData.status,
        joinDate: formData.joinDate,
        email: formData.email,
        phone: formData.phone,
        noKtp: formData.noKtp,
        noNpwp: formData.noNpwp,
        noRekeningBca: formData.noRekeningBca,
        noBpjsTk: formData.noBpjsTk,
        noBpjsKs: formData.noBpjsKs,
        alamat: formData.alamat,
        tempatLahir: formData.tempatLahir,
        tanggalLahir: formData.tanggalLahir,
        pendidikan: formData.pendidikan,
        agama: formData.agama,
        statusMarital: formData.statusMarital,
        namaPasangan: formData.namaPasangan,
        namaIbuKandung: formData.namaIbuKandung,
      });
    } else {
      const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 'bg-teal-600', 'bg-indigo-600', 'bg-rose-600'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newEmp: Employee = {
        id: `emp-${formData.nik || Date.now()}`,
        no: employees.length + 1,
        nik: formData.nik || `EMP-${Date.now().toString().slice(-4)}`,
        name: formData.name,
        nickname: formData.nickname,
        nrpKodeKontrak: formData.nrpKodeKontrak,
        division: formData.division,
        position: formData.position || `Staf ${formData.division}`,
        status: formData.status,
        joinDate: formData.joinDate,
        email: formData.email || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@pabrik.co.id`,
        phone: formData.phone || '0812-0000-0000',
        noKtp: formData.noKtp,
        noNpwp: formData.noNpwp,
        noRekeningBca: formData.noRekeningBca,
        noBpjsTk: formData.noBpjsTk,
        noBpjsKs: formData.noBpjsKs,
        alamat: formData.alamat,
        tempatLahir: formData.tempatLahir,
        tanggalLahir: formData.tanggalLahir,
        pendidikan: formData.pendidikan,
        agama: formData.agama,
        statusMarital: formData.statusMarital,
        namaPasangan: formData.namaPasangan,
        namaIbuKandung: formData.namaIbuKandung,
        avatarColor: randomColor,
      };
      onAddEmployee(newEmp);
    }

    setIsModalOpen(false);
  };

  // Filtered
  const filtered = employees.filter((emp) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      emp.name.toLowerCase().includes(q) ||
      emp.nik.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q) ||
      emp.division.toLowerCase().includes(q) ||
      (emp.nickname && emp.nickname.toLowerCase().includes(q)) ||
      (emp.nrpKodeKontrak && emp.nrpKodeKontrak.toLowerCase().includes(q)) ||
      (emp.alamat && emp.alamat.toLowerCase().includes(q));

    const matchesDiv = selectedDivision === 'ALL' || emp.division === selectedDivision;
    const matchesStat =
      selectedStatus === 'ALL' ||
      emp.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesDiv && matchesStat;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Overall Metrics */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Database Induk Karyawan Perusahaan (Sesuai File Resmi HRD)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Data karyawan memuat seluruh {employees.length} record resmi lengkap dengan NIK Internal, Jabatan/Fungsional,
            Departemen/Divisi, Status Kepegawaian, No. KTP, BPJS, NPWP, Rekening, dan Riwayat Personalia.
          </p>
          
          {/* Quick counts */}
          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 font-bold text-slate-700">
              Total: {employees.length} Orang
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Tetap: {countTetap}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Kontrak: {countKontrak}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              Borongan: {countBorongan}
            </span>
            {countHonorer > 0 && (
              <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                Honorer: {countHonorer}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSyncAssessments}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            title="Sinkronisasi seluruh karyawan ke periode penilaian aktif"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Sinkronkan Penilaian ({currentPeriod})</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-500/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Karyawan</span>
          </button>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, NIK, panggilan, NRP, jabatan, divisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">Semua Divisi ({divisions.length})</option>
              {divisions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="Tetap">Tetap</option>
              <option value="Kontrak">Kontrak</option>
              <option value="Borongan">Borongan</option>
              <option value="Honorer">Honorer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 font-mono">NIK Internal</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Lengkap & Panggilan</th>
                <th className="py-3 px-3 min-w-[130px]">Divisi / Dept</th>
                <th className="py-3 px-4 min-w-[180px]">Jabatan / Fungsional</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Tgl Masuk</th>
                <th className="py-3 px-3">No. Telpon</th>
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((emp, idx) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                    {emp.no || idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                    {emp.nik}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-7 h-7 rounded-full ${emp.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0`}
                      >
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div>{emp.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {emp.nickname ? `Panggilan: "${emp.nickname}"` : ''}{' '}
                          {emp.email ? `• ${emp.email}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold text-[11px] border border-blue-200">
                      {emp.division}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 font-medium">
                    <div>{emp.position}</div>
                    {emp.nrpKodeKontrak && emp.nrpKodeKontrak !== '0' && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        NRP: {emp.nrpKodeKontrak}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.status.toLowerCase().includes('tetap')
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : emp.status.toLowerCase().includes('kontrak')
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : emp.status.toLowerCase().includes('borongan')
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-purple-100 text-purple-800 border border-purple-300'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                    {emp.joinDate && emp.joinDate !== '00 Januari 1900' ? emp.joinDate : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                    {emp.phone || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => setViewingEmployee(emp)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Lihat Biodata Lengkap"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                        title="Edit Data Karyawan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Yakin ingin menghapus karyawan "${emp.name}" (NIK: ${emp.nik}) dari database?`)) {
                            onDeleteEmployee(emp.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Hapus Karyawan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Viewing Complete Employee Details Modal */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-base">
                  {viewingEmployee.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base">{viewingEmployee.name}</h3>
                  <div className="text-xs text-blue-300">
                    NIK: <span className="font-mono">{viewingEmployee.nik}</span> &bull; {viewingEmployee.position} ({viewingEmployee.division})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingEmployee(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Section 1: Kepegawaian */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs uppercase tracking-wider">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Data Kepegawaian & Jabatan</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block">Departemen / Divisi:</span>
                    <strong className="text-slate-800">{viewingEmployee.division}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Jabatan / Fungsional:</span>
                    <strong className="text-slate-800">{viewingEmployee.position}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status:</span>
                    <strong className="text-blue-700">{viewingEmployee.status}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">NRP / Kode Kontrak:</span>
                    <strong className="text-slate-800 font-mono">{viewingEmployee.nrpKodeKontrak || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tanggal Masuk:</span>
                    <strong className="text-slate-800">{viewingEmployee.joinDate || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Masa Kontrak:</span>
                    <strong className="text-slate-800">{viewingEmployee.masaKontrak || '-'}</strong>
                  </div>
                </div>
              </div>

              {/* Section 2: Administrasi Pajak, Bank & BPJS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Identitas Resmi, Bank & BPJS</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                  <div>
                    <span className="text-slate-500 font-sans block">No. KTP / NIK:</span>
                    <strong className="text-slate-800">{viewingEmployee.noKtp || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block">No. Rekening BCA:</span>
                    <strong className="text-slate-800">{viewingEmployee.noRekeningBca || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block">No. NPWP:</span>
                    <strong className="text-slate-800">{viewingEmployee.noNpwp || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block">BPJS Ketenagakerjaan:</span>
                    <strong className="text-slate-800">{viewingEmployee.noBpjsTk || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block">BPJS Kesehatan:</span>
                    <strong className="text-slate-800">{viewingEmployee.noBpjsKs || viewingEmployee.noBpjsKesehatan || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans block">Status PPh:</span>
                    <strong className="text-slate-800">{viewingEmployee.statusPph || '-'}</strong>
                  </div>
                </div>
              </div>

              {/* Section 3: Data Pribadi & Kontak */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs uppercase tracking-wider">
                  <Home className="w-4 h-4 text-amber-600" />
                  <span>Biodata Pribadi & Alamat</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block">Tempat, Tgl Lahir:</span>
                    <strong className="text-slate-800">{viewingEmployee.tempatLahir}, {viewingEmployee.tanggalLahir}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Jenis Kelamin:</span>
                    <strong className="text-slate-800">{viewingEmployee.gender || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Agama:</span>
                    <strong className="text-slate-800">{viewingEmployee.agama || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Pendidikan:</span>
                    <strong className="text-slate-800">{viewingEmployee.pendidikan || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Golongan Darah:</span>
                    <strong className="text-slate-800">{viewingEmployee.golonganDarah || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">No. Telepon / WA:</span>
                    <strong className="text-slate-800 font-mono">{viewingEmployee.phone || '-'}</strong>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-500 block">Alamat Tinggal Lengkap:</span>
                    <p className="text-slate-800 mt-0.5">{viewingEmployee.alamat || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Section 4: Data Keluarga */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs uppercase tracking-wider">
                  <Heart className="w-4 h-4 text-rose-600" />
                  <span>Susunan Keluarga & Kontak Darurat</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block">Status Marital:</span>
                    <strong className="text-slate-800">{viewingEmployee.statusMarital || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nama Istri / Suami:</span>
                    <strong className="text-slate-800">{viewingEmployee.namaPasangan || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ibu Kandung:</span>
                    <strong className="text-slate-800">{viewingEmployee.namaIbuKandung || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ayah Kandung:</span>
                    <strong className="text-slate-800">{viewingEmployee.namaAyahKandung || '-'}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Nama Anak:</span>
                    <div className="text-slate-800 mt-0.5">
                      {viewingEmployee.anak && viewingEmployee.anak.length > 0
                        ? viewingEmployee.anak.join(', ')
                        : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end space-x-2 shrink-0">
              <button
                onClick={() => {
                  setViewingEmployee(null);
                  handleOpenEdit(viewingEmployee);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Biodata Ini</span>
              </button>
              <button
                onClick={() => setViewingEmployee(null)}
                className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{editingEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIK Internal</label>
                  <input
                    type="text"
                    required
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Kepegawaian</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EmploymentStatus })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Borongan">Borongan</option>
                    <option value="Honorer">Honorer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Panggilan</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departemen / Divisi</label>
                  <select
                    value={formData.division}
                    onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    {divisions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan / Fungsional</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. KTP</label>
                  <input
                    type="text"
                    value={formData.noKtp}
                    onChange={(e) => setFormData({ ...formData, noKtp: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Rekening BCA</label>
                  <input
                    type="text"
                    value={formData.noRekeningBca}
                    onChange={(e) => setFormData({ ...formData, noRekeningBca: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Telpon / WA</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai Bergabung</label>
                  <input
                    type="text"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Tinggal</label>
                <textarea
                  rows={2}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition shadow-md shadow-blue-500/20"
                >
                  {editingEmployee ? 'Simpan Perubahan' : 'Tambahkan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
