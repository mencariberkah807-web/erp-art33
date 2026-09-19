import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DashboardPage from './pages/DashboardPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import SalesOrdersPage from './pages/SalesOrdersPage.jsx';
import SalesOrderDetailPage from './pages/SalesOrderDetailPage.jsx';
import NewOrderPage from './pages/NewOrderPage.jsx';
import ProductionPage from './pages/ProductionPage.jsx';
import WorkOrdersPage from './pages/WorkOrdersPage.jsx';
import WorkOrderDetailPage from './pages/WorkOrderDetailPage.jsx';
import PackingPage from './pages/PackingPage.jsx';
import HandoverPage from './pages/HandoverPage.jsx';
import PaymentsPage from './pages/PaymentsPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import './styles.css';
import './admin-friendly.css';
import './status-badges.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/backend';

const navigation = [
  { label: 'Dashboard', key: 'dashboard', kind: 'page' },
  { label: 'Customer', key: 'customers', kind: 'page' },
  {
    label: 'Penjualan',
    key: 'sales',
    children: [
      { label: 'New Order', key: 'new-order', kind: 'new-order' },
      { label: 'Invoice Uang Muka', key: 'invoice-down-payment', kind: 'future' },
      { label: 'Invoice Penjualan', key: 'sales-invoice', kind: 'future' },
      { label: 'Kuitansi Penjualan', key: 'sales-receipt', kind: 'future' },
      { label: 'Surat Jalan', key: 'delivery-note', kind: 'future' },
    ],
  },
  {
    label: 'Production',
    key: 'production',
    children: [
      { label: 'Work Order', key: 'work-orders', kind: 'page' },
      { label: 'Packing', key: 'packing', kind: 'page' },
      { label: 'Delivery', key: 'delivery', kind: 'page' },
    ],
  },
  {
    label: 'Pembelian',
    key: 'purchases',
    children: [
      { label: 'Purchase Order', key: 'purchase-order', kind: 'future' },
      { label: 'Penerimaan Barang', key: 'goods-receipt', kind: 'future' },
      { label: 'Supplier', key: 'supplier', kind: 'future' },
    ],
  },
  { label: 'Pembayaran Digital', key: 'digital-payment', kind: 'future' },
  {
    label: 'Produk & Stok',
    key: 'products-stock',
    children: [
      { label: 'Produk', key: 'products', kind: 'page' },
      { label: 'Stok', key: 'stock', kind: 'future' },
      { label: 'Stock Adjustment', key: 'stock-adjustment', kind: 'future' },
    ],
  },
  {
    label: 'Lainnya',
    key: 'others',
    children: [
      { label: 'Biaya', key: 'expenses', kind: 'future' },
      { label: 'Billing', key: 'billing', kind: 'future' },
      { label: 'Keuangan', key: 'finance', kind: 'future' },
      { label: 'Akunting', key: 'accounting', kind: 'future' },
      { label: 'Laporan', key: 'reports', kind: 'future' },
    ],
  },
];

const initialExpanded = {
  sales: true,
  production: true,
  purchases: true,
  'products-stock': true,
  others: true,
};

