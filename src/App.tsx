import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Text, Trail, Billboard, Image } from '@react-three/drei';
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from './firebase';
import { Volume2, VolumeX, X, ExternalLink, Share2 } from 'lucide-react'; 
import * as THREE from 'three';

// --- 🎵 MÚSICA ---
const MUSIC_URL = "https://archive.org/download/ambientforfilm/Infinity.mp3";

// --- 💎 DEMO STARS ---
const DEMO_STARS = [
  { id: 'd100', nombre: 'IMPERIO GOLD', mensaje: 'Liderando el mercado global.', color: '#FFD700', posicion: [0, 10, -60], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1200px-Apple_logo_black.svg.png', link: 'https://apple.com', precio: '100' },
  { id: 'd50', nombre: 'TECH CORP', mensaje: 'Innovación futura.', color: '#9932CC', posicion: [-50, -10, 20], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png', link: 'https://google.com', precio: '50' },
  { id: 'd20', nombre: 'Crypto Fund', mensaje: 'Inversiones descentralizadas.', color: '#00BFFF', posicion: [50, 20, 40], imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/1200px-Bitcoin.svg.png', link: 'https://bitcoin.org', precio: '20' }
];

// --- 💰 CATÁLOGO ---
const CATALOGO = [
  { id: 'basica', nombre: 'Acero ($1)', precio: '$1', color: '#B0C4DE', features: ['Esfera Metálica', 'Sin Logo', 'Solo Clic'], desc: 'Huella discreta.', link: 'LINK_STRIPE_1' },
  { id: 'media', nombre: 'Rubí ($5)', precio: '$5', color: '#DC143C', features: ['Metal Rojo', 'Sin Logo', 'Con Enlace'], desc: 'Tráfico económico.', link: 'LINK_STRIPE_5' },
  { id: 'premium', nombre: 'Zafiro ($20)', precio: '$20', color: '#00BFFF', features: ['Esfera Sólida', 'LOGO EN POPUP', 'Alta Visibilidad'], desc: 'Tu marca en metal puro.', link: 'LINK_STRIPE_20' },
  { id: 'corp', nombre: 'Amatista ($50)', precio: '$50', color: '#9932CC', features: ['Esfera XL', 'Logo XL', 'Metal Profundo'], desc: 'Presencia sólida.', link: 'LINK_STRIPE_50' },
  { id: 'imperio', nombre: 'ORO PURO ($100)', precio: '$100', color: '#FFD700', features: ['ESTELA DORADA', 'Efecto Chispas', 'Oro Macizo'], desc: 'El Jefe. Inigualable.', link: 'LINK_STRIPE_100' },
  { id: 'fugaz', nombre: '⭐ Patrocinador ($50/Día)', precio: '$50/Día', color: '#00FF00', features: ['COMETA RÁPIDO', 'Estela Gigante', 'Imposible de ignorar'], desc: 'Atención total por 24h.', link: 'LINK_DIARIO' }
];

// --- ESTRELLA FUGAZ ---
function EstrellaFugaz({ color = '#00FF00', mensaje = '📢 PATROCINADOR: TU MARCA AQUÍ' }) {
    const ref = useRef<any>();
    const speed = 15; const range = 200; 
    useFrame((state, delta) => {
        if (!ref.current) return;
        const t = state.clock.elapsedTime * speed;
        ref.current.position.x = (t % (range * 2)) - range;
        ref.current.position.y = Math.sin(t * 0.05) * 20 + 25;
        ref.current.position.z = -40; 
        ref.current.rotation.x -= delta * 3;
    });
    return (
        <Trail width={6} length={20} color={color} attenuation={(t) => t * t}>
             <group ref={ref}>
                <mesh><sphereGeometry args={[2.5, 32, 32]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={8} toneMapped={false} /></mesh>
                <pointLight intensity={5} distance={50} color={color} />
                <Text position={[0, -4, 0]} color={color} fontSize={2} fontWeight="bold" outlineWidth={0.08} outlineColor="black" anchorX="center" anchorY="top">{mensaje}</Text>
            </group>
        </Trail>
    );
}

// --- ESTRELLA PRINCIPAL ---
function Estrella({ datos, alHacerClick }: any) {
  const groupRef = useRef<any>(null);
  const meshRef = useRef<any>(null);
  const [hovered, setHover] = useState(false);
  
  const posicionSegura = datos.posicion ? datos.posicion : [0, 0, 0];
  const initialPos = useMemo(() => new THREE.Vector3(parseFloat(posicionSegura[0]), parseFloat(posicionSegura[1]), parseFloat(posicionSegura[2])), []);
  
  const movementData = useMemo(() => ({
    speed: Math.random() * 0.05 + 0.02, radius: Math.random() * 20 + 5, offset: Math.random() * Math.PI * 2, pathOffset: Math.random() * 500
  }), []);
  
  const esOro = datos.color === '#FFD700'; 
  const esAmatista = datos.color === '#9932CC';
  
  let escalaBase = 0.8; 
  if (datos.color === '#DC143C') escalaBase = 1.2; 
  if (datos.color === '#00BFFF') escalaBase = 1.8; 
  if (esAmatista) escalaBase = 2.5; 
  if (esOro) escalaBase = 4.0; 

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
        if (esOro) { 
            const pathRange = 250; const pathSpeed = 2; 
            const newX = ((t * pathSpeed + movementData.pathOffset) % (pathRange * 2)) - pathRange;
            groupRef.current.position.set(newX, initialPos.y + Math.sin(t * 0.3) * 5, initialPos.z);
        } else { 
            groupRef.current.position.x = initialPos.x + Math.cos(t * movementData.speed + movementData.offset) * movementData.radius;
            groupRef.current.position.z = initialPos.z + Math.sin(t * movementData.speed + movementData.offset) * movementData.radius;
            groupRef.current.position.y = initialPos.y + Math.sin(t * 0.2 + movementData.offset) * 3;
        }
    }
    if (meshRef.current) {
       meshRef.current.rotation.y += delta * 0.2;
       let scaleMultiplier = 1;
       if (esOro) scaleMultiplier = Math.sin(t * 3) * 0.1 + 1; 
       const scaleTarget = (hovered ? escalaBase * 1.15 : escalaBase) * scaleMultiplier;
       meshRef.current.scale.lerp(new THREE.Vector3(scaleTarget, scaleTarget, scaleTarget), 0.1);
    }
  });

  const intensidad = esOro ? 6 : (esAmatista ? 3.5 : 2);
  const materialSolido = (
    <meshPhysicalMaterial color={datos.color} emissive={datos.color} emissiveIntensity={hovered ? intensidad * 1.5 : intensidad} transparent={false} opacity={1} transmission={0} roughness={0.15} metalness={0.9} clearcoat={1} clearcoatRoughness={0} />
  );

  const ContenidoEstrella = () => (
    <>
        <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); alHacerClick(datos); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; setHover(true); }} onPointerOut={() => { document.body.style.cursor = 'default'; setHover(false); }}>
            <sphereGeometry args={[1, 64, 64]} />
            {materialSolido}
        </mesh>
        {esOro && ( <Sparkles count={15} scale={escalaBase * 2.5} size={4} speed={0.4} opacity={1} color="#FFD700" /> )}
        {hovered && ( <Text position={[0, escalaBase + 1.2, 0]} fontSize={escalaBase > 3 ? 1.2 : 0.8} color="white" anchorX="center" anchorY="middle" outlineWidth={0.05} outlineColor={datos.color}>{datos.nombre}</Text> )}
    </>
  );

  return ( <group ref={groupRef} position={initialPos.toArray() as [number, number, number]}>{esOro ? ( <Trail width={3} length={12} color="#FFD700" attenuation={(t) => t * t}><ContenidoEstrella /></Trail> ) : ( <ContenidoEstrella /> )}</group> );
}

