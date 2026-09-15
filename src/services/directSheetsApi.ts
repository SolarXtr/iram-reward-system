import { ResearchApplication } from '../types';

const STORAGE_SPREADSHEET_ID_KEY = 'direct_google_spreadsheet_id';
const STORAGE_SPREADSHEET_NAME_KEY = 'direct_google_spreadsheet_name';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export const getStoredDirectSpreadsheetId = (): string => {
  return localStorage.getItem(STORAGE_SPREADSHEET_ID_KEY) || '';
};

export const setStoredDirectSpreadsheetId = (id: string, name?: string): void => {
  if (!id) {
    localStorage.removeItem(STORAGE_SPREADSHEET_ID_KEY);
    localStorage.removeItem(STORAGE_SPREADSHEET_NAME_KEY);
  } else {
    localStorage.setItem(STORAGE_SPREADSHEET_ID_KEY, id.trim());
    if (name) {
      localStorage.setItem(STORAGE_SPREADSHEET_NAME_KEY, name.trim());
    }
  }
};

export const getStoredDirectSpreadsheetName = (): string => {
  return localStorage.getItem(STORAGE_SPREADSHEET_NAME_KEY) || 'ฐานข้อมูลเงินรางวัลและค่าตีพิมพ์ Med NU';
};

/**
 * 1. List existing Google Spreadsheets in user's Google Drive
 */
export const listUserSpreadsheets = async (accessToken: string): Promise<DriveSpreadsheetFile[]> => {
  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=20`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to fetch files (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('listUserSpreadsheets error:', error);
    throw error;
  }
};

/**
 * 2. Create a standardized Med NU Research Reward Google Spreadsheet directly in user's Drive
 */
export const createRewardSpreadsheet = async (
  accessToken: string, 
  customTitle?: string
): Promise<{ id: string; url: string; name: string }> => {
  const title = customTitle || `MED-NU-Research-Rewards-${new Date().getFullYear() + 543}`;
  
  const payload = {
    properties: {
      title,
      locale: 'th_TH',
      timeZone: 'Asia/Bangkok'
    },
    sheets: [
      {
        properties: {
          title: 'DATA_APPLICATIONS',
          gridProperties: {
            frozenRowCount: 1
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'TrackingNo' } },
                  { userEnteredValue: { stringValue: 'FiscalYear' } },
                  { userEnteredValue: { stringValue: 'SubmitDate' } },
                  { userEnteredValue: { stringValue: 'ApplicantName' } },
                  { userEnteredValue: { stringValue: 'Position' } },
                  { userEnteredValue: { stringValue: 'Department' } },
                  { userEnteredValue: { stringValue: 'Phone' } },
                  { userEnteredValue: { stringValue: 'Email' } },
                  { userEnteredValue: { stringValue: 'BankAccount' } },
                  { userEnteredValue: { stringValue: 'IDCardNo' } },
                  { userEnteredValue: { stringValue: 'RequestType' } },
                  { userEnteredValue: { stringValue: 'ArticleTitle' } },
                  { userEnteredValue: { stringValue: 'JournalName' } },
                  { userEnteredValue: { stringValue: 'Scope' } },
                  { userEnteredValue: { stringValue: 'Database' } },
                  { userEnteredValue: { stringValue: 'Quartile' } },
                  { userEnteredValue: { stringValue: 'AuthorRole' } },
                  { userEnteredValue: { stringValue: 'ArticleType' } },
                  { userEnteredValue: { stringValue: 'TotalClaimed' } },
                  { userEnteredValue: { stringValue: 'CurrentStep' } },
                  { userEnteredValue: { stringValue: 'Status' } },
                  { userEnteredValue: { stringValue: 'DocNo' } },
                  { userEnteredValue: { stringValue: 'RecNo' } },
                  { userEnteredValue: { stringValue: 'FinanceRecNo' } },
                  { userEnteredValue: { stringValue: 'VoucherNo' } },
                  { userEnteredValue: { stringValue: 'PaymentDate' } },
                  { userEnteredValue: { stringValue: 'PaymentStatus' } },
                  { userEnteredValue: { stringValue: 'SlipUrl' } },
                  { userEnteredValue: { stringValue: 'StaffNotes' } }
                ]
              }
            ]
          }
        ]
      },
      {
        properties: {
          title: 'TIMELINE_LOGS',
          gridProperties: {
            frozenRowCount: 1
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Timestamp' } },
                  { userEnteredValue: { stringValue: 'TrackingNo' } },
                  { userEnteredValue: { stringValue: 'Step' } },
                  { userEnteredValue: { stringValue: 'Status' } },
                  { userEnteredValue: { stringValue: 'Officer' } },
                  { userEnteredValue: { stringValue: 'Notes' } }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Create spreadsheet failed (${res.status})`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl;

  // Format header row style
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: data.sheets[0].properties.sheetId,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.12, green: 0.16, blue: 0.24 }, // slate-800
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          }
        ]
      })
    });
  } catch (styleErr) {
    console.warn('Styling header row error (non-fatal):', styleErr);
  }

  return {
    id: spreadsheetId,
    url: spreadsheetUrl,
    name: title
  };
};

