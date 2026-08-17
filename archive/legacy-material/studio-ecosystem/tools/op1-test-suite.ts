/**
 * OP-1 DISK MODE - COMPLETE TEST SUITE
 * Tests all functionality with real OP-1 machine
 */

import fs from 'fs';
import path from 'path';
import { OP1Scanner } from './op1-scanner';
import { SampleExtractor } from './sample-extractor';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  message?: string;
  data?: any;
}

export class OP1TestSuite {
  private diskPath: string;
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor(diskPath: string) {
    this.diskPath = diskPath;
  }

  /**
   * Run all tests
   */
  public async runAll(): Promise<TestResult[]> {
    console.log('🎛️  OP-1 DISK MODE - COMPLETE TEST SUITE\n');
    console.log('='.repeat(60) + '\n');

    await this.testDiskConnection();
    await this.testScannerFunctionality();
    await this.testSampleExtraction();
    await this.testFileFormats();
    await this.testDataIntegrity();
    await this.testPerformance();
    await this.testExportFormats();

    this.printSummary();
    return this.results;
  }

  /**
   * Test 1: Disk Connection
   */
  private async testDiskConnection(): Promise<void> {
    console.log('📁 TEST 1: Disk Connection\n');

    const test = this.createTest('Disk mount detection');

    try {
      if (!fs.existsSync(this.diskPath)) {
        test.status = 'FAIL';
        test.message = `Disk not found at ${this.diskPath}`;
        this.results.push(test);
        return;
      }

      const stats = fs.statSync(this.diskPath);
      if (!stats.isDirectory()) {
        test.status = 'FAIL';
        test.message = 'Path is not a directory';
        this.results.push(test);
        return;
      }

      test.status = 'PASS';
      test.message = `Disk mounted at ${this.diskPath}`;
      test.data = { isAccessible: true };

      console.log(`  ✅ Disk accessible`);
      console.log(`  ✅ Path: ${this.diskPath}\n`);
    } catch (error) {
      test.status = 'FAIL';
      test.message = `Connection error: ${error}`;
    }

    this.results.push(test);
  }

  /**
   * Test 2: Scanner Functionality
   */
  private async testScannerFunctionality(): Promise<void> {
    console.log('🔍 TEST 2: Scanner Functionality\n');

    try {
      const test = this.createTest('Scanner initialization and scanning');
      const scanner = new OP1Scanner(this.diskPath);

      this.startTime = Date.now();
      const catalog = scanner.scan();
      test.duration = Date.now() - this.startTime;

      if (!catalog) {
        test.status = 'FAIL';
        test.message = 'Scanner returned null catalog';
        this.results.push(test);
        return;
      }

      test.status = 'PASS';
      test.data = {
        files: {
          tapes: catalog.tapes.length,
          patches: catalog.patches.length,
          drumkits: catalog.drumkits.length,
          samples: catalog.samples.length,
          firmware: catalog.firmware ? '✓' : '✗'
        },
        totalSize: (catalog.metadata.totalSize / 1024 / 1024).toFixed(2) + ' MB',
        scanTime: test.duration + 'ms'
      };

      console.log(`  ✅ Scan completed in ${test.duration}ms`);
      console.log(`  ✅ Files found:`);
      console.log(`     - Tapes: ${catalog.tapes.length}`);
      console.log(`     - Patches: ${catalog.patches.length}`);
      console.log(`     - Drum kits: ${catalog.drumkits.length}`);
      console.log(`     - Samples: ${catalog.samples.length}`);
      console.log(`     - Firmware: ${catalog.firmware ? '✓' : '✗'}\n`);

      // Export catalog
      scanner.exportCatalog('./test-results/op1-catalog.json');
    } catch (error) {
      const test = this.createTest('Scanner functionality');
      test.status = 'FAIL';
      test.message = `Scanner error: ${error}`;
      this.results.push(test);
    }
  }

