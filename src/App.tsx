import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from './firebase';
// ELIMINÉ LA LÍNEA DE LUCIDE-REACT PARA QUE NO TE DE ERROR

// --- TU ENLACE DE PAGO ---
const STRIPE_LINK = "https://buy.stripe.com/test_cNi14gfvgfa16uJ3Cq0Fi00";
// -------------------------

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
      scale={hovered ? 1.5 : 1}
      onClick={(e) => { e.stopPropagation(); alHacerClick(datos); }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color={datos.color || 'white'} emissive={datos.color || 'white'} emissiveIntensity={hovered ? 2 : 0.5} />
    </mesh>
  );
}

export default function App() {
  const [estrellas, setEstrellas] = useState<any[]>([]);
  const [estrellaSeleccionada, setEstrellaSeleccionada] = useState<any>(null);
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  // 1. CARGAR ESTRELLAS
  useEffect(() => {
    const cancelar = onSnapshot(collection(db, "estrellas"), (snapshot) => {
      setEstrellas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => cancelar();
  }, []);

  // 2. DETECTOR DE PAGOS
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pagado') === 'si') {
      setMostrandoFormulario(true);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // 3. IR A PAGAR
  const irAPagar = () => {
    window.location.href = STRIPE_LINK;
  };

  // 4. GUARDAR
  const guardarEstrella = async (e: any) => {
    e.preventDefault();
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;

    await addDoc(collection(db, "estrellas"), {
      nombre: nuevoNombre,
      mensaje: nuevoMensaje,
      color: '#ffd700', // Oro
      posicion: [x, y, z]
    });

    setMostrandoFormulario(false);
    setNuevoNombre('');
    setNuevoMensaje('');
    alert("¡Estrella lanzada! Busca la tuya y compártela.");
  };

  // 5. FUNCION COMPARTIR WHATSAPP
  const compartirEnWhatsapp = () => {
    if (!estrellaSeleccionada) return;
    const texto = `¡Acabo de encontrar la estrella "${estrellaSeleccionada.nombre}" en la Galaxia Eterna! ✨ Dice: "${estrellaSeleccionada.mensaje}". Entra y consigue la tuya aquí: https://ultima-version.vercel.app/`;
    const urlWhatsapp = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(urlWhatsapp, '_blank');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 15] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
        {estrellas.map((estrella) => (
          <Estrella key={estrella.id} datos={estrella} alHacerClick={setEstrellaSeleccionada} />
        ))}
        <OrbitControls autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      
      {/* HEADER */}
      <div style={{ position: 'absolute', top: 20, left: 20, pointerEvents: 'none' }}>
        <h1 style={{ color: 'white', margin: 0, textShadow: '0 0 10px white' }}>GALAXIA ETERNA</h1>
        <p style={{ color: '#888' }}>{estrellas.length} Habitantes</p>
      </div>

      {/* BOTON DE COMPRA */}
      {!mostrandoFormulario && (
        <button 
          onClick={irAPagar}
          style={{ 
            position: 'absolute', top: 20, right: 20, 
            padding: '12px 25px', background: 'linear-gradient(45deg, #FFD700, #FFA500)', 
            border: 'none', borderRadius: '25px', cursor: 'pointer', 
            fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 0 15px rgba(255, 215, 0, 0.5)',
            zIndex: 10
          }}>
          ★ Comprar Estrella ($1)
        </button>
      )}

      {/* FORMULARIO POST-PAGO */}
      {mostrandoFormulario && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.95)', padding: '30px', borderRadius: '15px', minWidth: '300px', zIndex: 20,
          boxShadow: '0 0 50px rgba(255, 215, 0, 0.3)'
        }}>
          <h2 style={{color: '#333', textAlign: 'center'}}>¡Bienvenido Socio!</h2>
          <p style={{color: '#666', fontSize: '0.9rem', textAlign: 'center'}}>Tu espacio está reservado.</p>
          <form onSubmit={guardarEstrella} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <input placeholder="Tu Nombre" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }} />
            <textarea placeholder="Tu Mensaje Eterno" value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', minHeight: '80px', fontSize: '1rem' }} />
            <button type="submit" style={{ padding: '15px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>LANZAR AHORA 🚀</button>
          </form>
        </div>
      )}

      {/* POPUP AL SELECCIONAR ESTRELLA */}
      {estrellaSeleccionada && (
        <div style={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10, 10, 10, 0.9)', padding: '25px', borderRadius: '20px', color: 'white', textAlign: 'center', 
          minWidth: '320px', border: '1px solid #333', backdropFilter: 'blur(10px)',
          boxShadow: '0 0 30px rgba(0,0,0,0.8)', zIndex: 10
        }}>
          <h2 style={{ color: estrellaSeleccionada.color, margin: '0 0 10px 0', fontSize: '1.5rem' }}>★ {estrellaSeleccionada.nombre}</h2>
          <p style={{ fontStyle: 'italic', color: '#ccc', marginBottom: '20px' }}>"{estrellaSeleccionada.mensaje}"</p>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={compartirEnWhatsapp}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', background: '#25D366', color: 'white', 
                border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' 
              }}>
              💬 Compartir
            </button>
            
            <button onClick={() => setEstrellaSeleccionada(null)} style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
