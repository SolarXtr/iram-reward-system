import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { NuDisbursementRecord, ResearchApplication } from '../types';
import { parseNuDisbursementExcel, ParseResult } from '../services/nuExcelImportService';

interface NuImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  facultyApps: ResearchApplication[];
  onImportSuccess: (importedRecords: NuDisbursementRecord[]) => void;
}

export const NuImportModal: React.FC<NuImportModalProps> = ({
  isOpen,
  onClose,
  facultyApps,
  onImportSuccess,
}) => {
  if (!isOpen) return null;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setErrorMsg(null);

    try {
      const res = await parseNuDisbursementExcel(file, facultyApps);
      setParseResult(res);
    } catch (err: any) {
      console.error('Failed to parse excel:', err);
      setErrorMsg(err.message || 'ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบว่าเป็นไฟล์จากระบบ มน. (.xlsx)');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.records.length === 0) return;
    onImportSuccess(parseResult.records);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-prompt">
                นำเข้าข้อมูลการเบิกจ่ายจากระบบ ม.นเรศวร (.xlsx)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                รองรับไฟล์ ASPxGridView1.xlsx ที่ดาวน์โหลดจากระบบบริหารโครงการวิจัย มน.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-amber-500 transition-colors bg-slate-50/50">
            <input
              type="file"
              id="nu-excel-upload"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="nu-excel-upload" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 font-prompt block">
                {selectedFile ? selectedFile.name : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่'}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                ไฟล์ Excel (.xlsx) ที่ Export มาจากระบบเบิกจ่าย มน. (เช่น ASPxGridView1.xlsx)
              </span>
            </label>
          </div>

          {/* Loading */}
          {isParsing && (
            <div className="p-4 bg-slate-50 rounded-xl text-center flex items-center justify-center gap-2 text-xs text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>กำลังตรวจสอบและอ่านข้อมูลในไฟล์ Excel...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parse Result Summary */}
          {parseResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-lg font-bold text-emerald-800 block">
                    {parseResult.totalParsed} รายการ
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    อ่านข้อมูลคำขอ มน. พบ
                  </span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-lg font-bold text-blue-800 block">
                    {parseResult.matchedCount} รายการ
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">
                    ตรงกับคำขอของคณะแพทยศาสตร์
                  </span>
                </div>
              </div>

              {/* Preview Table snippet */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">นักวิจัย</th>
                      <th className="p-2">ชื่อบทความ</th>
                      <th className="p-2">สถานะ</th>
                      <th className="p-2 text-right">เชื่อมกับคณะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parseResult.records.slice(0, 5).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-medium text-slate-800 truncate max-w-[120px]">{r.researcherName}</td>
                        <td className="p-2 text-slate-600 truncate max-w-[200px]">{r.articleTitle}</td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800">
                            {r.status}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          {r.matchedFacultyTrackingNo ? (
                            <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                              {r.matchedFacultyTrackingNo}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parseResult.records.length > 5 && (
                <div className="text-[10px] text-slate-400 text-center">
                  และอีก {parseResult.records.length - 5} รายการ...
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium text-xs cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={!parseResult || parseResult.records.length === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 rounded-lg transition-colors font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer ${
                parseResult && parseResult.records.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ยืนยันนำเข้า {parseResult?.totalParsed || 0} รายการ</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