function FutureEnginePage({ label }) {
  return (
    <section className="future-engine-page">
      <div className="future-engine-card">
        <p className="eyebrow">FUTURE ENGINE</p>
        <h1>{label}</h1>
        <p className="page-description">Modul ini belum aktif dan disiapkan sebagai placeholder untuk pengembangan ERP-V3.</p>
        <div className="future-engine-status">NOT READY</div>
        <div className="future-engine-checklist">
          <strong>Development Checklist</strong>
          {['Business Logic', 'Database', 'Backend API', 'Frontend', 'Integration', 'Validation'].map((item) => (
            <label key={item}>
              <input type="checkbox" disabled />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdminApp({ user, onLogout }) {
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div><strong>ARTKRILIK ERP</strong><span>System Administration</span></div>
        <div className="admin-topbar-actions"><span className="admin-user-name">{user?.name || user?.username}</span><button className="button" type="button" onClick={onLogout}>Logout</button></div>
      </header>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <p className="admin-nav-label">ADMIN</p>
          <a className="admin-nav-item" href="/erp-artkrilik/admin">Dashboard</a>
          <div className="admin-nav-group"><strong>User Management</strong><a className="admin-nav-item active" href="/erp-artkrilik/admin/users">Users</a><a className="admin-nav-item disabled" href="#roles">Roles</a><a className="admin-nav-item disabled" href="#permissions">Permissions</a></div>
          <div className="admin-nav-group"><strong>Access Control</strong><a className="admin-nav-item disabled" href="#role-access">Role Access</a><a className="admin-nav-item disabled" href="#module-access">Module Access</a><a className="admin-nav-item disabled" href="#action-permissions">Action Permissions</a></div>
        </aside>
        <main className="admin-content"><AdminUsersPage /></main>
      </div>
    </div>
  );
}

function AuthGate() {
  const [state, setState] = useState({ status: 'checking', user: null });

  async function checkSession() {
    setState((current) => ({ ...current, status: 'checking' }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, { credentials: 'include' });
      if (!response.ok) {
        setState({ status: 'anonymous', user: null });
        return;
      }
      const payload = await response.json();
      setState({ status: 'authenticated', user: payload.user });
    } catch {
      setState({ status: 'anonymous', user: null });
    }
  }

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/reset-password') {
      setState({ status: 'public', user: null });
      return;
    }
    if (path === '/forgot-password') {
      setState({ status: 'public', user: null });
      return;
    }
    checkSession();
  }, []);

  function handleLogout() {
    fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setState({ status: 'anonymous', user: null });
      window.history.replaceState({}, '', '/');
    });
  }

  const path = window.location.pathname;

  if (path === '/reset-password') {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    return <ResetPasswordPage token={token} onComplete={() => { window.history.replaceState({}, '', '/'); setState({ status: 'anonymous', user: null }); }} />;
  }

  if (path === '/forgot-password') {
    return <ForgotPasswordPage onBack={() => window.history.replaceState({}, '', '/')} />;
  }

  if (state.status === 'checking') {
    return <main className="auth-page"><section className="auth-card auth-loading"><strong>Checking session…</strong></section></main>;
  }

  if (state.status === 'anonymous') {
    return <LoginPage onLogin={(user) => setState({ status: 'authenticated', user })} onForgotPassword={() => window.history.replaceState({}, '', '/forgot-password')} />;
  }

  if (path === '/erp-artkrilik/admin' || path === '/erp-artkrilik/admin/' || path === '/erp-artkrilik/admin/users') {
    const isOwner = (state.user?.roles || []).some((role) => role.code === 'OWNER');
    if (!isOwner) {
      return (
        <main className="auth-page">
          <section className="auth-card">
            <div className="auth-heading">
              <p className="eyebrow">ACCESS CONTROL</p>
              <h1>Access Denied</h1>
              <p>Halaman System Administration hanya dapat diakses oleh Owner.</p>
            </div>
            <button className="primary-button auth-submit" type="button" onClick={() => window.location.assign('/')}>Kembali ke ERP</button>
          </section>
        </main>
      );
    }
  }

  return <App user={state.user} onLogout={handleLogout} />;
}

