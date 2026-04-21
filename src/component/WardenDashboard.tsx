import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hostelService } from "../service/hostel.service";

interface StudentRecord {
  _id: string;
  regNumber: string;
  session: string;
  wing: string;
  roomNo: string;
  bedNo: string;
  roomType: string;
  paymentFreq: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface MasterData {
  hostel: string[];
  roomType: string[];
  paymentFrequency: string[];
}

export default function WardenDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Edit States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  
  const [processingId, setProcessingId] = useState<string | null>(null);

  const ENTITY_ID = "6608ec3120337200120f347e";

  const fetchAllStudents = async () => {
    setLoading(true);
    try {
      const data = await hostelService.getAllSavedStudents();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/warden/login");
    } else {
      fetchAllStudents();
    }
  }, [navigate]);

  if (!localStorage.getItem("auth_token")) {
    return null; // Return nothing while redirecting
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("warden_mobile");
    navigate("/warden/login");
  };

  // Fetch Master Data for Dropdowns when entering edit mode
  const fetchMasterData = async () => {
    try {
      const data = await hostelService.getHostelMaster(ENTITY_ID);
      if (data) setMasterData(data);
    } catch (err) {
      console.error("Error fetching master data:", err);
    }
  };

  // Fetch Available Rooms based on selection in edit form
  const fetchRoomsForEdit = async (wing: string, type: string, session: string) => {
    if (!wing || !type || !session) return;
    try {
      const data = await hostelService.getHostelRooms({
        entity: ENTITY_ID,
        session: session,
        hostel: wing,
        roomType: type,
      });
      const rooms = Array.isArray(data) ? data : data.data || [];
      setAvailableRooms(rooms);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  };

  const handleEditClick = (student: StudentRecord) => {
    setEditingId(student._id);
    setEditForm({ ...student });
    fetchMasterData();
    fetchRoomsForEdit(student.wing, student.roomType, student.session);
  };

  useEffect(() => {
    if (editingId && editForm) {
      fetchRoomsForEdit(editForm.wing, editForm.roomType, editForm.session);
    }
  }, [editForm?.wing, editForm?.roomType]);

  const handleSaveEdit = async () => {
    if (!editForm) return;
    setProcessingId(editForm._id);
    try {
      await hostelService.updateStudentInDB(editForm.regNumber, editForm);
      await fetchAllStudents();
      setEditingId(null);
    } catch (error) {
      alert("Failed to update record.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignToERP = async (student: StudentRecord) => {
    const confirmAssign = window.confirm(`Permanently assign ${student.regNumber} specifically in the ERP?`);
    if (!confirmAssign) return;

    setProcessingId(student._id);
    try {
      const erpStudent = await hostelService.getStudentDetails({
        id: "689441d9d2b728001069ebe7",
        entity: ENTITY_ID,
        session: student.session,
        regNo: student.regNumber
      });

      if (!erpStudent || !erpStudent._id) {
        alert("Student not found in ERP system.");
        return;
      }

      const wings = await hostelService.getHostelRooms({
        entity: ENTITY_ID,
        session: student.session,
        hostel: student.wing,
        roomType: student.roomType,
      });

      const rooms = Array.isArray(wings) ? wings : wings.data || [];
      const selectedRoom = rooms.find((r: any) => r.roomName === student.roomNo);

      if (!selectedRoom) {
        alert("Selected room is not valid in the ERP system.");
        return;
      }

      const payload = {
        role: [],
        qualifications: [],
        workExperience: [],
        hostel: student.wing,
        hostelRoomType: student.roomType,
        beds: selectedRoom.beds || [],
        entity: ENTITY_ID,
        hostelEndDate: new Date(student.endDate).getTime(),
        hostelPaymentFrequency: student.paymentFreq || "Standard",
        hostelRoomBedName: student.bedNo,
        hostelRoomId: selectedRoom._id,
        hostelRoomName: student.roomNo,
        hostelStartDate: new Date(student.startDate).getTime(),
        roomCharges: selectedRoom.roomCharges || [],
        session: student.session,
        skipInstallments: [],
        studentId: erpStudent._id,
      };

      await hostelService.assignHostelRoom(payload);
      await hostelService.updateStudentInDB(student.regNumber, { status: "assigned" });
      
      alert("ERP Allocation successful.");
      await fetchAllStudents();
    } catch (error) {
      console.error("Assignment Error:", error);
      alert("Application could not be pushed to ERP.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roomNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.wing.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 font-sans transition-all">
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1">
            Warden <span className="text-red-600 italic">ERP Portal</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-slate-200 inline-block">
            Managed Allocation System
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
                onClick={handleLogout}
                className="px-4 py-3 bg-white text-slate-400 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
            >
                Logout
            </button>

            <div className="relative group">
            <input
                type="text"
                placeholder="Search Registry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3 bg-white border-2 border-slate-200 rounded-2xl w-full md:w-80 shadow-xl shadow-slate-200/20 focus:border-red-500/50 outline-none transition-all font-bold text-sm"
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white shadow-2xl overflow-hidden min-h-[60vh]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/5 backdrop-blur-md">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Registry Detail</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Wing Configuration</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Room Metadata</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Billing Detail</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">Current Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-center">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-10"><div className="h-4 bg-slate-100 rounded-full" /></td>
                  </tr>
                ))
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student._id} className={`transition-all ${editingId === student._id ? 'bg-red-50/50 ring-1 ring-inset ring-red-100' : 'hover:bg-white'}`}>
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900 text-lg leading-none">{student.regNumber}</div>
                      <div className="text-[10px] text-slate-400 font-black mt-1 uppercase">{student.session}</div>
                    </td>
                    
                    <td className="px-8 py-6">
                      {editingId === student._id ? (
                        <div className="flex flex-col gap-2">
                          <select 
                            className="text-[11px] font-bold border border-slate-200 rounded-lg p-1" 
                            value={editForm.wing} 
                            onChange={e => setEditForm({...editForm, wing: e.target.value})}
                          >
                            <option value="">Wing</option>
                            {masterData?.hostel.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                          <select 
                            className="text-[11px] font-bold border border-slate-200 rounded-lg p-1" 
                            value={editForm.roomType} 
                            onChange={e => setEditForm({...editForm, roomType: e.target.value})}
                          >
                            <option value="">Room Type</option>
                            {masterData?.roomType.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-black text-slate-800 uppercase line-clamp-1">{student.wing}</div>
                          <div className="text-[10px] text-slate-400 font-black uppercase">{student.roomType}</div>
                        </div>
                      )}
                    </td>

                    <td className="px-8 py-6">
                       {editingId === student._id ? (
                        <div className="flex flex-col gap-2">
                          <select 
                            className="text-[11px] font-bold border border-slate-200 rounded-lg p-1" 
                            value={editForm.roomNo} 
                            onChange={e => setEditForm({...editForm, roomNo: e.target.value})}
                          >
                            <option value="">Room</option>
                             {Array.from(new Set(availableRooms.map((r: any) => r.roomName))).map((rn: any) => (
                                <option key={rn} value={rn}>{rn}</option>
                              ))}
                          </select>
                          <select 
                            className="text-[11px] font-bold border border-slate-200 rounded-lg p-1" 
                            value={editForm.bedNo} 
                            onChange={e => setEditForm({...editForm, bedNo: e.target.value})}
                          >
                            <option value="">Bed</option>
                            {availableRooms.find(r => r.roomName === editForm.roomNo)?.beds?.map((b: any) => (
                              <option key={b._id} value={b.bedName}>{b.bedName}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase">RM {student.roomNo}</div>
                          <div className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase">BD {student.bedNo}</div>
                        </div>
                      )}
                    </td>

                    <td className="px-8 py-6">
                      {editingId === student._id ? (
                         <select 
                          className="text-[11px] font-bold border border-slate-200 rounded-lg p-1 w-full" 
                          value={editForm.paymentFreq} 
                          onChange={e => setEditForm({...editForm, paymentFreq: e.target.value})}
                        >
                          <option value="">Frequency</option>
                          {masterData?.paymentFrequency.map(pf => <option key={pf} value={pf}>{pf}</option>)}
                        </select>
                      ) : (
                        <div className="text-[10px] font-black text-slate-500 uppercase italic">
                          {student.paymentFreq}
                        </div>
                      )}
                    </td>

                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        student.status === 'assigned' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-amber-100 text-amber-700'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${student.status === 'assigned' ? 'bg-white' : 'bg-amber-600 animate-ping'}`} />
                        {student.status || 'pending'}
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                         {editingId === student._id ? (
                            <button 
                              onClick={handleSaveEdit}
                              disabled={!!processingId}
                              className="bg-slate-900 text-white p-2 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleEditClick(student)}
                              className="bg-white border-2 border-slate-100 text-slate-400 p-2 rounded-xl hover:border-red-500 hover:text-red-500 transition-all font-black text-xs"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                          )}

                          {student.status !== 'assigned' && (
                            <button 
                              onClick={() => handleAssignToERP(student)}
                              disabled={!!processingId}
                              className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all disabled:grayscale"
                            >
                              Assign ERP
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-black text-lg">No student records found yet.</p>
                    <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mt-2">Waiting for new registrations...</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
