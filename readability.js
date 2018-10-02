const fs = require('fs')
const md5File = require('md5-file')
const Tokenizer = require('tokenize-text')
const tokenize = new Tokenizer()
const tokenizeEnglish = require('tokenize-english')(tokenize)
const Knex = require('knex')

const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: './db/index.db'
  },
  useNullAsDefault: false
})

/**
 * Adds data to db
 * @param {{hash: string, numberOfWords: number, numberOfLetters: number, numberOfNumbers: number, numberOfSentences: number, ariIndex: number, clScore: number}} params
 */
function addDataToDB(params) {
  return knex('readability')
    .insert({
      hash: params.hash,
      numberOfSentences: params.numberOfSentences,
      numberOfWords: params.numberOfWords,
      numberOfLetters: params.numberOfLetters,
      numberOfNumbers: params.numberOfNumbers,
      ariIndex: params.ariIndex,
      clScore: params.clScore
    })
    .then(() => true)
}

/**
 * Gets data from db using a given hash
 * @param {string} hash
 */
function getDataFromDB(hash) {
  return knex('readability')
    .select(['hash', 'numberOfSentences', 'numberOfWords', 'numberOfLetters', 'numberOfNumbers', 'ariIndex', 'clScore'])
    .where('hash', hash)
    .limit(1)
    .then(d => d[0])
    .then(d => {
      if (!d) {
        // not in database, return null
        return null
      }
      return d
    })
}

const roundToThreeDecimalPlaces = num => Math.round(num * 1000) / 1000

// Parses a text file into words, sentences, characters
function readability(filename, callback) {
  fs.readFile(filename, 'utf8', (err, contents) => {
    if (err) throw err
    md5File(filename, async (err, hash) => {
      if (err) throw err
      let numberOfSentences = 0
      let numberOfWords = 0
      let numberOfLetters = 0
      let numberOfNumbers = 0
      let clScore, ariIndex

      // check if we have the data stored previously on DB
      const dbData = await getDataFromDB(hash)
      if (dbData) {
        numberOfSentences = dbData.numberOfSentences
        numberOfWords = dbData.numberOfWords
        numberOfLetters = dbData.numberOfLetters
        numberOfNumbers = dbData.numberOfNumbers
        clScore = dbData.clScore
        ariIndex = dbData.ariIndex
      } else {
        // file not in database
        const sentenceTokens = tokenizeEnglish.sentences()(contents.split(/\n/).join(' '))
        numberOfSentences = sentenceTokens.length
        numberOfLetters = tokenize.re(/[a-zA-Z]/)(contents).length
        numberOfNumbers = tokenize.re(/[0-9]/)(contents).length
        sentenceTokens.map(s => {
          const wordTokens = tokenize.words()(s.value)
          numberOfWords += wordTokens.length
        })
        clScore = colemanLiau(numberOfLetters, numberOfWords, numberOfSentences)
        ariIndex = automatedReadabilityIndex(numberOfLetters, numberOfNumbers, numberOfWords, numberOfSentences)

        // store the data in DB
        await addDataToDB({
          hash,
          numberOfSentences,
          numberOfWords,
          numberOfLetters,
          numberOfNumbers,
          ariIndex,
          clScore
        })
      }

      let result = ''
      result += `REPORT for ./texts/${filename}.txt\n`
      result += `${numberOfLetters + numberOfNumbers} characters\n`
      result += `${numberOfWords} words\n`
      result += `${numberOfSentences} sentences\n`
      result += `------------------\n`
      result += `Coleman-Liau Score: ${roundToThreeDecimalPlaces(clScore)}\n`
      result += `Automated Readability Index: ${roundToThreeDecimalPlaces(ariIndex)}`

      // close the database connection
      knex.destroy()

      callback(result)
    })
  })
}

// Computes Coleman-Liau readability index
function colemanLiau(letters, words, sentences) {
  return (0.0588 * (letters * 100 / words))
    - (0.296 * (sentences * 100 / words))
    - 15.8
}

// Computes Automated Readability Index
function automatedReadabilityIndex(letters, numbers, words, sentences) {
  return (4.71 * ((letters + numbers) / words))
    + (0.5 * (words / sentences))
    - 21.43
}

// Calls the readability function on the provided file and defines callback behavior
if (process.argv.length >= 3) {
  readability(process.argv[2], data => {
    console.log(data)
  })
}
else {
  console.log('Usage: node readability.js <file>')
}
