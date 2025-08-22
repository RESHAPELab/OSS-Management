const express = require('express');
const router = express.Router();
const {
    getAdmins,
    addAdmin,
    updateAdmin,
    deleteAdmin,
    getAdminPermissions
} = require('../controllers/adminController');

// Admin management routes for groups/classes

// GET /api/admin/groups/:groupId/admins - Get all admins for a group
router.get('/groups/:groupId/admins', getAdmins);

// POST /api/admin/groups/:groupId/admins - Add a new admin to a group
router.post('/groups/:groupId/admins', addAdmin);

// PUT /api/admin/groups/:groupId/admins/:adminId - Update an existing admin
router.put('/groups/:groupId/admins/:adminId', updateAdmin);

// DELETE /api/admin/groups/:groupId/admins/:adminId - Delete an admin
router.delete('/groups/:groupId/admins/:adminId', deleteAdmin);

// GET /api/admin/groups/:groupId/permissions/:githubUsername - Get admin permissions
router.get('/groups/:groupId/permissions/:githubUsername', getAdminPermissions);

module.exports = router;
