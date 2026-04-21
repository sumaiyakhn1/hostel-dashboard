import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { hostelService } from "../service/hostel.service";

// Interface for API Response
interface HostelMasterData {
  hostel: string[];
  roomType: string[];
  paymentFrequency: string[];
  gatePassCategory: {
    category: string;
    startTime: string;
    endTime: string;
    _id: string;
  }[];
}

interface Notification {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function HostelDashboard() {
  const { regNo: urlRegNo } = useParams<{ regNo: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [masterData, setMasterData] = useState<HostelMasterData | null>(null);

  const [form, setForm] = useState({
    hostel: "",
    roomType: "",
    paymentFrequency: "",
    roomNo: "",
    bedNo: "",
    startDate: "",
    endDate: "",
    session: "2025-26 Odd",
    regNo: urlRegNo || "",
  });

  const [student, setStudent] = useState<any>(null);
  const [localStatus, setLocalStatus] = useState<string>("");
  const [fetchingStudent, setFetchingStudent] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [fetchingRooms, setFetchingRooms] = useState(false);
  
  // Custom UI States
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const addNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Fetch Master Data on Mount
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await hostelService.getHostelMaster("6608ec3120337200120f347e");
      if (data) setMasterData(data);
    } catch (err: any) {
      setError("Failed to load hostel data.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Student Data
  const fetchStudent = async () => {
    if (!form.regNo) return;
    setFetchingStudent(true);
    try {
      const data = await hostelService.getStudentDetails({
        id: "689441d9d2b728001069ebe7",
        entity: "6608ec3120337200120f347e",
        session: form.session,
        regNo: form.regNo,
      });
      if (data) setStudent(data);

      const localData = await hostelService.getStudentFromDB(form.regNo);
      if (localData) {
        setLocalStatus(localData.status || "pending");
        // Update form with saved data if exists
        setForm(prev => ({
          ...prev,
          hostel: localData.wing || prev.hostel,
          roomType: localData.roomType || prev.roomType,
          roomNo: localData.roomNo || prev.roomNo,
          bedNo: localData.bedNo || prev.bedNo,
          paymentFrequency: localData.paymentFreq || prev.paymentFrequency,
          startDate: localData.startDate || prev.startDate,
          endDate: localData.endDate || prev.endDate,
        }));
      }
    } catch (err) {
      console.error("Error fetching student:", err);
    } finally {
      setFetchingStudent(false);
    }
  };

  const fetchRooms = async () => {
    if (!form.hostel || !form.roomType) return;
    setFetchingRooms(true);
    try {
      const data = await hostelService.getHostelRooms({
        entity: "6608ec3120337200120f347e",
        session: form.session,
        hostel: form.hostel,
        roomType: form.roomType,
      });
      const rooms = Array.isArray(data) ? data : data.data || [];
      setAvailableRooms(rooms);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setFetchingRooms(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchStudent(); }, [form.session, urlRegNo]);
  useEffect(() => { fetchRooms(); }, [form.hostel, form.roomType, form.session]);

  const isLocked = localStatus === "pending" || localStatus === "assigned";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (isLocked) return;
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setShowConfirm(false);
    try {
      await hostelService.saveStudentToDB(form.regNo, {
        session: form.session,
        wing: form.hostel,
        roomNo: form.roomNo,
        bedNo: form.bedNo,
        roomType: form.roomType,
        paymentFreq: form.paymentFrequency,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      addNotification("Request submitted! Pending approval.", "success");
      setLocalStatus("pending");
    } catch (error: any) {
      if (error.response?.status === 409) {
        addNotification("You are already registered!", "error");
      } else {
        addNotification("Submission failed.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const validateAndShowConfirm = () => {
    if (!form.hostel || !form.roomType || !form.roomNo || !form.bedNo || !form.startDate || !form.endDate) {
      addNotification("Please fill all fields.", "error");
      return;
    }
    setShowConfirm(true);
  };

  if (loading && !masterData)
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center font-black text-slate-400 animate-pulse uppercase tracking-[0.3em] text-xs">
        System Initializing...
      </div>
    );

  if (error) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-6 transition-all animate-in fade-in duration-700">
        <div className="bg-white/80 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white text-center shadow-2xl max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="mb-8 font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">{error}</p>
          <div className="flex flex-col gap-3">
             <button onClick={() => window.location.reload()} className="w-full py-4 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-200 font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all">Retry</button>
             <button onClick={() => window.location.href = "/"} className="w-full py-4 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/10 font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all">Exit to Home</button>
          </div>
        </div>
      </div>
    );
  }

  const getGlassClass = (value: string, isSpecial?: boolean) => {
    const base = "glass-input-premium transition-all duration-300 ";
    const state = isLocked ? "opacity-60 cursor-not-allowed bg-slate-50/50 " : (value ? "bg-white/80 border-slate-200 shadow-sm" : "bg-white/40 border-white/60");
    return `${base} ${state}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden flex items-center justify-center p-4 font-sans">
      
      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
        {notifications.map(n => (
          <div key={n.id} className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 animate-in slide-in-from-right duration-500 backdrop-blur-xl ${
            n.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 
            n.type === 'error' ? 'bg-red-600/90 border-red-500 text-white' : 'bg-slate-900/90 border-slate-800 text-white'
          }`}>
             <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
             <span className="text-xs font-black uppercase tracking-wider">{n.message}</span>
          </div>
        ))}
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-white text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl rotate-12">🏠</div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Final Step</h2>
              <p className="text-slate-500 text-xs font-bold leading-relaxed mb-8 anonymous">
                Confirm your request for <span className="text-slate-900">Room {form.roomNo}</span>? You cannot change this once submitted.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={handleFinalSubmit} className="flex-1 py-4 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-100 font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all">Confirm</button>
              </div>
           </div>
        </div>
      )}

      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-red-100 rounded-full blur-[120px] opacity-40" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-slate-200 rounded-full blur-[120px] opacity-40" />

