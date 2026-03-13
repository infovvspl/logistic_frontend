import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { APP_NAME } from "../utils/constants.js";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-white text-zinc-100">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.18),transparent_40%)]" />

      <div className="relative min-h-screen grid place-items-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-7xl rounded-2xl"
        >
          <div className="mb-8 text-center">
            <h1
              className="text-3xl md:text-4xl font-bold tracking-tight 
                bg-gradient-to-r from-stone-700 via-amber-700 to-[#C8B97A]
                bg-clip-text text-transparent"
            >
              RS Transports
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Logistics & Transport Management
            </p>
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
