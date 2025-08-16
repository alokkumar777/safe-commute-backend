const router = require("express").Router();
const { requireAuth } = require("../middlewares/auth");
const { contactSchema } = require("../utils/validators");

// All routes protected
router.use(requireAuth);

// GET /api/contacts
router.get("/", async (req, res) => {
  res.json({ ok: true, contacts: req.user.contacts || [] });
});

// POST /api/contacts
router.post("/", async (req, res, next) => {
  try {
    const data = await contactSchema.validateAsync(req.body);
    // ensure only one preferred
    if (data.preferred) {
      req.user.contacts.forEach((c) => (c.preferred = false));
    }
    req.user.contacts.push(data);
    await req.user.save();
    res.status(201).json({ ok: true, contacts: req.user.contacts });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/contacts/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const data = await contactSchema
      .fork(["name", "phone"], (s) => s.optional())
      .validateAsync(req.body);
    const c = req.user.contacts.id(req.params.id);
    if (!c)
      return res.status(404).json({ ok: false, message: "Contact not found" });

    if (data.preferred) {
      req.user.contacts.forEach((x) => (x.preferred = false));
    }
    Object.assign(c, data);
    await req.user.save();
    res.json({ ok: true, contacts: req.user.contacts });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/contacts/:id
router.delete("/:id", async (req, res) => {
  const c = req.user.contacts.id(req.params.id);
  if (!c)
    return res.status(404).json({ ok: false, message: "Contact not found" });
  c.deleteOne();
  await req.user.save();
  res.json({ ok: true, contacts: req.user.contacts });
});

module.exports = router;
