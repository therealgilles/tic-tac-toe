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

class ticTacToe {
  constructor (size = 3) {
    this.size = size
    this.noClear = false // set to true to prevent screen clear after each move
    this.init()
    this.questions = {
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
  }

  header () { // game header
    clear()
    console.log(chalk.yellow(figlet.textSync('Tic-tac-toe', { horizontalLayout: 'full' })))
  }

  color (c) { // color pieces
    return c === 'X' ? chalk.red(c) : chalk.green(c)
  }

  init () { // init board
    this.header()
    this.board = []
    for (let i = 0; i < this.size * this.size; i++) { this.board[i] = ' ' }
    this.currentPlayer = Math.random() >= 0.5 ? 'X' : 'O'
    this.draw = false
    this.invalidMove = false
    this.moveCounter = 0
    this.winner = null
  }

  nextPlayer () { // get next player
    return this.currentPlayer === 'X' ? 'O' : 'X'
  }

  play () { // play game
    this.displayBoard()

    // get user input
    inquirer.prompt(this.questions.play(this.currentPlayer)).then(answer => {
      let validMove
      let gameOver = false

      // is it a valid move?
      if (answer.choice.length && this.isEmpty(answer.choice)) {
        validMove = true
        this.addPiece(this.currentPlayer, answer.choice)
      }

      // check if game is over
      if (validMove) {
        gameOver = this.checkWinner(this.currentPlayer, answer.choice)
      }

      !this.noClear && this.header() // display header

      if (!gameOver) {
        // game not over, update player, and keep playing
        validMove && (this.currentPlayer = this.nextPlayer())
        this.invalidMove = !validMove
        this.play()
      } else {
        // game over, display final board and winner
        this.currentPlayer = this.nextPlayer()
        this.invalidMove = false
        this.displayBoard()
        this.winner ? console.log(`${this.color(this.winner)} wins.\n`) : console.log('It\'s a draw.\n')

        // ask if user wants to play again
        inquirer.prompt(this.questions.playAgain()).then(answer => {
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

  addPiece (player, colRow) { // add piece to board
    this.board[this.getIndex(colRow)] = player
    this.moveCounter++
  }

  checkWinner (player, colRow) { // check for winner
    log('checkWinner', player, colRow)
    let gameOver = false

    let index = this.getIndex(colRow)
    if (this.checkRow(player, index) || this.checkCol(player, index) || this.checkDiag(player, index)) {
      gameOver = true
      this.winner = player
    } else if (!this.checkPossibilities(this.currentPlayer, this.nextPlayer())) {
      log('no more possibilities')
      //gameOver = true // we could stop the game here
      this.draw = true
    }

    if (this.moveCounter === this.size * this.size) {
      gameOver = true
    }

    return gameOver
  }

  checkRow (player, index) { // check for row of index matching player regex
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

  checkCol (player, index) { // check for column of index matching player regex
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

  checkDiag (player, index) { // check for diag of index (if it exists) matching player regex
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

  checkPossibilities (currentPlayer, nextPlayer) { // check for next possible moves to detect tie
    log('checkPossibilities', currentPlayer, nextPlayer)
    // one of the players need to be able to win
    //   the player can place a piece in non-losing spot
    let player = nextPlayer
    log('... player', player)
    for (let i = 0; i < this.size * this.size; i += this.size + 1) {
      if (this.checkCol(`${player}|\\s`, i) ||
          this.checkRow(`${player}|\\s`, i) ||
          this.checkDiag(`${player}|\\s`, i)) {
        log('... good')
        return true // next player can win
      }
    }
    let savedBoard = this.board
    log('... other player', currentPlayer) // O, nextPlayer is X
    let winPossible = false
    for (let c = 0; c < this.size * this.size; c++) {
      if (this.board[c] === ' ') {
        log('   ... adding piece to', c, nextPlayer)
        this.board[c] = nextPlayer
        if (this.checkPossibilities(nextPlayer, currentPlayer)) {
          winPossible = true
        }
        log('   ... removing piece from', c)
        this.board[c] = ' '
        if (winPossible) { break }
      }
    }
    this.board = savedBoard
    log('... bad')
    return winPossible
  }

  displayBoard () { // display board
    process.stdout.write(`\nCurrent Board:\n`)
    process.stdout.write('\n   ')
    for (let c = 65; c < 65 + this.size; c++) {
      process.stdout.write(`   ${String.fromCharCode(c)}`)
    }
    for (let i = 0; i < this.size; i++) {
      process.stdout.write('\n    ')
      for (let k = 0; k < this.size; k++) {
        process.stdout.write('+---')
      }
      process.stdout.write(`+\n  ${i+1} |`)
      for (let j = 0; j < this.size; j++) {
        process.stdout.write(` ${this.color(this.board[i * this.size + j])} |`)
      }
      if (i === Math.floor((this.size - 1) / 2) - 1) {
        this.draw && process.stdout.write(chalk.red('   Draw detected!'))
        this.invalidMove && process.stdout.write(chalk.red('   Invalid move, try again...'))
      }
      if (!this.winner && i === Math.floor((this.size - 1) / 2)) {
        process.stdout.write(`   Player: ${this.color(this.currentPlayer)}`)
      }
    }
    process.stdout.write('\n    ')
    for (let k = 0; k < this.size; k++) {
      process.stdout.write('+---')
    }
    process.stdout.write('+\n\n')
  }

  getIndex (colRow) { // get index from column/row letter/number
    colRow = colRow.toUpperCase()
    let col = colRow.charCodeAt(0) - 65
    let row = colRow.charCodeAt(1) - 49
    if (col < 0 || col > this.size || row < 0 || row > this.size) {
      return null
    }

    return col + row * this.size
  }

  isEmpty (colRow) { // check if column/row is empty
    return this.board[this.getIndex(colRow)] === ' '
  }
}

const game = new ticTacToe() // Draw detection only works with n = 3
game.play() // start game