export default function App() {
  const [estrellas, setEstrellas] = useState<any[]>([]);
  const [estrellaSeleccionada, setEstrellaSeleccionada] = useState<any>(null);
  const [mostrandoMenu, setMostrandoMenu] = useState(false);
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [nuevoLink, setNuevoLink] = useState('');
  const [nuevaImagen, setNuevaImagen] = useState('');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(new Audio(MUSIC_URL));

  useEffect(() => {
    const cancelar = onSnapshot(collection(db, "estrellas"), (snapshot) => {
      const estrellasReales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEstrellas([...DEMO_STARS, ...estrellasReales]);
    });
    audioRef.current.loop = true; audioRef.current.volume = 0.5;
    return () => cancelar();
  }, []);

  const toggleMusic = () => { if (musicPlaying) { audioRef.current.pause(); } else { audioRef.current.play().catch(e => console.log("Interacción necesaria")); } setMusicPlaying(!musicPlaying); };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pagado') === 'si') {
      setMostrandoFormulario(true);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const guardarEstrella = async (e: any) => {
    e.preventDefault();
    const r = 200 * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    let linkFinal = nuevoLink; if (linkFinal && !linkFinal.startsWith('http') && linkFinal.length > 0) linkFinal = 'https://' + linkFinal;
    let colorFinal = '#B0C4DE'; // $1
    if (linkFinal) colorFinal = '#DC143C'; // $5
    if (nuevaImagen) colorFinal = '#00BFFF'; // $20
    await addDoc(collection(db, "estrellas"), { nombre: nuevoNombre, mensaje: nuevoMensaje, link: linkFinal, imageUrl: nuevaImagen, color: colorFinal, posicion: [x, y, z], fecha: new Date().toISOString() });
    setMostrandoFormulario(false); setNuevoNombre(''); setNuevoMensaje(''); setNuevoLink(''); setNuevaImagen('');
    alert("¡Marca registrada! 🚀");
  };

  const compartirEstrella = () => {
      if (!estrellaSeleccionada) return;
      const mensaje = `¡He encontrado tu estrella "${estrellaSeleccionada.nombre}" en Eternal Galaxy! ✨ Mira aquí:`;
      const url = window.location.href;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje + ' ' + url)}`;
      window.open(whatsappUrl, '_blank');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black', position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 80], fov: 60 }}>
        <color attach="background" args={['#02010a']} />
        <fog attach="fog" args={['#0f0520', 60, 250]} /> 
        <ambientLight intensity={0.2} />
        <spotLight position={[50, 50, 50]} angle={0.3} penumbra={1} intensity={5} castShadow color="#ffffff" />
        <pointLight position={[-40, -20, -20]} intensity={3} color="#ffd700"/>
        <pointLight position={[0, 50, 0]} intensity={2} color="#00BFFF"/> 

        <EstrellaFugaz color="#00FF00" mensaje="📢 ESPACIO DISPONIBLE HOY: $50" />

        <Sparkles count={2500} scale={200} size={2} speed={0.1} opacity={0.4} color="#8A2BE2" />
        <Stars radius={200} depth={100} count={12000} factor={6} saturation={1} fade speed={0.1} />

        <group>
            {estrellas.map((estrella) => (
            <Estrella key={estrella.id} datos={estrella} alHacerClick={setEstrellaSeleccionada} />
            ))}
        </group>
        <OrbitControls autoRotate autoRotateSpeed={0.1} enableZoom={true} minDistance={10} maxDistance={250} enablePan={false} />
      </Canvas>
      
      {/* HEADER INTEGRADO Y LIMPIO */}
      <div style={{ position: 'absolute', top: '5%', width: '100%', textAlign: 'center', pointerEvents: 'none', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Título */}
        <h1 style={{ color: 'white', margin: 0, fontSize: 'clamp(2rem, 5vw, 4rem)', letterSpacing: '8px', fontWeight: '100', fontFamily: 'serif', textShadow: '0 0 50px rgba(255, 215, 0, 0.5)' }}>
          ETERNAL
        </h1>
        {/* Subtítulo */}
        <p style={{ color: '#FDB931', margin: '5px 0 15px 0', fontSize: '0.8rem', letterSpacing: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
          REGISTRO UNIVERSAL PERMANENTE
        </p>
        {/* Contador Hackerman (Sin cajas, solo texto verde) */}
        <div style={{ color: '#00FF00', fontSize: '0.75rem', fontFamily: 'monospace', textShadow: '0 0 5px #00FF00', letterSpacing: '1px' }}>
          ● {estrellas.length} SEÑALES EN ÓRBITA
        </div>
      </div>

      <button onClick={toggleMusic} style={{ position: 'absolute', top: 30, left: 30, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(5px)', zIndex: 50 }}>
        {musicPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>

      {!mostrandoFormulario && !mostrandoMenu && !estrellaSeleccionada && (
        <button onClick={() => setMostrandoMenu(true)} style={{ position: 'absolute', bottom: '15vh', left: '50%', transform: 'translateX(-50%)', padding: '12px 35px', background: 'linear-gradient(45deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)', color: '#1a0b2e', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '50px', cursor: 'pointer', fontWeight: '900', fontSize: '0.9rem', letterSpacing: '2px', boxShadow: '0 0 40px rgba(255, 215, 0, 0.4), inset 0 0 10px rgba(255,255,255,0.5)', zIndex: 10, whiteSpace: 'nowrap', transition: 'all 0.3s ease', textTransform: 'uppercase' }}>★ Inmortalizar Marca</button>
      )}

      {mostrandoMenu && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5, 2, 10, 0.98)', backdropFilter: 'blur(15px)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflowY: 'auto', padding: '80px 20px' }}>
          <button onClick={() => setMostrandoMenu(false)} style={{ position: 'absolute', top: 30, right: 30, background: 'none', border: 'none', color: 'white', cursor: 'pointer', zIndex: 30 }}><X size={35} /></button>
          <h2 style={{ color: '#FDB931', fontFamily: 'serif', fontSize: '2.5rem', marginBottom: '30px', textAlign: 'center' }}>Selecciona tu Estatus</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px', justifyContent: 'center', width: '100%', maxWidth: '1200px' }}>
            {CATALOGO.map((item) => (
              <div key={item.id} style={{ background: `linear-gradient(145deg, rgba(255,255,255,0.03), ${item.color}08)`, border: `1px solid ${item.color}40`, borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '280px', textAlign: 'center', boxShadow: `0 0 30px ${item.color}10`, display: 'flex', flexDirection: 'column', transform: (item.precio.includes('100') || item.precio.includes('Día')) ? 'scale(1.05)' : 'scale(1)', borderTop: `3px solid ${item.color}`, position: 'relative' }}>
                <h3 style={{ color: item.color, margin: '0 0 10px 0', fontSize: '1.2rem', letterSpacing: '1px', textTransform: 'uppercase' }}>{item.nombre}</h3>
                <p style={{ color: 'white', fontSize: (item.precio.includes('Día')) ? '1.8rem' : '2.5rem', fontWeight: '900', margin: '5px 0', textShadow: `0 0 15px ${item.color}` }}>{item.precio}</p>
                <button onClick={() => window.location.href = item.link} style={{ background: item.color, color: item.color === '#FFD700' || item.color === '#00FF00' ? 'black' : 'white', border: 'none', padding: '15px 0', borderRadius: '30px', fontWeight: '900', cursor: 'pointer', width: '100%', fontSize: '1rem', marginTop: 'auto', boxShadow: `0 0 25px ${item.color}40` }}>ELEGIR PLAN</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {mostrandoFormulario && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(10, 10, 15, 0.98)', padding: '35px', borderRadius: '30px', width: '90%', maxWidth: '450px', zIndex: 30, boxShadow: '0 0 70px rgba(255, 215, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
          <h2 style={{color: 'white', textAlign: 'center', marginBottom: '5px', fontFamily: 'serif', fontSize: '1.8rem'}}>Configuración</h2>
          <form onSubmit={guardarEstrella} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input placeholder="Nombre de Marca" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} required style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #333', background: '#000', color: 'white' }} />
            <input placeholder="Link" value={nuevoLink} onChange={e => setNuevoLink(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #333', background: '#000', color: '#44aaff' }} />
            <input placeholder="Logo URL" value={nuevaImagen} onChange={e => setNuevaImagen(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #333', background: '#000', color: '#8A2BE2' }} />
            <textarea placeholder="Mensaje" value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)} required style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #333', background: '#000', color: 'white', minHeight: '80px' }} />
            <button type="submit" style={{ padding: '18px', background: 'linear-gradient(90deg, #BF953F, #AA771C)', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: '900', marginTop: '15px' }}>LANZAR 🚀</button>
          </form>
        </div>
      )}

      {estrellaSeleccionada && (
        <div style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(10, 10, 15, 0.95)', padding: '35px', borderRadius: '25px', color: 'white', textAlign: 'center', width: '90%', maxWidth: '400px', border: `1px solid ${estrellaSeleccionada.color}`, backdropFilter: 'blur(30px)', zIndex: 10, boxShadow: `0 0 80px ${estrellaSeleccionada.color}40` }}>
          {estrellaSeleccionada.imageUrl && ( <img src={estrellaSeleccionada.imageUrl} alt="Logo" style={{width: '100px', height: '100px', borderRadius: '50%', objectFit: 'contain', background: 'white', padding: '5px', margin: '0 auto 20px auto', border: `3px solid ${estrellaSeleccionada.color}`, boxShadow: `0 0 40px ${estrellaSeleccionada.color}50`}} /> )}
          <h2 style={{ color: estrellaSeleccionada.color, margin: '0 0 15px 0', fontSize: '2rem', fontFamily: 'serif', textShadow: `0 0 30px ${estrellaSeleccionada.color}` }}>{estrellaSeleccionada.nombre}</h2>
          <p style={{ fontStyle: 'italic', color: '#eee', marginBottom: '25px', lineHeight: '1.6', fontSize: '1.1rem' }}>"{estrellaSeleccionada.mensaje}"</p>
          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
            {estrellaSeleccionada.link && ( <button onClick={() => window.open(estrellaSeleccionada.link, '_blank')} style={{ width: '100%', padding: '18px', background: estrellaSeleccionada.color, color: estrellaSeleccionada.color === '#FFD700' ? 'black' : 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: `0 0 30px ${estrellaSeleccionada.color}60` }}><ExternalLink size={20} /> VISITAR</button> )}
            <button onClick={compartirEstrella} style={{ width: '100%', padding: '18px', background: 'rgba(255,255,255,0.15)', color: 'white', border: `1px solid ${estrellaSeleccionada.color}`, borderRadius: '15px', cursor: 'pointer', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><Share2 size={20} /> COMPARTIR (WhatsApp)</button>
          </div>
          <button onClick={() => setEstrellaSeleccionada(null)} style={{ marginTop: '15px', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}>Cerrar</button>
        </div>
      )}
    </div>
  );
}
