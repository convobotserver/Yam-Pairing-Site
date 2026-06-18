const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const router = express.Router();
const pino = require('pino');
const {
    default: Mbuvi_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    if (!num) {
        return res.status(400).send({ error: 'Number is required' });
    }
    num = num.replace(/[^0-9]/g, ''); // सिर्फ digits रखें

    async function Mbuvi_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            const Pair_Code_By_Mbuvi_Tech = Mbuvi_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
                },
                printQRInTerminal: false,
                logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
                browser: Browsers.macOS('Chrome')
            });

            // अगर पहले से registered है तो सीधा connect करें
            if (Pair_Code_By_Mbuvi_Tech.authState.creds.registered) {
                // connection.update event संभालेगा
            } else {
                await delay(1500);
                const code = await Pair_Code_By_Mbuvi_Tech.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code }); // पेयरिंग कोड HTTP response में भेजें
                }
            }

            Pair_Code_By_Mbuvi_Tech.ev.on('creds.update', saveCreds);
            Pair_Code_By_Mbuvi_Tech.ev.on('connection.update', async (s) => {
                const { connection, lastDisconnect } = s;
                if (connection === 'open') {
                    await delay(5000);
                    // creds.json पढ़ें
                    let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                    await delay(800);
                    let b64data = Buffer.from(data).toString('base64');
                    let sessionMessage = 'ARSLAN-MD~' + b64data;

                    // Bot के अपने नंबर पर session भेजें (बैकअप के लिए)
                    await Pair_Code_By_Mbuvi_Tech.sendMessage(
                        Pair_Code_By_Mbuvi_Tech.user.id,
                        { text: sessionMessage }
                    );

                    // अब **आपके नंबर** पर welcome message भेजें – यही से WhatsApp notification आएगा
                    const welcomeText = `
╔════════════════════◇
║ 『 SESSION CONNECTED』
║ ✨𝟗𝐌𝐀𝐍-𝐗-𝐘𝐀𝐌𝐃𝐇𝐔𝐃💚💫
║ ✨ 𝟗𝐌𝐀𝐌-𝐗-𝐘𝐀𝐌𝐃𝐇𝐔𝐃 __𝐂𝐇𝐔𝐓 𝐊𝐀 𝐏𝐈𝐘𝐀𝐒𝐀
╚════════════════════╝

---

╔════════════════════◇
║『 YOU'VE CHOSEN 𝟗𝐦𝐚𝐧-𝐱-𝐲𝐚𝐦𝐝𝐡𝐮𝐝 』
║ -Set the session ID in Heroku:
║ - SESSION_ID: 
╚════════════════════╝
╔════════════════════◇
║ 『••• _V𝗶𝘀𝗶𝘁 𝗙𝗼𝗿_H𝗲𝗹𝗽 •••』
║❍ 𝐎𝐰𝐧𝐞𝐫: 918075498750
║❍ 𝐭𝐞𝐥𝐞𝐠𝐫𝐚𝐦 𝐜𝐡𝐚𝐭 𝐠𝐜: https://t.me/+ZGkt2oRV4oFmYjRl
║❍ 𝐭𝐞𝐥𝐞𝐠𝐫𝐚𝐦 𝐜𝐡𝐚𝐧𝐧𝐞𝐥: https://t.me/noman_3020
║❍ 𝐖𝐩 𝐜𝐨𝐦𝐦𝐮𝐧𝐢𝐭𝐲: https://chat.whatsapp.com/DRCi30XrXKs84G519JYcSI
║
║ ☬ ☬ ☬ ☬
╚═════════════════════╝
𒂀 Enjoy 𝟗𝐦𝐚𝐧-𝐱-𝐘𝐀𝐌𝐃𝐇𝐔𝐃

---

Don't Forget To Give Star⭐ To My Repo
______________________________`;

                    // **यहाँ महत्वपूर्ण बदलाव** – message उस नंबर पर भेजें जो आपने दिया था
                    await Pair_Code_By_Mbuvi_Tech.sendMessage(
                        num + '@s.whatsapp.net',
                        { text: welcomeText }
                    );

                    await delay(100);
                    await Pair_Code_By_Mbuvi_Tech.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (connection === 'close' && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    await delay(10000);
                    Mbuvi_MD_PAIR_CODE(); // पुनः प्रयास
                }
            });
        } catch (err) {
            console.error('Pairing error:', err);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: 'Service Currently Unavailable' });
            }
        }
    }

    return await Mbuvi_MD_PAIR_CODE();
});

module.exports = router;
