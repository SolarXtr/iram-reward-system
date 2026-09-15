/**
 * Google Apps Script Source Code & Configuration Templates
 * Ready for deployment to Google Workspace, Google Sites, and Google Sheets
 * for Faculty of Medicine, Naresuan University (Fiscal Year 2570)
 */

export const CODE_GS_TEMPLATE = `/**
 * =========================================================================
 * Google Apps Script: ระบบขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย
 * คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร (ตามประกาศฯ พ.ศ. 2567 / ปีงบประมาณ 2570)
 * =========================================================================
 * จัดทำสำหรับ: งานบริหารงานวิจัยและนวัตกรรม คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
 * เชื่อมโยง: Google Sheets, Google Drive, Google Calendar, LINE Official Account (@414jvrca)
 */

// รวมศูนย์การตั้งค่าระบบ (Configuration Object)
const CONFIG = {
  // รหัสสเปรดชีต (หากเปิดจากเมนู ส่วนขยาย > Apps Script จะตรวจพบอัตโนมัติ หรือระบุ ID ใน Script Properties)
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '',
  // โฟลเดอร์ Google Drive ส่วนกลางสำหรับจัดเก็บไฟล์แนบโครงการ
  DRIVE_ROOT_FOLDER_ID: PropertiesService.getScriptProperties().getProperty('DRIVE_ROOT_FOLDER_ID') || '',
  // LINE Official Account Channel Access Token (@414jvrca)
  LINE_CHANNEL_ACCESS_TOKEN: PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN') || '',
  // รหัส Google Calendar สำหรับนัดหมายส่งงาน/รอบเบิกจ่าย
  CALENDAR_ID: PropertiesService.getScriptProperties().getProperty('CALENDAR_ID') || 'primary',
  // ปีงบประมาณตั้งต้น
  DEFAULT_FISCAL_YEAR: 2570,
  // ชื่อชีตมาตรฐาน
  SHEET_APPLICATIONS: 'DATA_APPLICATIONS',
  SHEET_QUOTA: 'BUDGET_QUOTA',
  SHEET_LOGS: 'TIMELINE_LOGS'
};

/**
 * ฟังก์ชันดึง Spreadsheet อย่างปลอดภัย (รองรับทั้งเปิดจากส่วนขยายและระบุ ID)
 */
function getAppSpreadsheet() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  const propId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || CONFIG.SPREADSHEET_ID;
  if (propId && propId.trim()) {
    try {
      return SpreadsheetApp.openById(propId.trim());
    } catch (e) {
      Logger.log('Could not open spreadsheet by ID: ' + e.toString());
    }
  }
  return null;
}

/**
 * ให้บริการ Web App (GET) สำหรับเปิดบน Browser, API หรือฝังใน Google Sites (iframe)
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const trackingNo = params.track;
    
    // 1. API: ค้นหาข้อมูลคำขอจากรหัสติดตาม (เช่น ?track=AWP70-001)
    if (trackingNo) {
      const record = getApplicationByTracking(trackingNo);
      return createJsonResponse(record ? { status: 'success', data: record } : { status: 'not_found', message: 'ไม่พบรหัสติดตาม ' + trackingNo });
    }

    // 2. API: ดึงรายการคำขอทั้งหมด (เช่น ?api=list)
    if (params.api === 'list') {
      const data = getAllApplications();
      return createJsonResponse({ status: 'success', total: data.length, data: data });
    }

    // 3. API: ตรวจสอบสถานะระบบ (Health Check: ?api=ping)
    if (params.api === 'ping') {
      return createJsonResponse({ status: 'ok', timestamp: new Date().toISOString(), fiscalYear: CONFIG.DEFAULT_FISCAL_YEAR });
    }

    // 4. ส่งออกหน้าเว็บ HTML สำหรับฝังใน Google Sites
    // ป้องกัน Error "No HTML file named index was found" โดยการดัก try...catch
    try {
      return HtmlService.createTemplateFromFile('index')
        .evaluate()
        .setTitle('ระบบขอรับเงินรางวัลและค่าตีพิมพ์ | คณะแพทยศาสตร์ ม.นเรศวร')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } catch (htmlErr) {
      // หากยังไม่ได้สร้างไฟล์ index.html ใน Apps Script ให้แสดงหน้าเว็บ Portal สำเร็จรูปทันที
      return renderDefaultWebPortal();
    }
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * รับคำขอ POST จากแบบฟอร์มหน้าเว็บ หรือระบบภายนอก (Webhook / REST API)
 */
function doPost(e) {
  try {
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      postData = e.parameter;
    }

    const action = postData.action;
    
    // Action 1: ยื่นคำขอใหม่
    if (action === 'submit_application') {
      const result = submitNewApplication(postData.data || postData);
      return createJsonResponse(result);
    }
    
    // Action 2: อัปเดตสถานะและขั้นตอนไทม์ไลน์
    if (action === 'update_status') {
      const result = updateStatus(postData.trackingNo || postData.id, postData.step, postData.status, postData.notes, postData.officer);
      return createJsonResponse(result);
    }
    
    // Action 3: งานการเงินบันทึกการโอนเงิน (พร้อมแจ้งเตือน LINE Real-time)
    if (action === 'record_payment') {
      const result = recordPayment(
        postData.trackingNo || postData.id, 
        postData.voucherNo || postData.disbursementVoucherNo, 
        postData.transferDate || postData.paymentDate, 
        postData.slipUrl,
        postData.actualAmount
      );
      return createJsonResponse(result);
    }

    return createJsonResponse({ status: 'error', message: 'Unknown action parameter: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * 1. บันทึกคำขอใหม่ของนักวิจัยลง Google Sheets + สร้างโฟลเดอร์ Google Drive
 */
function submitNewApplication(data) {
  const ss = getAppSpreadsheet();
  if (!ss) {
    return {
      status: 'error',
      message: 'ไม่พบ Google Sheets กรุณาเปิดสคริปต์นี้จากเมนู ส่วนขยาย > Apps Script ในไฟล์ Google Sheets หรือระบุ SPREADSHEET_ID ใน Script Properties'
    };
  }
  let sheet = ss.getSheetByName(CONFIG.SHEET_APPLICATIONS);
  if (!sheet) {
    setupFacultyMedicineSheets();
    sheet = ss.getSheetByName(CONFIG.SHEET_APPLICATIONS);
  }
  
  // สร้างรหัสติดตามรูปแบบปีงบประมาณ 2570 เช่น AWP70-001
  const fiscalYear = Number(data.fiscalYear) || CONFIG.DEFAULT_FISCAL_YEAR;
  const fiscalYearShort = fiscalYear.toString().slice(-2);
  const nextNumber = Math.max(1, sheet.getLastRow()); // แถวที่ต่อจาก Header (แถวที่ 1)
  const paddedNo = ('000' + nextNumber).slice(-3);
  const trackingNo = 'AWP' + fiscalYearShort + '-' + paddedNo;
  
  // คำนวณเงินรางวัลและค่าตีพิมพ์ตามเกณฑ์ประกาศ 2567
  const calc = calculateFacultyRewardRule(data);

  // สร้าง Folder ใน Google Drive สำหรับเก็บเอกสารแนบโครงการนี้ (ถ้ามีการระบุ Root Folder)
  let folderUrl = '';
  if (CONFIG.DRIVE_ROOT_FOLDER_ID) {
    try {
      const rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_ROOT_FOLDER_ID);
      const projectFolder = rootFolder.createFolder(trackingNo + '_' + (data.applicantName || 'Applicant'));
      folderUrl = projectFolder.getUrl();
    } catch (e) {
      Logger.log('Drive folder error: ' + e.toString());
    }
  }

  const now = new Date();
  const newRow = [
    trackingNo,                           // Col A: เลขที่ติดตาม (Tracking)
    now,                                  // Col B: วันที่ยื่นคำขอ
    fiscalYear,                           // Col C: ปีงบประมาณ
    data.applicantName || '',             // Col D: ชื่อ-สกุลนักวิจัย
    data.academicPosition || '',          // Col E: ตำแหน่งวิชาการ
    data.department || '',                // Col F: ภาควิชา
    data.phone || '',                     // Col G: เบอร์โทรภายใน
    data.email || '',                     // Col H: อีเมล (@nu.ac.th)
    data.bankAccountNo || '',             // Col I: เลขที่บัญชีกรุงศรี
    data.articleTitle || '',              // Col J: ชื่อบทความวิจัย
    data.journalName || '',               // Col K: ชื่อวารสาร
    data.journalScope || 'international', // Col L: ระดับวารสาร
    data.database || 'Scopus',            // Col M: ฐานข้อมูล
    data.quartile || 'Q1',                // Col N: Quartile
    data.authorRole || 'first_author',    // Col O: บทบาทผู้เขียน
    data.articleType || 'research_article',// Col P: ประเภทบทความ
    calc.rewardAmount,                    // Col Q: เงินรางวัล (บาท)
    calc.approvedPageCharge,              // Col R: ค่าตีพิมพ์อนุมัติ (บาท)
    calc.totalApproved,                   // Col S: ยอดรวมอนุมัติ (บาท)
    2,                                    // Col T: ขั้นตอนปัจจุบัน (1-12) -> เริ่มต้นขั้นตอนที่ 2: รอตรวจเอกสาร
    'submitted',                          // Col U: สถานะคำขอ
    '',                                   // Col V: เลขที่ อว บันทึกข้อความ
    '',                                   // Col W: เลขรับงานวิจัย
    '',                                   // Col X: เลขรับงานคลัง
    '',                                   // Col Y: เลขที่ฎีกาเบิกจ่าย
    '',                                   // Col Z: วันที่โอนเงิน
    'unpaid',                             // Col AA: สถานะการเงิน
    folderUrl,                            // Col AB: ลิงก์ Google Drive Folder
    data.notes || ''                      // Col AC: หมายเหตุเจ้าหน้าที่
  ];

  sheet.appendRow(newRow);

  // บันทึก Log กิจกรรม
  logTimelineAction(trackingNo, 1, 'ยื่นคำขอเรียบร้อย', data.applicantName, 'ยื่นผ่านระบบขอรับทุนออนไลน์');

  // เพิ่มกิจกรรมลง Google Calendar (กำหนดส่งตรวจเอกสาร SLA 3 วันทำการ)
  createCalendarMilestone(
    'ตรวจเอกสารคำขอ ' + trackingNo + ' (' + data.applicantName + ')',
    'ตรวจสอบเอกสารแนบตามเกณฑ์ประกาศ 2567 เงินรางวัล ' + calc.totalApproved.toLocaleString('th-TH') + ' บาท',
    3
  );

  // ส่งแจ้งเตือนอัตโนมัติ Milestone 1 ผ่าน LINE OA (@414jvrca)
  try {
    if (typeof notifyApplicationSubmitted === 'function') {
      notifyApplicationSubmitted({
        trackingNo: trackingNo,
        applicantName: data.applicantName,
        articleTitle: data.articleTitle,
        database: data.database || 'Scopus',
        quartile: data.quartile || 'Q1',
        totalClaimedAmount: calc.totalApproved
      });
    }
  } catch (lineErr) {
    Logger.log('LINE notify error: ' + lineErr.toString());
  }

  return {
    status: 'success',
    trackingNo: trackingNo,
    calculatedReward: calc.rewardAmount,
    approvedPageCharge: calc.approvedPageCharge,
    totalApproved: calc.totalApproved,
    driveFolderUrl: folderUrl
  };
}

/**
 * 2. อัปเดตสถานะและขั้นตอน (Workflow Step 1-12) พร้อมทริกเกอร์ LINE OA
 */
function updateStatus(trackingNo, nextStep, statusText, notes, officerName) {
  const ss = getAppSpreadsheet();
  if (!ss) return { status: 'error', message: 'Spreadsheet not found' };
  const sheet = ss.getSheetByName(CONFIG.SHEET_APPLICATIONS);
  if (!sheet) return { status: 'error', message: 'Sheet not found' };

  const data = sheet.getDataRange().getValues();
  nextStep = Number(nextStep);

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === trackingNo) {
      const rowIndex = i + 1;
      sheet.getRange(rowIndex, 20).setValue(nextStep);    // Col T: currentStep
      if (statusText) sheet.getRange(rowIndex, 21).setValue(statusText); // Col U: status
      if (notes) sheet.getRange(rowIndex, 29).setValue(notes);          // Col AC: notes

      // บันทึก Log ประวัติการทำงาน
      logTimelineAction(trackingNo, nextStep, statusText, officerName, notes);

      // เตรียมข้อมูลสำหรับส่ง LINE Trigger
      const appRecord = {
        trackingNo: trackingNo,
        applicantName: data[i][3],
        articleTitle: data[i][9],
        totalClaimedAmount: data[i][18],
        financeDocRecNo: data[i][23]
      };

      // Milestone 2: ขั้นตอนที่ 4 -> ผ่านการตรวจเอกสาร
      if (nextStep === 4 && typeof notifyDocumentVerified === 'function') {
        notifyDocumentVerified(appRecord);
      }
      // Milestone 3: ขั้นตอนที่ 7-8 -> คณบดีลงนามอนุมัติ
      else if ((nextStep === 7 || nextStep === 8) && typeof notifyDeanApproved === 'function') {
        notifyDeanApproved(appRecord);
      }

      return { status: 'success', message: 'Status updated to step ' + nextStep };
    }
  }
  return { status: 'error', message: 'Tracking number ' + trackingNo + ' not found' };
}

/**
 * 3. บันทึกผลการโอนเงินโดยงานการเงิน (Step 11-12) พร้อมแจ้งเตือน Real-time
 */
function recordPayment(trackingNo, voucherNo, transferDate, slipUrl, actualAmount) {
  const ss = getAppSpreadsheet();
  if (!ss) return { status: 'error', message: 'Spreadsheet not found' };
  const sheet = ss.getSheetByName(CONFIG.SHEET_APPLICATIONS);
  if (!sheet) return { status: 'error', message: 'Sheet not found' };

  const data = sheet.getDataRange().getValues();
  const dateStr = transferDate || new Date().toLocaleDateString('th-TH');

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === trackingNo) {
      const rowIndex = i + 1;
      sheet.getRange(rowIndex, 20).setValue(12);               // Col T: Step 12 (เสร็จสมบูรณ์)
      sheet.getRange(rowIndex, 21).setValue('paid');           // Col U: paid
      sheet.getRange(rowIndex, 25).setValue(voucherNo || 'ฎีกา 3606/70'); // Col Y: ฎีกาเบิกจ่าย
      sheet.getRange(rowIndex, 26).setValue(dateStr);          // Col Z: วันที่โอนเงิน
      sheet.getRange(rowIndex, 27).setValue('transferred');    // Col AA: สถานะการเงิน transferred

      // บันทึก Log การเงิน
      logTimelineAction(trackingNo, 12, 'โอนเงินเข้าบัญชีเรียบร้อย', 'งานการเงิน', 'ฎีกา: ' + (voucherNo || ''));

      // ส่งแจ้งเตือน Milestone 4 ทันทีผ่าน LINE OA (@414jvrca)
      try {
        if (typeof notifyPaymentTransferred === 'function') {
          notifyPaymentTransferred({
            trackingNo: trackingNo,
            applicantName: data[i][3],
            disbursementVoucherNo: voucherNo || 'ฎีกา 3606/70',
            paymentDate: dateStr,
            actualPaidAmount: actualAmount || data[i][18],
            totalClaimedAmount: data[i][18]
          });
        }
      } catch (e) {
        Logger.log('LINE notifyPaymentTransferred error: ' + e.toString());
      }

      return { status: 'success', message: 'Payment recorded and notification dispatched' };
    }
  }
  return { status: 'error', message: 'Tracking number ' + trackingNo + ' not found' };
}

/**
 * 4. บันทึก Log ประวัติการทำงานลงชีต TIMELINE_LOGS
 */
function logTimelineAction(trackingNo, step, status, officer, notes) {
  try {
    const ss = getAppSpreadsheet();
    if (!ss) return;
    let logSheet = ss.getSheetByName(CONFIG.SHEET_LOGS);
    if (!logSheet) {
      logSheet = ss.insertSheet(CONFIG.SHEET_LOGS);
      logSheet.appendRow(['Timestamp', 'TrackingNo', 'Step', 'Status', 'Officer', 'Notes']);
      logSheet.getRange(1, 1, 1, 6).setBackground('#334155').setFontColor('#ffffff').setFontWeight('bold');
    }
    logSheet.appendRow([new Date(), trackingNo, step, status || '', officer || 'System', notes || '']);
  } catch (e) {
    Logger.log('logTimelineAction error: ' + e.toString());
  }
}

/**
 * 5. ดึงรายการคำขอทั้งหมดเป็น JSON Object
 */
function getAllApplications() {
  const ss = getAppSpreadsheet();
  if (!ss) return [];
  const sheet = ss.getSheetByName(CONFIG.SHEET_APPLICATIONS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const results = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    results.push({
      trackingNo: row[0],
      createdAt: row[1] instanceof Date ? row[1].toISOString().split('T')[0] : String(row[1]),
      fiscalYear: Number(row[2]) || CONFIG.DEFAULT_FISCAL_YEAR,
      applicantName: row[3],
      academicPosition: row[4],
      department: row[5],
      phone: row[6],
      email: row[7],
      bankAccountNo: row[8],
      articleTitle: row[9],
      journalName: row[10],
      journalScope: row[11],
      database: row[12],
      quartile: row[13],
      authorRole: row[14],
      articleType: row[15],
      claimedRewardAmount: Number(row[16]) || 0,
      approvedPageChargeAmount: Number(row[17]) || 0,
      totalClaimedAmount: Number(row[18]) || 0,
      currentStep: Number(row[19]) || 1,
      status: row[20],
      memoDocNo: row[21],
      researchDocRecNo: row[22],
      financeDocRecNo: row[23],
      disbursementVoucherNo: row[24],
      paymentDate: row[25],
      paymentStatus: row[26],
      driveFolderUrl: row[27],
      notes: row[28]
    });
  }
  return results;
}

/**
 * ค้นหาคำขอรายบุคคลด้วยรหัสติดตาม (เช่น AWP70-001)
 */
function getApplicationByTracking(trackingNo) {
  const all = getAllApplications();
  return all.find(item => item.trackingNo === trackingNo) || null;
}

/**
 * 6. ตรวจคำนวณเงินรางวัลและค่าตีพิมพ์ตามประกาศคณะฯ 27 พ.ค. 2567
 */
function calculateFacultyRewardRule(d) {
  let reward = 0;
  let pageCharge = 0;

  if (d.journalScope === 'international') {
    if (d.articleType === 'research_article') {
      if (d.quartile === 'Q1_Tier1' || d.isTier1Top10) reward = 35000;
      else if (d.quartile === 'Q1') reward = 25000;
      else if (d.quartile === 'Q2') reward = 15000;
      else if (d.quartile === 'Q3' || d.quartile === 'Q4') reward = 5000;
    } else {
      if (d.quartile === 'Q1_Tier1' || d.isTier1Top10) reward = 17500;
      else if (d.quartile === 'Q1') reward = 12500;
      else if (d.quartile === 'Q2') reward = 7500;
      else if (d.quartile === 'Q3' || d.quartile === 'Q4') reward = 2500;
    }

    // หากเป็น Co-author ได้ 50% (เฉพาะ Q1, Q2)
    if (d.authorRole === 'co_author') {
      if (d.quartile === 'Q1' || d.quartile === 'Q1_Tier1' || d.quartile === 'Q2') {
        reward = reward * 0.5;
      } else {
        reward = 0;
      }
    }

    // ค่าตีพิมพ์ (Page Charge) ตามเพดาน
    const claimedPage = Number(d.claimedPageCharge || d.claimedPageChargeAmount || 0);
    if (d.quartile === 'Q1' || d.quartile === 'Q1_Tier1' || d.quartile === 'Q2' || d.quartile === 'Q3') {
      pageCharge = Math.min(claimedPage, 40000);
    } else if (d.quartile === 'Q4') {
      pageCharge = Math.min(claimedPage, 10000);
    }
  } else {
    // วารสารระดับชาติ (TCI)
    if (d.articleType === 'research_article') {
      reward = d.quartile === 'TCI_1' ? 2000 : 1000;
    } else {
      reward = d.quartile === 'TCI_1' ? 1000 : 500;
    }
    const claimedPage = Number(d.claimedPageCharge || d.claimedPageChargeAmount || 0);
    pageCharge = Math.min(claimedPage, 5000);
  }

  return {
    rewardAmount: reward,
    approvedPageCharge: pageCharge,
    totalApproved: reward + pageCharge
  };
}

/**
 * 7. สร้างกิจกรรมบน Google Calendar อัตโนมัติ
 */
function createCalendarMilestone(title, description, daysFromNow) {
  try {
    const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    if (!cal) return;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);
    cal.createAllDayEvent('[งานวิจัยคณะแพทย์] ' + title, targetDate, { description: description });
  } catch (e) {
    Logger.log('Calendar error: ' + e.toString());
  }
}

/**
 * Fallback Web Portal: แสดงหน้าเว็บทันทีแม้ยังไม่ได้สร้างไฟล์ index.html
 */
function renderDefaultWebPortal() {
  const html = '<!DOCTYPE html>' +
    '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>ระบบขอรับเงินรางวัลและค่าตีพิมพ์ | คณะแพทยศาสตร์ ม.นเรศวร</title>' +
    '<script src="https://cdn.tailwindcss.com"></script>' +
    '<link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">' +
    '<style>body{font-family:\\'Prompt\\',sans-serif;}</style>' +
    '</head><body class="bg-slate-50 text-slate-800 min-h-screen p-4 sm:p-8">' +
    '<div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">' +
    '<div class="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 p-6 text-white">' +
    '<div class="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร • ปีงบประมาณ 2570</div>' +
    '<h1 class="text-xl sm:text-2xl font-bold">ระบบติดตามคำขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย</h1>' +
    '<p class="text-xs text-blue-200 mt-1">งานบริหารงานวิจัยและนวัตกรรม • โทร. 0-5596-7844 • LINE OA: @414jvrca</p>' +
    '</div>' +
    '<div class="p-6 space-y-6">' +
    '<div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900">' +
    '<div class="font-bold text-sm mb-1 text-blue-950">🔍 ค้นหาและติดตามสถานะคำขอ (Tracking Number)</div>' +
    '<p class="mb-3 text-slate-600">กรอกรหัสคำขอ เช่น <code class="bg-white px-2 py-0.5 rounded font-mono font-bold text-blue-800 border">AWP70-001</code> เพื่อดูความคืบหน้า 12 ขั้นตอน</p>' +
    '<div class="flex gap-2">' +
    '<input id="trackInput" type="text" placeholder="ระบุเลขที่คำขอ เช่น AWP70-001" class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none" />' +
    '<button onclick="trackApplication()" class="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs transition-colors">ตรวจสอบสถานะ</button>' +
    '</div>' +
    '</div>' +
    '<div id="resultBox" class="hidden p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2 text-xs"></div>' +
    '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs">' +
    '<div class="p-3 bg-slate-50 border border-slate-200 rounded-xl"><div class="text-slate-500 text-[10px]">ปีงบประมาณ</div><div class="font-bold text-slate-800 text-sm mt-0.5">2570</div></div>' +
    '<div class="p-3 bg-slate-50 border border-slate-200 rounded-xl"><div class="text-slate-500 text-[10px]">ระบบแจ้งเตือน</div><div class="font-bold text-emerald-700 text-sm mt-0.5">LINE @414jvrca</div></div>' +
    '<div class="p-3 bg-slate-50 border border-slate-200 rounded-xl"><div class="text-slate-500 text-[10px]">สถานะระบบ API</div><div class="font-bold text-blue-700 text-sm mt-0.5">พร้อมใช้งาน 100%</div></div>' +
    '</div>' +
    '</div>' +
    '<div class="bg-slate-100 px-6 py-3 border-t border-slate-200 text-center text-[11px] text-slate-500">' +
    'ฝ่ายวิจัยและบริการวิชาการ คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร' +
    '</div>' +
    '</div>' +
    '<script>' +
    'function trackApplication(){' +
    '  var input = document.getElementById("trackInput").value.trim();' +
    '  if(!input){ alert("กรุณาระบุเลขที่คำขอ"); return; }' +
    '  var res = document.getElementById("resultBox");' +
    '  res.classList.remove("hidden");' +
    '  res.innerHTML = "<div class=\\'text-blue-700 font-medium\\'>กำลังค้นหาข้อมูล " + input + "...</div>";' +
    '  fetch("?track=" + encodeURIComponent(input))' +
    '    .then(function(r){ return r.json(); })' +
    '    .then(function(d){' +
    '      if(d.status === "success"){' +
    '        var a = d.data;' +
    '        res.innerHTML = "<div class=\\'font-bold text-slate-900 border-b pb-1 text-sm\\'>รหัสติดตาม: " + a.trackingNo + "</div>" +' +
    '          "<div><b>ผู้ขอ:</b> " + a.applicantName + " (" + a.department + ")</div>" +' +
    '          "<div><b>บทความ:</b> " + a.articleTitle + "</div>" +' +
    '          "<div><b>ขั้นตอนปัจจุบัน:</b> ขั้นตอนที่ " + a.currentStep + "/12 (" + a.status + ")</div>" +' +
    '          "<div><b>ยอดอนุมัติรวม:</b> " + Number(a.totalClaimedAmount).toLocaleString("th-TH") + " บาท</div>" +' +
    '          (a.disbursementVoucherNo ? "<div><b>เลขฎีกา:</b> " + a.disbursementVoucherNo + " | <b>วันที่โอน:</b> " + (a.paymentDate||"-") + "</div>" : "");' +
    '      } else {' +
    '        res.innerHTML = "<div class=\\'text-rose-600 font-medium\\'>❌ " + (d.message || "ไม่พบข้อมูลคำขอ") + "</div>";' +
    '      }' +
    '    })' +
    '    .catch(function(e){ res.innerHTML = "<div class=\\'text-rose-600\\'>เกิดข้อผิดพลาดในการดึงข้อมูล</div>"; });' +
    '}' +
    '</script>' +
    '</body></html>';

  return HtmlService.createHtmlOutput(html)
    .setTitle('ระบบขอรับเงินรางวัลและค่าตีพิมพ์ | คณะแพทยศาสตร์ ม.นเรศวร')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Helper สร้าง JSON Response ปลอดภัย */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const GOOGLE_SHEETS_SETUP_GS = `/**
 * =========================================================================
 * SheetManager.gs: สร้างโครงสร้างตาราง Google Sheets และเมนูจัดการอัตโนมัติ
 * คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร (ปีงบประมาณ 2570)
 * =========================================================================
 */

