/**
 * OP-1 MASTER ANALYZER
 * Complete orchestration of all analysis, testing, and import workflows
 */

import fs from 'fs';
import path from 'path';
import { OP1Scanner } from './op1-scanner';
import { SampleExtractor } from './sample-extractor';
import { OP1TestSuite } from './op1-test-suite';

interface OP1AnalysisReport {
  timestamp: string;
  diskPath: string;
  machine: {
    detected: boolean;
    firmware?: string;
    totalSize: string;
  };
  analysis: {
    catalog: any;
    samples: any;
    tests: any;
  };
  ready: boolean;
  nextSteps: string[];
}

export class OP1MasterAnalyzer {
  private diskPath: string;
  private report: OP1AnalysisReport;
  private outputDir: string = './op1-analysis-results';

  constructor(diskPath: string) {
    this.diskPath = diskPath;
    this.report = {
      timestamp: new Date().toISOString(),
      diskPath,
      machine: { detected: false },
      analysis: { catalog: null, samples: null, tests: null },
      ready: false,
      nextSteps: []
    };

    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Run complete analysis pipeline
   */
  public async runComplete(): Promise<OP1AnalysisReport> {
    console.log('\n╔' + '═'.repeat(60) + '╗');
    console.log('║  🎛️  OP-1 MASTER ANALYZER - COMPLETE PIPELINE  🎛️           ║');
    console.log('╚' + '═'.repeat(60) + '╝\n');

    try {
      // Step 1: Detect machine
      await this.detectMachine();

      if (!this.report.machine.detected) {
        console.log('❌ OP-1 machine not detected. Exiting.\n');
        return this.report;
      }

      // Step 2: Run tests
      await this.runTests();

      // Step 3: Scan disk
      await this.scanDisk();

      // Step 4: Extract samples
      await this.extractSamples();

      // Step 5: Generate recommendations
      this.generateRecommendations();

      // Step 6: Export report
      this.exportReport();

      this.report.ready = true;
    } catch (error) {
      console.error('❌ Analysis error:', error);
      this.report.ready = false;
    }

    return this.report;
  }

  /**
   * Detect OP-1 machine
   */
  private async detectMachine(): Promise<void> {
    console.log('🔍 STEP 1: MACHINE DETECTION\n');

    try {
      if (!fs.existsSync(this.diskPath)) {
        console.log(`  ❌ Disk not found at ${this.diskPath}`);
        return;
      }

      const files = fs.readdirSync(this.diskPath);
      const isOP1 =
        files.includes('tape') ||
        files.includes('synth') ||
        files.includes('drum') ||
        files.includes('firmware');

      if (isOP1) {
        this.report.machine.detected = true;
        console.log(`  ✅ OP-1 Machine Detected!`);
        console.log(`  ✅ Mount path: ${this.diskPath}`);
        console.log(`  ✅ Ready for analysis\n`);
      } else {
        console.log(`  ⚠️  Disk found but OP-1 structure not detected`);
        console.log(`  ℹ️  Contents: ${files.join(', ')}\n`);
      }
    } catch (error) {
      console.error('  ❌ Detection error:', error);
    }
  }

  /**
   * Run test suite
   */
  private async runTests(): Promise<void> {
    console.log('🧪 STEP 2: TEST SUITE\n');

    try {
      const suite = new OP1TestSuite(this.diskPath);
      const results = await suite.runAll();
      this.report.analysis.tests = results;
    } catch (error) {
      console.error('  ❌ Test error:', error);
    }
  }

  /**
   * Scan OP-1 disk
   */
  private async scanDisk(): Promise<void> {
    console.log('\n📁 STEP 3: DISK SCANNING\n');

    try {
      const scanner = new OP1Scanner(this.diskPath);
      const catalog = scanner.scan();
      this.report.analysis.catalog = catalog;
      scanner.exportCatalog(path.join(this.outputDir, 'catalog.json'));
    } catch (error) {
      console.error('  ❌ Scan error:', error);
    }
  }

  /**
   * Extract samples
   */
  private async extractSamples(): Promise<void> {
    console.log('\n🎵 STEP 4: SAMPLE EXTRACTION\n');

    try {
      const extractor = new SampleExtractor(this.diskPath);
      const samples = extractor.extractAllSamples();
      this.report.analysis.samples = samples;

      extractor.generateDatabase(path.join(this.outputDir, 'samples-db.json'));
      extractor.exportAsCSV(path.join(this.outputDir, 'samples.csv'));
    } catch (error) {
      console.error('  ❌ Extraction error:', error);
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): void {
    console.log('\n💡 STEP 5: RECOMMENDATIONS\n');

    const catalog = this.report.analysis.catalog;

    if (catalog.samples.length > 0) {
      this.report.nextSteps.push(`Import ${catalog.samples.length} samples to Sound Editor`);
    }

    if (catalog.patches.length > 0) {
      this.report.nextSteps.push(`Analyze ${catalog.patches.length} synth patches`);
    }

    if (catalog.drumkits.length > 0) {
      this.report.nextSteps.push(`Import ${catalog.drumkits.length} drum kits`);
    }

    if (catalog.firmware) {
      this.report.nextSteps.push(`Firmware detected: Backup ${catalog.firmware.name}`);
    }

    console.log('  Recommended actions:');
    this.report.nextSteps.forEach((step, idx) => {
      console.log(`  ${idx + 1}. ${step}`);
    });
    console.log();
  }

  /**
   * Export complete report
   */
  private exportReport(): void {
    console.log('📊 STEP 6: REPORT GENERATION\n');

    const reportPath = path.join(this.outputDir, 'complete-report.json');

    try {
      fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));

      console.log(`  ✅ Report saved: ${reportPath}`);
      console.log(`  ✅ Catalog: ${path.join(this.outputDir, 'catalog.json')}`);
      console.log(`  ✅ Samples: ${path.join(this.outputDir, 'samples-db.json')}`);
      console.log(`  ✅ CSV: ${path.join(this.outputDir, 'samples.csv')}`);
      console.log(`  ✅ Tests: ${path.join(this.outputDir, 'test-report.json')}\n`);
    } catch (error) {
      console.error('  ❌ Export error:', error);
    }
  }

