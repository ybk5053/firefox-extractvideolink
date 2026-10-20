browser.storage.local.get("action").then((s) => {
    if (Object.keys(s).length === 0) {
        initAction("0")
        //add default tablink
        createTabButton("0")
    } else {
        for (let k in s["action"]) {
            //add tablinks
            createTabButton(k)
        }
    }
    renderTab("0")
    //add addtab onclick
    document.getElementById("addtab").onclick = function () {
        clearmsg()
        addTab()
    }
    document.getElementById("savepkg").onclick = function () {
        savePkg()
    }
    loadPkg()
})

browser.runtime.getPlatformInfo().then((info) => {
    if (info.os === browser.runtime.PlatformOs.ANDROID) {
        document.getElementById("pkg").hidden = false
    }
})

rendertype(document.getElementById("type").value)

document.getElementById("type").onchange = function () {
    clearmsg()
    rendertype(document.getElementById("type").value)
}

document.getElementById("del").onclick = function () {
    clearmsg()
    delTab(document.getElementById("action").innerText)
}

document.getElementById("save").onclick = function () {
    clearmsg()
    saveAction(document.getElementById("action").innerText)
}

document.getElementById("addheader").onclick = function () {
    clearmsg()
    let h = document.getElementById("header")

    let kval = document.createElement("label")
    kval.innerHTML = 'key:<input type="text">'
    h.insertBefore(kval, this)

    let lval = document.createElement("label")
    lval.innerHTML = 'value:<input type="text">'
    h.insertBefore(lval, this)

    h.insertBefore(document.createElement("br"), this)
}

function rendertype(type) {
    switch (type) {
        case "aria":
            document.getElementsByClassName("aria")[0].hidden = false
            document.getElementsByClassName("webhook")[0].hidden = true
            break;
        case "webhook":
            document.getElementsByClassName("aria")[0].hidden = true
            document.getElementsByClassName("webhook")[0].hidden = false
            break;
    }
}

function renderTab(tab) {
    browser.storage.local.get("action").then((s) => {
        if (!s["action"] || !s["action"][tab]) {
            return
        }
        document.getElementById("ariaurl").value = ""
        document.getElementById("secret").value = ""
        document.getElementById("weburl").value = ""
        document.getElementById("body").value = ""
        document.getElementById("req").value = "GET"

        while (document.getElementById("header").children.length > 5) {
            document.getElementById("header").children[1].remove()
        }
        document.getElementById("header").children[1].children[0].value = ""
        document.getElementById("header").children[2].children[0].value = ""
        document.getElementById("variable").value = 0

        let a = s["action"][tab]
        document.getElementById("name").value = a["name"]
        document.getElementById("type").value = a["type"]
        rendertype(a["type"])
        if (a["type"] === "aria") {
            document.getElementById("ariaurl").value = a["host"]
            document.getElementById("secret").value = a["secret"]
        }
        if (a["type"] === "webhook") {
            document.getElementById("weburl").value = a["host"]
            document.getElementById("body").value = a["body"]
            document.getElementById("req").value = a["req"]
            document.getElementById("variable").value = a["variable"] || 0
            for (let k in a["headers"]) {
                let h = document.getElementById("header")
                h.insertBefore(document.createElement("br"), h.children[1])

                let lval = document.createElement("label")
                lval.innerHTML = "value:"
                let input = document.createElement("input")
                input.type = "text"
                input.value = a["headers"][k]
                lval.appendChild(input)
                h.insertBefore(lval, h.children[1])

                let kval = document.createElement("label")
                kval.innerHTML = "key:"
                input = document.createElement("input")
                input.type = "text"
                input.value = k
                kval.appendChild(input)
                h.insertBefore(kval, h.children[1])
            }
        }
    })
}

function openTab(tab) {
    document.getElementById("action").innerText = tab
    renderTab(tab)
}

function addTab() {
    let i = (document.getElementsByClassName("tablinks").length - 1).toString()
    initAction(i)
    createTabButton(i)
}

function initAction(tab) {
    browser.storage.local.get("action").then((s) => {
        if (!s["action"]) {
            s["action"] = {}
        }
        s["action"][tab] = { name: "", host: "", secret: "", body: "", req: "", headers: {}, type: "aria", variable: "0"}
        browser.storage.local.set(s)
        openTab(tab)
    })
}

function createTabButton(tab) {
    let b = document.createElement("button")
    b.classList.add("tablinks")
    b.innerText = tab
    b.onclick = function () {
        clearmsg()
        openTab(tab)
    }
    document.getElementById("tabs").insertBefore(b, document.getElementById("addtab"))
}

function delTab(tab) {
    let c = document.getElementById("tabs").children
    browser.storage.local.get("action").then((s) => {
        for (let i = parseInt(tab); i < c.length - 1; i++) {
            if (i === document.getElementById("tabs").children.length - 2) {
                delete s["action"][i.toString()]
                c[i].remove()
                continue
            }
            s["action"][i.toString()] = s["action"][(i + 1).toString()]
        }
        browser.storage.local.set(s)
        renderTab("0")

        let msg = document.createElement("div")
        msg.classList.add("success")
        msg.innerText = "Done"
        document.body.appendChild(msg)
    })
}

function saveAction(tab) {
    browser.storage.local.get("action").then((s) => {
        s["action"][tab] = { name: "", host: "", secret: "", body: "", req: "", headers: {}, type: "aria", variable: "0" }
        let a = s["action"][tab]
        a["name"] = document.getElementById("name").value
        a["type"] = document.getElementById("type").value
        if (a["type"] === "aria") {
            a["host"] = document.getElementById("ariaurl").value
            a["secret"] = document.getElementById("secret").value
        }
        if (a["type"] === "webhook") {
            a["host"] = document.getElementById("weburl").value
            a["body"] = document.getElementById("body").value
            a["req"] = document.getElementById("req").value
            a["variable"] = document.getElementById("variable").value
            let h = document.getElementById("header").children
            for (let i = 0; i < h.length; i++) {
                if (h[i].nodeName === "BR" || h[i].id === "addheader") {
                    continue
                }
                if (h[i].children[0].value === "" || h[i + 1].children[0].value === "") {
                    i++
                    continue
                }
                a["headers"][h[i].children[0].value] = h[i + 1].children[0].value
                i++
            }
        }
        browser.storage.local.set(s)
        renderTab(tab)

        let msg = document.createElement("div")
        msg.classList.add("success")
        msg.innerText = "Done"
        document.body.appendChild(msg)
    })
}

function savePkg() {
    browser.storage.local.set({ "pkgname": document.getElementById("pkgname").value })
}

function loadPkg() {
    browser.storage.local.get("pkgname").then((s) => {
        if (s["pkgname"]) {
            document.getElementById("pkgname").value = s["pkgname"]
        }
    })
}

function clearmsg() {
    for (i of document.getElementsByClassName("success")) {
        i.remove()
    }
    for (i of document.getElementsByClassName("fail")) {
        i.remove()
    }
}