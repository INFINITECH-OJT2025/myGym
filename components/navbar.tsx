"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuItem,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import NextLink from "next/link";
import clsx from "clsx";
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { Menu, X } from "lucide-react"; // ✅ Import menu icons

export const Navbar = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false); // ✅ State for mobile menu

  // ✅ Hide Navbar on these routes
  const hiddenRoutes = [
    "/login",
    "/register",
    "/user",
    "/admin",
    "/user/subs",
    "/subs/payment",
    "/admin/subscription",
    "/admin/users",
    "/user/payment",
    "/admin/paid",
    "/admin/accounts",
    "/admin/trainers",
    "/admin/members",
    "/admin/method",
    "/admin/active",
    "/admin/facility",
    "/admin/expired",
    "/admin/classes",
    "/admin/booking",
    "/admin/schedule",
    "/admin/personal",
    "/admin/rewards",
    "/membership",
    "/membership/active",
    "/admin/reservation/classes",
    "/admin/reservation/facility",
    "/membership/classes",
    "/membership/trainer",
    "/membership/payment",
    "/membership/personal",
    "/membership/profile",
    
  ];
  if (hiddenRoutes.includes(pathname)) return null;

  return (
    <HeroUINavbar maxWidth="xl" position="sticky" className="px-4 md:px-6">
      {/* ✅ Left Side - Logo & Desktop Links */}
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand>
          <NextLink className="flex items-center gap-2" href="/">
            <Logo />
            <p className="font-bold text-inherit">Fitness & Gym</p>
          </NextLink>
        </NavbarBrand>

        {/* ✅ Desktop Navigation */}
        <ul className="hidden lg:flex gap-4 ml-4">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  "text-foreground hover:text-primary font-medium transition"
                )}
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      {/* ✅ Right Side - Desktop Actions */}
      <NavbarContent className="hidden sm:flex basis-1/5 sm:basis-full" justify="end">
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem className="hidden md:flex">
          <a href="/login">
            <Button color="primary" variant="shadow">
              Join Now
            </Button>
          </a>
        </NavbarItem>
      </NavbarContent>

      {/* ✅ Mobile Menu Toggle */}
      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <Button
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((prev) => !prev)}
          variant="ghost"
          className="p-2"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </NavbarContent>

      {/* ✅ Mobile Menu - Fixes the issue */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMenuOpen(false)} // ✅ Close when clicking outside
        >
          <NavbarMenu
            className="absolute top-[60px] left-0 w-full bg-white dark:bg-gray-900 shadow-md z-50 transition-all duration-300"
            onClick={(e) => e.stopPropagation()} // ✅ Prevent close when clicking inside menu
          >
            <div className="flex flex-col p-4 gap-3">
              {siteConfig.navItems.map((item) => (
                <NavbarMenuItem key={item.href}>
                  <NextLink
                    href={item.href}
                    className="text-lg font-medium block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => setMenuOpen(false)} // ✅ Close menu when clicking a link
                  >
                    {item.label}
                  </NextLink>
                </NavbarMenuItem>
              ))}

              {/* ✅ Join Now Button in Mobile Menu */}
              <div className="mt-4 flex justify-center">
                <a href="/login">
                  <Button color="primary" variant="shadow">
                    Join Now
                  </Button>
                </a>
              </div>
            </div>
          </NavbarMenu>
        </div>
      )}
    </HeroUINavbar>
  );
};
