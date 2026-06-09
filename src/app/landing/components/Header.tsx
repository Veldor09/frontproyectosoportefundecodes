"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

/* -----------  AUTH LOGIC (CLIENT-SIDE)  ----------- */
function useAuthStatus() {
  const [isAuth, setIsAuth] = useState(false);

  // leer token solo en cliente
  useEffect(() => {
    setIsAuth(!!localStorage.getItem("token"));
  }, []);

  // releer token cuando el usuario retrocede (botón "atrás")
  useEffect(() => {
    const onPageshow = () => setIsAuth(!!localStorage.getItem("token"));
    window.addEventListener("pageshow", onPageshow);
    return () => window.removeEventListener("pageshow", onPageshow);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);        // limpia memoria
    location.href = "/landing";   // ← directo a landing
  };

  return { isAuth, logout };
}

/* -----------  AUTH BUTTON / MENU  ----------- */
function AuthButton() {
  const { isAuth, logout } = useAuthStatus();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // cerrar menú al clicar fuera
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!isAuth)
    return (
      <Button asChild variant="secondary" className="bg-white/15 hover:bg-white/25 text-white">
        <Link href="/login">Iniciar sesión</Link>
      </Button>
    );

  return (
    <div ref={ref} className="relative">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen((v) => !v)}
        className="bg-white/15 hover:bg-white/25 text-white gap-2"
      >
        <User className="h-4 w-4" />
        <span>Cuenta</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/20 bg-white/90 backdrop-blur shadow-xl overflow-hidden">
          <Link
            href="/admin"
            className="block px-4 py-3 text-slate-800 hover:bg-white/60 transition"
            onClick={() => setOpen(false)}
          >
            Panel administrativo
          </Link>
          <button
  onClick={() => {
    setOpen(false);
    localStorage.removeItem("token");   // 1. limpia token
    location.href = "/landing";         // 2. redirige a landing
  }}
  className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition"
>
  Cerrar sesión
</button>
        </div>
      )}
    </div>
  );
}

/* -----------  HEADER PRINCIPAL  ----------- */
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen((v) => !v);

  const menuItems = [
    { name: "Home", href: "/landing" },
    { name: "Proyectos", href: "/landing/projects" },
    { name: "Voluntariado", href: "/PagInfo/Voluntariado" },
    { name: "Contáctenos", href: "/PagInfo/Contactenos" },
  ];

  return (
    <header className="bg-gradient-to-r from-teal-600 to-blue-600 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link
            href="/landing"
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink"
          >
            <div className="flex-shrink-0 bg-white rounded-full p-1.5 sm:p-2 shadow-md flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12">
              <Image
                src="/Img/FUNDECODES_Logo.png"
                alt="Logo Fundación"
                width={40}
                height={40}
                className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
              />
            </div>
            <div className="text-white min-w-0 hidden xs:block sm:block">
              <h1 className="text-base sm:text-xl font-bold font-modern tracking-wide leading-tight truncate">
                Fundecodes
              </h1>
              <p className="text-[11px] sm:text-sm text-blue-100 font-medium font-modern leading-tight truncate">
                Haciendo la diferencia
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-10">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white hover:text-blue-100 transition-colors duration-200 font-semibold text-lg tracking-wide font-modern"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Botón/auth adaptativo */}
            <AuthButton />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="lg:hidden text-white hover:bg-white/20"
              aria-label="Abrir menú"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-white/20">
            <nav className="flex flex-col space-y-3 mt-4">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-white hover:text-blue-100 transition-colors duration-200 font-semibold text-lg py-3 px-4 rounded-md hover:bg-white/10 font-modern tracking-wide"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}