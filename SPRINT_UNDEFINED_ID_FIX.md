# Sprint Undefined ID Fix

## Problem

The sprint detail page was making API calls with `undefined` as the sprint ID, resulting in errors like:
- `/api/sprints/undefined/burndown` - Cast to ObjectId failed
- `/api/sprints/undefined/start` - Cast to ObjectId failed

## Root Cause

1. **Route Parameter Not Available**: The `id` from `useParams()` could be `undefined` if the route parameter wasn't properly set
2. **ID Field Mismatch**: Sprint objects from the backend might have `_id` instead of `id`, causing navigation issues
3. **No Validation**: The frontend wasn't validating the sprint ID before making API calls

## Solution

### 1. **SprintDetail.jsx** - Added ID Validation
- Normalize the sprint ID: `const sprintId = id && id !== 'undefined' ? id : null`
- Added early return if `sprintId` is invalid (after hooks to follow React rules)
- Added validation in all handlers (`handleStart`, `handleComplete`, `handleUpdate`)
- Updated all references to use `sprintId` instead of `id`

### 2. **SprintCard.jsx** - Handle Both `id` and `_id`
- Normalize sprint ID: `const sprintId = sprint.id || sprint._id`
- Added validation before navigation
- Added error logging if sprint ID is missing

### 3. **sprintService.js** - API Validation
- Added validation in `startSprint()` to throw error if ID is invalid
- Added validation in `getSprintBurndown()` to throw error if ID is invalid

## Files Changed

1. `/frontend/src/pages/sprints/SprintDetail.jsx`
   - Added `sprintId` normalization
   - Added validation in all handlers
   - Updated all ID references

2. `/frontend/src/components/sprints/SprintCard.jsx`
   - Added `sprintId` normalization (handles both `id` and `_id`)
   - Added validation before navigation

3. `/frontend/src/services/api/sprintService.js`
   - Added ID validation in `startSprint()`
   - Added ID validation in `getSprintBurndown()`

## Testing

To verify the fix:

1. **Navigate to Sprint Detail**:
   - Go to Sprints list
   - Click on any sprint card
   - Should navigate to `/sprints/{valid-id}` (not `/sprints/undefined`)

2. **Test Burndown Tab**:
   - Open sprint detail
   - Click "Burndown" tab
   - Should load burndown data without errors

3. **Test Start Sprint**:
   - Open a planned sprint
   - Click "Start Sprint" button
   - Should start sprint without errors

4. **Check Browser Console**:
   - No errors about "undefined" IDs
   - No "Cast to ObjectId failed" errors in backend logs

## Prevention

The fix includes:
- ✅ ID validation before API calls
- ✅ Normalization of `id` vs `_id` fields
- ✅ Early returns for invalid IDs
- ✅ Error messages for users
- ✅ Console logging for debugging

## Related Issues

- Backend logs showing: `Cast to ObjectId failed for value "undefined"`
- Frontend making requests to `/api/sprints/undefined/*`
- Sprint detail page not loading properly

All of these should now be resolved.

