import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    regNumber: {
        type: String,
        required: true,
        unique: true
    },
    session: String,
    wing: String,
    roomNo: String,
    bedNo: String,
    roomType: String,
    paymentFreq: String,
    startDate: String,
    endDate: String,
    status: {
        type: String,
        default: "pending" // pending, assigned
    }
});

export default mongoose.model("StudentData", studentSchema);