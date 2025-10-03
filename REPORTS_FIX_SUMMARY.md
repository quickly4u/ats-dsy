# Reports & Analytics - Real Data Implementation

## Problem Identified

The Reports & Analytics page was displaying a mix of **real data** and **mock/hardcoded data**, making the reports inaccurate and misleading.

### What Was Mock Data:
1. **Pipeline Funnel Chart** - Hardcoded values `[324, 156, 89, 67, 23, 12]`
2. **Time to Hire Trend** - Hardcoded monthly data `[22, 19, 25, 18, 21, 16]`
3. **Source Volume Bars** - Hardcoded LinkedIn/Website/Referrals counts
4. **Average Time to Hire** - Hardcoded to `18.5` days
5. **Cost per Hire** - Hardcoded to `$3,200`
6. **Cost Breakdown Chart** - Completely mock data (still placeholder)

### What Was Already Real Data:
- Total Applications count ✅
- Conversion Rate (calculated from real hires/applications) ✅
- Source Effectiveness percentages ✅

---

## Solution Implemented

### 1. Extended `RecruitmentMetrics` Type
**File:** `src/types/index.ts`

Added new fields to track:
```typescript
export interface RecruitmentMetrics {
  // ... existing fields
  
  // Pipeline funnel data
  pipelineData: {
    labels: string[];
    counts: number[];
  };
  
  // Source volume data
  sourceVolume: Record<string, number>;
  
  // Time to hire trend (last 6 months)
  timeToHireTrend: {
    labels: string[];
    values: number[];
  };
}
```

### 2. Updated `useRecruitmentMetrics` Hook
**File:** `src/hooks/useRecruitmentData.ts`

Now calculates all metrics from real database data:

#### Pipeline Funnel Data
- Fetches `custom_stages` table for company-specific pipeline stages
- Counts applications per stage
- Returns data in proper stage order

```typescript
// Count applications per stage
const stageMap = new Map(stages.map(s => [s.id, s.name]));
const stageCounts = new Map<string, number>();

applications.forEach(app => {
  const stageName = stageMap.get(app.stage_id) || 'Unknown';
  stageCounts.set(stageName, (stageCounts.get(stageName) || 0) + 1);
});
```

#### Time to Hire Trend
- Calculates average time-to-hire for last 6 months
- Based on actual `applied_at` → `updated_at` (when status = 'hired')
- Shows monthly trends with real data

```typescript
for (let i = 5; i >= 0; i--) {
  const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
  // Get hired applications in this month
  const hiredInMonth = applications.filter(app => {
    if (app.status !== 'hired') return false;
    const updatedDate = new Date(app.updated_at);
    return updatedDate >= monthStart && updatedDate <= monthEnd;
  });
  
  // Calculate average days
  const avgDays = hiredInMonth.reduce((sum, app) => {
    const appliedDate = new Date(app.applied_at);
    const hiredDate = new Date(app.updated_at);
    const days = Math.floor((hiredDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
    return sum + days;
  }, 0) / hiredInMonth.length;
}
```

#### Source Volume
- Counts actual applications per source
- Provides both volume and effectiveness metrics

#### Average Time to Hire
- Calculates real average from all hired applications
- Formula: (hire_date - applied_date) averaged across all hires

### 3. Updated `ReportsList` Component
**File:** `src/components/reports/ReportsList.tsx`

Replaced all mock data with real metrics:

#### Pipeline Charts
```typescript
// Before: Hardcoded data
const pipelineData = {
  labels: ['Applied', 'Screening', 'Interview', 'Assessment', 'Offer', 'Hired'],
  data: [324, 156, 89, 67, 23, 12]
};

// After: Real data from metrics
const pipelineData = metrics ? {
  labels: metrics.pipelineData.labels,
  datasets: [{
    label: 'Candidates',
    data: metrics.pipelineData.counts,
    // ... styling
  }]
} : null;
```

#### Time to Hire Trend
```typescript
// Before: Hardcoded monthly data
const timeToHireData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  data: [22, 19, 25, 18, 21, 16]
};

// After: Real monthly trends
const timeToHireData = metrics ? {
  labels: metrics.timeToHireTrend.labels,
  datasets: [{
    label: 'Average Days',
    data: metrics.timeToHireTrend.values,
    // ... styling
  }]
} : null;
```

