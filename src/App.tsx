import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_EMPLOYEES,
  INITIAL_MASTER_ATTITUDE,
  INITIAL_MASTER_KPI,
  buildAssessmentForEmployee,
  generateInitialAssessments
} from './data/initialData';
import { Employee, MasterAttitudeRecord, MasterKPIRecord, MonthlyAssessment } from './types';
import {
  calculateDynamicScoreA,
  calculateFinalScore,
  determineGradeAndStatus
} from './utils/calculations';
import { exportToExcel } from './utils/excelExport';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AttitudeScoringView } from './components/AttitudeScoringView';
import { KpiScoringView } from './components/KpiScoringView';
import { EmployeeDatabaseView } from './components/EmployeeDatabaseView';
import { MasterDataView } from './components/MasterDataView';
import { EmployeeReportCardModal } from './components/EmployeeReportCardModal';
import { TransparencyExplainerModal } from './components/TransparencyExplainerModal';
import { ImportExcelModal } from './components/ImportExcelModal';
import { EmployeePortalView } from './components/EmployeePortalView';
import { HrLoginModal } from './components/HrLoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { SendAssessmentEmailModal } from './components/SendAssessmentEmailModal';
import { EmailNotificationLogsModal } from './components/EmailNotificationLogsModal';
import { AssessmentHistoryModal } from './components/AssessmentHistoryModal';
import {
  enrichAssessmentWithDate,
  getEmployeeAssessmentHistory,
  getPeriodAssessments,
  savePeriodAssessments,
  getDailyAssessmentsForDate,
  saveDailyAssessments,
  parseAssessmentDate
} from './utils/assessmentDatabase';