/**
 * 3. Append application row directly to DATA_APPLICATIONS tab
 */
export const appendApplicationDirect = async (
  accessToken: string,
  spreadsheetId: string,
  app: ResearchApplication
): Promise<boolean> => {
  const row = [
    app.trackingNo || '',
    app.fiscalYear || 2570,
    app.createdAt || new Date().toISOString().split('T')[0],
    app.applicantName || '',
    app.academicPosition || '',
    app.department || '',
    app.phone || '',
    app.email || '',
    app.bankAccountNo || '',
    app.idCardNo || '',
    app.requestType || '',
    app.articleTitle || '',
    app.journalName || '',
    app.journalScope || 'international',
    app.database || 'Scopus',
    app.quartile || 'Q1',
    app.authorRole || 'first_author',
    app.articleType || 'research_article',
    app.totalClaimedAmount || 0,
    app.currentStep || 2,
    app.status || 'submitted',
    app.internalDocNo || app.memoDocNo || '',
    app.researchDocRecNo || '',
    app.financeDocRecNo || '',
    app.disbursementVoucherNo || '',
    app.paymentDate || '',
    app.paymentStatus || 'unpaid',
    app.paymentTransferSlipUrl || '',
    app.coordinatorNotes || app.staffNotes || ''
  ];

  const range = encodeURIComponent('DATA_APPLICATIONS!A1');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Append failed (${res.status})`);
  }

  // Also log timeline creation
  await logTimelineDirect(
    accessToken,
    spreadsheetId,
    app.trackingNo,
    app.currentStep || 2,
    app.status || 'submitted',
    app.applicantName,
    'ยื่นคำขอรับการสนับสนุนผ่านระบบ MED-NU Research Portal'
  ).catch(e => console.warn('Timeline log error:', e));

  return true;
};

/**
 * 4. Update existing application status and step directly in DATA_APPLICATIONS
 */
export const updateApplicationDirect = async (
  accessToken: string,
  spreadsheetId: string,
  trackingNo: string,
  updates: {
    nextStep?: number;
    status?: string;
    notes?: string;
    voucherNo?: string;
    paymentDate?: string;
    paymentStatus?: string;
  }
): Promise<boolean> => {
  // Read existing data to find row index
  const getRange = encodeURIComponent('DATA_APPLICATIONS!A1:AZ500');
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${getRange}`;

  const readRes = await fetch(readUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!readRes.ok) {
    throw new Error(`Failed to read spreadsheet (${readRes.status})`);
  }

  const readData = await readRes.json();
  const rows: any[][] = readData.values || [];

  let targetRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === trackingNo) {
      targetRowIndex = i + 1; // 1-indexed in Google Sheets
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error(`ไม่พบรหัสติดตาม ${trackingNo} ในชีต DATA_APPLICATIONS`);
  }

  // Row columns:
  // Col T (col 20): CurrentStep
  // Col U (col 21): Status
  // Col Y (col 25): VoucherNo
  // Col Z (col 26): PaymentDate
  // Col AA (col 27): PaymentStatus
  // Col AC (col 29): StaffNotes

  const currentRow = rows[targetRowIndex - 1] || [];
  const updatedRow = [...currentRow];
  while (updatedRow.length < 29) updatedRow.push('');

  if (updates.nextStep !== undefined) updatedRow[19] = updates.nextStep;
  if (updates.status !== undefined) updatedRow[20] = updates.status;
  if (updates.voucherNo !== undefined) updatedRow[24] = updates.voucherNo;
  if (updates.paymentDate !== undefined) updatedRow[25] = updates.paymentDate;
  if (updates.paymentStatus !== undefined) updatedRow[26] = updates.paymentStatus;
  if (updates.notes !== undefined) updatedRow[28] = updates.notes;

  const writeRange = encodeURIComponent(`DATA_APPLICATIONS!A${targetRowIndex}:AC${targetRowIndex}`);
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`;

  const writeRes = await fetch(writeUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [updatedRow]
    })
  });

  if (!writeRes.ok) {
    const err = await writeRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Update row failed (${writeRes.status})`);
  }

  return true;
};

