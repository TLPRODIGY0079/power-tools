// Customer dashboard functionality - FIXED VERSION
let currentUser = null;
let customerParcels = [];

function checkCustomerAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user || user.role !== 'customer') {
        window.location.href = 'login.html';
        return false;
    }
    currentUser = user;
    initializeCustomerDashboard();
    return true;
}

async function initializeCustomerDashboard() {
    // Set welcome text
    document.getElementById('welcomeText').textContent = `Welcome, ${currentUser.name}`;
    
    // Wait for dataManager to be ready with timeout
    let retries = 0;
    while (!window.dataManager && retries < 20) {
        console.log('Waiting for dataManager...', retries);
        await new Promise(resolve => setTimeout(resolve, 250));
        retries++;
    }
    
    if (window.dataManager) {
        console.log('DataManager is ready');
        await loadCustomerDashboard();
    } else {
        console.warn('DataManager not available, using fallback');
        loadCustomerDashboardFallback();
    }
}

async function loadCustomerDashboard() {
    try {
        await loadCustomerParcels();
        updateStats();
        displayParcels();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        loadCustomerDashboardFallback();
    }
}

function loadCustomerDashboardFallback() {
    console.log('Loading dashboard with localStorage fallback');
    
    // Load from localStorage directly
    const allParcels = JSON.parse(localStorage.getItem('systemParcels') || '[]');
    customerParcels = allParcels.filter(p => 
        p.customerId === currentUser.id || p.senderEmail === currentUser.email
    );
    
    updateStats();
    displayParcels();
}

async function loadCustomerParcels() {
    try {
        customerParcels = await window.dataManager.getParcelsByCustomer(currentUser.id);
        console.log('Loaded customer parcels:', customerParcels);
    } catch (error) {
        console.error('Error loading customer parcels:', error);
        const allParcels = JSON.parse(localStorage.getItem('systemParcels') || '[]');
        customerParcels = allParcels.filter(p => 
            p.customerId === currentUser.id || p.senderEmail === currentUser.email
        );
    }
}

function updateStats() {
    const totalParcels = customerParcels.length;
    const pendingParcels = customerParcels.filter(p => p.status === 'pending').length;
    const approvedParcels = customerParcels.filter(p => p.status === 'approved' || p.status === 'in-transit').length;
    const deliveredParcels = customerParcels.filter(p => p.status === 'delivered').length;
    
    document.getElementById('totalParcels').textContent = totalParcels;
    document.getElementById('pendingParcels').textContent = pendingParcels;
    document.getElementById('approvedParcels').textContent = approvedParcels;
    document.getElementById('deliveredParcels').textContent = deliveredParcels;
}

