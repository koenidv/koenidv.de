const fetch = require("node-fetch");
const { fetch_key } = process.env;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'Origin, X-Requested-With, Content-Type, Accept',
}

exports.handler = async (event, context) => {
    const url = event.queryStringParameters.url
    const key = event.queryStringParameters.key

    if (key !== fetch_key) return;

    return fetch(url, { headers: { Accept: "application/json" } })
        .then((response) => response.json())
        .then((data) => ({
            statusCode: 200,
            headers: {
                ...CORS_HEADERS,
                "Cache-Control": "max-age=604800",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data),
        }))
        .catch((error) => ({ statusCode: 422, body: String(error) }));
};