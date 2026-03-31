

# MayaX Lead Hub — Phase 1: Foundation & Core UI

## Overview
Build the foundational layer: branding/design system, authentication, registration, database schema, navigation, and the marketplace UI shell with mock data. This gives us a working app skeleton to layer real backend logic onto in Phase 2+.

---

## 1. Design System & Branding Setup
- Set up the MayaX color palette as CSS variables: navy `#1B2A4A`, green `#2D7A4F`, gold `#C8A84E`, quality blues/grays
- Configure Inter font, glassmorphism background gradient (`#EDF2F8` → `#F7F9FC`)
- Create reusable quality grade color mappings (A+/A/B/C)

## 2. Database Schema (Supabase)
- Create all 7 tables: `dealers`, `leads`, `subscriptions`, `wallet_transactions`, `purchases`, `delivery_logs`, `user_roles`
- Set up RLS policies: dealers see only their own data, lead PII (full_name, phone, lead_email) hidden via a `leads_public` view
- Create `has_role` security definer function for admin access

## 3. Authentication & Registration
- **Login page** (`/login`): branded login with email/password, forgot password, link to register
- **Registration** (`/register`): multi-step form (Business Info → Contact → Delivery Prefs → Review), creates auth user + dealer record with `pending` status
- **Pending Approval** (`/pending-approval`): waiting screen for unapproved dealers
- **Password Reset** (`/reset-password`): reset flow page
- Route guards: redirect based on `approval_status`

## 4. Dealer Navigation Bar
- Persistent top nav matching the screenshot: dark navy bar
- Car icon + "MAYAX LEAD HUB" logo (left), nav links (Marketplace, Upgrade Plan, Dashboard), wallet balance, Add Funds button, avatar (right)
- Active link highlighting, responsive collapse on mobile

## 5. Marketplace Page — UI & Layout (`/marketplace`)
- **Left filter sidebar**: Credit Range slider (gradient track), Income Range, Document checkboxes (5 types), collapsible Location/Vehicle/Lead Age dropdowns, Clear Filters button
- **Lead card grid**: 3-column responsive grid matching screenshot exactly
  - Quality grade badge (A+/A/B/C) with colored left border
  - Initials avatar circle, buyer type label
  - Credit range + location data rows
  - Document indicator icons + AI Score
  - Available state: "Available Now" badge + price + "BUY LEAD" button
  - Locked state: countdown timer + price + "Upgrade to Unlock" button
- **Bottom bar**: Clear Filters, running Total, batch BUY LEAD button
- Multi-lead selection with checkboxes
- Seed database with ~12 sample leads for demo

## 6. Admin Sidebar Navigation & Dealer Management
- Admin sidebar layout with links: Dashboard, Dealers, Leads, Transactions, Delivery Logs, Settings
- **Admin Dealers page** (`/admin/dealers`): table of dealers with status badges, search/filter
- Dealer detail view: approve/reject/suspend actions with reason input
- This enables the approval workflow needed to test the full dealer flow

---

## What's Coming in Phase 2+
- Stripe integration (subscriptions + wallet top-ups)
- Purchase flow edge function with atomic transactions
- Real-time marketplace updates (Supabase Realtime)
- Lead delivery (email + webhook)
- Dashboard, wallet, purchase history, settings pages
- Admin lead management, transactions, delivery logs
- Mobile responsiveness polish

