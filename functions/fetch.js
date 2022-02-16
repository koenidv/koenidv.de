const fetch = require("node-fetch");
const { fetch_key } = process.env;

exports.handler = async (event, context) => {
    const url = event.queryStringParameters.url
    const key = event.queryStringParameters.key

    if (key !== fetch_key) return;

    return fetch(url, { headers: { Accept: "application/json" } })
        .then((response) => response.json())
        .then((data) => ({
            statusCode: 200,
            body: JSON.stringify(data),
        }))
        .catch((error) => ({ statusCode: 422, body: String(error) }));
};