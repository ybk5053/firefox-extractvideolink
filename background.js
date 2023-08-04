browser.tabs.onUpdated.addListener(handleUpdated)
browser.tabs.onRemoved.addListener(handleClosed)
browser.webRequest.onHeadersReceived.addListener(handleResponse, { urls: ["<all_urls>"] }, ["responseHeaders"])
browser.webRequest.onBeforeSendHeaders.addListener(handleSendRequest, { urls: ["<all_urls>"] }, ["requestHeaders"])

async function handleUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === "complete") {
        return
    }
    if (!changeInfo.url) {
        return
    }
    if (tab.url.includes("moz-extension://")) {
        return
    }
    let id = tabId.toString()
    let host = new URL(tab.url).hostname
    if (host == "") {
        return
    }
    let t = {}
    t[id] = { "url": host, "media": [] }
    browser.storage.local.set(t)
}

async function handleClosed(tabId, removeInfo) {
    browser.storage.local.remove(tabId.toString())
    browser.storage.local.get().then((s) => {
        for (let k in s) {
            if (s[k]["tab"] === tabId) {
                browser.storage.local.remove(k)
            }
        }
    })
}

function handleSendRequest(req) {
    if (req.tabId === -1) {
        return
    }
    let t = {}
    t[req.requestId + "req"] = { headers: req.requestHeaders, tab: req.tabId }
    browser.storage.local.set(t)
}

function handleResponse(resp) {
    const urlstr = resp.url
    headers = resp.responseHeaders.filter((header) => header.name == "content-type")
    if (headers.length == 0) {
        headers = resp.responseHeaders.filter((header) => header.name == "Content-Type")
    }
    if (headers.length == 0) {
        return
    }
    let t = resp.type
    let type = headers[0]["value"]
    if ((!type.includes("video") || type.includes("video/MP2T")) && !type.includes("mpegurl") && !t.includes("media") && !urlstr.includes(".m3u")) {
        return
    }
    t = type
    let url = new URL(resp.originUrl)
    if (url.host.includes("youtube")) {
        resp.url = resp.url.replace(/&range=.*&/i, "&")
        resp.url = resp.url.replace(/&rbuf=[0-9]*/i, "")
    }


    browser.storage.local.get(resp.tabId.toString()).then((val) => {
        if (val[resp.tabId] != null) {
            if (val[resp.tabId]["media"].filter((x) => { return resp.url === x.link }).length < 1) {
                val[resp.tabId]["media"].push({ link: resp.url, type: t, id: resp.requestId + "req" })
                browser.storage.local.set(val)
            }
        }
    })
}