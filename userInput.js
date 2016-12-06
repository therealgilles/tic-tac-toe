const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

module.exports = {
  getUserInput: question => { 
    return new Promise((resolve, reject) => {
      rl.question(question, answer => resolve(answer))
      rl.close()
    })
  }
}