      {/* Global Status Banner */}
      {localStatus && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[50] w-[90%] max-w-md">
          <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center justify-center gap-3 border-4 backdrop-blur-xl animate-in slide-in-from-top duration-700 ${
            localStatus === 'assigned' ? 'bg-emerald-600/90 border-emerald-500/50 text-white' : 'bg-amber-100 border-amber-200/50 text-amber-800'
          }`}>
            <span className="text-lg">{localStatus === 'assigned' ? '🎉' : '⏳'}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{
              localStatus === 'assigned' ? 'Your Room is Assigned & Finalized!' : 'Your Application is Pending Warden Approval'
            }</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-[1200px] bg-white/60 backdrop-blur-3xl rounded-[3.5rem] shadow-2xl border border-white relative z-10 flex flex-col lg:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Sidebar */}
        <div className="lg:w-[320px] p-12 bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10">
              <div 
                onClick={() => window.location.href = "/"}
                className="flex items-center justify-between mb-16 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-red-600/20 group-hover:scale-110 transition-transform">H</div>
                  <span className="font-black text-xl tracking-tighter uppercase italic">StayHub</span>
                </div>
                <div className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
              <h1 className="text-5xl font-black leading-[0.9] tracking-tighter mb-6">
                Student <br /> <span className="text-red-600">Portal.</span>
              </h1>
              <p className="text-slate-400 text-xs font-bold leading-relaxed opacity-60">
                Enroll in your preferred hostel wing and room type. Final approval is managed by the Warden.
              </p>
           </div>
           <div className="pt-8 border-t border-white/10 uppercase tracking-widest font-black text-[9px] text-slate-500">
              © 2024 Hostel Management
           </div>
        </div>

        {/* Form Area */}
        <div className="flex-1 p-8 lg:p-12 bg-white/20 flex flex-col">
           {/* Profile Bar */}
           <div className="flex items-center justify-between mb-16 px-4 py-3 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shadow-inner flex items-center justify-center text-xl grayscale hover:grayscale-0 transition-all duration-500 border border-slate-50">
                   {student?.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : "🙎‍♂️"}
                 </div>
                 <div>
                    <h2 className="font-black text-slate-900 text-sm tracking-tight">{student?.name || "Student Profile"}</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student?.regNo || urlRegNo}</p>
                 </div>
              </div>
              {localStatus && (
                <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                   localStatus === 'assigned' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  Status: {localStatus}
                </div>
              )}
           </div>

           {/* Scrollable Form */}
           <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                 {[
                   { label: "Academic Session", name: "session", type: "select", options: student?.sessionList || [form.session] },
                   { label: "Hostel Wing", name: "hostel", type: "select", options: masterData?.hostel || [] },
                   { label: "Room Category", name: "roomType", type: "select", options: masterData?.roomType || [] },
                   { label: "Room Identifier", name: "roomNo", type: "select", options: Array.from(new Set(availableRooms.map(r => r.roomName))) },
                   { label: "Bed Allocation", name: "bedNo", type: "select", options: availableRooms.find(r => r.roomName === form.roomNo)?.beds?.map((b:any) => b.bedName) || [] },
                   { label: "Payment Frequency", name: "paymentFrequency", type: "select", options: masterData?.paymentFrequency || [] },
                   { label: "Start Date", name: "startDate", type: "date" },
                   { label: "End Date", name: "endDate", type: "date" }
                 ].map((field) => (
                    <div key={field.name} className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{field.label}</label>
                       {field.type === "select" ? (
                         <select 
                           name={field.name} 
                           value={(form as any)[field.name]} 
                           onChange={handleChange} 
                           disabled={isLocked}
                           className={getGlassClass((form as any)[field.name])}
                         >
                            <option value="">Select {field.label}</option>
                            {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                         </select>
                       ) : (
                         <input 
                           type="date" 
                           name={field.name} 
                           value={(form as any)[field.name]} 
                           onChange={handleChange} 
                           disabled={isLocked}
                           className={getGlassClass((form as any)[field.name])} 
                         />
                       )}
                    </div>
                 ))}
                 
                 <div className="md:col-span-2 lg:col-span-1 flex flex-col justify-end pb-1">
                    <button 
                      onClick={validateAndShowConfirm}
                      disabled={isLocked || loading}
                      className={`w-full h-14 border  rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${
                        isLocked ? 'bg-slate-50 border-slate-200 text-slate-300' : 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95'
                      }`}
                    >
                       {isLocked ? (
                         <>
                           <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                           Application Protected
                         </>
                       ) : (
                         <>
                           <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                           {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Request Allocation"}
                         </>
                       )}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        .glass-input-premium {
          width: 100%;
          height: 3.5rem;
          padding: 0 1.25rem;
          border-radius: 1.25rem;
          font-weight: 800;
          font-size: 0.75rem;
          outline: none;
          border: 2px solid transparent;
        }
        .glass-input-premium:focus {
          border-color: #ef444450;
          background-color: white;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
