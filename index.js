class AudioVisualizer {
    constructor(canvasId, audioInputId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.input = document.getElementById(audioInputId);
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.input.addEventListener('change', (e) => this.handleFile(e));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    async handleFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

        this.setupAudio(audioBuffer);
    }

    setupAudio(buffer) {
        if (this.source) this.source.stop();

        this.source = this.audioContext.createBufferSource();
        this.source.buffer = buffer;

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.8;

        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.source.start();
        this.draw();
    }

    draw() {
        requestAnimationFrame(() => this.draw());
        this.analyser.getByteFrequencyData(this.dataArray);

        this.ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const barWidth = (this.canvas.width / this.dataArray.length) * 2.5;
        let x = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            const barHeight = (this.dataArray[i] / 255) * this.canvas.height * 0.7;

            const gradient = this.ctx.createLinearGradient(0, this.canvas.height, 0, 0);
            gradient.addColorStop(0, '#7000ff');
            gradient.addColorStop(1, '#00f2ff');

            this.ctx.fillStyle = gradient;
            
            this.ctx.fillRect(x, (this.canvas.height - barHeight) / 2, barWidth - 2, barHeight);

            x += barWidth;
        }
    }
}

new AudioVisualizer('visualizer', 'audio-input');
