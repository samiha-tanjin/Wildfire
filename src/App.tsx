import { FormEvent, useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import BurningCalendar from "./components/BurningCalendar/BurningCalendar"

const images = {
  earth:
    "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=1600&q=88",
  forest:
    "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1600&q=88",
  smoke:
    "https://images.unsplash.com/photo-1634224548788-58de1fb48e2b?auto=format&fit=crop&w=1200&q=88",
  aerial:
    "https://images.unsplash.com/photo-1678303526489-60dd82c18513?auto=format&fit=crop&w=1200&q=88",
  fire: "https://images.unsplash.com/photo-1510455415134-1cff57e0522a?auto=format&fit=crop&w=1200&q=88",
}

const diary = [
  {
    date: "September 11, 2020",
    place: "Idaho, Western United States",
    note: "Over one million acres burned as smoke traveled across the continent.",
    image: images.smoke,
  },
  {
    date: "May 08, 2016",
    place: "Alberta, Canada",
    note: "A fast-moving wildfire prompted the largest evacuation in Alberta's history.",
    image: images.aerial,
  },
  {
    date: "August 18, 2023",
    place: "British Columbia, Canada",
    note: "Extreme heat and dry conditions fueled a historic fire season.",
    image: images.fire,
  },
]

const faqs = [
  {
    question: "How can satellites detect a wildfire?",
    answer:
      "Satellites do not detect flames directly. They observe infrared heat, smoke, vegetation change, and atmospheric patterns, then compare those signals over time.",
  },
  {
    question: "Is smoke from factories always obvious from space?",
    answer:
      "Not always. Industrial emissions can resemble cloud, dust, or wildfire smoke. Scientists combine imagery with wind, temperature, and ground sensor data.",
  },
  {
    question: "What are the data sources of this platform?",
    answer:
      "Our stories combine open satellite imagery, public fire records, atmospheric models, and verified reporting. Each observation is timestamped and reviewed.",
  },
]

function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? "text-cream" : "text-ink"}`}>
      The Surface
    </span>
  )
}

function RotatingEarth() {
  const globeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = globeRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0, 3.25)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.35
    renderer.domElement.setAttribute("aria-hidden", "true")
    mount.appendChild(renderer.domElement)

    const earthGroup = new THREE.Group()
    earthGroup.rotation.z = -0.16
    scene.add(earthGroup)

    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin("anonymous")

    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0x7da6c5,
      roughness: 0.82,
      metalness: 0.03,
    })
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 96),
      earthMaterial,
    )
    earthGroup.add(earth)

    loader.load(
      "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
        earthMaterial.map = texture
        earthMaterial.needsUpdate = true
      },
    )

    const cloudMaterial = new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.008, 96, 96),
      cloudMaterial,
    )
    earthGroup.add(clouds)

    loader.load(
      "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-clouds.png",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        cloudMaterial.map = texture
        cloudMaterial.alphaMap = texture
        cloudMaterial.needsUpdate = true
      },
    )

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 96, 96),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        vertexShader: `
          varying vec3 vertexNormal;
          void main() {
            vertexNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vertexNormal;
          void main() {
            float intensity = pow(0.72 - dot(vertexNormal, vec3(0.0, 0.0, 1.0)), 2.25);
            gl_FragColor = vec4(0.18, 0.55, 1.0, 1.0) * intensity;
          }
        `,
      }),
    )
    scene.add(atmosphere)

    scene.add(new THREE.HemisphereLight(0xb9dcff, 0x06102f, 2.15))
    const sunlight = new THREE.DirectionalLight(0xffffff, 4.25)
    sunlight.position.set(-3, 2.2, 4)
    scene.add(sunlight)
    const rimLight = new THREE.DirectionalLight(0x3c78ff, 2.3)
    rimLight.position.set(4, -1, -2)
    scene.add(rimLight)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.55
    controls.rotateSpeed = 0.45

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect()
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    resize()

    const timer = new THREE.Timer()
    timer.connect(document)
    let frame = 0
    const animate = (timestamp: number) => {
      frame = requestAnimationFrame(animate)
      timer.update(timestamp)
      const delta = timer.getDelta()
      clouds.rotation.y += delta * 0.018
      controls.update()
      renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frame)
      timer.dispose()
      resizeObserver.disconnect()
      controls.dispose()
      earth.geometry.dispose()
      earthMaterial.map?.dispose()
      earthMaterial.dispose()
      clouds.geometry.dispose()
      cloudMaterial.map?.dispose()
      cloudMaterial.dispose()
      atmosphere.geometry.dispose()
      atmosphere.material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div
      ref={globeRef}
      className="hero-earth"
      role="img"
      aria-label="Interactive rotating three-dimensional model of Earth"
    />
  )
}

function App() {
  const [slide, setSlide] = useState(0)
  const [openFaq, setOpenFaq] = useState(0)
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [accountCreated, setAccountCreated] = useState(false)

  function submitEmail(event: FormEvent) {
    event.preventDefault()
    if (email.trim()) setSubscribed(true)
  }

  function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAccountCreated(true)
  }

  function openSignup() {
    setAccountCreated(false)
    setShowSignup(true)
  }

  return (
    <main>
      <section className="hero" id="home">
        <nav className="nav wrap" aria-label="Main navigation">
          <Brand light />
          <div className="nav-links">
            <a href="#story">Stories</a>
            <a href="#observe">Observe</a>
            <a href="#about">About</a>
            <button className="nav-join" onClick={openSignup}>
              Join
            </button>
          </div>
        </nav>
        <div className="hero-glow" />
        <RotatingEarth />
        <div className="hero-copy wrap">
          <span className="eyebrow light">Our Earth. Our surface.</span>
          <h1>
            How much do we
            <br />
            know about our Surface?
          </h1>
          <a className="text-link" href="#story">
            Begin the story <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section className="burning" id="story">
        <div className="burning-overlay" />
        <div className="wrap burning-grid">
          <div>
            <h2>
              The burning of
              <br />
              our Surface
            </h2>
          </div>
          <div className="story-copy">
            <p className="lead">
              Something we thought would be temporary has become a visible
              pattern on our planet.
            </p>
            <p>
              Forests absorb carbon, support biodiversity, and regulate the
              water cycle. But warmer, drier conditions are transforming
              seasonal wildfires into longer and more severe events. From orbit,
              these changes leave an unmistakable mark.
            </p>
            <p>
              The surface is not static. It records every disturbance, every
              recovery, and every choice we make.
            </p>
          </div>
        </div>
      </section>

      <section className="diary section-pad">
        <div className="wrap">
          <div className="section-heading">
            <span className="eyebrow">A changing archive</span>
            <h2>The Wildfire Diary</h2>
          </div>
          <div className="diary-stage">
            <button
              className="round-control"
              onClick={() =>
                setSlide((slide + diary.length - 1) % diary.length)
              }
              aria-label="Previous wildfire story"
            >
              ←
            </button>
            <article className="diary-card featured">
              <img src={diary[slide].image} alt={diary[slide].place} />
              <div>
                <span>{diary[slide].date}</span>
                <h3>{diary[slide].place}</h3>
                <p>{diary[slide].note}</p>
              </div>
            </article>
            <article className="diary-card side-card">
              <img
                src={diary[(slide + 1) % diary.length].image}
                alt={diary[(slide + 1) % diary.length].place}
              />
              <div>
                <span>{diary[(slide + 1) % diary.length].date}</span>
                <h3>{diary[(slide + 1) % diary.length].place}</h3>
                <p>{diary[(slide + 1) % diary.length].note}</p>
              </div>
            </article>
            <button
              className="round-control"
              onClick={() => setSlide((slide + 1) % diary.length)}
              aria-label="Next wildfire story"
            >
              →
            </button>
          </div>
          <div className="pagination" aria-label="Current slide">
            {diary.map((item, index) => (
              <button
                key={item.place}
                className={slide === index ? "active" : ""}
                onClick={() => setSlide(index)}
                aria-label={`Show ${item.place}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="timeline section-pad">
        <div className="wrap data-grid">
          <div className="data-note">
            <span className="eyebrow light">Reading the economy</span>
            <h2>Overall Condition.</h2>
            <ul>
              <li>
                Financial Costs ($100B–$350B+
                Annually)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </li>
              <li>$106 billion in direct property Losses</li>
              <li>3% of tracked animals die directly</li>
              <li>200 to 500 direct deaths</li>
            </ul>
          </div>
          <div
            className="chart"
            aria-label="Illustration of fire activity over time"
          >
            <div className="chart-label">Observed fire activity</div>
            <div className="bars" aria-hidden="true">
              {[12, 40, 138, 112].map((height, index) => (
                <i
                  key={index}
                  style={{
                    height,
                    ...(index === 0 || index === 1 || index === 2 || index === 3
                      ? { position: "relative" }
                      : {}),
                  }}
                  title={
                    index === 0
                      ? "Animal deaths"
                      : index === 1
                        ? "Direct deaths"
                        : index === 2
                          ? "Financial loss"
                          : index === 3
                            ? "Property loss"
                            : undefined
                  }
                >
                  {index === 0 && (
                    <span className="bar-name">Animal deaths</span>
                  )}
                  {index === 1 && (
                    <span className="bar-name">Direct deaths</span>
                  )}
                  {index === 2 && (
                    <span className="bar-name">Financial loss</span>
                  )}
                  {index === 3 && (
                    <span className="bar-name">Property loss</span>
                  )}
                </i>
              ))}
            </div>
            <div className="chart-axis">
              <span>01</span>
              <span>05</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </div>
          </div>
        </div>
      </section>

      <section className="observation section-pad" id="observe">
        <div className="wrap">
          <div className="observation-head">
            <div>
              <span className="eyebrow coral">Live observation</span>
              <h2>Where the surface is changing now.</h2>
            </div>
            <p>Updated from NASA FRIMS</p>
          </div>
          <div className="map-card">
            <img src={images.earth} alt="Satellite view of Earth" />
            <div
              className="map-grid"
              role="img"
              aria-label="Flat satellite map showing active wildfire observation areas"
            >
              <span className="map-window-label">Global fire monitor</span>
              <span className="map-window-coordinates">60°N — 60°S</span>
            </div>
            {[
              ["22%", "31%"],
              ["27%", "56%"],
              ["48%", "37%"],
              ["67%", "48%"],
              ["78%", "32%"],
              ["84%", "61%"],
            ].map(([left, top], index) => (
              <span
                className="hotspot"
                key={index}
                style={{ left, top }}
                aria-hidden="true"
              />
            ))}
            <div className="map-legend">
              <span />
              Active heat anomaly
            </div>
          </div>
        </div>
      </section>
      <BurningCalendar />
      <section className="about section-pad" id="about">
        <div className="wrap about-grid">
          <article className="earth-card">
            <img
              src={images.forest}
              alt="Smoke drifting over a forest canopy"
            />
            <div className="earth-card-copy">
              <span>Our earth in</span>
              <strong>the past years</strong>
            </div>
          </article>
          <article className="about-copy">
            <span className="eyebrow light">About the project</span>
            <h2>Look closer.</h2>
            <p>
              The Surface was built to make planetary change feel visible,
              specific, and human. We turn open climate data into concise visual
              stories that anyone can understand.
            </p>
            <p>
              Observation is where action begins. When we can see a pattern, we
              can ask better questions about what comes next.
            </p>
            <a href="#faq">Read common questions →</a>
          </article>
        </div>
      </section>

      <section className="faq section-pad" id="faq">
        <div className="wrap faq-grid">
          <div className="faq-title">
            <span>F</span>
            <span>A</span>
            <span>Q</span>
          </div>
          <div className="faq-list">
            <span className="eyebrow">Questions from the field</span>
            {faqs.map((faq, index) => (
              <article className="faq-item" key={faq.question}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  aria-expanded={openFaq === index}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {faq.question}
                  <i>{openFaq === index ? "−" : "+"}</i>
                </button>
                {openFaq === index && <p>{faq.answer}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="join section-pad" id="join">
        <div className="wrap join-grid">
          <div className="join-copy">
            <span className="eyebrow coral">Stay curious</span>
            <h2>
              Plan your day
              <br />
              with Surfie.
            </h2>
            <p>
              A short monthly field note on the signals changing our planet.
            </p>
            <button className="account-cta" onClick={openSignup}>
              Create an account <span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="chat-card">
            <div className="chat-head">
              <span className="status-dot" />
              <strong>Surfie</strong>
              <span>online</span>
            </div>
            <p className="bubble surfie">
              Should I go for a walk this evening?
            </p>
            <p className="bubble reply">
              Air quality is good, with a cooler sunset around 7:42.
            </p>
            <form onSubmit={submitEmail}>
              <label htmlFor="email">Join the field notes</label>
              <div className="email-row">
                <input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  aria-label="Email address"
                />
                <button type="submit" aria-label="Subscribe">
                  →
                </button>
              </div>
              {subscribed && (
                <span className="success">You’re on the list. Welcome.</span>
              )}
            </form>
          </div>
        </div>
      </section>

      {showSignup && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowSignup(false)
          }}
        >
          <section
            className="signup-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-title"
          >
            <button
              className="modal-close"
              onClick={() => setShowSignup(false)}
              aria-label="Close account creation"
            >
              ×
            </button>
            {accountCreated ? (
              <div className="account-success">
                <span className="success-mark" aria-hidden="true">
                  ✓
                </span>
                <span className="eyebrow coral">Welcome aboard</span>
                <h2 id="signup-title">Your account is ready.</h2>
                <p>
                  You can now save field notes, follow observations, and receive
                  updates from The Surface.
                </p>
                <button onClick={() => setShowSignup(false)}>
                  Start exploring
                </button>
              </div>
            ) : (
              <>
                <span className="eyebrow coral">Join The Surface</span>
                <h2 id="signup-title">Create your account.</h2>
                <p className="signup-intro">
                  Save stories and build a personal view of our changing planet.
                </p>
                <form className="signup-form" onSubmit={createAccount}>
                  <label htmlFor="signup-name">Name</label>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    required
                  />
                  <label htmlFor="signup-email">Email address</label>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    required
                  />
                  <label htmlFor="signup-password">Password</label>
                  <input
                    id="signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                  <label className="terms">
                    <input type="checkbox" required />
                    <span>
                      I agree to the Terms of Use and acknowledge the Privacy
                      Policy.
                    </span>
                  </label>
                  <button className="signup-submit" type="submit">
                    Create account <span aria-hidden="true">→</span>
                  </button>
                </form>
                <p className="signup-note">
                  Already a member? <button type="button">Sign in</button>
                </p>
              </>
            )}
          </section>
        </div>
      )}

      <footer>
        <div className="wrap footer-grid">
          <div>
            <Brand light />
            <p>Stories from a changing planet.</p>
          </div>
          <div>
            <strong>Explore</strong>
            <a href="#story">Stories</a>
            <a href="#observe">Observations</a>
            <a href="#about">About</a>
          </div>
          <div>
            <strong>Find us</strong>
            <a href="#home">Instagram</a>
            <a href="#home">Field notes</a>
            <a href="#home">Contact</a>
          </div>
          <div className="footer-note">
            <span>Based on open Earth data</span>
            <span>© 2026 The Surface</span>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default App
