const chatContainer = document.getElementById('chat')
const connectionContainer = document.getElementById('connection')

window.addEventListener('load', (e) => {
    chatContainer.hidden = true
})

const connectButton = document.getElementById('connectButton')

connectButton.onclick = (e) => {
    const nameInput = document.getElementById('nameInput')
    const roomInput = document.getElementById('roomInput')

    const room = roomInput.value
    const name = nameInput.value

    if(room && name) {
        establishConnection(room, name)
    }
}

const statusElement = document.getElementById('status')

function onConnectionEstablished() {
    connectionContainer.hidden = true
    chatContainer.hidden = false

    statusElement.innerText = 'Conexão: estabelecida'
}

const messagesContainer = document.getElementById('messages')

function onReceiveMessage(event) {
    const data = JSON.parse(event.data)

    const newMessage = document.createElement('p')
    const newDivisor = document.createElement('hr')

    if(data.type == 'system') {
        newMessage.className = 'system'
        newMessage.innerText = data.content
    } else {
        newMessage.className = 'message'
        newMessage.innerText = `${data.author}: ${data.content}`
    }

    messagesContainer.appendChild(newMessage)
    messagesContainer.appendChild(newDivisor)
}

function onConnectionClosed() {
    connectionContainer.hidden = false
    chatContainer.hidden = true

    statusElement.innerText = 'Conexão: desconetado'
}

function establishConnection(room, name) {
    let ws = new WebSocket(`ws://${location.host}/chat/${room}/${encodeURIComponent(name)}`)

    ws.onopen = onConnectionEstablished
    ws.onmessage = onReceiveMessage
    ws.onclose = onConnectionClosed
    ws.onerror = () => ws.close()

    const sendButton = document.getElementById('sendButton')

    sendButton.onclick = (e) => {
        const messageInput = document.getElementById('messageInput')

        const message = messageInput.value.trim()

        if(message && ws.readyState == WebSocket.OPEN) {
            ws.send(JSON.stringify({'content': message, 'author': name}))

            messageInput.value = ''
        }
    }
}

