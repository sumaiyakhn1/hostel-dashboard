import React, { useState } from "react";

export default function HostelAssignModal() {
  const [form, setForm] = useState({
    hostel: "",
    roomType: "",
    room: "",
    bed: "",
    paymentFrequency: "",
    startDate: "",
    endDate: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("Assigned:", form);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-5 sm:p-7 my-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1 h-6 bg-red-700 rounded-full" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
            Hostel Detail
          </h3>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Hostel */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Hostel
            </label>
            <select name="hostel" onChange={handleChange} className="input">
              <option value="">Select Hostel</option>
              <option>Hostel A</option>
              <option>Hostel B</option>
            </select>
          </div>

          {/* Room Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Room Type
            </label>
            <select name="roomType" onChange={handleChange} className="input">
              <option value="">Select Room Type</option>
              <option>Single</option>
              <option>Double</option>
            </select>
          </div>

          {/* Room */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Room
            </label>
            <select name="room" onChange={handleChange} className="input">
              <option value="">Select Room</option>
              <option>101</option>
              <option>102</option>
            </select>
          </div>

          {/* Bed */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Bed
            </label>
            <select name="bed" onChange={handleChange} className="input">
              <option value="">Select Bed</option>
              <option>Bed 1</option>
              <option>Bed 2</option>
            </select>
          </div>

          {/* Payment Frequency */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Payment Frequency
            </label>
            <select
              name="paymentFrequency"
              onChange={handleChange}
              className="input"
            >
              <option value="">Select Frequency</option>
              <option>Monthly</option>
              <option>Yearly</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              onChange={handleChange}
              className="input"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1 sm:col-span-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mt-6 mb-4" />

        {/* Footer Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-150">
            Close
          </button>
          <button
            onClick={handleSubmit}
            className="w-full sm:w-auto px-5 py-2.5 bg-red-700 hover:bg-red-800 active:scale-95 text-white font-medium rounded-xl transition-all duration-150"
          >
            Assign
          </button>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          outline: none;
          font-size: 14px;
          color: #374151;
          background-color: #f9fafb;
          transition: border-color 0.15s, box-shadow 0.15s;
          appearance: auto;
        }
        .input:focus {
          border-color: #b91c1c;
          box-shadow: 0 0 0 3px rgba(185, 28, 28, 0.1);
          background-color: #fff;
        }
        select.input {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
