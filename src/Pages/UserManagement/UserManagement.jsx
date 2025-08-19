import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  FiSearch, 
  FiX, 
  FiEye, 
  FiEyeOff, 
  FiLoader, 
  FiEdit, 
  FiTrash2, 
  FiSave,
  FiUser,
  FiHash
} from "react-icons/fi";
import { getUsers, register, updateUser, deleteUser } from "../../Api/Auth";
import Sidebar from "../../Components/sidebar/Sidebar.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Constants
const ITEMS_PER_PAGE = 11;
const DEBOUNCE_DELAY = 300;
const MAX_VISIBLE_BUTTONS = 5;

const INITIAL_FORM_DATA = {
  mobile: "",
  email: "",
  password: "",
  role: "",
  firstname: "",
  middlename: "",
  lastname: "",
  account_number: "",
};

const FORM_FIELDS = [
  { name: "account_number", placeholder: "Account Number", type: "text" },
  { name: "mobile", placeholder: "Mobile Number", maxLength: 10 },
  { name: "email", placeholder: "Email Address", type: "email" },
  { name: "firstname", placeholder: "First Name" },
  { name: "middlename", placeholder: "Middle Name" },
  { name: "lastname", placeholder: "Last Name" },
];

// Custom hooks
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Validation utilities
const validateForm = (formData, isEdit = false) => {
  const { mobile, email, password, firstname, lastname, account_number } = formData;

  if (!account_number || account_number.length < 3) {
    return { isValid: false, message: "Account number must be at least 3 characters" };
  }

  if (!/^[0-9]{10}$/.test(mobile)) {
    return { isValid: false, message: "Enter exactly 10 digit mobile number" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Enter a valid email address" };
  }

  if (!firstname || firstname.length < 2) {
    return { isValid: false, message: "First name must be at least 2 characters" };
  }

  if (!lastname || lastname.length < 2) {
    return { isValid: false, message: "Last name must be at least 2 characters" };
  }

  // Password validation only for new users or when password is provided
  if ((!isEdit && !password) || (password && password.trim() !== '')) {
    if (!isEdit && !password) {
      return { isValid: false, message: "Password is required" };
    }
    if (password && password.trim() !== '') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{6,}$/;
      if (!passwordRegex.test(password)) {
        return {
          isValid: false,
          message: "Password must contain uppercase, lowercase, number, special character",
        };
      }
    }
  }

  return { isValid: true };
};

// Helper function to get farmer's full name
const getFarmerName = (user) => {
  const { firstname = "", middlename = "", lastname = "", farmer_name = "" } = user;
  
  if (farmer_name && farmer_name.trim()) {
    return farmer_name.trim();
  }
  
  const nameParts = [firstname, middlename, lastname].filter(part => part && part.trim());
  return nameParts.length > 0 ? nameParts.join(" ") : "N/A";
};

// Helper function to get mobile number
const getMobileNumber = (user) => {
  return user.mobile_number || user.mobile || user.mobileno || "N/A";
};

// Helper function to get account number
const getAccountNumber = (user) => {
  return user.account_number || user.accountNumber || user.account_no || "N/A";
};