function App({ user, onLogout }) {
  const [activePage, setActivePage] = useState('Dashboard');
  const [apiState, setApiState] = useState('checking');
  const [salesView, setSalesView] = useState('list');
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState(null);
  const [workOrderView, setWorkOrderView] = useState('list');
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);
  const [futurePage, setFuturePage] = useState(null);
  const [expanded, setExpanded] = useState(initialExpanded);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/health`)
      .then((response) => {
        if (active) setApiState(response.ok ? 'ok' : 'error');
      })
      .catch(() => {
        if (active) setApiState('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const isDashboard = activePage === 'Dashboard';
  const isCustomers = activePage === 'Customers';
  const isProducts = activePage === 'Products';
  const isSalesOrders = activePage === 'Sales Orders';
  const isProduction = activePage === 'Production';
  const isWorkOrders = activePage === 'Work Orders';
  const isPacking = activePage === 'Packing';
  const isHandover = activePage === 'Handover';
  const isPayments = activePage === 'Payments';

  function navigate(page) {
    setFuturePage(null);
    setActivePage(page);
    if (page === 'Sales Orders') {
      setSalesView('list');
      setSelectedSalesOrderId(null);
    }
    if (page === 'Work Orders') {
      setWorkOrderView('list');
      setSelectedWorkOrderId(null);
    }
  }

  function handleNavigation(item) {
    if (item.kind === 'future') {
      setFuturePage(item.label);
      setActivePage('Future Engine');
      return;
    }

    if (item.kind === 'new-order') {
      setFuturePage(null);
      setActivePage('Sales Orders');
      setSalesView('new');
      setSelectedSalesOrderId(null);
      return;
    }

    if (item.key === 'dashboard') {
      navigate('Dashboard');
    } else if (item.key === 'customers') {
      navigate('Customers');
    } else if (item.key === 'products') {
      navigate('Products');
    } else if (item.key === 'work-orders') {
      navigate('Work Orders');
    } else if (item.key === 'packing') {
      navigate('Packing');
    } else if (item.key === 'delivery') {
      navigate('Handover');
    }
  }

  function selectSalesOrder(id) {
    setFuturePage(null);
    setSelectedSalesOrderId(id);
    setActivePage('Sales Orders');
    setSalesView('list');
  }

  function selectWorkOrder(id) {
    setFuturePage(null);
    setSelectedWorkOrderId(id);
    setActivePage('Work Orders');
    setWorkOrderView('detail');
  }

  function handleNewOrderComplete() {
    setSelectedSalesOrderId(null);
    setSalesView('list');
  }

  function isItemActive(item) {
    if (item.kind === 'new-order') return isSalesOrders && salesView === 'new';
    if (item.key === 'customers') return isCustomers;
    if (item.key === 'products') return isProducts;
    if (item.key === 'work-orders') return isWorkOrders;
    if (item.key === 'packing') return isPacking;
    if (item.key === 'delivery') return isHandover;
    return futurePage === item.label;
  }

  if (window.location.pathname === '/erp-artkrilik/admin' || window.location.pathname === '/erp-artkrilik/admin/' || window.location.pathname === '/erp-artkrilik/admin/users') {
    return <AdminApp user={user} onLogout={onLogout} />;
  }

  return (
    <div className="erp-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>ARTKRILIK</strong>
            <span>ERP V3</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => {
            if (!item.children) {
              return (
                <button
                  className={`nav-item nav-item-root ${isItemActive(item) ? 'active' : ''}`}
                  key={item.key}
                  onClick={() => handleNavigation(item)}
                  type="button"
                >
                  <span className="nav-icon" />
                  <span>{item.label}</span>
                </button>
              );
            }

            const isExpanded = expanded[item.key] !== false;
            const hasActiveChild = item.children.some(isItemActive);

            return (
              <div className={`nav-section ${hasActiveChild ? 'has-active' : ''}`} key={item.key}>
                <button
                  className={`nav-item nav-parent ${hasActiveChild ? 'active-parent' : ''}`}
                  onClick={() => setExpanded((current) => ({ ...current, [item.key]: !isExpanded }))}
                  type="button"
                  aria-expanded={isExpanded}
                >
                  <span className="nav-icon" />
                  <span>{item.label}</span>
                  <span className="nav-chevron">{isExpanded ? '⌄' : '›'}</span>
                </button>

                {isExpanded && (
                  <div className="nav-children">
                    {item.children.map((child) => (
                      <button
                        className={`nav-item nav-child ${isItemActive(child) ? 'active' : ''}`}
                        key={child.key}
                        onClick={() => handleNavigation(child)}
                        type="button"
                      >
                        <span>{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span className={`status-dot status-${apiState}`} />
          API {apiState === 'ok' ? 'Connected' : apiState === 'checking' ? 'Checking' : 'Offline'}
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="breadcrumb">
              ARTKRILIK ERP / {
                futurePage
                  ? `Future Engine / ${futurePage}`
                  : isCustomers || isProducts
                    ? `Master Data / ${activePage}`
                    : isSalesOrders
                      ? `Sales / ${salesView === 'new' ? 'New Order' : 'Sales Orders'}`
                      : isProduction || isWorkOrders
                        ? `Production / ${isWorkOrders ? (workOrderView === 'detail' ? 'WO Detail' : 'Work Orders') : 'Board'}`
                        : isPacking || isHandover
                          ? `Fulfillment / ${activePage}`
                          : activePage
              }
            </span>
            <h2>
              {futurePage
                ? futurePage
                : isSalesOrders && salesView === 'new'
                  ? 'New Order'
                  : isWorkOrders && workOrderView === 'detail'
                    ? 'Work Order Detail'
                    : activePage}
            </h2>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="Notifications">●</button>
            <div className="user-chip">
              <span className="avatar">{(user?.name || user?.username || 'A').charAt(0).toUpperCase()}</span>
              <span>{user?.name || user?.username}</span>
              <button className="topbar-logout" type="button" onClick={onLogout}>Logout</button>
            </div>
          </div>
        </header>

        <main className="page-container">
          {futurePage && <FutureEnginePage label={futurePage} />}
          {!futurePage && isDashboard && <DashboardPage onSelectSalesOrder={selectSalesOrder} />}
          {!futurePage && isCustomers && <CustomersPage />}
          {!futurePage && isProducts && <ProductsPage />}
          {!futurePage && isSalesOrders && salesView === 'list' && (
            <SalesOrdersPage
              onNewOrder={() => setSalesView('new')}
              selectedOrderId={selectedSalesOrderId}
              onSelectOrder={selectSalesOrder}
            />
          )}
          {!futurePage && isSalesOrders && salesView === 'new' && (
            <NewOrderPage
              onSelect={(selection) => {
                if (selection === 'CREATED') handleNewOrderComplete();
              }}
              onCancel={() => setSalesView('list')}
            />
          )}
          {!futurePage && isProduction && <ProductionPage />}
          {!futurePage && isWorkOrders && workOrderView === 'list' && <WorkOrdersPage onSelectWorkOrder={selectWorkOrder} />}
          {!futurePage && isWorkOrders && workOrderView === 'detail' && selectedWorkOrderId && (
            <WorkOrderDetailPage workOrderId={selectedWorkOrderId} onBack={() => setWorkOrderView('list')} />
          )}
          {!futurePage && isPacking && <PackingPage />}
          {!futurePage && isHandover && <HandoverPage />}
          {!futurePage && isPayments && <PaymentsPage />}
          {!futurePage && activePage === 'Sales Order Detail' && <SalesOrderDetailPage />}
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>
);
