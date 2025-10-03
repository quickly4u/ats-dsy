# Add Applicants Feature - Implementation Summary

## Overview
Added a new "Add Applicants" tab to the Job Profile page that allows users to browse all available candidates, filter them by various criteria, and either apply them to the job or send them for AI evaluation.

## Features Implemented

### 1. New Tab in Job Profile Page
- Added "Add Applicants" tab alongside Overview, Applications, and History tabs
- Uses UserPlus icon for visual distinction
- Automatically refreshes applications list when a candidate is applied

### 2. Candidate Listing & Filtering
The new tab displays all candidates from the company's talent pool with comprehensive filtering options:

#### Search Functionality
- Search by candidate name, email, or skills
- Real-time filtering as you type

#### Advanced Filters
- **Skills Filter**: Add multiple skills to filter candidates who have all specified skills
- **Location Filter**: Filter by candidate location/city
- **Experience Range**: Dual slider to set minimum and maximum years of experience (0-50 years)
- Reset filters option to clear all criteria

#### Display Information
Each candidate card shows:
- Avatar or initials
- Full name and email
- Current job title and company
- Location
- Years of experience
- Top 5 skills (with indicator for additional skills)

### 3. Three Action CTAs per Candidate

#### View Profile Button
- Opens the candidate's full profile in a modal
- Allows users to review complete candidate information before applying
- Modal can be closed to return to the same Add Applicants tab
- Maintains filter state and scroll position when returning

#### Apply to Job Button
- Applies the candidate to the current job
- Creates an application record in the database with:
  - Job ID
  - Candidate ID
  - Status: 'new'
  - Source: 'Manual'
  - Applied timestamp
  - Company ID
- Shows success/error feedback
- Disabled state while processing

#### Evaluate Button
- Sends candidate and job data to AI evaluation webhook
- Webhook URL: `https://n8n.srv1025472.hstgr.cloud/webhook/63163493-b695-4634-b382-fa6991dc2c8e`
- Payload includes:
  - Complete candidate data (profile, skills, experience, etc.)
  - Complete job data (requirements, description, etc.)
  - Timestamp
- Shows success/error feedback
- Disabled state while processing

## Files Created/Modified

### Created Files
1. **`/src/components/jobs/AddApplicantsTab.tsx`**
   - Main component for the Add Applicants functionality
   - Handles candidate filtering logic
   - Manages Apply and Evaluate actions
   - Responsive UI with loading states

### Modified Files
1. **`/src/components/jobs/JobProfilePage.tsx`**
   - Added new tab to the tab navigation
   - Integrated AddApplicantsTab component
   - Added callback to refresh applications list
   - Imported UserPlus icon

## Technical Details

### Data Flow
1. Candidates are fetched using the existing `useCandidates` hook
2. Filtering is done client-side for better performance
3. Applications are created directly in Supabase
4. Webhook calls are made via fetch API with proper error handling

### Filtering Logic
- **Search**: Matches against name, email, and skills (case-insensitive)
- **Skills**: AND logic - candidate must have ALL specified skills
- **Experience**: Inclusive range filter
- **Location**: Partial match against location or city fields

### UI/UX Features
- Collapsible filter panel
- Visual feedback for active filters
- Loading states for async operations
- Disabled states to prevent duplicate submissions
- Result count display
- Responsive grid layout

## Usage

1. Navigate to any job's profile page
2. Click on the "Add Applicants" tab
3. Use search and filters to find suitable candidates
4. For each candidate:
   - Click "View Profile" to see complete candidate details
   - Click "Apply to Job" to create an application
   - Click "Evaluate" to send for AI evaluation
5. Applications tab will automatically update with new applications
6. When viewing a profile, close the modal to return to the filtered candidate list

## Future Enhancements (Optional)
- Bulk apply multiple candidates at once
- Save filter presets
- Show which candidates are already applied to this job
- Display evaluation results from webhook
- Add candidate comparison view
