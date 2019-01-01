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
const execSync = require('child_process').execSync

// functions
// CPU温度取得処理
const fetchTemperature = function() {
  const cmd = 'vcgencmd measure_temp | sed -e "s/temp=//" | sed -e "s/\'C//"'
  return parseFloat(execSync(cmd).toString())
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
// ログローテート処理
const rotateRows = function() {
  sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A:B'
  }).then(response => {
    // 60行以上を削除
    const rowsCount = response.data.values.length
    const deleteRowsCount = rowsCount - 60
    if (deleteRowsCount > 0) {
      sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  dimension: "ROWS",
                  startIndex: 0,
                  endIndex: deleteRowsCount
                }
              }
            }
          ]
        }
      })
    }
  })
}

// main
jwtClient.authorize(function(err, tokens) {
  setInterval(async function() {
    await appendRow()
    rotateRows()
  }, 60000)
})
