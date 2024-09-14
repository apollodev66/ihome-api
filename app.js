const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const jwt = require("jsonwebtoken");

// Create an Express application
const app = express();
const port = 3001;

// JWT Secret Key
const JWT_SECRET = "ihome-cnc";

// Database configuration
const dbConfig = {
  user: "sa",
  password: "@dmin001",
  server: "192.168.101.2",
  database: "IHOMEDB",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Configure CORS
app.use(
  cors({
    origin: 'http://localhost:3000', // อนุญาตให้ frontend ที่รันบน localhost:3000 เรียกใช้ API ได้
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // อนุญาต HTTP methods ที่ต้องการ
    allowedHeaders: ['Content-Type', 'Authorization'], // อนุญาต headers ที่จำเป็น
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'uploads' directory
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Multer configuration for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Connect to SQL Server
const poolPromise = sql.connect(dbConfig).catch((err) => {
  console.error("Database connection failed:", err);
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  console.log("Received /login request");
  const { CODE, USERPASS } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("CODE", sql.VarChar, CODE)
      .query("SELECT * FROM CSUSER WHERE CODE = @CODE");

    const CSUSER = result.recordset;

    if (CSUSER.length === 0) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    if (USERPASS === CSUSER[0].USERPASS) {
      const token = jwt.sign({ CODE: CSUSER[0].CODE }, JWT_SECRET, {
        expiresIn: "6h",
      });
      return res.json({
        status: "ok",
        message: "login success",
        token,
        code: CSUSER[0].CODE,
        mynameth: CSUSER[0].MYNAMETH,
      });
    } else {
      return res.status(401).json({ status: "error", message: "Invalid password" });
    }
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
});

// Endpoint for submitting data with file uploads
app.post(
  "/api/submit",
  upload.fields([
    { name: "frontImg", maxCount: 1 },
    { name: "leftImg", maxCount: 1 },
    { name: "rightImg", maxCount: 1 },
    { name: "backImg", maxCount: 1 },
    { name: "interiorImg", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      if (!req.files) {
        return res.status(400).json({ error: "No files were uploaded." });
      }

      const pool = await poolPromise;
      const {
        cusname,
        cusphone,
        coupon,
        notes,
        province,
        address,
        architect,
        architectPhone,
        contractor,
        contractorPhone,
        foreman,
        foremanPhone,
        buildingType,
        companyName,
        companyPhone,
        purchaserName,
        purchaserPhone,
        budget,
        completedSteps,
        uncompletedSteps,
        appointment,
        location,
        surveyDate,
      } = req.body;

      const request = pool.request();
      request.input("cusname", sql.NVarChar, cusname);
      request.input("cusphone", sql.NVarChar, cusphone);
      request.input("coupon", sql.NVarChar, coupon);
      request.input("notes", sql.NVarChar, notes);
      request.input("province", sql.NVarChar, province);
      request.input("address", sql.NVarChar, address);
      request.input("architect", sql.NVarChar, architect);
      request.input("architectPhone", sql.NVarChar, architectPhone);
      request.input("contractor", sql.NVarChar, contractor);
      request.input("contractorPhone", sql.NVarChar, contractorPhone);
      request.input("foreman", sql.NVarChar, foreman);
      request.input("foremanPhone", sql.NVarChar, foremanPhone);
      request.input("buildingType", sql.NVarChar, buildingType);
      request.input("companyName", sql.NVarChar, companyName);
      request.input("companyPhone", sql.NVarChar, companyPhone);
      request.input("purchaserName", sql.NVarChar, purchaserName);
      request.input("purchaserPhone", sql.NVarChar, purchaserPhone);
      request.input("budget", sql.NVarChar, budget);
      request.input("completedSteps", sql.NVarChar, JSON.stringify(completedSteps));
      request.input("uncompletedSteps", sql.NVarChar, JSON.stringify(uncompletedSteps));
      request.input("appointment", sql.NVarChar, appointment);
      request.input("location", sql.NVarChar, location);
      request.input("surveyDate", sql.NVarChar, surveyDate);

      const { frontImg, leftImg, rightImg, backImg, interiorImg } = req.files;
      request.input("frontImg", sql.NVarChar, frontImg ? frontImg[0].filename : null);
      request.input("leftImg", sql.NVarChar, leftImg ? leftImg[0].filename : null);
      request.input("rightImg", sql.NVarChar, rightImg ? rightImg[0].filename : null);
      request.input("backImg", sql.NVarChar, backImg ? backImg[0].filename : null);

      const interiorImgFilenames = interiorImg
        ? interiorImg.map((file) => file.filename).join(",")
        : null;
      request.input("interiorImg", sql.NVarChar, interiorImgFilenames);

      await request.query(`
        INSERT INTO testproject1 (
          cusname, cusphone, coupon, notes, province, address, architect, architectPhone, contractor, contractorPhone,
          foreman, foremanPhone, buildingType, companyName, companyPhone, purchaserName, purchaserPhone, budget,
          completedSteps, uncompletedSteps, appointment, location, surveyDate, frontImg, leftImg, rightImg, backImg, interiorImg
        ) VALUES (
          @cusname, @cusphone, @coupon, @notes, @province, @address, @architect, @architectPhone, @contractor, @contractorPhone,
          @foreman, @foremanPhone, @buildingType, @companyName, @companyPhone, @purchaserName, @purchaserPhone, @budget,
          @completedSteps, @uncompletedSteps, @appointment, @location, @surveyDate, @frontImg, @leftImg, @rightImg, @backImg, @interiorImg
        )
      `);

      res.status(200).json({ message: "Data inserted successfully" });
    } catch (error) {
      console.error("Error inserting data:", error);
      res.status(500).json({ error: "An error occurred", details: error.message });
    }
  }
);

// Endpoint for retrieving data
app.get("/api/testproject1", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM testproject1");
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching data from the database:", err);
    res.status(500).send("Error fetching data from the database.");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
