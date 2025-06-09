import User from '../models/User.js';
import Role from '../models/Role.js';

// Get all users for admin console
export const getUsers = async (req, res) => {
    try {
        // Fetch all users with their associated role
        const users = await User.findAll({
            attributes: ['id', 'firstName', 'lastName'],
            include: [{
                model: Role,
                as: 'role',
                attributes: ['name']
            }],
            order: [
                ['lastName', 'ASC'],
                ['firstName', 'ASC']
            ]
        });

        // Format the response
        const formattedUsers = users.map(user => ({
            id: user.id,
            fullName: `${user.firstName} ${user.lastName}`,
            role: user.role ? user.role.name : 'N/A',
            canChangePermission: true
        }));

        res.json(formattedUsers);
    } catch (error) {
        console.error('Error fetching users for admin console:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

// Update user role
export const updateUserRole = async (req, res) => {
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
        user.role_id = roleId;
        await user.save();

        res.json({ message: 'User role updated successfully.' });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role.' });
    }
}; 