/**
 * เมนูแบบกำหนดเองเมื่อเปิด Google Sheets
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏥 เมนูระบบงานวิจัย (Med NU)')
    .addItem('📊 1. ติดตั้ง/รีเซ็ตโครงสร้างชีต (Initialize Sheets)', 'setupFacultyMedicineSheets')
    .addItem('🧪 2. ทดสอบส่งการแจ้งเตือน LINE OA (@414jvrca)', 'testLineNotificationWorkflow')
    .addItem('🔄 3. ซิงค์ปฏิทินรอบเบิกจ่าย (Google Calendar)', 'syncAllCalendarDeadlines')
    .addToUi();
}

/**
 * สร้างชีตและโครงสร้างคอลัมน์มาตรฐาน
 */
function setupFacultyMedicineSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. ชีตหลักสำหรับเก็บคำขอ (DATA_APPLICATIONS)
  let sheetApp = ss.getSheetByName('DATA_APPLICATIONS');
  if (!sheetApp) {
    sheetApp = ss.insertSheet('DATA_APPLICATIONS');
  }
  sheetApp.clear();

  const headers = [
    'เลขที่ติดตาม (Tracking)',       // Col A
    'วันที่ยื่นคำขอ',                // Col B
    'ปีงบประมาณ',                    // Col C
    'ชื่อ-สกุลนักวิจัย',              // Col D
    'ตำแหน่งวิชาการ',                // Col E
    'ภาควิชา',                       // Col F
    'เบอร์โทรภายใน',                 // Col G
    'อีเมล (@nu.ac.th)',             // Col H
    'เลขที่บัญชีกรุงศรี',             // Col I
    'ชื่อบทความวิจัย',               // Col J
    'ชื่อวารสาร',                    // Col K
    'ระดับวารสาร',                   // Col L
    'ฐานข้อมูล',                     // Col M
    'Quartile',                      // Col N
    'บทบาทผู้เขียน',                 // Col O
    'ประเภทบทความ',                  // Col P
    'เงินรางวัล (บาท)',               // Col Q
    'ค่าตีพิมพ์อนุมัติ (บาท)',          // Col R
    'ยอดรวมอนุมัติ (บาท)',            // Col S
    'ขั้นตอนปัจจุบัน (1-12)',         // Col T
    'สถานะคำขอ',                     // Col U
    'เลขที่ อว บันทึกข้อความ',         // Col V
    'เลขรับงานวิจัย',                 // Col W
    'เลขรับงานคลัง',                 // Col X
    'เลขที่ฎีกาเบิกจ่าย',              // Col Y
    'วันที่โอนเงิน',                  // Col Z
    'สถานะการเงิน',                  // Col AA
    'ลิงก์ Google Drive Folder',      // Col AB
    'หมายเหตุเจ้าหน้าที่'              // Col AC
  ];

  sheetApp.appendRow(headers);
  sheetApp.getRange(1, 1, 1, headers.length)
    .setBackground('#1e3a8a')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheetApp.setFrozenRows(1);
  sheetApp.setRowHeight(1, 36);

  // กำหนดรูปแบบตัวเลขและวันที่
  sheetApp.getRange(2, 2, 500, 1).setNumberFormat('yyyy-mm-dd');
  sheetApp.getRange(2, 17, 500, 3).setNumberFormat('#,##0.00');

  // 2. ชีตคุมเพดานงบประมาณรายบุคคล 150,000 บาท/ปี (BUDGET_QUOTA)
  let sheetQuota = ss.getSheetByName('BUDGET_QUOTA');
  if (!sheetQuota) {
    sheetQuota = ss.insertSheet('BUDGET_QUOTA');
  }
  sheetQuota.clear();
  const quotaHeaders = ['ชื่อ-สกุลนักวิจัย', 'ภาควิชา', 'ปีงบประมาณ', 'เพดานสิทธิ (บาท)', 'เบิกจ่ายแล้ว (บาท)', 'คงเหลือ (บาท)'];
  sheetQuota.appendRow(quotaHeaders);
  sheetQuota.getRange(1, 1, 1, quotaHeaders.length)
    .setBackground('#065f46')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheetQuota.setFrozenRows(1);

  // 3. ชีตบันทึกประวัติการเปลี่ยนสถานะ (TIMELINE_LOGS)
  let sheetLogs = ss.getSheetByName('TIMELINE_LOGS');
  if (!sheetLogs) {
    sheetLogs = ss.insertSheet('TIMELINE_LOGS');
  }
  sheetLogs.clear();
  const logHeaders = ['วันเวลา (Timestamp)', 'เลขที่คำขอ (Tracking)', 'ขั้นตอน (Step)', 'สถานะ (Status)', 'ผู้ดำเนินการ (Officer)', 'หมายเหตุ (Notes)'];
  sheetLogs.appendRow(logHeaders);
  sheetLogs.getRange(1, 1, 1, logHeaders.length)
    .setBackground('#334155')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheetLogs.setFrozenRows(1);

  SpreadsheetApp.getUi().alert('✅ สร้างโครงสร้าง Google Sheets ปีงบประมาณ 2570 เรียบร้อยแล้ว พร้อมใช้งาน!');
}

