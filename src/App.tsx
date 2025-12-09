import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from './firebase';
import { Volume2, VolumeX, X } from 'lucide-react'; 

// --- 🎵 MÚSICA & CONFIGURACIÓN ---
const MUSIC_URL = "https://archive.org/download/ambientforfilm/Infinity.mp3";

// --- 💰 CATÁLOGO DE ESTRELLAS (RECUERDA PONER TUS LINKS) ---
const CATALOGO = [
  {
    id: 'basica',
    nombre: 'Estrella Naciente',
    precio: '$1 USD',
    color: '#FFD700', // Oro
    desc: 'Tu nombre en el cosmos. Simple y eterno.',
    link: 'https://buy.stripe.com/test_cNi14gfvgfa16uJ3Cq0Fi00' // <--- TU LINK DE $1
  },
  {
    id: 'media',
    nombre: 'Gigante Roja',
    precio: '$5 USD',
    color: '#FF4500', // Rojo Fuego
    desc: 'Brilla más fuerte. Destaca entre la multitud.',
    link: 'LINK_STRIPE_5_DOLARES_AQUI' // <--- LINK DE $5
  },
  {
    id: 'premium',
    nombre: 'Supernova',
    precio: '$20 USD',
    color: '#00FFFF', // Cyan Neón
    desc: 'La máxima expresión de poder. Una explosión de luz.',
    link: 'LINK_STRIPE_20_DOLARES_AQUI' // <--- LINK DE $20
  }
];

