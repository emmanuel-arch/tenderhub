import sql from "mssql";

const config = {
  server: "45.150.188.26",
  port: 4420,
  database: "TenderHub",
  user: "tester",
  password: "Ngong123@",
  options: { encrypt: true, trustServerCertificate: true },
  connectionTimeout: 20000,
};

(async () => {
  try {
    const pool = await sql.connect(config);
    const r = await pool
      .request()
      .query(
        "SELECT COUNT(*) AS Total, SUM(CASE WHEN BidBondRequired = 1 THEN 1 ELSE 0 END) AS Bonds FROM ScrapedTenders",
      );
    console.log("ScrapedTenders =", r.recordset[0]);

    const samples = await pool
      .request()
      .query(
        "SELECT TOP 3 Id, Title, Category, SubCategory, Deadline, BidBondAmount FROM ScrapedTenders WHERE Deadline > GETUTCDATE() ORDER BY Deadline ASC",
      );
    console.log("Sample upcoming:");
    for (const row of samples.recordset) console.log(" -", row);

    const detailsCount = await pool
      .request()
      .query("SELECT COUNT(*) AS Total FROM TenderDocumentDetails");
    console.log("TenderDocumentDetails =", detailsCount.recordset[0]);

    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error("DB smoke failed:", err.message);
    process.exit(1);
  }
})();
