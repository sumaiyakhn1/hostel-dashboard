import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hostelService } from "../service/hostel.service";

interface StudentRecord {
  _id: string;
  regNumber: string;
  name: string;
  applyDate: string;
  session: string;
  wing: string;
  roomNo: string;
  bedNo: string;
  roomType: string;
  paymentFreq: string;
  startDate: string;
  endDate: string;
  remark: string;
  rejectRemark: string;
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

  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(
    null,
  );
  const [masterData, setMasterData] = useState<MasterData | null>(null);

  const [approveStartDate, setApproveStartDate] = useState("");
  const [approveEndDate, setApproveEndDate] = useState("");
  const [approvePaymentFreq, setApprovePaymentFreq] = useState("");

  const [rejectRemark, setRejectRemark] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

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
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("warden_mobile");
    navigate("/warden/login");
  };

  const fetchMasterData = async () => {
    try {
      const data = await hostelService.getHostelMaster(ENTITY_ID);
      if (data) setMasterData(data);
    } catch (err) {
      console.error("Error fetching master data:", err);
    }
  };

  const fetchRoomsForEdit = async (
    wing: string,
    type: string,
    session: string,
  ) => {
    if (!wing || !type || !session) return;
    try {
      const data = await hostelService.getHostelRooms({
        entity: ENTITY_ID,
        session,
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
    } catch {
      alert("Failed to update record.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignToERP = async (student: StudentRecord) => {
    const confirmAssign = window.confirm(
      `Permanently assign ${student.regNumber} specifically in the ERP?`,
    );
    if (!confirmAssign) return;
    setProcessingId(student._id);
    try {
      const erpStudent = await hostelService.getStudentDetails({
        id: "689441d9d2b728001069ebe7",
        entity: ENTITY_ID,
        session: student.session,
        regNo: student.regNumber,
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
      const selectedRoom = rooms.find(
        (r: any) => r.roomName === student.roomNo,
      );
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
      await hostelService.updateStudentInDB(student.regNumber, {
        status: "assigned",
      });
      alert("ERP Allocation successful.");
      await fetchAllStudents();
    } catch (error) {
      console.error("Assignment Error:", error);
      alert("Application could not be pushed to ERP.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleStudentClick = (student: StudentRecord) => {
    setSelectedStudent(student);
    setApproveStartDate(student.startDate || "");
    setApproveEndDate(student.endDate || "");
    setApprovePaymentFreq(student.paymentFreq || "");
    setRejectRemark("");
    setShowRejectBox(false);
    if (!masterData) fetchMasterData();
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setShowRejectBox(false);
    setRejectRemark("");
  };

  const handleApprove = async () => {
    if (!selectedStudent) return;
    if (!approveStartDate || !approveEndDate || !approvePaymentFreq) {
      alert(
        "Please set Start Date, End Date and Payment Frequency before approving.",
      );
      return;
    }
    setProcessingId(selectedStudent._id);
    try {
      await hostelService.updateStudentInDB(selectedStudent.regNumber, {
        status: "approved",
        startDate: approveStartDate,
        endDate: approveEndDate,
        paymentFreq: approvePaymentFreq,
      });
      await fetchAllStudents();
      closeModal();
    } catch {
      alert("Failed to approve.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedStudent) return;
    if (!rejectRemark.trim()) {
      alert("Remark is required to reject an application.");
      return;
    }
    setProcessingId(selectedStudent._id);
    try {
      await hostelService.updateStudentInDB(selectedStudent.regNumber, {
        status: "rejected",
        rejectRemark: rejectRemark.trim(),
      });
      await fetchAllStudents();
      closeModal();
    } catch {
      alert("Failed to reject.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.roomNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.wing || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusColor = (status: string) => {
    if (status === "approved" || status === "assigned")
      return "bg-emerald-500 text-white shadow-lg shadow-emerald-200";
    if (status === "rejected")
      return "bg-red-500 text-white shadow-lg shadow-red-200";
    return "bg-amber-100 text-amber-700";
  };

  const statusDot = (status: string) => {
    if (status === "approved" || status === "assigned" || status === "rejected")
      return "bg-white";
    return "bg-amber-600 animate-ping";
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4 md:p-8 font-sans transition-all">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1">
            <span style={{ color: "rgb(237,128,65)" }}> Okie Dokie</span>{" "}
            <span className="italic">Warden ERP Portal</span>
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
            <svg
              className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Applications + Detail panel */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left: Applications List */}
        <div className="lg:col-span-1 bg-white/70 backdrop-blur-3xl rounded-[2rem] border border-white shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Applications
            </h2>
            <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">
              {filteredStudents.length}
            </span>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse h-14 bg-slate-100 rounded-xl"
                  />
                ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-400 font-black">No applications yet.</p>
              <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mt-1">
                Waiting for registrations...
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
              {filteredStudents.map((student, index) => (
                <button
                  key={student._id}
                  onClick={() => handleStudentClick(student)}
                  className={`w-full text-left px-5 py-4 flex items-center gap-3 transition-all hover:bg-slate-50 ${selectedStudent?._id === student._id ? "bg-red-50 border-l-4 border-red-500" : ""}`}
                >
                  <span className="text-[11px] font-black text-slate-300 w-5 flex-shrink-0 text-right">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">
                      {student.name || student.regNumber}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      {student.regNumber}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[10px] font-black text-slate-500">
                      {formatDate(student.applyDate)}
                    </p>
                    <div
                      className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${statusColor(student.status)}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${statusDot(student.status)}`}
                      />
                      {student.status || "pending"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detail + Actions */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="bg-white/70 backdrop-blur-3xl rounded-[2rem] border border-white shadow-2xl overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {selectedStudent.name || "Student Detail"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {selectedStudent.regNumber} · Applied:{" "}
                    {formatDate(selectedStudent.applyDate)}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="text-slate-300 hover:text-red-500 transition-colors p-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                  Application Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "Session", value: selectedStudent.session },
                    { label: "Wing", value: selectedStudent.wing },
                    { label: "Room Type", value: selectedStudent.roomType },
                    { label: "Room No", value: selectedStudent.roomNo },
                    { label: "Bed No", value: selectedStudent.bedNo },
                    { label: "Remark", value: selectedStudent.remark || "—" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="bg-slate-50 rounded-2xl p-3 border border-slate-100"
                    >
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        {label}
                      </p>
                      <p className="text-sm font-black text-slate-800">
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mb-6 flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Current Status:
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusColor(selectedStudent.status)}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${statusDot(selectedStudent.status)}`}
                    />
                    {selectedStudent.status || "pending"}
                  </span>
                  {selectedStudent.rejectRemark && (
                    <span className="text-xs text-red-500 font-bold">
                      · {selectedStudent.rejectRemark}
                    </span>
                  )}
                </div>

                {selectedStudent.status !== "approved" &&
                  selectedStudent.status !== "assigned" &&
                  selectedStudent.status !== "rejected" && (
                    <>
                      {/* Approve */}
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-4">
                          Approve Application
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                              Start Date *
                            </label>
                            <input
                              type="date"
                              value={approveStartDate}
                              onChange={(e) =>
                                setApproveStartDate(e.target.value)
                              }
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-400 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                              End Date *
                            </label>
                            <input
                              type="date"
                              value={approveEndDate}
                              onChange={(e) =>
                                setApproveEndDate(e.target.value)
                              }
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-400 transition-all"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                              Payment Frequency *
                            </label>
                            <select
                              value={approvePaymentFreq}
                              onChange={(e) =>
                                setApprovePaymentFreq(e.target.value)
                              }
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-400 transition-all bg-white"
                            >
                              <option value="">Select...</option>
                              {masterData?.paymentFrequency?.map((pf) => (
                                <option key={pf} value={pf}>
                                  {pf}
                                </option>
                              )) || (
                                <>
                                  <option value="Monthly">Monthly</option>
                                  <option value="Quarterly">Quarterly</option>
                                  <option value="Half Yearly">
                                    Half Yearly
                                  </option>
                                  <option value="Yearly">Yearly</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={handleApprove}
                          disabled={!!processingId}
                          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all disabled:grayscale disabled:cursor-not-allowed"
                        >
                          {processingId ? "Processing..." : "✓ Approve"}
                        </button>
                      </div>

                      {/* Reject */}
                      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4">
                          Reject Application
                        </h3>
                        {!showRejectBox ? (
                          <button
                            onClick={() => setShowRejectBox(true)}
                            className="border-2 border-red-200 text-red-500 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 active:scale-95 transition-all"
                          >
                            ✗ Reject
                          </button>
                        ) : (
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2">
                              Rejection Remark * (Required)
                            </label>
                            <textarea
                              value={rejectRemark}
                              onChange={(e) => setRejectRemark(e.target.value)}
                              placeholder="Enter reason for rejection..."
                              rows={3}
                              className="w-full px-4 py-3 border-2 border-red-200 rounded-xl text-xs font-bold outline-none focus:border-red-400 transition-all resize-none mb-3"
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={handleReject}
                                disabled={
                                  !!processingId || !rejectRemark.trim()
                                }
                                className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all disabled:grayscale disabled:cursor-not-allowed"
                              >
                                {processingId
                                  ? "Processing..."
                                  : "Confirm Reject"}
                              </button>
                              <button
                                onClick={() => {
                                  setShowRejectBox(false);
                                  setRejectRemark("");
                                }}
                                className="bg-white border border-slate-200 text-slate-400 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:text-slate-600 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                {selectedStudent.status !== "rejected" && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                      ERP Actions
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {editingId === selectedStudent._id ? (
                        <button
                          onClick={handleSaveEdit}
                          disabled={!!processingId}
                          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-700 active:scale-95 transition-all disabled:grayscale"
                        >
                          Save Changes
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditClick(selectedStudent)}
                          className="bg-white border-2 border-slate-200 text-slate-500 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:border-slate-400 transition-all"
                        >
                          Edit Record
                        </button>
                      )}
                      {selectedStudent.status !== "assigned" && (
                        <button
                          onClick={() => handleAssignToERP(selectedStudent)}
                          disabled={!!processingId}
                          className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all disabled:grayscale"
                        >
                          Assign ERP
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-3xl rounded-[2rem] border border-white shadow-2xl h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  📋
                </div>
                <p className="text-slate-400 font-black text-lg">
                  Select an Application
                </p>
                <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mt-2">
                  Click a student from the left to review
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Registry Table */}
      <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white shadow-2xl overflow-hidden min-h-[60vh]">
        <div className="px-8 py-5 border-b border-slate-100">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Full Registry
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/5 backdrop-blur-md">
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">
                  Registry Detail
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">
                  Wing Configuration
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">
                  Room Metadata
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">
                  Billing Detail
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400">
                  Current Status
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 text-center">
                  Control
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-10">
                        <div className="h-4 bg-slate-100 rounded-full" />
                      </td>
                    </tr>
                  ))
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student._id}
                    className={`transition-all ${editingId === student._id ? "bg-red-50/50 ring-1 ring-inset ring-red-100" : "hover:bg-white"}`}
                  >
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900 text-lg leading-none">
                        {student.regNumber}
                      </div>
                      {student.name && (
                        <div className="text-xs text-slate-600 font-semibold mt-0.5">
                          {student.name}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 font-black mt-1 uppercase">
                        {student.session}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {editingId === student._id ? (
                        <div className="flex flex-col gap-2">
                          <select
                            className="text-[11px] font-bold border border-slate-200 rounded-lg p-1"
                            value={editForm.wing}
                            onChange={(e) =>
                              setEditForm({ ...editForm, wing: e.target.value })
                            }
                          >
                            <option value="">Wing</option>
                            {masterData?.hostel.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                          <select
                            className="text-[11px] font-bold border border-slate-200 rounded-lg p-1"
                            value={editForm.roomType}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                roomType: e.target.value,
                              })
                            }
                          >
                            <option value="">Room Type</option>
                            {masterData?.roomType.map((rt) => (
                              <option key={rt} value={rt}>
                                {rt}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-black text-slate-800 uppercase line-clamp-1">
                            {student.wing}
                          </div>
                          <div className="text-[10px] text-slate-400 font-black uppercase">
                            {student.roomType}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {editingId === student._id ? (
                        <div className="flex flex-col gap-2">
                          <select
                            className="text-[11px] font-bold border border-slate-200 rounded-lg p-1"
                            value={editForm.roomNo}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                roomNo: e.target.value,
                              })
                            }
                          >
                            <option value="">Room</option>
                            {Array.from(
                              new Set(
                                availableRooms.map((r: any) => r.roomName),
                              ),
                            ).map((rn: any) => (
                              <option key={rn} value={rn}>
                                {rn}
                              </option>
                            ))}
                          </select>
                          <select
                            className="text-[11px] font-bold border border-slate-200 rounded-lg p-1"
                            value={editForm.bedNo}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                bedNo: e.target.value,
                              })
                            }
                          >
                            <option value="">Bed</option>
                            {availableRooms
                              .find((r) => r.roomName === editForm.roomNo)
                              ?.beds?.map((b: any) => (
                                <option key={b._id} value={b.bedName}>
                                  {b.bedName}
                                </option>
                              ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase">
                            RM {student.roomNo}
                          </div>
                          <div className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase">
                            BD {student.bedNo}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {editingId === student._id ? (
                        <select
                          className="text-[11px] font-bold border border-slate-200 rounded-lg p-1 w-full"
                          value={editForm.paymentFreq}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              paymentFreq: e.target.value,
                            })
                          }
                        >
                          <option value="">Frequency</option>
                          {masterData?.paymentFrequency.map((pf) => (
                            <option key={pf} value={pf}>
                              {pf}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-[10px] font-black text-slate-500 uppercase italic">
                          {student.paymentFreq}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColor(student.status)}`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${statusDot(student.status)}`}
                        />
                        {student.status || "pending"}
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
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditClick(student)}
                            className="bg-white border-2 border-slate-100 text-slate-400 p-2 rounded-xl hover:border-red-500 hover:text-red-500 transition-all font-black text-xs"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                        )}
                        {student.status !== "assigned" &&
                          student.status !== "rejected" && (
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
                    <p className="text-slate-400 font-black text-lg">
                      No student records found yet.
                    </p>
                    <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mt-2">
                      Waiting for new registrations...
                    </p>
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
