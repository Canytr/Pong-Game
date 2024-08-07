const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let gameState = {
    ball: { x: 0, y: 0, vx: -0.01, vy: 0.005 },
    paddles: [
        { x: -0.9, y: 0 }, // Player 1 paddle
        { x: 0.9, y: 0 }   // Player 2 paddle
    ]
};

let players = [];

wss.on('connection', function connection(ws, req) {
    const ip = req.socket.remoteAddress;
    const port = req.socket.remotePort;

    console.log(`New client connected: ${ip}:${port}`);

    let playerIndex = -1;
    if (players.length < 2) {
        playerIndex = players.length;
        players.push(ws);
    } else {
        ws.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
        ws.close();
        return;
    }

    // Yeni bir istemci bağlandığında, mevcut oyun durumunu ve oyuncu numarasını gönder
    ws.send(JSON.stringify({ type: 'init', state: gameState, player: playerIndex }));

    ws.on('message', function incoming(message) {
        const data = JSON.parse(message);

        if (data.type === 'movePaddle') {
            gameState.paddles[data.player].y = data.y;
            // Tüm istemcilere paddle hareketini gönder
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'updatePaddle', player: data.player, y: data.y }));
                }
            });
        }
    });

    ws.on('close', function close() {
        console.log(`Client disconnected: ${ip}:${port}`);
        players = players.filter(player => player !== ws);
    });
});

// Topun hareketini güncelle
setInterval(function() {
    gameState.ball.x += gameState.ball.vx;
    gameState.ball.y += gameState.ball.vy;

    // Top duvara çarparsa yön değiştir
    if (gameState.ball.y > 1 || gameState.ball.y < -1) {
        gameState.ball.vy = -gameState.ball.vy;
    }

    // Paddle'lara çarpma kontrolü
    if (gameState.ball.x <= gameState.paddles[0].x + 0.02 && gameState.ball.y <= gameState.paddles[0].y + 0.1 && gameState.ball.y >= gameState.paddles[0].y - 0.1) {
        gameState.ball.vx = -gameState.ball.vx;
    }

    if (gameState.ball.x >= gameState.paddles[1].x - 0.02 && gameState.ball.y <= gameState.paddles[1].y + 0.1 && gameState.ball.y >= gameState.paddles[1].y - 0.1) {
        gameState.ball.vx = -gameState.ball.vx;
    }

    // Tüm istemcilere topun yeni pozisyonunu gönder
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'updateBall', ball: gameState.ball }));
        }
    });
}, 1000 / 60); // 60 FPS

console.log('Server is running on ws://localhost:8080');
