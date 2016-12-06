const chalk    = require('chalk')
const clear    = require('clear')
const CLI      = require('clui')
const figlet   = require('figlet')
const inquirer = require('inquirer')

const debug = require('debug')
//debug.enable('ticTacToe:*');
const log = debug('ticTacToe:log');
const info = debug('ticTacToe:info');
const error = debug('ticTacToe:error');

const questions = {
  play: player => [ {
    name: 'choice',
    type: 'input',
    message: `Player ${player}, please enter a free column/row location (e.g. A1): `,
  } ],

  playAgain: () => [ {
    name: 'choice',
    type: 'input',
    message: 'Would you like to play again? ',
  } ],
}

class ticTacToe {
  constructor (size = 3) {
    this.size = size
    this.noClear = false // set to true to prevent screen clear after each move
    this.init()
  }

  // Game header
  header () {
    clear()
    console.log(
      chalk.yellow(
        figlet.textSync('Tic-tac-toe', { horizontalLayout: 'full' })
      )
    )
  }

  color (c) {
    return c === 'X' ? chalk.red(c) : chalk.green(c)
  }

  init () { // init board
    this.header()
    this.board = []
    for (let i = 0; i < this.size * this.size; i++) { this.board[i] = ' ' }
    this.currentPlayer = Math.random() >= 0.5 ? 'X' : 'O'
    this.tie = false
    this.invalidMove = false
    this.moveCounter = 0
  }

  nextPlayer () {
    return this.currentPlayer === 'X' ? 'O' : 'X'
  }

  play () {
    this.displayBoard()

    // get user input
    inquirer.prompt(questions.play(this.currentPlayer)).then(answer => {
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

      !this.noClear && this.header()
      if (!gameOver) {
        validMove && (this.currentPlayer = this.nextPlayer())
        this.invalidMove = !validMove
        this.play()
      } else {
        this.currentPlayer = this.nextPlayer()
        this.invalidMove = false
        this.displayBoard()
        winner ? console.log(`${this.color(winner)} wins.\n`) : console.log('It\'s a tie.\n')

        inquirer.prompt(questions.playAgain()).then(answer => {
          if (answer.choice.match(/^y|yes/i)) {
            this.init(this.size)
            !this.noClear && this.header()
            this.play()
          } else {
            console.log('\nGoodbye.')
          }
        })
      }
    })
  }

  addPiece (player, colRow) {
    this.board[this.getIndex(colRow)] = player
    this.moveCounter++
  }

  checkWinner (player, colRow) {
    log('checkWinner', player, colRow)
    let gameOver = false
    let winner = null

    let index = this.getIndex(colRow)
    if (this.checkRow(player, index) || this.checkCol(player, index) || this.checkDiag(player, index)) {
      gameOver = true
      winner = player
    } else if (!this.checkPossibilities(this.currentPlayer, this.nextPlayer())) {
      log('no more possibilities')
      //gameOver = true // we could stop the game here
      this.tie = true
    }

    if (this.moveCounter === this.size * this.size) {
      gameOver = true
    }

    return { gameOver, winner }
  }

  checkRow (player, index) {
    log('checkRow', player, index)
    let row = Math.floor(index / this.size)
    let re = new RegExp(player)
    for (let i = 0; i < this.size; i++) {
      log(`... checking row ${i + row * this.size} ${this.board[i + row * this.size]} against ${player}`)
      if (!this.board[i + row * this.size].match(re)) {
        log('... bad')
        return false
      }
    }
    log('... good')
    return true
  }

  checkCol (player, index) {
    log('checkCol', player, index)
    let col = index % this.size
    let re = new RegExp(player)
    for (let j = 0; j < this.size; j++) {
      log(`... checking col ${col + j * this.size} ${this.board[col + j * this.size]} against ${player}`)
      if (!this.board[col + j * this.size].match(re)) {
        log('... bad')
        return false
      }
    }
    log('... good')
    return true
  }

  checkDiag (player, index) {
    log('checkDiag', player, index)
    let row = Math.floor(index / this.size)
    let col = index % this.size
    log('... row/col', row, col)
    let re = new RegExp(player)
    if (col - row === 0) {
      let found = true
      for (let i = 0; i < this.size; i++) {
        log(`... checking positive diag ${i + i * this.size} ${this.board[i + i * this.size]} against ${player}`)
        if (!this.board[i + i * this.size].match(re)) {
          log('... bad')
          found = false
          break
        }
      }
      if (found) { log('... good'); return true }
    }
    if (col + row === this.size - 1) {
      let found = true
      for (let i = 0; i < this.size; i++) {
        log(`... checking negative diag ${(i + 1) * this.size - i - 1} ${this.board[(i + 1) * this.size - i - 1]} against ${player}`)
        if (!this.board[(i + 1) * this.size - i - 1].match(re)) {
          log('... bad')
          found = false
          break
        }
      }
      if (found) { log('... good'); return true }
    }
    log('... bad')
    return false
  }

  checkPossibilities (currentPlayer, nextPlayer) {
    log('checkPossibilities', currentPlayer, nextPlayer)
    // one of the players need to be able to win
    //   the player can place a piece in non-losing spot
    let player = nextPlayer
    console.log('... player', player)
    for (let i = 0; i < this.size * this.size; i += this.size + 1) {
      if (this.checkCol(`${player}|\\s`, i) ||
          this.checkRow(`${player}|\\s`, i) ||
          this.checkDiag(`${player}|\\s`, i)) {
        log('... good')
        return true // next player can win
      }
    }
    let savedBoard = this.board
    player = currentPlayer
    let winPossible = false
    for (let c = 0; c < this.size; c++) {
      if (this.board[c] === ' ') {
        this.board[c] = nextPlayer
        if (this.checkPossibilities(nextPlayer, currentPlayer)) {
          winPossible = true
        }
        this.board[c] = ' '
        if (winPossible) { break }
      }
    }
    this.board = savedBoard
    log('... bad')
    return winPossible
  }

  displayBoard () {
    process.stdout.write(`\nCurrent Board:\n`)
    process.stdout.write('\n    A   B   C')
    for (let i = 0; i < this.size; i++) {
      process.stdout.write(`\n  +---+---+---+\n${i+1} |`)
      for (let j = 0; j < this.size; j++) {
        process.stdout.write(` ${this.color(this.board[i * 3 + j])} |`)
      }
      if (this.tie && i === Math.floor(this.size / 2) - 1) {
        process.stdout.write(chalk.red('   Tie detected!'))
      }
      if (this.invalidMove & i === Math.floor(this.size / 2) - 1) {
        process.stdout.write(chalk.red('   Invalid move, try again...'))
      }
      if (i === Math.floor(this.size / 2)) {
        process.stdout.write(`   Player: ${this.color(this.currentPlayer)}`)
      }
    }
    process.stdout.write('\n  +---+---+---+\n\n')
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
