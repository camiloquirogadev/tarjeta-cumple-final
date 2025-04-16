import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import fondo from "../assets/fondo.png";
import personaje from "../assets/personaje.png";
import sonido from "../assets/sonido.mp3";
import musicaFondo from "../assets/musica-fondo.mp3";
import confetti from "canvas-confetti";

export default function TarjetaRegalo() {
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const [musicaActiva, setMusicaActiva] = useState(true);
  const [mostrarJuego, setMostrarJuego] = useState(false);
  const [puntos, setPuntos] = useState(0);
  const [vidas, setVidas] = useState(3);
  const [ganaste, setGanaste] = useState(false);

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const personajePos = useRef({ x: 100, y: 200 });
  const balas = useRef([]);
  const enemigos = useRef([{ x: 400, y: 200 }]);
  const [velocidadEnemigo, setVelocidadEnemigo] = useState(1);

  const reproducirSonido = () => {
    const audio = new Audio(sonido);
    audio.play();
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
    setMostrarMensaje(true);
  };

  useEffect(() => {
    if (vidas === 0 && mostrarJuego) {
      setGanaste(false);
    }
  }, [vidas, mostrarJuego]);

  useEffect(() => {
    if (puntos >= 150 && mostrarJuego) {
      setGanaste(true);
    }
  }, [puntos, mostrarJuego]);

  useEffect(() => {
    const audio = new Audio(musicaFondo);
    audio.volume = 0.5;
    audio.loop = true;
    audioRef.current = audio;

    const iniciarMusica = () => {
      audio.play().catch(() => { });
      window.removeEventListener("click", iniciarMusica);
    };

    window.addEventListener("click", iniciarMusica);

    return () => {
      audio.pause();
      audio.currentTime = 0;
      window.removeEventListener("click", iniciarMusica);
    };
  }, []);

  const toggleMusica = () => {
    if (!audioRef.current) return;
    musicaActiva ? audioRef.current.pause() : audioRef.current.play();
    setMusicaActiva(!musicaActiva);
  };

  useEffect(() => {
    if (!mostrarJuego || ganaste || vidas <= 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const personajeImgObj = new Image();
    personajeImgObj.src = personaje;
    const enemigoImgObj = new Image();
    enemigoImgObj.src = require("../assets/enemigo.png");
    const fondoCanvasImg = new Image();
    fondoCanvasImg.src = require("../assets/fondoCanvas.png");

    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp") personajePos.current.y -= 10;
      if (e.key === "ArrowDown") personajePos.current.y += 10;
      if (e.key === " ") {
        balas.current.push({ x: personajePos.current.x + 30, y: personajePos.current.y + 10 });
        new Audio(sonido).play();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(fondoCanvasImg, 0, 0, canvas.width, canvas.height);

      ctx.drawImage(personajeImgObj, personajePos.current.x, personajePos.current.y, 40, 40);

      ctx.fillStyle = "red";
      balas.current.forEach((bala, index) => {
        bala.x += 5;
        ctx.fillRect(bala.x, bala.y + 15, 10, 4);

        enemigos.current.forEach((enemigo, eIndex) => {
          if (
            bala.x < enemigo.x + 40 &&
            bala.x + 10 > enemigo.x &&
            bala.y < enemigo.y + 40 &&
            bala.y + 4 > enemigo.y
          ) {
            confetti({ particleCount: 20, spread: 40 });
            enemigos.current.splice(eIndex, 1);
            balas.current.splice(index, 1);
            setPuntos((prev) => prev + 1);
            setVelocidadEnemigo((prev) => prev + 0.5);
            enemigos.current.push({ x: 400, y: Math.random() * 260 });
          }
        });
      });

      enemigos.current.forEach((enemigo) => {
        enemigo.x -= velocidadEnemigo;
        ctx.drawImage(enemigoImgObj, enemigo.x, enemigo.y, 40, 40);

        const colision =
          enemigo.x < personajePos.current.x + 40 &&
          enemigo.x + 40 > personajePos.current.x &&
          enemigo.y < personajePos.current.y + 40 &&
          enemigo.y + 40 > personajePos.current.y;

        if (colision) {
          setPuntos((prev) => Math.max(prev - 15, 0));
          setVidas((v) => Math.max(v - 1, 0));
          enemigo.x = 400;
        }

        if (enemigo.x < -40) {
          enemigo.x = 400;
          enemigo.y = Math.random() * 260;
          setPuntos((prev) => prev + 15);
        }
      });

      ctx.fillStyle = "white";
      ctx.font = "16px monospace";
      ctx.fillText(`Puntos: ${puntos}`, 10, 20);
      ctx.fillText(`Vidas: ${vidas}`, 10, 40);

      if (!ganaste && vidas > 0) {
        requestAnimationFrame(gameLoop);
      } else {
        ctx.fillStyle = ganaste ? "lime" : "red";
        ctx.font = "20px monospace";
        ctx.fillText(ganaste ? "🎉 ¡Ganaste!" : "💀 GAME OVER", 120, 150);
        if (ganaste) {
          ctx.drawImage(personajeImgObj, 180, 170, 40, 40);
        }
      }
    };

    gameLoop();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mostrarJuego, velocidadEnemigo, puntos, vidas, ganaste]);

  return (
    <div
      className="w-screen h-screen flex items-center justify-center bg-black"
      style={{
        backgroundImage: `url(${fondo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {!mostrarJuego ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="backdrop-blur-lg bg-white/20 border border-white/30 shadow-2xl p-8 rounded-3xl max-w-md w-full text-center text-white"
        >
          <motion.img
            src={personaje}
            alt="Personaje"
            className="w-24 mx-auto mb-6 drop-shadow-lg"
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow mb-4">
            🎉 ¡Feliz Cumple Santi! ¡Felices 15 años! 💖
          </h1>
          <p className="text-lg text-white/80 mb-6">
            Cadete, su misión de cumpleaños es clara: relajarse, reírse fuerte y disfrutar cada segundo como corresponde, Siempre feliz. ¡Feliz cumple, hermano! Te quiero mucho, Cumpla con honor y sin olvidar la ración de torta.
          </p>
          <motion.button
            onClick={() => {
              reproducirSonido();
              setMostrarJuego(true);
              setPuntos(0);
              setVidas(3);
              setGanaste(false);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white/20 border border-white/30 px-6 py-2 text-white font-bold rounded-full shadow-md backdrop-blur hover:bg-white/30 transition"
          >
            🎁 Abrir sorpresa
          </motion.button>
          {mostrarMensaje && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-xl font-semibold text-white/90"
            >
              🌈 ¡Te deseo un año mágico y brillante!
              Te quiero Mucho Hermanito, perdon que el mini juego ser rompe, es la version 0.1 💖
            </motion.div>
          )}
          <button
            onClick={toggleMusica}
            className="mt-6 text-sm text-white/80 underline hover:text-white transition"
          >
            {musicaActiva ? "🔇 Silenciar música" : "🔊 Activar música"}
          </button>
        </motion.div>
      ) : (
        <div className="text-center text-white p-6 bg-black/60 rounded-2xl max-w-md w-full backdrop-blur-lg">
          <h2 className="text-3xl font-bold mb-4">🎮 ¡Juego sorpresa!</h2>
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="border-4 border-white rounded-lg"
          />
          <p className="mt-4 text-lg">🎯 Puntos: {puntos}</p>

          {(vidas <= 0 || ganaste) && (
            <button
              onClick={() => {
                setMostrarJuego(false);
                setPuntos(0);
                setVidas(3);
                setGanaste(false);
              }}
              className="mt-4 underline text-sm"
            >
              🔁 Reintentar
            </button>
          )}
          <button
            onClick={() => setMostrarJuego(false)}
            className="mt-2 underline text-sm"
          >
            ⬅️ Volver a la tarjeta
          </button>
        </div>
      )}
    </div>
  );
}