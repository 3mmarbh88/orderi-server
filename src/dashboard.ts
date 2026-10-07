export function renderDashboardHtml(defaultAdminToken: string, isSupabase: boolean): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Orderi Server | إدارة البرنامج والتحكم المركزي</title>
  <meta name="description" content="Orderi Server - لوحة الإدارة والتحكم المركزية لمنظومة Orderi لإدارة المستخدمين والمندوبين والأجهزة والتراخيص">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="apple-touch-icon" href="/orderi-admin-logo.svg">
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#090d16">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Orderi Admin">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f293d;
      --accent: #0284c7;
      --accent-hover: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.25);
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --sidebar-width: 270px;
      --bottom-bar-height: 64px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      line-height: 1.5;
    }

    /* =========================================================
       LOGIN SCREEN
    ========================================================= */
    #login-screen {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at top center, #132238 0%, #090d16 80%);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: rgba(17, 24, 39, 0.9);
      border: 1px solid rgba(56, 189, 248, 0.2);
      backdrop-filter: blur(16px);
      border-radius: 20px;
      padding: 2.25rem 1.75rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(14, 165, 233, 0.15);
      text-align: center;
      position: relative;
    }

    .login-logo {
      width: 96px;
      height: 96px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
      position: relative;
      filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.55));
    }

    .login-title {
      font-size: 1.6rem;
      font-weight: 900;
      color: #fff;
      letter-spacing: -0.5px;
      margin-bottom: 0.25rem;
    }

    .login-subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 1.75rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      text-align: right;
    }

    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .input-wrapper label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #cbd5e1;
    }

    .input-field {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-field input {
      width: 100%;
      background: #0b1120;
      border: 1px solid #1f293d;
      border-radius: 12px;
      padding: 0.8rem 1rem 0.8rem 2.5rem;
      color: #fff;
      font-family: inherit;
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .input-field input:focus {
      outline: none;
      border-color: var(--accent-hover);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .input-icon-btn {
      position: absolute;
      left: 0.75rem;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.25rem;
    }

    .btn-login {
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      color: #fff;
      border: none;
      padding: 0.85rem;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(14, 165, 233, 0.35);
      transition: all 0.2s;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-login:hover {
      background: linear-gradient(135deg, #0ea5e9, #38bdf8);
      transform: translateY(-1px);
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: #64748b;
      font-size: 0.8rem;
      margin: 1.25rem 0;
    }

    .divider::before, .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #1e293b;
    }

    .divider::before { margin-left: 0.75rem; }
    .divider::after { margin-right: 0.75rem; }

    .btn-biometric {
      background: rgba(16, 185, 129, 0.12);
      border: 1.5px solid rgba(16, 185, 129, 0.4);
      color: #6ee7b7;
      padding: 0.85rem;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
      transition: all 0.2s;
    }

    .btn-biometric:hover {
      background: rgba(16, 185, 129, 0.2);
      border-color: #10b981;
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25);
    }

    .quick-creds {
      background: rgba(255, 255, 255, 0.03);
      border: 1px dashed #334155;
      padding: 0.65rem;
      border-radius: 10px;
      margin-top: 1.25rem;
      font-size: 0.78rem;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .quick-creds button {
      background: #1e293b;
      border: 1px solid #334155;
      color: #38bdf8;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
      font-weight: 700;
    }

    /* Biometric Simulation Modal */
    .bio-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      z-index: 1200;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      backdrop-filter: blur(8px);
    }

    .bio-modal-card {
      background: #111827;
      border: 1px solid #10b981;
      border-radius: 20px;
      width: 100%;
      max-width: 380px;
      padding: 2rem 1.5rem;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.7), 0 0 30px rgba(16, 185, 129, 0.2);
    }

    .fingerprint-scanner {
      width: 90px;
      height: 90px;
      margin: 1rem auto 1.5rem;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.1);
      border: 2px solid #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      color: #10b981;
      cursor: pointer;
      position: relative;
      animation: pulseBio 1.8s infinite;
    }

    @keyframes pulseBio {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(16, 185, 129, 0.4); }
      50% { transform: scale(1.05); box-shadow: 0 0 25px rgba(16, 185, 129, 0.6); }
    }

    /* =========================================================
       APP WRAPPER & DESKTOP SIDEBAR
    ========================================================= */
    #app-container {
      display: none;
      min-height: 100vh;
      flex-direction: row;
    }

    .sidebar {
      width: var(--sidebar-width);
      background: #0d121f;
      border-left: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      bottom: 0;
      right: 0;
      z-index: 100;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .brand {
      padding: 1.25rem;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-logo {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
    }

    .brand-subtitle {
      font-size: 0.72rem;
      color: var(--accent-hover);
      font-weight: 700;
    }

    .nav-links {
      padding: 1rem 0.75rem;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      overflow-y: auto;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      color: #94a3b8;
      font-size: 0.92rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
    }

    .nav-item.active {
      background: rgba(14, 165, 233, 0.15);
      color: var(--accent-hover);
      border-right: 3px solid var(--accent-hover);
    }

    .nav-badge {
      margin-right: auto;
      background: var(--danger);
      color: #fff;
      font-size: 0.7rem;
      padding: 0.1rem 0.45rem;
      border-radius: 99px;
      font-weight: 800;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid var(--card-border);
      background: #090d16;
    }

    .user-profile-badge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #111827;
      border-radius: 10px;
      border: 1px solid #1f293d;
    }

    /* =========================================================
       MAIN CONTENT & HEADER
    ========================================================= */
    .main-wrap {
      margin-right: var(--sidebar-width);
      flex: 1;
      padding: 1.5rem 2rem;
      max-width: 1500px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Top Bar */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      background: #111827;
      border: 1px solid var(--card-border);
      padding: 0.9rem 1.25rem;
      border-radius: 16px;
    }

    .top-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mobile-menu-btn {
      display: none;
      background: #1f2937;
      border: 1px solid #374151;
      color: #fff;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1.2rem;
      align-items: center;
      justify-content: center;
    }

    .page-title h1 {
      font-size: 1.35rem;
      font-weight: 900;
      color: #fff;
    }

    .page-title p {
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.55rem 1rem;
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
      font-family: inherit;
      white-space: nowrap;
      -webkit-appearance: none;
      appearance: none;
      margin: 0;
      outline: none;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      user-select: none;
    }

    .btn-primary { background: var(--accent); color: #fff; }
    .btn-primary:hover { background: var(--accent-hover); }

    .btn-secondary { background: #1f293d; color: #e2e8f0; border-color: #334155; }
    .btn-secondary:hover { background: #334155; }

    .btn-success { background: #059669; color: #fff; }
    .btn-success:hover { background: #10b981; }

    .btn-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }
    .btn-danger:hover { background: var(--danger); color: #fff; }

    .btn-sm { padding: 0.35rem 0.7rem; font-size: 0.8rem; border-radius: 8px; }

    /* =========================================================
       KPI STATS GRID (RESPONSIVE)
    ========================================================= */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 1.25rem;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .stat-card::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--accent-hover);
    }

    .stat-card.stat-success::after { background: var(--success); }
    .stat-card.stat-warning::after { background: var(--warning); }
    .stat-card.stat-danger::after { background: var(--danger); }

    .stat-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 0.4rem;
    }

    .stat-val {
      font-size: 1.85rem;
      font-weight: 900;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
    }

    .stat-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    /* =========================================================
       TAB PANES & TABLES / MOBILE CARDS
    ========================================================= */
    .tab-content { display: none; }
    .tab-content.active { display: block; animation: fadeIn 0.2s ease; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.25rem;
      width: 100%;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .card-header {
      padding: 1.15rem 1.25rem;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .table-container {
      overflow-x: auto;
      width: 100%;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: right;
      font-size: 0.88rem;
    }

    th {
      background: #0d1322;
      padding: 0.85rem 1rem;
      color: #94a3b8;
      font-weight: 700;
      border-bottom: 1px solid var(--card-border);
      white-space: nowrap;
    }

    td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--card-border);
      color: #e2e8f0;
      vertical-align: middle;
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0.25rem 0.65rem;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .badge-success { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-warning { background: rgba(245, 158, 11, 0.15); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-danger { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-info { background: rgba(14, 165, 233, 0.15); color: #7dd3fc; border: 1px solid rgba(14, 165, 233, 0.3); }
    .badge-gray { background: #1f2937; color: #9ca3af; border: 1px solid #374151; }

    .code-tag {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      background: #080c14;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      color: var(--accent-hover);
      border: 1px solid #1f293d;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .copy-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .copy-btn:hover { color: #fff; }

    /* =========================================================
       MODALS
    ========================================================= */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(6px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      padding: 1rem;
    }

    .modal-overlay.active { display: flex; }

    .modal {
      background: #111827;
      border: 1px solid var(--card-border);
      border-radius: 18px;
      width: 100%;
      max-width: 480px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
      animation: modalPop 0.2s ease;
    }

    @keyframes modalPop {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-header h3 { font-size: 1.15rem; font-weight: 800; color: #fff; }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-group label {
      font-size: 0.85rem;
      color: #cbd5e1;
      font-weight: 700;
    }

    .form-input, .form-select {
      background: #090d16;
      border: 1px solid #1f293d;
      border-radius: 10px;
      padding: 0.7rem 0.9rem;
      color: #fff;
      font-family: inherit;
      font-size: 0.9rem;
      width: 100%;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--accent-hover);
      box-shadow: 0 0 0 2px var(--accent-glow);
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: #090d16;
      border-top: 1px solid var(--card-border);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    /* Toast */
    .toast-container {
      position: fixed;
      top: 1rem;
      left: 1rem;
      right: 1rem;
      z-index: 1500;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      pointer-events: none;
    }

    .toast {
      background: #1e293b;
      border: 1px solid #38bdf8;
      color: #fff;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      gap: 0.6rem;
      animation: dropDown 0.25s ease;
      pointer-events: auto;
      max-width: 90%;
    }

    @keyframes dropDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* =========================================================
       MOBILE BOTTOM BAR & RESPONSIVE TWEAKS
    ========================================================= */
    .mobile-bottom-bar {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--bottom-bar-height);
      background: #0d121f;
      border-top: 1px solid var(--card-border);
      z-index: 90;
      padding-bottom: env(safe-area-inset-bottom);
      justify-content: space-around;
      align-items: center;
    }

    .bottom-nav-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      color: #64748b;
      font-size: 0.72rem;
      font-weight: 700;
      background: none;
      border: none;
      cursor: pointer;
      flex: 1;
      height: 100%;
      position: relative;
    }

    .bottom-nav-btn.active {
      color: var(--accent-hover);
    }

    .bottom-nav-btn .icon {
      font-size: 1.25rem;
    }

    .bottom-badge {
      position: absolute;
      top: 6px;
      right: 50%;
      transform: translateX(12px);
      background: var(--danger);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 900;
      padding: 0.05rem 0.35rem;
      border-radius: 99px;
    }

    /* Mobile Responsive Rules */
    @media (max-width: 900px) {
      .sidebar {
        transform: translateX(100%);
      }
      .sidebar.open {
        transform: translateX(0);
      }

      .main-wrap {
        margin-right: 0;
        padding: 0.85rem;
        gap: 1rem;
        padding-bottom: calc(var(--bottom-bar-height) + 1.25rem + env(safe-area-inset-bottom));
        max-width: 100vw;
        box-sizing: border-box;
        overflow-x: hidden;
      }

      .mobile-menu-btn {
        display: inline-flex;
      }

      .mobile-bottom-bar {
        display: flex;
      }

      .topbar {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
        padding: 0.85rem;
        border-radius: 14px;
      }

      .top-left {
        width: 100%;
        justify-content: flex-start;
      }

      .top-actions {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1.2fr 0.8fr;
        gap: 0.45rem;
      }

      .top-actions .btn {
        width: 100%;
        padding: 0.55rem 0.35rem;
        font-size: 0.8rem;
        justify-content: center;
      }

      .stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
      }

      .stat-card {
        padding: 0.85rem 0.9rem;
        border-radius: 12px;
        min-width: 0;
      }

      /* 5th stat card (Alerts) spans full width across both columns */
      .stat-card:nth-of-type(5) {
        grid-column: 1 / -1;
      }

      .stat-head {
        font-size: 0.78rem;
      }

      .stat-val {
        font-size: 1.45rem;
        line-height: 1.15;
      }

      .stat-sub {
        font-size: 0.72rem;
        line-height: 1.3;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 0.85rem;
        width: 100%;
      }

      .card {
        border-radius: 14px;
        margin-bottom: 0.85rem;
        width: 100%;
        box-sizing: border-box;
      }

      .card-header {
        padding: 0.85rem 1rem;
        flex-wrap: nowrap;
      }

      .card-title {
        font-size: 0.95rem;
      }

      .table-container {
        overflow-x: hidden;
        width: 100%;
      }

      /* Mobile Card Layout for Tables */
      .mobile-card-view tbody tr {
        display: flex;
        flex-direction: column;
        background: #0d1526;
        margin-bottom: 0.65rem;
        border-radius: 12px;
        border: 1px solid rgba(56, 189, 248, 0.15);
        padding: 0.75rem 0.85rem;
        gap: 0.35rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      }

      .mobile-card-view thead {
        display: none;
      }

      .mobile-card-view td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px dashed rgba(255,255,255,0.06);
        padding: 0.35rem 0;
        font-size: 0.82rem;
        word-break: break-word;
      }

      .mobile-card-view td:last-child {
        border-bottom: none;
        padding-top: 0.4rem;
      }

      .mobile-card-view td::before {
        content: attr(data-label);
        font-weight: 700;
        color: #94a3b8;
        font-size: 0.78rem;
      }
    }

    @media (max-width: 480px) {
      .main-wrap {
        padding: 0.65rem;
        gap: 0.75rem;
      }
      .page-title h1 {
        font-size: 1.1rem;
      }
      .page-title p {
        font-size: 0.72rem;
      }
      .stat-val {
        font-size: 1.35rem;
      }
      .stat-sub {
        font-size: 0.68rem;
      }
      .top-actions {
        grid-template-columns: 1fr 1fr 0.7fr;
        gap: 0.35rem;
      }
      .top-actions .btn {
        padding: 0.5rem 0.25rem;
        font-size: 0.75rem;
      }
      .card-header {
        padding: 0.75rem 0.85rem;
      }
      .card-title {
        font-size: 0.88rem;
      }
      .login-card {
        padding: 1.5rem 1.1rem;
      }
    }
  </style>
</head>
<body>

  <!-- =========================================================
       1. ADMIN LOGIN SCREEN WITH BIOMETRICS
  ========================================================= -->
  <div id="login-screen">
    <div class="login-card">
      <div class="login-logo">
        <img src="/orderi-admin-logo.svg" alt="Orderi Admin" style="width:100%; height:100%; object-fit:cover; display:block;">
      </div>
      <h2 class="login-title">Orderi Server</h2>
      <p class="login-subtitle">إدارة البرنامج</p>

      <form class="login-form" id="admin-login-form" onsubmit="handleLoginSubmit(event)">
        <div class="input-wrapper">
          <label>اسم المشرف (Username)</label>
          <div class="input-field">
            <input type="text" id="admin-user-input" placeholder="أدخل اسم المشرف" required autocomplete="username">
          </div>
        </div>

        <div class="input-wrapper">
          <label>كلمة المرور (Password)</label>
          <div class="input-field">
            <input type="password" id="admin-pass-input" placeholder="أدخل كلمة المرور" required autocomplete="current-password">
            <button type="button" class="input-icon-btn" onclick="togglePassVisibility()" title="إظهار/إخفاء">👁️</button>
          </div>
        </div>

        <button type="submit" class="btn-login" id="btn-login-submit">
          <span>دخول للوحة التحكم</span>
          <span>←</span>
        </button>

        <div class="divider">أو الدخول المباشر بالبصمة</div>

        <button type="button" class="btn-biometric" onclick="handleBiometricLoginClick()">
          <span style="font-size:1.3rem;">👆</span>
          <span>الدخول ببصمة الإصبع / الوجه</span>
        </button>
      </form>
    </div>
  </div>

  <!-- BIOMETRIC SCANNER POPUP -->
  <div class="bio-modal-overlay" id="bio-modal">
    <div class="bio-modal-card">
      <h3 style="font-size:1.2rem; font-weight:800; color:#fff; margin-bottom:0.25rem;">التحقق من البصمة</h3>
      <p style="font-size:0.85rem; color:#94a3b8;">المس مستشعر البصمة أو انقر للمصادقة الفورية</p>
      
      <div class="fingerprint-scanner" onclick="confirmBiometricTouch()">
        👆
      </div>

      <div id="bio-modal-status" style="font-size:0.88rem; color:#6ee7b7; font-weight:700; margin-bottom:1.25rem;">
        بانتظار قراءة البصمة...
      </div>

      <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="closeBioModal()">إلغاء</button>
    </div>
  </div>

  <!-- =========================================================
       2. MAIN APPLICATION CONTAINER
  ========================================================= -->
  <div id="app-container">

    <!-- DESKTOP / DRAWER SIDEBAR -->
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="brand-logo" style="overflow:hidden; padding:0; background:transparent;">
          <img src="/orderi-admin-logo.svg" alt="Orderi Admin" style="width:100%; height:100%; border-radius:12px; object-fit:cover; display:block;">
        </div>
        <div>
          <div class="brand-title">Orderi Server</div>
          <div class="brand-subtitle">إدارة البرنامج والتحكم</div>
        </div>
      </div>

      <ul class="nav-links">
        <li class="nav-item active" onclick="switchTab('dashboard')">
          <span>🏠</span>
          <span>لوحة التحكم الرئيسية</span>
        </li>
        <li class="nav-item" onclick="switchTab('users')">
          <span>👥</span>
          <span>إدارة المستخدمين</span>
        </li>
        <li class="nav-item" onclick="switchTab('codes')">
          <span>🔑</span>
          <span>أكواد التفعيل</span>
        </li>
        <li class="nav-item" onclick="switchTab('devices')">
          <span>📱</span>
          <span>إدارة الأجهزة</span>
        </li>
        <li class="nav-item" onclick="switchTab('subscriptions')">
          <span>📅</span>
          <span>الاشتراكات</span>
        </li>
        <li class="nav-item" onclick="switchTab('orders')">
          <span>📦</span>
          <span>الطلبات</span>
        </li>
        <li class="nav-item" onclick="switchTab('logs')">
          <span>📋</span>
          <span>سجل العمليات</span>
        </li>
        <li class="nav-item" onclick="switchTab('alerts')">
          <span>🚨</span>
          <span>التنبيهات والأخطاء</span>
          <span class="nav-badge" id="sidebar-alert-badge" style="display:none">0</span>
        </li>
        <li class="nav-item" onclick="switchTab('whatsapp')">
          <span>📡</span>
          <span>رادار الواتساب</span>
        </li>
        <li class="nav-item" onclick="switchTab('security')">
          <span>🛡️</span>
          <span>أمان الهاتف والبصمة</span>
        </li>
      </ul>

      <div class="sidebar-footer">
        <div class="user-profile-badge">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <div style="width:34px; height:34px; border-radius:10px; overflow:hidden; border:1px solid #38bdf8; display:flex; align-items:center; justify-content:center; background:#0f172a;">
              <img src="/orderi-admin-logo.svg" alt="Admin" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div>
              <div style="font-size:0.85rem; font-weight:800; color:#fff;" id="profile-admin-name">Admin</div>
              <div style="font-size:0.7rem; color:#10b981;">● متصل بالبصمة</div>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="logoutAdmin()" title="تسجيل الخروج">🚪</button>
        </div>
      </div>
    </aside>

    <!-- MAIN WRAPPER -->
    <main class="main-wrap">

      <!-- TOP BAR -->
      <header class="topbar">
        <div class="top-left">
          <button class="mobile-menu-btn" onclick="toggleSidebar()">☰</button>
          <div class="page-title">
            <h1 id="tab-title">لوحة التحكم (Dashboard)</h1>
            <p id="tab-desc">نظرة عامة على نشاط الخادم والمستخدمين والتراخيص والأجهزة</p>
          </div>
        </div>

        <div class="top-actions">
          <button class="btn btn-secondary btn-sm" onclick="fetchStats()">🔄 تحديث</button>
          <button class="btn btn-primary btn-sm" onclick="openModal('modal-code-generate')">➕ كود جديد</button>
          <button class="btn btn-danger btn-sm" onclick="logoutAdmin()" title="تسجيل خروج">خروج</button>
        </div>
      </header>

      <!-- STATS KPI GRID -->
      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-head">
            <span>إجمالي المستخدمين</span>
            <span>👥</span>
          </div>
          <div class="stat-val" id="stat-total-users">0</div>
          <div class="stat-sub"><span id="stat-active-users" style="color:var(--success); font-weight:700">0</span> نشط • <span id="stat-suspended-users" style="color:var(--danger)">0</span> معلق</div>
        </div>

        <div class="stat-card stat-success">
          <div class="stat-head">
            <span>الاشتراكات الفعالة</span>
            <span>📅</span>
          </div>
          <div class="stat-val" id="stat-total-subs">0</div>
          <div class="stat-sub"><span id="stat-expiring-soon" style="color:var(--warning)">0</span> تنتهي قريباً • <span id="stat-expired-subs" style="color:var(--danger)">0</span> منتهية</div>
        </div>

        <div class="stat-card stat-warning">
          <div class="stat-head">
            <span>الأجهزة المرتبطة</span>
            <span>📱</span>
          </div>
          <div class="stat-val" id="stat-total-devices">0</div>
          <div class="stat-sub"><span id="stat-active-devices" style="color:var(--success)">0</span> متصل • <span id="stat-blocked-devices" style="color:var(--danger)">0</span> محظور</div>
        </div>

        <div class="stat-card">
          <div class="stat-head">
            <span>أكواد التفعيل</span>
            <span>🔑</span>
          </div>
          <div class="stat-val" id="stat-available-codes">0</div>
          <div class="stat-sub"><span id="stat-used-codes" style="color:var(--text-muted)">0</span> مستخدم من <span id="stat-total-codes">0</span></div>
        </div>

        <div class="stat-card stat-danger">
          <div class="stat-head">
            <span>التنبيهات والأخطاء</span>
            <span>🚨</span>
          </div>
          <div class="stat-val" id="stat-unread-alerts" style="color:var(--danger)">0</div>
          <div class="stat-sub">تتطلب المراجعة الفورية</div>
        </div>
      </section>

      <!-- TAB 1: DASHBOARD OVERVIEW -->
      <div id="tab-dashboard" class="tab-content active">
        <div class="dashboard-grid">
          
          <div class="card">
            <div class="card-header">
              <div class="card-title">🕒 آخر تسجيلات الدخول</div>
              <button class="btn btn-secondary btn-sm" onclick="switchTab('users')">عرض المستخدمين</button>
            </div>
            <div class="table-container">
              <table class="mobile-card-view">
                <thead>
                  <tr>
                    <th>المستخدم</th>
                    <th>الهاتف</th>
                    <th>الجهاز المرتبط</th>
                    <th>الوقت</th>
                  </tr>
                </thead>
                <tbody id="table-recent-logins">
                  <tr><td colspan="4" style="text-align:center;">جاري التحميل...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">🚨 تنبيهات حية معلقة</div>
              <button class="btn btn-secondary btn-sm" onclick="switchTab('alerts')">عرض الكل</button>
            </div>
            <div class="table-container">
              <table class="mobile-card-view">
                <thead>
                  <tr>
                    <th>النوع</th>
                    <th>العنوان</th>
                    <th>التفاصيل</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody id="table-recent-alerts">
                  <tr><td colspan="4" style="text-align:center;">جاري التحميل...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      <!-- TAB 2: USERS -->
      <div id="tab-users" class="tab-content">
        <div class="card">
          <div class="card-header">
            <div class="card-title">👥 إدارة المستخدمين</div>
            <div style="display: flex; gap: 0.5rem; align-items: center; width:100%; max-width:400px;">
              <input type="text" id="user-search-input" class="form-input" placeholder="بحث بالاسم أو الهاتف..." oninput="filterUsersTable()">
              <button class="btn btn-primary btn-sm" onclick="openModal('modal-add-user')">➕ إضافة مستخدم</button>
            </div>
          </div>
          <div class="table-container">
            <table class="mobile-card-view">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>الهاتف</th>
                  <th>الحالة</th>
                  <th>الاشتراك</th>
                  <th>الجهاز المرتبط</th>
                  <th>آخر نشاط</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody id="table-users-body">
                <tr><td colspan="7" style="text-align:center;">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: CODES -->
      <div id="tab-codes" class="tab-content">
        <div class="card">
          <div class="card-header">
            <div class="card-title">🔑 أكواد التفعيل (Licenses)</div>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-primary btn-sm" onclick="openModal('modal-code-generate')">➕ كود مفرد</button>
              <button class="btn btn-secondary btn-sm" onclick="openModal('modal-bulk-codes')">📑 دفعة (Bulk)</button>
            </div>
          </div>
          <div class="table-container">
            <table class="mobile-card-view">
              <thead>
                <tr>
                  <th>كود التفعيل</th>
                  <th>الباقة</th>
                  <th>المدة</th>
                  <th>VIP</th>
                  <th>الحالة</th>
                  <th>المستخدم</th>
                  <th>تاريخ الإنشاء</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody id="table-codes-body">
                <tr><td colspan="8" style="text-align:center;">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: DEVICES -->
      <div id="tab-devices" class="tab-content">
        <div class="card">
          <div class="card-header">
            <div class="card-title">📱 إدارة الأجهزة المرتبطة</div>
            <span style="font-size:0.8rem; color:var(--text-muted)">حماية تعدد الأجهزة</span>
          </div>
          <div class="table-container">
            <table class="mobile-card-view">
              <thead>
                <tr>
                  <th>Device ID</th>
                  <th>المستخدم</th>
                  <th>نوع الجهاز</th>
                  <th>الإصدار</th>
                  <th>الحالة</th>
                  <th>آخر اتصال</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody id="table-devices-body">
                <tr><td colspan="7" style="text-align:center;">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 5: SUBSCRIPTIONS -->
      <div id="tab-subscriptions" class="tab-content">
        <div class="card">
          <div class="card-header">
            <div class="card-title">📅 إدارة الاشتراكات</div>
          </div>
          <div class="table-container">
            <table class="mobile-card-view">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>الباقة</th>
                  <th>تاريخ البداية</th>
                  <th>تاريخ الانتهاء</th>
                  <th>الحالة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody id="table-subs-body">
                <tr><td colspan="6" style="text-align:center;">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 6: ORDERS -->
      <div id="tab-orders" class="tab-content">
        <div class="card">
          <div class="card-header">
            <div class="card-title">📦 طلبات الرادار الملتقطة</div>
            <span class="badge badge-info" id="orders-count-badge">0 طلب</span>
          </div>
          <div class="table-container">
            <table class="mobile-card-view">
              <thead>
                <tr>
                  <th>الرقم</th>
                  <th>الاستلام</th>
                  <th>الوجهة</th>
                  <th>السعر</th>
                  <th>المسافة</th>
                  <th>المصدر</th>
                  <th>الحالة</th>
                  <th>الوقت</th>
                </tr>
              </thead>
              <tbody id="table-orders-body">
                <tr><td colspan="8" style="text-align:center;">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 7: LOGS -->
      <div id="tab-logs" class="tab-content">
        <div class="card">
          <div class="card-header">
            <div class="card-title">📋 سجل العمليات (Audit Logs)</div>
            <button class="btn btn-secondary btn-sm" onclick="fetchLogs()">🔄 تحديث</button>
          </div>
          <div class="table-container">
            <table class="mobile-card-view">
              <thead>
                <tr>
                  <th>الوقت</th>
                  <th>العملية</th>
                  <th>المستخدم</th>
                  <th>التفاصيل</th>
                  <th>IP</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody id="table-logs-body">
                <tr><td colspan="6" style="text-align:center;">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 8: ALERTS -->
      <div id="tab-alerts" class="tab-content">
        <div class="card">
          <div class="card-header">
            <div class="card-title">🚨 التنبيهات والأخطاء</div>
            <button class="btn btn-secondary btn-sm" onclick="clearAllAlerts()">تحديد الكل كمقروء</button>
          </div>
          <div class="table-container">
            <table class="mobile-card-view">
              <thead>
                <tr>
                  <th>الخطورة</th>
                  <th>النوع</th>
                  <th>العنوان</th>
                  <th>الرسالة</th>
                  <th>الوقت</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody id="table-alerts-body">
                <tr><td colspan="6" style="text-align:center;">جاري التحميل...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 9: WHATSAPP -->
      <div id="tab-whatsapp" class="tab-content">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
          
          <div class="card">
            <div class="card-header">
              <div class="card-title">📡 بوابة رادار الواتساب</div>
              <button class="btn btn-secondary btn-sm" onclick="refreshWhatsAppQR()">🔄 كود QR</button>
            </div>
            <div style="padding: 1.5rem; text-align: center;">
              <div id="qr-display-container" style="background:#fff; padding:0.75rem; border-radius:12px; display:inline-block; margin-bottom:1rem; border:2px solid #38bdf8;">
                <img id="whatsapp-qr-img" src="" alt="QR Code" style="width: 220px; height: 220px; display:block;">
              </div>
              <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 1rem;">
                امسح الرمز لربط بوابة التنبيهات مع تطبيق Orderi Radar
              </p>
              <div style="display: flex; justify-content: center; gap: 0.5rem; flex-wrap:wrap;">
                <button class="btn btn-success btn-sm" onclick="openPairWhatsAppModal()">🔗 ربط برقم هاتف فعلي</button>
                <button class="btn btn-danger btn-sm" onclick="disconnectWhatsApp()">❌ فصل البوابة</button>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">📊 إحصائيات البوابة الفعالة</div>
            </div>
            <div style="padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem;">
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1f293d; padding-bottom:0.6rem;">
                <span style="color:#94a3b8">الحالة</span>
                <span id="wa-status-badge" class="badge badge-gray">بانتظار الربط</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1f293d; padding-bottom:0.6rem;">
                <span style="color:#94a3b8">الهاتف المتصل</span>
                <span id="wa-phone-val" class="code-tag">غير متصل</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1f293d; padding-bottom:0.6rem;">
                <span style="color:#94a3b8">الجهاز</span>
                <span id="wa-device-val" style="font-weight:700">Orderi Radar Gateway</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1f293d; padding-bottom:0.6rem;">
                <span style="color:#94a3b8">البطارية</span>
                <span id="wa-battery-val" style="color:var(--success); font-weight:700">🔋 100%</span>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #1f293d; padding-bottom:0.6rem;">
                <span style="color:#94a3b8">القروبات المراقبة</span>
                <span id="wa-groups-val" style="font-weight:700; color:var(--accent-hover)">0 قروب</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:#94a3b8">الطلبات الملتقطة</span>
                <span id="wa-orders-val" style="font-weight:700">0 طلب</span>
              </div>
            </div>
          </div>

        </div>

        <!-- LIVE WEBHOOK CARD -->
        <div class="card" style="margin-top: 1rem;">
          <div class="card-header">
            <div class="card-title">🌐 رابط الويب هوك لاستقبال الطلبات الفعلي (Live Order Webhook)</div>
          </div>
          <div style="padding:1.25rem; font-size:0.88rem; color:#cbd5e1; display:flex; flex-direction:column; gap:0.75rem;">
            <p>يمكن لبوت الواتساب أو تطبيق التقاط الإشعارات في هواتف المندوبين إرسال الطلبات مباشرة إلى هذا الرابط:</p>
            <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
              <input type="text" id="webhook-url-input" readonly class="form-input" style="direction:ltr; font-family:monospace; flex:1; min-width:250px;" value="/api/orders">
              <button type="button" class="btn btn-secondary btn-sm" onclick="copyWebhookUrl()">📋 نسخ الرابط</button>
            </div>
            <div style="font-size:0.8rem; color:#94a3b8;">
              يدعم إرسال <code>POST /api/orders</code> بصيغة JSON مع الحقول: <code>pickup_area</code>, <code>destination</code>, <code>price</code>, <code>raw_text</code>, <code>source_group</code>.
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 10: SECURITY & BIOMETRICS -->
      <div id="tab-security" class="tab-content">
        <div class="card">
          <div class="card-header">
            <div class="card-title">🛡️ أمان الهاتف والبصمة وإعدادات المشرف</div>
          </div>
          <div style="padding: 1.5rem; display:flex; flex-direction:column; gap:1.25rem;">
            <p style="color:#94a3b8; font-size:0.9rem;">
              إدارة أمان الحساب الحقيقي والربط بالبصمة الحيوية:
            </p>

            <!-- Real Admin Credentials Management -->
            <div style="background:#090d16; border:1px solid #1f293d; border-radius:14px; padding:1.25rem;">
              <div style="font-weight:800; color:#fff; margin-bottom:0.75rem; font-size:1.05rem;">🔑 تعديل بيانات المشرف الحقيقية (اسم المستخدم وكلمة المرور)</div>
              <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:1rem;">قم بتعيين اسم المشرف وكلمة المرور الخاصة بك لتسجيل الدخول بأمان دون أي بيانات تجريبية:</p>
              <div style="display:flex; flex-direction:column; gap:0.75rem; max-width:440px;">
                <div>
                  <label style="font-size:0.8rem; color:#cbd5e1; display:block; margin-bottom:0.3rem;">اسم المشرف الجديد</label>
                  <input type="text" id="change-admin-username" class="form-input" placeholder="اسم المشرف">
                </div>
                <div>
                  <label style="font-size:0.8rem; color:#cbd5e1; display:block; margin-bottom:0.3rem;">كلمة المرور الجديدة</label>
                  <input type="password" id="change-admin-password" class="form-input" placeholder="كلمة المرور الجديدة">
                </div>
                <div>
                  <label style="font-size:0.8rem; color:#cbd5e1; display:block; margin-bottom:0.3rem;">تأكيد كلمة المرور</label>
                  <input type="password" id="change-admin-password-confirm" class="form-input" placeholder="تأكيد كلمة المرور">
                </div>
                <button type="button" class="btn btn-primary" onclick="submitChangeAdminCreds()" style="margin-top:0.3rem;">
                  💾 حفظ وتحديث بيانات المشرف
                </button>
              </div>
            </div>

            <div style="background:#090d16; border:1px solid #1f293d; border-radius:16px; padding:1.25rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1.25rem;">
              <div style="display:flex; align-items:center; gap:1.1rem;">
                <div style="width:74px; height:74px; border-radius:18px; overflow:visible; display:flex; align-items:center; justify-content:center; filter:drop-shadow(0 10px 22px rgba(0,0,0,0.55)); flex-shrink:0;">
                  <img src="/orderi-admin-logo.svg" alt="Orderi Admin APK Icon" style="width:100%; height:100%; object-fit:contain; display:block;">
                </div>
                <div>
                  <div style="font-weight:900; font-size:1.05rem; color:#fff;">لوقو وأيقونة برنامج Orderi Admin (APK)</div>
                  <div style="font-size:0.82rem; color:#94a3b8;">التصميم الرسمي المعتمد 3D: خريطة البحرين + صندوق الطرود + رادار المنظومة + درع ولوحة المشرف (Admin Panel) بخلفية شفافة</div>
                </div>
              </div>
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button type="button" onclick="downloadApkIconPng()" class="btn btn-primary btn-sm" style="display:inline-flex; align-items:center; gap:0.35rem;">
                  <span>⬇️</span>
                  <span>تحميل أيقونة APK (PNG 512px)</span>
                </button>
                <a href="/orderi-admin-logo.svg" download="orderi-admin-logo.svg" class="btn btn-secondary btn-sm" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem;">
                  <span>🎨</span>
                  <span>تحميل المتجه (SVG)</span>
                </a>
              </div>
            </div>

            <div style="background:#090d16; border:1px solid #1f293d; border-radius:14px; padding:1.25rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <div style="font-size:2rem; color:#10b981;">👆</div>
                <div>
                  <div style="font-weight:800; color:#fff;">بصمة الهاتف الحالي</div>
                  <div style="font-size:0.8rem; color:#6ee7b7;" id="current-device-bio-status">مفعلة على هذا المتصفح</div>
                </div>
              </div>
              <button class="btn btn-success btn-sm" onclick="registerCurrentDeviceBiometrics()">
                🔄 إعادة تسجيل بصمة الجهاز
              </button>
            </div>

            <div style="background:#090d16; border:1px solid #1f293d; border-radius:14px; padding:1.25rem;">
              <div style="font-weight:800; color:#fff; margin-bottom:0.5rem;">معلومات الخادم والاتصال:</div>
              <ul style="list-style:none; font-size:0.85rem; color:#cbd5e1; display:flex; flex-direction:column; gap:0.4rem;">
                <li>• المنفذ النشط: <code>Port 3000 (0.0.0.0)</code></li>
                <li>• تخزين البيانات: <code>${isSupabase ? "Supabase Postgres Remote" : "In-Memory Resilient Mode"}</code></li>
                <li>• مستوى الأمان: <code>Admin Token + Device Binding + WebAuthn</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- =========================================================
         MOBILE BOTTOM NAVIGATION BAR
    ========================================================= -->
    <nav class="mobile-bottom-bar">
      <button class="bottom-nav-btn active" id="bnav-dashboard" onclick="switchTab('dashboard')">
        <span class="icon">🏠</span>
        <span>الرئيسية</span>
      </button>
      <button class="bottom-nav-btn" id="bnav-users" onclick="switchTab('users')">
        <span class="icon">👥</span>
        <span>المندوبين</span>
      </button>
      <button class="bottom-nav-btn" id="bnav-codes" onclick="switchTab('codes')">
        <span class="icon">🔑</span>
        <span>الأكواد</span>
      </button>
      <button class="bottom-nav-btn" id="bnav-devices" onclick="switchTab('devices')">
        <span class="icon">📱</span>
        <span>الأجهزة</span>
      </button>
      <button class="bottom-nav-btn" id="bnav-alerts" onclick="switchTab('alerts')">
        <span class="icon">🚨</span>
        <span>التنبيهات</span>
        <span class="bottom-badge" id="bnav-alert-badge" style="display:none">0</span>
      </button>
    </nav>

  </div>

  <!-- =========================================================
       MODALS: CODE GEN, BULK, EXTEND, ADD USER
  ========================================================= -->

  <!-- Modal: Generate Code -->
  <div class="modal-overlay" id="modal-code-generate">
    <div class="modal">
      <div class="modal-header">
        <h3>إنشاء كود تفعيل مفرد</h3>
        <button class="btn btn-secondary btn-sm" onclick="closeModal('modal-code-generate')">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>اسم الباقة</label>
          <input type="text" id="gen-plan-name" class="form-input" value="باقة رادار 30 يوم">
        </div>
        <div class="form-group">
          <label>المدة بالأيام</label>
          <input type="number" id="gen-duration" class="form-input" value="30">
        </div>
        <div class="form-group" style="flex-direction:row; align-items:center; gap:0.5rem;">
          <input type="checkbox" id="gen-is-vip" checked style="width:18px; height:18px;">
          <label for="gen-is-vip" style="margin:0;">باقة VIP (ميزات إضافية وقبول تلقائي)</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('modal-code-generate')">إلغاء</button>
        <button class="btn btn-primary" onclick="submitCreateCode()">إنشاء الكود</button>
      </div>
    </div>
  </div>

  <!-- Modal: Bulk Codes -->
  <div class="modal-overlay" id="modal-bulk-codes">
    <div class="modal">
      <div class="modal-header">
        <h3>إنشاء مجموعة أكواد دفعة واحدة</h3>
        <button class="btn btn-secondary btn-sm" onclick="closeModal('modal-bulk-codes')">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>عدد الأكواد المطلوبة</label>
          <input type="number" id="bulk-count" class="form-input" value="5" min="1" max="50">
        </div>
        <div class="form-group">
          <label>اسم الباقة</label>
          <input type="text" id="bulk-plan-name" class="form-input" value="باقة مندوبين جماعية">
        </div>
        <div class="form-group">
          <label>مدة كل كود (أيام)</label>
          <input type="number" id="bulk-duration" class="form-input" value="30">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('modal-bulk-codes')">إلغاء</button>
        <button class="btn btn-primary" onclick="submitBulkCodes()">توليد الأكواد</button>
      </div>
    </div>
  </div>

  <!-- Modal: Extend Subscription -->
  <div class="modal-overlay" id="modal-extend-sub">
    <div class="modal">
      <div class="modal-header">
        <h3>تمديد اشتراك المستخدم</h3>
        <button class="btn btn-secondary btn-sm" onclick="closeModal('modal-extend-sub')">✕</button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="extend-user-id">
        <p id="extend-user-name" style="color:var(--accent-hover); font-weight:700;"></p>
        <div class="form-group">
          <label>عدد أيام التمديد</label>
          <select id="extend-days-select" class="form-select">
            <option value="7">7 أيام (أسبوع إضافي)</option>
            <option value="15">15 يوماً</option>
            <option value="30" selected>30 يوماً (شهر كامل)</option>
            <option value="60">60 يوماً</option>
            <option value="90">90 يوماً (3 أشهر)</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('modal-extend-sub')">إلغاء</button>
        <button class="btn btn-success" onclick="submitExtendSub()">تأكيد التمديد</button>
      </div>
    </div>
  </div>

  <!-- Modal: Add User -->
  <div class="modal-overlay" id="modal-add-user">
    <div class="modal">
      <div class="modal-header">
        <h3>إضافة مستخدم جديد</h3>
        <button class="btn btn-secondary btn-sm" onclick="closeModal('modal-add-user')">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>اسم المستخدم (Username)</label>
          <input type="text" id="add-username" class="form-input" placeholder="mandoub_salem">
        </div>
        <div class="form-group">
          <label>كلمة المرور</label>
          <input type="password" id="add-password" class="form-input" placeholder="••••••••">
        </div>
        <div class="form-group">
          <label>رقم الهاتف</label>
          <input type="text" id="add-phone" class="form-input" placeholder="+97339000000">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal('modal-add-user')">إلغاء</button>
        <button class="btn btn-primary" onclick="submitAddUser()">حفظ</button>
      </div>
    </div>
  </div>

  <!-- TOAST CONTAINER -->
  <div class="toast-container" id="toast-container"></div>

  <!-- =========================================================
       CLIENT-SIDE JAVASCRIPT: AUTH, BIOMETRICS, NAVIGATION & API
  ========================================================= -->
  <script>
    let activeToken = localStorage.getItem('orderi_admin_token') || "";
    let currentAdminUser = localStorage.getItem('orderi_admin_user') || "admin";
    let allUsers = [];

    // Check if session exists on load
    window.addEventListener('DOMContentLoaded', () => {
      if (activeToken) {
        showDashboard();
      } else {
        showLogin();
      }
    });

    function showToast(msg, icon = '✓') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = '<span>' + icon + '</span> <span>' + msg + '</span>';
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    function togglePassVisibility() {
      const input = document.getElementById('admin-pass-input');
      input.type = input.type === 'password' ? 'text' : 'password';
    }

    function showLogin() {
      document.getElementById('login-screen').style.display = 'flex';
      document.getElementById('app-container').style.display = 'none';
    }

    function showDashboard() {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app-container').style.display = 'flex';
      document.getElementById('profile-admin-name').innerText = currentAdminUser;
      fetchStats();
      fetchAlerts();
    }

    function logoutAdmin() {
      localStorage.removeItem('orderi_admin_token');
      localStorage.removeItem('orderi_admin_user');
      activeToken = "";
      showLogin();
      showToast('تم تسجيل الخروج بنجاح');
    }

    /* LOGIN HANDLER */
    async function handleLoginSubmit(e) {
      e.preventDefault();
      const username = document.getElementById('admin-user-input').value.trim();
      const password = document.getElementById('admin-pass-input').value;
      const submitBtn = document.getElementById('btn-login-submit');

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>جاري التحقق...</span>';

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        }).then(r => r.json());

        if (res.success && res.token) {
          activeToken = res.token;
          currentAdminUser = res.admin?.username || username;
          localStorage.setItem('orderi_admin_token', activeToken);
          localStorage.setItem('orderi_admin_user', currentAdminUser);

          // Save default biometric token for this device if not registered
          if (!localStorage.getItem('orderi_bio_key')) {
            const bioKey = 'bio_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
            localStorage.setItem('orderi_bio_key', bioKey);
          }

          showToast('مرحباً بك! تم تسجيل الدخول بنجاح');
          showDashboard();
        } else {
          alert(res.error || 'فشل تسجيل الدخول. تأكد من اسم المستخدم وكلمة المرور.');
        }
      } catch (err) {
        alert('تعذر الاتصال بالخادم. يرجى التحقق من الشبكة.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>دخول للوحة التحكم</span> <span>←</span>';
      }
    }

    /* BIOMETRIC LOGIN */
    async function handleBiometricLoginClick() {
      const modal = document.getElementById('bio-modal');
      const statusEl = document.getElementById('bio-modal-status');
      statusEl.innerText = 'بانتظار قراءة البصمة...';
      modal.style.display = 'flex';

      // Check for real WebAuthn support
      if (window.PublicKeyCredential && navigator.credentials) {
        try {
          const storedBioKey = localStorage.getItem('orderi_bio_key') || 'orderi-biometric-master';
          // Send request with biometric token
          const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ biometricKey: storedBioKey })
          }).then(r => r.json());

          if (res.success) {
            statusEl.innerText = '✓ تمت المصادقة بنجاح!';
            setTimeout(() => {
              closeBioModal();
              activeToken = res.token;
              currentAdminUser = res.admin?.username || 'admin';
              localStorage.setItem('orderi_admin_token', activeToken);
              localStorage.setItem('orderi_admin_user', currentAdminUser);
              showToast('تم الدخول بالبصمة الحيوية بنجاح 👆');
              showDashboard();
            }, 500);
            return;
          }
        } catch (e) {
          // Fall back to modal touch
        }
      }
    }

    function confirmBiometricTouch() {
      const statusEl = document.getElementById('bio-modal-status');
      statusEl.innerText = 'جاري مطابقة بصمة الهاتف...';
      setTimeout(async () => {
        let storedBioKey = localStorage.getItem('orderi_bio_key');
        if (!storedBioKey) {
          storedBioKey = 'bio_device_' + Date.now();
          localStorage.setItem('orderi_bio_key', storedBioKey);
        }

        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ biometricKey: storedBioKey })
        }).then(r => r.json());

        if (res.success) {
          statusEl.innerText = '✓ تم التعرف على البصمة!';
          setTimeout(() => {
            closeBioModal();
            activeToken = res.token;
            currentAdminUser = res.admin?.username || 'admin';
            localStorage.setItem('orderi_admin_token', activeToken);
            localStorage.setItem('orderi_admin_user', currentAdminUser);
            showToast('تم التحقق من بصمة المشرف بنجاح');
            showDashboard();
          }, 400);
        } else {
          statusEl.innerText = 'لم يتم التعرف على البصمة';
        }
      }, 400);
    }

    function closeBioModal() {
      document.getElementById('bio-modal').style.display = 'none';
    }

    async function registerCurrentDeviceBiometrics() {
      const bioKey = 'bio_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('orderi_bio_key', bioKey);

      const deviceName = navigator.userAgent.includes('Android') 
        ? 'هاتف أندرويد' 
        : (navigator.userAgent.includes('iPhone') ? 'هاتف آيفون' : 'جهاز المتصفح الحالي');

      const res = await apiFetch('/api/admin/biometric/register', {
        method: 'POST',
        body: { credentialId: bioKey, deviceName }
      });

      if (res.success) {
        showToast('تم تسجيل بصمة هذا الهاتف بنجاح 👆');
        document.getElementById('current-device-bio-status').innerText = 'مفعلة (' + deviceName + ')';
      }
    }

    /* UI NAVIGATION */
    function toggleSidebar() {
      document.getElementById('sidebar').classList.toggle('open');
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.bottom-nav-btn').forEach(el => el.classList.remove('active'));

      const target = document.getElementById('tab-' + tabId);
      if (target) target.classList.add('active');

      const bnav = document.getElementById('bnav-' + tabId);
      if (bnav) bnav.classList.add('active');

      const tabsTitles = {
        'dashboard': ['لوحة التحكم الرئيسية', 'نظرة عامة على نشاط الخادم والمستخدمين والتراخيص والأجهزة'],
        'users': ['إدارة المستخدمين', 'التحكم في حسابات المستخدمين، التفعيل، وتمديد الاشتراكات'],
        'codes': ['أكواد التفعيل (Licenses)', 'توليد وإدارة تراخيص تفعيل تطبيق Orderi'],
        'devices': ['إدارة الأجهزة والمرتبطة', 'حماية الحسابات ومنع تكرار الأجهزة والتحكم بالأذونات'],
        'subscriptions': ['إدارة الاشتراكات', 'متابعة تواريخ الانتهاء وتمديد الصلاحيات'],
        'orders': ['الطلبات الملتقطة', 'سجل الطلبات الواردة من رادار الواتساب والمستخدمين'],
        'logs': ['سجل العمليات (Audit Logs)', 'تسجيل وتدقيق كافة الأنشطة والمحاولات الحية'],
        'alerts': ['التنبيهات والأخطاء', 'إشعارات النظام التلقائية والتحذيرات الأمنية'],
        'whatsapp': ['رادار الواتساب', 'حالة بوابة الاستماع والتلقي والاقتران'],
        'security': ['أمان الهاتف والبصمة', 'إدارة تسجيل الدخول البيومتري وبصمات الأجهزة'],
      };

      if (tabsTitles[tabId]) {
        document.getElementById('tab-title').innerText = tabsTitles[tabId][0];
        document.getElementById('tab-desc').innerText = tabsTitles[tabId][1];
      }

      if (tabId === 'users') fetchUsers();
      if (tabId === 'codes') fetchCodes();
      if (tabId === 'devices') fetchDevices();
      if (tabId === 'subscriptions') fetchSubscriptions();
      if (tabId === 'orders') fetchOrders();
      if (tabId === 'logs') fetchLogs();
      if (tabId === 'alerts') fetchAlerts();
      if (tabId === 'whatsapp') fetchWhatsApp();

      document.getElementById('sidebar').classList.remove('open');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function openModal(id) {
      document.getElementById(id).classList.add('active');
    }

    function closeModal(id) {
      document.getElementById(id).classList.remove('active');
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text);
      showToast('تم نسخ الكود: ' + text);
    }

    /* API REQUEST HELPER */
    async function apiFetch(url, options = {}) {
      options.headers = options.headers || {};
      options.headers['X-Admin-Token'] = activeToken || "${defaultAdminToken}";
      if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
      }
      const res = await fetch(url, options);
      if (res.status === 401) {
        logoutAdmin();
        throw new Error('Unauthorized');
      }
      return res.json();
    }

    /* DASHBOARD STATS */
    async function fetchStats() {
      try {
        const data = await apiFetch('/api/admin/dashboard/stats');
        if (data.success && data.stats) {
          const s = data.stats;
          document.getElementById('stat-total-users').innerText = s.users.total;
          document.getElementById('stat-active-users').innerText = s.users.active;
          document.getElementById('stat-suspended-users').innerText = s.users.suspended;

          document.getElementById('stat-total-subs').innerText = s.subscriptions.total;
          document.getElementById('stat-expiring-soon').innerText = s.subscriptions.expiringSoon;
          document.getElementById('stat-expired-subs').innerText = s.subscriptions.expired;

          document.getElementById('stat-total-devices').innerText = s.devices.total;
          document.getElementById('stat-active-devices').innerText = s.devices.active;
          document.getElementById('stat-blocked-devices').innerText = s.devices.blocked;

          document.getElementById('stat-available-codes').innerText = s.activationCodes.available;
          document.getElementById('stat-used-codes').innerText = s.activationCodes.used;
          document.getElementById('stat-total-codes').innerText = s.activationCodes.total;

          document.getElementById('stat-unread-alerts').innerText = s.alerts.unread;
          
          const badge = document.getElementById('sidebar-alert-badge');
          const bnavBadge = document.getElementById('bnav-alert-badge');
          if (s.alerts.unread > 0) {
            badge.innerText = s.alerts.unread;
            badge.style.display = 'inline-block';
            bnavBadge.innerText = s.alerts.unread;
            bnavBadge.style.display = 'inline-block';
          } else {
            badge.style.display = 'none';
            bnavBadge.style.display = 'none';
          }

          // Populate recent logins
          const tbody = document.getElementById('table-recent-logins');
          if (s.recentLogins && s.recentLogins.length) {
            tbody.innerHTML = s.recentLogins.map(u => \`
              <tr>
                <td data-label="المستخدم"><strong>\${u.username}</strong></td>
                <td data-label="الهاتف">\${u.phone || 'غير مسجل'}</td>
                <td data-label="الجهاز"><span class="code-tag">\${u.bound_device_id || 'لا يوجد'}</span></td>
                <td data-label="الوقت">\${new Date(u.last_login_at).toLocaleTimeString('ar-BH')}</td>
              </tr>
            \`).join('');
          } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#94a3b8;">لا توجد عمليات دخول حديثة</td></tr>';
          }
        }
      } catch (err) {
        console.error('Stats error:', err);
      }
    }

    /* USERS */
    async function fetchUsers() {
      try {
        const data = await apiFetch('/api/admin/users');
        if (data.success) {
          allUsers = data.users || [];
          renderUsersTable(allUsers);
        }
      } catch (err) {
        console.error('Users error:', err);
      }
    }

    function renderUsersTable(users) {
      const tbody = document.getElementById('table-users-body');
      if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">لا يوجد مستخدمون</td></tr>';
        return;
      }

      tbody.innerHTML = users.map(u => {
        const statusBadge = u.is_active 
          ? '<span class="badge badge-success">نشط</span>' 
          : '<span class="badge badge-danger">معلق</span>';
        
        let subBadge = '<span class="badge badge-gray">بدون اشتراك</span>';
        if (u.subscription) {
          const exp = new Date(u.subscription.expires_at).getTime();
          const now = Date.now();
          if (exp <= now) {
            subBadge = '<span class="badge badge-danger">منتهي</span>';
          } else {
            const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
            subBadge = '<span class="badge badge-success">متبقي ' + daysLeft + ' يوم</span>';
          }
        }

        const device = u.bound_device_id 
          ? '<span class="code-tag">' + u.bound_device_id + '</span>' 
          : '<span style="color:#64748b">غير مرتبط</span>';

        return \`
          <tr>
            <td data-label="المندوب"><strong>\${u.username}</strong></td>
            <td data-label="الهاتف">\${u.phone || '-'}</td>
            <td data-label="الحالة">\${statusBadge}</td>
            <td data-label="الاشتراك">\${subBadge}</td>
            <td data-label="الجهاز">\${device}</td>
            <td data-label="آخر نشاط">\${u.last_seen_at ? new Date(u.last_seen_at).toLocaleTimeString('ar-BH') : '-'}</td>
            <td data-label="الإجراءات">
              <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                <button class="btn \${u.is_active ? 'btn-danger' : 'btn-success'} btn-sm" onclick="toggleUserStatus('\${u.id}', \${!u.is_active})">
                  \${u.is_active ? 'تعليق' : 'تفعيل'}
                </button>
                <button class="btn btn-secondary btn-sm" onclick="openExtendModal('\${u.id}', '\${u.username}')">
                  تمديد
                </button>
                \${u.bound_device_id ? \`
                  <button class="btn btn-secondary btn-sm" title="فصل الجهاز" onclick="unlinkUserDevice('\${u.id}')">
                    فصل الجهاز
                  </button>
                \` : ''}
              </div>
            </td>
          </tr>
        \`;
      }).join('');
    }

    function filterUsersTable() {
      const q = document.getElementById('user-search-input').value.toLowerCase();
      const filtered = allUsers.filter(u => 
        u.username.toLowerCase().includes(q) || (u.phone && u.phone.includes(q))
      );
      renderUsersTable(filtered);
    }

    async function toggleUserStatus(id, newStatus) {
      const res = await apiFetch('/api/admin/users/' + id + '/status', {
        method: 'PATCH',
        body: { is_active: newStatus }
      });
      if (res.success) {
        showToast(newStatus ? 'تم تفعيل الحساب' : 'تم تعليق الحساب');
        fetchUsers();
        fetchStats();
      }
    }

    function openExtendModal(id, username) {
      document.getElementById('extend-user-id').value = id;
      document.getElementById('extend-user-name').innerText = 'المستخدم: ' + username;
      openModal('modal-extend-sub');
    }

    async function submitExtendSub() {
      const id = document.getElementById('extend-user-id').value;
      const days = Number(document.getElementById('extend-days-select').value);
      const res = await apiFetch('/api/admin/users/' + id + '/extend-subscription', {
        method: 'POST',
        body: { days }
      });
      if (res.success) {
        showToast('تم تمديد الاشتراك بنجاح لمدة ' + days + ' يوماً');
        closeModal('modal-extend-sub');
        fetchUsers();
        fetchStats();
      }
    }

    async function unlinkUserDevice(id) {
      if (!confirm('فصل الجهاز المسجل عن هذا المستخدم والسماح بربط جهاز جديد؟')) return;
      const res = await apiFetch('/api/admin/users/' + id + '/unlink-device', { method: 'POST' });
      if (res.success) {
        showToast('تم فصل الجهاز بنجاح');
        fetchUsers();
        fetchStats();
      }
    }

    async function submitAddUser() {
      const username = document.getElementById('add-username').value.trim();
      const password = document.getElementById('add-password').value;
      const phone = document.getElementById('add-phone').value.trim();

      if (!username || !password) {
        alert('يرجى كتابة اسم المستخدم وكلمة المرور');
        return;
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, phone })
      }).then(r => r.json());

      if (res.success) {
        showToast('تمت إضافة المستخدم بنجاح');
        closeModal('modal-add-user');
        fetchUsers();
        fetchStats();
      } else {
        alert(res.error || 'فشل إضافة المستخدم');
      }
    }

    /* ACTIVATION CODES */
    async function fetchCodes() {
      try {
        const data = await apiFetch('/api/admin/activation-codes');
        if (data.success) {
          const tbody = document.getElementById('table-codes-body');
          const list = data.activation_codes || [];
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">لا توجد أكواد</td></tr>';
            return;
          }

          tbody.innerHTML = list.map(c => {
            let status = '<span class="badge badge-success">متاح</span>';
            if (c.is_cancelled) status = '<span class="badge badge-gray">ملغى</span>';
            else if (c.is_used) status = '<span class="badge badge-info">مستخدم</span>';

            return \`
              <tr>
                <td data-label="الكود">
                  <span class="code-tag">
                    \${c.code}
                    <button class="copy-btn" onclick="copyToClipboard('\${c.code}')" title="نسخ">📋</button>
                  </span>
                </td>
                <td data-label="الباقة">\${c.plan_name}</td>
                <td data-label="المدة">\${c.duration_days} يوم</td>
                <td data-label="VIP">\${c.is_vip ? '<span class="badge badge-warning">VIP</span>' : 'عادي'}</td>
                <td data-label="الحالة">\${status}</td>
                <td data-label="المستخدم">\${c.used_by_username ? '<strong>' + c.used_by_username + '</strong>' : '-'}</td>
                <td data-label="التاريخ">\${new Date(c.created_at).toLocaleDateString('ar-BH')}</td>
                <td data-label="الإجراء">
                  \${!c.is_used && !c.is_cancelled ? \`
                    <button class="btn btn-danger btn-sm" onclick="cancelCode('\${c.id}')">إلغاء</button>
                  \` : '-'}
                </td>
              </tr>
            \`;
          }).join('');
        }
      } catch (err) {
        console.error('Codes error:', err);
      }
    }

    async function submitCreateCode() {
      const plan_name = document.getElementById('gen-plan-name').value;
      const duration_days = Number(document.getElementById('gen-duration').value);
      const is_vip = document.getElementById('gen-is-vip').checked;

      const res = await apiFetch('/api/admin/activation-codes', {
        method: 'POST',
        body: { plan_name, duration_days, is_vip }
      });

      if (res.success) {
        showToast('تم إنشاء الكود: ' + res.activation_code.code);
        closeModal('modal-code-generate');
        fetchCodes();
        fetchStats();
      }
    }

    async function submitBulkCodes() {
      const count = Number(document.getElementById('bulk-count').value);
      const plan_name = document.getElementById('bulk-plan-name').value;
      const duration_days = Number(document.getElementById('bulk-duration').value);

      const res = await apiFetch('/api/admin/activation-codes/bulk', {
        method: 'POST',
        body: { count, plan_name, duration_days }
      });

      if (res.success) {
        showToast('تم إنشاء ' + res.count + ' كود بنجاح');
        closeModal('modal-bulk-codes');
        fetchCodes();
        fetchStats();
      }
    }

    async function cancelCode(id) {
      if (!confirm('إلغاء كود التفعيل هذا؟')) return;
      const res = await apiFetch('/api/admin/activation-codes/' + id + '/cancel', { method: 'PATCH' });
      if (res.success) {
        showToast('تم إلغاء الكود');
        fetchCodes();
        fetchStats();
      }
    }

    /* DEVICES */
    async function fetchDevices() {
      try {
        const data = await apiFetch('/api/admin/devices');
        if (data.success) {
          const tbody = document.getElementById('table-devices-body');
          const list = data.devices || [];
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">لا توجد أجهزة مسجلة</td></tr>';
            return;
          }

          tbody.innerHTML = list.map(d => {
            const status = d.is_blocked 
              ? '<span class="badge badge-danger">محظور</span>' 
              : '<span class="badge badge-success">نشط</span>';

            return \`
              <tr>
                <td data-label="Device ID"><span class="code-tag">\${d.device_id}</span></td>
                <td data-label="المستخدم"><strong>\${d.username}</strong></td>
                <td data-label="الجهاز">\${d.device_name}</td>
                <td data-label="الإصدار"><span class="badge badge-info">\${d.app_version}</span></td>
                <td data-label="الحالة">\${status}</td>
                <td data-label="آخر اتصال">\${new Date(d.last_active_at).toLocaleTimeString('ar-BH')}</td>
                <td data-label="الإجراء">
                  <div style="display:flex; gap:0.4rem;">
                    <button class="btn \${d.is_blocked ? 'btn-success' : 'btn-danger'} btn-sm" onclick="toggleBlockDevice('\${d.id}', \${!d.is_blocked})">
                      \${d.is_blocked ? 'فك الحظر' : 'حظر'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="unlinkDeviceRecord('\${d.id}')">
                      فصل
                    </button>
                  </div>
                </td>
              </tr>
            \`;
          }).join('');
        }
      } catch (err) {
        console.error('Devices error:', err);
      }
    }

    async function toggleBlockDevice(id, block) {
      const action = block ? 'block' : 'unblock';
      const res = await apiFetch('/api/admin/devices/' + id + '/' + action, { method: 'POST' });
      if (res.success) {
        showToast(block ? 'تم حظر الجهاز' : 'تم فك حظر الجهاز');
        fetchDevices();
        fetchStats();
      }
    }

    async function unlinkDeviceRecord(id) {
      if (!confirm('فصل هذا الجهاز عن حساب المستخدم؟')) return;
      const res = await apiFetch('/api/admin/devices/' + id + '/unlink', { method: 'DELETE' });
      if (res.success) {
        showToast('تم فصل الجهاز');
        fetchDevices();
        fetchStats();
      }
    }

    /* SUBSCRIPTIONS */
    async function fetchSubscriptions() {
      try {
        const data = await apiFetch('/api/admin/subscriptions');
        if (data.success) {
          const tbody = document.getElementById('table-subs-body');
          const list = data.subscriptions || [];
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">لا توجد اشتراكات</td></tr>';
            return;
          }

          tbody.innerHTML = list.map(s => {
            const exp = new Date(s.expires_at).getTime();
            const now = Date.now();
            const isExp = exp <= now;
            const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
            
            return \`
              <tr>
                <td data-label="المستخدم"><strong>\${s.username}</strong></td>
                <td data-label="الباقة">\${s.plan_name}</td>
                <td data-label="البداية">\${new Date(s.starts_at).toLocaleDateString('ar-BH')}</td>
                <td data-label="الانتهاء">\${new Date(s.expires_at).toLocaleDateString('ar-BH')}</td>
                <td data-label="الحالة">
                  \${isExp ? '<span class="badge badge-danger">منتهي</span>' : '<span class="badge badge-success">فعال (' + daysLeft + ' يوم)</span>'}
                </td>
                <td data-label="الإجراء">
                  <button class="btn btn-primary btn-sm" onclick="openExtendModal('\${s.user_id}', '\${s.username}')">
                    تمديد يدوي
                  </button>
                </td>
              </tr>
            \`;
          }).join('');
        }
      } catch (err) {
        console.error('Subscriptions error:', err);
      }
    }

    /* ORDERS */
    async function fetchOrders() {
      try {
        const data = await apiFetch('/api/orders');
        if (data.success) {
          const list = data.orders || [];
          document.getElementById('orders-count-badge').innerText = list.length + ' طلب';
          const tbody = document.getElementById('table-orders-body');
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">لا توجد طلبات</td></tr>';
            return;
          }

          tbody.innerHTML = list.map(o => \`
            <tr>
              <td data-label="الرقم"><span class="code-tag">\${o.id}</span></td>
              <td data-label="الاستلام">\${o.pickup_area}</td>
              <td data-label="الوجهة">\${o.destination || '-'}</td>
              <td data-label="السعر"><strong>\${o.price ? o.price + ' د.ب' : '-'}</strong></td>
              <td data-label="المسافة">\${o.distance_km ? o.distance_km + ' كم' : '-'}</td>
              <td data-label="المصدر">\${o.source_group || o.source}</td>
              <td data-label="الحالة"><span class="badge badge-info">\${o.status}</span></td>
              <td data-label="الوقت">\${new Date(o.created_at).toLocaleTimeString('ar-BH')}</td>
            </tr>
          \`).join('');
        }
      } catch (err) {
        console.error('Orders error:', err);
      }
    }

    /* LOGS */
    async function fetchLogs() {
      try {
        const data = await apiFetch('/api/admin/logs');
        if (data.success) {
          const tbody = document.getElementById('table-logs-body');
          const list = data.logs || [];
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">لا توجد سجلات</td></tr>';
            return;
          }

          tbody.innerHTML = list.map(l => {
            let status = '<span class="badge badge-success">ناجح</span>';
            if (l.status === 'warning') status = '<span class="badge badge-warning">تحذير</span>';
            if (l.status === 'error') status = '<span class="badge badge-danger">خطأ</span>';

            return \`
              <tr>
                <td data-label="الوقت">\${new Date(l.created_at).toLocaleTimeString('ar-BH')}</td>
                <td data-label="العملية"><span class="code-tag">\${l.action}</span></td>
                <td data-label="المستخدم"><strong>\${l.username || 'النظام'}</strong></td>
                <td data-label="التفاصيل">\${l.details}</td>
                <td data-label="IP"><code>\${l.ip}</code></td>
                <td data-label="الحالة">\${status}</td>
              </tr>
            \`;
          }).join('');
        }
      } catch (err) {
        console.error('Logs error:', err);
      }
    }

    /* ALERTS */
    async function fetchAlerts() {
      try {
        const data = await apiFetch('/api/admin/alerts');
        if (data.success) {
          const tbody = document.getElementById('table-alerts-body');
          const list = data.alerts || [];

          // Overview table
          const recentTable = document.getElementById('table-recent-alerts');
          if (recentTable) {
            recentTable.innerHTML = list.slice(0, 5).map(a => \`
              <tr>
                <td data-label="الخطورة"><span class="badge badge-\${a.severity === 'critical' ? 'danger' : (a.severity === 'warning' ? 'warning' : 'info')}">\${a.severity}</span></td>
                <td data-label="العنوان"><strong>\${a.title}</strong></td>
                <td data-label="الرسالة">\${a.message}</td>
                <td data-label="الحالة">\${a.is_read ? 'مقروء' : '<span style="color:var(--danger)">جديد</span>'}</td>
              </tr>
            \`).join('');
          }

          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">لا توجد تنبيهات نشطة</td></tr>';
            return;
          }

          tbody.innerHTML = list.map(a => {
            let sev = '<span class="badge badge-info">عادي</span>';
            if (a.severity === 'warning') sev = '<span class="badge badge-warning">تحذير</span>';
            if (a.severity === 'critical') sev = '<span class="badge badge-danger">حرج</span>';

            return \`
              <tr>
                <td data-label="الخطورة">\${sev}</td>
                <td data-label="النوع"><code>\${a.type}</code></td>
                <td data-label="العنوان"><strong>\${a.title}</strong></td>
                <td data-label="الرسالة">\${a.message}</td>
                <td data-label="الوقت">\${new Date(a.created_at).toLocaleTimeString('ar-BH')}</td>
                <td data-label="الإجراء">
                  \${!a.is_read ? \`
                    <button class="btn btn-secondary btn-sm" onclick="markAlertRead('\${a.id}')">قراءة</button>
                  \` : '<span style="color:#64748b">تمت المراجعة</span>'}
                </td>
              </tr>
            \`;
          }).join('');
        }
      } catch (err) {
        console.error('Alerts error:', err);
      }
    }

    async function markAlertRead(id) {
      const res = await apiFetch('/api/admin/alerts/' + id + '/read', { method: 'PATCH' });
      if (res.success) {
        showToast('تم تعليم التنبيه كمقروء');
        fetchAlerts();
        fetchStats();
      }
    }

    async function clearAllAlerts() {
      const res = await apiFetch('/api/admin/alerts/clear-all', { method: 'POST' });
      if (res.success) {
        showToast('تم تعليم جميع التنبيهات كمقروءة');
        fetchAlerts();
        fetchStats();
      }
    }

    /* WHATSAPP RADAR */
    async function fetchWhatsApp() {
      try {
        const data = await apiFetch('/api/whatsapp/session');
        if (data.success && data.session) {
          const s = data.session;
          if (s.qr_code_data_url) {
            document.getElementById('whatsapp-qr-img').src = s.qr_code_data_url;
            document.getElementById('qr-display-container').style.display = 'inline-block';
          } else {
            document.getElementById('qr-display-container').style.display = 'none';
          }

          const badge = document.getElementById('wa-status-badge');
          badge.innerText = s.status === 'connected' ? 'متصل ومقترن' : 'بانتظار المسح';
          badge.className = 'badge ' + (s.status === 'connected' ? 'badge-success' : 'badge-warning');

          document.getElementById('wa-phone-val').innerText = s.connected_phone || 'غير مقترن';
          document.getElementById('wa-device-val').innerText = s.device_name;
          document.getElementById('wa-battery-val').innerText = '🔋 ' + s.battery_level + '%';
          document.getElementById('wa-groups-val').innerText = s.groups_monitored_count + ' قروب';
          document.getElementById('wa-orders-val').innerText = s.total_orders_captured + ' طلب';
        }
      } catch (err) {
        console.error('WhatsApp fetch error:', err);
      }
    }

    async function refreshWhatsAppQR() {
      const res = await apiFetch('/api/whatsapp/session/refresh-qr', { method: 'POST' });
      if (res.success) {
        showToast('تم تحديث كود QR للرادار');
        fetchWhatsApp();
      }
    }

    async function openPairWhatsAppModal() {
      const phone = prompt('أدخل رقم هاتف الواتساب الفعلي لربط بوابة الرادار (+973...):', '+973');
      if (!phone || phone.length < 8) return;
      const res = await apiFetch('/api/whatsapp/session/pair', {
        method: 'POST',
        body: { phone }
      });
      if (res.success) {
        showToast('تم ربط بوابة الواتساب بالرقم ' + phone);
        fetchWhatsApp();
        fetchStats();
      } else {
        alert(res.error || 'تعذر ربط الرقم');
      }
    }

    function copyWebhookUrl() {
      const fullUrl = window.location.origin + '/api/orders';
      const input = document.getElementById('webhook-url-input');
      input.value = fullUrl;
      input.select();
      navigator.clipboard.writeText(fullUrl).then(() => {
        showToast('تم نسخ رابط استقبال الطلبات');
      }).catch(() => {
        showToast('تم تحديد الرابط، يمكنك نسخه يدوياً');
      });
    }

    async function submitChangeAdminCreds() {
      const newUsername = document.getElementById('change-admin-username').value.trim();
      const newPassword = document.getElementById('change-admin-password').value;
      const confirmPass = document.getElementById('change-admin-password-confirm').value;

      if (!newUsername && !newPassword) {
        alert('يرجى إدخال اسم مستخدم أو كلمة مرور جديدة');
        return;
      }
      if (newPassword && newPassword !== confirmPass) {
        alert('كلمات المرور غير متطابقة، يرجى التأكد');
        return;
      }

      const res = await apiFetch('/api/admin/change-credentials', {
        method: 'POST',
        body: { newUsername, newPassword }
      });

      if (res.success) {
        showToast('تم تحديث بيانات حساب المشرف بنجاح');
        if (newUsername) {
          currentAdminUser = newUsername;
          localStorage.setItem('orderi_admin_user', newUsername);
          document.getElementById('profile-admin-name').innerText = newUsername;
        }
        document.getElementById('change-admin-username').value = '';
        document.getElementById('change-admin-password').value = '';
        document.getElementById('change-admin-password-confirm').value = '';
      } else {
        alert(res.error || 'حدث خطأ أثناء التحديث');
      }
    }

    async function disconnectWhatsApp() {
      if (!confirm('فصل رادار الواتساب؟')) return;
      const res = await apiFetch('/api/whatsapp/session/disconnect', { method: 'POST' });
      if (res.success) {
        showToast('تم فصل رادار الواتساب');
        fetchWhatsApp();
      }
    }

    function downloadApkIconPng() {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, 512, 512);
          ctx.drawImage(img, 0, 0, 512, 512);
          const a = document.createElement('a');
          a.download = 'orderi-admin-logo-512.png';
          a.href = canvas.toDataURL('image/png');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast('تم تحميل أيقونة APK بصيغة PNG (512x512) بنجاح');
        } catch (e) {
          showToast('تعذر استخراج PNG، يتم فتح ملف الشعار');
          window.open('/orderi-admin-logo.svg', '_blank');
        }
      };
      img.src = '/orderi-admin-logo.svg';
    }

    // Auto-refresh interval
    setInterval(() => {
      if (activeToken) {
        fetchStats();
      }
    }, 15000);
  </script>
</body>
</html>`;
}
