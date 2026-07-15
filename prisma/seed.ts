import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Deterministic IDs for relations
const DEPT_IDS = {
  pentadbiran: "dept-pentadbiran",
  kewangan: "dept-kewangan",
  latihan: "dept-latihan",
  hr: "dept-hr",
  ict: "dept-ict",
  keselamatan: "dept-keselamatan",
};

const USER_IDS = {
  adminRohana: "user-admin-rohana",
  securitySiti: "user-sec-siti",
  securityAmin: "user-sec-amin",
  securityKumar: "user-sec-kumar",
  staffFaizal: "user-staff-faizal",
  staffLiza: "user-staff-liza",
  staffHassan: "user-staff-hassan",
  staffMei: "user-staff-mei",
  staffRaj: "user-staff-raj",
};

const VISITOR_IDS = [
  "vis-001", "vis-002", "vis-003", "vis-004", "vis-005",
  "vis-006", "vis-007", "vis-008", "vis-009", "vis-010",
  "vis-011", "vis-012", "vis-013", "vis-014", "vis-015",
  "vis-016", "vis-017", "vis-018",
];

async function main() {
  console.log("🌱 Seeding database...");

  // ===== DEPARTMENTS =====
  const departments = [
    { id: DEPT_IDS.pentadbiran, name: "Pentadbiran", description: "Bahagian Pentadbiran" },
    { id: DEPT_IDS.kewangan, name: "Kewangan", description: "Bahagian Kewangan" },
    { id: DEPT_IDS.latihan, name: "Bahagian Latihan Teknikal", description: "Latihan Teknikal" },
    { id: DEPT_IDS.hr, name: "Sumber Manusia", description: "Unit Sumber Manusia" },
    { id: DEPT_IDS.ict, name: "Unit ICT", description: "Unit Teknologi Maklumat" },
    { id: DEPT_IDS.keselamatan, name: "Unit Keselamatan", description: "Pengawal Keselamatan" },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: {},
      create: dept,
    });
  }
  console.log(`  ✓ ${departments.length} departments`);

  // ===== USERS (Profiles) =====
  const password = await bcrypt.hash("password123", 10);

  const users = [
    { id: USER_IDS.adminRohana, email: "rohana@pltbintulu.gov.my", passwordHash: password, fullName: "Puan Rohana Abdullah", role: "admin", departmentId: DEPT_IDS.pentadbiran, phone: "+60198234001", isActive: true },
    { id: USER_IDS.securitySiti, email: "siti@pltbintulu.gov.my", passwordHash: password, fullName: "Cik Siti Aishah", role: "security", departmentId: DEPT_IDS.keselamatan, phone: "+60198234002", isActive: true },
    { id: USER_IDS.securityAmin, email: "amin@pltbintulu.gov.my", passwordHash: password, fullName: "Encik Amin Rahman", role: "security", departmentId: DEPT_IDS.keselamatan, phone: "+60198234003", isActive: true },
    { id: USER_IDS.securityKumar, email: "kumar@pltbintulu.gov.my", passwordHash: password, fullName: "Encik Kumar Shan", role: "security", departmentId: DEPT_IDS.keselamatan, phone: "+60198234004", isActive: true },
    { id: USER_IDS.staffFaizal, email: "faizal@pltbintulu.gov.my", passwordHash: password, fullName: "En. Faizal Ibrahim", role: "staff", departmentId: DEPT_IDS.pentadbiran, phone: "+60198234010", isActive: true },
    { id: USER_IDS.staffLiza, email: "liza@pltbintulu.gov.my", passwordHash: password, fullName: "Puan Liza Hashim", role: "staff", departmentId: DEPT_IDS.kewangan, phone: "+60198234011", isActive: true },
    { id: USER_IDS.staffHassan, email: "hassan@pltbintulu.gov.my", passwordHash: password, fullName: "En. Hassan Ali", role: "staff", departmentId: DEPT_IDS.latihan, phone: "+60198234012", isActive: true },
    { id: USER_IDS.staffMei, email: "mei@pltbintulu.gov.my", passwordHash: password, fullName: "Cik Mei Ling", role: "staff", departmentId: DEPT_IDS.hr, phone: "+60198234013", isActive: true },
    { id: USER_IDS.staffRaj, email: "raj@pltbintulu.gov.my", passwordHash: password, fullName: "En. Raj Kumar", role: "staff", departmentId: DEPT_IDS.ict, phone: "+60198234014", isActive: true },
  ];

  for (const u of users) {
    await prisma.profile.upsert({
      where: { id: u.id },
      update: {},
      create: u,
    });
  }
  console.log(`  ✓ ${users.length} users (1 admin, 3 security, 5 staff)`);

  // ===== VISITORS (18 records) =====
  const visitors = [
    { id: VISITOR_IDS[0], fullName: "Encik Anwar bin Rahman", icPassportNo: "800101-13-5678", phone: "+60123450001", email: "anwar@syktabadi.com", company: "Syarikat Abadi Sdn Bhd" },
    { id: VISITOR_IDS[1], fullName: "Encik Tan Wei Ming", icPassportNo: "850505-14-1234", phone: "+60123450002", email: "tan@precisiontech.my", company: "Precision Tech Sdn Bhd" },
    { id: VISITOR_IDS[2], fullName: "Puan Salmiah binti Yusof", icPassportNo: "780909-08-9012", phone: "+60123450003", email: "salmiah@nusa.com", company: "Nusa Consulting" },
    { id: VISITOR_IDS[3], fullName: "Encik David Ling", icPassportNo: "900202-14-3456", phone: "+60123450004", email: "david@lingcorp.com", company: "Ling Corporation" },
    { id: VISITOR_IDS[4], fullName: "Cik Nurul Aina", icPassportNo: "950707-10-6789", phone: "+60123450005", email: "nurul@utmbintulu.edu", company: "UTM Bintulu (Pelajar Latihan)" },
    { id: VISITOR_IDS[5], fullName: "Encik Wong Chee Keong", icPassportNo: "820303-08-2345", phone: "+60123450006", email: "wong@electricalworks.my", company: "Electrical Works Sdn Bhd" },
    { id: VISITOR_IDS[6], fullName: "Puan Faridah binti Omar", icPassportNo: "760101-04-5678", phone: "+60123450007", email: "faridah@jkr.gov.my", company: "JKR Sarawak" },
    { id: VISITOR_IDS[7], fullName: "Encik Rajesh a/l Murugan", icPassportNo: "880808-14-9012", phone: "+60123450008", email: "rajesh@itnet.my", company: "IT Networks Sdn Bhd" },
    { id: VISITOR_IDS[8], fullName: "Cik Amelia Tan", icPassportNo: "920202-10-3456", phone: "+60123450009", email: "amelia@tan.com", company: "Tan Holdings" },
    { id: VISITOR_IDS[9], fullName: "Encik Mohd Hafiz", icPassportNo: "870505-13-6789", phone: "+60123450010", email: "hafiz@contractor.my", company: "Hafiz Contractor" },
    { id: VISITOR_IDS[10], fullName: "Puan Lee Mei Ling", icPassportNo: "840909-14-2345", phone: "+60123450011", email: "leemei@accounting.my", company: "Lee Accounting Firm" },
    { id: VISITOR_IDS[11], fullName: "Encik Alex Chong", icPassportNo: "900101-08-5678", phone: "+60123450012", email: "alex@chongtech.com", company: "Chong Technologies" },
    { id: VISITOR_IDS[12], fullName: "Cik Siti Khadijah", icPassportNo: "960606-10-9012", phone: "+60123450013", email: "khadijah@unisza.edu", company: "Pelajar Praktikal" },
    { id: VISITOR_IDS[13], fullName: "Encik Ibrahim bin Bakar", icPassportNo: "750303-04-3456", phone: "+60123450014", email: "ibrahim@bakarent.my", company: "Bakar Enterprise" },
    { id: VISITOR_IDS[14], fullName: "Puan Normala", icPassportNo: "800808-08-6789", phone: "+60123450015", email: "normala@supplier.my", company: "Normala Suppliers" },
    { id: VISITOR_IDS[15], fullName: "Encik David Chen", icPassportNo: "A12345678", phone: "+60123450016", email: "david.chen@global.com", company: "Global Pte Ltd (Singapore)" },
    { id: VISITOR_IDS[16], fullName: "Cik Zara Mohd", icPassportNo: "950101-10-2345", phone: "+60123450017", email: "zara@startup.my", company: "Startup Hub" },
    { id: VISITOR_IDS[17], fullName: "Encik Hafizuddin", icPassportNo: "871212-13-5678", phone: "+60123450018", email: "hafizuddin@vendor.my", company: "Vendor Solutions" },
  ];

  for (const v of visitors) {
    await prisma.visitor.upsert({
      where: { id: v.id },
      update: {},
      create: v,
    });
  }
  console.log(`  ✓ ${visitors.length} visitors`);

  // ===== VISITS (28 records across all statuses) =====
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);
  const hoursAhead = (h: number) => new Date(now.getTime() + h * 3600 * 1000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000);

  const visits = [
    // pending_approval (3)
    { id: "visit-001", referenceCode: "VMS-20260714-0001", visitorId: VISITOR_IDS[0], purpose: "Mesyuarat kontrak penyelenggaraan", hostStaffId: USER_IDS.staffFaizal, status: "pending_approval", expectedVisitDate: hoursAhead(2), pdpaConsent: true, createdAt: hoursAgo(0.5) },
    { id: "visit-002", referenceCode: "VMS-20260714-0002", visitorId: VISITOR_IDS[5], purpose: "Pembaikan sistem elektrik", hostStaffId: USER_IDS.staffHassan, status: "pending_approval", expectedVisitDate: hoursAhead(3), pdpaConsent: true, createdAt: hoursAgo(1) },
    { id: "visit-003", referenceCode: "VMS-20260714-0003", visitorId: VISITOR_IDS[16], purpose: "Perbincangan kerjasama latihan industri", hostStaffId: USER_IDS.staffMei, status: "pending_approval", expectedVisitDate: hoursAhead(24), pdpaConsent: true, createdAt: hoursAgo(0.2) },

    // approved (2)
    { id: "visit-004", referenceCode: "VMS-20260714-0004", visitorId: VISITOR_IDS[1], purpose: "Demo perisian e-pembelajaran", hostStaffId: USER_IDS.staffRaj, status: "approved", expectedVisitDate: hoursAhead(1), approvedById: USER_IDS.securitySiti, approvedAt: hoursAgo(2), pdpaConsent: true, createdAt: hoursAgo(3) },
    { id: "visit-005", referenceCode: "VMS-20260714-0005", visitorId: VISITOR_IDS[8], purpose: "Mesyuarat Lembaga Pengarah", hostStaffId: USER_IDS.staffFaizal, status: "approved", expectedVisitDate: hoursAhead(4), approvedById: USER_IDS.securitySiti, approvedAt: hoursAgo(1), pdpaConsent: true, createdAt: hoursAgo(2) },

    // checked_in (2 - in premis, urusan baru mula)
    { id: "visit-006", referenceCode: "VMS-20260714-0006", visitorId: VISITOR_IDS[2], purpose: "Rundingan kewangan latihan", hostStaffId: USER_IDS.staffLiza, status: "checked_in", expectedVisitDate: hoursAgo(1), approvedById: USER_IDS.securityAmin, approvedAt: hoursAgo(2), checkedInAt: hoursAgo(0.8), pdpaConsent: true, createdAt: hoursAgo(3) },
    { id: "visit-007", referenceCode: "VMS-20260714-0007", visitorId: VISITOR_IDS[10], purpose: "Semakan audit kewangan", hostStaffId: USER_IDS.staffLiza, status: "checked_in", expectedVisitDate: hoursAgo(0.5), approvedById: USER_IDS.securitySiti, approvedAt: hoursAgo(1), checkedInAt: hoursAgo(0.4), pdpaConsent: true, createdAt: hoursAgo(2) },

    // in_progress (2)
    { id: "visit-008", referenceCode: "VMS-20260714-0008", visitorId: VISITOR_IDS[3], purpose: "Pembentangan proposal infrastruktur", hostStaffId: USER_IDS.staffRaj, status: "in_progress", expectedVisitDate: hoursAgo(2), approvedById: USER_IDS.securitySiti, approvedAt: hoursAgo(3), checkedInAt: hoursAgo(2.5), pdpaConsent: true, createdAt: hoursAgo(4) },
    { id: "visit-009", referenceCode: "VMS-20260714-0009", visitorId: VISITOR_IDS[6], purpose: "Mesyuarat JKR kerja awam", hostStaffId: USER_IDS.staffHassan, status: "in_progress", expectedVisitDate: hoursAgo(1.5), approvedById: USER_IDS.securityAmin, approvedAt: hoursAgo(2), checkedInAt: hoursAgo(1.8), pdpaConsent: true, createdAt: hoursAgo(3) },

    // staff_verified (3 - waiting for feedback)
    { id: "visit-010", referenceCode: "VMS-20260714-0010", visitorId: VISITOR_IDS[4], purpose: "Temuduga latihan praktikal", hostStaffId: USER_IDS.staffMei, status: "staff_verified", expectedVisitDate: hoursAgo(3), approvedById: USER_IDS.securitySiti, approvedAt: hoursAgo(4), checkedInAt: hoursAgo(3.5), staffVerifiedAt: hoursAgo(2), staffRemarks: "Temuduga selesai. Calon berpotensi baik.", pdpaConsent: true, createdAt: hoursAgo(5) },
    { id: "visit-011", referenceCode: "VMS-20260714-0011", visitorId: VISITOR_IDS[7], purpose: "Pemasangan rangkaian WiFi baharu", hostStaffId: USER_IDS.staffRaj, status: "staff_verified", expectedVisitDate: hoursAgo(4), approvedById: USER_IDS.securitySiti, approvedAt: hoursAgo(5), checkedInAt: hoursAgo(4.5), staffVerifiedAt: hoursAgo(3), staffRemarks: "Pemasangan siap. Test connection berjaya.", pdpaConsent: true, createdAt: hoursAgo(6) },
    { id: "visit-012", referenceCode: "VMS-20260714-0012", visitorId: VISITOR_IDS[11], purpose: "Mesyuarat strategik ICT", hostStaffId: USER_IDS.staffRaj, status: "staff_verified", expectedVisitDate: hoursAgo(2), approvedById: USER_IDS.securityAmin, approvedAt: hoursAgo(3), checkedInAt: hoursAgo(2.5), staffVerifiedAt: hoursAgo(1), staffRemarks: "Mesyuarat produktif. Tindakan susulan akan dibuat.", pdpaConsent: true, createdAt: hoursAgo(4) },

    // pending_feedback (1)
    { id: "visit-013", referenceCode: "VMS-20260714-0013", visitorId: VISITOR_IDS[9], purpose: "Kerja-kerja pembersihan kawasan", hostStaffId: USER_IDS.staffHassan, status: "pending_feedback", expectedVisitDate: hoursAgo(3), approvedById: USER_IDS.securitySiti, approvedAt: hoursAgo(4), checkedInAt: hoursAgo(3.5), staffVerifiedAt: hoursAgo(2), staffRemarks: "Kerja selesai mengikut spesifikasi.", pdpaConsent: true, createdAt: hoursAgo(5) },

    // feedback_submitted (3 - ready for exit confirmation by security)
    { id: "visit-014", referenceCode: "VMS-20260714-0014", visitorId: VISITOR_IDS[12], purpose: "Bengkalai kerjaya kejuruteraan", hostStaffId: USER_IDS.staffHassan, status: "feedback_submitted", expectedVisitDate: hoursAgo(2), approvedById: USER_IDS.securitySiti, approvedAt: hoursAgo(3), checkedInAt: hoursAgo(2.5), staffVerifiedAt: hoursAgo(1.5), staffRemarks: "Bengkalai berjaya. Pelajar sangat teruja.", feedbackSubmittedAt: hoursAgo(1), pdpaConsent: true, createdAt: hoursAgo(4) },
    { id: "visit-015", referenceCode: "VMS-20260714-0015", visitorId: VISITOR_IDS[13], purpose: "Penghantaran barang bekalan", hostStaffId: USER_IDS.staffLiza, status: "feedback_submitted", expectedVisitDate: hoursAgo(4), approvedById: USER_IDS.securityAmin, approvedAt: hoursAgo(5), checkedInAt: hoursAgo(4.5), staffVerifiedAt: hoursAgo(3), staffRemarks: "Barang diterima. Resit disahkan.", feedbackSubmittedAt: hoursAgo(2.5), pdpaConsent: true, createdAt: hoursAgo(6) },
    { id: "visit-016", referenceCode: "VMS-20260714-0016", visitorId: VISITOR_IDS[14], purpose: "Rundingan harga bahan", hostStaffId: USER_IDS.staffLiza, status: "feedback_submitted", expectedVisitDate: hoursAgo(3), approvedById: USER_IDS.securitySiti, approvedAt: hoursAgo(4), checkedInAt: hoursAgo(3.5), staffVerifiedAt: hoursAgo(2.5), staffRemarks: "Setuju dengan harga baharu.", feedbackSubmittedAt: hoursAgo(2), pdpaConsent: true, createdAt: hoursAgo(5) },

    // ready_for_exit (2)
    { id: "visit-017", referenceCode: "VMS-20260714-0017", visitorId: VISITOR_IDS[15], purpose: "Mesyuarat serantau ASEAN", hostStaffId: USER_IDS.staffFaizal, status: "ready_for_exit", expectedVisitDate: hoursAgo(5), approvedById: USER_IDS.securitySiti, approvedAt: hoursAgo(6), checkedInAt: hoursAgo(5.5), staffVerifiedAt: hoursAgo(4), staffRemarks: "Mesyuarat selesai. Minit akan diedarkan.", feedbackSubmittedAt: hoursAgo(3.5), pdpaConsent: true, createdAt: hoursAgo(7) },
    { id: "visit-018", referenceCode: "VMS-20260714-0018", visitorId: VISITOR_IDS[17], purpose: "Servis peralatan makmal", hostStaffId: USER_IDS.staffHassan, status: "ready_for_exit", expectedVisitDate: hoursAgo(2), approvedById: USER_IDS.securityAmin, approvedAt: hoursAgo(3), checkedInAt: hoursAgo(2.5), staffVerifiedAt: hoursAgo(1.5), staffRemarks: "Peralatan berfungsi dengan baik.", feedbackSubmittedAt: hoursAgo(1), pdpaConsent: true, createdAt: hoursAgo(4) },

    // checked_out (8 - completed historical visits)
    { id: "visit-019", referenceCode: "VMS-20260713-0019", visitorId: VISITOR_IDS[0], purpose: "Mesyuarat mingguan kontraktor", hostStaffId: USER_IDS.staffFaizal, status: "checked_out", expectedVisitDate: daysAgo(1), approvedById: USER_IDS.securitySiti, approvedAt: daysAgo(1), checkedInAt: daysAgo(1), staffVerifiedAt: daysAgo(1), staffRemarks: "Mesyuarat selesai.", feedbackSubmittedAt: daysAgo(1), exitConfirmedById: USER_IDS.securitySiti, exitNotes: "Pelawat keluar pukul 5:00 petang.", checkedOutAt: daysAgo(1), pdpaConsent: true, createdAt: daysAgo(1) },
    { id: "visit-020", referenceCode: "VMS-20260713-0020", visitorId: VISITOR_IDS[1], purpose: "Demo perisian", hostStaffId: USER_IDS.staffRaj, status: "checked_out", expectedVisitDate: daysAgo(2), approvedById: USER_IDS.securitySiti, approvedAt: daysAgo(2), checkedInAt: daysAgo(2), staffVerifiedAt: daysAgo(2), staffRemarks: "Demo berjaya.", feedbackSubmittedAt: daysAgo(2), exitConfirmedById: USER_IDS.securitySiti, exitNotes: "Biasa.", checkedOutAt: daysAgo(2), pdpaConsent: true, createdAt: daysAgo(2) },
    { id: "visit-021", referenceCode: "VMS-20260712-0021", visitorId: VISITOR_IDS[2], purpose: "Konsultasi kewangan", hostStaffId: USER_IDS.staffLiza, status: "checked_out", expectedVisitDate: daysAgo(3), approvedById: USER_IDS.securityAmin, approvedAt: daysAgo(3), checkedInAt: daysAgo(3), staffVerifiedAt: daysAgo(3), staffRemarks: "Lengkap.", feedbackSubmittedAt: daysAgo(3), exitConfirmedById: USER_IDS.securityAmin, exitNotes: "-", checkedOutAt: daysAgo(3), pdpaConsent: true, createdAt: daysAgo(3) },
    { id: "visit-022", referenceCode: "VMS-20260711-0022", visitorId: VISITOR_IDS[3], purpose: "Pembentangan infrastruktur", hostStaffId: USER_IDS.staffRaj, status: "checked_out", expectedVisitDate: daysAgo(4), approvedById: USER_IDS.securitySiti, approvedAt: daysAgo(4), checkedInAt: daysAgo(4), staffVerifiedAt: daysAgo(4), staffRemarks: "Baik.", feedbackSubmittedAt: daysAgo(4), exitConfirmedById: USER_IDS.securitySiti, exitNotes: "Baik.", checkedOutAt: daysAgo(4), pdpaConsent: true, createdAt: daysAgo(4) },
    { id: "visit-023", referenceCode: "VMS-20260710-0023", visitorId: VISITOR_IDS[4], purpose: "Latihan industri", hostStaffId: USER_IDS.staffMei, status: "checked_out", expectedVisitDate: daysAgo(5), approvedById: USER_IDS.securitySiti, approvedAt: daysAgo(5), checkedInAt: daysAgo(5), staffVerifiedAt: daysAgo(5), staffRemarks: "Pelajar bersemangat.", feedbackSubmittedAt: daysAgo(5), exitConfirmedById: USER_IDS.securitySiti, exitNotes: "Biasa.", checkedOutAt: daysAgo(5), pdpaConsent: true, createdAt: daysAgo(5) },
    { id: "visit-024", referenceCode: "VMS-20260709-0024", visitorId: VISITOR_IDS[6], purpose: "Mesyuarat JKR", hostStaffId: USER_IDS.staffHassan, status: "checked_out", expectedVisitDate: daysAgo(6), approvedById: USER_IDS.securityAmin, approvedAt: daysAgo(6), checkedInAt: daysAgo(6), staffVerifiedAt: daysAgo(6), staffRemarks: "Mesyuarat selesai.", feedbackSubmittedAt: daysAgo(6), exitConfirmedById: USER_IDS.securityAmin, exitNotes: "Biasa.", checkedOutAt: daysAgo(6), pdpaConsent: true, createdAt: daysAgo(6) },
    { id: "visit-025", referenceCode: "VMS-20260708-0025", visitorId: VISITOR_IDS[7], purpose: "Pemasangan rangkaian", hostStaffId: USER_IDS.staffRaj, status: "checked_out", expectedVisitDate: daysAgo(7), approvedById: USER_IDS.securitySiti, approvedAt: daysAgo(7), checkedInAt: daysAgo(7), staffVerifiedAt: daysAgo(7), staffRemarks: "Siap.", feedbackSubmittedAt: daysAgo(7), exitConfirmedById: USER_IDS.securitySiti, exitNotes: "Baik.", checkedOutAt: daysAgo(7), pdpaConsent: true, createdAt: daysAgo(7) },
    { id: "visit-026", referenceCode: "VMS-20260707-0026", visitorId: VISITOR_IDS[8], purpose: "Mesyuarat lembaga", hostStaffId: USER_IDS.staffFaizal, status: "checked_out", expectedVisitDate: daysAgo(8), approvedById: USER_IDS.securitySiti, approvedAt: daysAgo(8), checkedInAt: daysAgo(8), staffVerifiedAt: daysAgo(8), staffRemarks: "Produktif.", feedbackSubmittedAt: daysAgo(8), exitConfirmedById: USER_IDS.securitySiti, exitNotes: "Baik.", checkedOutAt: daysAgo(8), pdpaConsent: true, createdAt: daysAgo(8) },

    // rejected (2)
    { id: "visit-027", referenceCode: "VMS-20260714-0027", visitorId: VISITOR_IDS[9], purpose: "Jualan langsung tidak berjanji temu", hostStaffId: USER_IDS.staffFaizal, status: "rejected", expectedVisitDate: hoursAgo(5), approvedById: USER_IDS.securitySiti, approvedAt: hoursAgo(5), rejectionReason: "Tiada janji temu terdahulu. Sila buat temu janji dahulu.", pdpaConsent: true, createdAt: hoursAgo(6) },
    { id: "visit-028", referenceCode: "VMS-20260713-0028", visitorId: VISITOR_IDS[10], purpose: "Penghantaran tanpa dokumen sokongan", hostStaffId: USER_IDS.staffLiza, status: "rejected", expectedVisitDate: daysAgo(1), approvedById: USER_IDS.securityAmin, approvedAt: daysAgo(1), rejectionReason: "Dokumen pengenalan tidak jelas. Sila muat naik semula.", pdpaConsent: true, createdAt: daysAgo(1) },
  ];

  for (const visit of visits) {
    await prisma.visit.upsert({
      where: { id: visit.id },
      update: {},
      create: visit,
    });
  }
  console.log(`  ✓ ${visits.length} visits across all statuses`);

  // ===== FEEDBACK (14 records) =====
  const feedbacks = [
    { visitId: "visit-014", rating: 5, comments: "Perkhidmatan cemerlang! Staf sangat membantu dan mesra." },
    { visitId: "visit-015", rating: 4, comments: "Proses lancar. Pengawal keselamatan profesional." },
    { visitId: "visit-016", rating: 5, comments: "Sangat puas hati dengan kemudahan." },
    { visitId: "visit-017", rating: 5, comments: "Mesyuarat berjalan lancar. Susunan tempat sangat baik." },
    { visitId: "visit-018", rating: 4, comments: "Pelayanan baik, masa menunggu singkat." },
    { visitId: "visit-019", rating: 5, comments: "Sistem baru sangat memudahkan urusan." },
    { visitId: "visit-020", rating: 4, comments: "Cemerlang, akan datang lagi." },
    { visitId: "visit-021", rating: 3, comments: "Biasa sahaja, tetapi boleh diterima." },
    { visitId: "visit-022", rating: 5, comments: "Sangat profesional. Cadangan ditambahbaikkan ruang menunggu." },
    { visitId: "visit-023", rating: 4, comments: "Bengkalai bermanfaat, fasilitator baik." },
    { visitId: "visit-024", rating: 5, comments: "Mesyuarat efisien. Terima kasih." },
    { visitId: "visit-025", rating: 2, comments: "Masa menunggu agak lama di kaunter." },
    { visitId: "visit-026", rating: 5, comments: "Pengalaman menyenangkan. Staf sopan." },
  ];

  for (const f of feedbacks) {
    await prisma.feedback.upsert({
      where: { visitId: f.visitId },
      update: {},
      create: f,
    });
  }
  console.log(`  ✓ ${feedbacks.length} feedback records`);

  // ===== DATA CONSISTENCY: Remove feedback from visits that shouldn't have it =====
  // Visits in pending_feedback/staff_verified/checked_in/in_progress/approved/pending_approval/rejected statuses
  // should NOT have feedback records (feedback is only for feedback_submitted+ statuses)
  const inconsistentVisits = await prisma.visit.findMany({
    where: {
      status: { in: ["pending_feedback", "staff_verified", "checked_in", "in_progress", "approved", "pending_approval", "rejected", "cancelled"] },
    },
    select: { id: true },
  });
  if (inconsistentVisits.length > 0) {
    const del = await prisma.feedback.deleteMany({
      where: { visitId: { in: inconsistentVisits.map((v) => v.id) } },
    });
    if (del.count > 0) console.log(`  ✓ Cleaned ${del.count} inconsistent feedback records`);
  }

  // Ensure visits with feedback_submitted/ready_for_exit/checked_out status HAVE feedback
  const needsFeedback = await prisma.visit.findMany({
    where: { status: { in: ["feedback_submitted", "ready_for_exit", "checked_out"] } },
    select: { id: true, referenceCode: true },
  });
  for (const v of needsFeedback) {
    const existing = await prisma.feedback.findUnique({ where: { visitId: v.id } });
    if (!existing) {
      await prisma.feedback.create({
        data: { visitId: v.id, rating: 4, comments: "Maklum balas automatik (data seed)" },
      });
    }
  }

  // ===== AUDIT LOGS (sample for each visit) =====
  const auditActions: Array<{ visitId: string; actorId: string; actorRole: string; action: string; details: string; createdAt: Date }> = [];
  for (const v of visits) {
    // visit_create
    auditActions.push({
      visitId: v.id,
      actorId: v.registeredById || null,
      actorRole: v.registeredById ? "security" : "visitor",
      action: "visit_create",
      details: JSON.stringify({ referenceCode: v.ref, purpose: v.purpose }),
      createdAt: v.createdAt,
    });
    if (v.approvedById) {
      auditActions.push({
        visitId: v.id,
        actorId: v.approvedById,
        actorRole: "security",
        action: v.status === "rejected" ? "visit_reject" : "visit_approve",
        details: JSON.stringify({ reason: v.rejectionReason || "Diluluskan" }),
        createdAt: v.approvedAt,
      });
    }
    if (v.checkedInAt) {
      auditActions.push({
        visitId: v.id,
        actorId: v.approvedById,
        actorRole: "security",
        action: "visit_checkin",
        details: JSON.stringify({ time: v.checkedInAt }),
        createdAt: v.checkedInAt,
      });
    }
    if (v.staffVerifiedAt) {
      auditActions.push({
        visitId: v.id,
        actorId: v.hostStaffId,
        actorRole: "staff",
        action: "visit_verify",
        details: JSON.stringify({ remarks: v.staffRemarks }),
        createdAt: v.staffVerifiedAt,
      });
    }
    if (v.feedbackSubmittedAt) {
      auditActions.push({
        visitId: v.id,
        actorId: null,
        actorRole: "visitor",
        action: "visit_feedback",
        details: JSON.stringify({}),
        createdAt: v.feedbackSubmittedAt,
      });
    }
    if (v.exitConfirmedById) {
      auditActions.push({
        visitId: v.id,
        actorId: v.exitConfirmedById,
        actorRole: "security",
        action: "visit_exit",
        details: JSON.stringify({ notes: v.exitNotes }),
        createdAt: v.checkedOutAt,
      });
    }
  }

  // user_create logs
  for (const u of users) {
    auditActions.push({
      visitId: null,
      actorId: USER_IDS.adminRohana,
      actorRole: "admin",
      action: "user_create",
      details: JSON.stringify({ email: u.email, role: u.role, fullName: u.fullName }),
      createdAt: daysAgo(30),
    });
  }

  for (const log of auditActions) {
    await prisma.auditLog.create({ data: log });
  }
  console.log(`  ✓ ${auditActions.length} audit log entries`);

  // ===== NOTIFICATIONS =====
  const notifications = [
    { recipientId: USER_IDS.staffFaizal, recipientType: "staff", visitId: "visit-006", title: "Pelawat Telah Tiba", message: "Puan Salmiah binti Yusof telah check-in untuk urusan: Rundingan kewangan latihan", channel: "in_app" },
    { recipientId: USER_IDS.staffLiza, recipientType: "staff", visitId: "visit-007", title: "Pelawat Telah Tiba", message: "Puan Lee Mei Ling telah check-in untuk urusan: Semakan audit kewangan", channel: "in_app" },
    { recipientId: USER_IDS.staffRaj, recipientType: "staff", visitId: "visit-008", title: "Pelawat Telah Tiba", message: "Encik David Ling telah check-in untuk urusan: Pembentangan proposal infrastruktur", channel: "in_app" },
    { recipientId: USER_IDS.staffHassan, recipientType: "staff", visitId: "visit-009", title: "Pelawat Telah Tiba", message: "Puan Faridah binti Omar telah check-in untuk urusan: Mesyuarat JKR kerja awam", channel: "in_app" },
    { recipientId: USER_IDS.staffFaizal, recipientType: "staff", visitId: "visit-001", title: "Permohonan Baru", message: "Permohonan baharu menunggu kelulusan: Encik Anwar bin Rahman", channel: "in_app", isRead: false },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }
  console.log(`  ✓ ${notifications.length} notifications`);

  // ===== SYSTEM SETTINGS =====
  const settings = [
    { key: "staff_verification_sla_hours", value: JSON.stringify(2) },
    { key: "data_retention_months", value: JSON.stringify(12) },
    { key: "overstay_threshold_minutes", value: JSON.stringify(180) },
    { key: "max_upload_size_mb", value: JSON.stringify(5) },
    { key: "pdpa_notice_text", value: JSON.stringify("Maklumat peribadi anda akan dikumpul dan diproses selaras dengan Akta Perlindungan Data Peribadi 2010 (PDPA) bagi tujuan pengurusan lawatan dan keselamatan premis PLTT Bintulu.") },
    { key: "organization_name", value: JSON.stringify("Pusat Latihan Teknologi Tinggi Bintulu (PLTT Bintulu)") },
    { key: "organization_short", value: JSON.stringify("PLTT Bintulu") },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`  ✓ ${settings.length} system settings`);

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📋 Demo Login Credentials:");
  console.log("  Admin:    rohana@pltbintulu.gov.my / password123");
  console.log("  Security: siti@pltbintulu.gov.my / password123");
  console.log("  Staff:    faizal@pltbintulu.gov.my / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
