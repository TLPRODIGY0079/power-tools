// Dispatcher Dashboard functionality
let currentUser = null;

function checkDispatcherAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user || user.role !== 'dispatcher') {
        window.location.href = 'index.html';
        return false;
    }
    currentUser = user;
    loadDispatcherDashboard();
    return true;
}

function loadDispatcherDashboard() {
    // Set welcome text
    document.getElementById('welcomeText').textContent = `Welcome, ${currentUser.name}`;
    
    // Load all data
    updateDispatcherStats();
    loadParcelRequests();
}

function updateDispatcherStats() {
    const todayStats = window.dataManager.getTodayStats();
    const pendingParcels = window.dataManager.getPendingParcels().length;
    
    document.getElementById('pendingReviews').textContent = pendingParcels;
    document.getElementById('approvedToday').textContent = todayStats.approvedToday;
    document.getElementById('rejectedToday').textContent = todayStats.rejectedToday;
    document.getElementById('inTransit').textContent = todayStats.inTransit;
}

function loadParcelRequests() {
    const container = document.getElementById('parcelRequestsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    const pendingParcels = window.dataManager.getPendingParcels();
    
    if (pendingParcels.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
                <p class="text-gray-500">All parcel requests have been processed!</p>
            </div>
        `;
        return;
    }
    
    pendingParcels.forEach(parcel => {
        const customer = window.dataManager.getUserById(parcel.customerId);
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 hover:shadow-md transition-shadow';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-1">${parcel.trackingNumber}</h3>
                    <p class="text-sm text-gray-500">Created: ${new Date(parcel.createdAt).toLocaleString()}</p>
                    <p class="text-sm text-blue-600 mt-1">Estimated Cost: $${parcel.estimatedCost}</p>
                </div>
                <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    <i class="fas fa-clock mr-1"></i>Pending Review
                </span>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- Sender Information -->
                <div class="bg-blue-50 rounded-lg p-4">
                    <h4 class="font-semibold text-blue-900 mb-3 flex items-center">
                        <i class="fas fa-user mr-2"></i>Sender Information
                    </h4>
                    <div class="space-y-2 text-sm">
                        <p><strong>Name:</strong> ${parcel.senderName}</p>
                        <p><strong>Email:</strong> ${parcel.senderEmail}</p>
                        <p><strong>Phone:</strong> ${parcel.senderPhone}</p>
                        <p><strong>Customer Account:</strong> ${customer ? customer.name : 'Guest User'}</p>
                    </div>
                </div>
                
                <!-- Recipient Information -->
                <div class="bg-green-50 rounded-lg p-4">
                    <h4 class="font-semibold text-green-900 mb-3 flex items-center">
                        <i class="fas fa-map-marker-alt mr-2"></i>Recipient Information
                    </h4>
                    <div class="space-y-2 text-sm">
                        <p><strong>Name:</strong> ${parcel.recipientName}</p>
                        <p><strong>Phone:</strong> ${parcel.recipientPhone}</p>
                        <p><strong>Address:</strong></p>
                        <p class="text-gray-600 pl-4">${parcel.deliveryAddress}</p>
                    </div>
                </div>
            </div>
            
            <!-- Package Details -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                    <i class="fas fa-box mr-2"></i>Package Details
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Weight</p>
                        <p class="font-medium">${parcel.weight} kg</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Priority</p>
                        <p class="font-medium capitalize">${parcel.priority}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Service Type</p>
                        <p class="font-medium capitalize">${parcel.priority.replace('-', ' ')}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Source</p>
                        <p class="font-medium capitalize">${parcel.source}</p>
                    </div>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase mb-1">Description</p>
                    <p class="text-gray-700">${parcel.description}</p>
                </div>
            </div>
            
            ${parcel.images && parcel.images.length > 0 ? `
                <div class="mb-6">
                    <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                        <i class="fas fa-images mr-2"></i>Package Images (${parcel.images.length})
                    </h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        ${parcel.images.map((img, index) => `
                            <div class="relative group">
                                <img src="${img.url}" alt="Package image ${index + 1}" 
                                     class="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity" 
                                     onclick="showImageModal('${img.url}')">
                                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-25 rounded-lg transition-all flex items-center justify-center">
                                    <i class="fas fa-search-plus text-white opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button onclick="approveParcel('${parcel.id}')" 
                        class="flex-1 min-w-0 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center justify-center font-medium">
                    <i class="fas fa-check mr-2"></i>Approve Parcel
                </button>
                <button onclick="rejectParcel('${parcel.id}')" 
                        class="flex-1 min-w-0 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 flex items-center justify-center font-medium">
                    <i class="fas fa-times mr-2"></i>Reject Parcel
                </button>
                <button onclick="viewParcelDetails('${parcel.id}')" 
                        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center font-medium">
                    <i class="fas fa-eye mr-2"></i>Full Details
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Dispatcher action functions
function approveParcel(parcelId) {
    const parcel = window.dataManager.getParcelById(parcelId);
    if (!parcel) return;
    
    if (showConfirmDialog(`Are you sure you want to approve parcel ${parcel.trackingNumber}?`)) {
        const result = window.dataManager.updateParcel(parcelId, {
            status: 'approved',
            approvedBy: currentUser.id,
            approvedAt: new Date().toISOString()
        });
        
        if (result.success) {
            showSuccessNotification(`Parcel ${parcel.trackingNumber} approved successfully!`);
            loadDispatcherDashboard();
        }
    }
}

function rejectParcel(parcelId) {
    const parcel = window.dataManager.getParcelById(parcelId);
    if (!parcel) return;
    
    const reason = showPrompt('Please enter the reason for rejection:');
    if (!reason) return; // User cancelled
    
    const result = window.dataManager.updateParcel(parcelId, {
        status: 'rejected',
        rejectedBy: currentUser.id,
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason
    });
    
    if (result.success) {
        showSuccessNotification(`Parcel ${parcel.trackingNumber} rejected!`);
        loadDispatcherDashboard();
    }
}

function viewParcelDetails(parcelId) {
    const parcel = window.dataManager.getParcelById(parcelId);
    if (!parcel) return;
    
    const customer = window.dataManager.getUserById(parcel.customerId);
    
    const content = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-blue-50 rounded-lg p-4">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="text-lg font-bold text-blue-900">${parcel.trackingNumber}</h4>
                        <p class="text-blue-700">Status: ${parcel.status.toUpperCase()}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-blue-600">Estimated Cost</p>
                        <p class="text-xl font-bold text-blue-900">$${parcel.estimatedCost}</p>
                    </div>
                </div>
            </div>
            
            <!-- Sender & Recipient -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="border rounded-lg p-4">
                    <h5 class="font-semibold text-gray-900 mb-3 flex items-center">
                        <i class="fas fa-user text-blue-600 mr-2"></i>Sender Information
                    </h5>
                    <div class="space-y-2 text-sm">
                        <p><strong>Name:</strong> ${parcel.senderName}</p>
                        <p><strong>Email:</strong> ${parcel.senderEmail}</p>
                        <p><strong>Phone:</strong> ${parcel.senderPhone}</p>
                        <p><strong>Customer:</strong> ${customer ? customer.name : 'Guest User'}</p>
                        ${customer ? `<p><strong>Customer Since:</strong> ${new Date(customer.createdAt).toLocaleDateString()}</p>` : ''}
                    </div>
                </div>
                
                <div class="border rounded-lg p-4">
                    <h5 class="font-semibold text-gray-900 mb-3 flex items-center">
                        <i class="fas fa-map-marker-alt text-green-600 mr-2"></i>Recipient Information
                    </h5>
                    <div class="space-y-2 text-sm">
                        <p><strong>Name:</strong> ${parcel.recipientName}</p>
                        <p><strong>Phone:</strong> ${parcel.recipientPhone}</p>
                        <p><strong>Delivery Address:</strong></p>
                        <p class="bg-gray-50 p-2 rounded text-gray-700">${parcel.deliveryAddress}</p>
                    </div>
                </div>
            </div>
            
            <!-- Package Information -->
            <div class="border rounded-lg p-4">
                <h5 class="font-semibold text-gray-900 mb-3 flex items-center">
                    <i class="fas fa-box text-purple-600 mr-2"></i>Package Information
                </h5>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Weight</p>
                        <p class="font-medium">${parcel.weight} kg</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Priority</p>
                        <p class="font-medium capitalize">${parcel.priority}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Source</p>
                        <p class="font-medium capitalize">${parcel.source}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase">Cost</p>
                        <p class="font-medium text-green-600">$${parcel.estimatedCost}</p>
                    </div>
                </div>
                <div>
                    <p class="text-xs text-gray-500 uppercase mb-2">Description</p>
                    <p class="bg-gray-50 p-3 rounded text-gray-700">${parcel.description}</p>
                </div>
            </div>
            
            <!-- Timeline -->
            <div class="border rounded-lg p-4">
                <h5 class="font-semibold text-gray-900 mb-3 flex items-center">
                    <i class="fas fa-clock text-orange-600 mr-2"></i>Timeline
                </h5>
                <div class="space-y-2 text-sm">
                    <p><strong>Created:</strong> ${new Date(parcel.createdAt).toLocaleString()}</p>
                    <p><strong>Last Updated:</strong> ${new Date(parcel.updatedAt).toLocaleString()}</p>
                    ${parcel.approvedAt ? `<p><strong>Approved:</strong> ${new Date(parcel.approvedAt).toLocaleString()}</p>` : ''}
                    ${parcel.rejectedAt ? `<p><strong>Rejected:</strong> ${new Date(parcel.rejectedAt).toLocaleString()}</p>` : ''}
                </div>
            </div>
            
            ${parcel.rejectionReason ? `
            <div class="border border-red-200 rounded-lg p-4 bg-red-50">
                <h5 class="font-semibold text-red-900 mb-2 flex items-center">
                    <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>Rejection Reason
                </h5>
                <p class="text-red-800">${parcel.rejectionReason}</p>
            </div>
            ` : ''}
            
            ${parcel.images && parcel.images.length > 0 ? `
            <div class="border rounded-lg p-4">
                <h5 class="font-semibold text-gray-900 mb-3 flex items-center">
                    <i class="fas fa-images text-indigo-600 mr-2"></i>Package Images (${parcel.images.length})
                </h5>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    ${parcel.images.map((img, index) => `
                        <img src="${img.url}" alt="Package image ${index + 1}" 
                             class="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity" 
                             onclick="showImageModal('${img.url}')">
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${parcel.status === 'pending' ? `
            <div class="flex gap-3 pt-4 border-t">
                <button onclick="approveParcel('${parcel.id}'); closeModal('parcel-details')" 
                        class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200">
                    <i class="fas fa-check mr-2"></i>Approve
                </button>
                <button onclick="rejectParcel('${parcel.id}'); closeModal('parcel-details')" 
                        class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200">
                    <i class="fas fa-times mr-2"></i>Reject
                </button>
            </div>
            ` : ''}
        </div>
    `;
    
    createModal('parcel-details', 'Parcel Details - ' + parcel.trackingNumber, content);
}

function refreshDispatcherData() {
    // Reload data manager
    window.dataManager.loadAllData();
    loadDispatcherDashboard();
    showSuccessNotification('Data refreshed!');
}

// Utility functions
function createModal(id, title, content) {
    // Remove existing modal if any
    const existingModal = document.getElementById(id);
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-6xl w-full max-h-screen overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-900">${title}</h3>
                <button onclick="closeModal('${id}')" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="p-6">
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
    // Also remove dynamically created modals
    const dynamicModal = document.getElementById(modalId);
    if (dynamicModal && dynamicModal.remove) {
        dynamicModal.remove();
    }
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

function showPrompt(message) {
    return prompt(message); // In a real app, create a custom modal
}

function showImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="relative max-w-4xl max-h-full">
            <img src="${imageUrl}" alt="Package image" class="max-w-full max-h-full object-contain">
            <button onclick="this.parentElement.parentElement.remove()" 
                    class="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center">
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

// Make functions globally available
window.checkDispatcherAuth = checkDispatcherAuth;
window.refreshDispatcherData = refreshDispatcherData;
window.approveParcel = approveParcel;
window.rejectParcel = rejectParcel;
window.viewParcelDetails = viewParcelDetails;
window.showModal = showModal;
window.closeModal = closeModal;
window.showImageModal = showImageModal;
window.logout = logout;