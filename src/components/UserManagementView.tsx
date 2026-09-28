import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  UserCheck, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Building2, 
  Mail, 
  Phone, 
  CreditCard, 
  Key, 
  Lock, 
  Filter, 
  ArrowUpDown, 
  UserX, 
  LogIn, 
  GraduationCap, 
  Briefcase, 
  DollarSign, 
  Award, 
  Layers, 
  X, 
  AlertCircle 
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface UserManagementViewProps {
  users: UserProfile[];
  currentLoggedInUser: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onCreateUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser: (user: UserProfile) => void;
  onShowAlert?: (msg: string) => void;
}

const ROLE_CONFIG: Record<UserRole, { label: string; badgeClass: string; icon: React.ElementType; desc: string }> = {
  researcher: {
    label: 'นักวิจัย',
    badgeClass: 'bg-amber-500/10 text-amber-700 border-amber-300 dark:border-amber-700 dark:text-amber-400',
    icon: GraduationCap,
    desc: 'ยื่นคำขอรับรางวัล, ติดตามสถานะ, ดาวน์โหลดเอกสารและใบรับรอง',
  },
  coordinator: {
    label: 'เจ้าหน้าที่วิจัย',
    badgeClass: 'bg-blue-500/10 text-blue-700 border-blue-300 dark:border-blue-700 dark:text-blue-400',
    icon: Briefcase,
    desc: 'ตรวจสอบความถูกต้อง, สรุปข้อมูลเสนอผู้บริหาร, ออกเลขบันทึกข้อความ',
  },
  finance: {
    label: 'งานการเงิน',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:border-emerald-700 dark:text-emerald-400',
    icon: DollarSign,
    desc: 'บันทึกเลขที่ฎีกา, วันที่โอนเงิน, และหลักฐานการโอนเงิน (Transfer Slip)',
  },
  executive: {
    label: 'ผู้บริหาร',
    badgeClass: 'bg-indigo-500/10 text-indigo-700 border-indigo-300 dark:border-indigo-700 dark:text-indigo-400',
    icon: Award,
    desc: 'พิจารณาให้ความเห็นชอบและอนุมัติการเบิกจ่ายเงินรางวัลในระดับคณะ',
  },
  admin: {
    label: 'ผู้ดูแลระบบ',
    badgeClass: 'bg-purple-500/10 text-purple-700 border-purple-300 dark:border-purple-700 dark:text-purple-400',
    icon: ShieldCheck,
    desc: 'สิทธิ์สูงสุดในการบริหารจัดการบัญชี กำหนดบทบาท และตรวจสอบระบบทุกขั้นตอน',
  },
};

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentLoggedInUser,
  onUpdateUser,
  onCreateUser,
  onDeleteUser,
  onSwitchUser,
  onShowAlert,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [maskSensitiveData, setMaskSensitiveData] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Delete Confirm State
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    academicPosition: 'อาจารย์ ดร.',
    administrativePosition: '',
    department: 'สถานวิทยาศาสตร์คลินิก',
    phone: '',
    email: '',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '',
    idCardNo: '',
    role: 'researcher',
    roles: ['researcher'],
    isNuAccount: true,
    status: 'active',
  });

  // Extract unique departments for filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department) {
        set.add(u.department.trim());
      }
    });
    return Array.from(set).sort();
  }, [users]);

  // Role summary stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      researcher: users.filter((u) => u.role === 'researcher' || u.roles?.includes('researcher')).length,
      coordinator: users.filter((u) => u.role === 'coordinator' || u.roles?.includes('coordinator')).length,
      finance: users.filter((u) => u.role === 'finance' || u.roles?.includes('finance')).length,
      executive: users.filter((u) => u.role === 'executive' || u.roles?.includes('executive')).length,
      admin: users.filter((u) => u.role === 'admin' || u.roles?.includes('admin')).length,
    };
  }, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Role filter
      if (roleFilter !== 'all') {
        const matchesPrimary = user.role === roleFilter;
        const matchesSecondary = user.roles?.includes(roleFilter as UserRole);
        if (!matchesPrimary && !matchesSecondary) return false;
      }

      // Department filter
      if (departmentFilter !== 'all' && user.department !== departmentFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const userStatus = user.status || 'active';
        if (userStatus !== statusFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = user.name?.toLowerCase().includes(q);
        const matchesEmail = user.email?.toLowerCase().includes(q);
        const matchesDept = user.department?.toLowerCase().includes(q);
        const matchesAca = user.academicPosition?.toLowerCase().includes(q);
        const matchesAdmin = user.administrativePosition?.toLowerCase().includes(q);
        const matchesBank = user.bankAccountNo?.replace(/-/g, '').includes(q.replace(/-/g, ''));
        const matchesIdCard = user.idCardNo?.replace(/-/g, '').includes(q.replace(/-/g, ''));
        if (!matchesName && !matchesEmail && !matchesDept && !matchesAca && !matchesAdmin && !matchesBank && !matchesIdCard) {
          return false;
        }
      }

      return true;
    });
  }, [users, roleFilter, departmentFilter, statusFilter, searchQuery]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      academicPosition: 'อาจารย์ ดร.',
      administrativePosition: '',
      department: departments[0] || 'สถานวิทยาศาสตร์คลินิก',
      phone: '55',
      email: '',
      bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
      bankAccountNo: '',
      idCardNo: '',
      role: 'researcher',
      roles: ['researcher'],
      isNuAccount: true,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      ...user,
      roles: user.roles && user.roles.length > 0 ? user.roles : [user.role],
    });
    setIsModalOpen(true);
  };

  // Submit Modal Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.department?.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุล, อีเมล, และภาควิชาให้ครบถ้วน');
      return;
    }

    const payload: UserProfile = {
      id: editingUser ? editingUser.id : (formData.id || `user-${Date.now()}`),
      name: formData.name.trim(),
      academicPosition: formData.academicPosition?.trim() || 'อาจารย์',
      administrativePosition: formData.administrativePosition?.trim() || undefined,
      department: formData.department.trim(),
      phone: formData.phone?.trim() || '',
      email: formData.email.trim().toLowerCase(),
      bankName: formData.bankName || 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
      bankAccountNo: formData.bankAccountNo?.trim() || '',
      idCardNo: formData.idCardNo?.trim() || '',
      role: formData.role || 'researcher',
      roles: formData.roles && formData.roles.length > 0 ? formData.roles : [formData.role || 'researcher'],
      isNuAccount: formData.email.trim().toLowerCase().endsWith('@nu.ac.th'),
      status: formData.status || 'active',
      createdAt: editingUser?.createdAt || formData.createdAt || new Date().toISOString().split('T')[0],
      lastLoginAt: editingUser?.lastLoginAt,
    };

    if (editingUser) {
      onUpdateUser(payload);
    } else {
      onCreateUser(payload);
    }
    setIsModalOpen(false);
  };

  // Quick Role Change from Table Dropdown
  const handleQuickRoleChange = (user: UserProfile, newRole: UserRole) => {
    const updatedRoles = Array.from(new Set([newRole, ...(user.roles || [])]));
    const updated: UserProfile = {
      ...user,
      role: newRole,
      roles: updatedRoles,
    };
    onUpdateUser(updated);
    if (onShowAlert) {
      onShowAlert(`เปลี่ยนบทบาทของ ${user.name} เป็น "${ROLE_CONFIG[newRole].label}" เรียบร้อยแล้ว`);
    }
  };

  // Quick Status Toggle (Active / Suspended)
  const handleToggleStatus = (user: UserProfile) => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    const updated: UserProfile = {
      ...user,
      status: nextStatus,
    };
    onUpdateUser(updated);
    if (onShowAlert) {
      onShowAlert(`เปลี่ยนสถานะของ ${user.name} เป็น ${nextStatus === 'active' ? 'เปิดใช้งาน' : 'ระงับชั่วคราว'} เรียบร้อยแล้ว`);
    }
  };

  // Delete User Confirmation
  const handleConfirmDelete = () => {
    if (!deleteConfirmUser) return;
    onDeleteUser(deleteConfirmUser.id);
    setDeleteConfirmUser(null);
  };

  // Masking helpers for PDPA
  const maskBankAccount = (acc: string) => {
    if (!maskSensitiveData || !acc) return acc || '-';
    // e.g. 346-1-00333-8 -> 346-x-xx333-x
    const clean = acc.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      return `${clean.slice(0, 3)}-X-XX${clean.slice(6, 9)}-${clean.slice(9)}`;
    }
    return acc.slice(0, 4) + '******' + acc.slice(-2);
  };

  const maskCitizenId = (id: string) => {
    if (!maskSensitiveData || !id) return id || '-';
    // e.g. 1-6500-00333-33-7 -> 1-XXXX-XXXXX-33-7
    const clean = id.replace(/[^0-9]/g, '');
    if (clean.length === 13) {
      return `${clean.slice(0, 1)}-XXXX-XXXXX-${clean.slice(10, 12)}-${clean.slice(12)}`;
    }
    return id.slice(0, 3) + '********' + id.slice(-2);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / System Title */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-800/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-inner">
              <Users className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Admin Console
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  PDPA Compliant (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562)
                </span>
              </div>
              <h2 className="text-2xl font-bold font-prompt text-white tracking-tight mt-1">
                ระบบจัดการผู้ใช้งานและสิทธิ์เข้าถึง (User Management Console)
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                ศูนย์กลางควบคุมบัญชีผู้ใช้งาน สิทธิ์การเข้าถึงข้อมูลทั้ง 5 บทบาทในระบบเงินรางวัล คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
                พร้อมระบบสลับมุมมองทดสอบ (Impersonation) และการคุ้มครองข้อมูลส่วนบุคคล
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMaskSensitiveData(!maskSensitiveData)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                maskSensitiveData
                  ? 'bg-slate-800/90 text-emerald-400 border-emerald-500/40 hover:bg-slate-800'
                  : 'bg-amber-950/50 text-amber-300 border-amber-500/50 hover:bg-amber-900/50'
              }`}
              title="สลับการซ่อน/แสดงข้อมูลอ่อนไหวตามเกณฑ์ PDPA (เลขบัญชี, เลขบัตร ปชช.)"
            >
              {maskSensitiveData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{maskSensitiveData ? 'PDPA: ปิดบังข้อมูลอ่อนไหว' : 'PDPA: แสดงข้อมูลจริง'}</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition-all transform active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มผู้ใช้งานใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Users */}
        <div 
          onClick={() => setRoleFilter('all')}
          className={`cursor-pointer bg-white rounded-xl p-4 border transition-all hover:shadow-md ${
            roleFilter === 'all' ? 'ring-2 ring-purple-500 border-purple-500 shadow-sm' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">ผู้ใช้งานทั้งหมด</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-slate-700" />
            </div>
          </div>
          <div className="text-2xl font-bold font-prompt text-slate-900 mt-2">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">รวมทุกบัญชีในระบบ</div>
        </div>

        {/* Researchers */}
        <div 
          onClick={() => setRoleFilter('researcher')}
          className={`cursor-pointer bg-white rounded-xl p-4 border transition-all hover:shadow-md ${
            roleFilter === 'researcher' ? 'ring-2 ring-amber-500 border-amber-500 shadow-sm' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">นักวิจัย</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold font-prompt text-amber-800 mt-2">{stats.researcher}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">ผู้ขอรับรางวัล</div>
        </div>

        {/* Coordinators */}
        <div 
          onClick={() => setRoleFilter('coordinator')}
          className={`cursor-pointer bg-white rounded-xl p-4 border transition-all hover:shadow-md ${
            roleFilter === 'coordinator' ? 'ring-2 ring-blue-500 border-blue-500 shadow-sm' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-700">เจ้าหน้าที่วิจัย</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold font-prompt text-blue-800 mt-2">{stats.coordinator}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">ผู้ประสานงาน/ตรวจเอกสาร</div>
        </div>

        {/* Finance */}
        <div 
          onClick={() => setRoleFilter('finance')}
          className={`cursor-pointer bg-white rounded-xl p-4 border transition-all hover:shadow-md ${
            roleFilter === 'finance' ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-sm' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">งานการเงิน</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold font-prompt text-emerald-800 mt-2">{stats.finance}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">เบิกจ่าย/โอนเงิน</div>
        </div>

        {/* Executive */}
        <div 
          onClick={() => setRoleFilter('executive')}
          className={`cursor-pointer bg-white rounded-xl p-4 border transition-all hover:shadow-md ${
            roleFilter === 'executive' ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-sm' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700">ผู้บริหาร</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="text-2xl font-bold font-prompt text-indigo-800 mt-2">{stats.executive}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">พิจารณา/อนุมัติ</div>
        </div>

        {/* Admin */}
        <div 
          onClick={() => setRoleFilter('admin')}
          className={`cursor-pointer bg-white rounded-xl p-4 border transition-all hover:shadow-md ${
            roleFilter === 'admin' ? 'ring-2 ring-purple-500 border-purple-500 shadow-sm' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-700">ผู้ดูแลระบบ</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold font-prompt text-purple-800 mt-2">{stats.admin}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">สิทธิ์เต็มทุกระบบ</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, อีเมล, ภาควิชา, เลขบัญชี..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>บทบาท:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            >
              <option value="all">ทุกบทบาท ({stats.total})</option>
              <option value="researcher">นักวิจัย ({stats.researcher})</option>
              <option value="coordinator">เจ้าหน้าที่วิจัย ({stats.coordinator})</option>
              <option value="finance">งานการเงิน ({stats.finance})</option>
              <option value="executive">ผู้บริหาร ({stats.executive})</option>
              <option value="admin">ผู้ดูแลระบบ ({stats.admin})</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>ภาควิชา:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/40 max-w-[200px] truncate"
            >
              <option value="all">ทุกภาควิชา/หน่วยงาน</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>สถานะ:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">เปิดใช้งาน (Active)</option>
              <option value="suspended">ระงับชั่วคราว (Suspended)</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(roleFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setRoleFilter('all');
                setDepartmentFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 font-prompt text-sm">
              รายชื่อผู้ใช้งานในระบบ ({filteredUsers.length} คน)
            </h3>
            {filteredUsers.length !== users.length && (
              <span className="text-xs text-slate-500">
                (กรองจากทั้งหมด {users.length} คน)
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>เข้าสู่ระบบปัจจุบัน: <strong className="text-slate-800">{currentLoggedInUser.name}</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">ผู้ใช้งาน / ข้อมูลส่วนบุคคล</th>
                <th className="py-3 px-4">ตำแหน่ง & ภาควิชา</th>
                <th className="py-3 px-4">บทบาทหลัก (Role)</th>
                <th className="py-3 px-4">สิทธิ์เพิ่มเติม</th>
                <th className="py-3 px-4">ข้อมูลการเงิน (PDPA)</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserX className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">ไม่พบผู้ใช้งานตามเงื่อนไขที่ค้นหา</p>
                    <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const RoleIcon = ROLE_CONFIG[user.role]?.icon || Users;
                  const isCurrent = currentLoggedInUser.id === user.id || currentLoggedInUser.email.toLowerCase() === user.email.toLowerCase();
                  const isSuspended = user.status === 'suspended';

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-purple-50/30 transition-colors ${
                        isCurrent ? 'bg-purple-50/40' : isSuspended ? 'bg-slate-50/80 opacity-75' : ''
                      }`}
                    >
                      {/* Name & Account */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700 border-purple-300'
                              : user.role === 'executive'
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                              : user.role === 'finance'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                              : user.role === 'coordinator'
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : 'bg-amber-100 text-amber-700 border-amber-300'
                          }`}>
                            {user.name ? user.name.charAt(user.name.indexOf(' ') > 0 ? user.name.indexOf(' ') + 1 : 0) : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-sm hover:text-purple-700 transition-colors">
                                {user.name}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                                  คุณ (Active)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-slate-500">
                              <span className="font-mono text-[11px] text-slate-600 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {user.email}
                              </span>
                              {user.isNuAccount && (
                                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                                  NU SSO
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position & Department */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {user.academicPosition || '-'}
                        </div>
                        {user.administrativePosition && (
                          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
                            {user.administrativePosition}
                          </div>
                        )}
                        <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]" title={user.department}>
                            {user.department || '-'}
                          </span>
                        </div>
                      </td>

                      {/* Role Quick Selector */}
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block">
                          <select
                            value={user.role}
                            onChange={(e) => handleQuickRoleChange(user, e.target.value as UserRole)}
                            className={`text-xs font-semibold py-1 pl-2 pr-6 rounded-lg border appearance-none focus:outline-none focus:ring-2 cursor-pointer transition-all ${
                              ROLE_CONFIG[user.role]?.badgeClass || 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                            title="คลิกเพื่อเปลี่ยนบทบาทหลักได้ทันที"
                          >
                            <option value="researcher">นักวิจัย (Researcher)</option>
                            <option value="coordinator">เจ้าหน้าที่วิจัย (Coordinator)</option>
                            <option value="finance">งานการเงิน (Finance)</option>
                            <option value="executive">ผู้บริหาร (Executive)</option>
                            <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-500">
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </div>
                      </td>

                      {/* Secondary Roles */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((r) => (
                              <span
                                key={r}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                  r === user.role
                                    ? 'bg-slate-200 text-slate-800 border-slate-300 font-bold'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {ROLE_CONFIG[r]?.label || r}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </div>
                      </td>

                      {/* Finance & PDPA Data */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-mono text-slate-800 text-[11px] flex items-center gap-1.5">
                            <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{maskBankAccount(user.bankAccountNo)}</span>
                          </div>
                          <div className="font-mono text-slate-500 text-[10px] flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>บัตร: {maskCitizenId(user.idCardNo)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            user.status === 'suspended'
                              ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          }`}
                          title="คลิกเพื่อสลับสถานะ เปิดใช้งาน/ระงับ"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'suspended' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <span>{user.status === 'suspended' ? 'ระงับชั่วคราว' : 'เปิดใช้งาน'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Impersonate / Switch User Button */}
                          <button
                            onClick={() => onSwitchUser(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-100 transition-colors"
                            title={`จำลองสลับเข้าใช้งานบัญชีนี้ (${user.name})`}
                          >
                            <LogIn className="w-4 h-4" />
                          </button>

                          {/* Edit User Button */}
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-100 transition-colors"
                            title="แก้ไขข้อมูลผู้ใช้"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button (disabled for logged-in user) */}
                          <button
                            onClick={() => setDeleteConfirmUser(user)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-100'
                            }`}
                            title={isCurrent ? 'ไม่สามารถลบบัญชีที่กำลังล็อกอินอยู่ได้' : 'ลบบัญชีผู้ใช้'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-purple-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-prompt">
                    {editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่เข้าสู่ระบบ'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    บันทึกข้อมูลประจำตัว สิทธิ์บทบาท และข้อมูลบัญชีธนาคารตามเกณฑ์ PDPA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    คำนำหน้า และชื่อ-นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น รองศาสตราจารย์ ดร.สมชาย ใจดี"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
                  />
                </div>

                {/* Academic Position */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ตำแหน่งทางวิชาการ / ตำแหน่งงาน
                  </label>
                  <input
                    type="text"
                    value={formData.academicPosition || ''}
                    onChange={(e) => setFormData({ ...formData, academicPosition: e.target.value })}
                    placeholder="เช่น ผู้ช่วยศาสตราจารย์, อาจารย์ ดร., เจ้าหน้าที่วิจัย"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
                  />
                </div>

                {/* Administrative Position */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ตำแหน่งบริหาร (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={formData.administrativePosition || ''}
                    onChange={(e) => setFormData({ ...formData, administrativePosition: e.target.value })}
                    placeholder="เช่น รองคณบดีฝ่ายวิจัยฯ, หัวหน้าภาควิชา..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ภาควิชา / หน่วยงานสังกัด <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="เช่น สถานวิทยาศาสตร์คลินิก, ภาควิชาอายุรศาสตร์"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ภายใน / มือถือ
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="เช่น 5502 หรือ 081-xxx-xxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500"
                  />
                </div>

                {/* Email (NU Account) */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    อีเมลมหาวิทยาลัย (NU Account) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="เช่น somchai@nu.ac.th"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    ใช้สำหรับเข้าสู่ระบบผ่าน SSO และส่งหนังสือแจ้งเตือนสถานะคำขอ
                  </p>
                </div>

                {/* Primary Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    บทบาทหลัก (Primary Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role || 'researcher'}
                    onChange={(e) => {
                      const newR = e.target.value as UserRole;
                      const nextRoles = Array.from(new Set([newR, ...(formData.roles || [])]));
                      setFormData({ ...formData, role: newR, roles: nextRoles });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 font-medium"
                  >
                    <option value="researcher">นักวิจัย (Researcher - ยื่นคำขอ)</option>
                    <option value="coordinator">เจ้าหน้าที่วิจัย (Coordinator - ตรวจสอบ)</option>
                    <option value="finance">งานการเงิน (Finance - เบิกจ่าย)</option>
                    <option value="executive">ผู้บริหาร (Executive - อนุมัติ)</option>
                    <option value="admin">ผู้ดูแลระบบ (Admin - จัดการระบบ)</option>
                  </select>
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    สถานะการใช้งาน
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'suspended' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 font-medium"
                  >
                    <option value="active">เปิดใช้งาน (Active)</option>
                    <option value="suspended">ระงับชั่วคราว (Suspended)</option>
                  </select>
                </div>

                {/* Additional Roles Multi-select Checkboxes */}
                <div className="md:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    สิทธิ์เพิ่มเติม (Additional Roles)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {(['researcher', 'coordinator', 'finance', 'executive', 'admin'] as UserRole[]).map((r) => {
                      const isChecked = formData.roles?.includes(r) ?? false;
                      const isPrimary = formData.role === r;
                      return (
                        <label 
                          key={r} 
                          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer select-none transition-all ${
                            isChecked 
                              ? 'bg-purple-50 border-purple-300 text-purple-800 font-medium' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={isPrimary}
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, roles: [...(formData.roles || []), r] });
                              } else {
                                setFormData({
                                  ...formData,
                                  roles: (formData.roles || []).filter((item) => item !== r),
                                });
                              }
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span>{ROLE_CONFIG[r].label}</span>
                          {isPrimary && <span className="text-[10px] text-purple-600 font-semibold">(หลัก)</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Bank Account */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขที่บัญชีธนาคารกรุงศรีอยุธยา (10 หลัก)
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNo || ''}
                    onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                    placeholder="เช่น 346-1-xxxxx-x"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 font-mono"
                  />
                </div>

                {/* Citizen ID */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขประจำตัวประชาชน (13 หลัก)
                  </label>
                  <input
                    type="text"
                    value={formData.idCardNo || ''}
                    onChange={(e) => setFormData({ ...formData, idCardNo: e.target.value })}
                    placeholder="เช่น 1-6500-xxxxx-xx-x"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 transition-all"
                >
                  {editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-prompt">
                  ยืนยันการลบบัญชีผู้ใช้งาน?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  คุณต้องการลบบัญชี <strong>{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email}) ออกจากระบบหรือไม่?
                  การดำเนินการนี้จะลบข้อมูลบัญชีออกจากทะเบียน แต่ข้อมูลคำขอรับรางวัลที่เคยยื่นไว้จะไม่ได้รับผลกระทบ
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
