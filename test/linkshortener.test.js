"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createInteraction, responseText } = require("./support/fakes.js");

const shorten = require("../commands/utility/linkshortener.js");

function interactionFor(originalurl, wantedpath = "x") {
  return createInteraction({ optionValues: { originalurl, wantedpath } });
}

function mockFetch(t, responseBody) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    if (responseBody instanceof Error) throw responseBody;
    return { json: async () => responseBody };
  });
  return calls;
}

test("shorten rejects malformed and non-http(s) URLs before any network call", async (t) => {
  const calls = mockFetch(t, {});
  const rejected = [
    "not a url",
    "",
    "javascript:alert(1)",
    "ftp://example.com/file",
    "file:///etc/passwd",
    "//missing-protocol.com",
  ];
  for (const bad of rejected) {
    const interaction = interactionFor(bad);
    await shorten.execute(interaction);
    assert.equal(interaction.deferred, false, `"${bad}" must be rejected before deferring`);
    assert.equal(interaction.replies[0].ephemeral, true);
    assert.match(responseText(interaction), /valid HTTP or HTTPS URL|HTTP and HTTPS/i, `"${bad}" should be rejected`);
  }
  assert.equal(calls.length, 0, "no network call may happen for invalid URLs");
});

test("shorten replies with the short URL on success", async (t) => {
  mockFetch(t, { shortURL: "https://tk.sg/x" });
  const interaction = interactionFor("https://example.com/page");
  await shorten.execute(interaction);
  assert.equal(responseText(interaction), "https://tk.sg/x");
  assert.equal(interaction.deferOptions.ephemeral, true);
});

test("shorten reports failure when short.io returns an error object", async (t) => {
  mockFetch(t, { error: "Link already exists" });
  const interaction = interactionFor("https://example.com");
  await shorten.execute(interaction);
  assert.match(responseText(interaction), /could not be shortened/);
});

test("shorten handles a null or non-object API response without crashing", async (t) => {
  // Regression: `"error" in result` throws a TypeError when result is null
  // or a primitive (e.g. short.io returning a bare string body).
  for (const body of [null, "rate limited", 42]) {
    mockFetch(t, body);
    const interaction = interactionFor("https://example.com");
    await shorten.execute(interaction);
    assert.match(responseText(interaction), /could not be shortened/,
      `response body ${JSON.stringify(body)} must be handled gracefully`);
  }
});

test("shorten handles a response missing shortURL without replying 'undefined'", async (t) => {
  mockFetch(t, { unexpected: true });
  const interaction = interactionFor("https://example.com");
  await shorten.execute(interaction);
  assert.match(responseText(interaction), /could not be shortened/);
});

test("shorten reports failure when the network call itself rejects", async (t) => {
  // Regression: a fetch rejection used to escape the command entirely.
  mockFetch(t, new Error("ECONNRESET"));
  const interaction = interactionFor("https://example.com");
  await shorten.execute(interaction);
  assert.match(responseText(interaction), /could not be shortened/);
});