  /**
   * Print final summary
   */
  public printSummary(): void {
    console.log('╔' + '═'.repeat(60) + '╗');
    console.log('║  📋 ANALYSIS COMPLETE  📋                                    ║');
    console.log('╚' + '═'.repeat(60) + '╝\n');

    if (this.report.ready) {
      const catalog = this.report.analysis.catalog;

      console.log('📊 MACHINE SUMMARY:\n');
      console.log(`  Machine Status:    ${this.report.machine.detected ? '✅ DETECTED' : '❌ NOT FOUND'}`);
      console.log(`  Disk Path:         ${this.diskPath}`);
      console.log(`  Timestamp:         ${this.report.timestamp}\n`);

      console.log('📁 CONTENTS:\n');
      console.log(`  Samples:           ${catalog.samples.length}`);
      console.log(`  Patches:           ${catalog.patches.length}`);
      console.log(`  Drum Kits:         ${catalog.drumkits.length}`);
      console.log(`  Tape Recordings:   ${catalog.tapes.length}`);
      console.log(`  Firmware:          ${catalog.firmware ? '✓' : '✗'}`);
      console.log(`  Total Size:        ${catalog.metadata.totalSize}\n`);

      console.log('🎯 NEXT STEPS:\n');
      this.report.nextSteps.forEach((step, idx) => {
        console.log(`  ${idx + 1}. ${step}`);
      });
      console.log();

      console.log('📂 OUTPUT FILES:\n');
      console.log(`  ${this.outputDir}/`);
      console.log(`  ├── complete-report.json`);
      console.log(`  ├── catalog.json`);
      console.log(`  ├── samples-db.json`);
      console.log(`  ├── samples.csv`);
      console.log(`  └── test-report.json\n`);
    } else {
      console.log('❌ Analysis failed. Check errors above.\n');
    }

    console.log('═'.repeat(62) + '\n');
  }

  /**
   * Get analysis data for Sound Editor import
   */
  public getImportData() {
    return {
      samples: this.report.analysis.samples,
      catalog: this.report.analysis.catalog,
      ready: this.report.ready
    };
  }
}

// CLI Usage
if (require.main === module) {
  const diskPath = process.argv[2] || '/Volumes/OP-1';

  (async () => {
    const analyzer = new OP1MasterAnalyzer(diskPath);
    const report = await analyzer.runComplete();
    analyzer.printSummary();

    // Return data for next step
    console.log('✅ Analysis complete! Ready for Sound Editor import.\n');
  })().catch(console.error);
}
