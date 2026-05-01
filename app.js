// ============================================================
// app.js — LEGACY ENTRY POINT (Now Empty)
// All logic has been migrated to FSD layer modules under src/
//
// Architecture:
//   src/app/store.js        → Global State
//   src/app/boot.js         → DOMContentLoaded Boot Logic
//   src/app/layout.ui.js    → HTML Shell Template
//   src/shared/lib/core/    → Utility Functions (formatCurrency etc.)
//   src/shared/lib/supabase/→ Database Sync Logic
//   src/features/auth/      → Login / Logout / Password Reset
//   src/features/inventory/ → Inventory CRUD
//   src/features/pos/       → Billing / Cart / Hold Order
//   src/features/history/   → Sales History / Dashboard / Calendar
//   src/features/expenses/  → Expense Tracking & Analytics
//   src/features/settings/  → Table Config / Import Items
//   src/features/receipt/   → Receipt Print
//   src/main.js             → Module Orchestrator (imports & inits all)
// ============================================================