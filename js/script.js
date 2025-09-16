// Supabase Configuration
const SUPABASE_URL = 'https://ngfzxdokalayquaojngj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZnp4ZG9rYWxheXF1YW9qbmdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0Nzc3OTgsImV4cCI6MjA2OTA1Mzc5OH0.P2Fb14qc4fbiW6JjiZF4sokZGFPNZIGsD6pCUu3pRfc';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App State
let currentUser = null;
let users = [];
let parcels = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeEventListeners();
    setupRealTimeSubscriptions();
});

// Real-time subscriptions
function setupRealTimeSubscriptions() {
    // Subscribe to parcel changes
    supabaseClient
        .channel('parcels')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'parcels' },
            (payload) => {
                console.log('Parcel change received!', payload);
                refreshCurrentView();
            }
        )
        .subscribe();

    // Subscribe to user changes
    supabaseClient
        .channel('users')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'users' },
            (payload) => {
                console.log('User change received!', payload);
                refreshCurrentView();
            }
        )
        .subscribe();
}

// Data loading functions
async function loadData() {
    try {
        // Load users
        const { data: usersData, error: usersError } = await supabaseClient
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (usersError) throw usersError;
        users = usersData || [];

        // Load parcels with images
        const { data: parcelsData, error: parcelsError } = await supabaseClient
            .from('parcels')
            .select(`
                *,
                parcel_images (*)
            `)
            .order('created_at', { ascending: false });

        if (parcelsError) throw parcelsError;
        parcels = parcelsData || [];

        // Load current user if exists
        const savedCurrentUser = localStorage.getItem('currentUser');
        if (savedCurrentUser) {
            currentUser = JSON.parse(savedCurrentUser);
        }

        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data: ' + error.message, 'error');
    }
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const role = document.getElementById('loginRole').value;
    
    try {
        // Find user by email and role
        const { data: userData, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('role', role)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (!userData) {
            showNotification('User not found or invalid role!', 'error');
            return;
        }

        currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Redirect based on role
        if (role === 'customer') {
            window.location.href = 'customer-dashboard.html';
        } else if (role === 'dispatcher') {
            window.location.href = 'dispatcher-dashboard.html';
        } else if (role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        }
        
        showNotification('Login successful!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed: ' + error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const userData = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        phone: document.getElementById('registerPhone').value,
        address: document.getElementById('registerAddress').value,
        role: 'customer'
    };
    
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .insert([userData])
            .select()
            .single();

        if (error) throw error;

        showNotification('Registration successful! Please login.', 'success');
        closeModal('registerModal');
        showLoginModal();
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === '23505') {
            showNotification('User with this email already exists!', 'error');
        } else {
            showNotification('Registration failed: ' + error.message, 'error');
        }
    }
}

async function handleAddDispatcher(e) {
    e.preventDefault();
    const dispatcherData = {
        name: document.getElementById('dispatcherName').value,
        email: document.getElementById('dispatcherEmail').value,
        phone: document.getElementById('dispatcherPhone').value,
        address: document.getElementById('dispatcherAddress').value,
        role: 'dispatcher'
    };
    
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .insert([dispatcherData])
            .select()
            .single();

        if (error) throw error;

        showNotification('Dispatcher added successfully!', 'success');
        closeModal('addDispatcherModal');
        document.getElementById('addDispatcherForm').reset();
        await loadData();
        loadAdminDashboard();
    } catch (error) {
        console.error('Add dispatcher error:', error);
        if (error.code === '23505') {
            showNotification('User with this email already exists!', 'error');
        } else {
            showNotification('Failed to add dispatcher: ' + error.message, 'error');
        }
    }
}

// Parcel Functions
async function handleCreateParcel(e) {
    e.preventDefault();
    
    const parcelData = {
        tracking_number: generateTrackingNumber(),
        customer_id: currentUser.id,
        customer_name: currentUser.name,
        recipient_name: document.getElementById('recipientName').value,
        recipient_phone: document.getElementById('recipientPhone').value,
        delivery_address: document.getElementById('deliveryAddress').value,
        description: document.getElementById('packageDescription').value,
        weight: parseFloat(document.getElementById('packageWeight').value),
        priority: document.getElementById('packagePriority').value,
        status: 'pending'
    };
    
    try {
        // Insert parcel
        const { data: parcel, error: parcelError } = await supabaseClient
            .from('parcels')
            .insert([parcelData])
            .select()
            .single();

        if (parcelError) throw parcelError;

        // Handle image uploads
        const imageFiles = document.getElementById('packageImages').files;
        if (imageFiles.length > 0) {
            await uploadParcelImages(parcel.id, imageFiles);
        }

        showNotification(`Parcel created successfully! Tracking: ${parcel.tracking_number}`, 'success');
        closeModal('createParcelModal');
        document.getElementById('createParcelForm').reset();
        await loadData();
        loadCustomerDashboard();
    } catch (error) {
        console.error('Create parcel error:', error);
        showNotification('Failed to create parcel: ' + error.message, 'error');
    }
}

