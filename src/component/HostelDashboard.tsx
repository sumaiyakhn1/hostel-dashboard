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

  // Fetch Master Data on Mount
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await hostelService.getHostelMaster(
        "6608ec3120337200120f347e",
      );
      if (data) setMasterData(data);
    } catch (err: any) {
      console.error("Fetch error:", err);
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
      if (data) {
        setStudent(data);
        if (data.hostel) {
          setForm((prev) => ({
            ...prev,
            hostel: data.hostel,
            roomType: data.hostelRoomType,
            roomNo: data.hostelRoomName,
            bedNo: data.hostelRoomBedName,
            paymentFrequency: data.hostelPaymentFrequency,
            startDate: data.hostelStartDate?.split("T")[0] || "",
            endDate: data.hostelEndDate?.split("T")[0] || "",
          }));
        }
      }

      // Also check local database status
      const localData = await hostelService.getStudentFromDB(form.regNo);
      if (localData) {
        setLocalStatus(localData.status || "pending");
      }
    } catch (err) {
      console.error("Error fetching student:", err);
    } finally {
      setFetchingStudent(false);
    }
  };

  // Fetch Rooms when Selection Changes
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

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    fetchStudent();
  }, [form.session, urlRegNo]);
  useEffect(() => {
    fetchRooms();
  }, [form.hostel, form.roomType, form.session]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (
      !form.hostel ||
      !form.roomType ||
      !form.roomNo ||
      !form.bedNo ||
      !form.startDate ||
      !form.endDate
    ) {
      alert("Please fill in all fields.");
      return;
    }

    const selectedRoom = availableRooms.find(
      (r: any) => r.roomName === form.roomNo,
    );
    if (!selectedRoom) return;

    const payload = {
      role: [],
      qualifications: [],
      workExperience: [],
      hostel: form.hostel,
      hostelRoomType: form.roomType,
      beds: selectedRoom.beds || [],
      entity: "6608ec3120337200120f347e",
      hostelEndDate: new Date(form.endDate).getTime(),
      hostelPaymentFrequency: form.paymentFrequency || "Standard",
      hostelRoomBedName: form.bedNo,
      hostelRoomId: selectedRoom._id,
      hostelRoomName: form.roomNo,
      hostelStartDate: new Date(form.startDate).getTime(),
      roomCharges: selectedRoom.roomCharges || [],
      session: form.session,
      skipInstallments: [],
      studentId: student?._id || "689441d9d2b728001069ebe7",
    };

    // "Are you sure" confirmation
    const confirmAssign = window.confirm(
      `Assign room ${form.roomNo} (${form.bedNo}) to ${student?.name || "this student"}?`,
    );
    if (!confirmAssign) return;

    // Log the data to the console as requested
    console.log("=== USER FORM DATA ===");
    console.log(form);
    console.log("=== FINAL PAYLOAD GOING TO API ===");
    console.log(payload);

    setLoading(true);
    try {
      // Save to local MongoDB only
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
      alert("Application submitted successfully! Please wait for Warden approval.");
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert("⚠️ You are already registered!");
      } else {
        alert("Failed to submit request.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#e2e8f0] flex items-center justify-center font-bold text-slate-800 animate-pulse">
        Establishing Secure Connection...
      </div>
    );

  if (error) {
    return (
      <div className="min-h-screen bg-[#e2e8f0] flex items-center justify-center p-6 text-slate-800 font-bold">
        <div className="bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white text-center shadow-2xl">
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-xl"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Dynamic background logic helper
  const getGlassClass = (value: string, isSpecial?: boolean) => {
    const base = "glass-input ";
    const state = value
      ? "bg-white/70 border-white"
      : "bg-white/20 border-white/60";
    const special = isSpecial ? "ring-2 ring-red-500/10 border-red-500/20" : "";
    return `${base} ${state} ${special}`;
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] relative overflow-hidden flex items-center justify-center p-2 font-sans">
      {/* Decorative Elements */}
      <div className="absolute top-[-5%] right-[-5%] w-[40rem] h-[40rem] bg-slate-300 rounded-full blur-[150px] opacity-30" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[30rem] h-[30rem] bg-slate-400 rounded-full blur-[120px] opacity-20" />

      {localStatus === "assigned" && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="bg-emerald-600 text-white px-8 py-3 rounded-full shadow-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 border-4 border-emerald-500/50">
            <span className="text-xl">🏠</span>
            Welcome! Your hostel has been assigned to you.
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl bg-white/40 backdrop-blur-3xl rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-white/70 relative z-10 flex flex-col md:flex-row overflow-hidden max-h-[95vh]">
        {/* Branding Sidebar */}
        <div className="md:w-1/4 p-10 flex flex-col justify-between border-r border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-10 opacity-90">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-lg font-black">
                L
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Logo
              </span>
            </div>

            <h1 className="text-4xl font-black text-slate-900 mb-4 leading-none">
              Hostel <br /> Enrollment:
            </h1>
            <p className="text-slate-500 text-xs font-semibold italic">
              Welcome back! Complete your housing details below.
            </p>
          </div>

          <div className="hidden md:block">
            <div className="px-3 py-1.5 bg-slate-800/5 rounded-full inline-block border border-slate-800/10">
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">
                Secure Student Portal
              </p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 p-6 md:p-8 flex items-center">
          <div className="w-full bg-white/30 backdrop-blur-md rounded-[2.5rem] border border-white/50 p-6 pt-12 relative">
            {/* Student Profile Header */}
            <div className="absolute top-[-35px] right-8">
              <div className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-lg border border-white px-4 py-2 flex items-center gap-4 min-w-[280px]">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white shadow-inner flex-shrink-0 border border-slate-100 flex items-center justify-center relative">
                  {student?.photo ? (
                    <img
                      src={student.photo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "👤"
                  )}
                  {fetchingStudent && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center animate-pulse">
                      <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {student?.name || "Welcome!"}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    {student?.course || "Fill the form"}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mt-6">
              {/* Session */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Session
                </label>
                <select
                  name="session"
                  value={form.session}
                  onChange={handleChange}
                  className={getGlassClass(form.session)}
                >
                  <option value="">Select Session</option>
                  {student?.sessionList?.map((s: string) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wing */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Wing
                </label>
                <select
                  name="hostel"
                  value={form.hostel}
                  onChange={handleChange}
                  className={getGlassClass(form.hostel)}
                >
                  <option value="">Select Wing</option>
                  {masterData?.hostel.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Type */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Room Type
                </label>
                <select
                  name="roomType"
                  value={form.roomType}
                  onChange={handleChange}
                  className={getGlassClass(form.roomType)}
                >
                  <option value="">Select Room Type</option>
                  {masterData?.roomType.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room No */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                  Room No{" "}
                  {fetchingRooms && (
                    <span className="w-1 h-1 bg-red-600 rounded-full animate-ping" />
                  )}
                </label>
                <select
                  name="roomNo"
                  value={form.roomNo}
                  onChange={handleChange}
                  className={getGlassClass(form.roomNo)}
                  disabled={fetchingRooms}
                >
                  <option value="">
                    {fetchingRooms ? "Locating..." : "Select Room No"}
                  </option>
                  {Array.from(
                    new Set(availableRooms.map((r: any) => r.roomName)),
                  ).map((roomName: any) => (
                    <option key={roomName} value={roomName}>
                      {roomName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bed No */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Bed No
                </label>
                <select
                  name="bedNo"
                  value={form.bedNo}
                  onChange={handleChange}
                  className={getGlassClass(form.bedNo)}
                >
                  <option value="">Select Bed No</option>
                  {availableRooms
                    .find((r) => r.roomName === form.roomNo)
                    ?.beds?.map((b: any) => (
                      <option key={b._id} value={b.bedName}>
                        {b.bedName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Payment Frequency - HIGHLIGHTED */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-red-600/60 uppercase tracking-widest ml-2">
                  Payment Freq
                </label>
                <select
                  name="paymentFrequency"
                  value={form.paymentFrequency}
                  onChange={handleChange}
                  className={getGlassClass(form.paymentFrequency, true)}
                >
                  <option value="">Select Frequency</option>
                  {masterData?.paymentFrequency.map((pf) => (
                    <option key={pf} value={pf}>
                      {pf}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className={getGlassClass(form.startDate)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className={getGlassClass(form.endDate)}
                />
              </div>

              {/* Submit Section Integrated */}
              <div className="flex flex-col justify-end items-center lg:items-stretch py-2">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-12 bg-red-600 text-white rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-red-700 active:scale-95 transition-all font-black text-xs uppercase tracking-widest"
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
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  Confirm & Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .glass-input {
          width: 100%;
          height: 2.75rem;
          padding: 0 1rem;
          border-radius: 1.25rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: #1e293b;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          appearance: none;
          border-width: 1.5px;
        }
        .glass-input:focus {
          border-color: #dc2626;
          box-shadow: 0 0 20px rgba(220,38,38,0.1);
          background: rgba(255,255,255,1);
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          scale: 1;
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
}