/**
 * 5. Log action in TIMELINE_LOGS
 */
export const logTimelineDirect = async (
  accessToken: string,
  spreadsheetId: string,
  trackingNo: string,
  step: number,
  status: string,
  officer: string,
  notes: string
): Promise<boolean> => {
  const row = [
    new Date().toLocaleString('th-TH'),
    trackingNo,
    step,
    status,
    officer || 'Officer',
    notes || ''
  ];

  const range = encodeURIComponent('TIMELINE_LOGS!A1');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });

  return true;
};

/**
 * 6. Read all applications from DATA_APPLICATIONS tab
 */
export const fetchApplicationsDirect = async (
  accessToken: string,
  spreadsheetId: string
): Promise<ResearchApplication[]> => {
  const range = encodeURIComponent('DATA_APPLICATIONS!A2:AC500');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Read applications failed (${res.status})`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  return rows.map((row, idx) => ({
    id: `remote-${row[0] || idx}`,
    trackingNo: row[0] || `AWP-UNKNOWN-${idx}`,
    fiscalYear: Number(row[1]) || 2570,
    createdAt: row[2] || new Date().toISOString().split('T')[0],
    updatedAt: row[2] || new Date().toISOString().split('T')[0],
    applicantName: row[3] || '',
    academicPosition: row[4] || '',
    department: row[5] || '',
    phone: row[6] || '',
    email: row[7] || '',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: row[8] || '',
    idCardNo: row[9] || '',
    requestType: (row[10] as any) || 'both',
    articleTitle: row[11] || '',
    journalName: row[12] || '',
    journalScope: (row[13] as any) || 'international',
    database: (row[14] as any) || 'Scopus',
    quartile: (row[15] as any) || 'Q1',
    authorRole: (row[16] as any) || 'first_author',
    articleType: (row[17] as any) || 'research_article',
    publishedDate: row[2] || new Date().toISOString().split('T')[0],
    totalClaimedAmount: Number(row[18]) || 0,
    claimedRewardAmount: Number(row[18]) || 0,
    claimedPageChargeAmount: 0,
    approvedPageChargeAmount: 0,
    within24Months: true,
    notForGraduation: true,
    medNuAffiliationDeclared: true,
    currentStep: (Number(row[19]) || 2) as any,
    status: (row[20] as any) || 'submitted',
    internalDocNo: row[21] || '',
    memoDocNo: row[21] || '',
    researchDocRecNo: row[22] || '',
    financeDocRecNo: row[23] || '',
    disbursementVoucherNo: row[24] || '',
    paymentDate: row[25] || '',
    paymentStatus: (row[26] as any) || 'unpaid',
    paymentTransferSlipUrl: row[27] || '',
    coordinatorNotes: row[28] || '',
    staffNotes: row[28] || '',
    attachments: [],
    lineNotified: false,
    calendarSynced: false,
    timeline: []
  }));
};
