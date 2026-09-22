/**
 * Department and Saraban Division Codes for Faculty of Medicine, Naresuan University
 * รหัสสารบรรณและโครงสร้างหน่วยงาน คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร (อว 0603.10.xx)
 */

export interface DepartmentInfo {
  code: string;       // รหัส 2 หลัก เช่น '10', '14', '02'
  name: string;       // ชื่อภาควิชา/หน่วยงาน
  hrCode?: string;    // รหัส HR/SMU
}

export const DEPARTMENT_LIST: DepartmentInfo[] = [
  { code: '10', name: 'งานวิจัย / หน่วยบริหารงานวิจัย', hrCode: '109000' },
  { code: '14', name: 'สถานวิทยาศาสตร์คลินิก', hrCode: 'สถานวิทยาศาสตร์คลินิก' },
  { code: '01', name: 'ภาควิชาอายุรศาสตร์', hrCode: '211000' },
  { code: '02', name: 'ภาควิชาศัลยศาสตร์', hrCode: '208000' },
  { code: '03', name: 'ภาควิชากุมารเวชศาสตร์', hrCode: '201000' },
  { code: '04', name: 'ภาควิชาสูติศาสตร์ - นรีเวชวิทยา', hrCode: '209000' },
  { code: '05', name: 'ภาควิชาออร์โธปิดิกส์', hrCode: '210000' },
  { code: '06', name: 'ภาควิชาจักษุวิทยา', hrCode: '202000' },
  { code: '07', name: 'ภาควิชาโสต ศอ นาสิกวิทยา', hrCode: '213000' },
  { code: '08', name: 'ภาควิชาจิตเวชศาสตร์', hrCode: '203000' },
  { code: '09', name: 'ภาควิชารังสีวิทยา', hrCode: '205000' },
  { code: '11', name: 'ภาควิชาวิสัญญีวิทยา', hrCode: '206000' },
  { code: '12', name: 'ภาควิชาพยาธิวิทยา', hrCode: '204000' },
  { code: '13', name: 'ภาควิชาเวชศาสตร์ครอบครัว', hrCode: '215000' },
  { code: '15', name: 'ภาควิชาเวชศาสตร์ชุมชน', hrCode: '207000' },
  { code: '16', name: 'ภาควิชาเวชศาสตร์ฟื้นฟู', hrCode: '212000' },
  { code: '17', name: 'ภาควิชานิติเวชศาสตร์', hrCode: '214000' },
  { code: '18', name: 'ภาควิชากายวิภาคศาสตร์' },
  { code: '19', name: 'ภาควิชาสรีรวิทยา' },
  { code: '20', name: 'ภาควิชาชีวเคมี' },
  { code: '21', name: 'ภาควิชาเภสัชวิทยา' },
  { code: '22', name: 'ภาควิชาจุลชีววิทยาและปรสิตวิทยา' },
  { code: '23', name: 'ศูนย์วิจัยโลหิตวิทยา', hrCode: '602000' },
];

/**
 * ค้นหารหัสหน่วยงาน (10.xx) จากชื่อภาควิชาหรือสังกัดของผู้ใช้งาน
 */
export function getDepartmentCode(departmentName?: string): string {
  if (!departmentName) return '10';
  const cleanName = departmentName.trim().toLowerCase();

  if (cleanName.includes('สถานวิทยาศาสตร์คลินิก') || cleanName.includes('คลินิก')) return '14';
  if (cleanName.includes('วิจัย')) return '10';
  if (cleanName.includes('อายุรศาสตร์')) return '01';
  if (cleanName.includes('ศัลยศาสตร์') && !cleanName.includes('ออร์โธ')) return '02';
  if (cleanName.includes('กุมาร')) return '03';
  if (cleanName.includes('สูติ') || cleanName.includes('นรีเวช')) return '04';
  if (cleanName.includes('ออร์โธ')) return '05';
  if (cleanName.includes('จักษุ')) return '06';
  if (cleanName.includes('โสต') || cleanName.includes('นาสิก')) return '07';
  if (cleanName.includes('จิตเวช')) return '08';
  if (cleanName.includes('รังสี')) return '09';
  if (cleanName.includes('วิสัญญี')) return '11';
  if (cleanName.includes('พยาธิ')) return '12';
  if (cleanName.includes('ครอบครัว')) return '13';
  if (cleanName.includes('ชุมชน')) return '15';
  if (cleanName.includes('ฟื้นฟู')) return '16';
  if (cleanName.includes('นิติเวช')) return '17';
  if (cleanName.includes('กายวิภาค')) return '18';
  if (cleanName.includes('สรีร')) return '19';
  if (cleanName.includes('ชีวเคมี')) return '20';
  if (cleanName.includes('เภสัช')) return '21';
  if (cleanName.includes('จุลชีว')) return '22';
  if (cleanName.includes('โลหิต')) return '23';

  return '10'; // default หน่วยบริหารงานวิจัย
}

/**
 * สร้างข้อความเลขที่หนังสือราชการฉบับเต็ม
 */
export function formatInternalDocNo(deptCode?: string, runningNo?: string): string {
  const code = deptCode ? deptCode.trim() : '10';
  if (runningNo && runningNo.trim()) {
    return `อว 0603.10.${code}/${runningNo.trim()}`;
  }
  return `อว 0603.10.${code} / `;
}