function displayParcels() {
    const tbody = document.getElementById('parcelTableBody');
    tbody.innerHTML = '';
    
    if (customerParcels.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-box text-4xl mb-4"></i>
                    <p>No parcels found. Send your first parcel to get started!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    customerParcels.forEach(parcel => {
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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parcel.recipientName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title="${parcel.deliveryAddress}">
                ${parcel.deliveryAddress.length > 30 ? parcel.deliveryAddress.substring(0, 30) + '...' : parcel.deliveryAddress}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[parcel.status] || 'bg-gray-100 text-gray-800'}">
                    ${parcel.status.toUpperCase()}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(parcel.createdAt).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button onclick="viewParcelDetails('${parcel.id || parcel.trackingNumber}')" class="text-blue-600 hover:text-blue-900" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="trackParcel('${parcel.trackingNumber}')" class="text-green-600 hover:text-green-900" title="Track Package">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
                ${parcel.status === 'pending' ? `
                    <button onclick="cancelParcel('${parcel.id || parcel.trackingNumber}')" class="text-red-600 hover:text-red-900" title="Cancel">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// FIXED: Handle customer send parcel with proper image handling and error handling
async function handleCustomerSendParcel(e) {
    e.preventDefault();
    
    const submitButton = document.querySelector('#customerSendParcelForm button[type="submit"]') || 
                         document.querySelector('#sendParcelModal button[type="submit"]') ||
                         e.target.querySelector('button[type="submit"]');
    
    if (!submitButton) {
        console.error('Submit button not found');
        showErrorNotification('Error: Submit button not found');
        return;
    }
    
    const originalText = submitButton.textContent;
    
    try {
        submitButton.textContent = 'Creating Parcel...';
        submitButton.disabled = true;
        
        const parcelData = {
            customerId: currentUser.id,
            customerName: currentUser.name,
            senderName: currentUser.name,
            senderPhone: currentUser.phone,
            senderEmail: currentUser.email,
            recipientName: document.getElementById('recipientName').value,
            recipientPhone: document.getElementById('recipientPhone').value,
            deliveryAddress: document.getElementById('deliveryAddress').value,
            description: document.getElementById('packageDescription').value,
            weight: parseFloat(document.getElementById('packageWeight').value),
            priority: document.getElementById('packagePriority').value,
            source: 'customer'
        };
        
        // Handle images - convert to base64 for cross-session storage
        const imageFiles = document.getElementById('packageImages')?.files;
        const images = [];
        
        if (imageFiles && imageFiles.length > 0) {
            submitButton.textContent = 'Processing Images...';
            
            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                try {
                    const base64Data = await fileToBase64(file);
                    const imageData = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        url: base64Data, // Base64 data URL for cross-session access
                        uploadedAt: new Date().toISOString()
                    };
                    images.push(imageData);
                    console.log(`Processed image ${i + 1}/${imageFiles.length}: ${file.name}`);
                } catch (error) {
                    console.error('Error converting image to base64:', error);
                    showErrorNotification(`Failed to process image: ${file.name}`);
                }
            }
            parcelData.images = images;
            console.log('All images processed:', images.length);
        }
        
        submitButton.textContent = 'Saving Parcel...';
        
        let result;
        
        // Try using dataManager first, fallback if not available
        if (window.dataManager && typeof window.dataManager.addParcel === 'function') {
            console.log('Using dataManager to add parcel');
            result = await window.dataManager.addParcel(parcelData);
        } else {
            console.log('DataManager not available, using fallback method');
            result = await addParcelFallback(parcelData);
        }
        
        if (result.success) {
            // Close modal and refresh
            closeModal('sendParcelModal');
            
            // Reset form safely
            const form = document.getElementById('customerSendParcelForm') || 
                        document.querySelector('#sendParcelModal form') ||
                        e.target;
            if (form && typeof form.reset === 'function') {
                form.reset();
            }
            
            // Force sync data across all storage locations
            syncDataAcrossStorage();
            
            // Reload dashboard
            await initializeCustomerDashboard();
            
            showSuccessNotification(`Parcel created successfully! Tracking: ${result.parcel.trackingNumber}`);
        } else {
            showErrorNotification(result.message || 'Failed to create parcel');
        }
        
    } catch (error) {
        console.error('Error creating parcel:', error);
        showErrorNotification('Failed to create parcel: ' + error.message);
    } finally {
        // Reset button
        if (submitButton) {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// FIXED: Enhanced fallback method with proper data syncing
async function addParcelFallback(parcelData) {
    try {
        const parcelId = 'parcel-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        const trackingNumber = 'PC' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
        const estimatedCost = calculateShippingCost(parcelData.weight, parcelData.priority);
        
        const newParcel = {
            id: parcelId,
            trackingNumber: trackingNumber,
            customerId: parcelData.customerId,
            customerName: parcelData.customerName,
            senderName: parcelData.senderName,
            senderPhone: parcelData.senderPhone,
            senderEmail: parcelData.senderEmail,
            recipientName: parcelData.recipientName,
            recipientPhone: parcelData.recipientPhone,
            deliveryAddress: parcelData.deliveryAddress,
            description: parcelData.description,
            weight: parseFloat(parcelData.weight),
            priority: parcelData.priority,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            estimatedCost: estimatedCost,
            images: parcelData.images || [],
            source: parcelData.source || 'customer'
        };
        
        // Save to ALL storage locations for maximum compatibility
        const existingParcels = JSON.parse(localStorage.getItem('systemParcels') || '[]');
        existingParcels.push(newParcel);
        
        // Update all possible storage keys
        localStorage.setItem('systemParcels', JSON.stringify(existingParcels));
        localStorage.setItem('publicParcels', JSON.stringify(existingParcels));
        localStorage.setItem('swiftDeliveryParcels', JSON.stringify(existingParcels));
        
        console.log('Parcel saved to localStorage with images:', newParcel.images?.length || 0);
        console.log('Parcel data:', newParcel);
        
        return { 
            success: true, 
            parcel: { 
                id: parcelId, 
                trackingNumber: trackingNumber, 
                estimatedCost: estimatedCost 
            } 
        };
        
    } catch (error) {
        console.error('Fallback parcel creation error:', error);
        return { success: false, message: error.message };
    }
}

// FIXED: Data sync function to ensure all dashboards see the same data
function syncDataAcrossStorage() {
    try {
        // Get the most complete data from systemParcels
        const systemParcels = JSON.parse(localStorage.getItem('systemParcels') || '[]');
        
        // Update all other storage locations
        localStorage.setItem('publicParcels', JSON.stringify(systemParcels));
        localStorage.setItem('swiftDeliveryParcels', JSON.stringify(systemParcels));
        
        // Also force update dataManager if available
        if (window.dataManager && window.dataManager.loadAllData) {
            window.dataManager.loadAllData();
        }
        
        console.log('Data synced across all storage locations');
        console.log('Parcels with images:', systemParcels.filter(p => p.images && p.images.length > 0).length);
        
        return true;
    } catch (error) {
        console.error('Error syncing data:', error);
        return false;
    }
}

function calculateShippingCost(weight, priority) {
    const baseRates = {
        'standard': 5.99,
        'express': 12.99,
        'same-day': 24.99
    };
    
    const baseRate = baseRates[priority] || baseRates['standard'];
    const weightCharge = Math.max(0, (parseFloat(weight) - 1) * 2.50);
    
    return parseFloat((baseRate + weightCharge).toFixed(2));
}

async function refreshDashboard() {
    try {
        console.log('Refreshing customer dashboard...');
        
        // Force sync data first
        syncDataAcrossStorage();
        
        await initializeCustomerDashboard();
        showSuccessNotification('Dashboard refreshed!');
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        showErrorNotification('Failed to refresh dashboard');
    }
}

async function viewParcelDetails(parcelId) {
    const parcel = customerParcels.find(p => p.id === parcelId || p.trackingNumber === parcelId);
    if (!parcel) return;
    
    const content = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-gray-900">Tracking Number</h4>
                    <p class="text-blue-600 font-mono">${parcel.trackingNumber}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-900">Status</h4>
                    <span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${parcel.status.toUpperCase()}
                    </span>
                </div>
            </div>
            
            <div>
                <h4 class="font-medium text-gray-900">Recipient</h4>
                <p>${parcel.recipientName} - ${parcel.recipientPhone}</p>
            </div>
            
            <div>
                <h4 class="font-medium text-gray-900">Delivery Address</h4>
                <p>${parcel.deliveryAddress}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium text-gray-900">Weight</h4>
                    <p>${parcel.weight} kg</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-900">Service</h4>
                    <p>${parcel.priority.toUpperCase()}</p>
                </div>
            </div>
            
            <div>
                <h4 class="font-medium text-gray-900">Description</h4>
                <p>${parcel.description}</p>
            </div>
            
            ${parcel.estimatedCost ? `
            <div>
                <h4 class="font-medium text-gray-900">Estimated Cost</h4>
                <p class="text-green-600 font-bold">$${parcel.estimatedCost.toFixed(2)}</p>
            </div>
            ` : ''}
            
            <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                    <h4 class="font-medium text-gray-900">Created</h4>
                    <p>${new Date(parcel.createdAt).toLocaleString()}</p>
                </div>
                <div>
                    <h4 class="font-medium text-gray-900">Updated</h4>
                    <p>${new Date(parcel.updatedAt).toLocaleString()}</p>
                </div>
            </div>
            
            ${parcel.images && parcel.images.length > 0 ? `
            <div>
                <h4 class="font-medium text-gray-900 mb-2">Package Images (${parcel.images.length})</h4>
                <div class="grid grid-cols-2 gap-2">
                    ${parcel.images.map((img, index) => `
                        <img src="${img.url}" alt="Package image ${index + 1}" class="w-full h-24 object-cover rounded cursor-pointer" onclick="showImageModal('${img.url}')">
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            ${parcel.rejectionReason ? `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 class="font-medium text-red-900 mb-2">Rejection Reason</h4>
                <p class="text-red-800">${parcel.rejectionReason}</p>
            </div>
            ` : ''}
        </div>
    `;
    
    createModal('parcel-details', 'Parcel Details', content);
}

function trackParcel(trackingNumber) {
    showSuccessNotification(`Tracking parcel: ${trackingNumber}. Feature coming soon!`);
}

async function cancelParcel(parcelId) {
    if (!showConfirmDialog('Are you sure you want to cancel this parcel request?')) {
        return;
    }
    
    try {
        let result;
        
        if (window.dataManager && typeof window.dataManager.deleteParcel === 'function') {
            result = await window.dataManager.deleteParcel(parcelId);
        } else {
            // Fallback method - remove from all storage locations
            const storageKeys = ['systemParcels', 'publicParcels', 'swiftDeliveryParcels'];
            
            storageKeys.forEach(key => {
                let parcels = JSON.parse(localStorage.getItem(key) || '[]');
                parcels = parcels.filter(p => p.id !== parcelId && p.trackingNumber !== parcelId);
                localStorage.setItem(key, JSON.stringify(parcels));
            });
            
            result = { success: true };
        }
        
        if (result.success) {
            syncDataAcrossStorage();
            await initializeCustomerDashboard();
            showSuccessNotification('Parcel cancelled successfully');
        } else {
            showErrorNotification(result.message || 'Failed to cancel parcel');
        }
    } catch (error) {
        console.error('Error cancelling parcel:', error);
        showErrorNotification('Failed to cancel parcel');
    }
}

// Utility functions
function showSendParcelModal() {
    document.getElementById('sendParcelModal').classList.remove('hidden');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
    const dynamicModal = document.getElementById(modalId);
    if (dynamicModal && dynamicModal.remove) {
        dynamicModal.remove();
    }
}

function createModal(id, title, content) {
    const existingModal = document.getElementById(id);
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
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
    return confirm(message);
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

// Initialize event listeners when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Customer dashboard DOM loaded');
    
    // Add event listener for send parcel form
    const customerSendParcelForm = document.getElementById('customerSendParcelForm');
    if (customerSendParcelForm) {
        console.log('Adding form submit listener');
        customerSendParcelForm.addEventListener('submit', handleCustomerSendParcel);
    } else {
        console.warn('Customer send parcel form not found');
    }
    
    // Initialize authentication check
    setTimeout(() => {
        checkCustomerAuth();
    }, 100);
});

// Make functions globally available
window.showSendParcelModal = showSendParcelModal;
window.closeModal = closeModal;
window.refreshDashboard = refreshDashboard;
window.viewParcelDetails = viewParcelDetails;
window.trackParcel = trackParcel;
window.cancelParcel = cancelParcel;
window.logout = logout;
window.checkCustomerAuth = checkCustomerAuth;
window.handleCustomerSendParcel = handleCustomerSendParcel;
window.fileToBase64 = fileToBase64;
window.syncDataAcrossStorage = syncDataAcrossStorage;