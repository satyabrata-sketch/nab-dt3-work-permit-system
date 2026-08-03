# NAB-DT3 Work Permit System & Safety Tracker

An interactive, responsive, multi-slide web application for tracking, managing, and auditing site work permits for the **NAB-DT3 Site** (CBRE Facility Management).

![NAB-DT3 Work Permit Tracker Banner](https://img.shields.org/badge/CBRE-NAB--DT3_Work_Permit_System-06B6D4?style=for-the-badge&logo=shield&logoColor=white)
![Status](https://img.shields.org/badge/Status-Operational-10B981?style=for-the-badge)
![Records](https://img.shields.org/badge/Historical_Permits-424_Records-8B5CF6?style=for-the-badge)

---

## 🌟 Key Features

### 1. 📝 Slide 1: Data Entry & Permit Tracker
- **Quick Data Entry & Update Panel**: Free text **Site Location** input (`e.g. Zone B - Cafeteria, 4th Floor Server Room`) for entering new work permits or updating existing ones.
- **5 Work Permit Categories**:
  - 🔧 **General**: Routine maintenance & facility inspections.
  - ⚡ **Electrical**: Panels, wiring, UPS, FAS, and power checks.
  - 🔥 **HOT**: Hot work (welding, cutting, torch, grinding, spark risk).
  - 🪜 **Height**: Work at height (ceiling, roof, scaffolding).
  - 📦 **Confined Space**: Work inside ducts, tanks, pits, shafts, manholes.
- **Permits Tracker Table & Grid**: Search, column sort, filter, paginated view, digital permit ticket preview, edit, and soft delete capabilities.

### 2. 📊 Slide 2: Realtime Executive Dashboard
- **Instant Real-Time Sync**: Any permit created, modified, or removed in Slide 1 updates Slide 2 metrics, KPI scorecards, category health matrices, and charts in real-time.
- **Category-Wise & Minimum Category Threshold Monitor**: Real-time compliance monitoring (`Meets Min Quota` vs `Below Min Quota`).
- **Interactive Chart.js Visualizations**:
  - 🍩 **5 Category Share Breakdown** (Doughnut Chart)
  - 📈 **Monthly Permit Volume Trend** (13 Months Timeline: Jan 2025 – July 2026)
  - 🏢 **NAB-DT3 Location Density Chart**
  - 🚚 **Top Contractor Workload Chart**

### 3. 📥 Formatted Multi-Sheet Excel Export (.xlsx)
- Powered by **SheetJS**:
  - **Sheet 1 (`Master Permits Tracker`)**: Formatted table with auto-fitted column widths.
  - **Sheet 2 (`5 Category Threshold Monitor`)**: Category quota compliance & top vendor metrics.
  - **Sheet 3 (`Executive KPI Summary`)**: High-level site summary statistics & timestamp.

---

## 🚀 Getting Started

### Local Setup
1. Clone or download this repository.
2. Open `index.html` directly in any web browser (Chrome, Edge, Safari, Firefox).
3. Alternatively, serve using Python HTTP server:
   ```bash
   python -m http.server 8080
   ```
4. Access at `http://localhost:8080/index.html`.

---

## 📁 Repository Structure
```
├── index.html        # Main HTML5 application structure & modal templates
├── style.css         # Dark glassmorphism styling, animations & responsive design
├── app.js            # App logic, state management, realtime dashboard sync & Excel export
├── data.js           # Cleaned dataset containing all 424 historical Excel records
├── README.md         # Documentation & setup guide
```

---

## 🔐 License & Author
Built for **CBRE Facility Operations & Safety Management — NAB-DT3 Site**.
