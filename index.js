const { createCanvas, loadImage, registerFont } = require("canvas");
const express = require("express");
const app = express();
const { x, y, px, py } = {
    x: 1300,
    y: 600,
    px: 20,
    py: 10
};
const canvas = createCanvas(x, y, "png");
const g = canvas.getContext("2d");
g.fillStyle = "#ab96b2";
g.fillRect(0, 0, x, y);
registerFont("Roboto-Regular.ttf", {
    family: "Roboto-Regular",
    weight: 40
});
const api_uri = "http://127.0.0.1:8080" //
app.get("/canvas", async (request, reply) => {
    reply.set('Cache-control', 'public, max-age=0');
    reply.set('X-Robots-Tag', 'noindex');
    const data = await fetch(`${api_uri}/spotify/`).then(res => res.json());
    if (!data.is_playing) {
        reply.type('image/gif');
        const file = require('fs').readFileSync("./img/lonely.gif");
        return reply.send(file);
    }
    reply.type('image/png');
    const buff = await spotify(g, data);
    return reply.send(buff);
});

app.set('view engine', 'ejs');
app.get('/svg', async function (req, res) {
    res.set('Cache-control', 'public, max-age=0');
    res.set('X-Robots-Tag', 'noindex');
    const data = await fetch(`${api_uri}/spotify/`).then(res => res.json());
    if (!data.is_playing) {
        res.type('image/gif');
        const file = require('fs').readFileSync("./img/lonely.gif");
        return res.send(file);
    }
    data.queue = await Promise.all(data.queue?.slice(0, 10).map((s) => ({
        ...s,
        canvas: createCanvas(64, 64, "png")
    })).map(async (s) => {
        await loadImage(s.image.url).then((img) => s.canvas.getContext("2d").drawImage(img, 0, 0, 64, 64));
        return s;
    }));
    data.canvas = createCanvas(64, 64, "png")
    data.artists = data.artists.map(a => a.name).join(", ")
    await loadImage(data.image.url).then((img) => data.canvas.getContext("2d").drawImage(img, 0, 0, 64, 64));
    res.type('image/svg+xml');
    res.render('pages/index', {
        data,
        icon: require('fs').readFileSync("./img/icon.png")
    });
});


app.listen(3010, "127.0.0.1", () => {
    console.log(`listening on http://127.0.0.1:3010/`);
});

/**
 * @param {CanvasRenderingContext2D} ctx 
 */
async function spotify(ctx, data) {
    const promises = [];
    //console.log(data);
    //console.log({ from: moment().diff(data.reqTime, "milliseconds"), to: moment().diff(date, "milliseconds") });
    /* -------------- */
    const widTh = 500;
    let startx = x - py - widTh,
        starty = py,
        width = widTh,
        height = y - py * 2;
    ctx.beginPath();
    ctx.roundRect(startx, starty, width, height, [20, 10]);
    ctx.strokeStyle = "#535353";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#212121"
    ctx.fill();
    ctx.closePath();
    /* -------------- */
    startx = startx + py;
    starty = starty + py;
    width = width - 2 * py;
    let headheight = 150;
    ctx.beginPath();
    ctx.roundRect(startx, starty, width, headheight, [10, 10, 40, 10]);
    ctx.strokeStyle = "#121212";
    //ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "#121212"
    ctx.fill();
    ctx.closePath();
    promises.push({
        image: './img/icon.png',
        startx: x - 2 * py - 64,
        starty: starty + headheight - 64,
        kenar: 64
    });
    /* -------------- */
    startx = startx + py - 6;
    const startKapat = starty;
    starty = starty + py - 6;
    let kenar = headheight - 2 * (py - 6);
    promises.push({
        image: data.image.url,
        startx,
        starty,
        kenar
    });
    startx = startx + kenar + 6;
    starty = starty + 32;
    const maxTextWith = width - kenar - 2 * py;
    ctx.fillStyle = "#1db954";
    ctx.font = "28px Roboto-Regular";
    ctx.fillText(data.song, startx, starty, maxTextWith);
    starty = starty + 28;
    ctx.font = "20px Roboto-Regular";
    ctx.fillText(data.artists.map(a => a.name).join(", "), startx, starty, maxTextWith);
    ctx.font = "14px Roboto-Regular";
    ctx.fillText(data.progress.from, startx, starty + 28 + 2 * py, maxTextWith);
    ctx.fillText(data.progress.to, startx + maxTextWith - 36 - 64, starty + 28 + 2 * py, maxTextWith);
    /* -------------- */
    const prg = data.progress_ms / data.duration_ms;
    ctx.beginPath();
    ctx.roundRect(startx, starty + 28 + 3 * py, (maxTextWith - py - 64) * prg, 4);
    ctx.fillStyle = "#1db954";
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.roundRect(startx + (maxTextWith - py - 64) * prg, starty + 28 + 3 * py, (maxTextWith - (maxTextWith - py - 64) * prg) - py - 64, 4);
    ctx.fillStyle = "#535353";
    ctx.fill();
    ctx.closePath();
    //ctx.lineWidth = 1;
    /* -------------- */
    const queue = data.queue;
    const ekenar = kenar;
    kenar = kenar * 63 / 99
    let startiv = startKapat + py,
        startix = startx - py - ekenar;
    for (let i = 0; i < (queue.length > 4 ? 4 : queue.length) && queue[i]; i++) {
        const song = queue[i];
        /* -------------- */
        startx = startix + (py / 2);
        starty = startiv + kenar * i + ekenar + py * (i + 1);
        promises.push({
            image: song.image.url,
            startx,
            starty,
            kenar
        });
        //console.log({ song: song.name, startx, starty, kenar, })
        startx = startx + 6 + kenar;
        starty = starty + 32;
        const maxTextWith = width - kenar - 2 * py;
        ctx.fillStyle = "#ffffff";
        ctx.font = "28px Roboto-Regular";
        ctx.fillText(song.name, startx, starty, maxTextWith);
        startx = startx;
        starty = starty + 28;
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Roboto-Regular";
        ctx.fillText(song.artists, startx, starty, maxTextWith);
        //console.log({ [1 + i]: moment().diff(data.reqTime, "milliseconds") });
    }
    const loadImages = promises.map(async ({ startx, starty, kenar, image }) => ({ startx, starty, kenar, image: await loadImage(image) }));
    //console.log({ from: moment().diff(data.reqTime, "milliseconds"), to: moment().diff(date, "milliseconds") });
    await Promise.all(await Promise.all(loadImages).then((src) => {
        return src.map(({ startx, starty, kenar, image }) => ctx.drawImage(image, startx, starty, kenar, kenar));
    }));
    return canvas.toBuffer();
}