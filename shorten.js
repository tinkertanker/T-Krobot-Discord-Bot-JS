const { shortIoKey } = require("./config.json");

function shortenURL(originalURL, short) {
  return fetch("https://api.short.io/links", {
    method: "POST",
    body: JSON.stringify({
      // the domain for the shortened link
      domain: "bcet.short.gy",
      originalURL,
      path: short, //short is the name of the link
    }),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: shortIoKey,
    },
  }).then((res) => res.json());
}

module.exports = shortenURL;
