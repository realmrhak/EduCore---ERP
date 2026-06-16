const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { category, page = 1, limit = 25 } = req.query;
    const query = {};
    if (category) query.category = category;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [logs, count] = await Promise.all([
      ActivityLog.find(query)
        .populate('user', 'name role')
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum),
      ActivityLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      total: count,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum),
      hasMore: pageNum * limitNum < count,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