// Components
const PaginationButton = React.memo(
  ({ onClick, children, isActive = false }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded transition-colors ${
        isActive
          ? "bg-blue-600 text-white"
          : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
      }`}
    >
      {children}
    </button>
  )
);

const FormField = React.memo(
  ({ field, value, onChange, showPassword, onTogglePassword }) => {
    if (field.name === "password") {
      return (
        <div className="relative w-full">
          <input
            name={field.name}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={field.placeholder}
            className="w-full bg-[#3b3f5c] text-white px-4 py-2 rounded outline-none placeholder-gray-400 focus:bg-[#4a4e6b]"
          />
          <div
            onClick={onTogglePassword}
            className="absolute right-4 top-3 cursor-pointer text-gray-400 hover:text-white"
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </div>
        </div>
      );
    }

    return (
      <input
        name={field.name}
        type={field.type || "text"}
        value={value}
        onChange={onChange}
        placeholder={field.placeholder}
        maxLength={field.maxLength}
        className="w-full bg-[#3b3f5c] text-white px-4 py-2 rounded outline-none placeholder-gray-400 focus:bg-[#4a4e6b]"
      />
    );
  }
);

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && <FiLoader className="animate-spin" />}
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserManagementPage = () => {
  // State management
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);

  // Memoized computations
  const filteredUsers = useMemo(() => {
    if (!debouncedSearchTerm) return users;

    const searchLower = debouncedSearchTerm.toLowerCase();
    return users.filter((user) =>
      [user.email, user.role, getFarmerName(user), getMobileNumber(user), getAccountNumber(user)]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(searchLower))
    );
  }, [users, debouncedSearchTerm]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    return { totalPages, startIndex, endIndex, currentUsers };
  }, [filteredUsers, currentPage]);

  const paginationButtons = useMemo(() => {
    const { totalPages } = paginationData;
    const buttons = [];

    let startPage = Math.max(
      1,
      currentPage - Math.floor(MAX_VISIBLE_BUTTONS / 2)
    );
    let endPage = Math.min(totalPages, startPage + MAX_VISIBLE_BUTTONS - 1);

    if (endPage - startPage + 1 < MAX_VISIBLE_BUTTONS) {
      startPage = Math.max(1, endPage - MAX_VISIBLE_BUTTONS + 1);
    }

    // Previous button
    if (currentPage > 1) {
      buttons.push(
        <PaginationButton
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
        >
          ‹
        </PaginationButton>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <PaginationButton
          key={i}
          onClick={() => handlePageChange(i)}
          isActive={currentPage === i}
        >
          {i}
        </PaginationButton>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      buttons.push(
        <PaginationButton
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
        >
          ›
        </PaginationButton>
      );
    }

    return buttons;
  }, [currentPage, paginationData]);

  // API calls - Original format theun theva
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      console.log('Users API Response:', response);

      // Response.data handle kara tumchya original code sarkha
      const userData = response.data || response || [];
      console.log('Processed User Data:', userData);
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Event handlers
  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Special handling for mobile number - only allow digits
    if (name === "mobile") {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue.length <= 10) {
        setFormData((prev) => ({
          ...prev,
          [name]: numericValue,
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value.trimStart(),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    const validation = validateForm(formData, !!editingUser);
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    try {
      setSaving(true);
      
      if (editingUser) {
        // Update existing user - tumchya original payload format
        const payload = {
          id: editingUser.id,
          mobileno: formData.mobile,
          email: formData.email,
          firstName: formData.firstname,
          middleName: formData.middlename || '',
          lastName: formData.lastname,
          role: formData.role || 'user',
          account_number: formData.account_number,
        };

        // Only include password if provided
        if (formData.password && formData.password.trim() !== '') {
          payload.password = formData.password;
        }

        const response = await updateUser(payload);
        console.log('Update response:', response);
        toast.success("User updated successfully!");
      } else {
        // Create new user
        const payload = {
          mobileno: formData.mobile,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstname,
          middleName: formData.middlename || '',
          lastName: formData.lastname,
          role: formData.role || 'user',
          account_number: formData.account_number,
        };

        const response = await register(payload);
        console.log('Register response:', response);
        toast.success("User registered successfully!");
      }

      setIsSidebarOpen(false);
      setFormData(INITIAL_FORM_DATA);
      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      console.error("Failed to save user:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to save user";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [formData, editingUser, fetchUsers]);

  const handleEdit = useCallback((user) => {
    setEditingUser(user);
    setFormData({
      mobile: getMobileNumber(user).toString(),
      email: user.email || '',
      password: '', // Don't pre-fill password for security
      role: user.role || '',
      firstname: user.firstname || '',
      middlename: user.middlename || '',
      lastname: user.lastname || '',
      account_number: getAccountNumber(user).toString(),
    });
    setIsSidebarOpen(true);
  }, []);

  const handleDeleteClick = useCallback((user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const response = await deleteUser(userToDelete.id);
      console.log('Delete response:', response);
      toast.success("User deleted successfully!");
      setShowDeleteModal(false);
      setUserToDelete(null);
      await fetchUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to delete user";
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [userToDelete, fetchUsers]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
    if (isSidebarOpen) {
      setFormData(INITIAL_FORM_DATA);
      setEditingUser(null);
      setShowPassword(false);
    }
  }, [isSidebarOpen]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  // Effects
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const { totalPages, startIndex, endIndex, currentUsers } = paginationData;

  return (
    <div className="w-screen h-screen overflow-hidden bg-white text-black flex relative">
      <ToastContainer />

      <aside className="w-[250px] bg-[#23243a] h-full">
        <Sidebar />
      </aside>

      <main className="flex-1 h-full flex flex-col p-6 overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-black">Farmer List</h1>
            <p className="text-sm text-gray-600">
              All dairy system users ({filteredUsers.length} total)
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Farmer"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-100 border border-gray-300 text-sm px-4 py-2 pr-10 rounded focus:outline-none focus:border-blue-500 placeholder-gray-500 text-black"
              />
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white transition-colors flex items-center gap-2"
              onClick={toggleSidebar}
            >
              <FiUser size={16} />
              Add Farmer
            </button>
          </div>
        </div>

        {/* Table Container with proper scrolling */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Account No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Farmer Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Mobile No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                    Role
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      <FiLoader className="animate-spin mx-auto mb-2" size={24} />
                      Loading users...
                    </td>
                  </tr>
                ) : currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      {filteredUsers.length === 0
                        ? "No users found"
                        : "No users on this page"}
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user, index) => (
                    <tr
                      key={user.id || `user-${startIndex + index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <FiHash className="text-gray-400" size={14} />
                          {getAccountNumber(user)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                        {getFarmerName(user)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {user.email || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {getMobileNumber(user)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.role
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {user.role || "No Role"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-full transition-colors"
                            title="Edit User"
                          >
                            <FiEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-full transition-colors"
                            title="Delete User"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination - Fixed at bottom */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <div className="flex gap-1">{paginationButtons}</div>
          </div>
        )}
      </main>

      {/* Sidebar Modal */}
      {isSidebarOpen && (
        <div className="fixed top-0 right-0 h-full w-[400px] bg-[#2f314d] shadow-lg p-6 z-50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              {editingUser ? 'Edit Farmer' : 'Add New Farmer'}
            </h2>
            <button
              onClick={toggleSidebar}
              className="text-red-500 hover:text-red-700 bg-white rounded-full p-1 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {FORM_FIELDS.map((field) => (
              <FormField
                key={field.name}
                field={field}
                value={formData[field.name]}
                onChange={handleFormChange}
              />
            ))}

            <FormField
              field={{ 
                name: "password", 
                placeholder: editingUser ? "New Password (leave blank to keep current)" : "Password" 
              }}
              value={formData.password}
              onChange={handleFormChange}
              showPassword={showPassword}
              onTogglePassword={togglePasswordVisibility}
            />

            <input
              name="role"
              value={formData.role}
              onChange={handleFormChange}
              placeholder="Role (e.g., Farmer)"
              className="w-full bg-[#3b3f5c] text-white px-4 py-2 rounded outline-none placeholder-gray-400 focus:bg-[#4a4e6b]"
            />
          </div>

          <div className="flex justify-start gap-3 mt-6">
            <button
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
              onClick={toggleSidebar}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <FiLoader className="animate-spin" />}
              <FiSave size={16} />
              {saving ? "Saving..." : (editingUser ? "Update" : "Save")}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isLoading={deleting}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete ? getFarmerName(userToDelete) : 'this user'}? This action cannot be undone.`}
      />
    </div>
  );
};

export default UserManagementPage;