import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import CustomersPage from './pages/CustomersPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import SalesOrdersPage from './pages/SalesOrdersPage.jsx';
import NewOrderPage from './pages/NewOrderPage.jsx';
import ProductionPage from './pages/ProductionPage.jsx';
import WorkOrdersPage from './pages/WorkOrdersPage.jsx';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const navigation = [
  { label: 'Dashboard', group: 'CORE' },
  { label: 'Sales Orders', group: 'SALES' },
  { label: 'Customers', group: 'MASTER DATA' },
  { label: 'Products', group: 'MASTER DATA' },
  { label: 'Work Orders', group: 'PRODUCTION' },
  { label: 'Production', group: 'PRODUCTION' },
  { label: 'Packing', group: 'FULFILLMENT' },
  { label: 'Payments', group: 'FINANCE' },
];

function App() {
  const [activePage, setActivePage] = useState('Customers');
  const [apiState, setApiState] = useState('checking');
  const [salesView, setSalesView] = useState('list');
  useEffect(() => { let active = true; fetch(`${API_BASE_URL}/health`).then((response) => { if (active) setApiState(response.ok ? 'ok' : 'error'); }).catch(() => { if (active) setApiState('error'); }); return () => { active = false; }; }, []);
  const isCustomers = activePage === 'Customers'; const isProducts = activePage === 'Products'; const isSalesOrders = activePage === 'Sales Orders'; const isProduction = activePage === 'Production'; const isWorkOrders = activePage === 'Work Orders';
  function navigate(page) { setActivePage(page); if (page === 'Sales Orders') setSalesView('list'); }
  return <div className="erp-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">A</div><div><strong>ARTKRILIK</strong><span>ERP V3</span></div></div><nav className="sidebar-nav" aria-label="Main navigation">{['CORE', 'SALES', 'PRODUCTION', 'FULFILLMENT', 'FINANCE', 'MASTER DATA'].map((group) => <div className="nav-group" key={group}><span className="nav-label">{group}</span>{navigation.filter((item) => item.group === group).map((item) => <button className={`nav-item ${activePage === item.label ? 'active' : ''}`} key={item.label} onClick={() => navigate(item.label)} type="button"><span className="nav-icon" />{item.label}</button>)}</div>)}</nav><div className="sidebar-footer"><span className={`status-dot status-${apiState}`} /> API {apiState === 'ok' ? 'Connected' : apiState === 'checking' ? 'Checking' : 'Offline'}</div></aside><div className="workspace"><header className="topbar"><div><span className="breadcrumb">ARTKRILIK ERP / {isCustomers || isProducts ? `Master Data / ${activePage}` : isSalesOrders && salesView === 'new' ? 'Sales / New Order' : isProduction || isWorkOrders ? `Production / ${activePage === 'Production' ? 'Board' : 'Work Orders'}` : activePage}</span><h2>{isSalesOrders && salesView === 'new' ? 'New Order' : activePage}</h2></div><div className="topbar-actions"><button className="icon-button" type="button" aria-label="Notifications">●</button><div className="user-chip"><span className="avatar">A</span><span>Admin</span></div></div></header><main className="page-container">{isCustomers && <CustomersPage />}{isProducts && <ProductsPage />}{isSalesOrders && salesView === 'list' && <SalesOrdersPage onNewOrder={() => setSalesView('new')} />}{isSalesOrders && salesView === 'new' && <NewOrderPage onSelect={() => {}} onCancel={() => setSalesView('list')} />}{isProduction && <ProductionPage />}{isWorkOrders && <WorkOrdersPage />}{!isCustomers && !isProducts && !isSalesOrders && !isProduction && !isWorkOrders && <PlaceholderPage title={activePage} />}</main></div></div>;
}
function PlaceholderPage({ title }) { return <section className="placeholder"><p className="eyebrow">ARTKRILIK ERP V3</p><h1>{title}</h1><p>This module is part of the approved global architecture and will be implemented incrementally.</p></section>; }
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
