import React from 'react';
import { LayoutDashboard, Users, Car, Settings, LogOut, X } from 'lucide-react';

function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }) {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'residents', label: 'إدارة السكان', icon: Users },
    { id: 'cars', label: 'إدارة السيارات', icon: Car },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }} 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-box">
              MV
            </div>
            <span className="sidebar-logo-text">ميفيدا Hegazy</span>
          </div>
          {/* Close button for mobile */}
          <button className="sidebar-toggle-btn" style={{ display: 'none' }} onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Menu */}
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <a
                  className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false); // Close sidebar on mobile after selecting
                  }}
                >
                  <Icon className="sidebar-item-icon" />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <a className="sidebar-logout" onClick={() => alert('تسجيل الخروج...')}>
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </a>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
