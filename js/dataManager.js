// js/dataManager.js
const DataManager = (function(){
  const PARCEL_KEY = 'sd_parcels';

  function loadParcels() {
    return JSON.parse(localStorage.getItem(PARCEL_KEY) || '[]');
  }
  function saveParcels(list){ localStorage.setItem(PARCEL_KEY, JSON.stringify(list)); }

  function genTracking() {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2,7);
    return `SD-${ts}-${rand}`.toUpperCase();
  }

  function createParcel({ senderEmail, recipientName, recipientPhone, address, weight, priority, description, images }) {
    const parcels = loadParcels();
    const parcel = {
      id: genTracking(),
      senderEmail,
      recipientName,
      recipientPhone,
      address,
      weight,
      priority,
      description,
      images: images || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
      logs: [{ at: new Date().toISOString(), msg: 'Created' }]
    };
    parcels.unshift(parcel);
    saveParcels(parcels);
    return parcel;
  }

  function updateParcel(id, patch) {
    const parcels = loadParcels();
    const idx = parcels.findIndex(p=>p.id===id);
    if (idx === -1) return null;
    parcels[idx] = { ...parcels[idx], ...patch };
    if (patch.status) parcels[idx].logs.push({ at: new Date().toISOString(), msg: `Status -> ${patch.status}` });
    saveParcels(parcels);
    return parcels[idx];
  }

  function getParcelById(id) {
    return loadParcels().find(p=>p.id===id);
  }

  function listParcels(filter = ()=>true) {
    return loadParcels().filter(filter);
  }

  return { loadParcels, saveParcels, createParcel, updateParcel, getParcelById, listParcels };
})();
