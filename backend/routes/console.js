import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js'; 
import Role from '../models/Role.js'; 

const router = express.Router();

// Route: GET /api/admin/console/users
// Description: Fetches a list of users for the admin console
// Access: Admin role with 'manage_users' permission
router.get(
    '/console/users',
    authenticate, // 1. Ensure user is logged in
    authorize('manage_users'), // 2. Ensure user has 'manage_users' permission
    async (req, res) => {
        try {
            // Fetch all users with their associated role
            const users = await User.findAll({
                attributes: ['id', 'firstName', 'lastName'], // Select specific user attributes
                include: [{
                    model: Role,
                    as: 'role', // Use the alias defined in the User model association
                    attributes: ['name'] // Select only the role name
                }],
                order: [
                    ['lastName', 'ASC'], // Order users alphabetically by last name
                    ['firstName', 'ASC']
                ]
            });

            // Format the response
            const formattedUsers = users.map(user => ({
                id: user.id,
                fullName: `${user.firstName} ${user.lastName}`,
                role: user.role ? user.role.name : 'N/A', // Display role name, handle null roles
                // Placeholder indicating that permission change is possible via another endpoint/action
                canChangePermission: true 
            }));

            res.json(formattedUsers);

        } catch (error) {
            console.error('Error fetching users for admin console:', error);
            res.status(500).json({ error: 'Failed to fetch users.' });
        }
    }
);

router.patch(
    '/console/users/:id/role',
    authenticate, // Ensure user is logged in
    authorize('manage_users'), // Ensure user has 'manage_users' permission
    async (req, res) => {
        const userId = req.params.id;
        const { roleId } = req.body;

        try {
            // Validate roleId
            if (!roleId) {
                return res.status(400).json({ error: 'Role ID is required.' });
            }

            // Find the user by ID
            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found.' });
            }

            // Update the user's role
            user.role_id = roleId; // Assuming role_id is the foreign key in User model
            await user.save();

            res.json({ message: 'User role updated successfully.' });

        } catch (error) {
            console.error('Error updating user role:', error);
            res.status(500).json({ error: 'Failed to update user role.' });
        }
    }
);

export default router;