function Estrella({ datos, alHacerClick }: any) {
  const ref = useRef<any>(null);
  const [hovered, setHover] = useState(false);
  
  const posicionSegura = datos.posicion ? datos.posicion : [0, 0, 0];
  const posicionReal = [parseFloat(posicionSegura[0]), parseFloat(posicionSegura[1]), parseFloat(posicionSegura[2])];
  
  // Ajuste de escala según el tipo
  const escalaBase = datos.tipo === 'premium' ? 1.5 : (datos.tipo === 'media' ? 1.2 : 1);

  useFrame((state, delta) => {
    if (ref.current) {
        ref.current.rotation.y += delta;
    }
  });

  return (
    <mesh
      position={posicionReal as [number, number, number]}
      ref={ref}
      scale={hovered ? (escalaBase * 1.5) : escalaBase} 
      onClick={(e) => { e.stopPropagation(); alHacerClick(datos); }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial 
        color={datos.color || '#FFD700'} 
        emissive={datos.color || '#FFD700'} 
        emissiveIntensity={hovered ? 3 : 0.8} 
        roughness={0.1}
        metalness={0.1}
      />
    </mesh>
  );
}

export default function App() {
  const [estrellas, setEstrellas] = useState<any[]>([]);
  const [estrellaSeleccionada, setEstrellaSeleccionada] = useState<any>(null);
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [mostrandoMenu, setMostrandoMenu] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(new Audio(MUSIC_URL));

  useEffect(() => {
    const cancelar = onSnapshot(collection(db, "estrellas"), (snapshot) => {
      setEstrellas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
    return () => cancelar();
  }, []);

  const toggleMusic = () => {
    if (musicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log("Interacción necesaria"));
    }
    setMusicPlaying(!musicPlaying);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pagado') === 'si') {
      setMostrandoFormulario(true);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const guardarEstrella = async (e: any) => {
    e.preventDefault();
    const x = (Math.random() - 0.5) * 25; 
    const y = (Math.random() - 0.5) * 25;
    const z = (Math.random() - 0.5) * 25;

    await addDoc(collection(db, "estrellas"), {
      nombre: nuevoNombre,
      mensaje: nuevoMensaje,
      color: '#FFD700', 
      posicion: [x, y, z],
      fecha: new Date().toISOString()
    });

    setMostrandoFormulario(false);
    setNuevoNombre('');
    setNuevoMensaje('');
    alert("¡Estrella creada! Ahora eres eterno.");
  };

  const compartirEnWhatsapp = () => {
    if (!estrellaSeleccionada) return;
    const texto = `¡Acabo de encontrar la estrella "${estrellaSeleccionada.nombre}" en ETERNAL! ✨ Dice: "${estrellaSeleccionada.mensaje}". Consigue la tuya aquí: https://ultima-version.vercel.app/`;
    const urlWhatsapp = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(urlWhatsapp, '_blank');
  };

  return (
    // CAMBIO: position fixed para evitar rebotes en celular
    <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 18], fov: 60 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={1} />
        {estrellas.map((estrella) => (
          <Estrella key={estrella.id} datos={estrella} alHacerClick={setEstrellaSeleccionada} />
        ))}
        <OrbitControls autoRotate autoRotateSpeed={0.2} enableZoom={true} minDistance={5} maxDistance={40} />
      </Canvas>
      
      {/* 1. HEADER RESPONSIVO */}
      <div style={{ 
        position: 'absolute', top: '5%', width: '100%', textAlign: 'center', pointerEvents: 'none', 
        textShadow: '0 0 20px rgba(255,255,255,0.3)', padding: '0 20px', boxSizing: 'border-box'
      }}>
        {/* Usamos clamp() para que la letra se adapte: mínimo 2rem, ideal 8vw, máximo 4rem */}
        <h1 style={{ color: 'white', margin: 0, fontSize: 'clamp(2rem, 10vw, 4rem)', letterSpacing: '8px', fontWeight: '300', fontFamily: 'serif' }}>
          ETERNAL
        </h1>
        <p style={{ color: '#888', marginTop: '5px', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase' }}>
          {estrellas.length} Almas en el Universo
        </p>
      </div>

      <button onClick={toggleMusic} style={{ position: 'absolute', top: 30, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(5px)', zIndex: 50 }}>
        {musicPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      {/* 2. BOTÓN PRINCIPAL (Subido al 15% de altura para evitar barras de navegación) */}
      {!mostrandoFormulario && !mostrandoMenu && !estrellaSeleccionada && (
        <button 
          onClick={() => setMostrandoMenu(true)}
          style={{ 
            position: 'absolute', 
            bottom: '15vh', // CAMBIO: Usamos % de altura en lugar de pixeles fijos
            left: '50%', transform: 'translateX(-50%)',
            padding: '15px 30px', background: 'linear-gradient(90deg, #FFD700, #FDB931)', 
            color: 'black', border: 'none', borderRadius: '50px', cursor: 'pointer', 
            fontWeight: 'bold', fontSize: '1rem', letterSpacing: '1px',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)', zIndex: 10,
            whiteSpace: 'nowrap', maxWidth: '90%' // Evita que se rompa el texto
          }}>
          ★ INMORTALIZAR MI NOMBRE
        </button>
      )}

      {/* 3. MENÚ DE SELECCIÓN CON SCROLL */}
      {mostrandoMenu && (
        <div style={{
          position: 'absolute', inset: 0, // Ocupa toda la pantalla
          background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', // Alineado arriba
          overflowY: 'auto', // PERMITE SCROLL
          padding: '80px 20px 40px 20px' // Espacio para no chocar con la X
        }}>
          <button onClick={() => setMostrandoMenu(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'white', cursor: 'pointer', zIndex: 30 }}>
            <X size={35} />
          </button>
          
          <h2 style={{ color: 'white', fontFamily: 'serif', fontSize: '1.8rem', marginBottom: '30px', textAlign: 'center' }}>Selecciona tu Legado</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', width: '100%', maxWidth: '1000px' }}>
            {CATALOGO.map((item) => (
              <div key={item.id} style={{
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${item.color}`,
                borderRadius: '20px', padding: '25px', width: '100%', maxWidth: '300px', textAlign: 'center',
                cursor: 'pointer'
              }}>
                <div style={{ 
                  width: '50px', height: '50px', background: item.color, borderRadius: '50%', 
                  margin: '0 auto 15px auto', boxShadow: `0 0 20px ${item.color}` 
                }}></div>
                <h3 style={{ color: 'white', margin: '10px 0', fontSize: '1.2rem' }}>{item.nombre}</h3>
                <p style={{ color: item.color, fontSize: '1.4rem', fontWeight: 'bold', margin: '5px 0' }}>{item.precio}</p>
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.4' }}>{item.desc}</p>
                <button 
                  onClick={() => window.location.href = item.link}
                  style={{
                    background: 'white', color: 'black', border: 'none', padding: '12px 0',
                    borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', width: '100%',
                    fontSize: '1rem'
                  }}>
                  Elegir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORMULARIO POST-PAGO (Adaptado a móvil) */}
      {mostrandoFormulario && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(10, 10, 10, 0.95)', padding: '30px', borderRadius: '20px', width: '85%', maxWidth: '380px', zIndex: 30,
          boxShadow: '0 0 50px rgba(255, 215, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{color: 'white', textAlign: 'center', marginBottom: '10px', fontFamily: 'serif'}}>Bienvenido Socio</h2>
          <p style={{color: '#888', fontSize: '0.9rem', textAlign: 'center', marginBottom: '20px'}}>Tu lugar en el cosmos está listo.</p>
          <form onSubmit={guardarEstrella} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input placeholder="Tu Nombre" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: 'white', outline: 'none', fontSize: '16px' }} />
            <textarea placeholder="Tu Mensaje para la Eternidad" value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)} required 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: 'white', minHeight: '80px', outline: 'none', fontSize: '16px' }} />
            <button type="submit" style={{ padding: '15px', background: 'white', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '10px' }}>CREAR ESTRELLA 🚀</button>
          </form>
        </div>
      )}

      {estrellaSeleccionada && (
        <div style={{
          position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)', padding: '25px', borderRadius: '20px', color: 'white', textAlign: 'center', 
          width: '85%', maxWidth: '350px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)',
          zIndex: 10
        }}>
          <h2 style={{ color: estrellaSeleccionada.color, margin: '0 0 10px 0', fontSize: '1.5rem', fontFamily: 'serif' }}>{estrellaSeleccionada.nombre}</h2>
          <div style={{width: '50px', height: '1px', background: 'white', margin: '0 auto 10px auto', opacity: 0.3}}></div>
          <p style={{ fontStyle: 'italic', color: '#ccc', marginBottom: '20px', lineHeight: '1.4', fontSize: '0.9rem' }}>"{estrellaSeleccionada.mensaje}"</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={compartirEnWhatsapp} style={{ flex: 1, padding: '10px', background: '#25D366', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Whatsapp</button>
            <button onClick={() => setEstrellaSeleccionada(null)} style={{ flex: 1, padding: '10px', background: 'transparent', color: 'white', border: '1px solid #333', borderRadius: '10px', cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}