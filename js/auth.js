// js/auth.js
const auth = (function(){
  const USER_KEY = 'sd_user';

  // Example seeded users (optional) - only for demo/testing
  const seedUsers = () => {
    if (!localStorage.getItem('sd_users')) {
      const users = [
        { email: 'alice@customer.test', role: 'customer', name: 'Alice Customer', password: 'pass' },
        { email: 'bob@dispatcher.test', role: 'dispatcher', name: 'Bob Dispatcher', password: 'pass' },
        { email: 'carol@admin.test', role: 'admin', name: 'Carol Admin', password: 'pass' }
      ];
      localStorage.setItem('sd_users', JSON.stringify(users));
    }
  };

  const getUsers = () => JSON.parse(localStorage.getItem('sd_users') || '[]');
  const saveUsers = (u) => localStorage.setItem('sd_users', JSON.stringify(u));

  function login({ email, password, role }) {
    seedUsers();
    // simple auth: check seeded users; if none matches create a new account for the role
    const users = getUsers();
    const matched = users.find(u => u.email === email && u.role === role);

    if (matched) {
      // If password matches (seeded users use 'pass')
      if (matched.password && password !== matched.password) {
        alert('Incorrect password for demo user. Try "pass" or register a new account.');
        return;
      }
      const user = { email: matched.email, role: matched.role, name: matched.name };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      redirectByRole(user.role);
    } else {
      // auto-register lightweight user for that role
      const name = email.split('@')[0];
      const newUser = { email, role, name, createdAt: Date.now() };
      users.push(newUser);
      saveUsers(users);
      localStorage.setItem(USER_KEY, JSON.stringify({ email, role, name }));
      redirectByRole(role);
    }
  }

  function logout() {
    localStorage.removeItem(USER_KEY);
    // return to home
    window.location.href = 'index.html';
  }

  function currentUser() {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  }

  function requireRole(role) {
    const u = currentUser();
    if (!u || u.role !== role) {
      // redirect to login
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }

  function redirectByRole(role) {
    // Adjust paths if your dashboards live in a folder
    if (role === 'customer') {
      window.location.href = 'dashboards/customer-dashboard.html';
    } else if (role === 'dispatcher') {
      window.location.href = 'dashboards/dispatcher-dashboard.html';
    } else if (role === 'admin') {
      window.location.href = 'dashboards/admin-dashboard.html';
    } else {
      window.location.href = 'index.html';
    }
  }

  // expose
  return { login, logout, currentUser, requireRole, redirectByRole, seedUsers };
})();
