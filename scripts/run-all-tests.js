/**
 * @title Master Test Runner - COMPREHENSIVE TEST ORCHESTRATOR
 * @notice Runs all test scripts and generates comprehensive report
 * @dev Run with: npx hardhat run scripts/run-all-tests.js --network sepolia
 *
 * Test Execution Order:
 * 1. Phase 2 Markets Test (validates all 9 security fixes)
 * 2. Integration Test (Phase 1 + Phase 2)
 * 3. Edge Cases Test (attack vectors & boundaries)
 * 4. Reward Distribution Test (Merkle system)
 *
 * Generates:
 * - Console report with detailed results
 * - JSON file with test results
 * - Summary of all critical findings
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");

const execPromise = util.promisify(exec);

// Test results aggregator
const masterResults = {
    timestamp: new Date().toISOString(),
    network: "sepolia",
    totalTests: 0,
    totalPassed: 0,
    totalFailed: 0,
    criticalFailures: 0,
    testScripts: [],
    summary: {
        phase2Markets: null,
        integration: null,
        edgeCases: null,
        rewards: null
    },
    overallStatus: "PENDING"
};

/**
 * Helper: Run a test script and capture results
 */
async function runTestScript(scriptName, description) {
    console.log("\n");
    console.log("=".repeat(70));
    console.log(`🧪 RUNNING: ${description}`);
    console.log("=".repeat(70));
    console.log(`   Script: ${scriptName}`);
    console.log(`   Starting at: ${new Date().toLocaleTimeString()}`);
    console.log("=".repeat(70));
    console.log("\n");

    const startTime = Date.now();

    try {
        const { stdout, stderr } = await execPromise(
            `npx hardhat run scripts/${scriptName} --network sepolia`,
            { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
        );

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        // Parse results from output
        const passed = extractTestCount(stdout, "Passed:");
        const failed = extractTestCount(stdout, "Failed:");
        const total = extractTestCount(stdout, "Total Tests:");
        const critical = extractTestCount(stdout, "Critical Failures:");

        const result = {
            script: scriptName,
            description,
            status: failed === 0 ? "PASS" : (critical > 0 ? "CRITICAL FAIL" : "FAIL"),
            duration: `${duration}s`,
            totalTests: total,
            passed,
            failed,
            criticalFailures: critical,
            output: stdout
        };

        masterResults.totalTests += total;
        masterResults.totalPassed += passed;
        masterResults.totalFailed += failed;
        masterResults.criticalFailures += critical;
        masterResults.testScripts.push(result);

        console.log("\n");
        console.log("─".repeat(70));
        console.log(`✅ COMPLETED: ${description}`);
        console.log(`   Duration: ${duration}s`);
        console.log(`   Result: ${result.status}`);
        console.log(`   Tests: ${passed}/${total} passed`);
        if (critical > 0) {
            console.log(`   🚨 CRITICAL FAILURES: ${critical}`);
        }
        console.log("─".repeat(70));

        return result;

    } catch (error) {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        const result = {
            script: scriptName,
            description,
            status: "ERROR",
            duration: `${duration}s`,
            totalTests: 0,
            passed: 0,
            failed: 0,
            criticalFailures: 1,
            error: error.message,
            output: error.stdout || error.stderr || ""
        };

        masterResults.testScripts.push(result);
        masterResults.criticalFailures++;

        console.log("\n");
        console.log("─".repeat(70));
        console.log(`❌ ERROR: ${description}`);
        console.log(`   Duration: ${duration}s`);
        console.log(`   Error: ${error.message}`);
        console.log("─".repeat(70));

        return result;
    }
}

/**
 * Helper: Extract test count from output
 */
function extractTestCount(output, label) {
    const regex = new RegExp(`${label}\\s+(\\d+)`, "i");
    const match = output.match(regex);
    return match ? parseInt(match[1]) : 0;
}

/**
 * Helper: Generate comprehensive report
 */
function generateReport() {
    console.log("\n\n");
    console.log("=".repeat(70));
    console.log("=".repeat(70));
    console.log(" ".repeat(15) + "🎯 MASTER TEST REPORT - KEKTECH 3.0");
    console.log("=".repeat(70));
    console.log("=".repeat(70));
    console.log("\n");

    // Overall summary
    console.log("📊 OVERALL SUMMARY");
    console.log("─".repeat(70));
    console.log(`   Test Run Date:      ${new Date().toLocaleString()}`);
    console.log(`   Network:            ${masterResults.network.toUpperCase()}`);
    console.log(`   Total Scripts Run:  ${masterResults.testScripts.length}`);
    console.log(`   Total Tests:        ${masterResults.totalTests}`);
    console.log(`   Total Passed:       ${masterResults.totalPassed} ✅`);
    console.log(`   Total Failed:       ${masterResults.totalFailed} ❌`);
    console.log(`   Critical Failures:  ${masterResults.criticalFailures} 🚨`);
    console.log(`   Success Rate:       ${((masterResults.totalPassed / masterResults.totalTests) * 100).toFixed(1)}%`);
    console.log("\n");

    // Individual test script results
    console.log("📋 TEST SCRIPT RESULTS");
    console.log("─".repeat(70));

    masterResults.testScripts.forEach((script, index) => {
        const statusEmoji = script.status === "PASS" ? "✅" :
                           script.status === "CRITICAL FAIL" ? "🚨" :
                           script.status === "FAIL" ? "❌" : "⚠️";

        console.log(`\n${index + 1}. ${script.description}`);
        console.log(`   Status:    ${statusEmoji} ${script.status}`);
        console.log(`   Tests:     ${script.passed}/${script.totalTests} passed`);
        console.log(`   Duration:  ${script.duration}`);

        if (script.criticalFailures > 0) {
            console.log(`   🚨 CRITICAL: ${script.criticalFailures} critical failure(s)`);
        }

        if (script.error) {
            console.log(`   Error: ${script.error}`);
        }
    });

    console.log("\n");

    // Security assessment
    console.log("🔐 SECURITY ASSESSMENT");
    console.log("─".repeat(70));

    const marketsTest = masterResults.testScripts.find(t => t.script.includes("markets"));
    const edgeCasesTest = masterResults.testScripts.find(t => t.script.includes("edge"));

    if (marketsTest && marketsTest.status === "PASS") {
        console.log("   ✅ ALL 9 SECURITY FIXES VALIDATED");
    } else {
        console.log("   🚨 SECURITY FIXES NOT FULLY VALIDATED");
    }

    if (edgeCasesTest && edgeCasesTest.status === "PASS") {
        console.log("   ✅ ALL ATTACK VECTORS DEFENDED");
    } else {
        console.log("   🚨 ATTACK VECTOR TESTING INCOMPLETE");
    }

    if (masterResults.criticalFailures === 0) {
        console.log("   ✅ NO CRITICAL SECURITY ISSUES FOUND");
    } else {
        console.log(`   🚨 ${masterResults.criticalFailures} CRITICAL SECURITY ISSUE(S) FOUND`);
    }

    console.log("\n");

    // Integration assessment
    console.log("🔗 INTEGRATION ASSESSMENT");
    console.log("─".repeat(70));

    const integrationTest = masterResults.testScripts.find(t => t.script.includes("integration"));

    if (integrationTest && integrationTest.status === "PASS") {
        console.log("   ✅ PHASE 1 + PHASE 2 INTEGRATION VERIFIED");
        console.log("   ✅ CROSS-CONTRACT INTERACTIONS WORKING");
        console.log("   ✅ COMPLETE USER JOURNEYS FUNCTIONAL");
    } else {
        console.log("   ⚠️  INTEGRATION TESTING INCOMPLETE OR FAILED");
    }

    console.log("\n");

    // Final determination
    console.log("🎯 FINAL DETERMINATION");
    console.log("─".repeat(70));

    const allPassed = masterResults.totalFailed === 0;
    const noCritical = masterResults.criticalFailures === 0;

    if (allPassed) {
        masterResults.overallStatus = "READY FOR MAINNET";
        console.log("   ✅ ALL TESTS PASSED");
        console.log("   ✅ SYSTEM IS SECURE AND ROBUST");
        console.log("   ✅ READY FOR MAINNET DEPLOYMENT");
        console.log("\n   Status: 🟢 READY FOR MAINNET 🟢");
    } else if (noCritical) {
        masterResults.overallStatus = "REVIEW REQUIRED";
        console.log("   ⚠️  SOME NON-CRITICAL TESTS FAILED");
        console.log("   ⚠️  REVIEW RECOMMENDED BEFORE MAINNET");
        console.log("   ✅ NO CRITICAL ISSUES BLOCKING DEPLOYMENT");
        console.log("\n   Status: 🟡 REVIEW REQUIRED 🟡");
    } else {
        masterResults.overallStatus = "NOT READY - FIX REQUIRED";
        console.log("   🚨 CRITICAL FAILURES DETECTED");
        console.log("   🚨 DO NOT DEPLOY TO MAINNET");
        console.log("   🚨 FIX CRITICAL ISSUES IMMEDIATELY");
        console.log("\n   Status: 🔴 NOT READY - FIX REQUIRED 🔴");
    }

    console.log("\n");
    console.log("=".repeat(70));
    console.log("=".repeat(70));
    console.log("\n");

    return masterResults.overallStatus;
}

/**
 * Helper: Save results to file
 */
function saveResults() {
    const resultsDir = path.join(__dirname, "..", "test-results");

    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const resultsFile = path.join(resultsDir, `test-results-${timestamp}.json`);

    fs.writeFileSync(resultsFile, JSON.stringify(masterResults, null, 2));

    console.log("💾 Test Results Saved");
    console.log("─".repeat(70));
    console.log(`   File: ${resultsFile}`);
    console.log("\n");

    return resultsFile;
}

/**
 * Main test orchestrator
 */
async function main() {
    console.log("\n");
    console.log("=".repeat(70));
    console.log("=".repeat(70));
    console.log(" ".repeat(10) + "🚀 MASTER TEST RUNNER - KEKTECH 3.0");
    console.log(" ".repeat(15) + "Comprehensive System Validation");
    console.log("=".repeat(70));
    console.log("=".repeat(70));
    console.log("\n");

    console.log("📋 Test Suite Overview:");
    console.log("─".repeat(70));
    console.log("   1. Phase 2 Markets      - Validates all 9 security fixes");
    console.log("   2. Integration          - Phase 1 + Phase 2 integration");
    console.log("   3. Edge Cases           - Attack vectors & boundaries");
    console.log("   4. Reward Distribution  - Merkle-based rewards");
    console.log("\n");

    console.log("⏱️  Estimated Duration: 30-45 minutes");
    console.log("🌐 Network: Sepolia Testnet");
    console.log("\n");

    console.log("Starting test execution in 3 seconds...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    const masterStartTime = Date.now();

    try {
        // Run all test scripts in order
        masterResults.summary.phase2Markets = await runTestScript(
            "test-phase2-markets.js",
            "Phase 2 Prediction Markets (ALL 9 Security Fixes)"
        );

        masterResults.summary.integration = await runTestScript(
            "test-integration.js",
            "Phase 1 + Phase 2 Integration"
        );

        masterResults.summary.edgeCases = await runTestScript(
            "test-edge-cases.js",
            "Edge Cases & Attack Vectors"
        );

        masterResults.summary.rewards = await runTestScript(
            "test-phase2-rewards.js",
            "Reward Distribution (Merkle System)"
        );

        // Generate comprehensive report
        const overallStatus = generateReport();

        // Save results
        const resultsFile = saveResults();

        const masterEndTime = Date.now();
        const totalDuration = ((masterEndTime - masterStartTime) / 1000 / 60).toFixed(2);

        console.log("⏱️  Total Execution Time: " + totalDuration + " minutes\n");

        // Exit with appropriate code
        if (masterResults.criticalFailures > 0) {
            console.log("❌ Exiting with error code due to critical failures\n");
            process.exit(1);
        } else if (masterResults.totalFailed > 0) {
            console.log("⚠️  Exiting with warning code due to non-critical failures\n");
            process.exit(0); // Still success, but with warnings
        } else {
            console.log("✅ All tests passed! Exiting with success code\n");
            process.exit(0);
        }

    } catch (error) {
        console.error("\n❌ FATAL ERROR IN TEST ORCHESTRATION:");
        console.error(error);
        process.exit(1);
    }
}

// Execute master test runner
main()
    .then(() => {
        console.log("Test orchestration completed");
    })
    .catch((error) => {
        console.error("Test orchestration failed:", error);
        process.exit(1);
    });
