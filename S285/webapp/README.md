# City Public Art Live Interaction Panel - Baseline & Improved

This workspace contains two sample projects demonstrating a baseline and an improved implementation of a Live Interaction Panel for a public art installation. Each project is a static HTML app and includes test scripts and execution helpers.

Folders:
- Project_A_BaselineLivePanel - a dense, minimal baseline UI
- Project_B_ImprovedLivePanel - a Tailwind-based, accessible improved UI
- shared/test_scenarios.json - scenario definitions

Quick start:

1. Run all tests and compare results:
   chmod +x run_all.sh
   ./run_all.sh

2. To run a single project tests:
   cd Project_A_BaselineLivePanel
   ./setup.sh
   ./run_tests.sh

Design notes are provided in compare_report.md after running run_all.sh
