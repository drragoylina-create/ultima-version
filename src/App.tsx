import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from './firebase';

// --- TU ENLACE DE PAGO ---
const STRIPE_LINK = "https://buy.stripe.com/test_cNi14gfvgfa16uJ3Cq0Fi00";
// -------------------------

// Nota: Agregamos ": any" para que el editor deje de molestar con líneas rojas
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
      alert("¡Pago recibido! Gracias socio. Crea tu estrella eterna ahora.");
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
    alert("¡Estrella lanzada! 🚀");
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
      
      <div style={{ position: 'absolute', top: 20, left: 20, pointerEvents: 'none' }}>
        <h1 style={{ color: 'white', margin: 0 }}>GALAXIA ETERNA</h1>
        <p style={{ color: '#888' }}>{estrellas.length} Habitantes</p>
      </div>

      {!mostrandoFormulario && (
        <button 
          onClick={irAPagar}
          style={{ 
            position: 'absolute', top: 20, right: 20, 
            padding: '12px 25px', background: 'linear-gradient(45deg, #FFD700, #FFA500)', 
            border: 'none', borderRadius: '25px', cursor: 'pointer', 
            fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 0 15px rgba(255, 215, 0, 0.5)'
          }}>
          ★ Comprar Estrella ($1)
        </button>
      )}

      {mostrandoFormulario && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.95)', padding: '30px', borderRadius: '15px', minWidth: '300px', zIndex: 10,
          boxShadow: '0 0 50px rgba(255, 215, 0, 0.3)'
        }}>
          <h2 style={{color: '#333'}}>¡Bienvenido Socio!</h2>
          <p style={{color: '#666', fontSize: '0.9rem'}}>Tu espacio está reservado.</p>
          <form onSubmit={guardarEstrella} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input placeholder="Tu Nombre" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
            <textarea placeholder="Tu Mensaje Eterno" value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)} required style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }} />
            <button type="submit" style={{ padding: '12px', background: 'black', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>LANZAR AHORA 🚀</button>
          </form>
        </div>
      )}

      {estrellaSeleccionada && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '15px', color: 'white', textAlign: 'center', minWidth: '300px', border: '1px solid #333'
        }}>
          <h2 style={{ color: estrellaSeleccionada.color, margin: 0 }}>★ {estrellaSeleccionada.nombre}</h2>
          <p>"{estrellaSeleccionada.mensaje}"</p>
          <button onClick={() => setEstrellaSeleccionada(null)} style={{ marginTop: '10px', cursor: 'pointer', padding: '5px 10px', borderRadius: '5px', border: 'none' }}>Cerrar</button>
        </div>
      )}
    </div>
  );
}