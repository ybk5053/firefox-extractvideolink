browser.tabs.onUpdated.addListener(handleUpdated)
browser.tabs.onRemoved.addListener(handleClosed)
browser.webRequest.onHeadersReceived.addListener(handleResponse, { urls: ["<all_urls>"] }, ["responseHeaders"])
browser.webRequest.onSendHeaders.addListener(handleSendRequest, { urls: ["<all_urls>"] }, ["requestHeaders"])
browser.tabs.onActivated.addListener(handleTabActivated)

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
    browser.windows.getAll().then((wins) => {
        if (wins.length < 1) {
            browser.storage.local.clear()
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

    if (req.url.includes(".m3u")) {
        browser.storage.local.get(req.tabId.toString()).then((val) => {
            if (val[req.tabId] != null) {
                if (val[req.tabId]["media"].filter((x) => { return req.url === x.link }).length < 1) {
                    val[req.tabId]["media"].push({ link: req.url, type: "m3u", id: req.requestId + "req" })
                    browser.storage.local.set(val)
                }
                setBadgeText(req.tabId)
            }
        })
    }
}

function handleResponse(resp) {
    headers = resp.responseHeaders.filter((header) => header.name == "content-type")
    if (headers.length == 0) {
        headers = resp.responseHeaders.filter((header) => header.name == "Content-Type")
    }
    if (headers.length == 0) {
        return
    }
    let t = resp.type
    let type = headers[0]["value"]
    if ((!type.includes("video") || type.includes("video/MP2T")) && !type.includes("mpegurl") && !t.includes("media")) {
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
            setBadgeText(resp.tabId)
        }
    })
}

async function handleTabActivated(activeInfo) {
    setBadgeText(activeInfo.tabId)
}

async function setBadgeText(tabID) {
    browser.storage.local.get(tabID.toString()).then((val) => {
        console.log(tabID)
        if (val[tabID] != null) {
            let count = val[tabID]["media"].length
            if (count > 0) {
                browser.browserAction.setBadgeText({ text: count.toString() })
            } else {
                browser.browserAction.setBadgeText({ text: "" })
            }
        } else {
            browser.browserAction.setBadgeText({ text: "" })
        }
    })
}