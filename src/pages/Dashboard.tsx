import { Box, Button, Card, CardContent, CardMedia, Chip, Container, Paper, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";


import hero from "../assets/imagen1.jpg";
import card1 from "../assets/imagen2.jpg";
import card2 from "../assets/imagen3.jpg";
import card3 from "../assets/imagen4.jpg";
import card4 from "../assets/imagen5.jpg";
import gallery1 from "../assets/imagen6.jpg";
import gallery2 from "../assets/imagen7.jpg";
import gallery3 from "../assets/imagen8.jpg";

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);
const MotionCard = motion(Card);

const fadeUp = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 } };

export default function Dashboard() {
  return (
    <Box>
    
      <Box
        sx={{
          position: "relative",
          backgroundImage: `url(${hero})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: { xs: 300, md: 440 },
          display: "flex",
          alignItems: "center",
          color: "white",
        }}
      >
        <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,.35)" }} />
        <Container sx={{ position: "relative", zIndex: 1 }}>
          <MotionBox {...fadeUp} transition={{ duration: 0.6 }}>
            <Chip
              label="Residencia para Adultos Mayores"
              color="primary"
              sx={{ bgcolor: "rgba(249,115,22,.9)", color: "#fff", mb: 2 }}
            />
            <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.15 }}>
              Cuidado digno y atención cercana
            </Typography>
            <Typography sx={{ mt: 1.5, maxWidth: 720 }}>
              En Las Margaritas ofrecemos un ambiente cálido, seguro y profesional para nuestros residentes y sus familias.
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              <Button size="large" variant="contained" color="primary">
                Solicitar información
              </Button>
              <Button size="large" variant="outlined" color="inherit" sx={{ borderColor: "rgba(255,255,255,.6)", color: "white" }}>
                Conócenos
              </Button>
            </Stack>
          </MotionBox>
        </Container>
      </Box>


      <Container sx={{ py: { xs: 4, md: 6 } }}>
        <MotionPaper
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.05 }}
          elevation={0}
          sx={{
            px: { xs: 2, md: 4 },
            py: 3,
            borderRadius: 3,
            border: "1px solid #eee",
            background: "#fff",
          }}
        >
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Nuestra misión
          </Typography>
          <Typography color="text.secondary">
            Brindar atención integral y personalizada con un equipo profesional, instalaciones cómodas y actividades que promueven
            la independencia y el bienestar.
          </Typography>
        </MotionPaper>
      </Container>

      <Container sx={{ pb: { xs: 4, md: 6 } }}>
        <Typography variant="h4" fontWeight={800} sx={{ mb: 3 }}>
          Servicios
        </Typography>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
          }}
        >
          {[
            { img: card1, title: "Estancia y cuidado 24/7", desc: "Supervisión profesional y acompañamiento continuo." },
            { img: card2, title: "Atención médica y enfermería", desc: "Monitoreo, toma de signos, control de medicación." },
            { img: card3, title: "Alimentación balanceada", desc: "Planes alimenticios diseñados para cada residente." },
            { img: card4, title: "Actividades y terapia ocupacional", desc: "Estimulación cognitiva y física diaria." },
          ].map((k, i) => (
            <MotionCard
              key={k.title}
              {...fadeUp}
              transition={{ duration: 0.45, delay: 0.05 * i }}
              whileHover={{ y: -6, boxShadow: "0 16px 40px rgba(0,0,0,.12)" }}
              sx={{ borderRadius: 3, overflow: "hidden", height: "100%" }}
              elevation={0}
            >
              <CardMedia component="img" image={k.img} alt={k.title} sx={{ height: 160, objectFit: "cover" }} />
              <CardContent sx={{ display: "grid", gap: 0.5 }}>
                <Typography fontWeight={700}>{k.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {k.desc}
                </Typography>
              </CardContent>
            </MotionCard>
          ))}
        </Box>
      </Container>

    
      <Box sx={{ bgcolor: "#fff", py: { xs: 4, md: 6 }, borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
        <Container>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 2.5 }}>
            Nuestras instalaciones
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
            }}
          >
            {[gallery1, gallery2, gallery3].map((src, i) => (
              <MotionPaper
                key={src}
                {...fadeUp}
                transition={{ duration: 0.45, delay: 0.05 * i }}
                whileHover={{ scale: 1.015 }}
                elevation={0}
                sx={{ overflow: "hidden", borderRadius: 3, border: "1px solid #eee" }}
              >
                <Box component="img" src={src} alt={`Instalación ${i + 1}`} sx={{ width: "100%", height: 260, objectFit: "cover" }} />
              </MotionPaper>
            ))}
          </Box>
        </Container>
      </Box>

  
      <Container sx={{ py: { xs: 4, md: 6 } }}>
        <MotionPaper
          {...fadeUp}
          transition={{ duration: 0.5 }}
          elevation={0}
          sx={{
            px: { xs: 2, md: 4 },
            py: 3,
            borderRadius: 3,
            border: "1px solid #eee",
            background:
              "linear-gradient(135deg, rgba(249,115,22,.1) 0%, rgba(249,115,22,.05) 60%, rgba(249,115,22,.02) 100%)",
          }}
        >
          
        </MotionPaper>
      </Container>
    </Box>
  );
}
