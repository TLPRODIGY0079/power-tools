// Updated Data Manager with Database Integration

// Add this at the very beginning of dataManager.js
console.log('DataManager script loading...');

// Updated Data Manager with Database Integration
class DataManager {
    constructor() {
        console.log('DataManager constructor called');
        this.users = [];
        this.parcels = [];
        this.baseURL = '/.netlify/functions';
        this.isOnline = navigator.onLine;
        this.isInitialized = false;
        
        // Initialize immediately
        this.initialize().then(() => {
            this.isInitialized = true;
            console.log('DataManager initialization complete');
        }).catch(error => {
            console.error('DataManager initialization failed:', error);
            this.isInitialized = false;
        });
    }

    // Add this method to check if ready
    async waitForReady(timeout = 10000) {
        const startTime = Date.now();
        while (!this.isInitialized && (Date.now() - startTime) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.isInitialized;
    }

    // Rest of your DataManager code...



    async initialize() {
        try {
            // Check if we're online and try database connection
            if (this.isOnline) {
                await this.initializeDatabase();
                console.log('Database connection established');
            } else {
                throw new Error('Offline mode - using localStorage');
            }
        } catch (error) {
            console.error('Database initialization failed:', error);
            console.log('Falling back to localStorage for demo');
            this.loadLocalData();
        }

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Back online - switching to database');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Gone offline - using localStorage');
        });
    }

    async initializeDatabase() {
        const response = await fetch(`${this.baseURL}/init-db`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error('Failed to initialize database');
        }
        
        return response.json();
    }

    // API call helper with fallback
    async apiCall(endpoint, options = {}) {
        if (!this.isOnline) {
            throw new Error('Offline - using localStorage fallback');
        }

        const url = `${this.baseURL}/api/${endpoint}`;
        const config = {
            headers: { 'Content-Type': 'application/json' },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'API call failed');
            }
            
            return data;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // User management methods with database integration
    async loginUser(email, password, role = null) {
        try {
            if (this.isOnline) {
                const result = await this.apiCall('users/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password, role })
                });
                return result;
            } else {
                // Fallback to localStorage
                return this.loginUserLocal(email, password, role);
            }
        } catch (error) {
            console.error('Login failed:', error);
            // Try localStorage fallback
            return this.loginUserLocal(email, password, role);
        }
    }

    async registerUser(userData) {
        try {
            if (this.isOnline) {
                const result = await this.apiCall('users/register', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
                return result;
            } else {
                return this.addUserLocal(userData);
            }
        } catch (error) {
            console.error('Registration failed:', error);
            return this.addUserLocal(userData);
        }
    }

    async addUser(userData) {
        try {
            if (this.isOnline) {
                const result = await this.apiCall('users', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
                return result;
            } else {
                return this.addUserLocal(userData);
            }
        } catch (error) {
            console.error('Add user failed:', error);
            return this.addUserLocal(userData);
        }
    }

    async getAllUsers() {
        try {
            if (this.isOnline) {
                const result = await this.apiCall('users');
                this.users = result.users || [];
                return this.users;
            } else {
                return this.getAllUsersLocal();
            }
        } catch (error) {
            console.error('Get users failed:', error);
            return this.getAllUsersLocal();
        }
    }

    async getCustomers() {
        try {
            if (this.isOnline) {
                const result = await this.apiCall('users?role=customer');
                return result.users || [];
            } else {
                return this.getCustomersLocal();
            }
        } catch (error) {
            console.error('Get customers failed:', error);
            return this.getCustomersLocal();
        }
    }

    async getDispatchers() {
        try {
            if (this.isOnline) {
                const result = await this.apiCall('users?role=dispatcher');
                return result.users || [];
            } else {
                return this.getDispatchersLocal();
            }
        } catch (error) {
            console.error('Get dispatchers failed:', error);
            return this.getDispatchersLocal();
        }
    }

    async updateUser(userId, updates) {
        try {
            if (this.isOnline) {
                const result = await this.apiCall('users', {
                    method: 'PUT',
                    body: JSON.stringify({ userId, updates })
                });
                return result;
            } else {
                return this.updateUserLocal(userId, updates);
            }
        } catch (error) {
            console.error('Update user failed:', error);
            return this.updateUserLocal(userId, updates);
        }
    }

    async deleteUser(userId) {
        try {
            if (this.isOnline) {
                const result = await this.apiCall(`users?userId=${userId}`, {
                    method: 'DELETE'
                });
                return result;
            } else {
                return this.deleteUserLocal(userId);
            }
        } catch (error) {
            console.error('Delete user failed:', error);
            return this.deleteUserLocal(userId);
        }
    }

    // Parcel management methods with database integration
    async addParcel(parcelData) {
        try {
            if (this.isOnline) {
                // Handle image uploads first
                if (parcelData.images && parcelData.images.length > 0) {
                    const uploadedImages = await this.uploadImages(parcelData.images);
                    parcelData.images = uploadedImages;
                }
                
                const result = await this.apiCall('parcels', {
                    method: 'POST',
                    body: JSON.stringify(parcelData)
                });
                return result;
            } else {
                return this.addParcelLocal(parcelData);
            }
        } catch (error) {
            console.error('Add parcel failed:', error);
            return this.addParcelLocal(parcelData);
        }
    }

    async getAllParcels() {
        try {
            if (this.isOnline) {
                const result = await this.apiCall('parcels');
                this.parcels = result.parcels || [];
                return this.parcels;
            } else {
                return this.getAllParcelsLocal();
            }
        } catch (error) {
            console.error('Get parcels failed:', error);
            return this.getAllParcelsLocal();
        }
    }

    async getParcelsByCustomer(customerId) {
        try {
            if (this.isOnline) {
                const result = await this.apiCall(`parcels?customerId=${customerId}`);
                return result.parcels || [];
            } else {
                return this.getParcelsByCustomerLocal(customerId);
            }
        } catch (error) {
            console.error('Get customer parcels failed:', error);
            return this.getParcelsByCustomerLocal(customerId);
        }
    }

    async getPendingParcels() {
        try {
            if (this.isOnline) {
                const result = await this.apiCall('parcels?status=pending');
                return result.parcels || [];
            } else {
                return this.getPendingParcelsLocal();
            }
        } catch (error) {
            console.error('Get pending parcels failed:', error);
            return this.getPendingParcelsLocal();
        }
    }

    async getParcelsByStatus(status) {
        try {
            if (this.isOnline) {
                const result = await this.apiCall(`parcels?status=${status}`);
                return result.parcels || [];
            } else {
                return this.getParcelsByStatusLocal(status);
            }
        } catch (error) {
            console.error('Get parcels by status failed:', error);
            return this.getParcelsByStatusLocal(status);
        }
    }

    async updateParcel(parcelId, updates) {
        try {
            if (this.isOnline) {
                const result = await this.apiCall('parcels', {
                    method: 'PUT',
                    body: JSON.stringify({ parcelId, updates })
                });
                return result;
            } else {
                return this.updateParcelLocal(parcelId, updates);
            }
        } catch (error) {
            console.error('Update parcel failed:', error);
            return this.updateParcelLocal(parcelId, updates);
        }
    }

    async deleteParcel(parcelId) {
        try {
            if (this.isOnline) {
                const result = await this.apiCall(`parcels?parcelId=${parcelId}`, {
                    method: 'DELETE'
                });
                return result;
            } else {
                return this.deleteParcelLocal(parcelId);
            }
        } catch (error) {
            console.error('Delete parcel failed:', error);
            return this.deleteParcelLocal(parcelId);
        }
    }

    async trackParcel(trackingNumber) {
        try {
            if (this.isOnline) {
                const result = await this.apiCall(`parcels/track?trackingNumber=${trackingNumber}`);
                return result.parcel;
            } else {
                return this.trackParcelLocal(trackingNumber);
            }
        } catch (error) {
            console.error('Track parcel failed:', error);
            return this.trackParcelLocal(trackingNumber);
        }
    }

    // Image upload handling
    async uploadImages(images) {
        if (!this.isOnline) {
            console.log('Offline - skipping image upload');
            return images; // Return original images for localStorage
        }

        const uploadedImages = [];
        
        for (const image of images) {
            try {
                // Convert file to base64 if it's a File object
                let imageData = image.url;
                if (image.file) {
                    imageData = await this.fileToBase64(image.file);
                } else if (typeof image === 'object' && image.constructor === File) {
                    imageData = await this.fileToBase64(image);
                }
                
                const response = await fetch('/.netlify/functions/upload-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: imageData,
                        filename: image.name || 'image.jpg'
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    uploadedImages.push({
                        url: result.url,
                        name: image.name || 'image.jpg'
                    });
                } else {
                    console.error('Image upload failed:', response.statusText);
                    // Fallback: use original image
                    uploadedImages.push(image);
                }
            } catch (error) {
                console.error('Image upload failed:', error);
                // Fallback: use original image
                uploadedImages.push(image);
            }
        }
        
        return uploadedImages;
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Statistics methods with database integration
    async getStats() {
        try {
            if (this.isOnline) {
                const result = await this.apiCall('stats');
                return result.stats;
            } else {
                return this.getStatsLocal();
            }
        } catch (error) {
            console.error('Get stats failed:', error);
            return this.getStatsLocal();
        }
    }

    async getTodayStats() {
        try {
            if (this.isOnline) {
                const result = await this.apiCall('stats');
                return {
                    approvedToday: result.stats.approvedToday || 0,
                    rejectedToday: result.stats.rejectedToday || 0,
                    inTransit: result.stats.inTransit || 0
                };
            } else {
                return this.getTodayStatsLocal();
            }
        } catch (error) {
            console.error('Get today stats failed:', error);
            return this.getTodayStatsLocal();
        }
    }

    // Helper methods (work with both database and localStorage)
    getUserById(id) {
        return this.users.find(u => u.id === id);
    }

    getParcelById(id) {
        return this.parcels.find(p => p.id === id);
    }

    calculateShippingCost(weight, priority) {
        const baseRates = {
            'standard': 5.99,
            'express': 12.99,
            'same-day': 24.99
        };
        
        const baseRate = baseRates[priority] || baseRates['standard'];
        const weightCharge = Math.max(0, (parseFloat(weight) - 1) * 2.50);
        
        return parseFloat((baseRate + weightCharge).toFixed(2));
    }

    // ========== FALLBACK LOCALSTORAGE METHODS ==========
    // These are used when database is not available
    
    loadLocalData() {
        console.log('Loading data from localStorage (fallback mode)');
        this.loadAllData();
        this.mergeLegacyData();
        this.initializeDemoData();
        this.saveAllData();
    }

    loadAllData() {
        // Load users from all possible sources
        const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
        const swiftUsers = JSON.parse(localStorage.getItem('swiftDeliveryUsers') || '[]');
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        
        // Merge all user sources
        this.users = [...systemUsers];
        
        // Add users from other sources if they don't exist
        [...swiftUsers, ...customers].forEach(user => {
            if (!this.users.find(u => u.email === user.email)) {
                this.users.push(user);
            }
        });

        // Load parcels from all possible sources
        const publicParcels = JSON.parse(localStorage.getItem('publicParcels') || '[]');
        const swiftParcels = JSON.parse(localStorage.getItem('swiftDeliveryParcels') || '[]');
        
        // Merge all parcel sources
        this.parcels = [...publicParcels];
        
        // Add parcels from other sources if they don't exist
        swiftParcels.forEach(parcel => {
            if (!this.parcels.find(p => p.trackingNumber === parcel.trackingNumber)) {
                this.parcels.push(parcel);
            }
        });

        console.log('Loaded data:', { users: this.users.length, parcels: this.parcels.length });
    }

    mergeLegacyData() {
        // Standardize user format
        this.users = this.users.map(user => ({
            id: user.id || 'user-' + Date.now() + Math.random(),
            name: user.name || 'Unknown User',
            email: user.email,
            password: user.password || 'password123',
            phone: user.phone || 'Not provided',
            address: user.address || 'Not provided',
            role: user.role || 'customer',
            createdAt: user.createdAt || new Date().toISOString(),
            isActive: user.isActive !== undefined ? user.isActive : true
        }));

        // Standardize parcel format
        this.parcels = this.parcels.map(parcel => ({
            id: parcel.id || 'parcel-' + Date.now() + Math.random(),
            trackingNumber: parcel.trackingNumber || this.generateTrackingNumber(),
            customerId: parcel.customerId || this.findCustomerIdByEmail(parcel.senderEmail),
            customerName: parcel.customerName || parcel.senderName || 'Unknown Customer',
            senderName: parcel.senderName || parcel.customerName || 'Unknown Sender',
            senderPhone: parcel.senderPhone || 'Not provided',
            senderEmail: parcel.senderEmail || 'Not provided',
            recipientName: parcel.recipientName || 'Unknown Recipient',
            recipientPhone: parcel.recipientPhone || 'Not provided',
            deliveryAddress: parcel.deliveryAddress || 'Not provided',
            description: parcel.description || 'No description',
            weight: parcel.weight || 1,
            priority: parcel.priority || 'standard',
            status: parcel.status || 'pending',
            createdAt: parcel.createdAt || new Date().toISOString(),
            updatedAt: parcel.updatedAt || new Date().toISOString(),
            estimatedCost: parcel.estimatedCost || this.calculateShippingCost(parcel.weight || 1, parcel.priority || 'standard'),
            images: parcel.images || [],
            source: parcel.source || 'unknown',
            approvedBy: parcel.approvedBy || null,
            approvedAt: parcel.approvedAt || null,
            rejectedBy: parcel.rejectedBy || null,
            rejectedAt: parcel.rejectedAt || null,
            rejectionReason: parcel.rejectionReason || null
        }));
    }

    initializeDemoData() {
        const demoUsers = [
            {
                id: 'admin-1',
                name: 'System Administrator',
                email: 'admin@platinum-courier.com',
                password: 'admin123',
                role: 'admin',
                phone: '+1-800-PLATINUM',
                address: 'Admin Office, Platinum Tower',
                createdAt: new Date().toISOString(),
                isActive: true
            },
            {
                id: 'dispatcher-1',
                name: 'John Dispatcher',
                email: 'dispatcher@platinum-courier.com',
                password: 'dispatch123',
                role: 'dispatcher',
                phone: '+1-800-DISPATCH',
                address: 'Operations Center, Platinum Hub',
                createdAt: new Date().toISOString(),
                isActive: true
            },
            {
                id: 'customer-1',
                name: 'John Customer',
                email: 'customer@platinum-courier.com',
                password: 'customer123',
                role: 'customer',
                phone: '+1-555-CUSTOMER',
                address: '123 Customer Street, City, ST 12345',
                createdAt: new Date().toISOString(),
                isActive: true
            }
        ];

        // Add demo users if they don't exist
        demoUsers.forEach(demoUser => {
            if (!this.users.find(u => u.email === demoUser.email)) {
                this.users.push(demoUser);
            }
        });

        // Add demo parcel if no parcels exist
        if (this.parcels.length === 0) {
            const demoParcel = {
                id: 'parcel-demo-1',
                trackingNumber: 'PC' + Date.now().toString().slice(-8) + 'DEMO',
                customerId: 'customer-1',
                customerName: 'John Customer',
                senderName: 'John Customer',
                senderPhone: '+1-555-CUSTOMER',
                senderEmail: 'customer@platinum-courier.com',
                recipientName: 'Jane Recipient',
                recipientPhone: '+1-555-RECIPIENT',
                deliveryAddress: '456 Delivery Ave, Another City, ST 67890',
                description: 'Demo package - Electronics (Laptop)',
                weight: 2.5,
                priority: 'express',
                status: 'pending',
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString(),
                estimatedCost: 18.24,
                images: [],
                source: 'customer'
            };
            this.parcels.push(demoParcel);
        }
    }

    saveAllData() {
        localStorage.setItem('systemUsers', JSON.stringify(this.users));
        localStorage.setItem('systemParcels', JSON.stringify(this.parcels));
        
        // Also update legacy storage for compatibility
        localStorage.setItem('publicParcels', JSON.stringify(this.parcels));
        localStorage.setItem('swiftDeliveryUsers', JSON.stringify(this.users));
        localStorage.setItem('swiftDeliveryParcels', JSON.stringify(this.parcels));
        
        console.log('Data saved:', { users: this.users.length, parcels: this.parcels.length });
    }

    // LocalStorage fallback methods
    loginUserLocal(email, password, role = null) {
        const user = this.users.find(u => 
            u.email === email && 
            u.password === password && 
            u.isActive &&
            (role ? u.role === role : true)
        );
        
        if (!user) {
            return { success: false, message: 'Invalid credentials' };
        }
        
        return {
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                loginTime: new Date().toISOString()
            }
        };
    }

    addUserLocal(userData) {
        const newUser = {
            id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            name: userData.name,
            email: userData.email,
            password: userData.password,
            phone: userData.phone || 'Not provided',
            address: userData.address || 'Not provided',
            role: userData.role || 'customer',
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        if (this.users.find(u => u.email === newUser.email)) {
            return { success: false, message: 'Email already exists' };
        }
        
        this.users.push(newUser);
        this.saveAllData();
        return { success: true, user: newUser };
    }

    getAllUsersLocal() {
        return this.users;
    }

    getCustomersLocal() {
        return this.users.filter(u => u.role === 'customer');
    }

    getDispatchersLocal() {
        return this.users.filter(u => u.role === 'dispatcher');
    }

    updateUserLocal(userId, updates) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            this.saveAllData();
            return { success: true, user: this.users[userIndex] };
        }
        return { success: false, message: 'User not found' };
    }

    deleteUserLocal(userId) {
        this.users = this.users.filter(u => u.id !== userId);
        this.parcels = this.parcels.filter(p => p.customerId !== userId);
        this.saveAllData();
        return { success: true };
    }

    addParcelLocal(parcelData) {
        const newParcel = {
            id: 'parcel-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            trackingNumber: this.generateTrackingNumber(),
            customerId: parcelData.customerId,
            customerName: parcelData.customerName || parcelData.senderName,
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
            estimatedCost: this.calculateShippingCost(parcelData.weight, parcelData.priority),
            images: parcelData.images || [],
            source: parcelData.source || 'system'
        };
        
        this.parcels.push(newParcel);
        this.saveAllData();
        return { success: true, parcel: newParcel };
    }

    getAllParcelsLocal() {
        return this.parcels;
    }

    getParcelsByCustomerLocal(customerId) {
        return this.parcels.filter(p => p.customerId === customerId);
    }

    getPendingParcelsLocal() {
        return this.parcels.filter(p => p.status === 'pending');
    }

    getParcelsByStatusLocal(status) {
        return this.parcels.filter(p => p.status === status);
    }

    updateParcelLocal(parcelId, updates) {
        const parcelIndex = this.parcels.findIndex(p => p.id === parcelId || p.trackingNumber === parcelId);
        if (parcelIndex !== -1) {
            this.parcels[parcelIndex] = { 
                ...this.parcels[parcelIndex], 
                ...updates, 
                updatedAt: new Date().toISOString() 
            };
            this.saveAllData();
            return { success: true, parcel: this.parcels[parcelIndex] };
        }
        return { success: false, message: 'Parcel not found' };
    }

    deleteParcelLocal(parcelId) {
        this.parcels = this.parcels.filter(p => p.id !== parcelId && p.trackingNumber !== parcelId);
        this.saveAllData();
        return { success: true };
    }

    trackParcelLocal(trackingNumber) {
        return this.parcels.find(p => p.trackingNumber === trackingNumber);
    }

    getStatsLocal() {
        const totalCustomers = this.getCustomersLocal().length;
        const totalDispatchers = this.getDispatchersLocal().length;
        const totalParcels = this.parcels.length;
        const pendingParcels = this.getPendingParcelsLocal().length;
        const approvedParcels = this.parcels.filter(p => p.status === 'approved').length;
        const deliveredParcels = this.parcels.filter(p => p.status === 'delivered').length;
        const totalRevenue = deliveredParcels * 25;

        return {
            totalCustomers,
            totalDispatchers,
            totalParcels,
            pendingParcels,
            approvedParcels,
            deliveredParcels,
            totalRevenue
        };
    }

    getTodayStatsLocal() {
        const today = new Date().toDateString();
        const approvedToday = this.parcels.filter(p => 
            p.status === 'approved' && 
            p.approvedAt && 
            new Date(p.approvedAt).toDateString() === today
        ).length;
        
        const rejectedToday = this.parcels.filter(p => 
            p.status === 'rejected' && 
            p.rejectedAt && 
            new Date(p.rejectedAt).toDateString() === today
        ).length;

        const inTransit = this.parcels.filter(p => p.status === 'in-transit').length;

        return {
            approvedToday,
            rejectedToday,
            inTransit
        };
    }

    // Utility methods
    findCustomerIdByEmail(email) {
        const user = this.users.find(u => u.email === email);
        return user ? user.id : null;
    }

    generateTrackingNumber() {
        return 'PC' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
}

// Create global instance
window.dataManager = new DataManager();

// Export for use in other files
window.DataManager = DataManager;

console.log('DataManager initialized with database integration');