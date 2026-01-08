# GATI Component Documentation

## UI Component Library Reference

This document provides detailed documentation for all UI components in the GATI platform.

---

## Table of Contents

1. [Accessible Components](#accessible-components)
2. [Form Components](#form-components)
3. [Layout Components](#layout-components)
4. [Chart Components](#chart-components)
5. [Toast Notifications](#toast-notifications)
6. [Utility Components](#utility-components)

---

## Accessible Components

### AccessibleButton

A fully accessible button component with multiple variants and states.

```tsx
import { AccessibleButton } from '@/components/ui/AccessibleComponents'

<AccessibleButton
  variant="primary"    // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size="md"           // 'sm' | 'md' | 'lg'
  loading={false}     // Shows spinner when true
  disabled={false}    // Disables the button
  fullWidth={false}   // Takes full width of container
  leftIcon={<Icon />} // Icon on the left
  rightIcon={<Icon />}// Icon on the right
  onClick={handleClick}
>
  Button Text
</AccessibleButton>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `'primary'` | Visual style variant |
| `size` | string | `'md'` | Button size |
| `loading` | boolean | `false` | Shows loading spinner |
| `disabled` | boolean | `false` | Disables button |
| `fullWidth` | boolean | `false` | Full width button |
| `leftIcon` | ReactNode | - | Icon before text |
| `rightIcon` | ReactNode | - | Icon after text |
| `type` | string | `'button'` | HTML button type |

**Accessibility:**
- Proper ARIA attributes automatically applied
- Loading state announced to screen readers
- Focus visible styling for keyboard users

---

### AccessibleInput

A text input with proper labeling and error handling.

```tsx
import { AccessibleInput } from '@/components/ui/AccessibleComponents'

<AccessibleInput
  label="Email Address"
  type="email"
  name="email"
  value={email}
  onChange={handleChange}
  error={errors.email}
  hint="Enter your government email address"
  required
  autoComplete="email"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | **required** | Input label text |
| `name` | string | **required** | Input name attribute |
| `type` | string | `'text'` | Input type |
| `error` | string | - | Error message to display |
| `hint` | string | - | Helper text below input |
| `required` | boolean | `false` | Mark as required |
| `disabled` | boolean | `false` | Disable input |
| `leftIcon` | ReactNode | - | Icon inside left of input |
| `rightIcon` | ReactNode | - | Icon inside right of input |

**Accessibility:**
- Label properly associated with input via `htmlFor`
- Error messages linked via `aria-describedby`
- Invalid state indicated via `aria-invalid`

---

### AccessibleModal

A focus-trapped modal dialog.

```tsx
import { AccessibleModal } from '@/components/ui/AccessibleComponents'

<AccessibleModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  description="This action cannot be undone"
  size="md"
>
  <p>Modal content here</p>
  <AccessibleButton onClick={handleConfirm}>
    Confirm
  </AccessibleButton>
</AccessibleModal>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | boolean | **required** | Modal visibility |
| `onClose` | function | **required** | Close handler |
| `title` | string | **required** | Modal title |
| `description` | string | - | Optional description |
| `size` | string | `'md'` | `'sm'`, `'md'`, `'lg'`, `'xl'`, `'full'` |
| `closeOnOverlay` | boolean | `true` | Close on backdrop click |
| `showCloseButton` | boolean | `true` | Show X button |

**Accessibility:**
- Focus trap when open
- Escape key closes modal
- Focus restored on close
- Proper ARIA dialog role

---

### AccessibleAlert

Notification alerts with proper ARIA live regions.

```tsx
import { AccessibleAlert } from '@/components/ui/AccessibleComponents'

<AccessibleAlert
  type="success"
  title="Operation Complete"
  dismissible
  onDismiss={handleDismiss}
>
  Your changes have been saved successfully.
</AccessibleAlert>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | `'info'` | `'info'`, `'success'`, `'warning'`, `'error'` |
| `title` | string | - | Alert title |
| `dismissible` | boolean | `false` | Show close button |
| `onDismiss` | function | - | Dismiss handler |

**Accessibility:**
- Uses `role="alert"` for important messages
- `aria-live="polite"` for announcements

---

### AccessibleProgress

Progress indicator with proper labeling.

```tsx
import { AccessibleProgress } from '@/components/ui/AccessibleComponents'

<AccessibleProgress
  value={75}
  max={100}
  label="Upload Progress"
  showValue
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | number | **required** | Current value |
| `max` | number | `100` | Maximum value |
| `label` | string | **required** | Accessible label |
| `showValue` | boolean | `false` | Show percentage text |
| `variant` | string | `'primary'` | Color variant |

**Accessibility:**
- Uses `role="progressbar"`
- Proper `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

---

### AccessibleTable

Data table with proper header associations.

```tsx
import { AccessibleTable } from '@/components/ui/AccessibleComponents'

<AccessibleTable
  caption="Anomaly Reports - January 2025"
  columns={[
    { key: 'id', label: 'ID' },
    { key: 'state', label: 'State' },
    { key: 'severity', label: 'Severity' },
    { key: 'date', label: 'Date' },
  ]}
  data={anomalies}
  sortable
  onSort={handleSort}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `caption` | string | **required** | Table caption |
| `columns` | array | **required** | Column definitions |
| `data` | array | **required** | Row data |
| `sortable` | boolean | `false` | Enable column sorting |
| `onSort` | function | - | Sort handler |
| `onRowClick` | function | - | Row click handler |

---

## Form Components

### useValidatedForm

Hook for form validation with Zod schemas.

```tsx
import { useValidatedForm } from '@/lib/validation/hooks'
import { loginSchema } from '@/lib/validation/schemas'

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useValidatedForm(loginSchema, {
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (data) => {
    // data is fully typed and validated
    await login(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('username')} />
      {errors.username && <span>{errors.username.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        Login
      </button>
    </form>
  )
}
```

### Available Schemas

```tsx
import {
  loginSchema,
  changePasswordSchema,
  searchSchema,
  dateRangeSchema,
  anomalyReportSchema,
  fieldOfficerSchema,
  chatMessageSchema,
  exportConfigSchema,
  notificationSettingsSchema,
  aadhaarSchema,
  pinCodeSchema,
  stateCodeSchema,
} from '@/lib/validation/schemas'
```

---

## Layout Components

### MobileNavigation

Mobile-optimized hamburger menu and navigation drawer.

```tsx
import { MobileNavigation, BottomNavigation } from '@/components/layout'

function RootLayout({ children }) {
  return (
    <>
      <MobileNavigation />
      <main>{children}</main>
      <BottomNavigation />
    </>
  )
}
```

**Features:**
- Hamburger menu button
- Slide-out drawer navigation
- User profile section
- Notifications badge
- Safe area support for notched devices

---

### ResponsiveSidebar

Desktop sidebar with collapse functionality.

```tsx
import { ResponsiveSidebar, MiniSidebar } from '@/components/layout'

function Layout({ children }) {
  return (
    <div className="flex">
      {/* Desktop: Full sidebar */}
      <ResponsiveSidebar />
      
      {/* Tablet: Mini sidebar */}
      <MiniSidebar />
      
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

**Features:**
- Collapsible to icons only
- Hover tooltips in collapsed state
- Navigation groups
- Active state highlighting

---

## Chart Components

### MobileChartWrapper

Wrapper for charts with mobile optimization.

```tsx
import { MobileChartWrapper } from '@/components/charts/MobileCharts'

<MobileChartWrapper
  title="Anomaly Trends"
  subtitle="Last 30 days"
  onRefresh={async () => await refetch()}
  onExport={() => downloadCSV()}
  loading={isLoading}
  error={error?.message}
  info="Double-tap to expand chart"
>
  <LineChart data={data} />
</MobileChartWrapper>
```

**Features:**
- Fullscreen expansion
- Pull to refresh
- Export button
- Loading and error states
- Double-tap to expand

---

### ZoomableChartContainer

Container with pinch-to-zoom support.

```tsx
import { ZoomableChartContainer } from '@/components/charts/MobileCharts'

<ZoomableChartContainer minScale={0.5} maxScale={3}>
  <ComplexChart data={data} />
</ZoomableChartContainer>
```

**Features:**
- Pinch to zoom (2-finger)
- Double-tap to reset
- Pan when zoomed
- Zoom level indicator

---

### ResponsiveChartHeight

Adaptive chart height based on viewport.

```tsx
import { ResponsiveChartHeight } from '@/components/charts/MobileCharts'

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
```

---

## Toast Notifications

### Basic Usage

```tsx
import {
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo,
  toastLoading,
  toastPromise,
} from '@/components/ui/Toast'

// Simple notifications
toastSuccess('Record saved!')
toastError('Failed to save')
toastWarning('Check your input')
toastInfo('New updates available')

// Loading toast
const id = toastLoading('Saving...')
// Later: toast.dismiss(id)

// Promise-based (auto-updates)
toastPromise(saveData(), {
  loading: 'Saving record...',
  success: 'Record saved successfully!',
  error: 'Failed to save record',
})
```

### With Options

```tsx
toastSuccess('Saved!', {
  duration: 5000,
  description: 'Your changes have been saved',
})

toastError('Error', {
  duration: Infinity, // Stays until dismissed
  action: {
    label: 'Retry',
    onClick: () => retry(),
  },
})
```

### Toaster Provider

Add to your layout:

```tsx
import { Toaster } from '@/components/ui/Toast'

function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </body>
    </html>
  )
}
```

---

## Utility Components

### SkipLink

Skip to main content link for keyboard users.

```tsx
import { SkipLink } from '@/components/ui/AccessibleComponents'

<SkipLink href="#main-content" />
<nav>...</nav>
<main id="main-content">...</main>
```

---

### VisuallyHidden

Hide content visually but keep accessible.

```tsx
import { VisuallyHidden } from '@/components/ui/AccessibleComponents'

<button>
  <SearchIcon />
  <VisuallyHidden>Search</VisuallyHidden>
</button>
```

---

### LazyLoad

Lazy load components on intersection.

```tsx
import { LazyLoad } from '@/lib/performance'

<LazyLoad fallback={<Skeleton height={400} />}>
  <HeavyChart data={data} />
</LazyLoad>
```

---

### VirtualList

Virtualized list for large datasets.

```tsx
import { VirtualList } from '@/lib/performance'

<VirtualList
  items={thousandsOfItems}
  itemHeight={48}
  containerHeight={500}
  overscan={5}
  renderItem={(item, index) => (
    <ListItem key={item.id} data={item} />
  )}
/>
```

---

## Design Tokens

### Colors

```css
/* Primary Colors */
--gati-primary: #0FA0A0     /* Teal */
--gati-secondary: #1A237E   /* Navy */

/* Indian Tricolor */
--gati-saffron: #FF9933
--gati-green: #138808
--gati-blue: #000080

/* Semantic Colors */
--success: #22C55E
--warning: #F59E0B
--error: #EF4444
--info: #3B82F6
```

### Spacing

```css
/* Based on 4px scale */
1: 0.25rem  (4px)
2: 0.5rem   (8px)
3: 0.75rem  (12px)
4: 1rem     (16px)
6: 1.5rem   (24px)
8: 2rem     (32px)
12: 3rem    (48px)
16: 4rem    (64px)
```

### Typography

```css
/* Font Families */
--font-display: 'Plus Jakarta Sans', sans-serif
--font-body: 'Inter', sans-serif
--font-mono: 'JetBrains Mono', monospace

/* Font Sizes */
xs: 0.75rem   (12px)
sm: 0.875rem  (14px)
base: 1rem    (16px)
lg: 1.125rem  (18px)
xl: 1.25rem   (20px)
2xl: 1.5rem   (24px)
3xl: 1.875rem (30px)
4xl: 2.25rem  (36px)
```

---

## Best Practices

### 1. Use Semantic Elements

```tsx
// ✅ Good
<nav>
  <ul>
    <li><Link href="/">Home</Link></li>
  </ul>
</nav>

// ❌ Avoid
<div onClick={navigate}>Home</div>
```

### 2. Always Provide Labels

```tsx
// ✅ Good
<AccessibleInput label="Email" name="email" />

// ❌ Avoid
<input placeholder="Email" />
```

### 3. Handle Loading States

```tsx
// ✅ Good
<AccessibleButton loading={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</AccessibleButton>

// ❌ Avoid
<button disabled={isLoading}>Save</button>
```

### 4. Provide Error Feedback

```tsx
// ✅ Good
{error && (
  <AccessibleAlert type="error">
    {error.message}
  </AccessibleAlert>
)}

// ❌ Avoid
{error && <span style={{color: 'red'}}>{error}</span>}
```

---

*Last updated: January 2025*
*Version: 1.0.0*
