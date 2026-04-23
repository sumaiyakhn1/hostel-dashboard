import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  regNumber: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  applyDate: {
    type: Date,
    default: Date.now,
  },
  session: String,
  wing: String,
  roomNo: String,
  bedNo: String,
  roomType: String,
  paymentFreq: String,
  startDate: String,
  endDate: String,
  remark: String,
  rejectRemark: String,
  status: {
    type: String,
    default: "pending", // pending, approved, rejected
  },
});

export default mongoose.model("StudentData", studentSchema);
