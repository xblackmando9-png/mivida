import React, { useState, useRef } from 'react';
import { X, Upload, Plus, Trash } from 'lucide-react';

function ResidentForm({ onClose, onSave, isSaving, residentToEdit }) {
  const [name, setName] = useState(residentToEdit ? residentToEdit.name : '');
  const [apartmentNumber, setApartmentNumber] = useState(residentToEdit ? residentToEdit.apartmentNumber : '');
  const [carNumber, setCarNumber] = useState(residentToEdit ? residentToEdit.carNumber : '');
  const [childInput, setChildInput] = useState('');
  const [children, setChildren] = useState(residentToEdit ? (residentToEdit.children || []) : []);
  
  // File states
  const [personalPhoto, setPersonalPhoto] = useState(null);
  const [personalPhotoPreview, setPersonalPhotoPreview] = useState(residentToEdit ? residentToEdit.personalPhoto : null);
  const [carPhoto, setCarPhoto] = useState(null);
  const [carPhotoPreview, setCarPhotoPreview] = useState(residentToEdit ? residentToEdit.carPhoto : null);

  const personalInputRef = useRef(null);
  const carInputRef = useRef(null);

  // Add child to list
  const handleAddChild = (e) => {
    e.preventDefault();
    if (childInput.trim()) {
      setChildren([...children, childInput.trim()]);
      setChildInput('');
    }
  };

  // Remove child from list
  const handleRemoveChild = (index) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  // Handle personal photo selection
  const handlePersonalPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPersonalPhoto(file);
      setPersonalPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Handle car photo selection
  const handleCarPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCarPhoto(file);
      setCarPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Submit the form
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !apartmentNumber.trim()) {
      alert('الرجاء إدخال الحقول المطلوبة (الاسم ورقم الشقة)');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('apartmentNumber', apartmentNumber);
    formData.append('carNumber', carNumber);
    formData.append('children', JSON.stringify(children));
    
    if (personalPhoto) {
      formData.append('personalPhoto', personalPhoto);
    }
    if (carPhoto) {
      formData.append('carPhoto', carPhoto);
    }

    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{residentToEdit ? 'تعديل بيانات الساكن' : 'إضافة ساكن جديد'}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Row 1: Name and Apartment Number */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">الاسم الكامل *</label>
              <input
                type="text"
                className="form-control"
                placeholder="اسم الساكن رباعي"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">رقم الشقة / الفيلا *</label>
              <input
                type="text"
                className="form-control"
                placeholder="مثال: 104أ أو 12"
                value={apartmentNumber}
                onChange={(e) => setApartmentNumber(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 2: Car Number */}
          <div className="form-group">
            <label className="form-label">رقم السيارة</label>
            <input
              type="text"
              className="form-control"
              placeholder="أرقام وحروف اللوحة (مثال: أ ب ج 1234)"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value)}
            />
          </div>

          {/* Row 3: Add Children */}
          <div className="form-group">
            <label className="form-label">الأولاد</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="اسم الولد / البنت"
                value={childInput}
                onChange={(e) => setChildInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChild(e);
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddChild}
                style={{ padding: '0.75rem' }}
              >
                <Plus size={18} />
              </button>
            </div>
            {children.length > 0 && (
              <div className="children-tags">
                {children.map((child, index) => (
                  <span key={index} className="child-tag">
                    {child}
                    <button type="button" onClick={() => handleRemoveChild(index)}>
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Row 4: Image Uploads */}
          <div className="form-row">
            {/* Personal Photo */}
            <div className="form-group">
              <label className="form-label">الصورة الشخصية للساكن</label>
              <div 
                className="file-upload-box"
                onClick={() => personalInputRef.current?.click()}
              >
                {personalPhotoPreview ? (
                  <img src={personalPhotoPreview} alt="Personal Preview" className="preview-img" />
                ) : (
                  <Upload size={24} className="detail-icon" />
                )}
                <span>{personalPhoto ? personalPhoto.name : 'اضغط لرفع صورة شخصية'}</span>
                <input
                  type="file"
                  accept="image/*"
                  ref={personalInputRef}
                  onChange={handlePersonalPhotoChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Car Photo */}
            <div className="form-group">
              <label className="form-label">صورة السيارة</label>
              <div 
                className="file-upload-box"
                onClick={() => carInputRef.current?.click()}
              >
                {carPhotoPreview ? (
                  <img src={carPhotoPreview} alt="Car Preview" className="preview-img" />
                ) : (
                  <Upload size={24} className="detail-icon" />
                )}
                <span>{carPhoto ? carPhoto.name : 'اضغط لرفع صورة السيارة'}</span>
                <input
                  type="file"
                  accept="image/*"
                  ref={carInputRef}
                  onChange={handleCarPhotoChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Footer inside form to control alignment */}
          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResidentForm;
