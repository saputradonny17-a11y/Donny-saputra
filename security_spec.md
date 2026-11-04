# Security Specification & Threat Model

## Application: Sistem Penilaian KPI & Kinerja Karyawan

### 1. Data Invariants
1. **Employees Collection (`/employees/{employeeId}`)**:
   - `nik` must be a valid non-empty string of length <= 32.
   - `name` must be a string of length <= 128.
   - `division` and `position` must be non-empty strings <= 64.
   - An employee document can only be created or modified by an authenticated administrator or HR user.
   - Non-admin users (employees in portal mode) can only read employee profiles or read their own record.

2. **Assessments Collection (`/assessments/{assessmentId}`)**:
   - `period` must match format YYYY-MM (size == 7).
   - `finalScore`, `totalSkorA`, and `totalSkorB` must be numbers between 0 and 10.
   - `grade` must be one of `['A', 'B', 'C', 'D', 'E']`.
   - `employeeId` must reference an existing employee.
   - Unauthenticated or non-admin users cannot alter scores or publish unauthorized evaluations.
   - Employees can only read published assessments (`publishedStatus == 'published'`).

3. **Master Configuration Collections (`/masterAttitude/{id}`, `/masterKPI/{id}`, `/periods/{id}`)**:
   - Read is permitted for authenticated users.
   - Write/Update/Delete is strictly restricted to verified administrators (`isAdmin()`).

4. **Email Notification Logs (`/emailLogs/{logId}`)**:
   - Audit trail can only be created by administrators during notification dispatch.
   - Cannot be modified or tampered with once created.

---

### 2. The "Dirty Dozen" Malicious Payloads (Negative Tests)
1. **Payload 1 (Ghost Field Injection)**: Attempt to inject `isSuperAdmin: true` into `/employees/emp-1`.
2. **Payload 2 (Score Tampering)**: Attempt to set `finalScore: 99.9` or negative scores.
3. **Payload 3 (Grade Forgery)**: Attempt to write an invalid grade `grade: 'S+'`.
4. **Payload 4 (Unverified Admin Spoofing)**: Attempt to write admin collection with unverified email.
5. **Payload 5 (Oversized Payload / Denial of Wallet)**: Attempt to inject 100KB string in `notes` or `employeeName`.
6. **Payload 6 (Path ID Injection)**: Attempt to use invalid characters in document ID `/assessments/../../etc`.
7. **Payload 7 (Unpublished Assessment Leak)**: Non-admin trying to query draft assessment records.
8. **Payload 8 (Employee Self-Promotion)**: An employee editing their own salary/grade field in `/employees`.
9. **Payload 9 (Orphan Assessment)**: Creating an assessment with non-existent `employeeId`.
10. **Payload 10 (Period Format Violation)**: Creating an assessment with malformed period `period: 'invalid-date'`.
11. **Payload 11 (Audit Log Tampering)**: Updating or deleting an immutable email log record in `/emailLogs`.
12. **Payload 12 (Anonymous Privilege Escalation)**: Anonymous unauthenticated client attempting any write operation.