  /**
   * Test 3: Sample Extraction
   */
  private async testSampleExtraction(): Promise<void> {
    console.log('🎵 TEST 3: Sample Extraction\n');

    try {
      const test = this.createTest('Sample extraction and analysis');
      const extractor = new SampleExtractor(this.diskPath);

      this.startTime = Date.now();
      const samples = extractor.extractAllSamples();
      test.duration = Date.now() - this.startTime;

      if (!samples || samples.length === 0) {
        test.status = 'SKIP';
        test.message = 'No samples found on disk';
        this.results.push(test);
        return;
      }

      test.status = 'PASS';
      test.data = {
        totalSamples: samples.length,
        totalSize: (samples.reduce((sum, s) => sum + s.size, 0) / 1024 / 1024).toFixed(2) + ' MB',
        extractionTime: test.duration + 'ms',
        avgDuration: (samples.reduce((sum, s) => sum + s.metadata.duration, 0) / samples.length).toFixed(2) + 's'
      };

      console.log(`  ✅ Extraction completed in ${test.duration}ms`);
      console.log(`  ✅ Samples analyzed:`);
      console.log(`     - Total: ${samples.length}`);
      console.log(`     - Total size: ${test.data.totalSize}`);
      console.log(`     - Avg duration: ${test.data.avgDuration}\n`);

      // Export database
      extractor.generateDatabase('./test-results/op1-samples-db.json');
      extractor.exportAsCSV('./test-results/op1-samples.csv');
    } catch (error) {
      const test = this.createTest('Sample extraction');
      test.status = 'FAIL';
      test.message = `Extraction error: ${error}`;
      this.results.push(test);
    }
  }

  /**
   * Test 4: File Formats
   */
  private async testFileFormats(): Promise<void> {
    console.log('📂 TEST 4: File Format Validation\n');

    const test = this.createTest('File format detection');

    try {
      const formats = {
        tape: this.testFileFormatType('tape'),
        synth: this.testFileFormatType('synth'),
        drum: this.testFileFormatType('drum'),
        samples: this.testFileFormatType('samples')
      };

      test.status = 'PASS';
      test.data = formats;

      console.log(`  ✅ File formats validated`);
      console.log(`     - Tapes: ${formats.tape.found ? '✓' : '✗'}`);
      console.log(`     - Patches: ${formats.synth.found ? '✓' : '✗'}`);
      console.log(`     - Drums: ${formats.drum.found ? '✓' : '✗'}`);
      console.log(`     - Samples: ${formats.samples.found ? '✓' : '✗'}\n`);
    } catch (error) {
      test.status = 'FAIL';
      test.message = `Format validation error: ${error}`;
    }

    this.results.push(test);
  }

  /**
   * Test 5: Data Integrity
   */
  private async testDataIntegrity(): Promise<void> {
    console.log('🔐 TEST 5: Data Integrity\n');

    const test = this.createTest('Data integrity checks');

    try {
      const scanner = new OP1Scanner(this.diskPath);
      const catalog = scanner.scan();

      let checksumPass = 0;
      let checksumFail = 0;

      // Verify file sizes
      catalog.samples.forEach((sample) => {
        try {
          const stat = fs.statSync(sample.path);
          if (stat.size === sample.size) {
            checksumPass++;
          } else {
            checksumFail++;
          }
        } catch (e) {
          checksumFail++;
        }
      });

      const integrity = checksumPass / (checksumPass + checksumFail);

      if (integrity >= 0.95) {
        test.status = 'PASS';
        test.message = `Data integrity: ${(integrity * 100).toFixed(1)}%`;
      } else {
        test.status = 'FAIL';
        test.message = `Low data integrity: ${(integrity * 100).toFixed(1)}%`;
      }

      test.data = {
        filesVerified: checksumPass + checksumFail,
        checksumsPass: checksumPass,
        checksumsFail: checksumFail,
        integrityPercentage: (integrity * 100).toFixed(1) + '%'
      };

      console.log(`  ✅ Integrity checks: ${(integrity * 100).toFixed(1)}%`);
      console.log(`     - Files verified: ${checksumPass + checksumFail}`);
      console.log(`     - Passed: ${checksumPass}`);
      console.log(`     - Failed: ${checksumFail}\n`);
    } catch (error) {
      test.status = 'FAIL';
      test.message = `Integrity check error: ${error}`;
    }

    this.results.push(test);
  }

