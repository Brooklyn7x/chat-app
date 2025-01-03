import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  User,
} from "lucide-react";
import { useState } from "react";
import { MenuItem } from "../interface/MenuItem";

import useAuth from "@/hooks/useAuth";

interface SidebarHeaderProps {
  onSearchClick: () => void;
  onSearchActive?: boolean;
  onSearchQuery: string;
  onSetSearchQuery: (query: string) => void;
  onBackClick?: () => void;
}

export function SidebarHeader({
  onSearchActive,
  onSearchClick,
  onSearchQuery,
  onSetSearchQuery,
  onBackClick,
}: SidebarHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
  };
  return (
    <div className="h-16 px-4 border-b flex items-center gap-4">
      <button
        onClick={onSearchActive ? onBackClick : () => setShowMenu(!showMenu)}
        className={`p-2 text-muted-foreground rounded-full transition-all duration-300 ease-in-out 
          ${onSearchActive || showMenu ? "bg-muted" : "hover:bg-muted/50"}
          transform ${onSearchActive || showMenu ? "rotate-180" : "rotate-0"}`}
      >
        {onSearchActive ? (
          <ArrowRight className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      <div onClick={onSearchClick} className="relative w-full">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        <input
          value={onSearchQuery}
          onChange={(e) => onSetSearchQuery(e.target.value)}
          className="w-full h-10 pl-12 pr-4 bg-muted/50 rounded-full border text-md outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search"
        />
      </div>

      <div
        className={cn(
          "absolute top-14 left-2 w-56 rounded-md z-20 shadow-md bg-background/70 border backdrop-blur-sm",
          " transform transition-all duration-200 ease-in-out origin-top-left",
          showMenu
            ? "scale-100 translate-y-0 opacity-100 pointer-events-auto"
            : "scale-75 -translate-y-2 opacity-0 pointer-events-none"
        )}
      >
        <div className="p-1 space-y-1">
          <MenuItem
            icon={<Bookmark />}
            onClick={() => {}}
            label="Saved Messages"
          />
          <MenuItem icon={<User />} onClick={() => {}} label="Contact" />
          <MenuItem icon={<Settings />} onClick={() => {}} label="Settings" />
          <MenuItem icon={<Moon />} onClick={() => {}} label="Dark Mode" />
          <MenuItem icon={<LogOut />} onClick={handleLogout} label="Logout" />
        </div>
      </div>
    </div>
  );
}
