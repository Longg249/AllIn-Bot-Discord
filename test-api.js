const { isValidWord } = require('./src/api');

async function runTests() {
  const testWords = ['học', 'học sinh', 'giáo viên', 'khôngthểtồntại'];
  
  for (const word of testWords) {
    console.log(`Testing "${word}"...`);
    const valid = await isValidWord(word);
    console.log(`Result: ${valid}`);
  }
}

runTests();
