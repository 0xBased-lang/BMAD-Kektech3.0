#!/bin/bash

echo "=== COMPREHENSIVE ERROR CATEGORIZATION ==="
echo ""

echo "1. INTERFACE ERRORS (function not found):"
grep -i "is not a function\|Cannot read properties" test-output.log | sort | uniq -c | sort -rn

echo ""
echo "2. REVERT ERRORS (contract reverted):"
grep -i "reverted with reason" test-output.log | sed 's/.*reverted with reason string//' | sort | uniq -c | sort -rn

echo ""
echo "3. ASSERTION ERRORS (test expectations):"
grep -i "AssertionError:" test-output.log | sed 's/.*AssertionError: //' | head -20

echo ""
echo "4. EXPECTED vs ACTUAL ERRORS:"
grep -E "expected.*actual|Expected.*to" test-output.log | head -20

echo ""
echo "5. PARAMETER ERRORS:"
grep -i "missing argument\|types/values length mismatch" test-output.log | sort | uniq -c

echo ""
echo "6. UNIQUE ERROR PATTERNS:"
grep -iE "Error:|TypeError:|AssertionError:" test-output.log | sed 's/.*Error: //' | sed 's/.*TypeError: //' | sed 's/.*AssertionError: //' | sort | uniq -c | sort -rn | head -30

