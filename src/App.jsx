import { useEffect, useState } from "react";

function App() {
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    const text = "Entrepreneur in the Making • Video Editor • Gamer";
    let i = 0;

    function typing() {
      if (i < text.length) {
        setTypedText((prev) => prev + text.charAt(i));
        i++;
        setTimeout(typing, 70);
      }
    }

    typing();

    if (window.particlesJS) {
      window.particlesJS("particles-js", {
        particles: {
          number: { value: 60 },
          size: { value: 3 },
          move: { speed: 1 },
          line_linked: { enable: true },
        },
      });
    }
  }, []);

  return (
    <div>
      <div id="particles-js"></div>

      <header>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <img
            src="profile.jpg"
            alt="Krish Parmar profile"
            style={{
              width: "180px",
              height: "180px",
              objectFit: "cover",
              borderRadius: "50%",
              border: "3px solid #00f7ff",
              boxShadow: "0 0 25px #00f7ff,0 0 50px #ff00ea",
            }}
          />

          <h1>Krish Parmar</h1>

          <p className="tagline">Student | Content Creator | Gamer</p>

          <p className="typing">{typedText}</p>
        </div>
      </header>

      <section>
        <h2 className="section-title">About Me</h2>

        <p className="about">
          I am Krish Parmar, a commerce student from Jamnagar, India. I am a
          passionate content creator and professional video editor using Adobe
          Premiere Pro since the age of 10. I have built Instagram pages with
          over 1K+ followers and enjoy exploring gaming, technology and digital
          creativity. I am highly interested in entrepreneurship and aim to
          build an international business presence from India in the future.
          Along with studies, I enjoy gaming, sports and technical exploration.
        </p>
      </section>

      <section>
        <h2 className="section-title">Skills</h2>

        <div className="skills">
          <div className="skill">
            Gaming
            <div className="progress">
              <span style={{ width: "90%" }}></span>
            </div>
          </div>

          <div className="skill">
            Video Editing (Premiere Pro)
            <div className="progress">
              <span style={{ width: "95%" }}></span>
            </div>
          </div>

          <div className="skill">
            Content Creation
            <div className="progress">
              <span style={{ width: "88%" }}></span>
            </div>
          </div>

          <div className="skill">
            Server Management
            <div className="progress">
              <span style={{ width: "80%" }}></span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title">Projects</h2>

        <div className="projects">
          <div className="card">
            <h3>Vice WRLD Server</h3>
            <p>
              Administrator role in a SA-MP RP server helping manage gameplay
              systems and community.
            </p>
          </div>

          <div className="card">
            <h3>Empire FR/RP</h3>
            <p>
              Founder of a SA-MP roleplay server project focused on immersive
              gameplay.
            </p>
          </div>

          <div className="card">
            <h3>TestSMP</h3>
            <p>
              Founder of a Minecraft SMP server built for experimentation and
              multiplayer gameplay.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title">Social Links</h2>

        <div className="social">
          <a
            href="https://youtube.com/@pixelplays9700?si=C2RVk-KlrFEDopXY"
            target="_blank"
          >
            YouTube
          </a>

          <a href="https://www.instagram.com/crazy.Guy.1.5/" target="_blank">
            Instagram 1
          </a>

          <a href="https://www.instagram.com/crazy.Guy.1.6/" target="_blank">
            Instagram 2
          </a>
        </div>
      </section>

      <section className="contact">
        <h2 className="section-title">Contact</h2>

        <p>Email: svm.krishparmar@gmail.com</p>

        <input placeholder="Your Name" />

        <input placeholder="Your Email" />

        <textarea rows="5" placeholder="Message"></textarea>

        <button>Send Message</button>
      </section>

      <footer>© 2026 Krish Parmar | Cyber Portfolio</footer>
    </div>
  );
}

export default App;
