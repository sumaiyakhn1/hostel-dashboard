import express from "express";
import Student from "../models/Student.js";

const router = express.Router();

router.post("/:regNumber", async (req, res) => {
    try {
        const regNumber = req.params.regNumber;

        if (!regNumber) {
            return res.status(400).json({ message: "regNumber required" });
        }

        // ✅ Pehle check karo
        const existing = await Student.findOne({ regNumber });
        if (existing) {
            return res.status(409).json({ message: "You are already registered!" });
        }

        // ✅ Tabhi save karo
        const student = new Student({ ...req.body, regNumber });
        await student.save();

        res.json({ message: "Data Saved Successfully", student });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;