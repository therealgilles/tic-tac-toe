const chalk    = require('chalk')
const clear    = require('clear')
const CLI      = require('clui')
const figlet   = require('figlet')
const inquirer = require('inquirer')

const questions = {
  play: [ {
    name: 'choice',
    type: 'input',
    message: 'Please enter a free column/row location (e.g. A1): ',
  } ],

  playAgain: [ {
    name: 'choice',
    type: 'input',
    message: 'Would you like to play again? ',
  } ],
}

// Game header
clear()
console.log(
  chalk.yellow(
    figlet.textSync('Tic-tac-toe', { horizontalLayout: 'full' })
  )
)

class ticTacToe {
  constructor (size = 3) {
    this.size = size
    this.init()
  }

  init () { // init board
    this.board = []
    for (let i = 0; i < this.size * this.size; i++) { this.board[i] = ' ' }
    this.currentPlayer = 'X'
  }

  play () {
    this.displayBoard()

    // get user input
    inquirer.prompt(questions.play).then(answer => {
      let validMove
      let gameOver = false
      let winner = null

      if (answer.choice.length && this.isEmpty(answer.choice)) {
        validMove = true
        this.addPiece(this.currentPlayer, answer.choice)
      }

      // check if game is over
      if (validMove) {
        ({ gameOver, winner } = this.checkWinner(this.currentPlayer, answer.choice))
      }

      if (!gameOver) {
        validMove && (this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X')
        this.play()
      } else {
        this.displayBoard()
        winner ? console.log(`${winner} wins.`) : console.log('It\'s a tie.')

        inquirer.prompt(questions.playAgain).then(answer => {
          if (answer.choice.match(/^y|yes/i)) {
            this.init(this.size)
            this.play()
          } else {
            console.log('Goodbye')
          }
        })
      }
    })
  }

  addPiece (player, colRow) {
    this.board[this.getIndex(colRow)] = player
  }

  checkWinner (player, colRow) {
    let gameOver = false
    let winner = null

    if (this.board.slice(0, this.size)) {

    }

    return { gameOver, winner }
  }

  displayBoard () {
    process.stdout.write('\nCurrent Board:\n')
    for (let i = 0; i < this.size; i++) {
      process.stdout.write('\n+---+---+---+\n|')
      for (let j = 0; j < this.size; j++) {
        process.stdout.write(` ${this.board[i*3 + j]} |`)
      }
    }
    process.stdout.write('\n+---+---+---+\n\n')
  }

  getIndex (colRow) {
    colRow = colRow.toUpperCase()
    let col = colRow.charCodeAt(0) - 65
    let row = colRow.charCodeAt(1) - 49
    if (col < 0 || col > 3 || row < 0 || row > 3) {
      return null
    }

    return col + row * 3
  }

  isEmpty (colRow) {
    return this.board[this.getIndex(colRow)] === ' '
  }
}

const game = new ticTacToe()
game.play()
