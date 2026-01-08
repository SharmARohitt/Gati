# GATI Frontend Documentation

## Governance & Aadhaar Tracking Intelligence Platform

> A comprehensive web application for monitoring and analyzing Aadhaar-related anomalies across India using AI/ML-powered intelligence.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Core Features](#core-features)
5. [Technology Stack](#technology-stack)
6. [Component Library](#component-library)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Authentication & Security](#authentication--security)
10. [Internationalization (i18n)](#internationalization-i18n)
11. [Progressive Web App (PWA)](#progressive-web-app-pwa)
12. [Accessibility (A11y)](#accessibility-a11y)
13. [Testing](#testing)
14. [Performance Optimization](#performance-optimization)
15. [Mobile Responsiveness](#mobile-responsiveness)
16. [Deployment](#deployment)
17. [Environment Variables](#environment-variables)
18. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

GATI follows a modern Next.js 14 App Router architecture with:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   React  │  │  Zustand │  │  React   │  │  i18n    │    │
│  │Components│  │   Store  │  │  Query   │  │ (next-   │    │
│  │          │  │          │  │          │  │  intl)   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Auth   │  │ Analytics│  │    AI    │  │  Health  │    │
│  │   API    │  │   API    │  │  Chat    │  │  Check   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    ML BACKEND (Python)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  FastAPI │  │ Anomaly  │  │   Time   │  │  Hugging │    │
│  │  Server  │  │Detection │  │  Series  │  │   Face   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── admin/                    # Admin dashboard
│   ├── analytics/                # Analytics views
│   ├── api/                      # API routes
│   │   ├── ai-chat/              # AI chat endpoint
│   │   ├── auth/                 # Authentication
│   │   ├── ml/                   # ML pipeline
│   │   └── health/               # Health check
│   ├── audit/                    # Audit trail
│   ├── digital-twin/             # 3D visualization
│   ├── field-operations/         # Field officer management
│   ├── intelligence/             # AI intelligence hub
│   ├── login/                    # Login page
│   ├── offline/                  # PWA offline page
│   └── states/                   # State-wise data
├── components/                   # React components
│   ├── charts/                   # Chart components
│   ├── layout/                   # Layout components
│   └── ui/                       # UI components
├── lib/                          # Utility libraries
│   ├── a11y/                     # Accessibility utilities
│   ├── auth/                     # Authentication context
│   ├── gestures/                 # Touch gesture hooks
│   ├── i18n/                     # Internationalization
│   ├── performance/              # Performance utilities
│   ├── pwa/                      # PWA utilities
│   ├── security/                 # Security utilities
│   ├── store/                    # State management
│   └── validation/               # Form validation
├── messages/                     # i18n translation files
│   ├── en.json                   # English
│   ├── hi.json                   # Hindi
│   └── ta.json                   # Tamil
├── __tests__/                    # Test files
│   ├── api/                      # API route tests
│   ├── components/               # Component tests
│   └── lib/                      # Library tests
└── styles/                       # Global styles
```

---

## Getting Started

### Prerequisites

- Node.js 18.0+
- npm or yarn
- Python 3.10+ (for ML backend)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/gati.git
cd gati

# Install frontend dependencies
npm install

# Start development server
npm run dev
```

### Development Scripts

```bash
# Development
npm run dev           # Start Next.js dev server
npm run build         # Production build
npm run start         # Start production server

# Testing
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run with coverage

# Analysis
npm run analyze       # Bundle size analysis
```

---

## Core Features

### 1. Dashboard
- Real-time anomaly monitoring
- State-wise statistics
- Key performance metrics
- Interactive charts

### 2. Analytics
- Temporal analysis (daily/weekly/monthly/yearly)
- Geographic distribution
- Trend analysis
- Export capabilities

### 3. AI Intelligence Hub
- AI-powered chat assistant
- Anomaly pattern detection
- Predictive analytics
- Natural language queries

### 4. Digital Twin
- 3D India map visualization
- Real-time data overlay
- Hotspot identification
- Interactive exploration

### 5. Field Operations
- Field officer management
- Assignment tracking
- Performance monitoring
- Mobile-first interface

### 6. Audit Trail
- Complete action logging
- User activity tracking
- Export and filtering
- Compliance reporting

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.0.4 | React framework with App Router |
| React | 18.2+ | UI library |
| TypeScript | 5.0+ | Type safety |
| Tailwind CSS | 3.3+ | Styling |
| Framer Motion | 10.0+ | Animations |
| Recharts | 2.10+ | Charts |
| Zustand | 4.0+ | State management |
| React Query | 5.0+ | Server state |
| Zod | 3.22+ | Schema validation |

### Backend (ML)
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | ML runtime |
| FastAPI | 0.100+ | API framework |
| scikit-learn | 1.3+ | ML algorithms |
| TensorFlow | 2.15+ | Deep learning |
| Hugging Face | 4.0+ | LLM integration |

---

## Component Library

### Accessible Components

Located in `src/components/ui/AccessibleComponents.tsx`:

```tsx
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleModal,
  AccessibleAlert,
  AccessibleProgress,
  AccessibleTable,
  SkipLink,
  VisuallyHidden,
} from '@/components/ui/AccessibleComponents'

// Usage
<AccessibleButton
  variant="primary"
  size="md"
  loading={isLoading}
  onClick={handleClick}
>
  Submit
</AccessibleButton>

<AccessibleInput
  label="Email Address"
  type="email"
  error={errors.email}
  hint="Enter your government email"
  required
/>

<AccessibleModal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Action"
>
  Modal content here
</AccessibleModal>
```

### Toast Notifications

Located in `src/components/ui/Toast.tsx`:

```tsx
import { toastSuccess, toastError, toastPromise } from '@/components/ui/Toast'

// Simple notifications
toastSuccess('Record saved successfully')
toastError('Failed to save record')
toastWarning('Please check your input')
toastInfo('New updates available')

// Promise-based
toastPromise(saveData(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed to save',
})
```

### Mobile Charts

Located in `src/components/charts/MobileCharts.tsx`:

```tsx
import {
  MobileChartWrapper,
  ZoomableChartContainer,
  ResponsiveChartHeight,
  MobileChartTooltip,
} from '@/components/charts/MobileCharts'

<MobileChartWrapper
  title="Anomaly Trends"
  subtitle="Last 30 days"
  onRefresh={handleRefresh}
  onExport={handleExport}
>
  <ResponsiveChartHeight
    mobileHeight={200}
    tabletHeight={280}
    desktopHeight={360}
  >
    {(height) => (
      <AreaChart data={data} height={height}>
        {/* Chart configuration */}
      </AreaChart>
    )}
  </ResponsiveChartHeight>
</MobileChartWrapper>
```

---

## State Management

### Global Store (Zustand)

Located in `src/lib/store/appStore.ts`:

```tsx
import { useTheme, useSidebar, useFilters, useNotifications } from '@/lib/store'

// Theme
const { theme, setTheme, toggleTheme } = useTheme()

// Sidebar
const { isCollapsed, toggleSidebar } = useSidebar()

// Filters
const { filters, setFilters, resetFilters } = useFilters()

// Notifications
const { notifications, unreadCount, addNotification, markAsRead } = useNotifications()
```

### Server State (React Query)

Located in `src/lib/store/queryHooks.ts`:

```tsx
import { useStates, useAnomalies, useMLStatus, useAIChat } from '@/lib/store'

// Fetch states data
const { data: states, isLoading } = useStates()

// Fetch anomalies with filters
const { data: anomalies } = useAnomalies({
  state: 'MH',
  startDate: '2024-01-01',
  category: 'demographic',
})

// ML Pipeline status
const { data: mlStatus } = useMLStatus()

// AI Chat mutation
const { mutate: sendMessage } = useAIChat()
sendMessage({ message: 'Show anomaly trends' })
```

---

## API Integration

### API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User authentication |
| `/api/auth/logout` | POST | End session |
| `/api/auth/me` | GET | Get current user |
| `/api/analytics/states` | GET | State-wise data |
| `/api/analytics/anomalies` | GET | Anomaly list |
| `/api/ai-chat` | POST | AI chat interaction |
| `/api/ml/status` | GET | ML pipeline status |
| `/api/ml/train` | POST | Trigger model training |
| `/api/ml/predict` | POST | Get predictions |
| `/api/health` | GET | System health check |

### Fetch Example

```tsx
// Using React Query hooks
const { data, isLoading, error } = useQuery({
  queryKey: ['anomalies', filters],
  queryFn: () => fetch('/api/analytics/anomalies?' + 
    new URLSearchParams(filters)).then(r => r.json()),
})

// Using mutation
const mutation = useMutation({
  mutationFn: (data) => fetch('/api/ml/train', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  onSuccess: () => {
    queryClient.invalidateQueries(['ml-status'])
  },
})
```

---

## Authentication & Security

### Auth Context

Located in `src/lib/auth/authContext.tsx`:

```tsx
import { useAuth } from '@/lib/auth/authContext'

function Dashboard() {
  const { isAuthenticated, user, login, logout } = useAuth()

  if (!isAuthenticated) {
    return <Redirect to="/login" />
  }

  return <DashboardContent user={user} />
}
```

### Security Utilities

Located in `src/lib/security/index.ts`:

```tsx
import {
  generateCSRFToken,
  sanitizeInput,
  createRateLimiter,
  createAuditLogger,
} from '@/lib/security'

// CSRF Protection
const token = await generateCSRFToken()

// Input Sanitization
const safeInput = sanitizeInput(userInput, {
  maxLength: 1000,
  allowedTags: ['b', 'i'],
})

// Rate Limiting
const rateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60000,
})

// Audit Logging
const logger = createAuditLogger('api-route')
logger.log('Action performed', { userId, action })
```

### Credentials (Development)

```
Username: admin
Password: gati@secure2026
Email: admin@gati.gov.in
```

---

## Internationalization (i18n)

### Supported Languages

| Code | Language | Status |
|------|----------|--------|
| en | English | ✅ Complete |
| hi | Hindi (हिन्दी) | ✅ Complete |
| ta | Tamil (தமிழ்) | ✅ Complete |
| te | Telugu | 🔄 Planned |
| bn | Bengali | 🔄 Planned |
| mr | Marathi | 🔄 Planned |
| gu | Gujarati | 🔄 Planned |
| kn | Kannada | 🔄 Planned |
| ml | Malayalam | 🔄 Planned |
| pa | Punjabi | 🔄 Planned |

### Usage

```tsx
import { useLocale, setLocale } from '@/lib/i18n/client'
import en from '@/messages/en.json'

function Component() {
  const locale = useLocale()
  const t = en // In production, load based on locale

  return (
    <div>
      <h1>{t.dashboard.title}</h1>
      <button onClick={() => setLocale('hi')}>
        Switch to Hindi
      </button>
    </div>
  )
}
```

### Adding New Translations

1. Create new file: `src/messages/{locale}.json`
2. Copy structure from `en.json`
3. Translate all values
4. Add locale to `src/lib/i18n/config.ts`

---

## Progressive Web App (PWA)

### Features

- ✅ Offline support
- ✅ Install prompt
- ✅ Push notifications
- ✅ Background sync
- ✅ App shortcuts

### Installation Hook

```tsx
import { useInstallPrompt } from '@/lib/pwa'

function InstallBanner() {
  const { canInstall, promptInstall } = useInstallPrompt()

  if (!canInstall) return null

  return (
    <button onClick={promptInstall}>
      Install GATI App
    </button>
  )
}
```

### Offline Detection

```tsx
import { useOnlineStatus } from '@/lib/pwa'

function App() {
  const isOnline = useOnlineStatus()

  return (
    <div>
      {!isOnline && <OfflineBanner />}
      <MainContent />
    </div>
  )
}
```

### Push Notifications

```tsx
import { subscribeToPush } from '@/lib/pwa'

async function enableNotifications() {
  const subscription = await subscribeToPush()
  // Send subscription to server
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  })
}
```

---

## Accessibility (A11y)

### WCAG 2.1 AA Compliance

GATI is built with accessibility in mind:

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Focus management
- ✅ Color contrast (4.5:1 minimum)
- ✅ ARIA labels and roles
- ✅ Reduced motion support

### Utilities

```tsx
import {
  useFocusTrap,
  useRestoreFocus,
  usePrefersReducedMotion,
  announceToScreenReader,
  getButtonA11yProps,
} from '@/lib/a11y'

// Focus trap for modals
const modalRef = useFocusTrap(isOpen)

// Restore focus on close
useRestoreFocus(isOpen)

// Respect motion preferences
const prefersReducedMotion = usePrefersReducedMotion()

// Announce to screen readers
announceToScreenReader('Data loaded successfully')

// Get ARIA props for buttons
const buttonProps = getButtonA11yProps({
  label: 'Submit form',
  loading: isSubmitting,
  disabled: !isValid,
})
```

### Skip Link

```tsx
import { SkipLink } from '@/components/ui/AccessibleComponents'

function Layout() {
  return (
    <>
      <SkipLink href="#main-content" />
      <Navigation />
      <main id="main-content">
        {/* Page content */}
      </main>
    </>
  )
}
```

---

## Testing

### Test Setup

Tests are configured with Vitest and Testing Library.

### Running Tests

```bash
# Watch mode
npm run test

# Single run
npm run test:run

# With coverage
npm run test:coverage
```

### Writing Tests

```tsx
// Component test
import { render, screen } from '@/__tests__/utils'
import { Dashboard } from '@/app/admin/page'

describe('Dashboard', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Dashboard />, { loading: true })
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
```

### Test Utilities

```tsx
import {
  mockFetchResponse,
  createMockUser,
  createMockAnomaly,
  AllProviders,
} from '@/__tests__/utils'

// Mock API response
mockFetchResponse({ data: [] })

// Create mock data
const user = createMockUser({ role: 'admin' })
const anomaly = createMockAnomaly({ severity: 'high' })

// Render with providers
render(<Component />, { wrapper: AllProviders })
```

---

## Performance Optimization

### Lazy Loading

```tsx
import { createLazyComponent, LazyLoad } from '@/lib/performance'

// Create lazy component
const LazyChart = createLazyComponent(() => import('./Chart'))

// Use LazyLoad wrapper
<LazyLoad fallback={<Skeleton />}>
  <HeavyComponent />
</LazyLoad>
```

### Virtual Lists

```tsx
import { VirtualList } from '@/lib/performance'

<VirtualList
  items={largeDataset}
  itemHeight={60}
  containerHeight={400}
  renderItem={(item) => <ListItem data={item} />}
/>
```

### Image Optimization

```tsx
import { OptimizedImage } from '@/lib/performance'

<OptimizedImage
  src="/images/chart.png"
  alt="Analytics chart"
  width={800}
  height={400}
  priority
/>
```

### Debounce & Throttle

```tsx
import { useDebounce, useThrottle } from '@/lib/performance'

// Debounced search
const debouncedSearch = useDebounce(searchTerm, 300)

// Throttled scroll handler
const throttledScroll = useThrottle(scrollPosition, 100)
```

---

## Mobile Responsiveness

### Breakpoints

```css
/* Tailwind breakpoints */
sm: 640px    /* Small devices */
md: 768px    /* Tablets */
lg: 1024px   /* Desktops */
xl: 1280px   /* Large screens */
2xl: 1536px  /* Extra large */
```

### Mobile Navigation

```tsx
import { MobileNavigation, BottomNavigation } from '@/components/layout'

function Layout({ children }) {
  return (
    <>
      <MobileNavigation />
      <main>{children}</main>
      <BottomNavigation />
    </>
  )
}
```

### Touch Gestures

```tsx
import { useSwipe, usePullToRefresh } from '@/lib/gestures'

// Swipe to open drawer
const ref = useSwipe({
  onSwipeRight: () => openDrawer(),
  onSwipeLeft: () => closeDrawer(),
})

// Pull to refresh
const { containerRef, isRefreshing } = usePullToRefresh(
  async () => await refreshData()
)
```

---

## Deployment

### Build

```bash
# Create production build
npm run build

# Analyze bundle
npm run analyze
```

### Environment Configuration

Create `.env.local` for local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
ML_BACKEND_URL=http://localhost:8000
HF_TOKEN=your_huggingface_token
JWT_SECRET=your_jwt_secret
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Public API base URL |
| `ML_BACKEND_URL` | Yes | ML backend server URL |
| `HF_TOKEN` | Yes | Hugging Face API token |
| `JWT_SECRET` | Yes | JWT signing secret |
| `DATABASE_URL` | No | Database connection string |
| `REDIS_URL` | No | Redis connection for caching |

---

## Troubleshooting

### Common Issues

#### 1. Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### 2. Hydration Mismatch
Ensure server and client render same content:
```tsx
// Use useEffect for client-only code
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return <Skeleton />
```

#### 3. PWA Not Installing
- Check HTTPS is enabled
- Verify manifest.json is valid
- Check service worker registration

#### 4. API Connection Failed
```bash
# Check ML backend is running
curl http://localhost:8000/health

# Verify environment variables
echo $ML_BACKEND_URL
```

### Support

For issues and questions:
- GitHub Issues: [github.com/your-org/gati/issues](https://github.com/your-org/gati/issues)
- Documentation: [docs.gati.gov.in](https://docs.gati.gov.in)
- Email: support@gati.gov.in

---

## License

GATI is proprietary software of the Government of India.
All rights reserved.

---

*Last updated: January 2025*
*Version: 1.0.0*
