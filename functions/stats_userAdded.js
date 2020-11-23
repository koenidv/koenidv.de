const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

var creds = '$SPH_GOOGLE_CREDENTIALS'
var token = '$SPH_GOOGLE_TOKEN'

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  oAuth2Client.setCredentials(JSON.parse(token));
  callback(oAuth2Client);
}

/**
 * Adds 1 to user counter in the spreadsheet
 */

let values = [[new Date().toJSON().slice(0, 10).replace(/-/g, '/')]];
const resource = { values };

function updateCounter(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  sheets.spreadsheets.values.append({
    spreadsheetId: '$SPH_GOOGLE_SHEET',
    range: "Tabellenblatt1!A1:A",
    valueInputOption: "USER_ENTERED",
    resource: resource
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    console.log("Success");
  });
}


exports.handler = async function (event, context, callback) {

  authorize(JSON.parse(creds), updateCounter);

  callback(null, {
    statusCode: 201,
    headers: {
      Location: "https://koenidv.de/autosph.html"
    }
  });
}