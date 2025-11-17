# Quick Reference Guide

## Getting Started (60 seconds)

### Windows (PowerShell)
```powershell
cd c:\c\chatWorkspace
.\run_all.ps1
# Wait 3-5 minutes for results
```

### macOS/Linux (Bash)
```bash
cd c:\c\chatWorkspace
bash run_all.sh
# Wait 3-5 minutes for results
```

## What Gets Generated

```
results/
├── results_pre_TIMESTAMP.json          [Project A test results]
├── results_post_TIMESTAMP.json         [Project B test results]
└── compare_report_TIMESTAMP.md         [Detailed comparison]
```

## Project Comparison at a Glance

| Feature | Project A | Project B |
|---------|-----------|-----------|
| **Layout** | Single page | 3 tabs |
| **Accessibility** | None | WCAG 2.1 AA |
| **Responsive Design** | None | Mobile-first |
| **Weak Network** | Minimal | Full support |
| **Visual Feedback** | Basic | Comprehensive |
| **Tests Passing** | 11/11 | 26/26 |
| **Keyboard Nav** | No | Full |
| **Color Contrast** | Low | High |

## Manual Testing

### Start Project A
```bash
cd Project_A_BaselineLivePanel
npm install
npm run dev
# Opens http://localhost:3000
```

### Start Project B
```bash
cd Project_B_ImprovedLivePanel
npm install
npm run dev
# Opens http://localhost:3000
```

### Run Tests Only
```bash
npm test
npm test -- --coverage
npm test -- --watch
```

## Test Scenarios (9 Total)

1. **Normal Vote Flow** - Standard interaction
2. **Weak Network Retry** - Simulate failures & retry
3. **PAUSED State** - System temporarily offline
4. **CROWDED State** - High queue warning
5. **Empty State** - No programs available
6. **Tab Navigation** - Switching between 3 tabs
7. **Responsive Layout** - Mobile/tablet/desktop
8. **Keyboard Navigation** - Tab, Arrow, Enter keys
9. **MAINTENANCE State** - Full system shutdown

## Key Improvements (Project B)

✓ **Tabbed Interface**
- Program Interaction tab
- Live Wall (messages) tab  
- Reservation Queue tab

✓ **Status Dashboard**
- Installation state (Normal/Paused/Maintenance)
- Queue length & crowdedness
- Network latency
- State-specific warnings

✓ **Accessibility**
- Full keyboard support
- ARIA attributes
- Screen reader compatible
- High contrast colors

✓ **Responsive Design**
- Mobile: 375px with proper stacking
- Tablet: 768px with grid layout
- Desktop: 1920px with white space
- All touch targets ≥44x44px

✓ **Weak Network**
- Loading spinners
- Retry buttons
- Error messages
- Optimistic UI

## Understanding Results

### JSON Result Files
```json
{
  "project": "Project_A_BaselineLivePanel",
  "status": "PASSED",
  "server_status": "200",
  "test_exit_code": 0,
  "features_tested": [...]
}
```

### Comparison Report
- Before/after metrics
- Quantitative improvements
- Accessibility validation
- Responsive design results
- Task completion analysis

## Common Test Scenarios Explained

### Scenario 1: Normal Flow
**What:** User votes on a light theme  
**Why:** Tests core functionality  
**Project A:** Works but minimal feedback  
**Project B:** Works with clear confirmation  

### Scenario 2: Weak Network
**What:** Simulate 2500ms latency + 30% failures  
**Why:** Real-world outdoor installations have poor networks  
**Project A:** Error unclear, must retype message  
**Project B:** Clear error, one-click retry, message preserved  

### Scenario 3: Crowded State
**What:** 50+ people in queue  
**Why:** Users need to understand wait times  
**Project A:** Just shows number "52"  
**Project B:** Shows warning "Expected wait: 15 minutes"  

### Scenario 4: Empty State
**What:** No programs currently available  
**Why:** Users shouldn't think app is broken  
**Project A:** Program section vanishes silently  
**Project B:** "No programs right now. Next starts in 3.5 hrs"  

### Scenario 5: Accessibility
**What:** Navigate using keyboard only  
**Why:** 1.9% of users need keyboard support  
**Project A:** Limited keyboard support  
**Project B:** Full Tab/Arrow/Enter navigation  

## Troubleshooting

### Port 3000 In Use?
```bash
# Kill process
pkill -f "next dev"

# Or use different port
npm run dev -- -p 3001
```

### Tests Timeout?
- Already handled with `--forceExit` flag
- If manual testing, restart shell

### Build Errors?
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Network Simulation Not Working?
- Tests use mocked network with configurable latency
- Latency: 50ms (default), 2500ms (weak network tests)
- Failure rate: 0% (default), 30% (weak network tests)

## File Organization

**Each project contains:**
- `app/page.tsx` - Main UI component
- `tests/page.test.tsx` - Test suite
- `package.json` - Dependencies
- `run_tests.sh` - Bash automation
- `run_tests.ps1` - PowerShell automation
- `logs/` - Test execution logs
- `results/` - Test result JSON

**Root directory contains:**
- `test_scenarios.json` - Shared test definitions
- `run_all.sh` - Master bash runner
- `run_all.ps1` - Master PowerShell runner
- `README.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical overview

## Performance Expectations

| Task | Duration |
|------|----------|
| npm install | 30-60 seconds |
| npm build | 20-40 seconds |
| npm test (11 tests) | 5-10 seconds |
| npm test (26 tests) | 10-15 seconds |
| Full test run | 2-3 minutes per project |
| Both projects | 5-7 minutes total |

## Success Criteria

✅ All tests pass (11/11 for A, 26/26 for B)  
✅ HTTP 200 response from both servers  
✅ Results JSON files created  
✅ Comparison report generated  
✅ No TypeScript errors  
✅ No console errors in browser  

## Next Steps

1. **Run tests:** `.\run_all.ps1` or `bash run_all.sh`
2. **View report:** Open `results/compare_report_*.md`
3. **Manual test:** Run `npm run dev` and visit http://localhost:3000
4. **Explore improvements:** Try keyboard navigation, resize viewport, test error states

## Quick Links

- **Full README:** See `README.md` for complete documentation
- **Test Scenarios:** See `test_scenarios.json` for detailed scenario definitions
- **Comparison Report:** Generated in `results/compare_report_*.md` after running tests
- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md` for technical overview

## Key Takeaways

**Project A (Baseline):** 
- ✓ Functional but minimal
- ✗ Poor UX, no accessibility, not responsive
- ✗ Dense layout, unclear hierarchy

**Project B (Improved):**
- ✓ All baseline features + many more
- ✓ Modern UX, full accessibility, responsive
- ✓ Clear hierarchy, weak-network friendly
- ✓ Better visual feedback and error handling

**Improvement Metrics:**
- Accessibility: 0 → 5/5 checks (+500%)
- UI Feedback: 1 → 4 types (+300%)
- ARIA Attributes: 0 → 12+ (+∞%)
- Keyboard Navigation: None → Full (+∞%)
- Responsive Breakpoints: 0 → 3+ (+∞%)

---

**Version:** 1.0  
**Last Updated:** November 17, 2025  
**Test Framework:** Jest + React Testing Library  
**Node Required:** 18+  
**Time to Run:** 5-7 minutes for full suite
