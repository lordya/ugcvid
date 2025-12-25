// Test edge cases for format/model selection
const { selectModelForFormat, getFormatKey, KIE_MODELS } = require('./src/lib/kie-models.ts');

console.log('Testing edge cases:');
console.log();

// Test unsupported format
console.log('1. Unsupported format:');
try {
  const model = selectModelForFormat('unsupported_format');
  console.log('   Result: Fallback to', model.name);
} catch (e) {
  console.log('   Error:', e.message);
}
console.log();

// Test invalid style normalization
console.log('2. Style normalization:');
const testStyles = ['ugc', 'UGC', 'green-screen', 'pas', 'invalid'];
testStyles.forEach(style => {
  const formatKey = getFormatKey(style, '10s');
  console.log(`   ${style} -> ${formatKey}`);
});
console.log();

// Test format mapping lookup
console.log('3. Format mapping lookup:');
const testFormats = ['ugc_auth_10s', 'nonexistent_format', 'invalid_30s'];
testFormats.forEach(format => {
  const mapping = FORMAT_MODEL_MAPPING[format];
  if (mapping) {
    console.log(`   ${format}: Primary=${mapping.primary}, Backup=${mapping.backup}`);
  } else {
    console.log(`   ${format}: Not found in mapping`);
  }
});
console.log();

// Test model availability
console.log('4. Model availability:');
const testModelIds = ['sora2', 'nonexistent_model', 'wan-2.6'];
testModelIds.forEach(modelId => {
  const model = KIE_MODELS[modelId];
  if (model) {
    console.log(`   ${modelId}: Available (${model.name})`);
  } else {
    console.log(`   ${modelId}: Not found`);
  }
});
