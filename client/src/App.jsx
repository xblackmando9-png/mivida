import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ResidentForm from './components/ResidentForm';
import { 
  Plus, 
  Users, 
  Car, 
  Home, 
  Trash2, 
  Menu,
  Search,
  Pencil,
  MapPin,
  Heart
} from 'lucide-react';
import Swal from 'sweetalert2';
import XLSX from 'xlsx-js-style';

function App() {
  const [activeTab, setActiveTab] = useState('residents');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [carSearchQuery, setCarSearchQuery] = useState('');
  const [residents, setResidents] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [editingResident, setEditingResident] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isParcelModalOpen, setIsParcelModalOpen] = useState(false);
  const [newParcelName, setNewParcelName] = useState('');
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewCarPhoto, setViewCarPhoto] = useState(null); // URL of car photo to view fullscreen

  // Filter residents based on search query
  const filteredResidents = residents.filter((resident) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      resident.name.toLowerCase().includes(query) ||
      resident.apartmentNumber.toLowerCase().includes(query) ||
      (resident.carNumber && resident.carNumber.toLowerCase().includes(query))
    );
  });

  // Load residents from API
  const fetchResidents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/residents');
      if (res.ok) {
        const data = await res.json();
        setResidents(data);
      } else {
        showToast('فشل في تحميل بيانات السكان', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('خطأ في الاتصال بالسيرفر', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load parcels from API
  const fetchParcels = async () => {
    try {
      const res = await fetch('/api/parcels');
      if (res.ok) {
        const data = await res.json();
        setParcels(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchResidents();
    fetchParcels();
  }, []);

  const handleSaveParcel = async () => {
    if (!newParcelName.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/parcels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newParcelName.trim() })
      });
      if (res.ok) {
        showToast('تم حفظ البارسيل بنجاح');
        setNewParcelName('');
        setIsParcelModalOpen(false);
        fetchParcels();
      } else {
        const errData = await res.json();
        showToast(errData.message || 'فشل الحفظ', 'error');
      }
    } catch (err) {
      showToast('خطأ بالاتصال', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteParcel = async (parcel, e) => {
    e.stopPropagation(); // prevent card click
    const count = residents.filter(r => r.parcel === parcel.name).length;
    const result = await Swal.fire({
      title: `حذف بارسيل: ${parcel.name}`,
      html: count > 0
        ? `يوجد <strong>${count}</strong> ساكن مرتبط بهذا البارسيل. سيتم إلغاء ارتباطهم به تلقائياً.`
        : 'هل أنت متأكد من حذف هذا البارسيل؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء'
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/parcels/${parcel._id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('تم حذف البارسيل بنجاح');
        fetchParcels();
        fetchResidents(); // refresh to clear old parcel refs
      } else {
        const errData = await res.json();
        showToast(errData.message || 'فشل الحذف', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال', 'error');
    }
  };

  // Show dynamic toast notifications using SweetAlert2
  const showToast = (message, type = 'success') => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: type,
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      }
    });
  };

  const exportParcelToExcel = (parcel) => {
    const parcelResidents = residents.filter(r => r.parcel === parcel.name);
    if (parcelResidents.length === 0) {
      showToast('لا يوجد سكان مسجلين في هذا البارسيل لتصديرهم', 'error');
      return;
    }

    const dataToExport = parcelResidents.map((r, index) => ({
      'م': index + 1,
      'الاسم': r.name,
      'رقم الشقة': r.apartmentNumber,
      'رقم السيارة': r.carNumber || 'لا يوجد',
      'الأولاد': r.children.join(', ') || 'لا يوجد'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Apply premium styles to cells
    for (const cellRef in worksheet) {
      if (cellRef[0] === '!') continue; // Skip metadata
      const cell = worksheet[cellRef];
      const isHeader = cellRef.replace(/[A-Z]/g, '') === '1';

      if (isHeader) {
        cell.s = {
          fill: {
            fgColor: { rgb: "1e3a8a" } // Dark blue header (#1E3A8A)
          },
          font: {
            name: "Arial",
            sz: 12,
            bold: true,
            color: { rgb: "FFFFFF" } // White text
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          },
          border: {
            top: { style: "thin", color: { rgb: "cbd5e1" } },
            bottom: { style: "medium", color: { rgb: "1e3a8a" } },
            left: { style: "thin", color: { rgb: "cbd5e1" } },
            right: { style: "thin", color: { rgb: "cbd5e1" } }
          }
        };
      } else {
        cell.s = {
          font: {
            name: "Arial",
            sz: 10
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          },
          border: {
            top: { style: "thin", color: { rgb: "f1f5f9" } },
            bottom: { style: "thin", color: { rgb: "f1f5f9" } },
            left: { style: "thin", color: { rgb: "f1f5f9" } },
            right: { style: "thin", color: { rgb: "f1f5f9" } }
          }
        };
      }
    }

    // Auto-fit column widths based on maximum text length
    const colWidths = [];
    const keys = Object.keys(dataToExport[0] || {});
    keys.forEach((key) => {
      let maxLen = key.toString().length;
      dataToExport.forEach(row => {
        const val = row[key];
        if (val !== undefined && val !== null) {
          const len = val.toString().length;
          if (len > maxLen) {
            maxLen = len;
          }
        }
      });
      // Pad Arabic text width (since characters are wider than standard characters)
      colWidths.push({ wch: Math.max(maxLen * 1.8 + 6, 12) });
    });
    worksheet['!cols'] = colWidths;

    // Set row height for headers
    worksheet['!rows'] = [
      { hpt: 28 } // Header row height
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, parcel.name.slice(0, 31)); // sheet names must be <= 31 chars

    XLSX.writeFile(workbook, `سكان_${parcel.name.replace(/\s+/g, '_')}.xlsx`);
  };

  // Add or update resident
  const handleSaveResident = async (formData) => {
    setIsSaving(true);
    const isEdit = editingResident !== null;
    const url = isEdit ? `/api/residents/${editingResident._id}` : '/api/residents';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        body: formData,
      });

      if (res.ok) {
        showToast(isEdit ? 'تم تحديث بيانات الساكن بنجاح!' : 'تم حفظ بيانات الساكن بنجاح!');
        setIsModalOpen(false);
        setEditingResident(null);
        fetchResidents(); // Refresh list
      } else {
        let errMsg = 'حدث خطأ أثناء الحفظ';
        try {
          const errorData = await res.json();
          errMsg = errorData.message || errMsg;
        } catch (jsonErr) {
          const rawText = await res.text().catch(() => '');
          console.error('Non-JSON server response:', rawText);
          errMsg = `خطأ من السيرفر (${res.status})`;
        }
        showToast(errMsg, 'error');
      }
    } catch (err) {
      console.error('Network or fetch error:', err);
      showToast('خطأ في الاتصال بالشبكة', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a resident
  const handleDeleteResident = async (id) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: "لن تتمكن من التراجع عن الحذف!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'نعم، احذف الساكن',
      cancelButtonText: 'إلغاء'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const res = await fetch(`/api/residents/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('تم حذف الساكن وصوره بنجاح');
        setResidents((prev) => prev.filter((r) => r._id !== id));
      } else {
        showToast('فشل في حذف الساكن', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ في الاتصال بالسيرفر', 'error');
    }
  };

  // Calculate statistics
  const totalResidents = residents.length;
  const totalCars = residents.filter(r => r.carNumber && r.carNumber.trim() !== '').length;
  const uniqueApartments = new Set(residents.map(r => r.apartmentNumber)).size;

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar (Right-aligned) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      {/* Mobile Header Toggle */}
      <div className="mobile-header">
        <button className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <span className="sidebar-logo-text" style={{ fontSize: '1.1rem' }}>ميفيدا Hegazy</span>
        <div style={{ width: 24 }} /> {/* Spacer */}
      </div>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* Top Desktop Menu Button */}
        <div className="desktop-toggle-btn" style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{
              padding: '0.5rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px'
            }}
            title={isSidebarCollapsed ? "إظهار القائمة" : "إخفاء القائمة"}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Dynamic Page Rendering based on activeTab */}
        {activeTab === 'residents' && (
          <>
            {/* Residents Header section */}
            <div className="section-header">
              <div>
                <h3>قائمة السكان الحاليين</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>إدارة وتعديل بيانات القاطنين في الكومباوند</p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search Box */}
                <div style={{ display: 'flex', gap: '0.25rem', position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ابحث بالاسم، الشقة، أو السيارة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '260px', paddingLeft: '2.5rem' }}
                  />
                  <button 
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '10px' }}
                    onClick={() => {}} // Automatically active, button provides quick visual affordance
                    title="بحث"
                  >
                    <Search size={18} />
                  </button>
                </div>

                <button 
                  className="btn btn-primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus size={18} />
                  إضافة ساكن جديد
                </button>
              </div>
            </div>

            {/* Loading Indicator */}
            {isLoading ? (
              <div className="spinner"></div>
            ) : residents.length === 0 ? (
              <div className="empty-state">
                <Users className="empty-state-icon" size={48} />
                <h3>لا يوجد سكان مسجلين بعد</h3>
                <p style={{ color: 'var(--text-muted)' }}>اضغط على زر "إضافة ساكن جديد" بالأعلى للبدء في ملء قاعدة البيانات.</p>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                  <Plus size={18} />
                  إضافة ساكن الآن
                </button>
              </div>
            ) : filteredResidents.length === 0 ? (
              <div className="empty-state" style={{ padding: '3rem 2rem' }}>
                <Search className="empty-state-icon" size={48} />
                <h3>لا توجد نتائج مطابقة لبحثك</h3>
                <p style={{ color: 'var(--text-muted)' }}>تأكد من كتابة الاسم أو رقم الشقة أو رقم السيارة بشكل صحيح.</p>
                <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                  مسح البحث
                </button>
              </div>
            ) : (
              <div className="residents-grid">
                {filteredResidents.map((resident) => (
                  <div key={resident._id} className="resident-card">
                    <div className="resident-card-header">
                      {/* Delete Button */}
                      <button 
                        className="delete-btn-abs"
                        onClick={() => handleDeleteResident(resident._id)}
                        title="حذف الساكن"
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Edit Button */}
                      <button 
                        className="edit-btn-abs"
                        onClick={() => {
                          setEditingResident(resident);
                          setIsModalOpen(true);
                        }}
                        title="تعديل الساكن"
                      >
                        <Pencil size={16} />
                      </button>
                      
                      {/* Profile Photo */}
                      <div className="resident-profile-photo-container">
                        <img 
                          src={resident.personalPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop'} 
                          alt={resident.name} 
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop';
                          }}
                        />
                      </div>
                    </div>

                    <div className="resident-card-body">
                      <h4 className="resident-name">{resident.name}</h4>
                      <div className="apartment-info">
                        <Home size={14} />
                        <span>شقة رقم: {resident.apartmentNumber} {resident.parcel ? `( ${resident.parcel} )` : ''}</span>
                      </div>

                      <div className="resident-details-list">
                        {/* Car Details */}
                        <div className="detail-item">
                          <Car size={16} className="detail-icon" />
                          <div>
                            <span className="detail-label">رقم السيارة: </span>
                            <span className="detail-val">{resident.carNumber || 'لا توجد سيارة مسجلة'}</span>
                          </div>
                        </div>

                        {/* Kids Details */}
                        <div className="detail-item">
                          <Heart size={16} className="detail-icon" />
                          <div>
                            <span className="detail-label">عدد الأولاد: </span>
                            <span className="detail-val">
                              {resident.children && resident.children.length > 0 
                                ? `${resident.children.length} (${resident.children.join(', ')})`
                                : 'لا يوجد أولاد مسجلين'}
                            </span>
                          </div>
                        </div>

                        {/* Car Photo Display */}
                        {resident.carPhoto && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <span className="detail-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>صورة السيارة المعتمدة:</span>
                            <div 
                              className="car-photo-preview-card"
                              onClick={() => setViewCarPhoto(resident.carPhoto)}
                              style={{ cursor: 'zoom-in', position: 'relative' }}
                              title="اضغط لعرض الصورة كاملة"
                            >
                              <img 
                                src={resident.carPhoto} 
                                alt="Car Photo" 
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <div style={{
                                position: 'absolute', bottom: 6, left: 6,
                                backgroundColor: 'rgba(0,0,0,0.55)',
                                color: 'white', fontSize: '0.72rem',
                                padding: '2px 8px', borderRadius: '20px',
                                backdropFilter: 'blur(4px)'
                              }}>
                                🔍 عرض كاملة
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}


        {/* Cars Tab Content */}
        {activeTab === 'cars' && (
          <div style={{ padding: '2rem 0' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ marginBottom: '0.5rem' }}>قائمة المركبات المصرح لها</h3>
                <p style={{ color: 'var(--text-muted)' }}>البحث وعرض السيارات المعتمدة داخل الكومباوند</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', width: '300px' }}>
                <Search size={18} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="ابحث برقم السيارة أو الاسم..." 
                  style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.9rem' }}
                  value={carSearchQuery}
                  onChange={(e) => setCarSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="table-responsive-wrapper" style={{ backgroundColor: 'white' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem', fontWeight: '800' }}>صاحب المركبة</th>
                    <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem', fontWeight: '800' }}>رقم الشقة</th>
                    <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem', fontWeight: '800' }}>لوحة السيارة</th>
                    <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem', fontWeight: '800' }}>معاينة الصورة</th>
                  </tr>
                </thead>
                <tbody>
                  {residents.filter(r => r.carNumber).filter(r => {
                    const q = carSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      r.name.toLowerCase().includes(q) ||
                      r.carNumber.toLowerCase().includes(q)
                    );
                  }).map((resident) => (
                    <tr key={resident._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1.2rem 1.5rem', fontWeight: '700' }}>{resident.name}</td>
                      <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)' }}>{resident.apartmentNumber}</td>
                      <td style={{ padding: '1.2rem 1.5rem' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 'bold', border: '1px solid #cbd5e1' }}>
                          {resident.carNumber}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem' }}>
                        {resident.carPhoto ? (
                          <img 
                            src={resident.carPhoto} 
                            alt="Car" 
                            style={{ width: '50px', height: '35px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                          />
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>لا توجد صورة</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {residents.filter(r => r.carNumber).filter(r => {
                    const q = carSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return r.name.toLowerCase().includes(q) || r.carNumber.toLowerCase().includes(q);
                  }).length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد سيارات مسجلة أو مطابقة للبحث</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Parcels Tab Content */}
        {activeTab === 'parcels' && (
          <div style={{ padding: '2rem 0' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h3>إدارة البارسيل (Parcels)</h3>
                <p style={{ color: 'var(--text-muted)' }}>إدارة وتقسيم الكومباوند إلى مناطق (بارسيل)</p>
              </div>
              
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setNewParcelName('');
                  setIsParcelModalOpen(true);
                }}
              >
                <Plus size={18} />
                إضافة بارسيل جديد
              </button>
            </div>

            {selectedParcel ? (
              <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '2rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => setSelectedParcel(null)}>
                      رجوع للقائمة
                    </button>
                    <h3 style={{ margin: 0 }}>سكان بارسيل: {selectedParcel.name}</h3>
                  </div>
                  <button 
                    className="btn" 
                    style={{ backgroundColor: '#10b981', color: 'white' }}
                    onClick={() => exportParcelToExcel(selectedParcel)}
                  >
                    تصدير Excel
                  </button>
                </div>
                
                <div className="table-responsive-wrapper">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem' }}>الاسم</th>
                        <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem' }}>رقم الشقة</th>
                        <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem' }}>رقم السيارة</th>
                        <th style={{ padding: '1.2rem 1.5rem', fontSize: '0.85rem' }}>الأولاد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residents.filter(r => r.parcel === selectedParcel.name).map((resident) => (
                        <tr key={resident._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '1.2rem 1.5rem', fontWeight: '700' }}>{resident.name}</td>
                          <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)' }}>{resident.apartmentNumber}</td>
                          <td style={{ padding: '1.2rem 1.5rem' }}>{resident.carNumber || '-'}</td>
                          <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)' }}>{resident.children?.join(', ') || '-'}</td>
                        </tr>
                      ))}
                      {residents.filter(r => r.parcel === selectedParcel.name).length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد سكان في هذا البارسيل حالياً</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="residents-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {parcels.map((parcel) => (
                  <div 
                    key={parcel._id} 
                    className="stat-card" 
                    style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem', position: 'relative' }}
                    onClick={() => setSelectedParcel(parcel)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706', width: '40px', height: '40px' }}>
                          <Home size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{parcel.name}</h3>
                      </div>
                      <button
                        onClick={(e) => handleDeleteParcel(parcel, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger-color)',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="حذف البارسيل"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                      عدد السكان: {residents.filter(r => r.parcel === parcel.name).length}
                    </p>
                  </div>
                ))}
                {parcels.length === 0 && (
                  <div className="empty-state">
                    <p>لا توجد مناطق بارسيل مضافة حتى الآن</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Resident Modal Form */}
      {isModalOpen && (
        <ResidentForm 
          onClose={() => {
            setIsModalOpen(false);
            setEditingResident(null);
          }} 
          onSave={handleSaveResident}
          isSaving={isSaving}
          residentToEdit={editingResident}
          parcelsList={parcels}
        />
      )}
      {/* Add Parcel Modal */}
      {isParcelModalOpen && (
        <div className="modal-overlay" onClick={() => setIsParcelModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>إضافة بارسيل جديد</h3>
              <button className="modal-close" onClick={() => setIsParcelModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">اسم البارسيل</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newParcelName} 
                  onChange={(e) => setNewParcelName(e.target.value)} 
                  placeholder="مثال: بارسيل 1"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsParcelModalOpen(false)}
                disabled={isSaving}
              >
                إلغاء
              </button>
              <button 
                className="btn" 
                style={{ backgroundColor: '#10b981', color: 'white' }}
                onClick={handleSaveParcel}
                disabled={isSaving || !newParcelName.trim()}
              >
                {isSaving ? 'جاري الحفظ...' : 'حفظ البارسيل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Car Photo Lightbox Modal ===== */}
      {viewCarPhoto && (
        <div
          onClick={() => setViewCarPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setViewCarPhoto(null)}
            style={{
              position: 'absolute',
              top: '1.2rem',
              right: '1.2rem',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            title="إغلاق"
          >
            ✕
          </button>

          {/* Image */}
          <img
            src={viewCarPhoto}
            alt="صورة السيارة المعتمدة"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '16px',
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
              objectFit: 'contain',
              border: '2px solid rgba(255,255,255,0.15)'
            }}
          />

          {/* Label */}
          <div style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.75)',
            fontSize: '0.9rem',
            background: 'rgba(0,0,0,0.4)',
            padding: '0.4rem 1.2rem',
            borderRadius: '20px',
            backdropFilter: 'blur(4px)'
          }}>
            🚗 صورة السيارة المعتمدة — اضغط خارج الصورة للإغلاق
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
