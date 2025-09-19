// Admin Dashboard functionality
let currentUser = null;

function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }
    currentUser = user;
    loadAdminDashboard();
    return true;
}

function loadAdminDashboard() {
    // Set welcome text
    document.getElementById('welcomeText').textContent = `Welcome, ${currentUser.name}`;
    
    // Load all data
    updateAdminStats();
    loadCustomersTable();
    loadDispatchersTable();
    loadAllParcelsTable();
}

function updateAdminStats() {
    const stats = window.dataManager.getStats();
    
    document.getElementById('totalCustomers').textContent = stats.totalCustomers;
    document.getElementById('totalDispatchers').textContent = stats.totalDispatchers;
    document.getElementById('totalParcels').textContent = stats.totalParcels;
    document.getElementById('pendingParcels').textContent = stats.pendingParcels;
    document.getElementById('totalRevenue').textContent = `$${stats.totalRevenue}`;
}

function loadCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const customers = window.dataManager.getCustomers();
    
    customers.forEach(customer => {
        const customerParcels = window.dataManager.getParcelsByCustomer(customer.id).length;
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${customer.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customer.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customer.phone}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customerParcels}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(customer.createdAt).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button onclick="toggleUserStatus('${customer.id}')" class="text-${customer.isActive ? 'red' : 'green'}-600 hover:text-${customer.isActive ? 'red' : 'green'}-900" title="${customer.isActive ? 'Deactivate' : 'Activate'} User">
                    <i class="fas fa-${customer.isActive ? 'ban' : 'check'}"></i>
                </button>
                <button onclick="viewUserDetails('${customer.id}')" class="text-blue-600 hover:text-blue-900" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="deleteUser('${customer.id}')" class="text-red-600 hover:text-red-900" title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function loadDispatchersTable() {
    const tbody = document.getElementById('dispatchersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const dispatchers = window.dataManager.getDispatchers();
    
    dispatchers.forEach(dispatcher => {
        const approvedCount = window.dataManager.getAllParcels().filter(p => p.approvedBy === dispatcher.id).length;
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${dispatcher.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dispatcher.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dispatcher.phone}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${approvedCount}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(dispatcher.createdAt).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button onclick="toggleUserStatus('${dispatcher.id}')" class="text-${dispatcher.isActive ? 'red' : 'green'}-600 hover:text-${dispatcher.isActive ? 'red' : 'green'}-900" title="${dispatcher.isActive ? 'Deactivate' : 'Activate'} User">
                    <i class="fas fa-${dispatcher.isActive ? 'ban' : 'check'}"></i>
                </button>
                <button onclick="viewUserDetails('${dispatcher.id}')" class="text-blue-600 hover:text-blue-900" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="deleteUser('${dispatcher.id}')" class="text-red-600 hover:text-red-900" title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function loadAllParcelsTable() {
    const tbody = document.getElementById('parcelsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const allParcels = window.dataManager.getAllParcels();
    
    allParcels.forEach(parcel => {
        const customer = window.dataManager.getUserById(parcel.customerId);
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        const statusColors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-blue-100 text-blue-800',
            'in-transit': 'bg-purple-100 text-purple-800',
            'out-for-delivery': 'bg-orange-100 text-orange-800',
            'delivered': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800'
        };
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${parcel.trackingNumber}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${customer ? customer.name : parcel.customerName || 'Unknown'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parcel.recipientName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parcel.senderPhone}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <select onchange="updateParcelStatus('${parcel.id}', this.value)" class="text-xs border rounded px-2 py-1 ${statusColors[parcel.status] || 'bg-gray-100 text-gray-800'}">
                    <option value="pending" ${parcel.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="approved" ${parcel.status === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="in-transit" ${parcel.status === 'in-transit' ? 'selected' : ''}>In Transit</option>
                    <option value="out-for-delivery" ${parcel.status === 'out-for-delivery' ? 'selected' : ''}>Out for Delivery</option>
                    <option value="delivered" ${parcel.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="rejected" ${parcel.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${parcel.estimatedCost}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(parcel.createdAt).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button onclick="viewParcelDetails('${parcel.id}')" class="text-blue-600 hover:text-blue-900" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="deleteParcel('${parcel.id}')" class="text-red-600 hover:text-red-900" title="Delete Parcel">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Admin action functions
function addNewDispatcher() {
    showModal('addDispatcherModal');
}

function handleAddDispatcher(e) {
    e.preventDefault();
    
    const dispatcherData = {
        name: document.getElementById('dispatcherName').value,
        email: document.getElementById('dispatcherEmail').value,
        phone: document.getElementById('dispatcherPhone').value,
        address: document.getElementById('dispatcherAddress').value,
        password: 'dispatch123', // Default password
        role: 'dispatcher'
    };
    
    const result = window.dataManager.addUser(dispatcherData);
    
    if (result.success) {
        showSuccessNotification('Dispatcher added successfully!');
        closeModal('addDispatcherModal');
        document.getElementById('addDispatcherForm').reset();
        loadAdminDashboard();
    } else {
        showErrorNotification(result.message);
    }
}

function toggleUserStatus(userId) {
    const user = window.dataManager.getUserById(userId);
    if (user) {
        const result = window.dataManager.updateUser(userId, { isActive: !user.isActive });
        if (result.success) {
            showSuccessNotification(`User ${result.user.isActive ? 'activated' : 'deactivated'}!`);
            loadAdminDashboard();
        }
    }
}

function deleteUser(userId) {
    if (showConfirmDialog('Are you sure you want to delete this user? This action cannot be undone.')) {
        const result = window.dataManager.deleteUser(userId);
        if (result.success) {
            showSuccessNotification('User deleted successfully!');
            loadAdminDashboard();
        }
    }
}

function updateParcelStatus(parcelId, newStatus) {
    const updates = { 
        status: newStatus,
        updatedAt: new Date().toISOString()
    };
    
    // Add additional fields based on status
    if (newStatus === 'approved') {
        updates.approvedBy = currentUser.id;
        updates.approvedAt = new Date().toISOString();
    } else if (newStatus === 'rejected') {
        const reason = prompt('Please enter rejection reason:');
        if (!reason) return; // User cancelled
        updates.rejectedBy = currentUser.id;
        updates.rejectedAt = new Date().toISOString();
        updates.rejectionReason = reason;
    }
    
    const result = window.dataManager.updateParcel(parcelId, updates);
    if (result.success) {
        showSuccessNotification('Parcel status updated!');
        loadAdminDashboard();
    }
}

function deleteParcel(parcelId) {
    if (showConfirmDialog('Are you sure you want to delete this parcel?')) {
        const result = window.dataManager.deleteParcel(parcelId);
        if (result.success) {
            showSuccessNotification('Parcel deleted!');
            loadAdminDashboard();
        }
    }
}

function viewUserDetails(userId) {
    const user = window.dataManager.getUserById(userId);
    if (!user) return;
    
    const userParcels = window.dataManager.getParcelsByCustomer(userId);
    
    const content = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-gray-900">Name</h4>
                    <p>${user.name}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-900">Role</h4>
                    <p class="capitalize">${user.role}</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-gray-900">Email</h4>
                    <p>${user.email}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-900">Phone</h4>
                    <p>${user.phone}</p>
                </div>
            </div>
            
            <div>
                <h4 class="font-medium text-gray-900">Address</h4>
                <p>${user.address}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-gray-900">Status</h4>
                    <p class="${user.isActive ? 'text-green-600' : 'text-red-600'}">${user.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-900">Joined</h4>
                    <p>${new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
            
            <div>
                <h4 class="font-medium text-gray-900">Total Parcels</h4>
                <p>${userParcels.length} parcels</p>
            </div>
        </div>
    `;
    
    createModal('user-details', `${user.name} - Details`, content);
}

function viewParcelDetails(parcelId) {
    const parcel = window.dataManager.getParcelById(parcelId);
    if (!parcel) return;
    
    const customer = window.dataManager.getUserById(parcel.customerId);
    
    const content = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-gray-900">Tracking Number</h4>
                    <p class="font-mono text-blue-600">${parcel.trackingNumber}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-900">Status</h4>
                    <span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${parcel.status.toUpperCase()}
                    </span>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h4 class="font-medium text-gray-900 mb-2">Sender Information</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p><strong>Name:</strong> ${parcel.senderName}</p>
                        <p><strong>Email:</strong> ${parcel.senderEmail}</p>
                    </div>
                    <div>
                        <p><strong>Phone:</strong> ${parcel.senderPhone}</p>
                        <p><strong>Customer:</strong> ${customer ? customer.name : 'Unknown'}</p>
                    </div>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h4 class="font-medium text-gray-900 mb-2">Recipient Information</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p><strong>Name:</strong> ${parcel.recipientName}</p>
                        <p><strong>Phone:</strong> ${parcel.recipientPhone}</p>
                    </div>
                    <div>
                        <p><strong>Address:</strong></p>
                        <p class="text-sm">${parcel.deliveryAddress}</p>
                    </div>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h4 class="font-medium text-gray-900 mb-2">Package Information</h4>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <p><strong>Weight:</strong> ${parcel.weight} kg</p>
                    </div>
                    <div>
                        <p><strong>Priority:</strong> ${parcel.priority.toUpperCase()}</p>
                    </div>
                    <div>
                        <p><strong>Cost:</strong> $${parcel.estimatedCost}</p>
                    </div>
                </div>
                <div class="mt-2">
                    <p><strong>Description:</strong></p>
                    <p class="text-sm text-gray-600">${parcel.description}</p>
                </div>
            </div>
            
            <div class="border-t pt-4">
                <h4 class="font-medium text-gray-900 mb-2">Timeline</h4>
                <div class="text-sm space-y-1">
                    <p><strong>Created:</strong> ${new Date(parcel.createdAt).toLocaleString()}</p>
                    <p><strong>Updated:</strong> ${new Date(parcel.updatedAt).toLocaleString()}</p>
                    ${parcel.approvedAt ? `<p><strong>Approved:</strong> ${new Date(parcel.approvedAt).toLocaleString()}</p>` : ''}
                    ${parcel.rejectedAt ? `<p><strong>Rejected:</strong> ${new Date(parcel.rejectedAt).toLocaleString()}</p>` : ''}
                </div>
            </div>
            
            ${parcel.rejectionReason ? `
            <div class="border-t pt-4">
                <h4 class="font-medium text-gray-900 mb-2 text-red-600">Rejection Reason</h4>
                <p class="text-sm text-gray-600">${parcel.rejectionReason}</p>
            </div>
            ` : ''}
            
            ${parcel.images && parcel.images.length > 0 ? `
            <div class="border-t pt-4">
                <h4 class="font-medium text-gray-900 mb-2">Package Images</h4>
                <div class="grid grid-cols-2 gap-2">
                    ${parcel.images.map(img => `
                        <img src="${img.url}" alt="Package image" class="w-full h-24 object-cover rounded cursor-pointer" onclick="showImageModal('${img.url}')">
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    createModal('parcel-details', 'Parcel Details', content);
}

function refreshAdminData() {
    // Reload data manager
    window.dataManager.loadAllData();
    loadAdminDashboard();
    showSuccessNotification('Data refreshed!');
}

function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('nav button').forEach(button => {
        button.className = 'py-2 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300';
    });
    
    // Show selected tab content
    const tabContent = document.getElementById(tabName + 'Content');
    if (tabContent) {
        tabContent.classList.remove('hidden');
    }
    
    // Add active class to selected tab
    const tab = document.getElementById(tabName + 'Tab');
    if (tab) {
        tab.className = 'py-2 px-1 border-b-2 border-blue-600 font-medium text-sm text-blue-600';
    }
}

// Utility functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

function createModal(id, title, content) {
    // Remove existing modal if any
    const existingModal = document.getElementById(id);
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-gray-900">${title}</h3>
                <button onclick="closeModal('${id}')" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeModal(id);
        }
    };
    
    document.body.appendChild(modal);
    return modal;
}

function showSuccessNotification(message) {
    showNotification(message, 'success');
}

function showErrorNotification(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${getNotificationClasses(type)}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${getNotificationIcon(type)} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function getNotificationClasses(type) {
    const classes = {
        'success': 'bg-green-500 text-white',
        'error': 'bg-red-500 text-white',
        'warning': 'bg-yellow-500 text-white',
        'info': 'bg-blue-500 text-white'
    };
    return classes[type] || classes['info'];
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || icons['info'];
}

function showConfirmDialog(message) {
    return confirm(message); // In a real app, create a custom modal
}

function showImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="max-w-4xl max-h-screen p-4">
            <img src="${imageUrl}" alt="Package image" class="max-w-full max-h-full object-contain">
            <button onclick="this.parentElement.parentElement.remove()" class="absolute top-4 right-4 text-white text-2xl">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
    document.body.appendChild(modal);
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '../';
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add dispatcher form
    const addDispatcherForm = document.getElementById('addDispatcherForm');
    if (addDispatcherForm) {
        addDispatcherForm.addEventListener('submit', handleAddDispatcher);
    }
});

// Make functions globally available
window.checkAdminAuth = checkAdminAuth;
window.addNewDispatcher = addNewDispatcher;
window.refreshAdminData = refreshAdminData;
window.showTab = showTab;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;
window.updateParcelStatus = updateParcelStatus;
window.deleteParcel = deleteParcel;
window.viewUserDetails = viewUserDetails;
window.viewParcelDetails = viewParcelDetails;
window.showModal = showModal;
window.closeModal = closeModal;
window.logout = logout;