async function uploadParcelImages(parcelId, files) {
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = `${parcelId}/${Date.now()}_${file.name}`;
            
            // Upload file to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('parcel-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from('parcel-images')
                .getPublicUrl(fileName);

            // Save image record to database
            const { error: dbError } = await supabaseClient
                .from('parcel_images')
                .insert([{
                    parcel_id: parcelId,
                    image_url: urlData.publicUrl,
                    image_name: file.name
                }]);

            if (dbError) throw dbError;
        }
    } catch (error) {
        console.error('Image upload error:', error);
        showNotification('Some images failed to upload: ' + error.message, 'error');
    }
}

async function approveParcel(parcelId) {
    try {
        const { error } = await supabaseClient
            .from('parcels')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: currentUser.id
            })
            .eq('id', parcelId);

        if (error) throw error;

        showNotification('Parcel approved successfully!', 'success');
        await loadData();
        loadDispatcherDashboard();
    } catch (error) {
        console.error('Approve parcel error:', error);
        showNotification('Failed to approve parcel: ' + error.message, 'error');
    }
}

async function rejectParcel(parcelId) {
    const reason = prompt('Please enter rejection reason:');
    if (reason) {
        try {
            const { error } = await supabaseClient
                .from('parcels')
                .update({
                    status: 'rejected',
                    rejected_at: new Date().toISOString(),
                    rejected_by: currentUser.id,
                    rejection_reason: reason
                })
                .eq('id', parcelId);

            if (error) throw error;

            showNotification('Parcel rejected!', 'info');
            await loadData();
            loadDispatcherDashboard();
        } catch (error) {
            console.error('Reject parcel error:', error);
            showNotification('Failed to reject parcel: ' + error.message, 'error');
        }
    }
}

async function updateParcelStatus(parcelId, newStatus) {
    try {
        const { error } = await supabaseClient
            .from('parcels')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', parcelId);

        if (error) throw error;

        showNotification('Parcel status updated!', 'success');
        await loadData();
        refreshCurrentView();
    } catch (error) {
        console.error('Update status error:', error);
        showNotification('Failed to update status: ' + error.message, 'error');
    }
}

async function deleteParcel(parcelId) {
    if (confirm('Are you sure you want to delete this parcel?')) {
        try {
            const { error } = await supabaseClient
                .from('parcels')
                .delete()
                .eq('id', parcelId);

            if (error) throw error;

            showNotification('Parcel deleted!', 'info');
            await loadData();
            refreshCurrentView();
        } catch (error) {
            console.error('Delete parcel error:', error);
            showNotification('Failed to delete parcel: ' + error.message, 'error');
        }
    }
}

// User Management Functions
async function toggleUserStatus(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        try {
            const { error } = await supabaseClient
                .from('users')
                .update({ is_active: !user.is_active })
                .eq('id', userId);

            if (error) throw error;

            showNotification(`User ${!user.is_active ? 'activated' : 'deactivated'}!`, 'info');
            await loadData();
            loadAdminDashboard();
        } catch (error) {
            console.error('Toggle user status error:', error);
            showNotification('Failed to update user status: ' + error.message, 'error');
        }
    }
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
            const { error } = await supabaseClient
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            showNotification('User deleted!', 'info');
            await loadData();
            loadAdminDashboard();
        } catch (error) {
            console.error('Delete user error:', error);
            showNotification('Failed to delete user: ' + error.message, 'error');
        }
    }
}

// Keep all the existing UI functions (loadCustomerDashboard, loadDispatcherDashboard, etc.)
// but replace the data arrays with the loaded data from Supabase

// Add this function to refresh current view
function refreshCurrentView() {
    if (currentUser) {
        if (currentUser.role === 'customer') {
            loadCustomerDashboard();
        } else if (currentUser.role === 'dispatcher') {
            loadDispatcherDashboard();
        } else if (currentUser.role === 'admin') {
            loadAdminDashboard();
        }
    }
}

async function refreshData() {
    await loadData();
    refreshCurrentView();
    showNotification('Data refreshed!', 'info');
}

// Keep all other existing functions (UI helpers, utility functions, etc.)
// ... (rest of the existing functions remain the same)

// Event Listeners
function initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Create parcel form
    const createParcelForm = document.getElementById('createParcelForm');
    if (createParcelForm) {
        createParcelForm.addEventListener('submit', handleCreateParcel);
    }

    // Add dispatcher form
    const addDispatcherForm = document.getElementById('addDispatcherForm');
    if (addDispatcherForm) {
        addDispatcherForm.addEventListener('submit', handleAddDispatcher);
    }
}

// Add the Supabase library
function loadSupabaseLibrary() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = function() {
        console.log('Supabase library loaded');
    };
    document.head.appendChild(script);
}

// Load Supabase library when page loads
loadSupabaseLibrary();

// Utility Functions (keep existing ones)
function generateTrackingNumber() {
    return 'SD' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function checkAuth(requiredRole) {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user || user.role !== requiredRole) {
        window.location.href = 'index.html';
        return false;
    }
    currentUser = user;
    return true;
}

// Keep all existing UI functions (loadCustomerDashboard, etc.) but update them to use the new data structure