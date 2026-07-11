import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Plus, Trash, ArrowRight, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

function ResidentForm({ onClose, onSave, isSaving, residentToEdit }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(residentToEdit ? residentToEdit.name : '');
  const [apartmentNumber, setApartmentNumber] = useState(residentToEdit ? residentToEdit.apartmentNumber : '');
  const [carNumber, setCarNumber] = useState(residentToEdit ? residentToEdit.carNumber : '');
  const [childInput, setChildInput] = useState('');
  const [children, setChildren] = useState(residentToEdit ? (residentToEdit.children || []) : []);
  const [parcel, setParcel] = useState(residentToEdit ? (residentToEdit.parcel || '') : '');
  const [parcelsList, setParcelsList] = useState([]);

  useEffect(() => {
    const getParcels = async () => {
      try {
        const res = await fetch('/api/parcels');
        if (res.ok) {
          const data = await res.json();
          setParcelsList(data);
        }
      } catch(e) {
        console.error(e);
      }
    };
    getParcels();
  }, []);
  
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

  // Validate step 1
  const isStep1Valid = () => {
    return name.trim().length > 0 && apartmentNumber.trim().length > 0;
  };

  // Handle Next step
  const handleNext = () => {
    if (step === 1) {
      if (!isStep1Valid()) {
        Swal.fire({
          icon: 'warning',
          title: 'بيانات ناقصة',
          text: 'الرجاء إدخال الاسم الكامل ورقم الشقة للمتابعة.',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  // Handle Back step
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Handle clicking step indicators directly
  const handleStepClick = (targetStep) => {
    if (targetStep === 1) {
      setStep(1);
    } else if (targetStep === 2) {
      if (isStep1Valid()) {
        setStep(2);
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'بيانات ناقصة',
          text: 'الرجاء إدخال الاسم الكامل ورقم الشقة أولاً.',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#3b82f6'
        });
      }
    } else if (targetStep === 3) {
      if (isStep1Valid()) {
        setStep(3);
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'بيانات ناقصة',
          text: 'الرجاء إدخال البيانات الأساسية في الخطوة الأولى.',
          confirmButtonText: 'حسناً',
          confirmButtonColor: '#3b82f6'
        });
      }
    }
  };

  // Submit the form (only from step 3)
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isStep1Valid()) {
      setStep(1);
      Swal.fire({
        icon: 'warning',
        title: 'حقول مطلوبة',
        text: 'الرجاء إدخال الاسم الكامل ورقم الشقة.',
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#3b82f6'
      });
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('apartmentNumber', apartmentNumber);
    formData.append('carNumber', carNumber);
    formData.append('parcel', parcel);
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
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>{residentToEdit ? 'تعديل بيانات الساكن' : 'إضافة ساكن جديد'}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Stepper Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          margin: '1.5rem 1rem 2rem 1rem', 
          position: 'relative', 
          direction: 'rtl' 
        }}>
          {/* Progress bar line */}
          <div style={{ 
            position: 'absolute', 
            top: '18px', 
            left: '20px', 
            right: '20px', 
            height: '3px', 
            backgroundColor: '#e2e8f0', 
            zIndex: 1 
          }}>
            <div style={{ 
              width: step === 1 ? '0%' : step === 2 ? '50%' : '100%', 
              height: '100%', 
              backgroundColor: '#3b82f6', 
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
            }} />
          </div>

          {/* Step 1 indicator */}
          <div 
            style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            onClick={() => handleStepClick(1)}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: step >= 1 ? '#3b82f6' : '#fff',
              color: step >= 1 ? '#fff' : '#64748b',
              border: '2px solid #3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              boxShadow: step === 1 ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
              transition: 'all 0.3s'
            }}>
              1
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: step === 1 ? '700' : '500', color: step === 1 ? '#1e293b' : '#64748b' }}>البيانات الأساسية</span>
          </div>

          {/* Step 2 indicator */}
          <div 
            style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            onClick={() => handleStepClick(2)}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: step >= 2 ? '#3b82f6' : '#fff',
              color: step >= 2 ? '#fff' : '#64748b',
              border: `2px solid ${step >= 2 ? '#3b82f6' : '#cbd5e1'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              boxShadow: step === 2 ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
              transition: 'all 0.3s'
            }}>
              2
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: step === 2 ? '700' : '500', color: step === 2 ? '#1e293b' : '#64748b' }}>العائلة والسيارة</span>
          </div>

          {/* Step 3 indicator */}
          <div 
            style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            onClick={() => handleStepClick(3)}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: step >= 3 ? '#3b82f6' : '#fff',
              color: step >= 3 ? '#fff' : '#64748b',
              border: `2px solid ${step >= 3 ? '#3b82f6' : '#cbd5e1'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              boxShadow: step === 3 ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
              transition: 'all 0.3s'
            }}>
              3
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: step === 3 ? '700' : '500', color: step === 3 ? '#1e293b' : '#64748b' }}>الصور المعتمدة</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          {/* STEP 1 CONTENT */}
          {step === 1 && (
            <div className="step-content animated fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
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

              <div className="form-group">
                <label className="form-label">البارسيل (المنطقة)</label>
                <select 
                  className="form-control" 
                  value={parcel} 
                  onChange={(e) => setParcel(e.target.value)}
                >
                  <option value="">-- اختر البارسيل (اختياري) --</option>
                  {parcelsList.map(p => (
                    <option key={p._id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2 CONTENT */}
          {step === 2 && (
            <div className="step-content animated fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
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
                  <div className="children-tags" style={{ marginTop: '0.8rem' }}>
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
            </div>
          )}

          {/* STEP 3 CONTENT */}
          {step === 3 && (
            <div className="step-content animated fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
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
            </div>
          )}

          {/* Form Navigation Actions */}
          <div className="modal-footer" style={{ padding: '2rem 0 0 0', borderTop: 'none', display: 'flex', justifyContent: 'space-between', width: '100%', direction: 'rtl' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {step < 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  التالي
                  <ArrowLeft size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{ backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  disabled={isSaving}
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
              )}

              {step > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBack}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <ArrowRight size={16} />
                  السابق
                </button>
              ) }
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResidentForm;
