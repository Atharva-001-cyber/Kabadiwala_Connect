# 🛠️ Tech Stack & Technical Architecture Specification
## Project: Kabadiwala Connect (कबाड़ीवाला कनेक्ट)
**Smart India Hackathon 2026 — Problem Statement #229**  
*Formalizing Informal Scrap Collectors through Vernacular Multimodal Interfaces, Offline-First Resilience, and Cryptographic Traceability.*

---

## 📑 Table of Contents
1. [Tech Stack Matrix (Overview)](#1-tech-stack-matrix-overview)
2. [Visual Architecture Diagrams & Flowcharts](#2-visual-architecture-diagrams--flowcharts)
   - [2.1 End-to-End Operational Workflow Flowchart](#21-end-to-end-operational-workflow-flowchart)
   - [2.2 Tech Stack Interaction Architecture](#22-tech-stack-interaction-architecture)
   - [2.3 Complete Multi-Tier System Architecture](#23-complete-multi-tier-system-architecture)
3. [Frontend & Client Runtime](#3-frontend--client-runtime)
4. [Styling, Design System & Accessibility UI](#4-styling-design-system--accessibility-ui)
5. [Offline-First & Local Storage Engine](#5-offline-first--local-storage-engine)
6. [Cloud Backend & Realtime Database](#6-cloud-backend--realtime-database)
7. [Multimodal Vernacular Voice Engine](#7-multimodal-vernacular-voice-engine)
8. [Computer Vision & Image Quality Pipeline](#8-computer-vision--image-quality-pipeline)
9. [Cryptographic Audit Ledger (SHA-256 Merkle Chain)](#9-cryptographic-audit-ledger-sha-256-merkle-chain)
10. [GIS, Mapping & Geolocation Services](#10-gis-mapping--geolocation-services)
11. [Anti-Fraud & Statistical Anomaly Engine](#11-anti-fraud--statistical-anomaly-engine)
12. [Development & Build Tooling](#12-development--build-tooling)
13. [Empirical Field Research & Unit-Economics Dossier (SIH Mandate)](#13-empirical-field-research--unit-economics-dossier-sih-mandate)

---

## 1. Tech Stack Matrix (Overview)

| Layer | Technology | Version | Primary Responsibility in Kabadiwala Connect |
| :--- | :--- | :--- | :--- |
| **Core Framework** | [React](https://react.dev/) | `^18.2.0` | Declarative, component-based UI rendering with Concurrent Mode |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `^5.2.2` | Strict end-to-end type safety across domain models and API contracts |
| **Build Tool & Bundler** | [Vite](https://vitejs.dev/) | `^5.2.0` | Ultra-fast HMR dev server and ES module-based production bundling |
| **Routing** | [React Router DOM](https://reactrouter.com/) | `^6.23.0` | Declarative client-side routing with role-based route protection |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^3.4.3` | Utility-first, responsive dark-mode styling with accessible touch targets |
| **Iconography** | [Lucide React](https://lucide.dev/) | `^0.378.0` | Low-literacy iconography for universal vernacular recognition |
| **Local Offline DB** | [Dexie.js](https://dexie.org/) | `^4.0.7` | IndexedDB wrapper for zero-connectivity offline lot creation and caching |
| **Cloud BaaS & DB** | [Supabase](https://supabase.com/) | `^2.116.0` | PostgreSQL 15, PostgREST API Gateway, Auth and Realtime WebSockets |
| **GIS & Maps** | [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/) | `^1.9.4` / `^4.2.1` | Interactive scrap cluster maps, recycler routing, and geofence verification |
| **Voice & Speech** | Native Web Speech API | Native | Bilingual SpeechSynthesis (TTS) and SpeechRecognition (STT) |
| **Media & Canvas** | HTML5 Canvas 2D API | Native | Client-side image luminance/blur quality validation and JPEG compression |
| **Computer Vision AI** | [ONNX Runtime Web](https://onnxruntime.ai/) (WASM) | `^1.30.0` | On-device 100% offline YOLOv8-Nano inference engine (`best.onnx`) for e-waste category & metal yield detection |
| **Cryptography** | Web Crypto API (`SubtleCrypto`) | Native | SHA-256 cryptographic Merkle Chain linking for EPR compliance logs |
| **Micro-Interactions** | [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) | `^1.9.4` | Milestone celebration feedback upon completed digital transactions |

---

## 2. Visual Architecture Diagrams & Flowcharts

### 2.1 End-to-End Operational Workflow Flowchart
This flowchart details the step-by-step lifecycle of an e-waste scrap lot from initial capture by an informal collector to digital scale verification, instant digital ledger settlement, and CPCB EPR credit generation:

```mermaid
flowchart TD
    classDef actor fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef action fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef decision fill:#312e81,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef crypto fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef storage fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff;

    %% ACTORS
    Collector["👤 Informal Collector<br/>(Kabadiwala)"]:::actor
    Recycler["🏭 Authorized<br/>Recycler"]:::actor
    Admin["🛡️ CPCB Admin<br/>/ Regulator"]:::actor

    %% PHASE 1: LOGIN & LANGUAGE
    Collector --> AuthStep["1. Mobile OTP<br/>Authentication"]:::action
    AuthStep --> LangSelect["2. Select Language<br/>(Hindi / Marathi / English)"]:::action

    %% PHASE 2: LOT CREATION & QUALITY VALIDATION
    LangSelect --> AddLot["3. Create New<br/>E-Waste Lot"]:::action
    AddLot --> PhotoCapture["4. Capture Scrap Photo<br/>via Device Camera"]:::action
    PhotoCapture --> CanvasVal{"5. Canvas Image<br/>Quality Check"}:::decision
    CanvasVal -- "Photo Dark / Blur" --> RetakePhoto["Voice Guidance:<br/>Prompt Retake Photo"]:::action
    RetakePhoto --> PhotoCapture
    CanvasVal -- "Photo Clear" --> ImgCompress["6. In-Browser JPEG<br/>Compression (< 500KB)"]:::action

    %% PHASE 3: ML HEURISTIC & OFFLINE CHECK
    ImgCompress --> MLHeuristic["7. Client Edge ML<br/>Classification"]:::action
    MLHeuristic --> WeightInput["8. Enter Estimated<br/>Weight (kg)"]:::action
    WeightInput --> NetCheck{"9. Internet Connection<br/>Available?"}:::decision

    NetCheck -- "OFFLINE" --> DexieSave["Save to IndexedDB<br/>(Status PENDING)"]:::storage
    DexieSave --> BackgroundWorker["15s Sync Worker<br/>(Flush when Online)"]:::action
    BackgroundWorker --> CloudLot

    NetCheck -- "ONLINE" --> CloudLot["10. Register Lot<br/>in Supabase"]:::storage

    %% CRYPTO GENESIS
    CloudLot --> GenesisMerkle["11. SHA-256 Merkle:<br/>Genesis Event"]:::crypto

    %% PHASE 4: PRICE DISCOVERY & RECYCLER MATCHING
    CloudLot --> MandiBoard["12. Live Mandi<br/>Benchmark Rates"]:::action
    CloudLot --> MatchEngine["13. Recycler Matching<br/>(Rate + Distance)"]:::action
    
    %% PHASE 5: RECYCLER OFFERS
    MatchEngine --> NotifyRecycler["14. Realtime Alert<br/>to Recyclers"]:::action
    NotifyRecycler --> Recycler
    Recycler --> ReviewLot["15. Recycler Inspects<br/>Lot & Photo"]:::action
    ReviewLot --> SubmitBid["16. Submit Quote<br/>(Rate + Slot)"]:::action
    SubmitBid --> CompareOffers["17. Collector Compares<br/>Offers"]:::action
    CompareOffers --> AcceptOffer["18. Collector Accepts<br/>Best Quote"]:::action

    AcceptOffer --> CryptoEvent2["19. Merkle Event:<br/>OFFER_ACCEPTED"]:::crypto

    %% PHASE 6: PICKUP & DISPATCH
    AcceptOffer --> SchedulePickup["20. Doorstep Pickup<br/>Scheduled"]:::action
    SchedulePickup --> OTPGen["21. 4-Digit OTP<br/>Generated"]:::action
    SchedulePickup --> DriverArrive["22. Logistics Driver<br/>Arrives"]:::action

    %% PHASE 7: WEIGHING & HANDOVER
    DriverArrive --> CalibratedScale["23. Calibrated Scale<br/>Weighing (kg)"]:::action
    CalibratedScale --> WeightComp{"24. Scale Variance<br/>Check (> 15%)"}:::decision

    WeightComp -- "Variance > 15%" --> AnomalyFlag["⚠️ Auto-Flag Anomaly<br/>Admin Alert"]:::action
    WeightComp -- "Variance <= 15%" --> VerifyOTP["25. Driver Inputs<br/>4-Digit OTP"]:::action

    AnomalyFlag --> VerifyOTP
    VerifyOTP --> CaptureEvidence["26. Scale Photo +<br/>GPS Tagging"]:::action
    CaptureEvidence --> Settlement["27. Instant Settlement<br/>Digital Voucher"]:::action

    Settlement --> CryptoEvent3["28. Merkle Event:<br/>RECYCLER_RECEIVED"]:::crypto
    Settlement --> LedgerCredited["29. Payout Recorded<br/>in Ledger"]:::action

    %% PHASE 8: PROCESSING & EPR
    Recycler --> SafeDismantling["30. Scientific Dismantling<br/>& Material Recovery"]:::action
    SafeDismantling --> EPRCertificate["31. Generate CPCB<br/>EPR Certificate"]:::action
    EPRCertificate --> FinalMerkle["32. Merkle Event:<br/>RECYCLED Closed"]:::crypto

    %% PHASE 9: ADMIN & AUDIT
    Admin --> CPCBCheck["33. Verify Recycler<br/>Against CPCB Master"]:::action
    Admin --> GeoMap["34. Live E-Waste<br/>GIS Heatmap"]:::action
    Admin --> ResolveDisputes["35. Arbitrate Anomalies<br/>& Disputes"]:::action
    Admin --> ExportML["36. Export ML<br/>Training Datasets"]:::action
```

---

### 2.2 Tech Stack Interaction Architecture
This diagram illustrates how client hardware APIs, React state providers, local offline storage, transport protocols, and cloud services communicate:

```mermaid
graph TB
    %% SUBGRAPHS
    subgraph ClientHardware ["📱 Client Hardware & Native APIs"]
        Cam["📷 HTML5 MediaDevices<br/>Camera API"]
        CanvasEngine["🎨 HTML5 Canvas 2D API<br/>(Luminance/Blur Check)"]
        SpeechEngine["🗣️ Web Speech API<br/>(SpeechSynthesis & STT)"]
        CryptoSubtle["🔐 Web Crypto API<br/>(SHA-256 Merkle Digest)"]
        GeoAPI["📍 Geolocation API<br/>(High Accuracy GPS)"]
        StorageLocal["💾 LocalStorage<br/>(Auth Session Cache)"]
    end

    subgraph ReactFrontend ["💻 React 18 Core (TypeScript + Vite)"]
        direction TB
        UIViews["🖥️ UI Views & Modals<br/>(Collector, Recycler, Admin)"]
        StyleTailwind["🎨 Tailwind CSS 3.4.3<br/>(Accessible Dark Theme)"]
        IconSystem["✨ Lucide React Icons<br/>(Vernacular Symbols)"]
        MapSystem["🗺️ Leaflet 1.9.4<br/>(Interactive GIS Maps)"]
        
        subgraph StateLayer ["🧠 React State Providers"]
            AuthCtx["AuthContext<br/>(Session & Role)"]
            LangCtx["LanguageContext<br/>(hi / mr / en)"]
            SyncCtx["SyncContext<br/>(Offline Reconciliation)"]
            ToastCtx["ToastContext<br/>(Feedback Engine)"]
        end

        subgraph ServiceLayer ["⚙️ Core Service Layer"]
            APIService["services/api.ts<br/>(Business Logic & PostgREST)"]
            SpeechService["services/speechService.ts<br/>(Vernacular Voice Queue)"]
            ImageValidator["utils/imageValidator.ts<br/>(Canvas Quality Rules)"]
            GeoService["utils/geolocation.ts<br/>(GPS Coordinates)"]
        end
    end

    subgraph OfflineResilience ["💾 Offline Client Persistence"]
        DexieDB["IndexedDB Engine<br/>(KabadiwalaOfflineDB)"]
        TblOfflineLots["offlineLots Store<br/>(Pending Lot Queue)"]
        TblCachedPrices["cachedPrices Store<br/>(Mandi Benchmark Rates)"]
        TblCachedRecyclers["cachedRecyclers Store<br/>(Recycler Directory)"]
    end

    subgraph TransportGateway ["🌐 Network Transport & Gateway"]
        PostgRESTHTTP["📡 HTTPS / PostgREST API<br/>(Queries & Mutations)"]
        RealtimeWSS["⚡ WSS WebSocket Channel<br/>(Realtime Event Stream)"]
        AudioCDN["🔊 Audio CDN / Streaming<br/>(Indic Audio Files)"]
    end

    subgraph SupabaseCloud ["☁️ Cloud Backend Infrastructure"]
        direction TB
        SupaAuth["Supabase Auth Engine<br/>(JWT Claims & Session)"]
        SupaRealtimeEngine["Realtime Engine<br/>(WAL to WebSocket)"]
        
        subgraph PostgresTables ["🗄️ Relational PostgreSQL Schemas"]
            U_Table["public.users,<br/>collectors, recyclers"]
            L_Table["public.lots<br/>(Scrap listings)"]
            O_Table["public.offers<br/>(Dynamic quotes)"]
            P_Table["public.pickups,<br/>handovers (Scales)"]
            T_Table["traceability_logs<br/>(Merkle Chain)"]
            M_Table["prices,<br/>price_history_log"]
            A_Table["anomalies,<br/>disputes (Fraud)"]
            C_Table["cpcb_master_registry<br/>(Compliance)"]
        end
    end

    %% HARDWARE INTERACTIONS
    Cam -->|"Raw Video Stream"| CanvasEngine
    CanvasEngine -->|"Pixel Data Metrics"| ImageValidator
    ImageValidator -->|"Validated Image"| UIViews
    
    SpeechEngine <-->|"Vernacular Voice"| SpeechService
    SpeechService -->|"Audio Streaming"| AudioCDN
    SpeechService <-->|"Speech Events"| UIViews

    CryptoSubtle -->|"Digest Computation"| APIService
    GeoAPI -->|"GPS Lat/Lng"| GeoService
    GeoService -->|"Validated Location"| APIService

    %% UI & CONTEXT
    UIViews <--> StateLayer
    StateLayer <--> ServiceLayer
    UIViews --- StyleTailwind
    UIViews --- IconSystem
    UIViews --- MapSystem

    %% OFFLINE PERSISTENCE FLOW
    ServiceLayer <-->|"Read/Write"| DexieDB
    DexieDB --- TblOfflineLots
    DexieDB --- TblCachedPrices
    DexieDB --- TblCachedRecyclers

    SyncCtx -->|"Network Monitor"| APIService
    APIService -->|"Batch Flush"| PostgRESTHTTP

    %% CLOUD INTERACTIONS
    APIService <-->|"HTTPS Calls"| PostgRESTHTTP
    APIService <-->|"WebSocket Subscriptions"| RealtimeWSS
    StorageLocal <-->|"Token Verification"| SupaAuth

    PostgRESTHTTP <--> PostgresTables
    RealtimeWSS <--> SupaRealtimeEngine
    SupaRealtimeEngine <--> PostgresTables
```

---

### 2.3 Complete Multi-Tier System Architecture
A holistic view of all 6 architectural tiers spanning client devices, local edge cache, secure gateways, PostgreSQL database tables, and statutory compliance systems:

```mermaid
graph TD
    classDef clientTier fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef logicTier fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef storageTier fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff;
    classDef apiTier fill:#3b0764,stroke:#c084fc,stroke-width:2px,color:#fff;
    classDef backendTier fill:#14532d,stroke:#4ade80,stroke-width:2px,color:#fff;
    classDef complianceTier fill:#7c2d12,stroke:#fb923c,stroke-width:2px,color:#fff;

    subgraph Tier1 ["TIER 1: PRESENTATION & CLIENT TIER"]
        direction TB
        Devices["📱 End-User Devices:<br/>Android Smartphones, Tablets, Desktop Web Browsers"]:::clientTier
        
        subgraph Portals ["Role-Guarded Dashboards & Shells"]
            CollectorPortal["👤 Collector Portal<br/>• Voice & Visual Scrap Listing<br/>• Live Mandi Rate Board<br/>• Recycler Comparison<br/>• Earnings Passbook Ledger"]:::clientTier
            RecyclerPortal["🏭 Recycler Portal<br/>• Incoming Lots Feed<br/>• Dynamic Quote Submission<br/>• Logistics Driver Dispatch<br/>• Digital Scale & OTP Handover"]:::clientTier
            AdminPortal["🛡️ Admin & Regulatory Portal<br/>• CPCB Recycler Verification<br/>• GIS Scrap Heatmaps<br/>• Anomaly & Dispute Monitor<br/>• ML Dataset Exporter"]:::clientTier
        end
    end

    subgraph Tier2 ["TIER 2: CLIENT LOGIC & UTILITIES TIER"]
        direction TB
        StateEngine["🧠 State Orchestration:<br/>AuthContext, LanguageContext, SyncContext"]:::logicTier
        SpeechSubsystem["🎙️ Multimodal Voice Engine:<br/>SpeechService (Hindi/Marathi TTS & STT)"]:::logicTier
        VisionSubsystem["📷 Vision & Compression Engine:<br/>ImageValidator & ImageCompressor (< 500KB)"]:::logicTier
        GeoSubsystem["📍 Geolocation Engine:<br/>GPS Accuracy + Regional Centroids"]:::logicTier
        CryptoSubsystem["🔐 Cryptographic Engine:<br/>SHA-256 Merkle Chain Generator"]:::logicTier
    end

    subgraph Tier3 ["TIER 3: EDGE RESILIENCE & OFFLINE TIER"]
        direction TB
        DexieEngine["💾 Dexie.js (IndexedDB Native Wrapper)"]:::storageTier
        OfflineQueue["📤 Offline Sync Queue with Idempotency Keys"]:::storageTier
        LocalCache["📦 Edge Cache: Mandi Rates & Recycler Directory"]:::storageTier
    end

    subgraph Tier4 ["TIER 4: SECURE GATEWAY & TRANSPORT TIER"]
        direction TB
        SupabaseClient["⚡ @supabase/supabase-js Gateway"]:::apiTier
        RESTChannel["📡 HTTP RESTful API (PostgREST Endpoints)"]:::apiTier
        RealtimeChannel["⚡ WSS WebSocket Pub/Sub (Realtime Stream)"]:::apiTier
    end

    subgraph Tier5 ["TIER 5: CLOUD DATABASE & BACKEND TIER"]
        direction TB
        subgraph PostgresDB ["🐘 Supabase PostgreSQL 15 Engine"]
            TablesCore["📋 Identity & Profiles:<br/>users, collectors, recyclers"]:::backendTier
            TablesLots["📦 Transaction Core:<br/>lots, offers, pickups, handovers"]:::backendTier
            TablesAudit["⛓️ Audit & Financial Ledger:<br/>traceability_logs, payments"]:::backendTier
            TablesIntel["📊 Market Intelligence:<br/>prices, price_history_log"]:::backendTier
            TablesFraud["🚨 Anti-Fraud & Compliance:<br/>anomalies, disputes, ml_samples"]:::backendTier
        end
        RealtimePub["📢 Realtime Publication (WAL Stream Enabled)"]:::backendTier
        DBIndexes["⚡ B-Tree Indexes (lot_id, collector_id, district, status)"]:::backendTier
    end

    subgraph Tier6 ["TIER 6: REGULATORY & EXTERNAL ECOSYSTEM"]
        direction TB
        CPCBRegistry["🏛️ CPCB Master Registry (Official Compliance)"]:::complianceTier
        EPRSystem["📜 EPR Green Credit & Certificate Engine"]:::complianceTier
        MandiBenchmark["📈 Mandi Spot Market Benchmark Feed"]:::complianceTier
        GISMappingServer["🗺️ OpenStreetMap (OSM) Tile CDN"]:::complianceTier
    end

    %% TIER CONNECTIONS
    Devices --> Portals
    Portals <--> Tier2
    Tier2 <--> Tier3
    Tier2 <--> Tier4
    Tier3 <-->|"Auto Batch Sync on Reconnect"| Tier4
    Tier4 <--> Tier5
    Tier5 <--> Tier6
```

---

## 3. Frontend & Client Runtime

### React 18 & TypeScript
* **Component Architecture**: Modular architecture organized into `pages/collector`, `pages/recycler`, and `pages/admin`.
* **State Management**: Zero heavyweight external state dependencies (Redux/Zustand avoided in favor of clean React Contexts):
  * `AuthContext.tsx`: Tracks authentication session, current active role (`COLLECTOR`, `RECYCLER`, `ADMIN`), and permission boundaries.
  * `LanguageContext.tsx`: Manages active language (`hi`, `mr`, `en`) and exposes the 111 KB reactive dictionary.
  * `SyncContext.tsx`: Tracks network state (`isOnline`), pending queue depth, and orchestrates background synchronization.
  * `ToastContext.tsx`: Delivers non-blocking visual feedback for field actions.
* **Role-Based Route Guarding (`App.tsx`)**:
  * `ProtectedRoute`: Inspects user session and token claims. Restricts unauthorized roles from accessing sensitive endpoints (e.g., collectors cannot access admin audit tools).

---

## 4. Styling, Design System & Accessibility UI

### Tailwind CSS & Low-Literacy Vernacular Design
* **Color Palette**: Engineered for high visibility in harsh outdoor sunlight:
  * Primary Canvas: `slate-950` / `slate-900`
  * Accent & Action: `emerald-500` / `emerald-400` (Earnings, Validations, Safe status)
  * Alerts & Attention: `amber-500` / `rose-500` (Anomalies, Blurred photos, Battery hazards)
* **Touch-Target Sizing**: Minimum touch target of 48px to 56px with high contrast borders (`border-slate-800`) to accommodate one-handed usage on cheap smartphones.
* **Utility Helpers**:
  * `clsx` & `tailwind-merge`: Resolves dynamic class clashes smoothly in reusable UI components.
  * `lucide-react`: Clear visual anchors (scale, microphone, camera, truck, rupee symbol) complementing text for semi-literate users.

---

## 5. Offline-First & Local Storage Engine

### Dexie.js (IndexedDB) Architecture
* **Database Name**: `KabadiwalaConnectOfflineDB` (Version 1)
* **Stores Schema**:
  ```typescript
  offlineLots: 'clientLotId, materialCategory, createdAt, syncStatus'
  cachedPrices: 'id, materialCategory, district'
  cachedRecyclers: 'id, facilityName, district'
  ```
* **Offline Lifecycle Workflow**:
  1. **Capture**: Scrap lot created without internet is stored in `offlineLots` with status `PENDING` and a generated UUID `clientLotId`.
  2. **Listener**: `SyncContext` monitors `window.addEventListener('online')` and `navigator.onLine`.
  3. **Polling Loop**: Autonomous 15-second background worker attempts batch uploads (`api.syncOfflineBatch`) when connectivity returns.
  4. **Idempotency**: `clientLotId` prevents duplicate lot creation on the cloud backend during intermittent flaky connections.

---

## 6. Cloud Backend & Realtime Database

### Supabase & PostgreSQL 15 Engine
* **PostgREST HTTP Gateway**: Direct, low-latency RESTful data access from client with automatic JSON formatting.
* **WebSocket Realtime CDC (`supabase_realtime`)**:
  * Realtime replication enabled on 8 critical tables:
    * `lots` (Live notifications of new scrap offerings)
    * `offers` (Instant counter-offers received by collectors)
    * `pickups` (Live dispatch tracking)
    * `handovers` (Digital scale receipts)
    * `prices` (Live Mandi benchmark board rate changes)
    * `payments` (Real-time ledger updates)
    * `anomalies` (Fraud detection alerts to admins)
    * `disputes` (Live resolution updates)
* **Database Normalization**:
  * 15 distinct relational schemas with strict foreign keys (`ON DELETE CASCADE`) and check constraints (e.g., `role IN ('COLLECTOR', 'RECYCLER', 'ADMIN')`).
  * Dedicated B-Tree indexes on `lot_id`, `collector_id`, `district`, and `status`.

---

## 7. Multimodal Vernacular Voice Engine

### Dual-Layer Speech Architecture (`speechService.ts`)
* **Layer 1: Native Web Speech API**:
  * `window.speechSynthesis` with locale resolution: `hi-IN` (Hindi), `mr-IN` (Marathi), `en-IN` (Indian English).
  * `webkitSpeechRecognition` for vernacular voice-activated numeric weight and category input.
* **Layer 2: Cloud Streaming Indic Audio Fallback**:
  * Fixes silent failures on budget Android / Windows devices lacking pre-installed Indic TTS voice packages.
  * Streams crisp, high-definition pre-rendered audio buffers directly to an `HTMLAudioElement`.
* **Devanagari Numeral Preprocessor**:
  * Automatically converts numbers into phonetically spoken words (e.g., `180` $\rightarrow$ *"एक सौ अस्सी रुपये"*, preventing awkward digit-by-digit pronunciation).
* **Audio Feedbacks**: Universal `AudioButton.tsx` present across every card, rate board item, and guideline.

---

## 8. Computer Vision & Image Quality Pipeline

### In-Browser HTML5 Canvas Validation (`imageValidator.ts`)
* **Deterministic Metrics Execution**:
  * **Average Luminance Calculation**:
    $$\text{Luminance} = \frac{1}{N} \sum (0.299R + 0.587G + 0.114B)$$
    *Detects washed-out camera flashes ($>240$) or pitch-black photos ($<30$).*
  * **Laplacian Contrast Variance**:
    *Calculates second-derivative pixel variances across adjacent pixels to detect motion blur or out-of-focus lenses.*
* **Client-Side Edge Compression (`imageCompressor.ts`)**:
  * Downscales raw 12MP-48MP smartphone photos on an in-memory canvas to maximum dimensions of 1280px.
  * Produces high-quality JPEG output under 500 KB, saving data costs on rural 2G/3G networks.
* **Heuristic & ML Classifier (`services/vision/ewasteOnnx.ts`)**:
  * **On-Device YOLOv8-Nano ONNX Engine**: Executes `onnxruntime-web` directly in the browser via WebAssembly (WASM).
  * **Model Checkpoint (`public/models/best.onnx`)**: 11.58 MB FP32 ONNX model (Opset 12) detecting e-waste categories (PCBs, Batteries, Cables, Display panels) and predicting precious metal recovery yields in under 180ms with zero cloud API latency or cost.

---

## 9. Cryptographic Audit Ledger (SHA-256 Merkle Chain)

### Web Crypto API Implementation (`api.ts`)
* **Standard**: Native browser `window.crypto.subtle.digest('SHA-256')`.
* **Chaining Algorithm**:
  $$\text{PayloadHash} = \text{SHA256}(\text{lotId} \parallel \text{stage} \parallel \text{actorRole} \parallel \text{actorName} \parallel \text{facilityLocation} \parallel \text{timestamp} \parallel \text{title})$$
  $$\text{EventHash} = \text{SHA256}(\text{previousEventHash} : \text{PayloadHash} : \text{timestamp})$$
* **Genesis Block**: Root event begins with 64 hexadecimal zeros:
  `0000000000000000000000000000000000000000000000000000000000000000`
* **Tamper-Evident Verification (`verifyTraceabilityIntegrity`)**:
  * Traverses the event chain from genesis to current stage.
  * Recomputes all intermediate hashes. Any manual edit to dates, weights, or names in the database instantly breaks the chain, pinpointing the compromised event ID.

---

## 10. GIS, Mapping & Geolocation Services

### Leaflet & Device Geolocation (`geolocation.ts`)
* **Leaflet & React-Leaflet**:
  * Custom styled Dark-Mode map containers with OpenStreetMap tiles.
  * Interactive marker clusters displaying volume density per district.
* **Geolocation Hardware Integration**:
  * Interacts with `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`.
  * Captures latitude, longitude, and device accuracy in meters at the exact moment of handover.
* **District Centroid Fallbacks**:
  * When GPS permission is denied or device is indoors, gracefully falls back to verified regional centroids (`Lucknow: 26.8467, 80.9462`, `Pune: 18.5204, 73.8567`, `Delhi: 28.7041, 77.1025`, etc.).

---

## 11. Anti-Fraud & Statistical Anomaly Engine

### Scale Verification & Automated Governance
* **Weight Mismatch Detection**:
  $$\text{Variance \%} = \frac{|\text{Actual Weight} - \text{Approx Weight}|}{\text{Approx Weight}} \times 100$$
  *Any variance exceeding 15% automatically generates a HIGH severity flag in the `anomalies` table.*
* **Statistical Price Outliers**:
  * Evaluates recycler quotes against district Mandi spot rates using Z-Score bounds ($Z > 2.5$) to prevent predatory undercutting or money laundering.
* **Dual-Secret Handover Handshake**:
  * Handover requires matching the 4-digit OTP generated exclusively on the collector's device with electronic scale photo proof.
  * Generates an immutable `DIGITAL_LEDGER_VOUCHER` preventing the common informal practice of *"Kattai"* (arbitrary weight deductions).

---

## 12. Development & Build Tooling

* **Runtime Environment**: Node.js 18+ / 20+
* **Package Manager**: npm (v9+)
* **TypeScript Compiler**: `tsc` (Strict Type Checking enabled)
* **Bundler & Minifier**: Vite (ESBuild / Rollup pipeline)
* **Linter & Code Format**: Modern ESLint rules with standard TypeScript presets
* **Deployment Readiness**: Pre-configured for edge hosting (Vercel `vercel.json` and static CDN deployment).

---

## 13. Empirical Field Research & Unit-Economics Dossier (SIH Mandate)

> [!IMPORTANT]
> **COMPLIANCE MANDATE — SIH 2026 PROBLEM STATEMENT #229**  
> Problem Statement #229 requires empirical investigation involving at least **TWO (2)** working scrap collectors/aggregators, live usability testing, and a unit-economics assessment.

* 📄 **Full Empirical Field Research Dossier**: [`docs/FIELD_RESEARCH_REPORT.md`](file:///D:/Sih_229Anti/docs/FIELD_RESEARCH_REPORT.md)
* 📋 **Standardized Protocol & Data Instrument**: [`docs/FIELD_RESEARCH_PROTOCOL_TEMPLATE.md`](file:///D:/Sih_229Anti/docs/FIELD_RESEARCH_PROTOCOL_TEMPLATE.md)

### Key Empirical Highlights:
* **Participants Investigated**: `CR-01` (Ramesh Kumar, 14 yrs experience, Aminabad Mandi), `CR-02` (Mohammed Arif, 8 yrs experience, Chowk Cluster), and `AR-01` (Rakesh Gupta, Aggregator, Nadarganj).
* **Middleman Exploitation**: Documented 55.2% price undercutting on PCBs and 12% weight theft (*"Kattai"*), forcing workers into hazardous open-air wire burning and acid leaching.
* **Prototype Usability Score**: **86.5 / 100 ("Grade A - Excellent")** on the System Usability Scale (SUS) across 7 core workflows on 2GB RAM Android smartphones.
* **Unit Economics Uplift**: **+98.6% increase** in weekly collector take-home earnings (from ₹11,385 to ₹22,610 on representative 180 kg batch) with zero fees charged to collectors.

---

> **Kabadiwala Connect — Smart India Hackathon 2026**  
> *Engineered for real-world field resilience, statutory compliance, and digital empowerment.*
