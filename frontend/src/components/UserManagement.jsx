import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminConsole = () => {
  // State for users data
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Filter users when search term or role filter changes
  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);
  
  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/admin/console/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter users based on search term and role filter
  const filterUsers = () => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle role filter change
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
  };
  
  // Open modal to change user role
  const openChangeRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setIsModalOpen(true);
  };
  
  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };
  
  // Handle role change
  const handleRoleChange = async () => {
    if (!selectedUser) return;
    
    try {
      // In a real application, you would make an API call here
      // For example:
      await axios.patch(`/api/admin/console/users/${selectedUser.id}/role`, {
        roleId: getRoleIdFromName(selectedRole)
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      // Update local state
      const updatedUsers = users.map(user => {
        if (user.id === selectedUser.id) {
          return { ...user, role: selectedRole };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      
      // Close modal
      closeModal();
      
      // Show success message (you can implement a toast notification system)
      console.log(`User ${selectedUser.fullName}'s role updated to ${selectedRole}`);
      
    } catch (err) {
      console.error('Error updating role:', err);
      // Show error message
    }
  };
  
  // Helper function to get role ID from name (implement based on your role data structure)
  const getRoleIdFromName = (roleName) => {
    const roleMap = {
      'Admin': 1,
      'Citizen': 2,
      'Staff': 3,
      'Head': 4
    };
    return roleMap[roleName] || 1;
  };
  
  // Calculate pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  
  // Get appropriate CSS class for role badge
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800';
      case 'Citizen':
        return 'bg-blue-100 text-blue-800';
      case 'Staff':
        return 'bg-green-100 text-green-800';
      case 'Head':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-amber-700">Admin Console - User Management</h1>
        <p className="text-lg text-gray-600">Manage user roles and permissions</p>
      </header>
      
      {/* Main Content */}
      <main>
        {/* Search/Filter Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <input 
              type="text" 
              placeholder="Search users by name..." 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div>
            <select 
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={roleFilter}
              onChange={handleRoleFilterChange}
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Citizen">Citizen</option>
              <option value="Staff">Staff</option>
              <option value="Head">Head</option>
            </select>
          </div>
        </div>
        
        {/* User Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-amber-400">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                  Full Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                  Current Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-red-500">
                    <div className="flex flex-col items-center">
                      <svg className="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Error: {error}
                    </div>
                    <button 
                      className="mt-2 px-3 py-1 bg-amber-500 text-white rounded-md hover:bg-amber-600"
                      onClick={fetchUsers}
                    >
                      Try Again
                    </button>
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                currentUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={index % 2 === 0 ? 'bg-white hover:bg-amber-50' : 'bg-amber-50 hover:bg-amber-100'}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        onClick={() => openChangeRoleModal(user)}
                      >
                        Change Permission
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && !error && filteredUsers.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-600">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex space-x-2">
              <button 
                className="px-3 py-1 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button 
                className="px-3 py-1 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
      
      {/* Change Role Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Change User Role</h2>
            <p className="mb-4">Change role for: <span className="font-semibold">{selectedUser.fullName}</span></p>
            
            <div className="mb-4">
              <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
              <select 
                id="role-select" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="Admin">Admin</option>
                <option value="Citizen">Citizen</option>
                <option value="Staff">Staff</option>
                <option value="Head">Head</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                onClick={handleRoleChange}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
