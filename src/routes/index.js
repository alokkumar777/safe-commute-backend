const { Router } = require("express");
const router = Router();

router.get("/health", (req, res) =>
  res.json({ ok: true, service: "safe-commute-api", ts: Date.now() })
);

router.use("/auth", require("./auth.routes"));
router.use("/contacts", require("./contacts.routes"));
router.use("/trips", require("./trips.routes"));
router.use("/sos", require("./sos.routes"));

module.exports = router;
