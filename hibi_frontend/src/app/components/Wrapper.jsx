"use client"
import React, { useContext, useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { UsersContext } from '../context/UserContext'
import LoginApi from '@/Apis/LoginApi'
import { useToast } from '@/hooks/use-toast'
import ToggleComponent from './Toggle'
import { setToast } from '@/lib/ToastService'
import { defaultColorPalettes } from '../ColorPalettes'

const Wrapper = ({ children }) => {
  const { setUser, setRole, setPrevilege ,setmainrole, colorPalettesFromBackend, setColorPalettesFromBackend} = useContext(UsersContext);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathName = usePathname();

  const [curTheme, setcurTheme] = useState("dark");
  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const { toast } = useToast();
  setToast(toast);

  useEffect(() => {

    // fetching loggedin user information
    const fetchDetails = async () => {
      const empData = await LoginApi.GetEmployeeData();
      console.log(empData);
      if (empData?.success) {
        //setting colorpalattes from backend that is there for individual organization
        setColorPalettesFromBackend(empData?.data?.orgId?.colorPalette || defaultColorPalettes)
        setUser(empData?.data);
        setRole(empData?.data?.roleId?.name || (empData.data?.productManager && "PRODUCTMANAGER"));
        setmainrole(empData?.data?.roleId?.name);
        setPrevilege(empData?.data?.privilegeId?.name);

        if (empData?.data?.roleId?.name == "ORGANIZATIONHEAD" && pathName == "/") {
          router.push("/orgHead")
        } else if (empData?.data?.roleId?.name == "PRODUCTMANAGER" || empData.data?.productManager && pathName == "/") {
          router.push("/organizationManagement")
        } else if (pathName == "/") {
          router.push("/dashboard/home")
        }
      } else if (pathName !== "/forgotPassword" && pathName !== "/External" && pathName !== "/Test") {
        router.push('/login');
      }
      setLoading(false);
    };
    fetchDetails();
  }, []);

  const handleInactivity = () => {
    if (pathName != "/login" && pathName != "/forgotPassword") {
      toast({
        title: "User Inactive Action",
        description: "Detected Inactive Action, Please Login Again",
        variant: "destructive",
      });
      router.push("/logout");
    }
  };

  const handleWarning = () => {
    if (pathName != "/login" && pathName != "/forgotPassword") {
      toast({
        title: "User Inactive Action",
        description: "Please do any action or you will be logged out within 10 seconds.",
        variant: "destructive",
      });
    }
  };

  // useEffect(() => {
  //   const resetTimer = () => {
  //     clearTimeout(timerRef.current);
  //     clearTimeout(warningTimerRef.current);

  //     warningTimerRef.current = setTimeout(handleWarning, 5 * (60 - 10) * 1000);
  //     timerRef.current = setTimeout(handleInactivity, 5 * 60 * 1000);
  //   };

  //   resetTimer();

  //   window.addEventListener("mousemove", resetTimer);
  //   window.addEventListener("keydown", resetTimer);

  //   return () => {
  //     clearTimeout(timerRef.current);
  //     clearTimeout(warningTimerRef.current);
  //     window.removeEventListener("mousemove", resetTimer);
  //     window.removeEventListener("keydown", resetTimer);
  //   };
  // }, []);

  useEffect(() => {
    // setting theme from local storage 
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      setcurTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setcurTheme("light");
    }
  }, []);

  return (
    <div>
      <div className="fixed bottom-2 right-2 z-[9999]">
        {/* dark white mode switching component */}
        <ToggleComponent />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
          {/* Spinner Circle */}
          {/* <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div> */}

          {/* Animated Dots */}
          {/* <div className="flex space-x-2 mt-6">
            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce"></span>
            <span className="w-3 h-3 bg-green-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.6s]"></span>
          </div> */}

          <p className="mt-4 text-base font-medium text-zinc-700 dark:text-zinc-200">
            Loading...
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

export default Wrapper;