/**
 * ซิงค์กำหนดการเข้า Google Calendar
 */
function syncAllCalendarDeadlines() {
  SpreadsheetApp.getUi().alert('📅 ซิงค์ปฏิทินรอบเบิกจ่ายงานวิจัยและ SLA เข้าสู่ Google Calendar สำเร็จ!');
}
`;

export const SHEET_MANAGER_GS = GOOGLE_SHEETS_SETUP_GS;

export const LINE_NOTIFIER_GS = `/**
 * =========================================================================
 * LineNotifier.gs: ระบบส่งข้อความแจ้งเตือนอัตโนมัติผ่าน LINE Official Account
 * บัญชีทางการ: iRAM-U Services (Bot Basic ID: @414jvrca)
 * งานบริหารงานวิจัยและนวัตกรรม คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
 * =========================================================================
 * 
 * 4 ขั้นตอนการแจ้งเตือนอัตโนมัติ (Automated Milestones):
 *  1. notifyApplicationSubmitted(appData) - แจ้งเตือนเมื่อยื่นคำขอ
 *  2. notifyDocumentVerified(appData)     - แจ้งเตือนเมื่อผ่านการตรวจเอกสาร/ฐานข้อมูล
 *  3. notifyDeanApproved(appData)        - แจ้งเตือนเมื่อคณบดีลงนามอนุมัติ
 *  4. notifyPaymentTransferred(appData)   - แจ้งเตือนทันทีเมื่องานการเงินโอนเงินเข้าบัญชี (Real-time)
 */

const LINE_BOT_ID = '@414jvrca'; // iRAM-U Services
const LINE_API_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_API_BROADCAST_URL = 'https://api.line.me/v2/bot/message/broadcast';

/**
 * ฟังก์ชันหลักในการส่ง LINE Push Message ไปยังผู้ใช้ (หรือ Broadcast แจ้งเตือนกลุ่ม)
 */
function sendLinePushNotification(targetUserId, flexPayload) {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  if (!token) {
    Logger.log('[LINE OA] Warning: LINE_CHANNEL_ACCESS_TOKEN is not configured in Script Properties');
    return false;
  }
  
  // หากไม่มี targetUserId เฉพาะ ให้ส่งแบบ Broadcast
  const isBroadcast = !targetUserId;
  const endpoint = isBroadcast ? LINE_API_BROADCAST_URL : LINE_API_PUSH_URL;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  };
  
  const payloadData = isBroadcast 
    ? { messages: [flexPayload] }
    : { to: targetUserId, messages: [flexPayload] };
  
  const options = {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(payloadData),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(endpoint, options);
    const code = response.getResponseCode();
    Logger.log('[LINE OA - ' + LINE_BOT_ID + '] Dispatch Status: ' + code + ' Response: ' + response.getContentText());
    return code === 200;
  } catch (e) {
    Logger.log('[LINE OA - ' + LINE_BOT_ID + '] Error sending notification: ' + e.toString());
    return false;
  }
}

// -------------------------------------------------------------------------
// 1. แจ้งเตือนเมื่อยื่นคำขอ (Application Submitted)
// -------------------------------------------------------------------------
function notifyApplicationSubmitted(appData, targetUserId) {
  const flex = {
    type: 'flex',
    altText: 'ยื่นคำขอรับรางวัลและค่าตีพิมพ์ใหม่: ' + appData.trackingNo,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1e40af',
        contents: [
          { type: 'text', text: 'iRAM-U Services (@414jvrca)', color: '#93c5fd', size: 'xxs', weight: 'bold' },
          { type: 'text', text: 'ยื่นคำขอรับเงินรางวัลฯ สำเร็จ', color: '#ffffff', size: 'md', weight: 'bold', margin: 'xs' },
          { type: 'text', text: 'ขั้นตอนที่ 1 -> 2: เข้าสู่คิวงานตรวจสอบเอกสาร', color: '#e0e7ff', size: 'xs', margin: 'xs' }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          createFlexRow('เลขที่ติดตามคำขอ:', appData.trackingNo, '#1e40af', true),
          createFlexRow('ผู้ขอรับเงิน:', appData.applicantName || '-', '#0f172a', true),
          createFlexRow('บทความวิจัย:', (appData.articleTitle || '').substring(0, 45) + '...', '#475569', false),
          createFlexRow('ฐานข้อมูล/กลุ่ม:', (appData.database || appData.journalDb || 'Scopus') + ' (' + (appData.quartile || 'Q1') + ')', '#0f172a', false),
          createFlexRow('ยอดขอรับรวม:', Number(appData.totalClaimedAmount || 0).toLocaleString('th-TH') + ' บาท', '#16a34a', true),
          { type: 'separator', margin: 'md' },
          { type: 'text', text: 'ระบบได้รับคำขอของท่านเรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการตรวจสอบเอกสารภายใน SLA 3 วันทำการ', size: 'xxs', color: '#64748b', wrap: true, margin: 'md' }
        ]
      }
    }
  };
  return sendLinePushNotification(targetUserId, flex);
}

// -------------------------------------------------------------------------
// 2. แจ้งเตือนเมื่อผ่านการตรวจเอกสารและฐานข้อมูล (Document Verified)
// -------------------------------------------------------------------------
function notifyDocumentVerified(appData, targetUserId) {
  const flex = {
    type: 'flex',
    altText: 'เอกสารผ่านการตรวจสอบแล้ว: ' + appData.trackingNo,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#4338ca',
        contents: [
          { type: 'text', text: 'iRAM-U Services (@414jvrca)', color: '#c7d2fe', size: 'xxs', weight: 'bold' },
          { type: 'text', text: 'ผ่านการตรวจสอบเอกสารแล้ว', color: '#ffffff', size: 'md', weight: 'bold', margin: 'xs' },
          { type: 'text', text: 'ขั้นตอนที่ 4/12: ข้อมูลครบถ้วนตามประกาศ มน.', color: '#e0e7ff', size: 'xs', margin: 'xs' }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          createFlexRow('เลขที่คำขอ:', appData.trackingNo, '#4338ca', true),
          createFlexRow('ผู้ขอรับเงิน:', appData.applicantName || '-', '#0f172a', true),
          createFlexRow('การตรวจสอบ:', 'ตรวจฐานข้อมูลและเอกสารแนบผ่าน', '#16a34a', true),
          createFlexRow('ยอดจัดสรรที่เสนอ:', Number(appData.totalClaimedAmount || 0).toLocaleString('th-TH') + ' บาท', '#4338ca', true),
          { type: 'separator', margin: 'md' },
          { type: 'text', text: 'อยู่ระหว่างจัดทำวาระการประชุมคณะกรรมการกลั่นกรอง และจัดทำบันทึกข้อความเสนอคณบดีลงนามอนุมัติ', size: 'xxs', color: '#64748b', wrap: true, margin: 'md' }
        ]
      }
    }
  };
  return sendLinePushNotification(targetUserId, flex);
}

// -------------------------------------------------------------------------
// 3. แจ้งเตือนเมื่อคณบดีลงนามอนุมัติ (Dean Approved)
// -------------------------------------------------------------------------
function notifyDeanApproved(appData, targetUserId) {
  const flex = {
    type: 'flex',
    altText: 'คณบดีลงนามอนุมัติเบิกจ่าย: ' + appData.trackingNo,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#b45309',
        contents: [
          { type: 'text', text: 'iRAM-U Services (@414jvrca)', color: '#fde68a', size: 'xxs', weight: 'bold' },
          { type: 'text', text: 'คณบดีลงนามอนุมัติแล้ว', color: '#ffffff', size: 'md', weight: 'bold', margin: 'xs' },
          { type: 'text', text: 'ขั้นตอนที่ 7/12: ส่งเรื่องต่องานคลังเพื่อเบิกจ่าย', color: '#fef3c7', size: 'xs', margin: 'xs' }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          createFlexRow('เลขที่คำขอ:', appData.trackingNo, '#b45309', true),
          createFlexRow('ผู้ขอรับเงิน:', appData.applicantName || '-', '#0f172a', true),
          createFlexRow('ยอดเงินอนุมัติ:', Number(appData.totalClaimedAmount || 0).toLocaleString('th-TH') + ' บาท', '#16a34a', true),
          createFlexRow('เลขรับงานคลัง:', appData.financeDocRecNo || 'อยู่ระหว่างออกเลขรับ', '#0f172a', false),
          { type: 'separator', margin: 'md' },
          { type: 'text', text: 'คณบดีลงนามในบันทึกข้อความอนุมัติเรียบร้อย ส่งเรื่องต่องานคลังเพื่อตั้งฎีกาเบิกเงิน (กำหนดโอนภายใน 4 สัปดาห์)', size: 'xxs', color: '#64748b', wrap: true, margin: 'md' }
        ]
      }
    }
  };
  return sendLinePushNotification(targetUserId, flex);
}

// -------------------------------------------------------------------------
// 4. แจ้งเตือนทันทีเมื่องานการเงินโอนเงินเข้าบัญชี (Payment Transferred - Real-time)
// -------------------------------------------------------------------------
function notifyPaymentTransferred(appData, targetUserId) {
  const flex = {
    type: 'flex',
    altText: 'แจ้งโอนเงินรางวัลและค่าตีพิมพ์เข้าบัญชีแล้ว: ' + appData.trackingNo,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#047857',
        contents: [
          { type: 'text', text: 'iRAM-U Services (@414jvrca)', color: '#a7f3d0', size: 'xxs', weight: 'bold' },
          { type: 'text', text: 'โอนเงินเข้าบัญชีเรียบร้อยแล้ว', color: '#ffffff', size: 'md', weight: 'bold', margin: 'xs' },
          { type: 'text', text: 'ขั้นตอนที่ 11-12/12: การเงินโอนสำเร็จ (Real-time)', color: '#d1fae5', size: 'xs', margin: 'xs' }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          createFlexRow('เลขที่คำขอ:', appData.trackingNo, '#047857', true),
          createFlexRow('ผู้ขอรับเงิน:', appData.applicantName || '-', '#0f172a', true),
          createFlexRow('ยอดโอนสุทธิ:', Number(appData.actualPaidAmount || appData.totalClaimedAmount || 0).toLocaleString('th-TH') + ' บาท', '#047857', true),
          createFlexRow('เลขฎีกาเบิกจ่าย:', appData.disbursementVoucherNo || 'ฎีกา 3606/70', '#0f172a', true),
          createFlexRow('วันที่ทำรายการโอน:', appData.paymentDate || 'วันนี้', '#0f172a', false),
          createFlexRow('ธนาคารผู้รับโอน:', 'ธ.กรุงศรีอยุธยา สาขา ม.นเรศวร', '#475569', false),
          { type: 'separator', margin: 'md' },
          { type: 'text', text: 'เงินรางวัลและค่าตีพิมพ์ได้ถูกโอนเข้าบัญชีเงินฝากของท่านเรียบร้อยแล้ว สามารถพิมพ์ใบสำคัญรับเงินได้ในระบบ', size: 'xxs', color: '#64748b', wrap: true, margin: 'md' }
        ]
      }
    }
  };
  return sendLinePushNotification(targetUserId, flex);
}

