import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from './firebase';
import { Volume2, VolumeX } from 'lucide-react'; // Iconos de sonido

// --- CONFIGURACIÓN ---
const STRIPE_LINK = "https://buy.stripe.com/test_cNi14gfvgfa16uJ3Cq0Fi00";
// Música ambiental espacial (Royalty Free)
const MUSIC_URL = "https://archive.org/download/ambientforfilm/Infinity.mp3";

function Estrella({ datos, alHacerClick }: any) {
  const ref = useRef<any>(null);
  const [hovered, setHover] = useState(false);
  
  const posicionSegura = datos.posicion ? datos.posicion : [0, 0, 0];
  const posicionReal = [parseFloat(posicionSegura[0]), parseFloat(posicionSegura[1]), parseFloat(posicionSegura[2])];

  useFrame((state, delta) => {
    if (ref.current) {
        ref.current.rotation.y += delta;
    }
  });

  return (
    <mesh
      position={posicionReal as [number, number, number]}
      ref={ref}
      scale={hovered ? 1.8 : 1} // Un poco más grande al pasar el mouse
      onClick={(e) => { e.stopPropagation(); alHacerClick(datos); }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial 
        color={datos.color || 'white'} 
        emissive={datos.color || 'white'} 
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
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  
  // Estado de la música
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(new Audio(MUSIC_URL));

  // 1. CARGAR ESTRELLAS
  useEffect(() => {
    const cancelar = onSnapshot(collection(db, "estrellas"), (snapshot) => {
      setEstrellas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    // Configurar música en bucle
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4; // Volumen suave

    return () => cancelar();
  }, []);

  // 2. CONTROL DE MÚSICA
  const toggleMusic = () => {
    if (musicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log("Interacción necesaria primero"));
    }
    setMusicPlaying(!musicPlaying);
  };

  // 3. DETECTOR DE PAGOS
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pagado') === 'si') {
      setMostrandoFormulario(true);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // 4. GUARDAR ESTRELLA
  const guardarEstrella = async (e: any) => {
    e.preventDefault();
    const x = (Math.random() - 0.5) * 25; // Universo un poco más grande
    const y = (Math.random() - 0.5) * 25;
    const z = (Math.random() - 0.5) * 25;

    await addDoc(collection(db, "estrellas"), {
      nombre: nuevoNombre,
      mensaje: nuevoMensaje,
      color: '#FFD700', 
      posicion: [x, y, z]
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
    <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 18], fov: 60 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={1} />
        {estrellas.map((estrella) => (
          <Estrella key={estrella.id} datos={estrella} alHacerClick={setEstrellaSeleccionada} />
        ))}
        <OrbitControls autoRotate autoRotateSpeed={0.3} enableZoom={true} minDistance={5} maxDistance={30} />
      </Canvas>
      
      {/* --- UI LAYER --- */}

      {/* 1. HEADER (Marca) */}
      <div style={{ 
        position: 'absolute', top: 30, width: '100%', textAlign: 'center', pointerEvents: 'none',
        textShadow: '0 0 20px rgba(255,255,255,0.3)'
      }}>
        <h1 style={{ 
          color: 'white', margin: 0, fontSize: '3rem', letterSpacing: '8px', fontWeight: '300', fontFamily: 'serif' 
        }}>ETERNAL</h1>
        <p style={{ color: '#888', marginTop: '5px', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase' }}>
          {estrellas.length} Almas en el Universo
        </p>
      </div>

      {/* 2. BOTÓN DE MÚSICA (Arriba Derecha) */}
      <button 
        onClick={toggleMusic}
        style={{
          position: 'absolute', top: 30, right: 30,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer',
          backdropFilter: 'blur(5px)', transition: 'all 0.3s ease'
        }}>
        {musicPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      {/* 3. BOTÓN DE COMPRA (Centro Abajo) */}
      {/* Solo se muestra si no hay formulario y NO hay estrella seleccionada */}
      {!mostrandoFormulario && !estrellaSeleccionada && (
        <button 
          onClick={() => window.location.href = STRIPE_LINK}
          style={{ 
            position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)',
            padding: '15px 40px', 
            background: 'linear-gradient(90deg, #FFD700, #FDB931)', 
            color: 'black',
            border: 'none', borderRadius: '50px', cursor: 'pointer', 
            fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '1px',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)',
            transition: 'transform 0.2s',
            zIndex: 10
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
          >
          ★ INMORTALIZAR MI NOMBRE ($1)
        </button>
      )}

      {/* 4. FORMULARIO POST-PAGO */}
      {mostrandoFormulario && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(10, 10, 10, 0.95)', padding: '40px', borderRadius: '20px', width: '90%', maxWidth: '400px', zIndex: 20,
          boxShadow: '0 0 50px rgba(255, 215, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{color: 'white', textAlign: 'center', marginBottom: '10px', fontFamily: 'serif'}}>Bienvenido a Eternal</h2>
          <p style={{color: '#888', fontSize: '0.9rem', textAlign: 'center', marginBottom: '30px'}}>Tu lugar en el cosmos está listo.</p>
          <form onSubmit={guardarEstrella} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input placeholder="Tu Nombre" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required 
              style={{ padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: 'white', outline: 'none' }} />
            <textarea placeholder="Tu Mensaje para la Eternidad" value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)} required 
              style={{ padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#222', color: 'white', minHeight: '100px', outline: 'none' }} />
            <button type="submit" style={{ padding: '15px', background: 'white', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '10px' }}>CREAR ESTRELLA 🚀</button>
          </form>
        </div>
      )}

      {/* 5. POPUP ESTRELLA SELECCIONADA */}
      {estrellaSeleccionada && (
        <div style={{
          position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)', padding: '30px', borderRadius: '20px', color: 'white', textAlign: 'center', 
          width: '90%', maxWidth: '350px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(20px)',
          zIndex: 10, animation: 'fadeIn 0.3s ease'
        }}>
          <h2 style={{ color: estrellaSeleccionada.color, margin: '0 0 15px 0', fontSize: '1.8rem', fontFamily: 'serif' }}>{estrellaSeleccionada.nombre}</h2>
          <div style={{width: '50px', height: '1px', background: 'white', margin: '0 auto 15px auto', opacity: 0.3}}></div>
          <p style={{ fontStyle: 'italic', color: '#ccc', marginBottom: '25px', lineHeight: '1.5' }}>"{estrellaSeleccionada.mensaje}"</p>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={compartirEnWhatsapp} style={{ 
                flex: 1, padding: '12px', background: '#25D366', color: 'white', 
                border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' 
              }}>
              Whatsapp
            </button>
            <button onClick={() => setEstrellaSeleccionada(null)} style={{ flex: 1, padding: '12px', background: 'transparent', color: 'white', border: '1px solid #333', borderRadius: '10px', cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}