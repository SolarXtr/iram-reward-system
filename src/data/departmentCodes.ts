/**
 * Department and Saraban Division Codes for Faculty of Medicine, Naresuan University
 * โครงสร้างเลขที่หนังสือออกของคณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร (อว 0603.10.xx)
 * อ้างอิงตามประกาศคณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร ณ วันที่ ๒ ธันวาคม ๒๕๖๘
 * มีผลใช้บังคับตั้งแต่วันที่ ๒๘ ธันวาคม ๒๕๖๘ เป็นต้นไป
 */

export interface DepartmentInfo {
  code: string;       // รหัส เช่น '01(9)', '02', '10', '12', '18(5)'
  name: string;       // ชื่อภาควิชา/หน่วยงาน
  category: 'office' | 'department' | 'hospital'; // หมวดหมู่
  hrCode?: string;    // รหัส HR/SMU
}

export const DEPARTMENT_LIST: DepartmentInfo[] = [
  // (๑) สำนักงานเลขานุการ (อว 0603.10.01/...)
  { code: '01(1)', name: 'งานอำนวยการและสนับสนุนการบริหาร', category: 'office' },
  { code: '01(2)', name: 'งานบริหาร', category: 'office' },
  { code: '01(3)', name: 'งานบริหารเทคโนโลยีสารสนเทศและนวัตกรรม', category: 'office' },
  { code: '01(4)', name: 'งานคลัง', category: 'office', hrCode: '104000' },
  { code: '01(5)', name: 'งานพัสดุ', category: 'office' },
  { code: '01(6)', name: 'งานทรัพยากรบุคคล', category: 'office' },
  { code: '01(7)', name: 'งานบริการการศึกษา', category: 'office' },
  { code: '01(8)', name: 'งานกิจการนิสิต', category: 'office' },
  { code: '01(9)', name: 'งานวิจัย / หน่วยบริหารและจัดการงานวิจัย', category: 'office', hrCode: '109000' },
  { code: '01(10)', name: 'งานพัฒนาคุณภาพบริการ', category: 'office' },

  // ภาควิชาและหน่วยงานเทียบเท่าภาควิชา (อว 0603.10.02 - 17/...)
  { code: '02', name: 'ภาควิชากุมารเวชศาสตร์', category: 'department', hrCode: '201000' },
  { code: '03', name: 'ภาควิชาจักษุวิทยา', category: 'department', hrCode: '202000' },
  { code: '04', name: 'ภาควิชาจิตเวชศาสตร์', category: 'department', hrCode: '203000' },
  { code: '05', name: 'ภาควิชาพยาธิวิทยา', category: 'department', hrCode: '204000' },
  { code: '06', name: 'ภาควิชารังสีวิทยา', category: 'department', hrCode: '205000' },
  { code: '07', name: 'ภาควิชาวิสัญญีวิทยา', category: 'department', hrCode: '206000' },
  { code: '08', name: 'ภาควิชาเวชศาสตร์ชุมชน', category: 'department', hrCode: '207000' },
  { code: '09', name: 'ภาควิชาสูติศาสตร์-นรีเวชวิทยา', category: 'department', hrCode: '209000' },
  { code: '10', name: 'ภาควิชาศัลยศาสตร์', category: 'department', hrCode: '208000' },
  { code: '11', name: 'ภาควิชาออร์โธปิดิกส์', category: 'department', hrCode: '210000' },
  { code: '12', name: 'ภาควิชาอายุรศาสตร์', category: 'department', hrCode: '211000' },
  { code: '13', name: 'ภาควิชาเวชศาสตร์ฟื้นฟู', category: 'department', hrCode: '212000' },
  { code: '14', name: 'ภาควิชาโสต ศอ นาสิกวิทยา', category: 'department', hrCode: '213000' },
  { code: '15', name: 'ภาควิชานิติเวชศาสตร์', category: 'department', hrCode: '214000' },
  { code: '16', name: 'ภาควิชาเวชศาสตร์ครอบครัว', category: 'department', hrCode: '215000' },
  { code: '17', name: 'ศูนย์พัฒนลักษณ์', category: 'department' },

  // (๑๘) โรงพยาบาลมหาวิทยาลัยนเรศวร (อว 0603.10.18/...)
  { code: '18(1)', name: 'งานอำนวยการและบริหารทั่วไป (รพ.)', category: 'hospital' },
  { code: '18(2)', name: 'งานบริหารเทคโนโลยีสารสนเทศการแพทย์และสถิติ', category: 'hospital' },
  { code: '18(3)', name: 'ฝ่ายเภสัชกรรม', category: 'hospital' },
  { code: '18(4)', name: 'ศูนย์รังสีรักษา', category: 'hospital' },
  { code: '18(5)', name: 'ศูนย์วิจัยโลหิตวิทยา', category: 'hospital', hrCode: '602000' },
  { code: '18(6)', name: 'ศูนย์มะเร็ง', category: 'hospital' },
  { code: '18(7)', name: 'ศูนย์โรคหัวใจ', category: 'hospital' },
  { code: '18(8)', name: 'ศูนย์ปลูกถ่ายอวัยวะ', category: 'hospital' },
  { code: '18(9)', name: 'ศูนย์ไตเทียม', category: 'hospital' },
  { code: '18(10)', name: 'ศูนย์ความเป็นเลิศด้านเทคโนโลยีเซลล์และยีนบำบัด', category: 'hospital' },
  { code: '18(11)', name: 'ศูนย์จักษุ', category: 'hospital' },
  { code: '18(12)', name: 'ศูนย์ผิวหนัง', category: 'hospital' },
  { code: '18(13)', name: 'ศูนย์ความเป็นเลิศด้านการผ่าตัดผ่านกล้อง', category: 'hospital' },
  { code: '18(14)', name: 'ศูนย์รักษาผู้มีบุตรยาก', category: 'hospital' },
  { code: '18(15)', name: 'ศูนย์ส่องกล้องระบบทางเดินอาหาร', category: 'hospital' },
  { code: '18(16)', name: 'ศูนย์ตรวจสุขภาพ', category: 'hospital' },
  { code: '18(17)', name: 'ศูนย์การแพทย์บูรณาการ', category: 'hospital' },
  { code: '18(18)', name: 'ศูนย์ทันตกรรม', category: 'hospital' },
  { code: '18(19)', name: 'ศูนย์ผู้สูงอายุ', category: 'hospital' },
  { code: '18(20)', name: 'หน่วยบริการพิเศษคลินิกนอกเวลาราชการ (SMC)', category: 'hospital' },
  { code: '18(21)', name: 'งานบริการกลางทางการแพทย์', category: 'hospital' },
  { code: '18(22)', name: 'งานสารสนเทศทางการแพทย์และเวชระเบียน', category: 'hospital' },
  { code: '18(23)', name: 'งานผู้ป่วยใน', category: 'hospital' },
  { code: '18(24)', name: 'งานการพยาบาล', category: 'hospital' },
  { code: '18(25)', name: 'งานวิศวกรรมการแพทย์', category: 'hospital' },
  { code: '18(26)', name: 'งานห้องปฏิบัติการทางการแพทย์', category: 'hospital' },
  { code: '18(27)', name: 'งานตรวจวินิจฉัยพิเศษทางอายุรกรรม', category: 'hospital' },
  { code: '18(28)', name: 'งานผู้ป่วยนอก', category: 'hospital' },
  { code: '18(29)', name: 'งานอุบัติเหตุและฉุกเฉิน', category: 'hospital' },
  { code: '18(30)', name: 'งานห้องผ่าตัด', category: 'hospital' },
  { code: '18(31)', name: 'งานหอผู้ป่วยวิกฤต', category: 'hospital' },
  { code: '18(32)', name: 'งานคลินิกบริการเฉพาะทาง', category: 'hospital' },
  { code: '18(33)', name: 'งานจ่ายกลาง', category: 'hospital' },
  { code: '18(34)', name: 'งานโภชนาการ', category: 'hospital' },
  { code: '18(35)', name: 'งานสังคมสงเคราะห์และประกันสุขภาพ', category: 'hospital' },
  { code: '18(36)', name: 'งานพยาธิวิทยากายวิภาค', category: 'hospital' },
];

