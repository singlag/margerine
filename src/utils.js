const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const packer = require('./packer')

let seq = 1

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

async function confirm() {
    return new Promise((resolve, reject) => {
        rl.on('line', (input) => {
            if(input=="yes") {
                resolve(true)
            }
            if(input=="no") {
                reject("don't do it")
            }
        });
    })
}


async function sendAndReceive(messageToSend, port, wait, timeout) {
    if(!timeout)
        timeout = 5
    port.write(messageToSend);
    if(!wait) {
        return;
    }
    let response = ''
    var i = 0;
    while(i < timeout) {
        i++
        response = port.read() // BLOCKING, PERHAPS WITH TIMEOUT EXCEPTION;
        if(response != null) {
            //in case the other end is spammy and our actual response hasn't arrived yet
            await sleep(1000)
            const additional = port.read()
            if(additional) {
                response = Buffer.concat([response, additional])
            }
            break
        }
        await sleep(1000)
    }
    return response
}



const talk = function(port, cmd, wait, timeout) {
    return new Promise((resolve, reject) => {
        const pack = new packer()
        pack.senderType = 10
        pack.senderId = 1
        pack.cmdType = 0
        pack.isNeedAck = (typeof cmd.isNeedAck === "undefined" ? 2 : cmd.isNeedAck)
        pack.encryptType = 0
        pack.receiverType = cmd.receiverType
        pack.receiverId = cmd.receiverId
        pack.cmdSet = cmd.cmdSet
        pack.cmdId = cmd.cmdId
        if(Buffer.isBuffer(cmd.data)) {
            pack.data = Uint8Array.from(cmd.data)
        }
        else {
            pack.data = cmd.data
        }
        pack.timeOut = 3000
        pack.seq = seq
        seq++
        try {
            pack.pack();
            //console.info("request", pack.toObject())
            //console.info("raw request", pack.toString())
            sendAndReceive(pack.toBuffer(), port, wait, timeout).then((res) => {
                if(!wait) {
                    resolve()
                    return
                }
                if(res) {
                    //console.info("raw response", res.toString("hex"))
                    const unpacker = new packer();
                    unpacker.unpack(res, pack)
                    //console.info("response", unpacker.toObject())
                    resolve(unpacker.toObject())
                }
                else {
                    reject("no response")
                }
            })
        }
        catch (error) {
            reject(error)
        }
       
    });
}

module.exports.sleep = sleep
module.exports.confirm = confirm
module.exports.talk = talk