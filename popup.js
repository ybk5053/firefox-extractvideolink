document.getElementById("run").onclick = function () {
    let i = parseInt(document.getElementById("select").value)
    let url = document.getElementById("table").getElementsByTagName("tr")[i + 1].getElementsByTagName("td")[1].getElementsByTagName("a")[0].href

    let j = document.getElementById("action").value

    browser.runtime.getPlatformInfo().then((info) => {
        if (info.os === browser.runtime.PlatformOs.ANDROID) {
            return browser.tabs.query({ active: true })
        } else {
            return browser.windows.getCurrent({}).then((win) => {
                return browser.tabs.query({ active: true, windowId: win.id })
            })
        }
    }).then((tab) => {
        return browser.storage.local.get(tab[0].id.toString()).then((tabstore) => {
            return browser.storage.local.get(tabstore[tab[0].id.toString()]["media"][i]["id"]).then((s) => {
                let referer = null
                let h = s[tabstore[tab[0].id.toString()]["media"][i]["id"]]["headers"]
                h = h.map((o) => {
                    if (o["name"].includes("eferer")) {
                        referer = o["value"]
                        return
                    }
                    return o["name"] + ":" + o["value"]
                })
                return browser.storage.local.get("action").then((s) => {
                    act = s["action"][j]
                    if (act["type"] === "aria") {
                        let host = act["host"]
                        let secret = act["secret"]

                        let xmlHttp = new XMLHttpRequest()
                        xmlHttp.onerror = function (err) {
                            console.log(err)
                            document.getElementById("fff").style.display = "inline-block"
                            document.getElementById("sss").style.display = "none"
                        }
                        xmlHttp.onload = function () {
                            if (this.responseText.includes("error")) {
                                document.getElementById("fff").style.display = "inline-block"
                                document.getElementById("sss").style.display = "none"
                            } else {
                                document.getElementById("fff").style.display = "none"
                                document.getElementById("sss").style.display = "inline-block"
                            }
                        }
                        xmlHttp.open("POST", host, true)
                        let data = JSON.stringify({ "jsonrpc": "2.0", "id": "qwer", "method": "aria2.addUri", "params": ["token:" + secret, [url], { "referer": referer }] })
                        xmlHttp.send(data)
                        return
                    }
                    if (act["type"] === "script") {
                        // let script = act["script"]
                        // script.replace("{{url}}", url)
                        // script.replace("{{ url }}", url)
                        // script.replace("{{referer}}", referer)
                        // script.replace("{{ referer }}", referer)
                        // try {
                        //     eval(script)
                        //     document.getElementById("fff").style.display = "none"
                        //     document.getElementById("sss").style.display = "inline-block"
                        // } catch (err) {
                        //     console.log(err)
                        //     document.getElementById("fff").style.display = "inline-block"
                        //     document.getElementById("sss").style.display = "none"
                        //     return
                        // }
                        console.log("script disabled")
                        return
                    }
                    if (act["type"] === "webhook") {
                        let host = act["host"]
                        let req = act["req"]

                        let xmlHttp = new XMLHttpRequest()
                        xmlHttp.onerror = function (err) {
                            console.log(err)
                            document.getElementById("fff").style.display = "inline-block"
                            document.getElementById("sss").style.display = "none"
                        }
                        xmlHttp.onload = function () {
                            if (this.responseText.includes("error")) {
                                document.getElementById("fff").style.display = "inline-block"
                                document.getElementById("sss").style.display = "none"
                            } else {
                                document.getElementById("fff").style.display = "none"
                                document.getElementById("sss").style.display = "inline-block"
                            }
                        }

                        xmlHttp.overrideMimeType("text/plain")
                        xmlHttp.open(req, host, true)
                        for (let key in act["headers"]) {
                            xmlHttp.setRequestHeader(key, act["headers"][key])
                        }

                        if (req === "GET") {
                            xmlHttp.send()
                            return
                        }
                        let body = act["body"]
                        body = body.replace("{{url}}", url)
                        body = body.replace("{{ url }}", url)
                        body = body.replace("{{ referer }}", referer)
                        body = body.replace("{{referer}}", referer)
                        xmlHttp.send(body)
                        return
                    }
                })
            })
        })
    })
}

browser.storage.local.get("action").then((s) => {
    for (let k in s["action"]) {
        if (s["action"][k]["name"]) {
            let option = document.createElement("option")
            option.value = k
            option.innerText = k + ":" + s["action"][k]["name"]
            document.getElementById("action").appendChild(option)
        }
    }
})

let android = false
browser.runtime.getPlatformInfo().then((info) => {
    if (info.os === browser.runtime.PlatformOs.ANDROID) {
        android = true
        document.body.style["font-size"] = "25pt"
        document.getElementById("header").style["font-size"] = "50pt"
        document.body.style.width = (document.documentElement.clientWidth * 0.9).toString() + "px"
        return browser.tabs.query({ active: true })
    } else {
        return browser.windows.getCurrent({}).then((win) => {
            return browser.tabs.query({ active: true, windowId: win.id })
        })
    }
}).then((tab) => {
    return browser.storage.local.get(tab[0].id.toString())
}).then((storage) => {
    for (let key in storage) {
        document.getElementById("header").innerText = storage[key]["url"].toUpperCase()
        for (let i in storage[key]["media"]) {
            document.getElementById("run").disabled = false
            let table = document.getElementById("table")
            let row = table.insertRow(table.rows.length)
            let cell = row.insertCell(0)
            cell.appendChild(document.createTextNode(i + ": " + storage[key]["media"][i]["type"].slice(0, 20)))
            cell = row.insertCell(1)
            let a = document.createElement("a")
            a.href = storage[key]["media"][i]["link"]
            let f = storage[key]["media"][i]["link"].split("?")[0]
            f = f.split("/")
            f = f[f.length - 1]
            a.appendChild(document.createTextNode(storage[key]["media"][i]["link"].slice(0, 50)))
            a.appendChild(document.createElement("br"))
            a.appendChild(document.createTextNode(f))
            if (android) {
                a.onclick = function () {
                    let [scheme, url] = storage[key]["media"][i]["link"].split('://');
                    let intentOpts = [
                        'action=android.intent.action.VIEW',
                        'scheme=' + scheme,
                        'category=android.intent.category.DEFAULT',
                        'type=video/*',
                    ];
                    browser.tabs.create({
                        url: `intent://${url}#Intent;${intentOpts.join(';')};end`,
                    });
                    navigator.clipboard.writeText(storage[key]["media"][i]["link"])
                    return false
                }
            }
            cell.appendChild(a)
            cell = row.insertCell(2)
            let b = document.createElement("button")
            b.onclick = function () {
                browser.storage.local.get(storage[key]["media"][i]["id"]).then((s) => {
                    let h = s[storage[key]["media"][i]["id"]]["headers"]
                    h = h.map((o) => {
                        return o["name"] + ":" + o["value"]
                    })
                    navigator.clipboard.writeText(h.join("\n"))
                })
            }
            b.style["font-size"] = "inherit"
            b.style.borderRadius = "5px"
            let icon = document.createElement("i")
            icon.classList.add("fa")
            icon.classList.add("fa-files-o")
            icon.classList.add("fa-2xl")
            icon.classList.add("copy")
            b.appendChild(icon)
            cell.appendChild(b)
            let option = document.createElement("option")
            option.value = i
            option.innerText = i.toString()
            document.getElementById("select").appendChild(option)
        }
    }
})

document.getElementById("option").onclick = function() {
    console.log("hihihi")
    browser.runtime.openOptionsPage()
}