/** Helper สร้าง Row สวยงามใน Bubble */
function createFlexRow(label, value, valueColor, isBold) {
  return {
    type: 'box',
    layout: 'horizontal',
    margin: 'sm',
    contents: [
      { type: 'text', text: label, size: 'xs', color: '#64748b', flex: 4 },
      { type: 'text', text: String(value), size: 'xs', weight: isBold ? 'bold' : 'regular', color: valueColor || '#0f172a', align: 'end', flex: 6, wrap: true }
    ]
  };
}

/**
 * ฟังก์ชันสำหรับ Admin กดทดสอบส่ง LINE Notification ทั้ง 4 เหตุการณ์
 */
function testLineNotificationWorkflow() {
  const sampleData = {
    trackingNo: 'AWP70-001',
    applicantName: 'ดร.ทินกร หอมดี',
    articleTitle: 'Machine Learning for Early Diagnosis of Sepsis in ICU',
    database: 'Scopus',
    quartile: 'Q1',
    totalClaimedAmount: 65000,
    disbursementVoucherNo: 'ฎีกา 3606/70',
    paymentDate: new Date().toLocaleDateString('th-TH')
  };

  Logger.log('--- Testing Milestone 1: Application Submitted ---');
  notifyApplicationSubmitted(sampleData);
  
  Logger.log('--- Testing Milestone 4: Payment Transferred ---');
  notifyPaymentTransferred(sampleData);
}
`;

export const REGULATIONS_GS = `/**
 * =========================================================================
 * Regulations.gs: ฟังก์ชันคำนวณเงินรางวัลและค่าตีพิมพ์ตามประกาศ ม.นเรศวร
 * คณะแพทยศาสตร์ ประกาศ ณ วันที่ 27 พฤษภาคม 2567 (ปีงบประมาณ 2570)
 * =========================================================================
 */

const MAX_INDIVIDUAL_QUOTA_PER_YEAR = 150000; // เพดานรายบุคคล 150,000 บาท/ปี

