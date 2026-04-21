import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { hostelService } from "../service/hostel.service";

export default function WardenLogin() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length !== 10) return alert("Enter valid mobile number");
    setLoading(true);
    try {
      await hostelService.sendOTP(mobile);
      setStep(2);
    } catch (error) {
      alert("Failed to send OTP. This number might not be registered.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await hostelService.verifyOTP(mobile, otp);
      if (data && data.token) {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("warden_mobile", mobile);
        navigate("/warden");
      } else {
        alert("Invalid OTP or Token not received.");
      }
    } catch (error) {
      alert("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-red-100 rounded-full blur-[120px] opacity-40 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-slate-200 rounded-full blur-[100px] opacity-30" />

      <div className="w-full max-w-md bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white shadow-2xl p-10 relative z-10 transition-all">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-3xl font-black mb-6 shadow-xl shadow-slate-900/20">
            W
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight text-center">
            Warden <span className="text-red-600">Access</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
            {step === 1 ? "Authentication Service" : "Complete Verification"}
          </p>
        </div>

        <form onSubmit={step === 1 ? handleSendOTP : handleVerifyOTP} className="space-y-6">
          {step === 1 ? (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mobile Number</label>
              <input
                type="tel"
                maxLength={10}
                placeholder="xxxxxxxxxx"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl px-6 font-bold text-slate-900 outline-none focus:border-red-500/50 transition-all shadow-inner"
                disabled={loading}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Enter 6-Digit OTP</label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl px-6 font-bold text-slate-900 text-center tracking-[0.5em] text-xl outline-none focus:border-red-500/50 transition-all shadow-inner"
                disabled={loading}
              />
              <button type="button" onClick={() => setStep(1)} className="text-[9px] font-black text-slate-400 p-2 uppercase hover:text-red-500 transition-colors">
                Change Number?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-200 font-black text-xs uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              step === 1 ? "Request OTP Link" : "Verify & Enter Portal"
            )}
          </button>
        </form>

        <div className="mt-12 flex justify-center opacity-20 grayscale">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-slate-900 rounded-lg flex items-center justify-center text-white text-[8px] font-black">
              L
            </div>
            <span className="font-bold text-[10px] tracking-tight text-slate-900">
              Secure Warden Gateway
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
