import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  HelpCircle, 
  Save, 
  ShieldCheck, 
  Copy,
  Zap,
  Check,
  PlusCircle,
  FolderOpen,
  LogOut,
  Sparkles
} from 'lucide-react';
import { 
  getStoredAppsScriptUrl, 
  saveStoredAppsScriptUrl, 
  testAppsScriptConnection,
  fetchApplicationsFromGoogleSheets
} from '../services/googleSheetsService';
import { 
  googleSignIn, 
  googleLogout, 
  getAccessToken, 
  auth,
  setCachedAccessToken 
} from '../services/googleAuth';
import {
  getStoredDirectSpreadsheetId,
  setStoredDirectSpreadsheetId,
  getStoredDirectSpreadsheetName,
  listUserSpreadsheets,
  createRewardSpreadsheet,
  fetchApplicationsDirect,
  DriveSpreadsheetFile
} from '../services/directSheetsApi';
import { User } from 'firebase/auth';

interface GoogleSheetsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncData?: (data: any[]) => void;
}

export const GoogleSheetsSettingsModal: React.FC<GoogleSheetsSettingsModalProps> = ({
  isOpen,
  onClose,
  onSyncData
}) => {
  // Mode tabs
  const [activeTab, setActiveTab] = useState<'direct_oauth' | 'webhook' | 'guide'>('direct_oauth');

  // OAuth Google State
  const [googleUser, setGoogleUser] = useState<User | null>(auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Direct Sheets State
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [spreadsheetName, setSpreadsheetName] = useState('');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isListingSheets, setIsListingSheets] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [directSyncResult, setDirectSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isDirectSyncing, setIsDirectSyncing] = useState(false);

  // Webhook State
  const [url, setUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load Webhook URL
      const storedUrl = getStoredAppsScriptUrl();
      setUrl(storedUrl);

      // Load Direct Spreadsheet ID
      const storedId = getStoredDirectSpreadsheetId();
      const storedName = getStoredDirectSpreadsheetName();
      setSpreadsheetId(storedId);
      setSpreadsheetName(storedName);

      // Check current user
      setGoogleUser(auth.currentUser);
      setTestResult(null);
      setSyncResult(null);
      setDirectSyncResult(null);
      setSavedSuccess(false);

      if (auth.currentUser) {
        loadDriveSpreadsheets();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Google Sign-In with official workspace scopes
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        await loadDriveSpreadsheets(result.accessToken);
      }
    } catch (err: any) {
      setAuthError(err.message || 'การเข้าสู่ระบบด้วย Google ไม่สำเร็จ');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    setDriveFiles([]);
  };

  const loadDriveSpreadsheets = async (tokenOverride?: string) => {
    try {
      setIsListingSheets(true);
      const token = tokenOverride || await getAccessToken();
      if (!token) return;
      const files = await listUserSpreadsheets(token);
      setDriveFiles(files);
    } catch (err) {
      console.warn('Cannot list spreadsheets:', err);
    } finally {
      setIsListingSheets(false);
    }
  };

  // Create standardized spreadsheet in user's Drive (with explicit confirmation as required by policy)
  const handleCreateNewSheet = async () => {
    const confirmCreate = window.confirm(
      'ระบบจะทำการสร้าง Google Spreadsheet เล่มใหม่ชื่อ "MED-NU-Research-Rewards-2570" ใน Google Drive ของคุณโดยอัตโนมัติ พร้อมตั้งค่าหัวตารางและระบบ Log ให้ทันที คุณต้องการดำเนินการต่อหรือไม่?'
    );
    if (!confirmCreate) return;

    try {
      setIsCreatingSheet(true);
      const token = await getAccessToken();
      if (!token) {
        throw new Error('กรุณาลงชื่อเข้าใช้ด้วย Google Account ก่อน');
      }

      const newSheet = await createRewardSpreadsheet(token);
      setSpreadsheetId(newSheet.id);
      setSpreadsheetName(newSheet.name);
      setStoredDirectSpreadsheetId(newSheet.id, newSheet.name);
      setDirectSyncResult({
        success: true,
        message: `สร้าง Google Sheet "${newSheet.name}" ใน Google Drive ของคุณเรียบร้อยแล้ว!`
      });
      loadDriveSpreadsheets(token);
    } catch (err: any) {
      setDirectSyncResult({
        success: false,
        message: err.message || 'สร้าง Google Sheet ไม่สำเร็จ'
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Select existing sheet from Drive
  const handleSelectDriveFile = (file: DriveSpreadsheetFile) => {
    setSpreadsheetId(file.id);
    setSpreadsheetName(file.name);
    setStoredDirectSpreadsheetId(file.id, file.name);
    setDirectSyncResult({
      success: true,
      message: `เลือกเชื่อมต่อกับ Google Sheet: "${file.name}" เรียบร้อยแล้ว`
    });
  };

  // Direct sync from Google Sheets API
  const handleDirectSync = async () => {
    if (!spreadsheetId) {
      setDirectSyncResult({
        success: false,
        message: 'กรุณาเลือกหรือสร้าง Google Sheet ก่อนทำการซิงก์'
      });
      return;
    }

    try {
      setIsDirectSyncing(true);
      setDirectSyncResult(null);
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Session หมดอายุ กรุณาลงชื่อเข้าใช้ Google อีกครั้ง');
      }

      const apps = await fetchApplicationsDirect(token, spreadsheetId);
      if (apps.length === 0) {
        setDirectSyncResult({
          success: true,
          message: 'เชื่อมต่อสำเร็จ แต่ยังไม่มีรายการข้อมูลในชีต DATA_APPLICATIONS'
        });
      } else {
        if (onSyncData) {
          onSyncData(apps);
        }
        setDirectSyncResult({
          success: true,
          message: `ซิงก์ข้อมูลจาก Google Sheets สำเร็จ (${apps.length} รายการ)`
        });
      }
    } catch (err: any) {
      setDirectSyncResult({
        success: false,
        message: err.message || 'ไม่สามารถอ่านข้อมูลจาก Google Sheet ได้'
      });
    } finally {
      setIsDirectSyncing(false);
    }
  };

  // Save Webhook URL
  const handleSaveWebhook = () => {
    saveStoredAppsScriptUrl(url);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestWebhook = async () => {
    if (!url.trim()) {
      setTestResult({
        success: false,
        message: 'กรุณากรอก Google Apps Script Web App URL ก่อนทดสอบ'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    const result = await testAppsScriptConnection(url.trim());
    setIsTesting(false);
    setTestResult(result);
    if (result.success) {
      saveStoredAppsScriptUrl(url.trim());
    }
  };

  const handleSyncFromWebhook = async () => {
    if (!url.trim()) {
      setSyncResult({
        success: false,
        message: 'กรุณากรอกและบันทึก Web App URL ก่อนซิงก์ข้อมูล'
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);
    try {
      const data = await fetchApplicationsFromGoogleSheets(url.trim());
      if (data && Array.isArray(data) && data.length > 0) {
        if (onSyncData) {
          onSyncData(data);
        }
        setSyncResult({
          success: true,
          message: `ซิงก์ข้อมูลสำเร็จ ดึงรายการคำขอมาได้ ${data.length} รายการ`
        });
      } else {
        setSyncResult({
          success: true,
          message: 'เชื่อมต่อสำเร็จ แต่ยังไม่พบข้อมูลคำขอในชีต'
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'การซิงก์ข้อมูลล้มเหลว กรุณาตรวจสอบสิทธิ์การเข้าถึง Web App'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                ตั้งค่าเชื่อมต่อ Google Sheets API
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal border border-emerald-500/30">
                  Google Workspace
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ระบบจัดการฐานข้อมูลเงินรางวัลและค่าตีพิมพ์ คณะแพทยศาสตร์ ม.นเรศวร
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('direct_oauth')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'direct_oauth'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Drive & Sheets API (แนะนำ)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'webhook'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Apps Script Web App URL</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            <span>คำแนะนำและโครงสร้างชีต</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: Google OAuth Direct Integration */}
          {activeTab === 'direct_oauth' && (
            <div className="space-y-5">
              
              {/* Google Account Authentication Section */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                      {googleUser?.photoURL ? (
                        <img 
                          src={googleUser.photoURL} 
                          alt="Google Avatar" 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {googleUser ? (googleUser.displayName || googleUser.email) : 'บัญชี Google Workspace'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {googleUser ? googleUser.email : 'ลงชื่อเข้าใช้ด้วยบัญชี @nu.ac.th เพื่อจัดการชีตโดยตรง'}
                      </p>
                    </div>
                  </div>

                  {googleUser ? (
                    <button
                      onClick={handleGoogleLogout}
                      className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>ออกจากระบบ</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isSigningIn}
                      className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 shadow-xs transition-all text-xs active:scale-95 disabled:opacity-60"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>{isSigningIn ? 'กำลังเชื่อมต่อ...' : 'Sign in with Google'}</span>
                    </button>
                  )}
                </div>

                {authError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>

              {/* Active Spreadsheet Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Google Spreadsheet ที่กำลังเชื่อมต่อ</span>
                  </label>
                  {spreadsheetId && (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <span>เปิดชีตใน Google Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {spreadsheetId ? (
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{spreadsheetName || 'ฐานข้อมูลเงินรางวัล MED NU'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ID: {spreadsheetId}
                      </div>
                    </div>
                    <button
                      onClick={handleDirectSync}
                      disabled={isDirectSyncing}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDirectSyncing ? 'animate-spin' : ''}`} />
                      <span>{isDirectSyncing ? 'กำลังซิงก์...' : 'ซิงก์ดึงข้อมูล'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center space-y-3 bg-slate-50">
                    <p className="text-xs text-slate-600">
                      ยังไม่ได้ระบุ Google Spreadsheet สำหรับรับข้อมูลเงินรางวัล
                    </p>
                    {googleUser ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={handleCreateNewSheet}
                          disabled={isCreatingSheet}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-60"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{isCreatingSheet ? 'กำลังสร้างชีต...' : 'สร้าง Google Sheet ใหม่ใน Drive ทันที'}</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        กรุณากด Sign in with Google ด้านบนเพื่อสร้างหรือเลือกชีตจากไดรฟ์ของคุณ
                      </p>
                    )}
                  </div>
                )}

                {/* Status Message */}
                {directSyncResult && (
                  <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                    directSyncResult.success 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {directSyncResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{directSyncResult.message}</span>
                  </div>
                )}
              </div>

              {/* Spreadsheets from user's Drive */}
              {googleUser && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span>Google Spreadsheets ใน Google Drive ของคุณ</span>
                    </span>
                    <button
                      onClick={() => loadDriveSpreadsheets()}
                      disabled={isListingSheets}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isListingSheets ? 'animate-spin' : ''}`} />
                      <span>รีเฟรช</span>
                    </button>
                  </div>

                  {driveFiles.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                      {driveFiles.map((file) => (
                        <div 
                          key={file.id} 
                          className={`p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                            spreadsheetId === file.id ? 'bg-emerald-50/70 font-semibold' : ''
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="text-slate-800 truncate">{file.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{file.id}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {spreadsheetId === file.id ? (
                              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-medium">
                                เชื่อมต่ออยู่
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectDriveFile(file)}
                                className="px-2 py-0.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded text-[10px] transition-colors"
                              >
                                เลือกชีตนี้
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg text-center text-[11px] text-slate-500">
                      {isListingSheets ? 'กำลังค้นหาชีตใน Google Drive...' : 'ไม่พบไฟล์ Spreadsheet หรือยังไม่ได้สร้างชีต'}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: Google Apps Script Web App URL */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>การเชื่อมต่อผ่าน Web App Endpoint (Apps Script)</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  เหมาะสำหรับกรณีต้องการให้ฟอร์มส่งข้อมูลผ่าน Webhook โดยตรงไปยัง Google Apps Script ที่ Deploy ไว้ในฐานะ Web App
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Google Apps Script Web App URL <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={isTesting || !url.trim()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบ'}</span>
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {testResult && (
                <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  testResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSyncFromWebhook}
                  disabled={isSyncing || !url.trim()}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'กำลังดึงข้อมูล...' : 'ซิงก์ดึงข้อมูลจากชีต'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveWebhook}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savedSuccess ? 'บันทึกสำเร็จ!' : 'บันทึกการตั้งค่า'}</span>
                </button>
              </div>

              {syncResult && (
                <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  syncResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {syncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{syncResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="font-bold text-slate-900">โครงสร้างชีต DATA_APPLICATIONS (29 คอลัมน์)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] font-mono text-slate-600">
                  <div className="p-1.5 bg-white rounded border border-slate-200">A: TrackingNo</div>
                  <div className="p-1.5 bg-white rounded border border-slate-200">B: FiscalYear</div>
                  <div className="p-1.5 bg-white rounded border border-slate-200">C: SubmitDate</div>
                  <div className="p-1.5 bg-white rounded border border-slate-200">D: ApplicantName</div>
                  <div className="p-1.5 bg-white rounded border border-slate-200">E: Position</div>
                  <div className="p-1.5 bg-white rounded border border-slate-200">F: Department</div>
                  <div className="p-1.5 bg-white rounded border border-slate-200">T: CurrentStep (1-12)</div>
                  <div className="p-1.5 bg-white rounded border border-slate-200">U: Status</div>
                  <div className="p-1.5 bg-white rounded border border-slate-200">Y: VoucherNo (ฎีกา)</div>
                  <div className="p-1.5 bg-white rounded border border-slate-200">Z: PaymentDate</div>
                  <div className="p-1.5 bg-white rounded border border-slate-200">AA: PaymentStatus</div>
                  <div className="p-1.5 bg-white rounded border border-slate-200">AC: StaffNotes</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-1">
                <div className="font-bold">ระบบความปลอดภัยและสิทธิ์การเข้าถึง</div>
                <p>
                  ระบบใช้ Google Workspace OAuth Scopes เพื่อเข้าถึงเฉพาะไฟล์ Spreadsheet ที่เกี่ยวข้องตามมาตรฐานความปลอดภัยขั้นสูงของคณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Workspace Integration • Verified Project</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors text-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