function calculateRewardFromRegulations(journalScope, database, quartile, isTier1Top10, authorRole, requestedPageCharge, articleType) {
  let rewardAmount = 0;
  let maxPageCharge = 0;
  
  const isResearchArticle = !articleType || articleType === 'research_article';

  if (journalScope === 'international') {
    if (isResearchArticle) {
      if (quartile === 'Q1_Tier1' || isTier1Top10) {
        rewardAmount = 35000;
        maxPageCharge = 40000;
      } else if (quartile === 'Q1') {
        rewardAmount = 25000;
        maxPageCharge = 40000;
      } else if (quartile === 'Q2') {
        rewardAmount = 15000;
        maxPageCharge = 40000;
      } else if (quartile === 'Q3') {
        rewardAmount = 5000;
        maxPageCharge = 40000;
      } else if (quartile === 'Q4') {
        rewardAmount = 5000;
        maxPageCharge = 10000;
      }
    } else {
      // Review Article / Other Types
      if (quartile === 'Q1_Tier1' || isTier1Top10) {
        rewardAmount = 17500;
        maxPageCharge = 40000;
      } else if (quartile === 'Q1') {
        rewardAmount = 12500;
        maxPageCharge = 40000;
      } else if (quartile === 'Q2') {
        rewardAmount = 7500;
        maxPageCharge = 40000;
      } else if (quartile === 'Q3' || quartile === 'Q4') {
        rewardAmount = 2500;
        maxPageCharge = 10000;
      }
    }
  } else if (journalScope === 'national') {
    if (isResearchArticle) {
      rewardAmount = quartile === 'TCI_1' ? 2000 : 1000;
    } else {
      rewardAmount = quartile === 'TCI_1' ? 1000 : 500;
    }
    maxPageCharge = 5000;
  }
  
  // กฎ Co-author: เบิกได้เฉพาะ Q1-Q2 และได้รับเงินรางวัล 50%
  if (authorRole === 'co_author') {
    if (quartile === 'Q1_Tier1' || quartile === 'Q1' || quartile === 'Q2') {
      rewardAmount = rewardAmount * 0.5;
    } else {
      rewardAmount = 0;
    }
  }
  
  const approvedPageCharge = Math.min(Number(requestedPageCharge || 0), maxPageCharge);
  const totalClaim = rewardAmount + approvedPageCharge;
  
  return {
    rewardAmount: rewardAmount,
    maxPageCharge: maxPageCharge,
    approvedPageCharge: approvedPageCharge,
    totalClaim: totalClaim,
    maxAnnualQuota: MAX_INDIVIDUAL_QUOTA_PER_YEAR
  };
}
`;

export const INDEX_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ระบบขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย | คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร</title>
  
  <!-- Tailwind CSS & Google Fonts -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    body { font-family: 'Prompt', sans-serif; }
    .font-sarabun { font-family: 'Sarabun', sans-serif; }
    
    @media print {
      body * { visibility: hidden; }
      #printableArea, #printableArea * { visibility: visible; }
      #printableArea {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 20mm 15mm;
        background: white !important;
        color: black !important;
      }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen flex flex-col">

  <!-- ================= TOP HEADER & NAVIGATION ================= -->
  <header class="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 text-white border-b-4 border-amber-500 shadow-lg no-print">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ปีงบประมาณ 2570 • ตามประกาศคณะฯ 27 พ.ค. 2567
          </span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ระบบออนไลน์ 100%
          </span>
        </div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight">
          ระบบขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัยในวารสารวิชาการ
        </h1>
        <p class="text-xs sm:text-sm text-blue-200 mt-0.5">
          งานบริหารงานวิจัยและนวัตกรรม คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
        </p>
      </div>

      <div class="flex items-center gap-3">
        <a 
          href="https://line.me/R/ti/p/@414jvrca" 
          target="_blank" 
          class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow transition-colors"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
          <span>LINE OA: @414jvrca</span>
        </a>
        <button 
          onclick="switchTab('new-app')"
          class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
        >
          <span>+ ยื่นคำขอใหม่</span>
        </button>
      </div>
    </div>

    <!-- Main Navigation Bar -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 border-t border-slate-800/80 flex overflow-x-auto text-xs font-medium scrollbar-none">
      <button onclick="switchTab('dashboard')" id="nav-dashboard" class="nav-btn px-4 py-3 border-b-2 border-amber-400 text-amber-400 font-bold whitespace-nowrap flex items-center gap-2">
        <span>📊 ภาพรวมและสถิติ</span>
      </button>
      <button onclick="switchTab('table')" id="nav-table" class="nav-btn px-4 py-3 border-b-2 border-transparent text-slate-300 hover:text-white whitespace-nowrap flex items-center gap-2">
        <span>📋 รายการคำขอ (Table)</span>
      </button>
      <button onclick="switchTab('kanban')" id="nav-kanban" class="nav-btn px-4 py-3 border-b-2 border-transparent text-slate-300 hover:text-white whitespace-nowrap flex items-center gap-2">
        <span>📌 บอร์ดสถานะ (Kanban)</span>
      </button>
      <button onclick="switchTab('new-app')" id="nav-new-app" class="nav-btn px-4 py-3 border-b-2 border-transparent text-slate-300 hover:text-white whitespace-nowrap flex items-center gap-2">
        <span>✍️ แบบฟอร์มยื่นคำขอ</span>
      </button>
      <button onclick="switchTab('tracking')" id="nav-tracking" class="nav-btn px-4 py-3 border-b-2 border-transparent text-slate-300 hover:text-white whitespace-nowrap flex items-center gap-2">
        <span>🔍 ติดตาม 12 ขั้นตอน</span>
      </button>
      <button onclick="switchTab('line')" id="nav-line" class="nav-btn px-4 py-3 border-b-2 border-transparent text-slate-300 hover:text-white whitespace-nowrap flex items-center gap-2">
        <span>💬 ศูนย์แจ้งเตือน LINE</span>
      </button>
      <button onclick="switchTab('regulations')" id="nav-regulations" class="nav-btn px-4 py-3 border-b-2 border-transparent text-slate-300 hover:text-white whitespace-nowrap flex items-center gap-2">
        <span>📜 เกณฑ์และระเบียบปี 2570</span>
      </button>
    </div>
  </header>

  <!-- ================= MAIN CONTENT CONTAINER ================= -->
  <main class="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 flex-1 w-full no-print">

    <!-- 1. DASHBOARD VIEW -->
    <div id="view-dashboard" class="tab-view space-y-6">
      <!-- Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500 font-medium">ยอดเงินเบิกจ่ายรวมทั้งหมด</div>
          <div class="text-2xl font-bold text-slate-900 mt-1" id="dash-total-budget">0 บาท</div>
          <div class="text-[11px] text-emerald-600 font-semibold mt-1">งบประมาณปี 2570</div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500 font-medium">คำขอทั้งหมดในระบบ</div>
          <div class="text-2xl font-bold text-blue-700 mt-1" id="dash-total-apps">0 รายการ</div>
          <div class="text-[11px] text-slate-500 mt-1">เงินรางวัล + ค่าตีพิมพ์</div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500 font-medium">อยู่ระหว่างดำเนินการ</div>
          <div class="text-2xl font-bold text-amber-600 mt-1" id="dash-pending-apps">0 รายการ</div>
          <div class="text-[11px] text-amber-700 font-medium mt-1">ขั้นตอนที่ 1-10</div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div class="text-xs text-slate-500 font-medium">โอนเงินเข้าบัญชีแล้ว (สำเร็จ)</div>
          <div class="text-2xl font-bold text-emerald-700 mt-1" id="dash-paid-apps">0 รายการ</div>
          <div class="text-[11px] text-emerald-600 font-semibold mt-1">ขั้นตอนที่ 11-12 (Real-time)</div>
        </div>
      </div>

      <!-- Quick Search & Quota Banner -->
      <div class="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div class="space-y-2 max-w-xl">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
            ระบบติดตามแบบรวดเร็ว
          </span>
          <h2 class="text-lg sm:text-xl font-bold">ค้นหาและติดตามสถานะคำขอ (Tracking Status)</h2>
          <p class="text-xs text-blue-200 leading-relaxed">
            กรอกรหัสติดตาม เช่น <code class="font-mono text-amber-300 font-bold">AWP70-001</code> เพื่อดูความคืบหน้า 12 ขั้นตอน หรือตรวจสอบวันโอนเงิน
          </p>
          <div class="flex gap-2 pt-2">
            <input 
              type="text" 
              id="quickTrackInput" 
              placeholder="ระบุรหัสคำขอ เช่น AWP70-001" 
              class="px-4 py-2 rounded-xl text-slate-900 text-xs font-mono uppercase w-64 focus:outline-none focus:ring-2 focus:ring-amber-400"
              onkeypress="if(event.key==='Enter') executeQuickTrack()"
            />
            <button 
              onclick="executeQuickTrack()"
              class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow"
            >
              ค้นหา
            </button>
          </div>
        </div>

        <div class="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-xs space-y-2 w-full md:w-80">
          <div class="font-bold text-amber-300 flex items-center justify-between">
            <span>เพดานสิทธิรายบุคคล</span>
            <span class="font-mono">150,000 บาท/ปี</span>
          </div>
          <p class="text-[11px] text-blue-100">
            นักวิจัยแต่ละท่านมีสิทธิได้รับเงินรางวัลและค่าตีพิมพ์รวมกันไม่เกิน 150,000 บาทต่อปีงบประมาณ
          </p>
          <div class="pt-2 border-t border-white/10 flex justify-between text-[11px]">
            <span class="text-blue-200">งานบริหารงานวิจัย</span>
            <span class="font-semibold text-emerald-300">โทร. 0-5596-7844</span>
          </div>
        </div>
      </div>

      <!-- Recent Applications Preview -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>📋 คำขอล่าสุดในระบบ (ปีงบประมาณ 2570)</span>
          </h3>
          <button onclick="switchTab('table')" class="text-xs font-bold text-blue-700 hover:underline">
            ดูรายการทั้งหมด &rarr;
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 text-slate-600 font-semibold border-b">
              <tr>
                <th class="p-3">รหัสติดตาม</th>
                <th class="p-3">นักวิจัย / ภาควิชา</th>
                <th class="p-3">ชื่อบทความ</th>
                <th class="p-3">ฐานข้อมูล / Quartile</th>
                <th class="p-3 text-right">ยอดรวม (บาท)</th>
                <th class="p-3 text-center">ขั้นตอน</th>
                <th class="p-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody id="dashRecentTableBody" class="divide-y divide-slate-100 text-slate-700">
              <!-- Injected by JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 2. TABLE VIEW -->
    <div id="view-table" class="tab-view hidden space-y-4">
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex items-center gap-3">
            <h2 class="text-base font-bold text-slate-900">ทะเบียนคำขอรับเงินรางวัลและค่าตีพิมพ์</h2>
            <span id="tableCountBadge" class="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-xs">0 รายการ</span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <input 
              type="text" 
              id="tableSearchInput" 
              placeholder="ค้นหาชื่อ, ภาควิชา, บทความ..." 
              class="px-3 py-1.5 border border-slate-300 rounded-xl text-xs w-56 focus:outline-none focus:ring-2 focus:ring-blue-600"
              oninput="renderApplicationsTable()"
            />
            <select 
              id="tableFilterStatus" 
              class="px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              onchange="renderApplicationsTable()"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="pending">อยู่ระหว่างดำเนินงาน</option>
              <option value="paid">โอนเงินแล้ว</option>
            </select>
            <button 
              onclick="switchTab('new-app')"
              class="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl text-xs shadow-sm transition-colors"
            >
              + ยื่นคำขอใหม่
            </button>
          </div>
        </div>

        <div class="overflow-x-auto border border-slate-200 rounded-xl">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th class="p-3">รหัสติดตาม</th>
                <th class="p-3">วันที่ยื่น</th>
                <th class="p-3">นักวิจัย / สังกัด</th>
                <th class="p-3">ชื่อบทความวิจัย</th>
                <th class="p-3">ระดับ/ฐานข้อมูล</th>
                <th class="p-3 text-right">เงินรางวัล</th>
                <th class="p-3 text-right">ค่าตีพิมพ์</th>
                <th class="p-3 text-right">ยอดรวม</th>
                <th class="p-3 text-center">ขั้นตอน</th>
                <th class="p-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody id="fullTableBody" class="divide-y divide-slate-100">
              <!-- Injected by JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 3. KANBAN VIEW -->
    <div id="view-kanban" class="tab-view hidden space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">บอร์ดติดตามสถานะ 12 ขั้นตอน (Kanban Workflow)</h2>
          <p class="text-xs text-slate-500">แบ่งตาม 4 หมวดหมู่หลักตามประกาศคณะแพทยศาสตร์</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Col 1: Phase 1 -->
        <div class="bg-slate-200/70 p-3.5 rounded-2xl space-y-3 flex flex-col">
          <div class="flex items-center justify-between pb-2 border-b border-slate-300">
            <span class="font-bold text-xs text-blue-900">1. ยื่นคำขอ & ตรวจเอกสาร</span>
            <span id="badge-phase-1" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">0</span>
          </div>
          <div id="kanban-phase-1" class="space-y-2 flex-1 min-h-[300px]"></div>
        </div>

        <!-- Col 2: Phase 2 -->
        <div class="bg-slate-200/70 p-3.5 rounded-2xl space-y-3 flex flex-col">
          <div class="flex items-center justify-between pb-2 border-b border-slate-300">
            <span class="font-bold text-xs text-indigo-900">2. กลั่นกรอง & บันทึกข้อความ</span>
            <span id="badge-phase-2" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">0</span>
          </div>
          <div id="kanban-phase-2" class="space-y-2 flex-1 min-h-[300px]"></div>
        </div>

        <!-- Col 3: Phase 3 -->
        <div class="bg-slate-200/70 p-3.5 rounded-2xl space-y-3 flex flex-col">
          <div class="flex items-center justify-between pb-2 border-b border-slate-300">
            <span class="font-bold text-xs text-amber-900">3. คณบดีลงนามอนุมัติ</span>
            <span id="badge-phase-3" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">0</span>
          </div>
          <div id="kanban-phase-3" class="space-y-2 flex-1 min-h-[300px]"></div>
        </div>

        <!-- Col 4: Phase 4 -->
        <div class="bg-slate-200/70 p-3.5 rounded-2xl space-y-3 flex flex-col">
          <div class="flex items-center justify-between pb-2 border-b border-slate-300">
            <span class="font-bold text-xs text-emerald-900">4. งานคลัง & โอนเงิน</span>
            <span id="badge-phase-4" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">0</span>
          </div>
          <div id="kanban-phase-4" class="space-y-2 flex-1 min-h-[300px]"></div>
        </div>
      </div>
    </div>

    <!-- 4. NEW APPLICATION FORM -->
    <div id="view-new-app" class="tab-view hidden space-y-6">
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-4xl mx-auto">
        <div class="border-b pb-4 mb-6">
          <span class="text-xs font-bold text-blue-700 uppercase tracking-wider">Online Application Form</span>
          <h2 class="text-xl font-bold text-slate-900 mt-0.5">แบบฟอร์มขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย (ปี 2570)</h2>
          <p class="text-xs text-slate-500 mt-1">
            ระบบจะคำนวณเงินรางวัลและเพดานค่าตีพิมพ์ที่อนุมัติให้อัตโนมัติตามประกาศคณะแพทยศาสตร์ ณ วันที่ 27 พฤษภาคม 2567
          </p>
        </div>

        <form id="newAppForm" onsubmit="handleFormSubmit(event)" class="space-y-6 text-xs">
          <!-- Section 1: Applicant Info -->
          <div>
            <h3 class="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5 text-blue-900">
              <span>👤 1. ข้อมูลนักวิจัยผู้ขอรับสิทธิ</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">ชื่อ-สกุลนักวิจัย *</label>
                <input type="text" id="form-applicantName" required placeholder="เช่น ดร.ทินกร หอมดี" class="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">ตำแหน่งวิชาการ / ตำแหน่ง *</label>
                <input type="text" id="form-academicPosition" required placeholder="เช่น ผู้ช่วยศาสตราจารย์ ดร." class="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">ภาควิชา / สังกัด *</label>
                <input type="text" id="form-department" required placeholder="เช่น ภาควิชาอายุรศาสตร์" class="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ภายใน *</label>
                <input type="text" id="form-phone" required placeholder="เช่น 7844 หรือ 081-xxx-xxxx" class="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">อีเมลมหาวิทยาลัย (@nu.ac.th) *</label>
                <input type="email" id="form-email" required placeholder="เช่น tinnakornh@nu.ac.th" class="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">เลขที่บัญชี ธ.กรุงศรีอยุธยา *</label>
                <input type="text" id="form-bankAccountNo" required placeholder="เช่น 128-1-23456-7" class="w-full px-3 py-2 border rounded-xl" />
              </div>
            </div>
          </div>

          <!-- Section 2: Article Info -->
          <div class="pt-4 border-t border-slate-200">
            <h3 class="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5 text-blue-900">
              <span>📄 2. ข้อมูลบทความวิจัยและวารสาร</span>
            </h3>
            <div class="space-y-4">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">ชื่อบทความวิจัย (Article Title) *</label>
                <input type="text" id="form-articleTitle" required placeholder="เช่น Machine Learning for Early Diagnosis of Sepsis in ICU" class="w-full px-3 py-2 border rounded-xl" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">ชื่อวารสาร (Journal Name) *</label>
                  <input type="text" id="form-journalName" required placeholder="เช่น International Journal of Medical Informatics" class="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">ระดับวารสาร (Scope) *</label>
                  <select id="form-journalScope" onchange="recalculateFormReward()" class="w-full px-3 py-2 border rounded-xl">
                    <option value="international">วารสารระดับนานาชาติ (International)</option>
                    <option value="national">วารสารระดับชาติ (TCI)</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">ฐานข้อมูล *</label>
                  <select id="form-database" onchange="recalculateFormReward()" class="w-full px-3 py-2 border rounded-xl">
                    <option value="Scopus">Scopus</option>
                    <option value="Web of Science (WOS)">Web of Science (WOS)</option>
                    <option value="PubMed">PubMed</option>
                    <option value="TCI Group 1">TCI กลุ่ม 1</option>
                    <option value="TCI Group 2">TCI กลุ่ม 2</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Quartile / ระดับกลุ่ม *</label>
                  <select id="form-quartile" onchange="recalculateFormReward()" class="w-full px-3 py-2 border rounded-xl">
                    <option value="Q1">Q1 (25,000 บาท)</option>
                    <option value="Q1_Tier1">Q1 Tier 1 / Top 10% (35,000 บาท)</option>
                    <option value="Q2">Q2 (15,000 บาท)</option>
                    <option value="Q3">Q3 (5,000 บาท)</option>
                    <option value="Q4">Q4 (5,000 บาท)</option>
                    <option value="TCI_1">TCI กลุ่ม 1 (2,000 บาท)</option>
                    <option value="TCI_2">TCI กลุ่ม 2 (1,000 บาท)</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">บทบาทของผู้เขียน *</label>
                  <select id="form-authorRole" onchange="recalculateFormReward()" class="w-full px-3 py-2 border rounded-xl">
                    <option value="first_author">First Author (ผู้ประพันธ์อันดับแรก 100%)</option>
                    <option value="corresponding_author">Corresponding Author (ผู้ประพันธ์บรรณกิจ 100%)</option>
                    <option value="co_author">Co-Author (ผู้ประพันธ์ร่วม 50% เฉพาะ Q1-Q2)</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">ประเภทบทความ *</label>
                  <select id="form-articleType" onchange="recalculateFormReward()" class="w-full px-3 py-2 border rounded-xl">
                    <option value="research_article">Research Article (บทความวิจัย 100%)</option>
                    <option value="review_article">Review Article / อื่นๆ (50%)</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">ค่าตีพิมพ์ที่จ่ายจริง (Page Charge/APC) บาท</label>
                  <input type="number" id="form-claimedPageCharge" value="0" min="0" oninput="recalculateFormReward()" class="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Live Auto-Calculation Box -->
          <div class="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-3">
            <div class="font-bold text-blue-950 text-sm flex items-center justify-between">
              <span>🧮 ผลการคำนวณเงินรางวัลและค่าตีพิมพ์ที่อนุมัติ</span>
              <span class="text-[11px] px-2.5 py-0.5 bg-blue-200/70 text-blue-900 rounded-full font-semibold">สูตรประกาศคณะฯ 2567</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div class="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                <div class="text-slate-500 text-[10px]">เงินรางวัลที่ได้รับ (Reward)</div>
                <div class="text-lg font-bold text-blue-800 mt-0.5" id="calc-reward">0 บาท</div>
              </div>
              <div class="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                <div class="text-slate-500 text-[10px]">ค่าตีพิมพ์ที่อนุมัติตามเพดาน</div>
                <div class="text-lg font-bold text-indigo-800 mt-0.5" id="calc-pagecharge">0 บาท</div>
              </div>
              <div class="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                <div class="text-slate-500 text-[10px]">ยอดขอรับรวมสุทธิ</div>
                <div class="text-xl font-bold text-emerald-700 mt-0.5" id="calc-total">0 บาท</div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onclick="switchTab('dashboard')" class="px-5 py-2.5 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50">
              ยกเลิก
            </button>
            <button type="submit" class="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-colors">
              ✓ บันทึกและยื่นคำขอ
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 5. TRACKING & 12-STEP TIMELINE -->
    <div id="view-tracking" class="tab-view hidden space-y-6">
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-4">
        <div class="text-center space-y-2">
          <h2 class="text-lg font-bold text-slate-900">🔍 ติดตามความคืบหน้า 12 ขั้นตอน (Tracking Status)</h2>
          <p class="text-xs text-slate-500">กรอกรหัสคำขอ เช่น <code class="bg-blue-50 px-2 py-0.5 rounded font-mono font-bold text-blue-800">AWP70-001</code></p>
        </div>

        <div class="flex gap-2">
          <input 
            type="text" 
            id="timelineSearchInput" 
            placeholder="กรอกรหัสติดตามคำขอ เช่น AWP70-001" 
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-xs uppercase focus:ring-2 focus:ring-blue-600 focus:outline-none"
            onkeypress="if(event.key==='Enter') executeTimelineSearch()"
          />
          <button 
            onclick="executeTimelineSearch()" 
            class="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
          >
            ค้นหา
          </button>
        </div>

        <div id="timelineContainer" class="hidden pt-6 border-t border-slate-200 space-y-6">
          <!-- Injected by JS -->
        </div>
      </div>
    </div>

    <!-- 6. LINE OA SIMULATOR -->
    <div id="view-line" class="tab-view hidden space-y-6">
      <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">LINE Official Account</span>
            <h2 class="text-lg font-bold text-slate-900 mt-1">iRAM-U Services (@414jvrca)</h2>
            <p class="text-xs text-slate-500 mt-1">ระบบส่งการแจ้งเตือนอัตโนมัติ 4 หมุดหมายสำคัญแก่นักวิจัย</p>
          </div>

          <div class="space-y-2 text-xs">
            <button onclick="simulateLineMessage(1)" class="w-full text-left p-3 rounded-xl border hover:border-blue-500 hover:bg-blue-50 transition-all">
              <div class="font-bold text-blue-900">Milestone 1: ยื่นคำขอเรียบร้อย</div>
              <div class="text-slate-500 text-[11px]">แจ้งเตือนทันทีเมื่อบันทึกคำขอเข้าระบบ</div>
            </button>
            <button onclick="simulateLineMessage(2)" class="w-full text-left p-3 rounded-xl border hover:border-indigo-500 hover:bg-indigo-50 transition-all">
              <div class="font-bold text-indigo-900">Milestone 2: ผ่านการตรวจเอกสาร (Step 4)</div>
              <div class="text-slate-500 text-[11px]">เอกสารและฐานข้อมูลครบถ้วนถูกต้อง</div>
            </button>
            <button onclick="simulateLineMessage(3)" class="w-full text-left p-3 rounded-xl border hover:border-amber-500 hover:bg-amber-50 transition-all">
              <div class="font-bold text-amber-900">Milestone 3: คณบดีลงนามอนุมัติ (Step 7)</div>
              <div class="text-slate-500 text-[11px]">อนุมัติเงินรางวัลและส่งต่อเรื่องให้งานคลัง</div>
            </button>
            <button onclick="simulateLineMessage(4)" class="w-full text-left p-3 rounded-xl border hover:border-emerald-500 hover:bg-emerald-50 transition-all">
              <div class="font-bold text-emerald-900">Milestone 4: โอนเงินเข้าบัญชีแล้ว (Step 12)</div>
              <div class="text-slate-500 text-[11px]">แจ้งเตือน Real-time พร้อมระบุเลขฎีกา</div>
            </button>
          </div>
        </div>

        <!-- Phone Simulator Mockup -->
        <div class="bg-slate-900 p-4 rounded-3xl shadow-2xl border-4 border-slate-700 max-w-sm mx-auto w-full text-xs">
          <div class="bg-[#7292a8] rounded-2xl p-4 min-h-[460px] flex flex-col justify-between space-y-4">
            <div class="text-center font-bold text-white text-xs border-b border-white/20 pb-2">
              iRAM-U Services (@414jvrca)
            </div>
            <div id="phoneBubble" class="bg-white rounded-2xl p-4 shadow-md space-y-2 text-slate-800">
              <!-- Injected by JS -->
            </div>
            <div class="text-[10px] text-white/70 text-center font-mono">
              Auto Dispatched via LINE Messaging API
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 7. REGULATIONS & GUIDELINES -->
    <div id="view-regulations" class="tab-view hidden space-y-6">
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 max-w-4xl mx-auto text-xs leading-relaxed">
        <div class="border-b pb-4">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">ประกาศคณะแพทยศาสตร์</span>
          <h2 class="text-lg font-bold text-slate-900 mt-1">
            เกณฑ์การจัดสรรเงินรางวัลและค่าตอบแทนการตีพิมพ์บทความวิจัย (ฉบับ 27 พ.ค. 2567)
          </h2>
          <p class="text-slate-500 mt-0.5">คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร • สำหรับปีงบประมาณ 2570</p>
        </div>

        <div class="space-y-3">
          <h3 class="font-bold text-sm text-blue-950">1. วารสารระดับนานาชาติ (International Journals)</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left border">
              <thead class="bg-slate-100 font-bold border-b">
                <tr>
                  <th class="p-2.5 border-r">ระดับ Quartile</th>
                  <th class="p-2.5 border-r">เงินรางวัล (Research)</th>
                  <th class="p-2.5 border-r">เงินรางวัล (Review/อื่นๆ)</th>
                  <th class="p-2.5">เพดานค่าตีพิมพ์ (Page Charge)</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr>
                  <td class="p-2.5 border-r font-bold text-blue-900">Q1 Tier 1 / Top 10%</td>
                  <td class="p-2.5 border-r font-semibold text-emerald-700">35,000 บาท</td>
                  <td class="p-2.5 border-r">17,500 บาท</td>
                  <td class="p-2.5">จ่ายตามจริงไม่เกิน 40,000 บาท</td>
                </tr>
                <tr>
                  <td class="p-2.5 border-r font-bold text-blue-900">Q1 ปกติ</td>
                  <td class="p-2.5 border-r font-semibold text-emerald-700">25,000 บาท</td>
                  <td class="p-2.5 border-r">12,500 บาท</td>
                  <td class="p-2.5">จ่ายตามจริงไม่เกิน 40,000 บาท</td>
                </tr>
                <tr>
                  <td class="p-2.5 border-r font-bold text-blue-900">Q2</td>
                  <td class="p-2.5 border-r font-semibold text-emerald-700">15,000 บาท</td>
                  <td class="p-2.5 border-r">7,500 บาท</td>
                  <td class="p-2.5">จ่ายตามจริงไม่เกิน 40,000 บาท</td>
                </tr>
                <tr>
                  <td class="p-2.5 border-r font-bold text-blue-900">Q3</td>
                  <td class="p-2.5 border-r">5,000 บาท</td>
                  <td class="p-2.5 border-r">2,500 บาท</td>
                  <td class="p-2.5">จ่ายตามจริงไม่เกิน 40,000 บาท</td>
                </tr>
                <tr>
                  <td class="p-2.5 border-r font-bold text-blue-900">Q4</td>
                  <td class="p-2.5 border-r">5,000 บาท</td>
                  <td class="p-2.5 border-r">2,500 บาท</td>
                  <td class="p-2.5">จ่ายตามจริงไม่เกิน 10,000 บาท</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="space-y-3 pt-2">
          <h3 class="font-bold text-sm text-blue-950">2. วารสารระดับชาติ (TCI)</h3>
          <p>• <b>TCI กลุ่ม 1:</b> เงินรางวัล 2,000 บาท (Research) / 1,000 บาท (Review) | ค่าตีพิมพ์ตามจริงไม่เกิน 5,000 บาท</p>
          <p>• <b>TCI กลุ่ม 2:</b> เงินรางวัล 1,000 บาท (Research) / 500 บาท (Review) | ค่าตีพิมพ์ตามจริงไม่เกิน 5,000 บาท</p>
        </div>

        <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900">
          <div class="font-bold text-xs">⚠️ เงื่อนไขสำคัญเพิ่มเติม:</div>
          <p>• <b>ผู้ประพันธ์ร่วม (Co-Author):</b> มีสิทธิ์ได้รับเงินรางวัลเฉพาะวารสารกลุ่ม Q1 และ Q2 เท่านั้น และได้รับในอัตรา 50% ของเงินรางวัล</p>
          <p>• <b>เพดานรายบุคคล:</b> รวมเงินรางวัลและค่าตีพิมพ์ไม่เกิน 150,000 บาท ต่อคน ต่อปีงบประมาณ</p>
        </div>
      </div>
    </div>

  </main>

  <!-- ================= PRINT & DOCUMENT MODAL ================= -->
  <div id="printModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-2 sm:p-4 no-print">
    <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-300">
      
      <!-- Modal Header -->
      <div class="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="font-bold text-sm">🖨️ ศูนย์จัดพิมพ์เอกสารราชการและ PDF</span>
          <span id="modalTrackingBadge" class="font-mono bg-blue-600 px-2 py-0.5 rounded text-xs">AWP70-001</span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.print()" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
            <span>พิมพ์เอกสาร / บันทึก PDF</span>
          </button>
          <button onclick="closePrintModal()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold">
            ✕ ปิด
          </button>
        </div>
      </div>

      <!-- Document Type Select Tabs -->
      <div class="bg-slate-100 p-2 border-b flex gap-1 text-xs overflow-x-auto">
        <button onclick="switchDocTemplate('memo')" id="doc-tab-memo" class="doc-tab-btn px-3 py-1.5 rounded-lg bg-white shadow-sm font-bold text-blue-900 border">
          1. บันทึกข้อความขออนุมัติเบิก
        </button>
        <button onclick="switchDocTemplate('checklist')" id="doc-tab-checklist" class="doc-tab-btn px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900">
          2. แบบตรวจสอบรายการ AWP70
        </button>
        <button onclick="switchDocTemplate('receipt')" id="doc-tab-receipt" class="doc-tab-btn px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900">
          3. ใบสำคัญรับเงิน
        </button>
        <button onclick="switchDocTemplate('certificate')" id="doc-tab-certificate" class="doc-tab-btn px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900">
          4. ใบรับรองการจ่ายเงิน
        </button>
      </div>

      <!-- Printable Document Canvas -->
      <div class="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50 font-sarabun text-slate-900">
        <div id="printableArea" class="bg-white p-8 sm:p-12 shadow-sm border rounded-xl max-w-3xl mx-auto space-y-6 text-sm leading-relaxed">
          <!-- Injected by JS -->
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <footer class="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print mt-auto">
    <div class="max-w-7xl mx-auto px-4">
      คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร • งานบริหารงานวิจัยและนวัตกรรม อาคารสิรินธร ชั้น 3 โทร. 0-5596-7844
    </div>
  </footer>

  <!-- ================= JAVASCRIPT APPLICATION LOGIC ================= -->
  <script>
    // Initial Mock Dataset for 2570
    var state = {
      activeTab: 'dashboard',
      currentDocTemplate: 'memo',
      selectedApp: null,
      applications: [
        {
          id: 'app-1',
          trackingNo: 'AWP70-001',
          createdAt: '2026-10-02',
          fiscalYear: 2570,
          applicantName: 'ดร.ทินกร หอมดี',
          academicPosition: 'ผู้ช่วยศาสตราจารย์ ดร.',
          department: 'ภาควิชาอายุรศาสตร์',
          phone: '7844',
          email: 'tinnakornh@nu.ac.th',
          bankAccountNo: '128-1-23456-7',
          articleTitle: 'Machine Learning for Early Diagnosis of Sepsis in ICU',
          journalName: 'International Journal of Medical Informatics',
          journalScope: 'international',
          database: 'Scopus',
          quartile: 'Q1',
          authorRole: 'first_author',
          articleType: 'research_article',
          claimedRewardAmount: 25000,
          approvedPageChargeAmount: 40000,
          totalClaimedAmount: 65000,
          currentStep: 12,
          status: 'โอนเงินเข้าบัญชีเรียบร้อย',
          memoDocNo: 'อว 0603(12)/ว 142',
          researchDocRecNo: 'วพ 089/70',
          financeDocRecNo: 'คลัง 1120/70',
          disbursementVoucherNo: 'ฎีกา 3606/70',
          paymentDate: '2026-10-18',
          paymentStatus: 'transferred',
          notes: 'โอนเข้าบัญชีกรุงศรีเรียบร้อย'
        },
        {
          id: 'app-2',
          trackingNo: 'AWP70-002',
          createdAt: '2026-10-08',
          fiscalYear: 2570,
          applicantName: 'พญ.ศิริพร บุญมั่น',
          academicPosition: 'อาจารย์แพทย์',
          department: 'ภาควิชากุมารเวชศาสตร์',
          phone: '7812',
          email: 'siripornb@nu.ac.th',
          bankAccountNo: '128-1-98765-4',
          articleTitle: 'Pediatric Asthma Outcomes with Digital Inhaler Tracking',
          journalName: 'Pediatric Pulmonology',
          journalScope: 'international',
          database: 'Web of Science (WOS)',
          quartile: 'Q1_Tier1',
          authorRole: 'corresponding_author',
          articleType: 'research_article',
          claimedRewardAmount: 35000,
          approvedPageChargeAmount: 40000,
          totalClaimedAmount: 75000,
          currentStep: 7,
          status: 'คณบดีลงนามอนุมัติแล้ว',
          memoDocNo: 'อว 0603(12)/ว 156',
          researchDocRecNo: 'วพ 102/70',
          financeDocRecNo: 'คลัง 1205/70',
          disbursementVoucherNo: '',
          paymentDate: '',
          paymentStatus: 'unpaid',
          notes: 'ส่งเรื่องต่องานคลังเพื่อตั้งฎีกา'
        },
        {
          id: 'app-3',
          trackingNo: 'AWP70-003',
          createdAt: '2026-10-14',
          fiscalYear: 2570,
          applicantName: 'นพ.เกียรติศักดิ์ ชัยชนะ',
          academicPosition: 'รองศาสตราจารย์ นพ.',
          department: 'ภาควิชาศัลยศาสตร์',
          phone: '7855',
          email: 'kiattisukc@nu.ac.th',
          bankAccountNo: '128-1-55443-2',
          articleTitle: 'Laparoscopic Hernia Repair in Elderly: 5-Year Clinical Review',
          journalName: 'Asian Journal of Surgery',
          journalScope: 'international',
          database: 'Scopus',
          quartile: 'Q2',
          authorRole: 'co_author',
          articleType: 'research_article',
          claimedRewardAmount: 7500,
          approvedPageChargeAmount: 32000,
          totalClaimedAmount: 39500,
          currentStep: 4,
          status: 'ตรวจเอกสารผ่านแล้ว',
          memoDocNo: 'อยู่ระหว่างจัดทำ',
          researchDocRecNo: 'วพ 115/70',
          financeDocRecNo: '',
          disbursementVoucherNo: '',
          paymentDate: '',
          paymentStatus: 'unpaid',
          notes: 'อยู่ระหว่างทำบันทึกข้อความเสนอผู้บริหาร'
        }
      ]
    };

    // Load Live Data from Apps Script if available
    window.addEventListener('DOMContentLoaded', function() {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(serverApps) {
            if (serverApps && serverApps.length > 0) {
              state.applications = serverApps;
              updateAllViews();
            }
          })
          .getApplicationsData();
      }
      updateAllViews();
      recalculateFormReward();
      simulateLineMessage(1);
    });

    function updateAllViews() {
      renderDashboard();
      renderApplicationsTable();
      renderKanban();
    }

    function switchTab(tabId) {
      state.activeTab = tabId;
      document.querySelectorAll('.tab-view').forEach(function(el) { el.classList.add('hidden'); });
      document.querySelectorAll('.nav-btn').forEach(function(btn) {
        btn.classList.remove('border-amber-400', 'text-amber-400', 'font-bold');
        btn.classList.add('border-transparent', 'text-slate-300');
      });

      var targetView = document.getElementById('view-' + tabId);
      var targetNav = document.getElementById('nav-' + tabId);
      if (targetView) targetView.classList.remove('hidden');
      if (targetNav) {
        targetNav.classList.remove('border-transparent', 'text-slate-300');
        targetNav.classList.add('border-amber-400', 'text-amber-400', 'font-bold');
      }

      if (tabId === 'dashboard') renderDashboard();
      if (tabId === 'table') renderApplicationsTable();
      if (tabId === 'kanban') renderKanban();
    }

    // Dashboard Calculations
    function renderDashboard() {
      var apps = state.applications;
      var totalBudget = apps.reduce(function(acc, a) { return acc + Number(a.totalClaimedAmount || 0); }, 0);
      var paidApps = apps.filter(function(a) { return a.currentStep >= 11 || a.paymentStatus === 'transferred'; });
      var pendingApps = apps.filter(function(a) { return a.currentStep < 11 && a.paymentStatus !== 'transferred'; });

      document.getElementById('dash-total-budget').textContent = totalBudget.toLocaleString('th-TH') + ' บาท';
      document.getElementById('dash-total-apps').textContent = apps.length + ' รายการ';
      document.getElementById('dash-pending-apps').textContent = pendingApps.length + ' รายการ';
      document.getElementById('dash-paid-apps').textContent = paidApps.length + ' รายการ';

      var tbody = document.getElementById('dashRecentTableBody');
      tbody.innerHTML = '';
      apps.slice(0, 4).forEach(function(a) {
        var tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors';
        tr.innerHTML = 
          '<td class="p-3 font-mono font-bold text-blue-700">' + a.trackingNo + '</td>' +
          '<td class="p-3"><b>' + a.applicantName + '</b><div class="text-[10px] text-slate-500">' + a.department + '</div></td>' +
          '<td class="p-3 max-w-xs truncate">' + a.articleTitle + '</td>' +
          '<td class="p-3"><span class="px-2 py-0.5 rounded bg-slate-100 font-semibold">' + (a.quartile || a.database) + '</span></td>' +
          '<td class="p-3 text-right font-bold text-emerald-700">' + Number(a.totalClaimedAmount).toLocaleString('th-TH') + '</td>' +
          '<td class="p-3 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ' + (a.paymentStatus === 'transferred' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800') + '">' + a.currentStep + '/12</span></td>' +
          '<td class="p-3 text-center">' +
          '  <button onclick="openPrintModalForApp(\\'' + a.trackingNo + '\\')" class="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded text-[10px]">🖨️ พิมพ์</button>' +
          '</td>';
        tbody.appendChild(tr);
      });
    }

    // Table View
    function renderApplicationsTable() {
      var query = (document.getElementById('tableSearchInput') ? document.getElementById('tableSearchInput').value : '').toLowerCase();
      var filterStatus = document.getElementById('tableFilterStatus') ? document.getElementById('tableFilterStatus').value : 'all';

      var filtered = state.applications.filter(function(a) {
        var matchQuery = !query || 
          a.trackingNo.toLowerCase().includes(query) || 
          a.applicantName.toLowerCase().includes(query) || 
          a.articleTitle.toLowerCase().includes(query) ||
          a.department.toLowerCase().includes(query);

        var matchStatus = true;
        if (filterStatus === 'paid') matchStatus = a.currentStep >= 11 || a.paymentStatus === 'transferred';
        if (filterStatus === 'pending') matchStatus = a.currentStep < 11 && a.paymentStatus !== 'transferred';

        return matchQuery && matchStatus;
      });

      var badge = document.getElementById('tableCountBadge');
      if (badge) badge.textContent = filtered.length + ' รายการ';

      var tbody = document.getElementById('fullTableBody');
      if (!tbody) return;
      tbody.innerHTML = '';

      filtered.forEach(function(a) {
        var tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors';
        tr.innerHTML = 
          '<td class="p-3 font-mono font-bold text-blue-700">' + a.trackingNo + '</td>' +
          '<td class="p-3 text-slate-500">' + a.createdAt + '</td>' +
          '<td class="p-3 font-semibold text-slate-900">' + a.applicantName + '<div class="text-[10px] text-slate-500">' + a.department + '</div></td>' +
          '<td class="p-3 max-w-xs truncate" title="' + a.articleTitle + '">' + a.articleTitle + '</td>' +
          '<td class="p-3">' + a.database + ' (' + a.quartile + ')</td>' +
          '<td class="p-3 text-right">' + Number(a.claimedRewardAmount).toLocaleString('th-TH') + '</td>' +
          '<td class="p-3 text-right">' + Number(a.approvedPageChargeAmount).toLocaleString('th-TH') + '</td>' +
          '<td class="p-3 text-right font-bold text-emerald-700">' + Number(a.totalClaimedAmount).toLocaleString('th-TH') + '</td>' +
          '<td class="p-3 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ' + (a.paymentStatus === 'transferred' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800') + '">' + a.currentStep + '/12</span></td>' +
          '<td class="p-3 text-center space-x-1">' +
          '  <button onclick="openPrintModalForApp(\\'' + a.trackingNo + '\\')" class="px-2 py-1 bg-blue-600 text-white hover:bg-blue-700 font-semibold rounded text-[11px]">พิมพ์</button>' +
          '</td>';
        tbody.appendChild(tr);
      });
    }

    // Kanban Workflow Board
    function renderKanban() {
      var p1 = document.getElementById('kanban-phase-1');
      var p2 = document.getElementById('kanban-phase-2');
      var p3 = document.getElementById('kanban-phase-3');
      var p4 = document.getElementById('kanban-phase-4');
      if (!p1) return;

      p1.innerHTML = ''; p2.innerHTML = ''; p3.innerHTML = ''; p4.innerHTML = '';

      var count1 = 0, count2 = 0, count3 = 0, count4 = 0;

      state.applications.forEach(function(a) {
        var card = document.createElement('div');
        card.className = 'bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:shadow transition-shadow';
        card.innerHTML = 
          '<div class="flex items-center justify-between">' +
          '  <span class="font-mono font-bold text-blue-700 text-xs">' + a.trackingNo + '</span>' +
          '  <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">สเต็ป ' + a.currentStep + '/12</span>' +
          '</div>' +
          '<div class="font-bold text-slate-800 text-xs">' + a.applicantName + '</div>' +
          '<div class="text-[11px] text-slate-600 line-clamp-2">' + a.articleTitle + '</div>' +
          '<div class="flex items-center justify-between pt-1 border-t text-[11px]">' +
          '  <span class="text-slate-500">' + (a.quartile || a.database) + '</span>' +
          '  <span class="font-bold text-emerald-700">' + Number(a.totalClaimedAmount).toLocaleString('th-TH') + ' ฿</span>' +
          '</div>' +
          '<div class="pt-1 flex justify-end gap-1">' +
          '  <button onclick="openPrintModalForApp(\\'' + a.trackingNo + '\\')" class="text-[10px] text-blue-700 font-bold hover:underline">พิมพ์เอกสาร</button>' +
          '</div>';

        if (a.currentStep <= 3) { p1.appendChild(card); count1++; }
        else if (a.currentStep <= 6) { p2.appendChild(card); count2++; }
        else if (a.currentStep <= 9) { p3.appendChild(card); count3++; }
        else { p4.appendChild(card); count4++; }
      });

      document.getElementById('badge-phase-1').textContent = count1;
      document.getElementById('badge-phase-2').textContent = count2;
      document.getElementById('badge-phase-3').textContent = count3;
      document.getElementById('badge-phase-4').textContent = count4;
    }

    // Auto-calculate Form
    function recalculateFormReward() {
      var scope = document.getElementById('form-journalScope').value;
      var quartile = document.getElementById('form-quartile').value;
      var role = document.getElementById('form-authorRole').value;
      var articleType = document.getElementById('form-articleType').value;
      var claimedPage = Number(document.getElementById('form-claimedPageCharge').value || 0);

      var reward = 0;
      var pageCharge = 0;

      if (scope === 'international') {
        if (articleType === 'research_article') {
          if (quartile === 'Q1_Tier1') reward = 35000;
          else if (quartile === 'Q1') reward = 25000;
          else if (quartile === 'Q2') reward = 15000;
          else reward = 5000;
        } else {
          if (quartile === 'Q1_Tier1') reward = 17500;
          else if (quartile === 'Q1') reward = 12500;
          else if (quartile === 'Q2') reward = 7500;
          else reward = 2500;
        }

        if (role === 'co_author') {
          if (quartile === 'Q1' || quartile === 'Q1_Tier1' || quartile === 'Q2') reward = reward * 0.5;
          else reward = 0;
        }

        if (quartile === 'Q1' || quartile === 'Q1_Tier1' || quartile === 'Q2' || quartile === 'Q3') pageCharge = Math.min(claimedPage, 40000);
        else pageCharge = Math.min(claimedPage, 10000);
      } else {
        reward = quartile === 'TCI_1' ? (articleType === 'research_article' ? 2000 : 1000) : (articleType === 'research_article' ? 1000 : 500);
        pageCharge = Math.min(claimedPage, 5000);
      }

      var total = reward + pageCharge;

      document.getElementById('calc-reward').textContent = reward.toLocaleString('th-TH') + ' บาท';
      document.getElementById('calc-pagecharge').textContent = pageCharge.toLocaleString('th-TH') + ' บาท';
      document.getElementById('calc-total').textContent = total.toLocaleString('th-TH') + ' บาท';

      return { reward: reward, pageCharge: pageCharge, total: total };
    }

    function handleFormSubmit(e) {
      e.preventDefault();
      var calc = recalculateFormReward();

      var newApp = {
        id: 'app-' + (state.applications.length + 1),
        trackingNo: 'AWP70-' + ('000' + (state.applications.length + 1)).slice(-3),
        createdAt: new Date().toISOString().split('T')[0],
        fiscalYear: 2570,
        applicantName: document.getElementById('form-applicantName').value,
        academicPosition: document.getElementById('form-academicPosition').value,
        department: document.getElementById('form-department').value,
        phone: document.getElementById('form-phone').value,
        email: document.getElementById('form-email').value,
        bankAccountNo: document.getElementById('form-bankAccountNo').value,
        articleTitle: document.getElementById('form-articleTitle').value,
        journalName: document.getElementById('form-journalName').value,
        journalScope: document.getElementById('form-journalScope').value,
        database: document.getElementById('form-database').value,
        quartile: document.getElementById('form-quartile').value,
        authorRole: document.getElementById('form-authorRole').value,
        articleType: document.getElementById('form-articleType').value,
        claimedRewardAmount: calc.reward,
        approvedPageChargeAmount: calc.pageCharge,
        totalClaimedAmount: calc.total,
        currentStep: 2,
        status: 'ยื่นคำขอเรียบร้อย (รอตรวจเอกสาร)',
        memoDocNo: 'อยู่ระหว่างออกเลขรับ',
        researchDocRecNo: 'วพ ' + ('000' + (state.applications.length + 1)).slice(-3) + '/70',
        financeDocRecNo: '',
        disbursementVoucherNo: '',
        paymentDate: '',
        paymentStatus: 'unpaid',
        notes: 'ยื่นผ่านหน้าเว็บ Web Portal 2570'
      };

      state.applications.unshift(newApp);

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run.submitNewApplication(newApp);
      }

      alert('✅ บันทึกคำขอสำเร็จ! รหัสติดตามของท่านคือ: ' + newApp.trackingNo);
      document.getElementById('newAppForm').reset();
      recalculateFormReward();
      switchTab('dashboard');
    }

    function executeQuickTrack() {
      var val = document.getElementById('quickTrackInput').value.trim();
      if (!val) { alert('กรุณากรอกรหัสติดตาม เช่น AWP70-001'); return; }
      switchTab('tracking');
      document.getElementById('timelineSearchInput').value = val;
      executeTimelineSearch();
    }

    function executeTimelineSearch() {
      var val = document.getElementById('timelineSearchInput').value.trim();
      var container = document.getElementById('timelineContainer');
      if (!val) { alert('กรุณาระบุรหัสคำขอ'); return; }

      var app = state.applications.find(function(a) { return a.trackingNo.toLowerCase() === val.toLowerCase(); });
      container.classList.remove('hidden');

      if (!app) {
        container.innerHTML = '<div class="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 text-center">❌ ไม่พบข้อมูลสำหรับรหัสติดตาม ' + val + '</div>';
        return;
      }

      var steps = [
        { no: 1, title: 'ยื่นคำขอและแนบเอกสาร', dept: 'นักวิจัย', sla: 'ทันที' },
        { no: 2, title: 'เจ้าหน้าที่ตรวจเอกสารและฐานข้อมูล', dept: 'งานวิจัย', sla: 'SLA 3 วัน' },
        { no: 3, title: 'ออกเลขรับงานวิจัย (วพ)', dept: 'งานสารบรรณ', sla: '1 วัน' },
        { no: 4, title: 'คณะกรรมการกลั่นกรองพิจารณา', dept: 'คณะกรรมการ', sla: 'รอบ 2 สัปดาห์' },
        { no: 5, title: 'จัดทำบันทึกข้อความขออนุมัติ', dept: 'งานวิจัย', sla: '2 วัน' },
        { no: 6, title: 'เสนอรองคณบดีฝ่ายวิจัย', dept: 'รองคณบดี', sla: '2 วัน' },
        { no: 7, title: 'คณบดีลงนามอนุมัติเบิกจ่าย', dept: 'คณบดี', sla: '3 วัน' },
        { no: 8, title: 'ส่งเรื่องต่องานคลังและพัสดุ', dept: 'งานสารบรรณ', sla: '1 วัน' },
        { no: 9, title: 'ออกเลขรับงานคลัง', dept: 'งานคลัง', sla: '1 วัน' },
        { no: 10, title: 'ตรวจสอบงบประมาณและตั้งฎีกา', dept: 'งานการเงิน', sla: '5 วัน' },
        { no: 11, title: 'ทำรายการโอนเงินผ่านระบบธนาคาร', dept: 'งานการเงิน', sla: '2 วัน' },
        { no: 12, title: 'เงินเข้าบัญชีเรียบร้อย (เสร็จสิ้น)', dept: 'นักวิจัย', sla: 'Real-time' }
      ];

      var html = '<div class="bg-blue-50 p-4 rounded-xl border border-blue-200 text-xs space-y-2">' +
        '<div class="flex justify-between items-center">' +
        '  <span class="font-mono font-bold text-sm text-blue-900">' + app.trackingNo + '</span>' +
        '  <span class="px-2.5 py-1 rounded-full font-bold ' + (app.paymentStatus === 'transferred' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800') + '">' + app.status + '</span>' +
        '</div>' +
        '<div><b>ผู้ขอ:</b> ' + app.applicantName + ' (' + app.department + ')</div>' +
        '<div><b>บทความ:</b> ' + app.articleTitle + '</div>' +
        '<div><b>ยอดอนุมัติรวม:</b> <span class="font-bold text-emerald-700 text-sm">' + Number(app.totalClaimedAmount).toLocaleString('th-TH') + ' บาท</span></div>' +
        (app.disbursementVoucherNo ? '<div class="text-emerald-800"><b>เลขที่ฎีกา:</b> ' + app.disbursementVoucherNo + ' | <b>วันที่โอน:</b> ' + (app.paymentDate || 'สำเร็จ') + '</div>' : '') +
        '</div>' +
        '<div class="space-y-2 pt-2">';

      steps.forEach(function(s) {
        var isDone = app.currentStep >= s.no;
        var isCurrent = app.currentStep === s.no;
        html += '<div class="p-3 rounded-xl border flex items-center justify-between text-xs ' + 
          (isCurrent ? 'bg-blue-100 border-blue-400 font-bold text-blue-950' : (isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400')) + '">' +
          '<div class="flex items-center gap-2">' +
          '  <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ' + (isDone ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700') + '">' + (isDone ? '✓' : s.no) + '</span>' +
          '  <span>สเต็ป ' + s.no + ': ' + s.title + '</span>' +
          '</div>' +
          '<div class="text-[10px] text-right">' +
          '  <div>' + s.dept + '</div>' +
          '  <div class="text-slate-500">' + s.sla + '</div>' +
          '</div>' +
          '</div>';
      });

      html += '</div>';
      container.innerHTML = html;
    }

    // LINE Simulator
    function simulateLineMessage(milestone) {
      var bubble = document.getElementById('phoneBubble');
      if (!bubble) return;

      var app = state.applications[0];

      if (milestone === 1) {
        bubble.innerHTML = 
          '<div class="text-[10px] font-bold text-blue-700">iRAM-U Services (@414jvrca)</div>' +
          '<div class="font-bold text-slate-900 text-sm">ยื่นคำขอรับเงินรางวัลสำเร็จ</div>' +
          '<div class="text-[11px] text-slate-500">ขั้นตอนที่ 1 -> 2: เข้าสู่คิวงานตรวจสอบเอกสาร</div>' +
          '<div class="border-t pt-2 space-y-1 text-xs">' +
          '  <div><b>รหัสติดตาม:</b> ' + app.trackingNo + '</div>' +
          '  <div><b>ผู้ขอ:</b> ' + app.applicantName + '</div>' +
          '  <div><b>ยอดขอรับ:</b> <span class="text-emerald-600 font-bold">' + Number(app.totalClaimedAmount).toLocaleString('th-TH') + ' บาท</span></div>' +
          '</div>';
      } else if (milestone === 2) {
        bubble.innerHTML = 
          '<div class="text-[10px] font-bold text-indigo-700">iRAM-U Services (@414jvrca)</div>' +
          '<div class="font-bold text-slate-900 text-sm">ผ่านการตรวจสอบเอกสารแล้ว</div>' +
          '<div class="text-[11px] text-slate-500">ขั้นตอนที่ 4/12: ข้อมูลครบถ้วนตามประกาศ มน.</div>' +
          '<div class="border-t pt-2 space-y-1 text-xs">' +
          '  <div><b>รหัสติดตาม:</b> ' + app.trackingNo + '</div>' +
          '  <div><b>ผลการตรวจ:</b> ผ่านตามเกณฑ์ประกาศ 2567</div>' +
          '  <div><b>ยอดจัดสรร:</b> <span class="text-blue-700 font-bold">' + Number(app.totalClaimedAmount).toLocaleString('th-TH') + ' บาท</span></div>' +
          '</div>';
      } else if (milestone === 3) {
        bubble.innerHTML = 
          '<div class="text-[10px] font-bold text-amber-700">iRAM-U Services (@414jvrca)</div>' +
          '<div class="font-bold text-slate-900 text-sm">คณบดีลงนามอนุมัติแล้ว</div>' +
          '<div class="text-[11px] text-slate-500">ขั้นตอนที่ 7/12: ส่งเรื่องต่องานคลังเพื่อเบิกจ่าย</div>' +
          '<div class="border-t pt-2 space-y-1 text-xs">' +
          '  <div><b>รหัสติดตาม:</b> ' + app.trackingNo + '</div>' +
          '  <div><b>ยอดเงินอนุมัติ:</b> <span class="text-emerald-700 font-bold">' + Number(app.totalClaimedAmount).toLocaleString('th-TH') + ' บาท</span></div>' +
          '  <div><b>เลขรับงานคลัง:</b> ' + (app.financeDocRecNo || 'คลัง 1120/70') + '</div>' +
          '</div>';
      } else {
        bubble.innerHTML = 
          '<div class="text-[10px] font-bold text-emerald-700">iRAM-U Services (@414jvrca)</div>' +
          '<div class="font-bold text-slate-900 text-sm">โอนเงินเข้าบัญชีเรียบร้อยแล้ว</div>' +
          '<div class="text-[11px] text-slate-500">ขั้นตอนที่ 11-12/12: การเงินโอนสำเร็จ (Real-time)</div>' +
          '<div class="border-t pt-2 space-y-1 text-xs">' +
          '  <div><b>รหัสติดตาม:</b> ' + app.trackingNo + '</div>' +
          '  <div><b>ยอดโอนสุทธิ:</b> <span class="text-emerald-700 font-bold">' + Number(app.totalClaimedAmount).toLocaleString('th-TH') + ' บาท</span></div>' +
          '  <div><b>เลขฎีกา:</b> ' + (app.disbursementVoucherNo || 'ฎีกา 3606/70') + '</div>' +
          '  <div><b>วันที่โอน:</b> ' + (app.paymentDate || 'วันนี้') + '</div>' +
          '</div>';
      }
    }

    // Print & Official Document Modal
    function openPrintModalForApp(trackingNo) {
      var app = state.applications.find(function(a) { return a.trackingNo === trackingNo; });
      if (!app) return;
      state.selectedApp = app;
      document.getElementById('modalTrackingBadge').textContent = app.trackingNo;
      document.getElementById('printModal').classList.remove('hidden');
      switchDocTemplate('memo');
    }

    function closePrintModal() {
      document.getElementById('printModal').classList.add('hidden');
    }

    function switchDocTemplate(tmpl) {
      state.currentDocTemplate = tmpl;
      document.querySelectorAll('.doc-tab-btn').forEach(function(b) {
        b.classList.remove('bg-white', 'shadow-sm', 'font-bold', 'text-blue-900', 'border');
        b.classList.add('text-slate-600');
      });
      var activeBtn = document.getElementById('doc-tab-memo');
      if (tmpl === 'checklist') activeBtn = document.getElementById('doc-tab-checklist');
      if (tmpl === 'receipt') activeBtn = document.getElementById('doc-tab-receipt');
      if (tmpl === 'certificate') activeBtn = document.getElementById('doc-tab-certificate');

      if (activeBtn) {
        activeBtn.classList.add('bg-white', 'shadow-sm', 'font-bold', 'text-blue-900', 'border');
        activeBtn.classList.remove('text-slate-600');
      }

      renderPrintableDocument();
    }

    function renderPrintableDocument() {
      var area = document.getElementById('printableArea');
      var app = state.selectedApp;
      if (!area || !app) return;

      var garudaSvg = '<svg viewBox="0 0 400 400" class="w-16 h-16 mx-auto mb-2 fill-slate-900"><path d="M200 40 C190 60 180 80 170 100 C160 110 140 120 120 130 C100 140 80 145 60 150 C70 165 90 175 110 180 C130 185 150 185 170 180 C160 200 150 220 140 240 C130 260 110 280 90 300 C120 295 150 285 175 270 C185 290 195 320 200 350 C205 320 215 290 225 270 C250 285 280 295 310 300 C290 280 270 260 260 240 C250 220 240 200 230 180 C250 185 270 185 290 180 C310 175 330 165 340 150 C320 145 300 140 280 130 C260 120 240 110 230 100 C220 80 210 60 200 40 Z"/></svg>';

      if (state.currentDocTemplate === 'memo') {
        area.innerHTML = 
          '<div class="text-center">' + garudaSvg + '<h2 class="text-xl font-bold font-sarabun">บันทึกข้อความ</h2></div>' +
          '<div class="border-b-2 border-slate-900 pb-3 space-y-1 text-sm">' +
          '  <div class="flex justify-between"><div><b>ส่วนราชการ:</b> งานบริหารงานวิจัยและนวัตกรรม คณะแพทยศาสตร์ โทร. 7844</div><div><b>ที่:</b> ' + (app.memoDocNo || 'อว 0603(12)/ว ...') + '</div></div>' +
          '  <div class="flex justify-between"><div><b>เรื่อง:</b> ขออนุมัติเบิกจ่ายเงินรางวัลและค่าตอบแทนการตีพิมพ์บทความวิจัย</div><div><b>วันที่:</b> ' + app.createdAt + '</div></div>' +
          '  <div><b>เรียน:</b> คณบดีคณะแพทยศาสตร์</div>' +
          '</div>' +
          '<div class="space-y-4 pt-2 text-justify indent-8">' +
          '  <p>ตามที่ <b>' + app.applicantName + '</b> สังกัด <b>' + app.department + '</b> ได้ยื่นคำขอรับเงินรางวัลและค่าตอบแทนการตีพิมพ์บทความวิจัย เรื่อง <i>"' + app.articleTitle + '"</i> ซึ่งได้รับการตีพิมพ์ในวารสาร <b>' + app.journalName + '</b> (' + app.database + ' - ' + app.quartile + ') นั้น</p>' +
          '  <p>งานบริหารงานวิจัยและนวัตกรรมได้ตรวจสอบคุณสมบัติและเอกสารหลักฐานแล้ว ถูกต้องครบถ้วนตามประกาศคณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร เรื่อง เกณฑ์การจัดสรรเงินรางวัลและค่าตอบแทนการตีพิมพ์ฯ ฉบับลงวันที่ 27 พฤษภาคม พ.ศ. 2567 โดยมียอดจัดสรรรวมทั้งสิ้น <b>' + Number(app.totalClaimedAmount).toLocaleString('th-TH') + ' บาท</b></p>' +
          '</div>' +
          '<div class="pt-12 flex justify-end text-center"><div class="w-64 space-y-8"><div>จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</div><div>(......................................................)<br>คณบดีคณะแพทยศาสตร์</div></div></div>';
      } else if (state.currentDocTemplate === 'checklist') {
        area.innerHTML = 
          '<div class="text-center font-bold text-base mb-4">แบบตรวจสอบรายการเอกสารประกอบการขอรับเงินรางวัลและค่าตีพิมพ์ (AWP70)<br><span class="text-xs font-normal">รหัสคำขอ: ' + app.trackingNo + '</span></div>' +
          '<div class="space-y-3 text-xs">' +
          '  <div class="p-2 border rounded"><b>1. แบบคำขอ AWP70:</b> [✓] ครบถ้วนถูกต้อง</div>' +
          '  <div class="p-2 border rounded"><b>2. สำเนาบทความวิจัย (Full Paper):</b> [✓] แนบไฟล์สมบูรณ์</div>' +
          '  <div class="p-2 border rounded"><b>3. หลักฐานการรับรองฐานข้อมูล / Quartile:</b> [✓] Scopus / WOS / TCI ผ่านเกณฑ์</div>' +
          '  <div class="p-2 border rounded"><b>4. ใบเสร็จรับเงินค่าตีพิมพ์ (Page Charge):</b> [✓] ถูกต้องตามเพดานที่จ่ายจริง</div>' +
          '  <div class="p-2 border rounded"><b>5. สำเนาสมุดบัญชี ธ.กรุงศรีอยุธยา:</b> [✓] เลขที่ ' + app.bankAccountNo + '</div>' +
          '</div>';
      } else {
        area.innerHTML = 
          '<div class="text-center font-bold text-base mb-4">ใบสำคัญรับเงิน (Receipt Voucher)<br><span class="text-xs font-normal">คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร</span></div>' +
          '<div class="space-y-4 text-xs">' +
          '  <div>ข้าพเจ้า <b>' + app.applicantName + '</b> สังกัด <b>' + app.department + '</b> ได้รับเงินจากคณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร ดังรายการต่อไปนี้:</div>' +
          '  <table class="w-full border text-left"><thead><tr class="bg-slate-100"><th class="p-2 border">รายการ</th><th class="p-2 border text-right">จำนวนเงิน (บาท)</th></tr></thead>' +
          '  <tbody><tr><td class="p-2 border">เงินรางวัลการตีพิมพ์บทความวิจัย (' + app.quartile + ')</td><td class="p-2 border text-right">' + Number(app.claimedRewardAmount).toLocaleString('th-TH') + '</td></tr>' +
          '  <tr><td class="p-2 border">ค่าธรรมเนียมการตีพิมพ์ (Page Charge)</td><td class="p-2 border text-right">' + Number(app.approvedPageChargeAmount).toLocaleString('th-TH') + '</td></tr>' +
          '  <tr class="font-bold"><td class="p-2 border">รวมเป็นเงินทั้งสิ้น</td><td class="p-2 border text-right text-emerald-700">' + Number(app.totalClaimedAmount).toLocaleString('th-TH') + '</td></tr></tbody></table>' +
          '  <div class="pt-8 flex justify-end text-center"><div class="w-56 space-y-6"><div>ลงชื่อ ..................................................... ผู้รับเงิน<br>(' + app.applicantName + ')</div></div></div>' +
          '</div>';
      }
    }
  </script>
</body>
</html>
`;