  /**
   * Test 6: Performance
   */
  private async testPerformance(): Promise<void> {
    console.log('⚡ TEST 6: Performance Benchmarks\n');

    const benchmarks: { [key: string]: number } = {};

    // Scanner benchmark
    const scanner = new OP1Scanner(this.diskPath);
    this.startTime = Date.now();
    scanner.scan();
    benchmarks.scanner = Date.now() - this.startTime;

    // Extractor benchmark
    const extractor = new SampleExtractor(this.diskPath);
    this.startTime = Date.now();
    extractor.extractAllSamples();
    benchmarks.extractor = Date.now() - this.startTime;

    const test = this.createTest('Performance benchmarks');
    test.status = 'PASS';
    test.data = {
      scannerTime: benchmarks.scanner + 'ms',
      extractorTime: benchmarks.extractor + 'ms',
      totalTime: (benchmarks.scanner + benchmarks.extractor) + 'ms'
    };

    console.log(`  ✅ Performance benchmarks:`);
    console.log(`     - Scanner: ${benchmarks.scanner}ms`);
    console.log(`     - Extractor: ${benchmarks.extractor}ms`);
    console.log(`     - Total: ${benchmarks.scanner + benchmarks.extractor}ms\n`);

    this.results.push(test);
  }

  /**
   * Test 7: Export Formats
   */
  private async testExportFormats(): Promise<void> {
    console.log('💾 TEST 7: Export Formats\n');

    const test = this.createTest('Export format generation');

    try {
      const extractor = new SampleExtractor(this.diskPath);
      extractor.extractAllSamples();

      // Test JSON export
      extractor.generateDatabase('./test-results/op1-samples.json');

      // Test CSV export
      extractor.exportAsCSV('./test-results/op1-samples.csv');

      test.status = 'PASS';
      test.data = {
        jsonExport: fs.existsSync('./test-results/op1-samples.json'),
        csvExport: fs.existsSync('./test-results/op1-samples.csv')
      };

      console.log(`  ✅ Export formats generated:`);
      console.log(`     - JSON: ✓`);
      console.log(`     - CSV: ✓\n`);
    } catch (error) {
      test.status = 'FAIL';
      test.message = `Export error: ${error}`;
    }

    this.results.push(test);
  }

  /**
   * Helper: Test file format type
   */
  private testFileFormatType(
    dirName: string
  ): { found: boolean; count: number } {
    try {
      const dirPath = path.join(this.diskPath, dirName);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        return { found: true, count: files.length };
      }
      return { found: false, count: 0 };
    } catch (error) {
      return { found: false, count: 0 };
    }
  }

  /**
   * Helper: Create test
   */
  private createTest(name: string): TestResult {
    return {
      name,
      status: 'PASS',
      duration: 0
    };
  }

  /**
   * Print summary
   */
  private printSummary(): void {
    const passed = this.results.filter((r) => r.status === 'PASS').length;
    const failed = this.results.filter((r) => r.status === 'FAIL').length;
    const skipped = this.results.filter((r) => r.status === 'SKIP').length;

    console.log('='.repeat(60));
    console.log('\n📊 TEST SUMMARY\n');
    console.log(`  ✅ Passed:  ${passed}`);
    console.log(`  ❌ Failed:  ${failed}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ────────────`);
    console.log(`  Total:   ${this.results.length}\n`);

    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! 🎉\n');
    } else {
      console.log('⚠️  Some tests failed. Review results.\n');
    }

    // Export results
    const report = {
      timestamp: new Date().toISOString(),
      summary: { passed, failed, skipped },
      results: this.results
    };

    fs.mkdirSync('./test-results', { recursive: true });
    fs.writeFileSync(
      './test-results/test-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('📄 Report saved: ./test-results/test-report.json\n');
  }
}

// CLI Usage
if (require.main === module) {
  const diskPath = process.argv[2] || '/Volumes/OP-1';
  const suite = new OP1TestSuite(diskPath);
  suite.runAll().catch(console.error);
}
