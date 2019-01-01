// $ node index.js [spreadsheetId]

// argv
const spreadsheetId = process.argv[2]

// setup
const dateformat = require('dateformat')
const {google} = require('googleapis')
const serviceAccount = require("./credentials/serviceAccount.json")
const jwtClient = new google.auth.JWT(
  serviceAccount.client_email,
  null,
  serviceAccount.private_key,
  [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
  ]
)
const sheets = google.sheets({
  version: 'v4',
  auth: jwtClient
})

// functions
// ダミーのCPU温度取得処理
const fetchTemperature = function() {
  const array = [41.0, 41.5, 42.0]
  return array[Math.floor(Math.random() * array.length)]
}
// ログ追加処理
const appendRow = function() {
  const value = fetchTemperature()
  const sentAt = dateformat(new Date(), 'isoUtcDateTime')
  console.log(`[${sentAt}] ${value}`)
  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [sentAt, value]
      ]
    }
  })
}

// main
jwtClient.authorize(function(err, tokens) {
  setInterval(function() {
    appendRow()
  }, 5000)
})
