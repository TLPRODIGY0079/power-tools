// js/adminDashboard.js
function checkAdminAuth(){
  if (!auth.requireRole('admin')) return;
  const user = auth.currentUser();
  document.getElementById('welcomeText').textContent = user.name || user.email;
  refreshAdminData();
}

function refreshAdminData(){
  const parcels = DataManager.loadParcels();
  document.getElementById('totalParcels').textContent = parcels.length;
  document.getElementById('pendingParcels').textContent = parcels.filter(p=>p.status==='pending').length;
  document.getElementById('totalRevenue').textContent = '$' + (parcels.reduce((s,p)=>s + (p.priority === 'express' ? 12.99 : p.priority === 'same-day' ? 24.99 : 5.99),0)).toFixed(2);

  // customers list
  const users = JSON.parse(localStorage.getItem('sd_users')||'[]');
  const customers = users.filter(u=>u.role==='customer');
  document.getElementById('totalCustomers').textContent = customers.length;
  const dispatchers = users.filter(u=>u.role==='dispatcher');
  document.getElementById('totalDispatchers').textContent = dispatchers.length;

  // populate tables
  const customersBody = document.getElementById('customersTableBody');
  if (customersBody){
    customersBody.innerHTML = '';
    customers.forEach(c=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="px-6 py-4">${c.name||c.email}</td>
        <td class="px-6 py-4">${c.email}</td>
        <td class="px-6 py-4">${c.phone||''}</td>
        <td class="px-6 py-4">${DataManager.listParcels(p=>p.senderEmail===c.email).length}</td>
        <td class="px-6 py-4">${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</td>
        <td class="px-6 py-4"><button class="px-3 py-1 bg-red-500 text-white rounded" onclick="deleteUser('${c.email}')">Delete</button></td>`;
      customersBody.appendChild(tr);
    });
  }
}

function deleteUser(email){
  if (!confirm('Delete user ' + email + '?')) return;
  const users = JSON.parse(localStorage.getItem('sd_users')||'[]').filter(u=>u.email!==email);
  localStorage.setItem('sd_users', JSON.stringify(users));
  refreshAdminData();
}

function showTab(name){
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.add('hidden'));
  document.getElementById(name + 'Content').classList.remove('hidden');

  // tab buttons style
  document.getElementById('customersTab').classList.remove('text-gray-500','border-transparent'); document.getElementById('customersTab').classList.add('text-gray-500');
  // simple tab highlight: remove active from all
  ['customersTab','dispatchersTab','parcelsTab'].forEach(id=>{
    document.getElementById(id).classList.remove('border-blue-600','text-blue-600');
  });
  if (name === 'customers') document.getElementById('customersTab').classList.add('border-blue-600','text-blue-600');
  if (name === 'dispatchers') document.getElementById('dispatchersTab').classList.add('border-blue-600','text-blue-600');
  if (name === 'parcels') document.getElementById('parcelsTab').classList.add('border-blue-600','text-blue-600');
}

document.addEventListener('DOMContentLoaded', function(){
  // default tab
  try { showTab('customers'); } catch(e){}
});
