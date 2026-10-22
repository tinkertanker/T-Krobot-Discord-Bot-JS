"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
require("./support/fakes.js"); // ensures config.json exists

const shortenURL = require("../shorten.js");
const createNotionPage = require("../notion.js");
const { shortIoKey, notionKey } = require("../config.json");

function mockFetch(t, responseBody, { capture = {} } = {}) {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    capture.url = url;
    capture.options = options;
    return { json: async () => responseBody };
  });
  return capture;
}

test("shortenURL posts the expected payload and auth header to short.io", async (t) => {
  const capture = mockFetch(t, { shortURL: "https://tk.sg/x" });
  const result = await shortenURL("https://example.com/very/long?q=1", "x");
  assert.equal(capture.url, "https://api.short.io/links");
  assert.equal(capture.options.method, "POST");
  assert.equal(capture.options.headers.Authorization, shortIoKey);
  assert.equal(capture.options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(capture.options.body), {
    domain: "tk.sg",
    originalURL: "https://example.com/very/long?q=1",
    path: "x",
  });
  assert.deepEqual(result, { shortURL: "https://tk.sg/x" });
});

test("shortenURL survives adversarial path characters via JSON encoding", async (t) => {
  const capture = mockFetch(t, {});
  const hostile = 'we"ird\\path\nwith\u0000ctrl';
  await shortenURL("https://example.com", hostile);
  assert.equal(JSON.parse(capture.options.body).path, hostile);
});

test("shortenURL propagates network failures to the caller", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("ECONNRESET");
  });
  await assert.rejects(() => shortenURL("https://example.com", "x"), /ECONNRESET/);
});

test("createNotionPage posts the expected page structure with auth headers", async (t) => {
  const capture = mockFetch(t, { url: "https://notion.so/page" });
  const result = await createNotionPage("Class Name", "discord info");
  assert.equal(capture.url, "https://api.notion.com/v1/pages");
  assert.equal(capture.options.headers.Authorization, `Bearer ${notionKey}`);
  assert.equal(capture.options.headers["Notion-Version"], "2025-09-03");
  const body = JSON.parse(capture.options.body);
  assert.equal(body.parent.data_source_id, "e5451886-30b8-41b7-94e8-1991240255fe");
  assert.equal(body.properties.Name.title[0].text.content, "Class Name");
  assert.equal(body.properties.DiscordInfo.rich_text[0].text.content, "discord info");
  assert.equal(body.properties.Active.checkbox, true);
  assert.deepEqual(result, { url: "https://notion.so/page" });
});

test("createNotionPage passes unicode and very long names through untouched", async (t) => {
  const capture = mockFetch(t, {});
  const name = "🤖 ".repeat(500) + "終";
  await createNotionPage(name, "info");
  assert.equal(JSON.parse(capture.options.body).properties.Name.title[0].text.content, name);
});
