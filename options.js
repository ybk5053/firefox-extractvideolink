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
            document.getElementsByClassName("script")[0].hidden = true
            document.getElementsByClassName("webhook")[0].hidden = true
            break;
        case "webhook":
            document.getElementsByClassName("aria")[0].hidden = true
            document.getElementsByClassName("script")[0].hidden = true
            document.getElementsByClassName("webhook")[0].hidden = false
            break;
        case "script":
            document.getElementsByClassName("aria")[0].hidden = true
            document.getElementsByClassName("script")[0].hidden = false
            document.getElementsByClassName("webhook")[0].hidden = true
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
        document.getElementById("script").value = ""
        document.getElementById("weburl").value = ""
        document.getElementById("body").value = ""
        document.getElementById("req").value = "GET"

        while (document.getElementById("header").children.length > 5) {
            document.getElementById("header").children[1].remove()
        }
        document.getElementById("header").children[1].children[0].value = ""
        document.getElementById("header").children[2].children[0].value = ""

        let a = s["action"][tab]
        document.getElementById("name").value = a["name"]
        document.getElementById("type").value = a["type"]
        rendertype(a["type"])
        if (a["type"] === "aria") {
            document.getElementById("ariaurl").value = a["host"]
            document.getElementById("secret").value = a["secret"]
        }
        if (a["type"] === "script") {
            document.getElementById("script").value = a["script"]
        }
        if (a["type"] === "webhook") {
            document.getElementById("weburl").value = a["host"]
            document.getElementById("body").value = a["body"]
            document.getElementById("req").value = a["req"]
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
        s["action"][tab] = { name: "", host: "", secret: "", script: "", body: "", req: "", headers: {}, type: "aria" }
        browser.storage.local.set(s)
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
        s["action"][tab] = { name: "", host: "", secret: "", script: "", body: "", req: "", headers: {}, type: "aria" }
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
        if (a["type"] === "script") {
            // a["script"] = document.getElementById("script").value
            let msg = document.createElement("div")
            msg.classList.add("fail")
            msg.innerText = "Script disabled"
            document.body.appendChild(msg)
        }
        browser.storage.local.set(s)
        renderTab(tab)

        let msg = document.createElement("div")
        msg.classList.add("success")
        msg.innerText = "Done"
        document.body.appendChild(msg)
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