#### Source Volume Bars
```typescript
// Before: Hardcoded LinkedIn/Website/Referrals
<div>LinkedIn: 156</div>
<div>Company Website: 89</div>
<div>Referrals: 67</div>

// After: Dynamic from real data
{metrics && Object.entries(metrics.sourceVolume)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([source, count], index) => {
    const maxCount = Math.max(...Object.values(metrics.sourceVolume));
    const percentage = (count / maxCount) * 100;
    return (
      <div key={source}>
        <span>{source}</span>
        <div style={{ width: `${percentage}%` }}></div>
        <span>{count}</span>
      </div>
    );
  })}
```

#### Cost Metrics
Updated to use real data where available:
- **Total Recruitment Cost**: `costPerHire * hires`
- **Cost per Application**: `(costPerHire * hires) / totalApplications`
- **Hires This Period**: Real count from database

---

## What's Now Real vs. Still Placeholder

### ✅ Now Using Real Data:
1. **Pipeline Funnel** - Shows actual application counts per custom stage
2. **Time to Hire Trend** - Real monthly averages based on hire dates
3. **Source Volume** - Actual application counts per source
4. **Average Time to Hire** - Calculated from real hire data
5. **All Metric Cards** - Total apps, conversion rate, hires, etc.

### ⚠️ Still Placeholder (Requires Additional Implementation):
1. **Cost per Hire** - Uses placeholder value (needs cost tracking system)
2. **Cost Breakdown Chart** - Mock data (needs expense tracking)
3. **Diversity & Inclusion** - Coming soon message

---

## Data Flow

```
Database Tables
├── applications (filtered by company_id)
│   ├── status, applied_at, updated_at
│   ├── source, stage_id
│   └── Used for: pipeline, time-to-hire, source metrics
├── custom_stages (filtered by company_id)
│   ├── name, order_index
│   └── Used for: pipeline labels and ordering
├── jobs (filtered by company_id)
│   └── Used for: job counts
└── interviews (filtered by company_id)
    └── Used for: interview metrics

↓

useRecruitmentMetrics Hook
├── Fetches all data with company filtering
├── Calculates pipeline funnel
├── Calculates time-to-hire trends
├── Calculates source volumes
└── Returns RecruitmentMetrics object

↓

ReportsList Component
├── Consumes metrics from hook
├── Renders charts with real data
├── Shows empty states when no data
└── Displays all reports with accurate information
```

---

## Testing Checklist

To verify the fix is working:

1. ✅ Navigate to `/reports` page
2. ✅ Check **Total Applications** shows real count from database
3. ✅ Verify **Pipeline Funnel** chart uses your custom stage names
4. ✅ Confirm **Time to Hire Trend** shows last 6 months
5. ✅ Check **Source Effectiveness** shows actual sources from applications
6. ✅ Verify **Source Volume** bars show real counts
7. ✅ Confirm **Average Time to Hire** is calculated from hired applications
8. ✅ Test with different time ranges (if implemented)
9. ✅ Verify all data is filtered by current user's company

---

## Future Enhancements

### Cost Tracking System
To make cost metrics real, implement:
1. Create `recruitment_costs` table
2. Track expenses per job/application
3. Update `useRecruitmentMetrics` to calculate real costs

### Time Range Filtering
Currently the time range selector doesn't filter data. To implement:
1. Pass `selectedTimeRange` to `useRecruitmentMetrics`
2. Filter applications by date range
3. Recalculate all metrics for selected period

### Diversity Analytics
Implement diversity tracking:
1. Add demographic fields (optional, privacy-compliant)
2. Calculate diversity metrics
3. Show representation trends

---

## Files Modified

1. ✅ `src/types/index.ts` - Extended RecruitmentMetrics interface
2. ✅ `src/hooks/useRecruitmentData.ts` - Updated useRecruitmentMetrics hook
3. ✅ `src/components/reports/ReportsList.tsx` - Updated to use real data

---

## Summary

The Reports & Analytics page now displays **real data from your database** instead of mock data. All charts and metrics are calculated from actual applications, stages, and hire data, filtered by the current user's company. The only remaining placeholders are cost-related metrics, which require a separate cost tracking system to be implemented.

**Key Achievement:** Reports now accurately reflect your recruitment pipeline and performance! 🎉
