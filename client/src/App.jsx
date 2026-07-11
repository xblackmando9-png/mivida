import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ResidentForm from './components/ResidentForm';
import { 
  Plus, 
  Users, 
  Car, 
  Home, 
  Trash2, 
  Phone, 
  Heart, 
  Shield, 
  Info,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Search,
  Pencil
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('residents');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [residents, setResidents] = useState([]);
  const [editingResident, setEditingResident] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

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

  useEffect(() => {
    fetchResidents();
  }, []);

  // Show dynamic toast notifications
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
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
        const errorData = await res.json();
        showToast(errorData.message || 'حدث خطأ أثناء الحفظ', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('خطأ في الاتصال بالشبكة', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a resident
  const handleDeleteResident = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الساكن بالكامل؟')) {
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
        
        {/* Top Header Row matching the design */}
        <div className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>بوابة إدارة الكومباوند</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لوحة التحكم السريعة للمسؤولين</p>
            </div>
          </div>
          <div className="user-profile">
            <div className="user-profile-info" style={{ textAlign: 'left' }}>
              <span className="name">Hegazy Admin</span>
              <span className="role">مدير الكومباوند</span>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" 
              alt="Hegazy Admin" 
            />
          </div>
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
                        <span>شقة رقم: {resident.apartmentNumber}</span>
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
                            <div className="car-photo-preview-card">
                              <img 
                                src={resident.carPhoto} 
                                alt="Car Photo" 
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
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

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <div style={{ padding: '2rem 0' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>مرحباً بك في لوحة التحكم الإحصائية</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                  <Shield size={24} />
                </div>
                <div className="stat-info">
                  <span className="value">نشط</span>
                  <span className="label">بوابة الأمن الإلكترونية</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
                  <Info size={24} />
                </div>
                <div className="stat-info">
                  <span className="value">100%</span>
                  <span className="label">استقرار الاتصال بالسيرفر</span>
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
              <h4>نظام إدارة سكان كومباوند ميفيدا</h4>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.6' }}>
                يوفر هذا النظام للمسؤولين إمكانية تسجيل بيانات جميع السكان القاطنين، بالإضافة إلى أرقام لوحات سياراتهم وصور المركبات لضمان التعرف السريع عليها عند بوابات الدخول والخروج. كما يتيح النظام حصر العائلات وعدد الأطفال لكل ساكن لتسهيل تقديم الخدمات الاجتماعية والأمنية.
              </p>
            </div>
          </div>
        )}

        {/* Cars Tab Content */}
        {activeTab === 'cars' && (
          <div style={{ padding: '2rem 0' }}>
            <h3 style={{ marginBottom: '1rem' }}>قائمة المركبات المصرح لها</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>البحث وعرض السيارات المعتمدة داخل الكومباوند</p>
            
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
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
                  {residents.filter(r => r.carNumber).map((resident) => (
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
                  {residents.filter(r => r.carNumber).length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد سيارات مسجلة حالياً</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <div style={{ padding: '2rem 0' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>إعدادات النظام</h3>
            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>عنوان النظام</label>
                <input type="text" className="form-control" defaultValue="ميفيدا - لوحة تحكم الكومباوند" disabled />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>لغة العرض الافتراضية</label>
                <input type="text" className="form-control" defaultValue="العربية (RTL)" disabled />
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
                ملاحظة: بعض الإعدادات مقفلة حالياً لأسباب أمنية.
              </p>
            </div>
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
        />
      )}

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