export default function App() {
  // Active Date & Periods
  const [currentDate, setCurrentDate] = useState<string>(() => {
    return localStorage.getItem('kpi_active_date_v2') || '2026-09-24';
  });
  const [currentPeriod, setCurrentPeriod] = useState<string>(() => {
    const savedDate = localStorage.getItem('kpi_active_date_v2') || '2026-09-24';
    return savedDate.substring(0, 7);
  });
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([
    '2026-09',
    '2026-08',
    '2026-07',
    '2026-06',
    '2026-05',
    '2026-04'
  ]);

  // HR Authentication Session
  const [hrSession, setHrSession] = useState<{ name: string; username: string; role: string } | null>(() => {
    try {
      const local = localStorage.getItem('hr_auth_session');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.user) return parsed.user;
      }
      const session = sessionStorage.getItem('hr_auth_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed?.user) return parsed.user;
      }
    } catch {
      // fallback
    }
    return null;
  });

  const isHrAuthenticated = !!hrSession;

  // Active Tab & Role: Default to 'employee' if not authenticated as HR
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sikap' | 'kpi' | 'master' | 'master-sikap' | 'master-kpi' | 'employees'>('dashboard');
  const [userRole, setUserRole] = useState<'admin' | 'employee'>(() => {
    return isHrAuthenticated ? 'admin' : 'employee';
  });

  const [isHrLoginModalOpen, setIsHrLoginModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Master Data Sikap & Absensi (A)
  const [masterAttitudeList, setMasterAttitudeList] = useState<MasterAttitudeRecord[]>(() => {
    const saved = localStorage.getItem('kpi_master_attitude_data_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_MASTER_ATTITUDE;
  });

  // Master Data KPI (B)
  const [masterList, setMasterList] = useState<MasterKPIRecord[]>(() => {
    const saved = localStorage.getItem('kpi_master_data_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_MASTER_KPI.length) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_MASTER_KPI;
  });

  // Employee Database (All 151 official company records)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('kpi_employees_data_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 150) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_EMPLOYEES;
  });

  // Monthly Assessments
  const [assessments, setAssessments] = useState<MonthlyAssessment[]>(() => {
    const saved = localStorage.getItem(`kpi_assessments_v2_2026-09`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 150) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return generateInitialAssessments('2026-09');
  });

  // Modals
  const [selectedAssessmentForReport, setSelectedAssessmentForReport] = useState<MonthlyAssessment | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isExplainerModalOpen, setIsExplainerModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Email Notification Modals
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailModalMode, setEmailModalMode] = useState<'single' | 'bulk'>('single');
  const [selectedAssessmentForEmail, setSelectedAssessmentForEmail] = useState<MonthlyAssessment | null>(null);
  const [selectedIdsForEmailModal, setSelectedIdsForEmailModal] = useState<string[]>([]);
  const [isEmailLogsModalOpen, setIsEmailLogsModalOpen] = useState(false);

  const handleOpenSingleEmail = (assessment: MonthlyAssessment) => {
    setSelectedAssessmentForEmail(assessment);
    setSelectedIdsForEmailModal([assessment.id]);
    setEmailModalMode('single');
    setIsEmailModalOpen(true);
  };

  const handleOpenBulkEmail = () => {
    setSelectedAssessmentForEmail(null);
    setSelectedIdsForEmailModal(assessments.map((a) => a.id));
    setEmailModalMode('bulk');
    setIsEmailModalOpen(true);
  };

  const handleOpenSelectiveEmail = (selectedList: MonthlyAssessment[]) => {
    setSelectedAssessmentForEmail(null);
    setSelectedIdsForEmailModal(selectedList.map((a) => a.id));
    setEmailModalMode('bulk');
    setIsEmailModalOpen(true);
  };

  const handleNotificationSent = (updatedList: MonthlyAssessment[], message: string) => {
    const updatedMap = new Map(updatedList.map((u) => [u.id, u]));
    const newAssessments = assessments.map((a) => updatedMap.get(a.id) || a);
    setAssessments(newAssessments);
    localStorage.setItem(`kpi_assessments_v2_${currentPeriod}`, JSON.stringify(newAssessments));
    showToast(message);
  };

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync Master KPI to LocalStorage
  useEffect(() => {
    localStorage.setItem('kpi_master_data_v2', JSON.stringify(masterList));
  }, [masterList]);

  // Sync Employees to LocalStorage
  useEffect(() => {
    localStorage.setItem('kpi_employees_data_v2', JSON.stringify(employees));
  }, [employees]);

  // Sync Assessments to LocalStorage
  useEffect(() => {
    savePeriodAssessments(currentPeriod, assessments);
  }, [assessments, currentPeriod]);

  // Sync Master Attitude to LocalStorage
  useEffect(() => {
    localStorage.setItem('kpi_master_attitude_data_v2', JSON.stringify(masterAttitudeList));
  }, [masterAttitudeList]);

  // Handle Switch Date (Tanggal, Bulan, Tahun)
  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    localStorage.setItem('kpi_active_date_v2', newDate);
    const newPeriod = newDate.substring(0, 7);
    if (!availablePeriods.includes(newPeriod)) {
      setAvailablePeriods([newPeriod, ...availablePeriods]);
    }
    setCurrentPeriod(newPeriod);

    // Retrieve or generate assessments for this exact date
    const dailyData = getDailyAssessmentsForDate(newDate, employees, masterList);
    setAssessments(dailyData);
    saveDailyAssessments(newDate, dailyData);
    savePeriodAssessments(newPeriod, dailyData);

    const formatted = parseAssessmentDate(newDate);
    showToast(`Tanggal evaluasi aktif: ${formatted.dayName}, ${formatted.day} ${formatted.monthName} ${formatted.year}`);
  };

  // Handle Switch Period
  const handlePeriodChange = (newPeriod: string) => {
    setCurrentPeriod(newPeriod);
    const newDate = `${newPeriod}-24`;
    setCurrentDate(newDate);
    localStorage.setItem('kpi_active_date_v2', newDate);
    const dailyData = getDailyAssessmentsForDate(newDate, employees, masterList);
    setAssessments(dailyData);
    showToast(`Memuat data penilaian untuk periode ${newPeriod}`);
  };

  // Update assessment date for all assessments in current period
  const handleUpdateAssessmentsDate = (newDateStr: string) => {
    const updated = assessments.map((a) => enrichAssessmentWithDate(a, newDateStr));
    setAssessments(updated);
    savePeriodAssessments(currentPeriod, updated);
    showToast(`Tanggal evaluasi periode ${currentPeriod} berhasil disimpan permanen.`);
  };

  // Add New Period
  const handleAddNewPeriod = () => {
    const nextMonth = prompt('Masukkan kode periode baru (format YYYY-MM, contoh: 2026-10):', '2026-10');
    if (!nextMonth || !nextMonth.trim()) return;

    const trimmed = nextMonth.trim();
    if (!availablePeriods.includes(trimmed)) {
      setAvailablePeriods([trimmed, ...availablePeriods]);
    }
    handlePeriodChange(trimmed);
  };

  // Employee Add / Update / Delete
  const handleAddEmployee = (newEmp: Employee) => {
    const updatedEmployees = [...employees, newEmp];
    setEmployees(updatedEmployees);

    // Auto-generate assessment record for current period
    const newAssessment = buildAssessmentForEmployee(newEmp, currentPeriod, masterList);
    setAssessments([...assessments, newAssessment]);
    showToast(`Karyawan ${newEmp.name} berhasil ditambahkan dan otomatis diproses ke periode ${currentPeriod}!`);
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    const updatedEmployees = employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e));
    setEmployees(updatedEmployees);

    // Update related assessment in current period
    const updatedAssessments = assessments.map((a) => {
      if (a.employeeId === updatedEmp.id) {
        return {
          ...a,
          employeeName: updatedEmp.name,
          employeeNik: updatedEmp.nik,
          division: updatedEmp.division,
          position: updatedEmp.position,
        };
      }
      return a;
    });
    setAssessments(updatedAssessments);
    showToast(`Data karyawan ${updatedEmp.name} berhasil diperbarui.`);
  };

  const handleDeleteEmployee = (empId: string) => {
    setEmployees(employees.filter((e) => e.id !== empId));
    setAssessments(assessments.filter((a) => a.employeeId !== empId));
    showToast('Karyawan telah dihapus dari database.');
  };

  // Synchronize Employee Database to active Assessment period
  const handleSyncAssessments = () => {
    const existingEmpIds = new Set(assessments.map((a) => a.employeeId));
    let addedCount = 0;
    const newAssessments = [...assessments];

    employees.forEach((emp) => {
      if (!existingEmpIds.has(emp.id)) {
        newAssessments.push(buildAssessmentForEmployee(emp, currentPeriod, masterList));
        addedCount++;
      }
    });

    setAssessments(newAssessments);
    showToast(`Sinkronisasi selesai! ${addedCount} karyawan baru otomatis ditambahkan ke penilaian periode ${currentPeriod}.`);
  };

  // Update Individual Assessment
  const handleUpdateAssessment = (updated: MonthlyAssessment) => {
    const updatedList = assessments.map((a) => (a.id === updated.id ? updated : a));
    setAssessments(updatedList);
  };

  // Batch update assessments
  const handleBatchUpdateAssessments = (updatedList: MonthlyAssessment[]) => {
    setAssessments(updatedList);
  };

  // Update Attitude Master Data & Optionally Recalculate all employee scores
  const handleUpdateMasterAttitude = (
    newList: MasterAttitudeRecord[],
    shouldRecalculateScores = true
  ) => {
    setMasterAttitudeList(newList);
    localStorage.setItem('kpi_master_attitude_data_v2', JSON.stringify(newList));

    if (shouldRecalculateScores) {
      const active = newList.filter((c) => c.enabled !== false);
      const recalculated = assessments.map((a) => {
        const newScoreA = calculateDynamicScoreA(active, a, a.seringTelat);
        const newFinalScore = calculateFinalScore(newScoreA, a.totalSkorB);
        const { grade, statusLabel } = determineGradeAndStatus(newFinalScore);
        return {
          ...a,
          totalSkorA: newScoreA,
          finalScore: newFinalScore,
          grade,
          statusLabel,
        };
      });
      setAssessments(recalculated);
      localStorage.setItem(`kpi_assessments_v2_${currentPeriod}`, JSON.stringify(recalculated));
      showToast('Master data sikap diperbarui & seluruh skor karyawan otomatis dihitung ulang!');
    } else {
      showToast('Master data sikap berhasil diperbarui.');
    }
  };

  // Export to Excel (matching exact openpyxl script)
  const handleExportExcel = () => {
    exportToExcel(assessments, masterList, masterAttitudeList, `Sistem_Penilaian_KPI_HRD_${currentPeriod}.xlsx`);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
    showToast('File Excel (Sistem_Penilaian_KPI_HRD.xlsx) berhasil diekspor!');
  };

  // Open individual Report Card
  const handleOpenReportCard = (assessment: MonthlyAssessment) => {
    setSelectedAssessmentForReport(assessment);
    setIsReportModalOpen(true);
  };

  // HR Authentication Handlers
  const handleHrLoginSuccess = (user: { name: string; username: string; role: string }) => {
    setHrSession(user);
    setUserRole('admin');
    setActiveTab('dashboard');
    showToast(`Otentikasi Berhasil. Selamat datang, ${user.name}! Mode HR Aktif.`);
  };

  const handleHrLogout = () => {
    localStorage.removeItem('hr_auth_session');
    sessionStorage.removeItem('hr_auth_session');
    setHrSession(null);
    setUserRole('employee');
    showToast('Sesi HR berhasil diakhiri. Akses beralih ke Mode Karyawan.');
  };

  const handleToggleRole = () => {
    if (userRole === 'admin') {
      // Toggle to employee preview mode
      setUserRole('employee');
      showToast('Pratinjau Mode Karyawan aktif.');
    } else {
      if (isHrAuthenticated) {
        setUserRole('admin');
        showToast('Kembali ke Mode HR.');
      } else {
        setIsHrLoginModalOpen(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Global Header */}
      <Header
        currentPeriod={currentPeriod}
        onPeriodChange={handlePeriodChange}
        currentDate={currentDate}
        onDateChange={handleDateChange}
        availablePeriods={availablePeriods}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExportExcel={handleExportExcel}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenExplainer={() => setIsExplainerModalOpen(true)}
        onAddNewPeriod={handleAddNewPeriod}
        userRole={userRole}
        onToggleRole={handleToggleRole}
        isHrAuthenticated={isHrAuthenticated}
        hrUser={hrSession}
        onOpenHrLogin={() => setIsHrLoginModalOpen(true)}
        onHrLogout={handleHrLogout}
        onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
        onOpenEmailLogs={() => setIsEmailLogsModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-bottom-3 duration-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* View Switching based on userRole and activeTab: If not authenticated or in employee mode, strictly render EmployeePortalView */}
        {userRole === 'employee' || !isHrAuthenticated ? (
          <EmployeePortalView
            assessments={assessments}
            onOpenReportCard={handleOpenReportCard}
            masterAttitudeList={masterAttitudeList}
            availablePeriods={availablePeriods}
            employees={employees}
            masterList={masterList}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                assessments={assessments}
                onSelectAssessment={handleOpenReportCard}
                onNavigateTab={setActiveTab}
                currentPeriod={currentPeriod}
                availablePeriods={availablePeriods}
                onPeriodChange={handlePeriodChange}
                employees={employees}
                masterList={masterList}
                onOpenSendEmail={handleOpenSingleEmail}
                onOpenBulkEmail={handleOpenBulkEmail}
                onOpenSelectiveEmail={handleOpenSelectiveEmail}
                onOpenEmailLogs={() => setIsEmailLogsModalOpen(true)}
                onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
                onQuickSimulateAll={() => {
                  const refreshed = assessments.map((a) => {
                    const emp = employees.find((e) => e.id === a.employeeId);
                    return emp ? buildAssessmentForEmployee(emp, currentPeriod, masterList, a) : a;
                  });
                  setAssessments(refreshed);
                  showToast('Semua nilai dan kategori status berhasil dikalkulasi ulang!');
                }}
              />
            )}

            {activeTab === 'sikap' && (
              <AttitudeScoringView
                assessments={assessments}
                masterAttitudeList={masterAttitudeList}
                onUpdateAssessment={handleUpdateAssessment}
                onBatchUpdate={handleBatchUpdateAssessments}
                onNavigateMasterAttitude={() => setActiveTab('master-sikap')}
              />
            )}

            {activeTab === 'kpi' && (
              <KpiScoringView
                assessments={assessments}
                onUpdateAssessment={handleUpdateAssessment}
                onBatchUpdate={handleBatchUpdateAssessments}
              />
            )}

            {activeTab === 'employees' && (
              <EmployeeDatabaseView
                employees={employees}
                masterList={masterList}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onSyncAssessments={handleSyncAssessments}
                currentPeriod={currentPeriod}
              />
            )}

            {(activeTab === 'master' || activeTab === 'master-sikap' || activeTab === 'master-kpi') && (
              <MasterDataView
                masterList={masterList}
                onUpdateMasterList={(newList) => {
                  setMasterList(newList);
                  localStorage.setItem('kpi_master_data_v2', JSON.stringify(newList));
                  showToast('Master data divisi & target KPI berhasil diperbarui.');
                }}
                masterAttitudeList={masterAttitudeList}
                onUpdateMasterAttitude={handleUpdateMasterAttitude}
                activeSubTab={activeTab === 'master-kpi' ? 'kpi' : 'sikap'}
                onSubTabChange={(sub) => setActiveTab(sub === 'kpi' ? 'master-kpi' : 'master-sikap')}
              />
            )}
          </>
        )}
      </main>

      {/* Printable Report Card Slip Modal */}
      <EmployeeReportCardModal
        assessment={selectedAssessmentForReport}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        masterAttitudeList={masterAttitudeList}
        onOpenSendEmail={handleOpenSingleEmail}
        historicalAssessments={
          selectedAssessmentForReport
            ? getEmployeeAssessmentHistory(
                selectedAssessmentForReport.employeeId,
                availablePeriods,
                employees,
                masterList
              )
            : []
        }
      />

      {/* Assessment History Modal across Days, Months, and Years */}
      <AssessmentHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        availablePeriods={availablePeriods}
        employees={employees}
        masterList={masterList}
        currentPeriod={currentPeriod}
        currentAssessments={assessments}
        onSelectAssessment={handleOpenReportCard}
        onUpdateAssessmentsDate={handleUpdateAssessmentsDate}
      />

      {/* Transparency & Methodology Explainer Modal */}
      <TransparencyExplainerModal
        isOpen={isExplainerModalOpen}
        onClose={() => setIsExplainerModalOpen(false)}
        masterAttitudeList={masterAttitudeList}
      />

      {/* Import Excel Modal */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        assessments={assessments}
        masterList={masterList}
        masterAttitudeList={masterAttitudeList}
        onImportAssessments={(updated) => {
          setAssessments(updated);
          showToast('Data penilaian Excel berhasil diimpor & dihitung otomatis!');
        }}
        onExportTemplate={handleExportExcel}
      />

      {/* HR Authentication Modal */}
      <HrLoginModal
        isOpen={isHrLoginModalOpen}
        onClose={() => setIsHrLoginModalOpen(false)}
        onSuccessLogin={handleHrLoginSuccess}
      />

      {/* HR Change Password & Email Link Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        currentUser={hrSession}
        onPasswordChanged={(msg) => showToast(msg)}
      />

      {/* Send Assessment Email Modal (Single & Bulk Notification) */}
      <SendAssessmentEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        mode={emailModalMode}
        assessment={selectedAssessmentForEmail}
        employee={
          selectedAssessmentForEmail
            ? employees.find((e) => e.id === selectedAssessmentForEmail.employeeId) || null
            : null
        }
        assessments={assessments}
        employees={employees}
        initialSelectedIds={selectedIdsForEmailModal}
        onNotificationSent={handleNotificationSent}
        currentPeriod={currentPeriod}
        senderName={hrSession?.name || 'Divisi HRD & People Development'}
      />

      {/* Email Notification Logs Modal */}
      <EmailNotificationLogsModal
        isOpen={isEmailLogsModalOpen}
        onClose={() => setIsEmailLogsModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            &copy; {new Date().getFullYear()} Sistem Penilaian Kinerja Karyawan &bull; Transparan & Otomatis
          </div>
          <div className="flex items-center space-x-3 text-slate-400 dark:text-slate-500">
            <span>Sikap (50%)</span>
            <span>&bull;</span>
            <span>KPI Teknis (50%)</span>
            <span>&bull;</span>
            <span>Formula Sesuai Standar Openpyxl HRD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
