#!/usr/bin/env node

/**
 * AIラインステップ v0.1 スモークテスト
 * 基本的な機能が正常に動作するかを確認
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3002';
const API_ENDPOINTS = [
  '/api/health',
  '/api/cron/dispatch',
];

const PAGES = [
  '/',
  '/login',
  '/dashboard',
];

// HTTPリクエストを送信するヘルパー関数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;

    const req = protocol.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// ヘルスチェック
async function testHealthEndpoint() {
  console.log('🔍 Testing health endpoint...');

  try {
    const response = await makeRequest(`${BASE_URL}/api/health`);

    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.body);
      console.log('✅ Health check passed:', healthData.overall);
      return true;
    } else {
      console.log('❌ Health check failed:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

// ページアクセステスト
async function testPageAccess() {
  console.log('🔍 Testing page access...');

  let allPassed = true;

  for (const page of PAGES) {
    try {
      const response = await makeRequest(`${BASE_URL}${page}`);

      if (response.statusCode === 200 || response.statusCode === 302) {
        console.log(`✅ Page ${page}: ${response.statusCode}`);
      } else {
        console.log(`❌ Page ${page}: ${response.statusCode}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ Page ${page}: ${error.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

// Cronエンドポイントテスト（認証なし）
async function testCronEndpoint() {
  console.log('🔍 Testing cron endpoint (should be unauthorized)...');

  try {
    const response = await makeRequest(`${BASE_URL}/api/cron/dispatch`);

    if (response.statusCode === 401) {
      console.log('✅ Cron endpoint properly protected (401)');
      return true;
    } else {
      console.log('❌ Cron endpoint not properly protected:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('❌ Cron endpoint error:', error.message);
    return false;
  }
}

// APIエンドポイントの基本テスト
async function testApiEndpoints() {
  console.log('🔍 Testing API endpoints...');

  let allPassed = true;

  // Claude APIテスト（認証なしで401が返ることを確認）
  try {
    const response = await makeRequest(`${BASE_URL}/api/claude`);
    if (response.statusCode === 401 || response.statusCode === 405) {
      console.log('✅ Claude API properly protected');
    } else {
      console.log('❌ Claude API not properly protected:', response.statusCode);
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ Claude API error:', error.message);
    allPassed = false;
  }

  // LINE broadcast APIテスト（認証なしで401が返ることを確認）
  try {
    const response = await makeRequest(`${BASE_URL}/api/line/broadcast`);
    if (response.statusCode === 401 || response.statusCode === 405) {
      console.log('✅ LINE broadcast API properly protected');
    } else {
      console.log('❌ LINE broadcast API not properly protected:', response.statusCode);
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ LINE broadcast API error:', error.message);
    allPassed = false;
  }

  return allPassed;
}

// 暗号化テスト（簡易版）
async function testCryptoFunctions() {
  console.log('🔍 Testing crypto functions...');

  try {
    // Node.js crypto モジュールの基本動作確認
    const crypto = require('crypto');

    // 基本的な暗号化テスト
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const testData = 'Hello, World! テスト';

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(testData, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const tag = cipher.getAuthTag();

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    if (decrypted.toString('utf8') === testData) {
      console.log('✅ Crypto functions working correctly');
      return true;
    } else {
      console.log('❌ Crypto functions failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Crypto test error:', error.message);
    return false;
  }
}

// メイン実行関数
async function runSmokeTests() {
  console.log('🚀 Starting AIラインステップ v0.1 Smoke Tests...\n');

  const tests = [
    { name: 'Health Endpoint', fn: testHealthEndpoint },
    { name: 'Page Access', fn: testPageAccess },
    { name: 'Cron Endpoint', fn: testCronEndpoint },
    { name: 'API Endpoints', fn: testApiEndpoints },
    { name: 'Crypto Functions', fn: testCryptoFunctions },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const passed = await test.fn();
    if (passed) {
      passedTests++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All smoke tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the application.');
    process.exit(1);
  }
}

// スクリプト実行時の処理
if (require.main === module) {
  runSmokeTests().catch((error) => {
    console.error('❌ Smoke test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runSmokeTests,
  testHealthEndpoint,
  testPageAccess,
  testCronEndpoint,
  testApiEndpoints,
  testCryptoFunctions
};