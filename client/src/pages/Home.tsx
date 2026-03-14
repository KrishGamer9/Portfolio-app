import { useEffect, useRef, useState, Component } from "react";
import type { ReactNode } from "react";
import { motion, useInView } from "framer-motion";
import { SiYoutube, SiInstagram } from "react-icons/si";
import { ExternalLink, Mail, Send, User, MessageSquare, ChevronDown, Server, Video, Gamepad2, Monitor } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Hyperspeed from "@/components/Hyperspeed";

/* ─── WebGL Error Boundary ─── */
class WebGLErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/* ─── Particles Canvas ─── */
function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: Array<{
      x: number; y: number; vx: number; vy: number; size: number; opacity: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,247,255,${p.opacity})`;
        ctx.fill();

        particles.slice(i + 1).forEach((q) => {
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,247,255,${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}

/* ─── Typing Animation ─── */
function TypingText({ phrases }: { phrases: string[] }) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    const delay = deleting ? 40 : 75;

    const timeout = setTimeout(() => {
      if (!deleting) {
        if (charIdx < current.length) {
          setDisplayed(current.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        } else {
          setTimeout(() => setDeleting(true), 1800);
        }
      } else {
        if (charIdx > 0) {
          setDisplayed(current.slice(0, charIdx - 1));
          setCharIdx((c) => c - 1);
        } else {
          setDeleting(false);
          setPhraseIdx((p) => (p + 1) % phrases.length);
        }
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases]);

  return (
    <span className="font-orbitron" style={{ color: "#ff00ea", textShadow: "0 0 15px #ff00ea" }}>
      {displayed}
      <span className="cursor-blink" style={{ color: "#ff00ea" }}>|</span>
    </span>
  );
}

/* ─── Animated Skill Bar ─── */
function SkillBar({ label, percent, icon: Icon }: { label: string; percent: number; icon: React.ElementType }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="rounded-xl p-5 border"
      style={{
        background: "rgba(13,13,32,0.85)",
        borderColor: "rgba(0,247,255,0.15)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 0 20px rgba(0,247,255,0.06)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <Icon size={20} style={{ color: "#00f7ff" }} />
        <span className="font-medium text-white">{label}</span>
        <span className="ml-auto font-orbitron text-sm" style={{ color: "#00f7ff" }}>
          {percent}%
        </span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div
          className="h-2 rounded-full progress-animate"
          style={{
            width: inView ? `${percent}%` : "0%",
            background: "linear-gradient(90deg, #00f7ff, #00b8c4)",
            boxShadow: "0 0 10px #00f7ff",
            transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Project Card ─── */
function ProjectCard({
  title,
  description,
  role,
  delay,
}: {
  title: string;
  description: string;
  role: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="group rounded-xl p-6 border relative overflow-hidden cursor-default"
      style={{
        background: "rgba(11,11,26,0.90)",
        borderColor: "rgba(255,0,234,0.12)",
        backdropFilter: "blur(8px)",
        transition: "transform 0.3s, box-shadow 0.3s",
      }}
      whileHover={{
        y: -10,
        boxShadow: "0 0 30px rgba(255,0,234,0.35), 0 0 60px rgba(255,0,234,0.10)",
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(255,0,234,0.07) 0%, transparent 70%)",
        }}
      />
      <div className="mb-1">
        <span
          className="text-xs font-orbitron px-2 py-0.5 rounded-full border"
          style={{
            color: "#ff00ea",
            borderColor: "rgba(255,0,234,0.3)",
            background: "rgba(255,0,234,0.08)",
          }}
        >
          {role}
        </span>
      </div>
      <h3
        className="text-lg font-orbitron font-semibold mt-2 mb-2"
        style={{ color: "#ff00ea", textShadow: "0 0 10px rgba(255,0,234,0.4)" }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "#9090b0" }}>
        {description}
      </p>
    </motion.div>
  );
}

/* ─── Section Heading ─── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-3xl md:text-4xl font-orbitron font-bold mb-10"
      style={{ color: "#00f7ff", textShadow: "0 0 12px #00f7ff, 0 0 24px rgba(0,247,255,0.3)" }}
    >
      {children}
      <span
        className="block mt-2 h-0.5 w-16 rounded-full"
        style={{ background: "linear-gradient(90deg, #00f7ff, transparent)" }}
      />
    </h2>
  );
}

/* ─── Nav ─── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["About", "Skills", "Projects", "Social", "Contact"];

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4"
    >
      <div
        className="flex items-center gap-1 rounded-full px-4 py-2 border transition-all duration-300"
        style={{
          background: scrolled ? "rgba(5,5,16,0.92)" : "rgba(5,5,16,0.5)",
          borderColor: scrolled ? "rgba(0,247,255,0.2)" : "rgba(0,247,255,0.08)",
          backdropFilter: "blur(16px)",
          boxShadow: scrolled ? "0 0 20px rgba(0,247,255,0.08)" : "none",
        }}
      >
        <span
          className="font-orbitron font-bold text-sm mr-4 hidden sm:block"
          style={{ color: "#00f7ff" }}
        >
          KP
        </span>
        {links.map((l) => (
          <a
            key={l}
            href={`#${l.toLowerCase()}`}
            className="px-3 py-1 text-sm rounded-full transition-all duration-200"
            style={{ color: "#9090b0" }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.color = "#00f7ff";
              (e.target as HTMLElement).style.background = "rgba(0,247,255,0.06)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.color = "#9090b0";
              (e.target as HTMLElement).style.background = "transparent";
            }}
          >
            {l}
          </a>
        ))}
      </div>
    </motion.nav>
  );
}

