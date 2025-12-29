// Simple test to verify database prompts are working
// Run with: node test-db-prompts.js

const { createClient } = require('./src/lib/supabase/server');

async function testDatabasePrompts() {
  console.log('🧪 Testing database-driven model prompts...\n');

  try {
    // This will fail without proper environment variables, but let's see what happens
    const supabase = await createClient();

    // Test querying the model_prompts table
    console.log('📊 Checking model_prompts table...');
    const { data: prompts, error } = await supabase
      .from('model_prompts')
      .select('model_id, style, duration, is_active')
      .limit(5);

    if (error) {
      console.log('❌ Database query failed:', error.message);
      console.log('💡 This is expected without proper environment setup');
      return;
    }

    console.log('✅ Database connection successful!');
    console.log(`📈 Found ${prompts.length} model prompts in database:`);

    prompts.forEach(prompt => {
      console.log(`  - ${prompt.model_id}: ${prompt.style}_${prompt.duration} (${prompt.is_active ? 'active' : 'inactive'})`);
    });

    // Test specific prompt retrieval
    console.log('\n🔍 Testing specific prompt retrieval...');
    const { data: specificPrompt, error: specificError } = await supabase
      .from('model_prompts')
      .select('system_prompt')
      .eq('model_id', 'sora-2-text-to-video')
      .eq('style', 'ugc_auth')
      .eq('duration', '15s')
      .single();

    if (specificError) {
      console.log('❌ Specific prompt query failed:', specificError.message);
    } else {
      console.log('✅ UGC Auth 15s prompt found!');
      console.log('📝 Prompt preview:', specificPrompt.system_prompt.substring(0, 100) + '...');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('💡 Environment variables may not be set up');
  }
}

testDatabasePrompts();