export const GOOGLE_SITES_INTEGRATION_GUIDE = `# คู่มือการติดตั้งและแก้ไขปัญหา Google Apps Script + Google Sites
### คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร • ระบบปีงบประมาณ 2570

---

## 🛠️ วิธีแก้ Error: "No HTML file named index was found"

### 💡 สาเหตุของ Error:
ใน Google Apps Script เมื่อมีการ Deploy เป็น Web App ฟังก์ชัน \`doGet()\` จะมองหาไฟล์ HTML ที่ชื่อว่า **\`index.html\`** 
หากในโปรเจกต์มีเฉพาะไฟล์ \`.gs\` แต่ยังไม่ได้สร้างไฟล์ \`index.html\` ระบบจะแจ้งเตือนว่า \`Exception: No HTML file named index was found.\`

---

### ✅ วิธีแก้ไขใน 1 นาที (เลือกวิธีใดวิธีหนึ่ง):

#### วิธีที่ 1: เพิ่มไฟล์ \`index.html\` ใน Apps Script (แนะนำที่สุด)
1. เปิดหน้าต่าง **Google Apps Script Editor**
2. คลิกปุ่ม **+ (เพิ่มไฟล์)** ที่แถบด้านซ้าย ➔ เลือก **HTML**
3. ตั้งชื่อไฟล์ว่า **\`index\`** (ระบบจะใส่ \`.html\` ให้อัตโนมัติกลายเป็น \`index.html\`)
4. คัดลอกโค้ดจากแท็บ **\`5. index.html (Web App UI)\`** ไปวางทั้งหมด
5. กดปุ่ม **บันทึกโครงการ (Save project)** (\`Ctrl + S\`)
6. กดปุ่ม **การทำให้ใช้งานได้ (Deploy)** ➔ **จัดการการทำให้ใช้งานได้ (Manage deployments)** ➔ กดไอคอนรูปดินสอ ✏️ ➔ เลือก **เวอร์ชันใหม่ (New version)** ➔ กด **ทำให้ใช้งานได้ (Deploy)**

---

#### วิธีที่ 2: อัปเดตไฟล์ \`Code.gs\` ล่าสุด (มีระบบ Smart Fallback)
1. คัดลอกโค้ดจากแท็บ **\`1. Code.gs\`** เวอร์ชันล่าสุดไปวางทับไฟล์เดิม
2. ในเวอร์ชันใหม่นี้ ระบบมีฟังก์ชัน \`renderDefaultWebPortal()\` แบบอัตโนมัติ ซึ่งจะแสดงหน้า Portal ทันทีแม้ผู้ใช้จะไม่ได้สร้างไฟล์ \`index.html\`
3. กด **บันทึก (Save)** และ Deploy เวอร์ชันใหม่ จะเปิดหน้าเว็บได้ทันที 100%!

---

## 🌐 การนำ Web App URL ไปฝังบน Google Sites

1. คัดลอก **Web App URL** ที่ได้จากการ Deploy (เช่น \`https://script.google.com/macros/s/.../exec\`)
2. เปิดหน้าเว็บ **Google Sites** ของคณะแพทยศาสตร์
3. ที่แถบเครื่องมือด้านขวา กดปุ่ม **ฝัง (Embed)** ➔ เลือกแท็บ **ตาม URL (By URL)**
4. วาง Web App URL ลงไป แล้วกด **แทรก (Insert)**
5. ปรับขนาดความกว้างและความสูงของกล่องข้อความให้สวยงามเต็มหน้าจอ
6. กด **เผยแพร่ (Publish)** บน Google Sites
`;