/* ─── Contact Form ─── */
function ContactSection() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/contact", data),
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Thanks for reaching out. I'll get back to you soon.",
      });
      setForm({ name: "", email: "", message: "" });
    },
    onError: () => {
      toast({
        title: "Failed to send",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(0,247,255,0.15)",
    background: "rgba(11,11,26,0.9)",
    color: "white",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "Poppins, sans-serif",
  };

  return (
    <section id="contact" className="px-6 md:px-16 py-24 relative z-10">
      <div className="max-w-3xl mx-auto">
        <SectionHeading>Contact</SectionHeading>

        <div className="flex items-center gap-3 mb-8">
          <Mail size={18} style={{ color: "#00f7ff" }} />
          <a
            href="mailto:svm.krishparmar@gmail.com"
            className="text-sm transition-colors hover:underline"
            style={{ color: "#00f7ff" }}
            data-testid="link-email"
          >
            svm.krishparmar@gmail.com
          </a>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#00f7ff66" }}
            />
            <input
              data-testid="input-name"
              placeholder="Your Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ ...inputStyle, paddingLeft: "40px" }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(0,247,255,0.4)";
                e.target.style.boxShadow = "0 0 12px rgba(0,247,255,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(0,247,255,0.15)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div className="relative">
            <Mail
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#00f7ff66" }}
            />
            <input
              data-testid="input-email"
              type="email"
              placeholder="Your Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={{ ...inputStyle, paddingLeft: "40px" }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(0,247,255,0.4)";
                e.target.style.boxShadow = "0 0 12px rgba(0,247,255,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(0,247,255,0.15)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div className="relative">
            <MessageSquare
              size={16}
              className="absolute left-4 top-4 pointer-events-none"
              style={{ color: "#00f7ff66" }}
            />
            <textarea
              data-testid="textarea-message"
              rows={5}
              placeholder="Your Message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              style={{ ...inputStyle, paddingLeft: "40px", resize: "vertical" }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(0,247,255,0.4)";
                e.target.style.boxShadow = "0 0 12px rgba(0,247,255,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(0,247,255,0.15)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            data-testid="button-send"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold font-orbitron text-sm transition-all duration-300"
            style={{
              background: mutation.isPending
                ? "rgba(255,0,234,0.4)"
                : "linear-gradient(135deg, #ff00ea, #c000b8)",
              color: "white",
              border: "none",
              cursor: mutation.isPending ? "not-allowed" : "pointer",
              boxShadow: "0 0 20px rgba(255,0,234,0.4)",
            }}
            onMouseEnter={(e) => {
              if (!mutation.isPending)
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 35px rgba(255,0,234,0.7)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 20px rgba(255,0,234,0.4)";
            }}
          >
            <Send size={16} />
            {mutation.isPending ? "Sending…" : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const skills = [
    { label: "Gaming", percent: 90, icon: Gamepad2 },
    { label: "Video Editing (Premiere Pro)", percent: 95, icon: Video },
    { label: "Content Creation", percent: 88, icon: Monitor },
    { label: "Server Management", percent: 80, icon: Server },
  ];

  const projects = [
    {
      title: "Vice WRLD Server",
      description:
        "Administrator role in a SA-MP RP server helping manage gameplay systems, moderation, and the community.",
      role: "Administrator",
    },
    {
      title: "Empire FR/RP",
      description:
        "Founder of a SA-MP roleplay server project focused on immersive gameplay experiences and community building.",
      role: "Founder",
    },
    {
      title: "TestSMP",
      description:
        "Founder of a Minecraft SMP server built for experimentation, creative builds, and multiplayer gameplay.",
      role: "Founder",
    },
  ];

  const socials = [
    {
      label: "YouTube",
      handle: "@pixelplays9700",
      url: "https://youtube.com/@pixelplays9700?si=C2RVk-KlrFEDopXY",
      icon: SiYoutube,
      color: "#ff0000",
    },
    {
      label: "Instagram",
      handle: "@crazy.Guy.1.5",
      url: "https://www.instagram.com/crazy.Guy.1.5/",
      icon: SiInstagram,
      color: "#e1306c",
    },
    {
      label: "Instagram",
      handle: "@crazy.Guy.1.6",
      url: "https://www.instagram.com/crazy.Guy.1.6/",
      icon: SiInstagram,
      color: "#e1306c",
    },
  ];

  return (
    <div
      className="min-h-screen overflow-x-hidden relative"
      style={{ background: "#050510", color: "white" }}
    >
      <ParticlesBackground />
      <Nav />

      {/* ── Hero ── */}
      <header
        id="hero"
        className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20 overflow-hidden"
      >
        {/* React Bits Hyperspeed background (with WebGL fallback) */}
        <div className="absolute inset-0 z-0" style={{ opacity: 0.85 }}>
          <WebGLErrorBoundary
            fallback={
              <div
                className="w-full h-full"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(0,247,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,247,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                }}
              />
            }
          >
            <Hyperspeed
              effectOptions={{
                distortion: "turbulentDistortion",
                length: 400,
                roadWidth: 10,
                islandWidth: 2,
                lanesPerRoad: 3,
                fov: 90,
                fovSpeedUp: 150,
                speedUp: 2,
                carLightsFade: 0.4,
                totalSideLightSticks: 20,
                lightPairsPerRoadWay: 40,
                shoulderLinesWidthPercentage: 0.05,
                brokenLinesWidthPercentage: 0.1,
                brokenLinesLengthPercentage: 0.5,
                lightStickWidth: [0.12, 0.5],
                lightStickHeight: [1.3, 1.7],
                movingAwaySpeed: [60, 80],
                movingCloserSpeed: [-120, -160],
                carLightsLength: [400 * 0.03, 400 * 0.2],
                carLightsRadius: [0.05, 0.14],
                carWidthPercentage: [0.3, 0.5],
                carShiftX: [-0.8, 0.8],
                carFloorSeparation: [0, 5],
                colors: {
                  roadColor: 0x080808,
                  islandColor: 0x0a0a0a,
                  background: 0x050510,
                  shoulderLines: 0x131318,
                  brokenLines: 0x131318,
                  leftCars: [0xff00ea, 0xd800c8, 0xc200b0],
                  rightCars: [0x00f7ff, 0x00c8d4, 0x0099aa],
                  sticks: 0x00f7ff,
                },
              }}
            />
          </WebGLErrorBoundary>
        </div>
        {/* Gradient overlay so content is readable */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(5,5,16,0.35) 0%, rgba(5,5,16,0.80) 100%)",
          }}
        />

        {/* Hero content — above gradient */}
        <div className="relative z-[2] flex flex-col items-center">

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
          className="float-anim relative mb-8"
        >
          <div
            className="w-44 h-44 rounded-full overflow-hidden relative"
            style={{
              border: "3px solid #00f7ff",
              boxShadow:
                "0 0 25px #00f7ff, 0 0 50px rgba(255,0,234,0.4), 0 0 80px rgba(0,247,255,0.2)",
            }}
          >
            <img
              src="/profile.jpg"
              alt="Krish Parmar"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement!;
                parent.innerHTML =
                  '<div class="w-full h-full flex items-center justify-center" style="background:linear-gradient(135deg,#0d1b2a,#1a0a2e);font-family:Orbitron,sans-serif;font-size:48px;font-weight:700;color:#00f7ff;text-shadow:0 0 20px #00f7ff">KP</div>';
              }}
              data-testid="img-profile"
            />
          </div>
          {/* Orbit ring */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: "1px solid rgba(255,0,234,0.3)",
              transform: "scale(1.15)",
              animation: "spin 8s linear infinite",
            }}
          />
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="text-5xl md:text-7xl font-orbitron font-black mb-3"
          style={{
            color: "#00f7ff",
            textShadow: "0 0 20px #00f7ff, 0 0 40px rgba(0,247,255,0.4)",
          }}
          data-testid="text-name"
        >
          Krish Parmar
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-lg md:text-xl mb-5"
          style={{ color: "#9090b0" }}
        >
          Student &nbsp;|&nbsp; Content Creator &nbsp;|&nbsp; Gamer
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-base md:text-lg min-h-[1.8rem]"
        >
          <TypingText
            phrases={[
              "Entrepreneur in the Making",
              "Professional Video Editor",
              "Passionate Gamer",
              "Content Creator",
            ]}
          />
        </motion.div>

        </div>{/* end z-[2] hero content wrapper */}

        <motion.a
          href="#about"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-10 z-[2] flex flex-col items-center gap-1 cursor-pointer"
          style={{ color: "#9090b0" }}
        >
          <span className="text-xs font-orbitron tracking-widest uppercase">Explore</span>
          <ChevronDown size={20} style={{ animation: "bounce 1.5s infinite" }} />
        </motion.a>
      </header>

      {/* ── About ── */}
      <section id="about" className="relative z-10 px-6 md:px-16 py-24">
        <div className="max-w-4xl mx-auto">
          <SectionHeading>About Me</SectionHeading>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl p-8 md:p-10 border relative overflow-hidden"
            style={{
              background: "rgba(13,13,32,0.80)",
              borderColor: "rgba(0,247,255,0.12)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at top right, rgba(0,247,255,0.06), transparent 70%)",
              }}
            />
            <p
              className="text-base md:text-lg leading-relaxed mb-5"
              style={{ color: "#c0c0d8" }}
              data-testid="text-about"
            >
              I am <span style={{ color: "#00f7ff", fontWeight: 600 }}>Krish Parmar</span>, a
              commerce student from{" "}
              <span style={{ color: "#00f7ff" }}>Jamnagar, India</span>. I am a passionate content
              creator and professional video editor using{" "}
              <span style={{ color: "#ff00ea" }}>Adobe Premiere Pro</span> since the age of
              <span style={{ color: "#ff00ea" }}> 10</span>. I have built Instagram pages with
              over <span style={{ color: "#00f7ff", fontWeight: 600 }}>1K+ followers</span> and
              enjoy exploring gaming, technology, and digital creativity.
            </p>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: "#c0c0d8" }}>
              I am highly interested in{" "}
              <span style={{ color: "#ff00ea", fontWeight: 600 }}>entrepreneurship</span> and aim
              to build an international business presence from India in the future. Along with
              studies, I enjoy gaming, sports, and technical exploration.
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
              {["Commerce Student", "Video Editor", "Gamer", "Content Creator", "Jamnagar, India"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full border"
                    style={{
                      borderColor: "rgba(0,247,255,0.25)",
                      color: "#00f7ff",
                      background: "rgba(0,247,255,0.06)",
                    }}
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section id="skills" className="relative z-10 px-6 md:px-16 py-24">
        <div className="max-w-4xl mx-auto">
          <SectionHeading>Skills</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {skills.map((s) => (
              <SkillBar key={s.label} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Projects ── */}
      <section id="projects" className="relative z-10 px-6 md:px-16 py-24">
        <div className="max-w-5xl mx-auto">
          <SectionHeading>Projects</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((p, i) => (
              <ProjectCard key={p.title} {...p} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Social ── */}
      <section id="social" className="relative z-10 px-6 md:px-16 py-24">
        <div className="max-w-4xl mx-auto">
          <SectionHeading>Social Links</SectionHeading>
          <div className="flex flex-wrap gap-5">
            {socials.map((s, i) => (
              <motion.a
                key={`${s.label}-${i}`}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`link-social-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.06, y: -4 }}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border"
                style={{
                  background: "rgba(13,13,32,0.85)",
                  borderColor: "rgba(0,247,255,0.12)",
                  color: "#e0e0f0",
                  textDecoration: "none",
                  backdropFilter: "blur(8px)",
                }}
              >
                <s.icon size={22} style={{ color: s.color }} />
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-orbitron" style={{ color: "#9090b0" }}>
                    {s.label}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "#00f7ff" }}>
                    {s.handle}
                  </span>
                </div>
                <ExternalLink size={14} style={{ color: "#9090b0", marginLeft: "4px" }} />
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <ContactSection />

      {/* ── Footer ── */}
      <footer
        className="relative z-10 text-center py-10 border-t"
        style={{ borderColor: "rgba(0,247,255,0.08)", color: "#555577" }}
      >
        <p className="font-orbitron text-sm">
          © 2026{" "}
          <span style={{ color: "#00f7ff" }}>Krish Parmar</span>{" "}
          &nbsp;|&nbsp; Cyber Portfolio
        </p>
        <p className="text-xs mt-1" style={{ color: "#33334d" }}>
          Built with React &amp; Three.js
        </p>
      </footer>

      <style>{`
        @keyframes spin { from { transform: scale(1.15) rotate(0deg); } to { transform: scale(1.15) rotate(360deg); } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
      `}</style>
    </div>
  );
}
