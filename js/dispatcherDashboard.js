// js/dispatcherDashboard.js
function checkDispatcherAuth(){
  if (!auth.requireRole('dispatcher')) return;
  const user = auth.currentUser();
  document.getElementById('welcomeText').textContent = user.name || user.email;
  refreshDispatcherData();
}

function refreshDispatcherData(){
  const all = DataManager.loadParcels();
  document.getElementById('pendingReviews').textContent = all.filter(p=>p.status==='pending').length;
  document.getElementById('approvedToday').textContent = all.filter(p=>p.status==='approved').length;
  document.getElementById('rejectedToday').textContent = all.filter(p=>p.status==='rejected').length;
  document.getElementById('inTransit').textContent = all.filter(p=>p.status==='in-transit' || p.status==='in transit').length;

  // parcel requests list
  const container = document.getElementById('parcelRequestsContainer');
  container.innerHTML = '';
  const pending = all.filter(p => p.status === 'pending');
  if (pending.length === 0) {
    container.innerHTML = '<p class="text-gray-500">No pending parcel requests.</p>';
    return;
  }
  pending.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'border rounded p-4 mb-3';
    div.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <div class="text-sm text-gray-500">${p.id} • ${new Date(p.createdAt).toLocaleString()}</div>
          <div class="font-medium">${p.recipientName} — ${p.recipientPhone}</div>
          <div class="text-sm text-gray-600">${p.address}</div>
          <div class="text-sm text-gray-600 mt-2">${p.description}</div>
        </div>
        <div class="flex flex-col gap-2 ml-4">
          <button class="px-3 py-1 bg-green-600 text-white rounded" onclick="approveParcel('${p.id}')">Approve</button>
          <button class="px-3 py-1 bg-red-600 text-white rounded" onclick="rejectParcel('${p.id}')">Reject</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });

  // fill all parcels table
  const tbody = document.getElementById('allParcelsTableBody');
  if (tbody) {
    tbody.innerHTML = '';
    all.forEach(p=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="px-6 py-4">${p.id}</td>
        <td class="px-6 py-4">${p.senderEmail}</td>
        <td class="px-6 py-4">${p.status}</td>
        <td class="px-6 py-4">${new Date(p.createdAt).toLocaleString()}</td>
        <td class="px-6 py-4">
          <button onclick="viewParcel('${p.id}')" class="px-3 py-1 bg-gray-200 rounded">View</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

function approveParcel(id) {
  DataManager.updateParcel(id, { status: 'approved' });
  refreshDispatcherData();
  alert('Parcel approved: ' + id);
}
function rejectParcel(id) {
  DataManager.updateParcel(id, { status: 'rejected' });
  refreshDispatcherData();
  alert('Parcel rejected: ' + id);
}
function viewParcel(id){
  const p = DataManager.getParcelById(id);
  if (!p) { alert('Parcel not found'); return; }
  alert(`Parcel ${p.id}\nStatus: ${p.status}\nRecipient: ${p.recipientName}`);
}
