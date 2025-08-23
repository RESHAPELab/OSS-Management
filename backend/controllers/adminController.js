const Group = require('../models/GroupModel');
const mongoose = require('mongoose');

// Get all admins for a specific group/class
const getAdmins = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Validate groupId
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid group ID format' 
            });
        }

        const group = await Group.findById(groupId).select('admins');
        
        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: 'Group not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            data: group.admins || [] 
        });
    } catch (error) {
        console.error('[getAdmins] Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch admins', 
            error: error.message 
        });
    }
};

// Add a new admin to a group/class
const addAdmin = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { githubUsername, role = 'assistant' } = req.body;

        // Validate input
        if (!githubUsername || !githubUsername.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'GitHub username is required' 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid group ID format' 
            });
        }

        // Validate role
        const validRoles = ['professor', 'assistant', 'grader', 'mentor', 'moderator', 'other'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid role specified' 
            });
        }

        const group = await Group.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: 'Group not found' 
            });
        }

        // Check if admin already exists
        const existingAdmin = group.admins.find(admin => 
            admin.githubUsername.toLowerCase() === githubUsername.toLowerCase()
        );
        
        if (existingAdmin) {
            return res.status(409).json({ 
                success: false, 
                message: 'Admin with this GitHub username already exists' 
            });
        }

        // Add new admin
        const newAdmin = {
            githubUsername: githubUsername.trim(),
            role: role,
            addedAt: new Date(),
            // Note: In a real implementation, you'd get addedBy from authentication middleware
            // addedBy: req.user._id
        };

        group.admins.push(newAdmin);
        await group.save();

        // Return the newly added admin
        const addedAdmin = group.admins[group.admins.length - 1];

        res.status(201).json({ 
            success: true, 
            message: 'Admin added successfully',
            data: addedAdmin
        });
    } catch (error) {
        console.error('[addAdmin] Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add admin', 
            error: error.message 
        });
    }
};

// Update an existing admin
const updateAdmin = async (req, res) => {
    try {
        const { groupId, adminId } = req.params;
        const { githubUsername, role } = req.body;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid group ID format' 
            });
        }

        if (!githubUsername || !githubUsername.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'GitHub username is required' 
            });
        }

        // Validate role
        const validRoles = ['professor', 'assistant', 'grader', 'mentor', 'moderator', 'other'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid role specified' 
            });
        }

        const group = await Group.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: 'Group not found' 
            });
        }

        // Find admin to update
        const adminIndex = group.admins.findIndex(admin => admin._id.toString() === adminId);
        
        if (adminIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin not found' 
            });
        }

        // Check if new username conflicts with existing admin (excluding current admin)
        const conflictingAdmin = group.admins.find((admin, index) => 
            index !== adminIndex && 
            admin.githubUsername.toLowerCase() === githubUsername.toLowerCase()
        );
        
        if (conflictingAdmin) {
            return res.status(409).json({ 
                success: false, 
                message: 'Another admin with this GitHub username already exists' 
            });
        }

        // Update admin
        group.admins[adminIndex].githubUsername = githubUsername.trim();
        if (role) {
            group.admins[adminIndex].role = role;
        }

        await group.save();

        res.status(200).json({ 
            success: true, 
            message: 'Admin updated successfully',
            data: group.admins[adminIndex]
        });
    } catch (error) {
        console.error('[updateAdmin] Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update admin', 
            error: error.message 
        });
    }
};

// Delete an admin
const deleteAdmin = async (req, res) => {
    try {
        const { groupId, adminId } = req.params;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid group ID format' 
            });
        }

        const group = await Group.findById(groupId);
        
        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: 'Group not found' 
            });
        }

        // Find admin to delete
        const adminIndex = group.admins.findIndex(admin => admin._id.toString() === adminId);
        
        if (adminIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin not found' 
            });
        }

        // Remove admin
        const deletedAdmin = group.admins.splice(adminIndex, 1)[0];
        await group.save();

        res.status(200).json({ 
            success: true, 
            message: 'Admin deleted successfully',
            data: deletedAdmin
        });
    } catch (error) {
        console.error('[deleteAdmin] Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete admin', 
            error: error.message 
        });
    }
};

// Get admin permissions (for future use)
const getAdminPermissions = async (req, res) => {
    try {
        const { groupId, githubUsername } = req.params;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid group ID format' 
            });
        }

        const group = await Group.findById(groupId).select('admins');
        
        if (!group) {
            return res.status(404).json({ 
                success: false, 
                message: 'Group not found' 
            });
        }

        const admin = group.admins.find(admin => 
            admin.githubUsername.toLowerCase() === githubUsername.toLowerCase()
        );

        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin not found' 
            });
        }

        // Return role-based permissions
        const permissions = {
            professor: ['full_access'],
            assistant: ['manage_students', 'manage_quests', 'view_progress'],
            grader: ['grade_assignments', 'view_progress'],
            mentor: ['view_progress'],
            moderator: ['manage_students', 'view_progress'],
            other: ['view_progress']
        };

        res.status(200).json({ 
            success: true, 
            data: {
                role: admin.role,
                permissions: permissions[admin.role] || permissions.other
            }
        });
    } catch (error) {
        console.error('[getAdminPermissions] Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get admin permissions', 
            error: error.message 
        });
    }
};

module.exports = {
    getAdmins,
    addAdmin,
    updateAdmin,
    deleteAdmin,
    getAdminPermissions
};
