import logoApp from '../../assets/logo.png'

export function SplashScreen() {
  return <main className="splash-screen" aria-label="Cargando alXns Central Hub">
    <div className="splash-content">
      <img className="brand-mark brand-mark-large" src={logoApp} alt="alXns logo" />
      <h1>alXns</h1>
      <div className="loading-track"><div className="loading-fill" /></div>
    </div>
  </main>
}