/**
 * ค้นหารหัสหน่วยงานสารบรรณ (อว 0603.10.xx) จากชื่อภาควิชาหรือสังกัดของผู้ใช้งาน
 * อ้างอิงตามประกาศคณะแพทยศาสตร์ มน. ณ วันที่ ๒ ธันวาคม ๒๕๖๘
 */
export function getDepartmentCode(departmentName?: string): string {
  if (!departmentName) return '01(9)';
  const cleanName = departmentName.trim().toLowerCase();

  // 1. ศูนย์วิจัยโลหิตวิทยา (แยกจากงานวิจัยทั่วไป)
  if (cleanName.includes('โลหิต')) return '18(5)';

  // 2. งานวิจัย / หน่วยบริหารและจัดการงานวิจัย คณะแพทยศาสตร์
  if (cleanName.includes('วิจัย') || cleanName.includes('iram')) return '01(9)';

  // 3. สำนักงานเลขานุการ
  if (cleanName.includes('คลัง') || cleanName.includes('การเงิน')) return '01(4)';
  if (cleanName.includes('พัสดุ')) return '01(5)';
  if (cleanName.includes('ทรัพยากรบุคคล') || cleanName.includes('บุคคล')) return '01(6)';
  if (cleanName.includes('บริการการศึกษา')) return '01(7)';
  if (cleanName.includes('กิจการนิสิต')) return '01(8)';
  if (cleanName.includes('คุณภาพบริการ')) return '01(10)';
  if (cleanName.includes('อำนวยการและสนับสนุน')) return '01(1)';
  if (cleanName.includes('เทคโนโลยีสารสนเทศและนวัตกรรม')) return '01(3)';

  // 4. ภาควิชา
  if (cleanName.includes('กุมาร')) return '02';
  if (cleanName.includes('จักษุ') && !cleanName.includes('ศูนย์')) return '03';
  if (cleanName.includes('จิตเวช')) return '04';
  if (cleanName.includes('พยาธิ') && !cleanName.includes('กายวิภาค')) return '05';
  if (cleanName.includes('รังสี') && !cleanName.includes('รักษา')) return '06';
  if (cleanName.includes('วิสัญญี')) return '07';
  if (cleanName.includes('ชุมชน')) return '08';
  if (cleanName.includes('สูติ') || cleanName.includes('นรีเวช')) return '09';
  if (cleanName.includes('ศัลยศาสตร์') && !cleanName.includes('ออร์โธ')) return '10';
  if (cleanName.includes('ออร์โธ')) return '11';
  if (cleanName.includes('อายุรศาสตร์') || cleanName.includes('อายุรกรรม')) return '12';
  if (cleanName.includes('ฟื้นฟู')) return '13';
  if (cleanName.includes('โสต') || cleanName.includes('นาสิก') || cleanName.includes('หู คอ จมูก') || cleanName.includes('สถานวิทยาศาสตร์คลินิก')) return '14';
  if (cleanName.includes('นิติเวช')) return '15';
  if (cleanName.includes('ครอบครัว')) return '16';
  if (cleanName.includes('พัฒนลักษณ์')) return '17';

  // 5. ศูนย์เฉพาะทาง รพ.
  if (cleanName.includes('มะเร็ง')) return '18(6)';
  if (cleanName.includes('หัวใจ')) return '18(7)';
  if (cleanName.includes('ไตเทียม')) return '18(9)';
  if (cleanName.includes('ผิวหนัง')) return '18(12)';
  if (cleanName.includes('ทันตกรรม')) return '18(18)';
  if (cleanName.includes('ผู้สูงอายุ')) return '18(19)';
  if (cleanName.includes('พยาธิวิทยากายวิภาค')) return '18(36)';

  return '01(9)'; // default หน่วยบริหารและจัดการงานวิจัย งานวิจัย คณะแพทยศาสตร์
}

/**
 * สร้างข้อความเลขที่หนังสือราชการฉบับเต็ม
 * อว 0603.10.{deptCode}/{runningNo}
 */
export function formatInternalDocNo(deptCode?: string, runningNo?: string): string {
  const code = deptCode ? deptCode.trim() : '01(9)';
  if (runningNo && runningNo.trim()) {
    return `อว 0603.10.${code}/${runningNo.trim()}`;
  }
  return `อว 0603.10.${code} / `;
}

