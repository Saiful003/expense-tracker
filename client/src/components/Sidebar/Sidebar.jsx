import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useAuth } from "@/provider/authProvider";
import { useUser } from "@/hooks/useUser";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { useState } from "react";

const Sidebar = () => {
  const { logout } = useAuth();
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const [isOpenSidebar, setIsOpenSidebar] = useState(false);

  return (
    <>
      <div className="flex flex-shrink-0 flex-col items-center justify-between gap-20  px-5 py-8 h-screen sticky top-0 bg-zinc-800">
        {/* User */}
        <div className="flex flex-col gap-3 items-center">
          {isLoading ? (
            <Skeleton className="w-[100px] aspect-square" />
          ) : (
            <img
              src={user?.image_url}
              className="max-w-[100px] object-cover aspect-square  rounded-xl"
              alt="user-image"
            />
          )}
          <p className="text-white">Hello, {user?.name.split(" ")[0]}</p>
        </div>

        {/* Navigation Pages */}
        <div className="flex flex-col gap-5 text-gray-400">
          <Link to="/">Dashboard</Link>
          <Link to="/transaction">Transaction</Link>
          <Link to="/settings">Settings</Link>
        </div>

        {/* Log in-out Button */}
        <Button
          onClick={() => logout(() => navigate("/login"))}
          className="py-1 px-4 bg-slate-200 rounded-full text-black hover:text-white"
        >
          Logout
        </Button>
      </div>
    </>
  );
};

export default Sidebar;
