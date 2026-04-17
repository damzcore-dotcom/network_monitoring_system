import { useState, useEffect } from 'react';
import { X, Plus, Edit } from 'lucide-react';
import { DEVICE_TYPE_LABELS } from '../../utils/constants';

export default function DeviceForm({ onSubmit, onClose, parentOptions = [], initialData = null }) {
  const [form, setForm] = useState({
    name: '',
    type: 'switch',
    ip_address: '',
    parent_id: '',
    location: '',
    floor: '',
    snmp_community: 'public',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        type: initialData.type || 'switch',
        ip_address: initialData.ip_address || '',
        parent_id: initialData.parent_id || '',
        location: initialData.location || '',
        floor: initialData.floor || '',
        snmp_community: initialData.snmp_community || 'public',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      parent_id: form.parent_id ? parseInt(form.parent_id) : null,
    });
  };

  const isEditing = !!initialData;

  return (
    <div className="modal-overlay" onClick={onClose} id="device-form-modal">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {isEditing ? <Edit size={18} /> : <Plus size={18} />} 
            {isEditing ? ' Edit Device' : ' Add New Device'}
          </h3>
          <button className="detail-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Device Name</label>
              <input
                className="form-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Switch Sewing Lt.2"
                required
                id="input-device-name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Device Type</label>
                <select
                  className="form-select"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  id="select-device-type"
                >
                  {Object.entries(DEVICE_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>IP Address</label>
                <input
                  className="form-input"
                  name="ip_address"
                  value={form.ip_address}
                  onChange={handleChange}
                  placeholder="10.10.1.100"
                  required
                  id="input-ip-address"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Parent Device (Connection)</label>
              <select
                className="form-select"
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
                id="select-parent-device"
              >
                <option value="">— None (Root) —</option>
                {parentOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.ip_address})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input
                  className="form-input"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Ruang Sewing"
                  id="input-location"
                />
              </div>

              <div className="form-group">
                <label>Floor</label>
                <input
                  className="form-input"
                  name="floor"
                  value={form.floor}
                  onChange={handleChange}
                  placeholder="e.g. Lt. 1"
                  id="input-floor"
                />
              </div>
            </div>

            <div className="form-group">
              <label>SNMP Community</label>
              <input
                className="form-input"
                name="snmp_community"
                value={form.snmp_community}
                onChange={handleChange}
                placeholder="public"
                id="input-snmp"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="btn-save-device">
              {isEditing ? <Edit size={14} /> : <Plus size={14} />} 
              {isEditing ? ' Save Changes' : ' Add Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
