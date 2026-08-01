// Supabase REST API client - replaces Prisma direct database connection
// Uses the PostgREST API (HTTPS) which works everywhere (Vercel, etc.)

const SUPABASE_URL = process.env.SUPABASE_URL || "https://asvepchcavvtesuiyndf.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_hZu5MGtU3mS_ZulrvaKZdQ_bV1yoM0I";

const BASE = `${SUPABASE_URL}/rest/v1`;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

async function restFetch(path: string, options: RequestInit = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST ${res.status}: ${text.slice(0, 200)}`);
  }
  // DELETE returns empty body
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ===== Types (matching Prisma schema) =====
export interface Profile {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: string;
  departmentId: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface Visitor {
  id: string;
  fullName: string;
  icPassportNo: string;
  phone: string;
  email: string | null;
  company: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  referenceCode: string;
  visitorId: string;
  purpose: string;
  hostStaffId: string;
  registeredById: string | null;
  expectedVisitDate: string;
  status: string;
  approvedById: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  checkedInAt: string | null;
  staffVerifiedAt: string | null;
  staffRemarks: string | null;
  feedbackSubmittedAt: string | null;
  exitConfirmedById: string | null;
  exitNotes: string | null;
  checkedOutAt: string | null;
  pdpaConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorDocument {
  id: string;
  visitorId: string;
  visitId: string;
  docType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface Feedback {
  id: string;
  visitId: string;
  rating: number;
  comments: string | null;
  submittedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorRole: string;
  action: string;
  visitId: string | null;
  details: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string | null;
  recipientType: string;
  visitId: string | null;
  channel: string;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
}

// ===== Database client (drop-in replacement for Prisma) =====
export const db = {
  profile: {
    count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      let path = "/Profile?select=id&limit=1";
      if (where) {
        for (const [k, v] of Object.entries(where)) {
          if (v === null) path += `&${k}=is.null`;
          else path += `&${k}=eq.${encodeURIComponent(String(v))}`;
        }
      }
      const res = await fetch(`${BASE}${path}`, {
        headers: { ...headers, Prefer: "count=exact" },
      });
      const range = res.headers.get("content-range");
      return range ? parseInt(range.split("/")[1], 10) || 0 : 0;
    },
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
      let path = "/Profile?";
      if (where.email) path += `email=eq.${encodeURIComponent(where.email)}`;
      else if (where.id) path += `id=eq.${encodeURIComponent(where.id)}`;
      else return null;
      path += "&limit=1";
      const res = await restFetch(path);
      return Array.isArray(res) && res.length > 0 ? (res[0] as Profile) : null;
    },
    findFirst: async ({ where }: { where: Record<string, unknown> }) => {
      const filters = Object.entries(where).map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`).join("&");
      const res = await restFetch(`/Profile?${filters}&limit=1`);
      return Array.isArray(res) && res.length > 0 ? (res[0] as Profile) : null;
    },
    findMany: async ({ where, select, orderBy }: { where?: Record<string, unknown>; select?: Record<string, boolean>; orderBy?: Record<string, string> } = {}) => {
      let path = "/Profile?";
      if (where) {
        const filters = Object.entries(where).map(([k, v]) => {
          if (v === null) return `${k}=is.null`;
          return `${k}=eq.${encodeURIComponent(String(v))}`;
        }).join("&");
        path += filters + "&";
      }
      if (select) {
        const cols = Object.keys(select).join(",");
        path += `select=${cols}&`;
      } else {
        path += "select=*&";
      }
      path += "order=role.asc,fullName.asc&limit=200";
      const res = await restFetch(path);
      return (res as Profile[]) || [];
    },
    create: async ({ data }: { data: Partial<Profile> }) => {
      const id = data.id || generateId();
      const payload = { ...data, id };
      const res = await restFetch("/Profile", {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      return Array.isArray(res) ? res[0] as Profile : res;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<Profile> }) => {
      const res = await restFetch(`/Profile?id=eq.${encodeURIComponent(where.id)}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ ...data, updatedAt: new Date().toISOString() }),
      });
      return Array.isArray(res) && res.length > 0 ? res[0] as Profile : null;
    },
  },

  department: {
    findMany: async ({ select, orderBy }: { select?: Record<string, boolean>; orderBy?: Record<string, string> } = {}) => {
      let path = "/Department?";
      if (select) {
        path += `select=${Object.keys(select).join(",")}&`;
      } else {
        path += "select=*&";
      }
      path += "order=name.asc";
      const res = await restFetch(path);
      return (res as Department[]) || [];
    },
    findUnique: async ({ where }: { where: { id?: string; name?: string } }) => {
      let path = "/Department?";
      if (where.id) path += `id=eq.${encodeURIComponent(where.id)}`;
      else if (where.name) path += `name=eq.${encodeURIComponent(where.name)}`;
      else return null;
      path += "&limit=1";
      const res = await restFetch(path);
      return Array.isArray(res) && res.length > 0 ? (res[0] as Department) : null;
    },
    create: async ({ data }: { data: Partial<Department> }) => {
      const id = data.id || generateId();
      const payload = { ...data, id, createdAt: new Date().toISOString() };
      const res = await restFetch("/Department", {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      return Array.isArray(res) ? res[0] as Department : res;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      await restFetch(`/Department?id=eq.${encodeURIComponent(where.id)}`, { method: "DELETE" });
      return null;
    },
    deleteMany: async ({ where }: { where: { id: string } }) => {
      await restFetch(`/Department?id=eq.${encodeURIComponent(where.id)}`, { method: "DELETE" });
      return { count: 1 };
    },
  },

  visitor: {
    findFirst: async ({ where }: { where: Record<string, unknown> }) => {
      const filters = Object.entries(where).map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`).join("&");
      const res = await restFetch(`/Visitor?${filters}&limit=1`);
      return Array.isArray(res) && res.length > 0 ? (res[0] as Visitor) : null;
    },
    count: async () => {
      const res = await fetch(`${BASE}/Visitor?select=id&limit=1`, {
        headers: { ...headers, Prefer: "count=exact" },
      });
      const range = res.headers.get("content-range");
      return range ? parseInt(range.split("/")[1], 10) || 0 : 0;
    },
    create: async ({ data }: { data: Partial<Visitor> }) => {
      const id = data.id || generateId();
      const now = new Date().toISOString();
      const payload = { ...data, id, createdAt: now, updatedAt: now };
      const res = await restFetch("/Visitor", {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      return Array.isArray(res) ? res[0] as Visitor : res;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<Visitor> }) => {
      const res = await restFetch(`/Visitor?id=eq.${encodeURIComponent(where.id)}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ ...data, updatedAt: new Date().toISOString() }),
      });
      return Array.isArray(res) && res.length > 0 ? res[0] as Visitor : null;
    },
    deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
      const filters = Object.entries(where).map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`).join("&");
      await restFetch(`/Visitor?${filters}`, { method: "DELETE" });
      return { count: 1 };
    },
  },

  visit: {
    count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      let path = "/Visit?select=id&limit=1";
      if (where) {
        for (const [k, v] of Object.entries(where)) {
          if (v === null) path += `&${k}=is.null`;
          else if (Array.isArray(v)) path += `&${k}=in.(${v.map(x => encodeURIComponent(String(x))).join(",")})`;
          else if (typeof v === "object" && v !== null && "gte" in v) {
            path += `&${k}=gte.${encodeURIComponent(String((v as Record<string, unknown>).gte))}`;
          } else if (typeof v === "object" && v !== null && "lt" in v) {
            path += `&${k}=lt.${encodeURIComponent(String((v as Record<string, unknown>).lt))}`;
          } else {
            path += `&${k}=eq.${encodeURIComponent(String(v))}`;
          }
        }
      }
      const res = await fetch(`${BASE}${path}`, {
        headers: { ...headers, Prefer: "count=exact" },
      });
      const range = res.headers.get("content-range");
      return range ? parseInt(range.split("/")[1], 10) || 0 : 0;
    },
    findUnique: async ({ where, include }: { where: { id?: string; referenceCode?: string }; include?: Record<string, boolean> }) => {
      let path = "/Visit?";
      if (where.id) path += `id=eq.${encodeURIComponent(where.id)}`;
      else if (where.referenceCode) path += `referenceCode=eq.${encodeURIComponent(where.referenceCode)}`;
      else return null;

      if (include?.visitor || include?.hostStaff || include?.documents || include?.feedback || include?.approvedBy || include?.exitConfirmedBy) {
        path = "/Visit?";
        const selects = ["*"];
        if (include.visitor) selects.push("visitor:Visitor(*)");
        if (include.hostStaff) selects.push("hostStaff:Profile!hostStaffId(id,fullName,email,department:Department(id,name))");
        if (include.registeredBy) selects.push("registeredBy:Profile!registeredById(id,fullName)");
        if (include.approvedBy) selects.push("approvedBy:Profile!approvedById(fullName)");
        if (include.exitConfirmedBy) selects.push("exitConfirmedBy:Profile!exitConfirmedById(fullName)");
        if (include.feedback) selects.push("feedback:Feedback(rating,comments)");
        if (include.documents) selects.push("documents:VisitorDocument(id,fileName,docType,filePath,mimeType)");
        path += `select=${selects.join(",")}&`;
        if (where.id) path += `id=eq.${encodeURIComponent(where.id)}&`;
        else if (where.referenceCode) path += `referenceCode=eq.${encodeURIComponent(where.referenceCode)}&`;
      } else {
        path += "select=*&";
      }
      path += "limit=1";
      const res = await restFetch(path);
      return Array.isArray(res) && res.length > 0 ? res[0] : null;
    },
    findMany: async ({ where, include, orderBy, take }: { where?: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string>; take?: number } = {}) => {
      let path = "/Visit?";
      const selects = ["*"];
      if (include?.visitor) selects.push("visitor:Visitor(id,fullName,icPassportNo,phone,email,company)");
      if (include?.hostStaff) selects.push("hostStaff:Profile!hostStaffId(id,fullName,department:Department(id,name))");
      if (include?.approvedBy) selects.push("approvedBy:Profile!approvedById(fullName)");
      if (include?.exitConfirmedBy) selects.push("exitConfirmedBy:Profile!exitConfirmedById(fullName)");
      if (include?.feedback) selects.push("feedback:Feedback(rating,comments)");
      if (include?.documents) selects.push("documents:VisitorDocument(id,fileName,docType,filePath,mimeType)");
      path += `select=${selects.join(",")}&`;

      if (where) {
        const filters: string[] = [];
        for (const [k, v] of Object.entries(where)) {
          if (v === null) filters.push(`${k}=is.null`);
          else if (Array.isArray(v)) filters.push(`${k}=in.(${v.map(x => encodeURIComponent(String(x))).join(",")})`);
          else if (typeof v === "object" && v !== null) {
            const cond = v as Record<string, unknown>;
            if ("contains" in cond) filters.push(`${k}=ilike.*${encodeURIComponent(String(cond.contains))}*`);
            else if ("gte" in cond) filters.push(`${k}=gte.${encodeURIComponent(String(cond.gte))}`);
            else if ("gt" in cond) filters.push(`${k}=gt.${encodeURIComponent(String(cond.gt))}`);
            else if ("lte" in cond) filters.push(`${k}=lte.${encodeURIComponent(String(cond.lte))}`);
            else if ("lt" in cond) filters.push(`${k}=lt.${encodeURIComponent(String(cond.lt))}`);
            else if ("not" in cond) {
              const notCond = cond.not;
              if (notCond === null) filters.push(`${k}=not.is.null`);
              else if (typeof notCond === "object" && notCond !== null && "in" in notCond) {
                const arr = (notCond as Record<string, unknown>).in as unknown[];
                filters.push(`${k}=notin.(${arr.map(x => encodeURIComponent(String(x))).join(",")})`);
              }
            }
          } else {
            filters.push(`${k}=eq.${encodeURIComponent(String(v))}`);
          }
        }
        if (filters.length > 0) path += filters.join("&") + "&";
      }

      // OR conditions (support both Prisma's OR and custom _or)
      const orKey = where && "OR" in where ? "OR" : where && "_or" in where ? "_or" : null;
      if (orKey) {
        const orArr = (where as Record<string, unknown>)[orKey] as Record<string, unknown>[];
        const orConds = orArr.map(orWhere => {
          return Object.entries(orWhere).map(([k, v]) => {
            // Handle nested relation filters like { visitor: { fullName: { contains: "..." } } }
            if (typeof v === "object" && v !== null && !Array.isArray(v)) {
              const nested = v as Record<string, unknown>;
              // Check if it's a relation filter (has nested object with contains)
              for (const [nk, nv] of Object.entries(nested)) {
                if (typeof nv === "object" && nv !== null && "contains" in nv) {
                  return `${k}.${nk}.ilike.%${encodeURIComponent(String((nv as Record<string, unknown>).contains))}%`;
                }
              }
              // Check for direct contains
              if ("contains" in nested) {
                return `${k}.ilike.%${encodeURIComponent(String(nested.contains))}%`;
              }
            }
            return `${k}.eq.${encodeURIComponent(String(v))}`;
          }).join(",");
        }).join(",");
        if (orConds) path += `or=(${orConds})&`;
      }

      path += `order=${Object.entries(orderBy || { createdAt: "desc" }).map(([k, v]) => `${k}.${v}`).join(",")}&`;
      path += `limit=${take || 200}`;
      const res = await restFetch(path);
      return (res as Visit[]) || [];
    },
    create: async ({ data, include }: { data: Partial<Visit>; include?: Record<string, boolean> }) => {
      const id = data.id || generateId();
      const now = new Date().toISOString();
      const payload = { ...data, id, createdAt: now, updatedAt: now };
      const res = await restFetch("/Visit", {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      return Array.isArray(res) ? res[0] : res;
    },
    update: async ({ where, data, include }: { where: { id: string }; data: Partial<Visit>; include?: Record<string, boolean> }) => {
      const res = await restFetch(`/Visit?id=eq.${encodeURIComponent(where.id)}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ ...data, updatedAt: new Date().toISOString() }),
      });
      return Array.isArray(res) && res.length > 0 ? res[0] : null;
    },
  },

  visitorDocument: {
    create: async ({ data }: { data: Partial<VisitorDocument> }) => {
      const id = data.id || generateId();
      const payload = { ...data, id, uploadedAt: new Date().toISOString() };
      const res = await restFetch("/VisitorDocument", {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      return Array.isArray(res) ? res[0] as VisitorDocument : res;
    },
    deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
      const filters = Object.entries(where).map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`).join("&");
      await restFetch(`/VisitorDocument?${filters}`, { method: "DELETE" });
      return { count: 1 };
    },
  },

  feedback: {
    findUnique: async ({ where }: { where: { visitId: string } }) => {
      const res = await restFetch(`/Feedback?visitId=eq.${encodeURIComponent(where.visitId)}&limit=1`);
      return Array.isArray(res) && res.length > 0 ? (res[0] as Feedback) : null;
    },
    findMany: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      let path = "/Feedback?select=*";
      if (where) {
        for (const [k, v] of Object.entries(where)) {
          path += `&${k}=eq.${encodeURIComponent(String(v))}`;
        }
      }
      path += "&order=submittedAt.desc&limit=200";
      const res = await restFetch(path);
      return (res as Feedback[]) || [];
    },
    count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      let path = "/Feedback?select=id&limit=1";
      if (where) {
        for (const [k, v] of Object.entries(where)) {
          path += `&${k}=eq.${encodeURIComponent(String(v))}`;
        }
      }
      const res = await fetch(`${BASE}${path}`, {
        headers: { ...headers, Prefer: "count=exact" },
      });
      const range = res.headers.get("content-range");
      return range ? parseInt(range.split("/")[1], 10) || 0 : 0;
    },
    aggregate: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      // Fetch all feedback and compute aggregate in JS
      let path = "/Feedback?select=rating";
      if (where) {
        for (const [k, v] of Object.entries(where)) {
          path += `&${k}=eq.${encodeURIComponent(String(v))}`;
        }
      }
      path += "&limit=1000";
      const res = await restFetch(path);
      const list = (res as Feedback[]) || [];
      const avg = list.length > 0 ? list.reduce((s, f) => s + f.rating, 0) / list.length : 0;
      return { _avg: { rating: avg }, _count: list.length };
    },
    create: async ({ data }: { data: Partial<Feedback> }) => {
      const id = data.id || generateId();
      const payload = { ...data, id, submittedAt: new Date().toISOString() };
      const res = await restFetch("/Feedback", {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      return Array.isArray(res) ? res[0] as Feedback : res;
    },
  },

  auditLog: {
    create: async ({ data }: { data: Partial<AuditLog> }) => {
      const id = data.id || generateId();
      const payload = { ...data, id, createdAt: new Date().toISOString() };
      const res = await restFetch("/AuditLog", {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(payload),
      });
      return res;
    },
    findMany: async ({ where, include, orderBy, take, skip }: { where?: Record<string, unknown>; include?: Record<string, boolean>; orderBy?: Record<string, string>; take?: number; skip?: number } = {}) => {
      let path = "/AuditLog?";
      const selects = ["*"];
      if (include?.actor) selects.push("actor:Profile(fullName,email,role)");
      if (include?.visit) selects.push("visit:Visit(referenceCode,visitor:Visitor(fullName))");
      path += `select=${selects.join(",")}&`;

      if (where) {
        const filters: string[] = [];
        for (const [k, v] of Object.entries(where)) {
          if (v === null) filters.push(`${k}=is.null`);
          else if (typeof v === "object" && v !== null && "notIn" in v) {
            const arr = (v as { notIn: string[] }).notIn;
            filters.push(`${k}=notin.(${arr.map(x => encodeURIComponent(String(x))).join(",")})`);
          } else {
            filters.push(`${k}=eq.${encodeURIComponent(String(v))}`);
          }
        }
        if (filters.length > 0) path += filters.join("&") + "&";
      }

      path += `order=${Object.entries(orderBy || { createdAt: "desc" }).map(([k, v]) => `${k}.${v}`).join(",")}&`;
      const limit = take || 50;
      const offset = skip || 0;
      path += `limit=${limit}&offset=${offset}`;

      const res = await restFetch(path, { headers: { ...headers, Prefer: "count=exact" } });
      return (res as AuditLog[]) || [];
    },
    count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      let path = "/AuditLog?select=id&limit=1";
      if (where) {
        for (const [k, v] of Object.entries(where)) {
          if (v === null) path += `&${k}=is.null`;
          else path += `&${k}=eq.${encodeURIComponent(String(v))}`;
        }
      }
      const res = await fetch(`${BASE}${path}`, {
        headers: { ...headers, Prefer: "count=exact" },
      });
      const range = res.headers.get("content-range");
      if (range) {
        const total = range.split("/")[1];
        return parseInt(total, 10) || 0;
      }
      return 0;
    },
    deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
      const filters = Object.entries(where).map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`).join("&");
      await restFetch(`/AuditLog?${filters}`, { method: "DELETE" });
      return { count: 1 };
    },
  },

  notification: {
    create: async ({ data }: { data: Partial<Notification> }) => {
      const id = data.id || generateId();
      const payload = { ...data, id, sentAt: new Date().toISOString() };
      const res = await restFetch("/Notification", {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(payload),
      });
      return Array.isArray(res) ? res[0] as Notification : res;
    },
    count: async ({ where }: { where?: Record<string, unknown> } = {}) => {
      let path = "/Notification?select=id&limit=1";
      if (where) {
        for (const [k, v] of Object.entries(where)) {
          path += `&${k}=eq.${encodeURIComponent(String(v))}`;
        }
      }
      const res = await fetch(`${BASE}${path}`, {
        headers: { ...headers, Prefer: "count=exact" },
      });
      const range = res.headers.get("content-range");
      if (range) {
        const total = range.split("/")[1];
        return parseInt(total, 10) || 0;
      }
      return 0;
    },
    deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
      const filters = Object.entries(where).map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`).join("&");
      await restFetch(`/Notification?${filters}`, { method: "DELETE" });
      return { count: 1 };
    },
  },

  systemSetting: {
    findMany: async () => {
      const res = await restFetch("/SystemSetting?select=*&order=key.asc");
      return (res as SystemSetting[]) || [];
    },
    upsert: async ({ where, update, create }: { where: { key: string }; update: Partial<SystemSetting>; create: Partial<SystemSetting> }) => {
      // Try update first
      const existing = await restFetch(`/SystemSetting?key=eq.${encodeURIComponent(where.key)}&limit=1`);
      if (Array.isArray(existing) && existing.length > 0) {
        const res = await restFetch(`/SystemSetting?key=eq.${encodeURIComponent(where.key)}`, {
          method: "PATCH",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify(update),
        });
        return Array.isArray(res) ? res[0] : res;
      } else {
        const id = create.id || generateId();
        const payload = { ...create, ...update, id };
        const res = await restFetch("/SystemSetting", {
          method: "POST",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify(payload),
        });
        return Array.isArray(res) ? res[0] : res;
      }
    },
  },

  // Raw query helper for complex aggregations
  rpc: async (fn: string, params: Record<string, unknown>) => {
    const res = await restFetch(`/rpc/${fn}`, {
      method: "POST",
      body: JSON.stringify(params),
    });
    return res;
  },

  // Count helper for any table
  count: async (table: string, where?: Record<string, unknown>) => {
    let path = `/${table}?select=id&limit=1`;
    if (where) {
      for (const [k, v] of Object.entries(where)) {
        if (v === null) path += `&${k}=is.null`;
        else if (Array.isArray(v)) path += `&${k}=in.(${v.map(x => encodeURIComponent(String(x))).join(",")})`;
        else path += `&${k}=eq.${encodeURIComponent(String(v))}`;
      }
    }
    const res = await fetch(`${BASE}${path}`, {
      headers: { ...headers, Prefer: "count=exact" },
    });
    const range = res.headers.get("content-range");
    if (range) {
      const total = range.split("/")[1];
      return parseInt(total, 10) || 0;
    }
    return 0;
  },
};

// Generate a unique ID (cuid-like)
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${timestamp}-${random}`;
}
