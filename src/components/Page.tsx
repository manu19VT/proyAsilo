import { PropsWithChildren } from "react";
import { motion } from "framer-motion";
import { Box, Paper } from "@mui/material";

const variants = { initial:{opacity:0,y:10}, in:{opacity:1,y:0}, out:{opacity:0,y:-10} };

export default function Page({ children }: PropsWithChildren) {
  return (
    <Box
      component={motion.div}
      variants={variants}
      initial="initial"
      animate="in"
      exit="out"
      transition={{ duration: 0.35, ease: "easeOut" }}
      sx={{ py: 3 }}
    >
      <Paper sx={{ p: 3, background: "#fff", borderRadius: 2, border: "1px solid #eee" }}>
        {children}
      </Paper>
    </Box>
  );
}
