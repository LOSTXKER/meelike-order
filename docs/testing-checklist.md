# Testing Checklist - MIMS Phase 2

## ✅ Pre-Deployment Testing

### 1. Authentication & Authorization
- [ ] Login with admin@meelike.com
- [ ] Login with support.a@meelike.com
- [ ] Logout and login again
- [ ] Verify role-based sidebar links

### 2. Dashboard
- [ ] View dashboard stats (total cases, in progress, etc.)
- [ ] Check recent cases list
- [ ] Check critical cases alert
- [ ] SLA overview working
- [ ] Provider issues section

### 3. Cases Management
- [ ] View cases list
- [ ] Filter by status
- [ ] Filter by severity
- [ ] Search cases
- [ ] Click to view case detail
- [ ] Check Timeline working
- [ ] Add note to case
- [ ] Change case status

### 4. Create New Case
- [ ] Go to /cases/new
- [ ] Fill all required fields
- [ ] Select case type
- [ ] Select provider
- [ ] Submit form
- [ ] Verify case appears in list

### 5. Reports Page
- [ ] View all KPI cards
- [ ] Check Monthly Trend chart renders
- [ ] Check Pie chart (status)
- [ ] Check Bar charts (category & severity)
- [ ] Top providers table
- [ ] Team performance table

### 6. Team Page
- [ ] View team stats
- [ ] Check top 3 performers
- [ ] Verify 🏆 medal on #1
- [ ] Full team table with progress bars
- [ ] Progress bars showing correctly

### 7. Providers Page
- [ ] View providers list
- [ ] Check statistics (cases, resolution time, refund rate)
- [ ] Risk level badges

### 8. Settings - Case Types
- [ ] View existing case types
- [ ] Click "เพิ่มประเภทเคส"
- [ ] Fill form with test data
- [ ] Submit
- [ ] Verify new type in table
- [ ] Check it appears in cases/new dropdown

### 9. Settings - Notifications
- [ ] **Templates Tab**:
  - [ ] View existing templates
  - [ ] Create new template
  - [ ] Use variable insert buttons
  - [ ] Submit and verify
  
- [ ] **Line Channels Tab**:
  - [ ] View existing channels (if any)
  - [ ] Try to add new channel (can use dummy token for testing)
  - [ ] Select events
  - [ ] Submit and verify card appears

### 10. Dark/Light Mode
- [ ] Toggle theme from sidebar
- [ ] Verify all pages switch correctly
- [ ] Check charts visibility in both modes

### 11. Responsive Design
- [ ] Open on mobile size (375px)
- [ ] Collapse sidebar
- [ ] Test navigation
- [ ] Check tables scroll horizontally

---

## 🐛 Known Issues to Check

1. [ ] No errors in browser console
2. [ ] No 404s in network tab
3. [ ] All images/icons load
4. [ ] No TypeScript errors
5. [ ] All API calls return 200 (except expected errors)

---

## 📊 Performance Check

1. [ ] Dashboard loads < 3s
2. [ ] Cases page loads < 2s
3. [ ] Reports page loads < 3s
4. [ ] No memory leaks (check DevTools)

---

## ✅ Ready for Production

Once all checkboxes are ticked:
- [ ] All features working
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Ready to deploy!

**Next Step**: Follow `docs/deployment-guide.md`


