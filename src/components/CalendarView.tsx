import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Info,
  CalendarCheck,
  X
} from 'lucide-react';
import { CalendarEventSchedule, ResearchApplication } from '../types';
import { INITIAL_SCHEDULE_EVENTS } from '../data/initialData';

interface CalendarViewProps {
  applications: ResearchApplication[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ applications }) => {
  const [events, setEvents] = useState<CalendarEventSchedule[]>(INITIAL_SCHEDULE_EVENTS);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-04-15');
  const [newEventTime, setNewEventTime] = useState('09:30 - 12:00');
  const [newEventLocation, setNewEventLocation] = useState('ห้องประชุม CC2-414 คณะแพทยศาสตร์');
  const [showAddModal, setShowAddModal] = useState(false);

  // Generate Google Calendar Link
  const createGoogleCalendarUrl = (event: CalendarEventSchedule) => {
    const formattedDate = event.date.replace(/-/g, '');
    const startTime = `${formattedDate}T090000Z`;
    const endTime = `${formattedDate}T120000Z`;
    const title = encodeURIComponent(`[งานวิจัย คณะแพทย์ มน.] ${event.title}`);
    const details = encodeURIComponent(`${event.description}\nสถานที่: ${event.location}`);
    const location = encodeURIComponent(event.location);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEv: CalendarEventSchedule = {
      id: `cal-${Date.now()}`,
      title: newEventTitle,
      date: newEventDate,
      time: newEventTime,
      type: 'committee_meeting',
      location: newEventLocation,
      description: 'กำหนดการประชุมคณะกรรมการบริหารงานวิจัย คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร',
    };

    setEvents([...events, newEv]);
    setNewEventTitle('');
    setShowAddModal(false);
  };

  // Derive SLA deadlines from in-progress applications
  const activeSlaItems = applications.filter(a => a.status !== 'paid');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Google Workspace Calendar Integration</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 font-prompt">
            ปฏิทินรอบการประชุมวิจัย และกำหนดรอบเบิกจ่ายเงินรางวัล
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1">
            ติดตามรอบการประชุมคณะกรรมการบริหารงานวิจัยประจำเดือน กำหนดส่งเรื่องงานการเงิน และรอบการโอนเงิน (4 สัปดาห์)
            พร้อมเชื่อมต่อไปยัง Google Calendar บัญชี @nu.ac.th
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มนัดหมายใหม่</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar Events & SLA Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Agenda Timeline Events */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 font-prompt flex items-center justify-between">
            <span>กำหนดการประชุมและรอบเบิกจ่ายทางการ (Calendar Events)</span>
            <span className="text-xs text-slate-500 font-normal">{events.length} กำหนดการ</span>
          </h3>

          <div className="space-y-3">
            {events.map((event) => {
              const gcalUrl = createGoogleCalendarUrl(event);

              return (
                <div
                  key={event.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 flex flex-col items-center justify-center min-w-14">
                      <span className="text-[10px] font-bold uppercase">
                        {new Date(event.date).toLocaleDateString('th-TH', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold font-prompt">
                        {new Date(event.date).getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm font-prompt">
                          {event.title}
                        </span>
                        {event.type === 'committee_meeting' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            การประชุม
                          </span>
                        )}
                        {event.type === 'payment_round' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            รอบการเงิน
                          </span>
                        )}
                        {event.type === 'sla_deadline' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            กำหนด SLA
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600">{event.description}</p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{event.time}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{event.location}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={gcalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold rounded-lg text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors shrink-0"
                  >
                    <span>เพิ่มลง Google Calendar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: SLA Countdown for Current Applications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 font-prompt">
              กำหนดวันตาม SLA โครงการที่กำลังดำเนินการ
            </h3>
            <p className="text-xs text-slate-500">
              ติดตามรอบเวลา 4 สัปดาห์ และรอบตรวจเอกสาร 1 วัน
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {activeSlaItems.map((app, idx) => (
              <div
                key={app.id || `cal-sla-${app.trackingNo || 'item'}-${idx}`}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 font-mono text-[11px]">
                    {app.trackingNo}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    ขั้นตอนที่ {app.currentStep}/12
                  </span>
                </div>

                <div className="font-medium text-slate-800 line-clamp-1">
                  {app.applicantName}
                </div>

                <div className="text-[11px] text-slate-500 line-clamp-1">
                  {app.articleTitle}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <span>ยื่นเมื่อ: {app.createdAt}</span>
                  <span className="font-semibold text-emerald-700">รอบโอน: ภายใน 4 สัปดาห์</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs space-y-1">
            <div className="font-semibold text-blue-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Apps Script Calendar Trigger</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              เมื่อนักวิจัยยื่นคำขอใหม่ หรือเจ้าหน้าที่ส่งเรื่องเบิกจ่าย ระบบ Google Apps Script จะสร้าง Event อัตโนมัติใน Google Calendar ของหน่วยงานวิจัย
            </p>
          </div>
        </div>
      </div>

      {/* Modal Add New Event */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 font-prompt text-sm">เพิ่มกำหนดการประชุม/รอบเบิกจ่าย</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">หัวข้อกิจกรรม*</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="เช่น ประชุมกลั่นกรองเงินรางวัลรอบที่ 4/2569"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">วันที่*</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">เวลา*</label>
                  <input
                    type="text"
                    required
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    placeholder="เช่น 09:30 - 12:00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">สถานที่*</label>
                <input
                  type="text"
                  required
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="ห้องประชุม CC2-414"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-600 rounded-lg text-xs hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs shadow-sm"
                >
                  บันทึกกิจกรรม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
