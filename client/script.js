let scene, camera, renderer;
const socket = new WebSocket('ws://192.168.1.130:8080');

let paddles = [];
let ball;

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);

    if (data.type === 'init') {
        // Paddle'ları ve topu oluştur
        createPaddles();
        createBall(data.state.ball);

        // Paddle pozisyonlarını güncelle
        data.state.paddles.forEach((paddle, index) => {
            paddles[index].position.set(paddle.x, paddle.y, 0);
        });
    }

    if (data.type === 'updatePaddle') {
        paddles[data.player].position.y = data.y;
    }

    if (data.type === 'updateBall') {
        ball.position.set(data.ball.x, data.ball.y, 0);
    }
};

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera.position.z = 10;

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function createPaddles() {
    const paddleGeometry = new THREE.BoxGeometry(0.5, 3, 0.1);
    const paddleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterial);
    const paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterial);

    paddle1.position.set(-7.5, 0, 0); // Sol paddle
    paddle2.position.set(7.5, 0, 0);  // Sağ paddle

    scene.add(paddle1);
    scene.add(paddle2);

    paddles.push(paddle1, paddle2);
}

function createBall(initialState) {
    const ballGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(initialState.x, initialState.y, 0);
    scene.add(ball);
}

document.getElementById('gameCanvas').addEventListener('mousemove', function(event) {
    const rect = this.getBoundingClientRect();
    const y = ((event.clientY - rect.top) / this.clientHeight) * 20 - 10;
    const player = 0; // Player 1

    paddles[player].position.y = y;
    socket.send(JSON.stringify({ type: 'movePaddle', player: player, y: y }));
});

init();
