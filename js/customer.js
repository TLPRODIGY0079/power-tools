// js/customer.js
function checkCustomerAuth(){
  if (!auth.requireRole('customer')) return;
  const user = auth.currentUser();
  document.getElementById('welcomeText').textContent = user.name || user.email;
  refreshDashboard();
}

function refreshDashboard(){
  const user = auth.currentUser();
  // stats
  const all = DataManager.listParcels(p => p.senderEmail === user.email);
  document.getElementById('totalParcels').textContent = all.length;
  document.getElementById('pendingParcels').textContent = all.filter(p=>p.status==='pending').length;
  document.getElementById('approvedParcels').textContent = all.filter(p=>p.status==='approved').length;
  document.getElementById('deliveredParcels').textContent = all.filter(p=>p.status==='delivered').length;

  // table
  const tbody = document.getElementById('parcelTableBody');
  tbody.innerHTML = '';
  all.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-6 py-4">${p.id}</td>
      <td class="px-6 py-4">${p.recipientName}</td>
      <td class="px-6 py-4">${p.address}</td>
      <td class="px-6 py-4">${p.status}</td>
      <td class="px-6 py-4">${(new Date(p.createdAt)).toLocaleString()}</td>
      <td class="px-6 py-4">
        <button onclick="viewParcel('${p.id}')" class="px-3 py-1 bg-gray-200 rounded">View</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function showSendParcelModal(){
  document.getElementById('sendParcelModal').classList.remove('hidden');
}

function closeModal(id){ document.getElementById(id).classList.add('hidden'); }

document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('customerSendParcelForm');
  if (form) {
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      const user = auth.currentUser();
      if(!user) { alert('Not logged in'); return; }

      // gather fields
      const recipientName = document.getElementById('recipientName').value;
      const recipientPhone = document.getElementById('recipientPhone').value;
      const address = document.getElementById('deliveryAddress').value;
      const weight = parseFloat(document.getElementById('packageWeight').value);
      const priority = document.getElementById('packagePriority').value;
      const description = document.getElementById('packageDescription').value;
      // images: optional, keep as empty list for now (you can extend to DataURL)
      const parcel = DataManager.createParcel({
        senderEmail: user.email,
        recipientName, recipientPhone, address, weight, priority, description, images: []
      });
      alert('Parcel submitted: ' + parcel.id);
      closeModal('sendParcelModal');
      refreshDashboard();
    });
  }
});

function viewParcel(id){
  const p = DataManager.getParcelById(id);
  if (!p) { alert('Parcel not found'); return; }
  alert(`Parcel ${p.id}\nStatus: ${p.status}\nRecipient: ${p.recipientName}\nCreated: ${p.createdAt}`);
}
